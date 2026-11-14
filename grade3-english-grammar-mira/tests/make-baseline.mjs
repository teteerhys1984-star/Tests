/**
 * Records the reference baseline of the uploaded examination (tests/fixtures/original-exam.html).
 *
 * The baseline is the proof that marking did not change: the paper's structure, the answer key,
 * the marks of every answer the controls can produce, 101 marked sheets (scores, question marks,
 * lesson totals, review texts, report hashes), one complete run through the interface, and the
 * report file name. tests/grading.test.mjs compares the published page against it.
 *
 * Run: npm run baseline   (rewrites tests/fixtures/baseline.json)
 */
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { BASELINE_JSON, EXAM_DIR_NAME, ORIGINAL_HTML, ORIGINAL_SHA256, answerSpace, correctAnswer, gradeOne, gradeSheet, makeSheets, openExam, resultsSnapshot, sha256, sheetOf, submitExamInUi, teacherKeySnapshot } from "./harness.mjs";

export const MARKING_FUNCTIONS = ["evaluateStudent", "isQuestionAnswered", "getAnsweredCount", "formatDuration"];
export const FULL_REPORT_SHEETS = ["all-correct", "all-wrong", "blank", "mixed-002"];

/** Structure of the paper as the page's own data describes it. */
export function structureOf(questions) {
  const byType = {};
  const byLesson = {};
  let parts = 0;
  for (const q of questions) {
    byType[q.type] = (byType[q.type] || 0) + 1;
    byLesson[q.lessonNum] = (byLesson[q.lessonNum] || 0) + 1;
    parts += q.type === "svo_tag" ? q.parts.length : q.subparts ? q.subparts.length : 1;
  }
  return {
    questions: questions.length,
    parts,
    totalMarks: 100,
    marksPerQuestion: 4,
    byType,
    byLesson,
    order: questions.map((q) => q.id),
  };
}

/** The answer key, exactly as the page's data holds it. */
export function answerKeyOf(questions) {
  return questions.map((q) => ({ id: q.id, type: q.type, key: correctAnswer(q) }));
}

/** The questions without presentation-only fields. */
export function normaliseQuestions(questions) {
  return questions.map((q) => {
    const copy = { ...q };
    delete copy.underline;
    return copy;
  });
}

export async function recordBaseline(file) {
  const page = await openExam({ file });
  const questions = page.questions;
  const baseline = {
    recordedFrom: {
      folder: "english-foundation-assessment-development",
      file: "english-foundation-assessment-development/index.html",
      sha256: ORIGINAL_SHA256,
      bytes: readFileSync(ORIGINAL_HTML).length,
    },
    structure: structureOf(questions),
    questions: normaliseQuestions(questions),
    answerKey: answerKeyOf(questions),
    constants: {
      storageKey: page.run("STORAGE_KEY"),
      totalMarks: 100,
      marksPerQuestion: 4,
      questions: questions.length,
    },
    markingCodeSha256: Object.fromEntries(MARKING_FUNCTIONS.map((name) => [name, sha256(page.run(name + ".toString()"))])),
    exhaustive: [],
    sheets: [],
    reports: {},
  };

  /* Every answer the controls can produce, marked by the page's own engine. */
  for (const q of questions) {
    for (const answer of answerSpace(q)) {
      baseline.exhaustive.push({ q: q.id, answer: answer === undefined ? null : answer, earned: gradeOne(page, q.id, answer) });
    }
  }

  /* 101 sheets, marked with the page's own functions. */
  const sheets = makeSheets(questions);
  for (const sheet of sheets) {
    const marked = await gradeSheet(page, sheet);
    if (FULL_REPORT_SHEETS.includes(sheet.name)) baseline.reports[sheet.name] = marked.report;
    baseline.sheets.push({
      name: sheet.name,
      score: marked.score,
      percentage: marked.percentage,
      correct: marked.correct,
      incorrect: marked.incorrect,
      durationText: marked.durationText,
      lessonStats: marked.lessonStats,
      reviews: marked.reviews,
      answered: marked.answered,
      reportSha256: marked.reportSha256,
      file: marked.file,
    });
  }

  /* One complete run through the interface: start, 25 answers, submit. */
  const sheet = sheets.find((item) => item.name === "complete-003");
  const ui = await openExam({ file });
  await submitExamInUi(ui, { name: "  Mira   Test ", answers: sheet.answers, elapsedMs: 754000 });
  await ui.clock.advance(700); /* the automatic download */
  const state = JSON.parse(ui.storage.getItem(page.run("STORAGE_KEY")));
  const teacher = teacherKeySnapshot(ui);
  baseline.uiRun = {
    results: resultsSnapshot(ui),
    stored: {
      studentName: state.studentName,
      started: state.started,
      submitted: state.submitted,
      currentQ: state.currentQ,
      answers: state.answers,
    },
    downloads: ui.downloads.length,
    downloadName: ui.downloads.at(-1) ? ui.downloads.at(-1).name : null,
    downloadSha256: sha256(await ui.downloadText()),
    downloadText: await ui.downloadText(),
    teacherKeyCards: teacher.count,
    teacherKeyAnswers: teacher.answers,
    pageErrors: ui.pageErrors.length,
    consoleLines: ui.consoleLines.length,
  };
  ui.close();
  page.close();
  return baseline;
}

export function serializeBaseline(baseline) {
  return JSON.stringify(baseline, null, 2) + "\n";
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const baseline = await recordBaseline(ORIGINAL_HTML);
  writeFileSync(BASELINE_JSON, serializeBaseline(baseline));
  const size = createHash("sha256").update(readFileSync(BASELINE_JSON)).digest("hex").slice(0, 12);
  console.log(`Wrote ${EXAM_DIR_NAME}/tests/fixtures/baseline.json`);
  console.log(`  paper: ${baseline.structure.questions} questions · ${baseline.structure.parts} marked parts · ${baseline.structure.totalMarks} marks`);
  console.log(`  exhaustive: ${baseline.exhaustive.length} answers · sheets: ${baseline.sheets.length} · sha256 ${size}`);
}
