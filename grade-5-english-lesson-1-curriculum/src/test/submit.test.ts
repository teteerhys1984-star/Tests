import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { EXAM_ID, EXAM_TITLE, SHEETS_TOKEN, SHEETS_URL } from "../config";
import { ALL_ITEMS, QUESTIONS, TOTAL_ITEM_COUNT, TOTAL_MARKS } from "../data/exam";
import { gradeExam, type Answers } from "../lib/grading";
import { buildReport } from "../lib/report";
import type { Attempt } from "../lib/storage";
import {
  ATTEMPT_TIMEOUT_MS,
  MAX_ATTEMPTS,
  PENDING_PREFIX,
  RECEIPT_PREFIX,
  RETRY_DELAYS_MS,
  STATUS_AR,
  buildPayload,
  gradeLabel,
  hasReceipt,
  isPending,
  pendingKey,
  receiptKey,
  retryPending,
  sendWithRetry,
  type FetchLike,
  type SendOptions,
  type StorageLike,
  type SubmissionPayload,
} from "../lib/submit";

class MemStorage implements StorageLike {
  map = new Map<string, string>();
  get length() {
    return this.map.size;
  }
  key(i: number) {
    return [...this.map.keys()][i] ?? null;
  }
  getItem(k: string) {
    return this.map.has(k) ? this.map.get(k)! : null;
  }
  setItem(k: string, v: string) {
    this.map.set(k, String(v));
  }
  removeItem(k: string) {
    this.map.delete(k);
  }
  keys() {
    return [...this.map.keys()];
  }
}

interface Call {
  url: string;
  init: RequestInit;
  body: SubmissionPayload;
}

function fakeFetch(handler: (n: number, call: Call) => string | Promise<string>) {
  const calls: Call[] = [];
  const fn: FetchLike = async (url, init) => {
    const call: Call = { url, init, body: JSON.parse(String(init.body)) };
    calls.push(call);
    const text = await handler(calls.length, call);
    return { text: async () => text };
  };
  return { fn, calls };
}

function makeEnv(fetchImpl: FetchLike, storage: StorageLike | null = new MemStorage()) {
  const sleeps: number[] = [];
  const opts: SendOptions = {
    fetchImpl,
    storage,
    sleep: async (ms) => {
      sleeps.push(ms);
    },
  };
  return { opts, sleeps, storage };
}

function sampleAttempt(): { attempt: Attempt; payload: SubmissionPayload } {
  const answers: Answers = {};
  for (const { item } of ALL_ITEMS) answers[item.id] = item.answer;
  // Introduce one spelling mistake (half marks), one wrong answer, and one unanswered
  answers["Q1.1"] = "classrom"; // 2/4 spelling
  answers["Q4.1"] = "have to"; // 0/3 incorrect
  delete answers["Q6.1"]; // 0/1 unanswered

  const startedAt = Date.UTC(2026, 10, 25, 9, 0, 0);
  const submittedAt = startedAt + 654_321;
  const attempt: Attempt = {
    attemptId: "3f0c2a52-7d1e-4c58-9a6b-1f2e3d4c5b6a",
    studentName: "سارة أحمد",
    status: "submitted",
    startedAt,
    submittedAt,
    currentQuestion: 8,
    answers,
  };
  const result = gradeExam(answers);
  const reportText = buildReport({
    studentName: attempt.studentName,
    result,
    startedAt,
    submittedAt,
  });
  const payload = buildPayload({ attempt, result, reportText });
  return { attempt, payload };
}

describe("Google Sheets payload & mock delivery", () => {
  const origFetch = globalThis.fetch;
  let realFetchCalls = 0;

  beforeAll(() => {
    (globalThis as unknown as { fetch: unknown }).fetch = () => {
      realFetchCalls += 1;
      return Promise.reject(new Error("real fetch is disabled in tests"));
    };
  });

  afterAll(() => {
    (globalThis as unknown as { fetch: unknown }).fetch = origFetch;
    expect(realFetchCalls).toBe(0);
  });

  it("builds the exact reference payload structure", () => {
    const { attempt, payload } = sampleAttempt();
    expect(Object.keys(payload)).toEqual([
      "token",
      "attemptId",
      "examId",
      "examTitle",
      "studentName",
      "startAt",
      "submitAt",
      "elapsedSec",
      "summary",
      "lessons",
      "details",
      "reportText",
    ]);
    expect(payload.token).toBe(SHEETS_TOKEN);
    expect(payload.attemptId).toBe(attempt.attemptId);
    expect(payload.examId).toBe(EXAM_ID);
    expect(payload.examTitle).toBe(EXAM_TITLE);
    expect(payload.studentName).toBe("سارة أحمد");
    expect(payload.elapsedSec).toBe(654);

    expect(Object.keys(payload.summary)).toEqual([
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
    ]);
    expect(payload.summary.total).toBe(94);
    expect(payload.summary.max).toBe(TOTAL_MARKS);
    expect(payload.summary.percentage).toBe(94);
    expect(payload.summary.gradeLabel).toBe(gradeLabel(94));
    expect(payload.summary.partialSubparts).toBe(1);
    expect(payload.summary.wrongSubparts).toBe(1);
    expect(payload.summary.unansweredSubparts).toBe(1);
    expect(payload.summary.correctSubparts).toBe(TOTAL_ITEM_COUNT - 3);

    expect(payload.lessons).toHaveLength(QUESTIONS.length);
    expect(payload.lessons.reduce((s, l) => s + l.max, 0)).toBe(TOTAL_MARKS);
    expect(payload.lessons.reduce((s, l) => s + l.awarded, 0)).toBe(payload.summary.total);

    expect(payload.details).toHaveLength(TOTAL_ITEM_COUNT);
    expect(payload.details[0].status).toBe(STATUS_AR.spelling);
    expect(payload.details[0].awarded).toBe(2);
  });

  it("sends POST with text/plain;charset=utf-8 and succeeds on first try", async () => {
    const { payload, attempt } = sampleAttempt();
    const f = fakeFetch(() => JSON.stringify({ ok: true }));
    const e = makeEnv(f.fn);
    const ok = await sendWithRetry(payload, e.opts);
    expect(ok).toBe(true);
    expect(f.calls).toHaveLength(1);
    expect(f.calls[0].url).toBe(SHEETS_URL);
    expect(f.calls[0].init.method).toBe("POST");
    expect(f.calls[0].init.headers).toEqual({ "Content-Type": "text/plain;charset=utf-8" });
    expect(f.calls[0].init.redirect).toBe("follow");
    expect(e.sleeps).toEqual([]);
    expect(isPending(attempt.attemptId, e.opts)).toBe(false);
    expect(hasReceipt(attempt.attemptId, e.opts)).toBe(true);
    expect(e.storage!.getItem(receiptKey(attempt.attemptId))).not.toBeNull();
  });

  it("retries 3 times with 2s then 5s delays while reusing the exact attemptId", async () => {
    const { payload, attempt } = sampleAttempt();
    expect(RETRY_DELAYS_MS).toEqual([2000, 5000]);
    expect(MAX_ATTEMPTS).toBe(3);
    expect(ATTEMPT_TIMEOUT_MS).toBe(30000);

    const f = fakeFetch((n) => {
      if (n < 3) throw new TypeError("network error");
      return JSON.stringify({ ok: true, duplicate: true });
    });
    const e = makeEnv(f.fn);
    const ok = await sendWithRetry(payload, e.opts);
    expect(ok).toBe(true);
    expect(f.calls).toHaveLength(3);
    expect(e.sleeps).toEqual([2000, 5000]);
    expect(f.calls.every((c) => c.body.attemptId === attempt.attemptId)).toBe(true);
    expect(hasReceipt(attempt.attemptId, e.opts)).toBe(true);
  });

  it("saves pending payload on total failure and flushes via retryPending on reload", async () => {
    const { payload, attempt } = sampleAttempt();
    const store = new MemStorage();
    store.setItem("pending:other-exam:abc", '{"attemptId":"abc"}');

    const failFetch = fakeFetch(() => {
      throw new TypeError("offline");
    });
    const ok1 = await sendWithRetry(payload, makeEnv(failFetch.fn, store).opts);
    expect(ok1).toBe(false);
    expect(failFetch.calls).toHaveLength(3);
    expect(store.getItem(pendingKey(attempt.attemptId))).not.toBeNull();
    expect(PENDING_PREFIX).toBe(`pending:${EXAM_ID}:`);
    expect(RECEIPT_PREFIX).toBe(`sent:${EXAM_ID}:`);

    const okFetch = fakeFetch(() => JSON.stringify({ ok: true }));
    const flushed = await retryPending(makeEnv(okFetch.fn, store).opts);
    expect(flushed).toBe(1);
    expect(okFetch.calls).toHaveLength(1);
    expect(store.getItem(pendingKey(attempt.attemptId))).toBeNull();
    expect(store.getItem("pending:other-exam:abc")).toBe('{"attemptId":"abc"}');
    expect(hasReceipt(attempt.attemptId, { storage: store })).toBe(true);
  });

  it("aborts timed-out requests and saves pending payload", async () => {
    const { payload, attempt } = sampleAttempt();
    const signals: AbortSignal[] = [];
    const hungFetch: FetchLike = (_url, init) => {
      signals.push(init.signal as AbortSignal);
      return new Promise(() => {});
    };
    const e = makeEnv(hungFetch);
    const ok = await sendWithRetry(payload, { ...e.opts, timeoutMs: 10 });
    expect(ok).toBe(false);
    expect(signals).toHaveLength(3);
    expect(signals.every((s) => s.aborted)).toBe(true);
    expect(isPending(attempt.attemptId, e.opts)).toBe(true);
  });
});
