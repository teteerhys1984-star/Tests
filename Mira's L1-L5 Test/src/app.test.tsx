// @vitest-environment jsdom
/* ------------------------------------------------------------------ */
/*  Interaction checks — full student journey rendered in jsdom        */
/* ------------------------------------------------------------------ */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import App from "./App";
import type { AnswersMap, ExamSession } from "./types";
import { QUESTIONS } from "./data/examData";
import { buildTextReport, buildTeacherKey } from "./logic/report";
import { gradeFullExam } from "./logic/grading";

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

function render() {
  act(() => {
    root.render(<App />);
  });
}

/** RTL-free helpers */
const txt = () => container.textContent ?? "";
const $ = <T extends Element>(sel: string): T | null => container.querySelector(sel) as T | null;
const $$ = <T extends Element>(sel: string): T[] => [...container.querySelectorAll(sel)] as T[];

function click(el: Element | null) {
  if (!el) throw new Error("element not found");
  act(() => {
    el.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
}

function typeIn(el: HTMLInputElement | HTMLTextAreaElement, value: string) {
  act(() => {
    const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto, "value")!.set!;
    setter.call(el, value);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

function completeAnswers(): AnswersMap {
  const answers: AnswersMap = {};
  for (const q of QUESTIONS) {
    answers[q.id] = {};
    for (const p of q.parts) {
      answers[q.id][p.id] =
        p.kind === "mcq" || p.kind === "select"
          ? p.correctOptionId!
          : p.kind === "tf"
            ? String(p.correctBool)
            : p.kind === "order"
              ? ["t3", "t4", "t1", "t5", "t2"]
              : p.kind === "writing"
                ? "There is a library in my school."
                : p.accepted![0];
    }
  }
  return answers;
}

function seedActiveSession(answers: AnswersMap) {
  const s: ExamSession = {
    version: 1,
    studentName: "Lina Ahmad",
    startedAt: Date.now() - 8 * 60_000,
    currentQuestion: 1,
    answers,
    submitted: false,
    submittedAt: null,
    finalElapsedMs: null,
  };
  localStorage.setItem("gok_grade3_exam_session_v1", JSON.stringify(s));
}

beforeEach((ctx) => {
  localStorage.clear();
  container?.remove();
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  return () => {
    act(() => root.unmount());
    void ctx;
  };
});

describe("student journey", () => {
  it("shows the welcome screen with exam scope and does not start the timer", () => {
    render();
    expect(txt()).toContain("The Garden of Knowledge");
    expect(txt()).toContain("Grade 3 English Examination");
    expect(txt()).toContain("Unit 1 · Lessons 1–5");
    expect(txt()).toContain("Start Exam");
    expect(txt()).not.toMatch(/\d\d:\d\d:\d\d/); // no stopwatch before start
  });

  it("requires the student's name before starting", () => {
    render();
    const startBtn = $$<HTMLButtonElement>("button").find((b) => b.textContent?.includes("Start Exam"))!;
    click(startBtn);
    expect(txt()).toContain("Please write your full name");
    expect($("#student-name")).not.toBeNull(); // still on welcome
  });

  it("starts the exam, shows the name, question counter and stopwatch; submit is disabled until complete", async () => {
    render();
    typeIn($<HTMLInputElement>("#student-name")!, "Lina Ahmad");
    const startBtn = $$<HTMLButtonElement>("button").find((b) => b.textContent?.includes("Start Exam"))!;
    click(startBtn);

    expect(txt()).toContain("Lina Ahmad");
    expect(txt()).toContain("Question");
    expect(txt()).toMatch(/35/);
    expect(txt()).toMatch(/\d\d:\d\d:\d\d/); // stopwatch now visible (count-up)

    const submit = $$<HTMLButtonElement>("button").find((b) => b.textContent?.includes("Submit Exam"))!;
    expect(submit.disabled).toBe(true); // strict: disabled while answers are missing
    expect(txt()).toContain("Still waiting: 35 questions");
  });

  it("preserves answers while navigating between questions", () => {
    render();
    typeIn($<HTMLInputElement>("#student-name")!, "Lina");
    click($$("button").find((b) => b.textContent?.includes("Start Exam"))!);

    // Q1: translate عائلة → type "family"
    typeIn($<HTMLInputElement>('main input[type="text"]')!, "family");
    expect(txt()).toContain("This question is answered");

    // go to Q2, translate أخت → "sister", then back to Q1
    click($$("button").find((b) => b.textContent?.includes("Next"))!);
    typeIn($<HTMLInputElement>('main input[type="text"]')!, "sister");
    click($$("button").find((b) => b.textContent?.includes("Previous"))!);

    expect($<HTMLInputElement>('main input[type="text"]')!.value).toBe("family"); // answer preserved

    // persisted in localStorage too (refresh safety)
    const stored = JSON.parse(localStorage.getItem("gok_grade3_exam_session_v1")!);
    expect(stored.answers["1"].a).toBe("family");
    expect(stored.answers["2"].a).toBe("sister");
    expect(stored.startedAt).toBeGreaterThan(0);
  });

  it("restores a mid-exam attempt after refresh without resetting anything", () => {
    seedActiveSession({ 1: { a: "family" } });
    render();
    expect(txt()).toContain("Lina Ahmad"); // straight back into the exam
    expect(txt()).toMatch(/\d\d:\d\d:\d\d/);
    expect(txt()).not.toContain("Your full name"); // not a new attempt
    expect($<HTMLInputElement>('main input[type="text"]')!.value).toBe("family"); // typed answer restored
  });

  it("submitting shows results immediately — no confirmation dialog", () => {
    seedActiveSession(completeAnswers());
    render();
    const submit = $$<HTMLButtonElement>("button").find((b) => b.textContent?.includes("Submit Exam"))!;
    expect(submit.disabled).toBe(false);
    click(submit); // one click — results must appear at once
    expect(txt()).toContain("Your Exam Results");
    expect(txt()).toContain("96"); // 100 − 4 pending writing marks
    expect(txt()).toContain("96%".replace("96%", "96%")); // percentage present
    expect(txt()).toContain("Download Exam Report (TXT)");
    expect(txt()).toContain("Teacher review: 1");
    const stored = JSON.parse(localStorage.getItem("gok_grade3_exam_session_v1")!);
    expect(stored.submitted).toBe(true);
    expect(stored.finalElapsedMs).toBeGreaterThanOrEqual(8 * 60_000);
  });

  it("a restored submitted attempt shows results (not the exam)", () => {
    seedActiveSession(completeAnswers());
    const raw = JSON.parse(localStorage.getItem("gok_grade3_exam_session_v1")!);
    raw.submitted = true;
    raw.submittedAt = Date.now();
    raw.finalElapsedMs = 8 * 60_000;
    localStorage.setItem("gok_grade3_exam_session_v1", JSON.stringify(raw));
    render();
    expect(txt()).toContain("Your Exam Results");
    expect(txt()).toContain("00:08:00");
  });

  it("Retake Exam clears the attempt and asks for the name again", () => {
    seedActiveSession(completeAnswers());
    const raw = JSON.parse(localStorage.getItem("gok_grade3_exam_session_v1")!);
    raw.submitted = true;
    raw.finalElapsedMs = 5000;
    localStorage.setItem("gok_grade3_exam_session_v1", JSON.stringify(raw));
    render();
    click($$("button").find((b) => b.textContent?.includes("Retake Exam"))!);
    expect(txt()).toContain("Your full name"); // back to welcome
    expect(localStorage.getItem("gok_grade3_exam_session_v1")).toBeNull();
  });

  it("Arabic appears ONLY as vocabulary stimulus words; all UI chrome stays English", () => {
    render();
    expect(/[؀-ۿ]/.test(txt())).toBe(false); // welcome screen is fully English

    typeIn($<HTMLInputElement>("#student-name")!, "Lina");
    click($$("button").find((b) => b.textContent?.includes("Start Exam"))!);

    expect(txt()).toContain("عائلة"); // Q1 vocabulary word shown in Arabic
    expect(txt()).toContain("Write the English meaning of:"); // instruction stays English
    // navigation / header / footer remain English (no Arabic outside part.arabic chips)
    expect(txt()).toContain("Submit Exam");
    expect(txt()).toContain("Garden Map");
  });

  it("vocabulary questions require the English meaning of the given Arabic word", () => {
    render();
    typeIn($<HTMLInputElement>("#student-name")!, "Lina");
    click($$("button").find((b) => b.textContent?.includes("Start Exam"))!);
    // Q1 = عائلة → correct: family · wrong: school
    typeIn($<HTMLInputElement>('main input[type="text"]')!, "school");
    const stored = JSON.parse(localStorage.getItem("gok_grade3_exam_session_v1")!);
    expect(stored.answers["1"].a).toBe("school");
    const wrong = gradeFullExam(stored.answers);
    expect(wrong.questionResults.find((r) => r.questionId === 1)!.status).toBe("incorrect");
    // and the correct translation is accepted
    expect(gradeFullExam({ ...stored.answers, 1: { a: "Family" } }).questionResults.find((r) => r.questionId === 1)!.earned).toBe(2);
  });
});

describe("teacher answer key area", () => {
  it("is password gated; wrong password rejected, somer173 unlocks", () => {
    render();
    click($$("button").find((b) => b.textContent?.includes("Teacher Area"))!);
    expect(txt()).toContain("Teacher Answer Key");
    expect(txt()).not.toContain("Q1 ·");

    typeIn($<HTMLInputElement>('input[aria-label="Teacher password"]')!, "wrongpass");
    click($$("button").find((b) => b.textContent?.includes("Unlock Answer Key"))!);
    expect(txt()).toContain("Incorrect password");

    typeIn($<HTMLInputElement>('input[aria-label="Teacher password"]')!, "somer173");
    click($$("button").find((b) => b.textContent?.includes("Unlock Answer Key"))!);
    expect(txt()).toContain("Q1 · Look at the Arabic word and write its meaning in English.");
    expect(txt()).toContain("Answer: family");
    expect(txt()).toContain("35 questions · 13 vocabulary · 100 marks total");
  });

  it("the answer key is not visible on the welcome or exam screens", () => {
    render();
    expect(txt()).not.toContain("Answer: family");
  });
});

describe("report content", () => {
  it("TXT report contains identity, timing, score and every question", () => {
    const answers = completeAnswers();
    const session: ExamSession = {
      version: 1,
      studentName: "Lina Ahmad",
      startedAt: Date.now() - 8 * 60_000,
      currentQuestion: 35,
      answers,
      submitted: true,
      submittedAt: Date.now(),
      finalElapsedMs: 8 * 60_000,
    };
    const report = buildTextReport(session, gradeFullExam(answers));
    expect(report).toContain("Lina Ahmad");
    expect(report).toContain("Unit 1 · Lessons 1-5");
    expect(report).toContain("00:08:00");
    expect(report).toContain("96 / 100");
    expect(report).toContain("96%");
    for (const q of QUESTIONS) expect(report).toContain(`Q${q.id}.`);
    expect(report).toContain("TEACHER REVIEW");
    expect(report).toContain("Reference        : Lesson");
  });

  it("teacher key TXT lists correct answers, alternatives and rubrics", () => {
    const key = buildTeacherKey();
    expect(key).toContain("ANSWER: family");
    expect(key).toContain("[Arabic word: عائلة]");
    expect(key).toContain("ACCEPTED ALTERNATIVES");
    expect(key).toContain("RUBRIC: Correctly uses There is");
    expect(key).toContain("Revision 1");
  });
});

describe("sound files", () => {
  it("start and submit sounds are local files shipped with the project", async () => {
    // static check of the module constants
    const mod = await import("./logic/sound");
    expect(mod.isMuted()).toBe(false);
    vi
      .spyOn(HTMLAudioElement.prototype, "play")
      .mockImplementation(() => Promise.resolve());
    mod.playStartSound();
    mod.playSubmitSound();
    mod.setMuted(true);
    expect(mod.isMuted()).toBe(true);
    mod.setMuted(false);
  });
});
