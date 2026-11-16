// @vitest-environment jsdom
/**
 * Delivery-contract tests (the `grade5-math-unit1` contract).
 *
 * Delivery is ALWAYS exercised through an injected mock fetch — no request ever
 * leaves the test process, so no pupil data can reach the real Google Sheet.
 */
import { describe, expect, it, vi } from "vitest";
import { EXAM_ID, EXAM_TITLE, SHEETS_TOKEN, SHEETS_URL } from "../config";
import { EXAM_QUESTIONS } from "../data/questions";
import { buildCorrectSheet, gradeExam } from "../lib/grading";
import { buildReport } from "../lib/report";
import {
  ATTEMPT_TIMEOUT_MS,
  MAX_ATTEMPTS,
  PENDING_PREFIX,
  RETRY_DELAYS_MS,
  buildPayload,
  gradeLabel,
  isPending,
  lessonTotals,
  pendingKey,
  retryPending,
  sendWithRetry,
  type FetchLike,
  type StorageLike,
  type SubmissionPayload,
} from "../lib/submit";
import { newAttemptId, startAttempt, submitAttempt } from "../lib/storage";
import type { ExamState } from "../types";

/* ------------------------------------------------------------------ */
/* helpers                                                             */
/* ------------------------------------------------------------------ */

class MemoryStorage implements StorageLike {
  private data = new Map<string, string>();
  get length() {
    return this.data.size;
  }
  key(i: number) {
    return Array.from(this.data.keys())[i] ?? null;
  }
  getItem(k: string) {
    return this.data.has(k) ? (this.data.get(k) as string) : null;
  }
  setItem(k: string, v: string) {
    this.data.set(k, v);
  }
  removeItem(k: string) {
    this.data.delete(k);
  }
  keys() {
    return Array.from(this.data.keys());
  }
}

/** A mock fetch that replays the given JSON bodies (or rejects / hangs). */
function mockFetch(replies: (string | Error)[]): { impl: FetchLike; calls: { url: string; init: RequestInit }[] } {
  const calls: { url: string; init: RequestInit }[] = [];
  let index = 0;
  const impl: FetchLike = (url, init) => {
    calls.push({ url, init });
    const reply = replies[Math.min(index, replies.length - 1)];
    index += 1;
    if (reply instanceof Error) return Promise.reject(reply);
    return Promise.resolve({ text: () => Promise.resolve(reply) });
  };
  return { impl, calls };
}

const noSleep = () => Promise.resolve();

function finishedState(mutate?: (state: ExamState) => void): { state: ExamState; result: ReturnType<typeof gradeExam> } {
  const answers = buildCorrectSheet(EXAM_QUESTIONS);
  // One deliberately wrong answer and one left blank, to prove partial scoring.
  // ("twenty four" would be accepted: hyphen-vs-space is ignored on purpose.)
  answers["L2-10"] = { a: "twenty fourr", b: "twenty-seven" };
  delete answers["L4-03"]?.a;
  const started = Date.now() - 125_000;
  const state = { ...submitAttempt(startAttempt("Pupil One", started), started + 125_000), answers };
  mutate?.(state);
  return { state, result: gradeExam(EXAM_QUESTIONS, state.answers) };
}

function payloadFor(): SubmissionPayload {
  const { state, result } = finishedState();
  return buildPayload({
    state,
    result,
    questions: EXAM_QUESTIONS,
    reportText: buildReport(state, result, EXAM_QUESTIONS),
  });
}

/* ------------------------------------------------------------------ */
/* identity / contract fields                                          */
/* ------------------------------------------------------------------ */

describe("config and payload contract", () => {
  it("uses the exact EXAM_ID of the published folder", () => {
    expect(EXAM_ID).toBe("grade3-english-curriculum-exam-l1-5-a");
  });

  it("keeps the platform Google Sheets URL and token unchanged", () => {
    expect(SHEETS_URL).toBe(
      "https://script.google.com/macros/s/AKfycbwqv4hE1AFy73L7MhyhFwXx0nl4QF5-Nme5jvP-ank-BY_LQr91xA8A_IiQqMuTdh8B/exec",
    );
    expect(SHEETS_TOKEN).toBe("7U25pymFzsSqmt8ejzPOTPTFJmSvj9Rm");
  });

  it("sends every required top-level field", () => {
    const payload = payloadFor();
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
    expect(payload.token).toBe(SHEETS_TOKEN);
    expect(payload.examId).toBe(EXAM_ID);
    expect(payload.examTitle).toBe(EXAM_TITLE);
    expect(payload.studentName).toBe("Pupil One");
  });

  it("sends ISO timestamps, integer elapsed seconds and the summary shape", () => {
    const payload = payloadFor();
    expect(new Date(payload.startAt).toISOString()).toBe(payload.startAt);
    expect(new Date(payload.submitAt).toISOString()).toBe(payload.submitAt);
    expect(Number.isInteger(payload.elapsedSec)).toBe(true);
    expect(payload.elapsedSec).toBe(125);
    expect(Object.keys(payload.summary).sort()).toEqual(
      [
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
      ].sort(),
    );
  });

  it("scores in the payload exactly like the results page and the report", () => {
    const { state, result } = finishedState();
    const report = buildReport(state, result, EXAM_QUESTIONS);
    const payload = buildPayload({ state, result, questions: EXAM_QUESTIONS, reportText: report });

    expect(payload.summary.max).toBe(100);
    expect(payload.summary.total).toBe(result.total);
    expect(payload.summary.percentage).toBe(result.max ? Math.round((result.total / result.max) * 1000) / 10 : 0);
    expect(payload.summary.gradeLabel).toBe(gradeLabel(result.total));
    expect(payload.summary.fullQuestions).toBe(result.correctCount);
    expect(payload.summary.partialQuestions).toBe(result.partialCount);
    expect(payload.summary.wrongQuestions).toBe(result.incorrectCount);
    expect(report).toContain(`Total score:       ${result.total} / 100`);
    // the TXT report that the pupil downloads is the exact text sent to the teacher
    expect(payload.reportText).toBe(report);
  });

  it("counts sub-parts in the four contract statuses", () => {
    const payload = payloadFor();
    const s = payload.summary;
    const subparts = payload.details.length;
    expect(s.correctSubparts + s.wrongSubparts + s.unansweredSubparts).toBe(subparts);
    expect(s.correctSubparts).toBeGreaterThan(0);
    expect(s.wrongSubparts).toBeGreaterThan(0); // misspelt "twenty fourr"
    expect(s.unansweredSubparts).toBeGreaterThan(0); // one blank part
    expect(payload.details.filter((d) => d.status === "لم يُجب").length).toBe(s.unansweredSubparts);
    // Every sub-part is all-or-nothing in this exam, so the statuses used are the
    // three that apply; "إجابة صحيحة جزئياً" stays reserved for partial parts.
    expect(new Set(payload.details.map((d) => d.status))).toEqual(
      new Set(["إجابة صحيحة", "إجابة خاطئة", "لم يُجب"]),
    );
    expect(s.partialSubparts).toBe(0);
  });

  it("has one detail row per question part with marks that add up to 100", () => {
    const payload = payloadFor();
    const parts = EXAM_QUESTIONS.reduce((sum, q) => sum + q.parts.length, 0);
    expect(payload.details).toHaveLength(parts);
    expect(payload.details.reduce((sum, d) => sum + d.marks, 0)).toBe(100);
    for (const d of payload.details) {
      expect(Object.keys(d).sort()).toEqual(
        ["awarded", "correctAnswer", "label", "lessons", "marks", "q", "qTitle", "status", "studentAnswer"].sort(),
      );
      expect(d.q).toBeGreaterThanOrEqual(1);
      expect(d.q).toBeLessThanOrEqual(50);
      expect(d.awarded).toBeLessThanOrEqual(d.marks);
      expect(d.studentAnswer.length).toBeGreaterThan(0);
      expect(d.correctAnswer.length).toBeGreaterThan(0);
    }
  });

  it("distributes lesson marks matching the grading engine", () => {
    const { result } = finishedState();
    const lessons = lessonTotals(result);
    expect(lessons).toHaveLength(5);
    expect(lessons.map((l) => l.title)).toEqual([
      "Back to School",
      "School Subjects",
      "My Lovely School",
      "My Five Senses",
      "Revision 1",
    ]);
    expect(lessons.reduce((s, l) => s + l.max, 0)).toBe(100);
    lessons.forEach((l) => expect(l.awarded).toBeLessThanOrEqual(l.max));
    expect(lessons.reduce((s, l) => s + l.awarded, 0)).toBe(result.total);
  });

  it("gives every attempt a unique id", () => {
    const ids = new Set(Array.from({ length: 200 }, () => newAttemptId()));
    expect(ids.size).toBe(200);
    expect(newAttemptId().length).toBeGreaterThan(8);
  });
});

/* ------------------------------------------------------------------ */
/* grade labels                                                        */
/* ------------------------------------------------------------------ */

describe("grade labels", () => {
  it("matches the reference thresholds", () => {
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
    expect(gradeLabel(0)).toBe("يحتاج إلى دعم");
  });
});

/* ------------------------------------------------------------------ */
/* delivery — mock fetch only                                          */
/* ------------------------------------------------------------------ */

describe("delivery with a mock fetch", () => {
  it("posts the payload as text/plain and succeeds on ok:true", async () => {
    const storage = new MemoryStorage();
    const { impl, calls } = mockFetch(['{"ok":true}']);
    const payload = payloadFor();
    await expect(sendWithRetry(payload, { fetchImpl: impl, storage, sleep: noSleep })).resolves.toBe(true);

    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe(SHEETS_URL);
    expect(calls[0].init.method).toBe("POST");
    expect((calls[0].init.headers as Record<string, string>)["Content-Type"]).toBe("text/plain;charset=utf-8");
    expect(JSON.parse(String(calls[0].init.body))).toMatchObject({ attemptId: payload.attemptId, examId: EXAM_ID });
    expect(storage.length).toBe(0); // nothing left pending
  });

  it("treats duplicate:true as accepted (the server already has the attempt)", async () => {
    const { impl } = mockFetch(['{"duplicate":true}']);
    await expect(sendWithRetry(payloadFor(), { fetchImpl: impl, storage: new MemoryStorage(), sleep: noSleep })).resolves.toBe(
      true,
    );
  });

  it("retries on failure and succeeds on the second attempt", async () => {
    const { impl, calls } = mockFetch([new Error("network"), '{"ok":true}']);
    await expect(sendWithRetry(payloadFor(), { fetchImpl: impl, storage: new MemoryStorage(), sleep: noSleep })).resolves.toBe(
      true,
    );
    expect(calls).toHaveLength(2);
  });

  it("makes exactly 3 attempts, with the contract delays", async () => {
    expect(MAX_ATTEMPTS).toBe(3);
    expect([...RETRY_DELAYS_MS]).toEqual([2000, 5000]);
    const slept: number[] = [];
    const { impl, calls } = mockFetch([new Error("down")]);
    const ok = await sendWithRetry(payloadFor(), {
      fetchImpl: impl,
      storage: new MemoryStorage(),
      sleep: (ms) => {
        slept.push(ms);
        return Promise.resolve();
      },
    });
    expect(ok).toBe(false);
    expect(calls).toHaveLength(3);
    expect(slept).toEqual([2000, 5000]);
  });

  it("keeps the same attemptId on every retry (server de-duplication)", async () => {
    const { impl, calls } = mockFetch([new Error("down")]);
    const payload = payloadFor();
    await sendWithRetry(payload, { fetchImpl: impl, storage: new MemoryStorage(), sleep: noSleep });
    const ids = calls.map((c) => JSON.parse(String(c.init.body)).attemptId);
    expect(new Set(ids)).toEqual(new Set([payload.attemptId]));
  });

  it("stores the payload locally when every attempt fails", async () => {
    const storage = new MemoryStorage();
    const payload = payloadFor();
    await expect(sendWithRetry(payload, { fetchImpl: mockFetch([new Error("x")]).impl, storage, sleep: noSleep })).resolves.toBe(
      false,
    );
    expect(storage.keys()).toEqual([`${PENDING_PREFIX}${payload.attemptId}`]);
    expect(JSON.parse(storage.getItem(pendingKey(payload.attemptId)) as string).attemptId).toBe(payload.attemptId);
  });

  it("counts a 200 reply that is not JSON (CORS wall) as a failure", async () => {
    const storage = new MemoryStorage();
    const { impl } = mockFetch(["<html>Sign in</html>"]);
    await expect(sendWithRetry(payloadFor(), { fetchImpl: impl, storage, sleep: noSleep })).resolves.toBe(false);
    expect(storage.length).toBe(1);
  });

  it("counts a body without ok/duplicate as a failure", async () => {
    const { impl } = mockFetch(['{"ok":false}', '{"ok":false}', '{"ok":false}']);
    await expect(sendWithRetry(payloadFor(), { fetchImpl: impl, storage: new MemoryStorage(), sleep: noSleep })).resolves.toBe(
      false,
    );
  });

  it("gives up after the per-attempt timeout", async () => {
    vi.useFakeTimers();
    try {
      const hung: FetchLike = () => new Promise(() => {});
      const pending = sendWithRetry(payloadFor(), {
        fetchImpl: hung,
        storage: new MemoryStorage(),
        sleep: noSleep,
        timeoutMs: 1000,
      });
      await vi.advanceTimersByTimeAsync(1000 * MAX_ATTEMPTS + 10);
      await expect(pending).resolves.toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });

  it("exposes the 30 s attempt timeout used in production", () => {
    expect(ATTEMPT_TIMEOUT_MS).toBe(30000);
  });

  it("never throws when fetch itself throws synchronously and storage is unavailable", async () => {
    const boom: FetchLike = () => {
      throw new Error("no fetch");
    };
    await expect(sendWithRetry(payloadFor(), { fetchImpl: boom, storage: null, sleep: noSleep })).resolves.toBe(false);
  });
});

/* ------------------------------------------------------------------ */
/* local queue and resend                                              */
/* ------------------------------------------------------------------ */

describe("pending queue", () => {
  it("reports a queued attempt and clears it after a successful resend", async () => {
    const storage = new MemoryStorage();
    const payload = payloadFor();
    storage.setItem(pendingKey(payload.attemptId), JSON.stringify(payload));

    const original = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
    Object.defineProperty(globalThis, "localStorage", { value: storage, configurable: true });
    try {
      expect(isPending(payload.attemptId)).toBe(true);
      expect(isPending("other-attempt")).toBe(false);
    } finally {
      if (original) Object.defineProperty(globalThis, "localStorage", original);
    }

    const { impl, calls } = mockFetch(['{"ok":true}']);
    await expect(retryPending({ fetchImpl: impl, storage, sleep: noSleep })).resolves.toBe(1);
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe(SHEETS_URL);
    expect(storage.length).toBe(0);
  });

  it("keeps failed items queued and ignores other exams' keys", async () => {
    const storage = new MemoryStorage();
    const payload = payloadFor();
    storage.setItem(pendingKey(payload.attemptId), JSON.stringify(payload));
    storage.setItem("pending:some-other-exam:abc", JSON.stringify(payload));
    storage.setItem("g3u1-english-exam:v1", "{}");

    const { impl, calls } = mockFetch([new Error("down")]);
    await expect(retryPending({ fetchImpl: impl, storage, sleep: noSleep })).resolves.toBe(0);
    expect(calls).toHaveLength(MAX_ATTEMPTS); // one payload, all attempts used
    expect(calls.every((c) => c.url === SHEETS_URL)).toBe(true);
    expect(storage.getItem(pendingKey(payload.attemptId))).not.toBeNull();
    expect(storage.getItem("pending:some-other-exam:abc")).not.toBeNull();
    expect(storage.getItem("g3u1-english-exam:v1")).toBe("{}");
  });

  it("drops corrupt queue entries without throwing", async () => {
    const storage = new MemoryStorage();
    storage.setItem(`${PENDING_PREFIX}broken`, "{not json");
    const { impl, calls } = mockFetch(['{"ok":true}']);
    await expect(retryPending({ fetchImpl: impl, storage, sleep: noSleep })).resolves.toBe(0);
    expect(calls).toHaveLength(0);
  });

  it("sends a queued payload with the current token", async () => {
    const storage = new MemoryStorage();
    const payload = { ...payloadFor(), token: "old-token" };
    storage.setItem(pendingKey(payload.attemptId), JSON.stringify(payload));
    const { impl, calls } = mockFetch(['{"ok":true}']);
    await retryPending({ fetchImpl: impl, storage, sleep: noSleep });
    expect(JSON.parse(String(calls[0].init.body)).token).toBe(SHEETS_TOKEN);
  });
});
