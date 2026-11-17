/**
 * Marking logic of the published paper — every question type, every branch.
 *
 * The numbers asserted here were extracted from the source folder before any
 * technical change: 50 questions, 99 sub-parts, 100 marks, 10 questions /
 * 20 marks per lesson, and the part types mcq / text / tf / order / rubric.
 */
import { describe, expect, it } from "vitest";

import {
  ALL_PARTS,
  LESSONS,
  LESSON_ORDER,
  QUESTIONS,
  TOTAL_MARKS,
  TOTAL_QUESTIONS,
  type Part,
  type Question,
} from "@/data/exam";
import {
  allAnswered,
  answeredCount,
  gradeExam,
  gradePart,
  isAnswered,
  normalize,
  normalizeTokens,
  seededShuffle,
} from "@/lib/grading";

/** A response that satisfies every rubric part of the paper. */
function rubricResponse(part: Part): string {
  if (part.type !== "rubric") return "";
  return part.starter
    ? `${part.starter}keep the classroom tidy and listen well`
    : "This is my own answer and I write it in full sentences today";
}

/** The complete, correct answer key. */
function fullKey(): Record<string, string> {
  const key: Record<string, string> = {};
  for (const q of QUESTIONS) {
    for (const p of q.parts) {
      key[p.id] = p.type === "rubric" ? rubricResponse(p) : p.answer;
    }
  }
  return key;
}

function partsOfType<T extends Part["type"]>(type: T): Extract<Part, { type: T }>[] {
  return ALL_PARTS.filter((p) => p.type === type) as Extract<Part, { type: T }>[];
}

describe("Paper shape extracted from the source", () => {
  it("has 50 questions, 99 sub-parts and 100 marks", () => {
    expect(TOTAL_QUESTIONS).toBe(50);
    expect(QUESTIONS).toHaveLength(50);
    expect(ALL_PARTS).toHaveLength(99);
    expect(TOTAL_MARKS).toBe(100);
  });

  it("gives every question exactly two marks", () => {
    const perQuestion = QUESTIONS.map((q) => q.parts.reduce((s, p) => s + p.marks, 0));
    expect(new Set(perQuestion)).toEqual(new Set([2]));
    expect(perQuestion.reduce((a, b) => a + b, 0)).toBe(100);
  });

  it("gives every part at least one mark", () => {
    for (const p of ALL_PARTS) expect(p.marks, p.id).toBeGreaterThan(0);
  });

  it("uses two sub-parts per question, except the single 2-mark ordering question", () => {
    const counts = QUESTIONS.map((q) => q.parts.length);
    expect(counts.filter((c) => c === 2).length).toBe(49);
    expect(counts.filter((c) => c === 1).length).toBe(1);
    const single = QUESTIONS.find((q) => q.parts.length === 1)!;
    expect(single.id).toBe("L1-9");
    expect(single.parts[0].type).toBe("order");
    expect(single.parts[0].marks).toBe(2);
  });

  it("spreads ten questions and twenty marks over each of the five lessons", () => {
    for (const id of LESSON_ORDER) {
      const qs = QUESTIONS.filter((q) => q.lesson === id);
      expect(qs, `lesson ${id}`).toHaveLength(10);
      expect(qs.reduce((s, q) => s + q.parts.reduce((t, p) => t + p.marks, 0), 0)).toBe(20);
    }
    expect(new Set(QUESTIONS.map((q) => q.lesson))).toEqual(new Set(LESSON_ORDER));
  });

  it("covers every question type of the paper", () => {
    const counts = {
      mcq: partsOfType("mcq").length,
      text: partsOfType("text").length,
      tf: partsOfType("tf").length,
      order: partsOfType("order").length,
      rubric: partsOfType("rubric").length,
    };
    expect(counts).toEqual({ mcq: 38, text: 36, tf: 18, order: 4, rubric: 3 });
    expect(Object.values(counts).reduce((a, b) => a + b, 0)).toBe(99);
  });

  it("keeps unique question ids, part ids and prompts", () => {
    const qids = QUESTIONS.map((q) => q.id);
    const pids = ALL_PARTS.map((p) => p.id);
    expect(new Set(qids).size).toBe(50);
    expect(new Set(pids).size).toBe(99);
    // The same wording may appear twice inside ONE question (two branches of the
    // same item, e.g. L2-6 "Choose the female pair."), but never in two questions.
    const byPrompt = new Map<string, string[]>();
    for (const q of QUESTIONS) {
      for (const p of q.parts) {
        const key = p.prompt.trim().toLowerCase();
        byPrompt.set(key, [...(byPrompt.get(key) ?? []), q.id]);
      }
    }
    for (const [prompt, owners] of byPrompt) {
      expect(new Set(owners).size, `prompt used in two questions: ${prompt}`).toBe(1);
    }
  });

  it("keeps the interleaved presentation order of the source", () => {
    expect(QUESTIONS.slice(0, 5).map((q) => q.lesson)).toEqual(["L1", "L2", "L3", "L4", "L5"]);
    expect(QUESTIONS[0].id).toBe("L1-1");
    expect(QUESTIONS[49].id).toBe("L5-10");
  });

  it("keeps every multiple-choice answer inside its own options", () => {
    for (const p of partsOfType("mcq")) {
      if (p.type !== "mcq") continue;
      expect(p.options, p.id).toContain(p.answer);
      expect(new Set(p.options).size, p.id).toBe(p.options.length);
    }
  });

  it("keeps every ordering answer in step with its word bank", () => {
    for (const p of partsOfType("order")) {
      if (p.type !== "order") continue;
      expect(normalizeTokens(p.answer).sort(), p.id).toEqual(normalizeTokens(p.words.join(" ")).sort());
      expect(normalizeTokens(p.answer)).toHaveLength(p.words.length);
    }
  });
});

describe("Completion checks", () => {
  it("counts sub-parts, not questions", () => {
    expect(answeredCount(QUESTIONS, {})).toEqual({ answered: 0, total: 99 });
  });

  it("cannot be submitted while anything is blank", () => {
    expect(allAnswered(QUESTIONS, {})).toBe(false);
    const almost = fullKey();
    delete almost[QUESTIONS[49].parts[0].id];
    expect(allAnswered(QUESTIONS, almost)).toBe(false);
  });

  it("requires every word of an ordering task to be placed", () => {
    const part = partsOfType("order")[0];
    if (part.type !== "order") return;
    expect(isAnswered(part, "")).toBe(false);
    expect(isAnswered(part, part.words[0])).toBe(false);
    expect(isAnswered(part, part.words.join(" "))).toBe(true);
  });
});

describe("Grading — every question type", () => {
  it("awards 100/100 for the complete correct key", () => {
    const result = gradeExam(QUESTIONS, fullKey());
    expect(result.score).toBe(100);
    expect(result.maxScore).toBe(100);
    expect(result.correctCount).toBe(99);
    expect(result.incorrectCount).toBe(0);
    expect(result.totalParts).toBe(99);
  });

  it("awards 0 for a blank paper", () => {
    const result = gradeExam(QUESTIONS, {});
    expect(result.score).toBe(0);
    expect(result.incorrectCount).toBe(99);
  });

  it("grades multiple choice", () => {
    const part = partsOfType("mcq")[0];
    if (part.type !== "mcq") return;
    expect(gradePart(part, part.answer, "q").earned).toBe(part.marks);
    expect(gradePart(part, "__not an option__", "q").earned).toBe(0);
    expect(gradePart(part, "", "q").correct).toBe(false);
  });

  it("grades true / false, including the case-insensitive answer", () => {
    for (const part of partsOfType("tf")) {
      if (part.type !== "tf") continue;
      expect(gradePart(part, part.answer, "q").earned, part.id).toBe(part.marks);
      expect(gradePart(part, part.answer.toLowerCase(), "q").correct, part.id).toBe(true);
      const wrong = part.answer === "True" ? "False" : "True";
      expect(gradePart(part, wrong, "q").earned, part.id).toBe(0);
    }
  });

  it("grades short text answers and their accepted alternatives", () => {
    let checkedAccepted = 0;
    for (const part of partsOfType("text")) {
      if (part.type !== "text") continue;
      expect(gradePart(part, part.answer, "q").earned, part.id).toBe(part.marks);
      expect(gradePart(part, `  ${part.answer.toUpperCase()}... `, "q").correct, part.id).toBe(true);
      for (const alt of part.accepted ?? []) {
        expect(gradePart(part, alt, "q").earned, `${part.id} / ${alt}`).toBe(part.marks);
        checkedAccepted += 1;
      }
      expect(gradePart(part, "a completely wrong answer", "q").earned, part.id).toBe(0);
    }
    expect(checkedAccepted).toBeGreaterThan(20);
  });

  it("grades word ordering by token order, not by string equality", () => {
    for (const part of partsOfType("order")) {
      if (part.type !== "order") continue;
      expect(gradePart(part, part.answer, "q").earned, part.id).toBe(part.marks);
      expect(gradePart(part, part.words.slice().reverse().join(" "), "q").earned, part.id).toBe(0);
    }
  });

  it("grades rubric parts only when the pupil really writes", () => {
    for (const part of partsOfType("rubric")) {
      if (part.type !== "rubric") continue;
      expect(gradePart(part, "", "q").earned, part.id).toBe(0);
      expect(gradePart(part, "   ", "q").earned, part.id).toBe(0);
      expect(gradePart(part, "yes", "q").earned, part.id).toBe(0);
      const good = rubricResponse(part);
      expect(gradePart(part, good, "q").earned, part.id).toBe(part.marks);
      expect(gradePart(part, good, "q").explanation, part.id).toBe(part.rubric);
      expect(gradePart(part, good, "q").isRubric, part.id).toBe(true);
    }
  });

  it("does not mark a wrong answer as correct", () => {
    const key = fullKey();
    key[partsOfType("text")[0].id] = "a completely wrong answer";
    const result = gradeExam(QUESTIONS, key);
    expect(result.score).toBe(99);
    expect(result.incorrectCount).toBe(1);
  });

  it("normalises case, spacing and punctuation", () => {
    expect(normalize("  It's 3000 SP. ")).toBe("it's 3000 sp");
    expect(normalize("Science  Lab")).toBe("science lab");
    expect(normalizeTokens("She has to wear a school uniform.")).toEqual([
      "she",
      "has",
      "to",
      "wear",
      "a",
      "school",
      "uniform",
    ]);
  });

  it("shuffles the word bank deterministically", () => {
    const part = partsOfType("order")[0];
    const first = seededShuffle(part.words, part.id);
    const second = seededShuffle(part.words, part.id);
    expect(first).toEqual(second);
    expect(first.slice().sort()).toEqual(part.words.slice().sort());
  });
});

describe("Marks per lesson (used by the results page and the payload)", () => {
  it("splits the 100 marks into 20 per lesson", () => {
    const result = gradeExam(QUESTIONS, fullKey());
    for (const id of LESSON_ORDER) {
      const rows = result.questions.filter((r) => r.lesson === id);
      expect(rows.reduce((s, r) => s + r.earned, 0), id).toBe(20);
      expect(rows.reduce((s, r) => s + r.marks, 0), id).toBe(20);
    }
    expect(LESSONS.L1.title).toBe("At School");
    expect(LESSONS.L5.title).toBe("Clothes");
  });

  it("keeps every question displayable: it has a reference and at least one part", () => {
    for (const q of QUESTIONS as Question[]) {
      expect(q.ref.length, q.id).toBeGreaterThan(8);
      expect(q.parts.length, q.id).toBeGreaterThan(0);
      for (const p of q.parts) {
        expect(p.prompt.length, p.id).toBeGreaterThan(0);
        expect(p.label.length, p.id).toBeGreaterThan(0);
      }
    }
  });
});
