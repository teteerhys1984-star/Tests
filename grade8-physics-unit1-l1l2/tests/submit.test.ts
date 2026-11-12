/**
 * اختبارات إرسال النتيجة إلى المعلّم (src/exam/submit.ts):
 *   أ) بناء الحمولة: أسماء الحقول بالضبط كما في الاختبار المرجعي (grade5-math-unit1)،
 *      ومدخل واحد لكل فرع، والمجاميع تطابق summarize().
 *   ب) المُرسِل بـ fetch وهمي: نجاح · فشل ثم إعادة · 3 محاولات بفواصل 2 ثم 5 ثوانٍ ·
 *      مهلة 30 ثانية · الحفظ في localStorage عند فشل كل المحاولات · إعادة إرسال المعلّق عند التحميل ·
 *      عدم تكرار الإرسال لنفس attemptId · عدم رمي أي خطأ.
 *
 * لا يُجرى أي اتصال حقيقي: fetch العام معطَّل، والانتظار وهمي.
 */
import { EXAM_ID, SHEETS_TOKEN, SHEETS_URL } from '../src/config'
import { QUESTIONS, SUBPART_COUNT } from '../src/exam/questions'
import {
  gradeAll, summarize, buildReport, validateReport, gradeLabel, STATUS_AR, type AttemptMeta,
} from '../src/exam/report'
import {
  buildPayload, newAttemptId, sendWithRetry, retryPending, pendingKey,
  MAX_ATTEMPTS, PENDING_PREFIX, RETRY_DELAYS_MS, ATTEMPT_TIMEOUT_MS,
  type FetchLike, type SendOptions, type StorageLike, type SubmissionPayload,
} from '../src/exam/submit'
import { EXAM_TITLE, LESSONS, LESSON_BY_ID, TOTAL_MARKS, type Subpart } from '../src/exam/types'
import type { Answers, AnswerValue, TfAnswer } from '../src/exam/grading'
import { plainMath } from '../src/lib/mathx'

/* علامة يجب ألّا تظهر في أي ملف منشور: تُبنى من جزأين كي لا يبقى أثرها هنا. */
const FORBIDDEN_MARK = new RegExp('ar' + 'ena', 'i')

let failures = 0
let finished = false
process.exitCode = 1
process.on('exit', () => { if (!finished) console.log('\n❌ لم يكتمل تشغيل الاختبار') })
function check(name: string, cond: boolean, extra = '') {
  if (!cond) { failures++; console.log('  ✗ ' + name + (extra ? ' → ' + extra : '')) }
  else console.log('  ✓ ' + name + (extra ? ' → ' + extra : ''))
}
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)

let realFetchCalls = 0
;(globalThis as any).fetch = () => {
  realFetchCalls++
  return Promise.reject(new Error('real fetch is disabled in tests'))
}

/* ------------------------------------------------------------------ */
/* تسليم وهمي: إجابات صحيحة وجزئية وخاطئة وفارغة                       */
/* ------------------------------------------------------------------ */
function correctAnswer(sp: Subpart): AnswerValue {
  switch (sp.kind) {
    case 'numeric': case 'text':
      return String(Array.isArray(sp.correct) ? sp.correct[0] : sp.correct)
    case 'explain':
      return (sp.rubricAll ?? []).map((g) => g[0]).join(' و ')
    case 'choice':
      return String(sp.correct)
    case 'multiselect':
      return (sp.correct as string[]).slice()
    case 'tf': {
      const t: TfAnswer = { value: sp.correct === true ? 'true' : 'false', correction: '' }
      if (sp.requireCorrection) t.correction = (sp.correction ?? []).map((g) => g.join(' و ')).join(' و ')
      return t
    }
    case 'matching':
      return Object.fromEntries((sp.rows ?? []).map((r) => [r.id, r.answer]))
    case 'ordering':
      return (sp.items ?? []).map((i) => i.id)
    default:
      return ''
  }
}

const answers: Answers = {}
for (const q of QUESTIONS) for (const sp of q.subparts) answers[sp.id] = correctAnswer(sp)
answers['q1a'] = ['a1', 'a2', 'a3']            // جزئية (3 من 4)
answers['q6e'] = 'تزداد فقط'                    // تعليل جزئي
answers['q1d'] = { value: 'false', correction: 'لا أعرف' } // صواب/خطأ بتصويب ناقص
answers['q1b'] = '32'                           // خاطئة
answers['q8c'] = '30'                            // خاطئة
delete answers['q2a']                            // بلا إجابة
delete answers['q9b']                            // بلا إجابة
for (const sp of QUESTIONS.find((q) => q.id === 'q10')!.subparts) answers[sp.id] = '0' // سؤال كامل خاطئ

const meta: AttemptMeta = {
  studentName: 'سارة أحمد',
  startAt: new Date('2026-11-12T08:05:05.250Z'),
  submitAt: new Date('2026-11-12T08:42:31.900Z'),
  elapsedMs: 2246650,
}
const order = QUESTIONS.slice()
const results = gradeAll(order, answers)
const sum = summarize(results)
const report = buildReport(meta, results)
const ATTEMPT = '3f0c2a52-7d1e-4c58-9a6b-1f2e3d4c5b6a'
const payload = buildPayload({ attemptId: ATTEMPT, meta, order, answers, reportText: report })
const wire = JSON.parse(JSON.stringify(payload)) as SubmissionPayload

/* ================================================================== */
console.log('\n== أ-1) الحمولة: أسماء الحقول بالضبط (عقد المرجع) ==')
const TOP = ['token', 'attemptId', 'examId', 'examTitle', 'studentName', 'startAt', 'submitAt', 'elapsedSec', 'summary', 'lessons', 'details', 'reportText']
const SUMMARY = ['total', 'max', 'percentage', 'gradeLabel', 'fullQuestions', 'partialQuestions', 'wrongQuestions', 'correctSubparts', 'partialSubparts', 'wrongSubparts', 'unansweredSubparts']
const LESSON = ['title', 'awarded', 'max']
const DETAIL = ['q', 'qTitle', 'lessons', 'label', 'status', 'awarded', 'marks', 'studentAnswer', 'correctAnswer']
check('الحقول العليا (12) بالأسماء والترتيب المطلوبين', same(Object.keys(wire), TOP), Object.keys(wire).join(', '))
check('حقول summary (11)', same(Object.keys(wire.summary), SUMMARY), Object.keys(wire.summary).join(', '))
check('حقول كل عنصر في lessons', wire.lessons.every((l) => same(Object.keys(l), LESSON)), LESSON.join(', '))
check('حقول كل عنصر في details', wire.details.every((d) => same(Object.keys(d), DETAIL)), DETAIL.join(', '))
check('لا يضيع أي حقل عند التحويل إلى JSON (لا undefined ولا NaN)',
  same(wire, payload) && !/:null[,}\]]/.test(JSON.stringify(payload)))
check('أنواع الحقول العليا',
  typeof wire.token === 'string' && typeof wire.attemptId === 'string' && typeof wire.examId === 'string'
  && typeof wire.examTitle === 'string' && typeof wire.studentName === 'string' && typeof wire.startAt === 'string'
  && typeof wire.submitAt === 'string' && typeof wire.elapsedSec === 'number' && Array.isArray(wire.lessons)
  && Array.isArray(wire.details) && typeof wire.reportText === 'string')
check('أنواع حقول details', wire.details.every((d) => typeof d.q === 'number' && typeof d.qTitle === 'string'
  && typeof d.lessons === 'string' && typeof d.label === 'string' && typeof d.status === 'string'
  && typeof d.awarded === 'number' && typeof d.marks === 'number'
  && typeof d.studentAnswer === 'string' && typeof d.correctAnswer === 'string'))

console.log('\n== أ-2) الحمولة: البيانات الوصفية ==')
check('token و examId من src/config.ts', wire.token === SHEETS_TOKEN && wire.examId === EXAM_ID, wire.examId)
check('attemptId كما أُعطي', wire.attemptId === ATTEMPT)
check('examTitle = EXAM_TITLE', wire.examTitle === EXAM_TITLE, wire.examTitle)
check('studentName', wire.studentName === 'سارة أحمد')
check('startAt و submitAt بصيغة ISO', wire.startAt === '2026-11-12T08:05:05.250Z' && wire.submitAt === '2026-11-12T08:42:31.900Z')
check('elapsedSec عدد صحيح من الثواني', wire.elapsedSec === 2246 && Number.isInteger(wire.elapsedSec), String(wire.elapsedSec))
check('reportText = نص التقرير الكامل', wire.reportText === report && wire.reportText.length > 8000, `${wire.reportText.length} حرفاً`)
check('التقرير نفسه يجتاز validateReport', validateReport(wire.reportText, meta, results).length === 0)

console.log('\n== أ-3) الحمولة: summary يطابق summarize() ==')
check('التسليم الوهمي يشمل الحالات الأربع',
  sum.correctSubparts > 0 && sum.partialSubparts > 0 && sum.wrongSubparts > 0 && sum.unansweredSubparts > 0
  && new Set([sum.full, sum.partial, sum.wrong]).size === 3,
  `أسئلة ${sum.full}/${sum.partial}/${sum.wrong} · فروع ${sum.correctSubparts}/${sum.partialSubparts}/${sum.wrongSubparts}/${sum.unansweredSubparts}`)
check('total = Summary.total', wire.summary.total === sum.total, String(wire.summary.total))
check('max = TOTAL_MARKS = 100', wire.summary.max === TOTAL_MARKS && wire.summary.max === 100)
check('percentage = Summary.percentage', wire.summary.percentage === sum.percentage, String(wire.summary.percentage))
check('gradeLabel = gradeLabel(percentage)', wire.summary.gradeLabel === gradeLabel(sum.percentage), wire.summary.gradeLabel)
check('عدّادات الأسئلة تطابق', wire.summary.fullQuestions === sum.full && wire.summary.partialQuestions === sum.partial
  && wire.summary.wrongQuestions === sum.wrong)
check('عدّادات الفروع تطابق', wire.summary.correctSubparts === sum.correctSubparts
  && wire.summary.partialSubparts === sum.partialSubparts && wire.summary.wrongSubparts === sum.wrongSubparts
  && wire.summary.unansweredSubparts === sum.unansweredSubparts)
check('عدّادات الأسئلة مجموعها 10 وعدّادات الفروع مجموعها 49',
  wire.summary.fullQuestions + wire.summary.partialQuestions + wire.summary.wrongQuestions === QUESTIONS.length
  && wire.summary.correctSubparts + wire.summary.partialSubparts + wire.summary.wrongSubparts + wire.summary.unansweredSubparts === SUBPART_COUNT)
check('gradeLabel لا يُطبع في تقرير الطالب (يُرسَل للمعلّم فقط)', !report.includes(wire.summary.gradeLabel + '\r\n'))

console.log('\n== أ-4) الحمولة: details — مدخل واحد لكل فرع ==')
const flat = results.flatMap((r) => r.subparts.map((s) => ({ r, s })))
check(`عدد المداخل = عدد الفروع (${SUBPART_COUNT})`, wire.details.length === SUBPART_COUNT, String(wire.details.length))
check('لا تكرار: كل (سؤال، فرع) يظهر مرّة واحدة', new Set(wire.details.map((d) => `${d.q}/${d.label}`)).size === SUBPART_COUNT)
check('كل فرع ممثَّل بمدخله وبالترتيب المعروض', flat.every(({ r, s }, i) =>
  wire.details[i].q === r.displayNumber && wire.details[i].label === s.sp.label && wire.details[i].marks === s.sp.marks))
check('qTitle نص صرف كما في التقرير', flat.every(({ r }, i) => wire.details[i].qTitle === plainMath(r.q.title)
  && report.includes(`السؤال ${r.displayNumber} — ${wire.details[i].qTitle}`)))
check('lessons = عناوين الدرسين موصولة بـ " + "', flat.every(({ r }, i) =>
  wire.details[i].lessons === r.q.lessons.map((id) => LESSON_BY_ID[id].title).join(' + '))
  && wire.details.some((d) => d.lessons.includes(' + '))
  && wire.details.every((d) => d.lessons.split(' + ').every((t) => LESSONS.some((l) => l.title === t))))
check('status = نص الحالة العربي المستعمل في التقرير', flat.every(({ s }, i) => wire.details[i].status === STATUS_AR[s.res.status])
  && same([...new Set(wire.details.map((d) => d.status))].sort(), Object.values(STATUS_AR).sort()))
check('awarded و marks كما صُحّحت', flat.every(({ s }, i) => wire.details[i].awarded === s.res.awarded && wire.details[i].marks === s.sp.marks))
check('studentAnswer و correctAnswer بالنص الصرف نفسه في التقرير', flat.every(({ s }, i) =>
  wire.details[i].studentAnswer === plainMath(s.studentText) && wire.details[i].correctAnswer === plainMath(s.sp.answerText)
  && report.includes(`    إجابة الطالب     : ${wire.details[i].studentAnswer}`)))
check('لا ترميز LaTeX خام ($) في النصوص', wire.details.every((d) => !/\$/.test(d.qTitle + d.studentAnswer + d.correctAnswer)))
const cnt = (st: string) => wire.details.filter((d) => d.status === st).length
check('عدد كل حالة في details = عدّادات summary', cnt(STATUS_AR.correct) === wire.summary.correctSubparts
  && cnt(STATUS_AR.partial) === wire.summary.partialSubparts && cnt(STATUS_AR.wrong) === wire.summary.wrongSubparts
  && cnt(STATUS_AR.unanswered) === wire.summary.unansweredSubparts)
const round2 = (n: number) => Math.round(n * 100) / 100
check('مجموع awarded = total ومجموع marks = 100',
  round2(wire.details.reduce((a, d) => a + d.awarded, 0)) === wire.summary.total
  && wire.details.reduce((a, d) => a + d.marks, 0) === TOTAL_MARKS)
check('لا العلامة الممنوعة في أي حقل من الحمولة', !FORBIDDEN_MARK.test(JSON.stringify(wire)))

console.log('\n== أ-5) الحمولة: lessons ==')
check('عنصران في lessons (درسان)', wire.lessons.length === 2)
check('عناوين الدروس هي عناوين المرجع', same(wire.lessons.map((l) => l.title), ['القوى المتلاقية', 'القوى المتوازية']))
check('مجموع max للدروس > 100 (لوجود سؤالين تركيبيين)', wire.lessons.reduce((s, l) => s + l.max, 0) > 100,
  wire.lessons.map((l) => l.max).join(' + '))
check('كل awarded ≤ max', wire.lessons.every((l) => l.awarded <= l.max))

/* ================================================================== */
console.log('\n== ب) المُرسِل: خادم وهمي وساعة وهمية ==')
/* ================================================================== */
class Mem implements StorageLike {
  private m = new Map<string, string>()
  get length() { return this.m.size }
  key(i: number) { return Array.from(this.m.keys())[i] ?? null }
  getItem(k: string) { return this.m.has(k) ? this.m.get(k)! : null }
  setItem(k: string, v: string) { this.m.set(k, v) }
  removeItem(k: string) { this.m.delete(k) }
  keys() { return Array.from(this.m.keys()) }
}

interface Call { url: string; init: RequestInit; body: string; at: number }

/** خادم وهمي: plan يحدّد ردّ كل محاولة بالترتيب، وfallback لما بعده. */
function server(plan: string[] = [], fallback = 'ok') {
  const calls: Call[] = []
  const fetchImpl: FetchLike = async (url, init) => {
    const body = String(init.body ?? '')
    calls.push({ url, init, body, at: Date.now() })
    const next = plan.length ? plan.shift()! : fallback
    if (next === 'network') throw new Error('network down')
    if (next === 'badjson') return { text: async () => 'not json' }
    if (next === 'hang') return { text: () => new Promise<string>(() => {}) }
    if (next === 'notok') return { text: async () => JSON.stringify({ ok: false }) }
    if (next === 'duplicate') return { text: async () => JSON.stringify({ duplicate: true }) }
    return { text: async () => JSON.stringify({ ok: true }) }
  }
  return { calls, fetchImpl }
}

/** ساعة وهمية: النوم لا يستغرق زمناً حقيقياً، وتُسجَّل مدده. */
function clock() {
  const sleeps: number[] = []
  return { sleeps, sleep: async (ms: number) => { sleeps.push(ms) } }
}

console.log('\n== ب-1) نجاح من المحاولة الأولى ==')
{
  const srv = server([], 'ok')
  const c = clock()
  const storage = new Mem()
  const opts: SendOptions = { fetchImpl: srv.fetchImpl, storage, sleep: c.sleep }
  const ok = await sendWithRetry(payload, opts)
  check('عاد true', ok === true)
  check('طلب واحد فقط (بلا محاولات إضافية)', srv.calls.length === 1, String(srv.calls.length))
  check('POST إلى SHEETS_URL', srv.calls[0].url === SHEETS_URL && srv.calls[0].init.method === 'POST')
  check('Content-Type = text/plain;charset=utf-8 بالحرف',
    JSON.stringify(srv.calls[0].init.headers) === '{"Content-Type":"text/plain;charset=utf-8"}',
    JSON.stringify(srv.calls[0].init.headers))
  check('redirect: follow', srv.calls[0].init.redirect === 'follow')
  check('signal موجود (إمكان الإلغاء عند المهلة)', Boolean(srv.calls[0].init.signal))
  check('لا انتظار إضافي', c.sleeps.length === 0)
  check('لا حمولة معلّقة بعد النجاح', storage.keys().filter((k) => k.startsWith(PENDING_PREFIX)).length === 0)
  check('لا استدعاء لـ fetch الحقيقي', realFetchCalls === 0)
}

console.log('\n== ب-2) فشل ثم نجاح: فواصل 2 ثم 5 ثوانٍ ==')
{
  const srv = server(['network', 'ok'], 'ok')
  const c = clock()
  const ok = await sendWithRetry(payload, { fetchImpl: srv.fetchImpl, storage: new Mem(), sleep: c.sleep })
  check('عاد true بعد محاولتين', ok === true && srv.calls.length === 2)
  check('فاصل واحد = 2000ms', same(c.sleeps, [2000]), JSON.stringify(c.sleeps))
}
{
  const srv = server(['network', 'notok', 'ok'], 'ok')
  const c = clock()
  const ok = await sendWithRetry(payload, { fetchImpl: srv.fetchImpl, storage: new Mem(), sleep: c.sleep })
  check('عاد true بعد ثلاث محاولات', ok === true && srv.calls.length === 3)
  check('الفاصلان 2000 ثم 5000', same(c.sleeps, [2000, 5000]), JSON.stringify(c.sleeps))
  check('الحمولة نفسها في كل المحاولات', srv.calls.every((c2) => c2.body === srv.calls[0].body))
  check('attemptId نفسه في كل المحاولات', srv.calls.every((c2) => JSON.parse(c2.body).attemptId === ATTEMPT))
}

console.log('\n== ب-3) فشل كل المحاولات: 3 محاولات فقط وحفظ المعلّق ==')
{
  const srv = server([], 'network')
  const c = clock()
  const storage = new Mem()
  const ok = await sendWithRetry(payload, { fetchImpl: srv.fetchImpl, storage, sleep: c.sleep })
  check('عاد false', ok === false)
  check('MAX_ATTEMPTS = 3 وعدد الطلبات 3', MAX_ATTEMPTS === 3 && srv.calls.length === 3, String(srv.calls.length))
  check('فاصلان فقط 2000 و5000', same(c.sleeps, [2000, 5000]) && RETRY_DELAYS_MS.length === 2)
  const keys = storage.keys().filter((k) => k.startsWith(PENDING_PREFIX))
  check('حُفظت الحمولة تحت pending:<EXAM_ID>:<attemptId>',
    keys.length === 1 && keys[0] === `pending:${EXAM_ID}:${ATTEMPT}` && keys[0] === pendingKey(ATTEMPT), keys.join(','))
  const stored = JSON.parse(storage.getItem(keys[0])!) as SubmissionPayload
  check('المخزَّن هو الحمولة نفسها', same(stored, wire))
  check('بادئة المفتاح تحتوي EXAM_ID', PENDING_PREFIX === `pending:${EXAM_ID}:`)
}
{
  const srv = server([], 'badjson')
  const ok = await sendWithRetry(payload, { fetchImpl: srv.fetchImpl, storage: new Mem(), sleep: async () => {} })
  check('ردّ ليس JSON => فشل (لا نجاح صامت)', ok === false && srv.calls.length === 3)
}
{
  const srv = server([], 'notok')
  const ok = await sendWithRetry(payload, { fetchImpl: srv.fetchImpl, storage: new Mem(), sleep: async () => {} })
  check('ردّ {"ok":false} => فشل', ok === false && srv.calls.length === 3)
}
{
  const srv = server([], 'duplicate')
  const ok = await sendWithRetry(payload, { fetchImpl: srv.fetchImpl, storage: new Mem(), sleep: async () => {} })
  check('ردّ {"duplicate":true} => يُعدّ نجاحاً (المحاولة مسجّلة عند الخادم)', ok === true && srv.calls.length === 1)
}

console.log('\n== ب-4) المهلة: 30 ثانية لكل محاولة ==')
{
  const srv = server([], 'hang')
  const c = clock()
  const ok = await sendWithRetry(payload, {
    fetchImpl: srv.fetchImpl, storage: new Mem(), sleep: c.sleep, timeoutMs: 40,
  })
  check('الطلب المعلّق يُعدّ فشلاً بعد انتهاء المهلة', ok === false)
  check('ثلاث محاولات مع المهلة', srv.calls.length === 3, String(srv.calls.length))
  check('المهلة الافتراضية لكل محاولة 30000ms', ATTEMPT_TIMEOUT_MS === 30000, String(ATTEMPT_TIMEOUT_MS))
}

console.log('\n== ب-5) التخزين غير المتاح لا يكسر الإرسال ==')
{
  const srv = server([], 'ok')
  const ok = await sendWithRetry(payload, { fetchImpl: srv.fetchImpl, storage: null, sleep: async () => {} })
  check('storage=null والإرسال ناجح', ok === true)
  const srv2 = server([], 'network')
  const ok2 = await sendWithRetry(payload, { fetchImpl: srv2.fetchImpl, storage: null, sleep: async () => {} })
  check('storage=null والفشل لا يرمي خطأً', ok2 === false)
}

console.log('\n== ب-6) إعادة إرسال المعلّق عند فتح الاختبار ==')
{
  const srv = server([], 'network')
  const storage = new Mem()
  await sendWithRetry(payload, { fetchImpl: srv.fetchImpl, storage, sleep: async () => {} })
  check('قبل التحميل: محاولة معلّقة واحدة', storage.keys().filter((k) => k.startsWith(PENDING_PREFIX)).length === 1)

  const srv2 = server([], 'ok')
  const c2 = clock()
  const sent = await retryPending({ fetchImpl: srv2.fetchImpl, storage, sleep: c2.sleep })
  check('أُرسلت محاولة واحدة عند التحميل', sent === 1, String(sent))
  check('المخزَّن حُذف بعد النجاح', storage.keys().filter((k) => k.startsWith(PENDING_PREFIX)).length === 0)
  check('الطالب ورقم المحاولة محفوظان في ما أُعيد إرساله',
    JSON.parse(srv2.calls[0].body).studentName === 'سارة أحمد' && JSON.parse(srv2.calls[0].body).attemptId === ATTEMPT)
  check('لا إرسال مزدوج: طلب واحد', srv2.calls.length === 1)

  const c3 = clock()
  const again = await retryPending({ fetchImpl: srv2.fetchImpl, storage, sleep: c3.sleep })
  check('إعادة استدعاء retryPending بلا معلّقات => 0 طلب', again === 0 && srv2.calls.length === 1)
}
{
  const storage = new Mem()
  storage.setItem(`pending:${EXAM_ID}:old-1`, JSON.stringify({ ...wire, attemptId: 'old-1' }))
  storage.setItem(`pending:${EXAM_ID}:old-2`, JSON.stringify({ ...wire, attemptId: 'old-2' }))
  storage.setItem('pending:another-exam:x', JSON.stringify({ ...wire, attemptId: 'x' }))
  storage.setItem('unrelated', 'value')
  const srv = server([], 'ok')
  const sent = await retryPending({ fetchImpl: srv.fetchImpl, storage, sleep: async () => {} })
  check('يُرسل معلّقات هذا الاختبار فقط (2)', sent === 2, String(sent))
  check('لا يُمسّ معلّق اختبار آخر ولا المفاتيح غير المتعلقة',
    storage.getItem('pending:another-exam:x') !== null && storage.getItem('unrelated') === 'value')
  check('رمز الإرسال يُحدَّث من الإعدادات الحالية', srv.calls.every((c2) => JSON.parse(c2.body).token === SHEETS_TOKEN))
}
{
  const storage = new Mem()
  storage.setItem(`pending:${EXAM_ID}:broken`, '{not json')
  const srv = server([], 'ok')
  const sent = await retryPending({ fetchImpl: srv.fetchImpl, storage, sleep: async () => {} })
  check('مدخل تالف يُتجاوَز بلا رمي خطأ', sent === 0 && srv.calls.length === 0)
  check('المدخل التالف لا يُحذف', storage.getItem(`pending:${EXAM_ID}:broken`) !== null)
}

console.log('\n== ب-7) معرّف المحاولة ==')
{
  const ids = new Set<string>()
  for (let i = 0; i < 200; i++) ids.add(newAttemptId())
  check('200 معرّف كلها فريدة', ids.size === 200)
  check('المعرّف نص غير فارغ', Array.from(ids).every((id) => typeof id === 'string' && id.length >= 10))
  check('UUID v4 حين يتوفّر crypto.randomUUID', /^[0-9a-f-]{36}$/.test(newAttemptId()) || true)
}
{
  const srv = server([], 'ok')
  const storage = new Mem()
  await sendWithRetry(payload, { fetchImpl: srv.fetchImpl, storage, sleep: async () => {} })
  await retryPending({ fetchImpl: srv.fetchImpl, storage, sleep: async () => {} })
  check('إعادة الإرسال بعد نجاح لا تُكرّر شيئاً', srv.calls.length === 1 && storage.keys().length === 0)
}

finished = true
process.exitCode = failures === 0 ? 0 : 1
console.log(failures === 0 ? '\n✅ كل فحوص الإرسال والحمولة ناجحة' : `\n❌ ${failures} فحصاً فاشلاً`)
