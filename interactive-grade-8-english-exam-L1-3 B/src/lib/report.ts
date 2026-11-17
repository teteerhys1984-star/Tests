import type { ExamReport } from "./grading";
import { formatClock, formatDateTime } from "./grading";

const RULE = "=".repeat(72);
const LINE = "-".repeat(72);

export function reportToText(report: ExamReport): string {
  const lines: string[] = [];

  lines.push("GRADE 8 ENGLISH EXAMINATION — UNIT 1 (LESSONS 1, 2 AND 3) — MODEL B");
  lines.push(RULE);
  lines.push(`Student name : ${report.name}`);
  lines.push("Version      : Model B");
  lines.push(`Submitted    : ${formatDateTime(report.submittedAt)}`);
  lines.push(`Time spent   : ${formatClock(report.timeSpentSeconds)}`);
  lines.push(
    `Total score  : ${report.total} / ${report.maxTotal}  (${report.percentage}%)`,
  );
  lines.push(
    `Answers      : ${report.correctCount} correct · ${report.incorrectCount} incorrect`,
  );
  lines.push("");
  lines.push("LESSON SCORES");
  report.lessons.forEach((l) => {
    lines.push(`  Lesson ${l.id} — ${l.title}: ${l.earned} / ${l.max}`);
  });
  lines.push(RULE);
  lines.push("");

  let currentLesson = 0;
  report.questions.forEach((q) => {
    if (q.lesson !== currentLesson) {
      currentLesson = q.lesson;
      const meta = report.lessons.find((l) => l.id === currentLesson);
      lines.push(
        `LESSON ${currentLesson} — ${meta?.title ?? ""} — ${meta?.earned ?? 0} / ${meta?.max ?? 0}`,
      );
      lines.push(LINE);
    }
    lines.push(
      `Q${q.n} [${q.topic}] — ${q.source} — max ${q.max} marks — earned ${q.earned} marks`,
    );
    lines.push(`  Question : ${q.questionText}`);
    q.parts.forEach((p) => {
      const tag = q.parts.length > 1 ? `${p.label} — ` : "";
      lines.push(`  ${tag}Your answer   : ${p.student}`);
      lines.push(`  ${tag}Correct answer: ${p.correct}`);
      lines.push(`  ${tag}Marks         : ${p.earned} / ${p.max}`);
    });
    lines.push(`  Explanation: ${q.explanation}`);
    lines.push("");
  });

  lines.push(RULE);
  lines.push("END OF REPORT — MODEL B");
  lines.push("");
  return lines.join("\n");
}

export function reportFileName(name: string): string {
  const safe =
    name
      .trim()
      .replace(/[^\p{L}\p{N}\s-]/gu, "")
      .replace(/\s+/g, "-")
      .slice(0, 40) || "Student";
  return `Grade8-Unit1-ModelB-${safe}.txt`;
}

/** UTF-8 TXT download (BOM included so the Arabic name renders everywhere). */
export function downloadReport(report: ExamReport): void {
  const blob = new Blob(["\uFEFF" + reportToText(report)], {
    type: "text/plain;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = reportFileName(report.name);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}
