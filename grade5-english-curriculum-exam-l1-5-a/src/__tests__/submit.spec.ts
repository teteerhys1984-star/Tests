/**
 * Google Sheets delivery contract — MOCK FETCH ONLY.
 *
 * The real Apps Script endpoint is never contacted from this file: every test
 * injects a mock `fetch`, so no result can ever reach a real spreadsheet.
 *
 * The contract itself is the one of the platform reference exam
 * `grade5-math-unit1` (field names, shapes, retry policy, storage layout).
 */
import { describe, expect, it, vi } from "vitest";

import { EXAM_ID, EXAM_TITLE, SHEETS_TOKEN, SHEETS_URL } from "@/config";
import { QUESTIONS } from "@/data/exam";
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
import { STORAGE_KEY, newAttemptId, type Attempt } from "@/lib/storage";

/* ------------------------------------------------------------------ */
/* helpers                                                             */
/* ------------------------------------------------------------------ */

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
    attemptId: "attempt-under-test",
    name: "Layla Ahmad",
    answers: {},
    startedAt: Date.UTC(2026, 4, 12, 9, 0, 0),
    index: 0,
    status: "submitted",
    submittedAt: Date.UTC(2026, 4, 12, 9, 30, 0),
    muted: false,
    ...overrides,
  };
}

function fullKey(): Record<string, string> {
  const key: Record<string, string> = {};
  for (const q of QUESTIONS) {
    for (const p of q.parts) {
      key[p.id] =
        p.type === "rubric"
          ? p.starter
            ? `${p.starter}keep the classroom tidy and listen well`
            : "This is my own answer and I write it in full sentences today"
          : p.answer;
    }
  }
  return key;
}

function payloadFor(attempt: Attempt): SubmissionPayload {
  const result = gradeExam(QUESTIONS, attempt.answers);
  const reportText = buildReport({
    name: attempt.name,
    result,
    questions: QUESTIONS,
    submittedAt: attempt.submittedAt ?? 0,
    elapsedMs: 1_800_000,
  });
  return buildPayload({ attempt, result, questions: QUESTIONS, reportText });
}

/** Records every call and replays the given replies (the last one repeats). */
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

/* ------------------------------------------------------------------ */
/* the payload                                                         */
/* ------------------------------------------------------------------ */

describe("Submission payload — the reference contract", () => {
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

  it("uses this exam's own identity", () => {
    expect(payload.examId).toBe(EXAM_ID);
    expect(payload.examId).toBe("grade5-english-curriculum-exam-l1-5-a");
    expect(payload.examTitle).toBe(EXAM_TITLE);
    expect(payload.examTitle).toBe("Grade 5 English Curriculum Exam L1-5 A");
    expect(payload.token).toBe(SHEETS_TOKEN);
    expect(payload.studentName).toBe("Layla Ahmad");
    expect(payload.attemptId).toBe("attempt-under-test");
  });

  it("sends the same URL as the platform reference exam", () => {
    expect(SHEETS_URL).toBe(
      "https://script.google.com/macros/s/AKfycbwqv4hE1AFy73L7MhyhFwXx0nl4QF5-Nme5jvP-ank-BY_LQr91xA8A_IiQqMuTdh8B/exec",
    );
    expect(SHEETS_TOKEN).toBe("7U25pymFzsSqmt8ejzPOTPTFJmSvj9Rm");
  });

  it("sends the attempt timestamps and elapsed seconds", () => {
    expect(payload.startAt).toBe("2026-05-12T09:00:00.000Z");
    expect(payload.submitAt).toBe("2026-05-12T09:30:00.000Z");
    expect(payload.elapsedSec).toBe(1800);
  });

  it("summarises the marks exactly as the results page shows them", () => {
    const result = gradeExam(QUESTIONS, attempt.answers);
    expect(payload.summary).toEqual({
      total: result.score,
      max: result.maxScore,
      percentage: 100,
      gradeLabel: "ممتاز",
      fullQuestions: 50,
      partialQuestions: 0,
      wrongQuestions: 0,
      correctSubparts: 99,
      partialSubparts: 0,
      wrongSubparts: 0,
      unansweredSubparts: 0,
    });
  });

  it("lists the five lessons with their marks", () => {
    expect(payload.lessons).toHaveLength(5);
    expect(payload.lessons.map((l) => l.title)).toEqual([
      "At School",
      "Family",
      "Daily Routines",
      "The Five Senses",
      "Clothes",
    ]);
    for (const lesson of payload.lessons) {
      expect(lesson.awarded).toBe(20);
      expect(lesson.max).toBe(20);
    }
  });

  it("lists one detail row per sub-part, in paper order", () => {
    expect(payload.details).toHaveLength(99);
    expect(payload.details[0]).toMatchObject({
      q: 1,
      label: "a",
      status: "إجابة صحيحة",
      awarded: 1,
      marks: 1,
    });
    expect(payload.details[40]).toMatchObject({ q: 21, label: "a", marks: 1 });
    expect(payload.details[41]).toMatchObject({ q: 21, label: "b", marks: 1 });
    const questionNumbers = payload.details.map((d) => d.q);
    expect(questionNumbers).toEqual(
      QUESTIONS.flatMap((q, index) => Array.from({ length: q.parts.length }, () => index + 1)),
    );
    // 49 questions with two sub-parts + one question with a single 2-mark part.
    expect(new Set(questionNumbers).size).toBe(50);
    expect(questionNumbers.filter((n) => n === 41).length).toBe(1);
  });

  it("keeps the pupil answer, the correct answer and the status of every row", () => {
    const wrong = makeAttempt({ answers: { ...fullKey(), "L1-1a": "playground" } });
    const body = payloadFor(wrong);
    const row = body.details[0];
    expect(row.studentAnswer).toBe("playground");
    expect(row.correctAnswer).toBe("library");
    expect(row.status).toBe("إجابة خاطئة");
    expect(row.awarded).toBe(0);
    expect(body.summary.total).toBe(99);
    expect(body.summary.wrongSubparts).toBe(1);
  });

  it("marks blank sub-parts as unanswered", () => {
    const blank = makeAttempt({ answers: {} });
    const body = payloadFor(blank);
    expect(body.summary.unansweredSubparts).toBe(99);
    expect(body.summary.wrongSubparts).toBe(0);
    expect(body.details.every((d) => d.status === "لم يُجب")).toBe(true);
  });

  it("carries the full TXT report", () => {
    expect(payload.reportText.length).toBeGreaterThan(1000);
    expect(payload.reportText).toContain("Student name      : Layla Ahmad");
    expect(payload.reportText).toContain("Final score       : 100 / 100");
    expect(payload.reportText).toContain("SUMMARY BY LESSON");
  });

  it("uses the platform's approved grade scale", () => {
    expect(gradeLabel(100)).toBe("ممتاز");
    expect(gradeLabel(95)).toBe("ممتاز");
    expect(gradeLabel(94.9)).toBe("جيد جداً");
    expect(gradeLabel(85)).toBe("جيد جداً");
    expect(gradeLabel(84.9)).toBe("جيد");
    expect(gradeLabel(75)).toBe("جيد");
    expect(gradeLabel(74.9)).toBe("مقبول");
    expect(gradeLabel(65)).toBe("مقبول");
    expect(gradeLabel(64.9)).toBe("ضعيف");
    expect(gradeLabel(50)).toBe("ضعيف");
    expect(gradeLabel(49.9)).toBe("يحتاج إلى دعم");
    // The English rendering used on the pupil's results page uses the same limits.
    expect(gradeLabelEn(95)).toBe("Excellent");
    expect(gradeLabelEn(85)).toBe("Very Good");
    expect(gradeLabelEn(75)).toBe("Good");
    expect(gradeLabelEn(65)).toBe("Acceptable");
    expect(gradeLabelEn(50)).toBe("Weak");
    expect(gradeLabelEn(49)).toBe("Needs support");
  });
});

/* ------------------------------------------------------------------ */
/* delivery                                                            */
/* ------------------------------------------------------------------ */

describe("Delivery — mock fetch only", () => {
  it("POSTs text/plain to the service endpoint", async () => {
    const { impl, calls } = mockFetch(['{"ok":true}']);
    const storage = memoryStorage();
    const payload = payloadFor(makeAttempt());

    const ok = await sendWithRetry(payload, { fetchImpl: impl, storage, sleep: noSleep });

    expect(ok).toBe(true);
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe(SHEETS_URL);
    expect(calls[0].init.method).toBe("POST");
    expect((calls[0].init.headers as Record<string, string>)["Content-Type"]).toBe(
      "text/plain;charset=utf-8",
    );
    const body = JSON.parse(String(calls[0].init.body));
    expect(body.examId).toBe(EXAM_ID);
    expect(body.token).toBe(SHEETS_TOKEN);
  });

  it("retries three times with 2 s then 5 s delays", async () => {
    const { impl, calls } = mockFetch([new Error("network down")]);
    const storage = memoryStorage();
    const delays: number[] = [];
    const payload = payloadFor(makeAttempt());

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
  });

  it("keeps the same attempt id for every retry", async () => {
    const { impl, calls } = mockFetch([new Error("network down")]);
    const storage = memoryStorage();
    const attempt = makeAttempt({ attemptId: "attempt-stable-42" });
    const payload = payloadFor(attempt);

    await sendWithRetry(payload, { fetchImpl: impl, storage, sleep: noSleep });

    const ids = calls.map((c) => JSON.parse(String(c.init.body)).attemptId);
    expect(new Set(ids)).toEqual(new Set(["attempt-stable-42"]));
    expect(payload.attemptId).toBe("attempt-stable-42");
  });

  it("saves the payload as pending when every attempt fails", async () => {
    const { impl } = mockFetch([new Error("network down")]);
    const storage = memoryStorage();
    const payload = payloadFor(makeAttempt({ attemptId: "attempt-pending", answers: fullKey() }));

    const ok = await sendWithRetry(payload, { fetchImpl: impl, storage, sleep: noSleep });

    expect(ok).toBe(false);
    expect(isPending("attempt-pending", { storage })).toBe(true);
    const stored = JSON.parse(storage.getItem(pendingKey("attempt-pending"))!);
    expect(stored.attemptId).toBe("attempt-pending");
    expect(stored.examId).toBe(EXAM_ID);
    expect(stored.summary.total).toBe(100);
  });

  it("removes the pending payload and stores a receipt after a success", async () => {
    const { impl } = mockFetch(['{"ok":true}']);
    const storage = memoryStorage();
    const payload = payloadFor(makeAttempt({ attemptId: "attempt-done" }));

    const ok = await sendWithRetry(payload, { fetchImpl: impl, storage, sleep: noSleep });

    expect(ok).toBe(true);
    expect(isPending("attempt-done", { storage })).toBe(false);
    expect(hasReceipt("attempt-done", { storage })).toBe(true);
  });

  it("accepts a duplicate:true answer as delivered", async () => {
    const { impl } = mockFetch(['{"duplicate":true}']);
    const storage = memoryStorage();
    const payload = payloadFor(makeAttempt());

    const ok = await sendWithRetry(payload, { fetchImpl: impl, storage, sleep: noSleep });

    expect(ok).toBe(true);
  });

  it("treats an unreadable or non-JSON answer as a failure", async () => {
    const { impl, calls } = mockFetch(["<html>CORS error</html>"]);
    const storage = memoryStorage();
    const payload = payloadFor(makeAttempt());

    const ok = await sendWithRetry(payload, { fetchImpl: impl, storage, sleep: noSleep });

    expect(ok).toBe(false);
    expect(calls).toHaveLength(3);
  });

  it("resends the pending result on the next opening of the exam", async () => {
    const storage = memoryStorage();
    const payload = payloadFor(makeAttempt({ attemptId: "attempt-retry", answers: fullKey() }));
    storage.setItem(pendingKey("attempt-retry"), JSON.stringify(payload));

    const { impl, calls } = mockFetch(['{"ok":true}']);
    const sent = await retryPending({ fetchImpl: impl, storage, sleep: noSleep });

    expect(sent).toBe(1);
    expect(calls).toHaveLength(1);
    expect(JSON.parse(String(calls[0].init.body)).attemptId).toBe("attempt-retry");
    expect(isPending("attempt-retry", { storage })).toBe(false);
  });

  it("keeps the pending payload when the resend fails again", async () => {
    const storage = memoryStorage();
    const payload = payloadFor(makeAttempt({ attemptId: "attempt-still-pending", answers: fullKey() }));
    storage.setItem(pendingKey("attempt-still-pending"), JSON.stringify(payload));

    const { impl } = mockFetch([new Error("network down")]);
    const sent = await retryPending({ fetchImpl: impl, storage, sleep: noSleep });

    expect(sent).toBe(0);
    expect(isPending("attempt-still-pending", { storage })).toBe(true);
  });

  it("never touches the pending payloads of another exam", async () => {
    const storage = memoryStorage();
    storage.setItem(
      "pending:grade3-english-curriculum-exam-l1-5-a:someone-else",
      JSON.stringify(payloadFor(makeAttempt({ attemptId: "someone-else" }))),
    );

    const { impl, calls } = mockFetch(['{"ok":true}']);
    const sent = await retryPending({ fetchImpl: impl, storage, sleep: noSleep });

    expect(sent).toBe(0);
    expect(calls).toHaveLength(0);
    expect(storage.getItem("pending:grade3-english-curriculum-exam-l1-5-a:someone-else")).not.toBeNull();
  });
});

/* ------------------------------------------------------------------ */
/* storage independence                                                */
/* ------------------------------------------------------------------ */

describe("Storage independence", () => {
  it("uses its own attempt key", () => {
    expect(STORAGE_KEY).toBe("grade5-english-curriculum-exam-l1-5-a-attempt-v1");
    expect(STORAGE_KEY).not.toContain("grade3");
    expect(STORAGE_KEY).not.toContain("grade4");
    expect(STORAGE_KEY).not.toContain("math");
  });

  it("namespaces the pending and receipt keys with this exam id", () => {
    expect(PENDING_PREFIX).toBe("pending:grade5-english-curriculum-exam-l1-5-a:");
    expect(RECEIPT_PREFIX).toBe("sent:grade5-english-curriculum-exam-l1-5-a:");
    expect(pendingKey("abc")).toBe("pending:grade5-english-curriculum-exam-l1-5-a:abc");
    expect(receiptKey("abc")).toBe("sent:grade5-english-curriculum-exam-l1-5-a:abc");
  });

  it("never reuses an attempt id", () => {
    const ids = new Set(Array.from({ length: 50 }, () => newAttemptId()));
    expect(ids.size).toBe(50);
    for (const id of ids) expect(id.length).toBeGreaterThan(8);
  });

  it("keeps the reference contract values untouched", () => {
    const opts: SendOptions = {};
    expect(opts).toEqual({});
  });
});
