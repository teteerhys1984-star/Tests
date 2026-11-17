// @vitest-environment jsdom
/**
 * End-to-end flow inside a DOM (jsdom) — MOCK FETCH ONLY.
 *
 * The real Google Sheet endpoint is never contacted: every test installs a
 * mock `fetch`, so no result can reach a real spreadsheet.
 *
 * A real Chromium run (Playwright) could not be executed in this sandbox:
 * the browser binaries are downloaded from cdn.playwright.dev / playwright
 * .azureedge.net, and both hosts are unreachable here (see README).
 */
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import App from "@/App";
import { EXAM_ID } from "@/config";
import { QUESTIONS } from "@/data/exam";
import { PENDING_PREFIX, pendingKey } from "@/lib/submit";
import { STORAGE_KEY, type Attempt } from "@/lib/storage";

/* ------------------------------------------------------------------ */
/* helpers                                                             */
/* ------------------------------------------------------------------ */

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

function seedSubmitted(attemptId = "attempt-flow-1", name = "Pupil One"): Attempt {
  const attempt: Attempt = {
    v: 1,
    attemptId,
    name,
    answers: fullKey(),
    startedAt: Date.now() - 95_000,
    index: 0,
    status: "submitted",
    submittedAt: Date.now(),
    muted: true,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(attempt));
  return attempt;
}

beforeEach(() => {
  localStorage.clear();
  window.history.replaceState(null, "", "/");
  window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }),
  });
  URL.createObjectURL = vi.fn(() => "blob:mock") as unknown as typeof URL.createObjectURL;
  URL.revokeObjectURL = vi.fn() as unknown as typeof URL.revokeObjectURL;
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

/* ------------------------------------------------------------------ */
/* tests                                                               */
/* ------------------------------------------------------------------ */

describe("Entry screen", () => {
  it("shows the exam title, the grade, the subject and the semester", () => {
    installFetch(['{"ok":true}']);
    render(<App />);

    expect(screen.getByText("Grade 5 English Curriculum Exam L1-5 A — Unit 1, Model A.")).toBeTruthy();
    expect(screen.getByText("Grade")).toBeTruthy();
    expect(screen.getByText("5")).toBeTruthy();
    expect(screen.getByText("Subject")).toBeTruthy();
    expect(screen.getByText("English")).toBeTruthy();
    expect(screen.getByText("Semester")).toBeTruthy();
    expect(screen.getByText("Semester 1")).toBeTruthy();
    expect(screen.getByText("50")).toBeTruthy(); // questions
    expect(screen.getByText("100")).toBeTruthy(); // marks
  });

  it("asks for the pupil's name before the exam starts", () => {
    installFetch(['{"ok":true}']);
    render(<App />);

    const start = screen.getByRole("button", { name: "Start Exam" }) as HTMLButtonElement;
    expect(start.disabled).toBe(true);

    fireEvent.change(screen.getByLabelText("Full name"), { target: { value: "Pupil One" } });
    expect((screen.getByRole("button", { name: "Start Exam" }) as HTMLButtonElement).disabled).toBe(false);
  });
});

describe("Results page and delivery (mock fetch only)", () => {
  it("shows the score and the report even before the answer is acknowledged", async () => {
    seedSubmitted();
    installFetch(['{"ok":true}']);
    render(<App />);

    expect(screen.getByText("YOUR RESULTS")).toBeTruthy();
    expect(screen.getByText("out of 100")).toBeTruthy();
    expect(screen.getByRole("button", { name: /Download Report/ })).toBeTruthy();
    expect(screen.getByText("Pupil One")).toBeTruthy();
  });

  it("delivers the contract payload and reports success", async () => {
    seedSubmitted();
    const { mock, calls } = installFetch(['{"ok":true}']);
    render(<App />);

    await waitFor(() => expect(screen.getByText(/Your result was sent to your teacher/)).toBeTruthy());
    expect(mock).toHaveBeenCalledTimes(1);

    const body = JSON.parse(String(calls[0].init.body));
    expect(calls[0].init.method).toBe("POST");
    expect((calls[0].init.headers as Record<string, string>)["Content-Type"]).toBe(
      "text/plain;charset=utf-8",
    );
    expect(body.examId).toBe(EXAM_ID);
    expect(body.summary.total).toBe(100);
    expect(body.summary.max).toBe(100);
    expect(body.details).toHaveLength(99);
    expect(body.lessons).toHaveLength(5);
    expect(typeof body.reportText).toBe("string");
  });

  it(
    "keeps the result and the report when the delivery fails, and resends with the same attempt id",
    async () => {
      seedSubmitted("attempt-flow-retry");
      const { mock, calls } = installFetch([
        new Error("network down"),
        new Error("network down"),
        new Error("network down"),
        '{"ok":true}',
      ]);
      render(<App />);

      // 3 attempts (0 s, +2 s, +5 s) all fail → the banner offers a resend.
      await waitFor(() => expect(screen.getByText(/Your result could not be sent/)).toBeTruthy(), {
        timeout: 20000,
      });
      expect(mock).toHaveBeenCalledTimes(3);

      // The score and the report are still there.
      expect(screen.getByText("out of 100")).toBeTruthy();
      expect(screen.getByRole("button", { name: /Download Report/ })).toBeTruthy();

      // The failed payload waits in localStorage under this exam's own key.
      const pending = pendingKey("attempt-flow-retry");
      expect(localStorage.getItem(pending)).not.toBeNull();
      expect(pending.startsWith(PENDING_PREFIX)).toBe(true);
      expect(JSON.parse(localStorage.getItem(pending)!).attemptId).toBe("attempt-flow-retry");

      fireEvent.click(screen.getByRole("button", { name: /Resend result/ }));

      await waitFor(() => expect(screen.getByText(/Your result was sent to your teacher/)).toBeTruthy(), {
        timeout: 20000,
      });
      expect(mock).toHaveBeenCalledTimes(4);

      const ids = calls.map((c) => JSON.parse(String(c.init.body)).attemptId);
      expect(new Set(ids)).toEqual(new Set(["attempt-flow-retry"]));
      // The pending copy is removed once the delivery succeeds.
      expect(localStorage.getItem(pending)).toBeNull();
    },
    30000,
  );

  it("resends a pending result the next time the exam is opened", async () => {
    const pending = {
      token: "token",
      attemptId: "attempt-flow-pending",
      examId: EXAM_ID,
      examTitle: "Grade 5 English Curriculum Exam L1-5 A",
      studentName: "Pupil One",
      startAt: new Date().toISOString(),
      submitAt: new Date().toISOString(),
      elapsedSec: 10,
      summary: {},
      lessons: [],
      details: [],
      reportText: "report",
    };
    localStorage.setItem(pendingKey("attempt-flow-pending"), JSON.stringify(pending));

    const { mock, calls } = installFetch(['{"ok":true}']);
    render(<App />);

    await waitFor(() => expect(mock).toHaveBeenCalledTimes(1));
    expect(JSON.parse(String(calls[0].init.body)).attemptId).toBe("attempt-flow-pending");
    expect(localStorage.getItem(pendingKey("attempt-flow-pending"))).toBeNull();
  });
});

describe("Exam screen", () => {
  it("keeps the submit button locked until every sub-part is answered", async () => {
    const answers = fullKey();
    const lastQuestion = QUESTIONS[QUESTIONS.length - 1];
    const lastPart = lastQuestion.parts[0].id;
    const missingAnswer =
      lastQuestion.parts[0].type === "mcq" ? lastQuestion.parts[0].answer : "";
    delete answers[lastPart];

    const attempt: Attempt = {
      v: 1,
      attemptId: "attempt-in-progress",
      name: "Pupil One",
      answers,
      startedAt: Date.now() - 30_000,
      index: 0,
      status: "in-progress",
      submittedAt: null,
      muted: true,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(attempt));

    installFetch(['{"ok":true}']);
    render(<App />);

    const submit = screen.getByRole("button", { name: "Submit Exam" }) as HTMLButtonElement;
    expect(submit.disabled).toBe(true);
    expect(screen.getByText(/still need/)).toBeTruthy();

    // Answer the last missing sub-part of the last question.
    fireEvent.click(screen.getByRole("button", { name: /Go to question 50/ }));
    fireEvent.click(
      screen.getByRole("radio", { name: new RegExp(`\\b${missingAnswer}\\b`, "i") }),
    );

    await waitFor(() =>
      expect((screen.getByRole("button", { name: "Submit Exam" }) as HTMLButtonElement).disabled).toBe(
        false,
      ),
    );
  });
});
