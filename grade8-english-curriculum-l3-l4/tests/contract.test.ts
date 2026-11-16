/**
 * Verifies:
 *  1) Exact fidelity with the source exam `English Curriculum Lessons 3&4`
 *     (questions, parts, options, answer keys, marks, audio & texture assets).
 *  2) Exact match with the platform's reference Google Sheets submission contract
 *     (`grade5-math-unit1` field names, types, URL, token, status labels,
 *     Arabic grading ladder, and delivery constants).
 *  3) TXT report completeness and zero teacher-secret leakage.
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { EXAM_ID, EXAM_TITLE, SHEETS_TOKEN, SHEETS_URL } from "../src/config";
import { gradeExam } from "../src/exam/grading";
import { QUESTIONS, TOTAL_MARKS, TOTAL_QUESTIONS } from "../src/exam/questions";
import type { AnswerMap } from "../src/exam/types";
import { buildReport, sanitizeFilename } from "../src/lib/report";
import {
  ATTEMPT_TIMEOUT_MS,
  MAX_ATTEMPTS,
  PENDING_PREFIX,
  RETRY_DELAYS_MS,
  STATUS_AR,
  buildPayload,
  gradeLabel,
  newAttemptId,
  pendingKey,
} from "../src/lib/submit";
import { shapeOf } from "./helpers";

const ROOT = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const REPO_ROOT = path.resolve(ROOT, "..");
const SOURCE_DIR = path.join(REPO_ROOT, "English Curriculum Lessons 3&4");
const REF_CONFIG = readFileSync(
  path.join(REPO_ROOT, "grade5-math-unit1", "src", "config.ts"),
  "utf8"
);

const ATTEMPT = "8f1c2d34-1a2b-4c3d-9e4f-5a6b7c8d9e0f";
const START = 1_700_000_000_000;
const SUBMIT = START + 1_234_000;

function completeAnswers(): AnswerMap {
  const map: AnswerMap = {};
  for (const q of QUESTIONS) {
    map[q.n] = {};
    for (const p of q.parts) {
      switch (p.type) {
        case "mcq":
        case "select":
          map[q.n][p.id] = p.correctId;
          break;
        case "tf":
          map[q.n][p.id] = p.answer ? "T" : "F";
          break;
        case "order":
          map[q.n][p.id] = String(p.correctPos);
          break;
        case "text":
          map[q.n][p.id] = p.accepted[0];
          break;
      }
    }
  }
  return map;
}

/**
 * Mixed sample:
 *  - Q1 (5 × 1): all 5 correct → 5
 *  - Q2 (5 × 1): p1 wrong ("has buyed"), p5 left unanswered, p2/p3/p4 correct → 3 (partial question)
 *  - Q3 (1 × 5): wrong ("A") → 0 (wrong question)
 *  - Q10 (1 × 5): unanswered → 0 (wrong question)
 *  - Q13 (5 × 1): p2 wrong ("didn't sleep"), rest correct → 4 (partial question)
 *  - All remaining 15 questions: full marks → 75
 * Total = 5 + 3 + 0 + 0 + 4 + 75 = 87 / 100
 * Subparts: 80 total → 75 correct, 0 partial, 3 incorrect, 2 unanswered
 */
function mixedAnswers(): AnswerMap {
  const map = completeAnswers();
  map[2]["p1"] = "has buyed"; // wrong
  delete map[2]["p5"]; // unanswered
  map[3]["p1"] = "A"; // wrong (5 marks)
  delete map[10]["p1"]; // unanswered (5 marks)
  map[13]["p2"] = "didn't sleep"; // wrong
  return map;
}

describe("1. source fidelity with English Curriculum Lessons 3&4", () => {
  it("keeps questions.ts, grading.ts and types.ts byte-identical to the source folder", () => {
    for (const rel of [
      "src/exam/questions.ts",
      "src/exam/grading.ts",
      "src/exam/types.ts",
      "src/assets/world-map-texture.jpg",
    ]) {
      const srcPath = path.join(SOURCE_DIR, rel);
      const dstPath = path.join(ROOT, rel);
      expect(existsSync(srcPath), `${srcPath} missing`).toBe(true);
      expect(existsSync(dstPath), `${dstPath} missing`).toBe(true);
      expect(readFileSync(dstPath).equals(readFileSync(srcPath)), `${rel} differs from source`).toBe(
        true
      );
    }
  });

  it("includes generated start.wav and submit.wav audio files", () => {
    for (const wav of ["start.wav", "submit.wav"]) {
      const p = path.join(ROOT, "src", "assets", "audio", wav);
      expect(existsSync(p), `${wav} missing`).toBe(true);
      const buf = readFileSync(p);
      expect(buf.subarray(0, 4).toString("ascii")).toBe("RIFF");
      expect(buf.subarray(8, 12).toString("ascii")).toBe("WAVE");
    }
  });

  it("matches exact source totals: 20 questions, 80 parts, 100 marks (50 L3 + 50 L4)", () => {
    expect(QUESTIONS).toHaveLength(TOTAL_QUESTIONS);
    expect(TOTAL_QUESTIONS).toBe(20);
    expect(TOTAL_MARKS).toBe(100);
    const totalParts = QUESTIONS.reduce((s, q) => s + q.parts.length, 0);
    expect(totalParts).toBe(80);
    expect(QUESTIONS.reduce((s, q) => s + q.marks, 0)).toBe(100);
  });
});

describe("2. payload contract == grade5-math-unit1", () => {
  it("SHEETS_URL, SHEETS_TOKEN and delivery constants match grade5-math-unit1 verbatim", () => {
    expect(REF_CONFIG).toContain(`"${SHEETS_URL}"`);
    expect(REF_CONFIG).toContain(`"${SHEETS_TOKEN}"`);
    expect(MAX_ATTEMPTS).toBe(3);
    expect(Array.from(RETRY_DELAYS_MS)).toEqual([2000, 5000]);
    expect(ATTEMPT_TIMEOUT_MS).toBe(30000);
    expect(PENDING_PREFIX).toBe(`pending:${EXAM_ID}:`);
    expect(pendingKey(ATTEMPT)).toBe(`pending:grade8-english-curriculum-l3-l4:${ATTEMPT}`);
  });

  it("EXAM_ID equals folder name and EXAM_TITLE equals official card title", () => {
    expect(EXAM_ID).toBe("grade8-english-curriculum-l3-l4");
    expect(EXAM_TITLE).toBe("English Curriculum Lessons 3&4");
  });

  it("payload, summary, lessons and details match exact field names and types", () => {
    const answers = mixedAnswers();
    const result = gradeExam(answers);
    const reportText = buildReport({
      studentName: "Yazan Khalil",
      result,
      startedAt: START,
      finishedAt: SUBMIT,
    });
    const payload = buildPayload({
      attemptId: ATTEMPT,
      studentName: "Yazan Khalil",
      startedAt: START,
      finishedAt: SUBMIT,
      answers,
      result,
      reportText,
    });

    expect(shapeOf(payload as unknown as Record<string, unknown>)).toEqual({
      token: "string",
      attemptId: "string",
      examId: "string",
      examTitle: "string",
      studentName: "string",
      startAt: "string",
      submitAt: "string",
      elapsedSec: "number",
      summary: "object",
      lessons: "array",
      details: "array",
      reportText: "string",
    });

    expect(shapeOf(payload.summary as unknown as Record<string, unknown>)).toEqual({
      total: "number",
      max: "number",
      percentage: "number",
      gradeLabel: "string",
      fullQuestions: "number",
      partialQuestions: "number",
      wrongQuestions: "number",
      correctSubparts: "number",
      partialSubparts: "number",
      wrongSubparts: "number",
      unansweredSubparts: "number",
    });

    expect(payload.lessons).toHaveLength(2);
    expect(shapeOf(payload.lessons[0] as unknown as Record<string, unknown>)).toEqual({
      title: "string",
      awarded: "number",
      max: "number",
    });

    expect(payload.details).toHaveLength(80);
    expect(shapeOf(payload.details[0] as unknown as Record<string, unknown>)).toEqual({
      q: "number",
      qTitle: "string",
      lessons: "string",
      label: "string",
      status: "string",
      awarded: "number",
      marks: "number",
      studentAnswer: "string",
      correctAnswer: "string",
    });
  });

  it("status labels and all 6 Arabic gradeLabel boundaries match the reference", () => {
    expect(STATUS_AR.correct).toBe("إجابة صحيحة");
    expect(STATUS_AR.partial).toBe("إجابة صحيحة جزئياً");
    expect(STATUS_AR.incorrect).toBe("إجابة خاطئة");
    expect(STATUS_AR.unanswered).toBe("لم يُجب");

    const boundaries: [number, string][] = [
      [100, "ممتاز"],
      [95, "ممتاز"],
      [94.99, "جيد جداً"],
      [94, "جيد جداً"],
      [85, "جيد جداً"],
      [84.99, "جيد"],
      [84, "جيد"],
      [75, "جيد"],
      [74.99, "مقبول"],
      [74, "مقبول"],
      [65, "مقبول"],
      [64.99, "ضعيف"],
      [64, "ضعيف"],
      [50, "ضعيف"],
      [49.99, "يحتاج إلى دعم"],
      [49, "يحتاج إلى دعم"],
      [0, "يحتاج إلى دعم"],
    ];
    for (const [pct, expected] of boundaries) {
      expect(gradeLabel(pct), `pct=${pct}`).toBe(expected);
    }
  });

  it("payload numbers reflect correct, wrong, partial and unanswered items consistently", () => {
    const answers = mixedAnswers();
    const result = gradeExam(answers);
    const reportText = buildReport({
      studentName: "Yazan Khalil",
      result,
      startedAt: START,
      finishedAt: SUBMIT,
    });
    const payload = buildPayload({
      attemptId: ATTEMPT,
      studentName: "Yazan Khalil",
      startedAt: START,
      finishedAt: SUBMIT,
      answers,
      result,
      reportText,
    });

    expect(payload.token).toBe(SHEETS_TOKEN);
    expect(payload.attemptId).toBe(ATTEMPT);
    expect(payload.examId).toBe(EXAM_ID);
    expect(payload.examTitle).toBe(EXAM_TITLE);
    expect(payload.studentName).toBe("Yazan Khalil");
    expect(payload.startAt).toBe(new Date(START).toISOString());
    expect(payload.submitAt).toBe(new Date(SUBMIT).toISOString());
    expect(payload.elapsedSec).toBe(1234);

    expect(payload.summary.total).toBe(87);
    expect(payload.summary.max).toBe(100);
    expect(payload.summary.percentage).toBe(87);
    expect(payload.summary.gradeLabel).toBe("جيد جداً");
    expect(payload.summary.fullQuestions).toBe(16);
    expect(payload.summary.partialQuestions).toBe(2);
    expect(payload.summary.wrongQuestions).toBe(2);
    expect(payload.summary.correctSubparts).toBe(75);
    expect(payload.summary.partialSubparts).toBe(0);
    expect(payload.summary.wrongSubparts).toBe(3);
    expect(payload.summary.unansweredSubparts).toBe(2);

    const q2p1 = payload.details.find((d) => d.q === 2 && d.label === "p1");
    expect(q2p1?.status).toBe("إجابة خاطئة");
    expect(q2p1?.awarded).toBe(0);
    expect(q2p1?.studentAnswer).toBe("has buyed");

    const q2p5 = payload.details.find((d) => d.q === 2 && d.label === "p5");
    expect(q2p5?.status).toBe("لم يُجب");
    expect(q2p5?.awarded).toBe(0);
    expect(q2p5?.studentAnswer).toBe("— (no answer)");

    const q1p1 = payload.details.find((d) => d.q === 1 && d.label === "p1");
    expect(q1p1?.status).toBe("إجابة صحيحة");
    expect(q1p1?.awarded).toBe(1);

    expect(payload.details.reduce((s, d) => s + d.marks, 0)).toBe(100);
    expect(payload.details.reduce((s, d) => s + d.awarded, 0)).toBe(87);
    expect(payload.lessons).toEqual([
      { title: "Lesson 3 · Let's Discover", awarded: 38, max: 50 },
      { title: "Lesson 4 · Interesting Destinations", awarded: 49, max: 50 },
    ]);
    expect(payload.reportText).toBe(reportText);
  });

  it("builds a complete TXT report without leaking teacher-only secrets or Arabic grade labels", () => {
    const answers = mixedAnswers();
    const result = gradeExam(answers);
    const report = buildReport({
      studentName: "Yazan Khalil",
      result,
      startedAt: START,
      finishedAt: SUBMIT,
    });

    expect(report).toContain("English Curriculum Lessons 3&4");
    expect(report).toContain("Yazan Khalil");
    expect(report).toContain("87 / 100");
    expect(report).toContain("87%");
    expect(report).toContain("00:20:34");
    expect(report).toContain("Lesson 3 · Let's Discover : 38 / 50");
    expect(report).toContain("Lesson 4 · Interesting Destinations : 49 / 50");
    expect(report).toContain("Passage    : An Island Journey");
    expect(report).toContain("Passage    : Welcome to Riverton");
    for (let n = 1; n <= 20; n++) {
      expect(report).toContain(`QUESTION ${n} —`);
    }
    expect(report).toContain("المهندس سومر شاهين");
    expect(report).toContain("0930215022");

    // No teacher-only fields in TXT report
    expect(report).not.toContain(SHEETS_TOKEN);
    expect(report).not.toContain(ATTEMPT);
    for (const label of ["ممتاز", "جيد جداً", "مقبول", "ضعيف", "يحتاج إلى دعم", "التقدير"]) {
      expect(report).not.toContain(label);
    }

    expect(sanitizeFilename("Yazan Khalil")).toBe("Yazan-Khalil");
    expect(sanitizeFilename("يزن خليل")).toBe("student");
  });

  it("newAttemptId produces unique ids", () => {
    const ids = new Set(Array.from({ length: 500 }, () => newAttemptId()));
    expect(ids.size).toBe(500);
  });
});
