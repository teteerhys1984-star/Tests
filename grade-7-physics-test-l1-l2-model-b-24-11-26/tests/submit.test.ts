/**
 * اختبارات الإرسال إلى Google Sheets بعقد grade5-math-unit1 — بلا أي اتصال حقيقي:
 *   · الحمولة: الحقول والأسماء والأنواع كما يتوقعها Apps Script.
 *   · النجاح: ok:true أو duplicate:true، وحذف أي حمولة معلّقة.
 *   · الفشل: حفظ محلي تحت pending:<EXAM_ID>:<attemptId> ثم إعادة المحاولة.
 *   · المحاولات: 3 محاولات بفواصل 2 ثم 5 ثوانٍ (زمن النوم مُحقَن فلا ينتظر الاختبار فعلياً).
 *   · الحماية: لا طلب preflight (نوع text/plain)، ولا يُسجَّل أي شيء في console.
 *
 * التشغيل: node tests/run-tests.mjs
 */
import { questions } from '../src/data/questions'
import { answerKey } from '../src/data/answerKey'
import { gradeExam, type Responses } from '../src/lib/grading'
import { buildReport, type AttemptMeta } from '../src/lib/report'
import {
  buildPayload, newAttemptId, pendingKey, retryPending, sendWithRetry, PENDING_PREFIX,
  MAX_ATTEMPTS, RETRY_DELAYS_MS, type FetchLike, type StorageLike, type SubmissionPayload,
} from '../src/exam/submit'
import { EXAM_ID, EXAM_TITLE, PENDING_PREFIX as CONFIG_PREFIX, SHEETS_TOKEN, SHEETS_URL } from '../src/config'

let failures = 0
function check(name: string, cond: boolean, extra = '') {
  if (!cond) { failures++; console.log('  ✗ ' + name + (extra ? ' → ' + extra : '')) }
  else console.log('  ✓ ' + name + (extra ? ' → ' + extra : ''))
}

class MemoryStorage implements StorageLike {
  private map = new Map<string, string>()
  get length() { return this.map.size }
  key(i: number) { return Array.from(this.map.keys())[i] ?? null }
  getItem(k: string) { return this.map.get(k) ?? null }
  setItem(k: string, v: string) { this.map.set(k, String(v)) }
  removeItem(k: string) { this.map.delete(k) }
  keys() { return Array.from(this.map.keys()) }
}

const perfect: Responses = {}
for (const question of questions) {
  for (const part of question.parts) {
    const rubric = answerKey[question.id].rubric[part.id]
    perfect[part.id] =
      rubric.kind === 'choice' ? rubric.correctOption
        : rubric.kind === 'number' ? `${rubric.value} ${rubric.unit}`
          : rubric.kind === 'formula' ? 'w = m × g'
            : rubric.criteria.map((c) => c.alternatives[0].map((g) => g[0]).join(' ')).join(' و ')
  }
}
const meta: AttemptMeta = {
  studentName: 'طالبة اختبار',
  startAt: new Date('2026-11-23T08:00:00Z'),
  submitAt: new Date('2026-11-23T08:20:00Z'),
  elapsedMs: 20 * 60 * 1000,
}
const result = gradeExam(questions, perfect, answerKey)
const reportText = buildReport(questions, meta, result, perfect)
const payload: SubmissionPayload = buildPayload({
  attemptId: 'test-attempt-1',
  meta,
  order: questions,
  answers: perfect,
  result,
  reportText,
})

console.log('\n— الحمولة —')
const expectedKeys = ['token', 'attemptId', 'examId', 'examTitle', 'studentName', 'startAt', 'submitAt', 'elapsedSec', 'summary', 'lessons', 'details', 'reportText']
check('الحقول كلها وبالترتيب نفسه', Object.keys(payload).join(',') === expectedKeys.join(','), Object.keys(payload).join(','))
check('token من الإعدادات', payload.token === SHEETS_TOKEN)
check('examId من الإعدادات', payload.examId === EXAM_ID)
check('examTitle من الإعدادات', payload.examTitle === EXAM_TITLE)
check('attemptId كما مُرِّر', payload.attemptId === 'test-attempt-1')
check('اسم الطالب', payload.studentName === 'طالبة اختبار')
check('startAt ISO', payload.startAt === '2026-11-23T08:00:00.000Z')
check('submitAt ISO', payload.submitAt === '2026-11-23T08:20:00.000Z')
check('elapsedSec ثوانٍ صحيحة', payload.elapsedSec === 1200, String(payload.elapsedSec))
check('summary.total = 100', payload.summary.total === 100 && payload.summary.max === 100)
check('summary.percentage = 100', payload.summary.percentage === 100)
check('summary.gradeLabel = ممتاز', payload.summary.gradeLabel === 'ممتاز')
check('summary يحوي حقول الفروع الأربعة', ['correctSubparts', 'partialSubparts', 'wrongSubparts', 'unansweredSubparts'].every((k) => k in payload.summary))
check('lessons: ثلاث مجموعات دراسية', payload.lessons.length === 3, payload.lessons.map((l) => `${l.title}:${l.max}`).join(' | '))
check('details = 44 فرعاً', payload.details.length === 44, String(payload.details.length))
check('كل تفصيل يحوي حقوله الثمانية',
  payload.details.every((d) => ['q', 'qTitle', 'lessons', 'label', 'status', 'awarded', 'marks', 'studentAnswer', 'correctAnswer'].every((k) => k in d)))
check('ترقيم الأسئلة 1..10', payload.details[0].q === 1 && payload.details[payload.details.length - 1].q === 10)
check('حالة التفصيل عربية', payload.details.every((d) => ['إجابة صحيحة', 'إجابة صحيحة جزئياً', 'إجابة خاطئة'].includes(d.status)))
check('reportText مضمّن كما هو', payload.reportText === reportText)
check('الحمولة كلها قابلة للتسلسل JSON', JSON.parse(JSON.stringify(payload)).details.length === 44)
check('newAttemptId فريد', newAttemptId() !== newAttemptId())
check('newAttemptId نصّ غير فارغ', newAttemptId().length >= 8, newAttemptId())
check('newAttemptId يصلح مفتاحاً في التخزين', !newAttemptId().includes('pending:'))
check('PENDING_PREFIX من config', PENDING_PREFIX === CONFIG_PREFIX && PENDING_PREFIX === `pending:${EXAM_ID}:`)
check('pendingKey', pendingKey('abc') === `pending:${EXAM_ID}:abc`)

console.log('\n— النجاح —')
const noSleep = async () => {}
{
  const storage = new MemoryStorage()
  const calls: { url: string; init: RequestInit }[] = []
  const fetchImpl: FetchLike = async (url, init) => { calls.push({ url, init }); return { text: async () => '{"ok":true}' } }
  const ok = await sendWithRetry(payload, { fetchImpl, storage, sleep: noSleep })
  check('نجاح فوري', ok === true)
  check('طلب واحد فقط', calls.length === 1, String(calls.length))
  check('إلى SHEETS_URL نفسه', calls[0].url === SHEETS_URL)
  check('POST', calls[0].init.method === 'POST')
  check('نوع المحتوى text/plain (بلا preflight)', (calls[0].init.headers as Record<string, string>)['Content-Type'] === 'text/plain;charset=utf-8')
  check('الجسم هو الحمولة نفسها', JSON.parse(String(calls[0].init.body)).attemptId === 'test-attempt-1')
  check('لا حمولة معلّقة بعد النجاح', storage.keys().length === 0, storage.keys().join(','))
}

console.log('\n— duplicate:true يُعدّ نجاحاً —')
{
  const storage = new MemoryStorage()
  const ok = await sendWithRetry(payload, { fetchImpl: async () => ({ text: async () => '{"duplicate":true}' }), storage, sleep: noSleep })
  check('duplicate مقبول', ok === true)
  check('لا معلّق', storage.keys().length === 0)
}

console.log('\n— ردّ غير مؤكِّد يُعدّ فشلاً —')
for (const body of ['{"ok":false}', '{"error":"x"}', 'not json', '{}', '[]', 'null']) {
  const storage = new MemoryStorage()
  const ok = await sendWithRetry(payload, { fetchImpl: async () => ({ text: async () => body }), storage, sleep: noSleep })
  check(`ردّ ${body} ← فشل مع حفظ معلّق`, ok === false && storage.keys().join() === pendingKey(payload.attemptId))
}

console.log('\n— الفشل مع إعادة المحاولة —')
{
  const storage = new MemoryStorage()
  let calls = 0
  const sleeps: number[] = []
  const fetchImpl: FetchLike = async () => { calls++; throw new Error('network down') }
  const ok = await sendWithRetry(payload, { fetchImpl, storage, sleep: async (ms) => { sleeps.push(ms) } })
  check('فشل بعد 3 محاولات', ok === false, String(calls))
  check('3 محاولات بالضبط', calls === MAX_ATTEMPTS && calls === 3, String(calls))
  check('فواصل 2000 ثم 5000', sleeps.join(',') === RETRY_DELAYS_MS.join(','), sleeps.join(','))
  check('حُفظت الحمولة معلّقة', storage.keys().join() === pendingKey(payload.attemptId), storage.keys().join(','))
  check('المعلّق هو الحمولة كاملة', JSON.parse(storage.getItem(pendingKey(payload.attemptId))!).details.length === 44)
}

console.log('\n— النجاح من المحاولة الثانية —')
{
  const storage = new MemoryStorage()
  let calls = 0
  const fetchImpl: FetchLike = async () => {
    calls++
    if (calls === 1) throw new Error('timeout once')
    return { text: async () => '{"ok":true}' }
  }
  const ok = await sendWithRetry(payload, { fetchImpl, storage, sleep: noSleep })
  check('نجح في المحاولة الثانية', ok === true && calls === 2, String(calls))
  check('لا معلّق بعد النجاح', storage.keys().length === 0)
}

console.log('\n— المهلة —')
{
  let calls = 0
  const fetchImpl: FetchLike = async () => {
    calls++
    return new Promise((resolve) => setTimeout(() => resolve({ text: async () => '{"ok":true}' }), 500))
  }
  const started = Date.now()
  const ok = await sendWithRetry(payload, { fetchImpl, storage: new MemoryStorage(), sleep: noSleep, timeoutMs: 30 })
  const took = Date.now() - started
  check('اتصال معلّق يُعدّ فشلاً', ok === false)
  check('لا ينتظر أكثر من المهلة لكل محاولة', took < 1500, `${took}ms`)
  check('أعاد المحاولة بعد المهلة', calls === 3, String(calls))
}

console.log('\n— إعادة إرسال المعلّق عند التحميل —')
{
  const storage = new MemoryStorage()
  storage.setItem(`pending:${EXAM_ID}:old-1`, JSON.stringify({ ...payload, attemptId: 'old-1' }))
  storage.setItem(`pending:${EXAM_ID}:old-2`, JSON.stringify({ ...payload, attemptId: 'old-2' }))
  storage.setItem('pending:exam-آخر:keep', JSON.stringify({ ...payload, attemptId: 'keep' }))
  storage.setItem('grade-7:attempt:v1', '{"keep":true}')
  const sent: string[] = []
  const count = await retryPending({
    fetchImpl: async (_u, init) => { sent.push(JSON.parse(String(init.body)).attemptId); return { text: async () => '{"ok":true}' } },
    storage,
    sleep: noSleep,
  })
  check('أُعيد إرسال حمولتين', count === 2, String(count))
  check('بحمولات هذا الاختبار فقط', sent.sort().join(',') === 'old-1,old-2', sent.join(','))
  check('حُذف المعلّق الناجح', storage.getItem(`pending:${EXAM_ID}:old-1`) === null)
  check('لم يُمسّ معلّق اختبار آخر', storage.getItem('pending:exam-آخر:keep') !== null)
  check('لم تُمسّ محاولة الطالب المحفوظة', storage.getItem('grade-7:attempt:v1') !== null)
}
{
  const storage = new MemoryStorage()
  storage.setItem(pendingKey('stay'), JSON.stringify(payload))
  const count = await retryPending({ fetchImpl: async () => ({ text: async () => '{"ok":false}' }), storage, sleep: noSleep })
  check('فشل إعادة الإرسال يُبقي المعلّق', count === 0 && storage.getItem(pendingKey('stay')) !== null)
}
{
  const storage = new MemoryStorage()
  storage.setItem(pendingKey('broken'), '{ليس JSON')
  const count = await retryPending({ fetchImpl: async () => ({ text: async () => '{"ok":true}' }), storage, sleep: noSleep })
  check('معلّق تالف لا يكسر الإرسال', count === 0)
}
{
  const count = await retryPending({ fetchImpl: async () => ({ text: async () => '{"ok":true}' }), storage: null })
  check('بلا تخزين: لا شيء يُرسل ولا خطأ', count === 0)
}

console.log('\n— بلا تخزين متاح —')
{
  const ok = await sendWithRetry(payload, { fetchImpl: async () => ({ text: async () => '{"ok":false}' }), storage: null, sleep: noSleep })
  check('الفشل لا يرمي استثناء بلا تخزين', ok === false)
}

console.log('\n— لا تسجيل لبيانات الطالب —')
{
  const originals = { log: console.log, warn: console.warn, error: console.error, info: console.info }
  let logged = 0
  console.log = console.warn = console.error = console.info = () => { logged++ }
  try {
    await sendWithRetry(payload, { fetchImpl: async () => { throw new Error('x') }, storage: new MemoryStorage(), sleep: noSleep })
    await retryPending({ fetchImpl: async () => { throw new Error('x') }, storage: new MemoryStorage(), sleep: noSleep })
  } finally {
    console.log = originals.log; console.warn = originals.warn; console.error = originals.error; console.info = originals.info
  }
  check('لا كتابة في console أثناء الفشل', logged === 0, String(logged))
}

console.log(`\n${failures === 0 ? '✅' : '❌'} الإرسال: ${failures === 0 ? 'كل الفحوص ناجحة' : failures + ' فحصاً فاشلاً'}`)
if (failures) process.exit(1)
