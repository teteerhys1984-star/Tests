/**
 * مُستخرِج آلي لمحتوى النموذج A من مجلد المصدر.
 *
 * المصدر (كما رُفع إلى GitHub بعد فك ZIP):
 *   grade-7-physics-test-Model-A-24-11-26/src/data/questions.ts
 *
 * يُنتج ملفين:
 *   1. src/data/questions.ts — نصوص الأسئلة والخيارات والفروع والجداول والرسوم والسيناريوهات فقط
 *      (بلا أي إجابة أو معيار تصحيح أو تفسير).
 *   2. src/data/answerKey.ts — الإجابات الصحيحة ومعايير التصحيح الجزئي والعلامات
 *      والتفسيرات وخطوات الحل.
 *
 * لماذا سكربت؟ نقل ~970 سطراً يدوياً يعرّض نصوصاً علمية لخطر تحريف حرف أو رقم.
 * السكربت يقرأ كائنات المصدر الحقيقية بعد تحويلها بـ esbuild، فيمتنع أي نقل يدوي.
 *
 * التشغيل من جذر المستودع:
 *   node grade-7-physics-test-l1-l2-model-a-24-11-26/scripts/extract-source.mjs
 */

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const repo = path.resolve(root, "..");
const SOURCE_DIR = path.join(repo, "grade-7-physics-test-Model-A-24-11-26");
const SOURCE_QUESTIONS = path.join(SOURCE_DIR, "src", "data", "questions.ts");

if (!existsSync(SOURCE_QUESTIONS)) {
  console.error(`✗ لم يُعثر على ملف المصدر: ${SOURCE_QUESTIONS}`);
  process.exit(1);
}

/* ------------------------------------------------------------------ */
/* أدوات مساعدة                                                        */
/* ------------------------------------------------------------------ */

/** تسميات الدروس: درسان فقط، والسؤال التركيبي يحمل التسميتين معاً. */
const LESSON_L1 = "الحركة والسكون";
const LESSON_L2 = "القوة والحركة";
const lessonName = (value) => (value === 1 ? LESSON_L1 : value === 2 ? LESSON_L2 : `${LESSON_L1} + ${LESSON_L2}`);

const IDENTIFIER = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

/** كاتب أدبيات TypeScript: مفاتيح معرّفات بلا علامات تنصيص، والنصوص مهرَّبة بأمان. */
function literal(value, indent = "") {
  if (value === null) return "null";
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (typeof value === "string") return JSON.stringify(value);
  const pad = `${indent}  `;
  if (Array.isArray(value)) {
    if (value.length === 0) return "[]";
    return `[\n${value.map((item) => `${pad}${literal(item, pad)}`).join(",\n")},\n${indent}]`;
  }
  const entries = Object.entries(value).filter(([, item]) => item !== undefined);
  if (entries.length === 0) return "{}";
  const body = entries
    .map(([key, item]) => `${pad}${IDENTIFIER.test(key) ? key : JSON.stringify(key)}: ${literal(item, pad)}`)
    .join(",\n");
  return `{\n${body},\n${indent}}`;
}

function assertKeys(object, allowed, where) {
  for (const key of Object.keys(object)) {
    if (!allowed.has(key)) throw new Error(`حقل غير متوقع في المصدر: ${where}.${key}`);
  }
}

function requireValue(value, where) {
  if (value === undefined || value === null) throw new Error(`قيمة مفقودة في المصدر: ${where}`);
  return value;
}

/* ------------------------------------------------------------------ */
/* 1) تحميل كائنات المصدر فعلياً                                       */
/* ------------------------------------------------------------------ */

const tmpDir = path.join(root, ".tmp-extract");
rmSync(tmpDir, { recursive: true, force: true });
mkdirSync(tmpDir, { recursive: true });
const bundle = path.join(tmpDir, "source-questions.cjs");
/* esbuild من تبعيات هذا التطبيق نفسه (لا من جذر المستودع، فالجذر بلا package.json). */
const esbuildBin = path.join(root, "node_modules", ".bin", "esbuild");
if (!existsSync(esbuildBin)) {
  console.error("✗ esbuild غير مثبّت — شغّل `npm install` داخل مجلد التطبيق أولاً.");
  process.exit(1);
}
execFileSync(
  esbuildBin,
  [SOURCE_QUESTIONS, "--bundle", "--platform=node", "--format=cjs", "--log-level=error", `--outfile=${bundle}`],
  { cwd: root, stdio: "inherit" },
);
const { QUESTIONS } = await import(`file://${bundle}`);
if (!Array.isArray(QUESTIONS)) throw new Error("QUESTIONS غير مُصدَّرة كمصفوفة");

/* ------------------------------------------------------------------ */
/* 2) خريطة الحقول: العرض للأسئلة، والتصحيح للمفتاح                     */
/* ------------------------------------------------------------------ */

const QUESTION_KEYS = new Set([
  "id", "title", "lesson", "pages", "skill", "scenario", "diagram", "table", "explanation", "solutionSteps", "parts",
]);
const PART_KEYS = new Set(["id", "prompt", "diagram", "inputs"]);

const INPUT_KEYS = {
  choice: new Set(["kind", "id", "prompt", "marks", "answer", "options"]),
  text: new Set(["kind", "id", "prompt", "marks", "criteria", "model", "placeholder", "rows"]),
  number: new Set(["kind", "id", "prompt", "marks", "answer", "tolerance", "unit", "steps", "model", "placeholder"]),
  tf: new Set(["kind", "id", "prompt", "statement", "answer", "verdictMarks", "correction"]),
  matrix: new Set(["kind", "id", "prompt", "columns", "rows", "marksPerRow"]),
};

const OPTION_KEYS = new Set(["id", "label", "diagram"]);
const COLUMN_KEYS = new Set(["id", "label"]);
const MATRIX_ROW_KEYS = new Set(["id", "label", "answer"]);
const UNIT_KEYS = new Set(["options", "answer", "marks"]);
const STEPS_KEYS = new Set(["marks", "all", "label", "model"]);
const CRITERION_KEYS = new Set(["label", "marks", "any", "all", "none"]);
const CORRECTION_KEYS = new Set(["marks", "criteria", "model"]);

/** نصّ العرض (بلا إجابات) لحقل إدخال واحد. */
function displayInput(input, where) {
  assertKeys(input, INPUT_KEYS[input.kind] ?? new Set(), where);
  const base = { id: requireValue(input.id, `${where}.id`), prompt: input.prompt ?? "" };
  switch (input.kind) {
    case "choice":
      return {
        ...base,
        kind: "choice",
        marks: requireValue(input.marks, `${where}.marks`),
        options: requireValue(input.options, `${where}.options`).map((option, index) => {
          assertKeys(option, OPTION_KEYS, `${where}.options[${index}]`);
          return { id: option.id, label: option.label, diagram: option.diagram };
        }),
      };
    case "text":
      return {
        ...base,
        kind: "text",
        marks: requireValue(input.marks, `${where}.marks`),
        rows: input.rows,
        placeholder: input.placeholder,
      };
    case "number":
      return {
        ...base,
        kind: "number",
        marks: requireValue(input.marks, `${where}.marks`),
        // خيارات الوحدة ظاهرة للطالب؛ الإجابة الصحيحة للوحدة وعلامتها في المفتاح
        unitOptions: input.unit ? [...requireValue(input.unit.options, `${where}.unit.options`)] : null,
        requiresSteps: Boolean(input.steps),
        placeholder: input.placeholder,
      };
    case "tf":
      return {
        ...base,
        kind: "tf",
        statement: requireValue(input.statement, `${where}.statement`),
        allowsCorrection: Boolean(input.correction),
      };
    case "matrix":
      return {
        ...base,
        kind: "matrix",
        columns: requireValue(input.columns, `${where}.columns`).map((column, index) => {
          assertKeys(column, COLUMN_KEYS, `${where}.columns[${index}]`);
          return { id: column.id, label: column.label };
        }),
        rows: requireValue(input.rows, `${where}.rows`).map((row, index) => {
          assertKeys(row, MATRIX_ROW_KEYS, `${where}.rows[${index}]`);
          return { id: row.id, label: row.label };
        }),
        marksPerRow: requireValue(input.marksPerRow, `${where}.marksPerRow`),
      };
    default:
      throw new Error(`نوع حقل غير معروف: ${where} (${input.kind})`);
  }
}

/** معيار التصحيح (بلا نصّ العرض) لحقل إدخال واحد. */
function gradingInput(input, where) {
  switch (input.kind) {
    case "choice":
      return {
        kind: "choice",
        marks: input.marks,
        answer: requireValue(input.answer, `${where}.answer`),
      };
    case "text":
      return {
        kind: "text",
        marks: input.marks,
        criteria: requireValue(input.criteria, `${where}.criteria`).map((criterion, index) => {
          assertKeys(criterion, CRITERION_KEYS, `${where}.criteria[${index}]`);
          return { label: criterion.label, marks: criterion.marks, any: criterion.any, all: criterion.all, none: criterion.none };
        }),
        model: requireValue(input.model, `${where}.model`),
      };
    case "number":
      return {
        kind: "number",
        marks: input.marks,
        value: requireValue(input.answer, `${where}.answer`),
        tolerance: input.tolerance,
        unit: input.unit
          ? {
              options: [...input.unit.options],
              answer: requireValue(input.unit.answer, `${where}.unit.answer`),
              marks: requireValue(input.unit.marks, `${where}.unit.marks`),
            }
          : null,
        steps: input.steps
          ? (assertKeys(input.steps, STEPS_KEYS, `${where}.steps`),
            {
              marks: input.steps.marks,
              all: [...input.steps.all],
              label: input.steps.label,
              model: input.steps.model,
            })
          : null,
        model: requireValue(input.model, `${where}.model`),
      };
    case "tf":
      return {
        kind: "tf",
        verdict: requireValue(input.answer, `${where}.answer`),
        verdictMarks: requireValue(input.verdictMarks, `${where}.verdictMarks`),
        correction: input.correction
          ? (assertKeys(input.correction, CORRECTION_KEYS, `${where}.correction`),
            {
              marks: input.correction.marks,
              criteria: input.correction.criteria.map((criterion, index) => {
                assertKeys(criterion, CRITERION_KEYS, `${where}.correction.criteria[${index}]`);
                return { label: criterion.label, marks: criterion.marks, any: criterion.any, all: criterion.all, none: criterion.none };
              }),
              model: input.correction.model,
            })
          : null,
      };
    case "matrix":
      return {
        kind: "matrix",
        marksPerRow: input.marksPerRow,
        rows: input.rows.map((row) => ({ id: row.id, answer: requireValue(row.answer, `${where}.rows.${row.id}.answer`) })),
      };
    default:
      throw new Error(`نوع حقل غير معروف: ${where} (${input.kind})`);
  }
}

/* ------------------------------------------------------------------ */
/* 3) بناء الملفين                                                     */
/* ------------------------------------------------------------------ */

const displayQuestions = [];
const keyQuestions = [];

for (const question of QUESTIONS) {
  assertKeys(question, QUESTION_KEYS, `q${question.id}`);
  const questionId = `q${requireValue(question.id, "question.id")}`;
  const lesson = lessonName(question.lesson);

  displayQuestions.push({
    id: questionId,
    title: question.title,
    lesson,
    pages: question.pages,
    skill: question.skill,
    intro: question.scenario,
    figure: question.diagram,
    table: question.table,
    parts: question.parts.map((part) => {
      assertKeys(part, PART_KEYS, `${questionId}.part:${part.id}`);
      return {
        id: part.id,
        label: part.prompt,
        figure: part.diagram,
        inputs: part.inputs.map((input) => displayInput(input, `${questionId}/${part.id}/${input.id}`)),
      };
    }),
  });

  keyQuestions.push({
    id: questionId,
    explanation: question.explanation,
    solution: question.solutionSteps,
    rubric: Object.fromEntries(
      question.parts.flatMap((part) =>
        part.inputs.map((input) => [input.id, gradingInput(input, `${questionId}/${part.id}/${input.id}`)]),
      ),
    ),
  });
}

const questionsFile = `/**
 * بنك الأسئلة — النموذج A: نصوص الأسئلة والخيارات والفروع والجداول والرسوم والمراجع فقط، بلا أي إجابة.
 *
 * ⚠️ ملف مُولَّد آلياً بـ \`scripts/extract-source.mjs\` من المصدر الحقيقي:
 *    \`grade-7-physics-test-Model-A-24-11-26/src/data/questions.ts\`
 *    (المجلد المرفوع إلى GitHub بعد فك ملف ZIP). لا تُحرِّره يدوياً؛ أعد توليده بالسكربت
 *    \`node scripts/extract-source.mjs\` من جذر المستودع.
 *
 * النقل حرفي: لا إعادة صياغة، ولا حذف أو إضافة سؤال أو خيار أو فرع أو علامة.
 * الإجابات والعلامات ومعايير التصحيح والتفسيرات في \`src/data/answerKey.ts\`،
 * وتُحمَّل ديناميكياً بعد التسليم أو بعد دخول المعلّم فقط.
 */

import type { Question } from "../exam/types";
import { EXAM_LESSON_L1, EXAM_LESSON_L2 } from "../exam/types";

export type { Question };

/** تسمية السؤال التركيبي: الدرسان معاً في تسمية واحدة، ولا درس ثالث. */
export const INTEGRATED_LESSON = \`\${EXAM_LESSON_L1} + \${EXAM_LESSON_L2}\`;

export const questions: Question[] = ${literal(displayQuestions)};
`;

const answerFile = `/**
 * مفتاح إجابات النموذج A ومعايير تصحيحه.
 *
 * ⚠️ ملف مُولَّد آلياً بـ \`scripts/extract-source.mjs\` من أسئلة المصدر نفسها:
 *    كل إجابة صحيحة، وكل معيار تصحيح جزئي، وكل علامة، وكل تفسير، وكل خطوة حل
 *    منقولة حرفياً من \`grade-7-physics-test-Model-A-24-11-26/src/data/questions.ts\`.
 *
 * لا تُستورد هذه الوحدة إلا بعد التسليم أو بعد دخول المعلّم (import ديناميكي)،
 * فلا تصل الإجابات إلى حزمة صفحة الاختبار الأصلية.
 */

import type { AnswerKey } from "../lib/grading";
import { rubricMax } from "../lib/grading";

export type { AnswerKey };

export const answerKey: AnswerKey = ${literal(
  Object.fromEntries(keyQuestions.map((question) => [question.id, {
    explanation: question.explanation,
    solution: question.solution,
    rubric: question.rubric,
  }])),
)};

/** علامة كل سؤال — مشتقّة من المفتاح نفسه، لا مكتوبة يدوياً. */
export const QUESTION_MARKS: Record<string, number> = Object.fromEntries(
  Object.entries(answerKey).map(([questionId, question]) => [
    questionId,
    Object.values(question.rubric).reduce((sum, entry) => sum + rubricMax(entry), 0),
  ]),
);
`;

mkdirSync(path.join(root, "src", "data"), { recursive: true });
writeFileSync(path.join(root, "src", "data", "questions.ts"), questionsFile, "utf8");
writeFileSync(path.join(root, "src", "data", "answerKey.ts"), answerFile, "utf8");
rmSync(tmpDir, { recursive: true, force: true });

console.log(`✓ src/data/questions.ts — ${displayQuestions.length} أسئلة`);
console.log(`✓ src/data/answerKey.ts — ${keyQuestions.reduce((n, q) => n + Object.keys(q.rubric).length, 0)} حقل إدخال`);
