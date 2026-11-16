/**
 * Delivery tests — Mock Server (127.0.0.1) & injected fetch only.
 * Real Google Sheets / Apps Script is NEVER contacted.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { EXAM_ID, SHEETS_TOKEN, SHEETS_URL } from "../src/config";
import { QUESTIONS } from "../src/data/examData";
import { gradeFullExam } from "../src/logic/grading";
import { buildTextReport } from "../src/logic/report";
import {
  MAX_ATTEMPTS,
  PENDING_PREFIX,
  buildPayload,
  pendingKey,
  retryPending,
  sendWithRetry,
  type FetchLike,
  type SendOptions,
  type StorageLike,
  type SubmissionPayload,
} from "../src/logic/submit";
import type { AnswersMap, ExamSession } from "../src/types";
import { MemStorage, brokenStorage, deepEqual } from "./helpers";
import { MockSheetsServer, forwardTo } from "./mock-server";

const nativeFetch = globalThis.fetch;
let realFetchCalls = 0;

function completeAnswers(): AnswersMap {
  const map: AnswersMap = {};
  for (const q of QUESTIONS) {
    map[q.id] = {};
    for (const p of q.parts) {
      if (p.kind === "mcq" || p.kind === "select") map[q.id][p.id] = p.correctOptionId!;
      else if (p.kind === "tf") map[q.id][p.id] = String(p.correctBool);
      else if (p.kind === "text") map[q.id][p.id] = p.accepted![0];
      else if (p.kind === "order") map[q.id][p.id] = ["t3", "t4", "t1", "t5", "t2"];
      else if (p.kind === "writing") map[q.id][p.id] = "There is a library in my school.";
    }
  }
  return map;
}

const ATTEMPT = "4a7b1c02-5d6e-7f80-91a2-b3c4d5e6f708";
const START = Date.UTC(2026, 10, 16, 9, 0, 5, 250);
const SUBMIT = Date.UTC(2026, 10, 16, 9, 20, 38, 900);
const answers = completeAnswers();
const session: ExamSession = {
  version: 1,
  studentName: "Mira Samer",
  startedAt: START,
  currentQuestion: 35,
  answers,
  submitted: true,
  submittedAt: SUBMIT,
  finalElapsedMs: SUBMIT - START,
  attemptId: ATTEMPT,
};
const result = gradeFullExam(answers);
const report = buildTextReport(session, result);
const payload: SubmissionPayload = buildPayload({
  attemptId: ATTEMPT,
  session,
  result,
  reportText: report,
});

const server = new MockSheetsServer(SHEETS_TOKEN);

function env(fetchImpl?: FetchLike, storage: StorageLike | null = new MemStorage()) {
  const sleeps: number[] = [];
  const opts: SendOptions = {
    fetchImpl,
    storage,
    sleep: async (ms: number) => {
      sleeps.push(ms);
    },
    timeoutMs: 500,
  };
  return { opts, sleeps, storage };
}

function fakeFetch(responder: (url: string, init: RequestInit, call: number) => string | Promise<string>) {
  const calls: { url: string; init: RequestInit; body: any }[] = [];
  const fn: FetchLike = async (url, init) => {
    const body = JSON.parse(String(init.body));
    calls.push({ url, init, body });
    const text = await responder(url, init, calls.length);
    return { text: async () => text };
  };
  return { fn, calls };
}

const netDown = (): string => {
  throw new Error("network down (mock)");
};
const OK = '{"ok":true}';

beforeAll(async () => {
  globalThis.fetch = (() => {
    realFetchCalls++;
    return Promise.reject(new Error("real fetch is disabled in tests"));
  }) as unknown as typeof fetch;
  await server.start();
});

afterAll(async () => {
  await server.stop();
  globalThis.fetch = nativeFetch;
});

describe("4. Mock Server: HTTP POST with exact contract", () => {
  it("succeeds on first POST with text/plain;charset=utf-8, stores 1 row, leaves no pending entry", async () => {
    server.reset();
    const { fetchImpl, calls } = forwardTo(server, nativeFetch);
    const e = env(fetchImpl);
    expect(await sendWithRetry(payload, e.opts)).toBe(true);
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe(SHEETS_URL);
    expect(calls[0].init.method).toBe("POST");
    expect(calls[0].init.headers).toEqual({ "Content-Type": "text/plain;charset=utf-8" });
    expect(calls[0].init.redirect).toBe("follow");
    expect(server.posts).toHaveLength(1);
    expect(server.posts[0].contentType).toBe("text/plain;charset=utf-8");
    expect(server.rows.size).toBe(1);
    expect(deepEqual(server.posts[0].json, payload)).toBe(true);
    expect(e.storage!.length).toBe(0);
    expect(e.sleeps).toEqual([]);
  });

  it("retries lost reply with the SAME attemptId and de-duplicates manual resend", async () => {
    server.reset();
    server.queue = ["reset"];
    const { fetchImpl, calls } = forwardTo(server, nativeFetch);
    const e = env(fetchImpl);
    expect(await sendWithRetry(payload, e.opts)).toBe(true);
    expect(calls).toHaveLength(2);
    expect(e.sleeps).toEqual([2000]);
    expect(calls.every((c) => JSON.parse(String(c.init.body)).attemptId === ATTEMPT)).toBe(true);
    expect(server.rows.size).toBe(1);

    const again = env(fetchImpl);
    expect(await sendWithRetry(payload, again.opts)).toBe(true);
    expect(server.rows.size).toBe(1);
  });

  it("treats only ok:true or duplicate:true as accepted", async () => {
    for (const reply of ['{"ok":false}', "null", '["ok"]', '"ok"', "not json", "", "<html>login</html>"]) {
      const f = fakeFetch(() => reply);
      const e = env(f.fn);
      expect(await sendWithRetry(payload, e.opts), `reply=${reply}`).toBe(false);
      expect(f.calls).toHaveLength(MAX_ATTEMPTS);
      expect(e.storage!.length).toBe(1);
    }
    const dup = fakeFetch(() => '{"duplicate":true}');
    expect(await sendWithRetry(payload, env(dup.fn).opts)).toBe(true);
    expect(dup.calls).toHaveLength(1);
  });
});

describe("5. failure, 3 retries (2s/5s), 30s timeout and localStorage fallback", () => {
  it("attempts 3 times with 2000ms then 5000ms delays before storing pending payload", async () => {
    const sizes: number[] = [];
    const store = new MemStorage();
    const f = fakeFetch(() => {
      sizes.push(store.length);
      return netDown();
    });
    const e = env(f.fn, store);
    expect(await sendWithRetry(payload, e.opts)).toBe(false);
    expect(f.calls).toHaveLength(3);
    expect(e.sleeps).toEqual([2000, 5000]);
    expect(sizes).toEqual([0, 0, 0]);
    expect(store.keys()).toEqual([`pending:${EXAM_ID}:${ATTEMPT}`]);
    expect(deepEqual(JSON.parse(store.getItem(pendingKey(ATTEMPT))!), payload)).toBe(true);
  });

  it("aborts timed-out requests across all 3 attempts and persists payload", async () => {
    const signals: AbortSignal[] = [];
    const fn: FetchLike = (_url, init) => {
      signals.push(init.signal as AbortSignal);
      return new Promise(() => {});
    };
    const e = env(fn);
    e.opts.timeoutMs = 20;
    expect(await sendWithRetry(payload, e.opts)).toBe(false);
    expect(signals).toHaveLength(3);
    expect(signals.every((s) => s.aborted)).toBe(true);
    expect(e.storage!.getItem(pendingKey(ATTEMPT))).not.toBeNull();
    expect(e.sleeps).toEqual([2000, 5000]);
  });

  it("never throws when storage is null or broken", async () => {
    const down = fakeFetch(netDown);
    const up = fakeFetch(() => OK);
    expect(await sendWithRetry(payload, env(down.fn, null).opts)).toBe(false);
    expect(await sendWithRetry(payload, env(down.fn, brokenStorage).opts)).toBe(false);
    expect(await sendWithRetry(payload, env(up.fn, brokenStorage).opts)).toBe(true);
  });
});

describe("6. automatic retryPending, selective cleanup & pagehide persistence", () => {
  it("flushes only pending keys of THIS exam, removes delivered ones and preserves other exams", async () => {
    const store = new MemStorage();
    const older: SubmissionPayload = { ...payload, attemptId: "older-attempt-0002", studentName: "Lina Ahmad" };
    store.setItem(pendingKey(older.attemptId), JSON.stringify(older));
    store.setItem(pendingKey(ATTEMPT), JSON.stringify({ ...payload, token: "stale-token" }));
    store.setItem("pending:other-exam:xyz", '{"attemptId":"xyz"}');
    store.setItem(pendingKey("corrupt"), "{not json");

    const down = fakeFetch(netDown);
    expect(await retryPending(env(down.fn, store).opts)).toBe(0);
    expect(store.getItem(pendingKey(ATTEMPT))).not.toBeNull();

    const selective = fakeFetch((_u, init) => {
      const id = JSON.parse(String(init.body)).attemptId;
      return JSON.stringify({ ok: id === older.attemptId });
    });
    expect(await retryPending(env(selective.fn, store).opts)).toBe(1);
    expect(store.getItem(pendingKey(older.attemptId))).toBeNull();
    expect(store.getItem(pendingKey(ATTEMPT))).not.toBeNull();

    server.reset();
    const { fetchImpl } = forwardTo(server, nativeFetch);
    expect(await retryPending(env(fetchImpl, store).opts)).toBe(1);
    expect(server.posts[0].json.token).toBe(SHEETS_TOKEN);
    expect(deepEqual(server.posts[0].json, payload)).toBe(true);
    expect(store.getItem(pendingKey(ATTEMPT))).toBeNull();
    expect(store.getItem("pending:other-exam:xyz")).toBe('{"attemptId":"xyz"}');
    expect(PENDING_PREFIX).toBe(`pending:${EXAM_ID}:`);
  });

  it("deduplicates simultaneous retryPending calls", async () => {
    const store = new MemStorage();
    store.setItem(pendingKey(ATTEMPT), JSON.stringify(payload));
    const f = fakeFetch(() => OK);
    const opts = env(f.fn, store).opts;
    const [a, b] = await Promise.all([retryPending(opts), retryPending(opts)]);
    expect([a, b]).toEqual([1, 1]);
    expect(f.calls).toHaveLength(1);
    expect(store.length).toBe(0);
  });

  it("persists mid-flight payload on pagehide/visibilitychange and removes on success", async () => {
    const g = globalThis as any;
    const win = new EventTarget();
    const doc = Object.assign(new EventTarget(), { visibilityState: "visible" });
    g.window = win;
    g.document = doc;
    try {
      const store = new MemStorage();
      let resolvePost: (t: string) => void = () => {};
      const fn: FetchLike = () =>
        new Promise((resolve) => {
          resolvePost = (t) => resolve({ text: async () => t });
        });
      const pending = sendWithRetry(payload, env(fn, store).opts);
      await new Promise((r) => setTimeout(r, 5));

      doc.visibilityState = "hidden";
      doc.dispatchEvent(new Event("visibilitychange"));
      expect(store.keys()).toEqual([pendingKey(ATTEMPT)]);

      store.removeItem(pendingKey(ATTEMPT));
      win.dispatchEvent(new Event("pagehide"));
      expect(store.keys()).toEqual([pendingKey(ATTEMPT)]);

      resolvePost(OK);
      expect(await pending).toBe(true);
      expect(store.length).toBe(0);
    } finally {
      delete g.window;
      delete g.document;
    }
  });
});

describe("7. real network guard", () => {
  it("real globalThis.fetch was never called", () => {
    expect(realFetchCalls).toBe(0);
  });
});
