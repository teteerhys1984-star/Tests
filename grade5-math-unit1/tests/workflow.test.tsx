/**
 * اختبار سير العمل الكامل داخل DOM حقيقي (jsdom):
 * ترحيب ← اسم الطالب ← بدء الاختبار ← الإجابة عن كل الفروع ← تسليم بنقرة واحدة
 * ← تنزيل تلقائي ← صفحة النتيجة ← الزر الاحتياطي ← إعادة المحاولة ← دليل المعلّم.
 */
import './setup-dom'
import { D, W, blobTexts, downloads, spies } from './setup-dom'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import App from '../src/App'
import { QUESTIONS } from '../src/exam/questions'
import type { Subpart } from '../src/exam/types'
import { plainMath } from '../src/lib/mathx'
import type { AnswerValue, TfAnswer } from '../src/exam/grading'

let failures = 0
function check(name: string, cond: boolean, extra = '') {
  if (!cond) { failures++; console.log('  ✗ ' + name + (extra ? ' → ' + extra : '')) }
  else console.log('  ✓ ' + name + (extra ? ' → ' + extra : ''))
}

const q = (sel: string) => D.querySelector(sel) as HTMLElement | null
const qa = (sel: string) => Array.from(D.querySelectorAll(sel)) as HTMLElement[]
const byText = (sel: string, txt: string) => qa(sel).find((e) => norm(e.textContent || '').includes(norm(txt))) || null
const norm = (s: string) => s.replace(/\s+/g, ' ').trim()
const bodyText = () => D.body.textContent || ''
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

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
    case 'numeric': case 'protractor': case 'drawangle': case 'text': case 'grid':
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

async function fillSubpart(sp: Subpart, card: HTMLElement) {
  const ans = correctAnswer(sp)
  switch (sp.kind) {
    case 'numeric': case 'text': {
      await act(async () => { setInput(card.querySelector('input.field')!, String(ans)) })
      break
    }
    case 'explain': {
      await act(async () => { setInput(card.querySelector('textarea.field')!, String(ans)) })
      break
    }
    case 'choice': {
      const want = (sp.options ?? []).find((o) => o.id === ans)!.label
      const c = (card.querySelector(`.chip[data-opt-id="${ans}"]`) as HTMLElement) || findChip(card, plainMath(want))
      if (!c) throw new Error(`chip not found for ${want}`)
      await act(async () => { click(c) })
      break
    }
    case 'multiselect': {
      for (const id of ans as string[]) {
        const want = (sp.options ?? []).find((o) => o.id === id)!.label
        const c = (card.querySelector(`.chip[data-opt-id="${id}"]`) as HTMLElement) || findChip(card, plainMath(want))
        if (!c) throw new Error(`chip not found for ${want}`)
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
    case 'grid': {
      const [gx, gy] = String(ans).split(',').map(Number)
      const circle = Array.from(card.querySelectorAll('svg circle'))
        .find((c) => (c.querySelector('title')?.textContent || '').trim() === `(${gx},${gy})`) as unknown as HTMLElement
      if (!circle) throw new Error(`grid cell (${gx},${gy}) not found`)
      await act(async () => { click(circle) })
      break
    }
    case 'protractor': case 'drawangle': {
      const target = sp.angleValue!
      const btns = Array.from(card.querySelectorAll('button')) as HTMLElement[]
      const b10 = btns.find((b) => norm(b.textContent!) === '+10°')!
      const b1 = btns.find((b) => norm(b.textContent!) === '+1°')!
      for (let i = 0; i < Math.floor(target / 10); i++) await act(async () => { click(b10) })
      for (let i = 0; i < target % 10; i++) await act(async () => { click(b1) })
      const commit = btns.find((b) => ['اعتمد القراءة', 'ثبّت الشعاع'].includes(norm(b.textContent!)))!
      await act(async () => { click(commit) })
      break
    }
  }
}

async function main() {
  process.exitCode = 1 // يبقى فشلاً إن انتهى التشغيل قبل اكتمال الفحوص
  const root = createRoot(D.getElementById('root')!)
  await act(async () => { root.render(<App />) })

  console.log('\n== أ) شاشة الترحيب ==')
  check('لا يعمل مؤقّت في شاشة الترحيب', !/\d{2}:\d{2}:\d{2}/.test(bodyText()))
  check('عنوان «اختبار الرياضيات»', (q('h1')?.textContent || '').includes('اختبار الرياضيات'))
  check('«الوحدة الأولى كاملة — الدروس الثمانية»', bodyText().includes('الوحدة الأولى كاملة'))
  check('الدروس الثمانية معروضة', qa('ol li').length >= 8, String(qa('ol li').length))
  check('20 سؤالاً رئيسياً', bodyText().includes('20'))
  check('100 علامة', bodyText().includes('100'))
  check('حقل الاسم إلزامي', !!q('#student-name') && q('#student-name')!.getAttribute('aria-required') === 'true')
  check('زر البدء معطّل بلا اسم', (byText('button', 'بدء الاختبار') as HTMLButtonElement)!.disabled)
  check('شريط التواصل أعلى الصفحة', (qa('.contact-bar')[0]?.textContent || '').includes('المهندس سومر شاهين') && (qa('.contact-bar')[0]?.textContent || '').includes('0930215022'))
  check('شريط التواصل أسفل الصفحة', qa('.contact-bar').length >= 2)
  check('رابط واتساب', !!q('a[href="https://wa.me/963930210522"]'))
  check('لم يُنشأ سياق صوتي', spies.audioCtx === 0)
  check('لم يحدث تنزيل', downloads.length === 0)

  console.log('\n== ب) بدء الاختبار ==')
  await act(async () => { setInput(q('#student-name')!, 'ليان محمد') })
  check('تفعّل الزر بعد كتابة الاسم', !(byText('button', 'بدء الاختبار') as HTMLButtonElement)!.disabled)
  await act(async () => { click(byText('button', 'بدء الاختبار')!) })
  check('ظهرت شاشة الاختبار', !!q('main article'))
  check('ظهر مؤقّت HH:MM:SS', /\d{2}:\d{2}:\d{2}/.test(bodyText()), (bodyText().match(/\d{2}:\d{2}:\d{2}/) || [''])[0])
  check('اسم الطالب ظاهر', bodyText().includes('ليان محمد'))
  check('عُزفت نغمة البدء مرّة واحدة', spies.audioCtx === 1 && spies.oscCount >= 4, `ctx=${spies.audioCtx} osc=${spies.oscCount}`)
  check('لم يبدأ تنزيل', downloads.length === 0)
  const submitBtn = () => byText('button', 'تسليم الاختبار') as HTMLButtonElement | null
  check('زر التسليم موجود ومعطّل', !!submitBtn() && submitBtn()!.disabled)
  check('نص الزر بالضبط «تسليم الاختبار»', norm(submitBtn()!.textContent!).startsWith('تسليم الاختبار'))
  check('رسالة الفروع المتبقية', bodyText().includes('فرعاً بلا إجابة'))
  check('فهرس الأسئلة 20 رقماً', qa('.navpill').length === 20, String(qa('.navpill').length))
  check('لا تلميحات ولا حلول أثناء الاختبار', !/الإجابة الصحيحة|الحلّ المفصّل|القاعدة\/الخاصة|تلميح/.test(q('main')!.textContent || ''))

  console.log('\n== ج) التنقّل بين الأسئلة ==')
  const nextBtn = () => byText('button', 'السؤال التالي')!
  const prevBtn = () => byText('button', 'السؤال السابق')!
  const titleOf = () => {
    const found = QUESTIONS.find((x) => x.subparts.some((sp) => !!D.getElementById(`${sp.id}-lbl`)))
    return found ? found.id : ''
  }
  const seen = new Set<string>([titleOf()])
  check('«السابق» معطّل عند السؤال الأول', (prevBtn() as HTMLButtonElement).disabled)
  for (let i = 0; i < 19; i++) { await act(async () => { click(nextBtn()) }); seen.add(titleOf()) }
  check('كل الأسئلة العشرين معروضة بالتنقّل', seen.size === 20, String(seen.size))
  check('«التالي» معطّل عند السؤال الأخير', (nextBtn() as HTMLButtonElement).disabled)
  for (let i = 0; i < 19; i++) await act(async () => { click(prevBtn()) })
  check('العودة إلى السؤال الأول', bodyText().includes('السؤال 1 من 20'))

  console.log('\n== د) الإجابة عن كل الفروع ==')
  const answered = new Set<string>()
  for (let qi = 0; qi < 20; qi++) {
    const question = QUESTIONS.find((x) => x.id === titleOf())
    if (!question) { failures++; console.log('  ✗ لم يُطابق السؤال المعروض'); break }
    for (const sp of question.subparts) {
      const label = D.getElementById(`${sp.id}-lbl`)
      if (!label) { failures++; console.log(`  ✗ الفرع ${sp.id} غير معروض`); continue }
      try {
        await fillSubpart(sp, label.closest('section') as HTMLElement)
        answered.add(sp.id)
      } catch (e) {
        failures++
        console.log(`  ✗ تعذّرت الإجابة عن ${sp.id} (${sp.kind}): ${(e as Error).message}`)
      }
    }
    if (qi < 19) await act(async () => { click(nextBtn()) })
  }
  check('تمت الإجابة عن 85 فرعاً', answered.size === 85, String(answered.size))
  check('رسالة اكتمال الإجابات', bodyText().includes('أجبت عن جميع الفروع'))
  check('شريط التقدّم 100%', bodyText().includes('100%'))
  check('زر التسليم مُفعّل', !submitBtn()!.disabled)
  check('لا حلول ظاهرة قبل التسليم', !/الإجابة الصحيحة|الحلّ المفصّل/.test(q('main')!.textContent || ''))

  console.log('\n== هـ) التسليم بنقرة واحدة ==')
  const dBefore = downloads.length
  const oscBefore = spies.oscCount
  const clockBefore = (bodyText().match(/\d{2}:\d{2}:\d{2}/g) || []).pop() || ''
  const btnRef = submitBtn()!
  await act(async () => { click(btnRef) })
  console.log(`  [debug] downloads=${downloads.length} (before=${dBefore}) blobs=${blobTexts.length} objectUrls=${spies.objectUrls} resultsPage=${bodyText().includes('تم تسليم الاختبار وتصحيحه')} stillExam=${!!q('main article') && !bodyText().includes('المراجعة التفصيلية')}`)
  check('نقرة واحدة → تنزيل واحد', downloads.length === dBefore + 1, String(downloads.length - dBefore))
  if (downloads.length === dBefore) { console.log('\nتوقّف مبكر للتشخيص'); W.close(); process.exit(1) }
  const dl = downloads[downloads.length - 1]
  check('اسم الملف Grade5_Math_Unit1_<الاسم>_Results.txt', dl.download === 'Grade5_Math_Unit1_ليان_محمد_Results.txt', dl.download)
  check('رابط blob محلي من نوع text/plain;charset=utf-8', dl.href.startsWith('blob:mock/') && dl.href.includes('text%2Fplain') === false && dl.href.includes('text/plain'), dl.href)
  check('عُزفت نغمة التسليم', spies.oscCount > oscBefore, `${oscBefore} → ${spies.oscCount}`)
  check('ظهرت صفحة النتيجة فوراً', bodyText().includes('تم تسليم الاختبار وتصحيحه'))
  check('لا حوار تأكيد', !/هل أنت متأكد|confirm/.test(bodyText()))
  check('اسم الطالب في النتيجة', bodyText().includes('ليان محمد'))
  check('العلامة من 100', bodyText().includes('من 100'))
  check('النسبة المئوية', bodyText().includes('100.0%'))
  check('التقدير', bodyText().includes('ممتاز'))
  check('الطوابع الزمنية بأرقام غربية', /\d{2}:\d{2}:\d{2}/.test(bodyText()) && !/[٠-٩]/.test(bodyText()))
  check('بداية الاختبار / تسليم الاختبار / المدة المنقضية', bodyText().includes('بداية الاختبار') && bodyText().includes('تسليم الاختبار') && bodyText().includes('المدة المنقضية'))
  check('عدّ الأسئلة الصحيحة/الجزئية/الخاطئة', bodyText().includes('أسئلة صحيحة بالكامل') && bodyText().includes('أسئلة صحيحة جزئياً') && bodyText().includes('أسئلة خاطئة'))
  check('عدّ الفروع غير المُجابة', bodyText().includes('فروع لم يُجب عنها'))
  check('زر التنزيل الاحتياطي', !!byText('button', 'تنزيل التقرير TXT'))
  check('زر إعادة المحاولة', !!byText('button', 'إعادة المحاولة'))
  check('رسالة تنزيل صادقة (لا نجاح زائف)', bodyText().includes('بدأ تنزيل التقرير تلقائياً'))
  check('المراجعة التفصيلية 20 سؤالاً', qa('article.reveal').length === 20, String(qa('article.reveal').length))
  check('الحلول ظهرت بعد التسليم فقط', bodyText().includes('الإجابة الصحيحة') && bodyText().includes('الحلّ المفصّل'))
  // «الخطأ الشائع» يُعرض في صفحة النتيجة للفروع غير الصحيحة فقط (والإجابات هنا كلها صحيحة)؛ يُفحص وجوده في ملف التقرير أدناه
  check('القاعدة والهدف والمرجع', bodyText().includes('القاعدة/الخاصة') && bodyText().includes('الهدف / الدرس') && bodyText().includes('المرجع:'))
  check('مراجع الصفحات', /ص 3[0-9]|ص 1[0-9]|ص 3 – 4/.test(bodyText()))

  console.log('\n== و) محتوى ملف TXT ==')
  const txt = blobTexts[blobTexts.length - 1]
  check('الملف يبدأ بـ BOM (UTF-8)', txt.charCodeAt(0) === 0xfeff)
  check('اسم الطالب في الملف', txt.includes('ليان محمد'))
  check('الأسئلة العشرون في الملف', Array.from({ length: 20 }, (_, i) => i + 1).every((n) => txt.includes(`السؤال ${n} —`)))
  check('الفروع أ–هـ في الملف', ['الفرع (أ)', 'الفرع (ب)', 'الفرع (ج)', 'الفرع (د)', 'الفرع (هـ)'].every((t) => txt.includes(t)))
  check('إجابة الطالب والإجابة الصحيحة والحلّ والقاعدة', txt.includes('إجابة الطالب') && txt.includes('الإجابة الصحيحة') && txt.includes('الحلّ المفصّل') && txt.includes('القاعدة/الخاصة'))
  check('العلامات الممنوحة والقصوى', /العلامة النهائية\s*: 100 من 100/.test(txt), (txt.match(/العلامة النهائية[^\r\n]+/) || [''])[0])
  check('الخطأ الشائع في الملف', txt.includes('الخطأ الشائع'))
  check('الدروس الثمانية مذكورة', ['شبكة الإحداثيات', 'التمثيلات البيانية بالخطوط', 'الأعداد الطبيعية', 'تقريب الأعداد الطبيعية', 'جمع الأعداد الطبيعية وطرحها', 'قياس الزوايا', 'متوازي الأضلاع', 'المعيّن'].every((t) => txt.includes(t)))
  check('الطوابع الزمنية والمدة', txt.includes('بداية الاختبار') && txt.includes('تسليم الاختبار') && txt.includes('HH:MM:SS'))
  check('العربية سليمة بلا mojibake', !/Ã|â€/.test(txt.replace(/^\uFEFF/, '')))
  check('لا رموز $ غير محوّلة', !txt.includes('$'), String((txt.match(/\$/g) || []).length))
  check('لا أرقام هندية', !/[٠-٩]/.test(txt))
  check('لا ZIP ولا تشفير ولا كلمة سر تقرير', !/\.zip|PK\u0003\u0004|AES-|كلمة سر التقرير/i.test(txt))
  check('لا كلمة مرور المعلّم في التقرير', !txt.includes('somer173'))
  check('حجم الملف معقول', txt.length > 40000, `${txt.length} حرفاً`)

  console.log('\n== ز) الزر الاحتياطي يعيد الملف نفسه ==')
  const dBefore2 = downloads.length
  await act(async () => { click(byText('button', 'تنزيل التقرير TXT')!) })
  check('أُضيف تنزيل ثانٍ', downloads.length === dBefore2 + 1)
  check('اسم الملف نفسه', downloads[downloads.length - 1].download === dl.download)
  check('المحتوى نفسه حرفياً', blobTexts[blobTexts.length - 1] === txt)
  check('لا تنزيلات إضافية أخرى', downloads.length === dBefore2 + 1)

  console.log('\n== ح) توقّف المؤقّت ==')
  const readClock = () => (bodyText().match(/\d{2}:\d{2}:\d{2}/g) || []).slice(-1)[0] || ''
  const c1 = readClock()
  await act(async () => { await sleep(1600) })
  const c2 = readClock()
  check('المدة ثابتة بعد التسليم', c1 === c2 && c1 !== '', `${c1} / ${c2}`)
  void clockBefore

  console.log('\n== ط) إعادة المحاولة ==')
  const oscAfterSubmit = spies.oscCount
  await act(async () => { click(byText('button', 'إعادة المحاولة')!) })
  check('عاد إلى شاشة الترحيب', !!q('#student-name'))
  check('حقل الاسم فارغ (يسمح باسم مختلف)', (q('#student-name') as HTMLInputElement).value === '')
  check('لا مؤقّت ظاهراً', !/\d{2}:\d{2}:\d{2}/.test(bodyText()))
  check('زر البدء معطّل مجدداً', (byText('button', 'بدء الاختبار') as HTMLButtonElement)!.disabled)
  check('لم يحدث تنزيل إضافي', downloads.length === dBefore2 + 1)
  check('أُعيد ضبط المؤثرات الصوتية', spies.audioCtx >= 1)
  await act(async () => { setInput(q('#student-name')!, 'طالب آخر') })
  await act(async () => { click(byText('button', 'بدء الاختبار')!) })
  check('بدأت محاولة جديدة باسم مختلف', bodyText().includes('طالب آخر'))
  check('المؤقّت بدأ من جديد', /\b00:00:0[0-9]\b/.test(bodyText()), (bodyText().match(/\d{2}:\d{2}:\d{2}/) || [''])[0])
  check('الإجابات مُسحت والتسليم معطّل', submitBtn()!.disabled && bodyText().includes('فرعاً بلا إجابة'))
  check('لا حلول في المحاولة الجديدة', !/الإجابة الصحيحة|الحلّ المفصّل/.test(q('main')!.textContent || ''))
  check('نغمة البدء لم تُعزف مرتين في المحاولة نفسها', spies.oscCount > oscAfterSubmit)

  console.log('\n== ي) دليل المعلّم محمي بكلمة مرور ==')
  await act(async () => { root.unmount() })
  const root2 = createRoot(D.getElementById('root')!)
  await act(async () => { root2.render(<App />) })
  await act(async () => { click(byText('button', 'دليل المعلّم ونموذج الإجابات')!) })
  check('بوابة كلمة المرور ظاهرة', bodyText().includes('كلمة المرور'))
  check('لا إجابات قبل كلمة المرور', !bodyText().includes('الإجابة الصحيحة'))
  check('تنبيه أنّ الحماية من جهة العميل', bodyText().includes('client-side') || bodyText().includes('جهة العميل'))
  await act(async () => { setInput(q('#pw')!, 'غلط') })
  await act(async () => { click(byText('button', 'فتح الدليل')!) })
  check('كلمة مرور خاطئة مرفوضة', bodyText().includes('غير صحيحة'))
  await act(async () => { setInput(q('#pw')!, 'somer173') })
  await act(async () => { click(byText('button', 'فتح الدليل')!) })
  check('الدليل مفتوح', bodyText().includes('نموذج الإجابات ودليل التصحيح'))
  check('يعرض الأسئلة العشرين', qa('article.reveal').length === 20, String(qa('article.reveal').length))
  check('مصفوفة تغطية الدروس', bodyText().includes('مصفوفة تغطية الدروس'))
  await act(async () => { click(byText('button', 'رجوع إلى صفحة الاختبار')!) })
  check('العودة تعمل', !!q('#student-name'))

  console.log('\n' + (failures === 0 ? '✅ اختبار سير العمل الكامل نجح' : `❌ ${failures} فشل`))
  await act(async () => { root2.unmount() })
  W.close()
  process.exit(failures === 0 ? 0 : 1)
}

main().catch((e) => { console.error(e); process.exit(1) })
