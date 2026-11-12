/**
 * What one answer sheet scores, in a form small enough to commit and precise enough to catch any
 * change: used both to record the fixture (make-golden.ts) and to compare against it
 * (grading.test.ts). Only functions that exist in the original copy of the exam are used here.
 */
import path from "node:path";
import { ALL_SUBS, EXAM_ID, EXAM_VERSION, QUESTIONS } from "../src/data/exam";
import { gradeAll, round2 } from "../src/lib/grade";
import { buildReport, reportFilename, validateReport } from "../src/lib/report";
import type { Attempt } from "../src/lib/store";
import { EXAM_DIR, sha256 } from "./harness";
import type { Sheet } from "./sheets";

export const GOLDEN_FILE = path.join(EXAM_DIR, "tests", "fixtures", "grading-golden.json");

/**
 * The files that decide marks and the TXT report: the question bank (questions, keys, accepted
 * answers), the marking code, the number normalisation it uses, and the report builder.
 * None of them was changed when result delivery was added. Since then the marking code has been
 * changed on purpose in one respect (q08a); tests/grading.test.ts requires it to be the original
 * plus that fix, and the other three files to be the original byte for byte.
 */
export const ORIGINAL_FILES = ["data/exam.ts", "lib/grade.ts", "lib/text.ts", "lib/report.ts"];

/** A submitted attempt holding the sheet's answers, with fixed name, id and times. */
export function attemptFor(sheet: Sheet): Attempt {
  const startedAt = Date.UTC(2026, 0, 15, 8, 0, 0);
  const durationMs = 2527350;
  return {
    examId: EXAM_ID,
    version: EXAM_VERSION,
    attemptId: "GOLDEN-" + sheet.name,
    name: "آدم التجريبي",
    phase: "done",
    view: "q",
    order: [...sheet.order],
    optionOrder: sheet.optionOrder,
    answers: sheet.answers,
    current: 0,
    visited: [0],
    startedAt,
    submittedAt: startedAt + durationMs,
    durationMs,
    result: gradeAll(sheet.answers),
  };
}

export interface SheetRecord {
  name: string;
  /** sha256 of the sheet (question order, option orders, answers): proves both sides marked the same input. */
  sheet: string;
  total: number;
  percent: number;
  /** correct, partial, incorrect, unanswered */
  counts: number[];
  /** Marks awarded to each question, in bank order. */
  questions: string;
  /** Marks awarded to each part, in bank order. */
  marks: string;
  /** Status of each part, in bank order: c(orrect) p(artial) i(ncorrect) u(nanswered). */
  status: string;
  /** sha256 of the whole marking result, with every answer text shown to the student. */
  result: string;
  /** What the exam's own validation says about the report. */
  valid: boolean;
  /** sha256 of the TXT report built for attemptFor(sheet). */
  report: string;
}

/** Name of the TXT file offered for the student of attemptFor(). */
export function goldenReportFile(): string {
  return reportFilename("آدم التجريبي");
}

export function describeSheet(sheet: Sheet): SheetRecord {
  const attempt = attemptFor(sheet);
  const result = attempt.result!;
  const partOf = new Map(result.items.map((item) => [item.subId, item]));
  const report = buildReport(attempt, result);
  return {
    name: sheet.name,
    sheet: sha256(JSON.stringify({ order: sheet.order, optionOrder: sheet.optionOrder, answers: sheet.answers })),
    total: result.total,
    percent: result.percent,
    counts: [result.correct, result.partial, result.incorrect, result.unanswered],
    questions: QUESTIONS.map((question) => round2(question.subs.reduce((sum, sub) => sum + (partOf.get(sub.id)?.awarded ?? NaN), 0))).join(","),
    marks: ALL_SUBS.map((sub) => partOf.get(sub.id)?.awarded ?? "?").join(","),
    status: ALL_SUBS.map((sub) => (partOf.get(sub.id)?.status ?? "?")[0]).join(""),
    result: sha256(JSON.stringify(result)),
    valid: validateReport(report, attempt, result),
    report: sha256(report),
  };
}
