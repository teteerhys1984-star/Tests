// @vitest-environment jsdom
/**
 * End-to-end delivery flow: pressing "Submit Exam" must publish the contract
 * payload, show the score, and keep the report downloadable — with a MOCKED
 * fetch only. The real Google Sheet endpoint is never contacted.
 */
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "../App";
import { EXAM_ID } from "../config";
import { EXAM_QUESTIONS } from "../data/questions";
import { buildCorrectSheet } from "../lib/grading";
import { PENDING_PREFIX, pendingKey } from "../lib/submit";
import { STORAGE_KEY, startAttempt } from "../lib/storage";
import type { ExamState } from "../types";

const calls: { url: string; init: RequestInit }[] = [];

/** Installs a mock fetch; `replies` is replayed then the last one repeats. */
function installFetch(replies: (string | Error)[]) {
  calls.length = 0;
  let index = 0;
  const mock = vi.fn((url: string, init: RequestInit) => {
    calls.push({ url, init });
    const reply = replies[Math.min(index, replies.length - 1)];
    index += 1;
    if (reply instanceof Error) return Promise.reject(reply);
    return Promise.resolve({ ok: true, text: () => Promise.resolve(reply) } as Response);
  });
  vi.stubGlobal("fetch", mock);
  return mock;
}

function seedAlmostFinished(missingId = "L1-07", startedAgoMs = 95_000): ExamState {
  const sheet = buildCorrectSheet(EXAM_QUESTIONS);
  delete sheet[missingId];
  const state: ExamState = {
    ...startAttempt("Pupil One", Date.now() - startedAgoMs),
    answers: sheet,
    currentIndex: EXAM_QUESTIONS.findIndex((q) => q.id === missingId),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  return state;
}

const submitButton = () => screen.getByRole("button", { name: /Submit Exam/ }) as HTMLButtonElement;

beforeEach(() => {
  localStorage.clear();
  window.history.replaceState(null, "", "/");
  Element.prototype.scrollIntoView = vi.fn();
  window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
  window.HTMLMediaElement.prototype.play = vi.fn(() => Promise.resolve()) as unknown as HTMLMediaElement["play"];
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("Google Sheets delivery (mock fetch only)", () => {
  it("submits a finished attempt and delivers the contract payload", async () => {
    const seeded = seedAlmostFinished();
    const fetchMock = installFetch(['{"ok":true}']);
    render(<App />);

    fireEvent.click(screen.getByLabelText("How old are you?"));
    fireEvent.click(submitButton());

    // The score and the report are visible immediately, before any network reply.
    expect(screen.getByText("Well done, Test Pupil!".replace("Test Pupil", "Pupil One"))).toBeTruthy();
    expect(screen.getByText(/Total score: 100 \/ 100/)).toBeTruthy();
    expect(screen.getByRole("button", { name: /Download report/ })).toBeTruthy();

    await waitFor(() => expect(screen.getByText("Result sent to teacher")).toBeTruthy());
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const body = JSON.parse(String(calls[0].init.body));
    expect(calls[0].init.method).toBe("POST");
    expect(body.examId).toBe(EXAM_ID);
    expect(body.attemptId).toBe(seeded.attemptId);
    expect(body.studentName).toBe("Pupil One");
    expect(body.token.length).toBeGreaterThan(10);
    expect(body.summary).toMatchObject({ total: 100, max: 100, percentage: 100, gradeLabel: "ممتاز" });
    expect(body.lessons).toHaveLength(5);
    expect(body.details.length).toBe(EXAM_QUESTIONS.reduce((s, q) => s + q.parts.length, 0));
    expect(body.reportText).toContain("Total score:       100 / 100");
    expect(localStorage.getItem(pendingKey(seeded.attemptId))).toBeNull();
  });

  it("keeps the result page and the queue when delivery fails", async () => {
    const seeded = seedAlmostFinished();
    installFetch([new Error("offline")]);
    render(<App />);

    fireEvent.click(screen.getByLabelText("How old are you?"));
    fireEvent.click(submitButton());

    await waitFor(() => expect(screen.getByText(/Result not sent yet/)).toBeTruthy(), { timeout: 15_000 });
    // The score, the review and the report still work.
    expect(screen.getByText(/Total score: 100 \/ 100/)).toBeTruthy();
    expect(screen.getByRole("button", { name: /Download report/ })).toBeTruthy();
    expect(localStorage.getItem(`${PENDING_PREFIX}${seeded.attemptId}`)).not.toBeNull();
    expect(screen.getByRole("button", { name: /Resend result/ })).toBeTruthy();
  }, 20_000);

  it("resends a queued result from the results page", async () => {
    const seeded = seedAlmostFinished();
    installFetch([new Error("offline")]);
    render(<App />);
    fireEvent.click(screen.getByLabelText("How old are you?"));
    fireEvent.click(submitButton());
    await waitFor(() => expect(screen.getByText(/Result not sent yet/)).toBeTruthy(), { timeout: 15_000 });

    // The network is back.
    installFetch(['{"ok":true}']);
    fireEvent.click(screen.getByRole("button", { name: /Resend result/ }));
    await waitFor(() => expect(screen.getByText("Result sent to teacher")).toBeTruthy());
    expect(calls).toHaveLength(1);
    expect(JSON.parse(String(calls[0].init.body)).attemptId).toBe(seeded.attemptId);
    expect(localStorage.getItem(`${PENDING_PREFIX}${seeded.attemptId}`)).toBeNull();
  }, 25_000);

  it("flushes a queue left by a previous visit when the app loads", async () => {
    // A previous visit queued a payload, then the tab was closed.
    const seeded = seedAlmostFinished();
    render(<App />);
    fireEvent.click(screen.getByLabelText("How old are you?"));
    // Queue without a successful send by making fetch fail for this round only.
    cleanup();
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...seeded, status: "submitted", submittedAt: Date.now() }));
    const stored = {
      token: "old",
      attemptId: seeded.attemptId,
      examId: EXAM_ID,
      examTitle: "Grade 3 English Curriculum Exam L1-5 A",
      studentName: "Pupil One",
      startAt: new Date(Date.now() - 95_000).toISOString(),
      submitAt: new Date().toISOString(),
      elapsedSec: 95,
      summary: {},
      lessons: [],
      details: [],
      reportText: "x",
    };
    localStorage.setItem(`${PENDING_PREFIX}${seeded.attemptId}`, JSON.stringify(stored));

    installFetch(['{"ok":true}']);
    await act(async () => {
      render(<App />);
    });
    await waitFor(() => expect(calls.length).toBeGreaterThanOrEqual(1));
    expect(JSON.parse(String(calls[0].init.body)).attemptId).toBe(seeded.attemptId);
    await waitFor(() => expect(localStorage.getItem(`${PENDING_PREFIX}${seeded.attemptId}`)).toBeNull());
    // The restored submitted attempt shows that it is already delivered.
    expect(screen.getByText("Result sent to teacher")).toBeTruthy();
  });
});
