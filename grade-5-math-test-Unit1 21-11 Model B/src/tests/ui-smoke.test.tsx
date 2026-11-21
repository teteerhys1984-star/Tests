import assert from 'node:assert/strict'
import { renderToStaticMarkup } from 'react-dom/server'
import { examQuestions } from '../data/questions'
import { QuestionCard } from '../components/QuestionCard'
import { ResultsView } from '../components/ResultsView'
import { TeacherModal } from '../components/TeacherModal'
import { ContactFooter } from '../components/ContactFooter'
import { gradeFullExam } from '../utils/scoring'

console.log('▶ بدء تشغيل فحص واجهة الطالبة والرسوم التفاعلية (UI & Rendering Verification)...')

// 1. Render all 30 QuestionCards and verify:
// - No raw LaTeX commands leak into rendered text
// - No model answers or explanations leak into the active student question view
// - SVG visuals render with valid viewBox for responsive mobile scaling
for (const q of examQuestions) {
  const html = renderToStaticMarkup(
    <QuestionCard
      question={q}
      answers={{}}
      onUpdateAnswer={() => {}}
    />
  )

  assert.ok(
    html.includes(`السؤال ${q.number} من 30`),
    `بطاقة السؤال ${q.number} يجب أن تعرض رقم السؤال بوضوح`
  )
  assert.ok(
    !html.includes('\\widehat') && !html.includes('\\frac'),
    `بطاقة السؤال ${q.number} يجب ألا تعرض أوامر LaTeX خام`
  )
  assert.ok(
    !html.includes('خطوات الحل الصحيحة') && !html.includes('الإجابة النموذجية:'),
    `بطاقة السؤال ${q.number} يجب ألا تكشف الإجابة النموذجية أو خطوات الحل أثناء المحاولة`
  )
  assert.ok(
    !html.toLowerCase().includes('download source') &&
      !html.toLowerCase().includes('export zip') &&
      !html.toLowerCase().includes('.zip'),
    `بطاقة السؤال ${q.number} يجب ألا تتضمن أي رابط لتنزيل المصدر أو ZIP`
  )

  if (q.visual) {
    assert.ok(
      html.includes('<svg') && html.includes('viewBox='),
      `السؤال البصري ${q.number} يجب أن يتضمن رسم SVG متجاوب مع viewBox`
    )
  }
}
console.log('✓ تم فحص عرض جميع بطاقات الأسئلة الـ 30 والرسوم التفاعلية وKaTeX وعدم تسرب الحلول.')

// 2. Verify TeacherModal locked state does NOT render any answers in the DOM before password entry
const lockedTeacherHtml = renderToStaticMarkup(
  <TeacherModal isOpen={true} onClose={() => {}} />
)
assert.ok(
  lockedTeacherHtml.includes('منطقة مخصّصة للمعلّم'),
  'يجب أن تعرض نافذة المعلم بوابة كلمة المرور أولاً'
)
assert.ok(
  !lockedTeacherHtml.includes('خطوات الحل النموذجية'),
  'يجب ألا تظهر الحلول النموذجية في لوحة المعلم قبل إدخال كلمة المرور somer173'
)
console.log('✓ تم التحقق من إخفاء الإجابات النموذجية في لوحة المعلم قبل إدخال كلمة المرور.')

// 3. Verify ContactFooter renders Engineer Somer Shaheen, 0930215022, SVG WhatsApp icon, and wa.me link
const footerHtml = renderToStaticMarkup(<ContactFooter />)
assert.ok(footerHtml.includes('المهندس سومر شاهين'), 'يجب ظهور اسم المهندس سومر شاهين')
assert.ok(footerHtml.includes('0930215022'), 'يجب ظهور رقم الهاتف 0930215022')
assert.ok(
  footerHtml.includes('https://wa.me/963930215022'),
  'يجب وجود رابط المحادثة المباشرة https://wa.me/963930215022'
)
assert.ok(footerHtml.includes('<svg'), 'يجب وجود شعار WhatsApp مرسوم بـ SVG وليس Emoji فقط')
console.log('✓ تم التحقق من شريط التواصل وشعار WhatsApp والرابط المباشر.')

// 4. Verify ResultsView renders full student report and UTF-8 TXT download button
const sampleSummary = gradeFullExam({})
const resultsHtml = renderToStaticMarkup(
  <ResultsView
    studentName="سارة الدمشقية"
    summary={sampleSummary}
    elapsedSeconds={615}
    submittedAtTimestamp={Date.now()}
    onRestartExam={() => {}}
    onOpenTeacherModal={() => {}}
  />
)
assert.ok(resultsHtml.includes('سارة الدمشقية'), 'صفحة النتائج يجب أن تعرض اسم الطالبة')
assert.ok(resultsHtml.includes('00:10:15'), 'صفحة النتائج يجب أن تعرض الوقت المستغرق بصيغة HH:MM:SS')
assert.ok(
  resultsHtml.includes('تنزيل التقرير المفصّل (TXT بترميز UTF-8)'),
  'صفحة النتائج يجب أن تتضمن زر تنزيل تقرير TXT'
)
assert.ok(
  !resultsHtml.toLowerCase().includes('download source') &&
    !resultsHtml.toLowerCase().includes('.zip'),
  'صفحة النتائج يجب ألا تحتوي على أي رابط لتنزيل ملفات المشروع أو ZIP'
)
console.log('✓ تم التحقق من صفحة النتائج وتقرير TXT وخلو الواجهة من أي روابط لتنزيل الكود المصدري.')
