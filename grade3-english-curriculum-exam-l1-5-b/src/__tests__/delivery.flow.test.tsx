// @vitest-environment jsdom
/**
 * End-to-end Google Sheets delivery UI workflow tests (Mock Fetch ONLY).
 *
 * Verifies:
 *  1. Submitting a completed exam immediately shows the score & TXT download
 *     and posts the full reference contract payload to Google Sheets.
 *  2. Network failure queues the payload locally under
 *     `pending:grade3-english-curriculum-exam-l1-5-b:<attemptId>`, displays
 *     clear non-blocking status + Resend Result button, and keeps score/review/TXT
 *     report completely accessible.
 *  3. Manual Resend Result button resends with the exact same `attemptId` and
 *     clears the local queue on success.
 *  4. Reopening the exam automatically flushes queued pending submissions via
 *     `retryPending()` and updates the UI status.
 */
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "../App";
import { EXAM_ID, EXAM_TITLE } from "../config";
import { EXAM_QUESTIONS } from "../data/questions";
import { AnswerMap, ExamSessionState, SingleChoiceQuestion } from "../types/exam";
import { STORAGE_KEY, newAttemptId } from "../utils/storage";
import { PENDING_PREFIX, pendingKey } from "../utils/submit";

const calls: { url: string; init: RequestInit }[] = [];

function installFetch(replies: (string | Error)[]) {
  calls.length = 0;
  let index = 0;
  const mock = vi.fn((url: string, init: RequestInit) => {
    calls.push({ url, init });
    const reply = replies[Math.min(index, replies.length - 1)];
    index += 1;
    if (reply instanceof Error) return Promise.reject(reply);
    return Promise.resolve({
      ok: true,
      text: () => Promise.resolve(reply),
    } as Response);
  });
  vi.stubGlobal("fetch", mock);
  return mock;
}

function buildAllCorrectSheet(): AnswerMap {
  const sheet: AnswerMap = {};
  for (const q of EXAM_QUESTIONS) {
    if (q.type === "single-choice") {
      sheet[q.id] = { type: "single-choice", value: q.correctAnswer };
    } else if (q.type === "choice-parts" || q.type === "match") {
      const values: Record<string, string> = {};
      for (const p of q.parts) values[p.id] = p.correctAnswer;
      sheet[q.id] = { type: "parts", values };
    } else if (q.type === "text-parts") {
      const values: Record<string, string> = {};
      for (const p of q.parts) values[p.id] = p.correctDisplay;
      sheet[q.id] = { type: "parts", values };
    } else if (q.type === "reorder") {
      const targetWords = q.correctSentence.slice(0, -1).split(" ");
      const used = new Set<number>();
      const chosenIndices = targetWords.map((word) => {
        const idx = q.words.findIndex((w, i) => w === word && !used.has(i));
        used.add(idx);
        return idx;
      });
      sheet[q.id] = { type: "reorder", chosenIndices };
    }
  }
  return sheet;
}

function seedAlmostFinished(startedAgoMs = 95_000): {
  session: ExamSessionState;
  missingQuestion: SingleChoiceQuestion;
} {
  const sheet = buildAllCorrectSheet();
  const missingIndex = EXAM_QUESTIONS.findIndex((q) => q.type === "single-choice");
  const missingQuestion = EXAM_QUESTIONS[missingIndex] as SingleChoiceQuestion;
  delete sheet[missingQuestion.id];

  const now = Date.now();
  const session: ExamSessionState = {
    version: 1,
    attemptId: newAttemptId(),
    phase: "in_progress",
    studentName: "Pupil One",
    currentQuestionIndex: missingIndex,
    answers: sheet,
    startTimestamp: now - startedAgoMs,
    elapsedSeconds: Math.floor(startedAgoMs / 1000),
    lastTickTimestamp: now,
    submittedAt: null,
    muted: true,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  return { session, missingQuestion };
}

beforeEach(() => {
  localStorage.clear();
  window.scrollTo = vi.fn();
  vi.spyOn(window.HTMLMediaElement.prototype, "play").mockImplementation(() =>
    Promise.resolve()
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("Google Sheets delivery UI workflow (Mock Fetch only)", () => {
  it("submits immediately, displays score & TXT download, and delivers the contract payload", async () => {
    const { session, missingQuestion } = seedAlmostFinished();
    const fetchMock = installFetch(['{"ok":true}']);
    render(<App />);

    fireEvent.click(
      screen.getByRole("radio", { name: new RegExp(missingQuestion.correctAnswer) })
    );
    fireEvent.click(screen.getByTestId("submit-exam-btn"));

    // Score and TXT report button are visible immediately without blocking on network
    expect(screen.getByText("Final Exam Results")).toBeTruthy();
    expect(screen.getByTestId("total-score").textContent?.replace(/\s+/g, " ").trim()).toBe(
      "100 / 100"
    );
    expect(screen.getByTestId("download-txt-btn")).toBeTruthy();

    await waitFor(() =>
      expect(screen.getByText("Result sent to teacher")).toBeTruthy()
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const body = JSON.parse(String(calls[0].init.body));
    expect(calls[0].init.method).toBe("POST");
    expect(body.examId).toBe(EXAM_ID);
    expect(body.examTitle).toBe(EXAM_TITLE);
    expect(body.attemptId).toBe(session.attemptId);
    expect(body.studentName).toBe("Pupil One");
    expect(body.summary).toMatchObject({
      total: 100,
      max: 100,
      percentage: 100,
      gradeLabel: "ممتاز",
    });
    expect(body.lessons).toHaveLength(5);
    expect(body.details).toHaveLength(143);
    expect(body.reportText).toContain("Total Score         : 100 / 100 (100%)");
    expect(localStorage.getItem(pendingKey(session.attemptId))).toBeNull();
  });

  it("queues locally on failure without blocking results, review, or TXT report, then manually resends", async () => {
    const { session, missingQuestion } = seedAlmostFinished();
    installFetch([new Error("offline")]);
    render(<App />);

    fireEvent.click(
      screen.getByRole("radio", { name: new RegExp(missingQuestion.correctAnswer) })
    );
    fireEvent.click(screen.getByTestId("submit-exam-btn"));

    await waitFor(
      () => expect(screen.getByText(/Result not sent yet/)).toBeTruthy(),
      { timeout: 12_000 }
    );

    // Score, review, and TXT download remain completely accessible
    expect(screen.getByTestId("total-score").textContent?.replace(/\s+/g, " ").trim()).toBe(
      "100 / 100"
    );
    expect(screen.getByTestId("download-txt-btn")).toBeTruthy();
    expect(screen.getByText("Detailed Review of All 50 Questions")).toBeTruthy();
    expect(localStorage.getItem(`${PENDING_PREFIX}${session.attemptId}`)).not.toBeNull();

    const resendBtn = screen.getByTestId("resend-result-btn");
    expect(resendBtn).toBeTruthy();

    // Restore connectivity and click Resend Result
    installFetch(['{"ok":true}']);
    fireEvent.click(resendBtn);

    await waitFor(() =>
      expect(screen.getByText("Result sent to teacher")).toBeTruthy()
    );
    expect(calls).toHaveLength(1);
    expect(JSON.parse(String(calls[0].init.body)).attemptId).toBe(session.attemptId);
    expect(localStorage.getItem(`${PENDING_PREFIX}${session.attemptId}`)).toBeNull();
  }, 25_000);

  it("automatically flushes queued submissions when the exam opens again", async () => {
    const { session } = seedAlmostFinished();
    const submittedSession: ExamSessionState = {
      ...session,
      phase: "submitted",
      submittedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(submittedSession));
    localStorage.setItem(
      pendingKey(session.attemptId),
      JSON.stringify({
        token: "old",
        attemptId: session.attemptId,
        examId: EXAM_ID,
        examTitle: EXAM_TITLE,
        studentName: "Pupil One",
        startAt: new Date(Date.now() - 95_000).toISOString(),
        submitAt: new Date().toISOString(),
        elapsedSec: 95,
        summary: {},
        lessons: [],
        details: [],
        reportText: "queued report",
      })
    );

    installFetch(['{"ok":true}']);
    await act(async () => {
      render(<App />);
    });

    await waitFor(() => expect(calls.length).toBeGreaterThanOrEqual(1));
    expect(JSON.parse(String(calls[0].init.body)).attemptId).toBe(session.attemptId);
    await waitFor(() =>
      expect(localStorage.getItem(pendingKey(session.attemptId))).toBeNull()
    );
    await waitFor(() =>
      expect(screen.getByText("Result sent to teacher")).toBeTruthy()
    );
  });
});
