// @vitest-environment jsdom
/**
 * End-to-end UI flow inside jsdom — MOCK FETCH ONLY.
 *
 * Verifies: Start screen, Teacher portal gate (start & results, hidden during
 * active exam), progress save & restore on reload, full exam completion ->
 * submit -> results + TXT report, duplicate submission prevention, retry on
 * failure with stable attemptId, pending queue flush on next open, and retake.
 */
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import App from "@/App";
import { EXAM_ID, EXAM_TITLE } from "@/config";
import { QUESTIONS } from "@/data/exam";
import { STORAGE_KEY, type Attempt } from "@/lib/attempt";
import { PENDING_PREFIX, pendingKey, receiptKey } from "@/lib/submit";

function fullKey(): Record<string, string> {
  const key: Record<string, string> = {};
  for (const q of QUESTIONS) {
    for (const it of q.items) {
      key[`${q.id}/${it.id}`] = it.answer;
    }
  }
  return key;
}

function installFetch(replies: (string | Error)[]) {
  const calls: { url: string; init: RequestInit }[] = [];
  let index = 0;
  const mock = vi.fn((url: string, init: RequestInit) => {
    calls.push({ url, init });
    const reply = replies[Math.min(index, replies.length - 1)];
    index += 1;
    if (reply instanceof Error) return Promise.reject(reply);
    return Promise.resolve({ ok: true, text: () => Promise.resolve(reply) } as Response);
  });
  vi.stubGlobal("fetch", mock);
  return { mock, calls };
}

function seedSubmitted(attemptId = "attempt-flow-1", name = "Layan Al-Ahmad"): Attempt {
  const attempt: Attempt = {
    v: 1,
    attemptId,
    name,
    answers: fullKey(),
    startedAt: Date.now() - 95_000,
    currentIndex: 24,
    submittedAt: Date.now(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(attempt));
  return attempt;
}

beforeEach(() => {
  localStorage.clear();
  window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
  Element.prototype.scrollIntoView = vi.fn();
  URL.createObjectURL = vi.fn(() => "blob:mock") as unknown as typeof URL.createObjectURL;
  URL.revokeObjectURL = vi.fn() as unknown as typeof URL.revokeObjectURL;
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("Start screen & teacher gate", () => {
  it("displays exact title, metadata, 25 questions, 100 marks, and gates start on student name", () => {
    installFetch(['{"ok":true}']);
    render(<App />);

    expect(screen.getAllByText(EXAM_TITLE).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("25 questions")).toBeTruthy();
    expect(screen.getByText("100 marks")).toBeTruthy();

    const startBtn = screen.getByRole("button", { name: /Start Exam/i }) as HTMLButtonElement;
    expect(startBtn.disabled).toBe(true);

    fireEvent.change(screen.getByLabelText("Write your full name"), {
      target: { value: "Layan Al-Ahmad" },
    });
    expect(startBtn.disabled).toBe(false);
  });

  it("opens Teacher Answer Key from Start screen behind password somer173", () => {
    installFetch(['{"ok":true}']);
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /Teacher Answer Key/i }));
    fireEvent.change(screen.getByLabelText("Enter teacher password"), {
      target: { value: "wrong" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Unlock Answer Key/i }));
    expect(screen.getByText("Incorrect password.")).toBeTruthy();

    fireEvent.change(screen.getByLabelText("Enter teacher password"), {
      target: { value: "somer173" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Unlock Answer Key/i }));
    expect(screen.getByText(/25 questions · 100 marks · 98 sub-items/i)).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByLabelText("Write your full name")).toBeTruthy();
  });
});

describe("Active exam & refresh persistence", () => {
  it("hides Teacher Key during active exam, restores progress on reload, and unlocks submit at 98/98", async () => {
    const answers = fullKey();
    const lastQ = QUESTIONS[24];
    const lastItem = lastQ.items[3];
    delete answers[`${lastQ.id}/${lastItem.id}`];

    const attempt: Attempt = {
      v: 1,
      attemptId: "attempt-in-progress-1",
      name: "Omar Tarek",
      startedAt: Date.now() - 40_000,
      answers,
      currentIndex: 24,
      submittedAt: null,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(attempt));

    const { calls } = installFetch(['{"ok":true}']);
    render(<App />);

    expect(screen.getByText("Omar Tarek")).toBeTruthy();
    expect(screen.getByText("97/98 parts")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Teacher Answer Key/i })).toBeNull();
    expect(screen.queryByText(/Correct answer/i)).toBeNull();

    const submitBtn = screen.getByRole("button", { name: /Submit Exam/i }) as HTMLButtonElement;
    expect(submitBtn.disabled).toBe(true);

    // Fill the missing 98th item (q25d text input)
    fireEvent.change(screen.getByLabelText("Part d answer"), {
      target: { value: lastItem.answer },
    });
    expect(screen.getByText("98/98 parts")).toBeTruthy();
    expect(submitBtn.disabled).toBe(false);

    // Simulate reload before submitting: unmount & render again from localStorage
    cleanup();
    render(<App />);
    expect(screen.getByText("Omar Tarek")).toBeTruthy();
    expect(screen.getByText("98/98 parts")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /Submit Exam/i }));

    await waitFor(() =>
      expect(screen.getByText(/Result recorded and sent to the teacher's sheet\./i)).toBeTruthy(),
    );
    expect(calls).toHaveLength(1);
    const body = JSON.parse(String(calls[0].init.body));
    expect(body.examId).toBe(EXAM_ID);
    expect(body.summary.total).toBe(100);
    expect(body.summary.correctSubparts).toBe(98);
    expect(body.details).toHaveLength(98);
  });
});

describe("Results delivery, duplicate prevention & retry (Mock Fetch ONLY)", () => {
  it("prevents duplicate submission when receipt already exists on refresh", async () => {
    const attempt = seedSubmitted("attempt-already-sent");
    localStorage.setItem(receiptKey(attempt.attemptId), new Date().toISOString());

    const { mock } = installFetch(['{"ok":true}']);
    render(<App />);

    expect(screen.getByText("100")).toBeTruthy();
    expect(screen.getByText(/Result recorded and sent to the teacher's sheet\./i)).toBeTruthy();
    await new Promise((r) => setTimeout(r, 50));
    expect(mock).not.toHaveBeenCalled();
  });

  it(
    "retains score and report on send failure, queues pending key, and resends with same attemptId",
    async () => {
      seedSubmitted("attempt-flow-retry");
      const { mock, calls } = installFetch([
        new Error("network down"),
        new Error("network down"),
        new Error("network down"),
        '{"ok":true}',
      ]);
      render(<App />);

      await waitFor(
        () => expect(screen.getByText(/automatic sending did not complete/i)).toBeTruthy(),
        { timeout: 20_000 },
      );
      expect(mock).toHaveBeenCalledTimes(3);
      expect(screen.getByText("100")).toBeTruthy();
      expect(screen.getByRole("button", { name: /Download Report \(TXT\)/i })).toBeTruthy();

      const pending = pendingKey("attempt-flow-retry");
      expect(pending.startsWith(PENDING_PREFIX)).toBe(true);
      expect(localStorage.getItem(pending)).not.toBeNull();

      fireEvent.click(screen.getByRole("button", { name: /Resend result/i }));

      await waitFor(
        () =>
          expect(screen.getByText(/Result recorded and sent to the teacher's sheet\./i)).toBeTruthy(),
        { timeout: 20_000 },
      );
      expect(mock).toHaveBeenCalledTimes(4);

      const ids = calls.map((c) => JSON.parse(String(c.init.body)).attemptId);
      expect(new Set(ids)).toEqual(new Set(["attempt-flow-retry"]));
      expect(localStorage.getItem(pending)).toBeNull();
    },
    30_000,
  );

  it("flushes pending payload on next app load and supports Retake Exam", async () => {
    localStorage.setItem(
      pendingKey("attempt-pending-old"),
      JSON.stringify({
        token: "old",
        attemptId: "attempt-pending-old",
        examId: EXAM_ID,
        examTitle: EXAM_TITLE,
        studentName: "Pupil Old",
        startAt: new Date().toISOString(),
        submitAt: new Date().toISOString(),
        elapsedSec: 60,
        summary: {},
        lessons: [],
        details: [],
        reportText: "report",
      }),
    );

    const { calls } = installFetch(['{"ok":true}']);
    render(<App />);

    await waitFor(() => expect(calls).toHaveLength(1));
    expect(JSON.parse(String(calls[0].init.body)).attemptId).toBe("attempt-pending-old");
    expect(localStorage.getItem(pendingKey("attempt-pending-old"))).toBeNull();

    // Now test Retake Exam from submitted view
    cleanup();
    seedSubmitted("attempt-retake");
    localStorage.setItem(receiptKey("attempt-retake"), new Date().toISOString());
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /Retake Exam/i }));
    expect(screen.getByLabelText("Write your full name")).toBeTruthy();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});
