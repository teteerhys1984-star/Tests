/**
 * Marking: the published page (index.html) against the baseline recorded from the uploaded
 * original (tests/fixtures/baseline.json) and against the original itself, run side by side.
 *
 * The only permitted differences are the two documented changes of the TXT report
 * (tests/differences.mjs). Questions, order, key, marks, review texts, ranks, file names and
 * the results screen must be identical.
 */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { before, test } from "node:test";
import {
  BASELINE_JSON, FIXED_META, ORIGINAL_HTML, ORIGINAL_SHA256, SOURCE_HTML, answerSpace, correctAnswer, gradeOne, gradeSheet, makeSheets,
  openExam, partsOf, sheetOf,
} from "./harness.mjs";
import { FULL_REPORT_SHEETS, MARKING_FUNCTIONS, recordBaseline, serializeBaseline, sha256 } from "./make-baseline.mjs";
import { CHANGED_FUNCTIONS, PUBLISHED_PRIVACY_LINE, UNCHANGED_FUNCTIONS, toPublishedReport } from "./differences.mjs";

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

test("the baseline was recorded from the uploaded file, unchanged", async () => {
  const bytes = readFileSync(ORIGINAL_HTML);
  assert.equal(createHash("sha256").update(bytes).digest("hex"), ORIGINAL_SHA256, "tests/fixtures/original-exam.html must stay the uploaded file, byte for byte");
  assert.equal(baseline.recordedFrom.sha256, ORIGINAL_SHA256);
  assert.equal(baseline.recordedFrom.bytes, bytes.length);
  /* Recording it again from the original gives the committed file exactly. */
  assert.equal(serializeBaseline(await recordBaseline(ORIGINAL_HTML)), baselineText);
});

test("the paper: 25 questions, 37 marked parts, 100 marks, fixed order", () => {
  assert.deepEqual(baseline.structure, {
    questions: 25,
    parts: 37,
    totalMarks: 100,
    byType: { labels: 2, choice: 14, blanks: 4, match: 2, order: 3 },
    byLesson: { 1: 3, 2: 3, 3: 3, 4: 3, 5: 3, 16: 3, 17: 3, 18: 4 },
    order: Array.from({ length: 25 }, (_, i) => i + 1),
  });
  for (const q of baseline.questions) assert.equal(partsOf(q).reduce((sum, part) => sum + part.mark, 0), 4, "Q" + q.id + " is worth 4 marks");
  assert.deepEqual(now.structure, baseline.structure);
});

test("questions, options, answer key, marks, explanations and lesson data are identical to the original", () => {
  assert.deepEqual(published.questions, baseline.questions);
  assert.deepEqual(published.questions, original.questions);
  assert.deepEqual(now.answerKey, baseline.answerKey);
  assert.deepEqual(now.constants, baseline.constants);
  assert.deepEqual(now.ranks, baseline.ranks);
  assert.deepEqual(now.ranks.map((rank) => [rank.from, rank.to, rank.title]), [
    [0, 39, "New Adventurer"], [40, 59, "Stone Builder"], [60, 74, "Emerald Adventurer"], [75, 89, "Diamond Explorer"], [90, 100, "Legendary Redstone Engineer"],
  ]);
});

test("the marking code is the original's, character for character", () => {
  for (const name of UNCHANGED_FUNCTIONS) {
    assert.equal(published.run(name + ".toString()"), original.run(name + ".toString()"), name + "() must not change");
  }
  for (const name of MARKING_FUNCTIONS) {
    if (CHANGED_FUNCTIONS.includes(name)) continue;
    assert.equal(now.markingCodeSha256[name], baseline.markingCodeSha256[name], name + "()");
  }
  /* buildReportText(): exactly the two documented lines differ. */
  const before = original.run("buildReportText.toString()").split("\n");
  const after = published.run("buildReportText.toString()").split("\n");
  assert.equal(after.length, before.length);
  const changed = before.map((line, i) => i).filter((i) => before[i] !== after[i]);
  assert.equal(changed.length, 2);
  assert.match(before[changed[0]], /internal reference: Lesson/);
  assert.match(before[changed[1]], /No student answers were sent to a server/);
});

test("every answer each question's controls can produce gets the original's marks (4007 answers)", () => {
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
  assert.equal(cases, 4007);
});

test("328 answer sheets: scores, question marks, lesson totals, ranks, review texts and file names match the baseline", () => {
  assert.equal(now.sheets.length, 328);
  assert.equal(baseline.sheets.length, 328);
  now.sheets.forEach((sheet, i) => {
    /* The report hash is compared in the next test, after the documented changes are applied. */
    const { reportSha256: a, ...mine } = sheet;
    const { reportSha256: b, ...theirs } = baseline.sheets[i];
    assert.deepEqual(mine, theirs, sheet.name);
  });
  const byName = Object.fromEntries(now.sheets.map((sheet) => [sheet.name, sheet]));
  assert.equal(byName["all-correct"].score, 100);
  assert.equal(byName["all-wrong"].score, 0);
  assert.equal(byName.blank.score, 0);
  for (const q of original.questions) assert.equal(byName["only-q" + q.id + "-wrong"].score, 96);
});

test("328 answer sheets, original and published side by side: the TXT report differs only as documented", () => {
  for (const sheet of sheets) {
    const a = gradeSheet(original, sheet);
    const b = gradeSheet(published, sheet);
    const { report: reportA, ...restA } = a;
    const { report: reportB, ...restB } = b;
    assert.deepEqual(restB, restA, sheet.name);
    assert.equal(reportB, toPublishedReport(reportA), sheet.name);
    assert.equal(sha256(reportA), baseline.sheets.find((item) => item.name === sheet.name).reportSha256, sheet.name);
    assert.ok(!/internal reference|course repository|No student answers were sent/.test(reportB), sheet.name);
    assert.ok(reportB.includes("\r\n" + PUBLISHED_PRIVACY_LINE + "\r\n"), sheet.name);
  }
  for (const name of FULL_REPORT_SHEETS) assert.equal(now.reports[name], toPublishedReport(baseline.reports[name]), name);
});

test("report file names: same as the original for other names and later attempts", () => {
  const sheet = { name: "all-correct", answers: sheetOf(original.questions, correctAnswer) };
  for (const meta of [
    { name: "Mahmoud" }, { name: "محمود أحمد" }, { name: "  A/B: c?  " }, { name: "..." },
    { name: "Mahmoud", attemptNumber: 2 }, { name: "Sara Ali", attemptNumber: 7, startedAt: FIXED_META.startedAt + 86400000 },
  ]) {
    const a = gradeSheet(original, sheet, meta);
    const b = gradeSheet(published, sheet, meta);
    assert.equal(b.file, a.file);
    assert.equal(b.report, toPublishedReport(a.report));
  }
  assert.equal(gradeSheet(published, sheet, { name: "Mahmoud" }).file, "Mahmoud_Minecraft_English_Report.txt");
  assert.equal(gradeSheet(published, sheet, { name: "Mahmoud", attemptNumber: 2 }).file, "Mahmoud_Minecraft_English_Report_Attempt2_20261114-0729.txt");
});

test("a complete run through the interface shows the same results screen as the original", () => {
  assert.deepEqual(now.uiRun.results, baseline.uiRun.results);
  assert.deepEqual(now.uiRun.storedAnswers, baseline.uiRun.storedAnswers);
  assert.equal(now.uiRun.storedAttemptNumber, baseline.uiRun.storedAttemptNumber);
  assert.equal(now.uiRun.download.name, baseline.uiRun.download.name);
  assert.equal(now.uiRun.download.count, 1);
  assert.equal(now.uiRun.download.startsWithBom, true);
  assert.equal(now.uiRun.teacherKeyCards, 25);
  assert.deepEqual(now.uiRun.teacherKeyAnswers, baseline.uiRun.teacherKeyAnswers);
  assert.equal(now.uiRun.pageErrors, 0);
  assert.equal(now.uiRun.consoleLines, 0);
  assert.equal(baseline.uiRun.results.score, "66");
  assert.equal(baseline.uiRun.results.review.length, 25);
});
