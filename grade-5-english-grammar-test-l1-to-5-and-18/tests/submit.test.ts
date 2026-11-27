import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EXAM_QUESTIONS } from "../src/exam/examData";
import type { Answers } from "../src/exam/examData";
import {
  buildPayload,
  pendingKey,
  retryPending,
  sendWithRetry,
  type SendOptions,
  type SubmissionPayload,
} from "../src/exam/submit";

const EXAM_ID = "grade-5-english-grammar-test-l1-to-5-and-18";

class FakeStorage {
  private store = new Map<string, string>();
  get length(): number {
    return this.store.size;
  }
  key(index: number): string | null {
    return [...this.store.keys()][index] ?? null;
  }
  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }
  removeItem(key: string): void {
    this.store.delete(key);
  }
}

const meta = {
  studentName: "Sara Student",
  startedAt: 1_700_000_000_000,
  submittedAt: 1_700_000_120_000,
  elapsedMs: 120_000,
};

function allCorrectAnswers(): Answers {
  return Object.fromEntries(
    EXAM_QUESTIONS.flatMap((question) =>
      question.branches.map((branch) => [
        branch.id,
        branch.variant === "order" ? branch.correct.split(" ") : branch.correct,
      ])
    )
  );
}

function payloadInput(overrides: Partial<{
  attemptId: string;
  answers: Answers;
}> = {}): Parameters<typeof buildPayload>[0] {
  return {
    attemptId: overrides.attemptId ?? "attempt-123",
    meta,
    order: EXAM_QUESTIONS,
    answers: overrides.answers ?? allCorrectAnswers(),
  };
}

// حالات الاختبار الوحدوية shared بين مجموعتي الاختبار أدناه
let storage: FakeStorage;
let requests: Array<{ url: string; init: RequestInit; body: string }>;
let sleeps: number[];

function fetchImpl(url: string, init: RequestInit): Promise<Pick<Response, "text">> {
  let body = "";
  if (init.body !== null && init.body !== undefined) body = String(init.body);
  requests.push({ url, init, body });
  return Promise.resolve({ text: () => Promise.resolve('{"ok": true}') });
}

function sendOptions(overrides: Partial<SendOptions> = {}): SendOptions {
  return {
    storage,
    fetchImpl,
    sleep: (ms) => {
      sleeps.push(ms);
      return Promise.resolve();
    },
    ...overrides,
  };
}

beforeEach(() => {
  storage = new FakeStorage();
  requests = [];
  sleeps = [];
  vi.stubGlobal("window", undefined);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("submission payload", () => {
  it("matches the reference contract: examId, examTitle, token, stable attemptId", () => {
    const payload = buildPayload(payloadInput());
    expect(payload.examId).toBe(EXAM_ID);
    expect(payload.examTitle).toBe("Grammar Test Lessons 1 to 5 and 18");
    expect(payload.token).toBe("7U25pymFzsSqmt8ejzPOTPTFJmSvj9Rm");
    expect(typeof payload.attemptId).toBe("string");
    expect(payload.attemptId.length).toBeGreaterThan(0);
  });

  it("uses the same scores as the result screen (100 max, all branches detailed)", () => {
    const payload = buildPayload(payloadInput());
    expect(payload.summary.max).toBe(100);
    expect(payload.summary.total).toBe(100);
    expect(payload.summary.percentage).toBe(100);
    expect(payload.summary.correctSubparts).toBe(71);
    expect(payload.summary.wrongSubparts).toBe(0);
    expect(payload.summary.unansweredSubparts).toBe(0);
    expect(payload.details).toHaveLength(71);
    expect(payload.lessons).toHaveLength(6);
    expect(payload.lessons.map((lesson) => lesson.title)).toEqual([
      "Lesson 1", "Lesson 2", "Lesson 3", "Lesson 4", "Lesson 5", "Lesson 18",
    ]);
    expect(payload.reportText).toContain("GRAMMAR TEST LESSONS 1 TO 5 AND 18");
    expect(payload.reportText).toContain("Final score: 100 / 100");
  });

  it("reports incorrect and unanswered branches separately", () => {
    const answers = allCorrectAnswers();
    answers["1a"] = "cooks";
    answers["10h"] = "";
    const payload = buildPayload(payloadInput({ answers }));
    const detail1a = payload.details.find((d) => d.q === 1 && d.label === "Identify the subject");
    expect(detail1a?.status).toBe("Incorrect");
    expect(detail1a?.studentAnswer).toBe("cooks");
    const detail10h = payload.details.find((d) => d.q === 10 && d.correctAnswer === "leaves");
    expect(detail10h?.status).toBe("Not answered");
    expect(payload.summary.wrongSubparts).toBe(1);
    expect(payload.summary.unansweredSubparts).toBe(1);
    expect(payload.summary.correctSubparts).toBe(69);
  });
});

describe("sendWithRetry with mock fetch", () => {
  it("sends once with text/plain charset utf-8 and accepts ok:true", async () => {
    const ok = await sendWithRetry(buildPayload(payloadInput()), sendOptions());
    expect(ok).toBe(true);
    expect(requests).toHaveLength(1);
    expect(requests[0].url).toContain("script.google.com");
    expect(
      (requests[0].init.headers as Record<string, string>)["Content-Type"]
    ).toBe("text/plain;charset=utf-8");
    expect(requests[0].init.method).toBe("POST");
    const body = JSON.parse(requests[0].body) as SubmissionPayload;
    expect(body.examId).toBe(EXAM_ID);
    expect(body.studentName).toBe("Sara Student");
    expect(body.details).toHaveLength(71);
    expect(storage.getItem(pendingKey("attempt-123"))).toBeNull();
  });

  it("treats duplicate:true as accepted (stable attemptId on resend)", async () => {
    let calls = 0;
    const flaky = (url: string, init: RequestInit) => {
      calls++;
      requests.push({ url, init, body: String(init.body) });
      if (calls === 1) return Promise.resolve({ text: () => Promise.resolve('{"ok": false}') });
      return Promise.resolve({ text: () => Promise.resolve('{"duplicate": true}') });
    };
    const ok = await sendWithRetry(
      buildPayload(payloadInput()),
      sendOptions({ fetchImpl: flaky })
    );
    expect(ok).toBe(true);
    expect(calls).toBe(2);
    const first = JSON.parse(requests[0].body) as SubmissionPayload;
    const second = JSON.parse(requests[1].body) as SubmissionPayload;
    expect(first.attemptId).toBe(second.attemptId);
  });

  it("retries up to 3 attempts with 2s then 5s delays when all fail", async () => {
    const failing = (url: string, init: RequestInit) => {
      requests.push({ url, init, body: String(init.body) });
      return Promise.resolve({ text: () => Promise.resolve("network error") });
    };
    const ok = await sendWithRetry(
      buildPayload(payloadInput()),
      sendOptions({ fetchImpl: failing })
    );
    expect(ok).toBe(false);
    expect(requests).toHaveLength(3);
    expect(sleeps).toEqual([2000, 5000]);
    expect(storage.getItem(pendingKey("attempt-123"))).not.toBeNull();
    const saved = JSON.parse(storage.getItem(pendingKey("attempt-123"))!) as SubmissionPayload;
    expect(saved.examId).toBe(EXAM_ID);
    expect(saved.attemptId).toBe("attempt-123");
  });

  it("does not save pending when the server accepts", async () => {
    await sendWithRetry(buildPayload(payloadInput()), sendOptions());
    expect(storage.getItem(pendingKey("attempt-123"))).toBeNull();
  });

  it("never throws on network failure", async () => {
    const boom = (): Promise<Pick<Response, "text">> => {
      throw new Error("offline");
    };
    const ok = await sendWithRetry(buildPayload(payloadInput()), sendOptions({ fetchImpl: boom }));
    expect(ok).toBe(false);
  });
});

describe("retryPending (auto-resend of suspended submissions)", () => {
  let sentBodies: string[];

  beforeEach(() => {
    storage = new FakeStorage();
    sentBodies = [];
    vi.stubGlobal("window", undefined);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("resends pending payloads for this exam and removes them on success", async () => {
    const payload = buildPayload(payloadInput());
    storage.setItem(pendingKey(payload.attemptId), JSON.stringify(payload));
    storage.setItem("pending:other-exam:abc", JSON.stringify(payload));

    let calls = 0;
    const okFetch = (_url: string, init: RequestInit) => {
      calls++;
      sentBodies.push(String(init.body));
      return Promise.resolve({ text: () => Promise.resolve('{"ok": true}') });
    };

    const sent = await retryPending(sendOptions({ storage, fetchImpl: okFetch }));
    expect(sent).toBe(1);
    expect(calls).toBe(1);
    expect(storage.getItem(pendingKey(payload.attemptId))).toBeNull();
    expect(storage.getItem("pending:other-exam:abc")).not.toBeNull();
  });

  it("keeps pending payloads when the server keeps failing", async () => {
    const payload = buildPayload(payloadInput());
    storage.setItem(pendingKey(payload.attemptId), JSON.stringify(payload));
    const failFetch = () => Promise.resolve({ text: () => Promise.resolve('{"ok": false}') });
    const sent = await retryPending(sendOptions({ storage, fetchImpl: failFetch }));
    expect(sent).toBe(0);
    expect(storage.getItem(pendingKey(payload.attemptId))).not.toBeNull();
  });
});
