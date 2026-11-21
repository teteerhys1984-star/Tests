// @vitest-environment jsdom
/**
 * سير العمل الكامل داخل DOM حقيقي (jsdom) — من شاشة البداية إلى النتيجة:
 * الاسم ← البدء ← الإجابة والحفظ التلقائي ← الاستعادة بعد «إعادة تحميل»
 * ← التنقل ← بوابة الإكمال ← نافذة التأكيد النهائي ← النتيجة والتقرير
 * ← حالة الإرسال (شبكة وهمية فقط) ← إعادة الإرسال اليدوي بنفس attemptId
 * ← إعادة الإرسال التلقائي عند الفتح ← لوحة المعلم بكلمة المرور ← محاولة جديدة.
 *
 * لا يُجرى أي اتصال حقيقي: fetch معترض دائماً، ولا تُرسل أي بيانات طلاب حقيقية
 * (الأسماء والنتائج في هذه الاختبارات مصنّعة بالكامل).
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { createRoot, type Root } from 'react-dom/client'
import { act } from 'react'
import App from '../src/App'
import { EXAM_ID, EXAM_TITLE, SHEETS_URL } from '../src/config'
import { STORAGE_KEY, type PlatformAttemptState } from '../src/lib/attempt'
import { PENDING_PREFIX, buildPayload, pendingKey } from '../src/lib/submit'
import { buildReportText } from '../src/lib/report'
import { examQuestions } from '../src/data/questions'
import { gradeFullExam } from '../src/utils/scoring'
import { perfectAnswers } from './answers'

const net = {
  calls: [] as Array<{ url: string; init: RequestInit; body: unknown }>,
  reply: '{"ok":true}',
  mode: 'reply' as 'reply' | 'reject',
}

beforeAll(() => {
  // اعتراض الشبكة والتنزيل قبل تحميل التطبيق — أي «إرسال» يبقى وهمياً
  vi.stubGlobal('fetch', (url: string, init: RequestInit) => {
    net.calls.push({ url: String(url), init, body: JSON.parse(String(init.body)) })
    if (net.mode === 'reject') return Promise.reject(new Error('offline (mock)'))
    return Promise.resolve({ text: async () => net.reply })
  })
  Object.defineProperty(globalThis.URL, 'createObjectURL', {
    configurable: true,
    value: () => 'blob:mock',
  })
  Object.defineProperty(globalThis.URL, 'revokeObjectURL', {
    configurable: true,
    value: () => {},
  })
  Element.prototype.scrollIntoView = () => {}
  window.scrollTo = () => {}
})

let root: Root | null = null
let container: HTMLDivElement

beforeEach(() => {
  window.localStorage.clear()
  net.calls.length = 0
  net.reply = '{"ok":true}'
  net.mode = 'reply'
  container = document.createElement('div')
  document.body.appendChild(container)
})

afterEach(() => {
  if (root) act(() => root!.unmount())
  root = null
  container.remove()
})

function render() {
  root = createRoot(container)
  act(() => root!.render(<App />))
}

/** إعادة تحميل الصفحة: فك التركيب ثم تركيب جديد من التخزين المحفوظ. */
function reload() {
  act(() => root!.unmount())
  root = null
  render()
}

const flush = async (ms = 0) => {
  await act(async () => {
    await new Promise((r) => setTimeout(r, ms))
  })
}

const text = () => container.textContent ?? ''
const button = (label: string): HTMLButtonElement | null =>
  [...container.querySelectorAll('button')].find((b) =>
    (b.textContent ?? '').includes(label),
  ) as HTMLButtonElement | null
const click = (el: HTMLElement) => act(() => void el.click())

function typeInto(el: HTMLInputElement, value: string) {
  act(() => {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!
    setter.call(el, value)
    el.dispatchEvent(new Event('input', { bubbles: true }))
  })
}

const nameInput = () => container.querySelector('#student-name-input') as HTMLInputElement
const branchInput = (branchId: string) =>
  container.querySelector(`#input-${branchId}`) as HTMLInputElement | null

const stored = (): PlatformAttemptState =>
  JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? 'null')

function startExam(name = 'سارة أحمد') {
  render()
  typeInto(nameInput(), name)
  click(button('بدء الاختبار')!)
}

/** بذرة محاولة نشطة مكتملة الإجابات (كما بعد حلّ الاختبار بالكامل). */
function seedCompleteAttempt(attemptId = 'seeded-attempt-id') {
  const state: PlatformAttemptState = {
    version: 1,
    attemptId,
    studentName: 'سارة أحمد',
    hasStarted: true,
    isSubmitted: false,
    submitConfirmed: false,
    submitDelivered: false,
    startedAtTimestamp: Date.now() - 600_000,
    submittedAtTimestamp: null,
    currentQuestionIndex: 0,
    answers: { ...perfectAnswers },
    isMuted: true,
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

describe('شاشة البداية', () => {
  it('تعرض عنوان الاختبار ومعلوماته وتمنع البدء بلا اسم', () => {
    render()
    expect(text()).toContain(EXAM_TITLE)
    expect(text()).toContain('مذاكرة رياضيات صف خامس نموذج B')
    expect(text()).toContain('30 سؤالاً رئيسياً')
    expect(text()).toContain('100 علامة')
    expect(text()).toContain('الدروس الثمانية')
    // عنوان الصفحة المنشورة
    const html = readFileSync(path.resolve(__dirname, '..', 'index.html'), 'utf8')
    expect(html).toContain('<title>مذاكرة رياضيات صف خامس نموذج B</title>')
    expect(html).toContain('dir="rtl"')
    // زر البدء معطّل والاسم فارغ، ولا أي اتصال شبكي
    expect((button('بدء الاختبار') as HTMLButtonElement).disabled).toBe(true)
    expect(net.calls).toHaveLength(0)
    // لا إجابات نموذجية على شاشة البداية
    expect(text()).not.toContain('الإجابة النموذجية:')
  })

  it('عرض الدروس الثمانية وتوزيع العلامات على شاشة البداية', () => {
    render()
    for (const lesson of ['شبكة الإحداثيات', 'التمثيلات البيانية بالخطوط', 'الأعداد الطبيعية', 'تقريب الأعداد الطبيعية', 'جمع الأعداد الطبيعية وطرحها', 'قياس الزوايا', 'متوازي الأضلاع', 'المعيّن']) {
      expect(text()).toContain(lesson)
    }
  })
})

describe('بدء الاختبار والحفظ التلقائي والاستعادة', () => {
  it('البدء ينشئ محاولة بمعرّف ثابت ويحفظها ويشغّل المؤقت', () => {
    startExam()
    const s = stored()
    expect(s).not.toBeNull()
    expect(s.studentName).toBe('سارة أحمد')
    expect(s.hasStarted).toBe(true)
    expect(s.isSubmitted).toBe(false)
    expect(typeof s.startedAtTimestamp).toBe('number')
    expect(s.attemptId.length).toBeGreaterThan(8)
    expect(s.answers).toEqual({})
    expect(text()).toContain('السؤال 1 من 30')
    expect(text()).toContain('00:00:0')
    // لا إجابات نموذجية أثناء الحل
    expect(text()).not.toContain('الإجابة النموذجية:')
    expect(net.calls).toHaveLength(0)
  })

  it('الإجابة تُحفظ تلقائياً وتُستعاد بعد إعادة التحميل في حقلها', () => {
    startExam()
    typeInto(branchInput('q01-a')!, '(6, 4)')
    expect(stored().answers['q01-a']).toBe('(6, 4)')

    reload()
    expect(stored().answers['q01-a']).toBe('(6, 4)')
    expect(branchInput('q01-a')!.value).toBe('(6, 4)')
    expect(text()).toContain('الطالبة: سارة أحمد')
  })

  it('attemptId يبقى ثابتاً عبر إعادة التحميل', () => {
    startExam()
    const first = stored().attemptId
    reload()
    expect(stored().attemptId).toBe(first)
    reload()
    expect(stored().attemptId).toBe(first)
  })

  it('التنقل بين الأسئلة لا يفقد الإجابات (سؤالاً بسؤال وعرض الكل)', () => {
    startExam()
    typeInto(branchInput('q01-a')!, '(6, 4)')
    click(button('السؤال التالي')!)
    expect(text()).toContain('السؤال 2 من 30')
    click(button('السؤال التالي')!)
    expect(text()).toContain('السؤال 3 من 30')
    click(button('السؤال السابق')!)
    click(button('السؤال السابق')!)
    expect(branchInput('q01-a')!.value).toBe('(6, 4)')
    expect(stored().answers['q01-a']).toBe('(6, 4)')
    expect(stored().currentQuestionIndex).toBe(0)

    // نمط «عرض الكل» يعرض كل الأسئلة الثلاثين والإجابات محفوظة
    click(button('عرض الكل')!)
    expect(text()).toContain('السؤال 1 من 30')
    expect(text()).toContain('السؤال 30 من 30')
    expect(branchInput('q01-a')!.value).toBe('(6, 4)')
    expect(branchInput('q30-d')).not.toBeNull()
    // الرجوع إلى نمط سؤالاً بسؤال
    click(button('سؤالاً بسؤال')!)
    expect(branchInput('q01-a')!.value).toBe('(6, 4)')
  })

  it('شبكة التنقل 1–30 تقفز إلى أي سؤال مباشرة', () => {
    startExam()
    click(button('الأسئلة')!)
    expect(text()).toContain('انتقلي مباشرة إلى أي سؤال (1–30)')
    const panel = container.querySelector('#question-navigator-grid') as HTMLElement
    expect(panel).not.toBeNull()
    const gridButtons = [...panel.querySelectorAll('button')].filter(
      (b) => /^[0-9]{1,2}$/.test((b.textContent ?? '').trim()),
    )
    expect(gridButtons.length).toBe(30)
    click(gridButtons[9]) // السؤال 10
    expect(text()).toContain('السؤال 10 من 30')
    expect(stored().currentQuestionIndex).toBe(9)
  })

  it('لوحة الرموز الرياضية تُدخل الأرقام في الفرع النشط (من مصدر الاختبار)', () => {
    startExam()
    // تفعيل الحقل أولاً (المصدر يربط لوحة الرموز بالفرع النشط فقط)
    act(() => branchInput('q01-a')!.focus())
    const five = [...container.querySelectorAll('button')].find(
      (b) => (b.textContent ?? '').trim() === '5',
    ) as HTMLButtonElement
    expect(five).not.toBeNull()
    click(five)
    expect(branchInput('q01-a')!.value).toBe('5')
    expect(stored().answers['q01-a']).toBe('5')
  })

  it('أزرار الزوايا السريعة في فرع المنقلة التفاعلي تحفظ القيمة', () => {
    seedCompleteAttempt()
    const s = stored()
    s.answers = {}
    s.currentQuestionIndex = 23 // السؤال 24 — المنقلة التفاعلية
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
    render()
    expect(text()).toContain('السؤال 24 من 30')
    const deg120 = [...container.querySelectorAll('button')].find(
      (b) => (b.textContent ?? '').trim() === '120°',
    ) as HTMLButtonElement
    expect(deg120).not.toBeNull()
    click(deg120)
    expect(stored().answers['q24-a']).toBe('120')
  })
})

describe('بوابة التسليم ونافذة التأكيد النهائي', () => {
  it('زر التسليم معطّل حتى تكتمل كل الفروع المطلوبة', () => {
    startExam()
    expect((button('تسليم الاختبار') as HTMLButtonElement).disabled).toBe(true)
    expect(text()).toContain('سؤال غير مكتمل')
    // الإجابة عن بعض الفروع لا تكفي
    typeInto(branchInput('q01-a')!, '(6, 4)')
    expect((button('تسليم الاختبار') as HTMLButtonElement).disabled).toBe(true)
  })

  it('التسليم يتطلب تأكيداً نهائياً ولا يحدث بدونه', () => {
    seedCompleteAttempt()
    render()
    expect((button('تسليم الاختبار') as HTMLButtonElement).disabled).toBe(false)

    click(button('تسليم الاختبار')!)
    expect(text()).toContain('تأكيد التسليم النهائي')
    expect(text()).toContain('سارة أحمد')
    expect(text()).toContain('30 / 30')
    expect(text()).toContain('86 / 86')
    // لم يُسلَّم بعد ولم يُرسل شيء
    expect(stored().isSubmitted).toBe(false)
    expect(net.calls).toHaveLength(0)

    // العودة للمراجعة تلغي التسليم وتحفظ الإجابات
    click(button('العودة لمراجعة الإجابات')!)
    expect(text()).not.toContain('تأكيد التسليم النهائي')
    expect(stored().isSubmitted).toBe(false)
    expect(Object.keys(stored().answers).length).toBe(86)
    expect(net.calls).toHaveLength(0)
  })

  it('التأكيد يسلّم ويعرض النتيجة ويرسل الحمولة مرة واحدة بعقد المنصة', async () => {
    seedCompleteAttempt()
    render()
    click(button('تسليم الاختبار')!)
    await act(async () => {
      click(button('تأكيد التسليم وعرض النتيجة')!)
      await Promise.resolve()
    })
    await flush()

    const s = stored()
    expect(s.isSubmitted).toBe(true)
    expect(s.submitConfirmed).toBe(true)
    expect(typeof s.submittedAtTimestamp).toBe('number')

    // صفحة النتيجة
    expect(text()).toContain('العلامة النهائية')
    expect(text()).toContain('100')
    expect(text()).toContain('100% · ممتاز')
    expect(text()).toContain('تنزيل التقرير المفصّل (TXT بترميز UTF-8)')
    expect(text()).toContain('✓ تم إرسال النتيجة إلى المعلّم.')

    // الإرسال: طلب واحد بالعقد المعتمد
    expect(net.calls).toHaveLength(1)
    expect(net.calls[0].url).toBe(SHEETS_URL)
    expect(net.calls[0].init.method).toBe('POST')
    expect((net.calls[0].init.headers as Record<string, string>)['Content-Type']).toBe(
      'text/plain;charset=utf-8',
    )
    const body = net.calls[0].body as Record<string, unknown>
    expect(body.examId).toBe(EXAM_ID)
    expect(body.examTitle).toBe(EXAM_TITLE)
    expect(body.attemptId).toBe('seeded-attempt-id')
    expect(body.studentName).toBe('سارة أحمد')
    const summary = body.summary as Record<string, number>
    expect(summary.total).toBe(100)
    expect(summary.max).toBe(100)
    expect((body.details as unknown[]).length).toBe(86)
    expect((body.lessons as unknown[]).length).toBe(8)
    expect(String(body.reportText)).toContain('الدرجة النهائية: 100 من 100')
    expect(s.submitDelivered).toBe(true)
    expect(window.localStorage.getItem(pendingKey('seeded-attempt-id'))).toBeNull()
  })

  it('زر تنزيل التقرير ينشئ ملف TXT بترميز UTF-8', async () => {
    seedCompleteAttempt()
    render()
    click(button('تسليم الاختبار')!)
    await act(async () => {
      click(button('تأكيد التسليم وعرض النتيجة')!)
      await Promise.resolve()
    })
    await flush()
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    click(button('تنزيل التقرير المفصّل')!)
    expect(clickSpy).toHaveBeenCalledTimes(1)
    const link = clickSpy.mock.instances[0] as HTMLAnchorElement
    expect(link.download).toBe('تقرير_مذاكرة_رياضيات_خامس_نموذج_B_سارة_أحمد.txt')
    expect(link.href).toBe('blob:mock')
    clickSpy.mockRestore()
  })

  it('فشل الإرسال لا يحجب النتيجة ولا التقرير، ويُحفظ معلّقاً، وإعادة الإرسال اليدوي تنجح بنفس attemptId', async () => {
    net.mode = 'reject'
    seedCompleteAttempt()
    render()
    click(button('تسليم الاختبار')!)
    await act(async () => {
      click(button('تأكيد التسليم وعرض النتيجة')!)
      await Promise.resolve()
    })
    // انتظار سلسلة المحاولات الثلاث كاملة (فواصل حقيقية 2s ثم 5s)
    await flush(7300)

    // النتيجة والتقارير تعمل رغم الفشل
    expect(text()).toContain('العلامة النهائية')
    expect(text()).toContain('100% · ممتاز')
    expect(text()).toContain('تنزيل التقرير المفصّل (TXT بترميز UTF-8)')
    expect(text()).toContain('تعذّر إرسال النتيجة إلى المعلّم الآن')
    expect(button('إعادة إرسال يدوي')).not.toBeNull()

    // الحمولة محفوظة محلياً تحت مفتاح نموذج B
    const pendingRaw = window.localStorage.getItem(pendingKey('seeded-attempt-id'))
    expect(pendingRaw).not.toBeNull()
    expect(JSON.parse(pendingRaw!).attemptId).toBe('seeded-attempt-id')
    expect(Object.keys(window.localStorage).filter((k) => k.startsWith(PENDING_PREFIX))).toHaveLength(1)
    expect(net.calls.length).toBe(3)

    // إعادة الإرسال اليدوي بعد عودة الشبكة — نفس attemptId بالضبط
    net.mode = 'reply'
    await act(async () => {
      click(button('إعادة إرسال يدوي')!)
      await Promise.resolve()
    })
    await flush()
    expect(net.calls.length).toBe(4)
    const lastBody = net.calls[3].body as Record<string, unknown>
    expect(lastBody.attemptId).toBe('seeded-attempt-id')
    expect(text()).toContain('✓ تم إرسال النتيجة إلى المعلّم.')
    expect(window.localStorage.getItem(pendingKey('seeded-attempt-id'))).toBeNull()
    expect(stored().submitDelivered).toBe(true)
  }, 20000)

  it('بعد إعادة التحميل: النتيجة نفسها وattemptId نفسه ولا إعادة تسليم تلقائية', async () => {
    seedCompleteAttempt()
    render()
    click(button('تسليم الاختبار')!)
    await act(async () => {
      click(button('تأكيد التسليم وعرض النتيجة')!)
      await Promise.resolve()
    })
    await flush()
    expect(net.calls).toHaveLength(1)

    net.calls.length = 0
    reload()
    await flush()

    // شاشة النتيجة تُستعاد مباشرة، والمعرّف لم يتغير، ولا إرسال جديداً
    expect(text()).toContain('العلامة النهائية')
    expect(stored().attemptId).toBe('seeded-attempt-id')
    expect(stored().isSubmitted).toBe(true)
    expect(net.calls).toHaveLength(0)
    // حالة الإرسال الناجح محفوظة بعد إعادة التحميل
    expect(text()).toContain('✓ تم إرسال النتيجة إلى المعلّم.')
  })

  it('المحاولة المعلّقة تُعاد تلقائياً عند فتح الاختبار وتُحذف بعد النجاح', async () => {
    // بذرة: حمولة معلّقة من جلسة سابقة (نفس بناء التطبيق)
    const summary = gradeFullExam(perfectAnswers, examQuestions)
    const payload = buildPayload({
      attemptId: 'pending-from-before',
      studentName: 'سارة أحمد',
      startedAt: Date.now() - 3600_000,
      submittedAt: Date.now() - 3000_000,
      elapsedSec: 600,
      answers: perfectAnswers,
      reportText: buildReportText({
        studentName: 'سارة أحمد',
        summary,
        startedAtTimestamp: Date.now() - 3600_000,
        submittedAtTimestamp: Date.now() - 3000_000,
        elapsedSeconds: 600,
      }),
    })
    window.localStorage.setItem(pendingKey('pending-from-before'), JSON.stringify(payload))
    // ومعلّقة لاختبار آخر يجب ألا تُمس
    window.localStorage.setItem('pending:grade-5-math-test-unit1-21-11:other', '{"attemptId":"other"}')

    render()
    await flush()

    expect(net.calls).toHaveLength(1)
    expect((net.calls[0].body as Record<string, unknown>).attemptId).toBe('pending-from-before')
    expect(window.localStorage.getItem(pendingKey('pending-from-before'))).toBeNull()
    expect(window.localStorage.getItem('pending:grade-5-math-test-unit1-21-11:other')).not.toBeNull()
  })

  it('محاولة جديدة بعد التسليم: معرّف جديد وحالة نظيفة', async () => {
    seedCompleteAttempt()
    render()
    click(button('تسليم الاختبار')!)
    await act(async () => {
      click(button('تأكيد التسليم وعرض النتيجة')!)
      await Promise.resolve()
    })
    await flush()

    click(button('بدء محاولة جديدة')!)
    expect(text()).toContain('اسم الطالبة الثلاثي')
    const cleared = stored()
    expect(cleared.hasStarted).toBe(false)
    expect(cleared.isSubmitted).toBe(false)
    expect(cleared.attemptId).toBe('')
    expect(cleared.answers).toEqual({})
    expect(cleared.studentName).toBe('سارة أحمد') // الاسم محفوظ للراحة

    typeInto(nameInput(), 'سارة أحمد')
    click(button('بدء الاختبار')!)
    const fresh = stored()
    expect(fresh.hasStarted).toBe(true)
    expect(fresh.attemptId).not.toBe('')
    expect(fresh.attemptId).not.toBe('seeded-attempt-id')
  })
})

describe('لوحة المعلم (بوابة واجهة تجميلية بكلمة مرور المصدر)', () => {
  it('مقفلة بكلمة المرور somer173 وتعرض الحلول والتنبيه بعد الفتح', () => {
    render()
    click(button('لوحة المعلّم')!)
    expect(text()).toContain('منطقة مخصّصة للمعلّم والمشرف التربوي')
    expect(text()).not.toContain('خطوات الحل النموذجية:')

    const pw = container.querySelector('input[type="password"]') as HTMLInputElement
    expect(pw).not.toBeNull()
    typeInto(pw, 'كلمة-خاطئة')
    click(button('فتح دليل الإجابات النموذجية')!)
    expect(text()).toContain('كلمة المرور غير صحيحة')
    expect(text()).not.toContain('خطوات الحل النموذجية:')

    typeInto(pw, 'somer173')
    click(button('فتح دليل الإجابات النموذجية')!)
    expect(text()).toContain('جدول مواصفات الاختبار وتوزيع الأسئلة والعلامات')
    expect(text()).toContain('خطوات الحل النموذجية:')
    expect(text()).toContain('الإجابة النموذجية:')
    // التنبيه بأنها بوابة تجميلية لا حماية أمنية
    expect(text()).toContain('وسيلة إخفاء للواجهة فقط')
    expect(text()).toContain('وليست مصادقة أمنية حقيقية')
    // المجاميع
    expect(text()).toContain('30 سؤالاً')
    expect(text()).toContain('100 علامة')
  })

  it('لا تظهر أي إجابة نموذجية للطالبة أثناء محاولة نشطة', () => {
    startExam()
    expect(text()).not.toContain('الإجابة النموذجية:')
    expect(text()).not.toContain('خطوات الحل النموذجية:')
    // حتى مع فتح نافذة المعلم تبقى مقفلة قبل كلمة المرور
    click(button('المعلّم')!)
    expect(text()).toContain('منطقة مخصّصة للمعلّم')
    expect(text()).not.toContain('خطوات الحل النموذجية:')
  })
})
