/**
 * Marking: the published page (index.html) against the baseline recorded from the uploaded
 * original (tests/fixtures/baseline.json) and against the original itself, run side by side.
 *
 * The only permitted differences are the documented ones (tests/differences.mjs): the TXT report
 * gains one truthful line and the report file name changes. Questions, order, key, marks, review
 * texts, lesson totals, scores and the results screen must be identical.
 */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { after, before, test } from "node:test";
import {
  BASELINE_JSON, FIXED_META, ORIGINAL_HTML, ORIGINAL_SHA256, SOURCE_HTML, answerSpace, correctAnswer, gradeOne, gradeSheet, makeSheets,
  openExam, partsOf, sheetOf,
} from "./harness.mjs";
import { FULL_REPORT_SHEETS, MARKING_FUNCTIONS, answerKeyOf, normaliseQuestions, recordBaseline, serializeBaseline } from "./make-baseline.mjs";
import { PUBLISHED_PRIVACY_LINE, toPublishedReport } from "./differences.mjs";

const baselineText = readFileSync(BASELINE_JSON, "utf8");
const baseline = JSON.parse(baselineText);
let original;
let published;
let sheets;
let now;

before(async () => {
  original = await openExam({ file: ORIGINAL_HTML });
  published = await openExam({ file: SOURCE_HTML });
  sheets = makeSheets(original.questions);
  now = await recordBaseline(SOURCE_HTML);
});

after(() => {
  original.close();
  published.close();
});

test("the baseline was recorded from the uploaded file, unchanged", async () => {
  const bytes = readFileSync(ORIGINAL_HTML);
  assert.equal(createHash("sha256").update(bytes).digest("hex"), ORIGINAL_SHA256, "tests/fixtures/original-exam.html must stay the uploaded file, byte for byte");
  assert.equal(baseline.recordedFrom.sha256, ORIGINAL_SHA256);
  assert.equal(baseline.recordedFrom.bytes, bytes.length);
  /* Recording it again from the original gives the committed file exactly. */
  assert.equal(serializeBaseline(await recordBaseline(ORIGINAL_HTML)), baselineText);
});

test("the paper: 25 questions, 30 marked parts, 100 marks, fixed order", () => {
  assert.deepEqual(baseline.structure, {
    questions: 25,
    parts: 30,
    totalMarks: 100,
    marksPerQuestion: 4,
    byType: { svo_tag: 1, mcq: 20, multi_choice_pair: 1, match_opposites: 1, scramble: 1, match_possessive: 1 },
    byLesson: { 1: 4, 2: 4, 3: 4, 4: 4, 5: 4, 16: 5 },
    order: Array.from({ length: 25 }, (_, i) => i + 1),
  });
  for (const q of baseline.questions) assert.equal(partsOf(q).reduce((sum, part) => sum + part.mark, 0), 4, "Q" + q.id + " is worth 4 marks");
  assert.deepEqual(now.structure, baseline.structure);
});

test("questions, options, answer key, marks, explanations and lesson data are identical to the original", () => {
  assert.deepEqual(normaliseQuestions(published.questions), baseline.questions);
  assert.deepEqual(normaliseQuestions(published.questions), original.questions);
  assert.deepEqual(answerKeyOf(published.questions), baseline.answerKey);
  assert.deepEqual(now.constants, baseline.constants);
  /* The only added question property is Question 2's presentation-only underline. */
  const addedFields = [];
  published.questions.forEach((q, i) => {
    const originalKeys = Object.keys(original.questions[i]);
    for (const key of Object.keys(q)) if (!originalKeys.includes(key)) addedFields.push([q.id, key]);
  });
  assert.deepEqual(addedFields, [[2, "underline"]]);
  assert.equal(published.questions[1].underline, "Khalil and Adam");
  assert.match(published.questions[1].subtext, /Khalil and Adam are friends/);
});

test("the marking code is the original's, character for character", () => {
  for (const name of MARKING_FUNCTIONS) {
    assert.equal(published.run(name + ".toString()"), original.run(name + ".toString()"), name + "() must not change");
    assert.equal(now.markingCodeSha256[name], baseline.markingCodeSha256[name], name + "()");
  }
});

test("every answer each question's controls can produce gets the original's marks (266 answers)", () => {
  assert.deepEqual(now.exhaustive, baseline.exhaustive);
  let cases = 0;
  for (const q of original.questions) {
    for (const answer of answerSpace(q)) {
      cases += 1;
      const expected = gradeOne(original, q.id, answer);
      assert.equal(gradeOne(published, q.id, answer), expected, `Q${q.id} ${JSON.stringify(answer)}`);
    }
    assert.equal(gradeOne(published, q.id, correctAnswer(q)), 4, "Q" + q.id + ": the key earns 4");
  }
  assert.equal(cases, 266);
});

test("101 answer sheets: scores, question marks, lesson totals, review texts and answered lists match the baseline", () => {
  assert.equal(now.sheets.length, 101);
  assert.equal(baseline.sheets.length, 101);
  now.sheets.forEach((sheet, i) => {
    const { reportSha256: a, file: fileA, ...mine } = sheet;
    const { reportSha256: b, file: fileB, ...theirs } = baseline.sheets[i];
    assert.deepEqual(mine, theirs, sheet.name);
  });
  const byName = Object.fromEntries(now.sheets.map((sheet) => [sheet.name, sheet]));
  assert.equal(byName["all-correct"].score, 100);
  assert.equal(byName["all-wrong"].score, 0);
  assert.equal(byName.blank.score, 0);
  for (const q of original.questions) {
    assert.equal(byName["only-q" + q.id + "-blank"].score, 96, "Q" + q.id + " left blank: 96");
    /* A wrong answer on a single-part question loses its whole 4 marks; multi-part questions
       lose only the share of the part, exactly as the page always did. */
    if (partsOf(q).length === 1) assert.equal(byName["only-q" + q.id + "-wrong"].score, 96, "Q" + q.id + " wrong");
  }
});

test("101 answer sheets, original and published side by side: the TXT report differs only as documented", async () => {
  for (const sheet of sheets) {
    const a = await gradeSheet(original, sheet);
    const b = await gradeSheet(published, sheet);
    const { report: reportA, reportSha256: shaA, file: fileA, ...restA } = a;
    const { report: reportB, reportSha256: shaB, file: fileB, ...restB } = b;
    assert.deepEqual(restB, restA, sheet.name);
    assert.equal(reportB, toPublishedReport(reportA), sheet.name);
    assert.equal(shaA, baseline.sheets.find((item) => item.name === sheet.name).reportSha256, sheet.name);
    assert.ok(!/internal reference|course repository|No student answers were sent/.test(reportB), sheet.name);
    assert.ok(reportB.includes("\n" + PUBLISHED_PRIVACY_LINE + "\n"), sheet.name);
    assert.equal(fileA, "Mira_English_Foundation_Report.txt");
    assert.equal(fileB, "Mira_English_Grammar_Report.txt");
  }
  for (const name of FULL_REPORT_SHEETS) assert.equal(now.reports[name], toPublishedReport(baseline.reports[name]), name);
});

test("a complete run through the interface shows the same results screen as the original", () => {
  assert.deepEqual(now.uiRun.stored, baseline.uiRun.stored);
  assert.equal(now.uiRun.downloads, 1);
  assert.equal(now.uiRun.downloadName, "Mira_English_Grammar_Report.txt");
  assert.equal(baseline.uiRun.downloadName, "Mira_English_Foundation_Report.txt");
  assert.equal(now.uiRun.downloadText, toPublishedReport(baseline.uiRun.downloadText));
  assert.equal(now.uiRun.teacherKeyCards, 25);
  assert.deepEqual(now.uiRun.teacherKeyAnswers, baseline.uiRun.teacherKeyAnswers);
  assert.equal(now.uiRun.pageErrors, 0);
  assert.equal(now.uiRun.consoleLines, 0);
  assert.equal(baseline.uiRun.pageErrors, 0);
  assert.equal(baseline.uiRun.consoleLines, 0);

  /* The results themselves are identical; the published page adds the performance-level badge. */
  const { results: mine } = now.uiRun;
  const { results: theirs } = baseline.uiRun;
  assert.equal(theirs.level, null);
  assert.deepEqual({ ...mine, level: null }, theirs);
  assert.equal(mine.screen, "results");
  assert.equal(mine.review.length, 25);
  assert.equal(mine.lessons.length, 6);
  assert.equal(mine.score, theirs.score);
  assert.match(mine.level, /^Performance Level: (Outstanding|Great Job|Good Effort|Keep Practicing)$/);
  const expectedLevel = Number(mine.score) >= 90 ? "Outstanding" : Number(mine.score) >= 75 ? "Great Job" : Number(mine.score) >= 50 ? "Good Effort" : "Keep Practicing";
  assert.equal(mine.level, "Performance Level: " + expectedLevel);
});

test("the report file name is the documented one for every sheet and every attempt", async () => {
  const sheet = { name: "all-correct", answers: sheetOf(original.questions, correctAnswer) };
  for (const meta of [{ name: "Mira" }, { name: "ميرا أحمد" }, { name: "  A/B: c?  " }, { name: "..." }]) {
    const a = await gradeSheet(original, sheet, meta);
    const b = await gradeSheet(published, sheet, meta);
    assert.equal(a.file, "Mira_English_Foundation_Report.txt");
    assert.equal(b.file, "Mira_English_Grammar_Report.txt");
    assert.equal(b.report, toPublishedReport(a.report));
  }
  assert.equal(FIXED_META.elapsedMs, 1754321);
});
