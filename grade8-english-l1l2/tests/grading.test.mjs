/**
 * Marking is unchanged by the addition of result delivery.
 *
 * tests/fixtures/grading-golden.json was recorded from the examination file as it was before the
 * change (see tests/make-golden.mjs). These tests mark the same answer sheets with the current page
 * and require identical results, down to every rubric note.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { loadExam, makeAnswerSheets, gradingFingerprint, takeExam, FakeServer } from "./harness.mjs";
import { GOLDEN_FILE, describeSheet, sourceHashes } from "./make-golden.mjs";

const golden = JSON.parse(readFileSync(GOLDEN_FILE, "utf8"));
const page = loadExam();
const questions = page.json("QUESTIONS");
const sheets = makeAnswerSheets(questions);

test("the paper still has 30 questions, 60 answerable parts and 100 marks", () => {
  assert.equal(questions.length, 30);
  assert.equal(questions.flatMap(question => question.parts).length, 60);
  assert.equal(questions.reduce((sum, question) => sum + question.marks, 0), 100);
  assert.deepEqual(page.json("VALIDATION.errors"), []);
});

test("the item bank and the marking functions are byte-for-byte the original ones", () => {
  const now = sourceHashes(page);
  assert.equal(now.itemBankScriptSha256, golden.recordedFrom.itemBankScriptSha256, "questions, keys or accepted answers changed");
  assert.equal(now.markingCodeSha256, golden.recordedFrom.markingCodeSha256, "marking functions changed");
});

test("every recorded answer sheet is marked exactly as before", () => {
  assert.equal(sheets.length, golden.sheets.length);
  assert.ok(golden.sheets.length >= 60);
  sheets.forEach((sheet, index) => {
    assert.deepEqual(describeSheet(page, sheet), golden.sheets[index], "answer sheet " + sheet.name);
  });
});

test("the recorded sheets cover full marks, zero, partial credit and unanswered parts", () => {
  const byName = Object.fromEntries(golden.sheets.map(sheet => [sheet.name, sheet]));
  assert.equal(byName["all-correct"].totalScore, 100);
  assert.equal(byName["all-correct"].fullyCorrectMain, 30);
  assert.equal(byName.blank.totalScore, 0);
  assert.equal(byName.blank.statusCounts.unanswered, 60);
  assert.ok(golden.sheets.some(sheet => sheet.statusCounts.partial > 0));
  assert.ok(golden.sheets.some(sheet => sheet.statusCounts.incorrect > 0 && sheet.statusCounts.correct > 0));
});

test("a submitted attempt gets the same marks as marking its answers directly", async () => {
  for (const index of [0, 1, 7, 20]) {
    const attempt = await takeExam(loadExam({ fetch: new FakeServer().fetch }), { answers: sheets[index].answers });
    const state = attempt.state();
    assert.equal(state.status, "submitted");
    assert.deepEqual(gradingFingerprint(state.result), gradingFingerprint(page.call("gradeAttempt", state.answers)));
    assert.equal(attempt.el("results-score").textContent, String(state.result.totalScore));
    assert.equal(attempt.el("results-percentage").textContent, state.result.percentage.toFixed(1) + "%");
  }
  const best = await takeExam(loadExam({ fetch: new FakeServer().fetch }), { answers: sheets[0].answers });
  assert.equal(best.state().result.totalScore, 100);
  assert.equal(best.el("results-performance").textContent, "Distinction");
});
