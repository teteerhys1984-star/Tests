/* ------------------------------------------------------------------ */
/*  Plain-text exam report generator (UTF-8, local Blob download)      */
/* ------------------------------------------------------------------ */

import { BRAND, EXAM_SCOPE, EXAM_TITLE, LESSON_TITLES, QUESTIONS } from "../data/questions";
import type { ExamResult } from "../types";
import { formatDateTime, formatHMS, sanitizeFilename } from "../utils/format";
import { normalize } from "./grading";

const LINE = "=".repeat(72);
const DASH = "-".repeat(72);

export function buildReport(result: ExamResult): string {
  const out: string[] = [];
  const w = (s = "") => out.push(s);

  w(LINE);
  w(`${BRAND.toUpperCase()}`);
  w(`${EXAM_TITLE} — ${EXAM_SCOPE}`);
  w("OFFICIAL EXAM REPORT — BATTLE ROYALE LEARNING MISSIONS");
  w(LINE);
  w();
  w(`Student name        : ${result.studentName}`);
  w(`Exam                : ${EXAM_TITLE} — ${EXAM_SCOPE} (35 questions, 100 marks)`);
  w(`Date & time         : ${formatDateTime(result.submittedAt)}`);
  w(`Time taken          : ${formatHMS(result.durationMs)} (HH:MM:SS)`);
  w(`Final score         : ${result.totalEarned} / ${result.totalMax}`);
  w(`Percentage          : ${result.percentage.toFixed(1)}%`);
  w(`Correct questions   : ${result.correctQuestions}`);
  w(`Partial questions   : ${result.partiallyCorrect}`);
  w(`Incorrect questions : ${result.incorrectQuestions}`);
  w(
    `Rubric-scored tasks : ${result.rubricReviewQuestions} (auto-scored by the published rubric; your teacher may review)`
  );
  w();
  w(LINE);
  w("ANSWER KEY — QUESTION BY QUESTION");
  w(LINE);

  for (const q of result.questions) {
    const src = QUESTIONS.find((x) => x.id === q.id);
    w();
    w(DASH);
    w(
      `QUESTION ${q.n} — ${q.title}   [${q.earned}/${q.max} marks]`
    );
    w(`Lesson ${q.lesson}: ${LESSON_TITLES[q.lesson]} · Skill: ${q.skill}`);
    w(`Curriculum reference: Unit 1, Lesson ${q.lesson} — ${q.ref.book} ${q.ref.pages} — ${q.ref.activity}`);
    w(`Task: ${q.instruction}`);
    if (q.passage) {
      w();
      w("Reading text:");
      w(indent(q.passage.trim(), 2));
    }
    w();
    for (const p of q.parts) {
      const status = p.correct ? "CORRECT" : p.earned > 0 ? "PARTIAL" : "INCORRECT";
      w(`  ${p.prompt}`);
      if (p.arabic) w(`    Arabic word    : ${p.arabic}`);
      w(`    Your answer    : ${p.studentAnswer}`);
      w(`    Correct answer : ${p.correctAnswer}`);
      w(`    Marks          : ${p.earned}/${p.max}  [${status}]`);
      if (p.criteria) {
        w(`    Rubric (auto-scored):`);
        for (const c of p.criteria)
          w(`      [${c.met ? "✓" : "✗"}] ${c.description} — ${c.earned}/${c.max}`);
        if (p.rubricScored)
          w(`      Note: open writing is scored automatically by this public rubric;`);
        if (p.rubricScored) w(`      the teacher may review the sentence manually.`);
      }
      w(`    Why            : ${p.explanation}`);
      w();
    }
    if (src?.wordBank) w(`  Word bank: ${src.wordBank.join(" · ")}`);
  }

  w(LINE);
  w(`END OF REPORT — ${BRAND} · Grade 4 · Unit 1 · Lessons 1–5`);
  w(`Supervised by Eng. Somer Shaheen · Phone 0930215022 · WhatsApp https://wa.me/963930215022`);
  w(LINE);

  return out.join("\n");
}

function indent(text: string, spaces: number): string {
  const pad = " ".repeat(spaces);
  return text
    .split("\n")
    .map((l) => pad + l)
    .join("\n");
}

export function reportFilename(studentName: string): string {
  return `Grade4_English_Exam_${sanitizeFilename(studentName)}.txt`;
}

export function downloadReport(result: ExamResult): void {
  const text = buildReport(result);
  const blob = new Blob(["﻿" + text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = reportFilename(result.studentName);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/** compact one-line digests used by the teacher key & dom assertions */
export function answerDigest(): string[] {
  return QUESTIONS.map((q) =>
    q.parts
      .map((p) => {
        switch (p.kind) {
          case "fill":
            return normalize(p.accept[0]);
          case "order":
            return p.answer.join(" ");
          case "tf":
            return String(p.answer);
          case "mcq":
          case "match":
            return p.answer;
          default:
            return "rubric";
        }
      })
      .join("|")
  );
}
