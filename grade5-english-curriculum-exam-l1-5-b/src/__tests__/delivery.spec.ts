/**
 * Google Sheets delivery contract — MOCK FETCH ONLY.
 *
 * The real Apps Script endpoint is never contacted from this file: every test
 * injects a mock `fetch`, so no result can ever reach a real spreadsheet.
 *
 * The contract itself is the one of the platform reference exam
 * `grade5-math-unit1` (field names, shapes, retry policy, storage layout).
 */
import { afterEach, describe, expect, it, vi } from "vitest";

import { EXAM_ID, EXAM_TITLE, SHEETS_TOKEN, SHEETS_URL } from "@/config";
import { ALL_PARTS, QUESTIONS } from "@/data/questions";
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
  lessonTotals,
  pendingKey,
  receiptKey,
  retryPending,
  sendWithRetry,
  type FetchLike,
  type SendOptions,
  type StorageLike,
} from "@/lib/submit";
import { STORAGE_KEY, type Attempt } from "@/lib/storage";

/* ------------------------------------------------------------------ */
/* helpers                                                             */
/* ------------------------------------------------------------------ */

function memoryStorage(initial: Record<string, string> = {}): StorageLike & {
  map: Map<string, string>;
} {
  const map = new Map<string, string>(Object.entries(initial));
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

function fullAnswers(): Record<string, string> {
  const answers: Record<string, string> = {};
  for (const part of ALL_PARTS) answers[part.id] = part.accept[0];
  return answers;
}

function makeAttempt(overrides: Partial<Attempt> = {}): Attempt {
  return {
    v: 1,
    attemptId: "attempt-under-test",
    name: "Layla Ahmad",
    answers: fullAnswers(),
    startTs: Date.UTC(2026, 4, 12, 9, 0, 0),
    current: 0,
    status: "submitted",
    submittedTs: Date.UTC(2026, 4, 12, 9, 30, 0),
    elapsedMs: 1_800_000,
    model: "B",
    ...overrides,
  };
}

function makeReport(attempt: Attempt) {
  const result = gradeExam(attempt.answers);
  return {
    result,
    reportText: buildReport({
      name: attempt.name,
      result,
      submittedTs: attempt.submittedTs ?? Date.now(),
      elapsedMs: attempt.elapsedMs ?? 0,
    }),
  };
}

type Reply = "ok" | "duplicate" | "reject" | "garbage" | "network" | "hang";

function mockFetch(script: Reply[]): {
  fn: FetchLike;
  calls: { url: string; init: RequestInit }[];
} {
  const calls: { url: string; init: RequestInit }[] = [];
  const fn: FetchLike = async (url, init) => {
    calls.push({ url, init });
    const mode = script[Math.min(calls.length - 1, script.length - 1)];
    if (mode === "hang") return new Promise(() => {});
    if (mode === "network") throw new Error("offline");
    return {
      text: async () => {
        if (mode === "ok") return '{"ok":true}';
        if (mode === "duplicate") return '{"duplicate":true}';
        if (mode === "garbage") return "<html>error</html>";
        return '{"ok":false}';
      },
    };
  };
  return { fn, calls };
}

const noSleep = async () => {};

afterEach(() => {
  vi.restoreAllMocks();
});

/* ------------------------------------------------------------------ */
/* 1  configuration                                                    */
/* ------------------------------------------------------------------ */

describe("delivery configuration", () => {
  it("uses this exam's own id", () => {
    expect(EXAM_ID).toBe("grade5-english-curriculum-exam-l1-5-b");
    expect(EXAM_TITLE).toBe("Grade 5 English Curriculum Exam L1-5 B");
  });

  it("keeps the reference endpoint and token untouched", () => {
    expect(SHEETS_URL).toBe(
      "https://script.google.com/macros/s/AKfycbwqv4hE1AFy73L7MhyhFwXx0nl4QF5-Nme5jvP-ank-BY_LQr91xA8A_IiQqMuTdh8B/exec"
    );
    expect(SHEETS_TOKEN).toBe("7U25pymFzsSqmt8ejzPOTPTFJmSvj9Rm");
  });

  it("uses the reference retry policy: 3 attempts, 2 s then 5 s, 30 s timeout", () => {
    expect(MAX_ATTEMPTS).toBe(3);
    expect(RETRY_DELAYS_MS).toEqual([2000, 5000]);
    expect(ATTEMPT_TIMEOUT_MS).toBe(30000);
  });

  it("uses this exam's own pending / receipt namespaces", () => {
    expect(PENDING_PREFIX).toBe(`pending:grade5-english-curriculum-exam-l1-5-b:`);
    expect(RECEIPT_PREFIX).toBe(`sent:grade5-english-curriculum-exam-l1-5-b:`);
    expect(pendingKey("a1")).toBe("pending:grade5-english-curriculum-exam-l1-5-b:a1");
    expect(receiptKey("a1")).toBe("sent:grade5-english-curriculum-exam-l1-5-b:a1");
  });

  it("uses the approved Arabic grade scale for the teacher payload", () => {
    expect(gradeLabel(100)).toBe("ممتاز");
    expect(gradeLabel(95)).toBe("ممتاز");
    expect(gradeLabel(94.9)).toBe("جيد جداً");
    expect(gradeLabel(85)).toBe("جيد جداً");
    expect(gradeLabel(75)).toBe("جيد");
    expect(gradeLabel(65)).toBe("مقبول");
    expect(gradeLabel(50)).toBe("ضعيف");
    expect(gradeLabel(49.9)).toBe("يحتاج إلى دعم");
  });

  it("renders the same thresholds in English for the pupil", () => {
    expect(gradeLabelEn(100)).toBe("Excellent");
    expect(gradeLabelEn(85)).toBe("Very Good");
    expect(gradeLabelEn(75)).toBe("Good");
    expect(gradeLabelEn(65)).toBe("Acceptable");
    expect(gradeLabelEn(50)).toBe("Weak");
    expect(gradeLabelEn(0)).toBe("Needs support");
  });
});

/* ------------------------------------------------------------------ */
/* 2  payload shape                                                    */
/* ------------------------------------------------------------------ */

describe("payload contract", () => {
  const attempt = makeAttempt();
  const { result, reportText } = makeReport(attempt);
  const payload = buildPayload({ attempt, result, questions: QUESTIONS, reportText });

  it("has exactly the reference's 12 top-level fields", () => {
    expect(Object.keys(payload).sort()).toEqual([
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
    ]);
  });

  it("carries the exam identity, token, pupil name and attempt id", () => {
    expect(payload.token).toBe(SHEETS_TOKEN);
    expect(payload.examId).toBe(EXAM_ID);
    expect(payload.examTitle).toBe(EXAM_TITLE);
    expect(payload.studentName).toBe("Layla Ahmad");
    expect(payload.attemptId).toBe("attempt-under-test");
    expect(payload.reportText).toBe(reportText);
    expect(payload.reportText).toContain("Final score       : 100 / 100");
  });

  it("sends ISO timestamps and integer elapsed seconds", () => {
    expect(payload.startAt).toBe("2026-05-12T09:00:00.000Z");
    expect(payload.submitAt).toBe("2026-05-12T09:30:00.000Z");
    expect(payload.elapsedSec).toBe(1800);
    expect(Number.isInteger(payload.elapsedSec)).toBe(true);
  });

  it("keeps the reference summary shape and the exact numbers", () => {
    expect(Object.keys(payload.summary).sort()).toEqual([
      "correctSubparts",
      "fullQuestions",
      "gradeLabel",
      "max",
      "partialQuestions",
      "partialSubparts",
      "percentage",
      "total",
      "unansweredSubparts",
      "wrongQuestions",
      "wrongSubparts",
    ]);
    expect(payload.summary).toMatchObject({
      total: 100,
      max: 100,
      percentage: 100,
      gradeLabel: "ممتاز",
      fullQuestions: 50,
      partialQuestions: 0,
      wrongQuestions: 0,
      correctSubparts: 59,
      partialSubparts: 0,
      wrongSubparts: 0,
      unansweredSubparts: 0,
    });
  });

  it("keeps the reference lessons shape: five lessons, 20 marks each", () => {
    expect(payload.lessons).toHaveLength(5);
    expect(payload.lessons.map((l) => l.title)).toEqual([
      "At School",
      "Family",
      "Daily Routines",
      "The Five Senses",
      "Clothes",
    ]);
    expect(payload.lessons.map((l) => l.max)).toEqual([20, 20, 20, 20, 20]);
    expect(payload.lessons.map((l) => l.awarded)).toEqual([20, 20, 20, 20, 20]);
    expect(payload.lessons).toEqual(lessonTotals(result));
  });

  it("keeps the reference details shape for all 59 sub-parts", () => {
    expect(payload.details).toHaveLength(59);
    for (const detail of payload.details) {
      expect(Object.keys(detail).sort()).toEqual([
        "awarded",
        "correctAnswer",
        "label",
        "lessons",
        "marks",
        "q",
        "qTitle",
        "status",
        "studentAnswer",
      ]);
      expect(detail.q).toBeGreaterThanOrEqual(1);
      expect(detail.q).toBeLessThanOrEqual(50);
      expect(detail.status).toBe("إجابة صحيحة");
    }
    const labels = payload.details.filter((d) => d.q === 5).map((d) => d.label);
    expect(labels).toEqual(["a", "b"]);
    expect(payload.details.find((d) => d.label === "d")!.q).toBe(47);
  });

  it("counts wrong and unanswered sub-parts separately", () => {
    const answers = { ...attempt.answers };
    answers["l1q5a"] = "wrong answer"; // answered but wrong
    delete answers["l1q5b"]; // unanswered
    answers["l5q7a"] = "2"; // 0.5 lost
    const partial = makeAttempt({ answers });
    const graded = gradeExam(answers);
    const p = buildPayload({
      attempt: partial,
      result: graded,
      questions: QUESTIONS,
      reportText: buildReport({
        name: partial.name,
        result: graded,
        submittedTs: partial.submittedTs!,
        elapsedMs: 0,
      }),
    });
    expect(p.summary.total).toBe(97.5);
    expect(p.summary.percentage).toBe(97.5);
    expect(p.summary.gradeLabel).toBe("ممتاز");
    expect(p.summary.fullQuestions).toBe(48);
    expect(p.summary.partialQuestions).toBe(1); // l5q7 keeps 1.5 of 2
    expect(p.summary.wrongQuestions).toBe(1); // l1q5 lost both marks
    expect(p.summary.correctSubparts).toBe(56);
    expect(p.summary.wrongSubparts).toBe(2);
    expect(p.summary.unansweredSubparts).toBe(1);
    const detail = p.details.find((d) => d.studentAnswer === "")!;
    expect(detail.status).toBe("لم يُجب");
    expect(p.details.find((d) => d.status === "إجابة خاطئة")).toBeTruthy();
    expect(p.lessons[0]).toEqual({ title: "At School", awarded: 18, max: 20 });
  });

  it("derives the payload marks from the same grading the results page uses", () => {
    const answers = { ...attempt.answers };
    answers["l2q1a"] = "seven years old";
    const graded = gradeExam(answers);
    const p = buildPayload({
      attempt: makeAttempt({ answers }),
      result: graded,
      questions: QUESTIONS,
      reportText: "",
    });
    expect(p.summary.total).toBe(graded.score);
    expect(p.summary.total).toBe(98);
    expect(p.details.reduce((s, d) => s + d.awarded, 0)).toBe(graded.score);
    expect(p.details.reduce((s, d) => s + d.marks, 0)).toBe(100);
  });
});

/* ------------------------------------------------------------------ */
/* 3  transport                                                        */
/* ------------------------------------------------------------------ */

describe("transport", () => {
  const attempt = makeAttempt();
  const { result, reportText } = makeReport(attempt);
  const payload = buildPayload({ attempt, result, questions: QUESTIONS, reportText });

  it("POSTs to the reference endpoint as text/plain;charset=utf-8", async () => {
    const fetch = mockFetch(["ok"]);
    const storage = memoryStorage();
    const ok = await sendWithRetry(payload, { fetchImpl: fetch.fn, storage, sleep: noSleep });

    expect(ok).toBe(true);
    expect(fetch.calls).toHaveLength(1);
    expect(fetch.calls[0].url).toBe(SHEETS_URL);
    expect(fetch.calls[0].init.method).toBe("POST");
    expect(fetch.calls[0].init.headers).toEqual({ "Content-Type": "text/plain;charset=utf-8" });
    expect(fetch.calls[0].init.body).toBe(JSON.stringify(payload));
  });

  it("accepts both ok:true and duplicate:true replies", async () => {
    for (const reply of ["ok", "duplicate"] as const) {
      const storage = memoryStorage();
      const fetch = mockFetch([reply]);
      await expect(
        sendWithRetry(payload, { fetchImpl: fetch.fn, storage, sleep: noSleep })
      ).resolves.toBe(true);
      expect(hasReceipt(attempt.attemptId, { storage })).toBe(true);
    }
  });

  it("treats an unreadable, non-JSON or negative reply as a failure", async () => {
    for (const reply of ["garbage", "reject"] as const) {
      const storage = memoryStorage();
      const fetch = mockFetch([reply]);
      await expect(
        sendWithRetry(payload, { fetchImpl: fetch.fn, storage, sleep: noSleep })
      ).resolves.toBe(false);
      expect(fetch.calls).toHaveLength(3);
      expect(hasReceipt(attempt.attemptId, { storage })).toBe(false);
    }
  });

  it("retries 3 times with 2 s then 5 s and the same attemptId", async () => {
    const storage = memoryStorage();
    const fetch = mockFetch(["network", "network", "ok"]);
    const sleeps: number[] = [];
    const ok = await sendWithRetry(payload, {
      fetchImpl: fetch.fn,
      storage,
      sleep: async (ms) => {
        sleeps.push(ms);
      },
    });

    expect(ok).toBe(true);
    expect(fetch.calls).toHaveLength(3);
    expect(sleeps).toEqual([2000, 5000]);
    const bodies = fetch.calls.map((c) => JSON.parse(String(c.init.body)));
    expect(bodies.map((b) => b.attemptId)).toEqual([
      "attempt-under-test",
      "attempt-under-test",
      "attempt-under-test",
    ]);
    expect(new Set(fetch.calls.map((c) => String(c.init.body))).size).toBe(1);
  });

  it("gives up after 3 failed attempts and stores the payload as pending", async () => {
    const storage = memoryStorage();
    const fetch = mockFetch(["network"]);
    const ok = await sendWithRetry(payload, { fetchImpl: fetch.fn, storage, sleep: noSleep, timeoutMs: 50 });

    expect(ok).toBe(false);
    expect(fetch.calls).toHaveLength(3);
    expect(isPending(attempt.attemptId, { storage })).toBe(true);
    expect(hasReceipt(attempt.attemptId, { storage })).toBe(false);
    const stored = JSON.parse(storage.map.get(pendingKey(attempt.attemptId))!);
    expect(stored.attemptId).toBe("attempt-under-test");
    expect(stored.examId).toBe(EXAM_ID);
  });

  it("times out an attempt that never answers, without hanging", async () => {
    const storage = memoryStorage();
    const fetch = mockFetch(["hang"]);
    const started = Date.now();
    const ok = await sendWithRetry(payload, {
      fetchImpl: fetch.fn,
      storage,
      sleep: noSleep,
      timeoutMs: 20,
    });
    expect(ok).toBe(false);
    expect(fetch.calls).toHaveLength(3);
    expect(Date.now() - started).toBeLessThan(5000);
  });

  it("uses the platform timeout constant and leaves it overridable for tests", () => {
    expect(ATTEMPT_TIMEOUT_MS).toBe(30000);
    expect(typeof ATTEMPT_TIMEOUT_MS).toBe("number");
  });

  it("never touches the real fetch when a mock is injected", async () => {
    const spy = vi.spyOn(globalThis, "fetch");
    const fetch = mockFetch(["ok"]);
    await sendWithRetry(payload, { fetchImpl: fetch.fn, storage: memoryStorage(), sleep: noSleep });
    expect(spy).not.toHaveBeenCalled();
  });
});

/* ------------------------------------------------------------------ */
/* 4  pending queue, receipts and manual resend                        */
/* ------------------------------------------------------------------ */

describe("pending queue and receipts", () => {
  const attempt = makeAttempt();
  const { result, reportText } = makeReport(attempt);
  const payload = buildPayload({ attempt, result, questions: QUESTIONS, reportText });

  it("removes the pending payload and writes a receipt on success", async () => {
    const storage = memoryStorage({ [pendingKey(attempt.attemptId)]: JSON.stringify(payload) });
    const fetch = mockFetch(["ok"]);
    await sendWithRetry(payload, { fetchImpl: fetch.fn, storage, sleep: noSleep });
    expect(storage.map.has(pendingKey(attempt.attemptId))).toBe(false);
    expect(hasReceipt(attempt.attemptId, { storage })).toBe(true);
    expect(storage.map.get(receiptKey(attempt.attemptId))).toBeTruthy();
  });

  it("resends a failed attempt with the same attemptId and then writes the receipt", async () => {
    const storage = memoryStorage();
    const failing = mockFetch(["network"]);
    const first = await sendWithRetry(payload, {
      fetchImpl: failing.fn,
      storage,
      sleep: noSleep,
    });
    expect(first).toBe(false);
    const storedId = JSON.parse(storage.map.get(pendingKey(attempt.attemptId))!).attemptId;

    const succeeding = mockFetch(["ok"]);
    const sent = await retryPending({ fetchImpl: succeeding.fn, storage, sleep: noSleep });
    expect(sent).toBe(1);
    expect(JSON.parse(String(succeeding.calls[0].init.body)).attemptId).toBe(storedId);
    expect(hasReceipt(attempt.attemptId, { storage })).toBe(true);
    expect(isPending(attempt.attemptId, { storage })).toBe(false);
  });

  it("flushes only THIS exam's pending queue and leaves Model A's untouched", async () => {
    const aPending = "pending:grade5-english-curriculum-exam-l1-5-a:attempt-a";
    const storage = memoryStorage({
      [aPending]: JSON.stringify({ ...payload, attemptId: "attempt-a", examId: "grade5-english-curriculum-exam-l1-5-a" }),
      [pendingKey(attempt.attemptId)]: JSON.stringify(payload),
    });
    const fetch = mockFetch(["ok"]);
    const sent = await retryPending({ fetchImpl: fetch.fn, storage, sleep: noSleep });

    expect(sent).toBe(1);
    expect(storage.map.has(aPending)).toBe(true);
    expect(storage.map.has(pendingKey(attempt.attemptId))).toBe(false);
    expect(fetch.calls).toHaveLength(1);
    expect(JSON.parse(String(fetch.calls[0].init.body)).examId).toBe(EXAM_ID);
  });

  it("refreshes the token of a stored payload and skips an excluded attempt", async () => {
    const storage = memoryStorage({
      [pendingKey("excluded")]: JSON.stringify({ ...payload, attemptId: "excluded", token: "old" }),
    });
    const fetch = mockFetch(["ok"]);
    const sent = await retryPending({
      fetchImpl: fetch.fn,
      storage,
      sleep: noSleep,
      excludeAttemptId: "excluded",
    });
    expect(sent).toBe(0);
    expect(fetch.calls).toHaveLength(0);
    expect(storage.map.has(pendingKey("excluded"))).toBe(true);

    const second = mockFetch(["ok"]);
    const sent2 = await retryPending({ fetchImpl: second.fn, storage, sleep: noSleep });
    expect(sent2).toBe(1);
    expect(JSON.parse(String(second.calls[0].init.body)).token).toBe(SHEETS_TOKEN);
  });

  it("drops a pending payload that already has a receipt instead of sending it twice", async () => {
    const storage = memoryStorage({
      [pendingKey(attempt.attemptId)]: JSON.stringify(payload),
      [receiptKey(attempt.attemptId)]: "2026-05-12T09:21:00.000Z",
    });
    const fetch = mockFetch(["ok"]);
    const sent = await retryPending({ fetchImpl: fetch.fn, storage, sleep: noSleep });
    expect(sent).toBe(0);
    expect(fetch.calls).toHaveLength(0);
    expect(storage.map.has(pendingKey(attempt.attemptId))).toBe(false);
    expect(hasReceipt(attempt.attemptId, { storage })).toBe(true);
  });

  it("shares a single flush round, so two calls cannot send the same payload twice", async () => {
    const storage = memoryStorage({ [pendingKey(attempt.attemptId)]: JSON.stringify(payload) });
    const fetch = mockFetch(["ok"]);
    const opts: SendOptions = { fetchImpl: fetch.fn, storage, sleep: noSleep };
    const first = retryPending(opts);
    const second = retryPending(opts);
    expect(first).toBe(second);
    await first;
    expect(fetch.calls).toHaveLength(1);
  });

  it("survives storage that throws", async () => {
    const broken: StorageLike = {
      length: 1,
      key: () => {
        throw new Error("denied");
      },
      getItem: () => {
        throw new Error("denied");
      },
      setItem: () => {
        throw new Error("denied");
      },
      removeItem: () => {
        throw new Error("denied");
      },
    };
    const fetch = mockFetch(["ok"]);
    await expect(
      sendWithRetry(payload, { fetchImpl: fetch.fn, storage: broken, sleep: noSleep })
    ).resolves.toBe(true);
    await expect(retryPending({ fetchImpl: fetch.fn, storage: broken, sleep: noSleep })).resolves.toBe(0);
    expect(isPending("x", { storage: broken })).toBe(false);
    expect(hasReceipt("x", { storage: broken })).toBe(false);
  });

  it("keeps the attempt storage key of this exam only", () => {
    expect(STORAGE_KEY).toBe("grade5-english-curriculum-exam-l1-5-b-attempt-v1");
  });
});
