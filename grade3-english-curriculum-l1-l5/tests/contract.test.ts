/**
 * Verifies that the Google Sheets submission payload and delivery contract match
 * the platform's reference exam `grade5-math-unit1` in field names, types, URL,
 * token, status labels, gradeLabel scale, and delivery constants.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { EXAM_ID, EXAM_TITLE, SHEETS_TOKEN, SHEETS_URL } from "../src/config";
import { QUESTIONS, TOTAL_MARKS } from "../src/data/examData";
import { gradeFullExam } from "../src/logic/grading";
import { buildTextReport } from "../src/logic/report";
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
  type SubmissionPayload,
} from "../src/logic/submit";
import type { AnswersMap, ExamSession } from "../src/types";
import { shapeOf } from "./helpers";

const ROOT = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const REF_CONFIG = readFileSync(path.resolve(ROOT, "..", "grade5-math-unit1", "src", "config.ts"), "utf8");

const ATTEMPT = "8f1c2d34-1a2b-4c3d-9e4f-5a6b7c8d9e0f";
const START = 1_700_000_000_000;
const SUBMIT = START + 1_234_000;

function sampleAnswers(): AnswersMap {
  const map: AnswersMap = {};
  for (const q of QUESTIONS) {
    map[q.id] = {};
    for (const p of q.parts) {
      if (q.id === 1 && p.id === "a") {
        map[q.id][p.id] = "wrong"; // 2 marks lost
        continue;
      }
      if (q.id === 23 && p.id === "d") {
        continue; // left unanswered
      }
      if (p.kind === "mcq" || p.kind === "select") map[q.id][p.id] = p.correctOptionId!;
      else if (p.kind === "tf") map[q.id][p.id] = String(p.correctBool);
      else if (p.kind === "text") map[q.id][p.id] = p.accepted![0];
      else if (p.kind === "order") map[q.id][p.id] = ["t3", "t4", "t1", "t5", "t2"];
      else if (p.kind === "writing") map[q.id][p.id] = "There is a library in my school.";
    }
  }
  return map;
}

function makeSamplePayload(): { payload: SubmissionPayload; session: ExamSession; report: string } {
  const answers = sampleAnswers();
  const session: ExamSession = {
    version: 1,
    studentName: "Mira Samer",
    startedAt: START,
    currentQuestion: 35,
    answers,
    submitted: true,
    submittedAt: SUBMIT,
    finalElapsedMs: SUBMIT - START,
    attemptId: ATTEMPT,
  };
  const result = gradeFullExam(answers);
  const report = buildTextReport(session, result);
  return {
    payload: buildPayload({ attemptId: ATTEMPT, session, result, reportText: report }),
    session,
    report,
  };
}

describe("3. payload contract == grade5-math-unit1", () => {
  it("SHEETS_URL, SHEETS_TOKEN and delivery constants match grade5-math-unit1 verbatim", () => {
    expect(REF_CONFIG).toContain(`"${SHEETS_URL}"`);
    expect(REF_CONFIG).toContain(`"${SHEETS_TOKEN}"`);
    expect(MAX_ATTEMPTS).toBe(3);
    expect(Array.from(RETRY_DELAYS_MS)).toEqual([2000, 5000]);
    expect(ATTEMPT_TIMEOUT_MS).toBe(30000);
    expect(PENDING_PREFIX).toBe(`pending:${EXAM_ID}:`);
    expect(pendingKey(ATTEMPT)).toBe(`pending:grade3-english-curriculum-l1-l5:${ATTEMPT}`);
  });

  it("EXAM_ID equals the folder name and EXAM_TITLE equals the official card title", () => {
    expect(EXAM_ID).toBe("grade3-english-curriculum-l1-l5");
    expect(EXAM_TITLE).toBe("Curriculum Test Lessons 1 to 5");
  });

  it("payload, summary, lessons and details match exact field names and types", () => {
    const { payload } = makeSamplePayload();
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

    expect(payload.lessons).toHaveLength(5);
    expect(shapeOf(payload.lessons[0] as unknown as Record<string, unknown>)).toEqual({
      title: "string",
      awarded: "number",
      max: "number",
    });

    expect(payload.details).toHaveLength(50);
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

  it("status labels and gradeLabel scale match grade5-math-unit1", () => {
    expect(STATUS_AR.correct).toBe("إجابة صحيحة");
    expect(STATUS_AR.partial).toBe("إجابة صحيحة جزئياً");
    expect(STATUS_AR.incorrect).toBe("إجابة خاطئة");
    expect(STATUS_AR.unanswered).toBe("لم يُجب");
    expect(STATUS_AR.review).toBe("مراجعة المعلّم");

    expect(gradeLabel(100)).toBe("ممتاز");
    expect(gradeLabel(95)).toBe("ممتاز");
    expect(gradeLabel(94.99)).toBe("جيد جداً");
    expect(gradeLabel(85)).toBe("جيد جداً");
    expect(gradeLabel(84.99)).toBe("جيد");
    expect(gradeLabel(75)).toBe("جيد");
    expect(gradeLabel(74.99)).toBe("مقبول");
    expect(gradeLabel(65)).toBe("مقبول");
    expect(gradeLabel(64.99)).toBe("ضعيف");
    expect(gradeLabel(50)).toBe("ضعيف");
    expect(gradeLabel(49.99)).toBe("يحتاج إلى دعم");
    expect(gradeLabel(0)).toBe("يحتاج إلى دعم");
  });

  it("all payload numbers, lessons, details and reportText match the graded result", () => {
    const { payload, session, report } = makeSamplePayload();
    const result = gradeFullExam(session.answers);

    expect(payload.token).toBe(SHEETS_TOKEN);
    expect(payload.attemptId).toBe(ATTEMPT);
    expect(payload.examId).toBe(EXAM_ID);
    expect(payload.examTitle).toBe(EXAM_TITLE);
    expect(payload.studentName).toBe("Mira Samer");
    expect(payload.startAt).toBe(new Date(START).toISOString());
    expect(payload.submitAt).toBe(new Date(SUBMIT).toISOString());
    expect(payload.elapsedSec).toBe(1234);

    // 96 max auto - 2 (Q1a wrong) - 3 (Q23d unanswered) = 91
    expect(result.earned).toBe(91);
    expect(payload.summary.total).toBe(91);
    expect(payload.summary.max).toBe(TOTAL_MARKS);
    expect(payload.summary.percentage).toBe(91);
    expect(payload.summary.gradeLabel).toBe("جيد جداً");
    expect(payload.summary.fullQuestions).toBe(32);
    expect(payload.summary.partialQuestions).toBe(1);
    expect(payload.summary.wrongQuestions).toBe(1);
    expect(payload.summary.correctSubparts).toBe(47);
    expect(payload.summary.partialSubparts).toBe(0);
    expect(payload.summary.wrongSubparts).toBe(1);
    expect(payload.summary.unansweredSubparts).toBe(1);

    const q23d = payload.details.find((d) => d.q === 23 && d.label === "d");
    expect(q23d?.status).toBe("لم يُجب");
    expect(q23d?.awarded).toBe(0);

    const q29a = payload.details.find((d) => d.q === 29 && d.label === "a");
    expect(q29a?.status).toBe("مراجعة المعلّم");
    expect(q29a?.marks).toBe(4);
    expect(q29a?.awarded).toBe(0);

    expect(payload.details.reduce((s, d) => s + d.marks, 0)).toBe(100);
    expect(payload.details.reduce((s, d) => s + d.awarded, 0)).toBe(91);
    expect(payload.lessons.reduce((s, l) => s + l.max, 0)).toBe(100);
    expect(payload.lessons.reduce((s, l) => s + l.awarded, 0)).toBe(91);
    expect(payload.reportText).toBe(report);
  });

  it("newAttemptId produces unique ids", () => {
    const ids = new Set(Array.from({ length: 500 }, () => newAttemptId()));
    expect(ids.size).toBe(500);
  });
});
