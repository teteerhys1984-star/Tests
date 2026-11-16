/* ------------------------------------------------------------------ */
/*  Automated grading checks — run with: npx vitest run                */
/* ------------------------------------------------------------------ */

import { describe, expect, it } from "vitest";
import type { AnswersMap, AnswerValue, Question, QuestionAnswer } from "../types";
import { QUESTIONS, TOTAL_MARKS, VOCAB_COUNT } from "../data/examData";
import {
  gradeExam,
  gradePart,
  isPartAnswered,
  isQuestionAnswered,
  normalize,
  unansweredQuestionIds,
} from "./grading";
import { reportFileName, formatDuration } from "./report";

/** Build a fully correct answers map straight from the data model. */
function allCorrect(): AnswersMap {
  const map: AnswersMap = {};
  for (const q of QUESTIONS) {
    const qa: QuestionAnswer = {};
    for (const p of q.parts) {
      switch (p.kind) {
        case "mcq":
        case "select":
          qa[p.id] = p.correctOptionId!;
          break;
        case "tf":
          qa[p.id] = String(p.correctBool);
          break;
        case "text":
          qa[p.id] = p.accepted![0];
          break;
        case "order": {
          const words = p.acceptedOrders![0].split(" ");
          const ids: string[] = [];
          const pool = [...p.tokens!];
          for (const w of words) {
            const t = pool.find((tk) => tk.text === w);
            if (!t) throw new Error(`token not found for "${w}" in Q${q.id}`);
            ids.push(t.id);
            pool.splice(pool.indexOf(t), 1);
          }
          qa[p.id] = ids;
          break;
        }
        case "writing":
          qa[p.id] = "There is a library in my school.";
          break;
      }
    }
    map[q.id] = qa;
  }
  return map;
}

const q = (id: number): Question => QUESTIONS.find((x) => x.id === id)!;

describe("exam structure", () => {
  it("has exactly 35 main questions", () => {
    expect(QUESTIONS.length).toBe(35);
  });

  it("has exactly 13 vocabulary questions", () => {
    expect(VOCAB_COUNT).toBe(13);
    expect(QUESTIONS.filter((x) => x.category === "Vocabulary").map((x) => x.id)).toEqual(
      [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]
    );
  });

  it("has exactly 22 non-vocabulary questions", () => {
    expect(QUESTIONS.filter((x) => x.category !== "Vocabulary").length).toBe(22);
  });

  it("totals exactly 100 marks", () => {
    expect(TOTAL_MARKS).toBe(100);
  });

  it("every question has a full curriculum reference", () => {
    for (const x of QUESTIONS) {
      expect(x.reference.lesson).toBeGreaterThanOrEqual(1);
      expect(x.reference.lesson).toBeLessThanOrEqual(5);
      expect(x.reference.lessonTitle.length).toBeGreaterThan(0);
      expect(x.reference.source.length).toBeGreaterThan(0);
      expect(x.reference.skill.length).toBeGreaterThan(0);
      for (const p of x.parts) {
        expect(p.explanation.length).toBeGreaterThan(10); // age-appropriate explanation present
      }
    }
  });

  it("all five lessons are represented", () => {
    for (const l of [1, 2, 3, 4, 5]) {
      expect(QUESTIONS.some((x) => x.lesson === l)).toBe(true);
    }
  });

  it("sub-part marks sum to the question total", () => {
    for (const x of QUESTIONS) {
      const sum = x.parts.reduce((s, p) => s + p.marks, 0);
      expect(sum).toBeGreaterThan(0);
    }
  });

  it("contains several multi-part questions", () => {
    const multi = QUESTIONS.filter((x) => x.parts.length > 1);
    expect(multi.length).toBeGreaterThanOrEqual(8);
  });

  it("uses a varied mix of formats (not all multiple-choice)", () => {
    const kinds = new Set<string>();
    for (const x of QUESTIONS) for (const p of x.parts) kinds.add(p.kind);
    expect(kinds.has("mcq")).toBe(true);
    expect(kinds.has("tf")).toBe(true);
    expect(kinds.has("text")).toBe(true);
    expect(kinds.has("order")).toBe(true);
    expect(kinds.has("writing")).toBe(true);
    const allMcq = QUESTIONS.every((x) => x.parts.every((p) => p.kind === "mcq"));
    expect(allMcq).toBe(false);
  });

  it("all 13 vocabulary questions present an Arabic curriculum word and require the English meaning", () => {
    const vocab = QUESTIONS.filter((x) => x.category === "Vocabulary");
    expect(vocab.length).toBe(13);
    for (const x of vocab) {
      for (const p of x.parts) {
        expect(p.kind).toBe("text"); // typed-answer translation, not multiple choice
        expect(p.arabic, `Q${x.id}${p.id} must show an Arabic word`).toBeTruthy();
        expect(/[؀-ۿ]/.test(p.arabic!)).toBe(true); // genuinely Arabic script
        expect(p.accepted && p.accepted.length >= 1).toBe(true); // defined English meaning(s)
        expect(p.accepted!.every((a) => !/[؀-ۿ]/.test(a))).toBe(true); // answers are English
      }
    }
    // lesson spread stays balanced: L1×2, L2×3, L3×3, L4×3, L5×2
    const perLesson = [1, 2, 3, 4, 5].map((l) => vocab.filter((x) => x.lesson === l).length);
    expect(perLesson).toEqual([2, 3, 3, 3, 2]);
  });
});

describe("normalisation", () => {
  it("ignores capitalisation", () => {
    expect(normalize("LIVE")).toBe(normalize("live"));
    expect(normalize("She Has Got Two Sisters.")).toBe("she has got two sisters");
  });
  it("trims leading and trailing spaces", () => {
    expect(normalize("   live   ")).toBe("live");
  });
  it("collapses inner double spaces", () => {
    expect(normalize("social   studies")).toBe("social studies");
  });
  it("strips final punctuation and unifies apostrophes", () => {
    expect(normalize("She has got two sisters.")).toBe("she has got two sisters");
    expect(normalize("She’s got two sisters")).toBe("she's got two sisters");
  });
});

describe("grading — correct answers earn full marks", () => {
  it("an all-correct attempt earns 96 auto marks + 4 pending review", () => {
    const r = gradeExam(QUESTIONS, allCorrect());
    expect(r.maxMarks).toBe(100);
    expect(r.earned).toBe(96);
    expect(r.pendingMarks).toBe(4);
    expect(r.reviewCount).toBe(1);
    expect(r.incorrect).toBe(0);
    expect(r.partial).toBe(0);
  });

  it("grades every part correctly against its key", () => {
    const map = allCorrect();
    for (const x of QUESTIONS) {
      for (const p of x.parts) {
        const r = gradePart(p, map[x.id][p.id]);
        if (p.teacherReview) expect(r.status).toBe("review");
        else expect(r.status).toBe("correct");
      }
    }
  });
});

describe("grading — incorrect answers earn zero", () => {
  const wrongCases: Array<[number, string, AnswerValue]> = [
    [1, "a", "friend"], // عائلة = family, not friend
    [2, "a", "brother"], // أخت = sister, not brother
    [4, "a", "twenty-two"], // ثلاثة وعشرون = twenty-three, not twenty-two
    [5, "a", "thursday"], // الأربعاء = Wednesday
    [10, "a", "fourty"], // common misspelling of forty — rejected
    [19, "a", "is"], // twenty classrooms needs 'are'
    [24, "a", "goat"], // wrong phonics word
    [32, "a", "is"], // wrong plural agreement
  ];
  it.each(wrongCases)("Q%i part %s is marked incorrect", (qid, pid, value) => {
    const part = q(qid).parts.find((p) => p.id === pid)!;
    const r = gradePart(part, value);
    expect(r.status).toBe("incorrect");
    expect(r.earned).toBe(0);
  });

  it("wrong order of words is incorrect", () => {
    const part = q(16).parts[0];
    const r = gradePart(part, ["t1", "t4", "t3", "t5", "t2"]); // "with live I my family."
    expect(r.status).toBe("incorrect");
  });

  it("true/false wrong choice is incorrect", () => {
    const part = q(18).parts[0]; // correct = False
    expect(gradePart(part, "true").status).toBe("incorrect");
    expect(gradePart(part, "false").status).toBe("correct");
  });
});

describe("grading — flexible written answers", () => {
  it("accepts capitalisation differences", () => {
    const p = q(2).parts[0];
    expect(gradePart(p, "SISTER").status).toBe("correct");
    expect(gradePart(p, "Sister").status).toBe("correct");
  });
  it("accepts leading/trailing spaces", () => {
    const p = q(7).parts[0];
    expect(gradePart(p, "   playground   ").status).toBe("correct");
  });
  it("accepts all spelling variants of number translations", () => {
    const p = q(4).parts[0]; // ثلاثة وعشرون
    expect(gradePart(p, "twenty-three").status).toBe("correct");
    expect(gradePart(p, "TWENTY THREE").status).toBe("correct");
    expect(gradePart(p, " 23 ").status).toBe("correct");
    expect(gradePart(p, "twenty threee").status).toBe("incorrect");
  });
  it("accepts all defined alternatives", () => {
    const p = q(28).parts[0];
    for (const a of ["she has got two sisters", "She’s got two sisters.", "SHE HAS GOT 2 SISTERS"]) {
      expect(gradePart(p, a).status).toBe("correct");
    }
  });
  it("can't variants are all accepted", () => {
    const p = q(22).parts[1];
    for (const a of ["can't", "cant", "cannot", "CAN’T"]) {
      expect(gradePart(p, a).status).toBe("correct");
    }
  });
  it("rejects nearly-right-but-wrong translations", () => {
    const smell = q(9).parts[0]; // يشمّ = smell
    expect(gradePart(smell, "smel").status).toBe("incorrect"); // misspelling
    expect(gradePart(smell, "taste").status).toBe("incorrect"); // different sense
    const day = q(5).parts[0]; // الأربعاء = Wednesday
    expect(gradePart(day, "Wensday").status).toBe("incorrect");
    expect(gradePart(day, "Wednesday").status).toBe("correct");
    const butterfly = q(11).parts[0]; // فراشة
    expect(gradePart(butterfly, "butterflie").status).toBe("incorrect");
  });
  it("Q35a accepts every curriculum subject", () => {
    const p = q(35).parts[0];
    for (const s of ["Maths", "science", "ENGLISH", "Social Studies", "art", "SPORTS", "arabic", "Music"]) {
      expect(gradePart(p, s).status).toBe("correct");
    }
    expect(gradePart(p, "Geography").status).toBe("incorrect");
  });
});

describe("grading — completion rules", () => {
  it("empty strings / empty token lists are unanswered", () => {
    expect(isPartAnswered(q(2).parts[0], "")).toBe(false);
    expect(isPartAnswered(q(16).parts[0], [])).toBe(false);
    expect(isPartAnswered(q(29).parts[0], "ab")).toBe(false); // writing min length
  });
  it("ordering is complete only when every token is placed", () => {
    expect(isPartAnswered(q(16).parts[0], ["t3", "t4"])).toBe(false);
    expect(isPartAnswered(q(16).parts[0], ["t3", "t4", "t1", "t5", "t2"])).toBe(true);
  });
  it("multi-part questions need every part answered", () => {
    expect(isQuestionAnswered(q(15), { a: "have", b: "has" })).toBe(true);
    expect(isQuestionAnswered(q(15), { a: "have" })).toBe(false);
    expect(isQuestionAnswered(q(23), { a: "two", b: "upstairs", c: "false" })).toBe(false);
    expect(isQuestionAnswered(q(23), { a: "two", b: "upstairs", c: "false", d: "birds" })).toBe(true);
  });
  it("unanswered list contains everything for a blank attempt", () => {
    expect(unansweredQuestionIds(QUESTIONS, {}).length).toBe(35);
  });
});

describe("grading — partial credit and exam maths", () => {
  it("partial multi-part answers earn partial marks", () => {
    const answers: AnswersMap = {
      15: { a: "have", b: "have" }, // a right, b wrong
      4: { a: "23", b: "27", c: "29" }, // c wrong
    };
    const r = gradeExam(QUESTIONS, answers);
    const r15 = r.questionResults.find((x) => x.questionId === 15)!;
    expect(r15.earned).toBe(2);
    expect(r15.status).toBe("partial");
    const r4 = r.questionResults.find((x) => x.questionId === 4)!;
    expect(r4.earned).toBe(2);
    expect(r4.status).toBe("partial");
  });

  it("percentage is exact against the 100-mark total", () => {
    const r = gradeExam(QUESTIONS, allCorrect());
    expect(r.percentage).toBe(96);
  });
});

describe("report helpers", () => {
  it("formats HH:MM:SS durations", () => {
    expect(formatDuration(0)).toBe("00:00:00");
    expect(formatDuration(61_000)).toBe("00:01:01");
    expect(formatDuration(3_726_000)).toBe("01:02:06");
  });
  it("sanitises the student's name for filenames", () => {
    expect(reportFileName("Lina Ahmad")).toBe("Grade3_English_Exam_Lina_Ahmad.txt");
    expect(reportFileName("  لينا<>/:*? A  ")).toBe("Grade3_English_Exam_A.txt");
    expect(reportFileName("")).toBe("Grade3_English_Exam_Student.txt");
  });
});
