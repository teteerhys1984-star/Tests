/**
 * Content parity between the published exam and its source folder.
 *
 * The source of truth for the educational content is
 * `grade-5-english-curriculum-exam-L1-5-A` (the uploaded project). This test
 * proves that the published folder `grade5-english-curriculum-exam-l1-5-a`
 * carries exactly the same paper: same questions, same order, same passages,
 * same options, same answers, same accepted answers, same marks.
 *
 * Only technical files (config, storage, delivery, fonts, entry point) differ
 * between the two folders — the data file itself is byte-identical.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { describe, expect, it } from "vitest";

import * as finalExam from "@/data/exam";
import * as sourceExam from "../../../grade-5-english-curriculum-exam-L1-5-A/src/data/exam";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PROJECT = path.resolve(HERE, "..", "..");
const REPO = path.resolve(PROJECT, "..");
const SOURCE_DATA_FILE = path.join(
  REPO,
  "grade-5-english-curriculum-exam-L1-5-A",
  "src",
  "data",
  "exam.ts",
);
const FINAL_DATA_FILE = path.join(PROJECT, "src", "data", "exam.ts");

describe("Source parity — the published paper is the uploaded paper", () => {
  it("keeps the data file byte-identical to the source", () => {
    const source = readFileSync(SOURCE_DATA_FILE, "utf8");
    const published = readFileSync(FINAL_DATA_FILE, "utf8");
    expect(published.length).toBe(source.length);
    expect(published).toBe(source);
  });

  it("publishes exactly the same question list, in the same order", () => {
    expect(finalExam.QUESTIONS.map((q) => q.id)).toEqual(sourceExam.QUESTIONS.map((q) => q.id));
    expect(finalExam.QUESTIONS).toEqual(sourceExam.QUESTIONS);
  });

  it("publishes exactly the same lessons, passages and tables", () => {
    expect(finalExam.LESSONS).toEqual(sourceExam.LESSONS);
    expect(finalExam.LESSON_ORDER).toEqual(sourceExam.LESSON_ORDER);

    const passages = (mod: typeof finalExam) =>
      mod.QUESTIONS.filter((q) => q.passage).map((q) => q.passage);
    expect(passages(finalExam)).toEqual(passages(sourceExam));

    const tables = (mod: typeof finalExam) =>
      mod.QUESTIONS.filter((q) => q.table).map((q) => q.table);
    expect(tables(finalExam)).toEqual(tables(sourceExam));
  });

  it("publishes exactly the same parts, options, answers and marks", () => {
    const parts = (mod: typeof finalExam) =>
      mod.QUESTIONS.flatMap((q) =>
        q.parts.map((p) => ({
          id: p.id,
          label: p.label,
          prompt: p.prompt,
          marks: p.marks,
          type: p.type,
          answer: p.type === "rubric" ? "" : p.answer,
          accepted: p.type === "text" ? (p.accepted ?? []) : [],
          options: p.type === "mcq" ? p.options : [],
          words: p.type === "order" ? p.words : [],
          rubric: p.type === "rubric" ? p.rubric : "",
          starter: p.type === "rubric" ? (p.starter ?? "") : "",
          minWords: p.type === "rubric" ? p.minWords : 0,
        })),
      );
    expect(parts(finalExam)).toEqual(parts(sourceExam));
  });

  it("keeps the same totals: questions, parts and marks", () => {
    expect(finalExam.TOTAL_QUESTIONS).toBe(sourceExam.TOTAL_QUESTIONS);
    expect(finalExam.TOTAL_MARKS).toBe(sourceExam.TOTAL_MARKS);
    expect(finalExam.ALL_PARTS.length).toBe(sourceExam.ALL_PARTS.length);
  });

  it("does not import anything from another exam at runtime", () => {
    // The published exam must stand alone: only its own modules may be used.
    const appSources = [
      "src/App.tsx",
      "src/components/EntryScreen.tsx",
      "src/components/ExamScreen.tsx",
      "src/components/QuestionCard.tsx",
      "src/components/ResultsScreen.tsx",
      "src/components/TeacherKey.tsx",
      "src/components/ContactFooter.tsx",
      "src/lib/grading.ts",
      "src/lib/report.ts",
      "src/lib/storage.ts",
      "src/lib/submit.ts",
      "src/config.ts",
    ];
    const importPath = /(?:from|import)\s*\(?\s*["']([^"']+)["']/g;
    for (const rel of appSources) {
      const content = readFileSync(path.join(PROJECT, rel), "utf8");
      for (const match of content.matchAll(importPath)) {
        const specifier = match[1];
        expect(specifier, rel).not.toMatch(/grade-5-english-curriculum-exam-L1-5-A/);
        expect(specifier, rel).not.toMatch(/grade-3-english-curriculum/);
        expect(specifier, rel).not.toMatch(/grade4-english-curriculum/);
        expect(specifier, rel).not.toMatch(/grade5-math-unit1/);
      }
    }
  });
});
