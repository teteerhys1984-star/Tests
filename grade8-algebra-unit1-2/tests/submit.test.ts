/**
 * اختبار عقد الإرسال إلى Google Sheets (Mock Server فقط — لا اتصال حقيقي):
 * بنية الحمولة وأسماء الحقول، نوع المحتوى، 3 محاولات، التأخيران 2 ثم 5 ثوانٍ،
 * مهلة 30 ثانية، المفتاح pending:<EXAM_ID>:<attemptId>، إعادة الإرسال، ومنع التكرار.
 */
import { gradeExam, questions } from '../src/lib/exam'
import type { Answers, ExamResult } from '../src/lib/exam'
import { buildReport, reportFilename } from '../src/lib/report'
import {
  ATTEMPT_TIMEOUT_MS,
  MAX_ATTEMPTS,
  PENDING_PREFIX,
  RETRY_DELAYS_MS,
  buildPayload,
  hasPending,
  newAttemptId,
  pendingKey,
  retryPending,
  sendWithRetry,
  type FetchLike,
  type StorageLike,
  type SubmissionPayload,
} from '../src/lib/submit'
import { EXAM_ID, SHEETS_TOKEN, SHEETS_URL } from '../src/config'
import {
  SHEETS_URL as REF_SHEETS_URL,
  SHEETS_TOKEN as REF_SHEETS_TOKEN,
  EXAM_ID as REF_EXAM_ID,
} from '../../grade5-math-unit1/src/config'

let failures = 0
function check(name: string, cond: boolean, extra = '') {
  if (!cond) {
    failures += 1
    console.log('  ✗ ' + name + (extra ? ' → ' + extra : ''))
  } else {
    console.log('  ✓ ' + name + (extra ? ' → ' + extra : ''))
  }
}

class MemStorage implements StorageLike {
  map = new Map<string, string>()
  constructor(seed: Record<string, string> = {}) {
    for (const [k, v] of Object.entries(seed)) this.map.set(k, v)
  }
  get length() {
    return this.map.size
  }
  key(i: number) {
    return Array.from(this.map.keys())[i] ?? null
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
}

interface Call {
  url: string
  init: RequestInit
}

function mockFetch(respond: (n: number) => string | Promise<string>) {
  const calls: Call[] = []
  const fn: FetchLike = async (url, init) => {
    calls.push({ url, init })
    const body = await respond(calls.length)
    return { text: async () => body } as unknown as Pick<Response, 'text'>
  }
  return { calls, fn }
}

function perfectAnswers(): Answers {
  const answers: Answers = {}
  for (const q of questions) {
    for (const p of q.subparts) {
      if (p.kind === 'rational') answers[p.id] = p.expectedRational ?? ''
      else if (p.kind === 'fields') {
        answers[p.id] = Object.fromEntries((p.fields ?? []).map((f) => [f.id, f.expected]))
      } else if (p.kind === 'mcq') answers[p.id] = p.correctOption ?? ''
      else if (p.kind === 'order') answers[p.id] = [...(p.correctOrder ?? [])]
      else if (p.kind === 'justify') answers[p.id] = { verdict: p.correctVerdict, reason: p.correctReason }
    }
  }
  return answers
}

const startedAt = Date.UTC(2026, 0, 2, 8, 30, 0)
const submittedAt = startedAt + 3_725_000
const meta = { studentName: 'طالب الاختبار', startedAt, submittedAt, elapsedMs: submittedAt - startedAt }

const perfectResult = gradeExam(perfectAnswers())
const perfectReport = buildReport(
  {
    schemaVersion: 1,
    examId: EXAM_ID,
    examVersion: '1.0.0',
    attemptId: 'attempt-payload-0001',
    studentName: meta.studentName,
    status: 'submitted',
    answers: perfectAnswers(),
    currentIndex: 0,
    visited: [0],
    optionOrder: {},
    questionOrder: questions.map((q) => q.id),
    startedAt,
    submittedAt,
    elapsedMs: meta.elapsedMs,
    startCuePlayed: true,
    submissionCuePlayed: true,
    reportFilename: reportFilename(meta.studentName),
    lastSavedAt: submittedAt,
  },
  perfectResult,
)

const payload: SubmissionPayload = buildPayload({
  attemptId: 'attempt-payload-0001',
  meta,
  result: perfectResult,
  reportText: perfectReport,
})

console.log('\n== 1) مطابقة الإعدادات للاختبار المرجعي ==')
check('SHEETS_URL نفسه', SHEETS_URL === REF_SHEETS_URL, SHEETS_URL.slice(0, 48) + '…')
check('SHEETS_TOKEN نفسه', SHEETS_TOKEN === REF_SHEETS_TOKEN)
check('EXAM_ID الجديد', EXAM_ID === 'grade8-algebra-unit1-2' && REF_EXAM_ID === 'grade5-math-unit1', EXAM_ID)
check('بادئة المعلّق pending:<EXAM_ID>:', PENDING_PREFIX === `pending:grade8-algebra-unit1-2:`)
check('مفتاح المحاولة', pendingKey('abc') === 'pending:grade8-algebra-unit1-2:abc')
check('فاصلان 2 ثم 5 ثوانٍ', JSON.stringify(RETRY_DELAYS_MS) === JSON.stringify([2000, 5000]))
check('3 محاولات', MAX_ATTEMPTS === 3)
check('مهلة 30 ثانية', ATTEMPT_TIMEOUT_MS === 30000)

console.log('\n== 2) بنية الحمولة وأسماء الحقول ==')
const topKeys = ['token', 'attemptId', 'examId', 'examTitle', 'studentName', 'startAt', 'submitAt', 'elapsedSec', 'summary', 'lessons', 'details', 'reportText']
check('الحقول العليا مطابقة للعقد', JSON.stringify(Object.keys(payload)) === JSON.stringify(topKeys), Object.keys(payload).join(','))
check('token من الإعدادات', payload.token === SHEETS_TOKEN)
check('attemptId محفوظ', payload.attemptId === 'attempt-payload-0001')
check('examId = EXAM_ID', payload.examId === EXAM_ID, payload.examId)
check('examTitle نصي', payload.examTitle === 'اختبار الجبر — الصف الثامن — الوحدتان الأولى والثانية')
check('studentName فقط (لا بيانات شخصية أخرى)', payload.studentName === meta.studentName)
check('startAt ISO', payload.startAt === '2026-01-02T08:30:00.000Z', payload.startAt)
check('submitAt ISO', payload.submitAt === '2026-01-02T09:32:05.000Z', payload.submitAt)
check('elapsedSec ثوانٍ صحيحة', payload.elapsedSec === 3725, String(payload.elapsedSec))

const summaryKeys = ['total', 'max', 'percentage', 'gradeLabel', 'fullQuestions', 'partialQuestions', 'wrongQuestions', 'correctSubparts', 'partialSubparts', 'wrongSubparts', 'unansweredSubparts']
check('حقول summary مطابقة للعقد', JSON.stringify(Object.keys(payload.summary)) === JSON.stringify(summaryKeys), Object.keys(payload.summary).join(','))
check('summary.total 100', payload.summary.total === 100)
check('summary.max 100', payload.summary.max === 100)
check('summary.percentage 100', payload.summary.percentage === 100)
check('summary.gradeLabel ممتاز', payload.summary.gradeLabel === 'ممتاز')
check('15 سؤالًا كاملًا', payload.summary.fullQuestions === 15)
check('0 سؤال جزئي/خاطئ', payload.summary.partialQuestions === 0 && payload.summary.wrongQuestions === 0)
check('45 فرعًا صحيحًا', payload.summary.correctSubparts === 45)
check('0 فروع جزئية/خاطئة/غير مجابة', payload.summary.partialSubparts === 0 && payload.summary.wrongSubparts === 0 && payload.summary.unansweredSubparts === 0)

check('lessons مصفوفة كائنات title/awarded/max', Array.isArray(payload.lessons) && payload.lessons.every((l) => JSON.stringify(Object.keys(l)) === JSON.stringify(['title', 'awarded', 'max'])))
check('lessons: مجموع max = 100', payload.lessons.reduce((s, l) => s + l.max, 0) === 100, String(payload.lessons.reduce((s, l) => s + l.max, 0)))
check('lessons: مجموع awarded = 100', payload.lessons.reduce((s, l) => s + l.awarded, 0) === 100)
check('lessons: 8 دروس مطابقة لمصادر الأسئلة', payload.lessons.length === 8, String(payload.lessons.length))
check('lessons تشمل الجمع والطرح', payload.lessons.some((l) => l.title === 'الجمع والطرح'))
check('lessons تشمل الجذور التربيعية', payload.lessons.some((l) => l.title === 'الجذور التربيعية'))

const detailKeys = ['q', 'qTitle', 'lessons', 'label', 'status', 'awarded', 'marks', 'studentAnswer', 'correctAnswer']
check('حقول details مطابقة للعقد', payload.details.every((d) => JSON.stringify(Object.keys(d)) === JSON.stringify(detailKeys)))
check('مدخل لكل فرع: 45', payload.details.length === 45, String(payload.details.length))
check('أرقام الأسئلة 1…15', JSON.stringify(Array.from(new Set(payload.details.map((d) => d.q)))) === JSON.stringify(Array.from({ length: 15 }, (_, i) => i + 1)))
check('تسميات الفروع أ/ب/ج', payload.details.filter((d) => d.q === 1).map((d) => d.label).join('') === 'أبج')
check('حالات الفروع بالعربية', payload.details.every((d) => d.status === 'إجابة صحيحة'))
check('العلامات مجموعها 100', payload.details.reduce((s, d) => s + d.awarded, 0) === 100)
check(
  'لا تبقى رموز $ في العناوين والدروس',
  payload.details.every((d) => !d.qTitle.includes('$') && !d.lessons.includes('$')),
)
// ملاحظة موثّقة: وسم الحقل الثاني في q6b يحتوي $ واحدًا غير مغلق في الأصل،
// فلا يزيله محوّل LaTeX. لا نصلح نص السؤال حفاظاً على الأصل.
check(
  'الرموز المتبقية محصورة في وسم q6b الأصلي',
  payload.details.filter((d) => d.correctAnswer.includes('$')).length === 1,
  String(payload.details.filter((d) => d.correctAnswer.includes('$')).length),
)
check('reportText منقول كما هو', payload.reportText === perfectReport && payload.reportText.length > 20000)

console.log('\n== 3) الحمولة في الحالات الفارغة والجزئية ==')
const emptyResult = gradeExam({})
const emptyPayload = buildPayload({ attemptId: 'attempt-empty', meta, result: emptyResult, reportText: 'تقرير' })
check('الفارغة: total 0', emptyPayload.summary.total === 0)
check('الفارغة: gradeLabel «يحتاج إلى دعم»', emptyPayload.summary.gradeLabel === 'يحتاج إلى دعم')
check('الفارغة: 15 سؤالًا خاطئًا و45 غير مجاب', emptyPayload.summary.wrongQuestions === 15 && emptyPayload.summary.unansweredSubparts === 45)
check('الفارغة: إجابة الطالب «—»', emptyPayload.details.every((d) => d.studentAnswer === '—'))
check('الفارغة: الإجابة الصحيحة ما زالت مرسَلة', emptyPayload.details.every((d) => d.correctAnswer.length > 0))

const partialAnswers = perfectAnswers()
partialAnswers.q2a = { coef: '4.7', exp: '5' }
partialAnswers.q9c = { coef: '6', exp: '0', decimal: '60' }
const partialResult = gradeExam(partialAnswers)
const partialPayload = buildPayload({ attemptId: 'attempt-partial', meta, result: partialResult, reportText: 'تقرير' })
check('الجزئية: total 98', partialPayload.summary.total === 98)
check('الجزئية: 13 سؤالًا كاملًا و2 جزئي', partialPayload.summary.fullQuestions === 13 && partialPayload.summary.partialQuestions === 2)
check('الجزئية: 43 فرعًا صحيحًا و2 جزئي', partialPayload.summary.correctSubparts === 43 && partialPayload.summary.partialSubparts === 2)
check('الجزئية: مستوى 98% ← ممتاز', partialPayload.summary.gradeLabel === 'ممتاز')

console.log('\n== 4) الإرسال: النجاح والمحاولات والتأخير ==')
async function run() {
  {
    const storage = new MemStorage()
    const { calls, fn } = mockFetch(() => JSON.stringify({ ok: true }))
    const sleeps: number[] = []
    const ok = await sendWithRetry(payload, { fetchImpl: fn, storage, sleep: async (ms) => { sleeps.push(ms) } })
    check('نجاح من المحاولة الأولى', ok)
    check('طلب واحد فقط', calls.length === 1)
    check('لا انتظار عند النجاح الفوري', sleeps.length === 0)
    check('URL الصحيح', calls[0].url === SHEETS_URL)
    check('POST', calls[0].init.method === 'POST')
    check('Content-Type: text/plain;charset=utf-8', (calls[0].init.headers as Record<string, string>)['Content-Type'] === 'text/plain;charset=utf-8')
    check('نص الطلب JSON للحمولة', calls[0].init.body === JSON.stringify(payload))
    check('لا مفتاح معلّق بعد النجاح', !hasPending(payload.attemptId, { storage }))
  }

  {
    const storage = new MemStorage()
    let n = 0
    const { calls, fn } = mockFetch(() => {
      n += 1
      return n < 3 ? JSON.stringify({ ok: false }) : JSON.stringify({ ok: true })
    })
    const sleeps: number[] = []
    const ok = await sendWithRetry(payload, { fetchImpl: fn, storage, sleep: async (ms) => { sleeps.push(ms) } })
    check('نجاح بعد محاولتين فاشلتين', ok)
    check('3 محاولات', calls.length === 3)
    check('التأخيران 2000 ثم 5000', JSON.stringify(sleeps) === JSON.stringify([2000, 5000]), JSON.stringify(sleeps))
    check('الحمولة نفسها في كل محاولة', calls.every((c) => c.init.body === calls[0].init.body))
    const bodies = calls.map((c) => JSON.parse(String(c.init.body)) as SubmissionPayload)
    check('attemptId نفسه ولا يتغيّر', bodies.every((b) => b.attemptId === payload.attemptId))
    check('لا مفتاح معلّق بعد النجاح', !hasPending(payload.attemptId, { storage }))
  }

  {
    const storage = new MemStorage()
    const { calls, fn } = mockFetch(() => JSON.stringify({ ok: false }))
    const sleeps: number[] = []
    const ok = await sendWithRetry(payload, { fetchImpl: fn, storage, sleep: async (ms) => { sleeps.push(ms) } })
    check('فشل كل المحاولات يعيد false', !ok)
    check('3 محاولات فاشلة', calls.length === 3)
    check('التأخيران 2000 ثم 5000', JSON.stringify(sleeps) === JSON.stringify([2000, 5000]))
    check('الكائنات الثلاثة متطابقة', new Set(calls.map((c) => c.init.body)).size === 1)
    check('حُفظت النتيجة المعلّقة بالمفتاح الصحيح', hasPending(payload.attemptId, { storage }))
    const stored = JSON.parse(storage.getItem(pendingKey(payload.attemptId)) ?? '{}') as SubmissionPayload
    check('الحمولة المحفوظة كاملة', stored.attemptId === payload.attemptId && stored.examId === EXAM_ID && stored.details.length === 45)
    check('مغادرة الصفحة لا تحذف المعلّق', hasPending(payload.attemptId, { storage }))
  }

  console.log('\n== 5) منع التكرار والاستجابة المقبولة ==')
  {
    const storage = new MemStorage()
    const { calls, fn } = mockFetch(() => JSON.stringify({ duplicate: true }))
    const ok = await sendWithRetry(payload, { fetchImpl: fn, storage })
    check('duplicate:true يُعدّ نجاحًا', ok && calls.length === 1)
    check('لا معلّق', !hasPending(payload.attemptId, { storage }))
  }
  {
    const storage = new MemStorage()
    const { fn } = mockFetch(() => JSON.stringify({ ok: false, duplicate: false }))
    check('ok:false فشل', !(await sendWithRetry(payload, { fetchImpl: fn, storage, sleep: async () => {} })))
  }
  {
    const storage = new MemStorage()
    const { fn } = mockFetch(() => 'not-json')
    check('ردّ غير JSON فشل', !(await sendWithRetry(payload, { fetchImpl: fn, storage, sleep: async () => {} })))
  }
  {
    const storage = new MemStorage()
    let n = 0
    const fn: FetchLike = async () => {
      n += 1
      throw new Error('network down')
    }
    const ok = await sendWithRetry(payload, { fetchImpl: fn, storage, sleep: async () => {} })
    check('خطأ شبكة لا يرمي استثناءً', !ok && n === 3)
  }

  console.log('\n== 6) المهلة 30 ثانية ==')
  {
    const storage = new MemStorage()
    let n = 0
    const fn: FetchLike = () => {
      n += 1
      return new Promise(() => {}) as unknown as Promise<Pick<Response, 'text'>>
    }
    const t0 = Date.now()
    const ok = await sendWithRetry(payload, { fetchImpl: fn, storage, sleep: async () => {}, timeoutMs: 25 })
    const elapsed = Date.now() - t0
    check('الاتصال المعلّق يُعدّ فشلًا', !ok)
    check('3 محاولات بعد المهلة', n === 3)
    check('المهلة القصيرة المُحقَنة تعمل بسرعة', elapsed < 1500, `${elapsed}ms`)
    check('حُفظت النتيجة بعد المهلة', hasPending(payload.attemptId, { storage }))
  }

  console.log('\n== 7) إعادة الإرسال التلقائي (retryPending) ==')
  {
    const storage = new MemStorage()
    const { calls, fn } = mockFetch(() => JSON.stringify({ ok: true }))
    const stored: SubmissionPayload = { ...payload, token: 'old-token' }
    storage.setItem(pendingKey(payload.attemptId), JSON.stringify(stored))
    storage.setItem('pending:other-exam:xyz', JSON.stringify({ ...payload, examId: 'other-exam', token: 'x' }))
    storage.setItem('unrelated-key', 'value')
    const sent = await retryPending({ fetchImpl: fn, storage, sleep: async () => {} })
    check('أُعيد إرسال نتيجة واحدة', sent === 1)
    check('طلب واحد لهذا الاختبار فقط', calls.length === 1)
    const body = JSON.parse(String(calls[0].init.body)) as SubmissionPayload
    check('التوكن يُحدَّث من الإعدادات الحالية', body.token === SHEETS_TOKEN)
    check('attemptId نفسه عند إعادة الإرسال', body.attemptId === payload.attemptId)
    check('حُذف المعلّق بعد النجاح', !hasPending(payload.attemptId, { storage }))
    check('معلّق اختبار آخر لم يُحذف', storage.getItem('pending:other-exam:xyz') !== null)
    check('المفاتيح الأخرى لم تُلمس', storage.getItem('unrelated-key') === 'value')
  }
  {
    const storage = new MemStorage()
    storage.setItem(pendingKey('a1'), JSON.stringify({ ...payload, attemptId: 'a1' }))
    const { fn } = mockFetch(() => JSON.stringify({ ok: false }))
    const sent = await retryPending({ fetchImpl: fn, storage, sleep: async () => {} })
    check('فشل إعادة الإرسال يبقي المعلّق', sent === 0 && hasPending('a1', { storage }))
  }
  {
    const storage = new MemStorage()
    check('لا معلّقات ← 0', (await retryPending({ storage })) === 0)
  }
  {
    const storage = new MemStorage()
    const { fn } = mockFetch(() => JSON.stringify({ ok: true }))
    storage.setItem(pendingKey('bad'), '{not json')
    storage.setItem(pendingKey('arr'), '[1,2,3]')
    const sent = await retryPending({ fetchImpl: fn, storage })
    check('المعلّقات التالفة تُتجاهل بلا انهيار', sent === 0)
  }
  {
    const storage = new MemStorage()
    const { calls, fn } = mockFetch(() => JSON.stringify({ ok: true }))
    storage.setItem(pendingKey('same'), JSON.stringify({ ...payload, attemptId: 'same' }))
    await Promise.all([
      retryPending({ fetchImpl: fn, storage }),
      retryPending({ fetchImpl: fn, storage }),
    ])
    check('نداءان متزامنان لا يضاعفان الإرسال', calls.length === 1, String(calls.length))
  }

  console.log('\n== 8) غياب التخزين والأعطال ==')
  {
    const { fn } = mockFetch(() => JSON.stringify({ ok: false }))
    const ok = await sendWithRetry(payload, { fetchImpl: fn, storage: null, sleep: async () => {} })
    check('بلا تخزين: يفشل بهدوء', !ok)
    check('hasPending بلا تخزين = false', !hasPending(payload.attemptId, { storage: null }))
    check('retryPending بلا تخزين = 0', (await retryPending({ storage: null })) === 0)
  }
  {
    const broken: StorageLike = {
      get length() {
        throw new Error('blocked')
      },
      key() {
        throw new Error('blocked')
      },
      getItem() {
        throw new Error('blocked')
      },
      setItem() {
        throw new Error('blocked')
      },
      removeItem() {
        throw new Error('blocked')
      },
    }
    const { fn } = mockFetch(() => JSON.stringify({ ok: false }))
    const ok = await sendWithRetry(payload, { fetchImpl: fn, storage: broken, sleep: async () => {} })
    check('تخزين معطّل لا يمنع المحاولة ولا يرمي', !ok)
    check('hasPending مع تخزين معطّل = false', !hasPending(payload.attemptId, { storage: broken }))
    check('retryPending مع تخزين معطّل = 0', (await retryPending({ storage: broken })) === 0)
  }
  {
    const ids = new Set(Array.from({ length: 200 }, () => newAttemptId()))
    check('newAttemptId فريد', ids.size === 200 && Array.from(ids).every((id) => id.length >= 16))
  }

  console.log('')
  if (failures) {
    console.log(`❌ فشل ${failures} فحصًا في الإرسال`)
    process.exit(1)
  }
  console.log('✅ كل فحوص الإرسال والحمولة ناجحة')
process.exit(0)
}

void run()
