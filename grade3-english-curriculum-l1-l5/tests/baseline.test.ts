/**
 * Baseline preservation & exam structure checks:
 *   1) Untouched original files match their SHA-256 hashes from `Mira's L1-L5 Test`.
 *   2) Exact question count (35), subpart count (50), total marks (100),
 *      vocabulary count (13), and per-lesson mark distribution (L1=19, L2=21, L3=26, L4=12, L5=22).
 *   3) Deterministic grading of all-correct, blank, wrong, and partial multi-part attempts,
 *      plus TXT report completeness.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { EXAM_META, LESSON_TITLES, QUESTIONS, TOTAL_MARKS, VOCAB_COUNT, questionMarks } from "../src/data/examData";
import { gradeFullExam } from "../src/logic/grading";
import { buildTextReport } from "../src/logic/report";
import type { AnswersMap, ExamSession } from "../src/types";
import { sha256 } from "./helpers";

const ROOT = path.resolve(fileURLToPath(new URL("..", import.meta.url)));

const EXPECTED_ORIGINAL_HASHES: Record<string, string> = {
  "src/data/examData.ts": "bcdf94fa99ae7ba62cb78b473ee1ed37b48e2d9b14fd2c594c4a95d69854c531",
  "src/logic/grading.ts": "0c69451d92ff059720680ef83f072a54d451536a06d76fa3e90e8c169a8b5b7b",
  "src/logic/report.ts": "825f5ecaf1c7d39cd0051ebef1bc491df8c28e3318766de14261efd961cd5524",
  "src/logic/storage.ts": "2cb1c2401fda1f008d7db94b1221c6cbfa4d9242f8f1167b02f87037c47a7e38",
  "src/components/Decor.tsx": "8384695b1a589893688cfab428ebda547371066e7e10a3b3b204a386a400320e",
  "src/components/ExamScreen.tsx": "222b0ebc9783e16576d069c3ec73f5ce1521f5ec5688b58ad20cb341fafc4467",
  "src/components/GardenFooter.tsx": "2e50c62a4af79661c6f2124dc53d83ce8549fe25c0f6a1cb9581c3df3d9c785a",
  "src/components/QuestionCard.tsx": "07d20e4fe4bcdb655308d59ca1fbb1a5e9cbfe044a103cfc45a292c2f38a147e",
  "src/components/TeacherKey.tsx": "1e8936d6579fa06cdaf1ee57ad19dbbf5bbf9c1302fad35750ef5b20645260ac",
  "src/components/parts.tsx": "c6dd0a33a68187c509b03055af18e3cfc12a9c629df8b085fde7db6ee37c1523",
  "src/index.css": "0d97c4ec2a232a90db7bd8e7519f94592a425107e1751054fd4ce9129044e911",
  "src/main.tsx": "f268dc44f71240012de0cfb1569d8ac906265cccd45eb3a99059c1a663d2f830",
  "src/utils/cn.ts": "d1f1e0d62cb8d8d1e04c26e14de842d8a151f75812d81b046c65b5d1fe8e4b27",
  "tsconfig.json": "2a760f56fa49b96935783a2c3b4ce63d67e4547fdace88c4f4361a0c4fc10848",
  "vite.config.ts": "18dd184b9091357fe23797ee047138e6af7663b59697ac45d6c3c219522db9fa",
};

function allCorrectAnswers(): AnswersMap {
  const map: AnswersMap = {};
  for (const q of QUESTIONS) {
    map[q.id] = {};
    for (const p of q.parts) {
      if (p.kind === "mcq" || p.kind === "select") map[q.id][p.id] = p.correctOptionId!;
      else if (p.kind === "tf") map[q.id][p.id] = String(p.correctBool);
      else if (p.kind === "text") map[q.id][p.id] = p.accepted![0];
      else if (p.kind === "order") map[q.id][p.id] = ["t3", "t4", "t1", "t5", "t2"];
      else if (p.kind === "writing") map[q.id][p.id] = "There is a library in my school.";
    }
  }
  return map;
}

describe("1. original content & engine preserved byte-for-byte", () => {
  it.each(Object.entries(EXPECTED_ORIGINAL_HASHES))(
    "%s is byte-identical to Mira's L1-L5 Test",
    (relPath, expectedHash) => {
      const actual = sha256(readFileSync(path.join(ROOT, relPath)));
      expect(actual).toBe(expectedHash);
    }
  );
});

describe("2. exact question, branch, lesson and mark counts", () => {
  it("has 35 main questions, 50 parts, 13 vocabulary questions and 100 total marks", () => {
    expect(QUESTIONS).toHaveLength(35);
    expect(EXAM_META.totalQuestions).toBe(35);
    expect(VOCAB_COUNT).toBe(13);
    expect(EXAM_META.vocabularyQuestions).toBe(13);
    expect(QUESTIONS.reduce((s, q) => s + q.parts.length, 0)).toBe(50);
    expect(TOTAL_MARKS).toBe(100);
    expect(EXAM_META.totalMarks).toBe(100);
  });

  it("matches per-lesson question counts, branch counts and mark totals", () => {
    const byLesson = [1, 2, 3, 4, 5].map((lesson) => {
      const qs = QUESTIONS.filter((q) => q.lesson === lesson);
      return {
        lesson,
        title: LESSON_TITLES[lesson],
        questions: qs.length,
        parts: qs.reduce((s, q) => s + q.parts.length, 0),
        marks: qs.reduce((s, q) => s + questionMarks(q), 0),
      };
    });
    expect(byLesson).toEqual([
      { lesson: 1, title: "Back to School", questions: 7, parts: 8, marks: 19 },
      { lesson: 2, title: "School Subjects", questions: 8, parts: 12, marks: 21 },
      { lesson: 3, title: "My Lovely School", questions: 9, parts: 12, marks: 26 },
      { lesson: 4, title: "My Five Senses", questions: 5, parts: 6, marks: 12 },
      { lesson: 5, title: "Revision 1", questions: 6, parts: 12, marks: 22 },
    ]);
  });

  it("grades full-correct (96 + 4 pending), blank (0), wrong and partial multi-part attempts", () => {
    const full = gradeFullExam(allCorrectAnswers());
    expect(full.earned).toBe(96);
    expect(full.maxMarks).toBe(100);
    expect(full.pendingMarks).toBe(4);
    expect(full.percentage).toBe(96);
    expect(full.fullyCorrect).toBe(34);
    expect(full.reviewCount).toBe(1);

    const blank = gradeFullExam({});
    expect(blank.earned).toBe(0);
    expect(blank.incorrect).toBe(35);

    const partial = gradeFullExam({
      4: { a: "23", b: "wrong", c: "30" }, // 2 / 3
      12: { a: "eye", b: "wrong", c: "hand" }, // 2 / 3
      23: { a: "two", b: "downstairs", c: "false", d: "wrong" }, // 4 / 9
      29: { a: "There is a library." }, // 0 / 4 pending review
    });
    expect(partial.earned).toBe(8);
    expect(partial.partial).toBe(3);
    expect(partial.reviewCount).toBe(1);

    const session: ExamSession = {
      version: 1,
      studentName: "Mira Samer",
      startedAt: 1_700_000_000_000,
      currentQuestion: 35,
      answers: allCorrectAnswers(),
      submitted: true,
      submittedAt: 1_700_000_600_000,
      finalElapsedMs: 600_000,
    };
    const txt = buildTextReport(session, full);
    expect(txt).toContain("Mira Samer");
    expect(txt).toContain("96 / 100");
    expect(txt).toContain("00:10:00");
    expect(txt).toContain("TEACHER REVIEW");
  });
});
