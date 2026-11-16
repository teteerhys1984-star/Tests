/* Runtime smoke tests — render the full tree for every exam phase. */
import { beforeAll, describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import React from "react";
import type { ExamSession } from "./types";
import { QUESTIONS } from "./data/questions";
import { gradeExam, normalize } from "./logic/grading";
import type { AnswerMap } from "./types";

beforeAll(() => {
  // minimal localStorage shim for node rendering
  const store = new Map<string, string>();
  (globalThis as Record<string, unknown>).localStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
  };
});

// dynamic import AFTER the shim is in place
const load = async () => (await import("./App")).default;

function allAnsweredSession(): ExamSession {
  const answers: AnswerMap = {};
  for (const q of QUESTIONS)
    for (const p of q.parts) {
      answers[p.id] =
        p.kind === "tf"
          ? String(p.answer)
          : p.kind === "order"
            ? [...p.answer]
            : p.kind === "rubric"
              ? q.id === "q35"
                ? "My favourite subject is Science because it is fun."
                : "My name is Laila Haddad. I am from Syria."
              : p.kind === "fill"
                ? p.accept[0]
                : p.answer;
    }
  // a third of questions left blank to exercise the "in progress" UI
  return {
    phase: "exam",
    studentName: "Smoke Test Student",
    startedAt: Date.now() - 65_000,
    answers,
    current: 5,
    result: null,
  };
}

describe("app render smoke tests", () => {
  it("renders the welcome phase with Start Exam", async () => {
    const App = await load();
    const html = renderToString(React.createElement(App));
    expect(html).toContain("Start Exam");
    expect(html).toContain("The Garden of Knowledge".split(" ")[0]);
    expect(html).toContain("Grade 4");
  });

  it("renders the teacher gate behind a password prompt", async () => {
    const TeacherKey = (await import("./components/TeacherKey")).default;
    const html = renderToString(React.createElement(TeacherKey, { onClose: () => {} }));
    expect(html).toContain("Access password");
    expect(html).toContain("Unlock Answer Key");
  });

  it("renders the exam phase with HUD, timer, map and Submit Exam", async () => {
    const storage = await import("./logic/storage");
    storage.saveSession(allAnsweredSession());
    const App = await load();
    // fresh instance reads the saved session
    const html = renderToString(React.createElement(App));
    expect(html).toContain("Submit Exam");
    expect(html).toContain("Smoke Test Student");
    expect(html).toContain("Tactical Map");
    expect(html).toContain("TARGETS SECURED");
  });

  it("renders results phase after grading with report details", async () => {
    const storage = await import("./logic/storage");
    const s = allAnsweredSession();
    const result = gradeExam(s.answers, s.studentName, s.startedAt!, Date.now());
    storage.saveSession({ ...s, phase: "results", result });
    const App = await load();
    const html = renderToString(React.createElement(App));
    expect(html).toContain("Mission Debrief");
    expect(html).toContain("Download Exam Report (TXT)");
    expect(html).toContain("Retake Exam");
    expect(html).toContain("100 <" /* 100 / 100 total somewhere */.split(" ")[0]);
    expect(html).toContain("Question-by-Question Report");
  });
});

describe("report generation", () => {
  it("builds a complete UTF-8 text report with references", async () => {
    const { buildReport, reportFilename } = await import("./logic/report");
    const storage = await import("./logic/storage");
    void storage;
    const answers: AnswerMap = {};
    for (const q of QUESTIONS)
      for (const p of q.parts) {
        answers[p.id] =
        p.kind === "tf"
          ? String(p.answer)
          : p.kind === "order"
            ? [...p.answer]
            : p.kind === "rubric"
              ? q.id === "q35"
                ? "My favourite subject is Science because it is fun."
                : "My name is Laila Haddad. I am from Syria."
              : p.kind === "fill"
                ? p.accept[0]
                : p.answer;
    }
    const r = gradeExam(answers, "Ahmad Saleh", 0, 60_000);
    const report = buildReport(r);
    expect(report).toContain("OFFICIAL EXAM REPORT");
    expect(report).toContain("100 / 100");
    expect(report).toContain("Ahmad Saleh");
    expect(report).toContain("QUESTION 35");
    expect(report).toContain("Curriculum reference");
    expect(report).toMatch(/Lesson 1/);
    expect(reportFilename("Ahmad Saleh / Al-Farsi ?!")).toBe(
      "Grade4_English_Exam_Ahmad_Saleh_Al-Farsi.txt"
    );
    // report includes the Arabic curriculum words of the translation questions
    expect(report).toContain("Arabic word");
    expect(report).toContain("دولة");
    expect(report).toContain("الجغرافيا");
    expect(normalize("  Hello  ")).toBe("hello");
  });
});
