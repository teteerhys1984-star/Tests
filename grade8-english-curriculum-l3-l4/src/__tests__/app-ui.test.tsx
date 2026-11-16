// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import App from "@/App";
import { gradeExam } from "@/exam/grading";
import { QUESTIONS } from "@/exam/questions";
import type { AnswerMap, Question } from "@/exam/types";
import { ATTEMPT_KEY } from "@/lib/storage";

function correctAnswers(questions: Question[] = QUESTIONS): AnswerMap {
  const map: AnswerMap = {};
  for (const q of questions) {
    map[q.n] = {};
    for (const p of q.parts) {
      switch (p.type) {
        case "mcq":
        case "select":
          map[q.n][p.id] = p.correctId;
          break;
        case "tf":
          map[q.n][p.id] = p.answer ? "T" : "F";
          break;
        case "order":
          map[q.n][p.id] = String(p.correctPos);
          break;
        case "text":
          map[q.n][p.id] = p.accepted[0];
          break;
      }
    }
  }
  return map;
}

const nativeFetch = globalThis.fetch;

beforeAll(() => {
  // Never contact external Google Sheets in tests; stub audio APIs absent in jsdom.
  globalThis.fetch = (async () => ({
    text: async () => JSON.stringify({ ok: true }),
  })) as unknown as typeof fetch;

  if (typeof HTMLMediaElement !== "undefined") {
    HTMLMediaElement.prototype.play = () => Promise.resolve();
    HTMLMediaElement.prototype.pause = () => undefined;
  }
});

afterAll(() => {
  globalThis.fetch = nativeFetch;
});

beforeEach(() => {
  localStorage.clear();
  // jsdom does not implement scrollTo
  (window as unknown as { scrollTo: () => void }).scrollTo = () => undefined;
});

afterEach(cleanup);

describe("start screen", () => {
  it("shows exam title, coverage, totals and instructions before the exam", () => {
    render(<App />);
    expect(screen.getByText("World Explorer English Exam")).toBeTruthy();
    expect(screen.getAllByText(/English Curriculum Lessons 3&4/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Grade 8/).length).toBeGreaterThan(0);
    expect(screen.getByText("Let's Discover")).toBeTruthy();
    expect(screen.getByText("Interesting Destinations")).toBeTruthy();
    expect(screen.getByText("20")).toBeTruthy(); // questions
    expect(screen.getByText("100")).toBeTruthy(); // marks
    expect(screen.getByLabelText(/Student Full Name/i)).toBeTruthy();
    // timer must NOT be running on the start screen
    expect(screen.queryByLabelText("Elapsed time")).toBeNull();
  });

  it("requires the student name and does not start without it", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /Start Exam/i }));
    expect(screen.getByText(/required before the exam can start/i)).toBeTruthy();
    expect(screen.queryByText("Question 1 of 20")).toBeNull();
  });

  it("starts the exam with a valid name and shows Question 1", () => {
    render(<App />);
    fireEvent.change(screen.getByLabelText(/Student Full Name/i), {
      target: { value: "Yazan Khalil" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Start Exam/i }));
    expect(screen.getByText("Question 1 of 20")).toBeTruthy();
    expect(screen.getByLabelText("Elapsed time").textContent).toBe("00:00:00");
    // submit gate stays locked
    const submit = screen.getByRole("button", { name: /Submit Exam/i }) as HTMLButtonElement;
    expect(submit.disabled).toBe(true);
    // attempt persisted under the isolated exam key
    const saved = JSON.parse(localStorage.getItem(ATTEMPT_KEY) ?? "{}");
    expect(saved.studentName).toBe("Yazan Khalil");
    expect(saved.status).toBe("in_progress");
    expect(typeof saved.startedAt).toBe("number");
  });
});

describe("answer persistence and recovery", () => {
  it("stores answers immediately in localStorage", () => {
    render(<App />);
    fireEvent.change(screen.getByLabelText(/Student Full Name/i), { target: { value: "Lina" } });
    fireEvent.click(screen.getByRole("button", { name: /Start Exam/i }));
    // Q1 is a matching question: answer part p1 (amusement → A)
    const select = screen.getAllByRole("combobox")[0];
    fireEvent.change(select, { target: { value: "A" } });
    const saved = JSON.parse(localStorage.getItem(ATTEMPT_KEY) ?? "{}");
    expect(saved.answers[1].p1).toBe("A");
  });

  it("recovers an in-progress attempt after a refresh without resetting the timer", () => {
    const start = Date.now() - 3 * 60 * 1000; // started 3 minutes before "refresh"
    localStorage.setItem(
      ATTEMPT_KEY,
      JSON.stringify({
        status: "in_progress",
        studentName: "Omar Saleh",
        startedAt: start,
        finishedAt: null,
        current: 2,
        answers: { 3: { p1: "B" } },
        result: null,
      })
    );
    render(<App />);
    // resumes on saved question (index 2 → question 3)
    expect(screen.getByText("Question 3 of 20")).toBeTruthy();
    expect(screen.getByText(/Attempt restored/)).toBeTruthy();
    // timer reflects the stored timestamp, not zero
    expect(screen.getByLabelText("Elapsed time").textContent).toBe("00:03:00");
  });
});

describe("results screen", () => {
  it("shows full results for a seeded submitted attempt", () => {
    const startedAt = Date.now() - 5 * 60 * 1000;
    const finishedAt = startedAt + 4 * 60 * 1000;
    const result = gradeExam(correctAnswers());
    localStorage.setItem(
      ATTEMPT_KEY,
      JSON.stringify({
        status: "submitted",
        studentName: "Maya Haddad",
        startedAt,
        finishedAt,
        current: 19,
        answers: correctAnswers(),
        result,
        attemptId: "seeded-attempt-001",
        sendStatus: "success",
      })
    );
    render(<App />);
    expect(screen.getByText("Exam Complete")).toBeTruthy();
    expect(screen.getByText("Maya Haddad")).toBeTruthy();
    expect(screen.getByText("100")).toBeTruthy();
    expect(screen.getByText("Detailed Results — All 20 Questions")).toBeTruthy();
    expect(screen.getByRole("button", { name: /Download Exam Report/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Retake Exam/i })).toBeTruthy();
    expect(screen.getByText("00:04:00")).toBeTruthy(); // time taken
  });

  it("retake clears the attempt and returns to the name screen", () => {
    const startedAt = Date.now();
    localStorage.setItem(
      ATTEMPT_KEY,
      JSON.stringify({
        status: "submitted",
        studentName: "Maya Haddad",
        startedAt,
        finishedAt: startedAt,
        current: 0,
        answers: correctAnswers(),
        result: gradeExam(correctAnswers()),
        attemptId: "seeded-attempt-002",
        sendStatus: "success",
      })
    );
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /Retake Exam/i }));
    expect(screen.getByLabelText(/Student Full Name/i)).toBeTruthy();
    expect(localStorage.getItem(ATTEMPT_KEY)).toBeNull();
  });
});

describe("teacher area", () => {
  it("rejects a wrong password and unlocks with somer173", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /Teacher Area/i }));
    const input = screen.getByLabelText("Teacher password");
    fireEvent.change(input, { target: { value: "wrong" } });
    fireEvent.click(screen.getByRole("button", { name: /Unlock/i }));
    expect(screen.getByText(/Incorrect password/i)).toBeTruthy();
    expect(screen.queryByText(/Teacher Answer Key/)).toBeNull();

    fireEvent.change(input, { target: { value: "somer173" } });
    fireEvent.click(screen.getByRole("button", { name: /Unlock/i }));
    expect(screen.getByText(/Teacher Answer Key — Grade 8/)).toBeTruthy();
    expect(screen.getByText(/client-side classroom visibility barrier/i)).toBeTruthy();
  });
});

describe("contact footer", () => {
  it("renders the WhatsApp contact strip with the exact name, number and URL", () => {
    render(<App />);
    expect(screen.getByText("المهندس سومر شاهين")).toBeTruthy();
    const link = screen.getByRole("link", { name: /WhatsApp/i });
    expect(link.getAttribute("href")).toBe("https://wa.me/963930215022");
    expect(screen.getByText("0930215022")).toBeTruthy();
  });
});
