/**
 * What one answer sheet scores, in a form small enough to commit and precise enough to catch any
 * change: used both to record the fixture (make-golden.ts) and to compare against it
 * (grading.test.ts). Only functions that exist in the original copy of the exam are used here.
 */
import path from "node:path";
import { ALL_SUBPARTS, EXAM_ID, EXAM_VERSION, QUESTIONS } from "../src/exam/data";
import { gradeAttempt } from "../src/exam/grade";
import { buildReport, buildReportFilename } from "../src/exam/report";
import type { Attempt, GradeResult } from "../src/exam/types";
import { EXAM_DIR, sha256 } from "./harness";
import type { Sheet } from "./sheets";

export const GOLDEN_FILE = path.join(EXAM_DIR, "tests", "fixtures", "grading-golden.json");

/** The files that decide marks: the question bank (questions, keys, accepted answers) and the marking code. */
export const MARKING_FILES = ["exam/data.ts", "exam/grade.ts"];

/** The one line of the TXT report that was reworded when result delivery was added. */
export const ORIGINAL_REPORT_NOTE =
  "ملاحظة للمعلم: هذا التقرير محلي ولا يُرسل عبر الشبكة. التصحيح على مستوى الأجزاء، والمجموع الكلي 100 درجة.";
export const CURRENT_REPORT_NOTE =
  "ملاحظة للمعلم: أُنشئ هذا التقرير محلياً في متصفح الطالب، وتُرسَل النتيجة أيضاً إلكترونياً إلى المعلّم عند التسليم. التصحيح على مستوى الأجزاء، والمجموع الكلي 100 درجة.";

/** A submitted attempt holding the sheet's answers, with fixed name, id and times. */
export function attemptFor(sheet: Sheet): Attempt {
  return {
    schema: 2,
    examId: EXAM_ID,
    examVersion: EXAM_VERSION,
    attemptId: "golden-" + sheet.name,
    studentName: "آدم التجريبي",
    phase: "results",
    questionOrder: [...sheet.order],
    optionOrders: {},
    answers: sheet.answers,
    currentIndex: 0,
    visited: [],
    startTime: Date.UTC(2026, 0, 15, 8, 0, 0),
    submissionTime: Date.UTC(2026, 0, 15, 8, 42, 7),
    durationSeconds: 2527,
    startSoundPlayed: true,
    submissionSoundPlayed: true,
  };
}

/** Everything the marking produced, including every text shown to the student. */
export function fullResult(result: GradeResult) {
  return {
    awarded: result.awarded,
    total: result.total,
    percentage: result.percentage,
    counts: result.counts,
    questions: result.questions.map((question) => ({
      id: question.question.id,
      marks: question.marks,
      awarded: question.awarded,
      parts: question.subparts.map((part) => part.subpartId),
    })),
    subparts: result.subparts.map((part) => ({
      questionId: part.questionId,
      subpartId: part.subpartId,
      prompt: part.prompt,
      kind: part.kind,
      marks: part.marks,
      awarded: part.awarded,
      status: part.status,
      studentAnswer: part.studentAnswer,
      correctAnswer: part.correctAnswer,
      explanation: part.explanation,
      page: part.page,
      accepted: part.accepted,
      partialRule: part.partialRule,
      fields: part.fields ?? null,
    })),
  };
}

export interface SheetRecord {
  name: string;
  /** sha256 of the sheet (question order + answers): proves both sides marked the same input. */
  sheet: string;
  awarded: number;
  percentage: number;
  /** correct, partial, incorrect, unanswered */
  counts: number[];
  /** Marks awarded to each question, in bank order. */
  questions: string;
  /** Marks awarded to each part, in bank order (one digit each). */
  marks: string;
  /** Status of each part, in bank order: c(orrect) p(artial) i(ncorrect) u(nanswered). */
  status: string;
  /** sha256 of fullResult(). */
  result: string;
  /** sha256 of the TXT report built for attemptFor(sheet). */
  report: string;
}

/** Name of the TXT file offered for the student of attemptFor(). */
export function goldenReportFile(): string {
  return buildReportFilename("آدم التجريبي");
}

export function describeSheet(sheet: Sheet, reportNote?: { from: string; to: string }): SheetRecord {
  const attempt = attemptFor(sheet);
  const result = gradeAttempt(attempt);
  const partOf = new Map(result.subparts.map((part) => [part.subpartId, part]));
  const questionOf = new Map(result.questions.map((question) => [question.question.id, question]));
  let report = buildReport(attempt, result);
  if (reportNote) report = report.split(reportNote.from).join(reportNote.to);
  return {
    name: sheet.name,
    sheet: sha256(JSON.stringify({ order: sheet.order, answers: sheet.answers })),
    awarded: result.awarded,
    percentage: result.percentage,
    counts: [result.counts.correct, result.counts.partial, result.counts.incorrect, result.counts.unanswered],
    questions: QUESTIONS.map((question) => questionOf.get(question.id)?.awarded ?? "?").join(","),
    marks: ALL_SUBPARTS.map((sub) => partOf.get(sub.id)?.awarded ?? "?").join(""),
    status: ALL_SUBPARTS.map((sub) => (partOf.get(sub.id)?.status ?? "?")[0]).join(""),
    result: sha256(JSON.stringify(fullResult(result))),
    report: sha256(report),
  };
}
