import { describe, expect, it } from 'vitest'
import { buildResults, elapsedMs, encouragement, formatDateTime, formatHMS, type Attempt } from './attempt'
import { buildReportText, plainText, reportFileName } from './report'
import { QUESTIONS } from '../data/index'
import { perfectAnswers } from '../testing/answers'
import type { Answers } from './types'

const baseAttempt = (answers: Answers, over: Partial<Attempt> = {}): Attempt => ({
  version: 1,
  id: 'test',
  studentName: 'لين أحمد',
  startedAt: Date.UTC(2026, 2, 5, 9, 0, 0),
  submittedAt: Date.UTC(2026, 2, 5, 9, 42, 15),
  confirmed: true,
  answers,
  current: 0,
  ...over,
})

describe('timer uses real timestamps', () => {
  it('formats HH:MM:SS, with hours beyond 23 when needed', () => {
    expect(formatHMS(0)).toBe('00:00:00')
    expect(formatHMS(3723000)).toBe('01:02:03')
    expect(formatHMS(36 * 3600 * 1000 + 59 * 1000)).toBe('36:00:59')
  })

  it('keeps counting from startedAt while running, and freezes at submission', () => {
    const a = baseAttempt({}, { submittedAt: null })
    const now = a.startedAt + 90_000
    expect(elapsedMs(a, now)).toBe(90_000)
    expect(elapsedMs(a, now + 5000)).toBe(95_000)
    const done = baseAttempt({}, { submittedAt: a.startedAt + 120_000 })
    expect(elapsedMs(done, a.startedAt + 999_999)).toBe(120_000)
  })

  it('never reports a negative duration', () => {
    const a = baseAttempt({}, { submittedAt: null, startedAt: 2000 })
    expect(elapsedMs(a, 1000)).toBe(0)
  })
})

describe('results aggregation', () => {
  it('a perfect attempt scores exactly 100 with every question correct', () => {
    const answers: Answers = {}
    for (const q of QUESTIONS) Object.assign(answers, perfectAnswers(q))
    const r = buildResults(QUESTIONS, baseAttempt(answers))
    expect(r.score).toBe(100)
    expect(r.max).toBe(100)
    expect(r.correct).toBe(30)
    expect(r.partial).toBe(0)
    expect(r.wrong).toBe(0)
    expect(r.elapsedMs).toBe(42 * 60_000 + 15_000)
  })

  it('an empty attempt scores zero and marks everything wrong', () => {
    const r = buildResults(QUESTIONS, baseAttempt({}))
    expect(r.score).toBe(0)
    expect(r.wrong).toBe(30)
  })

  it('partial credit is counted as partial, not as correct', () => {
    const answers: Answers = {}
    for (const q of QUESTIONS) Object.assign(answers, perfectAnswers(q))
    // C5: the true/false choice is wrong, the fix stays correct → 3 of 4 marks.
    const c5 = QUESTIONS.find((q) => q.id === 'C5')!
    answers[c5.parts[0].id] = { t: 'choice', id: 'true' }
    const r = buildResults(QUESTIONS, baseAttempt(answers))
    expect(r.score).toBe(99)
    expect(r.partial).toBe(1)
    expect(r.correct).toBe(29)
  })
})

describe('TXT report', () => {
  const answers: Answers = {}
  for (const q of QUESTIONS) Object.assign(answers, perfectAnswers(q))
  const summary = buildResults(QUESTIONS, baseAttempt(answers))
  const text = buildReportText(summary)

  it('contains the student name, date-time, duration and final mark', () => {
    expect(text).toContain('اسم الطالب/ة          : لين أحمد')
    expect(text).toContain(`تاريخ ووقت البدء        : ${formatDateTime(summary.startedAt)}`)
    expect(text).toContain('الوقت المستغرق          : 00:42:15')
    expect(text).toContain('العلامة النهائية        : 100 من 100')
  })

  it('lists every question with answers, model answers, marks and explanations', () => {
    expect(text).toContain('السؤال 1')
    expect(text).toContain('السؤال 30')
    expect(text).toContain('الإجابة النموذجية')
    expect(text).toContain('الشرح:')
    expect(text).toContain('الصفحة المرجعية: ص 19–22')
  })

  it('writes plain numbers and symbols instead of LaTeX commands', () => {
    expect(plainText('$5{,}850{,}000 > 5{,}800{,}000$')).toBe('5,850,000 > 5,800,000')
    expect(plainText('$90^{\\circ}$')).toBe('90°')
    expect(text.includes('\\frac') || text.includes('\\circ') || text.includes('{,}')).toBe(false)
  })

  it('names the file with the student name and a .txt extension, safe for file systems', () => {
    const name = reportFileName('لين / أحمد: <تجربة>', Date.UTC(2026, 2, 5, 9, 42))
    expect(name.endsWith('.txt')).toBe(true)
    expect(name).toContain('لين')
    expect(name).not.toMatch(/[\\/:*?"<>|]/)
  })
})

describe('encouragement is gentle at every level', () => {
  it('returns a non-shaming message for every score band', () => {
    for (const s of [0, 40, 60, 80, 100]) {
      const msg = encouragement(s)
      expect(msg.length).toBeGreaterThan(10)
      expect(msg).not.toMatch(/فاشل|ضعيف جداً|سيئ/)
    }
  })
})
