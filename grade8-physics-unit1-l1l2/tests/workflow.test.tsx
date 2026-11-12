/**
 * اختبار سير العمل الكامل داخل DOM حقيقي (jsdom):
 * ترحيب ← اسم الطالب ← بدء الاختبار ← الإجابة عن كل الفروع ← مراجعة الإجابات
 * ← تسليم بنقرة واحدة ← تنزيل تلقائي للتقرير ← صفحة النتيجة ← زر التنزيل الاحتياطي
 * ← شريط حالة الإرسال (جارٍ/تم/تعذّر) ← «إعادة إرسال النتيجة» ← «إعادة الاختبار».
 *
 * لا يُجرى أي اتصال حقيقي: fetch مُعترَض في setup-dom.
 */
import './setup-dom'
import { D, W, blobTexts, downloads, net } from './setup-dom'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import App from '../src/App'
import { QUESTIONS } from '../src/exam/questions'
import type { Subpart } from '../src/exam/types'
import { plainMath } from '../src/lib/mathx'
import type { AnswerValue, TfAnswer } from '../src/exam/grading'
import { EXAM_ID, SHEETS_TOKEN, SHEETS_URL } from '../src/config'

/* علامة يجب ألّا تظهر في أي ملف منشور: تُبنى من جزأين كي لا يبقى أثرها هنا. */
const FORBIDDEN_MARK = new RegExp('ar' + 'ena', 'i')

let failures = 0
function check(name: string, cond: boolean, extra = '') {
  if (!cond) { failures++; console.log('  ✗ ' + name + (extra ? ' → ' + extra : '')) }
  else console.log('  ✓ ' + name + (extra ? ' → ' + extra : ''))
}

const q = (sel: string) => D.querySelector(sel) as HTMLElement | null
const qa = (sel: string) => Array.from(D.querySelectorAll(sel)) as HTMLElement[]
const norm = (s: string) => s.replace(/\s+/g, ' ').trim()
const byText = (sel: string, txt: string) => qa(sel).find((e) => norm(e.textContent || '').includes(norm(txt))) || null
const bodyText = () => D.body.textContent || ''
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

const banner = () => q('[data-send-status]')
const bannerStatus = () => banner()?.getAttribute('data-send-status') ?? ''
const bannerText = () => norm(banner()?.querySelector('p')?.textContent || '')
const sentBody = (i: number) => JSON.parse(String(net.calls[i].init.body))
const pendingKeys = () =>
  Array.from({ length: W.localStorage.length }, (_, i) => W.localStorage.key(i) as string).filter((k) => k.startsWith('pending:'))
const NO_SEND_CLAIM = /دون إرسال أي بيانات|لم تُرسل أيّ بيانات|لم يُرسل أيّ بيانات|لا تُرسل نتائج/

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
function click(el: any) { fire(el, 'click', W.MouseEvent) }
function setInput(el: any, value: string) {
  const proto = el instanceof W.HTMLTextAreaElement
    ? W.HTMLTextAreaElement.prototype
    : el instanceof W.HTMLSelectElement ? W.HTMLSelectElement.prototype : W.HTMLInputElement.prototype
  Object.getOwnPropertyDescriptor(proto, 'value')!.set!.call(el, value)
  fire(el, 'input')
  fire(el, 'change')
}

function correctAnswer(sp: Subpart): AnswerValue {
  switch (sp.kind) {
    case 'numeric': case 'text':
      return String(Array.isArray(sp.correct) ? sp.correct[0] : sp.correct)
    case 'explain': return (sp.rubricAll ?? []).map((gr) => gr[0]).join(' و ')
    case 'choice': return String(sp.correct)
    case 'multiselect': return (sp.correct as string[]).slice()
    case 'tf': {
      const t: TfAnswer = { value: sp.correct === true ? 'true' : 'false', correction: '' }
      if (sp.requireCorrection) t.correction = (sp.correction ?? []).map((gr) => gr.join(' و ')).join(' و ')
      return t
    }
    case 'matching': return Object.fromEntries((sp.rows ?? []).map((r) => [r.id, r.answer]))
    case 'ordering': return (sp.items ?? []).map((i) => i.id)
    default: return ''
  }
}

const chipsIn = (card: HTMLElement) => Array.from(card.querySelectorAll('.chip')) as HTMLElement[]
const findChip = (card: HTMLElement, text: string) =>
  chipsIn(card).find((c) => norm(c.textContent!).includes(norm(text))) as HTMLElement

/** يجيب عن فرع واحد داخل بطاقته. */
async function fillSubpart(sp: Subpart, card: HTMLElement) {
  const ans = correctAnswer(sp)
  switch (sp.kind) {
    case 'numeric':
    case 'text':
      await act(async () => { setInput(card.querySelector('input.field')!, String(ans)) })
      break
    case 'explain':
      await act(async () => { setInput(card.querySelector('textarea.field')!, String(ans)) })
      break
    case 'choice': {
      const want = (sp.options ?? []).find((o) => o.id === ans)!.label
      const c = (card.querySelector(`.chip[data-opt-id="${ans}"]`) as HTMLElement) || findChip(card, plainMath(want))
      if (!c) throw new Error(`chip not found for ${sp.id}: ${want}`)
      await act(async () => { click(c) })
      break
    }
    case 'multiselect': {
      for (const id of ans as string[]) {
        const want = (sp.options ?? []).find((o) => o.id === id)!.label
        const c = (card.querySelector(`.chip[data-opt-id="${id}"]`) as HTMLElement) || findChip(card, plainMath(want))
        if (!c) throw new Error(`chip not found for ${id}`)
        await act(async () => { click(c) })
      }
      break
    }
    case 'tf': {
      const t = ans as TfAnswer
      await act(async () => { click(chipsIn(card).find((c) => norm(c.textContent!) === (t.value === 'true' ? 'صواب' : 'خطأ'))!) })
      if (sp.requireCorrection) await act(async () => { setInput(card.querySelector('textarea.field')!, t.correction) })
      break
    }
    case 'matching': {
      const rec = ans as Record<string, string>
      for (const row of sp.rows ?? []) {
        const sel = card.querySelector(`select[data-row-id="${row.id}"]`) as HTMLSelectElement
        if (!sel) throw new Error(`select not found for row ${row.id}`)
        await act(async () => { setInput(sel, rec[row.id]) })
      }
      break
    }
    case 'ordering': {
      for (const id of ans as string[]) {
        const it = (sp.items ?? []).find((x) => x.id === id)!
        const c = (card.querySelector(`.chip[data-item-id="${it.id}"]`) as HTMLElement) || findChip(card, plainMath(it.text))
        if (!c) throw new Error(`ordering chip not found for ${it.text}`)
        await act(async () => { click(c) })
      }
      break
    }
    default:
      break
  }
}

/** يجيب عن السؤال المعروض حالياً بكل فروعه. */
async function answerCurrentQuestion(qIndex: number) {
  const question = QUESTIONS[qIndex]
  const cards = qa('.subcard') as HTMLElement[]
  if (cards.length !== question.subparts.length) {
    throw new Error(`عدد بطاقات الفروع غير متوقع للسؤال ${qIndex + 1}: ${cards.length}`)
  }
  for (let i = 0; i < question.subparts.length; i++) {
    await fillSubpart(question.subparts[i], cards[i])
  }
}

async function nextQuestion() {
  const btn = byText('button', 'السؤال التالي') as HTMLElement
  await act(async () => { click(btn) })
}

async function startExam(name: string) {
  const input = q('#student-name') as HTMLInputElement
  await act(async () => { setInput(input, name) })
  const start = byText('button', 'بدء الاختبار') as HTMLElement
  await act(async () => { click(start) })
}

async function goThroughAllQuestions() {
  for (let i = 0; i < QUESTIONS.length; i++) {
    await answerCurrentQuestion(i)
    if (i < QUESTIONS.length - 1) await nextQuestion()
  }
}

/* ================================================================== */
console.log('\n== 1) صفحة الترحيب والاسم والخصوصية ==')
/* ================================================================== */
W.localStorage.clear()
net.calls.length = 0
net.respond = () => JSON.stringify({ ok: true })
downloads.length = 0
blobTexts.length = 0

const container = D.getElementById('root')!
const root = createRoot(container)
await act(async () => { root.render(<App />) })

check('صفحة الترحيب ظاهرة', !!q('#student-name'))
check('اسم الاختبار يذكر الفيزياء والصف الثامن', /الفيزياء/.test(bodyText()) && /الثامن/.test(bodyText()))
check('الواجهة عربية واتجاه RTL', D.documentElement.getAttribute('dir') === 'rtl' && D.documentElement.getAttribute('lang') === 'ar')
check('يذكر الدرسين الأول والثاني فقط', /الدرس الأول|القوى المتلاقية/.test(bodyText()) && /القوى المتوازية/.test(bodyText()))
check('عدد الأسئلة والفروع والعلامات معروض', /10/.test(bodyText()) && /49/.test(bodyText()) && /100/.test(bodyText()))
check('الخصوصية: يُخبَر الطالب أن نتيجته وإجاباته تُرسَل إلى معلّمه',
  /تُرسَل نتيجتك/.test(bodyText()) && /معلّمك/.test(bodyText()))
check('لا يوجد أي ادّعاء بعدم إرسال البيانات', !NO_SEND_CLAIM.test(bodyText()))
check('لا توجد العلامة الممنوعة في الصفحة', !FORBIDDEN_MARK.test(D.documentElement.outerHTML))
check('لا إرسال قبل بدء الاختبار', net.calls.length === 0)

const startBtn = byText('button', 'بدء الاختبار') as HTMLElement
check('زر البدء معطّل قبل كتابة الاسم', startBtn.hasAttribute('disabled'))
await act(async () => { setInput(q('#student-name')!, 'سا') })
check('زر البدء يبقى معطّلاً لاسم قصير', (byText('button', 'بدء الاختبار') as HTMLElement).hasAttribute('disabled'))

/* ================================================================== */
console.log('\n== 2) بدء الاختبار وعرض الأسئلة ==')
/* ================================================================== */
await startExam('سارة أحمد')
check('انتقل إلى صفحة الأسئلة', !!q('.subcard'))
check('اسم الطالب في الشريط العلوي', /سارة أحمد/.test(bodyText()))
check('المؤقّت ظاهر', /00:00/.test(bodyText()))
check('مؤشّر التقدّم ظاهر', !!q('[role="progressbar"]'))
check('لا تلميحات ولا تصحيح أثناء الاختبار', !/الإجابة الصحيحة/.test(bodyText()))
check('كل الترميز الرياضي عُرض بلا أخطاء KaTeX', D.querySelectorAll('.katex-error').length === 0,
  String(D.querySelectorAll('.katex-error').length))
check('الرموز الرياضية معروضة (KaTeX نشط)', D.querySelectorAll('.katex').length > 0)

/* ================================================================== */
console.log('\n== 3) مراجعة الإجابات قبل التسليم ==')
/* ================================================================== */
{
  const review = byText('button', 'مراجعة الإجابات والتسليم') as HTMLElement
  check('زر «مراجعة الإجابات والتسليم» متاح دائماً', !!review)
  await act(async () => { click(review) })
  check('صفحة المراجعة ظاهرة', /مراجعة الإجابات قبل التسليم/.test(bodyText()))
  check('صفحة المراجعة تعرض أسئلة ناقصة', /تبقّى/.test(bodyText()))
  const submit = byText('button', 'تسليم الاختبار') as HTMLElement | null
  check('زر التسليم معطّل ما دامت هناك فروع بلا إجابة', !!submit && submit.hasAttribute('disabled'))
  const back = byText('button', 'العودة إلى الأسئلة') as HTMLElement
  await act(async () => { click(back) })
  check('العودة إلى الأسئلة تعمل', !!q('.subcard'))
}

/* ================================================================== */
console.log('\n== 4) الإجابة عن كل الفروع ==')
/* ================================================================== */
await goThroughAllQuestions()
check('أُجيب عن كل الفروع (49)', !/تبقّى \d+ فرعاً بلا إجابة/.test(bodyText()))
{
  const last = byText('button', 'مراجعة الإجابات') as HTMLElement
  check('زر الانتقال إلى المراجعة من آخر سؤال', !!last)
  await act(async () => { click(last) })
  check('لا أسئلة ناقصة في المراجعة', !/تبقّى/.test(bodyText()))
  const submit = byText('button', 'تسليم الاختبار') as HTMLElement
  check('زر التسليم مفعّل الآن', !!submit && !submit.hasAttribute('disabled'))
  check('المراجعة تعرض عدد الفروع المُجابة 49/49', /49 \/ 49/.test(bodyText()))
  check('المراجعة تعرض تنبيه الخصوصية', /تُرسَل نتيجتك/.test(bodyText()))

  /* ================================================================== */
  console.log('\n== 5) التسليم: تصحيح + تقرير + تنزيل + إرسال ==')
  /* ================================================================== */
  await act(async () => { click(submit) })
  await settle(() => bannerStatus() === 'success' || bannerStatus() === 'failed', 6000)

  check('انتقل إلى صفحة النتيجة', /تم تسليم الاختبار وتصحيحه/.test(bodyText()))
  check('التقرير نُزّل تلقائياً (رابط تنزيل واحد)', downloads.length === 1, String(downloads.length))
  check('اسم ملف التقرير صحيح', downloads[0]?.download === 'Grade8_Physics_Unit1_L1L2_سارة_أحمد_Results.txt', downloads[0]?.download)
  check('محتوى التقرير نصّي كامل', blobTexts[0]?.includes('تقرير نتيجة اختبار الفيزياء') && blobTexts[0]?.includes('الإجابة الصحيحة'))
  check('التقرير يذكر أسئلة الدرسين', blobTexts[0]?.includes('القوى المتلاقية') && blobTexts[0]?.includes('القوى المتوازية'))
  check('لا ترميز LaTeX خام في التقرير', !/\$/.test(blobTexts[0] ?? ''))
  check('لا العلامة الممنوعة في التقرير', !FORBIDDEN_MARK.test(blobTexts[0] ?? ''))
  check('العلامة 100/100 معروضة', /100/.test(bodyText()) && /النسبة:/.test(bodyText()))
  check('حالة الإرسال ظاهرة في صفحة النتيجة', bannerStatus() === 'success' || bannerStatus() === 'failed', bannerStatus())
  check('شريط الحالة يقول «جارٍ الإرسال» أو انتهى', banner() !== null)
  check('رسالة النجاح بنصّها المطلوب', bannerStatus() === 'success' && bannerText().includes('تم إرسال نتيجتك إلى معلّمك ✓'), bannerText())
  check('لا يوجد زر إعادة إرسال عند النجاح', !q('[data-action="resend-result"]'))

  /* ---- الحمولة المرسلة ---- */
  check('أُرسل طلب واحد فقط', net.calls.length === 1, String(net.calls.length))
  check('الطلب إلى SHEETS_URL', net.calls[0].url === SHEETS_URL)
  check('Content-Type = text/plain;charset=utf-8',
    JSON.stringify(net.calls[0].init.headers) === '{"Content-Type":"text/plain;charset=utf-8"}')
  const body = sentBody(0)
  check('الحقول العليا كما في عقد المرجع', JSON.stringify(Object.keys(body)) === JSON.stringify(
    ['token', 'attemptId', 'examId', 'examTitle', 'studentName', 'startAt', 'submitAt', 'elapsedSec', 'summary', 'lessons', 'details', 'reportText']))
  check('examId = grade8-physics-unit1-l1l2', body.examId === EXAM_ID)
  check('token من الإعدادات', body.token === SHEETS_TOKEN)
  check('اسم الطالب في الحمولة', body.studentName === 'سارة أحمد')
  check('attemptId غير فارغ وفريد', typeof body.attemptId === 'string' && body.attemptId.length > 10)
  check('details فيها مدخل لكل فرع (49)', body.details.length === 49, String(body.details.length))
  check('summary.total = 100 و max = 100', body.summary.total === 100 && body.summary.max === 100)
  check('gradeLabel موجود في summary (للمعلّم)', typeof body.summary.gradeLabel === 'string' && body.summary.gradeLabel === 'ممتاز')
  check('reportText مطابق للتقرير المنزَّل', body.reportText === blobTexts[0])
  check('lessons فيها عنوانا الدرسين', body.lessons.length === 2 && body.lessons[0].title === 'القوى المتلاقية')
  check('لا يُعرض gradeLabel للطالب في صفحة النتيجة', !/التقدير:|ممتاز/.test(bodyText()))
  check('حلول المراجعة عُرضت بلا أخطاء KaTeX', D.querySelectorAll('.katex-error').length === 0,
    String(D.querySelectorAll('.katex-error').length))
  check('لا معلّقات متبقّية بعد النجاح', pendingKeys().length === 0)
  check('تنزيل احتياطي متاح من صفحة النتيجة', !!byText('button', 'تنزيل التقرير TXT'))

  /* ---- زر التنزيل الاحتياطي ---- */
  const before = downloads.length
  await act(async () => { click(byText('button', 'تنزيل التقرير TXT')!) })
  check('زر «تنزيل التقرير TXT» ينزّل التقرير نفسه', downloads.length === before + 1
    && blobTexts[blobTexts.length - 1] === blobTexts[0])
}

/* ================================================================== */
console.log('\n== 6) إعادة الاختبار تفصل حالتها عن إعادة الإرسال ==')
/* ================================================================== */
{
  const retry = q('[data-action="retry-exam"]') as HTMLElement
  check('زر «إعادة الاختبار» موجود ومنفصل عن إعادة الإرسال', !!retry)
  check('لا خلط بين الزرّين: لا يوجد زر إعادة إرسال الآن', !q('[data-action="resend-result"]'))
  await act(async () => { click(retry) })
  check('العودة إلى صفحة الترحيب', !!q('#student-name'))
  check('الاسم مُسح عند بدء محاولة جديدة', (q('#student-name') as HTMLInputElement).value === '')
  check('لا حالة إرسال عالقة في صفحة الترحيب', !banner())
}

/* ================================================================== */
console.log('\n== 7) فشل الإرسال: شريط «تعذّر» + زر إعادة الإرسال + الحفظ المعلّق ==')
/* ================================================================== */
{
  W.localStorage.clear()
  net.calls.length = 0
  downloads.length = 0
  net.respond = () => { throw new Error('offline') }

  await startExam('علي حسن')
  await goThroughAllQuestions()
  await act(async () => { click(byText('button', 'مراجعة الإجابات')!) })
  const t0 = Date.now()
  await act(async () => { click(byText('button', 'تسليم الاختبار')!) })
  // محاولات الإرسال: 3 محاولات بفواصل 2 ثم 5 ثوانٍ (حقيقية هنا)
  await settle(() => bannerStatus() === 'failed', 20000)
  const waited = Date.now() - t0

  check('ظهرت صفحة النتيجة رغم فشل الإرسال', /تم تسليم الاختبار وتصحيحه/.test(bodyText()))
  check('التقرير نُزّل رغم فشل الإرسال (نسخة احتياطية)', downloads.length === 1)
  check('شريط الحالة: تعذّر الإرسال', bannerStatus() === 'failed', bannerStatus())
  check('نصّ شريط الفشل صريح', /تعذّر إرسال النتيجة/.test(bannerText()), bannerText())
  check('زر «إعادة إرسال النتيجة» ظاهر', !!q('[data-action="resend-result"]')
    && norm(q('[data-action="resend-result"]')!.textContent!).includes('إعادة إرسال النتيجة'))
  check('ثلاث محاولات إرسال فعلاً', net.calls.length === 3, String(net.calls.length))
  check('الفواصل بين المحاولات ≈ 2 ثم 5 ثوانٍ', waited >= 6500, `${waited}ms`)
  check('الحمولة محفوظة في localStorage تحت pending:<EXAM_ID>:<attemptId>',
    pendingKeys().length === 1 && pendingKeys()[0].startsWith(`pending:${EXAM_ID}:`), pendingKeys().join(','))
  const stored = JSON.parse(W.localStorage.getItem(pendingKeys()[0])!)
  check('المحفوظ هو الحمولة نفسها', stored.studentName === 'علي حسن' && stored.details.length === 49
    && stored.attemptId === sentBody(0).attemptId)

  /* ---- إعادة الإرسال من الزر بعد عودة الشبكة ---- */
  net.respond = () => JSON.stringify({ ok: true })
  const beforeResend = net.calls.length
  await act(async () => { click(q('[data-action="resend-result"]')!) })
  check('فور الضغط: الحالة «جارٍ الإرسال»', bannerStatus() === 'sending' || bannerStatus() === 'success', bannerStatus())
  await settle(() => bannerStatus() === 'success', 6000)
  check('بعد النجاح: «تم إرسال نتيجتك إلى معلّمك ✓»', bannerText().includes('تم إرسال نتيجتك إلى معلّمك ✓'), bannerText())
  check('لم يُرسل طلب جديد عند النجاح', net.calls.length === beforeResend + 1)
  check('نفس attemptId عند إعادة الإرسال', sentBody(net.calls.length - 1).attemptId === sentBody(0).attemptId)
  check('حُذف المعلّق بعد النجاح', pendingKeys().length === 0)
  check('اختفى زر إعادة الإرسال', !q('[data-action="resend-result"]'))
}

/* ================================================================== */
console.log('\n== 8) إعادة إرسال المعلّقات عند فتح الاختبار لاحقاً ==')
/* ================================================================== */
{
  await act(async () => { click(q('[data-action="retry-exam"]')!) })
  // نحاكي محاولة سابقة لم تُرسل ثم أُغلقت الصفحة
  const payload = {
    token: SHEETS_TOKEN, attemptId: 'pending-attempt-1', examId: EXAM_ID, examTitle: 'اختبار الفيزياء',
    studentName: 'طالب سابق', startAt: new Date().toISOString(), submitAt: new Date().toISOString(), elapsedSec: 600,
    summary: { total: 40, max: 100, percentage: 40, gradeLabel: 'يحتاج إلى دعم' },
    lessons: [], details: [], reportText: 'تقرير',
  }
  W.localStorage.setItem(`pending:${EXAM_ID}:pending-attempt-1`, JSON.stringify(payload))
  W.localStorage.setItem('pending:other-exam:x', JSON.stringify({ ...payload, attemptId: 'x' }))
  net.calls.length = 0
  net.respond = () => JSON.stringify({ ok: true })

  root.render(<App key="reopen" />)
  await act(async () => { await sleep(120) })
  check('أُعيد إرسال المعلّق عند التحميل', net.calls.length >= 1 && sentBody(0).attemptId === 'pending-attempt-1',
    `${net.calls.length} طلب`)
  check('حُذف المعلّق بعد نجاح الإرسال', W.localStorage.getItem(`pending:${EXAM_ID}:pending-attempt-1`) === null)
  check('معلّق اختبار آخر لم يُمسّ', W.localStorage.getItem('pending:other-exam:x') !== null)
  check('لا يدخل الطالب في الاختبار تلقائياً', !!q('#student-name'))
}

/* ================================================================== */
console.log('\n== 9) لا أثر للعلامة الممنوعة في أي مكان من الواجهة ==')
/* ================================================================== */
check('الواجهة الحالية خالية من العلامة الممنوعة', !FORBIDDEN_MARK.test(D.documentElement.outerHTML))
check('سجل الطلبات لا يحتوي العلامة الممنوعة', !FORBIDDEN_MARK.test(JSON.stringify(net.calls.map((c) => c.url))))

await act(async () => { root.unmount() })

/*
 * التوقيتان الوحيدتان المتبقيتان في التطبيق: إعادةُ رسم المؤقّت التصاعدي (كل ثانية)
 * ومهلةُ إزالة رابط التنزيل (12 ثانية). كلاهما لا يؤثر في أي فحص، لكن إبقاءهما
 * يُبقي حلقة node حيّة. لا شيء آخر مفتوح: fetch وهمي وأحداث الصفحة مغلقة.
 */
W.close()
setTimeout(() => process.exit(failures ? 1 : 0), 50).unref?.()

if (failures) {
  console.log(`\n❌ ${failures} فحصاً فاشلاً`)
  process.exitCode = 1
} else {
  console.log('\n✅ نجحت كل فحوص سير العمل')
  process.exitCode = 0
}
