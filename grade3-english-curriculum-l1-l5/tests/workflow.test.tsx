// @vitest-environment jsdom
/**
 * Full UI delivery workflow tests in jsdom (Mock Fetch only — never hits real Google Sheets):
 *   - submit transitions to Results immediately & sends payload once
 *   - send failure keeps Results & Download TXT working, shows Resend Result button
 *   - Resend Result reuses the EXACT SAME attemptId
 *   - reopening the app automatically retries pending submissions and updates banner to success
 */
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "../src/App";
import { EXAM_ID, SHEETS_TOKEN, SHEETS_URL } from "../src/config";
import { QUESTIONS } from "../src/data/examData";
import { buildPayload, pendingKey } from "../src/logic/submit";
import { buildTextReport } from "../src/logic/report";
import { gradeFullExam } from "../src/logic/grading";
import type { AnswersMap, ExamSession } from "../src/types";

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

function render() {
  act(() => {
    root.render(<App />);
  });
}

async function flush() {
  await act(async () => {
    await new Promise((r) => setTimeout(r, 20));
  });
}

function click(el: Element | null) {
  if (!el) throw new Error("element not found");
  act(() => {
    el.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
}

function completeAnswers(): AnswersMap {
  const map: AnswersMap = {};
  for (const q of QUESTIONS) {
    map[q.id] = {};
    for (const p of q.parts) {
      if (p.kind === "mcq" || p.kind === "select") map[q.id][p.id] = p.correctOptionId!;
      else if (p.kind === "tf") map[q.id][p.id] = String(p.correctBool);
      else if (p.kind === "text") map[q.id][p.id] = p.accepted![0];
      else if (p.kind === "order") map[q.id][p.id] = ["t3", "t4", "t1", "t5", "t2"];
      else if (p.kind === "writing") map[q.id][p.id] = "There is a library in my school.";
    }
  }
  return map;
}

function seedActiveSession(): void {
  const s: ExamSession = {
    version: 1,
    studentName: "Mira Samer",
    startedAt: Date.now() - 120_000,
    currentQuestion: 35,
    answers: completeAnswers(),
    submitted: false,
    submittedAt: null,
    finalElapsedMs: null,
  };
  localStorage.setItem("gok_grade3_exam_session_v1", JSON.stringify(s));
}

beforeEach(() => {
  localStorage.clear();
  container?.remove();
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  vi.spyOn(HTMLAudioElement.prototype, "play").mockImplementation(() => Promise.resolve());
});

afterEach(() => {
  act(() => root.unmount());
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("workflow: Google Sheets delivery UI & non-blocking results", () => {
  it("submitting sends exact payload once and shows success banner", async () => {
    const calls: { url: string; init: RequestInit; body: any }[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, init: RequestInit) => {
        calls.push({ url, init, body: JSON.parse(String(init.body)) });
        return { text: async () => '{"ok":true}' };
      })
    );

    seedActiveSession();
    render();
    const submitBtn = [...container.querySelectorAll("button")].find((b) =>
      b.textContent?.includes("Submit Exam")
    )!;
    click(submitBtn);
    await flush();

    expect(container.textContent).toContain("Your Exam Results");
    expect(container.textContent).toContain("96");
    expect(container.textContent).toContain("Your result was sent to your teacher ✓");

    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe(SHEETS_URL);
    expect(calls[0].init.method).toBe("POST");
    expect(calls[0].init.headers).toEqual({ "Content-Type": "text/plain;charset=utf-8" });
    expect(calls[0].body.token).toBe(SHEETS_TOKEN);
    expect(calls[0].body.examId).toBe(EXAM_ID);
    expect(calls[0].body.examTitle).toBe("Curriculum Test Lessons 1 to 5");
    expect(calls[0].body.details).toHaveLength(50);
    expect(calls[0].body.lessons).toHaveLength(5);
  });

  it("when delivery fails after 3 attempts, result & TXT download still work, and Resend Result reuses same attemptId", async () => {
    vi.useFakeTimers();
    let shouldSucceed = false;
    const calls: any[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_url: string, init: RequestInit) => {
        calls.push(JSON.parse(String(init.body)));
        if (!shouldSucceed) throw new Error("offline (mock)");
        return { text: async () => '{"ok":true}' };
      })
    );

    // Mock URL.createObjectURL / revokeObjectURL so clicking Download TXT is verified end-to-end
    const createdBlobs: Blob[] = [];
    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL: vi.fn((blob: Blob) => {
        createdBlobs.push(blob);
        return "blob:mock-report";
      }),
      revokeObjectURL: vi.fn(),
    });

    seedActiveSession();
    render();
    const submitBtn = [...container.querySelectorAll("button")].find((b) =>
      b.textContent?.includes("Submit Exam")
    )!;
    click(submitBtn);

    // Immediately shows results even while sending is still retrying
    expect(container.textContent).toContain("Your Exam Results");
    expect(container.textContent).toContain("Sending your result to your teacher");

    // Advance past 2000ms + 5000ms retry delays
    await act(async () => {
      await vi.advanceTimersByTimeAsync(7500);
    });

    expect(calls).toHaveLength(3);
    const attemptId = calls[0].attemptId;
    expect(calls.every((c) => c.attemptId === attemptId)).toBe(true);
    expect(container.textContent).toContain("Your result could not be sent automatically");
    expect(localStorage.getItem(pendingKey(attemptId))).not.toBeNull();

    // Download TXT must still work when send failed!
    const dlBtn = container.querySelector('[data-testid="download-report"]') as HTMLButtonElement;
    expect(dlBtn).not.toBeNull();
    expect(dlBtn.disabled).toBe(false);
    click(dlBtn);
    expect(createdBlobs).toHaveLength(1);
    const txt = await createdBlobs[0].text();
    expect(txt).toContain("Mira Samer");
    expect(txt).toContain("96 / 100");

    // Now network recovers; click independent Resend Result button
    shouldSucceed = true;
    const resendBtn = container.querySelector('[data-testid="resend-result"]') as HTMLButtonElement;
    expect(resendBtn).not.toBeNull();
    click(resendBtn);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(50);
    });

    expect(calls).toHaveLength(4);
    expect(calls[3].attemptId).toBe(attemptId); // SAME attemptId reused
    expect(container.textContent).toContain("Your result was sent to your teacher ✓");
    expect(localStorage.getItem(pendingKey(attemptId))).toBeNull();
  });

  it("reopening the app with a failed/pending submission automatically retries and marks it sent", async () => {
    const attemptId = "reopen-attempt-1234";
    const answers = completeAnswers();
    const failedSession: ExamSession = {
      version: 1,
      studentName: "Mira Samer",
      startedAt: Date.now() - 300_000,
      currentQuestion: 35,
      answers,
      submitted: true,
      submittedAt: Date.now() - 10_000,
      finalElapsedMs: 290_000,
      attemptId,
      sendStatus: "failed",
    };
    const result = gradeFullExam(answers);
    const reportText = buildTextReport(failedSession, result);
    const payload = buildPayload({ attemptId, session: failedSession, result, reportText });

    localStorage.setItem("gok_grade3_exam_session_v1", JSON.stringify(failedSession));
    localStorage.setItem(pendingKey(attemptId), JSON.stringify(payload));

    const sent: any[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_url: string, init: RequestInit) => {
        sent.push(JSON.parse(String(init.body)));
        return { text: async () => '{"ok":true}' };
      })
    );

    render();
    await flush();

    expect(sent).toHaveLength(1);
    expect(sent[0].attemptId).toBe(attemptId);
    expect(localStorage.getItem(pendingKey(attemptId))).toBeNull();
    expect(container.textContent).toContain("Your result was sent to your teacher ✓");
  });
});
