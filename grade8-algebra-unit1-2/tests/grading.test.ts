/**
 * اختبار التصحيح الكامل: حالات كاملة وفارغة وخاطئة ومختلطة وعلامات جزئية،
 * ومطابقة كل نتيجة مع اللقطة المرجعية المأخوذة قبل النقل.
 * كما يتحقق من التقرير النصي (TXT) ومن سلم التقدير المرجعي.
 */
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { questions, gradeExam, isEquivalentTo, countUnanswered, isPartAnswered, validation } from '../src/lib/exam'
import type { Answers, ExamResult } from '../src/lib/exam'
import { buildReport, reportFilename, gradeLabel } from '../src/lib/report'
import type { StoredAttempt } from '../src/lib/storage'

const fixture = JSON.parse(
  readFileSync('tests/fixtures/original-exam-reference.json', 'utf8'),
) as {
  grading: Record<
    string,
    {
      earned: number
      max: number
      percentage: number
      counts:Record<string, number>
      questions: { id: string; earned: number; marks: number; status: string }[]
      subs: { id: string; earned: number; marks: number; status: string }[]
    }
  >
  report: { filename: string; sha256: string; length: number }
}

let failures = 0
function check(name: string, cond: boolean, extra = '') {
  if (!cond) {
    failures += 1
    console.log('  ✗ ' + name + (extra ? ' → ' + extra : ''))
  } else {
    console.log('  ✓ ' + name + (extra ? ' → ' + extra : ''))
  }
}

function perfectAnswers(): Answers {
  const answers: Answers = {}
  for (const q of questions) {
    for (const p of q.subparts) {
      if (p.kind === 'rational') answers[p.id] = p.expectedRational ?? ''
      else if (p.kind === 'fields') {
        answers[p.id] = Object.fromEntries((p.fields ?? []).map((f) => [f.id, f.expected]))
      } else if (p.kind === 'mcq') answers[p.id] = p.correctOption ?? ''
      else if (p.kind === 'order') answers[p.id] = [...(p.correctOrder ?? [])]
      else if (p.kind === 'justify') answers[p.id] = { verdict: p.correctVerdict, reason: p.correctReason }
    }
  }
  return answers
}

function wrongAnswers(): Answers {
  const answers: Answers = {}
  for (const q of questions) {
    for (const p of q.subparts) {
      if (p.kind === 'rational') answers[p.id] = '1/999'
      else if (p.kind === 'fields') answers[p.id] = Object.fromEntries((p.fields ?? []).map((f) => [f.id, '999']))
      else if (p.kind === 'mcq') answers[p.id] = (p.options ?? []).find((o) => o.id !== p.correctOption)?.id ?? ''
      else if (p.kind === 'order') answers[p.id] = [...(p.correctOrder ?? [])].reverse()
      else if (p.kind === 'justify') {
        answers[p.id] = {
          verdict: p.correctVerdict === 'true' ? 'false' : 'true',
          reason: (p.reasons ?? []).find((r) => r.id !== p.correctReason)?.id,
        }
      }
    }
  }
  return answers
}

function mixedAnswers(): Answers {
  const perfect = perfectAnswers()
  const wrong = wrongAnswers()
  const out: Answers = {}
  let i = 0
  for (const q of questions) {
    for (const p of q.subparts) {
      if (i % 3 !== 0) out[p.id] = i % 3 === 1 ? perfect[p.id] : wrong[p.id]
      i += 1
    }
  }
  return out
}

const partialFields = perfectAnswers()
partialFields.q2a = { coef: '4.7', exp: '5' }
partialFields.q9c = { coef: '6', exp: '0', decimal: '60' }
const partialJustify = perfectAnswers()
partialJustify.q14c = { verdict: 'true', reason: 'add' }
const equivalents = perfectAnswers()
equivalents.q1a = '58/48'
equivalents.q3b = '0.04'
equivalents.q13a = '2/6'
equivalents.q10a = '-12.0'

const cases: Record<string, Answers> = {
  perfect: perfectAnswers(),
  empty: {},
  wrong: wrongAnswers(),
  mixed: mixedAnswers(),
  partialFields,
  partialJustify,
  equivalents,
}

function attemptFor(answers: Answers): StoredAttempt {
  const startedAt = Date.UTC(2026, 0, 2, 8, 30, 0)
  const submittedAt = startedAt + 3_725_000
  return {
    schemaVersion: 1,
    examId: 'grade8-algebra-unit1-2',
    examVersion: '1.0.0',
    attemptId: 'test-attempt-0001',
    studentName: 'طالب مرجعي',
    status: 'submitted',
    answers,
    currentIndex: 0,
    visited: [0],
    optionOrder: {},
    questionOrder: questions.map((q) => q.id),
    startedAt,
    submittedAt,
    elapsedMs: submittedAt - startedAt,
    startCuePlayed: true,
    submissionCuePlayed: true,
    reportFilename: reportFilename('طالب مرجعي'),
    lastSavedAt: submittedAt,
  }
}

console.log('\n== 1) نتائج التصحيح مقابل اللقطة المرجعية ==')
for (const [name, answers] of Object.entries(cases)) {
  const result = gradeExam(answers)
  const ref = fixture.grading[name]
  check(`${name}: المجموع ${ref.earned}`, result.earned === ref.earned, String(result.earned))
  check(`${name}: النسبة ${ref.percentage}`, result.percentage === ref.percentage, String(result.percentage))
  check(
    `${name}: حالات الفروع`,
    JSON.stringify(result.counts) === JSON.stringify(ref.counts),
    JSON.stringify(result.counts),
  )
  check(
    `${name}: علامة/حالة كل سؤال`,
    JSON.stringify(result.questions.map((q) => ({ id: q.question.id, earned: q.earned, marks: q.marks, status: q.status }))) ===
      JSON.stringify(ref.questions),
  )
  check(
    `${name}: علامة/حالة كل فرع`,
    JSON.stringify(result.questions.flatMap((q) => q.subs.map((s) => ({ id: s.subId, earned: s.earned, marks: s.marks, status: s.status })))) ===
      JSON.stringify(ref.subs),
  )
}

console.log('\n== 2) الحالات الأساسية ==')
const perfect = gradeExam(perfectAnswers())
check('الكاملة: 100/100', perfect.earned === 100 && perfect.max === 100)
check('الكاملة: 45 فرعًا صحيحًا', perfect.counts.correct === 45 && perfect.counts.partial === 0)
check('الكاملة: 100%', perfect.percentage === 100)

const empty: ExamResult = gradeExam({})
check('الفارغة: 0/100', empty.earned === 0)
check('الفارغة: 45 غير مجاب', empty.counts.unanswered === 45)
check('الفارغة: 15 سؤالًا غير مجاب', empty.questions.every((q) => q.status === 'unanswered'))
check('countUnanswered = 45', countUnanswered({}) === 45)

const wrong = gradeExam(wrongAnswers())
check('الخاطئة: 0/100', wrong.earned === 0)
check('الخاطئة: 45 خطأ', wrong.counts.incorrect === 45)
check('الخاطئة: 15 سؤالًا خطأ', wrong.questions.every((q) => q.status === 'incorrect'))

const mixed = gradeExam(mixedAnswers())
check('المختلطة: 33/100', mixed.earned === 33, String(mixed.earned))
check('المختلطة: 15 صحيح و15 خطأ و15 غير مجاب', mixed.counts.correct === 15 && mixed.counts.incorrect === 15 && mixed.counts.unanswered === 15)

console.log('\n== 3) العلامات الجزئية ==')
const pf = gradeExam(partialFields)
check('حقول: 98/100', pf.earned === 98, String(pf.earned))
const q2a = pf.subs.q2a
check('q2a: حقل صحيح وحقل خاطئ = 1/2', q2a.earned === 1 && q2a.status === 'partial', `${q2a.earned}/${q2a.marks}`)
const q9c = pf.subs.q9c
check('q9c: 3/4 (حقلان صحيحان وواحد خاطئ)', q9c.earned === 3 && q9c.status === 'partial', `${q9c.earned}/${q9c.marks}`)
const pj = gradeExam(partialJustify)
check('حكم/تبرير: 99/100', pj.earned === 99)
const q14c = pj.subs.q14c
check('q14c: الحكم صحيح والتبرير خاطئ = 1/2', q14c.earned === 1 && q14c.status === 'partial')
check('q15c: الحكم الصحيح مع تبرير خطأ يعطي علامة واحدة', gradeExam({ ...perfectAnswers(), q15c: { verdict: 'false', reason: 'cannot' } }).subs.q15c.earned === 1)
check('q15c: الحكم وحده لا يعتمد إجابةً (0)', gradeExam({ ...perfectAnswers(), q15c: { verdict: 'false' } }).subs.q15c.earned === 0)
check('q8a: ترتيب خاطئ = 0/2', gradeExam({ ...perfectAnswers(), q8a: ['f3', 'f2', 'f1'] }).subs.q8a.earned === 0)
check('q2a: حقل واحد فقط يجعل الفرع غير مجاب', !isPartAnswered(questions[1].subparts[0], { coef: '4.7' }))
check('q14c: الحكم وحده يجعل الفرع غير مجاب', !isPartAnswered(questions[13].subparts[2], { verdict: 'true' }))

console.log('\n== 4) قبول الصور المكافئة ==')
check('29/24 = 58/48', isEquivalentTo('58/48', '29/24'))
check('1/25 = 0.04', isEquivalentTo('0.04', '1/25'))
check('1/3 = 2/6', isEquivalentTo('2/6', '1/3'))
check('-12 = -12.0', isEquivalentTo('-12.0', '-12'))
check('الأرقام العربية-الهندية مقبولة', isEquivalentTo('٠٫٠٤', '1/25'))
check('الكسر غير المكافئ مرفوض', !isEquivalentTo('29/25', '29/24'))
check('الإشارة الخاطئة مرفوضة', !isEquivalentTo('7/12', '-7/12'))
check('المقام صفر مرفوض', !isEquivalentTo('1/0', '0'))
check('نص عشوائي مرفوض', !isEquivalentTo('abc', '1/2'))
check('الصور المكافئة تحصل على 100', gradeExam(equivalents).earned === 100)

console.log('\n== 5) التحقق البنيوي ==')
check('validation.ok', validation.ok, validation.errors.join(' | '))
check('مجموع العلامات 100', validation.totalMarks === 100)
check('15 سؤالًا و45 فرعًا', validation.questionCount === 15 && validation.subpartCount === 45)
check('كل الأسئلة متفرعة', validation.branchedCount === 15)
check('توزيع الصعوبة 3/5/5/2', JSON.stringify(validation.difficultyCounts) === JSON.stringify({ foundational: 3, intermediate: 5, advanced: 5, reasoning: 2 }))

console.log('\n== 6) التقرير النصي TXT ==')
const attempt = attemptFor(perfectAnswers())
const report = buildReport(attempt, perfect)
check('اسم الملف المتوقع', attempt.reportFilename === 'Grade8_Algebra_Unit1_Unit2_Report_طالب_مرجعي.txt', attempt.reportFilename ?? '')
check('التقرير ليس فارغًا', report.length > 20000, String(report.length))
check('التقرير يحتوي اسم الطالب', report.includes('طالب مرجعي'))
check('التقرير يحتوي الدرجة 100 / 100', report.includes('100 / 100'))
check('التقرير يحتوي النسبة 100%', report.includes('100%'))
check('التقرير يعرض كل الأسئلة', questions.every((q) => report.includes(`[السؤال ${q.number} من 15]`)))
check(
  'التقرير يعرض كل الفروع',
  questions.every((q) => q.subparts.every((p) => report.includes(`الجزء ${p.label} —`))),
)
check('التقرير يحتوي الإجابات الصحيحة', report.includes('الإجابة الصحيحة:'))
check('التقرير يحتوي مراجع المصدر', report.includes('المرجع المصدر:'))
check('التقرير يذكر الوحدتين', report.includes('الوحدة 01') && report.includes('الوحدة 02'))
check('التقرير يوضح الإرسال إلى المعلّم بصدق', report.includes('تُرسَل نسخة من النتيجة إلى معلّم الطالب'))
check('التقرير لم يعد يدّعي عدم الإرسال', !report.includes('لم تُرسل بيانات الطالب'))
check('نهاية التقرير واضحة', report.trimEnd().endsWith('='.repeat(78)))
check('الأسطر بصيغة CRLF', report.includes('\r\n'))

const emptyReport = buildReport(attemptFor({}), empty)
check('تقرير الحالة الفارغة يُنشأ دائمًا', emptyReport.includes('0 / 100') && emptyReport.includes('لم يجب'))

console.log('\n== 7) مطابقة التقرير النصي مع الأصل (عدا إفصاح الإرسال) ==')
{
  // المحاولة المرجعية نفسها التي أُخذت بها اللقطة: نفس المعرّفات والأوقات والإجابات.
  const legacy = attemptFor(mixedAnswers())
  legacy.examId = 'algebra-nexus-grade8-u1-u2'
  legacy.attemptId = 'reference-attempt-0001'
  legacy.studentName = 'طالب مرجعي'
  legacy.reportFilename = reportFilename('طالب مرجعي')
  const legacyReport = buildReport(legacy, mixed)
  const restored =
    legacyReport
      .replace(
        'تُرسَل نسخة من النتيجة إلى معلّم الطالب عبر خدمة النتائج المرتبطة بلوحة المعلّم (Google Apps Script).\r\nلا تُرسل أي بيانات شخصية غير اسم الطالب، ولا تُسجَّل بيانات الطلاب في وحدة تخزين عامة داخل الصفحة.',
        'لم تُرسل بيانات الطالب أو إجاباته إلى أي خادم أو خدمة خارجية.',
      )
  const digest = createHash('sha256').update(restored).digest('hex')
  check('اسم ملف التقرير مطابق للأصل', legacy.reportFilename === fixture.report.filename, legacy.reportFilename)
  check('طول التقرير مطابق للأصل بعد استعادة سطر الخصوصية', restored.length === fixture.report.length, `${restored.length} / ${fixture.report.length}`)
  check('بصمة التقرير مطابقة للأصل بعد استعادة سطر الخصوصية', digest === fixture.report.sha256, digest.slice(0, 16))
  check('الإفصاح الجديد هو الفرق الوحيد', legacyReport !== restored && legacyReport.includes('Google Apps Script'))
}

console.log('\n== 8) سلم التقدير المرجعي (للمعلّم فقط) ==')
check('100 ← ممتاز', gradeLabel(100) === 'ممتاز')
check('95 ← ممتاز', gradeLabel(95) === 'ممتاز')
check('94.9 ← جيد جداً', gradeLabel(94.9) === 'جيد جداً')
check('85 ← جيد جداً', gradeLabel(85) === 'جيد جداً')
check('75 ← جيد', gradeLabel(75) === 'جيد')
check('65 ← مقبول', gradeLabel(65) === 'مقبول')
check('50 ← ضعيف', gradeLabel(50) === 'ضعيف')
check('49.9 ← يحتاج إلى دعم', gradeLabel(49.9) === 'يحتاج إلى دعم')

console.log('')
if (failures) {
  console.log(`❌ فشل ${failures} فحصًا في التصحيح والتقرير`)
  process.exit(1)
}
console.log('✅ كل فحوص التصحيح والتقرير ناجحة')
process.exit(0)
