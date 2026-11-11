/**
 * اختبارات إرسال النتيجة إلى المعلّم (src/exam/submit.ts):
 *   أ) بناء الحمولة: أسماء الحقول بالضبط، مدخل واحد لكل فرع، والمجاميع تطابق summarize().
 *   ب) المُرسِل مع fetch وهمي: نجاح · فشل ثم إعادة · إعادة إرسال آمنة عند التكرار ·
 *      الحفظ في localStorage عند فشل كل المحاولات · إعادة إرسال المعلّق عند تحميل التطبيق.
 *
 * لا يُجرى أي اتصال حقيقي: كل الطلبات تذهب إلى خادم وهمي داخل الاختبار، وfetch العام معطَّل،
 * والانتظار بين المحاولات (2 ثم 5 ثوانٍ) وهمي كذلك فلا ينتظر الاختبار فعلياً.
 *
 * التشغيل (من مجلد grade5-math-unit1):
 *   npx esbuild tests/submit.test.ts --bundle --platform=node --format=esm --loader:.css=empty \
 *     --outfile=.tmp-test/submit.test.mjs --log-level=warning && node .tmp-test/submit.test.mjs
 */
import { EXAM_ID, SHEETS_TOKEN, SHEETS_URL } from '../src/config'
import { QUESTIONS, SUBPART_COUNT } from '../src/exam/questions'
import { gradeAll, summarize, buildReport, validateReport, gradeLabel, STATUS_AR, type AttemptMeta } from '../src/exam/report'
import {
  buildPayload, newAttemptId, sendWithRetry, retryPending, pendingKey,
  MAX_ATTEMPTS, PENDING_PREFIX, RETRY_DELAYS_MS,
  type FetchLike, type SendOptions, type StorageLike, type SubmissionPayload,
} from '../src/exam/submit'
import { EXAM_TITLE, LESSONS, LESSON_BY_ID, TOTAL_MARKS, type Subpart } from '../src/exam/types'
import type { Answers, AnswerValue, TfAnswer } from '../src/exam/grading'
import { plainMath } from '../src/lib/mathx'

let failures = 0
// إن انتهى التشغيل قبل اكتمال الفحوص (وعد لم يُحسم مثلاً) فالنتيجة فشل، لا نجاح صامت
let finished = false
process.exitCode = 1
process.on('exit', () => { if (!finished) console.log('\n❌ لم يكتمل تشغيل الاختبار') })
function check(name: string, cond: boolean, extra = '') {
  if (!cond) { failures++; console.log('  ✗ ' + name + (extra ? ' → ' + extra : '')) }
  else console.log('  ✓ ' + name + (extra ? ' → ' + extra : ''))
}
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)

/* ---- حارس: أي استدعاء لـ fetch الحقيقي يُسجَّل ويُرفض (يجب أن يبقى العدد صفراً) ---- */
let realFetchCalls = 0
;(globalThis as any).fetch = () => {
  realFetchCalls++
  return Promise.reject(new Error('real fetch is disabled in tests'))
}

/* ------------------------------------------------------------------ */
/* تسليم وهمي: ترتيب غير ترتيب الكتاب، وإجابات صحيحة وجزئية وخاطئة وفارغة */
/* ------------------------------------------------------------------ */

/** الإجابة النموذجية لكل نوع فرع (كما في tests/logic.test.ts). */
function correctAnswer(sp: Subpart): AnswerValue {
  switch (sp.kind) {
    case 'numeric': case 'protractor': case 'drawangle': case 'text': case 'grid':
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
answers['q15a'] = { N: '(3,6)', M: '(3,6)', K: '(0,5)', T: '(5,0)' } // مطابقة ناقصة
answers['q13c'] = ['i15', 'i42', 'i130', 'i90', 'i175'] // ترتيب ناقص
answers['q4e'] = ['o1', 'o3', 'o4'] // اختيار متعدد فيه خيار خاطئ
answers['q17b'] = 'الناتج 6245' // تعليل ناقص
answers['q1d'] = { value: 'false', correction: 'غير صحيح' } // صواب/خطأ بتصويب ناقص
answers['q6a'] = '856111' // ناتج خاطئ
for (const id of ['q2a', 'q9b', 'q3b']) delete answers[id] // فروع بلا إجابة
for (const sp of QUESTIONS.find((q) => q.id === 'q20')!.subparts) answers[sp.id] = '0' // سؤال أُجيب عن كل فروعه بإجابة خاطئة
for (const sp of QUESTIONS.find((q) => q.id === 'q11')!.subparts) delete answers[sp.id] // سؤال كامل بلا إجابة (علامته 0)

// الطالب يرى الأسئلة بترتيب مخلوط: هنا تدوير ثابت (السؤال 8 في الكتاب يُعرض أولاً)
const order = [...QUESTIONS.slice(7), ...QUESTIONS.slice(0, 7)]
const meta: AttemptMeta = {
  studentName: 'سارة أحمد',
  startAt: new Date('2026-11-11T07:00:05.250Z'),
  submitAt: new Date('2026-11-11T07:47:38.900Z'),
  elapsedMs: 2853650,
}
const results = gradeAll(order, answers)
const sum = summarize(results)
const report = buildReport(meta, results)
const ATTEMPT = '3f0c2a52-7d1e-4c58-9a6b-1f2e3d4c5b6a'
const payload = buildPayload({ attemptId: ATTEMPT, meta, order, answers, reportText: report })
const wire = JSON.parse(JSON.stringify(payload)) as SubmissionPayload // كما يصل إلى الخادم

/* ================================================================== */
console.log('\n== أ-1) الحمولة: أسماء الحقول بالضبط ==')
const TOP = ['token', 'attemptId', 'examId', 'examTitle', 'studentName', 'startAt', 'submitAt', 'elapsedSec', 'summary', 'lessons', 'details', 'reportText']
const SUMMARY = ['total', 'max', 'percentage', 'gradeLabel', 'fullQuestions', 'partialQuestions', 'wrongQuestions', 'correctSubparts', 'partialSubparts', 'wrongSubparts', 'unansweredSubparts']
const LESSON = ['title', 'awarded', 'max']
const DETAIL = ['q', 'qTitle', 'lessons', 'label', 'status', 'awarded', 'marks', 'studentAnswer', 'correctAnswer']
check('الحقول العليا (12) بالأسماء والترتيب المطلوبين', same(Object.keys(wire), TOP), Object.keys(wire).join(', '))
check('حقول summary (11)', same(Object.keys(wire.summary), SUMMARY), Object.keys(wire.summary).join(', '))
check('حقول كل عنصر في lessons', wire.lessons.every((l) => same(Object.keys(l), LESSON)), LESSON.join(', '))
check('حقول كل عنصر في details', wire.details.every((d) => same(Object.keys(d), DETAIL)), DETAIL.join(', '))
check('لا يضيع أي حقل عند التحويل إلى JSON (لا undefined ولا NaN)', same(wire, payload)
  && !/:null[,}\]]/.test(JSON.stringify(payload)))
check('أنواع الحقول العليا', typeof wire.token === 'string' && typeof wire.attemptId === 'string' && typeof wire.examId === 'string'
  && typeof wire.examTitle === 'string' && typeof wire.studentName === 'string' && typeof wire.startAt === 'string'
  && typeof wire.submitAt === 'string' && typeof wire.elapsedSec === 'number' && Array.isArray(wire.lessons)
  && Array.isArray(wire.details) && typeof wire.reportText === 'string')
check('أنواع حقول details', wire.details.every((d) => typeof d.q === 'number' && typeof d.qTitle === 'string' && typeof d.lessons === 'string'
  && typeof d.label === 'string' && typeof d.status === 'string' && typeof d.awarded === 'number' && typeof d.marks === 'number'
  && typeof d.studentAnswer === 'string' && typeof d.correctAnswer === 'string'))

console.log('\n== أ-2) الحمولة: البيانات الوصفية ==')
check('token و examId من src/config.ts', wire.token === SHEETS_TOKEN && wire.examId === EXAM_ID, wire.examId)
check('attemptId كما أُعطي', wire.attemptId === ATTEMPT)
check('examTitle = EXAM_TITLE', wire.examTitle === EXAM_TITLE, wire.examTitle)
check('studentName', wire.studentName === 'سارة أحمد')
check('startAt و submitAt بصيغة ISO', wire.startAt === '2026-11-11T07:00:05.250Z' && wire.submitAt === '2026-11-11T07:47:38.900Z'
  && new Date(wire.startAt).getTime() === meta.startAt.getTime() && new Date(wire.submitAt).getTime() === meta.submitAt.getTime(), `${wire.startAt} → ${wire.submitAt}`)
check('elapsedSec عدد صحيح من الثواني (كالمدة المعروضة)', wire.elapsedSec === 2853 && Number.isInteger(wire.elapsedSec), String(wire.elapsedSec))
check('reportText = نص التقرير الكامل', wire.reportText === report && wire.reportText.length > 50000, `${wire.reportText.length} حرفاً`)
check('التقرير نفسه يجتاز validateReport', validateReport(wire.reportText, meta, results).length === 0)

console.log('\n== أ-3) الحمولة: summary يطابق summarize() ==')
check('التسليم الوهمي يشمل الحالات الأربع وأسئلة كاملة وجزئية وخاطئة', sum.correctSubparts > 0 && sum.partialSubparts > 0 && sum.wrongSubparts > 0
  && sum.unansweredSubparts > 0 && new Set([sum.full, sum.partial, sum.wrong]).size === 3
  && new Set([sum.correctSubparts, sum.partialSubparts, sum.wrongSubparts, sum.unansweredSubparts]).size === 4,
  `أسئلة ${sum.full}/${sum.partial}/${sum.wrong} · فروع ${sum.correctSubparts}/${sum.partialSubparts}/${sum.wrongSubparts}/${sum.unansweredSubparts}`)
check('total = Summary.total', wire.summary.total === sum.total, String(wire.summary.total))
check('max = TOTAL_MARKS', wire.summary.max === TOTAL_MARKS && wire.summary.max === 100)
check('percentage = Summary.percentage', wire.summary.percentage === sum.percentage, String(wire.summary.percentage))
check('gradeLabel = gradeLabel(percentage)', wire.summary.gradeLabel === gradeLabel(sum.percentage), wire.summary.gradeLabel)
check('fullQuestions / partialQuestions / wrongQuestions = full / partial / wrong',
  wire.summary.fullQuestions === sum.full && wire.summary.partialQuestions === sum.partial && wire.summary.wrongQuestions === sum.wrong)
check('عدّادات الفروع = الحقول المماثلة في Summary', wire.summary.correctSubparts === sum.correctSubparts
  && wire.summary.partialSubparts === sum.partialSubparts && wire.summary.wrongSubparts === sum.wrongSubparts
  && wire.summary.unansweredSubparts === sum.unansweredSubparts)
check('عدّادات الأسئلة مجموعها 20 وعدّادات الفروع مجموعها عدد الفروع',
  wire.summary.fullQuestions + wire.summary.partialQuestions + wire.summary.wrongQuestions === QUESTIONS.length
  && wire.summary.correctSubparts + wire.summary.partialSubparts + wire.summary.wrongSubparts + wire.summary.unansweredSubparts === SUBPART_COUNT)
check('الأرقام نفسها مكتوبة في التقرير', report.includes(`العلامة النهائية        : ${wire.summary.total} من 100`)
  && report.includes(`التقدير                 : ${wire.summary.gradeLabel}`))

console.log('\n== أ-4) الحمولة: details — مدخل واحد لكل فرع ==')
const flat = results.flatMap((r) => r.subparts.map((s) => ({ r, s })))
check(`عدد المداخل = عدد الفروع (${SUBPART_COUNT})`, wire.details.length === SUBPART_COUNT && flat.length === SUBPART_COUNT, String(wire.details.length))
check('لا تكرار: كل (سؤال، فرع) يظهر مرّة واحدة', new Set(wire.details.map((d) => `${d.q}/${d.label}`)).size === SUBPART_COUNT)
check('كل فرع من فروع الاختبار ممثَّل بمدخله وبالترتيب المعروض', flat.every(({ r, s }, i) =>
  wire.details[i].q === r.displayNumber && wire.details[i].label === s.sp.label && wire.details[i].marks === s.sp.marks))
check('q = رقم العرض لا رقم السؤال في الكتاب', wire.details[0].q === 1 && wire.details[0].qTitle === plainMath(QUESTIONS[7].title)
  && wire.details[wire.details.length - 1].q === 20 && same([...new Set(wire.details.map((d) => d.q))], Array.from({ length: 20 }, (_, i) => i + 1)))
check('qTitle نص صرف كما في التقرير', flat.every(({ r }, i) => wire.details[i].qTitle === plainMath(r.q.title)
  && report.includes(`السؤال ${r.displayNumber} — ${wire.details[i].qTitle}`)))
check('lessons = عناوين الدروس موصولة بـ " + "', flat.every(({ r }, i) =>
  wire.details[i].lessons === r.q.lessons.map((id) => LESSON_BY_ID[id].title).join(' + '))
  && wire.details.some((d) => d.lessons.includes(' + ')) && wire.details.every((d) => d.lessons.split(' + ').every((t) => LESSONS.some((l) => l.title === t))))
check('status = نص الحالة العربي المستعمل في التقرير', flat.every(({ s }, i) => wire.details[i].status === STATUS_AR[s.res.status])
  && same([...new Set(wire.details.map((d) => d.status))].sort(), Object.values(STATUS_AR).sort()))
check('awarded و marks كما صُحّحت', flat.every(({ s }, i) => wire.details[i].awarded === s.res.awarded && wire.details[i].marks === s.sp.marks))
check('studentAnswer و correctAnswer بالنص الصرف نفسه في التقرير', flat.every(({ s }, i) =>
  wire.details[i].studentAnswer === plainMath(s.studentText) && wire.details[i].correctAnswer === plainMath(s.sp.answerText)
  && report.includes(`    إجابة الطالب     : ${wire.details[i].studentAnswer}`) && report.includes(`    الإجابة الصحيحة  : ${wire.details[i].correctAnswer}`)))
check('لا ترميز LaTeX خام ($) في النصوص', wire.details.every((d) => !/\$/.test(d.qTitle + d.studentAnswer + d.correctAnswer)))
check('سطر كل فرع في التقرير يطابق مدخله', flat.every(({ s }, i) =>
  report.includes(`  الفرع (${s.sp.label}) — [${wire.details[i].awarded} / ${wire.details[i].marks}] — ${wire.details[i].status}`)))
const cnt = (st: string) => wire.details.filter((d) => d.status === st).length
check('عدد كل حالة في details = عدّادات summary', cnt(STATUS_AR.correct) === wire.summary.correctSubparts && cnt(STATUS_AR.partial) === wire.summary.partialSubparts
  && cnt(STATUS_AR.wrong) === wire.summary.wrongSubparts && cnt(STATUS_AR.unanswered) === wire.summary.unansweredSubparts)
const round2 = (n: number) => Math.round(n * 100) / 100
check('مجموع awarded = total ومجموع marks = 100', round2(wire.details.reduce((a, d) => a + d.awarded, 0)) === wire.summary.total
  && wire.details.reduce((a, d) => a + d.marks, 0) === TOTAL_MARKS, String(round2(wire.details.reduce((a, d) => a + d.awarded, 0))))

console.log('\n== أ-5) الحمولة: lessons — أرقام التقرير نفسها ==')
const lessonLines = report.split('\r\n')
const fromReport = LESSONS.map((l) => {
  const line = lessonLines.find((x) => x.startsWith(`  ${l.title.padEnd(28, ' ')} : `)) ?? ''
  const m = / : ([\d.]+) \/ (\d+)$/.exec(line)
  return { title: l.title, awarded: m ? Number(m[1]) : NaN, max: m ? Number(m[2]) : NaN }
})
check('8 دروس بعناوينها وترتيبها', wire.lessons.length === 8 && same(wire.lessons.map((l) => l.title), LESSONS.map((l) => l.title)))
check('awarded و max لكل درس كما في سطور «توزيع العلامات على الدروس»', same(wire.lessons, fromReport),
  wire.lessons.map((l) => `${l.awarded}/${l.max}`).join(' · '))
check('كل درس: 0 ≤ awarded ≤ max', wire.lessons.every((l) => l.awarded >= 0 && l.awarded <= l.max && l.max > 0))

console.log('\n== أ-6) معرّف المحاولة ==')
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
const ids = Array.from({ length: 500 }, () => newAttemptId())
check('crypto.randomUUID عند توافره', ids.every((id) => UUID.test(id)), ids[0])
check('فريد في كل مرّة', new Set(ids).size === ids.length)
const cryptoProp = Object.getOwnPropertyDescriptor(globalThis, 'crypto')!
Object.defineProperty(globalThis, 'crypto', { value: {}, configurable: true })
const fallbackIds = Array.from({ length: 500 }, () => newAttemptId())
Object.defineProperty(globalThis, 'crypto', { value: undefined, configurable: true })
const noCryptoId = newAttemptId()
Object.defineProperty(globalThis, 'crypto', cryptoProp)
check('البديل بلا randomUUID: طابع زمني + سلسلة عشوائية', fallbackIds.every((id) => /^\d{13}-[0-9a-z]{6,16}$/.test(id)) && /^\d{13}-[0-9a-z]{6,16}$/.test(noCryptoId), fallbackIds[0])
check('البديل فريد كذلك', new Set(fallbackIds).size === fallbackIds.length)
check('المفتاح المعلّق = pending:<EXAM_ID>:<attemptId>', pendingKey(ATTEMPT) === `pending:grade5-math-unit1:${ATTEMPT}` && PENDING_PREFIX === `pending:${EXAM_ID}:`, pendingKey(ATTEMPT))

/* ------------------------------------------------------------------ */
/* أدوات المُرسِل: fetch وهمي + انتظار وهمي + تخزين وهمي              */
/* ------------------------------------------------------------------ */
interface Call { url: string; init: RequestInit; body: SubmissionPayload }
/** fetch وهمي: يعيد المعالجُ نص ردّ الخادم، أو يرمي خطأً (انقطاع الشبكة / ردّ محجوب بـ CORS). */
function fakeFetch(handler: (n: number, call: Call) => string | Promise<string>) {
  const calls: Call[] = []
  const fn: FetchLike = async (url, init) => {
    const call: Call = { url, init, body: JSON.parse(String(init.body)) }
    calls.push(call)
    const text = await handler(calls.length, call)
    return { text: async () => text }
  }
  return { fn, calls }
}
class MemStorage implements StorageLike {
  map = new Map<string, string>()
  get length() { return this.map.size }
  key(i: number) { return [...this.map.keys()][i] ?? null }
  getItem(k: string) { return this.map.has(k) ? this.map.get(k)! : null }
  setItem(k: string, v: string) { this.map.set(k, String(v)) }
  removeItem(k: string) { this.map.delete(k) }
  keys() { return [...this.map.keys()] }
}
/** متصفح يمنع التخزين: كل استدعاء يرمي خطأً. */
const brokenStorage: StorageLike = {
  get length(): number { throw new Error('SecurityError') },
  key() { throw new Error('SecurityError') },
  getItem() { throw new Error('SecurityError') },
  setItem() { throw new Error('QuotaExceededError') },
  removeItem() { throw new Error('SecurityError') },
}
function env(fetchImpl: FetchLike, storage: StorageLike | null = new MemStorage()) {
  const sleeps: number[] = []
  const opts: SendOptions = { fetchImpl, storage, sleep: async (ms) => { sleeps.push(ms) } }
  return { opts, sleeps, storage }
}
const OK = JSON.stringify({ ok: true })
const netDown = (): never => { throw new TypeError('Failed to fetch') }
const HTML_ERROR = '<!DOCTYPE html><html><body>Service error</body></html>'

async function senderTests() {
  console.log('\n== ب-1) الإرسال: نجاح من المحاولة الأولى ==')
  {
    const f = fakeFetch(() => OK)
    const e = env(f.fn)
    const ok = await sendWithRetry(payload, e.opts)
    const init = f.calls[0]?.init ?? {}
    check('النتيجة true', ok === true)
    check('طلب واحد إلى SHEETS_URL', f.calls.length === 1 && f.calls[0].url === SHEETS_URL)
    check('method: POST', init.method === 'POST')
    check('Content-Type: text/plain;charset=utf-8 فقط (لا application/json)', same(init.headers, { 'Content-Type': 'text/plain;charset=utf-8' }))
    check('body = JSON.stringify(payload)', init.body === JSON.stringify(payload) && same(f.calls[0].body, payload))
    check('redirect: follow', init.redirect === 'follow')
    check('لا mode ولا خيارات أخرى سوى signal (مهلة المحاولة)', same(Object.keys(init).sort(), ['body', 'headers', 'method', 'redirect', 'signal']) && init.signal instanceof AbortSignal && !init.signal.aborted)
    check('لا انتظار ولا تخزين', e.sleeps.length === 0 && e.storage!.length === 0)
  }

  console.log('\n== ب-2) الإرسال: فشل ثم إعادة المحاولة ==')
  {
    const f = fakeFetch((n) => (n === 1 ? netDown() : OK))
    const e = env(f.fn)
    const ok = await sendWithRetry(payload, e.opts)
    check('انقطاع الشبكة ثم نجاح ← true بمحاولتين', ok === true && f.calls.length === 2)
    check('انتظار 2 ثانية قبل المحاولة الثانية', same(e.sleeps, [2000]), e.sleeps.join(','))
    check('المحاولتان بالحمولة نفسها والمعرّف نفسه', f.calls[0].init.body === f.calls[1].init.body && f.calls[1].body.attemptId === ATTEMPT)
    check('لا شيء في التخزين بعد النجاح', e.storage!.length === 0)
  }
  {
    const f = fakeFetch((n) => (n === 1 ? JSON.stringify({ ok: false, error: 'busy' }) : n === 2 ? HTML_ERROR : OK))
    const e = env(f.fn)
    const ok = await sendWithRetry(payload, e.opts)
    check('ok:false ثم ردّ ليس JSON ثم نجاح ← true بثلاث محاولات', ok === true && f.calls.length === 3)
    check('الانتظار 2 ثم 5 ثوانٍ', same(e.sleeps, [2000, 5000]) && same(RETRY_DELAYS_MS, [2000, 5000]) && MAX_ATTEMPTS === 3, e.sleeps.join(','))
  }
  {
    // ردّ وصل لكن المتصفح يحجب قراءته (CORS): لا يُعدّ نجاحاً أبداً
    const calls: number[] = []
    const fn: FetchLike = async () => {
      calls.push(1)
      return { text: async () => { if (calls.length === 1) throw new TypeError('opaque response'); return OK } }
    }
    const e = env(fn)
    const ok = await sendWithRetry(payload, e.opts)
    check('ردّ تعذّرت قراءته (CORS) ← فشل ثم إعادة', ok === true && calls.length === 2 && same(e.sleeps, [2000]))
  }
  for (const [name, body] of [
    ['ردّ فارغ', ''], ['{}', '{}'], ['null', 'null'], ['ok:"true" نصاً', '{"ok":"true"}'], ['ok:1', '{"ok":1}'],
    ['مصفوفة', '[true]'], ['ok:false', '{"ok":false}'], ['نص "ok"', '"ok"'],
  ] as const) {
    const f = fakeFetch(() => body)
    const e = env(f.fn)
    const ok = await sendWithRetry(payload, e.opts)
    check(`ليس نجاحاً: ${name}`, ok === false && f.calls.length === 3 && e.storage!.length === 1)
  }

  console.log('\n== ب-3) الإرسال: إعادة آمنة عند التكرار (المعرّف نفسه) ==')
  {
    // خادم وهمي يتجاهل المعرّف المكرّر؛ ردّه الأول يضيع في الطريق فيعيد التطبيق الإرسال
    const rows = new Map<string, SubmissionPayload>()
    let lost = 1
    const f = fakeFetch((_n, call) => {
      const duplicate = rows.has(call.body.attemptId)
      if (!duplicate) rows.set(call.body.attemptId, call.body)
      if (lost-- > 0) return netDown()
      return JSON.stringify(duplicate ? { ok: true, duplicate: true } : { ok: true })
    })
    const e = env(f.fn)
    const ok = await sendWithRetry(payload, e.opts)
    check('الردّ الأول ضاع ← أُعيد الإرسال بالمعرّف نفسه', f.calls.length === 2 && f.calls.every((c) => c.body.attemptId === ATTEMPT))
    check('duplicate:true يُعدّ نجاحاً', ok === true)
    check('صف واحد فقط في الجدول الوهمي', rows.size === 1 && same(rows.get(ATTEMPT), payload))
    check('لا شيء في التخزين', e.storage!.length === 0)
    const again = await sendWithRetry(payload, e.opts) // مثل زر «إعادة المحاولة» بعد وصول النتيجة فعلاً
    check('إعادة إرسال المحاولة نفسها لاحقاً: نجاح بلا صف جديد', again === true && rows.size === 1 && f.calls.length === 3)
  }
  {
    const f = fakeFetch(() => JSON.stringify({ duplicate: true }))
    const e = env(f.fn)
    check('{duplicate:true} وحدها نجاح', (await sendWithRetry(payload, e.opts)) === true && f.calls.length === 1)
  }

  console.log('\n== ب-4) الإرسال: فشل كل المحاولات ← الحفظ في localStorage ==')
  const store = new MemStorage()
  {
    const sizesDuringAttempts: number[] = []
    const f = fakeFetch(() => { sizesDuringAttempts.push(store.length); return netDown() })
    const e = env(f.fn, store)
    const ok = await sendWithRetry(payload, e.opts)
    check('النتيجة false بعد 3 محاولات بالضبط', ok === false && f.calls.length === 3, String(f.calls.length))
    check('الانتظار 2 ثم 5 ثوانٍ', same(e.sleeps, [2000, 5000]), e.sleeps.join(','))
    check('لم يُحفظ شيء قبل فشل المحاولات كلها', same(sizesDuringAttempts, [0, 0, 0]))
    check('حُفظت تحت pending:<EXAM_ID>:<attemptId>', same(store.keys(), [`pending:${EXAM_ID}:${ATTEMPT}`]), store.keys().join(','))
    check('المحفوظ هو الحمولة كاملة', same(JSON.parse(store.getItem(pendingKey(ATTEMPT)) ?? 'null'), payload))
  }
  {
    const f = fakeFetch(netDown)
    let threw = false
    let r1 = true, r2 = true, r3 = true
    try {
      r1 = await sendWithRetry(payload, env(f.fn, null).opts) // لا تخزين متاح
      r2 = await sendWithRetry(payload, env(f.fn, brokenStorage).opts) // كل استدعاء للتخزين يرمي خطأً
      const { opts } = env(f.fn)
      delete opts.storage // المسار الافتراضي: لا window ولا localStorage في هذه البيئة
      r3 = await sendWithRetry(payload, opts)
    } catch { threw = true }
    check('التخزين غير متاح أو يرمي أخطاء: لا استثناء والنتيجة false', !threw && r1 === false && r2 === false && r3 === false && f.calls.length === 9)
    const g = fakeFetch(() => OK)
    let okWithBroken = false
    try { okWithBroken = await sendWithRetry(payload, env(g.fn, brokenStorage).opts) } catch { threw = true }
    check('والإرسال الناجح لا يتأثر بتخزين معطّل', !threw && okWithBroken === true)
  }

  console.log('\n== ب-5) عند تحميل التطبيق: إعادة إرسال المعلّق ==')
  {
    const second: SubmissionPayload = { ...payload, attemptId: 'older-attempt-0002', studentName: 'ليان محمد' }
    store.setItem(pendingKey(second.attemptId), JSON.stringify(second))
    store.setItem('pending:another-exam:abc', '{"attemptId":"abc"}') // اختبار آخر على الموقع نفسه
    store.setItem('theme', 'dark') // مفتاح لا علاقة له
    store.setItem(pendingKey('corrupt'), '{not json') // مدخل تالف
    const before = store.keys().slice().sort()

    const down = fakeFetch(netDown)
    const e1 = env(down.fn, store)
    const sent0 = await retryPending(e1.opts)
    check('الخادم ما زال معطّلاً: لم يُرسل شيء وبقي كل شيء محفوظاً', sent0 === 0 && same(store.keys().slice().sort(), before))
    check('3 محاولات لكل حمولة معلّقة، ولا محاولة للمدخل التالف أو لاختبار آخر', down.calls.length === 6
      && same([...new Set(down.calls.map((c) => c.body.attemptId))].sort(), [ATTEMPT, second.attemptId].sort()))

    // الخادم يقبل إحداهما ويرفض الأخرى
    const picky = fakeFetch((_n, call) => JSON.stringify({ ok: call.body.attemptId === second.attemptId }))
    const sent1 = await retryPending(env(picky.fn, store).opts)
    check('تُحذف الحمولة التي نجحت فقط', sent1 === 1 && store.getItem(pendingKey(second.attemptId)) === null && store.getItem(pendingKey(ATTEMPT)) !== null)

    const up = fakeFetch(() => OK)
    const e3 = env(up.fn, store)
    const sent2 = await retryPending(e3.opts)
    check('الخادم يعمل: أُرسلت الحمولة الباقية كما حُفظت', sent2 === 1 && up.calls.length === 1 && up.calls[0].url === SHEETS_URL
      && same(up.calls[0].body, payload) && same(up.calls[0].init.headers, { 'Content-Type': 'text/plain;charset=utf-8' }))
    check('وحُذفت بعد النجاح', store.getItem(pendingKey(ATTEMPT)) === null)
    check('مفاتيح الاختبارات الأخرى وغيرها لم تُمسّ', store.getItem('pending:another-exam:abc') === '{"attemptId":"abc"}' && store.getItem('theme') === 'dark')
    check('بصمت ودون انتظار عند النجاح', e3.sleeps.length === 0)

    const idle = fakeFetch(() => OK)
    const sent3 = await retryPending(env(idle.fn, store).opts)
    check('لا شيء معلّق بعدها: لا طلبات', sent3 === 0 && idle.calls.length === 0)
  }
  {
    // StrictMode يشغّل تأثير التحميل مرّتين: يجب ألّا تُرسل الحمولة مرّتين
    const s = new MemStorage()
    s.setItem(pendingKey(ATTEMPT), JSON.stringify(payload))
    const f = fakeFetch(() => OK)
    const opts = env(f.fn, s).opts
    const [a, b] = await Promise.all([retryPending(opts), retryPending(opts)])
    check('استدعاءان متتاليان عند التحميل ← إرسال واحد', f.calls.length === 1 && a === 1 && b === 1 && s.length === 0)
  }
  {
    // حمولة حُفظت برمز قديم تُرسل بالرمز الحالي من src/config.ts
    const s = new MemStorage()
    s.setItem(pendingKey(ATTEMPT), JSON.stringify({ ...payload, token: 'old-token' }))
    const f = fakeFetch(() => OK)
    await retryPending(env(f.fn, s).opts)
    check('المعلّق يُرسل بالرمز الحالي', f.calls.length === 1 && f.calls[0].body.token === SHEETS_TOKEN && same({ ...f.calls[0].body }, payload))
  }
  {
    const f = fakeFetch(() => OK)
    let threw = false
    let a = -1, b = -1, c = -1
    try {
      a = await retryPending(env(f.fn, null).opts)
      b = await retryPending(env(f.fn, brokenStorage).opts)
      const { opts } = env(f.fn)
      delete opts.storage
      c = await retryPending(opts)
    } catch { threw = true }
    check('التخزين غير متاح: لا استثناء ولا طلبات', !threw && a === 0 && b === 0 && c === 0 && f.calls.length === 0)
  }

  console.log('\n== ب-6) مهلة المحاولة: اتصال معلّق بلا ردّ يُعدّ فشلاً ==')
  {
    const signals: AbortSignal[] = []
    const fn: FetchLike = (_url, init) => { signals.push(init.signal as AbortSignal); return new Promise(() => {}) } // لا يردّ أبداً
    const e = env(fn)
    const ok = await sendWithRetry(payload, { ...e.opts, timeoutMs: 15 })
    check('3 محاولات انتهت مهلتها ← false', ok === false && signals.length === 3)
    check('أُلغي كل طلب معلّق عند انتهاء مهلته', signals.every((s) => s.aborted))
    check('ثم حُفظت الحمولة لتُعاد لاحقاً', e.storage!.length === 1 && e.storage!.getItem(pendingKey(ATTEMPT)) !== null)
  }
  {
    const f = fakeFetch(() => new Promise<string>((r) => setTimeout(() => r(OK), 20)))
    const ok = await sendWithRetry(payload, { ...env(f.fn).opts, timeoutMs: 2000 })
    check('ردّ بطيء ضمن المهلة ← نجاح بمحاولة واحدة', ok === true && f.calls.length === 1)
  }

  console.log('\n== ب-7) إغلاق الصفحة أو إخفاؤها والإرسال جارٍ ==')
  {
    const g = globalThis as any
    const win = new EventTarget()
    const doc = Object.assign(new EventTarget(), { visibilityState: 'visible' })
    g.window = win
    g.document = doc
    try {
      const s = new MemStorage()
      let reply: (text: string) => void = () => {}
      const f = fakeFetch(() => new Promise<string>((r) => { reply = r }))
      const pending = sendWithRetry(payload, env(f.fn, s).opts)
      await new Promise((r) => setTimeout(r, 5))
      check('الإرسال جارٍ ولا شيء محفوظ', f.calls.length === 1 && s.length === 0)
      doc.dispatchEvent(new Event('visibilitychange'))
      check('الصفحة ما زالت ظاهرة: لا حفظ', s.length === 0)
      doc.visibilityState = 'hidden'
      doc.dispatchEvent(new Event('visibilitychange'))
      check('أُخفيت الصفحة والإرسال جارٍ ← حُفظت الحمولة فوراً بالمفتاح نفسه', same(s.keys(), [pendingKey(ATTEMPT)]) && same(JSON.parse(s.getItem(pendingKey(ATTEMPT))!), payload))
      s.removeItem(pendingKey(ATTEMPT))
      win.dispatchEvent(new Event('pagehide'))
      check('أُغلقت الصفحة (pagehide) ← حُفظت كذلك', same(s.keys(), [pendingKey(ATTEMPT)]))
      reply(OK)
      const ok = await pending
      check('وصل تأكيد الخادم ← حُذفت النسخة المحفوظة', ok === true && s.length === 0)
      win.dispatchEvent(new Event('pagehide'))
      doc.dispatchEvent(new Event('visibilitychange'))
      check('بعد انتهاء الإرسال لا يُحفظ شيء عند إغلاق الصفحة', s.length === 0)
    } finally {
      delete g.window
      delete g.document
    }
  }

  console.log('\n== ج) لا اتصال حقيقي ==')
  check('لم يُستدعَ fetch الحقيقي إطلاقاً', realFetchCalls === 0, String(realFetchCalls))
}

senderTests()
  .catch((err) => { failures++; console.log('  ✗ استثناء غير متوقع: ' + String(err && err.stack ? err.stack : err)) })
  .finally(() => {
    finished = true
    console.log(failures ? `\n❌ ${failures} فشل` : '\n✅ كل فحوص الإرسال نجحت')
    process.exit(failures ? 1 : 0)
  })
