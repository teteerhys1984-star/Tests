/**
 * Records the baseline of the ORIGINAL examination: tests/fixtures/baseline.json.
 *
 * The baseline is recorded only from tests/fixtures/original-exam.html — the uploaded file,
 * byte for byte (minecraft-themed-english-assessment/index.html at commit 24550b9; the script
 * refuses any other bytes). It holds the question bank, the answer key, the marks, how the
 * original marks a fixed set of answer sheets, how it marks every answer each question's
 * controls can produce, the TXT reports it writes, and what its results screen shows after a
 * complete run through the interface.
 *
 * tests/grading.test.mjs then requires the published page to reproduce all of it, apart from
 * the documented differences listed in tests/differences.mjs.
 *
 *   npm run baseline        (re-records the same file; the result must not change)
 */
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  BASELINE_JSON, ORIGINAL_HTML, ORIGINAL_SHA256, answerSpace, gradeOne, gradeSheet, makeSheets, openExam, partsOf,
  resultsSnapshot, submitExamInUi, correctAnswer,
} from "./harness.mjs";

export const sha256 = (text) => createHash("sha256").update(text).digest("hex");

/** Functions that decide marks, the review texts and the TXT report. */
export const MARKING_FUNCTIONS = [
  "pad2", "esc", "formatDuration", "zoneIndexOf", "answerFor", "isAnswered", "answeredCount", "gradeQuestion",
  "studentAnswerText", "correctAnswerText", "originalQuestionText", "buildResults", "rankFor", "getReportFilename", "buildReportText",
];

/** One line per answer sheet: small enough to commit, precise enough to catch any change. */
export function describeSheet(page, sheet) {
  const r = gradeSheet(page, sheet);
  return {
    name: sheet.name,
    answersSha256: sha256(JSON.stringify(sheet.answers)),
    answered: r.answered.length,
    score: r.score,
    percentage: r.percentage,
    correct: r.correct,
    incorrect: r.incorrect,
    partial: r.partial,
    marks: r.graded.map((q) => q.marks).join(" "),
    lessons: r.lessonRows.map((row) => "L" + row.lesson + "=" + row.earned + "/" + row.possible).join(" "),
    best: r.best,
    weakest: r.weakest,
    rank: r.rank.title,
    file: r.file,
    reviewSha256: sha256(JSON.stringify(r.graded.map((q) => [q.status, q.givenText, q.correctText, q.originalText]))),
    reportSha256: sha256(r.report),
  };
}

/** Marks of every answer a question's controls can produce. */
export function describeExhaustive(page, q) {
  const space = answerSpace(q);
  const marks = space.map((answer) => gradeOne(page, q.id, answer));
  const histogram = {};
  for (const mark of marks) histogram[mark] = (histogram[mark] || 0) + 1;
  return { id: q.id, type: q.type, cases: space.length, histogram, sha256: sha256(JSON.stringify(space.map((answer, i) => [answer === undefined ? null : answer, marks[i]]))) };
}

/** rankFor() over every possible score, as ranges. */
export function describeRanks(page) {
  const ranges = [];
  for (let score = 0; score <= 100; score++) {
    const rank = page.json("rankFor(" + score + ")");
    const last = ranges.at(-1);
    if (last && last.title === rank.title) last.to = score;
    else ranges.push({ from: score, to: score, ...rank });
  }
  return ranges;
}

export function describeStructure(questions) {
  const byType = {};
  const byLesson = {};
  let parts = 0;
  let marks = 0;
  for (const q of questions) {
    const own = partsOf(q);
    parts += own.length;
    marks += own.reduce((sum, part) => sum + part.mark, 0);
    byType[q.type] = (byType[q.type] || 0) + 1;
    byLesson[q.lesson] = (byLesson[q.lesson] || 0) + 1;
  }
  return { questions: questions.length, parts, totalMarks: marks, byType, byLesson, order: questions.map((q) => q.id) };
}

export function describeAnswerKey(page, questions) {
  return questions.map((q) => ({
    id: q.id,
    lesson: q.lesson,
    type: q.type,
    correctText: page.run(`correctAnswerText(QUESTIONS.find(q => q.id === ${q.id}))`),
    parts: partsOf(q),
  }));
}

/** Sheets whose full TXT report is kept in the baseline for reading. */
export const FULL_REPORT_SHEETS = ["all-correct", "all-wrong", "complete-001"];
/** Sheet used for the recorded run through the interface (complete, with partial marks). */
export const UI_SHEET = "complete-007";

export async function recordUiRun(file, sheet) {
  const page = await openExam({ file });
  await submitExamInUi(page, { name: "Mahmoud Test", answers: sheet.answers, elapsedMs: 754000 });
  const snapshot = resultsSnapshot(page);
  const stored = JSON.parse(page.storage.getItem("mahmoud_minecraft_english_attempt_v1"));
  const report = await page.downloadText();
  const out = {
    sheet: sheet.name,
    results: snapshot,
    download: { count: page.downloads.length, name: page.downloads[0].name, sha256: sha256(report), startsWithBom: report.charCodeAt(0) === 0xfeff },
    storedAnswers: stored.answers,
    storedAttemptNumber: stored.attemptNumber,
    pageErrors: page.pageErrors.length,
    consoleLines: page.consoleLines.length,
  };
  /* Teacher key: the original password opens it and it lists every question. */
  page.click("#teacherOpenBtn");
  page.$("#teacherPassword").value = "somer173";
  page.click("#teacherUnlockBtn");
  out.teacherKeyCards = page.$$("#teacherKeyContent .key-card").length;
  out.teacherKeyAnswers = page.$$("#teacherKeyContent .key-answer").map((el) => el.textContent.trim());
  page.close();
  return out;
}

export async function recordBaseline(file = ORIGINAL_HTML) {
  const bytes = readFileSync(file);
  const html = bytes.toString("utf8");
  const page = await openExam({ file });
  const questions = page.questions;
  const sheets = makeSheets(questions);
  const baseline = {
    recordedFrom: {
      note: "The examination file exactly as it was uploaded, before any change.",
      commit: "24550b9e5b1b280b8a3f21b91fc9356b9127661f",
      path: "minecraft-themed-english-assessment/index.html",
      sha256: sha256(bytes),
      bytes: bytes.length,
      lines: html.split("\n").length - 1,
    },
    page: {
      title: page.document.title,
      lang: page.document.documentElement.getAttribute("lang"),
      dir: page.document.documentElement.getAttribute("dir"),
      inlineScripts: (html.match(/<script>/g) || []).length,
      inlineStyles: (html.match(/<style>/g) || []).length,
      externalResources: [...html.matchAll(/<(?:script|link)\b[^>]*\b(?:src|href)="([^"]+)"/g)].map((m) => m[1]),
      screens: page.$$(".screen").map((el) => el.id),
    },
    structure: describeStructure(questions),
    constants: {
      LESSONS: page.json("LESSONS"),
      LESSON_ORDER: page.json("LESSON_ORDER"),
      ZONES: page.json("ZONES"),
      TYPE_LABELS: page.json("TYPE_LABELS"),
      TOTAL_MARKS: page.json("TOTAL_MARKS"),
      storageKeys: [page.run("ATTEMPT_KEY"), page.run("ATTEMPT_NO_KEY"), page.run("SOUND_KEY")],
    },
    questions,
    answerKey: describeAnswerKey(page, questions),
    ranks: describeRanks(page),
    markingCodeSha256: Object.fromEntries(MARKING_FUNCTIONS.map((name) => [name, sha256(page.run(name + ".toString()"))])),
    exhaustive: questions.map((q) => describeExhaustive(page, q)),
    sheets: sheets.map((sheet) => describeSheet(page, sheet)),
    reports: Object.fromEntries(FULL_REPORT_SHEETS.map((name) => [name, gradeSheet(page, sheets.find((sheet) => sheet.name === name)).report])),
    uiRun: await recordUiRun(file, sheets.find((sheet) => sheet.name === UI_SHEET)),
  };
  page.close();
  return baseline;
}

export function serializeBaseline(baseline) {
  /* One question, one answer sheet and one exhaustive record per line keeps the file readable and its diffs small. */
  const lines = (items) => "[\n" + items.map((item) => "    " + JSON.stringify(item)).join(",\n") + "\n  ]";
  const parts = [];
  for (const [key, value] of Object.entries(baseline)) {
    const text = ["questions", "answerKey", "exhaustive", "sheets", "ranks"].includes(key) ? lines(value) : JSON.stringify(value, null, 2).replace(/\n/g, "\n  ");
    parts.push("  " + JSON.stringify(key) + ": " + text);
  }
  return "{\n" + parts.join(",\n") + "\n}\n";
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const actual = sha256(readFileSync(ORIGINAL_HTML));
  if (actual !== ORIGINAL_SHA256) {
    console.error("tests/fixtures/original-exam.html is not the uploaded file (sha256 " + actual + ").");
    process.exit(1);
  }
  const baseline = await recordBaseline(ORIGINAL_HTML);
  writeFileSync(BASELINE_JSON, serializeBaseline(baseline));
  console.log(`Recorded ${path.relative(process.cwd(), BASELINE_JSON)} from the original (sha256 ${actual.slice(0, 12)}…):`);
  console.log(`  ${baseline.structure.questions} questions · ${baseline.structure.parts} parts · ${baseline.structure.totalMarks} marks`);
  console.log(`  ${baseline.sheets.length} answer sheets · ${baseline.exhaustive.reduce((n, item) => n + item.cases, 0)} exhaustive answers`);
}
