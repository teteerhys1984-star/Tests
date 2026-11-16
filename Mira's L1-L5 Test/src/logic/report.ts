/* ------------------------------------------------------------------ */
/*  Report generation — UTF-8 plain text, generated in the browser.    */
/* ------------------------------------------------------------------ */

import type { ExamResult, ExamSession, Question } from "../types";
import { EXAM_META, LESSON_TITLES, QUESTIONS } from "../data/examData";

/** HH:MM:SS from a millisecond duration. */
export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

/** Safe filename from the student's name. */
export function reportFileName(studentName: string): string {
  const clean = studentName
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);
  return `Grade3_English_Exam_${clean || "Student"}.txt`;
}

export function buildTextReport(
  session: ExamSession,
  result: ExamResult
): string {
  const lines: string[] = [];
  const rule = "=".repeat(62);
  const thin = "-".repeat(62);
  const submittedAt = session.submittedAt ? new Date(session.submittedAt) : new Date();

  lines.push(rule);
  lines.push("  THE GARDEN OF KNOWLEDGE");
  lines.push("  Grade 3 English Examination — Student Report");
  lines.push(`  Scope: ${EXAM_META.scope}`);
  lines.push(rule);
  lines.push("");
  lines.push(`Student name      : ${session.studentName}`);
  lines.push(`Grade / scope     : Grade 3 · Unit 1 · Lessons 1-5`);
  lines.push(`Submitted at      : ${submittedAt.toLocaleString("en-GB")}`);
  lines.push(`Total time taken  : ${formatDuration(session.finalElapsedMs ?? 0)} (HH:MM:SS)`);
  lines.push("");
  lines.push(`Final score       : ${result.earned} / ${result.maxMarks}`);
  lines.push(`Percentage        : ${result.percentage}%`);
  lines.push(`Fully correct     : ${result.fullyCorrect} question(s)`);
  lines.push(`Partially correct : ${result.partial} question(s)`);
  lines.push(`Incorrect         : ${result.incorrect} question(s)`);
  lines.push(`Teacher review    : ${result.reviewCount} question(s) — ${result.pendingMarks} mark(s) pending`);
  lines.push("");
  lines.push(rule);
  lines.push("  QUESTION-BY-QUESTION RESULTS");
  lines.push(rule);

  for (const q of QUESTIONS) {
    const qr = result.questionResults.find((r) => r.questionId === q.id);
    if (!qr) continue;
    const qMarks = q.parts.reduce((s, p) => s + p.marks, 0);
    lines.push("");
    lines.push(`Q${q.id}. [${q.category}] · ${q.instruction}`);
    lines.push(thin);
    if (q.stimulusTitle) lines.push(`Reading — ${q.stimulusTitle}:`);
    if (q.stimulus) {
      for (const l of q.stimulus.split("\n")) lines.push(`    ${l}`);
    }
    for (const p of q.parts) {
      const pr = qr.parts.find((x) => x.partId === p.id);
      if (!pr) continue;
      const tag =
        pr.status === "correct" ? "CORRECT" : pr.status === "review" ? "TEACHER REVIEW" : pr.status === "unanswered" ? "NOT ANSWERED" : "INCORRECT";
      lines.push("");
      lines.push(`  Item ${p.id.toUpperCase()}: ${p.text.replace(/\n/g, " ")}${p.arabic ? `  [Arabic word: ${p.arabic}]` : ""}`);
      lines.push(`    Your answer    : ${pr.studentDisplay}`);
      lines.push(`    Correct answer : ${pr.correctDisplay}${p.accepted && p.accepted.length > 1 ? `  (also accepted: ${p.accepted.slice(1, 4).join(" | ")})` : ""}`);
      lines.push(`    Marks          : ${pr.status === "review" ? `pending / ${p.marks}` : `${pr.earned} / ${p.marks}`}  [${tag}]`);
      lines.push(`    Explanation    : ${p.explanation}`);
      if (p.rubric) {
        lines.push(`    Marking rubric :`);
        for (const r of p.rubric) lines.push(`      - ${r}`);
      }
    }
    lines.push("");
    lines.push(`  Question total   : ${qr.earned} / ${qMarks}${qr.pending ? ` (+ ${qr.pending} pending review)` : ""}`);
    lines.push(`  Reference        : Lesson ${q.reference.lesson} — ${q.reference.lessonTitle} · ${q.reference.source} · Skill: ${q.reference.skill}`);
  }

  lines.push("");
  lines.push(rule);
  lines.push("  Keep growing in the Garden of Knowledge!");
  lines.push("  Prepared with love · Eng. Somer Shaheen · 0930215022");
  lines.push(rule);
  lines.push("");
  return lines.join("\n");
}

export function downloadTextReport(session: ExamSession, result: ExamResult): void {
  const text = buildTextReport(session, result);
  const blob = new Blob(["﻿" + text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = reportFileName(session.studentName);
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/* Teacher answer key (TXT) */
export function buildTeacherKey(): string {
  const lines: string[] = [];
  lines.push("THE GARDEN OF KNOWLEDGE — TEACHER ANSWER KEY (CONFIDENTIAL)");
  lines.push(`${EXAM_META.title} · ${EXAM_META.scope} · Total: ${EXAM_META.totalMarks} marks · ${EXAM_META.totalQuestions} questions (${EXAM_META.vocabularyQuestions} vocabulary)`);
  lines.push("=".repeat(62));
  const byLesson = new Map<number, Question[]>();
  for (const q of QUESTIONS) {
    const arr = byLesson.get(q.lesson) ?? [];
    arr.push(q);
    byLesson.set(q.lesson, arr);
  }
  [...byLesson.entries()].forEach(([lesson, qs]) => {
    lines.push("");
    lines.push(`LESSON ${lesson} — ${LESSON_TITLES[lesson]}`);
    lines.push("-".repeat(62));
    for (const q of qs) {
      lines.push("");
      lines.push(`Q${q.id} [${q.category}] ${q.instruction}`);
      for (const p of q.parts) {
        lines.push(`  ${p.id}) ${p.text.replace(/\n/g, " ")}${p.arabic ? `  [Arabic word: ${p.arabic}]` : ""}  —  ${p.marks} mark(s)`);
        lines.push(`     ANSWER: ${p.kind === "mcq" || p.kind === "select" ? p.options?.find((o) => o.id === p.correctOptionId)?.label : p.kind === "tf" ? (p.correctBool ? "True" : "False") : p.kind === "order" ? p.acceptedOrders?.[0] : p.kind === "writing" ? "Teacher review — see rubric" : p.accepted?.[0]}`);
        if (p.accepted && p.accepted.length > 1) lines.push(`     ACCEPTED ALTERNATIVES: ${p.accepted.join(" | ")}`);
        if (p.rubric) p.rubric.forEach((r) => lines.push(`     RUBRIC: ${r}`));
        lines.push(`     Why: ${p.explanation}`);
        lines.push(`     Ref: Lesson ${q.reference.lesson} — ${q.reference.lessonTitle} · ${q.reference.source} · ${q.reference.skill}`);
      }
    }
  });
  lines.push("");
  lines.push("Grading notes: text answers are normalised (case, extra spaces and final punctuation are ignored). The writing task is flagged for teacher review and marked with its rubric.");
  return lines.join("\n");
}

export function downloadTeacherKey(): void {
  const blob = new Blob(["﻿" + buildTeacherKey()], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "Teacher_Answer_Key_Grade3_Unit1.txt";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
