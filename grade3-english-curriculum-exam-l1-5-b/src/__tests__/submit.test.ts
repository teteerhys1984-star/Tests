// @vitest-environment jsdom
/**
 * Google Sheets delivery contract tests (matched to `grade5-math-unit1`).
 *
 * Every test uses an injected Mock Fetch — ZERO real network requests are sent.
 */
import { describe, expect, it, vi } from "vitest";
import { EXAM_ID, EXAM_TITLE, SHEETS_TOKEN, SHEETS_URL } from "../config";
import { EXAM_QUESTIONS } from "../data/questions";
import { AnswerMap, ExamQuestion, ExamSessionState } from "../types/exam";
import { evaluateExam } from "../utils/grading";
import { generateTxtReport } from "../utils/report";
import { newAttemptId } from "../utils/storage";
import {
  ATTEMPT_TIMEOUT_MS,
  MAX_ATTEMPTS,
  PENDING_PREFIX,
  RETRY_DELAYS_MS,
  STATUS_AR,
  buildPayload,
  gradeLabel,
  isPending,
  lessonTotals,
  onPageExit,
  pendingKey,
  retryPending,
  savePending,
  sendWithRetry,
  type FetchLike,
  type StorageLike,
  type SubmissionPayload,
} from "../utils/submit";

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

function buildPerfectAnswers(questions: ExamQuestion[]): AnswerMap {
  const answers: AnswerMap = {};
  for (const q of questions) {
    if (q.type === "single-choice") {
      answers[q.id] = { type: "single-choice", value: q.correctAnswer };
    } else if (q.type === "choice-parts" || q.type === "match") {
      const values: Record<string, string> = {};
      for (const p of q.parts) values[p.id] = p.correctAnswer;
      answers[q.id] = { type: "parts", values };
    } else if (q.type === "text-parts") {
      const values: Record<string, string> = {};
      for (const p of q.parts) values[p.id] = p.correctDisplay;
      answers[q.id] = { type: "parts", values };
    } else if (q.type === "reorder") {
      const targetWords = q.correctSentence.slice(0, -1).split(" ");
      const used = new Set<number>();
      const chosenIndices = targetWords.map((word) => {
        const idx = q.words.findIndex((w, i) => w === word && !used.has(i));
        used.add(idx);
        return idx;
      });
      answers[q.id] = { type: "reorder", chosenIndices };
    }
  }
  return answers;
}

function mockFetch(replies: (string | Error)[]): {
  impl: FetchLike;
  calls: { url: string; init: RequestInit }[];
} {
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

function finishedFixture() {
  const answers = buildPerfectAnswers(EXAM_QUESTIONS);
  // Make one sub-part wrong and one sub-part unanswered to exercise all statuses
  answers["l2-q8"] = {
    type: "parts",
    values: { a: "twenty-three", b: "wrong-spelling", c: "26", d: "29" },
  };
  answers["l4-q3"] = {
    type: "parts",
    values: { a: "", b: "False" },
  };

  const startMs = Date.parse("2026-05-15T10:00:00.000Z");
  const submitIso = "2026-05-15T10:03:05.000Z";
  const session: ExamSessionState = {
    version: 1,
    attemptId: newAttemptId(),
    phase: "submitted",
    studentName: "Pupil Beta",
    currentQuestionIndex: 49,
    answers,
    startTimestamp: startMs,
    elapsedSeconds: 185,
    lastTickTimestamp: startMs + 185_000,
    submittedAt: submitIso,
    muted: false,
  };

  const evaluation = evaluateExam(EXAM_QUESTIONS, session.answers);
  const reportText = generateTxtReport({
    studentName: session.studentName,
    submittedAtIso: submitIso,
    elapsedSeconds: session.elapsedSeconds,
    evaluation,
  });

  return { session, evaluation, reportText };
}

function payloadFor(): SubmissionPayload {
  const { session, evaluation, reportText } = finishedFixture();
  return buildPayload({ session, evaluation, reportText });
}

describe("config and payload contract", () => {
  it("uses the exact EXAM_ID of the published Version B folder", () => {
    expect(EXAM_ID).toBe("grade3-english-curriculum-exam-l1-5-b");
    expect(EXAM_TITLE).toBe("Grade 3 English Curriculum Exam L1-5 B");
    expect(PENDING_PREFIX).toBe("pending:grade3-english-curriculum-exam-l1-5-b:");
  });

  it("preserves the exact reference SHEETS_URL and SHEETS_TOKEN", () => {
    expect(SHEETS_URL).toBe(
      "https://script.google.com/macros/s/AKfycbwqv4hE1AFy73L7MhyhFwXx0nl4QF5-Nme5jvP-ank-BY_LQr91xA8A_IiQqMuTdh8B/exec"
    );
    expect(SHEETS_TOKEN).toBe("7U25pymFzsSqmt8ejzPOTPTFJmSvj9Rm");
  });

  it("includes every required top-level field from grade5-math-unit1", () => {
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
      ].sort()
    );
    expect(payload.token).toBe(SHEETS_TOKEN);
    expect(payload.examId).toBe(EXAM_ID);
    expect(payload.examTitle).toBe(EXAM_TITLE);
    expect(payload.studentName).toBe("Pupil Beta");
  });

  it("sends ISO-8601 timestamps, integer elapsedSec, and all 11 summary fields", () => {
    const payload = payloadFor();
    expect(new Date(payload.startAt).toISOString()).toBe(payload.startAt);
    expect(new Date(payload.submitAt).toISOString()).toBe(payload.submitAt);
    expect(Number.isInteger(payload.elapsedSec)).toBe(true);
    expect(payload.elapsedSec).toBe(185);
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
      ].sort()
    );
  });

  it("matches the grading engine and TXT report identically", () => {
    const { session, evaluation, reportText } = finishedFixture();
    const payload = buildPayload({ session, evaluation, reportText });

    expect(payload.summary.max).toBe(100);
    expect(payload.summary.total).toBe(evaluation.totalEarned);
    expect(payload.summary.percentage).toBe(evaluation.percentage);
    expect(payload.summary.gradeLabel).toBe(gradeLabel(evaluation.percentage));
    expect(payload.summary.fullQuestions).toBe(evaluation.correctCount);
    expect(payload.summary.partialQuestions).toBe(evaluation.partialCount);
    expect(payload.summary.wrongQuestions).toBe(evaluation.incorrectCount);
    expect(payload.reportText).toBe(reportText);
    expect(reportText).toContain(`Total Score         : ${evaluation.totalEarned} / 100`);
  });

  it("emits 143 sub-part details summing to 100 marks with reference Arabic statuses", () => {
    const payload = payloadFor();
    const s = payload.summary;
    expect(payload.details).toHaveLength(143);
    expect(
      Math.round(payload.details.reduce((sum, d) => sum + d.marks, 0) * 100) / 100
    ).toBe(100);
    expect(
      s.correctSubparts + s.partialSubparts + s.wrongSubparts + s.unansweredSubparts
    ).toBe(143);
    expect(s.correctSubparts).toBe(141);
    expect(s.wrongSubparts).toBe(1);
    expect(s.unansweredSubparts).toBe(1);
    expect(s.partialSubparts).toBe(0);

    expect(payload.details.filter((d) => d.status === STATUS_AR.unanswered)).toHaveLength(1);
    expect(payload.details.filter((d) => d.status === STATUS_AR.wrong)).toHaveLength(1);

    for (const d of payload.details) {
      expect(Object.keys(d).sort()).toEqual(
        [
          "awarded",
          "correctAnswer",
          "label",
          "lessons",
          "marks",
          "q",
          "qTitle",
          "status",
          "studentAnswer",
        ].sort()
      );
      expect(d.q).toBeGreaterThanOrEqual(1);
      expect(d.q).toBeLessThanOrEqual(50);
      expect(d.awarded).toBeLessThanOrEqual(d.marks);
      expect(d.studentAnswer.length).toBeGreaterThan(0);
      expect(d.correctAnswer.length).toBeGreaterThan(0);
    }
  });

  it("distributes 100 marks across the 5 lessons (20 marks each)", () => {
    const { evaluation } = finishedFixture();
    const lessons = lessonTotals(evaluation);
    expect(lessons).toHaveLength(5);
    expect(lessons.map((l) => l.title)).toEqual([
      "Back to School",
      "School Subjects",
      "My Lovely School",
      "My Five Senses",
      "Revision 1",
    ]);
    expect(lessons.map((l) => l.max)).toEqual([20, 20, 20, 20, 20]);
    expect(lessons.reduce((sum, l) => sum + l.max, 0)).toBe(100);
    expect(
      Math.round(lessons.reduce((sum, l) => sum + l.awarded, 0) * 100) / 100
    ).toBe(evaluation.totalEarned);
  });

  it("generates unique attemptIds", () => {
    const ids = new Set(Array.from({ length: 200 }, () => newAttemptId()));
    expect(ids.size).toBe(200);
  });
});

describe("gradeLabel reference thresholds", () => {
  it("maps percentages to the exact Arabic teacher labels", () => {
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

describe("delivery via Mock Fetch", () => {
  it("POSTs text/plain;charset=utf-8 and succeeds on ok:true", async () => {
    const storage = new MemoryStorage();
    const { impl, calls } = mockFetch(['{"ok":true}']);
    const payload = payloadFor();

    await expect(
      sendWithRetry(payload, { fetchImpl: impl, storage, sleep: noSleep })
    ).resolves.toBe(true);

    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe(SHEETS_URL);
    expect(calls[0].init.method).toBe("POST");
    expect(
      (calls[0].init.headers as Record<string, string>)["Content-Type"]
    ).toBe("text/plain;charset=utf-8");
    expect(calls[0].init.redirect).toBe("follow");
    expect(JSON.parse(String(calls[0].init.body))).toMatchObject({
      attemptId: payload.attemptId,
      examId: EXAM_ID,
      examTitle: EXAM_TITLE,
    });
    expect(storage.length).toBe(0);
  });

  it("treats duplicate:true as accepted", async () => {
    const { impl } = mockFetch(['{"duplicate":true}']);
    await expect(
      sendWithRetry(payloadFor(), {
        fetchImpl: impl,
        storage: new MemoryStorage(),
        sleep: noSleep,
      })
    ).resolves.toBe(true);
  });

  it("retries on transient failure and succeeds on second attempt", async () => {
    const { impl, calls } = mockFetch([new Error("network"), '{"ok":true}']);
    await expect(
      sendWithRetry(payloadFor(), {
        fetchImpl: impl,
        storage: new MemoryStorage(),
        sleep: noSleep,
      })
    ).resolves.toBe(true);
    expect(calls).toHaveLength(2);
  });

  it("attempts 3 times with 2000ms then 5000ms backoff and 30000ms timeout constant", async () => {
    expect(MAX_ATTEMPTS).toBe(3);
    expect([...RETRY_DELAYS_MS]).toEqual([2000, 5000]);
    expect(ATTEMPT_TIMEOUT_MS).toBe(30000);

    const slept: number[] = [];
    const { impl, calls } = mockFetch([new Error("offline")]);
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

  it("reuses the exact same attemptId on every retry", async () => {
    const { impl, calls } = mockFetch([new Error("offline")]);
    const payload = payloadFor();
    await sendWithRetry(payload, {
      fetchImpl: impl,
      storage: new MemoryStorage(),
      sleep: noSleep,
    });
    const ids = calls.map((c) => JSON.parse(String(c.init.body)).attemptId);
    expect(ids).toEqual([payload.attemptId, payload.attemptId, payload.attemptId]);
  });

  it("persists failed submissions under pending:grade3-english-curriculum-exam-l1-5-b:<attemptId>", async () => {
    const storage = new MemoryStorage();
    const payload = payloadFor();
    await expect(
      sendWithRetry(payload, {
        fetchImpl: mockFetch([new Error("down")]).impl,
        storage,
        sleep: noSleep,
      })
    ).resolves.toBe(false);

    expect(storage.keys()).toEqual([pendingKey(payload.attemptId)]);
    expect(isPending(payload.attemptId, storage)).toBe(true);
    expect(
      JSON.parse(storage.getItem(pendingKey(payload.attemptId)) as string).attemptId
    ).toBe(payload.attemptId);
  });

  it("rejects non-JSON HTML responses and ok:false responses", async () => {
    const storage = new MemoryStorage();
    await expect(
      sendWithRetry(payloadFor(), {
        fetchImpl: mockFetch(["<html>Sign in</html>"]).impl,
        storage,
        sleep: noSleep,
      })
    ).resolves.toBe(false);
    expect(storage.length).toBe(1);

    await expect(
      sendWithRetry(payloadFor(), {
        fetchImpl: mockFetch(['{"ok":false}']).impl,
        storage: new MemoryStorage(),
        sleep: noSleep,
      })
    ).resolves.toBe(false);
  });

  it("aborts hung requests when timeoutMs elapses", async () => {
    vi.useFakeTimers();
    try {
      const hung: FetchLike = (_url, init) =>
        new Promise((_resolve, reject) => {
          init.signal?.addEventListener("abort", () =>
            reject(new DOMException("Aborted", "AbortError"))
          );
        });
      const pending = sendWithRetry(payloadFor(), {
        fetchImpl: hung,
        storage: new MemoryStorage(),
        sleep: noSleep,
        timeoutMs: 1000,
      });
      await vi.advanceTimersByTimeAsync(1000 * MAX_ATTEMPTS + 20);
      await expect(pending).resolves.toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });

  it("saves pending payload on pagehide via onPageExit", () => {
    const storage = new MemoryStorage();
    const payload = payloadFor();
    const detach = onPageExit(() => savePending(payload, storage));
    window.dispatchEvent(new Event("pagehide"));
    detach();
    expect(isPending(payload.attemptId, storage)).toBe(true);
  });
});

describe("pending queue & retryPending", () => {
  it("flushes queued Version B items and removes them on success", async () => {
    const storage = new MemoryStorage();
    const payload = payloadFor();
    savePending(payload, storage);
    expect(isPending(payload.attemptId, storage)).toBe(true);

    const { impl, calls } = mockFetch(['{"ok":true}']);
    await expect(
      retryPending({ fetchImpl: impl, storage, sleep: noSleep })
    ).resolves.toBe(1);
    expect(calls).toHaveLength(1);
    expect(isPending(payload.attemptId, storage)).toBe(false);
    expect(storage.length).toBe(0);
  });

  it("leaves failed items queued and never touches Version A or other exam keys", async () => {
    const storage = new MemoryStorage();
    const payload = payloadFor();
    savePending(payload, storage);
    storage.setItem(
      "pending:grade3-english-curriculum-exam-l1-5-a:attempt-a",
      '{"attemptId":"attempt-a"}'
    );
    storage.setItem("g3u1-english-exam:v1", "{}");

    const { impl, calls } = mockFetch([new Error("down")]);
    await expect(
      retryPending({ fetchImpl: impl, storage, sleep: noSleep })
    ).resolves.toBe(0);
    expect(calls).toHaveLength(MAX_ATTEMPTS);
    expect(isPending(payload.attemptId, storage)).toBe(true);
    expect(
      storage.getItem("pending:grade3-english-curriculum-exam-l1-5-a:attempt-a")
    ).toBe('{"attemptId":"attempt-a"}');
    expect(storage.getItem("g3u1-english-exam:v1")).toBe("{}");
  });

  it("removes corrupt JSON entries safely without throwing", async () => {
    const storage = new MemoryStorage();
    storage.setItem(`${PENDING_PREFIX}corrupt`, "{bad-json");
    const { impl, calls } = mockFetch(['{"ok":true}']);
    await expect(
      retryPending({ fetchImpl: impl, storage, sleep: noSleep })
    ).resolves.toBe(0);
    expect(calls).toHaveLength(0);
    expect(storage.length).toBe(0);
  });
});
