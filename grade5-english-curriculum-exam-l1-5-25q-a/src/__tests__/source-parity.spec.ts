/**
 * Content parity between the published exam and its source folder.
 *
 * The source of truth for the educational content is
 * `grade-5-english-curriculum-exam-L1-5 (25Q) A` (kept untouched).
 * This test proves `grade5-english-curriculum-exam-l1-5-25q-a` ships the
 * exact same paper: byte-identical `src/data/exam.ts`, exact question and
 * sub-item counts (25 questions, 98 sub-items, 100 marks), exact passages,
 * tables, prompts, options, answers, accepted answers, and explanations,
 * including documented source quirks preserved without silent edits.
 */
import { createHash } from "node:crypto";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import * as finalExam from "@/data/exam";
import * as sourceExam from "../../../grade-5-english-curriculum-exam-L1-5 (25Q) A/src/data/exam";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PROJECT = path.resolve(HERE, "..", "..");
const REPO = path.resolve(PROJECT, "..");
const SOURCE_DIR = path.join(REPO, "grade-5-english-curriculum-exam-L1-5 (25Q) A");
const SOURCE_DATA_FILE = path.join(SOURCE_DIR, "src", "data", "exam.ts");
const FINAL_DATA_FILE = path.join(PROJECT, "src", "data", "exam.ts");

function walkTs(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walkTs(full));
    else if (/\.(ts|tsx)$/.test(entry)) out.push(full);
  }
  return out;
}

describe("Source parity — published paper matches source verbatim", () => {
  it("keeps src/data/exam.ts byte-identical (length & SHA-256) to the source", () => {
    const source = readFileSync(SOURCE_DATA_FILE);
    const published = readFileSync(FINAL_DATA_FILE);
    expect(published.length).toBe(source.length);
    expect(createHash("sha256").update(published).digest("hex")).toBe(
      createHash("sha256").update(source).digest("hex"),
    );
  });

  it("publishes identical QUESTIONS, LESSON_TITLES, LESSON_COUNTS, PASSAGES and TOTAL_MARKS", () => {
    expect(finalExam.QUESTIONS).toEqual(sourceExam.QUESTIONS);
    expect(finalExam.LESSON_TITLES).toEqual(sourceExam.LESSON_TITLES);
    expect(finalExam.LESSON_COUNTS).toEqual(sourceExam.LESSON_COUNTS);
    expect(finalExam.PASSAGES).toEqual(sourceExam.PASSAGES);
    expect(finalExam.TOTAL_MARKS).toBe(sourceExam.TOTAL_MARKS);
  });

  it("matches exact audited counts: 25 main questions, 98 sub-items, 100 marks", () => {
    expect(finalExam.QUESTIONS).toHaveLength(25);
    expect(finalExam.TOTAL_MARKS).toBe(100);

    const allItems = finalExam.QUESTIONS.flatMap((q) => q.items);
    expect(allItems).toHaveLength(98);
    expect(allItems.reduce((s, it) => s + it.marks, 0)).toBe(100);

    const byKind: Record<string, number> = {};
    for (const it of allItems) byKind[it.kind] = (byKind[it.kind] ?? 0) + 1;
    expect(byKind).toEqual({
      text: 40,
      mc: 48,
      tf: 8,
      order: 2,
    });

    // 24 questions with 4x1-mark parts + q18 with 2x2-mark order parts
    for (const q of finalExam.QUESTIONS) {
      const qMarks = q.items.reduce((s, it) => s + it.marks, 0);
      expect(qMarks).toBe(4);
      if (q.id === "q18") {
        expect(q.items).toHaveLength(2);
        expect(q.items.every((it) => it.kind === "order" && it.marks === 2)).toBe(true);
      } else {
        expect(q.items).toHaveLength(4);
        expect(q.items.every((it) => it.marks === 1)).toBe(true);
      }
    }
  });

  it("maintains exact lesson distribution (5 questions / 20 marks per lesson) & interleaving", () => {
    for (const lesson of [1, 2, 3, 4, 5] as const) {
      const qs = finalExam.QUESTIONS.filter((q) => q.lesson === lesson);
      expect(qs).toHaveLength(5);
      const marks = qs.flatMap((q) => q.items).reduce((s, it) => s + it.marks, 0);
      expect(marks).toBe(20);
    }

    for (let i = 1; i < finalExam.QUESTIONS.length; i++) {
      expect(finalExam.QUESTIONS[i].lesson).not.toBe(finalExam.QUESTIONS[i - 1].lesson);
    }
  });

  it("carries the 2 curriculum passages, 3 tables, and zero external audio/image URLs", () => {
    expect(Object.keys(finalExam.PASSAGES)).toEqual(["A", "B"]);
    expect(finalExam.QUESTIONS.filter((q) => q.passage === "A").map((q) => q.id)).toEqual([
      "q04",
      "q19",
    ]);
    expect(finalExam.QUESTIONS.filter((q) => q.passage === "B").map((q) => q.id)).toEqual(["q12"]);
    expect(finalExam.QUESTIONS.filter((q) => q.table).map((q) => q.id)).toEqual([
      "q01",
      "q09",
      "q13",
    ]);
    const rawData = readFileSync(FINAL_DATA_FILE, "utf8");
    expect(rawData).not.toMatch(/https?:\/\//i);
    expect(rawData).not.toMatch(/\.mp3|\.wav|\.png|\.jpg/i);
  });

  it("preserves documented source quirks verbatim without silent edits", () => {
    const byId = new Map(finalExam.QUESTIONS.map((q) => [q.id, q]));
    expect(byId.get("q07")!.instruction).toContain("Write each time in numbers");
    expect(byId.get("q07")!.items.every((it) => it.kind === "mc")).toBe(true);

    expect(byId.get("q08")!.instruction).toContain("Write the number");
    expect(byId.get("q08")!.items.every((it) => it.kind === "mc")).toBe(true);

    expect(byId.get("q09")!.items[1].answer).toBe("secondary");
    expect(byId.get("q12")!.items[2].explain).toContain("**or hard**");

    const q14a = byId.get("q14")!.items[0];
    expect(q14a.kind).toBe("text");
    if (q14a.kind === "text") expect(q14a.accept).toContain("n't");
    expect(byId.get("q14")!.items[3].answer).toBe("Is");

    const q16c = byId.get("q16")!.items[2];
    expect(q16c.kind).toBe("text");
    if (q16c.kind === "text") expect(q16c.accept).toContain("a white shirt");

    expect(byId.get("q21")!.instruction).toContain("one word");
    expect(byId.get("q21")!.items[0].answer).toBe("have to");

    const q25c = byId.get("q25")!.items[2];
    const q25d = byId.get("q25")!.items[3];
    if (q25c.kind === "text") expect(q25c.accept).toContain("sets");
    if (q25d.kind === "text") expect(q25d.accept).toContain("sleeps");
  });

  it("keeps static assets (hero & seal) byte-identical to source", () => {
    for (const img of ["paper-hero.jpg", "report-seal.jpg"]) {
      const src = readFileSync(path.join(SOURCE_DIR, "src", "assets", img));
      const dst = readFileSync(path.join(PROJECT, "src", "assets", img));
      expect(dst.equals(src), img).toBe(true);
    }
  });

  it("never imports from the source folder or any other exam at runtime", () => {
    const runtimeFiles = walkTs(path.join(PROJECT, "src")).filter(
      (f) => !f.includes(`${path.sep}__tests__${path.sep}`),
    );
    const importRe = /(?:from|import)\s*\(?\s*["']([^"']+)["']/g;
    for (const file of runtimeFiles) {
      const text = readFileSync(file, "utf8");
      for (const m of text.matchAll(importRe)) {
        const spec = m[1];
        expect(spec, file).not.toMatch(/grade-5-english-curriculum-exam/);
        expect(spec, file).not.toMatch(/grade5-english-curriculum-exam-l1-5-[ab]/);
        expect(spec, file).not.toMatch(/grade[34]-english-curriculum/);
        expect(spec, file).not.toMatch(/grade5-math-unit1/);
      }
    }
  });
});
