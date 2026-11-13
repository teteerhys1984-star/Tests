/**
 * مطابقة المحتوى مع النسخة الأصلية: تُقارن بيانات الأسئلة والفروع والإجابات
 * والعلامات والمراجع والتفسيرات مع لقطة مرجعية أُخذت من المجلد الأصلي
 * `grade-8-algebra-exam_U1&U2` قبل النقل وقبل أي تعديل.
 */
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { questions, EXAM_META, validation, correctAnswerText } from '../src/lib/exam'
import { EXAM_ID } from '../src/config'

const fixture = JSON.parse(
  readFileSync('tests/fixtures/original-exam-reference.json', 'utf8'),
) as {
  sourceFolder: string
  contentSha256: string
  normalized: {
    meta: unknown
    questions: unknown
    correctTexts: Record<string, string>
    validation: Record<string, unknown>
  }
  grading: Record<string, { earned: number; counts: Record<string, number> }>
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

const sha = (s: string) => createHash('sha256').update(s).digest('hex')

console.log('\n== 1) المصدر والهوية ==')
check('اللقطة المرجعية مأخوذة من المجلد الأصلي', fixture.sourceFolder === 'grade-8-algebra-exam_U1&U2')
check('EXAM_ID الجديد مطابق للمطلوب', EXAM_ID === 'grade8-algebra-unit1-2', EXAM_ID)
check('EXAM_META.id مطابق لـ EXAM_ID', EXAM_META.id === EXAM_ID, EXAM_META.id)
check('إصدار الاختبار لم يتغيّر', EXAM_META.version === '1.0.0', EXAM_META.version)
check('المجموع المعلن 100 علامة', EXAM_META.totalMarks === 100, String(EXAM_META.totalMarks))
check('عدد الأسئلة المعلن 15', EXAM_META.questionCount === 15, String(EXAM_META.questionCount))
check('الوحدتان محفوظتان', EXAM_META.units.length === 2, String(EXAM_META.units.length))

console.log('\n== 2) نص الأسئلة والفروع (مطابقة حرفية) ==')
const currentQuestions = JSON.stringify(questions)
const originalQuestions = JSON.stringify(fixture.normalized.questions)
check('بيانات الأسئلة مطابقة للأصل حرفيًا', currentQuestions === originalQuestions)
check(
  'بصمة محتوى الأسئلة',
  sha(currentQuestions) === sha(originalQuestions),
  sha(currentQuestions).slice(0, 16),
)
check('عدد الأسئلة 15', questions.length === 15, String(questions.length))
const subparts = questions.reduce((s, q) => s + q.subparts.length, 0)
check('عدد الفروع 45', subparts === 45, String(subparts))
const total = questions.reduce((s, q) => s + q.marks, 0)
check('مجموع علامات الأسئلة 100', total === 100, String(total))
const subTotal = questions.reduce((s, q) => s + q.subparts.reduce((a, p) => a + p.marks, 0), 0)
check('مجموع علامات الفروع 100', subTotal === 100, String(subTotal))
check(
  'ترتيب الأسئلة 1…15 محفوظ',
  questions.every((q, i) => q.number === i + 1),
)
check(
  'معرّفات الأسئلة والفروع كما هي',
  questions.every((q) => q.id === `q${q.number}`) &&
    questions.every((q) => q.subparts.every((p, i) => p.id === `${q.id}${'abcde'[i]}`)),
)

console.log('\n== 3) الإجابات الصحيحة ونصوصها ==')
const currentCorrect = Object.fromEntries(
  questions.flatMap((q) => q.subparts.map((p) => [p.id, correctAnswerText(p)])),
)
check(
  'عدد نصوص الإجابات الصحيحة 45',
  Object.keys(currentCorrect).length === 45,
  String(Object.keys(currentCorrect).length),
)
check(
  'كل نصوص الإجابات الصحيحة مطابقة للأصل',
  JSON.stringify(currentCorrect) === JSON.stringify(fixture.normalized.correctTexts),
)
for (const q of questions) {
  for (const p of q.subparts) {
    if (p.kind === 'rational') {
      check(`${p.id}: الإجابة المتوقعة محفوظة`, !!p.expectedRational, p.expectedRational)
    } else if (p.kind === 'fields') {
      check(
        `${p.id}: مجموع علامات الحقول = علامة الفرع`,
        (p.fields ?? []).reduce((s, f) => s + f.marks, 0) === p.marks,
      )
    } else if (p.kind === 'mcq') {
      check(`${p.id}: الخيار الصحيح موجود`, !!p.options?.some((o) => o.id === p.correctOption))
    } else if (p.kind === 'justify') {
      check(`${p.id}: الحكم والتبرير محفوظان`, !!p.correctVerdict && !!p.correctReason)
    } else if (p.kind === 'order') {
      check(
        `${p.id}: الترتيب الصحيح محفوظ`,
        JSON.stringify(p.correctOrder) === JSON.stringify(['f1', 'f2', 'f3']),
      )
    }
  }
}

console.log('\n== 4) التحقق البنيوي ==')
check('validation.ok', validation.ok, validation.errors.join(' | '))
check('validation.totalMarks = 100', validation.totalMarks === 100)
check('validation.questionCount = 15', validation.questionCount === 15)
check('validation.subpartCount = 45', validation.subpartCount === 45)
check('validation.branchedCount = 15', validation.branchedCount === 15)
check(
  'توزيع الصعوبة محفوظ',
  JSON.stringify(validation.difficultyCounts) ===
    JSON.stringify(fixture.normalized.validation.difficultyCounts),
  JSON.stringify(validation.difficultyCounts),
)
check(
  'تقرير التحقق مطابق للأصل',
  JSON.stringify({
    ok: validation.ok,
    errors: validation.errors,
    totalMarks: validation.totalMarks,
    questionCount: validation.questionCount,
    branchedCount: validation.branchedCount,
    difficultyCounts: validation.difficultyCounts,
    subpartCount: validation.subpartCount,
  }) === JSON.stringify(fixture.normalized.validation),
)

console.log('\n== 5) البيانات التصحيحية والمراجع ==')
check(
  'كل فرع يحتفظ بالحل والمبرر وقاعدة الاحتساب والخطأ الشائع',
  questions.every((q) =>
    q.subparts.every((p) => !!p.solution && !!p.rationale && !!p.marking && !!p.commonMistakes),
  ),
)
check(
  'كل فرع يحتفظ بمرجع مصدر كامل',
  questions.every((q) =>
    q.subparts.every((p) => !!p.source?.unit && !!p.source?.lesson && !!p.source?.page),
  ),
)
check(
  'مراجع الوحدتين محفوظة',
  questions.every((q) =>
    q.subparts.every(
      (p) =>
        p.source.unit === 'الوحدة الأولى: الأعداد العادية والعمليات عليها' ||
        p.source.unit === 'الوحدة الثانية: قوى الأعداد العادية',
    ),
  ),
)
check(
  'بيانات الرسوم/المعادلات (LaTeX) محفوظة في النصوص',
  currentQuestions.includes('\\\\frac') || currentQuestions.includes('\\frac'),
)

console.log('\n== 6) نتائج مرجعية للتصحيح (من اللقطة) ==')
check('الحالة الكاملة: 100', fixture.grading.perfect.earned === 100)
check('الحالة الفارغة: 0', fixture.grading.empty.earned === 0)
check('الحالة الخاطئة: 0', fixture.grading.wrong.earned === 0)
check('الحالة المختلطة: 33', fixture.grading.mixed.earned === 33)
check('العلامات الجزئية (حقول): 98', fixture.grading.partialFields.earned === 98)
check('العلامات الجزئية (حكم/تبرير): 99', fixture.grading.partialJustify.earned === 99)
check('الصور المكافئة: 100', fixture.grading.equivalents.earned === 100)

console.log('')
if (failures) {
  console.log(`❌ فشل ${failures} فحصًا في مطابقة النسخة الأصلية`)
  process.exit(1)
}
console.log('✅ كل فحوص مطابقة النسخة الأصلية ناجحة')
process.exit(0)
