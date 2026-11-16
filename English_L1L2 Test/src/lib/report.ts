/**
 * Builds the downloadable plain-text student report (UTF-8, generated
 * entirely in the browser) and triggers the download.
 */
import type { ExamResult } from "../types";
import { formatMarks } from "./grading";
import { formatElapsed, formatDateTime } from "./time";

export interface ReportMeta {
  studentName: string;
  examTitle: string;
  coverage: string;
  submittedAt: string;
  elapsedMs: number;
}

/** Make a filesystem-safe filename fragment from the student's name. */
export function sanitizeFilename(name: string): string {
  const safe = name
    .trim()
    .replace(/[^a-zA-Z0-9-_ ]+/g, "")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
  return safe || "Student";
}

export function buildReport(meta: ReportMeta, result: ExamResult): string {
  const lines: string[] = [];
  const rule = "=".repeat(72);
  const thin = "-".repeat(72);

  lines.push(rule);
  lines.push("GRADE 8 ENGLISH EXAM — STUDENT REPORT");
  lines.push(meta.examTitle);
  lines.push(meta.coverage);
  lines.push(rule);
  lines.push(`Student Name      : ${meta.studentName}`);
  lines.push(`Submitted         : ${formatDateTime(meta.submittedAt)}`);
  lines.push(`Time Taken        : ${formatElapsed(meta.elapsedMs)}`);
  lines.push(
    `Total Score       : ${formatMarks(result.totalScore)} / ${formatMarks(result.maxScore)}`,
  );
  lines.push(`Percentage        : ${result.percentage}%`);
  lines.push(`Fully Correct     : ${result.fullyCorrect} question(s)`);
  lines.push(`Partially Correct : ${result.partiallyCorrect} question(s)`);
  lines.push(`Incorrect         : ${result.incorrect} question(s)`);
  lines.push(rule);
  lines.push("DETAILED QUESTION BREAKDOWN");
  lines.push(rule);

  for (const q of result.questionResults) {
    const lessonLabel =
      q.lesson === "lesson1"
        ? "Lesson 1 — Future Plans"
        : "Lesson 2 — School Challenges";
    lines.push("");
    lines.push(`QUESTION ${q.number}  [${q.typeLabel}]  (${lessonLabel})`);
    lines.push(`Marks Earned: ${formatMarks(q.earned)} / ${formatMarks(q.max)}`);
    lines.push(`Reference   : ${q.curriculumRef}`);
    lines.push(thin);
    lines.push(q.instruction);
    if (q.passage) {
      lines.push("");
      lines.push(`Passage — ${q.passage.title} (${q.passage.source}):`);
      lines.push(q.passage.text);
    }
    lines.push("");
    q.subparts.forEach((s, i) => {
      lines.push(`  ${q.number}.${i + 1}  ${s.prompt}`);
      lines.push(`      Your answer    : ${s.studentDisplay}`);
      lines.push(`      Correct answer : ${s.correctDisplay}`);
      lines.push(
        `      Marks          : ${formatMarks(s.earned)} / ${formatMarks(s.max)} ${s.isCorrect ? "(correct)" : "(incorrect)"}`,
      );
    });
    lines.push("");
    lines.push(`Explanation: ${q.explanation}`);
    lines.push(thin);
  }

  lines.push("");
  lines.push("End of report. Good luck with your studies!");
  lines.push("");
  return lines.join("\n");
}

export function downloadReport(meta: ReportMeta, result: ExamResult): void {
  const text = buildReport(meta, result);
  // UTF-8 with BOM so Windows editors display it correctly.
  const blob = new Blob(["﻿" + text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Grade8_English_Exam_Report_${sanitizeFilename(meta.studentName)}.txt`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
}
