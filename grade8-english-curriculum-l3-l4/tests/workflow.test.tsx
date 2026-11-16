// @vitest-environment jsdom
/**
 * End-to-end UI workflow test using React Testing Library + Mock Fetch:
 *   - Start exam with student name
 *   - Answer all 20 questions (80 parts) in the UI (mixed correct & wrong)
 *   - Submit immediately once unlocked
 *   - Verify score, percentage, TXT download availability, and failed delivery banner
 *   - Click "Resend Result" after network recovery; verify same attemptId & success banner
 *   - Verify no teacher-only data (token, attemptId, Arabic gradeLabel) appears in UI
 */
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import App from "../src/App";
import { EXAM_ID, EXAM_TITLE, SHEETS_TOKEN, SHEETS_URL } from "../src/config";
import { QUESTIONS } from "../src/exam/questions";
import { pendingKey, type SubmissionPayload } from "../src/lib/submit";

const nativeFetch = globalThis.fetch;

beforeAll(() => {
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
  (window as unknown as { scrollTo: () => void }).scrollTo = () => undefined;
});

afterEach(() => {
  vi.useRealTimers();
  cleanup();
});

function answerCurrentQuestionWrongFirstQuestion(): void {
  // Helper fills every part of the currently rendered question via DOM controls
  const qNumText = screen.getByText(/Question \d+ of 20/).textContent ?? "";
  const n = Number(/Question (\d+) of 20/.exec(qNumText)?.[1] ?? "0");
  const q = QUESTIONS.find((item) => item.n === n);
  if (!q) throw new Error(`Question ${n} not found`);

  if (q.kind === "select") {
    const selects = screen.getAllByRole("combobox") as HTMLSelectElement[];
    q.parts.forEach((p, idx) => {
      if (p.type !== "select") return;
      // Pick the correct answer for all except Q1 p1 (to verify partial 4/5 on Q1 → 99/100 total)
      const val = n === 1 && idx === 0 ? "F" : p.correctId;
      fireEvent.change(selects[idx], { target: { value: val } });
    });
    return;
  }

  if (q.kind === "order") {
    const selects = screen.getAllByRole("combobox") as HTMLSelectElement[];
    q.parts.forEach((p, idx) => {
      if (p.type !== "order") return;
      fireEvent.change(selects[idx], { target: { value: String(p.correctPos) } });
    });
    return;
  }

  if (q.kind === "text") {
    const inputs = screen.getAllByRole("textbox") as HTMLInputElement[];
    q.parts.forEach((p, idx) => {
      if (p.type !== "text") return;
      fireEvent.change(inputs[idx], { target: { value: p.accepted[0] } });
    });
    return;
  }

  if (q.kind === "tf") {
    const trueBtns = screen.getAllByRole("button", { name: "True" });
    const falseBtns = screen.getAllByRole("button", { name: "False" });
    q.parts.forEach((p, idx) => {
      if (p.type !== "tf") return;
      fireEvent.click(p.answer ? trueBtns[idx] : falseBtns[idx]);
    });
    return;
  }

  if (q.kind === "mcq") {
    q.parts.forEach((p) => {
      if (p.type !== "mcq") return;
      const opt = p.options.find((o) => o.id === p.correctId);
      if (!opt) throw new Error("missing option");
      // Multiple parts may share identical option text (e.g. Q15/Q20), so locate within part prompt
      const promptEl = screen.getByText(p.prompt);
      const section = promptEl.closest("section");
      if (!section) throw new Error("missing part section");
      const btn = Array.from(section.querySelectorAll("button")).find((b) =>
        b.textContent?.includes(opt.text)
      );
      if (!btn) throw new Error(`missing button for ${opt.text}`);
      fireEvent.click(btn);
    });
  }
}

describe("full browser workflow with Mock Fetch", () => {
  it("completes all 20 questions, shows non-blocking results on failed POST, then resends with same attemptId", async () => {
    const postedBodies: SubmissionPayload[] = [];
    let shouldSucceed = false;

    globalThis.fetch = (async (url, init) => {
      expect(url).toBe(SHEETS_URL);
      expect(init?.method).toBe("POST");
      postedBodies.push(JSON.parse(String(init?.body)) as SubmissionPayload);
      if (!shouldSucceed) {
        throw new Error("simulated offline");
      }
      return { text: async () => JSON.stringify({ ok: true }) };
    }) as typeof fetch;

    // Speed up retry delays for UI workflow test
    const realSetTimeout = globalThis.setTimeout;
    const fastTimeout = ((fn: (...args: unknown[]) => void, ms?: number, ...rest: unknown[]) => {
      const scaled = ms === 2000 || ms === 5000 ? 5 : ms;
      return realSetTimeout(fn, scaled, ...rest);
    }) as typeof setTimeout;
    globalThis.setTimeout = fastTimeout;

    try {
      render(<App />);
      fireEvent.change(screen.getByLabelText(/Student Full Name/i), {
        target: { value: "Nour Al-Hasan" },
      });
      fireEvent.click(screen.getByRole("button", { name: /Start Exam/i }));

      for (let i = 0; i < QUESTIONS.length; i++) {
        answerCurrentQuestionWrongFirstQuestion();
        if (i < QUESTIONS.length - 1) {
          fireEvent.click(screen.getByRole("button", { name: /Next/i }));
        }
      }

      const submitBtn = screen.getByRole("button", { name: /Submit Exam/i }) as HTMLButtonElement;
      expect(submitBtn.disabled).toBe(false);
      fireEvent.click(submitBtn);

      // Results appear immediately with score 99/100 (19 full, 1 partial, 0 wrong)
      expect(screen.getByText("Exam Complete")).toBeTruthy();
      expect(screen.getByText("99")).toBeTruthy();
      expect(screen.getByText("99%")).toBeTruthy();
      expect(screen.getByTestId("download-report")).toBeTruthy();

      // Delivery fails after 3 attempts, shows Resend Result button, and saves pending payload
      await waitFor(() => {
        expect(screen.getByTestId("resend-result")).toBeTruthy();
      });
      expect(postedBodies).toHaveLength(3);
      const attemptId = postedBodies[0].attemptId;
      expect(postedBodies.every((b) => b.attemptId === attemptId)).toBe(true);
      expect(postedBodies[0].examId).toBe(EXAM_ID);
      expect(postedBodies[0].examTitle).toBe(EXAM_TITLE);
      expect(postedBodies[0].summary.gradeLabel).toBe("ممتاز");
      expect(localStorage.getItem(pendingKey(attemptId))).not.toBeNull();

      // Teacher secrets and Arabic grade label must NOT appear in the student DOM
      const bodyText = document.body.textContent ?? "";
      expect(bodyText).not.toContain(SHEETS_TOKEN);
      expect(bodyText).not.toContain(attemptId);
      for (const word of ["ممتاز", "جيد جداً", "مقبول", "ضعيف", "يحتاج إلى دعم"]) {
        expect(bodyText).not.toContain(word);
      }

      // Network recovers -> click Resend Result -> reuses same attemptId and clears pending
      shouldSucceed = true;
      fireEvent.click(screen.getByTestId("resend-result"));

      await waitFor(() => {
        expect(screen.getByText(/Your result was sent to your teacher/i)).toBeTruthy();
      });
      expect(postedBodies).toHaveLength(4);
      expect(postedBodies[3].attemptId).toBe(attemptId);
      expect(localStorage.getItem(pendingKey(attemptId))).toBeNull();
    } finally {
      globalThis.setTimeout = realSetTimeout;
    }
  });
});
