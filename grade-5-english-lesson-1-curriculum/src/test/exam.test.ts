import { describe, expect, it } from "vitest";
import { EXAM_ID, EXAM_TITLE as CONFIG_EXAM_TITLE } from "../config";
import { ALL_ITEMS, EXAM_TITLE, QUESTIONS, TOTAL_MARKS, TOTAL_ITEM_COUNT } from "../data/exam";
import { classifyVocab, gradeExam, gradeItem, validateExamStructure, type Answers } from "../lib/grading";
import { buildReport } from "../lib/report";
import { formatHMS, safeFileName } from "../lib/storage";

const correctAnswers = (): Answers => {
  const out: Answers = {};
  for (const { item } of ALL_ITEMS) out[item.id] = item.answer;
  return out;
};

describe("exam structure", () => {
  it("passes the built-in structural validation", () => {
    expect(validateExamStructure()).toEqual([]);
  });

  it("has exactly 8 main questions", () => {
    expect(QUESTIONS).toHaveLength(8);
    expect(QUESTIONS.map((q) => q.number)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it("has a target mark allocation per question that matches the brief", () => {
    expect(QUESTIONS.map((q) => q.targetMarks)).toEqual([12, 12, 8, 15, 10, 20, 11, 12]);
  });

  it("totals exactly 100 marks", () => {
    const total = ALL_ITEMS.reduce((s, x) => s + x.item.marks, 0);
    expect(total).toBe(TOTAL_MARKS);
    expect(TOTAL_MARKS).toBe(100);
  });

  it("each question's marks equal its target", () => {
    for (const q of QUESTIONS) {
      const sum = q.parts.flatMap((p) => p.items).reduce((s, i) => s + i.marks, 0);
      expect(sum, `Q${q.number}`).toBe(q.targetMarks);
    }
  });

  it("Q6 has four 5-mark subparts worth 20 marks", () => {
    const q6 = QUESTIONS.find((q) => q.number === 6)!;
    expect(q6.parts).toHaveLength(4);
    expect(q6.parts.map((p) => p.items.reduce((s, i) => s + i.marks, 0))).toEqual([5, 5, 5, 5]);
  });

  it("has exactly 3 vocabulary questions, all in Q1–Q3, each prompt in Arabic with a typed English answer", () => {
    const vocab = ALL_ITEMS.filter((x) => x.item.kind === "vocab");
    expect(vocab).toHaveLength(8);
    expect(new Set(vocab.map((v) => v.questionNumber))).toEqual(new Set([1, 2, 3]));
    for (const v of vocab) {
      expect(v.item.arabic).toBeTruthy();
      expect(/[\u0600-\u06FF]/.test(v.item.arabic!)).toBe(true);
      expect(typeof v.item.answer).toBe("string");
      expect(v.item.options).toBeUndefined();
    }
  });

  it("tests each of the 8 target vocabulary words exactly once", () => {
    const words = ALL_ITEMS.filter((x) => x.item.kind === "vocab").map((x) => x.item.answer as string).sort();
    expect(words).toEqual(
      ["canteen", "classroom", "computer lab", "corridor", "library", "playground", "school uniform", "science lab"].sort(),
    );
  });

  it("Q1 = 3 words (12 marks), Q2 = 3 words (12), Q3 = 2 words (8)", () => {
    const perQ = (n: number) => ALL_ITEMS.filter((x) => x.questionNumber === n && x.item.kind === "vocab");
    expect(perQ(1)).toHaveLength(3);
    expect(perQ(2)).toHaveLength(3);
    expect(perQ(3)).toHaveLength(2);
  });

  it("contains no writing or composition task", () => {
    const banned = /\b(write|writing|paragraph|essay|composition|story|compose)\b/i;
    for (const { item } of ALL_ITEMS) {
      expect(banned.test(item.prompt), item.id).toBe(false);
    }
    for (const q of QUESTIONS) {
      expect(banned.test(q.instruction), `Q${q.number}`).toBe(false);
      for (const p of q.parts) expect(banned.test(p.instruction), p.id).toBe(false);
    }
  });

  it("does not show mark values in student-facing instructions", () => {
    for (const q of QUESTIONS) {
      expect(/mark/i.test(q.instruction), `Q${q.number}`).toBe(false);
      for (const p of q.parts) expect(/mark/i.test(p.instruction), p.id).toBe(false);
    }
  });

  it("every item has a curriculum reference", () => {
    for (const { item } of ALL_ITEMS) {
      expect(item.ref.unit).toBe("Unit 1");
      expect(item.ref.lesson).toContain("Lesson 1");
      expect(item.ref.source.length).toBeGreaterThan(5);
      expect(item.ref.skill.length).toBeGreaterThan(5);
    }
  });

  it("has the expected number of items", () => {
    expect(TOTAL_ITEM_COUNT).toBe(64);
  });

  it("uses the assigned EXAM_ID and visible title and fixes the confirmed Q4.1 duplicate 'to'", () => {
    expect(EXAM_ID).toBe("grade-5-english-lesson-1-curriculum");
    expect(EXAM_TITLE).toBe("Lesson 1 Curriculum");
    expect(CONFIG_EXAM_TITLE).toBe("Lesson 1 Curriculum");
    const q41 = ALL_ITEMS.find((x) => x.item.id === "Q4.1")!.item;
    expect(q41.prompt).toBe("Karim ___ keep the classroom tidy.");
  });
});

describe("vocabulary marking", () => {
  it.each([
    ["classroom", "classroom", "correct"],
    ["  Classroom ", "classroom", "correct"],
    ["CLASSROOM", "classroom", "correct"],
    ["the library", "library", "correct"],
    ["science-lab", "science lab", "correct"],
    ["science  lab", "science lab", "correct"],
    ["sciencelab", "science lab", "spelling"],
    ["classrom", "classroom", "spelling"],
    ["librery", "library", "spelling"],
    ["canten", "canteen", "spelling"],
    ["corridr", "corridor", "spelling"],
    ["schooluniform", "school uniform", "spelling"],
    ["school unifrom", "school uniform", "spelling"],
    ["playgroud", "playground", "spelling"],
    ["libraries", "library", "incorrect"],
    ["classrooms", "classroom", "incorrect"],
    ["school", "classroom", "incorrect"],
    ["lab", "science lab", "incorrect"],
    ["hall", "corridor", "incorrect"],
    ["", "canteen", "unanswered"],
    ["   ", "canteen", "unanswered"],
  ])("'%s' vs '%s' => %s", (typed, expected, status) => {
    expect(classifyVocab(typed, expected)).toBe(status);
  });

  it("awards full marks, half marks for spelling, and zero for incorrect", () => {
    const item = ALL_ITEMS.find((x) => x.item.id === "Q1.1")!.item; // classroom, 4 marks
    expect(gradeItem(item, "classroom")).toEqual({ status: "correct", awarded: 4 });
    expect(gradeItem(item, "classrom")).toEqual({ status: "spelling", awarded: 2 });
    expect(gradeItem(item, "school")).toEqual({ status: "incorrect", awarded: 0 });
    expect(gradeItem(item, "")).toEqual({ status: "unanswered", awarded: 0 });
  });
});

describe("objective item marking", () => {
  it("scores a true/false item exactly", () => {
    const item = ALL_ITEMS.find((x) => x.item.id === "Q6.2")!.item;
    expect(gradeItem(item, "False").awarded).toBe(1);
    expect(gradeItem(item, "True").awarded).toBe(0);
  });

  it("scores the ordering item only when all three slots are correct", () => {
    const item = ALL_ITEMS.find((x) => x.item.id === "Q5.5")!.item;
    expect(gradeItem(item, ["nursery", "basic / primary school", "secondary school"]).awarded).toBe(3);
    expect(gradeItem(item, ["basic / primary school", "nursery", "secondary school"]).awarded).toBe(0);
    expect(gradeItem(item, ["nursery", "basic / primary school", ""]).status).toBe("unanswered");
  });

  it("is case and curly-apostrophe tolerant for choice answers", () => {
    const item = ALL_ITEMS.find((x) => x.item.id === "Q4.2")!.item;
    expect(gradeItem(item, "Don’t have to").awarded).toBe(3);
  });
});

describe("whole-exam scoring", () => {
  it("gives 100/100 and 100% when every answer is correct", () => {
    const r = gradeExam(correctAnswers());
    expect(r.total).toBe(100);
    expect(r.percent).toBe(100);
    expect(r.questions.map((q) => q.awarded)).toEqual([12, 12, 8, 15, 10, 20, 11, 12]);
    expect(r.answeredCount).toBe(TOTAL_ITEM_COUNT);
  });

  it("gives 0 when nothing is answered", () => {
    const r = gradeExam({});
    expect(r.total).toBe(0);
    expect(r.percent).toBe(0);
    expect(r.answeredCount).toBe(0);
  });

  it("marks each sub-part independently", () => {
    const answers = correctAnswers();
    answers["Q6.1"] = "False"; // one wrong in Q6 part A
    const r = gradeExam(answers);
    expect(r.total).toBe(99);
    expect(r.questions[5].awarded).toBe(19);
  });

  it("awards half marks for a spelling slip in Q2 and full marks elsewhere", () => {
    const answers = correctAnswers();
    answers["Q2.1"] = "libary"; // 4 marks → 2
    const r = gradeExam(answers);
    expect(r.total).toBe(98);
    expect(r.items.find((i) => i.item.id === "Q2.1")!.status).toBe("spelling");
  });
});

describe("report and helpers", () => {
  it("builds a report with name, title, score, times and per-item results", () => {
    const answers = correctAnswers();
    answers["Q1.2"] = "science";
    const start = Date.UTC(2026, 0, 1, 9, 0, 0);
    const report = buildReport({
      studentName: "Maha Ali",
      result: gradeExam(answers),
      startedAt: start,
      submittedAt: start + (1 * 3600 + 2 * 60 + 3) * 1000,
    });
    expect(report).toContain("Student name    : Maha Ali");
    expect(report).toContain("Time taken      : 01:02:03");
    expect(report).toContain("Total score     : 96 / 100");
    expect(report).toContain("Correct answer  : science lab");
    expect(report).toContain("Curriculum ref");
    expect(report).toContain("Arabic prompt   : مخبر العلوم");
    expect(report).not.toMatch(/arena/i);
  });

  it("formats HH:MM:SS and safe file names", () => {
    expect(formatHMS(0)).toBe("00:00:00");
    expect(formatHMS(3_723_000)).toBe("01:02:03");
    expect(formatHMS(100 * 3_600_000)).toBe("100:00:00");
    expect(safeFileName("Maha Ali")).toBe("Maha_Ali");
    expect(safeFileName("  ")).toBe("student");
  });
});
