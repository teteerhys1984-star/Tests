import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";

const compiled = process.env.COMPILED_DIR;
const load = (rel) => import(pathToFileURL(path.join(compiled, rel)).href);

const config = await load("config.mjs");
const gradingMod = await load("exam/grading.mjs");
const persistMod = await load("exam/persistence.mjs");
const reportMod = await load("exam/report.mjs");
const submitMod = await load("exam/submit.mjs");

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

function makeSamplePayload() {
  const attempt = persistMod.createFreshAttempt("حلا");
  attempt.responses["m1-a"] = "72";
  attempt.responses["m1-b"] = "20";
  attempt.submittedAt = new Date(Date.now() + 60000).toISOString();
  attempt.elapsedMs = 60000;
  const result = gradingMod.gradeExam(attempt.responses);
  const reportText = reportMod.buildReportText(attempt, result);
  return submitMod.buildPayload({ attempt, result, reportText });
}

test("buildPayload follows grade5-math-unit1 contract exactly", () => {
  const payload = makeSamplePayload();
  const keys = Object.keys(payload).sort();
  assert.deepEqual(
    keys,
    [
      "attemptId",
      "details",
      "elapsedSec",
      "examId",
      "examTitle",
      "lessons",
      "reportText",
      "startAt",
      "studentName",
      "submitAt",
      "summary",
      "token",
    ].sort(),
  );
  assert.equal(payload.token, config.SHEETS_TOKEN);
  assert.equal(payload.examId, "grade-7-physics-l1-l2-problems");
  assert.equal(payload.examTitle, "مسائل الدرسين الأول والثاني");
  assert.equal(payload.lessons.length, 2);
  assert.equal(payload.details.length, 48);
  assert.equal(payload.summary.total, 5);
  assert.equal(payload.summary.max, 100);
});

test("sendWithRetry uses POST text/plain, retries 3 times with [2000, 5000] delays, and clears pending on success", async () => {
  const storage = makeMemoryStorage();
  const payload = makeSamplePayload();
  const delays = [];
  let calls = 0;

  const ok = await submitMod.sendWithRetry(payload, {
    storage,
    sleep: async (ms) => { delays.push(ms); },
    fetchImpl: async (url, init) => {
      calls++;
      assert.equal(url, config.SHEETS_URL);
      assert.equal(init.method, "POST");
      assert.equal(init.headers["Content-Type"], "text/plain;charset=utf-8");
      if (calls < 3) throw new Error("network blip");
      return { text: async () => JSON.stringify({ ok: true }) };
    },
  });

  assert.equal(ok, true);
  assert.equal(calls, 3);
  assert.deepEqual(delays, [2000, 5000]);
  assert.equal(storage.length, 0);
});

test("sendWithRetry saves pending payload when all 3 attempts fail, and retryPending flushes on next load", async () => {
  const storage = makeMemoryStorage();
  const payload = makeSamplePayload();

  const ok = await submitMod.sendWithRetry(payload, {
    storage,
    sleep: async () => {},
    fetchImpl: async () => { throw new Error("offline"); },
  });

  assert.equal(ok, false);
  assert.equal(storage.length, 1);
  assert.ok(storage.getItem(submitMod.pendingKey(payload.attemptId)));

  // Next load: server accepts as duplicate: true
  const flushed = await submitMod.retryPending({
    storage,
    sleep: async () => {},
    fetchImpl: async () => ({ text: async () => JSON.stringify({ duplicate: true }) }),
  });

  assert.equal(flushed, 1);
  assert.equal(storage.length, 0);
});
