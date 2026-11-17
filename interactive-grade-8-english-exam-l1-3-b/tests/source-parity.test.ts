import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { EXAM_ID, EXAM_TITLE, SHEETS_TOKEN, SHEETS_URL } from "../src/config";
import {
  ALL_PARTS,
  LESSONS,
  LESSON_TARGETS,
  PASSAGES,
  QUESTIONS,
  TOTAL_MARKS,
  TOTAL_PARTS,
  lessonMarks,
  lessonQuestions,
  questionMarks,
} from "../src/data/exam";
import { ATTEMPT_KEY, MUTE_KEY, PREV_REPORT_KEY, REPORT_KEY } from "../src/lib/storage";
import { PENDING_PREFIX, newAttemptId } from "../src/lib/submit";

const EXAM_ROOT = process.cwd();
const REPO_ROOT = resolve(EXAM_ROOT, "..");
const SOURCE_DIR = resolve(REPO_ROOT, "interactive-grade-8-english-exam-L1-3 B");
const MODEL_A_DIR = resolve(REPO_ROOT, "interactive-grade-8-english-exam-l1-3-a");
const REF_SHEETS_DIR = resolve(REPO_ROOT, "grade5-math-unit1");

function sha256(filePath: string): string {
  return createHash("sha256").update(readFileSync(filePath)).digest("hex");
}

function walkFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walkFiles(p) : [p];
  });
}

describe("Source parity (content, assets, structure and marks)", () => {
  it("preserves src/data/exam.ts and both source JPEG assets byte-for-byte (SHA-256)", () => {
    const parityFiles = [
      "src/data/exam.ts",
      "src/assets/hero.jpg",
      "src/assets/journey.jpg",
    ];
    for (const rel of parityFiles) {
      const targetFile = resolve(EXAM_ROOT, rel);
      const sourceFile = resolve(SOURCE_DIR, rel);
      expect(existsSync(targetFile), `missing ${rel}`).toBe(true);
      expect(existsSync(sourceFile), `missing source ${rel}`).toBe(true);
      expect(sha256(targetFile)).toBe(sha256(sourceFile));
      expect(readFileSync(targetFile)).toEqual(readFileSync(sourceFile));
    }
    // Confirm the source only had those two image assets
    const sourceAssets = readdirSync(resolve(SOURCE_DIR, "src/assets")).sort();
    expect(sourceAssets).toEqual(["hero.jpg", "journey.jpg"]);
  });

  it("bundles valid local Cairo WOFF2 font files and has no external Google Fonts links", () => {
    for (const font of [
      "cairo-arabic-wght-normal.woff2",
      "cairo-latin-wght-normal.woff2",
      "cairo-latin-ext-wght-normal.woff2",
    ]) {
      const buf = readFileSync(resolve(EXAM_ROOT, "src/assets/fonts", font));
      expect(buf.subarray(0, 4).toString("ascii")).toBe("wOF2");
    }
    const indexHtml = readFileSync(resolve(EXAM_ROOT, "index.html"), "utf8");
    expect(indexHtml).toContain(`<title>${EXAM_TITLE}</title>`);
    expect(indexHtml).not.toMatch(/fonts\.googleapis\.com|fonts\.gstatic\.com/);
  });

  it("matches exact source counts: 30 questions, 47 parts, 100 marks (33 / 34 / 33), 2 passages", () => {
    expect(QUESTIONS).toHaveLength(30);
    expect(QUESTIONS.map((q) => q.n)).toEqual(Array.from({ length: 30 }, (_, i) => i + 1));

    // Lessons: 10 questions each, marks 33 + 34 + 33 = 100, parts 14 + 19 + 14 = 47
    expect(LESSONS.map((l) => l.id)).toEqual([1, 2, 3]);
    expect(LESSONS.map((l) => l.title)).toEqual([
      "Future Plans",
      "School Challenges",
      "Let's Discover",
    ]);
    expect(LESSONS.map((l) => lessonQuestions(l.id).length)).toEqual([10, 10, 10]);
    expect(LESSONS.map((l) => lessonMarks(l.id))).toEqual([33, 34, 33]);
    expect(LESSON_TARGETS).toEqual({ 1: 33, 2: 34, 3: 33 });
    expect(
      LESSONS.map((l) =>
        lessonQuestions(l.id).reduce((s, q) => s + q.parts.length, 0),
      ),
    ).toEqual([14, 19, 14]);

    // Total parts & unique IDs
    expect(TOTAL_PARTS).toBe(47);
    expect(ALL_PARTS).toHaveLength(47);
    expect(new Set(ALL_PARTS.map((p) => p.id)).size).toBe(47);
    expect(ALL_PARTS.every((p) => p.marks > 0 && Number.isInteger(p.marks))).toBe(true);
    expect(TOTAL_MARKS).toBe(100);
    expect(QUESTIONS.reduce((s, q) => s + questionMarks(q), 0)).toBe(100);

    // Part kind breakdown: 22 choice (20 MCQ + 2 T/F), 21 text, 4 longtext
    const choiceParts = ALL_PARTS.filter((p) => p.kind === "choice");
    const tfParts = choiceParts.filter(
      (p) => p.options.length === 2 && p.options[0] === "True" && p.options[1] === "False",
    );
    const textParts = ALL_PARTS.filter((p) => p.kind === "text");
    const longParts = ALL_PARTS.filter((p) => p.kind === "longtext");
    expect(choiceParts).toHaveLength(22);
    expect(tfParts).toHaveLength(2);
    expect(textParts).toHaveLength(21);
    expect(longParts).toHaveLength(4);

    // Multi-part vs single-part questions: 14 multi-part, 16 single-part
    expect(QUESTIONS.filter((q) => q.parts.length > 1)).toHaveLength(14);
    expect(QUESTIONS.filter((q) => q.parts.length === 1)).toHaveLength(16);

    // Reading passages: exactly the two official textbook texts
    expect(PASSAGES).toHaveLength(2);
    expect(PASSAGES.map((p) => ({ lesson: p.lesson, title: p.title }))).toEqual([
      { lesson: 1, title: "Schools in the Past, Present and Future" },
      { lesson: 3, title: "My Amazing Journey" },
    ]);

    // Every question has instruction, topic, source and explanation; no listening/vocabulary items
    for (const q of QUESTIONS) {
      expect(q.instruction.trim().length).toBeGreaterThan(0);
      expect(q.topic.trim().length).toBeGreaterThan(0);
      expect(q.source.trim().length).toBeGreaterThan(0);
      expect(q.explanation.trim().length).toBeGreaterThan(0);
      expect(q.instruction).not.toMatch(/\blisten|\bvocabulary\b/i);
    }
  });
});

describe("Independence, storage key isolation & platform registration", () => {
  it("uses exact EXAM_ID, EXAM_TITLE and verbatim grade5-math-unit1 Sheets credentials", () => {
    expect(EXAM_ID).toBe("interactive-grade-8-english-exam-l1-3-b");
    expect(EXAM_TITLE).toBe("Interactive Grade 8 English Exam L1-3 B");
    const refCfg = readFileSync(resolve(REF_SHEETS_DIR, "src/config.ts"), "utf8");
    expect(refCfg).toContain(`SHEETS_URL = "${SHEETS_URL}"`);
    expect(refCfg).toContain(`SHEETS_TOKEN = "${SHEETS_TOKEN}"`);
  });

  it("namespaces all localStorage keys strictly under EXAM_ID and generates unique attemptIds", () => {
    const keys = [ATTEMPT_KEY, REPORT_KEY, PREV_REPORT_KEY, MUTE_KEY, PENDING_PREFIX];
    expect(new Set(keys).size).toBe(keys.length);
    for (const k of keys) {
      expect(k).toContain(EXAM_ID);
      expect(k).not.toContain("interactive-grade-8-english-exam-l1-3-a");
      expect(k).not.toContain("g8-unit1-modelB");
    }
    expect(PENDING_PREFIX).toBe("pending:interactive-grade-8-english-exam-l1-3-b:");
    const ids = new Set(Array.from({ length: 50 }, () => newAttemptId()));
    expect(ids.size).toBe(50);
  });

  it("has zero runtime imports or shared identifiers with Model A, source folder, or other exams", () => {
    const srcFiles = walkFiles(resolve(EXAM_ROOT, "src")).filter((f) => /\.(ts|tsx)$/.test(f));
    expect(srcFiles.length).toBeGreaterThan(0);
    for (const file of srcFiles) {
      const code = readFileSync(file, "utf8");
      expect(code).not.toMatch(
        /g8-unit1-modelB|g8u1m1\.|interactive-grade-8-english-exam-l1-3-a|interactive-grade-8-english-exam-L1-3 A|interactive-grade-8-english-exam-L1-3 B|grade8-english-curriculum|grade8-english-l1l2/,
      );
      for (const [, spec] of code.matchAll(/(?:from\s+|import\s+)["']([^"']+)["']/g)) {
        if (spec.startsWith(".")) {
          const target = resolve(file, "..", spec);
          expect(target.startsWith(resolve(EXAM_ROOT, "src") + "/")).toBe(true);
        } else {
          expect(spec.startsWith("@/") || !spec.startsWith("/")).toBe(true);
        }
      }
    }

    // Confirm distinct questions from Model A
    const modelAData = readFileSync(resolve(MODEL_A_DIR, "src/data/exam.ts"), "utf8");
    const modelBData = readFileSync(resolve(EXAM_ROOT, "src/data/exam.ts"), "utf8");
    expect(modelBData).not.toBe(modelAData);
  });

  it("is indexed under Grade 8 · Semester 1 · English and source folder is excluded from builds", () => {
    const examsJson = JSON.parse(readFileSync(resolve(REPO_ROOT, "landing/exams.json"), "utf8"));
    expect(examsJson.overrides[EXAM_ID]).toEqual({
      grade: 8,
      subject: "english",
      semester: 1,
      title: EXAM_TITLE,
    });
    // Model A remains intact as its own card
    expect(examsJson.overrides["interactive-grade-8-english-exam-l1-3-a"]).toEqual({
      grade: 8,
      subject: "english",
      semester: 1,
      title: "Interactive Grade 8 English Exam L1-3 A",
    });
    // Source folder is never listed in overrides
    expect(examsJson.overrides["interactive-grade-8-english-exam-L1-3 B"]).toBeUndefined();

    const deployYml = readFileSync(
      resolve(REPO_ROOT, ".github/workflows/deploy.yml"),
      "utf8",
    );
    const buildSh = readFileSync(
      resolve(REPO_ROOT, "landing/scripts/build-exams.sh"),
      "utf8",
    );
    for (const requiredExclusion of [
      '"English Curriculum Lessons 3&4"',
      '"English_L1L2 Test"',
      '"grade-3-english-curriculum-exam-L1-5-A"',
      '"grade-3-english-curriculum-exam-L1-5-B"',
      '"grade-4-english-curriculum-exam-L1-5-A"',
      '"grade-4-english-curriculum-exam-L1-5-B"',
      '"grade-5-english-curriculum-exam-L1-5-A"',
      '"grade-5-english-curriculum-exam-L1-5-B"',
      '"grade-5-english-curriculum-exam-L1-5 (25Q) A"',
      '"interactive-grade-8-english-exam-L1-3 A"',
      '"interactive-grade-8-english-exam-L1-3 B"',
    ]) {
      expect(deployYml).toContain(requiredExclusion);
      expect(buildSh).toContain(requiredExclusion);
    }
  });
});
