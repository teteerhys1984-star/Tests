/**
 * SOURCE PARITY — proof that the exam's educational data is the source's data.
 *
 * The source project is `grade-5-english-curriculum-exam-L1-5-B/` at the
 * repository root. Nothing in this file contacts the network.
 *
 * The strongest check is byte equality of `src/data/questions.ts` with the
 * source file. On top of it the numbers are re-derived from the source TEXT
 * itself (not from the imported module), and every prompt / option / accepted
 * answer / passage / mark of the shipped module is proven to appear verbatim
 * in the source file.
 */
import { createHash } from "node:crypto";
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

import {
  ALL_PARTS,
  LESSONS,
  QUESTIONS,
  TOTAL_MARKS,
  TOTAL_QUESTIONS,
  questionsForLesson,
} from "@/data/questions";

const REPO_ROOT = resolve(process.cwd(), "..");
const SOURCE_DIR = join(REPO_ROOT, "grade-5-english-curriculum-exam-L1-5-B");
const SOURCE_DATA = join(SOURCE_DIR, "src", "data", "questions.ts");
const SHIPPED_DATA = resolve(process.cwd(), "src", "data", "questions.ts");

const sourceText = readFileSync(SOURCE_DATA, "utf8");
const shippedText = readFileSync(SHIPPED_DATA, "utf8");

function sha256(buffer: Buffer): string {
  return createHash("sha256").update(buffer).digest("hex");
}

/** Escapes a runtime string the way a double-quoted TypeScript literal does. */
function asSourceLiteral(value: string): string {
  return JSON.stringify(value).slice(1, -1);
}

/** Independent reading of the numbers, straight from the source text. */
function parseSource(text: string) {
  const questionIds = [...text.matchAll(/id: "(l([1-5])q\d+)"/g)].map((m) => ({
    id: m[1],
    lesson: Number(m[2]),
  }));
  const partIds = [...text.matchAll(/id: "(l[1-5]q\d+[a-z])"/g)].map((m) => m[1]);
  const marks = [...text.matchAll(/\bmarks: ([\d.]+)/g)].map((m) => Number(m[1]));
  const perLesson: Record<number, { questions: number; marks: number }> = {};
  for (const lesson of [1, 2, 3, 4, 5]) {
    const qs = questionIds.filter((q) => q.lesson === lesson);
    perLesson[lesson] = {
      questions: qs.length,
      // every marks: value belongs to a part; sums below are validated globally
      marks: 0,
    };
  }
  return {
    questionIds,
    partIds,
    marks,
    perLesson,
    totalMarks: marks.reduce((s, m) => s + m, 0),
  };
}

const source = parseSource(sourceText);

/** Recursively lists files under a directory. */
function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

describe("source folder is present and untouched by this project", () => {
  it("exists at the repository root with the exact expected name", () => {
    expect(existsSync(SOURCE_DIR)).toBe(true);
    expect(SOURCE_DATA.endsWith(join("src", "data", "questions.ts"))).toBe(true);
  });

  it("is not copied inside the published exam folder", () => {
    const inside = walk(resolve(process.cwd(), "src", "data")).map((f) => f.toLowerCase());
    expect(inside.every((f) => !f.includes("grade-5-english-curriculum-exam-l1-5-b"))).toBe(true);
    expect(walk(resolve(process.cwd())).some((f) => f.includes("grade-5-english-curriculum-exam-L1-5-B"))).toBe(
      false
    );
  });
});

describe("educational data file is byte-identical to the source", () => {
  it("has the same bytes", () => {
    expect(shippedText).toBe(sourceText);
    expect(sha256(readFileSync(SHIPPED_DATA))).toBe(sha256(readFileSync(SOURCE_DATA)));
  });

  it("has exactly the same length as the source file", () => {
    expect(shippedText.split("\n")).toHaveLength(sourceText.split("\n").length);
    expect(Buffer.byteLength(shippedText, "utf8")).toBe(Buffer.byteLength(sourceText, "utf8"));
    expect(Buffer.byteLength(shippedText, "utf8")).toBeGreaterThan(30000);
  });
});

describe("counts re-derived from the source text itself", () => {
  it("contains 50 main questions: 10 per lesson", () => {
    expect(source.questionIds).toHaveLength(50);
    expect(source.questionIds.map((q) => q.id)).toEqual(QUESTIONS.map((q) => q.id));
    for (const lesson of [1, 2, 3, 4, 5]) {
      expect(source.perLesson[lesson].questions, `lesson ${lesson}`).toBe(10);
    }
  });

  it("contains 59 sub-parts", () => {
    expect(source.partIds).toHaveLength(59);
    expect(source.partIds).toEqual(ALL_PARTS.map((p) => p.id));
  });

  it("marks add up to exactly 100", () => {
    expect(source.marks.reduce((s, m) => s + m, 0)).toBe(100);
    expect(source.totalMarks).toBe(100);
    expect(TOTAL_MARKS).toBe(100);
  });

  it("gives 20 marks to each lesson in the shipped module", () => {
    for (const lesson of [1, 2, 3, 4, 5] as const) {
      const parts = questionsForLesson(lesson).flatMap((q) => q.parts);
      expect(parts.reduce((s, p) => s + p.marks, 0), `lesson ${lesson}`).toBe(20);
    }
  });

  it("uses the source's own lesson titles and pages", () => {
    expect(LESSONS.map((l) => [l.n, l.title, l.pages])).toEqual([
      [1, "At School", "3–5"],
      [2, "Family", "6–8"],
      [3, "Daily Routines", "9–11"],
      [4, "The Five Senses", "12–14"],
      [5, "Clothes", "15–20"],
    ]);
  });
});

describe("every shipped value appears verbatim in the source file", () => {
  it("keeps every question's metadata, instruction and context", () => {
    for (const q of QUESTIONS) {
      expect(sourceText, `${q.id} exercise`).toContain(asSourceLiteral(q.exercise));
      expect(sourceText, `${q.id} page`).toContain(asSourceLiteral(q.page));
      expect(sourceText, `${q.id} instruction`).toContain(asSourceLiteral(q.instruction));
      if (q.context) expect(sourceText, `${q.id} context`).toContain(asSourceLiteral(q.context));
    }
  });

  it("keeps every part prompt, option, accepted answer, mark and explanation", () => {
    for (const q of QUESTIONS) {
      for (const part of q.parts) {
        expect(sourceText, `${part.id} prompt`).toContain(asSourceLiteral(part.prompt));
        for (const option of part.options ?? []) {
          expect(sourceText, `${part.id} option ${option}`).toContain(asSourceLiteral(option));
        }
        for (const accept of part.accept) {
          expect(sourceText, `${part.id} accept ${accept}`).toContain(asSourceLiteral(accept));
        }
        expect(sourceText, `${part.id} marks`).toContain(`marks: ${part.marks}`);
        if (part.explanation) {
          expect(sourceText, `${part.id} explanation`).toContain(asSourceLiteral(part.explanation));
        }
      }
    }
  });

  it("ships the source's own totals, not a re-computation", () => {
    expect(TOTAL_QUESTIONS).toBe(source.questionIds.length);
    expect(ALL_PARTS.length).toBe(source.partIds.length);
    expect(TOTAL_MARKS).toBe(source.totalMarks);
  });
});

describe("source folder keeps its own project files (not stripped by this PR)", () => {
  it("still has the source application, README and tests", () => {
    for (const relative of [
      "README.md",
      "src/App.tsx",
      "src/data/questions.ts",
      "src/components/ExamScreen.tsx",
      "src/tests/exam.test.ts",
    ]) {
      expect(existsSync(join(SOURCE_DIR, relative)), relative).toBe(true);
    }
  });
});
