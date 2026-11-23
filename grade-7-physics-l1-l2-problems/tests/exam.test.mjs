import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";

const compiled = process.env.COMPILED_DIR;
const load = (rel) => import(pathToFileURL(path.join(compiled, rel)).href);

const config = await load("config.mjs");
const problemsMod = await load("content/problems.mjs");
const specMod = await load("exam/spec.mjs");
const gradingMod = await load("exam/grading.mjs");
const persistMod = await load("exam/persistence.mjs");
const reportMod = await load("exam/report.mjs");

function makeMemoryStorage() {
  const map = new Map();
  return {
    get length() { return map.size; },
    key(i) { return Array.from(map.keys())[i] ?? null; },
    getItem(k) { return map.has(k) ? map.get(k) : null; },
    setItem(k, v) { map.set(k, String(v)); },
    removeItem(k) { map.delete(k); },
  };
}

test("Exam spec covers 20 problems, 48 subparts, and 100 total marks (50 + 50)", () => {
  assert.equal(problemsMod.allProblems.length, 20);
  assert.equal(specMod.questionSpecs.length, 20);
  assert.equal(specMod.allSubparts.length, 48);

  const totalMax = specMod.questionSpecs.reduce((s, q) => s + q.maxMarks, 0);
  assert.equal(totalMax, 100);

  const motionMax = specMod.questionSpecs
    .filter((q) => q.lessonId === "motion")
    .reduce((s, q) => s + q.maxMarks, 0);
  const forceMax = specMod.questionSpecs
    .filter((q) => q.lessonId === "force")
    .reduce((s, q) => s + q.maxMarks, 0);
  assert.equal(motionMax, 50);
  assert.equal(forceMax, 50);
});

test("Perfect submission including Arabic-Indic digits, decimal comma, colon duration, and units scores 100/100", () => {
  const perfectAnswers = {
    "m1-a": "٧٢ km/h",
    "m1-b": "20",
    "m2-a": "3",
    "m2-b": "١٠,٨",
    "m3-a": "15",
    "m3-b": "20",
    "m3-c": "18",
    "m4-a": "600",
    "m4-b": "5",
    "m5-a": "2:30",
    "m5-b": "١٠:١٠ صباحاً",
    "m6-a": "4.5",
    "m6-b": "16",
    "m7-a": "5",
    "m7-b": "600",
    "m8-a": "28",
    "m8-b": "30",
    "m8-c": "56",
    "m9-a": "52.5",
    "m9-b": "90",
    "m9-c": "last-faster",
    "m10-a": "476",
    "m10-b": "238",
    "f1-a": "0.15",
    "f1-b": "1.5",
    "f2-a": "900",
    "f2-b": "145.8",
    "f2-c": "754.2",
    "f3-a": "12",
    "f3-b": "19.44",
    "f4-a": "21.5",
    "f4-b": "215",
    "f5-a": "4",
    "f5-b": "6",
    "f5-c": "3",
    "f5-d": "13",
    "f6-a": "175",
    "f6-b": "4",
    "f7-a": "1.6",
    "f7-b": "600",
    "f7-c": "504",
    "f8-a": "45",
    "f8-b": "72.9",
    "f8-c": "377.1",
    "f9-a": "610",
    "f9-b": "9",
    "f10-a": "240",
    "f10-b": "8",
  };

  const res = gradingMod.gradeExam(perfectAnswers);
  assert.equal(res.total, 100);
  assert.equal(res.percentage, 100);
  assert.equal(res.gradeLabel, "ممتاز");
  assert.equal(res.questionCounts.correct, 20);
  assert.equal(res.questionCounts.partial, 0);
  assert.equal(res.questionCounts.wrong, 0);
  assert.equal(res.questionCounts.unanswered, 0);
});

test("Mixed responses classify correct, partial, wrong, and unanswered accurately", () => {
  const res = gradingMod.gradeExam({
    "m1-a": "72",
    "m1-b": "20",       // m1 -> correct (5)
    "m2-a": "3",
    "m2-b": "99",       // m2 -> partial (2.5)
    "m3-a": "99",
    "m3-b": "99",
    "m3-c": "99",       // m3 -> wrong (0)
  });

  assert.equal(res.total, 7.5);
  assert.equal(res.questionCounts.correct, 1);
  assert.equal(res.questionCounts.partial, 1);
  assert.equal(res.questionCounts.wrong, 1);
  assert.equal(res.questionCounts.unanswered, 17);
});

test("Persistence isolates by EXAM_ID and rejects foreign attempts", () => {
  const storage = makeMemoryStorage();
  const attempt = persistMod.createFreshAttempt("حلا الأحمد");
  attempt.responses["m1-a"] = "72";
  persistMod.saveAttempt(attempt, storage);

  const loaded = persistMod.loadAttempt(storage);
  assert.ok(loaded);
  assert.equal(loaded.examId, config.EXAM_ID);
  assert.equal(loaded.studentName, "حلا الأحمد");
  assert.equal(loaded.responses["m1-a"], "72");

  // Foreign examId must be rejected
  storage.setItem(config.ATTEMPT_STORAGE_KEY, JSON.stringify({ ...loaded, examId: "other-exam" }));
  assert.equal(persistMod.loadAttempt(storage), null);

  persistMod.clearAttempt(storage);
  assert.equal(persistMod.loadAttempt(storage), null);
});

test("Report text includes all required sections and fixed teacherNotes have no tab/control chars", () => {
  for (const p of problemsMod.allProblems) {
    assert.ok(!/[\t\x08\x0c]/.test(p.solution.teacherNote), `Control char in ${p.id} teacherNote`);
  }

  const attempt = persistMod.createFreshAttempt("طالب اختبار");
  attempt.submittedAt = new Date(Date.now() + 125000).toISOString();
  attempt.elapsedMs = 125000;
  attempt.responses["m1-a"] = "72";
  attempt.responses["m1-b"] = "20";

  const res = gradingMod.gradeExam(attempt.responses);
  const txt = reportMod.buildReportText(attempt, res);
  assert.match(txt, /طالب اختبار/);
  assert.match(txt, /مسائل الدرسين الأول والثاني/);
  assert.match(txt, /توزيع العلامات حسب الدرس/);
  assert.match(txt, /الحركة والسكون/);
  assert.match(txt, /القوة والحركة/);
  assert.match(txt, /\[20\]/);
});
