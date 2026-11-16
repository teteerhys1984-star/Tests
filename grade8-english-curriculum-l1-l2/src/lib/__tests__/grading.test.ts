/**
 * Automated unit tests for the answer-checking and scoring logic AND for the
 * structural integrity of the 20-question exam data.
 * Run with: npx vitest run
 */
import { describe, it, expect } from "vitest";
import { QUESTIONS, TOTAL_MARKS, TOTAL_QUESTIONS } from "../../data/questions";
import {
  gradeExam,
  gradeQuestion,
  isQuestionAnswered,
  countAnswered,
} from "../grading";
import {
  normalizeText,
  matchesAny,
  normalizeSequence,
  sameMultiset,
} from "../normalize";
import type { AnswerMap, AnswerValue, Question, Subpart } from "../../types";

/* ------------------------------------------------------------------ */
/* Helpers: build "all correct" and "all wrong" answer maps            */
/* ------------------------------------------------------------------ */

function correctValue(sub: Subpart): AnswerValue {
  switch (sub.type) {
    case "mcq":
      return { kind: "mcq", index: sub.correctIndex };
    case "tf":
      return { kind: "tf", value: sub.correct };
    case "select":
      return { kind: "select", value: sub.correct };
    case "text":
      return { kind: "text", value: sub.accept[0] };
    case "reorder":
      return { kind: "reorder", value: [...sub.target] };
  }
}

function wrongValue(sub: Subpart): AnswerValue {
  switch (sub.type) {
    case "mcq":
      return { kind: "mcq", index: (sub.correctIndex + 1) % sub.options.length };
    case "tf":
      return { kind: "tf", value: !sub.correct };
    case "select": {
      const wrong = sub.options.find((o) => o !== sub.correct);
      return { kind: "select", value: wrong ?? "" };
    }
    case "text":
      return { kind: "text", value: "definitely-not-the-answer zxqwv" };
    case "reorder":
      return { kind: "reorder", value: [...sub.target].reverse() };
  }
}

function mapAll(questions: Question[], fn: (s: Subpart) => AnswerValue): AnswerMap {
  const m: AnswerMap = {};
  for (const q of questions) for (const s of q.subparts) m[s.id] = fn(s);
  return m;
}

/* ------------------------------------------------------------------ */
/* 1. Structural integrity of the exam data                            */
/* ------------------------------------------------------------------ */

describe("exam data structure", () => {
  it("has exactly 20 main questions", () => {
    expect(QUESTIONS.length).toBe(20);
    expect(TOTAL_QUESTIONS).toBe(20);
  });

  it("questions 1–10 cover Lesson 1 and 11–20 cover Lesson 2", () => {
    for (const q of QUESTIONS) {
      if (q.number <= 10) expect(q.lesson).toBe("lesson1");
      else expect(q.lesson).toBe("lesson2");
    }
  });

  it("every question is worth exactly 5 marks; total is 100", () => {
    for (const q of QUESTIONS) {
      expect(q.marks).toBe(5);
      const sum = q.subparts.reduce((a, s) => a + s.marks, 0);
      expect(sum).toBe(5);
    }
    expect(TOTAL_MARKS).toBe(100);
  });

  it("questions are numbered 1..20 in order with unique subpart ids", () => {
    QUESTIONS.forEach((q, i) => expect(q.number).toBe(i + 1));
    const ids = new Set<string>();
    for (const q of QUESTIONS)
      for (const s of q.subparts) {
        expect(ids.has(s.id)).toBe(false);
        ids.add(s.id);
      }
  });

  it("has balanced varied question types (at least 7 distinct labels)", () => {
    const labels = new Set(QUESTIONS.map((q) => q.typeLabel));
    expect(labels.size).toBeGreaterThanOrEqual(7);
  });

  it("every question has an explanation and a curriculum reference", () => {
    for (const q of QUESTIONS) {
      expect(q.explanation.trim().length).toBeGreaterThan(10);
      expect(q.curriculumRef.trim().length).toBeGreaterThan(5);
    }
  });

  it("subparts are internally valid", () => {
    for (const q of QUESTIONS) {
      for (const s of q.subparts) {
        expect(s.prompt.trim().length).toBeGreaterThan(0);
        expect(s.marks).toBeGreaterThan(0);
        switch (s.type) {
          case "mcq":
            expect(s.options.length).toBeGreaterThanOrEqual(2);
            expect(s.correctIndex).toBeGreaterThanOrEqual(0);
            expect(s.correctIndex).toBeLessThan(s.options.length);
            expect(new Set(s.options).size).toBe(s.options.length);
            break;
          case "tf":
            expect(typeof s.correct).toBe("boolean");
            break;
          case "select":
            expect(s.options).toContain(s.correct);
            expect(new Set(s.options).size).toBe(s.options.length);
            break;
          case "text":
            expect(s.accept.length).toBeGreaterThan(0);
            for (const a of s.accept)
              expect(normalizeText(a).length).toBeGreaterThan(0);
            break;
          case "reorder":
            expect(sameMultiset(s.words, s.target)).toBe(true);
            expect(s.words.join("|")).not.toBe(s.target.join("|")); // shown scrambled
            break;
        }
      }
    }
  });

  it("wrong value can never equal a correct value for any subpart", () => {
    for (const q of QUESTIONS)
      for (const s of q.subparts) {
        const wrong = wrongValue(s);
        const res = gradeQuestion(q, { [s.id]: wrong });
        const sub = res.subparts.find((x) => x.id === s.id);
        expect(sub?.earned).toBe(0);
        expect(sub?.isCorrect).toBe(false);
      }
  });
});

/* ------------------------------------------------------------------ */
/* 2. Normalization                                                    */
/* ------------------------------------------------------------------ */

describe("normalizeText", () => {
  it("ignores case, spacing and punctuation", () => {
    expect(normalizeText("  Was   WALKING ")).toBe("was walking");
    expect(normalizeText("The Sun.")).toBe("sun");
    expect(normalizeText("goes!")).toBe("goes");
  });

  it("unifies curly apostrophes and strips articles", () => {
    expect(normalizeText("An Engineer")).toBe("engineer");
    expect(normalizeText("He was FOUR years old.")).toBe("four years old");
    expect(normalizeText("it’s")).toBe("it");
  });

  it("matches acceptable answer sets reliably", () => {
    expect(matchesAny("  FOUR  ", ["four"])).toBe(true);
    expect(matchesAny("Four years old.", ["four years old"])).toBe(true);
    expect(matchesAny("an engineer", ["engineer", "an engineer"])).toBe(true);
    expect(matchesAny("a doctor", ["engineer"])).toBe(false);
    expect(matchesAny("", ["engineer"])).toBe(false);
    expect(matchesAny("engineer extra words", ["engineer"])).toBe(false);
  });

  it("normalizeSequence lowercases and joins", () => {
    expect(normalizeSequence(["Lina", "usually", "goes"])).toBe(
      "lina usually goes",
    );
  });
});

/* ------------------------------------------------------------------ */
/* 3. Per-type grading behaviour                                       */
/* ------------------------------------------------------------------ */

function q(id: string): Question {
  const found = QUESTIONS.find((x) => x.id === id);
  if (!found) throw new Error("missing question " + id);
  return found;
}

describe("grading by subpart type", () => {
  it("grades MCQ correctly (Q1 reading)", () => {
    const question = q("q1");
    const correct = mapAll([question], correctValue);
    const wrong = mapAll([question], wrongValue);
    expect(gradeQuestion(question, correct).earned).toBe(5);
    expect(gradeQuestion(question, wrong).earned).toBe(0);
  });

  it("grades matching/select rows correctly (Q2)", () => {
    const question = q("q2");
    expect(gradeQuestion(question, mapAll([question], correctValue)).earned).toBe(5);
    expect(gradeQuestion(question, mapAll([question], wrongValue)).earned).toBe(0);
  });

  it("grades fill-in-the-blank selects (Q3)", () => {
    const question = q("q3");
    expect(gradeQuestion(question, mapAll([question], correctValue)).earned).toBe(5);
    expect(gradeQuestion(question, mapAll([question], wrongValue)).earned).toBe(0);
  });

  it("partial marks: one wrong MCQ in Q4 gives 4/5", () => {
    const question = q("q4");
    const answers = mapAll([question], correctValue);
    answers["q4-s3"] = { kind: "mcq", index: 1 - 0 }; // wrong (correct is 0)
    const res = gradeQuestion(question, answers);
    expect(res.earned).toBe(4);
  });

  it("grades reorder with normalization, rejects wrong order (Q6)", () => {
    const question = q("q6");
    const ok: AnswerMap = {
      "q6-s1": {
        kind: "reorder",
        value: ["students", "are", "going", "to", "use", "tablets", "next", "year"],
      },
      "q6-s2": {
        kind: "reorder",
        value: ["lina", "usually", "goes", "to", "school", "by", "bus"],
      },
    };
    expect(gradeQuestion(question, ok).earned).toBe(5);

    const bad: AnswerMap = {
      "q6-s1": {
        kind: "reorder",
        value: ["are", "students", "going", "to", "use", "tablets", "next", "year"],
      },
      "q6-s2": {
        kind: "reorder",
        value: ["lina", "usually", "goes", "to", "school", "by", "bus"],
      },
    };
    expect(gradeQuestion(question, bad).earned).toBe(2.5);
  });

  it("grades sentence correction text with case/space tolerance (Q7)", () => {
    const question = q("q7");
    const ok: AnswerMap = {
      "q7-s1": { kind: "text", value: "  GOES " },
      "q7-s2": { kind: "text", value: "Are." },
      "q7-s3": { kind: "text", value: "buy" },
      "q7-s4": { kind: "text", value: "IS" },
      "q7-s5": { kind: "text", value: "rises" },
    };
    expect(gradeQuestion(question, ok).earned).toBe(5);
    const bad: AnswerMap = {
      "q7-s1": { kind: "text", value: "go" },
      "q7-s2": { kind: "text", value: "is" },
      "q7-s3": { kind: "text", value: "buys" },
      "q7-s4": { kind: "text", value: "are" },
      "q7-s5": { kind: "text", value: "rise" },
    };
    expect(gradeQuestion(question, bad).earned).toBe(0);
  });

  it("grades -ing word formation exactly (Q8)", () => {
    const question = q("q8");
    expect(gradeQuestion(question, mapAll([question], correctValue)).earned).toBe(5);
    const bad: AnswerMap = {
      "q8-s1": { kind: "text", value: "plaing" },
      "q8-s2": { kind: "text", value: "hideing" },
      "q8-s3": { kind: "text", value: "dieing" },
      "q8-s4": { kind: "text", value: "writeing" },
      "q8-s5": { kind: "text", value: "lieing" },
    };
    expect(gradeQuestion(question, bad).earned).toBe(0);
  });

  it("grades short answers against acceptable set (Q9)", () => {
    const question = q("q9");
    const variants: AnswerMap = {
      "q9-s1": { kind: "text", value: "He was FOUR years old." },
      "q9-s2": { kind: "text", value: "An engineer" },
    };
    expect(gradeQuestion(question, variants).earned).toBe(5);
    const wrong: AnswerMap = {
      "q9-s1": { kind: "text", value: "six" },
      "q9-s2": { kind: "text", value: "a pilot" },
    };
    expect(gradeQuestion(question, wrong).earned).toBe(0);
  });

  it("grades True/False (Q10, Q12 statements)", () => {
    expect(gradeQuestion(q("q10"), mapAll([q("q10")], correctValue)).earned).toBe(5);
    expect(gradeQuestion(q("q10"), mapAll([q("q10")], wrongValue)).earned).toBe(0);
    expect(gradeQuestion(q("q12"), mapAll([q("q12")], correctValue)).earned).toBe(5);
  });

  it("grades vocabulary in context selects (Q14)", () => {
    const question = q("q14");
    expect(gradeQuestion(question, mapAll([question], correctValue)).earned).toBe(5);
    expect(gradeQuestion(question, mapAll([question], wrongValue)).earned).toBe(0);
  });

  it("grades past tense choice MCQ (Q15)", () => {
    expect(gradeQuestion(q("q15"), mapAll([q("q15")], correctValue)).earned).toBe(5);
    expect(gradeQuestion(q("q15"), mapAll([q("q15")], wrongValue)).earned).toBe(0);
  });

  it("grades written past tenses, tolerating case/space (Q16)", () => {
    const question = q("q16");
    const ok: AnswerMap = {
      "q16-s1": { kind: "text", value: "was  WALKING" },
      "q16-s2": { kind: "text", value: "Went." },
      "q16-s3": { kind: "text", value: "broke" },
      "q16-s4": { kind: "text", value: "Arrived" },
      "q16-s5": { kind: "text", value: "was sleeping" },
    };
    expect(gradeQuestion(question, ok).earned).toBe(5);
    const bad: AnswerMap = {
      "q16-s1": { kind: "text", value: "walked" },
      "q16-s2": { kind: "text", value: "was going" },
      "q16-s3": { kind: "text", value: "was breaking" },
      "q16-s4": { kind: "text", value: "were arriving" },
      "q16-s5": { kind: "text", value: "slept" },
    };
    expect(gradeQuestion(question, bad).earned).toBe(0);
  });

  it("grades verb→noun forms exactly, doubling included (Q17)", () => {
    const question = q("q17");
    expect(gradeQuestion(question, mapAll([question], correctValue)).earned).toBe(5);
    const bad: AnswerMap = {
      "q17-s1": { kind: "text", value: "kick" },
      "q17-s2": { kind: "text", value: "knoking" },
      "q17-s3": { kind: "text", value: "hiting" }, // missing double t
      "q17-s4": { kind: "text", value: "belongingness" },
      "q17-s5": { kind: "text", value: "push" },
    };
    expect(gradeQuestion(question, bad).earned).toBe(0);
  });

  it("grades silent-letter MCQs (Q18)", () => {
    expect(gradeQuestion(q("q18"), mapAll([q("q18")], correctValue)).earned).toBe(5);
    expect(gradeQuestion(q("q18"), mapAll([q("q18")], wrongValue)).earned).toBe(0);
  });

  it("grades short answers with variants (Q19)", () => {
    const question = q("q19");
    const ok: AnswerMap = {
      "q19-s1": { kind: "text", value: "Tell a teacher or a parent." },
      "q19-s2": {
        kind: "text",
        value: "Treat others the way you want them to treat you",
      },
    };
    expect(gradeQuestion(question, ok).earned).toBe(5);
    const alsoOk: AnswerMap = {
      "q19-s1": { kind: "text", value: "tell my teacher" },
      "q19-s2": {
        kind: "text",
        value: "treat others as you want them to treat you.",
      },
    };
    expect(gradeQuestion(question, alsoOk).earned).toBe(5);
    const wrong: AnswerMap = {
      "q19-s1": { kind: "text", value: "keep silent forever" },
      "q19-s2": { kind: "text", value: "give the bully your lunch" },
    };
    expect(gradeQuestion(question, wrong).earned).toBe(0);
  });

  it("grades past-tense sentence correction (Q20)", () => {
    const question = q("q20");
    expect(gradeQuestion(question, mapAll([question], correctValue)).earned).toBe(5);
    const bad: AnswerMap = {
      "q20-s1": { kind: "text", value: "seen" },
      "q20-s2": { kind: "text", value: "was" },
      "q20-s3": { kind: "text", value: "buyed" },
      "q20-s4": { kind: "text", value: "went" },
      "q20-s5": { kind: "text", value: "teached" },
    };
    expect(gradeQuestion(question, bad).earned).toBe(0);
  });
});

/* ------------------------------------------------------------------ */
/* 4. Whole-exam scoring                                               */
/* ------------------------------------------------------------------ */

describe("whole exam scoring", () => {
  it("all correct answers score exactly 100 / 100%", () => {
    const res = gradeExam(QUESTIONS, mapAll(QUESTIONS, correctValue));
    expect(res.totalScore).toBe(100);
    expect(res.maxScore).toBe(100);
    expect(res.percentage).toBe(100);
    expect(res.fullyCorrect).toBe(20);
    expect(res.partiallyCorrect).toBe(0);
    expect(res.incorrect).toBe(0);
  });

  it("all wrong answers score exactly 0", () => {
    const res = gradeExam(QUESTIONS, mapAll(QUESTIONS, wrongValue));
    expect(res.totalScore).toBe(0);
    expect(res.percentage).toBe(0);
    expect(res.fullyCorrect).toBe(0);
    expect(res.incorrect).toBe(20);
  });

  it("unanswered questions score 0 and are not counted answered", () => {
    const res = gradeExam(QUESTIONS, {});
    expect(res.totalScore).toBe(0);
    expect(countAnswered(QUESTIONS, {})).toBe(0);
    for (const question of QUESTIONS)
      expect(isQuestionAnswered(question, {})).toBe(false);
  });

  it("counts answered questions and partial credit", () => {
    const answers = mapAll(QUESTIONS, correctValue);
    // Un-answer one subpart of an all-mcq question.
    answers["q4-s2"] = { kind: "mcq", index: null };
    expect(isQuestionAnswered(q("q4"), answers)).toBe(false);
    expect(countAnswered(QUESTIONS, answers)).toBe(19);
    const res = gradeExam(QUESTIONS, answers);
    expect(res.totalScore).toBe(99);
    expect(res.fullyCorrect).toBe(19);
    expect(res.partiallyCorrect).toBe(1);
  });

  it("empty strings in text answers never earn marks", () => {
    const question = q("q16");
    const answers: AnswerMap = {};
    for (const s of question.subparts) answers[s.id] = { kind: "text", value: "   " };
    expect(gradeQuestion(question, answers).earned).toBe(0);
    expect(isQuestionAnswered(question, answers)).toBe(false);
  });

  it("incomplete reorder is unanswered and scores 0", () => {
    const question = q("q6");
    const answers: AnswerMap = {
      "q6-s1": { kind: "reorder", value: ["students", "are"] },
      "q6-s2": {
        kind: "reorder",
        value: ["lina", "usually", "goes", "to", "school", "by", "bus"],
      },
    };
    expect(isQuestionAnswered(question, answers)).toBe(false);
    expect(gradeQuestion(question, answers).earned).toBe(2.5);
  });
});
