/**
 * Google Sheets delivery contract — MOCK FETCH ONLY.
 *
 * The real Apps Script endpoint is never contacted from this test suite: every
 * test injects a mock `fetch`, so no result can ever reach a real spreadsheet.
 */
import { describe, expect, it, vi } from "vitest";

import { EXAM_ID, EXAM_TITLE, SHEETS_TOKEN, SHEETS_URL } from "@/config";
import { QUESTIONS } from "@/data/exam";
import { MUTE_KEY, STORAGE_KEY, newAttemptId, type Attempt } from "@/lib/attempt";
import { gradeExam } from "@/lib/grading";
import { buildReport } from "@/lib/report";
import {
  ATTEMPT_TIMEOUT_MS,
  MAX_ATTEMPTS,
  PENDING_PREFIX,
  RECEIPT_PREFIX,
  RETRY_DELAYS_MS,
  buildPayload,
  gradeLabel,
  gradeLabelEn,
  hasReceipt,
  isPending,
  pendingKey,
  receiptKey,
  retryPending,
  sendWithRetry,
  type SendOptions,
  type StorageLike,
  type SubmissionPayload,
} from "@/lib/submit";

function memoryStorage(): StorageLike & { map: Map<string, string> } {
  const map = new Map<string, string>();
  return {
    map,
    get length() {
      return map.size;
    },
    key: (i) => Array.from(map.keys())[i] ?? null,
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => void map.set(k, v),
    removeItem: (k) => void map.delete(k),
  };
}

function makeAttempt(overrides: Partial<Attempt> = {}): Attempt {
  return {
    v: 1,
    attemptId: "attempt-25q-under-test",
    name: "Layla Ahmad",
    answers: {},
    startedAt: Date.UTC(2026, 4, 12, 9, 0, 0),
    currentIndex: 0,
    submittedAt: Date.UTC(2026, 4, 12, 9, 25, 0),
    ...overrides,
  };
}

function fullKey(): Record<string, string> {
  const key: Record<string, string> = {};
  for (const q of QUESTIONS) {
    for (const it of q.items) {
      key[`${q.id}/${it.id}`] = it.answer;
    }
  }
  return key;
}

function payloadFor(attempt: Attempt): SubmissionPayload {
  const result = gradeExam(attempt.answers, attempt.name);
  const reportText = buildReport(attempt, result);
  return buildPayload({ attempt, result, questions: QUESTIONS, reportText });
}

function mockFetch(replies: (string | Error)[]) {
  const calls: { url: string; init: RequestInit }[] = [];
  let index = 0;
  const impl = vi.fn((url: string, init: RequestInit) => {
    calls.push({ url, init });
    const reply = replies[Math.min(index, replies.length - 1)];
    index += 1;
    if (reply instanceof Error) return Promise.reject(reply);
    return Promise.resolve({ ok: true, text: () => Promise.resolve(reply) } as Response);
  });
  return { impl, calls };
}

const noSleep = () => Promise.resolve();

describe("Submission payload — reference contract", () => {
  const attempt = makeAttempt({ answers: fullKey() });
  const payload = payloadFor(attempt);

  it("carries every field of the reference contract", () => {
    expect(Object.keys(payload).sort()).toEqual(
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
  });

  it("carries this exam's exact EXAM_ID, EXAM_TITLE, endpoint and token", () => {
    expect(payload.examId).toBe(EXAM_ID);
    expect(payload.examId).toBe("grade5-english-curriculum-exam-l1-5-25q-a");
    expect(payload.examTitle).toBe(EXAM_TITLE);
    expect(payload.examTitle).toBe("Grade 5 English Curriculum Exam L1-5 (25Q) A");
    expect(payload.token).toBe(SHEETS_TOKEN);
    expect(SHEETS_URL).toBe(
      "https://script.google.com/macros/s/AKfycbwqv4hE1AFy73L7MhyhFwXx0nl4QF5-Nme5jvP-ank-BY_LQr91xA8A_IiQqMuTdh8B/exec",
    );
    expect(SHEETS_TOKEN).toBe("7U25pymFzsSqmt8ejzPOTPTFJmSvj9Rm");
  });

  it("sends accurate timestamps and elapsedSec", () => {
    expect(payload.startAt).toBe("2026-05-12T09:00:00.000Z");
    expect(payload.submitAt).toBe("2026-05-12T09:25:00.000Z");
    expect(payload.elapsedSec).toBe(1500);
  });

  it("summarises full, partial, wrong and unanswered counts accurately", () => {
    expect(payload.summary).toEqual({
      total: 100,
      max: 100,
      percentage: 100,
      gradeLabel: "ممتاز",
      fullQuestions: 25,
      partialQuestions: 0,
      wrongQuestions: 0,
      correctSubparts: 98,
      partialSubparts: 0,
      wrongSubparts: 0,
      unansweredSubparts: 0,
    });

    const mixedAnswers = fullKey();
    mixedAnswers["q01/q01a"] = "wrong-word"; // q01 -> partial (3/4)
    delete mixedAnswers["q02/q02a"];
    delete mixedAnswers["q02/q02b"];
    delete mixedAnswers["q02/q02c"];
    delete mixedAnswers["q02/q02d"]; // q02 -> wrong question (0/4, 4 unanswered)
    const mixed = payloadFor(makeAttempt({ answers: mixedAnswers }));

    expect(mixed.summary.total).toBe(95);
    expect(mixed.summary.fullQuestions).toBe(23);
    expect(mixed.summary.partialQuestions).toBe(1);
    expect(mixed.summary.wrongQuestions).toBe(1);
    expect(mixed.summary.correctSubparts).toBe(93);
    expect(mixed.summary.wrongSubparts).toBe(1);
    expect(mixed.summary.unansweredSubparts).toBe(4);
  });

  it("lists all 5 lessons (20 marks each) and all 98 detail rows in paper order", () => {
    expect(payload.lessons).toHaveLength(5);
    expect(payload.lessons.map((l) => l.title)).toEqual([
      "Lesson 1 — At School",
      "Lesson 2 — Family",
      "Lesson 3 — Daily Routines",
      "Lesson 4 — The Five Senses",
      "Lesson 5 — Clothes",
    ]);
    for (const lesson of payload.lessons) {
      expect(lesson.awarded).toBe(20);
      expect(lesson.max).toBe(20);
    }

    expect(payload.details).toHaveLength(98);
    expect(payload.details[0]).toMatchObject({
      q: 1,
      label: "a",
      status: "إجابة صحيحة",
      awarded: 1,
      marks: 1,
    });
    const q18Rows = payload.details.filter((d) => d.q === 18);
    expect(q18Rows).toHaveLength(2);
    expect(q18Rows.every((r) => r.marks === 2 && r.awarded === 2)).toBe(true);
  });

  it("uses the platform grade scale", () => {
    expect(gradeLabel(95)).toBe("ممتاز");
    expect(gradeLabel(85)).toBe("جيد جداً");
    expect(gradeLabel(75)).toBe("جيد");
    expect(gradeLabel(65)).toBe("مقبول");
    expect(gradeLabel(50)).toBe("ضعيف");
    expect(gradeLabel(49.9)).toBe("يحتاج إلى دعم");

    expect(gradeLabelEn(95)).toBe("Excellent");
    expect(gradeLabelEn(85)).toBe("Very Good");
    expect(gradeLabelEn(75)).toBe("Good");
    expect(gradeLabelEn(65)).toBe("Acceptable");
    expect(gradeLabelEn(50)).toBe("Weak");
    expect(gradeLabelEn(49.9)).toBe("Needs support");
  });
});

describe("Delivery — mock fetch only", () => {
  it("POSTs text/plain;charset=utf-8 with redirect=follow to SHEETS_URL", async () => {
    const { impl, calls } = mockFetch(['{"ok":true}']);
    const storage = memoryStorage();
    const payload = payloadFor(makeAttempt());

    const ok = await sendWithRetry(payload, { fetchImpl: impl, storage, sleep: noSleep });
    expect(ok).toBe(true);
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe(SHEETS_URL);
    expect(calls[0].init.method).toBe("POST");
    expect(calls[0].init.redirect).toBe("follow");
    expect((calls[0].init.headers as Record<string, string>)["Content-Type"]).toBe(
      "text/plain;charset=utf-8",
    );
  });

  it("retries 3 times with 2 s then 5 s delays and 30 s per-attempt timeout", async () => {
    const { impl, calls } = mockFetch([new Error("network down")]);
    const storage = memoryStorage();
    const delays: number[] = [];
    const payload = payloadFor(makeAttempt({ attemptId: "stable-retry-id" }));

    const ok = await sendWithRetry(payload, {
      fetchImpl: impl,
      storage,
      sleep: (ms) => {
        delays.push(ms);
        return Promise.resolve();
      },
    });

    expect(ok).toBe(false);
    expect(calls).toHaveLength(MAX_ATTEMPTS);
    expect(calls).toHaveLength(3);
    expect(delays).toEqual([RETRY_DELAYS_MS[0], RETRY_DELAYS_MS[1]]);
    expect(delays).toEqual([2000, 5000]);
    expect(ATTEMPT_TIMEOUT_MS).toBe(30000);

    const ids = calls.map((c) => JSON.parse(String(c.init.body)).attemptId);
    expect(new Set(ids)).toEqual(new Set(["stable-retry-id"]));
  });

  it("aborts an attempt that exceeds timeoutMs and saves pending payload", async () => {
    const storage = memoryStorage();
    const payload = payloadFor(makeAttempt({ attemptId: "timeout-id" }));
    const hangingFetch = vi.fn(
      () => new Promise<Response>(() => {
        /* never resolves */
      }),
    );

    const ok = await sendWithRetry(payload, {
      fetchImpl: hangingFetch,
      storage,
      sleep: noSleep,
      timeoutMs: 15,
    });

    expect(ok).toBe(false);
    expect(hangingFetch).toHaveBeenCalledTimes(3);
    expect(isPending("timeout-id", { storage })).toBe(true);
  });

  it("marks receipt and clears pending on ok:true or duplicate:true", async () => {
    const { impl } = mockFetch(['{"duplicate":true}']);
    const storage = memoryStorage();
    const payload = payloadFor(makeAttempt({ attemptId: "dup-id" }));

    const ok = await sendWithRetry(payload, { fetchImpl: impl, storage, sleep: noSleep });
    expect(ok).toBe(true);
    expect(isPending("dup-id", { storage })).toBe(false);
    expect(hasReceipt("dup-id", { storage })).toBe(true);
  });

  it("flushes only its own pending keys on retryPending", async () => {
    const storage = memoryStorage();
    const mine = payloadFor(makeAttempt({ attemptId: "mine-1", answers: fullKey() }));
    storage.setItem(pendingKey("mine-1"), JSON.stringify(mine));
    storage.setItem(
      "pending:grade5-english-curriculum-exam-l1-5-a:other-1",
      JSON.stringify({ ...mine, attemptId: "other-1", examId: "grade5-english-curriculum-exam-l1-5-a" }),
    );
    storage.setItem(
      "pending:grade5-english-curriculum-exam-l1-5-b:other-2",
      JSON.stringify({ ...mine, attemptId: "other-2", examId: "grade5-english-curriculum-exam-l1-5-b" }),
    );

    const { impl, calls } = mockFetch(['{"ok":true}']);
    const sent = await retryPending({ fetchImpl: impl, storage, sleep: noSleep });

    expect(sent).toBe(1);
    expect(calls).toHaveLength(1);
    expect(JSON.parse(String(calls[0].init.body)).attemptId).toBe("mine-1");
    expect(isPending("mine-1", { storage })).toBe(false);
    expect(storage.getItem("pending:grade5-english-curriculum-exam-l1-5-a:other-1")).not.toBeNull();
    expect(storage.getItem("pending:grade5-english-curriculum-exam-l1-5-b:other-2")).not.toBeNull();
  });

  it("uses unique isolated keys and unique attemptIds", () => {
    expect(STORAGE_KEY).toBe("grade5-english-curriculum-exam-l1-5-25q-a-attempt-v1");
    expect(MUTE_KEY).toBe("grade5-english-curriculum-exam-l1-5-25q-a-muted-v1");
    expect(PENDING_PREFIX).toBe("pending:grade5-english-curriculum-exam-l1-5-25q-a:");
    expect(RECEIPT_PREFIX).toBe("sent:grade5-english-curriculum-exam-l1-5-25q-a:");
    expect(pendingKey("id1")).toBe("pending:grade5-english-curriculum-exam-l1-5-25q-a:id1");
    expect(receiptKey("id1")).toBe("sent:grade5-english-curriculum-exam-l1-5-25q-a:id1");

    const ids = new Set(Array.from({ length: 50 }, () => newAttemptId()));
    expect(ids.size).toBe(50);

    const opts: SendOptions = {};
    expect(opts).toEqual({});
  });
});
