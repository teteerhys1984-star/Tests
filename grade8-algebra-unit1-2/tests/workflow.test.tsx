/**
 * اختبار سير العمل الكامل داخل DOM حقيقي (jsdom):
 * ترحيب ← اسم الطالب ← بدء الاختبار ← الإجابة عن كل الفروع (45) ← مراجعة
 * ← تسليم بنقرة واحدة ← تنزيل تلقائي للتقرير ← صفحة النتيجة ← إرسال النتيجة (Mock)
 * ← زر «إعادة إرسال النتيجة» ← زر تنزيل التقرير ← إعادة الاختبار
 * ← فشل الإرسال والحفظ والاستعادة وإعادة الإرسال التلقائي عند فتح الصفحة.
 *
 * لا يُجرى أي اتصال حقيقي: fetch مُعترَض في setup-dom.
 */
import './setup-dom'
import { D, W, blobTexts, downloads, net } from './setup-dom'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import App from '../src/App'
import { questions, type AnswerValue } from '../src/lib/exam'
import type { SubQuestion } from '../src/data/types'
import { EXAM_ID, SHEETS_TOKEN, SHEETS_URL } from '../src/config'
import { STORAGE_KEY } from '../src/lib/storage'

let failures = 0
function check(name: string, cond: boolean, extra = '') {
  if (!cond) {
    failures += 1
    console.log('  ✗ ' + name + (extra ? ' → ' + extra : ''))
  } else {
    console.log('  ✓ ' + name + (extra ? ' → ' + extra : ''))
  }
}

const q = (sel: string) => D.querySelector(sel) as HTMLElement | null
const qa = (sel: string) => Array.from(D.querySelectorAll(sel)) as HTMLElement[]
const norm = (s: string) => s.replace(/\s+/g, ' ').trim()
const byText = (sel: string, txt: string) => qa(sel).find((e) => norm(e.textContent || '').includes(norm(txt))) || null
const bodyText = () => norm(D.body.textContent || '')
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
const sendPanel = () => q('[data-send-status]')
const sendStatus = () => sendPanel()?.getAttribute('data-send-status') ?? ''
const sentBody = (i: number) => JSON.parse(String(net.calls[i].init.body))
const pendingKeys = () =>
  Array.from({ length: W.localStorage.length }, (_, i) => W.localStorage.key(i) as string).filter((k) => k.startsWith('pending:'))
const NO_SEND_CLAIM = /لا تُرسل بياناتك إلى خادم|لم تُرسل بيانات|بيانات الطالب تبقى في متصفحه ولا تُرسل/

async function settle(cond: () => boolean, ms: number) {
  await act(async () => {
    const t0 = Date.now()
    while (!cond() && Date.now() - t0 < ms) await sleep(20)
    await sleep(60)
  })
}

function fire(el: any, type: string, Ctor: any = W.Event) {
  el.dispatchEvent(new Ctor(type, { bubbles: true, cancelable: true }))
}
function click(el: any) {
  fire(el, 'click', W.MouseEvent)
}
function setInput(el: any, value: string) {
  const proto = W.HTMLInputElement.prototype
  Object.getOwnPropertyDescriptor(proto, 'value')!.set!.call(el, value)
  fire(el, 'input')
  fire(el, 'change')
}

function correctAnswer(sp: SubQuestion): AnswerValue {
  switch (sp.kind) {
    case 'rational':
      return sp.expectedRational ?? ''
    case 'fields':
      return Object.fromEntries((sp.fields ?? []).map((f) => [f.id, f.expected]))
    case 'mcq':
      return sp.correctOption ?? ''
    case 'order':
      return [...(sp.correctOrder ?? [])]
    case 'justify':
      return { verdict: sp.correctVerdict, reason: sp.correctReason }
    default:
      return ''
  }
}

async function fillSubpart(sp: SubQuestion) {
  const card = q(`[data-subpart-id="${sp.id}"]`) as HTMLElement
  if (!card) throw new Error(`subpart card not found: ${sp.id}`)
  const ans = correctAnswer(sp)
  if (sp.kind === 'rational') {
    await act(async () => { setInput(card.querySelector(`#${sp.id}-answer`), String(ans)) })
  } else if (sp.kind === 'fields') {
    for (const field of sp.fields ?? []) {
      const input = card.querySelector(`#${sp.id}-${field.id}`)
      await act(async () => { setInput(input, (ans as Record<string, string>)[field.id]) })
    }
  } else if (sp.kind === 'mcq') {
    const input = card.querySelector(`input[name="mcq-${sp.id}"][value="${ans}"]`)
    if (!input) throw new Error(`mcq option not found: ${sp.id}/${ans}`)
    await act(async () => { click(input) })
  } else if (sp.kind === 'justify') {
    const value = ans as { verdict: string; reason: string }
    const verdicts = Array.from(card.querySelectorAll(`input[name="verdict-${sp.id}"]`)) as HTMLInputElement[]
    const verdictInput = value.verdict === 'true' ? verdicts[0] : verdicts[1]
    await act(async () => { click(verdictInput) })
    const reasonInput = card.querySelector(`input[name="reason-${sp.id}"][value="${value.reason}"]`)
    if (!reasonInput) throw new Error(`reason not found: ${sp.id}/${value.reason}`)
    await act(async () => { click(reasonInput) })
  } else if (sp.kind === 'order') {
    for (const id of ans as string[]) {
      const token = q(`.order-token[data-item-id="${id}"]`)
      if (!token) throw new Error(`order token not found: ${sp.id}/${id}`)
      await act(async () => { click(token) })
    }
  }
}

async function startExam(name: string) {
  const input = q('#student-name') as HTMLInputElement
  await act(async () => { setInput(input, name) })
  const form = q('.cover-screen form') as HTMLFormElement
  await act(async () => { fire(form, 'submit') })
}

async function answerCurrentQuestion(index: number) {
  const question = questions[index]
  const cards = qa('.subpart-card')
  if (cards.length !== question.subparts.length) {
    throw new Error(`عدد بطاقات الفروع غير متوقع للسؤال ${index + 1}: ${cards.length}`)
  }
  for (const part of question.subparts) await fillSubpart(part)
}

async function answerAllQuestions() {
  for (let i = 0; i < questions.length; i += 1) {
    await answerCurrentQuestion(i)
    if (i < questions.length - 1) {
      const next = byText('button', 'السؤال التالي')
      if (!next) throw new Error('زر السؤال التالي غير موجود')
      await act(async () => { click(next) })
    }
  }
}

async function openReview() {
  const review = byText('button', 'المراجعة')
  if (!review) throw new Error('زر المراجعة غير موجود')
  await act(async () => { click(review) })
}

async function submitExam() {
  const submit = byText('button', 'تسليم الاختبار')
  if (!submit) throw new Error('زر التسليم غير موجود')
  await act(async () => { click(submit) })
}

let container: HTMLDivElement
let root: Root

async function mount() {
  container = W.document.createElement('div')
  W.document.body.appendChild(container)
  root = createRoot(container)
  await act(async () => { root.render(<App />) })
}

async function unmount() {
  await act(async () => { root.unmount() })
  container.remove()
}

async function fullPerfectRun(name: string) {
  await startExam(name)
  await answerAllQuestions()
  await openReview()
  check('المراجعة تؤكد اكتمال جميع الأجزاء', bodyText().includes('جميع الأجزاء المطلوبة مكتملة'))
  await submitExam()
}

/* ================================================================== */
console.log('\n== 1) صفحة الترحيب والخصوصية ==')
/* ================================================================== */
W.localStorage.clear()
net.calls.length = 0
net.respond = () => JSON.stringify({ ok: true })
downloads.length = 0
blobTexts.length = 0
await mount()

check('تظهر صفحة الترحيب', !!q('.cover-screen'))
check('لا توجد ادعاءات قديمة بعدم الإرسال', !NO_SEND_CLAIM.test(bodyText()))
check('يُذكر إرسال النتيجة إلى المعلّم', bodyText().includes('تُرسل النتيجة إلى معلّمك'))
check('الاسم مطلوب', !!q('#student-name'))

console.log('\n== 2) الإجابة عن كل الفروع والمراجعة والتسليم ==')
await fullPerfectRun('طالب الاختبار')

await settle(() => !!q('.results-screen'), 3000)
check('ظهرت صفحة النتيجة', !!q('.results-screen'))
check('الدرجة 100', norm(q('.score-value')?.textContent || '') === '100', norm(q('.score-value')?.textContent || ''))
check('النسبة 100%', bodyText().includes('100%'))
check('حالة الإرسال: نجاح', sendStatus() === 'success', sendStatus())
check('نص النجاح ظاهر', norm(sendPanel()?.textContent || '').includes('تم إرسال النتيجة إلى المعلّم'))
check('زر إعادة إرسال النتيجة موجود ومستقل', !!byText('button', 'إعادة إرسال النتيجة'))
check('زر إعادة المحاولة موجود باسم مختلف', !!byText('button', 'إعادة المحاولة'))
check('التصنيف (gradeLabel) لا يُعرض للطالب', !bodyText().includes('ممتاز'))

console.log('\n== 3) تنزيل تقرير TXT ==')
check('تنزيل تلقائي عند التسليم', downloads.length === 1, String(downloads.length))
check('اسم ملف التقرير', downloads[0]?.download === 'Grade8_Algebra_Unit1_Unit2_Report_طالب_الاختبار.txt', downloads[0]?.download)
check('التقرير يبدأ بعلامة BOM', blobTexts[0]?.startsWith('\uFEFF'))
check('التقرير يحوي اسم الطالب', blobTexts[0]?.includes('طالب الاختبار'))
check('التقرير يحوي الدرجة 100 / 100', blobTexts[0]?.includes('100 / 100'))
check('التقرير يحوي كل الأسئلة', questions.every((qq) => (blobTexts[0] ?? '').includes(`[السؤال ${qq.number} من 15]`)))
const autoReport = blobTexts[0] ?? ''
const downloadBtn = byText('button', 'تنزيل التقرير TXT')
await act(async () => { click(downloadBtn) })
await settle(() => downloads.length === 2, 1000)
check('زر التنزيل يعيد إنشاء التقرير نفسه', downloads.length === 2 && blobTexts[1] === autoReport)

console.log('\n== 4) حمولة الإرسال إلى المعلّم (Mock) ==')
await settle(() => net.calls.length >= 1, 2000)
check('أُرسل طلب واحد', net.calls.length === 1, String(net.calls.length))
check('URL تطبيق Google Apps Script', net.calls[0]?.url === SHEETS_URL)
check('Content-Type: text/plain;charset=utf-8', net.calls[0]?.init.headers['Content-Type'] === 'text/plain;charset=utf-8')
const sent = sentBody(0)
check('token من الإعدادات', sent.token === SHEETS_TOKEN)
check('examId = grade8-algebra-unit1-2', sent.examId === EXAM_ID)
check('examTitle يحمل الصف والوحدتين', sent.examTitle.includes('الصف الثامن') && sent.examTitle.includes('الوحدتان'), sent.examTitle)
check('studentName فقط', sent.studentName === 'طالب الاختبار')
check('summary.total = 100', sent.summary.total === 100)
check('summary.gradeLabel = ممتاز (للمعلّم)', sent.summary.gradeLabel === 'ممتاز')
check('summary.fullQuestions = 15', sent.summary.fullQuestions === 15)
check('summary.correctSubparts = 45', sent.summary.correctSubparts === 45)
check('details: 45 فرعًا', sent.details.length === 45)
check('details: حالة عربية', sent.details.every((d: any) => d.status === 'إجابة صحيحة'))
check('reportText مرسل كاملًا', sent.reportText === autoReport.replace(new RegExp('^' + String.fromCharCode(0xFEFF)), ''))
check('attemptId موجود وفريد', typeof sent.attemptId === 'string' && sent.attemptId.length >= 16)

console.log('\n== 5) إعادة إرسال النتيجة بلا تكرار ==')
const firstAttemptId = sent.attemptId
const resend = byText('button', 'إعادة إرسال النتيجة')
await act(async () => { click(resend) })
await settle(() => net.calls.length >= 2, 2000)
check('طلب إعادة إرسال ثانٍ', net.calls.length === 2)
check('attemptId نفسه في إعادة الإرسال', sentBody(1).attemptId === firstAttemptId)
check('الحمولة نفسها', JSON.stringify(sentBody(1)) === JSON.stringify(sentBody(0)))
check('لا نتيجة معلّقة بعد النجاح', pendingKeys().length === 0)

console.log('\n== 6) إعادة الاختبار ==')
const retryBtn = byText('button', 'إعادة المحاولة')
await act(async () => { click(retryBtn) })
await settle(() => !!q('.cover-screen'), 1000)
check('العودة إلى صفحة الترحيب', !!q('.cover-screen'))
check('حُذفت المحاولة المحلية', W.localStorage.getItem(STORAGE_KEY) === null)
check('لم يبق مفتاح معلّق', pendingKeys().length === 0)

/* ================================================================== */
console.log('\n== 7) فشل الإرسال والحفظ والاستعادة وإعادة الإرسال التلقائي ==')
/* ================================================================== */
W.localStorage.clear()
net.calls.length = 0
downloads.length = 0
blobTexts.length = 0
net.respond = () => JSON.stringify({ ok: false })

await fullPerfectRun('طالب الفشل')
await settle(() => sendStatus() === 'failed', 15000)
check('النتيجة ظهرت رغم فشل الإرسال', !!q('.results-screen') && norm(q('.score-value')?.textContent || '') === '100')
check('حالة الإرسال: فشل', sendStatus() === 'failed', sendStatus())
check('رسالة الفشل واضحة', norm(sendPanel()?.textContent || '').includes('تعذّر إرسال النتيجة'))
check('حاول 3 مرات', net.calls.length === 3, String(net.calls.length))
const failedAttemptId = sentBody(0).attemptId
check('المعرّف نفسه في المحاولات الثلاث', net.calls.every((_, i) => sentBody(i).attemptId === failedAttemptId))
check('التقرير نُزّل رغم فشل الإرسال', downloads.length === 1 && (blobTexts[0] ?? '').includes('100 / 100'))
check('حُفظت النتيجة المعلّقة', pendingKeys().length === 1 && pendingKeys()[0] === `pending:${EXAM_ID}:${failedAttemptId}`, pendingKeys().join(','))
check('حالة التسليم محفوظة محليًا', W.localStorage.getItem(STORAGE_KEY) !== null)

// إغلاق الصفحة وإعادة فتحها: تُستعاد النتيجة والمحاولة ويُعاد الإرسال تلقائياً.
await unmount()
net.calls.length = 0
net.respond = () => JSON.stringify({ ok: true })
const downloadsBefore = downloads.length
await mount()
await settle(() => sendStatus() === 'success', 5000)
check('استُعيدت صفحة النتيجة بعد إعادة الفتح', !!q('.results-screen'))
check('الدرجة المستعادة 100', norm(q('.score-value')?.textContent || '') === '100')
check('أُعيد الإرسال تلقائياً عند الفتح', net.calls.length === 1, String(net.calls.length))
check('المعرّف نفسه للمحاولة المستعادة', sentBody(0).attemptId === failedAttemptId)
check('حُذف المعلّق بعد النجاح', pendingKeys().length === 0)
check('حالة الإرسال بعد الاستعادة: نجاح', sendStatus() === 'success', sendStatus())
check('لا تنزيل تلقائي مكرر عند الاستعادة', downloads.length === downloadsBefore)

console.log('\n== 8) إعادة الإرسال من النتيجة المستعادة ==')
await act(async () => { click(byText('button', 'إعادة إرسال النتيجة')) })
await settle(() => net.calls.length >= 2, 2000)
check('إعادة إرسال ثانية بالمعرّف نفسه', net.calls.length === 2 && sentBody(1).attemptId === failedAttemptId)

console.log('')
if (failures) {
  console.log(`❌ فشل ${failures} فحصًا في سير العمل`)
  process.exit(1)
}
console.log('✅ كل فحوص سير العمل ناجحة')
process.exit(0)
