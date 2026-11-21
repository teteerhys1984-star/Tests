import assert from 'node:assert/strict'
import { examQuestions, unitOneLessons } from '../data/questions'
import type { StudentAnswersMap } from '../types/exam'
import {
  gradeFullExam,
  gradeQuestion,
  gradeSingleBranch,
  isExamComplete,
  isQuestionComplete,
} from '../utils/scoring'
import {
  formatDurationHHMMSS,
  isNumericallyEqual,
  parseNaturalNumber,
  parseOrderedPair,
} from '../utils/mathNorm'
import {
  buildTxtReportFilename,
  generateTxtReportContent,
} from '../components/ResultsView'

console.log('▶ بدء تشغيل اختبارات الوحدات (Unit Tests) لمنطق التصحيح والدقة الرياضية...')

/* 1. Verify Blueprint: 30 main questions, 100 marks, exact lesson distribution */
assert.equal(examQuestions.length, 30, 'يجب أن يكون عدد الأسئلة الرئيسية 30 سؤالاً بالضبط')

const totalMarks = examQuestions.reduce((sum, q) => sum + q.totalMarks, 0)
assert.equal(totalMarks, 100, 'يجب أن يكون مجموع العلامات 100 علامة بالضبط')

// Check sequential numbering 1..30 and branch mark sum
examQuestions.forEach((q, idx) => {
  assert.equal(q.number, idx + 1, `السؤال في الموضع ${idx} يجب أن يحمل الرقم ${idx + 1}`)
  const branchSum = Number(q.branches.reduce((s, b) => s + b.marks, 0).toFixed(2))
  assert.equal(
    branchSum,
    q.totalMarks,
    `مجموع علامات فروع السؤال ${q.number} (${branchSum}) يجب أن يساوي علامة السؤال (${q.totalMarks})`
  )
})

// Check exact distribution across the 8 lessons
const expectedDistribution: Record<
  string,
  { count: number; marks: number; pages: string }
> = {
  coordinates: { count: 3, marks: 9, pages: '3–4' },
  'line-graphs': { count: 3, marks: 9, pages: '7–9' },
  'natural-numbers': { count: 5, marks: 16, pages: '10–14' },
  'rounding-natural-numbers': { count: 4, marks: 13, pages: '15–18' },
  'adding-subtracting-natural-numbers': { count: 5, marks: 17, pages: '19–22' },
  'angle-measurement': { count: 4, marks: 14, pages: '23–30' },
  parallelogram: { count: 3, marks: 11, pages: '31–35' },
  rhombus: { count: 3, marks: 11, pages: '36–39' },
}

for (const lesson of unitOneLessons) {
  const qs = examQuestions.filter(q => q.lessonId === lesson.id)
  const mks = qs.reduce((s, q) => s + q.totalMarks, 0)
  const exp = expectedDistribution[lesson.id]
  assert.ok(exp, `الدرس ${lesson.id} يجب أن يكون ضمن الوحدة الأولى`)
  assert.equal(qs.length, exp.count, `عدد أسئلة درس ${lesson.title} يجب أن يكون ${exp.count}`)
  assert.equal(mks, exp.marks, `مجموع علامات درس ${lesson.title} يجب أن يكون ${exp.marks}`)
  assert.equal(lesson.pages, exp.pages, `صفحات درس ${lesson.title} يجب أن تكون ${exp.pages}`)
}

// Verify questions are interleaved (never ordered consecutively by lesson)
for (let i = 1; i < examQuestions.length; i++) {
  assert.notEqual(
    examQuestions[i].lessonId,
    examQuestions[i - 1].lessonId,
    `السؤالان المتتاليان ${examQuestions[i - 1].number} و ${examQuestions[i].number} لا يجوز أن يكونا من الدرس نفسه`
  )
}
console.log('✓ اجتياز فحص المخطط وتوزيع الدروس الثمانية والصفحات وترتيب الأسئلة (30 سؤالاً / 100 علامة).')

/* 2. Independent Mathematical Audit of Calculations & Rounding */
assert.equal(2468750 + 1854690, 4323440, 'تحقق جمع السؤال 6')
assert.equal(5000000 - 2364800, 2635200, 'تحقق طرح السؤال 11')
assert.equal(425600 - 289450, 136150, 'تحقق طرح السؤال 17')
assert.equal(325400 + 274600, 600000, 'تحقق الخطوة 1 في السؤال 23')
assert.equal(850000 - 600000, 250000, 'تحقق الخطوة 2 في السؤال 23')
assert.equal(250000 + 150000, 400000, 'تحقق الخطوة 3 في السؤال 23')
assert.equal(742500 - 318200, 424300, 'تحقق طرح السؤال 29')
assert.equal(424300 + 318200, 742500, 'تحقق جمع التحقق في السؤال 29')

const roundToPlace = (n: number, place: number) => Math.round(n / place) * place
assert.equal(roundToPlace(2740, 1000), 3000, 'تقريب 2740 لأقرب ألف')
assert.equal(roundToPlace(468210, 10000), 470000, 'تقريب 468210 لأقرب عشرة آلاف')
assert.equal(roundToPlace(3482137, 100000), 3500000, 'تقريب 3482137 لأقرب مئة ألف')
assert.equal(roundToPlace(5628000, 1000000), 6000000, 'تقريب 5628000 لأقرب مليون')
assert.equal(roundToPlace(7846200, 10000), 7850000, 'تقريب 7846200 لأقرب عشرة آلاف')
assert.equal(roundToPlace(7846200, 100000), 7800000, 'تقريب 7846200 لأقرب مئة ألف')
assert.equal(roundToPlace(184490, 10000), 180000, 'تقريب 184490 لأقرب عشرة آلاف')
console.log('✓ اجتياز التدقيق الحسابي المستقل لعمليات الجمع والطرح والتقريب.')

/* 3. Verify Perfect Attempt Scores 100 / 100 */
const perfectAnswers: StudentAnswersMap = {
  'q01-a': '(6, 4)',
  'q01-b': '(0, 5)',
  'q01-c': '(3, 0)',
  'q02-a': '7,050,309',
  'q02-b': 'أربعة ملايين وستمئة وثمانية آلاف وعشرون',
  'q03-a': 'A',
  'q03-b': 'bac',
  'q03-c': 'inside',
  'q04-a': '2500',
  'q04-b': 'right-3000',
  'q04-c': '3,000',
  'q05-a': '25',
  'q05-b': 'mon',
  'q05-c': '15',
  'q06-a': '13',
  'q06-b': '4,323,440',
  'q07-a': 'fig1',
  'q07-b': 'one-pair',
  'q07-c': 'قطر',
  'q08-a': '70,000',
  'q08-b': '400000',
  'q08-c': '9',
  'q09-a': 'fig2',
  'q09-b': 'adj',
  'q09-c': 'false-fix',
  'q10-a': 'acute',
  'q10-b': 'right',
  'q10-c': 'obtuse',
  'q10-d': 'straight',
  'q11-a': '4',
  'q11-b': '2,635,200',
  'q12-a': '(4, 7)',
  'q12-b': 'swapped',
  'q13-a': '470,000',
  'q13-b': '3,500,000',
  'q13-c': '6,000,000',
  'q14-a': 'sun-mon',
  'q14-b': '4',
  'q14-c': 'inc',
  'q15-a': '6,000,000',
  'q15-b': '4,000,000 + 500,000 + 7,000 + 90',
  'q15-c': '8,309,062',
  'q16-a': '6',
  'q16-b': '4',
  'q16-c': '70',
  'q16-d': '110',
  'q17-a': 'sub',
  'q17-b': '136,150',
  'q18-a': 'inner-right',
  'q18-b': '70',
  'q18-c': 'wrong-scale',
  'q19-a': '7,850,000',
  'q19-b': '7,800,000',
  'q19-c': 'gt',
  'q20-a': '5',
  'q20-b': '5',
  'q20-c': '55',
  'q20-d': '20',
  'q21-a': '900,000',
  'q21-b': '90,000',
  'q21-c': 'ten-thousands',
  'q22-a': '35',
  'q22-b': '45',
  'q22-c': '25',
  'q23-a': '600,000',
  'q23-b': '250,000',
  'q23-c': '400,000',
  'q24-a': '120',
  'q24-b': 'obtuse',
  'q25-a': '(5, 6)',
  'q25-b': '8',
  'q25-c': '(8, 4)',
  'q26-a': '4',
  'q26-b': '180,000',
  'q26-c': 'wrong-neighbor',
  'q27-a': '(6, 4)',
  'q27-b': '7',
  'q28-a': 'n2,n3,n1',
  'q28-b': 'gt',
  'q29-a': 'forgot-borrow',
  'q29-b': '424,300',
  'q29-c': '742,500',
  'q30-a': '4',
  'q30-b': '4',
  'q30-c': '4',
  'q30-d': '10',
}

assert.equal(isExamComplete(perfectAnswers), true, 'يجب أن يكتمل الاختبار عند الإجابة عن جميع الفروع')
const fullSummary = gradeFullExam(perfectAnswers)
assert.equal(fullSummary.totalEarned, 100, 'الإجابات النموذجية الكاملة يجب أن تحصل على 100 من 100')
assert.equal(fullSummary.correctQuestionCount, 30, 'جميع الأسئلة الـ 30 يجب أن تكون صحيحة بالكامل')
assert.equal(fullSummary.wrongQuestionCount, 0)
console.log('✓ اجتياز فحص العلامة الكاملة (100 / 100) لجميع الأسئلة الثلاثين وفروعها.')

/* 4. Verify Coordinate Order & Partial Credit & Error Diagnostics */
// Swapped coordinates must get 0 and specific swap diagnostic
const swappedA = gradeSingleBranch(examQuestions[0].branches[0], { 'q01-a': '(4, 6)' })
assert.equal(swappedA.earnedMarks, 0, 'عكس الزوج المرتب (4, 6) بدلاً من (6, 4) يجب أن يأخذ 0')
assert.ok(swappedA.errorFeedback?.includes('عكستِ ترتيب الإحداثيين'), 'يجب تشخيص خطأ عكس الإحداثيين')

// One coordinate right gets 0.5 partial credit
const halfCoord = gradeSingleBranch(examQuestions[0].branches[0], { 'q01-a': '(6, 2)' })
assert.equal(halfCoord.earnedMarks, 0.5, 'إصابة الإحداثي الأفقي فقط في (6, 2) تمنح نصف العلامة (0.5)')
assert.equal(halfCoord.isPartial, true)

// Eastern Arabic digits and ungrouped numbers are compared numerically
assert.equal(isNumericallyEqual('٧،٠٥٠،٣٠٩', 7050309), true, 'قبول الأرقام الهندية الشرقية مع الفواصل')
assert.equal(isNumericallyEqual('7050309', 7050309), true, 'قبول الأرقام المتصلة بدون فواصل')
assert.equal(parseNaturalNumber('007'), 7)
assert.deepEqual(parseOrderedPair('(٨ ، ٤)'), { x: 8, y: 4 })

// Partial credit in verbal number writing (Q2 branch b)
const partialVerbal = gradeSingleBranch(examQuestions[1].branches[1], {
  'q02-b': 'اربعه ملايين وستمئه وثمانيه الاف',
})
assert.equal(partialVerbal.earnedMarks, 1, 'إصابة حلقتين من ثلاث في الصيغة اللفظية تمنح 1 من 1.5')
assert.equal(partialVerbal.isPartial, true)

// Partial credit in addition when missing one carry (Q6 branch b)
const missedCarryAdd = gradeSingleBranch(examQuestions[5].branches[1], {
  'q06-b': '4,223,440',
})
assert.equal(missedCarryAdd.earnedMarks, 1, 'نسيان حمل واحد في الجمع يمنح علامة جزئية (1 من 2)')
assert.equal(missedCarryAdd.isPartial, true)

// Multi-step follow-through partial credit in Q23
const followThroughAnswers: StudentAnswersMap = {
  'q23-a': '500,000', // wrong first step
  'q23-b': '350,000', // correct subtraction 850,000 - 500,000 based on student's step 1!
  'q23-c': '500,000', // correct addition 350,000 + 150,000 based on student's step 2!
}
const q23Result = gradeQuestion(examQuestions[22], followThroughAnswers)
assert.equal(q23Result.status, 'partial', 'السؤال 23 متعدد الخطوات يمنح علامة جزئية عند صحة خطوات المتابعة')
assert.equal(q23Result.earnedMarks, 1.25)

// Protractor touch tolerance in Q24
const tolFull = gradeSingleBranch(examQuestions[23].branches[0], { 'q24-a': '118' })
assert.equal(tolFull.earnedMarks, 2.5, 'هامش اللمس ±3 درجات حول 120° يمنح العلامة الكاملة 2.5')
const tolPartial = gradeSingleBranch(examQuestions[23].branches[0], { 'q24-a': '115' })
assert.equal(tolPartial.earnedMarks, 1.5, 'هامش ±5 درجات حول 120° يمنح علامة جزئية 1.5')
const wrongScale60 = gradeSingleBranch(examQuestions[23].branches[0], { 'q24-a': '60' })
assert.equal(wrongScale60.earnedMarks, 0, 'قراءة التدريج المعاكس 60° تأخذ 0 مع شرح الخطأ')

// Incomplete gate check
const incompleteAnswers = { ...perfectAnswers }
delete incompleteAnswers['q30-d']
assert.equal(isExamComplete(incompleteAnswers), false, 'ترك فرع واحد فارغاً يمنع اكتمال الاختبار')
assert.equal(isQuestionComplete(examQuestions[29], incompleteAnswers), false)

// Timer & TXT report verification
assert.equal(formatDurationHHMMSS(0), '00:00:00')
assert.equal(formatDurationHHMMSS(3665), '01:01:05')
const filename = buildTxtReportFilename('زينب أحمد الشامي')
assert.ok(filename.includes('زينب_أحمد_الشامي') && filename.endsWith('.txt'))
const reportTxt = generateTxtReportContent('زينب أحمد الشامي', fullSummary, 745, Date.now())
assert.ok(reportTxt.includes('زينب أحمد الشامي'))
assert.ok(reportTxt.includes('100 من 100'))
assert.ok(reportTxt.includes('المهندس سومر شاهين'))

console.log('✓ اجتياز جميع اختبارات العلامات الجزئية، وتشخيص الأخطاء، وبوابة التسليم، وتقرير TXT بنجاح!')
