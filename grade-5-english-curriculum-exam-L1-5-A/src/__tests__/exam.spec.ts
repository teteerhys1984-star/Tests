import { beforeEach, describe, expect, it } from "vitest";
import {
  LESSONS,
  LESSON_ORDER,
  QUESTIONS,
  TOTAL_MARKS,
  TOTAL_QUESTIONS,
  type Part,
} from "@/data/exam";
import {
  allAnswered,
  answeredCount,
  gradeExam,
  gradePart,
  isAnswered,
  normalize,
} from "@/lib/grading";
import { buildReport, reportFileName, safeFileName } from "@/lib/report";
import {
  clearAttempt,
  elapsedBetween,
  formatElapsed,
  loadAttempt,
  saveAttempt,
  STORAGE_KEY,
  type Attempt,
} from "@/lib/storage";

/** A response that satisfies every rubric part of the paper. */
function rubricResponse(part: Part): string {
  if (part.type !== "rubric") return "";
  return part.starter
    ? `${part.starter}keep the classroom tidy and listen well`
    : "This is my own answer and I write it in full sentences today";
}

/** The complete, correct answer key — used to prove the paper can be graded. */
function fullKey(): Record<string, string> {
  const key: Record<string, string> = {};
  for (const q of QUESTIONS) {
    for (const p of q.parts) {
      key[p.id] = p.type === "rubric" ? rubricResponse(p) : p.answer;
    }
  }
  return key;
}

describe("Exam structure", () => {
  it("has exactly 50 main questions", () => {
    expect(QUESTIONS).toHaveLength(50);
    expect(TOTAL_QUESTIONS).toBe(50);
  });

  it("has exactly 10 questions from each of the five lessons", () => {
    for (const id of LESSON_ORDER) {
      const count = QUESTIONS.filter((q) => q.lesson === id).length;
      expect(count, `lesson ${id}`).toBe(10);
      expect(LESSONS[id]).toBeDefined();
    }
    expect(new Set(QUESTIONS.map((q) => q.lesson)).size).toBe(5);
  });

  it("is worth exactly 100 marks, 2 marks per question", () => {
    expect(TOTAL_MARKS).toBe(100);
    for (const q of QUESTIONS) {
      const marks = q.parts.reduce((s, p) => s + p.marks, 0);
      expect(marks, q.id).toBe(2);
      for (const p of q.parts) {
        expect(p.marks, `${p.id} marks`).toBeGreaterThan(0);
      }
    }
  });

  it("uses unique question ids and unique part ids", () => {
    const qids = QUESTIONS.map((q) => q.id);
    const pids = QUESTIONS.flatMap((q) => q.parts.map((p) => p.id));
    expect(new Set(qids).size).toBe(qids.length);
    expect(new Set(pids).size).toBe(pids.length);
    expect(pids.length).toBeGreaterThanOrEqual(50);
  });

  it("mixes the lessons through the paper instead of grouping them", () => {
    const firstFive = QUESTIONS.slice(0, 5).map((q) => q.lesson);
    expect(new Set(firstFive).size).toBe(5);
  });

  it("carries a source reference on every question", () => {
    for (const q of QUESTIONS) {
      expect(q.ref.length, q.id).toBeGreaterThan(8);
    }
  });

  it("has no standalone vocabulary section", () => {
    for (const q of QUESTIONS) {
      expect(q.ref.toLowerCase()).not.toMatch(/vocabulary/);
      expect(q.stem?.toLowerCase() ?? "").not.toMatch(/^vocabulary/);
    }
  });

  it("contains no listening-dependent question", () => {
    for (const q of QUESTIONS) {
      const haystack = [q.ref, q.stem ?? "", ...q.parts.map((p) => p.prompt)].join(" ").toLowerCase();
      expect(haystack, q.id).not.toMatch(/\blisten\b/);
      expect(haystack, q.id).not.toMatch(/\baudio\b/);
      expect(haystack, q.id).not.toMatch(/\brecording\b/);
    }
  });

  it("only reproduces reading passages that exist in the Grade 5 Unit 1 source", () => {
    const passages = QUESTIONS.filter((q) => q.passage).map((q) => q.passage!);
    expect(passages.length).toBeGreaterThanOrEqual(4);

    const verbatimMarkers = [
      "Hello! My name is John. I am ten years old and I am from Canada.",
      "I am Mira, I love Friday. It's a holiday.",
      "We use our five senses every day. They are sight, touch, smell, taste and hearing.",
      "S: Good morning, madam. Can I help you?",
    ];
    for (const marker of verbatimMarkers) {
      expect(
        passages.some((p) => p.body.some((para) => para.includes(marker))),
        marker.slice(0, 30),
      ).toBe(true);
    }
  });
});

describe("Completion checks", () => {
  it("counts every subpart, not just the parent question", () => {
    const { answered, total } = answeredCount(QUESTIONS, {});
    expect(answered).toBe(0);
    expect(total).toBeGreaterThan(50);
  });

  it("cannot be submitted while anything is blank", () => {
    expect(allAnswered(QUESTIONS, {})).toBe(false);

    const almostAll = fullKey();
    const lastPart = QUESTIONS[QUESTIONS.length - 1].parts[0];
    delete almostAll[lastPart.id];
    expect(allAnswered(QUESTIONS, almostAll)).toBe(false);
  });

  it("requires every word of an ordering task to be placed", () => {
    const orderPart = QUESTIONS.flatMap((q) => q.parts).find((p) => p.type === "order");
    expect(orderPart).toBeDefined();
    expect(isAnswered(orderPart!, "")).toBe(false);
    expect(isAnswered(orderPart!, orderPart!.type === "order" ? orderPart!.words[0] : "")).toBe(false);
    const full =
      orderPart!.type === "order" ? orderPart!.words.join(" ") : "";
    expect(isAnswered(orderPart!, full)).toBe(true);
  });

  it("accepts the whole paper as complete when everything is answered", () => {
    expect(allAnswered(QUESTIONS, fullKey())).toBe(true);
    const { answered, total } = answeredCount(QUESTIONS, fullKey());
    expect(answered).toBe(total);
  });
});

describe("Grading", () => {
  it("awards full marks for the complete correct key", () => {
    const result = gradeExam(QUESTIONS, fullKey());
    expect(result.score).toBe(100);
    expect(result.maxScore).toBe(100);
    expect(result.correctCount).toBe(result.totalParts);
    expect(result.incorrectCount).toBe(0);
  });

  it("awards nothing for a blank paper", () => {
    const result = gradeExam(QUESTIONS, {});
    expect(result.score).toBe(0);
    expect(result.correctCount).toBe(0);
    expect(result.incorrectCount).toBe(result.totalParts);
  });

  it("grades multiple choice, true/false and short text answers", () => {
    const mcq = QUESTIONS.flatMap((q) => q.parts).find((p) => p.type === "mcq")!;
    expect(gradePart(mcq, mcq.type === "mcq" ? mcq.answer : "", "q").earned).toBe(mcq.marks);
    expect(gradePart(mcq, "___not an option___", "q").earned).toBe(0);

    const tf = QUESTIONS.flatMap((q) => q.parts).find((p) => p.type === "tf")!;
    expect(gradePart(tf, "true", "q").correct).toBe(tf.answer === "True");

    const text = QUESTIONS.flatMap((q) => q.parts).find((p) => p.type === "text")!;
    const right = text.type === "text" ? text.answer : "";
    expect(gradePart(text, right, "q").earned).toBe(text.marks);
    expect(gradePart(text, `  ${right.toUpperCase()}... `, "q").correct).toBe(true);
    expect(gradePart(text, "something else entirely", "q").earned).toBe(0);
  });

  it("grades word ordering by token order, not by string equality", () => {
    const part = QUESTIONS.flatMap((q) => q.parts).find((p) => p.type === "order")!;
    expect(part.type).toBe("order");
    if (part.type !== "order") return;
    expect(gradePart(part, part.answer, "q").earned).toBe(part.marks);
    const reversed = part.words.slice().reverse().join(" ");
    expect(gradePart(part, reversed, "q").earned).toBe(0);
  });

  it("awards rubric parts only when the pupil actually writes an answer", () => {
    const rubric = QUESTIONS.flatMap((q) => q.parts).find((p) => p.type === "rubric")!;
    expect(rubric.type).toBe("rubric");
    if (rubric.type !== "rubric") return;
    expect(gradePart(rubric, "", "q").earned).toBe(0);
    expect(gradePart(rubric, "yes", "q").earned).toBe(0);
    expect(gradePart(rubric, rubricResponse(rubric), "q").earned).toBe(rubric.marks);
    expect(gradePart(rubric, rubricResponse(rubric), "q").explanation).toBe(rubric.rubric);
  });

  it("normalises punctuation, case and spacing", () => {
    expect(normalize("  It's 3000 SP. ")).toBe("it's 3000 sp");
    expect(normalize("Science  Lab")).toBe("science lab");
  });

  it("does not mark a wrong answer as correct", () => {
    const key = fullKey();
    const textPart = QUESTIONS.flatMap((q) => q.parts).find(
      (p) => p.type === "text",
    )!;
    key[textPart.id] = "a completely wrong answer";
    const result = gradeExam(QUESTIONS, key);
    expect(result.score).toBeLessThan(100);
    expect(result.incorrectCount).toBeGreaterThan(0);
  });
});

describe("Timer persistence and recovery", () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    const shim: Storage = {
      get length() {
        return store.size;
      },
      clear: () => store.clear(),
      getItem: (k) => store.get(k) ?? null,
      key: (i) => Array.from(store.keys())[i] ?? null,
      removeItem: (k) => void store.delete(k),
      setItem: (k, v) => void store.set(k, v),
    };
    Object.defineProperty(globalThis, "localStorage", { value: shim, configurable: true });
  });

  it("formats the count-up timer as HH:MM:SS", () => {
    expect(formatElapsed(0)).toBe("00:00:00");
    expect(formatElapsed(1000)).toBe("00:00:01");
    expect(formatElapsed(3_723_000)).toBe("01:02:03");
    expect(formatElapsed(-5)).toBe("00:00:00");
  });

  it("keeps counting from the original start timestamp", () => {
    const start = Date.now() - 90_000;
    expect(elapsedBetween(start, null)).toBeGreaterThanOrEqual(90_000);
    expect(elapsedBetween(start, start + 5_000)).toBe(5_000);
  });

  it("restores an attempt after a refresh, including the start timestamp", () => {
    const attempt: Attempt = {
      v: 1,
      name: "Layla Ahmad",
      answers: { "L1-1a": "library" },
      startedAt: 1_700_000_000_000,
      index: 7,
      status: "in-progress",
      submittedAt: null,
      muted: true,
    };
    saveAttempt(attempt);
    const restored = loadAttempt();
    expect(restored).not.toBeNull();
    expect(restored!.name).toBe(attempt.name);
    expect(restored!.startedAt).toBe(attempt.startedAt);
    expect(restored!.index).toBe(7);
    expect(restored!.answers["L1-1a"]).toBe("library");
    expect(restored!.muted).toBe(true);
    expect(restored!.status).toBe("in-progress");
  });

  it("keeps a submitted attempt in the submitted state", () => {
    saveAttempt({
      v: 1,
      name: "Omar",
      answers: {},
      startedAt: 1_700_000_000_000,
      index: 3,
      status: "submitted",
      submittedAt: 1_700_000_600_000,
      muted: false,
    });
    expect(loadAttempt()!.status).toBe("submitted");
    expect(loadAttempt()!.submittedAt).toBe(1_700_000_600_000);
  });

  it("does not create a new attempt when storage is empty or corrupt", () => {
    expect(loadAttempt()).toBeNull();
    localStorage.setItem(STORAGE_KEY, "{not json");
    expect(loadAttempt()).toBeNull();
    clearAttempt();
    expect(loadAttempt()).toBeNull();
  });
});

describe("Report generation", () => {
  const submittedAt = Date.UTC(2026, 4, 12, 9, 30, 0);
  const result = gradeExam(QUESTIONS, fullKey());
  const report = buildReport({
    name: "Layla Ahmad",
    result,
    questions: QUESTIONS,
    submittedAt,
    elapsedMs: 3_723_000,
  });

  it("includes the pupil, the exam, the date, the time and the score", () => {
    expect(report).toContain("Student name      : Layla Ahmad");
    expect(report).toContain("GRADE 5 ENGLISH - UNIT 1 EXAMINATION - MODEL A");
    expect(report).toContain("Submitted on      :");
    expect(report).toContain("Completion time   : 01:02:03");
    expect(report).toContain("Final score       : 100 / 100");
  });

  it("includes every question with its marks, answers and lesson reference", () => {
    for (const q of QUESTIONS) {
      expect(report).toContain(q.id);
      expect(report).toContain(q.ref);
    }
    expect(report).toContain("Marks : 2 / 2");
    expect(report).toContain("Lesson 1 - At School");
    expect(report).toContain("Lesson 5 - Clothes");
    expect(report).toContain("SUMMARY BY LESSON");
    expect(report).toContain("Your answer");
    expect(report).toContain("Correct answer");
  });

  it("builds a safe file name from the pupil's name", () => {
    expect(safeFileName("Layla Ahmad Hamdan")).toBe(["Layla", "Ahmad", "Hamdan"].join("-"));
    expect(safeFileName("  /\\:*?\"<>|  ")).toBe("student");
    expect(safeFileName("")).toBe("student");
    const file = reportFileName("Omar Ali", submittedAt);
    expect(file.startsWith("Grade5-Unit1-ModelA_Omar-Ali_")).toBe(true);
    expect(file.endsWith(".txt")).toBe(true);
    expect(/[\\/:*?"<>|]/.test(file)).toBe(false);
  });
});
