import type { ExamResult } from "@/lib/grading";
import { formatHMS } from "@/lib/storage";

export const EXAM_TITLE = "Grade 5 English — Unit 1 Examination — Model B";
export const EXAM_SCOPE = "Grade 5 · English · Unit 1 · Lessons 1–5 · Pupil's Book pages 3–20";

/** Remove anything that is unsafe in a file name, keep the name readable. */
export function sanitizeFilename(name: string): string {
  const cleaned = name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9\u0600-\u06FF\- ]+/g, " ")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
  return cleaned.length > 0 ? cleaned : "student";
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export function formatSubmissionDate(ts: number): string {
  const d = new Date(ts);
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  return `${d.getFullYear()} ${months[d.getMonth()]} ${d.getDate()} at ${pad(d.getHours())}:${pad(
    d.getMinutes()
  )}:${pad(d.getSeconds())}`;
}

export interface ReportInput {
  name: string;
  result: ExamResult;
  submittedTs: number;
  elapsedMs: number;
}

/** Build the UTF-8 plain-text report shown on the results page. */
export function buildReport({ name, result, submittedTs, elapsedMs }: ReportInput): string {
  const lines: string[] = [];
  const rule = "=".repeat(72);
  const thin = "-".repeat(72);

  lines.push(rule);
  lines.push(EXAM_TITLE);
  lines.push(EXAM_SCOPE);
  lines.push(rule);
  lines.push("");
  lines.push(`Student name      : ${name}`);
  lines.push(`Form              : Model B`);
  lines.push(`Submission date   : ${formatSubmissionDate(submittedTs)}`);
  lines.push(`Completion time   : ${formatHMS(elapsedMs)}`);
  lines.push(`Final score       : ${result.score} / ${result.maxScore}`);
  lines.push(`Correct answers   : ${result.correctCount} of ${result.questions.length}`);
  lines.push(`Incorrect answers : ${result.incorrectCount} of ${result.questions.length}`);
  lines.push("");

  result.questions.forEach((qr, i) => {
    const q = qr.question;
    lines.push(thin);
    lines.push(`QUESTION ${i + 1} of ${result.questions.length}   [${q.id}]`);
    lines.push(`Lesson ${q.lesson} · ${q.exercise} · ${q.page}`);
    lines.push(`Instruction: ${q.instruction}`);
    if (q.context) {
      lines.push("Printed material:");
      q.context.split("\n").forEach((l) => lines.push(`    ${l}`));
    }
    qr.parts.forEach((p, pi) => {
      lines.push(
        `  Part ${qr.parts.length > 1 ? String.fromCharCode(97 + pi) : ""} (${p.max} mark${
          p.max === 1 ? "" : "s"
        })`
      );
      lines.push(`    Question        : ${q.parts[pi].prompt}`);
      lines.push(`    Your answer     : ${p.studentAnswer || "(not answered)"}`);
      lines.push(`    Correct answer  : ${p.correctAnswer}`);
      lines.push(`    Marks earned    : ${p.earned} / ${p.max}`);
      if (p.explanation) lines.push(`    Explanation     : ${p.explanation}`);
    });
    lines.push(`    TOTAL           : ${qr.earned} / ${qr.max}`);
    lines.push("");
  });

  lines.push(rule);
  lines.push("End of report — generated locally, nothing was uploaded.");
  lines.push("Contact: المهندس سومر شاهين · 0930215022 · https://wa.me/963930215022");
  lines.push(rule);
  return lines.join("\r\n");
}

export function reportFilename(name: string): string {
  return `${sanitizeFilename(name)}-grade5-unit1-model-b-report.txt`;
}

/** Trigger a local download of the UTF-8 report. */
export function downloadReport(input: ReportInput): void {
  const blob = new Blob(["\uFEFF" + buildReport(input)], {
    type: "text/plain;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = reportFilename(input.name);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}
