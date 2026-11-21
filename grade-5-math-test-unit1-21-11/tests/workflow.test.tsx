// @vitest-environment jsdom
/**
 * اختبار سير العمل الكامل داخل DOM حقيقي (jsdom):
 * شاشة البداية ← إدخال الاسم ← بدء الاختبار ← الإجابة عن بعض الأسئلة ← حفظ واستعادة
 * ← المراجعة ← تأكيد التسليم ← النتيجة + التقرير + حالة الإرسال (شبكة وهمية)
 * ← لوحة المعلم المحمية بكلمة المرور.
 * لا يُجرى أي اتصال حقيقي: fetch مُعترَض هنا.
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { createRoot, type Root } from 'react-dom/client'
import { act } from 'react'
import App from '../src/App'
import { QUESTIONS, TOTAL_POINTS } from '../src/data/index'
import { STORAGE_KEY } from '../src/lib/attempt'
import { SHEETS_URL } from '../src/config'
import type { AnswerValue } from '../src/lib/types'
import { perfectAnswers } from '../src/testing/answers'

const net = { calls: [] as { url: string; init: RequestInit }[], reply: '{}' }

beforeAll(() => {
  // اعتراض الشبكة والتنزيل قبل تحميل التطبيق
  vi.stubGlobal(
    'fetch',
    (url: string, init: RequestInit) => {
      net.calls.push({ url: String(url), init })
      return Promise.resolve({
        ok: true,
        status: 200,
        text: async () => net.reply,
        json: async () => JSON.parse(net.reply),
      })
    },
  )
  Object.defineProperty(globalThis.URL, 'createObjectURL', {
    configurable: true,
    value: () => 'blob:mock',
  })
  Object.defineProperty(globalThis.URL, 'revokeObjectURL', { configurable: true, value: () => {} })
  Element.prototype.scrollIntoView = () => {}
})

let root: Root | null = null
let container: HTMLDivElement

beforeEach(() => {
  window.localStorage.clear()
  net.calls.length = 0
  net.reply = '{}'
  window.location.hash = ''
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

const text = () => container.textContent ?? ''
const button = (label: string): HTMLButtonElement | null =>
  [...container.querySelectorAll('button')].find((b) => (b.textContent ?? '').includes(label)) as
    | HTMLButtonElement
    | null
const click = (el: HTMLElement) => act(() => el.click())
const input = (): HTMLInputElement =>
  container.querySelector('#student-name') as HTMLInputElement

function startExam(name = 'سارة أحمد') {
  render()
  const field = input()
  act(() => {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!
    setter.call(field, name)
    field.dispatchEvent(new Event('input', { bubbles: true }))
  })
  const start = button('بدء الاختبار')
  expect(start).not.toBeNull()
  click(start!)
}

function answerCurrentQuestion() {
  // الإجابة النموذجية للسؤال المعروض من الأسئلة المختلطة.
  const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? 'null')
  const index = stored?.current ?? 0
  const q = QUESTIONS[index]
  const answers = { ...(stored?.answers ?? {}), ...perfectAnswers(q) }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...stored, answers }))
}

describe('Student flow', () => {
  it('shows the start screen with the exam title and refuses an empty name', () => {
    render()
    expect(text()).toContain('مذاكرة بالوحدة الأولى')
    expect(text()).toContain('Grade 5 Math Test Unit 1 (21-11)')
    // العنوان الظاهر في المتصفح يأتي من index.html المنشور
    const html = readFileSync(path.resolve(__dirname, '..', 'index.html'), 'utf8')
    expect(html).toContain('<title>Grade 5 Math Test Unit 1 (21-11)</title>')
    expect(html).toContain('dir="rtl"')
    expect(text()).toContain('30')
    expect(text()).toContain('100')
    click(button('بدء الاختبار')!)
    expect(text()).toContain('يرجى كتابة الاسم الكامل')
    expect(net.calls).toHaveLength(0)
  })

  it('starts the exam, stores the attempt and never shows a model answer while running', () => {
    startExam()
    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY)!)
    expect(stored.studentName).toBe('سارة أحمد')
    expect(stored.submittedAt).toBeNull()
    expect(stored.answers).toEqual({})
    expect(text()).toContain('السؤال 1')
    // لا إجابات نموذجية في واجهة الطالب أثناء الحل
    expect(text()).not.toContain('الإجابة النموذجية')
    expect(text()).not.toContain('#teacher')
  })

  it('restores the saved attempt and answers after a reload', () => {
    startExam()
    answerCurrentQuestion()
    const before = JSON.parse(window.localStorage.getItem(STORAGE_KEY)!)
    expect(Object.keys(before.answers).length).toBeGreaterThan(0)

    act(() => root!.unmount())
    root = null
    render()
    const after = JSON.parse(window.localStorage.getItem(STORAGE_KEY)!)
    expect(after.answers).toEqual(before.answers)
    expect(text()).toContain('الطالب/ة: سارة أحمد')
  })

  it('shows a review screen and requires explicit confirmation before submitting', () => {
    startExam()
    click(button('مراجعة الإجابات والتسليم')!)
    expect(text()).toContain('مراجعة قبل التسليم')
    expect(text()).toContain('فرع')
    // لم يُسلَّم بعد
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY)!).submittedAt).toBeNull()
    click(button('تسليم الاختبار')!)
    expect(text()).toContain('تأكيد التسليم')
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY)!).submittedAt).toBeNull()
    // الإلغاء يعيد إلى المراجعة دون تسليم
    click(button('إلغاء')!)
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY)!).submittedAt).toBeNull()
  })

  it('submits after confirmation, grades, shows the report button and posts the payload', async () => {
    startExam()
    click(button('مراجعة الإجابات والتسليم')!)
    click(button('تسليم الاختبار')!)
    await act(async () => {
      click(button('نعم، سلّم الاختبار')!)
      await Promise.resolve()
    })

    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY)!)
    expect(typeof stored.submittedAt).toBe('number')
    expect(stored.confirmed).toBe(true)
    expect(text()).toContain('تنزيل التقرير (ملف TXT)')
    expect(text()).toContain(`من ${TOTAL_POINTS}`)
    expect(text()).toContain('توزيع العلامات على الدروس')

    expect(net.calls).toHaveLength(1)
    expect(net.calls[0].url).toBe(SHEETS_URL)
    const init = net.calls[0].init
    expect(init.method).toBe('POST')
    expect((init.headers as Record<string, string>)['Content-Type']).toBe('text/plain;charset=utf-8')
    const body = JSON.parse(String(init.body))
    expect(body.examId).toBe('grade-5-math-test-unit1-21-11')
    expect(body.examTitle).toBe('Grade 5 Math Test Unit 1 (21-11)')
    expect(body.summary.max).toBe(100)
  })

  it('keeps the same attemptId when the submitted attempt is resent after a reload', async () => {
    startExam()
    click(button('مراجعة الإجابات والتسليم')!)
    click(button('تسليم الاختبار')!)
    await act(async () => {
      click(button('نعم، سلّم الاختبار')!)
      await Promise.resolve()
    })
    const first = JSON.parse(window.localStorage.getItem(STORAGE_KEY)!)
    expect(typeof first.attemptId).toBe('string')
    const firstBody = JSON.parse(String(net.calls[0].init.body))
    expect(firstBody.attemptId).toBe(first.attemptId)

    // تحديث الصفحة: تُستعاد المحاولة المسلَّمة ومعرّفها نفسه
    act(() => root!.unmount())
    root = null
    render()
    expect(text()).toContain('تنزيل التقرير (ملف TXT)')
    const restored = JSON.parse(window.localStorage.getItem(STORAGE_KEY)!)
    expect(restored.attemptId).toBe(first.attemptId)
    expect(restored.confirmed).toBe(true)
  })

  it('keeps the results, the report and the resend button available when sending fails', async () => {
    vi.stubGlobal(
      'fetch',
      (url: string, init: RequestInit) => {
        net.calls.push({ url: String(url), init })
        return Promise.reject(new Error('offline'))
      },
    )
    startExam()
    click(button('مراجعة الإجابات والتسليم')!)
    click(button('تسليم الاختبار')!)
    await act(async () => {
      click(button('نعم، سلّم الاختبار')!)
      await new Promise((r) => setTimeout(r, 10))
    })
    expect(text()).toContain('تنزيل التقرير (ملف TXT)')
    expect(text()).toMatch(/تعذّر إرسال النتيجة|جارٍ إرسال النتيجة/)
    expect(button('إعادة إرسال يدوي')).not.toBeNull()
    // أُرسلت المحاولة عبر الشبكة الوهمية ولم يعد الطالب إلى شاشة الحل
    expect(net.calls.length).toBeGreaterThanOrEqual(1)
    expect(net.calls[0].url).toBe(SHEETS_URL)
    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY)!)
    expect(stored.submittedAt).not.toBeNull()
    expect(text()).toContain('تفاصيل الأسئلة')
  })
})

describe('Teacher area', () => {
  it('is reachable only through #teacher and gated by the password', () => {
    window.location.hash = '#teacher'
    render()
    expect(text()).toContain('منطقة المعلم')
    expect(text()).toContain('ليست حماية أمنية')
    expect(text()).not.toContain('خطوات الحل:')
    const pw = container.querySelector('#teacher-pw') as HTMLInputElement
    act(() => {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!
      setter.call(pw, 'wrong')
      pw.dispatchEvent(new Event('input', { bubbles: true }))
      ;(button('دخول') as HTMLButtonElement).click()
    })
    expect(text()).toContain('كلمة المرور غير صحيحة')
    act(() => {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!
      setter.call(pw, 'somer173')
      pw.dispatchEvent(new Event('input', { bubbles: true }))
      ;(button('دخول') as HTMLButtonElement).click()
    })
    expect(text()).toContain('توزيع الأسئلة والعلامات حسب الدروس')
    expect(text()).toContain('خطوات الحل:')
    expect(text()).toContain('ليست حماية أمنية')
  })

  it('never shows the answer key while an attempt is active', () => {
    startExam()
    window.location.hash = '#teacher'
    act(() => window.dispatchEvent(new HashChangeEvent('hashchange')))
    expect(text()).not.toContain('منطقة المعلم')
    expect(text()).not.toContain('الإجابة النموذجية')
    expect(text()).toContain('السؤال 1')
  })
})

describe('Answer payload completeness', () => {
  it('marks the questions list and answer types the source uses', () => {
    const kinds = new Set<string>()
    for (const q of QUESTIONS) for (const p of q.parts) kinds.add(p.input.kind)
    for (const kind of ['choice', 'tf', 'math', 'expanded', 'text', 'pair', 'slots', 'order', 'match', 'point', 'numberline', 'angle-draw']) {
      expect(kinds.has(kind), `missing answer type ${kind}`).toBe(true)
    }
    const answers: Record<string, AnswerValue> = perfectAnswers(QUESTIONS[0])
    expect(Object.keys(answers).length).toBe(QUESTIONS[0].parts.length)
  })
})
