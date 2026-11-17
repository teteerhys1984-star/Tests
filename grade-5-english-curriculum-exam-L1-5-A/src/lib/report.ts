import { LESSONS, type Question } from "@/data/exam";
import type { ExamResult } from "@/lib/grading";

export interface ReportInput {
  name: string;
  result: ExamResult;
  questions: Question[];
  submittedAt: number;
  elapsedMs: number;
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

export function formatStamp(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

const RULE = "=".repeat(72);

export function buildReport(input: ReportInput): string {
  const { name, result, questions, submittedAt, elapsedMs } = input;
  const byId = new Map(questions.map((q) => [q.id, q]));
  const lines: string[] = [];

  lines.push(RULE);
  lines.push("GRADE 5 ENGLISH - UNIT 1 EXAMINATION - MODEL A");
  lines.push("Pupil's Book Unit 1, Lessons 1-5 (pages 3-20)");
  lines.push(RULE);
  lines.push("");
  lines.push(`Student name      : ${name}`);
  lines.push(`Examination       : Grade 5 English - Unit 1 Examination (Model A)`);
  lines.push(`Submitted on      : ${formatStamp(submittedAt)}`);
  lines.push(`Completion time   : ${formatDuration(elapsedMs)}`);
  lines.push(`Final score       : ${result.score} / ${result.maxScore}`);
  lines.push(`Correct answers   : ${result.correctCount} of ${result.totalParts}`);
  lines.push(`Incorrect answers : ${result.incorrectCount} of ${result.totalParts}`);
  lines.push("");
  lines.push(RULE);
  lines.push("DETAILED ANSWERS, MARKS AND LESSON REFERENCES");
  lines.push(RULE);

  result.questions.forEach((qr, i) => {
    const q = byId.get(qr.questionId);
    const lesson = q ? LESSONS[q.lesson] : null;
    lines.push("");
    lines.push(
      `Question ${i + 1}  [${qr.questionId}]  Lesson ${lesson?.no ?? "?"} - ${lesson?.title ?? ""}  (${lesson?.pages ?? ""})`,
    );
    lines.push(`Source: ${qr.ref}`);
    lines.push(`Marks : ${qr.earned} / ${qr.marks}`);
    qr.parts.forEach((p) => {
      const verdict = p.isRubric
        ? p.correct
          ? "RUBRIC - awarded"
          : "RUBRIC - not awarded"
        : p.correct
          ? "CORRECT"
          : p.answered
            ? "INCORRECT"
            : "NOT ANSWERED";
      lines.push(`  ${p.label}) ${p.prompt}`);
      lines.push(`     Your answer    : ${p.studentAnswer || "(blank)"}`);
      lines.push(`     Correct answer : ${p.correctAnswer}`);
      lines.push(`     Mark           : ${p.earned} / ${p.marks}   [${verdict}]`);
      if (p.explanation) lines.push(`     Note           : ${p.explanation}`);
    });
  });

  lines.push("");
  lines.push(RULE);
  lines.push("SUMMARY BY LESSON");
  lines.push(RULE);
  (Object.keys(LESSONS) as (keyof typeof LESSONS)[]).forEach((id) => {
    const rs = result.questions.filter((r) => r.lesson === id);
    const earned = rs.reduce((s, r) => s + r.earned, 0);
    const max = rs.reduce((s, r) => s + r.marks, 0);
    lines.push(
      `Lesson ${LESSONS[id].no} - ${LESSONS[id].title.padEnd(18)} ${earned} / ${max}   (${LESSONS[id].pages})`,
    );
  });
  lines.push(RULE);
  lines.push("End of report.");
  lines.push("");

  return lines.join("\r\n");
}

/** Keep the file name safe on every operating system, and never empty. */
export function safeFileName(name: string): string {
  const cleaned = name
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 40);
  return cleaned || "student";
}

export function reportFileName(name: string, submittedAt: number): string {
  const d = new Date(submittedAt);
  const stamp = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
  return `Grade5-Unit1-ModelA_${safeFileName(name)}_${stamp}.txt`;
}

export function downloadReport(input: ReportInput): string {
  const text = "\uFEFF" + buildReport(input);
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = reportFileName(input.name, input.submittedAt);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  return a.download;
}
