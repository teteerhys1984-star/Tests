import { describe, expect, it } from "vitest";
import { QUESTIONS, TOTAL_MARKS } from "../data/examData";
import { gradeExam, isSubCorrect, normalize } from "../utils/grading";

const ARABIC = /[\u0600-\u06FF]/;

describe("exam data integrity", () => {
  it("has exactly 20 questions worth 100 marks", () => {
    expect(QUESTIONS).toHaveLength(20);
    expect(TOTAL_MARKS).toBe(100);
    for (const q of QUESTIONS) {
      expect(q.subs.reduce((a, s) => a + s.marks, 0)).toBe(5);
    }
  });

  it("numbers questions sequentially with unique sub-question ids", () => {
    const ids = new Set<string>();
    QUESTIONS.forEach((q, i) => {
      expect(q.number).toBe(i + 1);
      for (const s of q.subs) {
        expect(ids.has(s.id)).toBe(false);
        ids.add(s.id);
      }
    });
  });

  it("covers all six lessons and nothing from lessons 17 or 18", () => {
    const lessons = QUESTIONS.map((q) => q.lesson).join(" ");
    for (const n of ["1", "2", "3", "4", "5", "16"]) {
      expect(new RegExp(`Lesson(s)?[^\\d]*\\b${n}\\b`).test(lessons) || lessons.includes(` ${n}`)).toBe(true);
    }
    expect(/\b1[78]\b/.test(lessons)).toBe(false);
    const forbidden = /\b(mine|yours|hers|ours|theirs)\b/i;
    for (const q of QUESTIONS) for (const s of q.subs) {
      expect(forbidden.test(s.prompt)).toBe(false);
      expect(forbidden.test(s.explanation)).toBe(false);
    }
  });

  it("contains no Arabic text in student-facing content", () => {
    for (const q of QUESTIONS) {
      expect(ARABIC.test(q.title + (q.intro ?? ""))).toBe(false);
      for (const s of q.subs) {
        const text = [s.prompt, s.explanation, ...("options" in s ? s.options : []), ...("words" in s ? s.words : [])].join(" ");
        expect(ARABIC.test(text)).toBe(false);
      }
    }
  });

  it("choice/match answers are valid options and order answers use all words", () => {
    for (const q of QUESTIONS) for (const s of q.subs) {
      if (s.type === "choice" || s.type === "match") expect(s.options).toContain(s.answer);
      if (s.type === "order") {
        const sorted = (arr: string[]) => [...arr].sort().join("|");
        expect(sorted(s.answer.replace(/[.?!]$/, "").split(" "))).toBe(sorted(s.words));
      }
    }
  });
});

describe("grading", () => {
  it("ignores case, spacing and punctuation", () => {
    expect(normalize("  Yes,  he IS. ")).toBe("yes he is");
    const sub = QUESTIONS[6].subs[0]; // 7a — Yes, he is.
    expect(isSubCorrect(sub, "yes he is")).toBe(true);
    expect(isSubCorrect(sub, "YES, HE IS!")).toBe(true);
    expect(isSubCorrect(sub, "Yes, she is.")).toBe(false);
  });

  it("accepts curly apostrophes in contractions", () => {
    const sub = QUESTIONS[6].subs[1]; // 7b — No, I am not. / No, I'm not.
    expect(isSubCorrect(sub, "No, I\u2019m not.")).toBe(true);
  });

  it("awards full marks for a perfect paper and zero for an empty one", () => {
    const perfect: Record<string, string> = {};
    for (const q of QUESTIONS) for (const s of q.subs) {
      perfect[s.id] = s.type === "text" ? s.accept[0] : s.answer;
    }
    const r = gradeExam(QUESTIONS, perfect);
    expect(r.total).toBe(100);
    expect(r.percentage).toBe(100);
    expect(r.incorrectCount).toBe(0);
    const empty = gradeExam(QUESTIONS, {});
    expect(empty.total).toBe(0);
    expect(empty.correctCount).toBe(0);
  });
});
