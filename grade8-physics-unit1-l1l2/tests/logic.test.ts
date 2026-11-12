/**
 * اختبارات تصحيح المنطق (src/exam/grading.ts + src/exam/report.ts + src/exam/questions.ts):
 * لكل فرع إجابة صحيحة كاملة، وإجابات خاطئة، وإجابة جزئية، وإجابة فارغة حيث ينطبق.
 * ولا يُقبل أي اتصال حقيقي بالشبكة: fetch مُعطَّل هنا.
 *
 * التشغيل: node tests/run-tests.mjs  (يبني الملفات الوسيطة بـ esbuild ثم يشغّلها)
 */
import { QUESTIONS, SUBPART_COUNT } from '../src/exam/questions'
import { EXAM_ID, SHEETS_TOKEN, SHEETS_URL } from '../src/config'
import { gradeSubpart, isAnswered, type AnswerValue, type TfAnswer } from '../src/exam/grading'
import {
  buildReport, gradeAll, gradeLabel, lessonTotals, reportFilename, STATUS_AR, summarize,
  validateReport, type AttemptMeta,
} from '../src/exam/report'
import { EXAM_TITLE, LESSONS, TOTAL_MARKS, type Subpart } from '../src/exam/types'

/* علامة يجب ألّا تظهر في أي ملف منشور: تُبنى من جزأين كي لا يبقى أثرها هنا. */
const FORBIDDEN_MARK = new RegExp('ar' + 'ena', 'i')

let failures = 0
let finished = false
process.exitCode = 1
process.on('exit', () => { if (!finished) console.log('\n❌ لم يكتمل تشغيل الاختبار') })
function check(name: string, cond: boolean, extra = '') {
  if (!cond) { failures++; console.log('  ✗ ' + name + (extra ? ' → ' + extra : '')) }
  else console.log('  ✓ ' + name + (extra ? ' → ' + extra : ''))
}

;(globalThis as any).fetch = () => {
  throw new Error('real fetch is disabled in tests')
}

/* ------------------------------------------------------------------ */
/* الإجابة النموذجية لكل نوع فرع                                       */
/* ------------------------------------------------------------------ */
function correctAnswer(sp: Subpart): AnswerValue {
  switch (sp.kind) {
    case 'numeric': case 'text':
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
    default:
      return ''
  }
}

const allSubparts = QUESTIONS.flatMap((q) => q.subparts.map((sp) => ({ q, sp })))

/* ================================================================== */
console.log('\n== أ) بنية البنك والأسئلة ==')
/* ================================================================== */
check('10 أسئلة رئيسية', QUESTIONS.length === 10, String(QUESTIONS.length))
check('49 فرعاً مُقوّماً', SUBPART_COUNT === 49, String(SUBPART_COUNT))
check('مجموع العلامات = 100', QUESTIONS.reduce((s, q) => s + q.subparts.reduce((a, sp) => a + sp.marks, 0), 0) === TOTAL_MARKS)
check('لكل سؤال 10 علامات بالضبط', QUESTIONS.every((q) => q.subparts.reduce((a, sp) => a + sp.marks, 0) === 10))
check('لكل فرع علامة موجبة', allSubparts.every(({ sp }) => sp.marks > 0))
check('معرّفات الفروع فريدة', new Set(allSubparts.map(({ sp }) => sp.id)).size === SUBPART_COUNT)
check('معرّفات الأسئلة فريدة', new Set(QUESTIONS.map((q) => q.id)).size === QUESTIONS.length)
check('كل سؤال ينتمي إلى الدرسين المحدّدين فقط', QUESTIONS.every((q) => q.lessons.length > 0
  && q.lessons.every((id) => LESSONS.some((l) => l.id === id))))
check('مرجع كل سؤال يذكر الدرس الأول أو الثاني', QUESTIONS.every((q) => /الدرس (الأول|الثاني)/.test(q.source)),
  QUESTIONS.map((q) => q.source).join(' | '))
check('لا إشارة إلى الوحدة الثانية أو أسئلة الوحدة ص 71–72 في مصادر البنك',
  QUESTIONS.every((q) => !/الوحدة الثانية|71|72/.test(q.source)))
check('لا محتوى من دروس ثالثة (الكهرباء/التيار/الكهرباء الساكنة)',
  !/كهربا|التيار|الشحنة|كولوم|فرق الكمون/.test(JSON.stringify(QUESTIONS.map((q) => [q.title, q.intro, ...q.subparts.map((s) => s.prompt)]))))
check('لكل فرع: نص المطلوب وإجابة صحيحة وحل وقاعدة وخطأ شائع وهدف',
  allSubparts.every(({ sp }) => sp.prompt.length > 8 && sp.answerText.length > 1 && sp.solution.length > 8
    && sp.rule.length > 3 && sp.mistake.length > 3 && sp.objective.length > 3))
check('أنواع الأسئلة متنوعة (≥5 أنواع)', new Set(allSubparts.map(({ sp }) => sp.kind)).size >= 5,
  [...new Set(allSubparts.map(({ sp }) => sp.kind))].join(', '))
check('يوجد اختيار من متعدد وصواب/خطأ وعددي وتعليل', ['choice', 'tf', 'numeric', 'explain'].every((k) =>
  allSubparts.some(({ sp }) => sp.kind === k)))
check('كل سؤال اختيار: 4 خيارات ومعرّفات فريدة', allSubparts.filter(({ sp }) => sp.kind === 'choice')
  .every(({ sp }) => (sp.options ?? []).length === 4 && new Set((sp.options ?? []).map((o) => o.id)).size === 4))
check('كل سؤال متعدد الاختيار: للإجابة الصحيحة أكثر من خيار', allSubparts.filter(({ sp }) => sp.kind === 'multiselect')
  .every(({ sp }) => Array.isArray(sp.correct) && (sp.correct as string[]).length >= 1
    && (sp.correct as string[]).every((id) => (sp.options ?? []).some((o) => o.id === id))))
check('كل سؤال مطابقة: خيارات الصفوف تحتوي الإجابة', allSubparts.filter(({ sp }) => sp.kind === 'matching')
  .every(({ sp }) => (sp.rows ?? []).every((r) => r.options.includes(r.answer) && r.options.length === 3)))
check('كل سؤال صواب/خطأ أو عددي بتصويب/تسامح معرّف',
  allSubparts.every(({ sp }) => sp.kind !== 'tf' || typeof sp.correct === 'boolean') &&
  allSubparts.every(({ sp }) => sp.kind !== 'numeric' || typeof sp.tolerance === 'number'))

/* ================================================================== */
console.log('\n== ب) التصحيح: إجابة صحيحة كاملة لكل فرع ==')
/* ================================================================== */
for (const { q, sp } of allSubparts) {
  const r = gradeSubpart(sp, correctAnswer(sp))
  check(`${q.id}/${sp.label} صحيحة كاملة`, r.status === 'correct' && Math.abs(r.awarded - sp.marks) < 1e-9,
    `${r.awarded}/${sp.marks}`)
}

/* ================================================================== */
console.log('\n== ج) التصحيح: إجابة فارغة => «لم يُجب» وصفر ==')
/* ================================================================== */
for (const { q, sp } of allSubparts) {
  const r = gradeSubpart(sp, undefined)
  check(`${q.id}/${sp.label} فارغة`, r.status === 'unanswered' && r.awarded === 0)
}
check('isAnswered: نص فارغ لا يُعدّ إجابة', !isAnswered(allSubparts[0].sp, '   '))
check('isAnswered: صواب/خطأ بتصويب قصير لا يُعدّ مكتملاً',
  !isAnswered(allSubparts.find(({ sp }) => sp.kind === 'tf' && sp.requireCorrection)!.sp,
    { value: 'false', correction: 'لا' } as TfAnswer))

/* ================================================================== */
console.log('\n== د) التصحيح: إجابات خاطئة ==')
/* ================================================================== */
const wrongCases: [string, AnswerValue][] = [
  ['q1a', ['a1']],
  ['q1b', '32'],
  ['q1c', '100'],
  ['q1d', { value: 'true', correction: 'وصف تام صحيح' }],
  ['q1e', 'e1'],
  ['q2a', 'a3'],
  ['q2b', 'b2'],
  ['q2c', { value: 'true', correction: 'نعم' }],
  ['q2d', ['s4', 's3', 's2', 's1']],
  ['q2e', 'لا أعرف'],
  ['q3a', 'a1'],
  ['q3b', { point: 'الرأس المقابل M', carrier: 'ضلع من أضلاع متوازي الأضلاع', sense: 'من M نحو O' }],
  ['q3c', 'c1'],
  ['q3d', 'لا أعرف'],
  ['q3e', { value: 'true', correction: 'صحيحة' }],
  ['q4a', '20'],
  ['q4b', '7'],
  ['q4c', 'c1'],
  ['q4d', '140'],
  ['q4e', 'e3'],
  ['q5a', '3'],
  ['q5b', { value: 'true', correction: 'صحيح' }],
  ['q5c', '21'],
  ['q5d', '3'],
  ['q6a', 'a1'],
  ['q6b', 'b1'],
  ['q6c', 'c1'],
  ['q6d', '9.7'],
  ['q6e', 'لا أعرف'],
  ['q7a', 'a1'],
  ['q7b', 'b1'],
  ['q7c', { value: 'true', correction: 'نعم' }],
  ['q7d', 'لا أعرف'],
  ['q7e', ['m5', 'm4', 'm3', 'm2', 'm1']],
  ['q8a', 'a1'],
  ['q8b', '10'],
  ['q8c', '30'],
  ['q8d', 'd2'],
  ['q8e', 'e1'],
  ['q9a', 'a1'],
  ['q9b', '500'],
  ['q9c', 'c1'],
  ['q9d', '60'],
  ['q9e', ['e1', 'e4']],
  ['q10a', '28'],
  ['q10b', '10'],
  ['q10c', '5'],
  ['q10d', '90'],
  ['q10e', { m1: 'الشدة 4 N', m2: 'الشدة 70 N', m3: 'الموضع خارج القطعة', m4: 'الموضع في المنتصف' }],
]
for (const [id, ans] of wrongCases) {
  const sp = allSubparts.find((x) => x.sp.id === id)!.sp
  const r = gradeSubpart(sp, ans)
  check(`${id} إجابة خاطئة => صفر أو جزئية صغيرة`, r.awarded < sp.marks, `${r.awarded}/${sp.marks} · ${r.status}`)
}
check('كل إجابة خاطئة على سؤال اختيار/عددي/صواب-وخطأ أعطت صفراً',
  wrongCases.filter(([id]) => {
    const sp = allSubparts.find((x) => x.sp.id === id)!.sp
    return sp.kind === 'choice' || sp.kind === 'numeric' || (sp.kind === 'tf' && !sp.requireCorrection)
  }).every(([id, ans]) => gradeSubpart(allSubparts.find((x) => x.sp.id === id)!.sp, ans).awarded === 0))

/* ================================================================== */
console.log('\n== هـ) التصحيح: علامات جزئية ==')
/* ================================================================== */
{
  const sp = allSubparts.find((x) => x.sp.id === 'q1a')!.sp // multiselect 4 إجابات من 5، علامتها 2
  const three = gradeSubpart(sp, ['a1', 'a2', 'a3'])          // 3 صحيحة بلا خاطئة
  check('q1a: ثلاث إصابات من أربع => 1.5 من 2 و«جزئية»', three.awarded === 1.5 && three.status === 'partial', String(three.awarded))
  const withWrong = gradeSubpart(sp, ['a1', 'a2', 'a5'])      // 2 صحيحة − 1 خاطئة = صافية 1 => 0.5
  check('q1a: إصابتان مع خيار خاطئ => 0.5 من 2', withWrong.awarded === 0.5 && withWrong.status === 'partial', String(withWrong.awarded))
  check('q1a: خيار خاطئ وحده => صفر', gradeSubpart(sp, ['a5']).awarded === 0)
}
{
  const sp = allSubparts.find((x) => x.sp.id === 'q6e')!.sp // explain بثلاث مجموعات، 2 علامة
  const two = gradeSubpart(sp, 'تزداد المركبة الموازية وتنقص العمودية')
  check('q6e: تحقّق مجموعتان من ثلاث => 1.5 من 2', Math.abs(two.awarded - 1.5) < 0.26 && two.status === 'partial', String(two.awarded))
  const one = gradeSubpart(sp, 'تزداد فقط')
  check('q6e: تحقّق مجموعة واحدة => 0.5 من 2', Math.abs(one.awarded - 0.5) < 0.26 && one.status === 'partial', String(one.awarded))
}
{
  const sp = allSubparts.find((x) => x.sp.id === 'q1d')!.sp // tf + تصويب، 2 علامة
  const tfOnly = gradeSubpart(sp, { value: 'false', correction: 'لا أعرف' })
  check('q1d: اختيار صحيح بلا تصويب صحيح => 1 من 2', tfOnly.awarded === 1 && tfOnly.status === 'partial', String(tfOnly.awarded))
  const cOnly = gradeSubpart(sp, { value: 'true', correction: 'الوصف ناقص' })
  check('q1d: تصويب صحيح مع اختيار خاطئ => 1 من 2', cOnly.awarded === 1 && cOnly.status === 'partial', String(cOnly.awarded))
}
{
  const sp = allSubparts.find((x) => x.sp.id === 'q2d')!.sp // ordering 4 خطوات، 2 علامة
  const onePos = gradeSubpart(sp, ['s2', 's1', 's4', 's3'])
  check('q2d: موضع واحد صحيح => صفر', onePos.awarded === 0, String(onePos.awarded))
  const twoPos = gradeSubpart(sp, ['s1', 's2', 's4', 's3']) // موضعان صحيحان
  check('q2d: موضعان صحيحان من أربعة => 1 من 2', twoPos.awarded === 1 && twoPos.status === 'partial', String(twoPos.awarded))
}
{
  const sp = allSubparts.find((x) => x.sp.id === 'q7e')!.sp // ordering 5 خطوات، 2 علامة
  const threeOf5 = gradeSubpart(sp, ['m1', 'm2', 'm4', 'm3', 'm5'])
  check('q7e: ثلاث إصابات من خمس => 1 من 2', threeOf5.awarded === 1 && threeOf5.status === 'partial', String(threeOf5.awarded))
  const twoOf5 = gradeSubpart(sp, ['m1', 'm3', 'm2', 'm5', 'm4'])
  check('q7e: إصابتان من خمس => صفر', twoOf5.awarded === 0, String(twoOf5.awarded))
}
{
  const sp = allSubparts.find((x) => x.sp.id === 'q3b')!.sp // matching 3 صفوف، 2 علامة
  // المطابقة تقارن نص الخيار حرفياً بعد التطبيع، فالإجابة هنا من نص الخيارات نفسه
  const rows = sp.rows ?? []
  const one = gradeSubpart(sp, { point: rows[0].answer, carrier: rows[1].options[1], sense: rows[2].options[1] })
  check('q3b: إصابة واحدة من ثلاث => أقل من العلامة الكاملة و«جزئية»',
    one.awarded > 0 && one.awarded < sp.marks && one.status === 'partial', String(one.awarded))
  const two3 = gradeSubpart(sp, { point: rows[0].answer, carrier: rows[1].answer, sense: rows[2].options[1] })
  check('q3b: إصابتان من ثلاث => 1.5 من 2 (توزيع نسبي)', two3.awarded === 1.5 && two3.status === 'partial', String(two3.awarded))
  check('q3b: إصابة واحدة من ثلاث => 0.5 من 2', one.awarded === 0.5, String(one.awarded))
  check('q3b: صفر إصابات => صفر', gradeSubpart(sp, { point: rows[0].options[1], carrier: rows[1].options[1], sense: rows[2].options[1] }).awarded === 0)
}
{
  const sp = allSubparts.find((x) => x.sp.id === 'q9e')!.sp // multiselect 3 من 5، 2 علامة
  const one = gradeSubpart(sp, ['e1'])
  check('q9e: إصابة واحدة من ثلاث => 0.5 من 1', one.awarded === 0.5 && one.status === 'partial', String(one.awarded))
  const twoWrong = gradeSubpart(sp, ['e1', 'e2', 'e5'])
  check('q9e: إصابتان مع خيار خاطئ => 0.5 من 1', twoWrong.awarded === 0.5, String(twoWrong.awarded))
}

/* ================================================================== */
console.log('\n== و) قبول صيغ الإجابة العددية ==')
/* ================================================================== */
{
  const sp = allSubparts.find((x) => x.sp.id === 'q1b')!.sp
  check('36 مقبولة', gradeSubpart(sp, '36').status === 'correct')
  check('«36 N» مقبولة', gradeSubpart(sp, '36 N').status === 'correct')
  check('أرقام هندية ٣٦ مقبولة', gradeSubpart(sp, '٣٦').status === 'correct')
  check('36.0 مقبولة', gradeSubpart(sp, '36.0').status === 'correct')
  check('35 خاطئة', gradeSubpart(sp, '35').status === 'wrong')
  const q6d = allSubparts.find((x) => x.sp.id === 'q6d')!.sp
  check('q6d: 2.6 مقبولة', gradeSubpart(q6d, '2.6').status === 'correct')
  check('q6d: 2.59 مقبولة ضمن التسامح', gradeSubpart(q6d, '2.59').status === 'correct')
  check('q6d: 9.7 خاطئة (استعمال cos)', gradeSubpart(q6d, '9.7').status === 'wrong')
  check('q9d: 180 مقبولة', gradeSubpart(allSubparts.find((x) => x.sp.id === 'q9d')!.sp, '180').status === 'correct')
  check('q9d: 185 خاطئة', gradeSubpart(allSubparts.find((x) => x.sp.id === 'q9d')!.sp, '185').status === 'wrong')
}

/* ================================================================== */
console.log('\n== ز) التصحيح المجمّع والتقرير ==')
/* ================================================================== */
const answersAll: Record<string, AnswerValue> = {}
for (const { sp } of allSubparts) answersAll[sp.id] = correctAnswer(sp)
const fullResults = gradeAll(QUESTIONS as any, answersAll)
const fullSum = summarize(fullResults)
check('الإجابات الصحيحة كلها => 100/100', fullSum.total === 100, String(fullSum.total))
check('النسبة 100% والتقدير «ممتاز»', fullSum.percentage === 100 && gradeLabel(100) === 'ممتاز')
check('كل الأسئلة «صحيحة بالكامل»', fullSum.full === QUESTIONS.length && fullSum.partial === 0 && fullSum.wrong === 0)
check('كل الفروع صحيحة', fullSum.correctSubparts === SUBPART_COUNT && fullSum.unansweredSubparts === 0)

const emptyResults = gradeAll(QUESTIONS as any, {})
const emptySum = summarize(emptyResults)
check('لا إجابات => 0/100 وكل الفروع «لم يُجب»',
  emptySum.total === 0 && emptySum.unansweredSubparts === SUBPART_COUNT && emptySum.percentage === 0)

const mixed: Record<string, AnswerValue> = { ...answersAll }
mixed['q1b'] = '32'
mixed['q1a'] = ['a1', 'a2', 'a3']
mixed['q6e'] = 'تزداد فقط'
delete mixed['q2a']
delete mixed['q9b']
const mixedResults = gradeAll(QUESTIONS as any, mixed)
const mixedSum = summarize(mixedResults)
check('خلط: الحالات الأربع ممثَّلة في الفروع',
  mixedSum.correctSubparts > 0 && mixedSum.partialSubparts > 0 && mixedSum.wrongSubparts > 0 && mixedSum.unansweredSubparts > 0,
  `${mixedSum.correctSubparts}/${mixedSum.partialSubparts}/${mixedSum.wrongSubparts}/${mixedSum.unansweredSubparts}`)
check('خلط: مجموع العلامات يساوي مجموع الفروع', Math.abs(mixedSum.total - mixedResults.reduce((s, r) => s + r.awarded, 0)) < 1e-9)
check('خلط: مجموع marks لكل الفروع = 100', mixedResults.reduce((s, r) => s + r.max, 0) === 100)

const meta: AttemptMeta = {
  studentName: 'سارة أحمد',
  startAt: new Date('2026-11-12T08:05:00.000Z'),
  submitAt: new Date('2026-11-12T08:42:31.000Z'),
  elapsedMs: 2251000,
}
const report = buildReport(meta, mixedResults)
check('التقرير يبدأ بعلامة BOM', report.charCodeAt(0) === 0xfeff)
check('التقرير كبير ويحتوي كل سؤال', report.length > 8000
  && mixedResults.every((r) => report.includes(`السؤال ${r.displayNumber} —`)))
check('التقرير يجتاز validateReport', validateReport(report, meta, mixedResults).length === 0,
  validateReport(report, meta, mixedResults).join(', '))
check('التقرير يذكر الدرسين فقط', report.includes('القوى المتلاقية') && report.includes('القوى المتوازية')
  && !report.includes('الكهرباء'))
check('التقرير يذكر الإجابة الصحيحة لكل فرع', allSubparts.every(({ sp }) => report.includes(`الفرع (${sp.label})`)))
check('التقرير لا يحتوي العلامة الممنوعة', !FORBIDDEN_MARK.test(report))
check('التقدير (gradeLabel) غير مطبوع في تقرير الطالب', !report.includes('التقدير                 :'))
check('التقرير يصرّح بإرسال النتيجة إلى المعلّم', report.includes('تُرسَل النتيجة') && report.includes('المعلّم'))
check('التقرير لا يدّعي عدم الإرسال', !/لا تُرسل أي|دون إرسال أي بيانات|لم تُرسل/.test(report))
check('اسم ملف التقرير صحيح', reportFilename('سارة أحمد') === 'Grade8_Physics_Unit1_L1L2_سارة_أحمد_Results.txt',
  reportFilename('سارة أحمد'))

const totals = lessonTotals(mixedResults)
check('توزيع الدروس: عنوانان فقط', totals.length === 2 && totals[0].title === 'القوى المتلاقية')
check('السؤال التركيبي يُحتسب في الدرسين (مجموع max>100)',
  totals.reduce((s, l) => s + l.max, 0) > 100,
  totals.map((t) => `${t.title}:${t.max}`).join(' / '))
check('كل درس له علامة > 0', totals.every((t) => t.max > 0 && t.awarded >= 0))

console.log('\n== ح) سلّم التقدير مطابق للمرجع ==')
const ladder: [number, string][] = [[100, 'ممتاز'], [95, 'ممتاز'], [94.9, 'جيد جداً'], [85, 'جيد جداً'],
  [84.9, 'جيد'], [75, 'جيد'], [74.9, 'مقبول'], [65, 'مقبول'], [64.9, 'ضعيف'], [50, 'ضعيف'], [49.9, 'يحتاج إلى دعم'], [0, 'يحتاج إلى دعم']]
for (const [p, label] of ladder) check(`gradeLabel(${p}) = ${label}`, gradeLabel(p) === label, gradeLabel(p))

console.log('\n== ط) الإعدادات والحمولة (فحص أولي) ==')
check('EXAM_ID الجديد', EXAM_ID === 'grade8-physics-unit1-l1l2', EXAM_ID)
check('SHEETS_URL مطابق للمرجع', SHEETS_URL === 'https://script.google.com/macros/s/AKfycbwqv4hE1AFy73L7MhyhFwXx0nl4QF5-Nme5jvP-ank-BY_LQr91xA8A_IiQqMuTdh8B/exec')
check('SHEETS_TOKEN مطابق للمرجع', SHEETS_TOKEN === '7U25pymFzsSqmt8ejzPOTPTFJmSvj9Rm')
check('عنوان الاختبار يذكر الصف الثامن', EXAM_TITLE.includes('الثامن'))
check('حالات الحالة العربية في STATUS_AR', Object.keys(STATUS_AR).length === 4)

finished = true
process.exitCode = failures === 0 ? 0 : 1
console.log(failures === 0 ? '\n✅ كل فحوص التصحيح ناجحة' : `\n❌ ${failures} فحصاً فاشلاً`)
