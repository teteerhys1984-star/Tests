/**
 * Verification script for the Model B examination.
 * Run:  node scripts/verify.mjs   (bundles src/lib/grading.ts first)
 */
import { execSync } from "node:child_process";
import assert from "node:assert";

execSync(
  "npx esbuild scripts/entry.ts --bundle --format=esm --platform=node --outfile=scripts/.build/entry.mjs --log-level=error",
  { stdio: "inherit" },
);

const g = await import("./.build/entry.mjs");
const { QUESTIONS, LESSONS, PASSAGES, TOTAL_MARKS } = g;

const results = [];
function check(label, ok, extra = "") {
  results.push(`${ok ? "PASS" : "FAIL"}  ${label}${extra ? ` — ${extra}` : ""}`);
  if (!ok) process.exitCode = 1;
}

/* --- structure ------------------------------------------------- */
check("exactly 30 main questions", QUESTIONS.length === 30, `${QUESTIONS.length}`);

const perLesson = Object.fromEntries(
  LESSONS.map((l) => [l.id, QUESTIONS.filter((q) => q.lesson === l.id).length]),
);
check("10 questions per lesson", Object.values(perLesson).every((n) => n === 10), JSON.stringify(perLesson));

const marksPerLesson = Object.fromEntries(
  LESSONS.map((l) => [
    l.id,
    QUESTIONS.filter((q) => q.lesson === l.id).reduce((s, q) => s + q.parts.reduce((a, p) => a + p.marks, 0), 0),
  ]),
);
check("lesson marks 33 / 34 / 33", marksPerLesson[1] === 33 && marksPerLesson[2] === 34 && marksPerLesson[3] === 33, JSON.stringify(marksPerLesson));
check("total marks = 100", TOTAL_MARKS === 100, `${TOTAL_MARKS}`);
check("question numbers 1..30 in order", QUESTIONS.every((q, i) => q.n === i + 1));
check("exactly two reading passages", PASSAGES.length === 2, PASSAGES.map((p) => p.title).join(" · "));
check("passages are the official ones", PASSAGES[0].title === "Schools in the Past, Present and Future" && PASSAGES[1].title === "My Amazing Journey");
check("every question has topic + source + explanation", QUESTIONS.every((q) => q.topic && q.source && q.explanation));
check("no listening / vocabulary question", !QUESTIONS.some((q) => /listen|vocabulary/i.test(q.instruction)));

/* --- marking: a perfect script --------------------------------- */
const perfect = {};
for (const q of QUESTIONS) {
  for (const p of q.parts) {
    perfect[p.id] = p.kind === "choice" ? String(p.answer) : p.answers[0];
  }
}
const perfectReport = g.buildReport("Test Student", perfect, Date.now(), 3600);
check("perfect script scores 100", perfectReport.total === 100, `${perfectReport.total}/${perfectReport.maxTotal}`);
check("perfect script = 100%", perfectReport.percentage === 100, `${perfectReport.percentage}%`);
check(
  "perfect lesson scores 33/34/33",
  perfectReport.lessons.map((l) => l.earned).join(",") === "33,34,33",
  perfectReport.lessons.map((l) => `${l.earned}/${l.max}`).join(" · "),
);
check("perfect script: all parts correct", perfectReport.correctCount === perfectReport.questions.reduce((s, q) => s + q.parts.length, 0) && perfectReport.incorrectCount === 0, `${perfectReport.correctCount} correct / ${perfectReport.incorrectCount} incorrect`);

/* --- marking: an empty script ---------------------------------- */
const emptyReport = g.buildReport("Test Student", {}, Date.now(), 60);
check("empty script scores 0", emptyReport.total === 0, `${emptyReport.total}`);
check("empty script reports every part incorrect", emptyReport.incorrectCount === emptyReport.correctCount + emptyReport.incorrectCount && emptyReport.correctCount === 0);

/* --- marking: one wrong answer --------------------------------- */
const oneWrong = { ...perfect };
oneWrong["q2p1"] = "1"; // correct index is 0
const wrongReport = g.buildReport("Test Student", oneWrong, Date.now(), 60);
check("one wrong MCQ costs exactly its marks", wrongReport.total === 100 - 3, `${wrongReport.total}`);

/* --- normalisation --------------------------------------------- */
check("normaliser ignores case/punctuation/apostrophes", g.canonical("  Sean told me that Max didn't like scary movies. ") === "sean told me that max didnt like scary movies", g.canonical("  Sean told me that Max didn't like scary movies. "));
check("includes-mode accepts a full sentence", g.gradePart({ id: "x", kind: "longtext", answers: ["Max didn't like scary movies"], mode: "includes", marks: 3, prompt: "" }, "Sean told me (that) Max didn't like scary movies") === true);
check("includes-mode rejects an unrelated answer", g.gradePart({ id: "x", kind: "longtext", answers: ["Max didn't like scary movies"], mode: "includes", marks: 3, prompt: "" }, "Max likes funny movies") === false);
check("unanswered part is never marked", g.isPartAnswered(QUESTIONS[0].parts[0], "") === false);

/* --- report ---------------------------------------------------- */
const sampleText = g.reportToText(perfectReport);
check(
  "TXT report contains name, score and lesson rows",
  sampleText.includes("Test Student") &&
    sampleText.includes("100 / 100") &&
    sampleText.includes("LESSON 1") &&
    sampleText.includes("Explanation:"),
);
check(
  "TXT report file name includes the student name",
  g.reportFileName("Ahmad Al-Ali") === "Grade8-Unit1-ModelB-Ahmad-Al-Ali.txt",
  g.reportFileName("Ahmad Al-Ali"),
);
check("clock formatting", g.formatClock(3661) === "01:01:01", g.formatClock(3661));
check("every part carries a positive mark", QUESTIONS.flatMap((q) => q.parts).every((p) => p.marks > 0));
check("30 questions, all parts answered in key", Object.keys(perfect).length === QUESTIONS.flatMap((q) => q.parts).length, `${Object.keys(perfect).length} parts`);

console.log(results.join("\n"));
console.log(process.exitCode ? "\nSOME CHECKS FAILED" : "\nALL CHECKS PASSED");
