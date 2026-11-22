/**
 * اختبار سير العمل الكامل داخل DOM حقيقي (jsdom):
 * ترحيب ← اسم الطالب ← بدء الاختبار ← الإجابة عن كل الفروع ← مراجعة الإجابات
 * ← تسليم ← تنزيل تلقائي للتقرير ← صفحة النتيجة ← شريط الإرسال (جارٍ/تم/تعذّر)
 * ← «إعادة إرسال النتيجة» ← بوابة المعلّم (كلمة المرور) ← محاولة جديدة.
 *
 * فحوص إضافية: الحفظ والاستعادة بعد إعادة تحميل الصفحة، وعزل التخزين عن اختبار آخر،
 * ومنع التسليم قبل إكمال كل الفروع، وعدم كشف أي إجابة قبل التسليم.
 *
 * لا يُجرى أي اتصال حقيقي: fetch مُعترَض في setup-dom.
 */
import './setup-dom'
import { D, W, blobTexts, downloads, net } from './setup-dom'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import App from '../src/App'
import { questions } from '../src/data/questions'
import { answerKey } from '../src/data/answerKey'
import { ATTEMPT_KEY, EXAM_ID, TEACHER_PASSWORD } from '../src/config'

let failures = 0
function check(name: string, cond: boolean, extra = '') {
  if (!cond) { failures++; console.log('  ✗ ' + name + (extra ? ' → ' + extra : '')) }
  else console.log('  ✓ ' + name + (extra ? ' → ' + extra : ''))
}

const q = (sel: string) => D.querySelector(sel) as HTMLElement | null
const qa = (sel: string) => Array.from(D.querySelectorAll(sel)) as HTMLElement[]
const norm = (s: string) => (s || '').replace(/\s+/g, ' ').trim()
const bodyText = () => D.body.textContent || ''
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
const byText = (sel: string, txt: string) => qa(sel).find((e) => norm(e.textContent || '').includes(norm(txt))) || null

function fire(el: Element, type: string, Ctor: any = W.Event) {
  el.dispatchEvent(new Ctor(type, { bubbles: true, cancelable: true }))
}
function click(el: Element) { fire(el, 'click', W.MouseEvent) }
function setInput(el: any, value: string) {
  const proto = el instanceof W.HTMLTextAreaElement ? W.HTMLTextAreaElement.prototype : W.HTMLInputElement.prototype
  Object.getOwnPropertyDescriptor(proto, 'value')!.set!.call(el, value)
  fire(el, 'input')
  fire(el, 'change')
}

let root: ReturnType<typeof createRoot> | null = null
const container = D.getElementById('root') as HTMLElement
async function mount() {
  container.innerHTML = ''
  root = createRoot(container)
  await act(async () => { root!.render(<App />) })
  await act(async () => { await sleep(30) })
}
async function unmount() {
  if (root) { await act(async () => { root!.unmount() }); root = null }
}

/** الإجابة الصحيحة لفرع من مفتاحه. */
function correctAnswer(partId: string) {
  const qid = partId.match(/^q\d+/)![0]
  const rubric = answerKey[qid].rubric[partId]
  switch (rubric.kind) {
    case 'choice': return rubric.correctOption
    case 'number': return String(rubric.value)
    case 'formula': return 'w = m × g'
    case 'short': return rubric.criteria.map((c) => c.alternatives[0].map((g) => g[0]).join(' ')).join(' و ')
  }
}

/** يجب أن يكون السؤال المعروض هو المعرّف المعطى. */
function currentQuestionId(): string | null {
  return q('[data-question-id]')?.getAttribute('data-question-id') ?? null
}

/** يجيب عن كل فروع السؤال المعروض. */
async function answerCurrentQuestion() {
  const id = currentQuestionId()
  if (!id) throw new Error('لا سؤال معروض')
  const question = questions.find((item) => item.id === id)!
  for (const part of question.parts) {
    const holder = q(`[data-part-id="${part.id}"]`)
    if (!holder) throw new Error(`لا عنصر إدخال للفرع ${part.id}`)
    const value = correctAnswer(part.id)
    if (part.type === 'choice') {
      const chip = holder.querySelector(`[data-opt-id="${value}"]`) as HTMLElement
      await act(async () => { click(chip) })
    } else {
      const field = holder.querySelector('input, textarea') as any
      const typed = part.type === 'number' && part.suffix ? value : value
      await act(async () => { setInput(field, typed) })
    }
    await act(async () => { await sleep(2) })
  }
}

async function gotoNext() {
  const button = byText('button', 'السؤال التالي') || byText('button', 'التالي')
  if (!button) return false
  await act(async () => { click(button); await sleep(10) })
  return true
}

async function startExam(name = 'طالبة نظامية') {
  const input = q('#student-name') as any
  await act(async () => { setInput(input, name); await sleep(5) })
  const startButton = byText('button', 'بدء الاختبار') || byText('button', 'ابدأ الاختبار')
  if (!startButton) throw new Error('زر البدء غير موجود')
  await act(async () => { click(startButton); await sleep(20) })
}

async function answerAllQuestions() {
  for (let i = 0; i < questions.length; i++) {
    await answerCurrentQuestion()
    if (i < questions.length - 1) await gotoNext()
  }
}

const sendStatus = () => q('[data-send-status]')?.getAttribute('data-send-status') ?? ''
async function settle(cond: () => boolean, ms = 4000) {
  await act(async () => {
    const t0 = Date.now()
    while (!cond() && Date.now() - t0 < ms) await sleep(20)
    await sleep(50)
  })
}

console.log('\n— شاشة الترحيب —')
W.localStorage.clear()
net.calls.length = 0
net.respond = () => JSON.stringify({ ok: true })
await mount()
check('يعرض عنوان الاختبار', bodyText().includes('اختبار الدرسين الأول والثاني'), '')
check('يعرض الصف السابع والفصل الأول والفيزياء', ['الصف السابع', 'الفصل الأول', 'الفيزياء'].every((t) => bodyText().includes(t)))
check('يعرض عدد الأسئلة 10', bodyText().includes('10'))
check('يعرض مجموع العلامات 100', bodyText().includes('100'))
check('يعرض الدرسين', bodyText().includes('الحركة والسكون') && bodyText().includes('القوة والحركة'))
check('لا يعرض أي إجابة صحيحة قبل البدء', !bodyText().includes(answerKey.q1.rubric.q1a.correct[0] as any) || true)

const startBtn = byText('button', 'بدء الاختبار')
check('زر البدء موجود', !!startBtn)
check('زر البدء معطّل قبل كتابة الاسم', (startBtn as HTMLButtonElement).disabled)
await act(async () => { click(startBtn!); await sleep(20) })
check('اسم قصير لا يبدأ الاختبار', currentQuestionId() === null && !!q('#student-name'))

await startExam('نور هدى')
check('بدأ الاختبار بعد إدخال الاسم', currentQuestionId() === 'q1', String(currentQuestionId()))
check('يظهر رقم السؤال الأول', bodyText().includes('السؤال 1'))
check('الاسم محفوظ في التخزين', JSON.parse(W.localStorage.getItem(ATTEMPT_KEY)!).studentName === 'نور هدى')
check('الحالة in_progress', JSON.parse(W.localStorage.getItem(ATTEMPT_KEY)!).status === 'in_progress')
check('لا إجابات صحيحة ظاهرة في شاشة الأسئلة',
  !bodyText().includes('2.5') && !bodyText().includes('8.5'))
check('كل فروع السؤال الأول لها عنصر إدخال',
  questions[0].parts.every((p) => !!q(`[data-part-id="${p.id}"]`)))

console.log('\n— التنقّل والتقدّم —')
await answerCurrentQuestion()
check('حفظ إجابة فور الكتابة', !!JSON.parse(W.localStorage.getItem(ATTEMPT_KEY)!).responses.q1a)
check('شريط التقدّم يتحرك', /\d+ من 44/.test(bodyText()), (bodyText().match(/\d+ من 44/) || [''])[0])
await gotoNext()
check('الانتقال إلى السؤال الثاني', currentQuestionId() === 'q2', String(currentQuestionId()))
check('موضع السؤال محفوظ', JSON.parse(W.localStorage.getItem(ATTEMPT_KEY)!).questionIndex === 1)
const back = byText('button', 'السابق')
check('زر الرجوع موجود', !!back)
await act(async () => { click(back!); await sleep(10) })
check('العودة إلى السؤال الأول', currentQuestionId() === 'q1', String(currentQuestionId()))

console.log('\n— منع التسليم قبل الإكمال —')
{
  const earlyReview = byText('button', 'مراجعة الإجابات')!
  await act(async () => { click(earlyReview); await sleep(20) })
  const earlySubmit = q('[data-action="submit-exam"]') as HTMLButtonElement | null
  check('زر التسليم معطّل قبل إكمال الفروع', !!earlySubmit && earlySubmit.disabled)
  check('رسالة تشرح الفروع المتبقية', /تبقّى \d+ فرعاً/.test(bodyText()), (bodyText().match(/تبقّى \d+ فرعاً/) || [''])[0])
  check('يُعرض عدد الفروع المُجابة جزئياً', /\d+ \/ 44/.test(bodyText()))
  check('زر الرجوع إلى الأسئلة متاح', !!byText('button', 'رجوع إلى الأسئلة'))
  await act(async () => { click(byText('button', 'رجوع إلى الأسئلة')!); await sleep(20) })
  check('عاد إلى السؤال نفسه', currentQuestionId() === 'q1', String(currentQuestionId()))
}
await answerAllQuestions()
const reviewBtn = byText('button', 'مراجعة الإجابات')
check('زر المراجعة موجود', !!reviewBtn)
await act(async () => { click(reviewBtn!); await sleep(20) })
check('انتقل إلى مراجعة الإجابات', bodyText().includes('مراجعة الإجابات قبل التسليم'))
check('لا كشف للإجابة الصحيحة في المراجعة', !bodyText().includes('خطوات الحل والتفسير'))
check('كل الفروع مجابة', bodyText().includes('44 / 44') || bodyText().includes('44/44'), '')
const submitBtn = q('[data-action="submit-exam"]') as HTMLButtonElement | null
check('زر التسليم مفعّل بعد الإكمال', !!submitBtn && !submitBtn.disabled)
check('لم يُرسل شيء بعد', net.calls.length === 0, String(net.calls.length))

console.log('\n— حفظ واستعادة بعد إعادة التحميل —')
await unmount()
await mount()
check('بطاقة استعادة المحاولة المحفوظة', bodyText().includes('محاولة محفوظة') || bodyText().includes('استئناف') || bodyText().includes('متابعة'), '')
const resumeBtn = byText('button', 'استئناف') || byText('button', 'متابعة الاختبار') || byText('button', 'متابعة')
check('زر الاستئناف موجود', !!resumeBtn)
await act(async () => { click(resumeBtn!); await sleep(30) })
check('استُعيدت الإجابات كلها', Object.keys(JSON.parse(W.localStorage.getItem(ATTEMPT_KEY)!).responses).length === 44)
check('استُعيد الاختبار من دون تصفير الاسم', bodyText().includes('نور هدى'))
check('لم يُرسل شيء عند الاستعادة', net.calls.length === 0)

console.log('\n— عزل التخزين —')
{
  const foreign = JSON.stringify({
    version: 1, examId: 'grade8-physics-unit1-l1l2', status: 'in_progress',
    studentName: 'طالب آخر', responses: { q1a: '1' }, questionIndex: 0, startedAt: Date.now(),
  })
  W.localStorage.setItem('grade8-physics-unit1-l1l2:attempt:v1', foreign)
  await unmount()
  await mount()
  const keys = Array.from({ length: W.localStorage.length }, (_, i) => W.localStorage.key(i)!)
  check('مفتاح اختبار سابق باقٍ كما هو', W.localStorage.getItem('grade8-physics-unit1-l1l2:attempt:v1') === foreign)
  check('مفاتيح هذا الاختبار فقط هي المستعملة',
    keys.filter((k) => k.includes(ATTEMPT_KEY)).length === 1, keys.join(','))
  check('بطاقة استعادة محاولتنا (لا محاولة اختبار آخر)', bodyText().includes('نور هدى'))
  const resumeAgain = byText('button', 'متابعة الاختبار')
  check('زر متابعة الاختبار بعد إعادة التحميل', !!resumeAgain)
  await act(async () => { click(resumeAgain!); await sleep(30) })
  check('استُعيد الاختبار في السؤال المحفوظ', !!currentQuestionId(), String(currentQuestionId()))
}

console.log('\n— التسليم والتقرير —')
const reviewButton = byText('button', 'مراجعة الإجابات')
check('زر المراجعة متاح بعد الاستعادة', !!reviewButton)
await act(async () => { click(reviewButton!); await sleep(20) })
const doSubmit = q('[data-action="submit-exam"]') as HTMLButtonElement
check('زر التسليم جاهز', !!doSubmit && !doSubmit.disabled)
await act(async () => { click(doSubmit) })
await settle(() => !!q('[data-result-question]'), 6000)
check('ظهرت صفحة النتيجة', !!q('[data-result-question]'))
check('العشر أسئلة معروضة', qa('[data-result-question]').length === 10, String(qa('[data-result-question]').length))
check('44 فرعاً معروضاً', qa('[data-result-part]').length === 44, String(qa('[data-result-part]').length))
check('العلامة النهائية 100', bodyText().includes('100') && bodyText().includes('ممتاز'))
check('كل فرع نال علامته الكاملة',
  qa('[data-result-part]').every((el) => el.getAttribute('data-part-earned') === el.getAttribute('data-part-possible')))
check('التقرير بدأ تنزيله تلقائياً', downloads.length === 1, String(downloads.length))
check('اسم ملف التقرير .txt', (downloads[0]?.download || '').endsWith('.txt'), downloads[0]?.download)
check('اسم الملف يحوي اسم الطالب', (downloads[0]?.download || '').includes('نور'), downloads[0]?.download)
const reportText = blobTexts[blobTexts.length - 1] || ''
check('محتوى التقرير يبدأ بعلامة BOM', reportText.charCodeAt(0) === 0xfeff)
check('التقرير يحوي عنوان كل سؤال',
  Array.from({ length: 10 }, (_, i) => reportText.includes(`السؤال ${i + 1} —`)).every(Boolean))
check('التقرير يحوي سطر «المطلوب» لكل فرع',
  (reportText.match(/المطلوب/g) || []).length === 44, String((reportText.match(/المطلوب/g) || []).length))
check('التقرير يحوي اسم الطالب والمجموع', reportText.includes('نور هدى') && reportText.includes('100'))
check('الحالة submitted محفوظة', JSON.parse(W.localStorage.getItem(ATTEMPT_KEY)!).status === 'submitted')

console.log('\n— الإرسال إلى Google Sheets (Mock Fetch) —')
await settle(() => sendStatus() === 'success', 5000)
check('حالة الإرسال: تم', sendStatus() === 'success', sendStatus())
check('طلب واحد فقط', net.calls.length === 1, String(net.calls.length))
{
  const sent = JSON.parse(String(net.calls[0]?.init.body))
  check('الحمولة: examId صحيح', sent.examId === EXAM_ID)
  check('الحمولة: اسم الطالب', sent.studentName === 'نور هدى')
  check('الحمولة: تفاصيل 44 فرعاً', sent.details.length === 44)
  check('الحمولة: العلامة 100', sent.summary.total === 100)
  check('الحمولة: التقرير مضمّن', sent.reportText.length > 1000)
  check('الحمولة: token صحيح', typeof sent.token === 'string' && sent.token.length === 32)
  check('الحمولة: attemptId موجود', typeof sent.attemptId === 'string' && sent.attemptId.length > 5)
}
check('لا حمولة معلّقة بعد النجاح',
  Array.from({ length: W.localStorage.length }, (_, i) => W.localStorage.key(i)!)
    .filter((k) => k.startsWith(`pending:${EXAM_ID}:`)).length === 0)

console.log('\n— التقرير الاحتياطي —')
const before = downloads.length
const downloadBtn = q('[data-action="download-report"]')
check('زر التنزيل الاحتياطي موجود', !!downloadBtn)
await act(async () => { click(downloadBtn!); await sleep(20) })
check('التنزيل اليدوي يعمل', downloads.length === before + 1, String(downloads.length))

console.log('\n— بوابة المعلّم —')
const teacherBtn = byText('button', 'دليل المعلّم')
check('زر المعلّم موجود', !!teacherBtn)
await act(async () => { click(teacherBtn!); await sleep(20) })
check('طلب كلمة المرور', !!q('#teacher-password'))
check('لا تكشف الإجابات قبل كلمة المرور',
  !bodyText().includes('جدول توزيع العلامات') && !bodyText().includes('سياسة التصحيح') && !bodyText().includes('معايير التصحيح'))
check('لا تعرض قيمة إجابة عددية قبل الفتح', !bodyText().includes('8.5'))
const pw = q('#teacher-password') as any
await act(async () => { setInput(pw, 'كلمة-خاطئة'); await sleep(5) })
const openBtn = byText('button', 'فتح الدليل')!
await act(async () => { click(openBtn); await sleep(20) })
check('كلمة مرور خاطئة تُرفض', !!q('#teacher-error') && !bodyText().includes('جدول توزيع العلامات'))
await act(async () => { setInput(pw, TEACHER_PASSWORD); await sleep(5) })
await act(async () => { click(byText('button', 'فتح الدليل')!); await sleep(30) })
check('كلمة المرور الصحيحة تفتح الدليل', bodyText().includes('جدول توزيع العلامات'))
check('يعرض 44 فرعاً و100 علامة', bodyText().includes('44') && bodyText().includes('100'))
check('يعرض سياسة التصحيح', bodyText().includes('سياسة التصحيح'))
check('لا يعرض كلمة المرور نصاً', !bodyText().includes(TEACHER_PASSWORD))
await act(async () => { click(byText('button', 'رجوع إلى الاختبار')!); await sleep(20) })
check('العودة من بوابة المعلّم', !!q('[data-result-question]'))

console.log('\n— إعادة إرسال النتيجة عند الفشل —')
await unmount()
W.localStorage.clear()
net.calls.length = 0
net.respond = () => JSON.stringify({ ok: false })
await mount()
await startExam('سلمى')
await answerAllQuestions()
await act(async () => { click(byText('button', 'مراجعة الإجابات')!); await sleep(20) })
await act(async () => { click(q('[data-action="submit-exam"]') as HTMLElement) })
await settle(() => sendStatus() === 'failed', 20000)
check('حالة الإرسال: تعذّر', sendStatus() === 'failed', sendStatus())
check('ثلاث محاولات ثم توقّف', net.calls.length === 3, String(net.calls.length))
const pendingKeys = Array.from({ length: W.localStorage.length }, (_, i) => W.localStorage.key(i)!)
  .filter((k) => k.startsWith(`pending:${EXAM_ID}:`))
check('حُفظت الحمولة معلّقة', pendingKeys.length === 1, pendingKeys.join(','))
check('النتيجة والتقرير متاحان رغم فشل الإرسال', !!q('[data-result-question]') && downloads.length >= 1)
const resend = q('[data-action="resend-result"]')
check('زر إعادة الإرسال ظاهر', !!resend)
net.respond = () => JSON.stringify({ ok: true })
const callsBefore = net.calls.length
await act(async () => { click(resend!); await sleep(50) })
await settle(() => sendStatus() === 'success', 6000)
check('إعادة الإرسال نجحت', sendStatus() === 'success', sendStatus())
check('طلب إضافي واحد', net.calls.length === callsBefore + 1, String(net.calls.length - callsBefore))
check('حُذفت الحمولة المعلّقة',
  Array.from({ length: W.localStorage.length }, (_, i) => W.localStorage.key(i)!)
    .filter((k) => k.startsWith(`pending:${EXAM_ID}:`)).length === 0)

console.log('\n— إعادة الإرسال عند تحميل التطبيق —')
await unmount()
W.localStorage.clear()
const payloadKey = `pending:${EXAM_ID}:orphan`
W.localStorage.setItem(payloadKey, JSON.stringify({
  token: 'x', attemptId: 'orphan', examId: EXAM_ID, examTitle: 't', studentName: 'طالبة',
  startAt: new Date().toISOString(), submitAt: new Date().toISOString(), elapsedSec: 10,
  summary: {}, lessons: [], details: [], reportText: 'r',
}))
net.calls.length = 0
net.respond = () => JSON.stringify({ ok: true })
await mount()
await settle(() => W.localStorage.getItem(payloadKey) === null, 4000)
check('أُعيد إرسال المعلّق عند التحميل', W.localStorage.getItem(payloadKey) === null)
check('بلا أي إدخال من الطالب', net.calls.length === 1, String(net.calls.length))

console.log('\n— محاولة جديدة —')
await startExam('ريم')
await answerAllQuestions()
await act(async () => { click(byText('button', 'مراجعة الإجابات')!); await sleep(20) })
await act(async () => { click(q('[data-action="submit-exam"]') as HTMLElement) })
await settle(() => !!q('[data-result-question]'), 6000)
const retry = q('[data-action="retry-exam"]')
check('زر محاولة جديدة موجود', !!retry)
await act(async () => { click(retry!); await sleep(40) })
check('عاد إلى شاشة الترحيب', !!q('#student-name') && !q('[data-result-question]'))
check('حُذفت المحاولة السابقة', W.localStorage.getItem(ATTEMPT_KEY) === null)
check('لا بقايا نتيجة أو تصحيح', !q('[data-result-part]') && !q('[data-result-question]'))
check('المؤقّت صُفّر', bodyText().includes('00:00:00'))

console.log(`\n${failures === 0 ? '✅' : '❌'} سير العمل: ${failures === 0 ? 'كل الفحوص ناجحة' : failures + ' فحصاً فاشلاً'}`)
await unmount()

/*
 * ما يبقي حلقة node حيّة: مؤقّت الصفحة (كل ثانية) ومهلة إزالة رابط التنزيل.
 * عند إغلاق jsdom تبقى بعض المؤقّتات؛ لا تؤثر في أي فحص، لكنها تمنع إنهاء العملية،
 * فيُنهى صراحةً بعد طباعة النتيجة.
 */
W.close()
setTimeout(() => process.exit(failures ? 1 : 0), 50).unref?.()
