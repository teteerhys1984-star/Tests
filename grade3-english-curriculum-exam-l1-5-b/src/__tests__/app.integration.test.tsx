// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "../App";
import { EXAM_QUESTIONS } from "../data/questions";
import { ExamQuestion } from "../types/exam";
import { STORAGE_KEY } from "../utils/storage";

function answerCurrentQuestionInDom(q: ExamQuestion) {
  if (q.type === "single-choice") {
    const radio = screen.getByRole("radio", { name: new RegExp(escapeRe(q.correctAnswer)) });
    fireEvent.click(radio);
    return;
  }

  if (q.type === "choice-parts") {
    for (const part of q.parts) {
      const group = screen.getByRole("radiogroup", { name: part.prompt });
      const buttons = Array.from(group.querySelectorAll('button[role="radio"]'));
      const target = buttons.find((b) => b.textContent?.trim() === part.correctAnswer);
      if (!target) {
        throw new Error(`Choice button "${part.correctAnswer}" not found for ${q.id}.${part.id}`);
      }
      fireEvent.click(target);
    }
    return;
  }

  if (q.type === "match") {
    for (const part of q.parts) {
      const select = document.getElementById(`${q.id}-${part.id}`) as HTMLSelectElement;
      if (!select) throw new Error(`Missing select for ${q.id}-${part.id}`);
      fireEvent.change(select, { target: { value: part.correctAnswer } });
    }
    return;
  }

  if (q.type === "text-parts") {
    for (const part of q.parts) {
      const input = document.getElementById(`${q.id}-${part.id}`) as HTMLInputElement;
      if (!input) throw new Error(`Missing input for ${q.id}-${part.id}`);
      fireEvent.change(input, { target: { value: part.correctDisplay } });
    }
    return;
  }

  if (q.type === "reorder") {
    const targetWords = q.correctSentence.slice(0, -1).split(" ");
    for (const word of targetWords) {
      const candidates = screen
        .getAllByRole("button", { name: word })
        .filter((btn) => !(btn as HTMLButtonElement).disabled && !btn.getAttribute("title"));
      if (candidates.length === 0) {
        throw new Error(`Word tile "${word}" not found for ${q.id}`);
      }
      fireEvent.click(candidates[0]);
    }
  }
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

describe("Interactive Grade 3 English Exam UI & Workflow", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.scrollTo = vi.fn();
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          text: () => Promise.resolve('{"ok":true}'),
        } as Response)
      )
    );
    vi.spyOn(window.HTMLMediaElement.prototype, "play").mockImplementation(() =>
      Promise.resolve()
    );
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-15T10:00:00.000Z"));
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("enforces mandatory student name, does not start timer early, and renders WhatsApp footer", () => {
    render(<App />);

    expect(screen.getByText("Grade 3 English Curriculum Exam L1-5 B")).toBeTruthy();
    expect(screen.getByText("50")).toBeTruthy();
    expect(screen.getByText("100")).toBeTruthy();
    expect(screen.getByText("00:00:00")).toBeTruthy();

    // Footer exact contact & WhatsApp link
    expect(screen.getByText("المهندس سومر شاهين")).toBeTruthy();
    const waLink = screen.getByRole("link", { name: /0930215022/ });
    expect(waLink.getAttribute("href")).toBe("https://wa.me/963930215022");

    // Advance 30 seconds before starting — welcome timer stays 00:00:00
    act(() => {
      vi.advanceTimersByTime(30_000);
    });
    expect(screen.getByText("00:00:00")).toBeTruthy();

    // Try starting without student name
    fireEvent.click(screen.getByRole("button", { name: /Start Exam/i }));
    expect(screen.getByRole("alert").textContent).toContain(
      "Please enter your name before starting the exam."
    );
    expect(screen.queryByTestId("exam-timer")).toBeNull();
  });

  it("preserves answers and continuous HH:MM:SS stopwatch across navigation and browser refresh", () => {
    const firstRender = render(<App />);

    // Enter name & mute toggle check, then start exam
    fireEvent.click(screen.getByRole("button", { name: /Sound On/i }));
    expect(screen.getByText("Muted")).toBeTruthy();

    const nameInput = screen.getByLabelText(/Student Name/i);
    fireEvent.change(nameInput, { target: { value: "Rami Haddad" } });
    fireEvent.click(screen.getByRole("button", { name: /Start Exam/i }));

    // Active exam begins at 00:00:00, Q1 of 50, Submit disabled, Teacher Key hidden, source hidden
    expect(screen.getByText("Question 1 of 50")).toBeTruthy();
    expect(screen.getByTestId("exam-timer").textContent).toBe("00:00:00");
    expect((screen.getByTestId("submit-exam-btn") as HTMLButtonElement).disabled).toBe(true);
    expect(screen.queryByText("Teacher Key")).toBeNull();
    expect(screen.queryByText(/Source:/i)).toBeNull();

    // Answer Question 1 and advance 12 seconds
    answerCurrentQuestionInDom(EXAM_QUESTIONS[0]);
    expect(screen.getByTestId("completion-indicator").textContent).toBe("1 / 50 Answered");

    act(() => {
      vi.advanceTimersByTime(12_000);
    });
    expect(screen.getByTestId("exam-timer").textContent).toBe("00:00:12");

    // Navigate to Question 2 — timer must not reset
    fireEvent.click(screen.getByRole("button", { name: /^Next$/i }));
    expect(screen.getByText("Question 2 of 50")).toBeTruthy();
    expect(screen.getByTestId("exam-timer").textContent).toBe("00:00:12");

    // Simulate closing tab and reopening 68 seconds later (total 80s = 00:01:20)
    firstRender.unmount();
    vi.setSystemTime(new Date("2026-05-15T10:01:20.000Z"));

    render(<App />);
    expect(screen.getByText("Rami Haddad")).toBeTruthy();
    expect(screen.getByText("Question 2 of 50")).toBeTruthy();
    expect(screen.getByTestId("completion-indicator").textContent).toBe("1 / 50 Answered");
    expect(screen.getByTestId("exam-timer").textContent).toBe("00:01:20");
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeTruthy();
  });

  it("answers all 50 questions across all formats, submits immediately with no confirmation, downloads TXT report, and restarts cleanly", () => {
    const confirmSpy = vi.spyOn(window, "confirm");
    const createObjUrlSpy = vi
      .spyOn(URL, "createObjectURL")
      .mockReturnValue("blob:mock-report");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});

    render(<App />);

    fireEvent.change(screen.getByLabelText(/Student Name/i), {
      target: { value: "Maya Karim" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Start Exam/i }));

    let renderedImageCount = 0;
    const assertRenderedImagesValid = () => {
      const imgs = Array.from(document.querySelectorAll("img"));
      for (const img of imgs) {
        const src = img.getAttribute("src") || "";
        const alt = img.getAttribute("alt") || "";
        expect(src.startsWith("data:image/png;base64,")).toBe(true);
        expect(src.length).toBeGreaterThan(800);
        expect(alt.trim().length).toBeGreaterThan(0);
        renderedImageCount++;
      }
    };

    // Answer questions 1 through 49 and verify every rendered <img> on each question
    for (let i = 0; i < 49; i++) {
      assertRenderedImagesValid();
      answerCurrentQuestionInDom(EXAM_QUESTIONS[i]);
      expect((screen.getByTestId("submit-exam-btn") as HTMLButtonElement).disabled).toBe(
        true
      );
      fireEvent.click(screen.getByRole("button", { name: /^Next$/i }));
    }

    // On Question 50, check its rendered image too; still disabled until Q50's sub-parts are completed
    assertRenderedImagesValid();
    expect(renderedImageCount).toBe(30);
    expect(screen.getByText("Question 50 of 50")).toBeTruthy();
    expect(screen.getByTestId("completion-indicator").textContent).toBe("49 / 50 Answered");
    expect((screen.getByTestId("submit-exam-btn") as HTMLButtonElement).disabled).toBe(true);

    // Advance stopwatch to 00:09:05 (545 seconds)
    act(() => {
      vi.advanceTimersByTime(545_000);
    });
    expect(screen.getByTestId("exam-timer").textContent).toBe("00:09:05");

    // Answer Question 50 — Submit Exam becomes enabled immediately
    answerCurrentQuestionInDom(EXAM_QUESTIONS[49]);
    expect(screen.getByTestId("completion-indicator").textContent).toBe("50 / 50 Answered");
    const headerSubmitBtn = screen.getByTestId("submit-exam-btn") as HTMLButtonElement;
    expect(headerSubmitBtn.disabled).toBe(false);

    // Click Submit Exam — immediate transition with ZERO confirmation dialog
    fireEvent.click(headerSubmitBtn);
    expect(confirmSpy).not.toHaveBeenCalled();

    // Results screen immediately shown
    expect(screen.getByText("Final Exam Results")).toBeTruthy();
    expect(screen.getByText("Maya Karim")).toBeTruthy();
    expect(screen.getByTestId("total-score").textContent?.replace(/\s+/g, " ").trim()).toBe(
      "100 / 100"
    );
    expect(screen.getByText("00:09:05")).toBeTruthy();
    expect(screen.getByText("Detailed Review of All 50 Questions")).toBeTruthy();
    expect(screen.getAllByText(/Source: Lesson/i).length).toBe(50);

    // Timer stays stopped after submission
    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(screen.getByText("00:09:05")).toBeTruthy();

    // Download TXT report
    expect(screen.getByText("Grade3_English_Exam_Maya_Karim.txt")).toBeTruthy();
    fireEvent.click(screen.getByTestId("download-txt-btn"));
    expect(createObjUrlSpy).toHaveBeenCalledTimes(1);

    // Start New Exam returns to Welcome with empty student name input
    fireEvent.click(screen.getByRole("button", { name: /Start New Exam/i }));
    const freshNameInput = screen.getByLabelText(/Student Name/i) as HTMLInputElement;
    expect(freshNameInput.value).toBe("");
  });

  it("protects Teacher Answer Key with password somer173 and shows all 50 keys when unlocked", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /Teacher Key/i }));
    expect(screen.getByText("Teacher Answer Key")).toBeTruthy();

    // Wrong password rejected
    fireEvent.change(screen.getByLabelText(/Teacher Password/i), {
      target: { value: "wrongpass" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Unlock Answer Key/i }));
    expect(screen.getByRole("alert").textContent).toContain("Incorrect teacher password");
    expect(screen.queryByText("Teacher Answer Key Unlocked")).toBeNull();

    // Correct password unlocks all 50 questions, grading rules, and source refs
    fireEvent.change(screen.getByLabelText(/Teacher Password/i), {
      target: { value: "somer173" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Unlock Answer Key/i }));
    expect(screen.getByText("Teacher Answer Key Unlocked")).toBeTruthy();
    expect(screen.getAllByText("Grading Rule:").length).toBe(50);
    expect(screen.getAllByText("Source Reference:").length).toBe(50);

    // Lock & Return hides answer key cleanly
    fireEvent.click(screen.getByRole("button", { name: /Lock & Return/i }));
    expect(screen.queryByText("Teacher Answer Key Unlocked")).toBeNull();
    expect(screen.getByText("Grade 3 English Curriculum Exam L1-5 B")).toBeTruthy();
  });
});
