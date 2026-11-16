import { describe, expect, it } from "vitest";
import {
  answeredCount,
  examStructureOk,
  gradeExam,
  gradePart,
  isQuestionComplete,
  normalizeText,
} from "@/exam/grading";
import { QUESTIONS, TOTAL_MARKS, TOTAL_QUESTIONS } from "@/exam/questions";
import type { AnswerMap, Part, Question } from "@/exam/types";

/** Build an all-correct AnswerMap straight from the answer keys. */
function correctAnswers(questions: Question[] = QUESTIONS): AnswerMap {
  const map: AnswerMap = {};
  for (const q of questions) {
    map[q.n] = {};
    for (const p of q.parts) {
      switch (p.type) {
        case "mcq":
        case "select":
          map[q.n][p.id] = p.correctId;
          break;
        case "tf":
          map[q.n][p.id] = p.answer ? "T" : "F";
          break;
        case "order":
          map[q.n][p.id] = String(p.correctPos);
          break;
        case "text":
          map[q.n][p.id] = p.accepted[0];
          break;
      }
    }
  }
  return map;
}

function q(n: number): Question {
  const found = QUESTIONS.find((x) => x.n === n);
  if (!found) throw new Error(`Question ${n} missing`);
  return found;
}

function textPart(n: number, id: string): Extract<Part, { type: "text" }> {
  const part = q(n).parts.find((p) => p.id === id);
  if (!part || part.type !== "text") throw new Error(`text part ${n}/${id} missing`);
  return part;
}

/* ───────────────────────────── exam structure ───────────────────────────── */

describe("exam structure", () => {
  it("has exactly 20 numbered questions in order 1–20", () => {
    expect(QUESTIONS).toHaveLength(TOTAL_QUESTIONS);
    QUESTIONS.forEach((qq, i) => expect(qq.n).toBe(i + 1));
  });

  it("each question is worth exactly 5 marks and parts sum to 5", () => {
    for (const qq of QUESTIONS) {
      expect(qq.marks).toBe(5);
      expect(qq.parts.reduce((s, p) => s + p.marks, 0)).toBe(5);
    }
  });

  it("questions 1–10 belong to Lesson 3 and 11–20 to Lesson 4", () => {
    expect(examStructureOk()).toBe(true);
    expect(q(1).lesson).toBe(3);
    expect(q(10).lesson).toBe(3);
    expect(q(11).lesson).toBe(4);
    expect(q(20).lesson).toBe(4);
  });

  it("total marks equal 100", () => {
    expect(QUESTIONS.reduce((s, qq) => s + qq.marks, 0)).toBe(TOTAL_MARKS);
  });
});

/* ───────────────────────────── normalization ────────────────────────────── */

describe("normalizeText — harmless differences never fail valid answers", () => {
  it("ignores case and surrounding punctuation/spacing", () => {
    expect(normalizeText("  Has Visited. ")).toBe("has visited");
    expect(normalizeText("HAD LEFT!")).toBe("had left");
    expect(normalizeText("Have you ever ridden a cable car?")).toBe(
      "have you ever ridden a cable car"
    );
  });

  it("unifies curly apostrophes and collapses extra spaces", () => {
    expect(normalizeText("she’d  bought")).toBe("she'd bought");
    expect(normalizeText("Dana said , that she had bought")).toBe(
      "dana said that she had bought"
    );
  });

  it("keeps meaningful content intact", () => {
    expect(normalizeText("has went")).toBe("has went"); // still wrong grammar → will fail grading
  });
});

/* ───────────────────────────── present perfect (Q2/Q3/Q4/Q10) ───────────── */

describe("present perfect grading", () => {
  it("accepts correct have/has + participle forms", () => {
    expect(gradePart(textPart(2, "p1"), "has visited").earned).toBe(1);
    expect(gradePart(textPart(2, "p1"), "'s visited").earned).toBe(1);
    expect(gradePart(textPart(2, "p2"), "have bought").earned).toBe(1);
    expect(gradePart(textPart(2, "p3"), "haven't tried").earned).toBe(1);
    expect(gradePart(textPart(2, "p3"), "Have not tried").earned).toBe(1);
    expect(gradePart(textPart(2, "p4"), "has eaten").earned).toBe(1);
    expect(gradePart(textPart(2, "p5"), "have been").earned).toBe(1);
  });

  it("rejects wrong participles, wrong agreement and past simple", () => {
    expect(gradePart(textPart(2, "p1"), "have visited").earned).toBe(0); // agreement
    expect(gradePart(textPart(2, "p1"), "has visit").earned).toBe(0); // base form
    expect(gradePart(textPart(2, "p2"), "has buyed").earned).toBe(0); // wrong participle
    expect(gradePart(textPart(2, "p3"), "didn't try").earned).toBe(0); // past simple
    expect(gradePart(textPart(2, "p4"), "has ate").earned).toBe(0); // wrong participle
    expect(gradePart(textPart(2, "p5"), "has been").earned).toBe(0); // agreement
    expect(gradePart(textPart(2, "p1"), "").earned).toBe(0); // empty
  });

  it("grades the MCQ question-form item (Q3) correctly", () => {
    const p = q(3).parts[0];
    expect(gradePart(p, "B").earned).toBe(5); // Have / travelled
    expect(gradePart(p, "A").earned).toBe(0);
    expect(gradePart(p, "C").earned).toBe(0);
  });

  it("grades the correct-usage item (Q4) correctly", () => {
    const p = q(4).parts[0];
    expect(gradePart(p, "B").earned).toBe(5);
    expect(gradePart(p, "D").earned).toBe(0);
  });

  it("accepts the written question with punctuation variations (Q10)", () => {
    const p = textPart(10, "p1");
    expect(gradePart(p, "Have you ever ridden a cable car?").earned).toBe(5);
    expect(gradePart(p, "have you ever ridden a cable car").earned).toBe(5);
    expect(gradePart(p, "  HAVE YOU EVER RIDDEN A CABLE CAR?! ").earned).toBe(5);
  });

  it("rejects malformed written questions (Q10)", () => {
    const p = textPart(10, "p1");
    expect(gradePart(p, "Did you ever ride a cable car").earned).toBe(0);
    expect(gradePart(p, "Have you ever rode a cable car").earned).toBe(0);
    expect(gradePart(p, "Has you ever ridden a cable car").earned).toBe(0);
  });
});

/* ───────────────────────────── reported speech (Q5/Q9/Q15) ──────────────── */

describe("reported speech grading", () => {
  it("accepts documented alternatives (Q5): optional that + contractions", () => {
    const p = textPart(5, "p1");
    expect(gradePart(p, "Dana said that she had bought some souvenirs for her friends.").earned).toBe(5);
    expect(gradePart(p, "Dana said she had bought some souvenirs for her friends").earned).toBe(5);
    expect(gradePart(p, "Dana said that she'd bought some souvenirs for her friends").earned).toBe(5);
    expect(gradePart(p, "dana said she'd bought some souvenirs for her friends").earned).toBe(5);
  });

  it("rejects unfaithful or un-shifted transformations (Q5)", () => {
    const p = textPart(5, "p1");
    expect(gradePart(p, "Dana said that she has bought some souvenirs for her friends").earned).toBe(0); // no backshift
    expect(gradePart(p, "Dana said that I had bought some souvenirs for my friends").earned).toBe(0); // pronouns
    expect(gradePart(p, "Dana said that she bought some souvenirs for her friends").earned).toBe(0); // past simple
    expect(gradePart(p, "She had bought souvenirs").earned).toBe(0); // incomplete
  });

  it("grades MCQ backshift items (Q9)", () => {
    const parts = q(9).parts;
    // keys: liked, were enjoying, had never flown, would call, couldn't check
    ["B", "B", "B", "B", "B"].forEach((key, i) =>
      expect(gradePart(parts[i], key).earned).toBe(1)
    );
    expect(gradePart(parts[0], "A").earned).toBe(0); // "likes" — no shift
    expect(gradePart(parts[3], "A").earned).toBe(0); // "will call"
  });

  it("grades past simple → past perfect items (Q15)", () => {
    for (const p of q(15).parts) {
      expect(gradePart(p, "B").earned).toBe(1);
      expect(gradePart(p, "A").earned).toBe(0);
    }
  });
});

/* ───────────────────────────── past perfect (Q13/Q14/Q20) ───────────────── */

describe("past perfect grading", () => {
  it("accepts had + participle and 'd contractions (Q13)", () => {
    expect(gradePart(textPart(13, "p1"), "had left").earned).toBe(1);
    expect(gradePart(textPart(13, "p1"), "'d left").earned).toBe(1);
    expect(gradePart(textPart(13, "p2"), "hadn't slept").earned).toBe(1);
    expect(gradePart(textPart(13, "p2"), "Had not slept.").earned).toBe(1);
    expect(gradePart(textPart(13, "p3"), "had read").earned).toBe(1);
    expect(gradePart(textPart(13, "p5"), "had started").earned).toBe(1);
  });

  it("rejects past simple and wrong participles (Q13)", () => {
    expect(gradePart(textPart(13, "p1"), "left").earned).toBe(0);
    expect(gradePart(textPart(13, "p2"), "didn't sleep").earned).toBe(0);
    expect(gradePart(textPart(13, "p3"), "had readed").earned).toBe(0);
    expect(gradePart(textPart(13, "p4"), "has stopped").earned).toBe(0);
    expect(gradePart(textPart(13, "p5"), "had begin").earned).toBe(0);
  });

  it("grades the order-of-events MCQ (Q14)", () => {
    const p = q(14).parts[0];
    expect(gradePart(p, "A").earned).toBe(5);
    expect(gradePart(p, "B").earned).toBe(0); // reversed tenses
    expect(gradePart(p, "C").earned).toBe(0); // present perfect with past clause
  });

  it("grades error correction (Q20) — all keys A, distractors rejected", () => {
    for (const p of q(20).parts) {
      expect(gradePart(p, "A").earned).toBe(1);
      expect(gradePart(p, "C").earned).toBe(0);
    }
  });
});

/* ─────────────────────── vocabulary / pronunciation / tf / order ────────── */

describe("vocabulary and other objective types", () => {
  it("grades journey-word matching (Q1)", () => {
    const keys = ["A", "B", "C", "D", "E"];
    q(1).parts.forEach((p, i) => {
      expect(gradePart(p, keys[i]).earned).toBe(1);
      expect(gradePart(p, "F").earned).toBe(0); // distractor meaning
    });
  });

  it("grades cloze vocabulary (Q7, Q12) and destination matching (Q11)", () => {
    const q7Keys = ["A", "B", "C", "D", "E"];
    q(7).parts.forEach((p, i) => expect(gradePart(p, q7Keys[i]).earned).toBe(1));
    const q11Keys = ["A", "B", "C", "D", "E"];
    q(11).parts.forEach((p, i) => {
      expect(gradePart(p, q11Keys[i]).earned).toBe(1);
      expect(gradePart(p, "F").earned).toBe(0);
    });
    const q12Keys = ["A", "B", "C", "D", "E"];
    q(12).parts.forEach((p, i) => expect(gradePart(p, q12Keys[i]).earned).toBe(1));
  });

  it("grades pronunciation /s/ vs /k/ (Q18)", () => {
    const keys = ["S", "K", "S", "K", "S"]; // city, cook, face, clock, juice
    q(18).parts.forEach((p, i) => {
      expect(gradePart(p, keys[i]).earned).toBe(1);
      expect(gradePart(p, keys[i] === "S" ? "K" : "S").earned).toBe(0);
    });
  });

  it("grades linking words (Q19)", () => {
    const keys = ["A", "B", "C", "D", "E"];
    q(19).parts.forEach((p, i) => expect(gradePart(p, keys[i]).earned).toBe(1));
    expect(gradePart(q(19).parts[2], "B").earned).toBe(0); // "In addition" is not result
  });

  it("grades true/false reading (Q6, Q17)", () => {
    const q6Keys = ["T", "F", "F", "T", "F"];
    q(6).parts.forEach((p, i) => {
      expect(gradePart(p, q6Keys[i]).earned).toBe(1);
      expect(gradePart(p, q6Keys[i] === "T" ? "F" : "T").earned).toBe(0);
    });
    const q17Keys = ["T", "F", "T", "T", "F"];
    q(17).parts.forEach((p, i) => expect(gradePart(p, q17Keys[i]).earned).toBe(1));
  });

  it("grades reading comprehension MCQs (Q16)", () => {
    const keys = ["B", "A", "B", "C", "B"];
    q(16).parts.forEach((p, i) => expect(gradePart(p, keys[i]).earned).toBe(1));
  });

  it("grades sentence ordering (Q8) with per-position accuracy", () => {
    const correctPos = [4, 5, 1, 2, 3];
    q(8).parts.forEach((p, i) => {
      expect(gradePart(p, String(correctPos[i])).earned).toBe(1);
      expect(gradePart(p, String(((correctPos[i] ?? 1) % 5) + 1)).earned).toBe(0);
      expect(gradePart(p, "").earned).toBe(0);
    });
  });
});

/* ───────────────────────────── whole-exam scoring ───────────────────────── */

describe("exam scoring and submit gate", () => {
  it("awards 100/100 for a perfect attempt", () => {
    const res = gradeExam(correctAnswers());
    expect(res.score).toBe(100);
    expect(res.total).toBe(100);
    expect(res.percentage).toBe(100);
    expect(res.fullyCorrect).toBe(20);
    expect(res.incorrect).toBe(0);
  });

  it("awards 0 for an empty attempt and counts all questions incorrect", () => {
    const res = gradeExam({});
    expect(res.score).toBe(0);
    expect(res.incorrect).toBe(20);
    expect(res.percentage).toBe(0);
  });

  it("counts partial questions correctly", () => {
    const answers = correctAnswers();
    // break one part of a multi-part question (Q2 p1 → 0)
    answers[2]["p1"] = "has buyed";
    const res = gradeExam(answers);
    expect(res.score).toBe(99);
    expect(res.partiallyCorrect).toBe(1);
    expect(res.fullyCorrect).toBe(19);
  });

  it("submit gate: a question is complete only when every part is answered", () => {
    expect(isQuestionComplete(q(2), {})).toBe(false);
    const partial: AnswerMap = { 2: { p1: "has visited" } };
    expect(isQuestionComplete(q(2), partial)).toBe(false);
    expect(answeredCount({})).toBe(0);
    expect(answeredCount(correctAnswers())).toBe(20);
  });

  it("incorrect answers never receive marks", () => {
    const answers = correctAnswers();
    for (const qq of QUESTIONS) {
      for (const p of qq.parts) {
        if (p.type === "mcq" || p.type === "select") answers[qq.n][p.id] = "ZZ";
        else answers[qq.n][p.id] = "gobbledygook";
      }
    }
    expect(gradeExam(answers).score).toBe(0);
  });
});
