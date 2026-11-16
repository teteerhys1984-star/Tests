import { describe, expect, it } from "vitest";
import { QUESTIONS, TOTAL_MARKS, VOCABULARY_COUNT } from "./questions";
import { questionMarksValid } from "../logic/grading";

const ARABIC = /[؀-ۿ]/;

describe("exam content integrity", () => {
  it("contains exactly 35 main questions", () => {
    expect(QUESTIONS).toHaveLength(35);
    expect(new Set(QUESTIONS.map((q) => q.id)).size).toBe(35);
    for (let i = 0; i < 35; i++) expect(QUESTIONS[i].n).toBe(i + 1);
  });

  it("has exactly 13 vocabulary questions, all in positions 1–13", () => {
    expect(VOCABULARY_COUNT).toBe(13);
    QUESTIONS.slice(0, 13).forEach((q) => {
      expect(q.isVocabulary).toBe(true);
      expect(q.skill).toBe("Vocabulary");
    });
    QUESTIONS.slice(13).forEach((q) => expect(q.isVocabulary).toBe(false));
  });

  it("has exactly 22 non-vocabulary questions covering all five lessons", () => {
    const nonVocab = QUESTIONS.filter((q) => !q.isVocabulary);
    expect(nonVocab).toHaveLength(22);
    for (const l of [1, 2, 3, 4, 5]) {
      expect(nonVocab.some((q) => q.lesson === l)).toBe(true);
    }
  });

  it("vocabulary draws from all five lessons", () => {
    const counts = [1, 2, 3, 4, 5].map(
      (l) => QUESTIONS.filter((q) => q.isVocabulary && q.lesson === l).length
    );
    expect(counts).toEqual([2, 3, 3, 3, 2]);
  });

  it("total marks equal exactly 100 and every sub-part sum matches its question", () => {
    expect(TOTAL_MARKS).toBe(100);
    QUESTIONS.forEach((q) => expect(questionMarksValid(q)).toBe(true));
  });

  it("every question carries an internal curriculum reference and explanations", () => {
    QUESTIONS.forEach((q) => {
      expect(q.ref.activity.length).toBeGreaterThan(3);
      expect(q.ref.book.length).toBeGreaterThan(2);
      expect(q.ref.pages.length).toBeGreaterThan(0);
      q.parts.forEach((p) => {
        expect(p.explanation.length).toBeGreaterThan(10);
        expect(p.marks).toBeGreaterThan(0);
      });
    });
  });

  it("uses varied formats (not all multiple choice)", () => {
    const kinds = new Set(QUESTIONS.flatMap((q) => q.parts.map((p) => p.kind)));
    ["mcq", "fill", "match", "tf", "order", "rubric"].forEach((k) =>
      expect(kinds.has(k as never)).toBe(true)
    );
  });

  it("has several multi-part questions with independently scored branches", () => {
    const multi = QUESTIONS.filter((q) => q.parts.length >= 2);
    expect(multi.length).toBeGreaterThanOrEqual(15);
    multi.forEach((q) => {
      const ids = q.parts.map((p) => p.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  it("order questions provide exactly the needed word chips", () => {
    QUESTIONS.forEach((q) => {
      q.parts.forEach((p) => {
        if (p.kind === "order") {
          const chips = [...(q.chips ?? [])].sort().join("|");
          const answer = [...p.answer].sort().join("|");
          expect(chips).toBe(answer);
        }
      });
    });
  });

  it("match questions define a complete shared option pool", () => {
    QUESTIONS.forEach((q) => {
      const matchParts = q.parts.filter((p) => p.kind === "match");
      if (matchParts.length) {
        expect(q.matchOptions && q.matchOptions.length).toBeGreaterThanOrEqual(matchParts.length);
        const poolIds = new Set(q.matchOptions!.map((o) => o.id));
        matchParts.forEach((p) => {
          if (p.kind === "match") expect(poolIds.has(p.answer)).toBe(true);
        });
      }
    });
  });

  it("vocabulary questions are Arabic→English translation items (teacher directive)", () => {
    // All 13 vocabulary questions (Q1–Q13): every part shows an Arabic word/phrase
    // from the curriculum word lists and expects the student to TYPE the English meaning.
    const vocabQs = QUESTIONS.filter((q) => q.isVocabulary);
    expect(vocabQs).toHaveLength(13);
    vocabQs.forEach((q) => {
      q.parts.forEach((p) => {
        expect(p.kind).toBe("fill");
        expect(typeof p.arabic === "string" && (p.arabic ?? "").length > 0).toBe(true);
        expect(ARABIC.test(p.arabic ?? "")).toBe(true);
        if (p.kind === "fill") expect(p.accept.length).toBeGreaterThan(0);
      });
    });
  });

  it("keeps Arabic strictly inside the vocabulary prompts — everything else is English", () => {
    QUESTIONS.forEach((q) => {
      expect(ARABIC.test(q.title)).toBe(false);
      expect(ARABIC.test(q.instruction)).toBe(false);
      if (q.passage) expect(ARABIC.test(q.passage)).toBe(false);
      (q.wordBank ?? []).forEach((w) => expect(ARABIC.test(w)).toBe(false));
      (q.chips ?? []).forEach((w) => expect(ARABIC.test(w)).toBe(false));
      q.parts.forEach((p) => {
        expect(ARABIC.test(p.prompt)).toBe(false);
        if (p.kind === "mcq") p.options.forEach((o) => expect(ARABIC.test(o.text)).toBe(false));
        if (!q.isVocabulary) expect(p.arabic).toBeUndefined();
      });
    });
  });
});
