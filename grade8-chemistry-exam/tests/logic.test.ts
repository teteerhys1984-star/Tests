/**
 * اختبارات منطق التصحيح ومفاتيح الإجابة لاختبار الكيمياء — الصف الثامن (الدرسان 1 و2).
 *
 * تتحقّق من:
 *   · بنية الاختبار: 15 سؤالاً، 47 جزءًا، 100 درجة.
 *   · سلامة مفاتيح الإجابة (خيار صحيح واحد لكل اختيار من متعدد، ترتيب صحيح، تصنيفات، خانات...).
 *   · التصحيح الكامل والجزئي والخاطئ وغير المجاب، وتطبيع المدخلات العربية/الكيميائية.
 *   · مطابقة النتيجة لنصوص سلّم التصحيح الأصلية (قيم مرجعية مأخوذة من النسخة الأصلية قبل الربط).
 *
 * التشغيل (من مجلد grade8-chemistry-exam):
 *   npx esbuild tests/logic.test.ts --bundle --platform=node --format=esm \
 *     --outfile=.tmp-test/logic.test.mjs --log-level=warning && node .tmp-test/logic.test.mjs
 */
import { QUESTIONS, EXAM_META, partMarksSum } from '../src/data/exam'
import type { Part, Question } from '../src/data/exam'
import { countUnanswered, gradeExam, gradePart, normalizeArabic, canonicalFormula } from '../src/lib/grading'
import type { AnswerMap } from '../src/lib/grading'

let failures = 0
let checks = 0
function check(name: string, cond: boolean, extra = '') {
  checks++
  if (!cond) { failures++; console.log('  ✗ ' + name + (extra ? ' → ' + extra : '')) }
  else console.log('  ✓ ' + name + (extra ? ' → ' + extra : ''))
}
const near = (a: number, b: number, eps = 0.001) => Math.abs(a - b) < eps

/* ---------------- بناء إجابات نموذجية لكل نوع جزء ---------------- */

const correctAnswer = (p: Part): unknown => {
  switch (p.type) {
    case 'mc':
    case 'lewis-select':
      if (p.type === 'lewis-select' && p.multi) return p.options.filter((o) => o.correct).map((o) => o.id)
      return p.options.find((o) => o.correct)?.id ?? p.options[0].id
    case 'multi':
      return p.options.filter((o) => o.correct).map((o) => o.id)
    case 'tf':
      return { judgment: p.answer, correction: p.answer ? '' : p.correctionGroups.map((g) => g[0]).join(' و ') }
    case 'fields':
      return Object.fromEntries(p.fields.map((f) => [f.id, f.answer]))
    case 'short':
      return p.groups.map((g) => g[0]).join(' و ')
    case 'order':
      return [...p.correct]
    case 'match':
      return Object.fromEntries(p.rows.map((r) => [r.id, r.answer]))
    case 'classification':
      return Object.fromEntries(p.items.map((r) => [r.id, r.answer]))
  }
}

const buildAll = (fn: (p: Part) => unknown): AnswerMap => {
  const out: AnswerMap = {}
  for (const q of QUESTIONS) for (const p of q.parts) out[p.id] = fn(p)
  return out
}

const part = (id: string): Part => {
  for (const q of QUESTIONS) for (const p of q.parts) if (p.id === id) return p
  throw new Error('part not found: ' + id)
}

/* ================================================================== */
console.log('\n== 1) بنية الاختبار ==')
const totalMarks = QUESTIONS.reduce((s, q) => s + partMarksSum(q), 0)
const totalParts = QUESTIONS.reduce((s, q) => s + q.parts.length, 0)
check('عدد الأسئلة 15', QUESTIONS.length === 15, String(QUESTIONS.length))
check('عدد الأجزاء 47', totalParts === 47, String(totalParts))
check('مجموع الدرجات 100', totalMarks === 100, String(totalMarks))
check('EXAM_META.targetSubparts = 47', EXAM_META.targetSubparts === 47)
check('EXAM_META.totalMarks = 100', EXAM_META.totalMarks === 100)
check('معرّف الاختبار = grade8-chemistry-exam', EXAM_META.examId === 'grade8-chemistry-exam', EXAM_META.examId)
check('كل جزء له درجة موجبة', QUESTIONS.every((q) => q.parts.every((p) => p.marks > 0)))
check('لا تكرار في معرّفات الأجزاء', new Set(QUESTIONS.flatMap((q) => q.parts.map((p) => p.id))).size === 47)
check('السؤال 15 وحده تركيبي مختلط الدرسين', QUESTIONS.filter((q) => q.source.mixed).map((q) => q.id).join(',') === 'q15')
check('عدد الأجزاء غير المجابة عند بدء الاختبار 47', countUnanswered({}) === 47)

console.log('\n== 2) سلامة مفاتيح الإجابة ==')
QUESTIONS.forEach((q: Question) => {
  q.parts.forEach((p) => {
    const label = `${q.id}/${p.id}`
    if (p.type === 'mc' || (p.type === 'lewis-select' && !p.multi)) {
      const correct = p.options.filter((o) => o.correct)
      check(`${label}: خيار صحيح واحد فقط`, correct.length === 1, String(correct.length))
    }
    if (p.type === 'multi') check(`${label}: خياران صحيحان على الأقل`, p.options.filter((o) => o.correct).length >= 2)
    if (p.type === 'tf') check(`${label}: مجموعات تصحيح معرّفة`, p.correctionGroups.length >= 1)
    if (p.type === 'fields') check(`${label}: لكل خانة إجابة غير فارغة`, p.fields.every((f) => f.answer.trim() !== ''))
    if (p.type === 'order') {
      const ids = p.items.map((i) => i.id)
      check(`${label}: الترتيب الصحيح تبديل كامل للعناصر`, ids.length === p.correct.length && p.correct.every((id) => ids.includes(id)))
    }
    if (p.type === 'match') {
      const choices = p.choices.map((c) => c.id)
      check(`${label}: كل ربط يشير إلى اختيار موجود`, p.rows.every((r) => choices.includes(r.answer)))
    }
    if (p.type === 'classification') check(`${label}: كل تصنيف ضمن الفئات`, p.items.every((r) => p.categories.includes(r.answer)))
    if (p.type === 'short') check(`${label}: مجموعات كلمات مفتاحية معرّفة`, p.groups.length >= 1 && p.groups.every((g) => g.length > 0))
  })
})

console.log('\n== 3) التصحيح: كامل / خاطئ / ناقص / بلا إجابة ==')
const allCorrect = buildAll(correctAnswer)
const full = gradeExam(allCorrect)
check('كل الإجابات الصحيحة = 100 من 100', full.totalAwarded === 100 && full.totalAvailable === 100, String(full.totalAwarded))
check('كل الإجابات الصحيحة: 47 جزءًا صحيحًا', full.correct === 47 && full.partial === 0 && full.incorrect === 0 && full.unanswered === 0)

const empty = gradeExam({})
check('لا إجابات = 0', empty.totalAwarded === 0 && empty.percentage === 0)
check('لا إجابات: 47 جزءًا غير مجاب', empty.unanswered === 47)

const wrongAll = buildAll((p) => {
  switch (p.type) {
    case 'mc':
    case 'lewis-select':
      if (p.type === 'lewis-select' && p.multi) return p.options.filter((o) => !o.correct).map((o) => o.id)
      return p.options.find((o) => !o.correct)?.id ?? p.options[0].id
    case 'multi': return p.options.filter((o) => !o.correct).map((o) => o.id)
    case 'tf': return { judgment: !p.answer, correction: 'لا أعرف' }
    case 'fields': return Object.fromEntries(p.fields.map((f) => [f.id, f.kind === 'number' ? '0' : 'zzz']))
    case 'short': return 'لا أعرف'
    case 'order': return [...p.correct].reverse()
    case 'match': { const ids = p.rows.map((r) => r.answer); return Object.fromEntries(p.rows.map((r, i) => [r.id, ids[(i + 1) % ids.length]])) }
    case 'classification': { const c = p.categories; return Object.fromEntries(p.items.map((r) => [r.id, c[(c.indexOf(r.answer) + 1) % c.length]])) }
  }
})
const wrongSummary = gradeExam(wrongAll)
check('إجابات خاطئة: 1.67 من 100 (قيمة مرجعية)', near(wrongSummary.totalAwarded, 1.67), String(wrongSummary.totalAwarded))
check('إجابات خاطئة: لا جزء صحيح', wrongSummary.correct === 0)

const partialAll = buildAll((p) => {
  switch (p.type) {
    case 'mc':
    case 'lewis-select': return correctAnswer(p)
    case 'multi': return p.options.filter((o, i) => o.correct || i === 0).map((o) => o.id)
    case 'tf': return { judgment: p.answer, correction: p.answer ? '' : (p.correctionGroups[0]?.[0] ?? '') }
    case 'fields': return Object.fromEntries(p.fields.map((f, i) => [f.id, i % 2 === 0 ? f.answer : (f.kind === 'number' ? '7' : 'xx')]))
    case 'short': return p.groups[0]?.[0] ?? ''
    case 'order': { const c = [...p.correct]; return c.length > 1 ? [c[0], ...c.slice(2), c[1]] : c }
    case 'match': return Object.fromEntries(p.rows.map((r, i) => [r.id, i % 2 === 0 ? r.answer : '__none__']))
    case 'classification': return Object.fromEntries(p.items.map((r, i) => [r.id, i % 2 === 0 ? r.answer : '__none__']))
  }
})
const partialSummary = gradeExam(partialAll)
check('إجابات جزئية: 59.54 من 100 (قيمة مرجعية)', near(partialSummary.totalAwarded, 59.54), String(partialSummary.totalAwarded))
check('إجابات جزئية: 36 جزءًا جزئيًا', partialSummary.partial === 36, String(partialSummary.partial))
check('إجابات جزئية: 11 جزءًا صحيحًا', partialSummary.correct === 11, String(partialSummary.correct))

console.log('\n== 4) التصحيح الجزئي لكل نوع ==')
const q1a = part('q1a')
check('خانات: 2 من 3 عند خطأ الإلكترونات', near(gradePart(q1a, { p: '11', n: '12', e: '11' }).awarded, 2))
check('خانات: 0 عند إجابة ناقصة (خانة فارغة)', gradePart(q1a, { p: '11', n: '12', e: '' }).status === 'unanswered')
check('خانات: الأرقام العربية مقبولة', near(gradePart(q1a, { p: '١١', n: '١٢', e: '١٠' }).awarded, 3))

const q1b = part('q1b')
check('اختيار من متعدد: إجابة صحيحة = الدرجة كاملة', near(gradePart(q1b, 'b').awarded, 1))
check('اختيار من متعدد: إجابة خاطئة = 0', gradePart(q1b, 'a').awarded === 0)

const q1c = part('q1c')
check('تعليل: عنصر واحد من اثنين = نصف الدرجة', near(gradePart(q1c, 'نفس العدد الذري').awarded, 1))
check('تعليل: لا عناصر = 0', gradePart(q1c, 'لا شيء').awarded === 0)

const q2a = part('q2a')
check('ترتيب: خطوتان صحيحتان = نصف الدرجة', near(gradePart(q2a, ['source', 'gold', 'observe', 'screen']).awarded, 1))
check('ترتيب: كامل = الدرجة كاملة', near(gradePart(q2a, ['source', 'gold', 'screen', 'observe']).awarded, 2))

const q2b = part('q2b')
const q2bAnswer = correctAnswer(q2b) as Record<string, string>
const q2bPartial = { ...q2bAnswer, [Object.keys(q2bAnswer)[0]]: '__none__' }
check('مطابقة: بند خاطئ من ثلاثة = ثلثا الدرجة', near(gradePart(q2b, q2bPartial).awarded, 2), String(gradePart(q2b, q2bPartial).awarded))

const q13a = part('q13a')
const q13aAnswer = correctAnswer(q13a) as Record<string, string>
const q13aPartial = { ...q13aAnswer, h2o: 'رابطة أيونية', o2: 'رابطة أيونية' }
check('تصنيف: مادتان صحيحتان من أربع = نصف الدرجة', near(gradePart(q13a, q13aPartial).awarded, 1))

const q15a = part('q15a')
check('اختيار متعدد: قرار واحد خاطئ من خمسة', near(gradePart(q15a, ['o2']).awarded, 1.6), String(gradePart(q15a, ['o2']).awarded))
check('اختيار متعدد: كل القرارات صحيحة = الدرجة كاملة', near(gradePart(q15a, ['o2', 'o3']).awarded, 2))

const q9a = part('q9a')
if (q9a.type === 'tf' && q9a.answer === false) {
  check('صواب/خطأ: الحكم فقط دون تصحيح = غير مجاب', gradePart(q9a, { judgment: false, correction: '' }).status === 'unanswered')
  check('صواب/خطأ: حكم صحيح + تصحيح كامل = الدرجة كاملة', near(gradePart(q9a, { judgment: false, correction: q9a.correctionGroups.map((g) => g[0]).join(' و ') }).awarded, q9a.marks))
}

const q12c = part('q12c')
check('صيغ: الصيغة البديلة +2 مقبولة', near(gradePart(q12c, { mg: '+2', o: '-2', ratio: '1 : 1' }).awarded, 2))
check('صيغ: النسبة العربية ١:١ مقبولة', near(gradePart(q12c, { mg: 'Mg²⁺', o: 'O²⁻', ratio: '١:١' }).awarded, 2))

console.log('\n== 5) تطبيع المدخلات ==')
check('تطبيع العربية: "الأيون" = "الايون"', normalizeArabic('الأيون') === normalizeArabic('الايون'))
check('تطبيع الصيغ: "Mg2+" = "mg2+"', canonicalFormula('Mg2+') === canonicalFormula('mg2+'))
check('تطبيع الصيغ: "2−" = "2-"', canonicalFormula('2−') === canonicalFormula('2-'))
check('تطبيع الصيغ: "Mg²⁺" يقبل الصيغة البديلة "Mg2+" في خانة q12c', near(gradePart(part('q12c'), { mg: 'Mg²⁺', o: 'O²⁻', ratio: '1:1' }).awarded, 2))
check('تطبيع الأرقام العربية', normalizeArabic('١٢٣') === '123')

console.log('\n== 6) الاستقرار مع ترتيب عرض مختلف ==')
const shuffledOrder = [...QUESTIONS.slice(6), ...QUESTIONS.slice(0, 6)]
const shuffledSummary = gradeExam(partialAll, shuffledOrder)
check('المجموع لا يتغير بتغيّر ترتيب الأسئلة', near(shuffledSummary.totalAwarded, partialSummary.totalAwarded), String(shuffledSummary.totalAwarded))
check('عدد الأجزاء لا يتغير', shuffledSummary.subparts === 47)

/* ================================================================== */
process.exitCode = failures === 0 ? 0 : 1
console.log(`\n${failures === 0 ? '✅' : '❌'} ${checks - failures}/${checks} فحصًا ناجحًا`)
if (failures > 0) console.log(`${failures} فحصًا فاشلًا`)
