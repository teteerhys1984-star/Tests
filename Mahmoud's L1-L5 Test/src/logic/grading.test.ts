import { describe, expect, it } from "vitest";
import { QUESTIONS } from "../data/questions";
import type { AnswerMap, Question } from "../types";
import {
  gradeExam,
  gradePart,
  gradeQuestion,
  isAnswered,
  missingPartIds,
  normalize,
  testCriterion,
  wordCount,
} from "./grading";

const byId = (id: string): Question => {
  const q = QUESTIONS.find((x) => x.id === id);
  if (!q) throw new Error(`missing question ${id}`);
  return q;
};

/** Build an all-correct answer map straight from the answer keys. */
function perfectAnswers(): AnswerMap {
  const map: AnswerMap = {};
  for (const q of QUESTIONS) {
    for (const p of q.parts) {
      switch (p.kind) {
        case "mcq":
        case "match":
          map[p.id] = p.answer;
          break;
        case "tf":
          map[p.id] = String(p.answer);
          break;
        case "fill":
          map[p.id] = p.accept[0];
          break;
        case "order":
          map[p.id] = [...p.answer];
          break;
        case "rubric":
          map[p.id] =
            q.id === "q35"
              ? "My favourite subject is Science because it is fun and useful."
              : "My name is Laila Haddad. I am from Syria.";
          break;
      }
    }
  }
  return map;
}

describe("normalization", () => {
  it("ignores capitalization differences", () => {
    expect(normalize("AM")).toBe(normalize("am"));
    expect(normalize("She'S")).toBe("she's");
  });
  it("ignores leading/trailing spaces and collapses inner spaces", () => {
    expect(normalize("   get  up   ")).toBe("get up");
  });
  it("unifies curly and straight apostrophes", () => {
    expect(normalize("I’m")).toBe(normalize("I'm"));
    expect(normalize("they’re")).toBe("they're");
  });
});

describe("isAnswered", () => {
  it("detects empty answers", () => {
    expect(isAnswered(undefined)).toBe(false);
    expect(isAnswered("")).toBe(false);
    expect(isAnswered("   ")).toBe(false);
    expect(isAnswered([])).toBe(false);
    expect(isAnswered("am")).toBe(true);
    expect(isAnswered(["She"])).toBe(true);
  });
});

describe("part grading — objective items", () => {
  it("grades mcq correct and incorrect", () => {
    const q = byId("q16");
    const p = q.parts[0];
    expect(gradePart(q, p, "b").earned).toBe(1);
    expect(gradePart(q, p, "a").earned).toBe(0);
  });

  it("grades Arabic→English translation vocabulary items", () => {
    const q1 = byId("q1");
    expect(gradePart(q1, q1.parts[0], "country").earned).toBe(2);
    expect(gradePart(q1, q1.parts[0], "  Country  ").earned).toBe(2); // case + spaces
    expect(gradePart(q1, q1.parts[0], "city").earned).toBe(0);
    const q2 = byId("q2");
    expect(gradePart(q2, q2.parts[0], "doctor").earned).toBe(1);
    expect(gradePart(q2, q2.parts[1], "jordan").correct).toBe(true);
    const q7 = byId("q7");
    expect(gradePart(q7, q7.parts[2], "get dressed").earned).toBe(1);
    expect(gradePart(q7, q7.parts[2], "gets dressed").earned).toBe(1); // accepted variant
    const q10 = byId("q10");
    expect(gradePart(q10, q10.parts[2], "Living   Room").earned).toBe(1); // spacing/case
    expect(gradePart(q10, q10.parts[0], "bed").earned).toBe(0);
  });

  it("grades fills case- and space-insensitively", () => {
    const q = byId("q14");
    const am = q.parts[0];
    expect(gradePart(q, am, "  AM ").earned).toBe(1);
    expect(gradePart(q, am, "am").correct).toBe(true);
    expect(gradePart(q, am, "is").earned).toBe(0);
    expect(gradePart(q, am, " ").earned).toBe(0);
  });

  it("accepts curly apostrophes in contractions", () => {
    const q = byId("q15");
    const shes = q.parts[1];
    expect(gradePart(q, shes, "She’s").earned).toBe(1);
    expect(gradePart(q, shes, "she's").earned).toBe(1);
    expect(gradePart(q, shes, "she is").earned).toBe(0);
  });

  it("grades true/false", () => {
    const q = byId("q29");
    expect(gradePart(q, q.parts[0], "true").earned).toBe(1);
    expect(gradePart(q, q.parts[0], "false").earned).toBe(0);
    expect(gradePart(q, q.parts[1], "false").earned).toBe(1);
  });

  it("grades matching against the shared pool", () => {
    const q = byId("q23");
    expect(gradePart(q, q.parts[0], "m3").earned).toBe(1); // 7:00 → seven o'clock
    expect(gradePart(q, q.parts[0], "m1").earned).toBe(0);
    expect(gradePart(q, q.parts[3], "m2").earned).toBe(1); // 3:45 → quarter to four
  });

  it("grades word order strictly, tolerating trailing punctuation", () => {
    const q = byId("q20");
    const p = q.parts[0];
    expect(gradePart(q, p, ["She", "has", "got", "long", "blond", "hair"]).earned).toBe(3);
    expect(gradePart(q, p, ["She", "has", "got", "long", "blond", "hair."]).earned).toBe(3);
    expect(gradePart(q, p, ["She", "has", "got", "blond", "long", "hair"]).earned).toBe(0);
    expect(gradePart(q, p, ["She", "has"]).earned).toBe(0);
  });
});

describe("multi-part independence", () => {
  it("scores each sub-part independently", () => {
    const q = byId("q18");
    const res = gradeQuestion(q, {
      q18a: "a", // correct
      q18b: "a", // wrong (should be b)
      q18c: "b", // correct
      q18d: "b", // wrong (should be a)
    });
    expect(res.earned).toBe(2);
    expect(res.max).toBe(4);
    expect(res.parts.map((p) => p.correct)).toEqual([true, false, true, false]);
  });
});

describe("rubric auto-scoring (open writing)", () => {
  const q35 = byId("q35");
  const part = q35.parts[0];

  it("awards full marks for a complete model answer", () => {
    const r = gradePart(q35, part, "My favourite subject is Science because it is fun and useful.");
    expect(r.earned).toBe(5);
    expect(r.criteria?.every((c) => c.met)).toBe(true);
  });

  it("awards partial marks transparently", () => {
    const r = gradePart(q35, part, "I like English very much.");
    // names subject (2) + opinion (2 via "like") + ≥6 words? "I like English very much." = 5 words → no
    expect(r.earned).toBe(4);
    expect(r.criteria?.map((c) => c.met)).toEqual([true, true, false]);
  });

  it("awards zero for irrelevant writing", () => {
    const r = gradePart(q35, part, "the sofa is in the bedroom and");
    expect(r.earned).toBe(1); // only the word-count criterion
    const empty = gradePart(q35, part, "sofa bed door");
    expect(empty.earned).toBe(0);
  });

  it("handles the self-introduction rubric (Q17)", () => {
    const q17 = byId("q17");
    const p = q17.parts[0];
    expect(gradePart(q17, p, "My name is Omar. I am from Jordan.").earned).toBe(3);
    expect(gradePart(q17, p, "hello").earned).toBe(0);
    expect(gradePart(q17, p, "My name is Sara and I am eight.").earned).toBe(2);
  });
});

describe("criterion primitives", () => {
  it("wordCount counts real words", () => {
    expect(wordCount("")).toBe(0);
    expect(wordCount("I am from Syria.")).toBe(4);
  });
  it("minWords / includesAny behave", () => {
    expect(testCriterion({ id: "a", description: "", marks: 1, kind: "minWords", value: 3 }, "one two three")).toBe(true);
    expect(testCriterion({ id: "b", description: "", marks: 1, kind: "includesAny", value: ["science"] }, "I love science class")).toBe(true);
    expect(testCriterion({ id: "c", description: "", marks: 1, kind: "includesAny", value: ["science"] }, "no match here")).toBe(false);
  });
});

describe("submission gate", () => {
  it("blocks submission until every part is answered", () => {
    const answers = perfectAnswers();
    expect(missingPartIds(QUESTIONS, answers)).toHaveLength(0);
    delete answers["q1a"];
    delete answers["q23d"];
    expect(missingPartIds(QUESTIONS, answers)).toEqual(
      expect.arrayContaining(["q1a", "q23d"])
    );
  });
});

describe("full-exam grading", () => {
  it("a perfect run totals exactly 100 of 100", () => {
    const r = gradeExam(perfectAnswers(), "Test Student", 1_000, 61_000);
    expect(r.totalEarned).toBe(100);
    expect(r.totalMax).toBe(100);
    expect(r.percentage).toBe(100);
    expect(r.correctQuestions).toBe(35);
    expect(r.incorrectQuestions).toBe(0);
    expect(r.durationMs).toBe(60_000);
  });

  it("an all-wrong run scores 0 but still totals 100 max", () => {
    const bad: AnswerMap = {};
    for (const q of QUESTIONS)
      for (const p of q.parts) {
        bad[p.id] =
          p.kind === "tf"
            ? String(!p.answer)
            : p.kind === "order"
              ? [...p.answer].reverse()
              : p.kind === "rubric"
                ? "zz zz zz"
                : "zzz_wrong";
      }
    const r = gradeExam(bad, "Test Student", 1_000, 2_000);
    expect(r.totalEarned).toBe(0);
    expect(r.totalMax).toBe(100);
    expect(r.percentage).toBe(0);
    expect(r.incorrectQuestions).toBe(35);
  });

  it("mixed answers produce a mathematically consistent percentage", () => {
    const answers = perfectAnswers();
    // drop Q14 (4 marks) → 96 expected
    delete answers.q14a;
    delete answers.q14b;
    delete answers.q14c;
    delete answers.q14d;
    answers.q14a = "is";
    answers.q14b = "am";
    answers.q14c = "am";
    answers.q14d = "is";
    const r = gradeExam(answers, "Test Student", 0, 1000);
    expect(r.totalEarned).toBe(96);
    expect(r.percentage).toBe(96);
  });
});
