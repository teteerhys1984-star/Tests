import type { ExamResult } from "@/exam/types";
import { EXAM_SUBTITLE, EXAM_TITLE } from "@/exam/questions";
import { formatDateTime, formatHMS } from "./time";

/** Make a student name safe for a filename (keeps latin letters, digits, -, _). */
export function sanitizeFilename(name: string): string {
  const cleaned = name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9 _-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-");
  return cleaned || "student";
}

export function buildReport(params: {
  studentName: string;
  result: ExamResult;
  startedAt: number;
  finishedAt: number;
}): string {
  const { studentName, result, startedAt, finishedAt } = params;
  const line = "=".repeat(72);
  const thin = "-".repeat(72);

  const rows: string[] = [];
  rows.push(line);
  rows.push("GRADE 8 ENGLISH EXAM — OFFICIAL STUDENT REPORT");
  rows.push(line);
  rows.push(`Exam title        : ${EXAM_TITLE}`);
  rows.push(`Coverage          : ${EXAM_SUBTITLE}`);
  rows.push(`Student name      : ${studentName}`);
  rows.push(`Submitted         : ${formatDateTime(finishedAt)}`);
  rows.push(`Time taken        : ${formatHMS(finishedAt - startedAt)} (HH:MM:SS)`);
  rows.push(`Total score       : ${result.score} / ${result.total}`);
  rows.push(`Percentage        : ${result.percentage}%`);
  rows.push(`Fully correct     : ${result.fullyCorrect} of 20 questions`);
  rows.push(`Partially correct : ${result.partiallyCorrect} of 20 questions`);
  rows.push(`Incorrect         : ${result.incorrect} of 20 questions`);
  rows.push(line);
  rows.push("DETAILED RESULTS — 20 QUESTIONS × 5 MARKS");
  rows.push(line);

  for (const q of result.questions) {
    rows.push("");
    rows.push(`QUESTION ${q.n} — ${q.title}`);
    rows.push(`Lesson     : ${q.lesson === 3 ? "Lesson 3 · Let's Discover" : "Lesson 4 · Interesting Destinations"}`);
    rows.push(`Skill      : ${q.skill}`);
    rows.push(`Marks      : ${q.earned} / ${q.possible}`);
    rows.push(thin);
    for (const p of q.parts) {
      rows.push(p.prompt);
      rows.push(`  Your answer    : ${p.studentAnswer}`);
      rows.push(`  Correct answer : ${p.correctAnswer}`);
      rows.push(`  Marks          : ${p.earned} / ${p.possible}`);
      rows.push(`  Explanation    : ${p.explanation}`);
      rows.push("");
    }
    rows.push(`Question note: ${q.explanation}`);
    rows.push(thin);
  }

  rows.push("");
  rows.push("END OF REPORT");
  rows.push(line);
  return rows.join("\n");
}

/** Download the report as a UTF-8 .txt file generated entirely in the browser. */
export function downloadReport(report: string, studentName: string): void {
  const blob = new Blob(["﻿" + report], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${sanitizeFilename(studentName)}-grade8-unit1-exam-report.txt`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
