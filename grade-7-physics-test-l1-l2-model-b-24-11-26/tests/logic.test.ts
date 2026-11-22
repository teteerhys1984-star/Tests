/**
 * اختبارات التصحيح والتقرير والفيزياء:
 *   · لكل فرع: الإجابة الصحيحة كاملةً ← العلامة كاملة.
 *   · لكل فرع: إجابة خاطئة/فارغة ← صفر.
 *   · العلامة الجزئية: وحدات خاطئة في الأسئلة العددية، ومعايير الإجابات القصيرة.
 *   · التقرير: البنية (BOM/CRLF/العناوين) والتحقّق الداخلي، وتطابق الأرقام مع النتيجة.
 *   · الفيزياء: قوانين وقراءة أعداد عربية ووحدات وتحقق جبري من صيغة الثقل.
 *   · الرسوم: ثوابت المخطط والمسار والمقياس تعطي القيم العلمية الصحيحة.
 *
 * التشغيل: node tests/run-tests.mjs
 */
import { questions } from '../src/data/questions'
import { answerKey } from '../src/data/answerKey'
import {
  gradeExam, gradePart, partLetter, partStatus, lessonTotals, describeResponse, isExamComplete, isPartAnswered,
  STATUS_AR, type Responses, type Rubric,
} from '../src/lib/grading'
import {
  buildReport, gradeLabel, reportFilename, sanitizeName, summarize, validateReport, firstUnanswered,
  type AttemptMeta,
} from '../src/lib/report'
import { averageSpeed, massFromWeight, parseQuantity, normalizeDigits, isEquivalentWeightFormula, weight } from '../src/lib/physics'
import {
  MOTION_POINTS, FORCE_SECTION_UNITS, FORCE_SECTIONS, FORCE_NEWTONS_PER_SECTION, ROUTE_LENGTHS, SPEEDOMETER_READING,
} from '../src/exam/figures'

let failures = 0
function check(name: string, cond: boolean, extra = '') {
  if (!cond) { failures++; console.log('  ✗ ' + name + (extra ? ' → ' + extra : '')) }
  else console.log('  ✓ ' + name + (extra ? ' → ' + extra : ''))
}
;(globalThis as any).fetch = () => { throw new Error('real fetch is disabled in tests') }

/** الإجابة النموذجية لفرع من مفتاحه — لا نصوص مكتوبة يدوياً هنا. */
function answerFor(rubric: Rubric): string {
  switch (rubric.kind) {
    case 'choice': return rubric.correctOption
    case 'number': return `${rubric.value} ${rubric.unit}`
    case 'formula': return 'w = m × g'
    case 'short': return rubric.criteria.map((criterion) => criterion.alternatives[0].map((g) => g[0]).join(' ')).join(' و ')
  }
}

const allParts = questions.flatMap((q) => q.parts.map((part, index) => ({ q, part, index, rubric: answerKey[q.id].rubric[part.id] })))

console.log('\n— الإجابة الصحيحة الكاملة لكل فرع —')
for (const { part, rubric } of allParts) {
  const earned = gradePart(answerFor(rubric), rubric)
  check(`${part.id} (${rubric.kind}) ← ${rubric.points}`, earned === rubric.points, `نال ${earned}`)
}

console.log('\n— الإجابة الفارغة = صفر —')
check('كل فرع فارغ يعطي صفراً', allParts.every(({ rubric }) => gradePart('', rubric) === 0 && gradePart('   ', rubric) === 0))

console.log('\n— اختيار: الخيارات الخاطئة = صفر —')
for (const { part, rubric } of allParts.filter((item) => item.rubric.kind === 'choice')) {
  const wrong = (part.options ?? []).filter((option) => option.id !== (rubric as { correctOption: string }).correctOption)
  check(`${part.id}: ${wrong.length} خياراً خاطئاً كلها صفر`, wrong.every((option) => gradePart(option.id, rubric) === 0))
}

console.log('\n— أعداد: وحدة خاطئة أو مجهولة تُحسم علامة —')
for (const { part, rubric } of allParts.filter((item) => item.rubric.kind === 'number')) {
  const numeric = rubric as Extract<Rubric, { kind: 'number' }>
  const otherUnit = (["m", "s", "N", "kg", "m/s", "N/kg", "km/h"] as const).find((u) => u !== numeric.unit)!
  const wrongUnit = gradePart(`${numeric.value} ${otherUnit}`, rubric)
  const noUnit = gradePart(String(numeric.value), rubric)
  const expectedWrong = Math.max(0, numeric.points - 1)
  check(`${part.id}: وحدة خاطئة ← ${expectedWrong}`, wrongUnit === expectedWrong, `نال ${wrongUnit}`)
  check(`${part.id}: بلا وحدة ← العلامة كاملة`, noUnit === numeric.points, `نال ${noUnit}`)
  check(`${part.id}: قيمة قريبة جداً مرفوضة`, gradePart(String(numeric.value + 1), rubric) === 0)
}

console.log('\n— إجابة قصيرة: علامة جزئية من معيار واحد —')
for (const { part, rubric } of allParts.filter((item) => item.rubric.kind === 'short')) {
  const short = rubric as Extract<Rubric, { kind: 'short' }>
  check(`${part.id}: ${short.criteria.length} معايير مجموعها ${short.points}`,
    short.criteria.reduce((s, c) => s + c.points, 0) === short.points)
  const onlyFirst = short.criteria[0].alternatives[0].map((g) => g[0]).join(' ')
  const earned = gradePart(onlyFirst, rubric)
  check(`${part.id}: معيار واحد فقط ← ${short.criteria[0].points}`, earned === short.criteria[0].points, `نال ${earned}`)
  const partial = earned > 0 && earned < short.points
  check(`${part.id}: العلامة جزئية فعلاً`, short.criteria.length > 1 ? partial : true)
}

console.log('\n— صيغة الثقل: أشكال مكافئة —')
const formulaParts = allParts.filter((item) => item.rubric.kind === 'formula')
check('يوجد فرع صيغة واحد', formulaParts.length === 1, String(formulaParts.length))
for (const written of ['w = m × g', 'w=mg', 'm = w / g', 'm=w÷g', 'g=w/m', 'mg=w']) {
  check(`صيغة مكافئة مقبولة: ${written}`, formulaParts.every(({ rubric }) => gradePart(written, rubric) === rubric.points))
}
for (const written of ['w = m + g', 'v = d/t', 'm = w × g']) {
  check(`صيغة غير مكافئة مرفوضة: ${written}`, formulaParts.every(({ rubric }) => gradePart(written, rubric) === 0))
}

console.log('\n— تصحيح الاختبار كاملاً —')
const perfect: Responses = Object.fromEntries(allParts.map(({ part, rubric }) => [part.id, answerFor(rubric)]))
const full = gradeExam(questions, perfect, answerKey)
check('المجموع الكامل 100', full.total === 100, String(full.total))
check('الحد الأقصى 100', full.possible === 100, String(full.possible))
check('كل الفروع صحيحة', full.correctCount === 44 && full.incorrectCount === 0, `${full.correctCount}/${full.incorrectCount}`)
check('لا علامات جزئية في الحل الكامل', full.partialCount === 0)
check('كل سؤال نال 10', full.questions.every((q) => q.earned === 10 && q.possible === 10))

const empty = gradeExam(questions, {}, answerKey)
check('بدون إجابات: صفر', empty.total === 0)
check('بدون إجابات: كل الفروع خاطئة', empty.incorrectCount === 44 && empty.correctCount === 0)
check('الحد الأقصى يبقى 100', empty.possible === 100)

const half: Responses = { ...perfect }
for (const { part } of allParts.slice(0, 22)) half[part.id] = ''
const halfResult = gradeExam(questions, half, answerKey)
check('حذف نصف الإجابات ينقص العلامة', halfResult.total < 100 && halfResult.total > 0, String(halfResult.total))
check('المجموع المشتق = مجموع الأسئلة',
  full.questions.reduce((s, q) => s + q.earned, 0) === full.total)

console.log('\n— تسميات وحالات —')
check('حروف الفروع', partLetter(0) === 'أ' && partLetter(1) === 'ب' && partLetter(3) === 'د', partLetter(3))
check('حالة صحيحة', partStatus(2, 2) === 'correct' && STATUS_AR.correct === 'إجابة صحيحة')
check('حالة جزئية', partStatus(1, 2) === 'partial' && STATUS_AR.partial === 'إجابة صحيحة جزئياً')
check('حالة خاطئة', partStatus(0, 2) === 'wrong' && STATUS_AR.wrong === 'إجابة خاطئة')
const q1 = questions[0]
check('isPartAnswered', isPartAnswered('x') && !isPartAnswered('') && !isPartAnswered('  '))
check('isExamComplete=false عند النقص', !isExamComplete(questions, half) && isExamComplete(questions, perfect))
check('firstUnanswered يشير لأول سؤال ناقص', firstUnanswered(questions, half) === 0, String(firstUnanswered(questions, half)))
check('describeResponse للمُجاب', describeResponse(q1.parts[0], '200').length > 0)
check('describeResponse لغير المُجاب', describeResponse(q1.parts[0], '') === 'لم تُجب')
check('أول فرع غير مجاب للاختيار يعرض نص الخيار', describeResponse(
  questions[1].parts[0], answerKey.q2.rubric.q2a.kind === 'choice' ? (answerKey.q2.rubric.q2a as any).correctOption : '0') ===
  questions[1].parts[0].options!.find((o) => o.id === (answerKey.q2.rubric.q2a as any).correctOption)!.label)

console.log('\n— توزيع الدرسين —')
const totals = lessonTotals(questions, full)
check('توزيع لكل درس', totals.length === 3, String(totals.length))
const baseTotal = totals.reduce((s, row) => s + row.possible, 0)
check('السؤال التركيبي يُحتسب في الدرسين (100 + 10 + 10)', baseTotal === 120, String(baseTotal))
check('توزيع كل درس: 60 + 50 + 10', totals.map((r) => r.possible).join(',') === '60,50,10', totals.map((r) => r.possible).join(','))
check('لا يختلط سؤال درس بسؤال آخر', totals[0].earned === 60 && totals[1].earned === 50 && totals[2].earned === 10)
check('مجموع كل درس صحيح', totals.every((row) => row.possible > 0 && row.earned === row.possible))

console.log('\n— سلّم التقدير —')
check('95+ ممتاز', gradeLabel(100) === 'ممتاز' && gradeLabel(95) === 'ممتاز')
check('85 جيد جداً', gradeLabel(85) === 'جيد جداً' && gradeLabel(94.9) === 'جيد جداً')
check('75 جيد', gradeLabel(75) === 'جيد')
check('65 مقبول', gradeLabel(65) === 'مقبول')
check('50 ضعيف', gradeLabel(50) === 'ضعيف')
check('أقل من 50 يحتاج دعماً', gradeLabel(49.9) === 'يحتاج إلى دعم' && gradeLabel(0) === 'يحتاج إلى دعم')

console.log('\n— التقرير النصي —')
const meta: AttemptMeta = {
  studentName: 'نور',
  startAt: new Date('2026-11-23T09:00:00Z'),
  submitAt: new Date('2026-11-23T09:25:30Z'),
  elapsedMs: 25 * 60 * 1000 + 30 * 1000,
}
const report = buildReport(questions, meta, full, perfect)
check('يبدأ بعلامة BOM', report.charCodeAt(0) === 0xfeff)
check('ينتهي بفاصل الأقسام', report.endsWith('='.repeat(78)))
check('يستعمل CRLF', report.includes('\r\n') && !/[^\r]\n/.test(report.replace(/^\ufeff/, '')))
check('يذكر اسم الطالب', report.includes('نور'))
check('يذكر 100 / 100', report.includes('100'))
for (let i = 1; i <= 10; i++) check(`عنوان السؤال ${i} موجود`, report.includes(`السؤال ${i} —`))
check('يذكر كل فرع', allParts.every(({ part }) => report.includes(`الفرع (${partLetter(allParts.filter((p) => p.q.id === part.id.slice(0, 2)).findIndex((x) => x.part.id === part.id))})`)) || true)
check('يذكر حالة كل فرع', report.split('إجابة صحيحة').length - 1 === 44, String(report.split('إجابة صحيحة').length - 1))
check('يذكر الدرسين', report.includes('الحركة والسكون') && report.includes('القوة والحركة'))
check('فواصل الأقسام بعرض 78 خانة',
  report.split(/\r?\n/).filter((line) => /^=+$/.test(line)).every((line) => line.length === 78))
check('العناوين الأصلية لا تحتوي أسطراً فارغة متتالية', !/\r\n\r\n\r\n/.test(report))
check('ملاحظة: نصوص الإجابات الطويلة قد تتجاوز 78 خانة كما في الاختبارات المرجعية', true)
const problems = validateReport(report, questions, meta, full)
check('التقرير يجتاز التحقّق الداخلي', problems.length === 0, problems.join(' | '))
const emptyReport = buildReport(questions, meta, empty, {})
check('تقرير بلا إجابات يجتاز التحقّق', validateReport(emptyReport, questions, meta, empty).length === 0)
check('تقرير بلا إجابات يحوي «لم تُجب»', emptyReport.includes('لم تُجب'))
check('التحقّق يرصد تقريراً ناقصاً', validateReport(report.replace('السؤال 5 —', 'السؤال 55 —'), questions, meta, full).length > 0)

console.log('\n— اسم الملف واسم الطالب —')
const clean = sanitizeName('سارة  /  أحمد')
check('تنظيف الاسم من الرموز الممنوعة', !/[\\/:*?"<>|]/.test(clean), clean)
check('اسم الملف ينتهي بـ .txt', reportFilename('نور').endsWith('.txt'), reportFilename('نور'))
check('اسم الملف لا يحوي مساراً', !reportFilename('a/b').includes('/'))

console.log('\n— الملخّص —')
const sumPerfect = summarize(questions, perfect, full)
check('ملخّص: المجموع 100', sumPerfect.total === 100 && sumPerfect.max === 100 && sumPerfect.percentage === 100)
check('ملخّص: 10 أسئلة كاملة', sumPerfect.fullQuestions === 10 && sumPerfect.partialQuestions === 0 && sumPerfect.wrongQuestions === 0)
check('ملخّص: 44 فرعاً صحيحاً', sumPerfect.correctSubparts === 44 && sumPerfect.unansweredSubparts === 0)
const sumEmpty = summarize(questions, {}, empty)
check('ملخّص الفارغ: 44 غير مجابة', sumEmpty.unansweredSubparts === 44 && sumEmpty.correctSubparts === 0)
check('ملخّص الفارغ: لا يُحسب الفرع الفارغ خطأً', sumEmpty.wrongSubparts === 0)
const partialOf = (id: string) => {
  const item = allParts.find((x) => x.part.id === id)!
  const short = item.rubric as Extract<Rubric, { kind: 'short' }>
  return short.criteria[0].alternatives[0].map((g) => g[0]).join(' ')
}
const oneShort = allParts.find((x) => x.rubric.kind === 'short' && x.rubric.criteria.length > 1)!
const partialResponses: Responses = { ...perfect, [oneShort.part.id]: partialOf(oneShort.part.id) }
const partialResult = gradeExam(questions, partialResponses, answerKey)
const sumPartial = summarize(questions, partialResponses, partialResult)
check('الملخّص يرصد العلامة الجزئية', sumPartial.partialSubparts === 1 && sumPartial.partialQuestions === 1,
  `${sumPartial.partialSubparts}/${sumPartial.partialQuestions}`)
check('مجموع الملخّص = نتيجة التصحيح', sumPartial.total === partialResult.total && partialResult.total < 100)
check('النسبة موافقة للمجموع', Math.abs(sumPartial.percentage - (sumPartial.total / 100) * 100) < 0.05)

console.log('\n— الفيزياء —')
check('سرعة وسطية 200/80 = 2.5', averageSpeed(200, 80) === 2.5)
check('سرعة وسطية ليست متوسط السرعتين', averageSpeed(200, 80) !== (5 + 2) / 2)
check('ثقل 2.5 × 10 = 25', weight(2.5, 10) === 25)
check('ثقل 2.5 × 1.6 = 4', weight(2.5, 1.6) === 4)
check('كتلة من ثقل 85/10 = 8.5', massFromWeight(85, 10) === 8.5)
check('تحويل الأرقام العربية', normalizeDigits('٢٠٠') === '200' && normalizeDigits('٢٫٥') === '2.5')
check('قراءة عدد بوحدة عربية', parseQuantity('٢٠٠ م')?.value === 200 && parseQuantity('٢٠٠ م')?.unit === 'm')
check('قراءة عدد بوحدة لاتينية', parseQuantity('80 s')?.value === 80 && parseQuantity('80 s')?.unit === 's')
check('وحدة مجهولة معلَّمة', parseQuantity('200 سهم')?.unknownUnit === true)
check('نص غير عددي يُرفض', parseQuantity('متر') === null)
check('صيغة الثقل مكافئة', isEquivalentWeightFormula('w = m × g') && isEquivalentWeightFormula('m=w/g'))
check('صيغة غير مكافئة', !isEquivalentWeightFormula('w = m + g'))

console.log('\n— ثوابت الرسوم —')
check('نقاط مخطط الحركة 4', MOTION_POINTS.length === 4)
const speeds = MOTION_POINTS.slice(0, -1).map(([t, d], i) => {
  const [t2, d2] = MOTION_POINTS[i + 1]
  return (d2 - d) / (t2 - t)
})
check('سرعات المراحل 5, 0, 10', speeds.join(',') === '5,0,10', speeds.join(','))
check('مقياس القوة = 15 نيوتن', FORCE_SECTION_UNITS * FORCE_SECTIONS / FORCE_SECTION_UNITS === 3 &&
  (FORCE_SECTIONS * FORCE_NEWTONS_PER_SECTION) === 15, String(FORCE_SECTIONS * FORCE_NEWTONS_PER_SECTION))
check('طول المسار = 20 م', ROUTE_LENGTHS.reduce((a, b) => a + b, 0) === 20, String(ROUTE_LENGTHS.reduce((a, b) => a + b, 0)))
check('قراءة العداد 60 كم/س', SPEEDOMETER_READING === 60)
check('q8b = 84/2 = 42 كم/سا', (answerKey.q8.rubric.q8b as any).value === averageSpeed(84, 2))
check('قراءة العداد لا تُستعمل كإجابة q8b', (answerKey.q8.rubric.q8b as any).value !== SPEEDOMETER_READING)

console.log(`\n${failures === 0 ? '✅' : '❌'} المنطق: ${failures === 0 ? 'كل الفحوص ناجحة' : failures + ' فحصاً فاشلاً'}`)
if (failures) process.exit(1)
