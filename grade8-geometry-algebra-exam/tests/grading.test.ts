/**
 * اختبارات التصحيح والتقرير:
 *  - الحالات الأربع (صحيحة/فارغة/خاطئة/مختلطة) + التطبيع والقيم المقبولة
 *  - حالات العلامات الجزئية (لا يوجد منطق جزئي في الأصل — يبقى العدّاد صفراً)
 *  - عزل التصحيح عن التعديلات اللغوية والبصرية
 *  - ثبات قواعد التصحيح كما في النسخة الأصلي (بما فيها القسمة على 100)
 */
import { EXAM_QUESTIONS, VERIFY_EXAM_INTEGRITY } from '../src/data/questions';
import { gradeExamSession } from '../src/utils/grading';
import { generateReportText, sanitizeFilename } from '../src/utils/reportGenerator';
import { createInitialSessionState } from '../src/utils/storage';
import { gradeLabel, plainText, latexToPlain } from '../src/utils/submit';
import { buildScenarioAnswers, makeState, SCENARIO_NAMES } from './scenarios';

let failures = 0;
function check(name: string, cond: boolean, extra = '') {
  if (!cond) {
    failures += 1;
    console.log('  ✗ ' + name + (extra ? ' → ' + extra : ''));
  } else {
    console.log('  ✓ ' + name + (extra ? ' → ' + extra : ''));
  }
}

console.log('\n== 1) بنية الاختبار ==');
check('15 سؤالاً رئيسياً', EXAM_QUESTIONS.length === 15, String(EXAM_QUESTIONS.length));
check('45 فرعاً (3 لكل سؤال)', EXAM_QUESTIONS.every(q => q.subparts.length === 3));
const subCount = EXAM_QUESTIONS.reduce((s, q) => s + q.subparts.length, 0);
check('مجموع الفروع = 45', subCount === 45, String(subCount));
const total = EXAM_QUESTIONS.reduce((s, q) => s + q.totalMarks, 0);
const subTotal = EXAM_QUESTIONS.reduce((s, q) => s + q.subparts.reduce((a, sp) => a + sp.marks, 0), 0);
check('مجموع علامات الأسئلة = مجموع علامات الفروع = 101 (كما في الأصل — الواجهة تعلن 100)', total === 101 && subTotal === 101, `${total}/${subTotal}`);
check('علامات كل سؤال = مجموع فروعه', EXAM_QUESTIONS.every(q => q.subparts.reduce((a, sp) => a + sp.marks, 0) === q.totalMarks));
check('ترتيب الأسئلة 1…15 محفوظ', EXAM_QUESTIONS.every((q, i) => q.questionNumber === i + 1 && q.id === `q${i + 1}`));
const alg = EXAM_QUESTIONS.filter(q => q.subject === 'ALGEBRA').reduce((s, q) => s + q.totalMarks, 0);
const geo = EXAM_QUESTIONS.filter(q => q.subject === 'GEOMETRY').reduce((s, q) => s + q.totalMarks, 0);
check('الجبر 46 والهندسة 55 (كما في الأصل)', alg === 46 && geo === 55, `${alg}/${geo}`);
const verify = VERIFY_EXAM_INTEGRITY();
check('VERIFY: 15/7/8 وtotalScore=101 وisValid=false (كما في الأصل — موثّق)', verify.totalQuestions === 15
  && verify.algebraQuestions === 7 && verify.geometryQuestions === 8 && verify.totalScore === 101 && verify.isValid === false,
  JSON.stringify(verify));

console.log('\n== 2) الحالات الأربع ==');
const full = gradeExamSession(makeState('allCorrect'));
check('الحالة الكاملة: 101/101', full.totalScore === 101, String(full.totalScore));
check('الحالة الكاملة: النسبة 101% (قسمة الأصل على 100 — موثّقة لا تُغيَّر)', full.percentage === 101, String(full.percentage));
check('الحالة الكاملة: 45 صحيحة وبقية العدّادات صفراً',
  full.counts.correct === 45 && full.counts.partial === 0 && full.counts.incorrect === 0 && full.counts.unanswered === 0,
  JSON.stringify(full.counts));
check('الحالة الكاملة: الجبر 46/46 والهندسة 55/55',
  full.algebra.score === 46 && full.algebra.totalPossible === 46 && full.geometry.score === 55 && full.geometry.totalPossible === 55);

const empty = gradeExamSession(makeState('allEmpty'));
check('الحالة الفارغة: 0 علامة و45 غير مجابة', empty.totalScore === 0 && empty.counts.unanswered === 45, JSON.stringify(empty.counts));
check('الحالة الفارغة: نص «(لم تتم الإجابة)» في كل فرع',
  empty.questionResults.every(q => q.subpartResults.every(s => s.studentAnswer === '(لم تتم الإجابة)')));

const wrong = gradeExamSession(makeState('allWrong'));
check('الحالة الخاطئة: 0 علامة و45 خاطئة', wrong.totalScore === 0 && wrong.counts.incorrect === 45, JSON.stringify(wrong.counts));
check('الحالة الخاطئة: لا شيء يُحسب كصحيح', wrong.counts.correct === 0 && wrong.counts.unanswered === 0);

const mixed = gradeExamSession(makeState('mixed'));
check('الحالة المختلطة: تضم الأربع حالات (صحيح/خاطئة/فارغ) معاً',
  mixed.counts.correct > 0 && mixed.counts.incorrect > 0 && mixed.counts.unanswered > 0,
  JSON.stringify(mixed.counts));
check('الحالة المختلطة: مجموع العدّادات = 45',
  mixed.counts.correct + mixed.counts.partial + mixed.counts.incorrect + mixed.counts.unanswered === 45);
check('الحالة المختلطة: علامات مكتسبة بين 0 و101', mixed.totalScore > 0 && mixed.totalScore < 101, String(mixed.totalScore));

console.log('\n== 3) حالات العلامات الجزئية ==');
check('لا يوجد منطق جزئي في التصحيح الأصلي: العدّاد يبقى صفراً في كل السيناريوهات',
  SCENARIO_NAMES.every(name => gradeExamSession(makeState(name)).counts.partial === 0));
check('معيار التصحيح الجزئي موثّقاً في البيانات دون تطبيق (كما في الأصل)',
  EXAM_QUESTIONS.every(q => q.subparts.every(sp => typeof sp.partialCreditCriteria === 'string' && sp.partialCreditCriteria.length > 0)));

console.log('\n== 4) التطبيع والقيم المقبولة ==');
const norm = gradeExamSession(makeState('normalization'));
check('الأرقام العربية والمسافات حول الإجابة تُقبل (45/45)', norm.totalScore === 101 && norm.counts.correct === 45,
  `${norm.totalScore}`);
const acc = gradeExamSession(makeState('acceptable'));
check('القيم المقبولة البديلة تُقبل (45/45)', acc.totalScore === 101 && acc.counts.correct === 45, `${acc.totalScore}`);

// حالة يدوية: مسافات زائدة وحروف كبيرة/صغيرة وإجابة بديلة واحدة
const manual = makeState('allEmpty');
manual.answers = { q1_q1_a: '  OPT_1  ', q3_q3_b: ' 36 ', q7_q7_c: '50° ' };
const manualReport = gradeExamSession(manual);
const q1a = manualReport.questionResults[0].subpartResults[0];
const q3b = manualReport.questionResults[2].subpartResults[1];
const q7c = manualReport.questionResults[6].subpartResults[2];
check('خيار بحروف كبيرة ومسافات يُطابَق بعد التطبيع', q1a.marksEarned === 2 && q1a.status === 'correct', q1a.status);
check('رقم بمسافة زائدة يُقبل', q3b.marksEarned === 2.5 && q3b.status === 'correct', q3b.status);
check('القيمة المقبولة «50°» تُقبل', q7c.marksEarned === 2 && q7c.status === 'correct', q7c.status);

console.log('\n== 5) عزل التعديلات اللغوية والبصرية عن التصحيح ==');
// تعديلات النصوص والرسوم لا تمسّ حقول التصحيح إطلاقاً (يتحقق preservation أيضاً)،
// وهنا: نفس الإجابة تُصحَّح بنفس العلامة قبل التعديل وبعده عبر السيناريوهات أعلاه.
const answers = buildScenarioAnswers('allCorrect');
check('مفتاح كل فرع واحد وبلا تداخل', new Set(Object.keys(answers)).size === 45);
check('كل مفتاح إجابة يطابق مفتاح الفرع في البيانات',
  EXAM_QUESTIONS.every(q => q.subparts.every(sp => Object.hasOwn(answers, `${q.id}_${sp.id}`))));

console.log('\n== 6) التقرير ==');
const reportText = generateReportText(mixed);
check('التقرير يحوي جميع الأسئلة الـ15', EXAM_QUESTIONS.every(q => reportText.includes(`■ السؤال ${q.questionNumber}`)));
check('التقرير يحوي قسميه [1] و[4]', reportText.includes('[1] معلومات الاختبار والطالب') && reportText.includes('[4] تدقيق تفصيلي'));
check('التقرير يحوي السطر «العلامة النهائية المستحقة : … / 100»',
  reportText.includes('العلامة النهائية المستحقة : 50.5 / 100'),
  reportText.split('\n').find(l => l.includes('العلامة النهائية')) ?? '');
check('التقرير يحوي اسم الطالب ومعرّف المحاولة', reportText.includes('طالب الأساس') && reportText.includes('ATT_BASELINE_0001'));
check('التقرير لا يحوي التقدير الوصفي (gradeLabel) المخصص للمعلّم فقط',
  !reportText.includes('التقدير') && !reportText.includes('يحتاج إلى دعم'));
check('اسم ملف التقرير مُنقّى', sanitizeFilename('طالب/ الاختبار: تجربة') === 'طالب_الاختبار_تجربة',
  sanitizeFilename('طالب/ الاختبار: تجربة'));

console.log('\n== 7) gradeLabel (للمعلّم فقط) ==');
check('الحدود مطابقة للمرجع',
  gradeLabel(0) === 'يحتاج إلى دعم' && gradeLabel(49.99) === 'يحتاج إلى دعم' && gradeLabel(50) === 'ضعيف'
  && gradeLabel(64.99) === 'ضعيف' && gradeLabel(65) === 'مقبول' && gradeLabel(74.99) === 'مقبول'
  && gradeLabel(75) === 'جيد' && gradeLabel(84.99) === 'جيد' && gradeLabel(85) === 'جيد جداً'
  && gradeLabel(94.99) === 'جيد جداً' && gradeLabel(95) === 'ممتاز' && gradeLabel(101) === 'ممتاز');
check('gradeLabel غير مستعمل في نص التقرير', !generateReportText(full).includes('التقدير'));

console.log('\n== 8) تحويل النصوص للإرسال ==');
check('LaTeX كسر يُحوَّل', latexToPlain('-\\frac{1}{12}') === '-(1)/(12)', latexToPlain('-\\frac{1}{12}'));
check('نص بـ $...$ يُحوَّل', plainText('الناتج $\\frac{4}{5}$') === 'الناتج (4)/(5)', plainText('الناتج $\\frac{4}{5}$'));
check('نص عربي بلا LaTeX يبقى كما هو', plainText('متوازي أضلاع') === 'متوازي أضلاع');
check('لا يبقى رمز $ في النص المحوَّل', !plainText('$A\'B\' = 5$ و $(AB) \\parallel (A\'B\')$').includes('$'));

console.log('\n== 9) معرّف المحاولة وحفظ الجلسة ==');
const ids = Array.from({ length: 300 }, () => createInitialSessionState().attemptId);
check('كل معرّف فريد', new Set(ids).size === ids.length);
check('بادئة ATT_ محفوظة (هوية الجلسة الأصلية)', ids.every(id => id.startsWith('ATT_')));
check('معرّف الجلسة الداخلي الأصلي محفوظ (استمرارية المخزن)', createInitialSessionState().examId === 'MATHVERSE_G8_ALG_GEO');

console.log('');
if (failures) {
  console.log(`❌ فشل ${failures} فحصًا في التصحيح`);
  process.exit(1);
}
console.log('✅ كل فحوص التصحيح ناجحة');
process.exit(0);
