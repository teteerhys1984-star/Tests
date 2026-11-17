// @vitest-environment jsdom
/**
 * Unit tests for grading (full, partial, wrong, unanswered, punctuation MC fix),
 * attempt persistence/restore, and TXT report generation.
 */
import { beforeEach, describe, expect, it } from "vitest";

import { EXAM_TITLE } from "@/config";
import { LESSON_TITLES, QUESTIONS } from "@/data/exam";
import {
  STORAGE_KEY,
  clearAttempt,
  elapsedMs,
  formatClock,
  loadAttempt,
  newAttemptId,
  saveAttempt,
  type Attempt,
} from "@/lib/attempt";
import {
  allAnswered,
  answeredCount,
  gradeExam,
  isCorrect,
  norm,
  requiredItemCount,
} from "@/lib/grading";
import { buildReport } from "@/lib/report";

function fullAnswers(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const q of QUESTIONS) {
    for (const it of q.items) {
      out[`${q.id}/${it.id}`] = it.answer;
    }
  }
  return out;
}

describe("Grading engine", () => {
  it("requires 98 items across 25 questions", () => {
    expect(requiredItemCount()).toBe(98);
    expect(answeredCount({})).toBe(0);
    expect(allAnswered({})).toBe(false);
  });

  it("awards 100 / 100 with 98/98 items when all answers match the key", () => {
    const ans = fullAnswers();
    expect(answeredCount(ans)).toBe(98);
    expect(allAnswered(ans)).toBe(true);

    const res = gradeExam(ans, "Layan Al-Ahmad");
    expect(res.score).toBe(100);
    expect(res.total).toBe(100);
    expect(res.correctItems).toBe(98);
    expect(res.totalItems).toBe(98);
    expect(res.questions.every((q) => q.awarded === q.marks)).toBe(true);
  });

  it("supports partial marks on both 4-item questions and 2x2-mark order question (q18)", () => {
    const ans = fullAnswers();
    // Leave 1 wrong in q01 (3/4), 2 wrong in q02 (2/4), 1 sentence wrong in q18 (2/4)
    ans["q01/q01a"] = "never";
    ans["q02/q02a"] = "has to";
    ans["q02/q02b"] = "has to";
    ans["q18/q18a"] = "don’t|to|We|have|homework|at|do|school."; // wrong word order

    const res = gradeExam(ans, "Partial Pupil");
    const byId = new Map(res.questions.map((q) => [q.question.id, q]));

    expect(byId.get("q01")!.awarded).toBe(3);
    expect(byId.get("q01")!.marks).toBe(4);
    expect(byId.get("q02")!.awarded).toBe(2);
    expect(byId.get("q18")!.awarded).toBe(2);
    expect(byId.get("q18")!.items[0].isCorrect).toBe(false);
    expect(byId.get("q18")!.items[1].isCorrect).toBe(true);
    expect(res.score).toBe(95);
    expect(res.correctItems).toBe(94);
  });

  it("scores 0 / 100 on blank answers and marks answered=false", () => {
    const res = gradeExam({}, "Blank Pupil");
    expect(res.score).toBe(0);
    expect(res.total).toBe(100);
    expect(res.correctItems).toBe(0);
    const items = res.questions.flatMap((q) => q.items);
    expect(items.every((i) => !i.isCorrect && !i.answered && i.awarded === 0)).toBe(true);
  });

  it("distinguishes wrong answers (answered=true, awarded=0) from blank answers", () => {
    const ans: Record<string, string> = {
      "q01/q01a": "never",
      "q04/q04c": "False", // q04c key is True
    };
    const res = gradeExam(ans, "Mixed Pupil");
    const q01a = res.questions[0].items[0];
    const q01b = res.questions[0].items[1];
    const q04c = res.questions[3].items[2];
    expect(q01a.answered).toBe(true);
    expect(q01a.isCorrect).toBe(false);
    expect(q01a.awarded).toBe(0);
    expect(q01b.answered).toBe(false);
    expect(q04c.answered).toBe(true);
    expect(q04c.isCorrect).toBe(false);
  });

  it("grades q16d punctuation MC strictly: '?' is correct, '.' and ',' are wrong", () => {
    const q16 = QUESTIONS.find((q) => q.id === "q16")!;
    const q16d = q16.items[3];
    expect(q16d.kind).toBe("mc");
    expect(q16d.answer).toBe("?");

    // Source norm() turned ".", ",", "?" into "". Fixed grading must NOT!
    expect(norm(".")).toBe("");
    expect(norm(",")).toBe("");
    expect(norm("?")).toBe("");

    expect(isCorrect(q16d, "?")).toBe(true);
    expect(isCorrect(q16d, ".")).toBe(false);
    expect(isCorrect(q16d, ",")).toBe(false);
  });

  it("normalizes typed text answers safely (case, spaces, curly apostrophes, trailing punctuation, accept variants)", () => {
    const q01a = QUESTIONS[0].items[0]; // text accept: ["always"]
    expect(isCorrect(q01a, "  Always. ")).toBe(true);
    expect(isCorrect(q01a, "ALWAYS")).toBe(true);

    const q04a = QUESTIONS[3].items[0]; // text accept: ["ten", "10", "ten years old", ...]
    expect(isCorrect(q04a, "  10. ")).toBe(true);
    expect(isCorrect(q04a, "He is ten years old")).toBe(true);

    const q14a = QUESTIONS[13].items[0]; // text accept: ["not", "n't", "nt"]
    expect(isCorrect(q14a, "n\u2019t")).toBe(true);
    expect(isCorrect(q14a, "NOT")).toBe(true);
  });
});

describe("Attempt storage & stopwatch", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("saves and restores an in-progress attempt cleanly across refresh", () => {
    const attempt: Attempt = {
      v: 1,
      attemptId: newAttemptId(),
      name: "Sami Hasan",
      startedAt: 1_770_000_000_000,
      answers: { "q01/q01a": "always", "q04/q04c": "True" },
      currentIndex: 3,
      submittedAt: null,
    };
    saveAttempt(attempt);

    const restored = loadAttempt();
    expect(restored).toEqual(attempt);
    expect(localStorage.getItem(STORAGE_KEY)).toBeTruthy();

    clearAttempt();
    expect(loadAttempt()).toBeNull();
  });

  it("returns null if stored data is corrupted", () => {
    localStorage.setItem(STORAGE_KEY, "{not-valid-json");
    expect(loadAttempt()).toBeNull();
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ name: 123 }));
    expect(loadAttempt()).toBeNull();
  });

  it("computes elapsed time accurately and formats HH:MM:SS", () => {
    const attempt: Attempt = {
      v: 1,
      attemptId: "a1",
      name: "Tala",
      startedAt: 1_000_000,
      answers: {},
      currentIndex: 0,
      submittedAt: 1_000_000 + 3661_000,
    };
    expect(elapsedMs(attempt)).toBe(3661_000);
    expect(formatClock(3661_000)).toBe("01:01:01");
  });
});

describe("TXT report generation", () => {
  it("contains exam title, student details, all 25 questions, 98 items, and 5 lesson summaries", () => {
    const attempt: Attempt = {
      v: 1,
      attemptId: "rep-1",
      name: "Nour Saleh",
      startedAt: Date.UTC(2026, 4, 12, 9, 0, 0),
      answers: fullAnswers(),
      currentIndex: 24,
      submittedAt: Date.UTC(2026, 4, 12, 9, 12, 30),
    };
    const result = gradeExam(attempt.answers, attempt.name);
    const report = buildReport(attempt, result);

    expect(report).toContain(EXAM_TITLE.toUpperCase());
    expect(report).toContain("Student        : Nour Saleh");
    expect(report).toContain("Final score    : 100 / 100");
    expect(report).toContain("Items correct  : 98 / 98 sub-items");
    expect(report).toContain("Time used      : 00:12:30");
    expect(report).toContain("SUMMARY BY LESSON");

    for (let n = 1; n <= 25; n++) {
      expect(report).toContain(`QUESTION ${n} —`);
    }
    for (const id of [1, 2, 3, 4, 5] as const) {
      expect(report).toContain(LESSON_TITLES[id]);
    }
    expect(report).toContain("Eng. Somer Shaheen");
  });
});
