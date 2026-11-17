// @vitest-environment jsdom
/**
 * Delivery flow in a real DOM (jsdom) — MOCK FETCH ONLY.
 *
 * Covers the behaviour a pupil sees: the results page is shown immediately, a
 * failed or missing delivery is visible, a pending result is retried when the
 * exam is opened, a delivered attempt is not sent twice, and a manual resend
 * reuses the same attemptId.
 */
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import App from "@/App";
import Results from "@/components/Results";
import { EXAM_ID, EXAM_TITLE } from "@/config";
import { ALL_PARTS, QUESTIONS } from "@/data/questions";
import { gradeExam } from "@/lib/grading";
import { buildReport } from "@/lib/report";
import { STORAGE_KEY, newAttemptId, type Attempt } from "@/lib/storage";
import {
  buildPayload,
  hasReceipt,
  isPending,
  pendingKey,
  receiptKey,
} from "@/lib/submit";

const A_ATTEMPT_KEY = "grade5-english-curriculum-exam-l1-5-a-attempt-v1";
const A_PENDING_KEY = "pending:grade5-english-curriculum-exam-l1-5-a:a-attempt";

function fullAnswers(): Record<string, string> {
  const answers: Record<string, string> = {};
  for (const part of ALL_PARTS) answers[part.id] = part.accept[0];
  return answers;
}

function submittedAttempt(overrides: Partial<Attempt> = {}): Attempt {
  return {
    v: 1,
    attemptId: "browser-attempt-b",
    name: "Flow Student",
    answers: fullAnswers(),
    startTs: Date.UTC(2026, 4, 12, 9, 0, 0),
    current: 0,
    status: "submitted",
    submittedTs: Date.UTC(2026, 4, 12, 9, 20, 0),
    elapsedMs: 1_200_000,
    model: "B",
    ...overrides,
  };
}

function pendingPayload(attempt: Attempt) {
  const result = gradeExam(attempt.answers);
  const reportText = buildReport({
    name: attempt.name,
    result,
    submittedTs: attempt.submittedTs!,
    elapsedMs: attempt.elapsedMs!,
  });
  return buildPayload({ attempt, result, questions: QUESTIONS, reportText });
}

function okFetch() {
  return vi.fn(
    async (_url: string, _init: RequestInit) =>
      ({ text: async () => '{"ok":true}' }) as unknown as Response
  );
}

beforeEach(() => {
  window.localStorage.clear();
  window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("opening the exam with an undelivered submitted attempt", () => {
  it("retries the pending payload silently and shows the success state", async () => {
    const attempt = submittedAttempt();
    const payload = pendingPayload(attempt);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(attempt));
    window.localStorage.setItem(pendingKey(attempt.attemptId), JSON.stringify(payload));

    const fetchMock = okFetch();
    vi.stubGlobal("fetch", fetchMock);

    render(<App />);

    await waitFor(() =>
      expect(screen.getByText("Your result was sent to your teacher.")).toBeTruthy()
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const body = JSON.parse(String(fetchMock.mock.calls[0][1].body));
    expect(body.attemptId).toBe(attempt.attemptId);
    expect(body.examId).toBe(EXAM_ID);
    expect(body.examTitle).toBe(EXAM_TITLE);
    expect(body.summary.total).toBe(100);
    expect(body.details).toHaveLength(59);
    expect(isPending(attempt.attemptId)).toBe(false);
    expect(hasReceipt(attempt.attemptId)).toBe(true);
    expect(window.localStorage.getItem(pendingKey(attempt.attemptId))).toBeNull();
  });

  it("never sends a delivered attempt again on refresh", async () => {
    const attempt = submittedAttempt();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(attempt));
    window.localStorage.setItem(receiptKey(attempt.attemptId), "2026-05-12T09:21:00.000Z");

    const fetchMock = okFetch();
    vi.stubGlobal("fetch", fetchMock);

    render(<App />);

    await waitFor(() => expect(screen.getByText("Your result was sent to your teacher.")).toBeTruthy());
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("shows an explicit 'not sent yet' state with a resend button", async () => {
    const attempt = submittedAttempt();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(attempt));

    const fetchMock = okFetch();
    vi.stubGlobal("fetch", fetchMock);

    render(<App />);

    await waitFor(() =>
      expect(screen.getByText("This result has not been sent to your teacher yet.")).toBeTruthy()
    );
    const button = screen.getByRole("button", { name: "Resend result" });
    fireEvent.click(button);

    await waitFor(() =>
      expect(screen.getByText("Your result was sent to your teacher.")).toBeTruthy()
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const body = JSON.parse(String(fetchMock.mock.calls[0][1].body));
    expect(body.attemptId).toBe(attempt.attemptId);
    expect(hasReceipt(attempt.attemptId)).toBe(true);
  });

  it("never touches Version A's attempt or pending payload", async () => {
    const attempt = submittedAttempt();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(attempt));
    window.localStorage.setItem(pendingKey(attempt.attemptId), JSON.stringify(pendingPayload(attempt)));
    const aAttempt = JSON.stringify({ name: "A Pupil", answers: {}, startTs: 1, status: "submitted" });
    const aPending = JSON.stringify({ attemptId: "a-attempt", examId: "grade5-english-curriculum-exam-l1-5-a" });
    window.localStorage.setItem(A_ATTEMPT_KEY, aAttempt);
    window.localStorage.setItem(A_PENDING_KEY, aPending);

    const fetchMock = okFetch();
    vi.stubGlobal("fetch", fetchMock);

    render(<App />);

    await waitFor(() =>
      expect(screen.getByText("Your result was sent to your teacher.")).toBeTruthy()
    );
    expect(window.localStorage.getItem(A_ATTEMPT_KEY)).toBe(aAttempt);
    expect(window.localStorage.getItem(A_PENDING_KEY)).toBe(aPending);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(JSON.parse(String(fetchMock.mock.calls[0][1].body)).attemptId).toBe(attempt.attemptId);
  });
});

describe("starting a new attempt", () => {
  it("creates its own attemptId and writes only its own storage key", () => {
    const aAttempt = JSON.stringify({ name: "A Pupil", answers: {}, startTs: 1, status: "active" });
    window.localStorage.setItem(A_ATTEMPT_KEY, aAttempt);
    const fetchMock = okFetch();
    vi.stubGlobal("fetch", fetchMock);

    render(<App />);

    fireEvent.change(screen.getByLabelText("Student's full name"), {
      target: { value: "New Pupil" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Start Exam" }));

    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY)!);
    expect(stored.name).toBe("New Pupil");
    expect(stored.status).toBe("active");
    expect(stored.model).toBe("B");
    expect(typeof stored.attemptId).toBe("string");
    expect(stored.attemptId.length).toBeGreaterThan(8);
    expect(stored.attemptId).not.toBe("a-attempt");
    expect(window.localStorage.getItem(A_ATTEMPT_KEY)).toBe(aAttempt);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(newAttemptId()).not.toBe(stored.attemptId);
  });
});

describe("results page delivery states", () => {
  const result = gradeExam(fullAnswers());
  const props = {
    name: "Flow Student",
    result,
    submittedTs: Date.UTC(2026, 4, 12, 9, 20, 0),
    elapsedMs: 1_200_000,
    muted: true,
    onToggleMute: () => {},
    onRestart: () => {},
    onOpenTeacher: () => {},
    attemptId: "attempt-ui",
  };

  it("shows the failure state, keeps the score and the report, and offers a resend", () => {
    const onResend = vi.fn();
    render(<Results {...props} delivery="failed" onResend={onResend} />);

    expect(
      screen.getByText(
        "Your result could not be sent yet. It is saved on this device and will be retried automatically when you open the exam again."
      )
    ).toBeTruthy();
    expect(screen.getAllByText("100").length).toBeGreaterThan(0);
    expect(screen.getAllByText(/out of 100/).length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: /Download Report/ })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Resend result" }));
    expect(onResend).toHaveBeenCalledTimes(1);
  });

  it("shows the sending state without a resend button", () => {
    render(<Results {...props} delivery="sending" onResend={() => {}} />);
    expect(screen.getByText("Sending your result to your teacher…")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Resend result" })).toBeNull();
  });

  it("shows the success state without a resend button", () => {
    render(<Results {...props} delivery="success" onResend={() => {}} />);
    expect(screen.getByText("Your result was sent to your teacher.")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Resend result" })).toBeNull();
  });

  it("shows the exam identity and the English grade label", () => {
    render(<Results {...props} delivery="success" onResend={() => {}} />);
    expect(screen.getAllByText(EXAM_TITLE).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Semester 1/).length).toBeGreaterThan(0);
    expect(screen.getByText("Excellent")).toBeTruthy();
    expect(screen.getByText(/Result ID: attempt-ui/)).toBeTruthy();
  });
});
