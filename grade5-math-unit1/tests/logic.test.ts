import { QUESTIONS, SUBPART_COUNT, MARKS_TOTAL, QUESTION_COUNT } from '../src/exam/questions'
import { gradeSubpart, isAnswered, describeAnswer } from '../src/exam/grading'
import { gradeAll, summarize, buildReport, validateReport, reportFilename, sanitizeName } from '../src/exam/report'
import type { Question, Subpart } from '../src/exam/types'
import type { Answers, AnswerValue, TfAnswer } from '../src/exam/grading'
import { LESSONS } from '../src/exam/types'
import { plainMath } from '../src/lib/mathx'

let failures = 0
function check(name: string, cond: boolean, extra = '') {
  if (!cond) { failures++; console.log('  ✗ ' + name + (extra ? ' → ' + extra : '')) }
  else console.log('  ✓ ' + name + (extra ? ' → ' + extra : ''))
}

/* ---- البنية ---- */
console.log('\n== 1) بنية الاختبار ==')
check('عدد الأسئلة الرئيسية = 20', QUESTION_COUNT === 20, String(QUESTION_COUNT))
check('عدد الفروع ضمن 70–85', SUBPART_COUNT >= 70 && SUBPART_COUNT <= 85, String(SUBPART_COUNT))
check('مجموع العلامات = 100', MARKS_TOTAL === 100, String(MARKS_TOTAL))
for (const q of QUESTIONS) {
  const m = q.subparts.reduce((s, x) => s + x.marks, 0)
  if (m < 4 || m > 6) { failures++; console.log(`  ✗ ${q.id}: علامة السؤال ${m} خارج 4–6`) }
  if (q.subparts.length < 3) { failures++; console.log(`  ✗ ${q.id}: عدد الفروع ${q.subparts.length} < 3`) }
  for (const sp of q.subparts) {
    if (!sp.answerText || !sp.solution || !sp.rule || !sp.mistake || !sp.objective) {
      failures++; console.log(`  ✗ ${sp.id}: بيانات المعلّم ناقصة`)
    }
  }
}
check('كل سؤال بين 4 و6 علامات وكل فرع موثّق', failures === 0)

/* ---- تغطية الدروس ---- */
console.log('\n== 2) تغطية الدروس الثمانية ==')
for (const l of LESSONS) {
  const qs = QUESTIONS.filter((q) => q.lessons.includes(l.id))
  const subs = qs.reduce((s, q) => s + q.subparts.filter((sp) => q.lessons.includes(l.id)).length, 0)
  check(`${l.title} (${l.pages})`, qs.length >= 3, `${qs.length} أسئلة · ${subs} فروع`)
}
const integrated = QUESTIONS.filter((q) => q.lessons.length >= 2)
check('أسئلة تركيبية ≥ 4', integrated.length >= 4, `${integrated.length}: ${integrated.map((q) => q.id).join(',')}`)

/* ---- ترتيب غير ترتيب الكتاب ---- */
console.log('\n== 3) ترتيب الأسئلة ليس ترتيب الدروس ==')
const firstLessonSeq = QUESTIONS.map((q) => q.lessons[0])
let monotonic = true
const seen = new Set<string>()
for (const id of firstLessonSeq) { if (seen.has(id)) { monotonic = false; break } seen.add(id) }
// الفحص الحقيقي: ألا تكون الدروس متتالية كتلًا
let blocks = 1
for (let i = 1; i < firstLessonSeq.length; i++) if (firstLessonSeq[i] !== firstLessonSeq[i - 1]) blocks++
check('الدروس غير مجمّعة في كتل متتالية', blocks >= 12, `عدد التحولات = ${blocks}`)
check('تسلسل الدروس الأولى', true, firstLessonSeq.join(' → '))
void monotonic

/* ---- الإجابات الصحيحة الكاملة ---- */
console.log('\n== 4) التصحيح الآلي: كل الإجابات الصحيحة ==')
function correctAnswer(sp: Subpart): AnswerValue {
  switch (sp.kind) {
    case 'numeric': case 'protractor': case 'drawangle':
      return String(Array.isArray(sp.correct) ? sp.correct[0] : sp.correct)
    case 'text': case 'grid':
      return String(Array.isArray(sp.correct) ? sp.correct[0] : sp.correct)
    case 'explain':
      return (sp.rubricAll ?? []).map((g) => g[0]).join(' و ')
    case 'choice':
      return String(sp.correct)
    case 'multiselect':
      return (sp.correct as string[]).slice()
    case 'tf': {
      const t: TfAnswer = { value: sp.correct === true ? 'true' : 'false', correction: '' }
      if (sp.requireCorrection) t.correction = (sp.correction ?? []).map((g) => g.join(' و ')).join(' و ')
      return t
    }
    case 'matching':
      return Object.fromEntries((sp.rows ?? []).map((r) => [r.id, r.answer]))
    case 'ordering':
      return (sp.items ?? []).map((i) => i.id)
    default: return ''
  }
}

const perfect: Answers = {}
for (const q of QUESTIONS) for (const sp of q.subparts) perfect[sp.id] = correctAnswer(sp)
const perfectRes = gradeAll(QUESTIONS, perfect)
const perfectSum = summarize(perfectRes)
check('مجموع الإجابات النموذجية = 100', Math.abs(perfectSum.total - 100) < 1e-9, String(perfectSum.total))
check('كل الأسئلة صحيحة بالكامل', perfectSum.full === 20, `full=${perfectSum.full} partial=${perfectSum.partial} wrong=${perfectSum.wrong}`)
check('النسبة = 100%', perfectSum.percentage === 100, String(perfectSum.percentage))
for (const r of perfectRes) {
  for (const s of r.subparts) {
    if (s.res.status !== 'correct') {
      failures++
      console.log(`  ✗ ${s.sp.id} (${s.sp.kind}) لم تُحتسب صحيحة: awarded=${s.res.awarded}/${s.res.max} status=${s.res.status} ans="${describeAnswer(s.sp, perfect[s.sp.id])}"`)
    }
  }
}

/* ---- إجابات فارغة ---- */
console.log('\n== 5) التصحيح الآلي: بلا إجابات ==')
const emptyRes = gradeAll(QUESTIONS, {})
const emptySum = summarize(emptyRes)
check('المجموع = 0', emptySum.total === 0, String(emptySum.total))
check('كل الفروع «لم يُجب»', emptySum.unansweredSubparts === SUBPART_COUNT, String(emptySum.unansweredSubparts))
check('isAnswered = false لكل فرع', QUESTIONS.every((q) => q.subparts.every((sp) => !isAnswered(sp, undefined))))

/* ---- إجابات جزئية ---- */
console.log('\n== 6) العلامات الجزئية والتعافي ==')
const partialAns: Answers = { ...perfect }
// مطابقة ناقصة
partialAns['q15a'] = { N: '(3,6)', M: '(3,6)', K: '(0,5)', T: '(5,0)' }
// ترتيب ناقص
partialAns['q13c'] = ['i15', 'i42', 'i130', 'i90', 'i175']
// اختيار متعدد فيه خيار خاطئ
partialAns['q4e'] = ['o1', 'o3', 'o4']
// تعليل ناقص
partialAns['q17b'] = 'الناتج 6245'
// صواب/خطأ صحيح بلا تصويب
partialAns['q1d'] = { value: 'false', correction: 'غير صحيح' }
// رقم خاطئ
partialAns['q6a'] = '856111'
const partRes = gradeAll(QUESTIONS, partialAns)
const partSum = summarize(partRes)
const get = (id: string) => partRes.flatMap((r) => r.subparts).find((s) => s.sp.id === id)!
check('مطابقة 3/4 ← علامة جزئية 1', get('q15a').res.awarded === 1, String(get('q15a').res.awarded))
check('ترتيب 3/5 ← علامة جزئية 1', get('q13c').res.awarded === 1, String(get('q13c').res.awarded))
check('اختيار متعدد مع خيار خاطئ ← خصم', get('q4e').res.awarded < 1, String(get('q4e').res.awarded))
check('تعليل بنصف المجموعات ← 1 من 2', get('q17b').res.awarded === 1, String(get('q17b').res.awarded))
check('صواب/خطأ صحيح وتصويب ناقص ← 0.5', get('q1d').res.awarded === 0.5, String(get('q1d').res.awarded))
check('صواب/خطأ بلا تصويب إطلاقاً ← لم يُجب', gradeSubpart(QUESTIONS.flatMap((q) => q.subparts).find((s) => s.id === 'q1d')!, { value: 'false', correction: '' }).status === 'unanswered')
check('حساب خاطئ ← 0', get('q6a').res.awarded === 0, String(get('q6a').res.awarded))
check('المجموع الجزئي بين 0 و100', partSum.total > 0 && partSum.total < 100, String(partSum.total))

/* ---- تقبّل الصيغ البديلة ---- */
console.log('\n== 7) تطبيع النصوص العربية والصيغ البديلة ==')
const alt: [string, string, AnswerValue][] = [
  ['q1a', '(6،7) بفواصل عربية', '(6،7)'],
  ['q1a', '6,7 بلا أقواس', '6,7'],
  ['q2a', '∠CAB', '∠CAB'],
  ['q3b', 'سبعمئة ألف', 'سبعمئة ألف'],
  ['q6b', '731,563 بفواصل', '731,563'],
  ['q8a', '(6,4)', '(6,4)'],
  ['q11c', '8000000', '8000000'],
  ['q13a', '126 (ضمن ±2)', '126'],
  ['q13a', '123 (ضمن ±2)', '123'],
  ['q16e', '5 cm', '5 cm'],
  ['q19d', '5000000', '5000000'],
]
for (const [id, label, val] of alt) {
  const sp = QUESTIONS.flatMap((q) => q.subparts).find((s) => s.id === id)!
  const r = gradeSubpart(sp, val)
  check(`${id}: ${label}`, r.status === 'correct', `${r.awarded}/${r.max}`)
}
const sp13 = QUESTIONS.flatMap((q) => q.subparts).find((s) => s.id === 'q13a')!
check('q13a: 129 خارج الهامش ← خطأ', gradeSubpart(sp13, '129').status === 'wrong')
const sp8 = QUESTIONS.flatMap((q) => q.subparts).find((s) => s.id === 'q4a')!
check('q4a: تعليل بالمعنى دون تطابق الصياغة', gradeSubpart(sp8, 'هذا الشكل معيّن لأنه متوازي أضلاع وفيه ضلعان متجاوران متساويان في الطول').status === 'correct')

/* ---- التقرير ---- */
console.log('\n== 8) تقرير TXT ==')
const meta = { studentName: 'سارة أحمد علي', startAt: new Date('2026-03-14T09:05:12'), submitAt: new Date('2026-03-14T10:47:39'), elapsedMs: 6147000 }
const report = buildReport(meta, perfectRes)
check('يبدأ بـ BOM لسلامة العربية في UTF-8', report.charCodeAt(0) === 0xfeff)
check('فواصل الأسطر CRLF', report.includes('\r\n'))
const missing = validateReport(report, meta, perfectRes)
check('التحقّق من اكتمال التقرير', missing.length === 0, missing.join('|') || 'لا شيء ناقص')
for (const needle of ['سارة أحمد علي', 'الوحدة الأولى', 'شبكة الإحداثيات', 'المعيّن', 'متوازي الأضلاع', 'قياس الزوايا',
  'تقريب الأعداد الطبيعية', 'جمع الأعداد الطبيعية وطرحها', 'التمثيلات البيانية بالخطوط', 'الأعداد الطبيعية',
  '09:05:12', '10:47:39', '01:42:27', 'الإجابة الصحيحة', 'الحلّ المفصّل', 'القاعدة/الخاصة', 'الهدف التعليمي', 'الخطأ الشائع',
  'المهندس سومر شاهين', '0930215022', 'wa.me/963930210522']) {
  check(`يحتوي: ${needle}`, report.includes(needle))
}
check('لا يحتوي أرقاماً هندية', !/[٠-٩]/.test(report), (report.match(/[٠-٩]/g) || []).join(''))
check('لا يحتوي رموز $ غير محوّلة', !report.includes('$'), String((report.match(/\$/g) || []).length))
check('لا يوجد ZIP/تشفير/كلمة سر تقرير', !/zip|encrypt|AES|كلمة سر التقرير/i.test(report))
check('لا توجد كلمة المرور في التقرير', !report.includes('somer173'))
check('طول التقرير معقول', report.length > 40000, `${report.length} حرفاً`)
check('اسم الملف', reportFilename('سارة أحمد علي') === 'Grade5_Math_Unit1_سارة_أحمد_علي_Results.txt', reportFilename('سارة أحمد علي'))
check('تنقية اسم الملف من الرموز', !/[^\p{L}\p{N}_-]/u.test(sanitizeName('  ../../etc/pass<>wd  ')), sanitizeName('  ../../etc/pass<>wd  '))
check('plainMath يحوّل الكسور والأسس والدرجات', plainMath('$\\frac{1}{2}$ و $5^{2}$ و $\\angle A = 90^\\circ$') === '(1)/(2) و 5\u00b2 و ∠ A = 90°', plainMath('$\\frac{1}{2}$ و $5^{2}$ و $\\angle A = 90^\\circ$'))

console.log('\n' + (failures === 0 ? '✅ كل الفحوص نجحت' : `❌ ${failures} فشل`))
process.exit(failures === 0 ? 0 : 1)
