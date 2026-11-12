/**
 * اختبارات إرسال النتيجة إلى المعلّم (src/lib/submit.ts) + عرض حالة الإرسال في صفحة النتيجة.
 *
 *   أ) بناء الحمولة: أسماء الحقول بالضبط، مدخل واحد لكل فرع، والمجاميع تطابق gradeExam().
 *   ب) المُرسِل مع خادم وهمي حقيقي على 127.0.0.1: نجاح · فشل ثم إعادة · مهلة المحاولة ·
 *      التكرار الآمن (duplicate) · الحفظ في localStorage عند فشل كل المحاولات ·
 *      إعادة إرسال المعلّق عند فتح الصفحة من جديد · عزل مفاتيح التخزين عن بقية الاختبارات.
 *   ج) عرض حالة الإرسال في صفحة النتيجة (sending/success/failed) وزر «إعادة إرسال النتيجة».
 *
 * لا يُجرى أي اتصال حقيقي بـ Google Apps Script: كل الطلبات تذهب إلى خادم وهمي محلي،
 * والانتظار بين المحاولات (2 ثم 5 ثوانٍ) وهمي فلا ينتظر الاختبار فعلياً.
 *
 * التشغيل (من مجلد grade8-chemistry-exam):
 *   npx esbuild tests/submit.test.ts --bundle --platform=node --format=esm --jsx=automatic \
 *     --external:react --external:react-dom --external:react-dom/server \
 *     --outfile=.tmp-test/submit.test.mjs --log-level=warning && node .tmp-test/submit.test.mjs
 */
import http from 'node:http'
import type { AddressInfo } from 'node:net'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { EXAM_ID, SHEETS_TOKEN } from '../src/config'
import { QUESTIONS, EXAM_META } from '../src/data/exam'
import type { Part } from '../src/data/exam'
import { gradeExam } from '../src/lib/grading'
import type { AnswerMap } from '../src/lib/grading'
import { buildReport, validateReport, reportFilename } from '../src/lib/report'
import {
  ATTEMPT_TIMEOUT_MS, MAX_ATTEMPTS, PENDING_PREFIX, RETRY_DELAYS_MS, STATUS_AR,
  buildPayload, gradeLabel, newAttemptId, pendingKey, retryPending, sendWithRetry,
  type FetchLike, type StorageLike, type SubmissionPayload,
} from '../src/lib/submit'
import { ResultsPage } from '../src/components/Review'

/* ---- حارس: أي استدعاء لـ fetch الحقيقي يُسجَّل ويُرفض (يجب أن يبقى العدد صفراً) ---- */
const nativeFetch = globalThis.fetch
let realFetchCalls = 0
;(globalThis as any).fetch = () => {
  realFetchCalls++
  return Promise.reject(new Error('real fetch is disabled in tests'))
}
const realFetch = (url: string, init: RequestInit) => nativeFetch(url, init)

let failures = 0
let checks = 0
let finished = false
process.exitCode = 1
process.on('exit', () => { if (!finished) console.log('\n❌ لم يكتمل تشغيل الاختبار') })
function check(name: string, cond: boolean, extra = '') {
  checks++
  if (!cond) { failures++; console.log('  ✗ ' + name + (extra ? ' → ' + extra : '')) }
  else console.log('  ✓ ' + name + (extra ? ' → ' + extra : ''))
}
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)
const near = (a: number, b: number, eps = 0.001) => Math.abs(a - b) < eps

/* ------------------------------------------------------------------ */
/* تسليم وهمي: إجابات صحيحة وجزئية وخاطئة وفارغة                        */
/* ------------------------------------------------------------------ */

const correctAnswer = (p: Part): unknown => {
  switch (p.type) {
    case 'mc':
    case 'lewis-select':
      if (p.type === 'lewis-select' && p.multi) return p.options.filter((o) => o.correct).map((o) => o.id)
      return p.options.find((o) => o.correct)?.id ?? p.options[0].id
    case 'multi': return p.options.filter((o) => o.correct).map((o) => o.id)
    case 'tf': return { judgment: p.answer, correction: p.answer ? '' : p.correctionGroups.map((g) => g[0]).join(' و ') }
    case 'fields': return Object.fromEntries(p.fields.map((f) => [f.id, f.answer]))
    case 'short': return p.groups.map((g) => g[0]).join(' و ')
    case 'order': return [...p.correct]
    case 'match': return Object.fromEntries(p.rows.map((r) => [r.id, r.answer]))
    case 'classification': return Object.fromEntries(p.items.map((r) => [r.id, r.answer]))
  }
}

const answers: AnswerMap = {}
for (const q of QUESTIONS) for (const p of q.parts) answers[p.id] = correctAnswer(p)
answers['q1a'] = { p: '11', n: '12', e: '11' }   // خانة خاطئة
answers['q4b'] = []                              // اختيار متعدد بلا اختيار
answers['q2c'] = 'لأن عدد البروتونات متساوٍ'      // عنصر واحد فقط من عنصري التعليل
answers['q13a'] = { ...(correctAnswer(QUESTIONS.find((q) => q.id === 'q13')!.parts[0]) as object), h2o: 'رابطة أيونية' }
delete answers['q7b']                            // جزء بلا إجابة
delete answers['q13c']

const START_MS = 1762930805250
const SUBMIT_MS = 1762933365900
const ELAPSED_S = Math.floor((SUBMIT_MS - START_MS) / 1000)
const order = [...QUESTIONS.slice(6), ...QUESTIONS.slice(0, 6)]
const summary = gradeExam(answers, order)
const ATTEMPT = '3f0c2a52-7d1e-4c58-9a6b-1f2e3d4c5b6a'
const reportText = buildReport({
  studentName: 'سارة أحمد', questions: order, answers, summary,
  startedAt: START_MS, submittedAt: SUBMIT_MS, elapsedSeconds: ELAPSED_S,
  attemptId: ATTEMPT, optionOrder: {},
})
const payload = buildPayload({
  attemptId: ATTEMPT, studentName: 'سارة أحمد', startedAt: START_MS, submittedAt: SUBMIT_MS,
  elapsedSeconds: ELAPSED_S, questions: order, answers, reportText,
})
const wire = JSON.parse(JSON.stringify(payload)) as SubmissionPayload

/* ================================================================== */
console.log('\n== أ-1) الحمولة: أسماء الحقول بالضبط ==')
const TOP = ['token', 'attemptId', 'examId', 'examTitle', 'studentName', 'startAt', 'submitAt', 'elapsedSec', 'summary', 'lessons', 'details', 'reportText']
const SUMMARY = ['total', 'max', 'percentage', 'gradeLabel', 'fullQuestions', 'partialQuestions', 'wrongQuestions', 'correctSubparts', 'partialSubparts', 'wrongSubparts', 'unansweredSubparts']
const LESSON = ['title', 'awarded', 'max']
const DETAIL = ['q', 'qTitle', 'lessons', 'label', 'status', 'awarded', 'marks', 'studentAnswer', 'correctAnswer']
check('الحقول العليا (12) بالأسماء والترتيب المطلوبين', same(Object.keys(wire), TOP), Object.keys(wire).join(', '))
check('حقول summary (11)', same(Object.keys(wire.summary), SUMMARY), Object.keys(wire.summary).join(', '))
check('حقول كل عنصر في lessons', wire.lessons.every((l) => same(Object.keys(l), LESSON)))
check('حقول كل عنصر في details', wire.details.every((d) => same(Object.keys(d), DETAIL)))
check('لا يضيع أي حقل عند التحويل إلى JSON (لا undefined ولا NaN)', same(wire, payload) && !/:null[,}\]]/.test(JSON.stringify(payload)))
check('أنواع الحقول العليا', typeof wire.token === 'string' && typeof wire.attemptId === 'string' && typeof wire.examId === 'string'
  && typeof wire.examTitle === 'string' && typeof wire.studentName === 'string' && typeof wire.startAt === 'string'
  && typeof wire.submitAt === 'string' && typeof wire.elapsedSec === 'number' && Array.isArray(wire.lessons)
  && Array.isArray(wire.details) && typeof wire.reportText === 'string')
check('أنواع حقول summary', wire.summary.total === summary.totalAwarded && typeof wire.summary.percentage === 'number'
  && typeof wire.summary.gradeLabel === 'string' && Object.entries(wire.summary).filter(([k]) => k !== 'gradeLabel').every(([, v]) => typeof v === 'number'))
check('أنواع حقول details', wire.details.every((d) => typeof d.q === 'number' && typeof d.qTitle === 'string' && typeof d.lessons === 'string'
  && typeof d.label === 'string' && typeof d.status === 'string' && typeof d.awarded === 'number' && typeof d.marks === 'number'
  && typeof d.studentAnswer === 'string' && typeof d.correctAnswer === 'string'))

console.log('\n== أ-2) الحمولة: البيانات الوصفية ==')
check('الرمز هو رمز الإرسال المرجعي', wire.token === SHEETS_TOKEN)
check('examId = grade8-chemistry-exam', wire.examId === EXAM_ID && wire.examId === 'grade8-chemistry-exam', wire.examId)
check('examTitle = عنوان الاختبار', wire.examTitle === EXAM_META.title)
check('attemptId محفوظ كما هو', wire.attemptId === ATTEMPT)
check('startAt/submitAt بصيغة ISO صحيحة', !Number.isNaN(Date.parse(wire.startAt)) && !Number.isNaN(Date.parse(wire.submitAt))
  && Date.parse(wire.startAt) === START_MS && Date.parse(wire.submitAt) === SUBMIT_MS)
check('elapsedSec ثوانٍ صحيحة = 2560', Number.isInteger(wire.elapsedSec) && wire.elapsedSec === ELAPSED_S && ELAPSED_S === 2560, String(wire.elapsedSec))
check('studentName كما هو', wire.studentName === 'سارة أحمد')
check('reportText هو تقرير buildReport نفسه', wire.reportText === reportText)
check('تقرير صالح قبل الإرسال (validateReport)', validateReport(reportText, reportFilename('سارة أحمد'), order))

console.log('\n== أ-3) الحمولة: المجاميع تطابق التصحيح ==')
check('التقرير والحمولة يستخدمان التصحيح نفسه', wire.summary.total === summary.totalAwarded && wire.summary.max === 100)
check('النسبة مطابقة', wire.summary.percentage === summary.percentage)
check('مجموع الفروع الأربعة = 47', wire.summary.correctSubparts + wire.summary.partialSubparts + wire.summary.wrongSubparts + wire.summary.unansweredSubparts === 47)
check('مجموع الأسئلة الثلاثة = 15', wire.summary.fullQuestions + wire.summary.partialQuestions + wire.summary.wrongQuestions === 15)
check('مجموع درجات details = 100', near(wire.details.reduce((s, d) => s + d.marks, 0), 100))
check('مجموع awarded في details = الدرجة النهائية', near(wire.details.reduce((s, d) => s + d.awarded, 0), wire.summary.total), String(wire.details.reduce((s, d) => s + d.awarded, 0)))
check('مدخل واحد لكل جزء (47)', wire.details.length === 47)
check('أرقام الأسئلة 1..15 بالترتيب المعروض', wire.details[0].q === 1 && wire.details[wire.details.length - 1].q === 15
  && same([...new Set(wire.details.map((d) => d.q))], Array.from({ length: 15 }, (_, i) => i + 1)))
check('عنوان السؤال الأول = عنوان q7 (ترتيب العرض المخلوط)', wire.details[0].qTitle === QUESTIONS[6].title.replace(/\[\[|\]\]/g, ''))
check('lessons: درسان بعنوانيهما', wire.lessons.length === 2
  && wire.lessons[0].title === 'الدرس الأول: الذرّة والعنصر' && wire.lessons[1].title === 'الدرس الثاني: الروابط الكيميائية')
const lesson1 = QUESTIONS.filter((q) => q.source.lesson === 1 || q.source.mixed).reduce((s, q) => s + q.parts.reduce((x, p) => x + p.marks, 0), 0)
const lesson2 = QUESTIONS.filter((q) => q.source.lesson === 2 || q.source.mixed).reduce((s, q) => s + q.parts.reduce((x, p) => x + p.marks, 0), 0)
check('توزيع الدرجات: الدرس الأول 49 والثاني 55 (السؤال التركيبي في الدرسين)', wire.lessons[0].max === 49 && wire.lessons[1].max === 55, `${lesson1}/${lesson2}`)
check('حالة كل فرع من النصوص العربية المعتمدة', wire.details.every((d) => Object.values(STATUS_AR).includes(d.status)))
check('وسوم [[ ]] مُزالة من نصوص التفاصيل', wire.details.every((d) => !/\[\[|\]\]/.test(d.qTitle + d.studentAnswer + d.correctAnswer)))

console.log('\n== أ-4) التقدير للمعلّم فقط ==')
check('سلّم التقدير: 95 ممتاز', gradeLabel(95) === 'ممتاز')
check('سلّم التقدير: 94.99 جيد جداً', gradeLabel(94.99) === 'جيد جداً')
check('سلّم التقدير: 85 جيد جداً', gradeLabel(85) === 'جيد جداً')
check('سلّم التقدير: 84.99 جيد', gradeLabel(84.99) === 'جيد')
check('سلّم التقدير: 75 جيد', gradeLabel(75) === 'جيد')
check('سلّم التقدير: 74.99 مقبول', gradeLabel(74.99) === 'مقبول')
check('سلّم التقدير: 65 مقبول', gradeLabel(65) === 'مقبول')
check('سلّم التقدير: 64.99 ضعيف', gradeLabel(64.99) === 'ضعيف')
check('سلّم التقدير: 50 ضعيف', gradeLabel(50) === 'ضعيف')
check('سلّم التقدير: 49.99 يحتاج إلى دعم', gradeLabel(49.99) === 'يحتاج إلى دعم')
check('التقدير موجود في الحمولة', typeof wire.summary.gradeLabel === 'string' && wire.summary.gradeLabel.length > 0)
check('التقدير غير موجود في تقرير TXT', !reportText.includes('التقدير') && !reportText.includes(wire.summary.gradeLabel))

console.log('\n== ب-0) ثوابت الإرسال المرجعية ==')
check('3 محاولات', MAX_ATTEMPTS === 3 && RETRY_DELAYS_MS.length === 2)
check('تأخير 2 ثم 5 ثوانٍ', same(RETRY_DELAYS_MS, [2000, 5000]))
check('مهلة 30 ثانية للمحاولة', ATTEMPT_TIMEOUT_MS === 30000)
check('بادئة التخزين خاصة بهذا الاختبار', PENDING_PREFIX === 'pending:grade8-chemistry-exam:')
check('مفتاح الحفظ = pending:grade8-chemistry-exam:<attemptId>', pendingKey('abc') === 'pending:grade8-chemistry-exam:abc')
check('newAttemptId يعيد معرّفاً فريداً', newAttemptId() !== newAttemptId())

/* ------------------------- خادم وهمي محلي ------------------------- */

type Captured = { headers: http.IncomingHttpHeaders; body: string }
type ServerState = { requests: number }

async function withServer(
  handler: (req: http.IncomingMessage, res: http.ServerResponse, body: string) => void,
  fn: (url: string, captured: Captured[], state: ServerState) => Promise<void>,
): Promise<void> {
  const captured: Captured[] = []
  const state: ServerState = { requests: 0 }
  const server = http.createServer((req, res) => {
    state.requests++
    let body = ''
    req.setEncoding('utf8')
    req.on('data', (chunk) => { body += chunk })
    req.on('end', () => { captured.push({ headers: req.headers, body }); handler(req, res, body) })
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const { port } = server.address() as AddressInfo
  try {
    await fn(`http://127.0.0.1:${port}/exec`, captured, state)
  } finally {
    server.closeAllConnections?.()
    await new Promise<void>((resolve) => server.close(() => resolve()))
  }
}

class MemStorage implements StorageLike {
  private map = new Map<string, string>()
  get length() { return this.map.size }
  key(i: number) { return [...this.map.keys()][i] ?? null }
  getItem(k: string) { return this.map.get(k) ?? null }
  setItem(k: string, v: string) { this.map.set(k, v) }
  removeItem(k: string) { this.map.delete(k) }
  keys() { return [...this.map.keys()] }
}

const json = (res: http.ServerResponse, status: number, data: unknown) => {
  try {
    res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' })
    res.end(JSON.stringify(data))
  } catch { /* الاتصال أُغلق */ }
}

/* ---------- ب-1) نجاح من المحاولة الأولى ---------- */
console.log('\n== ب-1) نجاح من المحاولة الأولى (خادم وهمي) ==')
await withServer(
  (_req, res) => json(res, 200, { ok: true }),
  async (url, captured) => {
    const fetchImpl: FetchLike = (_u, init) => realFetch(url, init)
    const storage = new MemStorage()
    const ok = await sendWithRetry(payload, { fetchImpl, storage, sleep: async () => {} })
    check('الإرسال نجح', ok === true)
    check('طلب واحد فقط', captured.length === 1, String(captured.length))
    check('Content-Type = text/plain;charset=utf-8', captured[0].headers['content-type'] === 'text/plain;charset=utf-8', String(captured[0].headers['content-type']))
    check('الجسم هو الحمولة نفسها بلا تغيير', same(JSON.parse(captured[0].body), wire))
    check('لا شيء محفوظ في localStorage بعد النجاح', storage.length === 0, storage.keys().join(','))
    check('لم يُستدعَ fetch الحقيقي', realFetchCalls === 0)
  },
)

/* ---------- ب-2) فشل محاولتين ثم نجاح (التأخيران 2 ثم 5 ثوانٍ) ---------- */
console.log('\n== ب-2) محاولتان فاشلتان ثم نجاح ==')
await withServer(
  (_req, res) => json(res, 200, { ok: true }),
  async (url, captured) => {
    let count = 0
    const fetchImpl: FetchLike = (_u, init) => {
      count++
      // أول محاولتين تصلان إلى خادم وهمي يردّ بخطأ، ثم ينجح
      if (count <= 2) return Promise.resolve({ text: async () => '{"ok":false}' })
      return realFetch(url, init)
    }
    const storage = new MemStorage()
    const delays: number[] = []
    const ok = await sendWithRetry(payload, { fetchImpl, storage, sleep: async (ms) => { delays.push(ms) } })
    check('نجح في المحاولة الثالثة', ok === true)
    check('3 محاولات فعلية (واحدة وصلت الخادم)', count === 3 && captured.length === 1, `${count}/${captured.length}`)
    check('التأخيران 2000 ثم 5000', same(delays, [2000, 5000]), delays.join(','))
    check('لا معلّق بعد النجاح', storage.length === 0)
  },
)

/* ---------- ب-3) فشل كل المحاولات ثم الحفظ وإعادة الإرسال عند فتح الصفحة ---------- */
console.log('\n== ب-3) فشل كل المحاولات: الحفظ ثم إعادة الإرسال (duplicate) ==')
const storage3 = new MemStorage()
await withServer(
  (_req, res) => json(res, 500, { ok: false }),
  async (url, captured, state) => {
    const fetchImpl: FetchLike = (_u, init) => realFetch(url, init)
    const delays: number[] = []
    const ok = await sendWithRetry(payload, { fetchImpl, storage: storage3, sleep: async (ms) => { delays.push(ms) } })
    check('الإرسال فشل بعد 3 محاولات', ok === false && state.requests === 3, String(state.requests))
    check('التأخيران 2000 ثم 5000', same(delays, [2000, 5000]), delays.join(','))
    check('الحمولة نفسها في كل محاولة (attemptId واحد)', new Set(captured.map((c) => (JSON.parse(c.body) as SubmissionPayload).attemptId)).size === 1)
    check('حُفظت الحمولة في localStorage', storage3.keys().join(',') === pendingKey(ATTEMPT), storage3.keys().join(','))
    const saved = JSON.parse(storage3.getItem(pendingKey(ATTEMPT))!) as SubmissionPayload
    check('الحمولة المحفوظة كاملة', same(saved, wire))
  },
)
// إعادة فتح الصفحة: retryPending يرسل المعلّق ثم يحذفه (والخادم يعيد duplicate:true)
await withServer(
  (_req, res) => json(res, 200, { ok: false, duplicate: true }),
  async (url, captured) => {
    const fetchImpl: FetchLike = (_u, init) => realFetch(url, init)
    const sent = await retryPending({ fetchImpl, storage: storage3, sleep: async () => {} })
    check('retryPending أرسل محاولة واحدة معلّقة', sent === 1, String(sent))
    check('الطلب الواحد هو المحاولة المحفوظة نفسها', captured.length === 1 && same(JSON.parse(captured[0].body), wire))
    check('حُذف المعلّق بعد قبول الخادم (duplicate)', storage3.length === 0)
  },
)
check('retryPending لا يفعل شيئاً عند غياب التخزين', (await retryPending({ storage: null })) === 0)

/* ---------- ب-4) مهلة المحاولة ---------- */
console.log('\n== ب-4) مهلة المحاولة (استجابة بطيئة) ==')
const storage4 = new MemStorage()
await withServer(
  (_req, res) => {
    setTimeout(() => json(res, 200, { ok: true }), 400)
  },
  async (url, _captured, state) => {
    const fetchImpl: FetchLike = (_u, init) => realFetch(url, init)
    const started = Date.now()
    const ok = await sendWithRetry(payload, { fetchImpl, storage: storage4, sleep: async () => {}, timeoutMs: 60 })
    const took = Date.now() - started
    check('المهلة تُعدّ فشلاً', ok === false)
    check('3 محاولات رغم البطء', state.requests === 3, String(state.requests))
    check('انتهت المحاولات في وقت قصير (المهلة تعمل)', took < 2000, took + 'ms')
    check('حُفظت الحمولة بعد فشل المهلة', storage4.keys().join(',') === pendingKey(ATTEMPT))
  },
)

/* ---------- ب-5) عزل التخزين عن الاختبارات الأخرى ---------- */
console.log('\n== ب-5) عزل مفاتيح التخزين عن الاختبارات الأخرى ==')
const storage5 = new MemStorage()
const otherKey = 'pending:grade5-math-unit1:11111111-1111-4111-8111-111111111111'
storage5.setItem(otherKey, JSON.stringify({ ...wire, examId: 'grade5-math-unit1', attemptId: '11111111-1111-4111-8111-111111111111' }))
storage5.setItem(pendingKey(ATTEMPT), JSON.stringify({ ...wire, token: 'stale-token' }))
storage5.setItem(pendingKey('broken'), '{not json')
let otherFetches = 0
await withServer(
  (_req, res) => json(res, 200, { ok: true }),
  async (url, captured) => {
    const fetchImpl: FetchLike = (_u, init) => {
      const body = JSON.parse(String(init.body)) as SubmissionPayload
      if (body.examId !== EXAM_ID) otherFetches++
      return realFetch(url, init)
    }
    const sent = await retryPending({ fetchImpl, storage: storage5, sleep: async () => {} })
    check('أُرسلت محاولة هذا الاختبار فقط', sent === 1 && captured.length === 1, `${sent}/${captured.length}`)
    check('لا إرسال لأي اختبار آخر', otherFetches === 0)
    check('مفتاح الاختبار الآخر بقي سليماً', storage5.getItem(otherKey) !== null)
    check('المفتاح المعطوب بقي ولم يُحذف', storage5.getItem(pendingKey('broken')) === '{not json')
    check('الرمز حُدّث من إعدادات التطبيق الحالية', JSON.parse(captured[0].body).token === SHEETS_TOKEN)
  },
)

/* ---------- ج) عرض حالة الإرسال في صفحة النتيجة ---------- */
console.log('\n== ج) عرض حالة الإرسال في صفحة النتيجة ==')
const renderResults = (sendStatus: 'idle' | 'sending' | 'success' | 'failed') =>
  renderToStaticMarkup(createElement(ResultsPage, {
    studentName: 'سارة أحمد', questions: order, answers, summary,
    elapsedSeconds: ELAPSED_S, submittedAt: SUBMIT_MS, downloadNote: null,
    sendStatus, onResend: () => {}, onDownloadReport: () => {}, onTryAgain: () => {}, onTeacher: () => {},
  }))

const idleHtml = renderResults('idle')
const sendingHtml = renderResults('sending')
const successHtml = renderResults('success')
const failedHtml = renderResults('failed')
check('حالة idle لا تعرض شريط إرسال', !idleHtml.includes('data-send-status'))
check('حالة sending ظاهرة', sendingHtml.includes('data-send-status="sending"') && sendingHtml.includes('جارٍ إرسال نتيجتك'))
check('حالة success ظاهرة', successHtml.includes('data-send-status="success"') && successHtml.includes('تم إرسال نتيجتك إلى معلّمك'))
check('حالة failed ظاهرة', failedHtml.includes('data-send-status="failed"') && failedHtml.includes('تعذّر إرسال النتيجة'))
check('زر «إعادة إرسال النتيجة» يظهر عند الفشل فقط', failedHtml.includes('إعادة إرسال النتيجة')
  && !sendingHtml.includes('إعادة إرسال النتيجة') && !successHtml.includes('إعادة إرسال النتيجة'))
check('زر تنزيل التقرير TXT متاح دائماً', [idleHtml, sendingHtml, successHtml, failedHtml].every((h) => h.includes('تنزيل التقرير TXT')))
check('التقدير لا يظهر للطالب في صفحة النتيجة', !successHtml.includes('التقدير') && !failedHtml.includes('التقدير'))
check('لا تظهر عبارة «لا تُرسل ... إلى أي خدمة خارجية»', !idleHtml.includes('لا تُرسل'))

/* ================================================================== */
finished = true
process.exitCode = failures === 0 ? 0 : 1
console.log(`\n${failures === 0 ? '✅' : '❌'} ${checks - failures}/${checks} فحصًا ناجحًا`)
if (failures > 0) console.log(`${failures} فحصًا فاشلًا`)
