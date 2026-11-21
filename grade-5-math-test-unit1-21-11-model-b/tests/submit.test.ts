/**
 * اختبار عقد الإرسال إلى Google Sheets وآلية المحاولات — باستخدام Mock Fetch فقط.
 * لا يُجرى أي اتصال حقيقي إطلاقاً: fetch العام معطَّل ويرمي خطأً إن استُدعي،
 * وكل إرسال يمر عبر fetchImpl وهمي وsleep وهمي.
 *
 * العقد مطابق للاختبار المرجعي grade5-math-unit1 ولـنموذج A:
 * 12 حقلاً عليا، 11 في summary، 3 في كل درس، 9 في كل تفصيل،
 * POST بنوع text/plain;charset=utf-8، و3 محاولات بفاصلين 2s ثم 5s، ومهلة 30s.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { EXAM_ID, EXAM_TITLE, SHEETS_TOKEN, SHEETS_URL } from '../src/config'
import { examQuestions, unitOneLessons } from '../src/data/questions'
import type { StudentAnswersMap } from '../src/types/exam'
import { gradeFullExam } from '../src/utils/scoring'
import { buildReportText } from '../src/lib/report'
import {
  ATTEMPT_TIMEOUT_MS,
  MAX_ATTEMPTS,
  PENDING_PREFIX,
  RETRY_DELAYS_MS,
  STATUS_AR,
  buildPayload,
  gradeLabel,
  lessonTotals,
  newAttemptId,
  pendingCount,
  pendingKey,
  percentageOf,
  retryPending,
  sendWithRetry,
  type FetchLike,
  type SendOptions,
  type StorageLike,
  type SubmissionPayload,
} from '../src/lib/submit'
import { perfectAnswers, wrongAnswerFor } from './answers'

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

const STARTED_AT = Date.UTC(2026, 10, 21, 7, 0, 5, 250)
const SUBMITTED_AT = Date.UTC(2026, 10, 21, 7, 47, 38, 900)

function payloadFor(
  answers: StudentAnswersMap,
  attemptId = '3f0c2a52-7d1e-4c58-9a6b-1f2e3d4c5b6a',
): SubmissionPayload {
  const summary = gradeFullExam(answers, examQuestions)
  return buildPayload({
    attemptId,
    studentName: 'سارة أحمد',
    startedAt: STARTED_AT,
    submittedAt: SUBMITTED_AT,
    elapsedSec: Math.floor((SUBMITTED_AT - STARTED_AT) / 1000),
    answers,
    reportText: buildReportText({
      studentName: 'سارة أحمد',
      summary,
      startedAtTimestamp: STARTED_AT,
      submittedAtTimestamp: SUBMITTED_AT,
      elapsedSeconds: Math.floor((SUBMITTED_AT - STARTED_AT) / 1000),
    }),
  })
}

interface MockNet {
  calls: Array<{ url: string; init: RequestInit; body: SubmissionPayload }>
  sleeps: number[]
  replies: string[]
  fetchImpl: FetchLike
  opts: SendOptions
}

function mockNet(replies: string[] = ['{"ok":true}']): MockNet {
  const net: MockNet = {
    calls: [],
    sleeps: [],
    replies,
    fetchImpl: (url, init) => {
      net.calls.push({
        url: String(url),
        init,
        body: JSON.parse(String(init.body)) as SubmissionPayload,
      })
      const reply =
        net.replies[Math.min(net.calls.length - 1, net.replies.length - 1)] ?? '{"ok":true}'
      return Promise.resolve({ text: async () => reply })
    },
    opts: {},
  }
  net.opts = {
    fetchImpl: net.fetchImpl,
    storage: new MemStorage(),
    sleep: async (ms: number) => {
      net.sleeps.push(ms)
    },
  }
  return net
}

beforeEach(() => {
  vi.restoreAllMocks()
  // حارس أمان: أي استدعاء لشبكة حقيقية يفشل الاختبار فوراً
  vi.stubGlobal('fetch', () => {
    throw new Error('REAL NETWORK CALL ATTEMPTED — forbidden in tests')
  })
})

describe('عقد الحمولة — أسماء الحقول وبنيتها (بلا تغيير عن المرجع)', () => {
  const wire = payloadFor(perfectAnswers)

  it('12 حقلاً عليا بالترتيب نفسه', () => {
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

  it('11 حقلاً في summary بالترتيب نفسه', () => {
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

  it('3 حقول في كل درس و9 حقول في كل تفصيل — تفصيل واحد لكل فرع (86)', () => {
    expect(wire.lessons).toHaveLength(8)
    for (const l of wire.lessons) expect(Object.keys(l)).toEqual(['title', 'awarded', 'max'])
    expect(wire.details).toHaveLength(86)
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

  it('هوية هذا الاختبار ونقطة Sheets ورمزه بلا تغيير', () => {
    expect(wire.examId).toBe(EXAM_ID)
    expect(wire.examTitle).toBe(EXAM_TITLE)
    expect(wire.token).toBe(SHEETS_TOKEN)
    expect(wire.startAt).toBe('2026-11-21T07:00:05.250Z')
    expect(wire.submitAt).toBe('2026-11-21T07:47:38.900Z')
    expect(wire.elapsedSec).toBe(2853)
  })

  it('محاولة كاملة: 100/100 وكل الفروع الـ86 صحيحة', () => {
    expect(wire.summary.total).toBe(100)
    expect(wire.summary.max).toBe(100)
    expect(wire.summary.percentage).toBe(100)
    expect(wire.summary.gradeLabel).toBe('ممتاز')
    expect(wire.summary.fullQuestions).toBe(30)
    expect(wire.summary.partialQuestions).toBe(0)
    expect(wire.summary.wrongQuestions).toBe(0)
    expect(wire.summary.correctSubparts).toBe(86)
    expect(wire.summary.partialSubparts).toBe(0)
    expect(wire.summary.wrongSubparts).toBe(0)
    expect(wire.summary.unansweredSubparts).toBe(0)
  })

  it('محاولة فارغة: صفر وكل الفروع «لم يُجب»', () => {
    const empty = payloadFor({})
    expect(empty.summary.total).toBe(0)
    expect(empty.summary.max).toBe(100)
    expect(empty.summary.percentage).toBe(0)
    expect(empty.summary.gradeLabel).toBe('يحتاج إلى دعم')
    expect(empty.summary.wrongQuestions).toBe(30)
    expect(empty.summary.unansweredSubparts).toBe(86)
    expect(empty.summary.correctSubparts).toBe(0)
    for (const d of empty.details) {
      expect(d.status).toBe(STATUS_AR.unanswered)
      expect(d.awarded).toBe(0)
    }
  })

  it('محاولة خاطئة بالكامل (إجابات موجودة): wrongSubparts = 86 ولا جزئي', () => {
    const wrong: StudentAnswersMap = {}
    for (const q of examQuestions) for (const b of q.branches) wrong[b.id] = wrongAnswerFor(b.id)
    const p = payloadFor(wrong)
    expect(p.summary.total).toBe(0)
    expect(p.summary.wrongSubparts).toBe(86)
    expect(p.summary.unansweredSubparts).toBe(0)
    expect(p.summary.partialSubparts).toBe(0)
    for (const d of p.details) expect(d.status).toBe(STATUS_AR.wrong)
  })

  it('محاولة مختلطة: عدّادات الفروع تجمع إلى 86 والأسئلة إلى 30', () => {
    const mixed: StudentAnswersMap = { ...perfectAnswers }
    delete mixed['q30-d'] // فرع فارغ
    mixed['q01-a'] = '(6, 2)' // جزئي 0.5
    mixed['q05-a'] = '26' // خاطئ
    const p = payloadFor(mixed)
    const s = p.summary
    expect(s.correctSubparts + s.partialSubparts + s.wrongSubparts + s.unansweredSubparts).toBe(86)
    expect(s.fullQuestions + s.partialQuestions + s.wrongQuestions).toBe(30)
    expect(s.unansweredSubparts).toBe(1)
    expect(s.partialSubparts).toBe(1)
    expect(s.wrongSubparts).toBe(1)
    expect(s.correctSubparts).toBe(83)
    // 100 − 0.5 (q01-a جزئي) − 1 (q05-a خاطئ) − 1 (q30-d فارغ) = 97.5
    expect(s.total).toBe(97.5)
    expect(s.fullQuestions + s.partialQuestions).toBe(30)
    expect(s.partialQuestions).toBe(3) // q1 و q5 و q30
    const d30 = p.details.filter((d) => d.q === 30)
    expect(d30.find((d) => d.label === 'د')?.status).toBe(STATUS_AR.unanswered)
    expect(p.details.find((d) => d.q === 1 && d.label === 'أ')?.status).toBe(STATUS_AR.partial)
    expect(p.details.find((d) => d.q === 5 && d.label === 'أ')?.status).toBe(STATUS_AR.wrong)
  })

  it('التفاصيل تحمل إجابة الطالب والإجابة النموذجية والعلامات لكل فرع', () => {
    const d = wire.details.find((x) => x.q === 1 && x.label === 'أ')!
    expect(d.studentAnswer).toBe('(6, 4)')
    expect(d.correctAnswer).toBe('(6, 4)')
    expect(d.awarded).toBe(1)
    expect(d.marks).toBe(1)
    expect(d.lessons).toBe('شبكة الإحداثيات')
    expect(d.qTitle.length).toBeGreaterThan(5)
    const angle = wire.details.find((x) => x.q === 24 && x.label === 'أ')!
    expect(angle.correctAnswer).toBe('120°')
    expect(angle.awarded).toBe(2.5)
    expect(angle.marks).toBe(2.5)
  })

  it('توزيع الدروس: العناوين الثمانية والمجاميع 100', () => {
    expect(wire.lessons.map((l) => l.title)).toEqual(unitOneLessons.map((l) => l.title))
    expect(wire.lessons.map((l) => l.max)).toEqual([9, 9, 16, 13, 17, 14, 11, 11])
    expect(wire.lessons.reduce((s, l) => s + l.max, 0)).toBe(100)
    expect(wire.lessons.reduce((s, l) => s + l.awarded, 0)).toBe(100)
  })

  it('reportText هو نفسه نص التقرير القابل للتنزيل وفيه الدرجة نفسها', () => {
    expect(wire.reportText.length).toBeGreaterThan(4000)
    expect(wire.reportText).toContain('الدرجة النهائية: 100 من 100')
    expect(wire.reportText).toContain('الإجابة النموذجية')
    expect(wire.reportText).toContain(EXAM_ID)
    expect(wire.reportText).toContain(EXAM_TITLE)
  })
})

describe('سلّم التقديرات المعتمد', () => {
  it('الحدود حرفية: 95/85/75/65/50', () => {
    expect(gradeLabel(100)).toBe('ممتاز')
    expect(gradeLabel(95)).toBe('ممتاز')
    expect(gradeLabel(94.9)).toBe('جيد جداً')
    expect(gradeLabel(85)).toBe('جيد جداً')
    expect(gradeLabel(84.9)).toBe('جيد')
    expect(gradeLabel(75)).toBe('جيد')
    expect(gradeLabel(74.9)).toBe('مقبول')
    expect(gradeLabel(65)).toBe('مقبول')
    expect(gradeLabel(64.9)).toBe('ضعيف')
    expect(gradeLabel(50)).toBe('ضعيف')
    expect(gradeLabel(49.9)).toBe('يحتاج إلى دعم')
    expect(gradeLabel(0)).toBe('يحتاج إلى دعم')
  })

  it('النسبة المئوية تُقرب لمنزلة عشرية واحدة', () => {
    expect(percentageOf(98.5, 100)).toBe(98.5)
    expect(percentageOf(2, 3)).toBe(66.7)
    expect(percentageOf(0, 100)).toBe(0)
    expect(percentageOf(5, 0)).toBe(0)
  })
})

describe('آلية الإرسال: 3 محاولات، تأخير 2s ثم 5s، مهلة 30s', () => {
  it('ثوابت العقد', () => {
    expect(MAX_ATTEMPTS).toBe(3)
    expect(RETRY_DELAYS_MS).toEqual([2000, 5000])
    expect(ATTEMPT_TIMEOUT_MS).toBe(30000)
  })

  it('نجاح من المحاولة الأولى: طلب POST واحد ولا شيء معلّق', async () => {
    const net = mockNet(['{"ok":true}'])
    const ok = await sendWithRetry(payloadFor(perfectAnswers, 'id-1'), net.opts)
    expect(ok).toBe(true)
    expect(net.calls).toHaveLength(1)
    expect(net.sleeps).toEqual([])
    const call = net.calls[0]
    expect(call.url).toBe(SHEETS_URL)
    expect(call.init.method).toBe('POST')
    expect((call.init.headers as Record<string, string>)['Content-Type']).toBe(
      'text/plain;charset=utf-8',
    )
    expect(call.body.attemptId).toBe('id-1')
    expect(call.body.token).toBe(SHEETS_TOKEN)
    expect((net.opts.storage as MemStorage).keys()).toEqual([])
  })

  it('فشل ثم فشل ثم نجاح: 3 محاولات بفواصل 2000 ثم 5000', async () => {
    const net = mockNet(['boom-not-json', '{"ok":false}', '{"ok":true}'])
    const ok = await sendWithRetry(payloadFor(perfectAnswers, 'id-2'), net.opts)
    expect(ok).toBe(true)
    expect(net.calls).toHaveLength(3)
    expect(net.sleeps).toEqual([2000, 5000])
    // الحمولة والمعرّف نفسهما في المحاولات الثلاث
    for (const c of net.calls) expect(c.body.attemptId).toBe('id-2')
    expect((net.opts.storage as MemStorage).keys()).toEqual([])
  })

  it('فشل المحاولات كلها: تُحفظ الحمولة تحت pending:<EXAM_ID>:<attemptId>', async () => {
    const net = mockNet(['offline', 'offline', 'offline'])
    const ok = await sendWithRetry(payloadFor(perfectAnswers, 'id-3'), net.opts)
    expect(ok).toBe(false)
    expect(net.calls).toHaveLength(3)
    const storage = net.opts.storage as MemStorage
    expect(storage.keys()).toEqual([pendingKey('id-3')])
    expect(pendingKey('id-3')).toBe(`pending:${EXAM_ID}:id-3`)
    const saved = JSON.parse(storage.getItem(pendingKey('id-3'))!) as SubmissionPayload
    expect(saved.attemptId).toBe('id-3')
    expect(saved.summary.total).toBe(100)
    expect(pendingCount(storage)).toBe(1)
  })

  it('الرد duplicate:true يعد نجاحاً (إعادة إرسال محاولة مسجّلة)', async () => {
    const net = mockNet(['{"duplicate":true}'])
    const ok = await sendWithRetry(payloadFor(perfectAnswers, 'id-4'), net.opts)
    expect(ok).toBe(true)
    expect(net.calls).toHaveLength(1)
  })

  it('انتهاء المهلة يعد فشلاً وتبدأ المحاولة التالية', async () => {
    let n = 0
    const net = mockNet()
    net.opts.fetchImpl = () => {
      n++
      // المحاولة الأولى تعلّق بلا رد؛ الثانية تجيب بنجاح
      if (n === 1) return new Promise<never>(() => {})
      return Promise.resolve({ text: async () => '{"ok":true}' })
    }
    net.opts.timeoutMs = 30
    const ok = await sendWithRetry(payloadFor(perfectAnswers, 'id-5'), net.opts)
    expect(ok).toBe(true)
    expect(n).toBe(2)
    expect(net.sleeps).toEqual([2000])
  })

  it('لا يلمس المحاولات المعلّقة لاختبارات أخرى', async () => {
    const net = mockNet(['{"ok":true}'])
    const storage = net.opts.storage as MemStorage
    storage.setItem('pending:grade-5-math-test-unit1-21-11:model-a-id', '{"attemptId":"model-a-id"}')
    storage.setItem('pending:grade5-math-unit1:ref-id', '{"attemptId":"ref-id"}')
    storage.setItem(pendingKey('own-id'), JSON.stringify(payloadFor(perfectAnswers, 'own-id')))
    expect(pendingCount(storage)).toBe(1) // معلّقات هذا الاختبار فقط
    const sent = await retryPending(net.opts)
    expect(sent).toBe(1)
    // أُرسلت معلّقة هذا الاختبار وحدها وحُذفت بعد النجاح
    expect(net.calls).toHaveLength(1)
    expect(net.calls[0].body.attemptId).toBe('own-id')
    expect(storage.keys()).toEqual([
      'pending:grade-5-math-test-unit1-21-11:model-a-id',
      'pending:grade5-math-unit1:ref-id',
    ])
  })

  it('إعادة الإرسال التلقائية تفشل بصمت وتبقي الحمولة معلّقة', async () => {
    const net = mockNet(['nope', 'nope', 'nope'])
    const storage = net.opts.storage as MemStorage
    const payload = payloadFor(perfectAnswers, 'keep-id')
    storage.setItem(pendingKey('keep-id'), JSON.stringify(payload))
    const sent = await retryPending(net.opts)
    expect(sent).toBe(0)
    expect(storage.getItem(pendingKey('keep-id'))).not.toBeNull()
  })

  it('بادئة المعلّقات مستقلة: PENDING_PREFIX فيه معرّف نموذج B', () => {
    expect(PENDING_PREFIX).toBe('pending:grade-5-math-test-unit1-21-11-model-b:')
    expect(PENDING_PREFIX).not.toBe('pending:grade-5-math-test-unit1-21-11:')
    expect(PENDING_PREFIX.startsWith('pending:grade5-math-unit1')).toBe(false)
  })
})

describe('ثبات attemptId', () => {
  it('newAttemptId يولّد معرّفات فريدة غير فارغة', () => {
    const ids = new Set(Array.from({ length: 50 }, () => newAttemptId()))
    expect(ids.size).toBe(50)
    for (const id of ids) expect(id.length).toBeGreaterThan(8)
  })

  it('إعادة بناء الحمولة للمحاولة نفسها تحمل attemptId نفسه', () => {
    const a = payloadFor(perfectAnswers, 'stable-id')
    const b = payloadFor(perfectAnswers, 'stable-id')
    expect(a.attemptId).toBe(b.attemptId)
    expect(JSON.stringify(a)).toBe(JSON.stringify(b)) // حتمية كاملة
  })

  it('lessonTotals مطابقة لتوزيع الدروس في كل حالة', () => {
    const totals = lessonTotals(gradeFullExam(perfectAnswers, examQuestions).questionResults)
    expect(totals.reduce((s, l) => s + l.awarded, 0)).toBe(100)
    const zero = lessonTotals(gradeFullExam({}, examQuestions).questionResults)
    expect(zero.every((l) => l.awarded === 0)).toBe(true)
    expect(zero.reduce((s, l) => s + l.max, 0)).toBe(100)
  })
})
