/**
 * اختبار الإرسال إلى Google Sheets باستخدام fetch وهمي فقط.
 * لا يُجرى أي اتصال حقيقي: fetch العام معطَّل، والانتظار بين المحاولات وهمي.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { EXAM_ID, EXAM_TITLE, SHEETS_TOKEN, SHEETS_URL } from '../src/config'
import { QUESTIONS, TOTAL_POINTS } from '../src/data/index'
import { LESSONS } from '../src/data/lessons'
import { buildResults, createAttempt, type Attempt } from '../src/lib/attempt'
import { buildReportText } from '../src/lib/report'
import {
  ATTEMPT_TIMEOUT_MS,
  MAX_ATTEMPTS,
  PENDING_PREFIX,
  RETRY_DELAYS_MS,
  buildPayload,
  gradeAll,
  newAttemptId,
  pendingCount,
  pendingKey,
  retryPending,
  sendWithRetry,
  type FetchLike,
  type SendOptions,
  type StorageLike,
  type SubmissionPayload,
} from '../src/lib/submit'
import { perfectAnswers } from '../src/testing/answers'
import type { Answers } from '../src/lib/types'

class MemStorage implements StorageLike {
  private map = new Map<string, string>()
  get length() {
    return this.map.size
  }
  key(i: number): string | null {
    return [...this.map.keys()][i] ?? null
  }
  getItem(k: string) {
    return this.map.get(k) ?? null
  }
  setItem(k: string, v: string) {
    this.map.set(k, v)
  }
  removeItem(k: string) {
    this.map.delete(k)
  }
  keys() {
    return [...this.map.keys()].sort()
  }
}

function fullAnswers(): Answers {
  const answers: Answers = {}
  for (const q of QUESTIONS) Object.assign(answers, perfectAnswers(q))
  return answers
}

function makeAttempt(answers: Answers = fullAnswers()): Attempt {
  const attempt = createAttempt('سارة أحمد', Date.UTC(2026, 10, 21, 7, 0, 5, 250))
  return { ...attempt, submittedAt: Date.UTC(2026, 10, 21, 7, 47, 38, 900), confirmed: true, answers }
}

function payloadOf(attempt: Attempt, attemptId: string): SubmissionPayload {
  const summary = buildResults(QUESTIONS, attempt)
  const reportText = buildReportText(summary)
  return buildPayload({
    attemptId,
    studentName: attempt.studentName,
    startedAt: attempt.startedAt,
    submittedAt: attempt.submittedAt!,
    elapsedMs: attempt.submittedAt! - attempt.startedAt,
    order: QUESTIONS,
    answers: attempt.answers,
    reportText,
  })
}

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('Payload contract (same field names and structure as grade5-math-unit1)', () => {
  const payload = payloadOf(makeAttempt(), '3f0c2a52-7d1e-4c58-9a6b-1f2e3d4c5b6a')
  const wire = JSON.parse(JSON.stringify(payload)) as SubmissionPayload

  it('has the 12 top-level fields in the same order', () => {
    expect(Object.keys(wire)).toEqual([
      'token',
      'attemptId',
      'examId',
      'examTitle',
      'studentName',
      'startAt',
      'submitAt',
      'elapsedSec',
      'summary',
      'lessons',
      'details',
      'reportText',
    ])
  })

  it('has the 11 summary fields', () => {
    expect(Object.keys(wire.summary)).toEqual([
      'total',
      'max',
      'percentage',
      'gradeLabel',
      'fullQuestions',
      'partialQuestions',
      'wrongQuestions',
      'correctSubparts',
      'partialSubparts',
      'wrongSubparts',
      'unansweredSubparts',
    ])
  })

  it('has 3 fields per lesson and 9 fields per detail, one detail per part', () => {
    expect(wire.lessons).toHaveLength(8)
    for (const l of wire.lessons) expect(Object.keys(l)).toEqual(['title', 'awarded', 'max'])
    const parts = QUESTIONS.reduce((s, q) => s + q.parts.length, 0)
    expect(wire.details).toHaveLength(parts)
    for (const d of wire.details) {
      expect(Object.keys(d)).toEqual([
        'q',
        'qTitle',
        'lessons',
        'label',
        'status',
        'awarded',
        'marks',
        'studentAnswer',
        'correctAnswer',
      ])
    }
  })

  it('carries this exam identity and the unchanged Sheets endpoint and token', () => {
    expect(wire.examId).toBe(EXAM_ID)
    expect(wire.examTitle).toBe(EXAM_TITLE)
    expect(wire.token).toBe(SHEETS_TOKEN)
    expect(wire.startAt).toBe('2026-11-21T07:00:05.250Z')
    expect(wire.submitAt).toBe('2026-11-21T07:47:38.900Z')
    expect(wire.elapsedSec).toBe(2853)
  })

  it('scores a perfect attempt 100/100 and 50/50 subparts', () => {
    expect(wire.summary.total).toBe(TOTAL_POINTS)
    expect(wire.summary.max).toBe(100)
    expect(wire.summary.percentage).toBe(100)
    expect(wire.summary.gradeLabel).toBe('ممتاز')
    expect(wire.summary.fullQuestions).toBe(30)
    expect(wire.summary.correctSubparts).toBe(50)
    expect(wire.summary.partialSubparts).toBe(0)
    expect(wire.summary.wrongSubparts).toBe(0)
    expect(wire.summary.unansweredSubparts).toBe(0)
  })

  it('lesson totals sum to 100 and cover the eight lessons', () => {
    expect(wire.lessons.map((l) => l.title)).toEqual(LESSONS.map((l) => l.title))
    expect(wire.lessons.reduce((s, l) => s + l.max, 0)).toBe(100)
    expect(wire.lessons.reduce((s, l) => s + l.awarded, 0)).toBe(100)
  })

  it('keeps the report text in the payload and it mentions the model answers', () => {
    expect(wire.reportText.length).toBeGreaterThan(4000)
    expect(wire.reportText).toContain('الإجابة النموذجية')
    expect(wire.reportText).toContain(EXAM_ID)
  })
})

describe('Grading cases: correct, partial, wrong and empty', () => {
  it('a perfect attempt earns 100 and every question is correct', () => {
    const grades = gradeAll(QUESTIONS, fullAnswers())
    expect(grades.every((g) => g.status === 'correct')).toBe(true)
    expect(grades.reduce((s, g) => s + g.earned, 0)).toBe(100)
  })

  it('an empty attempt earns zero and marks everything unanswered', () => {
    const p = payloadOf(makeAttempt({}), 'empty')
    expect(p.summary.total).toBe(0)
    expect(p.summary.unansweredSubparts).toBe(50)
    expect(p.summary.wrongQuestions).toBe(30)
  })

  it('partial credit: one wrong true/false keeps the fix marks (C5 = 3/4)', () => {
    const answers = fullAnswers()
    answers['C5-truth'] = { t: 'choice', id: 'true' }
    const grades = gradeAll(QUESTIONS, answers)
    const c5 = grades[QUESTIONS.findIndex((q) => q.id === 'C5')]
    expect(c5.earned).toBe(3)
    expect(c5.max).toBe(4)
    expect(c5.status).toBe('partial')
  })

  it('partial credit on matching, ordering and unordered slots', () => {
    const answers = fullAnswers()
    answers['A1-match'] = { t: 'match', pairs: { A: 'r1', B: 'r2', C: 'r4' } }
    answers['D3-order'] = { t: 'order', ids: ['b', 'a', 'c'] }
    answers['F2-sides'] = { t: 'slots', fill: { s1: 'C', s2: 'A' } } // unordered: both sides right
    const grades = gradeAll(QUESTIONS, answers)
    const byId = Object.fromEntries(QUESTIONS.map((q, i) => [q.id, grades[i]]))
    expect(byId.A1.earned).toBe(2) // 2 of 3 pairs
    expect(byId.D3.earned).toBe(1) // b in place, a/c swapped → 1 of 3 positions
    expect(byId.F2.earned).toBe(3) // vertex + two sides (order of the two sides is free)
    expect(byId.F2.status).toBe('correct')
    // A wrong side chosen instead of the correct pair costs only that side's marks (partial credit).
    answers['F2-sides'] = { t: 'slots', fill: { s1: 'A', s2: 'D' } }
    const partial = Object.fromEntries(
      QUESTIONS.map((q, i) => [q.id, gradeAll(QUESTIONS, answers)[i]]),
    )
    expect(partial.F2.parts[0].earned).toBe(1)
    expect(partial.F2.parts[1].earned).toBe(0)
    expect(partial.F2.status).toBe('partial')
  })

  it('wrong answers earn nothing', () => {
    const answers = fullAnswers()
    answers['E1-sum'] = { t: 'math', doc: { boxes: { r: [{ k: 's', v: '36370' }] }, counter: 0 } }
    answers['C2-choice'] = { t: 'choice', id: 'a' }
    const p = payloadOf(makeAttempt(answers), 'wrong')
    // E1 (3 marks) and C2 (3 marks) are fully wrong → 100 − 6 = 94
    expect(p.summary.total).toBe(94)
    expect(p.summary.wrongQuestions).toBe(2)
    expect(p.details.find((d) => d.correctAnswer.includes('61,130'))?.status).toBe('إجابة خاطئة')
  })

  it('accepts mathematically equivalent answers (worked expression instead of the result)', () => {
    const answers = fullAnswers()
    answers['E1-sum'] = { t: 'math', doc: textDoc('48750+12380') }
    answers['E2-diff'] = { t: 'math', doc: textDoc('5004600-1378950') }
    answers['E4-diff'] = { t: 'math', doc: textDoc('3120-2845') }
    answers['C3-place'] = { t: 'math', doc: textDoc('5*100000') }
    const grades = gradeAll(QUESTIONS, answers)
    for (const id of ['E1', 'E2', 'E4', 'C3']) {
      const g = grades[QUESTIONS.findIndex((q) => q.id === id)]
      expect(g.status, `${id} should be correct`).toBe('correct')
    }
  })

  it('rejects non-equivalent values and tolerates the declared margins only', () => {
    const answers = fullAnswers()
    answers['D1-line'] = { t: 'num', v: 648 } // 643 ± 4
    answers['F4-right'] = { t: 'angle', deg: 95 } // 90 ± 4
    const grades = gradeAll(QUESTIONS, answers)
    const byId = Object.fromEntries(QUESTIONS.map((q, i) => [q.id, grades[i]]))
    expect(byId.D1.parts[1].earned).toBe(0)
    expect(byId.F4.parts[0].earned).toBe(0)
  })
})

function textDoc(text: string): { boxes: Record<string, { k: 's'; v: string }[]>; counter: number } {
  return { boxes: { r: [...text].map((v) => ({ k: 's' as const, v })) }, counter: 0 }
}

describe('Mock fetch sender — no real network', () => {
  const ATTEMPT = '3f0c2a52-7d1e-4c58-9a6b-1f2e3d4c5b6a'
  const payload = payloadOf(makeAttempt(), ATTEMPT)

  function fakeFetch(reply: (call: number) => string | Promise<string>) {
    const calls: { url: string; init: RequestInit }[] = []
    const fn: FetchLike = (url, init) => {
      const call = calls.length
      calls.push({ url, init })
      return Promise.resolve({ text: async () => reply(call) })
    }
    return { fn, calls }
  }

  const env = (fn: FetchLike, storage: StorageLike | null = new MemStorage()): { opts: SendOptions; storage: StorageLike | null } => ({
    opts: { fetchImpl: fn, storage, sleep: () => Promise.resolve(), timeoutMs: 50 },
    storage,
  })

  const OK = JSON.stringify({ ok: true })

  it('POSTs once with text/plain and the JSON body, then reports success', async () => {
    const f = fakeFetch(() => OK)
    const e = env(f.fn)
    const ok = await sendWithRetry(payload, e.opts)
    expect(ok).toBe(true)
    expect(f.calls).toHaveLength(1)
    expect(f.calls[0].url).toBe(SHEETS_URL)
    expect(f.calls[0].init.method).toBe('POST')
    expect((f.calls[0].init.headers as Record<string, string>)['Content-Type']).toBe(
      'text/plain;charset=utf-8',
    )
    const body = JSON.parse(String(f.calls[0].init.body)) as SubmissionPayload
    expect(body.attemptId).toBe(ATTEMPT)
    expect(body.examId).toBe(EXAM_ID)
    expect(e.storage!.keys()).toEqual([])
  })

  it('retries three times with 2s then 5s delays and keeps the same payload and attemptId', async () => {
    const delays: number[] = []
    const f = fakeFetch(() => 'not json')
    const e = env(f.fn)
    const ok = await sendWithRetry(payload, {
      ...e.opts,
      sleep: (ms) => {
        delays.push(ms)
        return Promise.resolve()
      },
    })
    expect(ok).toBe(false)
    expect(f.calls).toHaveLength(MAX_ATTEMPTS)
    expect(MAX_ATTEMPTS).toBe(3)
    expect(delays).toEqual([...RETRY_DELAYS_MS])
    expect(delays).toEqual([2000, 5000])
    const bodies = f.calls.map((c) => String(c.init.body))
    expect(new Set(bodies).size).toBe(1)
    expect((JSON.parse(bodies[0]) as SubmissionPayload).attemptId).toBe(ATTEMPT)
    expect(e.storage!.keys()).toEqual([pendingKey(ATTEMPT)])
    expect(pendingKey(ATTEMPT)).toBe(`${PENDING_PREFIX}${ATTEMPT}`)
  })

  it('accepts duplicate:true as a successful resend of the same attempt', async () => {
    const f = fakeFetch(() => JSON.stringify({ duplicate: true }))
    const ok = await sendWithRetry(payload, env(f.fn).opts)
    expect(ok).toBe(true)
    expect(f.calls).toHaveLength(1)
  })

  it('times out after 30 seconds per attempt by default', async () => {
    expect(ATTEMPT_TIMEOUT_MS).toBe(30000)
    const aborted: boolean[] = []
    vi.stubGlobal('AbortController', class {
      signal = { aborted: false }
      abort() {
        this.signal.aborted = true
        aborted.push(true)
      }
    })
    const never: FetchLike = () => new Promise(() => {})
    const e = env(never)
    const ok = await sendWithRetry(payload, { ...e.opts, timeoutMs: 15 })
    expect(ok).toBe(false)
    expect(aborted).toHaveLength(3)
    vi.unstubAllGlobals()
  })

  it('resends pending payloads on load and clears them on success', async () => {
    const storage = new MemStorage()
    const failing = fakeFetch(() => 'boom')
    await sendWithRetry(payloadOf(makeAttempt(), 'old-attempt'), env(failing.fn, storage).opts)
    expect(pendingCount(storage)).toBe(1)
    const good = fakeFetch(() => OK)
    const sent = await retryPending(env(good.fn, storage).opts)
    expect(sent).toBe(1)
    expect(pendingCount(storage)).toBe(0)
  })

  it('never touches the real fetch', () => {
    const spy = vi.fn(() => Promise.reject(new Error('real fetch disabled')))
    vi.stubGlobal('fetch', spy)
    expect(spy).not.toHaveBeenCalled()
    vi.unstubAllGlobals()
  })

  it('generates a unique attemptId each time and keeps it stable when resending', () => {
    const a = newAttemptId()
    const b = newAttemptId()
    expect(a).not.toBe(b)
    expect(payloadOf(makeAttempt(), a).attemptId).toBe(a)
    expect(payloadOf(makeAttempt(), a).attemptId).toBe(a)
  })
})
