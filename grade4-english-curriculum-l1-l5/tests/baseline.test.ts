/**
 * 1) Comparison against the ORIGINAL exam (main@c90be436, "Mahmoud's L1-L5 Test"),
 *    captured BEFORE any edit:
 *      · every question, part, option, accepted answer, mark, curriculum reference;
 *      · the grading engine, report builder, sound system, CSS, and untouched screens
 *        are byte-identical (SHA-256);
 *      · five grading baselines (perfect / empty / all-wrong / mixed / partial credit).
 * 2) Directly verifies full, empty, wrong, mixed and partial grading plus the TXT report.
 */
import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import {
  BRAND, EXAM_SCOPE, EXAM_TITLE, LESSON_TITLES, MISSIONS, PASS_MARKS,
  QUESTIONS, TOTAL_MARKS, VOCABULARY_COUNT,
} from "../src/data/questions";
import { gradeExam, missingPartIds } from "../src/logic/grading";
import { buildReport, reportFilename } from "../src/logic/report";
import type { AnswerMap } from "../src/types";
import { deepEqual, EXAM_ROOT, fixture, sha256, sourceFile } from "./helpers";
import path from "node:path";

process.env.TZ = "UTC";

const baseline = fixture("questions-baseline.json");
const golden = fixture("grading-golden.json");
const hashes = fixture("source-hashes.json");
const START = 1_700_000_000_000;
const SUBMIT = START + 1_234_000;
const NAME = "Baseline Student";

describe("1. all 35 questions, 80 parts, 100 marks and answers are identical to the original", () => {
  it("the complete question bank (including every accepted answer and mark) is byte-equivalent", () => {
    expect(JSON.stringify(QUESTIONS)).toBe(JSON.stringify(baseline.QUESTIONS));
    expect(TOTAL_MARKS).toBe(baseline.TOTAL_MARKS);
    expect(VOCABULARY_COUNT).toBe(baseline.VOCABULARY_COUNT);
    expect(LESSON_TITLES).toEqual(baseline.LESSON_TITLES);
    expect(MISSIONS).toEqual(baseline.MISSIONS);
    expect({ EXAM_TITLE, EXAM_SCOPE, BRAND, PASS_MARKS }).toEqual({
      EXAM_TITLE: baseline.EXAM_TITLE,
      EXAM_SCOPE: baseline.EXAM_SCOPE,
      BRAND: baseline.BRAND,
      PASS_MARKS: baseline.PASS_MARKS,
    });
  });

  it("counts and per-question marks are unchanged", () => {
    expect(QUESTIONS).toHaveLength(35);
    expect(QUESTIONS.map((q) => q.n)).toEqual(Array.from({ length: 35 }, (_, i) => i + 1));
    expect(QUESTIONS.reduce((s, q) => s + q.parts.length, 0)).toBe(80);
    expect(TOTAL_MARKS).toBe(100);
    for (const q of QUESTIONS) expect(q.parts.reduce((s, p) => s + p.marks, 0)).toBe(q.marks);
    expect(baseline.QUESTIONS.reduce((s: number, q: any) => s + q.parts.reduce((a: number, p: any) => a + p.marks, 0), 0)).toBe(100);
  });

  it("content/grading/report/design/sound files are byte-identical to the original", () => {
    const files: Record<string, string> = hashes.files;
    expect(Object.keys(files)).toHaveLength(19);
    for (const [rel, expected] of Object.entries(files)) {
      const actual = sha256(sourceFile(rel));
      expect(actual, `${rel} changed`).toBe(expected);
    }
  });

  it("the two WAV assets that were missing now exist as valid RIFF/WAVE files", () => {
    for (const name of ["mission-start.wav", "mission-submit.wav"]) {
      const bytes = sourceFile(path.join("src", "assets", "sounds", name));
      expect(bytes.subarray(0, 4).toString("ascii")).toBe("RIFF");
      expect(bytes.subarray(8, 12).toString("ascii")).toBe("WAVE");
      expect(bytes.length).toBeGreaterThan(20000);
    }
  });
});

describe("2. grading baselines (full / empty / wrong / mixed / partial)", () => {
  for (const name of ["perfect", "empty", "wrong", "mixed", "partial"]) {
    it(`${name}: identical ExamResult, marks, per-part states, report hash, filename and gate`, () => {
      const g = golden[name];
      const answers = g.answers as AnswerMap;
      const result = gradeExam(answers, NAME, START, SUBMIT);
      expect(JSON.stringify(result)).toBe(JSON.stringify(g.result));
      expect(missingPartIds(QUESTIONS, answers)).toEqual(g.missingParts);

      const report = buildReport(result);
      expect(createHash("sha256").update(report).digest("hex")).toBe(g.reportSha256);
      expect(report.length).toBe(g.reportLength);
      expect(reportFilename(result.studentName)).toBe(g.reportFilename);
      expect(report).toContain("OFFICIAL EXAM REPORT");
      expect(report).toContain(NAME);
    });
  }

  it("perfect = 100/100, empty = 0, all-wrong = 0, mixed = 95, partial = 98", () => {
    const score = (name: string) => gradeExam(golden[name].answers as AnswerMap, NAME, START, SUBMIT).totalEarned;
    expect(score("perfect")).toBe(100);
    expect(score("empty")).toBe(0);
    expect(score("wrong")).toBe(0);
    expect(score("mixed")).toBe(95);
    expect(score("partial")).toBe(98);
  });

  it("partial credit is preserved on the two rubric writing tasks", () => {
    const result = gradeExam(golden.partial.answers as AnswerMap, NAME, START, SUBMIT);
    const q35 = result.questions.find((q) => q.n === 35)!;
    const q17 = result.questions.find((q) => q.n === 17)!;
    expect(q35.earned).toBe(4);
    expect(q35.max).toBe(5);
    expect(q35.parts[0].criteria?.map((c) => c.met)).toEqual([true, true, false]);
    expect(q17.earned).toBe(2);
    expect(q17.max).toBe(3);
  });

  it("every question and part of the original is present in the same order", () => {
    const now = QUESTIONS.map((q) => `${q.id}:${q.parts.map((p) => p.id).join(",")}`);
    const then = (baseline.QUESTIONS as any[]).map((q) => `${q.id}:${q.parts.map((p: any) => p.id).join(",")}`);
    expect(deepEqual(now, then)).toBe(true);
    expect(EXAM_ROOT.endsWith("grade4-english-curriculum-l1-l5")).toBe(true);
  });
});
