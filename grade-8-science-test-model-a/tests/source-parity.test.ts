import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  ALL_SUBS,
  CHEMISTRY_COUNT,
  CHEMISTRY_MARKS,
  ORIGINAL_IT_PROBLEMS,
  PHYSICS_COUNT,
  PHYSICS_MARKS,
  QUESTIONS,
  SOURCE_MAP,
  TOTAL_MARKS,
} from "@/data/exam";
import { SOLUTIONS } from "@/data/solutions";
import { formatPointsBadge, renderTexToString } from "@/lib/math";
import { lessonTitle } from "@/lib/report";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SOURCE_DIR = path.resolve(HERE, "../../grade-8-science-test-model-A");

describe("Source parity — content is carried over unchanged", () => {
  it("keeps the source exam data files byte-identical (no rewording, no answer edits)", () => {
    if (!existsSync(SOURCE_DIR)) {
      expect(true).toBe(true); // source upload not present in this checkout
      return;
    }
    for (const relative of ["src/data/exam.ts", "src/data/solutions.ts"]) {
      const original = readFileSync(path.join(SOURCE_DIR, relative), "utf8");
      const published = readFileSync(path.resolve(HERE, "..", relative), "utf8");
      expect(published, `${relative} must match the uploaded source`).toBe(original);
    }
  });

  it("has 24 main questions: 12 physics + 12 chemistry, interleaved", () => {
    expect(QUESTIONS).toHaveLength(24);
    expect(PHYSICS_COUNT).toBe(12);
    expect(CHEMISTRY_COUNT).toBe(12);
    for (let i = 0; i < QUESTIONS.length - 1; i += 1) {
      expect(QUESTIONS[i].subject).not.toBe(QUESTIONS[i + 1].subject);
    }
    expect(QUESTIONS[0].subject).toBe("chemistry");
    expect(QUESTIONS.map((q) => q.n)).toEqual(Array.from({ length: 24 }, (_, i) => i + 1));
  });

  it("keeps 100 marks distributed 50/50, with sub-part marks summing to each question", () => {
    expect(PHYSICS_MARKS).toBe(50);
    expect(CHEMISTRY_MARKS).toBe(50);
    expect(TOTAL_MARKS).toBe(100);
    for (const q of QUESTIONS) {
      const sum = q.subs.reduce((s, x) => s + x.points, 0);
      expect(Math.abs(sum - q.marks)).toBeLessThan(1e-9);
      expect(q.subs.length).toBeGreaterThan(0);
    }
    for (const subject of ["physics", "chemistry"] as const) {
      const group = QUESTIONS.filter((q) => q.subject === subject);
      expect(group.filter((q) => q.marks === 4)).toHaveLength(10);
      expect(group.filter((q) => q.marks === 5)).toHaveLength(2);
    }
  });

  it("reports the real totals: 24 questions, 64 graded sub-parts, 100 marks", () => {
    expect(ALL_SUBS).toHaveLength(64);
    const byPoints = ALL_SUBS.reduce<Record<string, number>>((acc, x) => {
      acc[String(x.s.points)] = (acc[String(x.s.points)] ?? 0) + 1;
      return acc;
    }, {});
    expect(byPoints).toEqual({ "1": 30, "1.5": 4, "2": 28, "4": 2 });
    expect(ALL_SUBS.reduce((s, x) => s + x.s.points, 0)).toBe(100);
    const kinds = ALL_SUBS.reduce<Record<string, number>>((acc, x) => {
      acc[x.s.kind] = (acc[x.s.kind] ?? 0) + 1;
      return acc;
    }, {});
    expect(kinds).toEqual({ text: 35, numeric: 21, matrix: 3, draw: 3, lewis: 2 });
    expect(ALL_SUBS.filter((x) => x.q.subject === "physics")).toHaveLength(33);
    expect(ALL_SUBS.filter((x) => x.q.subject === "chemistry")).toHaveLength(31);
  });

  it("keeps the five original independent-test problems 1, 4, 7, 11, 14 with their source images", () => {
    const originals = QUESTIONS.filter((q) => q.src.origin === "independent-test");
    expect(originals.map((q) => q.src.itProblem).sort((a, b) => (a ?? 0) - (b ?? 0))).toEqual(
      ORIGINAL_IT_PROBLEMS,
    );
    expect(originals.map((q) => q.src.itImage).sort((a, b) => (a ?? 0) - (b ?? 0))).toEqual([
      1, 4, 7, 11, 14,
    ]);
  });

  it("keeps the numeric answers of the source problems", () => {
    const value = (qid: string, sid: string): number => {
      const s = QUESTIONS.find((q) => q.id === qid)!.subs.find((x) => x.id === sid)!;
      if (s.answer.kind !== "numeric") throw new Error("not numeric");
      return s.answer.value;
    };
    expect(value("ph-it-01", "p1-mag")).toBe(60);
    expect(value("ph-it-01", "p1-d1")).toBe(1.5);
    expect(value("ph-it-01", "p1-d2")).toBe(0.5);
    expect(value("ph-it-04", "p4-mag")).toBe(60);
    expect(value("ph-it-04", "p4-d1")).toBe(0.9);
    expect(value("ph-it-04", "p4-d2")).toBe(0.3);
    expect(value("ph-it-07", "p7-mag")).toBe(5);
    expect(value("ph-it-07", "p7-alpha")).toBeCloseTo(53.13, 2);
    expect(value("ph-it-14", "p14-mag")).toBeCloseTo(138.6, 1);
    expect(value("ph-it-14", "p14-alpha")).toBe(30);
    expect(value("ph-book-03", "rs-1")).toBe(40);
    expect(value("ph-book-06", "dp-1")).toBe(60);
    expect(value("ph-book-06", "dp-2")).toBe(2);
  });

  it("supports only the question kinds that exist in the source", () => {
    const kinds = new Set(ALL_SUBS.map((x) => x.s.kind));
    expect([...kinds].sort()).toEqual(["draw", "lewis", "matrix", "numeric", "text"]);
    // No multiple-choice item exists in the source exam.
    expect([...kinds]).not.toContain("choice");
    expect([...kinds]).not.toContain("mcq");
  });

  it("carries a hidden source reference for every question", () => {
    expect(SOURCE_MAP).toHaveLength(24);
    for (const q of QUESTIONS) {
      expect(q.src.subject).toBe(q.subject);
      expect(q.src.unit).toBe("الوحدة الأولى");
      expect(q.src.lesson.length).toBeGreaterThan(3);
      expect(q.src.page.length).toBeGreaterThan(0);
      expect(q.src.skill.length).toBeGreaterThan(3);
      expect(["textbook", "independent-test"]).toContain(q.src.origin);
    }
    const chem = QUESTIONS.filter((q) => q.subject === "chemistry");
    expect(chem.filter((q) => q.src.lesson.includes("الأول"))).toHaveLength(6);
    expect(chem.filter((q) => q.src.lesson.includes("الثاني"))).toHaveLength(6);
  });

  it("folds the four curriculum lessons into a 100-mark distribution", () => {
    const totals = new Map<string, number>();
    for (const q of QUESTIONS) {
      const key = lessonTitle(q.src);
      totals.set(key, (totals.get(key) ?? 0) + q.marks);
    }
    expect([...totals.keys()].sort()).toEqual(
      [
        "الدرس الأول: الذرّة والعنصر",
        "الدرس الأول: القوى المتلاقية",
        "الدرس الثاني: الروابط الكيميائية",
        "الدرس الثاني: القوى المتوازية",
      ].sort(),
    );
    expect([...totals.values()].reduce((a, b) => a + b, 0)).toBe(100);
    expect(totals.get("الدرس الأول: القوى المتلاقية")).toBe(29);
    expect(totals.get("الدرس الثاني: القوى المتوازية")).toBe(21);
    expect(totals.get("الدرس الأول: الذرّة والعنصر")).toBe(26);
    expect(totals.get("الدرس الثاني: الروابط الكيميائية")).toBe(24);
  });

  it("has a worked solution for every question and renders all TeX tokens", () => {
    for (const q of QUESTIONS) {
      expect(SOLUTIONS[q.id], `missing solution ${q.id}`).toBeTruthy();
      expect(SOLUTIONS[q.id].steps.length).toBeGreaterThan(0);
    }
    const tokens = (text: string) => [...text.matchAll(/\[\[(.+?)\]\]/g)].map((m) => m[1]);
    for (const q of QUESTIONS) {
      for (const tok of [...tokens(q.stem), ...(q.givens ?? [])]) {
        expect(renderTexToString(tok)).toContain("katex");
      }
      for (const s of q.subs) {
        for (const tok of tokens(s.label)) expect(renderTexToString(tok)).toContain("katex");
      }
      for (const step of SOLUTIONS[q.id].steps) {
        for (const tok of tokens(step)) expect(renderTexToString(tok)).toContain("katex");
      }
    }
  });

  it("never renders marks with the forbidden abbreviation", () => {
    for (const pts of [0.5, 1, 1.5, 2, 3, 4, 5]) {
      const badge = formatPointsBadge(pts);
      expect(badge).not.toContain("در.");
      expect(badge).toMatch(/علام/);
    }
  });
});
