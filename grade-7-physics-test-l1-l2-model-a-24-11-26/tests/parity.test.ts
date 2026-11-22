/**
 * اختبار تطابق المحتوى مع المصدر — مقارنة بنيوية بين كائنات المصدر الحقيقية
 * (تُحمَّل بـ esbuild من `grade-7-physics-test-Model-A-24-11-26/src/data/questions.ts`)
 * وبين ما في `src/data/questions.ts` و`src/data/answerKey.ts`.
 *
 * لا مقارنة نصّية على الملف الخام (فالشرطة المائلة في `$\\mathrm{N}$` تُهرَّب في الملف
 * وتفكّ عند التحميل)، بل مقارنة القيم المفكوكة حقلاً بحقل:
 *   · كل نصّ سؤال/فرع/خيار/معيار/تفسير/خطوة حل.
 *   · كل علامة، وكل إجابة صحيحة، وكل وحدة، وكل أنماط التصحيح.
 *   · الترتيب نفسه، والمعرّفات نفسها، ولا حقل زائد أو ناقص.
 *
 * إن غاب مجلد المصدر تُعلَّم الفحوص «متخطّاة» صراحةً (لا نجاح كاذب).
 *
 * التشغيل: npm test
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { questions } from "../src/data/questions";
import { answerKey } from "../src/data/answerKey";

let failures = 0;
let checks = 0;
function check(name: string, condition: boolean, extra = ""): void {
  checks += 1;
  if (!condition) {
    failures += 1;
    console.log(`  ✗ ${name}${extra ? ` → ${extra}` : ""}`);
  } else {
    console.log(`  ✓ ${name}${extra ? ` → ${extra}` : ""}`);
  }
}

const root = process.cwd();
const sourcePath = path.join(root, "..", "grade-7-physics-test-Model-A-24-11-26", "src", "data", "questions.ts");

console.log("\n— تطابق المحتوى مع المصدر (بنية مفكوكة) —");

if (!existsSync(sourcePath)) {
  console.log(`  ⚠ مجلد المصدر غير موجود في هذه النسخة (${sourcePath}) — الفحوص متخطّاة صراحةً.`);
  process.exit(0);
}

const tmp = path.join(root, ".tmp-parity");
rmSync(tmp, { recursive: true, force: true });
mkdirSync(tmp, { recursive: true });
const bundle = path.join(tmp, "source.cjs");
execFileSync(
  path.join(root, "node_modules", ".bin", "esbuild"),
  [sourcePath, "--bundle", "--platform=node", "--format=cjs", "--log-level=error", `--outfile=${bundle}`],
  { cwd: root, stdio: "inherit" },
);
const { QUESTIONS } = await import(pathToFileURL(bundle).href);
rmSync(tmp, { recursive: true, force: true });

const LESSONS = ["الحركة والسكون", "القوة والحركة"];
const lessonName = (value: unknown) => (value === 1 ? LESSONS[0] : value === 2 ? LESSONS[1] : `${LESSONS[0]} + ${LESSONS[1]}`);

check("المصدر يُصدّر 10 أسئلة", Array.isArray(QUESTIONS) && QUESTIONS.length === 10, String(QUESTIONS?.length));
check("عدد أسئلتنا = عدد أسئلة المصدر", questions.length === QUESTIONS.length, `${questions.length}/${QUESTIONS.length}`);
check(
  "معرّفات الأسئلة وترتيبها",
  questions.map((question) => question.id).join(",") === QUESTIONS.map((question: { id: number }) => `q${question.id}`).join(","),
);

/** ترتيب مفاتيح الكائنات قبل المقارنة — الترتيب في الملف المصدر عرضيّ لا دلاليّ. */
const canon = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(canon);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, item]) => item !== undefined)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, item]) => [key, canon(item)]),
    );
  }
  return value;
};

const diffs: string[] = [];
const compare = (label: string, mine: unknown, source: unknown) => {
  checks += 1;
  const left = JSON.stringify(canon(mine));
  const right = JSON.stringify(canon(source));
  if (left !== right) diffs.push(`${label}: ${String(left).slice(0, 60)} ≠ ${String(right).slice(0, 60)}`);
};

QUESTIONS.forEach((source: any, index: number) => {
  const mine = questions[index];
  const prefix = `q${source.id}`;
  compare(`${prefix}.title`, mine.title, source.title);
  compare(`${prefix}.lesson`, mine.lesson, lessonName(source.lesson));
  compare(`${prefix}.pages`, mine.pages, source.pages);
  compare(`${prefix}.skill`, mine.skill, source.skill);
  compare(`${prefix}.intro`, mine.intro, source.scenario);
  compare(`${prefix}.figure`, mine.figure, source.diagram);
  compare(`${prefix}.table`, mine.table, source.table);
  compare(`${prefix}.parts.length`, mine.parts.length, source.parts.length);

  source.parts.forEach((sourcePart: any, partIndex: number) => {
    const part = mine.parts[partIndex];
    compare(`${prefix}.part[${partIndex}].id`, part?.id, sourcePart.id);
    compare(`${prefix}.part[${partIndex}].label`, part?.label, sourcePart.prompt);
    compare(`${prefix}.part[${partIndex}].figure`, part?.figure, sourcePart.diagram);
    compare(`${prefix}.part[${partIndex}].inputs.length`, part?.inputs.length, sourcePart.inputs.length);

    sourcePart.inputs.forEach((sourceInput: any, inputIndex: number) => {
      const input = part?.inputs[inputIndex];
      const at = `${sourceInput.id}`;
      compare(`${at}.kind`, input?.kind, sourceInput.kind);
      compare(`${at}.prompt`, input?.prompt, sourceInput.prompt ?? "");

      if (sourceInput.kind === "choice") {
        compare(`${at}.options`, (input as any)?.options, sourceInput.options);
      }
      if (sourceInput.kind === "text") {
        compare(`${at}.rows`, (input as any)?.rows, sourceInput.rows);
        compare(`${at}.placeholder`, (input as any)?.placeholder, sourceInput.placeholder);
      }
      if (sourceInput.kind === "number") {
        compare(`${at}.unitOptions`, (input as any)?.unitOptions, sourceInput.unit ? [...sourceInput.unit.options] : null);
        compare(`${at}.requiresSteps`, (input as any)?.requiresSteps, Boolean(sourceInput.steps));
        compare(`${at}.placeholder`, (input as any)?.placeholder, sourceInput.placeholder);
      }
      if (sourceInput.kind === "tf") {
        compare(`${at}.statement`, (input as any)?.statement, sourceInput.statement);
        compare(`${at}.allowsCorrection`, (input as any)?.allowsCorrection, Boolean(sourceInput.correction));
      }
      if (sourceInput.kind === "matrix") {
        compare(`${at}.columns`, (input as any)?.columns, sourceInput.columns);
        compare(`${at}.rows`, (input as any)?.rows, sourceInput.rows.map((row: any) => ({ id: row.id, label: row.label })));
        compare(`${at}.marksPerRow`, (input as any)?.marksPerRow, sourceInput.marksPerRow);
      }

      /* ==== مفتاح الإجابة: الإجابات والعلامات والمعايير ==== */
      const rubric = answerKey[prefix].rubric[sourceInput.id] as any;
      if (sourceInput.kind === "choice") {
        compare(`${at}.answer`, rubric?.answer, sourceInput.answer);
        compare(`${at}.marks`, rubric?.marks, sourceInput.marks);
      }
      if (sourceInput.kind === "text") {
        compare(`${at}.marks`, rubric?.marks, sourceInput.marks);
        compare(`${at}.criteria`, rubric?.criteria, sourceInput.criteria);
        compare(`${at}.model`, rubric?.model, sourceInput.model);
      }
      if (sourceInput.kind === "number") {
        compare(`${at}.value`, rubric?.value, sourceInput.answer);
        compare(`${at}.marks`, rubric?.marks, sourceInput.marks);
        compare(`${at}.tolerance`, rubric?.tolerance, sourceInput.tolerance);
        compare(`${at}.unit`, rubric?.unit, sourceInput.unit ? { options: [...sourceInput.unit.options], answer: sourceInput.unit.answer, marks: sourceInput.unit.marks } : null);
        compare(`${at}.steps`, rubric?.steps, sourceInput.steps ? { marks: sourceInput.steps.marks, all: [...sourceInput.steps.all], label: sourceInput.steps.label, model: sourceInput.steps.model } : null);
        compare(`${at}.model`, rubric?.model, sourceInput.model);
      }
      if (sourceInput.kind === "tf") {
        compare(`${at}.verdict`, rubric?.verdict, sourceInput.answer);
        compare(`${at}.verdictMarks`, rubric?.verdictMarks, sourceInput.verdictMarks);
        compare(`${at}.correction`, rubric?.correction, sourceInput.correction);
      }
      if (sourceInput.kind === "matrix") {
        compare(`${at}.rubricRows`, rubric?.rows, sourceInput.rows.map((row: any) => ({ id: row.id, answer: row.answer })));
        compare(`${at}.rubricMarksPerRow`, rubric?.marksPerRow, sourceInput.marksPerRow);
      }
    });
  });

  compare(`${prefix}.explanation`, answerKey[prefix].explanation, source.explanation);
  compare(`${prefix}.solution`, answerKey[prefix].solution, source.solutionSteps);
});

check("لا فرق في أي حقل بين المصدر والتطبيق", diffs.length === 0, diffs.slice(0, 6).join(" | "));
console.log(`  · عدد المقارنات الحقلية: ${checks}`);

/* كل نصّ في المصدر موجود حرفياً في تطبيقنا، والعكس — ضمان عدم فقدان أي نصّ. */
const collect = (value: unknown, into: Set<string>): void => {
  if (typeof value === "string") {
    const text = value.replace(/\s+/g, " ").trim();
    if (text.length > 1) into.add(text);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item) => collect(item, into));
    return;
  }
  if (value && typeof value === "object") Object.values(value).forEach((item) => collect(item, into));
};

const sourceStrings = new Set<string>();
const mineStrings = new Set<string>();
QUESTIONS.forEach((question: any) => collect({
  title: question.title,
  pages: question.pages,
  skill: question.skill,
  scenario: question.scenario,
  table: question.table,
  explanation: question.explanation,
  solution: question.solutionSteps,
  parts: question.parts,
}, sourceStrings));
questions.forEach((question) => collect({
  title: question.title,
  pages: question.pages,
  skill: question.skill,
  intro: question.intro,
  table: question.table,
  parts: question.parts,
}, mineStrings));
Object.values(answerKey).forEach((entry) => collect({ explanation: entry.explanation, solution: entry.solution, rubric: entry.rubric }, mineStrings));

const lostFromQuestions = [...sourceStrings].filter((text) => !mineStrings.has(text));
check("لا نصّ مصدري مفقود من بنك الأسئلة", lostFromQuestions.length === 0, lostFromQuestions.slice(0, 4).join(" | "));
check("لا نصّ زائد في بنك الأسئلة", mineStrings.size >= sourceStrings.size, `${mineStrings.size} ≥ ${sourceStrings.size}`);

/* العرض لا يحوي إجابات: كل نموذج إجابة في المفتاح يجب ألا يظهر في ملف العرض. */
const displayJson = JSON.stringify(questions);
const leaked = Object.entries(answerKey).flatMap(([questionId, entry]) =>
  Object.entries(entry.rubric).flatMap(([inputId, rubric]) => {
    const model = "model" in rubric ? (rubric as { model: string }).model : "";
    return model && model.length > 20 && displayJson.includes(JSON.stringify(model)) ? [`${questionId}/${inputId}`] : [];
  }),
);
check("لا نصّ إجابة نموذجي مسرّب في ملف العرض", leaked.length === 0, leaked.slice(0, 5).join(", "));

console.log(`\n${failures === 0 ? "✅" : "❌"} التطابق: ${failures === 0 ? `كل الفحوص ناجحة (${checks} مقارنة)` : `${failures} فحصاً فاشلاً`}`);
if (failures) process.exit(1);
