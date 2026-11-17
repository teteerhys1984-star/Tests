import { EXAM_TITLE } from "@/config";
import { LESSON_TITLES, type LessonTag } from "@/data/exam";
import type { Attempt } from "@/lib/attempt";
import { elapsedMs, formatClock } from "@/lib/attempt";
import type { ExamResult } from "@/lib/grading";

const LINE = "=".repeat(72);
const DASH = "-".repeat(72);

export function buildReport(attempt: Attempt, result: ExamResult): string {
  const out: string[] = [];
  out.push(LINE);
  out.push(EXAM_TITLE.toUpperCase());
  out.push("GRADE 5 · ENGLISH EXAMINATION · UNIT 1 — LESSONS 1 TO 5 · MODEL A");
  out.push(LINE);
  out.push(`Student        : ${result.name}`);
  out.push(`Final score    : ${result.score} / ${result.total}`);
  out.push(`Items correct  : ${result.correctItems} / ${result.totalItems} sub-items`);
  out.push(`Time used      : ${formatClock(elapsedMs(attempt, attempt.submittedAt ?? Date.now()))}`);
  out.push(`Started        : ${new Date(attempt.startedAt).toLocaleString("en-GB")}`);
  out.push(
    `Submitted      : ${attempt.submittedAt ? new Date(attempt.submittedAt).toLocaleString("en-GB") : "-"}`,
  );
  out.push(DASH);
  out.push("DETAILED MARKING — with hidden curriculum source references");
  out.push(DASH);

  for (const qr of result.questions) {
    const q = qr.question;
    out.push("");
    out.push(
      `QUESTION ${q.n} — ${qr.awarded} / ${qr.marks} marks  [${qr.awarded === qr.marks ? "CORRECT" : qr.awarded > 0 ? "PARTLY CORRECT" : "NOT CORRECT"}]`,
    );
    out.push(`  Source : ${q.source.page} · ${q.source.exercise}`);
    out.push(`  Lesson : Lesson ${q.lesson} · Skill: ${q.source.skill}`);
    qr.items.forEach((it, idx) => {
      out.push(`  (${String.fromCharCode(97 + idx)}) ${it.prompt}`);
      out.push(`      Student answer : ${it.student || "(no answer)"}`);
      out.push(`      Correct answer : ${it.correct}`);
      const verdict = it.isCorrect ? "[correct]" : it.answered ? "[not correct]" : "[not answered]";
      out.push(`      Mark           : ${it.awarded} / ${it.marks}  ${verdict}`);
      out.push(`      Explanation    : ${it.explain}`);
    });
  }

  out.push("");
  out.push(DASH);
  out.push("SUMMARY BY LESSON");
  out.push(DASH);
  ([1, 2, 3, 4, 5] as LessonTag[]).forEach((lesson) => {
    const rows = result.questions.filter((qr) => qr.question.lesson === lesson);
    const awarded = rows.reduce((s, r) => s + r.awarded, 0);
    const max = rows.reduce((s, r) => s + r.marks, 0);
    out.push(`  ${LESSON_TITLES[lesson].padEnd(32)} ${awarded} / ${max}`);
  });

  out.push("");
  out.push(LINE);
  out.push("READING TEXTS USED (two only, both from the curriculum)");
  out.push("  Reading Text A — Pupil's Book p. 7 · Activity 6 (the John family passage)");
  out.push("  Reading Text B — Pupil's Book p. 13 · Activity 6 (the five senses passage)");
  out.push("  No listening-dependent item is included; no audio answer has been invented.");
  out.push(LINE);
  out.push("Prepared by Eng. Somer Shaheen · WhatsApp +963 930 215 022");
  out.push("");
  return out.join("\n");
}

export function downloadText(filename: string, text: string): void {
  const blob = new Blob(["\ufeff" + text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export function safeName(name: string): string {
  const cleaned = name
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\p{L}\p{N}-]/gu, "")
    .slice(0, 60);
  return cleaned || "Student";
}
