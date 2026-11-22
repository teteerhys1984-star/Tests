import { describe, expect, it } from "vitest";
import { QUESTIONS, TOTAL_MARKS } from "../data/examData";
import { gradeExam, isSubAnswered, isSubCorrect, parseOrderValue } from "../utils/grading";

const ARABIC = /[\u0600-\u06FF]/;

describe("exam data integrity", () => {
  it("has exactly 20 questions worth 100 marks", () => {
    expect(QUESTIONS).toHaveLength(20);
    expect(TOTAL_MARKS).toBe(100);
    for (const q of QUESTIONS) {
      expect(q.subs).toHaveLength(5);
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
        expect(s.id).toBe(`${q.number}${s.label}`);
      }
    });
    expect(ids.size).toBe(100);
  });

  it("covers all eight source lessons and nothing else", () => {
    const lessons = new Set(QUESTIONS.map((q) => q.lesson));
    expect([...lessons].sort()).toEqual(
      ["Lesson 1", "Lesson 16", "Lesson 17", "Lesson 18", "Lesson 2", "Lesson 3", "Lesson 4", "Lesson 5"].sort(),
    );
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

  it("choice/match answers are valid options and order answers use every pool chip", () => {
    for (const q of QUESTIONS) for (const s of q.subs) {
      if (s.type === "choice" || s.type === "match") expect(s.options).toContain(s.answer);
      if (s.type === "order") {
        const parsed = parseOrderValue(s.answer, s.words);
        expect(parsed).not.toBeNull();
        expect(parsed!.length).toBe(s.words.length);
        expect(isSubAnswered(s, s.answer)).toBe(true);
      }
    }
  });

  it("has passages only where the source has them (Q15 dialogue, Q17 reading)", () => {
    expect(QUESTIONS.filter((q) => q.intro).map((q) => q.number)).toEqual([15, 17]);
    expect(QUESTIONS[14].intro).toContain("Mia: Whose jacket is this?");
    expect(QUESTIONS[16].intro).toContain("My name is Omar.");
  });
});

describe("grading", () => {
  it("ignores case, spacing and punctuation for typed answers", () => {
    const sub = QUESTIONS[1].subs[0]; // 2a — He is not a teacher.
    expect(isSubCorrect(sub, "he is not a teacher")).toBe(true);
    expect(isSubCorrect(sub, "  HE IS NOT A TEACHER. ")).toBe(true);
    expect(isSubCorrect(sub, "He is a teacher.")).toBe(false);
  });

  it("accepts curly apostrophes in contractions", () => {
    const sub = QUESTIONS[1].subs[0]; // 2a — also accepts He isn't a teacher.
    expect(isSubCorrect(sub, "He isn\u2019t a teacher.")).toBe(true);
  });

  it("keeps its / it's and their / they're distinct", () => {
    const its = QUESTIONS[18].subs[1]; // 19b — its
    const itIs = QUESTIONS[18].subs[0]; // 19a — It's
    expect(isSubCorrect(its, "its")).toBe(true);
    expect(isSubCorrect(its, "it's")).toBe(false);
    expect(isSubCorrect(itIs, "It's")).toBe(true);
    expect(isSubCorrect(itIs, "Its")).toBe(false);
  });

  it("handles multi-word order chips (the cat / a book / the door)", () => {
    const sub = QUESTIONS[15].subs[0]; // 16a — The cat drinks milk.
    expect(isSubCorrect(sub, "The cat drinks milk")).toBe(true);
    expect(isSubCorrect(sub, "the cat drinks milk.")).toBe(true);
    expect(isSubAnswered(sub, "The cat drinks milk")).toBe(true);
    expect(isSubAnswered(sub, "The cat drinks")).toBe(false);
    expect(isSubCorrect(sub, "drinks the cat milk")).toBe(false);
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
