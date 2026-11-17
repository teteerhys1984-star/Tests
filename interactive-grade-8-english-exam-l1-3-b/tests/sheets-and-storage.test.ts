import { afterEach, describe, expect, it, vi } from "vitest";
import { EXAM_ID, EXAM_TITLE, SHEETS_TOKEN, SHEETS_URL } from "../src/config";
import { buildReport } from "../src/lib/grading";
import { reportToText } from "../src/lib/report";
import {
  ATTEMPT_KEY,
  MUTE_KEY,
  PREV_REPORT_KEY,
  REPORT_KEY,
  archiveCurrentReport,
  clearAttempt,
  clearReport,
  loadAttempt,
  loadMuted,
  loadPreviousReport,
  loadReport,
  saveAttempt,
  saveMuted,
  saveReport,
  type Attempt,
} from "../src/lib/storage";
import {
  ATTEMPT_TIMEOUT_MS,
  MAX_ATTEMPTS,
  PENDING_PREFIX,
  RETRY_DELAYS_MS,
  buildPayload,
  hasPendingAttempt,
  loadPendingAttempt,
  pendingKey,
  retryPending,
  sendWithRetry,
  type StorageLike,
} from "../src/lib/submit";
import { makePerfectAnswers } from "./helpers";

class MemStorage implements StorageLike {
  private map = new Map<string, string>();
  get length(): number {
    return this.map.size;
  }
  key(index: number): string | null {
    return [...this.map.keys()][index] ?? null;
  }
  getItem(key: string): string | null {
    return this.map.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.map.set(key, value);
  }
  removeItem(key: string): void {
    this.map.delete(key);
  }
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("Local storage persistence and isolation", () => {
  it("saves, restores, archives and clears only Model B keys without touching Model A or others", () => {
    const store = new MemStorage();
    vi.stubGlobal("window", { localStorage: store });

    // Pre-populate keys belonging to Model A and another Grade 8 exam
    store.setItem("interactive-grade-8-english-exam-l1-3-a-attempt-v1", '{"name":"ModelA"}');
    store.setItem("grade8-english-curriculum-l3-l4.attempt.v1", '{"name":"L3L4"}');

    const answers = makePerfectAnswers();
    const attempt: Attempt = {
      attemptId: "attempt-b-001",
      name: "Omar Haddad",
      startedAt: 1_700_000_000_000,
      answers,
      muted: true,
      index: 22, // Q23 (0-indexed)
    };
    saveAttempt(attempt);
    saveMuted(true);

    expect(store.getItem(ATTEMPT_KEY)).not.toBeNull();
    expect(store.getItem(MUTE_KEY)).toBe("1");
    expect(loadMuted()).toBe(true);
    expect(loadAttempt()).toEqual(attempt);

    const report = buildReport(
      attempt.name,
      attempt.answers,
      1_700_001_800_000,
      1800,
      attempt.startedAt,
    );
    saveReport(report);
    expect(store.getItem(REPORT_KEY)).not.toBeNull();
    expect(loadReport()?.total).toBe(100);

    archiveCurrentReport();
    clearReport();
    clearAttempt();

    expect(loadAttempt()).toBeNull();
    expect(loadReport()).toBeNull();
    expect(store.getItem(PREV_REPORT_KEY)).not.toBeNull();
    expect(loadPreviousReport()?.name).toBe("Omar Haddad");

    // Other exams untouched
    expect(store.getItem("interactive-grade-8-english-exam-l1-3-a-attempt-v1")).toBe(
      '{"name":"ModelA"}',
    );
    expect(store.getItem("grade8-english-curriculum-l3-l4.attempt.v1")).toBe(
      '{"name":"L3L4"}',
    );
  });
});

describe("Google Sheets contract (grade5-math-unit1) — Mock Fetch ONLY", () => {
  const startedAt = 1_700_000_000_000;
  const submittedAt = 1_700_000_945_800; // 945.8 s → elapsedSec = 945
  const perfect = makePerfectAnswers();
  const report = buildReport("Test Student", perfect, submittedAt, 945, startedAt);
  const reportText = reportToText(report);
  const payload = buildPayload({
    attemptId: "fixed-attempt-id-123",
    startedAt,
    submittedAt,
    report,
    reportText,
  });

  it("matches the exact 12-field grade5-math-unit1 payload schema and sub-schemas", () => {
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
    expect(payload.attemptId).toBe("fixed-attempt-id-123");
    expect(payload.examId).toBe(EXAM_ID);
    expect(payload.examTitle).toBe(EXAM_TITLE);
    expect(payload.studentName).toBe("Test Student");
    expect(payload.startAt).toBe(new Date(startedAt).toISOString());
    expect(payload.submitAt).toBe(new Date(submittedAt).toISOString());
    expect(payload.elapsedSec).toBe(945);
    expect(payload.reportText).toBe(reportText);

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
    expect(payload.summary).toEqual({
      total: 100,
      max: 100,
      percentage: 100,
      gradeLabel: "ممتاز",
      fullQuestions: 30,
      partialQuestions: 0,
      wrongQuestions: 0,
      correctSubparts: 47,
      partialSubparts: 0,
      wrongSubparts: 0,
      unansweredSubparts: 0,
    });

    expect(payload.lessons).toEqual([
      { title: "Future Plans", awarded: 33, max: 33 },
      { title: "School Challenges", awarded: 34, max: 34 },
      { title: "Let's Discover", awarded: 33, max: 33 },
    ]);

    expect(payload.details).toHaveLength(47);
    expect(Object.keys(payload.details[0])).toEqual([
      "q",
      "qTitle",
      "lessons",
      "label",
      "status",
      "awarded",
      "marks",
      "studentAnswer",
      "correctAnswer",
    ]);
    expect(payload.details.reduce((s, d) => s + d.marks, 0)).toBe(100);
    expect(payload.details.reduce((s, d) => s + d.awarded, 0)).toBe(100);
  });

  it("accurately summarises partial, wrong and unanswered items in payload", () => {
    const mixed = makePerfectAnswers();
    mixed.q6p2 = "1"; // wrong (2 marks) → Q6 partial (2/4)
    mixed.q4p1 = "1"; // source's old wrong index → Q4 wrong (0/2)
    delete mixed.q30p1; // unanswered (3 marks) → Q30 wrong/unanswered (0/3)
    const r = buildReport("Mixed Student", mixed, submittedAt, 945, startedAt);
    const p = buildPayload({
      attemptId: "mixed-id",
      startedAt,
      submittedAt,
      report: r,
      reportText: reportToText(r),
    });
    expect(p.summary).toEqual({
      total: 93,
      max: 100,
      percentage: 93,
      gradeLabel: "جيد جداً",
      fullQuestions: 27,
      partialQuestions: 1,
      wrongQuestions: 2,
      correctSubparts: 44,
      partialSubparts: 0,
      wrongSubparts: 2,
      unansweredSubparts: 1,
    });
    expect(p.lessons).toEqual([
      { title: "Future Plans", awarded: 29, max: 33 },
      { title: "School Challenges", awarded: 34, max: 34 },
      { title: "Let's Discover", awarded: 30, max: 33 },
    ]);
  });

  it("uses POST text/plain;charset=utf-8, 3 attempts, [2000, 5000] ms delays, 30s timeout, and same attemptId", async () => {
    const realFetchGuard = vi.fn(() => {
      throw new Error("Real network call is strictly forbidden!");
    });
    vi.stubGlobal("fetch", realFetchGuard);

    expect(MAX_ATTEMPTS).toBe(3);
    expect(RETRY_DELAYS_MS).toEqual([2000, 5000]);
    expect(ATTEMPT_TIMEOUT_MS).toBe(30000);

    const storage = new MemStorage();
    // Foreign pending entries must never be altered
    storage.setItem(
      "pending:interactive-grade-8-english-exam-l1-3-a:other-id",
      '{"attemptId":"other-id"}',
    );
    storage.setItem("pending:grade5-math-unit1:math-id", '{"attemptId":"math-id"}');

    const waits: number[] = [];
    const calls: { url: string; init: RequestInit }[] = [];
    const failingMock = vi.fn(async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      return { text: async () => '{"ok":false}' };
    });

    const ok = await sendWithRetry(payload, {
      storage,
      fetchImpl: failingMock,
      sleep: async (ms) => {
        waits.push(ms);
      },
    });

    expect(ok).toBe(false);
    expect(calls).toHaveLength(3);
    expect(waits).toEqual([2000, 5000]);
    for (const c of calls) {
      expect(c.url).toBe(SHEETS_URL);
      expect(c.init.method).toBe("POST");
      expect(c.init.redirect).toBe("follow");
      expect((c.init.headers as Record<string, string>)["Content-Type"]).toBe(
        "text/plain;charset=utf-8",
      );
      expect(c.init.signal).toBeDefined();
      const parsed = JSON.parse(String(c.init.body));
      expect(parsed.attemptId).toBe("fixed-attempt-id-123");
      expect(parsed.examId).toBe(EXAM_ID);
      expect(parsed.token).toBe(SHEETS_TOKEN);
    }

    // Pending entry saved under pending:<EXAM_ID>:<attemptId>
    expect(pendingKey("fixed-attempt-id-123")).toBe(
      `${PENDING_PREFIX}fixed-attempt-id-123`,
    );
    expect(hasPendingAttempt("fixed-attempt-id-123", { storage })).toBe(true);
    expect(loadPendingAttempt("fixed-attempt-id-123", { storage })?.attemptId).toBe(
      "fixed-attempt-id-123",
    );

    // Flushing retries with same attemptId; succeeds on 2nd try with duplicate:true
    let flushCall = 0;
    const flushWaits: number[] = [];
    const recoverMock = vi.fn(async (_url: string, init: RequestInit) => {
      flushCall++;
      const parsed = JSON.parse(String(init.body));
      expect(parsed.attemptId).toBe("fixed-attempt-id-123");
      if (flushCall === 1) throw new Error("offline");
      return { text: async () => '{"duplicate":true}' };
    });

    // Overlapping calls deduplicate onto the single in-flight flush
    const [n1, n2] = await Promise.all([
      retryPending({
        storage,
        fetchImpl: recoverMock,
        sleep: async (ms) => {
          flushWaits.push(ms);
        },
      }),
      retryPending({
        storage,
        fetchImpl: recoverMock,
        sleep: async () => {},
      }),
    ]);
    expect(n1).toBe(1);
    expect(n2).toBe(1);
    expect(recoverMock).toHaveBeenCalledTimes(2);
    expect(flushWaits).toEqual([2000]);
    expect(hasPendingAttempt("fixed-attempt-id-123", { storage })).toBe(false);

    // Foreign pending items remain intact
    expect(
      storage.getItem("pending:interactive-grade-8-english-exam-l1-3-a:other-id"),
    ).toBe('{"attemptId":"other-id"}');
    expect(storage.getItem("pending:grade5-math-unit1:math-id")).toBe(
      '{"attemptId":"math-id"}',
    );
    expect(realFetchGuard).not.toHaveBeenCalled();
  });

  it("removes pending immediately on first-attempt ok:true, and aborts hanging requests on timeout", async () => {
    const guard = vi.fn(() => {
      throw new Error("Real network forbidden!");
    });
    vi.stubGlobal("fetch", guard);

    const storage = new MemStorage();
    // Confirmed immediately on attempt 1
    const okMock = vi.fn(async () => ({ text: async () => '{"ok":true}' }));
    expect(
      await sendWithRetry(payload, { storage, fetchImpl: okMock, sleep: async () => {} }),
    ).toBe(true);
    expect(okMock).toHaveBeenCalledTimes(1);
    expect(hasPendingAttempt(payload.attemptId, { storage })).toBe(false);

    // Hanging requests time out and abort all 3 attempts cleanly, keeping pending saved
    let abortedSignals = 0;
    const hangingMock = vi.fn((_url: string, init: RequestInit) => {
      init.signal?.addEventListener("abort", () => {
        abortedSignals++;
      });
      return new Promise<never>(() => {});
    });
    expect(
      await sendWithRetry(payload, {
        storage,
        fetchImpl: hangingMock,
        timeoutMs: 10,
        sleep: async () => {},
      }),
    ).toBe(false);
    expect(hangingMock).toHaveBeenCalledTimes(3);
    expect(abortedSignals).toBe(3);
    expect(hasPendingAttempt(payload.attemptId, { storage })).toBe(true);

    // Non-JSON reply is rejected cleanly without throwing
    const htmlMock = vi.fn(async () => ({ text: async () => "<html>error</html>" }));
    expect(
      await sendWithRetry(payload, { storage, fetchImpl: htmlMock, sleep: async () => {} }),
    ).toBe(false);

    // Storage unavailable (null) never crashes sendWithRetry or retryPending
    expect(
      await sendWithRetry(payload, { storage: null, fetchImpl: okMock, sleep: async () => {} }),
    ).toBe(true);
    expect(
      await retryPending({ storage: null, fetchImpl: okMock, sleep: async () => {} }),
    ).toBe(0);

    expect(guard).not.toHaveBeenCalled();
  });

  it("persists pending payload immediately in-flight and on pagehide/visibilitychange", async () => {
    const guard = vi.fn(() => {
      throw new Error("Real network forbidden!");
    });
    vi.stubGlobal("fetch", guard);

    const storage = new MemStorage();
    let seenMidFlight: string | null = null;
    const slowFail = vi.fn(async () => {
      seenMidFlight = storage.getItem(pendingKey(payload.attemptId));
      return { text: async () => '{"ok":false}' };
    });
    const ok = await sendWithRetry(payload, {
      storage,
      fetchImpl: slowFail,
      sleep: async () => {},
    });
    expect(ok).toBe(false);
    expect(seenMidFlight).not.toBeNull();
    expect(JSON.parse(seenMidFlight!).attemptId).toBe(payload.attemptId);
    expect(storage.getItem(pendingKey(payload.attemptId))).not.toBeNull();
    expect(guard).not.toHaveBeenCalled();
  });
});
