import type { ExamResult } from "../data/types";
import { EXAM_LABEL, EXAM_SUBLABEL } from "../data/examData";
import { correctAnswerText, formatMarks } from "./grading";
import { describeDuration, formatDateTime, formatHMS } from "./time";

export interface ReportMeta {
  studentName: string;
  startedAt: number;
  submittedAt: number;
}

export function buildReportText(result: ExamResult, meta: ReportMeta): string {
  const line = "=".repeat(60);
  const thin = "-".repeat(60);
  const elapsed = meta.submittedAt - meta.startedAt;
  const out: string[] = [];

  out.push(line);
  out.push(`${EXAM_LABEL} — ${EXAM_SUBLABEL}`);
  out.push("Results Report");
  out.push(line);
  out.push(`Student name:   ${meta.studentName}`);
  out.push(`Started:        ${formatDateTime(meta.startedAt)}`);
  out.push(`Completed:      ${formatDateTime(meta.submittedAt)}`);
  out.push(`Time taken:     ${formatHMS(elapsed)} (${describeDuration(elapsed)})`);
  out.push(thin);
  out.push(`Final score:    ${formatMarks(result.total)} / ${formatMarks(result.max)}`);
  out.push(`Percentage:     ${result.percentage}%`);
  out.push(`Correct items:  ${result.correctCount}`);
  out.push(`Incorrect items: ${result.incorrectCount}`);
  out.push(line);
  out.push("");

  for (const qr of result.questions) {
    const q = qr.question;
    out.push(`QUESTION ${q.number}  (${formatMarks(qr.earned)} / ${formatMarks(qr.max)} marks)`);
    out.push(`Task: ${q.title}`);
    if (q.intro) {
      out.push("Context:");
      for (const l of q.intro.split("\n")) out.push(`  ${l}`);
    }
    out.push(`Reference: ${q.lesson} — ${q.skill}`);
    out.push("");
    for (const sr of qr.subs) {
      const s = sr.sub;
      out.push(`  ${q.number}${s.label}) ${s.prompt}`);
      if (s.type === "order") out.push(`      Words: ${s.words.join(" / ")}`);
      if (s.type === "choice") out.push(`      Options: ${s.options.join(" / ")}`);
      out.push(`      Your answer:    ${sr.given.trim() ? sr.given.trim() : "(no answer)"}`);
      out.push(`      Correct answer: ${correctAnswerText(s)}`);
      out.push(`      Result:         ${sr.correct ? "Correct" : "Incorrect"}  (${formatMarks(sr.earned)} / ${formatMarks(s.marks)})`);
      out.push(`      Explanation:    ${s.explanation}`);
      out.push("");
    }
    out.push(thin);
    out.push("");
  }

  out.push("End of report.");
  return out.join("\n");
}

export function safeFileName(name: string): string {
  const cleaned = name.trim().replace(/[\\/:*?"<>|]+/g, "").replace(/\s+/g, "_");
  return cleaned || "Student";
}

export function downloadTextFile(filename: string, content: string): void {
  const blob = new Blob(["\uFEFF" + content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
