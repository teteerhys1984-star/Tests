/**
 * فحص الواجهة والرسوم (port من src/tests/ui-smoke.test.tsx في المصدر إلى vitest):
 * عرض كل بطاقات الأسئلة الـ30، وعدم تسرب الإجابات النموذجية أثناء المحاولة،
 * ورسوم SVG متجاوبة، وبوابة المعلم المقفلة، وشريط التواصل، وصفحة النتائج
 * بحالات الإرسال المختلفة.
 */
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { examQuestions } from '../src/data/questions'
import { QuestionCard } from '../src/components/QuestionCard'
import { ResultsView, SendBanner } from '../src/components/ResultsView'
import { TeacherModal } from '../src/components/TeacherModal'
import { ContactFooter } from '../src/components/ContactFooter'
import { gradeFullExam } from '../src/utils/scoring'
import { perfectAnswers } from './answers'

describe('بطاقات الأسئلة الثلاثون والرسوم التفاعلية', () => {
  for (const q of examQuestions) {
    it(`السؤال ${q.number}: عرض سليم بلا تسرب حلول وبلا LaTeX خام`, () => {
      const html = renderToStaticMarkup(
        <QuestionCard question={q} answers={{}} onUpdateAnswer={() => {}} />,
      )

      expect(html).toContain(`السؤال ${q.number} من 30`)
      // لا أوامر LaTeX خام في النص المعروض
      expect(html).not.toContain('\\widehat')
      expect(html).not.toContain('\\frac')
      // لا كشف للإجابات النموذجية أو خطوات الحل أثناء المحاولة
      expect(html).not.toContain('خطوات الحل الصحيحة')
      expect(html).not.toContain('الإجابة النموذجية:')
      // لا رابط لتنزيل مصدر أو ZIP
      expect(html.toLowerCase()).not.toContain('download source')
      expect(html.toLowerCase()).not.toContain('.zip')

      if (q.visual) {
        expect(html).toContain('<svg')
        expect(html).toContain('viewBox=')
      }

      // كل فرع له حقل إدخال أو أزرار خيارات
      for (const branch of q.branches) {
        if (
          branch.inputKind === 'number' ||
          branch.inputKind === 'text' ||
          branch.inputKind === 'ordered-pair' ||
          branch.inputKind === 'interactive-point'
        ) {
          expect(html).toContain(`input-${branch.id}`)
        }
        if (branch.inputKind === 'choice' || branch.inputKind === 'compare-symbol') {
          for (const opt of branch.options ?? []) {
            expect(html).toContain(opt.label.split(' ')[0])
          }
        }
      }
    })
  }

  it('لا تظهر الإجابات النموذجية الطويلة المميزة في أي بطاقة سؤال أثناء المحاولة', () => {
    // تُستثنى من الفحص النصوص التي تظهر أصلاً في نص السؤال أو في تسمية خيار
    // (الاختيار من متعدد: الإجابة النموذجية هي نص الخيار المعروض للطالبة).
    for (const q of examQuestions) {
      const prompts = [q.prompt, ...q.branches.flatMap((b) => [b.prompt, ...(b.options ?? []).map((o) => o.label)])]
      const html = renderToStaticMarkup(
        <QuestionCard question={q} answers={{}} onUpdateAnswer={() => {}} />,
      )
      for (const branch of q.branches) {
        const model = branch.modelAnswerDisplay.replace(/\$/g, '')
        if (model.length <= 6) continue
        if (prompts.some((p) => p.includes(model) || p.startsWith(model))) continue
        expect(html.includes(model), `Q${q.number} ${branch.id} leaks model answer`).toBe(false)
      }
      expect(html).not.toContain(q.explanation)
      for (const step of q.solutionSteps) {
        if (step.length > 20) expect(html.includes(step), `Q${q.number} leaks a solution step`).toBe(false)
      }
    }
  })
})

describe('القيم المحفوظة تظهر في الحقول بعد الاستعادة', () => {
  it('إجابات محفوظة تُعرض في البطاقة (عدم فقدان الإجابات بين الشاشات)', () => {
    const html = renderToStaticMarkup(
      <QuestionCard
        question={examQuestions[0]}
        answers={{ 'q01-a': '(6, 4)', 'q01-b': '(0, 5)' }}
        onUpdateAnswer={() => {}}
      />,
    )
    expect(html).toContain('value="(6, 4)"')
    expect(html).toContain('value="(0, 5)"')
  })
})

describe('بوابة المعلم', () => {
  it('مقفلة: لا حلول قبل كلمة المرور، والتنبيه التجميلي ظاهر', () => {
    const locked = renderToStaticMarkup(<TeacherModal isOpen onClose={() => {}} />)
    expect(locked).toContain('منطقة مخصّصة للمعلّم')
    expect(locked).not.toContain('خطوات الحل النموذجية')
    expect(locked).toContain('وسيلة إخفاء للواجهة فقط')
    expect(locked).toContain('وليست مصادقة أمنية حقيقية')
    expect(locked).not.toContain('somer173') // كلمة المرور ليست ظاهرة في الصفحة
  })

  it('مغلقة تماماً عندما isOpen=false', () => {
    expect(renderToStaticMarkup(<TeacherModal isOpen={false} onClose={() => {}} />)).toBe('')
  })
})

describe('شريط التواصل (من المصدر)', () => {
  it('اسم المهندس ورقمه ورابط واتساب وشعار SVG', () => {
    const html = renderToStaticMarkup(<ContactFooter />)
    expect(html).toContain('المهندس سومر شاهين')
    expect(html).toContain('0930215022')
    expect(html).toContain('https://wa.me/963930215022')
    expect(html).toContain('<svg')
  })
})

describe('صفحة النتيجة وحالات الإرسال', () => {
  const summary = gradeFullExam(perfectAnswers, examQuestions)
  const baseProps = {
    studentName: 'سارة الدمشقية',
    summary,
    startedAtTimestamp: Date.UTC(2026, 10, 21, 7, 0, 0),
    elapsedSeconds: 615,
    submittedAtTimestamp: Date.UTC(2026, 10, 21, 7, 10, 15),
    pending: 0,
    onResend: () => {},
    onRestartExam: () => {},
    onOpenTeacherModal: () => {},
  }

  it('النتيجة الكاملة: الاسم والمدة والنسبة والتقدير وزر التقرير', () => {
    const html = renderToStaticMarkup(<ResultsView {...baseProps} submitStatus="success" />)
    expect(html).toContain('سارة الدمشقية')
    expect(html).toContain('00:10:15')
    expect(html).toContain('مذاكرة رياضيات صف خامس نموذج B')
    expect(html).toContain('100% · ممتاز')
    expect(html).toContain('تنزيل التقرير المفصّل (TXT بترميز UTF-8)')
    expect(html).toContain('✓ تم إرسال النتيجة إلى المعلّم.')
    expect(html.toLowerCase()).not.toContain('.zip')
  })

  it('النتيجة تُعرض كاملة حتى عند فشل الإرسال مع زر إعادة إرسال يدوي', () => {
    const html = renderToStaticMarkup(<ResultsView {...baseProps} submitStatus="failed" pending={1} />)
    expect(html).toContain('100') // الدرجة ظاهرة رغم فشل الإرسال
    expect(html).toContain('تنزيل التقرير المفصّل') // التقرير يعمل رغم فشل الإرسال
    expect(html).toContain('تعذّر إرسال النتيجة إلى المعلّم الآن')
    expect(html).toContain('إعادة إرسال يدوي')
    expect(html).toContain('محاولات معلّقة: 1')
  })

  it('حالة الإرسال جارٍ', () => {
    const html = renderToStaticMarkup(<ResultsView {...baseProps} submitStatus="sending" />)
    expect(html).toContain('جارٍ إرسال النتيجة إلى المعلّم…')
  })

  it('SendBanner: idle بلا معلّقات لا يعرض شيئاً، ومع معلّقة ينبّه', () => {
    expect(renderToStaticMarkup(<SendBanner status="idle" pending={0} onResend={() => {}} />)).toBe('')
    const withPending = renderToStaticMarkup(
      <SendBanner status="idle" pending={2} onResend={() => {}} />,
    )
    expect(withPending).toContain('لم يتأكد وصولها إلى المعلّم بعد (2)')
    expect(withPending).toContain('إعادة إرسال يدوي')
  })

  it('مراجعة الأسئلة الثلاثين تظهر في صفحة النتيجة مع الحلول', () => {
    const html = renderToStaticMarkup(<ResultsView {...baseProps} submitStatus="idle" />)
    expect(html).toContain('مراجعة الأسئلة والإجابات النموذجية وخطوات الحل (30 سؤالاً)')
    expect(html).toContain('خطوات الحل الصحيحة:')
    expect(html).toContain('الإجابة النموذجية:')
  })
})
