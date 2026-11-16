// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "../App";
import { EXAM_QUESTIONS } from "../data/questions";
import { buildCorrectSheet } from "../lib/grading";
import { STORAGE_KEY, startAttempt } from "../lib/storage";
import type { ExamState } from "../types";

const submitButton = () => screen.getByRole("button", { name: /Submit Exam/ }) as HTMLButtonElement;

function seedAlmostFinished(missingId: string, startedAgoMs = 65_000): ExamState {
  const sheet = buildCorrectSheet(EXAM_QUESTIONS);
  delete sheet[missingId];
  const state: ExamState = {
    ...startAttempt("Test Pupil", Date.now() - startedAgoMs),
    answers: sheet,
    currentIndex: EXAM_QUESTIONS.findIndex((q) => q.id === missingId),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  return state;
}

let playSpy: ReturnType<typeof vi.fn>;
let confirmSpy: ReturnType<typeof vi.fn>;

beforeEach(() => {
  localStorage.clear();
  window.history.replaceState(null, "", "/");
  Element.prototype.scrollIntoView = vi.fn();
  window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
  playSpy = vi.fn(() => Promise.resolve());
  window.HTMLMediaElement.prototype.play = playSpy as unknown as HTMLMediaElement["play"];
  confirmSpy = vi.fn(() => true);
  window.confirm = confirmSpy as unknown as typeof window.confirm;
});

afterEach(() => cleanup());

describe("student flow", () => {
  it("requires a name and starts the timer only after Start Exam", () => {
    render(<App />);
    expect(screen.getByRole("heading", { level: 1, name: "Grade 3 English Exam" })).toBeTruthy();
    expect(screen.queryByRole("timer")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Start Exam" }));
    expect(screen.getByRole("alert").textContent).toContain("Please type your name");
    expect(screen.queryByRole("timer")).toBeNull();

    fireEvent.change(screen.getByLabelText(/Your name/), { target: { value: "Rana Hassan" } });
    fireEvent.click(screen.getByRole("button", { name: "Start Exam" }));

    expect(screen.getByText(/Question 1/)).toBeTruthy();
    expect(screen.getByRole("timer").textContent).toMatch(/00:00:0\d/);
    expect(submitButton().disabled).toBe(true);
    expect(playSpy).toHaveBeenCalledTimes(1);
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) as string) as ExamState;
    expect(saved.status).toBe("active");
    expect(saved.studentName).toBe("Rana Hassan");
    expect(typeof saved.startedAt).toBe("number");
  });

  it("never shows answers, scores or source references during the exam", () => {
    seedAlmostFinished("L1-07");
    render(<App />);
    for (let i = 0; i < EXAM_QUESTIONS.length; i++) {
      act(() => {
        fireEvent.click(screen.getByRole("button", { name: new RegExp(`^Question ${i + 1}, `) }));
      });
      const text = document.body.textContent ?? "";
      // Review labels, scores, explanations, source references and internal ids must never appear.
      expect(text).not.toMatch(/Correct answer:|Your answer:|Explanation:|Total score|Pupil’s Book ·|Workbook ·|Lesson \d –|\bL[1-5]-\d{2}\b/);
      expect(text).not.toMatch(/✓ Correct|Incorrect|Partly correct/);
    }
  });

  it("restores the same attempt after a reload, keeps the timer running, then submits immediately", () => {
    seedAlmostFinished("L1-07");
    const first = render(<App />);
    expect(screen.getByText(/Welcome back!/)).toBeTruthy();
    expect(screen.getByRole("timer").textContent).toMatch(/00:01:0[5-7]/);
    expect(submitButton().disabled).toBe(true);

    // Simulate a page refresh.
    first.unmount();
    render(<App />);
    expect(screen.getByRole("timer").textContent).toMatch(/00:01:0[5-7]/);
    expect(screen.getByRole("group", { name: "Which question asks about age?" })).toBeTruthy();

    fireEvent.click(screen.getByLabelText("How old are you?"));
    expect(submitButton().disabled).toBe(false);

    fireEvent.click(submitButton());
    expect(confirmSpy).not.toHaveBeenCalled();
    expect(screen.getByText("Well done, Test Pupil!")).toBeTruthy();
    expect(screen.getByText(/Total score: 100 \/ 100/)).toBeTruthy();
    expect(screen.getAllByText(/^Question \d+$/).length).toBeGreaterThan(0);
    expect(playSpy).toHaveBeenCalledTimes(1);

    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) as string) as ExamState;
    expect(saved.status).toBe("submitted");
    expect(saved.elapsedMs).toBeGreaterThanOrEqual(65_000);
  });

  it("keeps the results after a reload and only restarts on request (asking for the name again)", () => {
    seedAlmostFinished("L1-07");
    const first = render(<App />);
    fireEvent.click(screen.getByLabelText("How old are you?"));
    fireEvent.click(submitButton());
    first.unmount();

    render(<App />);
    expect(screen.getByText("Well done, Test Pupil!")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Start a new attempt/ }));
    fireEvent.click(screen.getByRole("button", { name: "Yes, start again" }));
    const input = screen.getByLabelText(/Your name/) as HTMLInputElement;
    expect(input.value).toBe("");
    expect((JSON.parse(localStorage.getItem(STORAGE_KEY) as string) as ExamState).status).toBe("idle");
  });
});

describe("teacher area", () => {
  it("is password protected and unavailable during an active exam", async () => {
    seedAlmostFinished("L1-07");
    window.history.replaceState(null, "", "/#teacher");
    const first = render(<App />);
    expect(screen.queryByText("Teacher Answer Key")).toBeNull();
    expect(screen.getByRole("timer")).toBeTruthy();

    fireEvent.click(screen.getByLabelText("How old are you?"));
    fireEvent.click(submitButton());
    first.unmount();
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /Teacher area/ }));
    await screen.findByText("Teacher Answer Key");
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "wrong" } });
    fireEvent.click(screen.getByRole("button", { name: /Unlock answer key/ }));
    expect(screen.getByRole("alert").textContent).toContain("Incorrect password");

    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "somer173" } });
    fireEvent.click(screen.getByRole("button", { name: /Unlock answer key/ }));
    expect(screen.getByText("Grading rules")).toBeTruthy();
    expect(screen.getAllByText(/^Answer:/).length).toBe(EXAM_QUESTIONS.reduce((s, q) => s + q.parts.length, 0));
  });
});
