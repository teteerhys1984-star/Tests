// @vitest-environment jsdom
/* ------------------------------------------------------------------ */
/*  Session persistence + submission-flow checks (localStorage, jsdom) */
/* ------------------------------------------------------------------ */

import { beforeEach, describe, expect, it } from "vitest";
import type { AnswersMap, ExamSession } from "../types";
import { clearSession, loadSession, saveSession } from "./storage";
import { unansweredQuestionIds, gradeFullExam, normalize, gradePart } from "./grading";
import { QUESTIONS } from "../data/examData";

function freshSession(name: string, startedAt: number): ExamSession {
  return {
    version: 1,
    studentName: name,
    startedAt,
    currentQuestion: 1,
    answers: {},
    submitted: false,
    submittedAt: null,
    finalElapsedMs: null,
  };
}

beforeEach(() => {
  localStorage.clear();
});

describe("save and recovery", () => {
  it("returns null when there is no stored session", () => {
    expect(loadSession()).toBeNull();
  });

  it("restores the same active attempt after a refresh (name, answers, question, timer origin)", () => {
    const startedAt = Date.now() - 5 * 60_000; // started 5 minutes ago
    const s = freshSession("Lina Ahmad", startedAt);
    s.answers = { 1: { a: "parents" }, 15: { a: "have", b: "has" } };
    s.currentQuestion = 16;
    saveSession(s);

    const restored = loadSession();
    expect(restored).not.toBeNull();
    expect(restored!.studentName).toBe("Lina Ahmad");
    expect(restored!.startedAt).toBe(startedAt); // timer origin survives refresh
    expect(restored!.currentQuestion).toBe(16);
    expect(restored!.answers[15].b).toBe("has");
    expect(restored!.submitted).toBe(false);
  });

  it("a submitted session restores as submitted with frozen elapsed time", () => {
    const s = freshSession("Omar", Date.now() - 900_000);
    s.submitted = true;
    s.submittedAt = Date.now();
    s.finalElapsedMs = 900_000;
    saveSession(s);
    const restored = loadSession()!;
    expect(restored.submitted).toBe(true);
    expect(restored.finalElapsedMs).toBe(900_000);
  });

  it("clearSession fully removes the attempt (Retake starts fresh)", () => {
    saveSession(freshSession("Sara", Date.now()));
    clearSession();
    expect(loadSession()).toBeNull();
  });

  it("corrupted storage never crashes the app", () => {
    localStorage.setItem("gok_grade3_exam_session_v1", "{not json!!");
    expect(loadSession()).toBeNull();
  });
});

describe("submission gating", () => {
  it("Submit Exam stays disabled while any part is unanswered", () => {
    const answers: AnswersMap = {};
    // answer everything except the very last part of Q35
    for (const q of QUESTIONS) {
      answers[q.id] = {};
      for (const p of q.parts) {
        if (q.id === 35 && p.id === "b") continue;
        answers[q.id][p.id] =
          p.kind === "mcq" || p.kind === "select"
            ? p.correctOptionId!
            : p.kind === "tf"
              ? String(p.correctBool)
              : p.kind === "order"
                ? p.tokens!.map((t) => t.id).reverse() // any full arrangement counts as answered
                : p.kind === "writing"
                  ? "There are twenty classrooms."
                  : p.accepted![0];
      }
    }
    const missing = unansweredQuestionIds(QUESTIONS, answers);
    expect(missing).toEqual([35]); // exactly one question still blocks submission
  });

  it("a complete attempt unlocks submission and grades to expected totals", () => {
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
                ? p.tokens!.map((t) => t.id) // placeholder — replaced below for the real key
                : p.kind === "writing"
                  ? "There is a gym in my school."
                  : p.accepted![0];
      }
    }
    // fix the ordering answer to the true sentence
    answers[16].a = ["t3", "t4", "t1", "t5", "t2"]; // I live with my family.
    expect(unansweredQuestionIds(QUESTIONS, answers)).toEqual([]);
    const r = gradeFullExam(answers);
    expect(r.earned).toBe(96);
    expect(r.pendingMarks).toBe(4);
    expect(r.maxMarks).toBe(100);
  });
});

describe("writing question behaviour", () => {
  const writingPart = QUESTIONS.find((q) => q.id === 29)!.parts[0];
  it("accepts any sensible sentence as an answer (reviewed later)", () => {
    const r = gradePart(writingPart, "There are twenty classrooms.");
    expect(r.status).toBe("review");
    expect(r.earned).toBe(0);
    expect(r.maxMarks).toBe(4);
  });
  it("does not fake-grade writing with exact-string matching", () => {
    const r = gradePart(writingPart, "There is a nice playground.");
    expect(r.status).toBe("review"); // honest: waits for the teacher
  });
  it("normaliser treats apostrophes and full stops as harmless", () => {
    expect(normalize("She's got two sisters.")).toBe("she's got two sisters");
  });
});
