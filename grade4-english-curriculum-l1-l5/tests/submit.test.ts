/**
 * Delivery tests — Mock Server only. No test ever contacts Google Apps Script / Sheets.
 *   a) real HTTP round-trip to a local mock server (127.0.0.1) with the exact POST contract;
 *   b) connection failure, 3 attempts, 2s/5s delays, 30s-per-attempt timeout;
 *   c) localStorage save / restore / automatic re-send / manual resend / de-duplication;
 *   d) pagehide & visibilitychange while a send is in flight;
 *   e) a guard that fails the suite if the real fetch is ever called.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { EXAM_ID, SHEETS_TOKEN, SHEETS_URL } from "../src/config";
import { gradeExam } from "../src/logic/grading";
import { buildReport } from "../src/logic/report";
import {
  MAX_ATTEMPTS, PENDING_PREFIX, buildPayload, pendingKey, retryPending, sendWithRetry,
  type FetchLike, type SendOptions, type StorageLike, type SubmissionPayload,
} from "../src/logic/submit";
import type { AnswerMap } from "../src/types";
import { brokenStorage, deepEqual, fixture, MemStorage } from "./helpers";
import { forwardTo, MockSheetsServer } from "./mock-server";

process.env.TZ = "UTC";

const nativeFetch = globalThis.fetch;
let realFetchCalls = 0;

const golden = fixture("grading-golden.json");
const ATTEMPT = "4a7b1c02-5d6e-7f80-91a2-b3c4d5e6f708";
const START = Date.UTC(2026, 10, 16, 9, 0, 5, 250);
const SUBMIT = Date.UTC(2026, 10, 16, 9, 20, 38, 900);
const answers = golden.mixed.answers as AnswerMap;
const result = gradeExam(answers, "Ahmad Saleh Haddad", START, SUBMIT);
const report = buildReport(result);
const payload: SubmissionPayload = buildPayload({ attemptId: ATTEMPT, result, answers, reportText: report });

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

/** Programmable fake fetch (no sockets) for failure/timeout cases. */
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

describe("4. Mock Server: real HTTP POST with the reference contract", () => {
  it("one success: POST, text/plain;charset=utf-8, exact body, one stored row, no pending", async () => {
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
    expect(server.posts[0].json.token).toBe(SHEETS_TOKEN);
    expect(server.rows.size).toBe(1);
    expect(deepEqual(server.posts[0].json, payload)).toBe(true);
    expect(e.storage!.length).toBe(0);
    expect(e.sleeps).toEqual([]);
  });

  it("a lost first reply is retried with the SAME attemptId, and re-sending never duplicates the row", async () => {
    server.reset();
    server.queue = ["reset"]; // first connection killed without a reply
    const { fetchImpl, calls } = forwardTo(server, nativeFetch);
    const e = env(fetchImpl);
    expect(await sendWithRetry(payload, e.opts)).toBe(true);
    expect(calls).toHaveLength(2);
    expect(e.sleeps).toEqual([2000]);
    expect(calls.every((c) => JSON.parse(String(c.init.body)).attemptId === ATTEMPT)).toBe(true);
    expect(server.rows.size).toBe(1);

    // "Resend Result" for the same attempt: the mock answers duplicate:true, no new row.
    const again = env(fetchImpl);
    expect(await sendWithRetry(payload, again.opts)).toBe(true);
    expect(server.rows.size).toBe(1);
    expect(server.posts.every((p) => p.json.attemptId === ATTEMPT)).toBe(true);
  });

  it("only ok:true or duplicate:true count as acceptance", async () => {
    for (const reply of ['{"ok":false}', "null", '["ok"]', '"ok"', "not json", "", "<html>sign in</html>"]) {
      const f = fakeFetch(() => reply);
      const e = env(f.fn);
      expect(await sendWithRetry(payload, e.opts), `reply: ${reply || "empty"}`).toBe(false);
      expect(f.calls).toHaveLength(MAX_ATTEMPTS);
      expect(e.storage!.length).toBe(1);
    }
    const dup = fakeFetch(() => '{"duplicate":true}');
    const okDup = await sendWithRetry(payload, env(dup.fn).opts);
    expect(okDup).toBe(true);
    expect(dup.calls).toHaveLength(1);
  });
});

describe("5. connection failure, retries, timeout and local storage", () => {
  it("3 attempts, 2s then 5s delays, then pending:<EXAM_ID>:<attemptId> with the full payload", async () => {
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
    expect(sizes).toEqual([0, 0, 0]); // nothing saved before all attempts fail
    expect(store.keys()).toEqual([`pending:${EXAM_ID}:${ATTEMPT}`]);
    expect(deepEqual(JSON.parse(store.getItem(pendingKey(ATTEMPT))!), payload)).toBe(true);
  });

  it("a hung request times out, is aborted, and the payload is saved for later", async () => {
    const signals: AbortSignal[] = [];
    const fn: FetchLike = (_url, init) => {
      signals.push(init.signal as AbortSignal);
      return new Promise(() => {}); // never answers
    };
    const e = env(fn);
    e.opts.timeoutMs = 20;
    expect(await sendWithRetry(payload, e.opts)).toBe(false);
    expect(signals).toHaveLength(3);
    expect(signals.every((s) => s.aborted)).toBe(true);
    expect(e.storage!.getItem(pendingKey(ATTEMPT))).not.toBeNull();
    expect(e.sleeps).toEqual([2000, 5000]);
  });

  it("a slow reply inside the timeout succeeds on the first attempt", async () => {
    const f = fakeFetch(async () => {
      await new Promise((r) => setTimeout(r, 20));
      return OK;
    });
    const e = env(f.fn);
    e.opts.timeoutMs = 2000;
    expect(await sendWithRetry(payload, e.opts)).toBe(true);
    expect(f.calls).toHaveLength(1);
    expect(e.storage!.length).toBe(0);
  });

  it("missing or broken storage never throws and never blocks the result", async () => {
    const f = fakeFetch(netDown);
    const g = fakeFetch(() => OK);
    let threw = false;
    const r: boolean[] = [];
    try {
      r.push(await sendWithRetry(payload, env(f.fn, null).opts));
      r.push(await sendWithRetry(payload, env(f.fn, brokenStorage as unknown as StorageLike).opts));
      const noWindow = env(f.fn).opts;
      delete noWindow.storage; // node environment: no window.localStorage
      r.push(await sendWithRetry(payload, noWindow));
      r.push(await sendWithRetry(payload, env(g.fn, brokenStorage as unknown as StorageLike).opts));
    } catch {
      threw = true;
    }
    expect(threw).toBe(false);
    expect(r).toEqual([false, false, false, true]);
  });
});

describe("6. restore / automatic re-send / resend / de-duplication", () => {
  it("re-sends only THIS exam's pending rows, deletes only the delivered ones", async () => {
    const store = new MemStorage();
    const older: SubmissionPayload = { ...payload, attemptId: "older-attempt-0002", studentName: "Layan Mohammad" };
    store.setItem(pendingKey(older.attemptId), JSON.stringify(older));
    store.setItem(pendingKey(ATTEMPT), JSON.stringify({ ...payload, token: "stale-token" }));
    store.setItem("pending:another-exam:abc", '{"attemptId":"abc"}');
    store.setItem("theme", "dark");
    store.setItem(pendingKey("corrupt"), "{not json");
    const before = store.keys().slice().sort();

    // (1) server still down: nothing delivered, nothing deleted
    const down = fakeFetch(netDown);
    const sent0 = await retryPending(env(down.fn, store).opts);
    expect(sent0).toBe(0);
    expect(store.keys().slice().sort()).toEqual(before);
    expect(down.calls).toHaveLength(6); // 3 attempts for each of the 2 valid rows
    expect(new Set(down.calls.map((c) => c.body.attemptId))).toEqual(new Set([ATTEMPT, older.attemptId]));

    // (2) server accepts only the older attempt
    const selective = fakeFetch((_u, _i, n) => {
      const id = JSON.parse(String(_i.body)).attemptId;
      return JSON.stringify({ ok: id === older.attemptId });
    });
    const sent1 = await retryPending(env(selective.fn, store).opts);
    expect(sent1).toBe(1);
    expect(store.getItem(pendingKey(older.attemptId))).toBeNull();
    expect(store.getItem(pendingKey(ATTEMPT))).not.toBeNull();

    // (3) server up: the remaining row is sent with the CURRENT token (not the stale one)
    server.reset();
    const { fetchImpl, calls } = forwardTo(server, nativeFetch);
    const e3 = env(fetchImpl, store);
    const sent2 = await retryPending(e3.opts);
    expect(sent2).toBe(1);
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe(SHEETS_URL);
    expect(calls[0].init.headers).toEqual({ "Content-Type": "text/plain;charset=utf-8" });
    expect(server.posts[0].json.token).toBe(SHEETS_TOKEN);
    expect(deepEqual(server.posts[0].json, payload)).toBe(true);
    expect(store.getItem(pendingKey(ATTEMPT))).toBeNull();
    expect(store.getItem("pending:another-exam:abc")).toBe('{"attemptId":"abc"}');
    expect(store.getItem("theme")).toBe("dark");
    expect(e3.sleeps).toEqual([]); // no waiting when the first attempt succeeds
    expect(PENDING_PREFIX).toBe(`pending:${EXAM_ID}:`);

    // (4) nothing pending any more
    const idle = fakeFetch(() => OK);
    expect(await retryPending(env(idle.fn, store).opts)).toBe(0);
    expect(idle.calls).toHaveLength(0);
  });

  it("two simultaneous loads (StrictMode) flush once, not twice", async () => {
    const store = new MemStorage();
    store.setItem(pendingKey(ATTEMPT), JSON.stringify(payload));
    const f = fakeFetch(() => OK);
    const opts = env(f.fn, store).opts;
    const [a, b] = await Promise.all([retryPending(opts), retryPending(opts)]);
    expect([a, b]).toEqual([1, 1]);
    expect(f.calls).toHaveLength(1);
    expect(store.length).toBe(0);
  });

  it("a manual resend of the same attemptId keeps one row (server de-duplicates)", async () => {
    server.reset();
    const { fetchImpl } = forwardTo(server, nativeFetch);
    const first = await sendWithRetry(payload, env(fetchImpl).opts);
    const second = await sendWithRetry(payload, env(fetchImpl).opts);
    expect(first).toBe(true);
    expect(second).toBe(true);
    expect(server.rows.size).toBe(1);
    expect(server.posts).toHaveLength(2);
  });
});

describe("7. saving when the page is hidden/closed mid-send", () => {
  it("pagehide and hidden visibility persist the in-flight payload; success removes it", async () => {
    const g = globalThis as any;
    const win = new EventTarget();
    const doc = Object.assign(new EventTarget(), { visibilityState: "visible" });
    g.window = win;
    g.document = doc;
    try {
      const store = new MemStorage();
      let reply: (text: string) => void = () => {};
      const fn: FetchLike = () =>
        new Promise((resolve) => {
          reply = (text) => resolve({ text: async () => text });
        });
      const pending = sendWithRetry(payload, env(fn, store).opts);
      await new Promise((r) => setTimeout(r, 5));
      expect(store.length).toBe(0);

      doc.dispatchEvent(new Event("visibilitychange"));
      expect(store.length).toBe(0); // still visible
      doc.visibilityState = "hidden";
      doc.dispatchEvent(new Event("visibilitychange"));
      expect(store.keys()).toEqual([pendingKey(ATTEMPT)]);
      expect(deepEqual(JSON.parse(store.getItem(pendingKey(ATTEMPT))!), payload)).toBe(true);

      store.removeItem(pendingKey(ATTEMPT));
      win.dispatchEvent(new Event("pagehide"));
      expect(store.keys()).toEqual([pendingKey(ATTEMPT)]);

      reply(OK);
      expect(await pending).toBe(true);
      expect(store.length).toBe(0);
      win.dispatchEvent(new Event("pagehide"));
      doc.dispatchEvent(new Event("visibilitychange"));
      expect(store.length).toBe(0);
    } finally {
      delete g.window;
      delete g.document;
    }
  });
});

describe("8. no real network", () => {
  it("the real fetch was never called (Mock Server / injected fetch only)", () => {
    expect(realFetchCalls).toBe(0);
    expect(SHEETS_URL).toContain("script.google.com"); // configured, but never contacted
  });
});
