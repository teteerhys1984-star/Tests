/**
 * مطابقة المحتوى مع النسخة الأصلية: تُقارن بيانات الأسئلة (نصوصها وإجاباتها
 * وعلاماتها وخياراتها) ونتائج التصحيح ونص التقرير مع لقطة مرجعية أُخذت من
 * المجلد الأصلي `Geometry & Algebra Test` قبل النقل وبأي تعديل.
 *
 * التعديلات اللغة والبصرية الموثّقة مسموحة حصراً ضمن documentedEdits:
 * أي فرق خارج تلك القائمة = فشل الاختبار (خصوصاً الإجابات والعلامات).
 */
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { EXAM_QUESTIONS, VERIFY_EXAM_INTEGRITY } from '../src/data/questions';
import { gradeExamSession } from '../src/utils/grading';
import { generateReportText } from '../src/utils/reportGenerator';
import { EXAM_ID } from '../src/config';
import { SCENARIO_NAMES, makeState } from './scenarios';

const fixture = JSON.parse(
  readFileSync('tests/fixtures/original-exam-reference.json', 'utf8'),
) as {
  sourceFolder: string;
  structure: Record<string, unknown>;
  originalQuestionsJson: string;
  grading: Record<string, unknown>;
  reportTextMixed: string;
  documentedEdits: Array<{ path: string; from: unknown; to: unknown }>;
};

let failures = 0;
function check(name: string, cond: boolean, extra = '') {
  if (!cond) {
    failures += 1;
    console.log('  ✗ ' + name + (extra ? ' → ' + extra : ''));
  } else {
    console.log('  ✓ ' + name + (extra ? ' → ' + extra : ''));
  }
}
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
const sha = (s: string) => createHash('sha256').update(s).digest('hex');

type Json = unknown;
function diffLeaves(a: Json, b: Json, path: string, out: Array<{ path: string; from: unknown; to: unknown }>) {
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) {
      out.push({ path, from: `len=${a.length}`, to: `len=${b.length}` });
      return;
    }
    a.forEach((x, i) => diffLeaves(x, b[i], `${path}[${i}]`, out));
    return;
  }
  if (a && b && typeof a === 'object' && typeof b === 'object') {
    const keys = [...new Set([...Object.keys(a), ...Object.keys(b)])].sort();
    for (const k of keys) {
      const av = (a as Record<string, Json>)[k];
      const bv = (b as Record<string, Json>)[k];
      if (k in (a as object) && !(k in (b as object))) out.push({ path: `${path}.${k}`, from: av, to: '<missing>' });
      else if (!(k in (a as object)) && k in (b as object)) out.push({ path: `${path}.${k}`, from: '<missing>', to: bv });
      else diffLeaves(av, bv, `${path}.${k}`, out);
    }
    return;
  }
  if (a !== b) out.push({ path, from: a, to: b });
}

console.log('\n== 1) المصدر والهوية ==');
check('اللقطة المرجعية مأخوذة من المجلد الأصلي', fixture.sourceFolder === 'Geometry & Algebra Test');
check('EXAM_ID الجديد مطابق للمطلوب', EXAM_ID === 'grade8-geometry-algebra-exam', EXAM_ID);
check('اسم المجلد الحالي = EXAM_ID', EXAM_ID === 'grade8-geometry-algebra-exam');

console.log('\n== 2) البنية والعلامات (كما هي في الأصل) ==');
const totalMarksFieldSum = EXAM_QUESTIONS.reduce((s, q) => s + q.totalMarks, 0);
const subpartMarksSum = EXAM_QUESTIONS.reduce((s, q) => s + q.subparts.reduce((a, sp) => a + sp.marks, 0), 0);
const algebraMarks = EXAM_QUESTIONS.filter(q => q.subject === 'ALGEBRA').reduce((s, q) => s + q.totalMarks, 0);
const geometryMarks = EXAM_QUESTIONS.filter(q => q.subject === 'GEOMETRY').reduce((s, q) => s + q.totalMarks, 0);
const verify = VERIFY_EXAM_INTEGRITY();
const structure = {
  questionCount: EXAM_QUESTIONS.length,
  subpartCount: EXAM_QUESTIONS.reduce((s, q) => s + q.subparts.length, 0),
  totalMarksFieldSum,
  subpartMarksSum,
  algebraMarks,
  geometryMarks,
  verify,
  ids: EXAM_QUESTIONS.map(q => q.id),
  perQuestion: EXAM_QUESTIONS.map(q => ({
    id: q.id,
    number: q.questionNumber,
    subject: q.subject,
    totalMarks: q.totalMarks,
    subparts: q.subparts.map(sp => ({
      id: sp.id,
      number: sp.subpartNumber,
      type: sp.type,
      marks: sp.marks,
      correctAnswer: sp.correctAnswer,
      acceptableAnswers: sp.acceptableAnswers ?? null,
      options: sp.options ? sp.options.map(o => ({ id: o.id, label: o.label })) : null,
    })),
  })),
};
check('البنية الكلية (15 سؤالاً / 45 فرعاً / 101 علامة) مطابقة للأصل', same(structure, fixture.structure),
  `qs=${structure.questionCount} subs=${structure.subpartCount} marks=${totalMarksFieldSum}`);
check('معرّفات الأسئلة بترتيبها محفوظة', same(structure.ids, (fixture.structure as any).ids));
check('الإجابات الصحيحة والعلامات والخيارات لكل فرع محفوظة', same(structure.perQuestion, (fixture.structure as any).perQuestion));
check(' VERIFY_EXAM_INTEGRITY مطابق للأصل (يشمل isValid=false المشهور)', same(verify, (fixture.structure as any).verify),
  JSON.stringify(verify));

console.log('\n== 3) فروق النصوص والرسوم: مطابقة القائمة الموثّقة حصراً ==');
const currentJson = JSON.stringify(EXAM_QUESTIONS);
const original = JSON.parse(fixture.originalQuestionsJson) as Json;
const byPath = (a: { path: string }, b: { path: string }) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0);
const diffs: Array<{ path: string; from: unknown; to: unknown }> = [];
diffLeaves(original, JSON.parse(currentJson), '$', diffs);
diffs.sort(byPath);
const expectedEdits = [...fixture.documentedEdits].sort(byPath);
check(
  `عدد الفروق = ${expectedEdits.length} (كلها تعديلات لغوية/بصرية موثقة)`,
  same(diffs, expectedEdits),
  diffs.map(d => d.path).join(' , '),
);
const forbidden = fixture.documentedEdits.filter(d =>
  /correctAnswer|acceptableAnswers|marks|totalMarks|options|subject|questionNumber|subpartNumber/.test(d.path),
);
check('لا تعديل موثّق يمسّ الإجابات أو العلامات أو الخيارات أو ترتيب الأسئلة', forbidden.length === 0,
  forbidden.map(f => f.path).join(' , '));

console.log('\n== 4) نتائج التصحيح لكل السيناريوهات مطابقة لخط الأساس ==');
for (const name of SCENARIO_NAMES) {
  const report = gradeExamSession(makeState(name));
  const expected = fixture.grading[name];
  check(`سيناريو ${name}`, same(report, expected),
    `total=${report.totalScore} counts=${JSON.stringify(report.counts)}`);
}

console.log('\n== 5) نص التقرير مطابق للأصل ==');
const mixedReport = gradeExamSession(makeState('mixed'));
const reportText = generateReportText(mixedReport);
check('نص تقرير الحالة المختلطة حرفيًا مطابق للأصل', reportText === fixture.reportTextMixed,
  `len=${reportText.length}`);

console.log('\n== 6) بصمة المحتوى ==');
check('بصمة بيانات الأسئلة الحالية معروضة للمقارنة', sha(currentJson).length === 64, sha(currentJson).slice(0, 16));

console.log('');
if (failures) {
  console.log(`❌ فشل ${failures} فحصًا في مطابقة النسخة الأصلية`);
  process.exit(1);
}
console.log('✅ كل فحوص المطابقة مع الأصل ناجحة');
process.exit(0);
