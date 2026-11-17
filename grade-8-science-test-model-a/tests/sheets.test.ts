/**
 * Google Sheets delivery contract — every network call here is a MOCK.
 * `globalThis.fetch` is replaced before each test and asserted to be the only
 * transport, so the suite can never deliver student data to the real endpoint.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EXAM_ID, EXAM_TITLE, SHEETS_TOKEN, SHEETS_URL } from "@/config";
import { QUESTIONS, TOTAL_MARKS } from "@/data/exam";
import { gradeAttempt } from "@/lib/grade";
import { buildExamReport, reportToText, STATUS_AR } from "@/lib/report";
import {
  ATTEMPT_TIMEOUT_MS,
  MAX_ATTEMPTS,
  PENDING_PREFIX,
  RETRY_DELAYS_MS,
  buildPayload,
  hasPendingAttempt,
  loadPendingAttempt,
  newAttemptId,
  pendingKey,
  retryPending,
  sendWithRetry,
  type FetchLike,
  type SubmissionPayload,
} from "@/lib/submit";
import { completeAttempt, FakeStorage } from "./helpers";

const attempt = completeAttempt({ submittedAt: 1_700_003_600_000 });
const report = buildExamReport(attempt, gradeAttempt(QUESTIONS, attempt.answers));
const reportText = reportToText(report);

function makePayload(attemptId = "attempt-sheets-1"): SubmissionPayload {
  return buildPayload({
    attemptId,
    startedAt: attempt.startedAt,
    submittedAt: attempt.submittedAt as number,
    report,
    reportText,
  });
}

interface Call {
  url: string;
  init: RequestInit;
}

function mockFetch(replies: Array<"ok" | "fail" | "duplicate">): { calls: Call[]; impl: FetchLike } {
  const calls: Call[] = [];
  const impl: FetchLike = async (url, init) => {
    calls.push({ url, init });
    const reply = replies[Math.min(calls.length - 1, replies.length - 1)];
    return {
      text: async () => {
        if (reply === "ok") return JSON.stringify({ ok: true });
        if (reply === "duplicate") return JSON.stringify({ ok: false, duplicate: true });
        return JSON.stringify({ ok: false });
      },
    };
  };
  return { calls, impl };
}

const noSleep = async () => {};

describe("Payload contract (identical to grade5-math-unit1)", () => {
  it("uses the reference endpoint, token and exam identity", () => {
    const payload = makePayload();
    expect(payload.token).toBe(SHEETS_TOKEN);
    expect(payload.examId).toBe(EXAM_ID);
    expect(payload.examTitle).toBe(EXAM_TITLE);
    expect(payload.examTitle).toBe("Grade 8 Science Test Model A");
    expect(payload.studentName).toBe(attempt.name);
    expect(payload.startAt).toBe(new Date(attempt.startedAt).toISOString());
    expect(payload.submitAt).toBe(new Date(attempt.submittedAt as number).toISOString());
    expect(payload.elapsedSec).toBe(3600);
  });

  it("carries every summary field of the reference payload", () => {
    const { summary } = makePayload();
    expect(Object.keys(summary).sort()).toEqual(
      [
        "total",
        "max",
        "percentage",
        "gradeLabel",
        "fullQuestions",
        "partialQuestions",
        "wrongQuestions",
        "correctSubparts",
        "partialSubparts",
        "wrongSubparts",
        "unansweredSubparts",
      ].sort(),
    );
    expect(summary.total).toBe(100);
    expect(summary.max).toBe(TOTAL_MARKS);
    expect(summary.percentage).toBe(100);
    expect(summary.gradeLabel).toBe("ممتاز");
    expect(summary.fullQuestions).toBe(24);
    expect(summary.correctSubparts).toBe(64);
  });

  it("carries one detail row per graded sub-part with all reference fields", () => {
    const payload = makePayload();
    expect(payload.details).toHaveLength(64);
    for (const d of payload.details) {
      expect(Object.keys(d).sort()).toEqual(
        [
          "q",
          "qTitle",
          "lessons",
          "label",
          "status",
          "awarded",
          "marks",
          "studentAnswer",
          "correctAnswer",
        ].sort(),
      );
      expect(Object.values(STATUS_AR)).toContain(d.status);
      expect(typeof d.awarded).toBe("number");
      expect(d.correctAnswer.length).toBeGreaterThan(0);
    }
    expect(payload.lessons.map((l) => l.max).reduce((a, b) => a + b, 0)).toBe(100);
    expect(payload.reportText).toContain("Grade 8 Science Test Model A");
  });

  it("generates a unique attempt id for every new attempt", () => {
    const ids = new Set(Array.from({ length: 10 }, () => newAttemptId()));
    expect(ids.size).toBe(10);
  });
});

describe("Delivery & retry", () => {
  let storage: FakeStorage;

  beforeEach(() => {
    storage = new FakeStorage();
    vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new Error("real fetch forbidden"))));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("POSTs text/plain;charset=utf-8 exactly once on success", async () => {
    const { calls, impl } = mockFetch(["ok"]);
    const payload = makePayload();
    const ok = await sendWithRetry(payload, { fetchImpl: impl, storage, sleep: noSleep });
    expect(ok).toBe(true);
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe(SHEETS_URL);
    expect(calls[0].init.method).toBe("POST");
    expect((calls[0].init.headers as Record<string, string>)["Content-Type"]).toBe(
      "text/plain;charset=utf-8",
    );
    expect(JSON.parse(String(calls[0].init.body)).attemptId).toBe(payload.attemptId);
    expect(storage.keys()).toHaveLength(0);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it("accepts a duplicate acknowledgement from the endpoint", async () => {
    const { calls, impl } = mockFetch(["duplicate"]);
    const ok = await sendWithRetry(makePayload(), { fetchImpl: impl, storage, sleep: noSleep });
    expect(ok).toBe(true);
    expect(calls).toHaveLength(1);
  });

  it("retries up to 3 attempts with the approved 2s then 5s delays", async () => {
    const delays: number[] = [];
    const { calls, impl } = mockFetch(["fail", "fail", "ok"]);
    const ok = await sendWithRetry(makePayload(), {
      fetchImpl: impl,
      storage,
      sleep: async (ms) => {
        delays.push(ms);
      },
    });
    expect(ok).toBe(true);
    expect(calls).toHaveLength(3);
    expect(delays).toEqual([2000, 5000]);
    expect(RETRY_DELAYS_MS).toEqual([2000, 5000]);
    expect(MAX_ATTEMPTS).toBe(3);
    expect(ATTEMPT_TIMEOUT_MS).toBe(30000);
    const bodies = calls.map((c) => JSON.parse(String(c.init.body)));
    expect(new Set(bodies.map((b) => b.attemptId)).size).toBe(1);
  });

  it("keeps the exact same attemptId when a failed payload is resent", async () => {
    const payload = makePayload();
    const fail = mockFetch(["fail"]);
    expect(await sendWithRetry(payload, { fetchImpl: fail.impl, storage, sleep: noSleep })).toBe(false);
    expect(hasPendingAttempt(payload.attemptId, { storage })).toBe(true);
    const stored = loadPendingAttempt(payload.attemptId, { storage });
    expect(stored?.attemptId).toBe(payload.attemptId);

    const success = mockFetch(["ok"]);
    expect(
      await sendWithRetry(stored as SubmissionPayload, { fetchImpl: success.impl, storage, sleep: noSleep }),
    ).toBe(true);
    expect(JSON.parse(String(success.calls[0].init.body)).attemptId).toBe(payload.attemptId);
    expect(storage.keys()).toHaveLength(0);
  });

  it("stores failures under this exam's pending prefix only", async () => {
    storage.setItem("pending:interactive-grade-8-english-exam-l1-3-b:other", "{}");
    const payload = makePayload("attempt-fail-1");
    const { impl } = mockFetch(["fail"]);
    await sendWithRetry(payload, { fetchImpl: impl, storage, sleep: noSleep });
    expect(storage.keys()).toEqual([
      "pending:interactive-grade-8-english-exam-l1-3-b:other",
      pendingKey("attempt-fail-1"),
    ]);
    expect(pendingKey("attempt-fail-1").startsWith(PENDING_PREFIX)).toBe(true);
    expect(storage.getItem(pendingKey("attempt-fail-1"))).toBeTruthy();
  });

  it("times out a hanging attempt after the configured timeout and counts it as failure", async () => {
    const hanging: FetchLike = () => new Promise(() => {});
    const started = Date.now();
    const ok = await sendWithRetry(makePayload(), {
      fetchImpl: hanging,
      storage,
      sleep: noSleep,
      timeoutMs: 10,
    });
    expect(ok).toBe(false);
    expect(Date.now() - started).toBeLessThan(3000);
  });

  it("retries pending payloads of this exam on load and drops them once delivered", async () => {
    const own = makePayload("attempt-pending-own");
    storage.setItem(pendingKey(own.attemptId), JSON.stringify(own));
    storage.setItem("pending:grade5-math-unit1:foreign", JSON.stringify({ ...own, examId: "grade5-math-unit1" }));
    const { calls, impl } = mockFetch(["ok"]);
    const sent = await retryPending({ fetchImpl: impl as FetchLike, storage, sleep: noSleep });
    expect(sent).toBe(1);
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe(SHEETS_URL);
    expect(storage.keys()).toEqual(["pending:grade5-math-unit1:foreign"]);
  });

  it("ignores pending entries that claim another exam id", async () => {
    const own = makePayload("attempt-pending-foreign");
    storage.setItem(pendingKey(own.attemptId), JSON.stringify({ ...own, examId: "grade5-math-unit1" }));
    const { calls, impl } = mockFetch(["ok"]);
    const sent = await retryPending({ fetchImpl: impl, storage, sleep: noSleep });
    expect(sent).toBe(0);
    expect(calls).toHaveLength(0);
    expect(storage.keys()).toHaveLength(1);
  });
});
