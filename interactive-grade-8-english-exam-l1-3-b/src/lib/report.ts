import { EXAM_TITLE } from "@/config";
import { PASSAGES } from "@/data/exam";
import type { ExamReport } from "@/lib/grading";
import { formatClock, formatDateTime } from "@/lib/grading";

const RULE = "=".repeat(72);
const LINE = "-".repeat(72);

export function reportToText(report: ExamReport): string {
  const lines: string[] = [];

  lines.push(RULE);
  lines.push(" GRADE 8 ENGLISH EXAMINATION — UNIT 1 (LESSONS 1, 2 AND 3) — MODEL B");
  lines.push(` ${EXAM_TITLE}`);
  lines.push(" Official answer report");
  lines.push(RULE);
  lines.push(`Student name : ${report.name}`);
  lines.push(`Exam title   : ${EXAM_TITLE}`);
  lines.push("Version      : Model B (Grade 8 · Semester 1 · English)");
  lines.push(`Started      : ${formatDateTime(report.startedAt)}`);
  lines.push(`Submitted    : ${formatDateTime(report.submittedAt)}`);
  lines.push(`Time spent   : ${formatClock(report.timeSpentSeconds)}`);
  lines.push(
    `Total score  : ${report.total} / ${report.maxTotal}  (${report.percentage}% — ${report.gradeLabel})`,
  );
  lines.push(
    `Questions    : ${report.fullQuestions} full · ${report.partialQuestions} partial · ${report.wrongQuestions} zero`,
  );
  lines.push(
    `Answer parts : ${report.correctCount} correct · ${report.wrongAnsweredCount} incorrect · ${report.unansweredCount} unanswered`,
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
    const statusTag = q.ok ? "FULL" : q.partial ? "PARTIAL" : "ZERO";
    lines.push(
      `Q${q.n} [${q.topic}] — ${q.source} — earned ${q.earned} / ${q.max} marks [${statusTag}]`,
    );
    lines.push(`  Instruction: ${q.instruction}`);
    q.parts.forEach((p) => {
      const tag = q.parts.length > 1 ? `${p.label} — ` : "";
      const partState =
        p.status === "correct"
          ? "CORRECT"
          : p.status === "unanswered"
            ? "UNANSWERED"
            : "INCORRECT";
      lines.push(`  ${tag}Prompt        : ${p.promptText}`);
      lines.push(`  ${tag}Your answer   : ${p.student}`);
      lines.push(`  ${tag}Correct answer: ${p.correct}`);
      lines.push(`  ${tag}Marks         : ${p.earned} / ${p.max} [${partState}]`);
    });
    lines.push(`  Explanation: ${q.explanation}`);
    if (q.topic.includes("Reading")) {
      const passage = PASSAGES.find((ps) => ps.lesson === q.lesson);
      if (passage) lines.push(`  Passage    : ${passage.title}`);
    }
    lines.push("");
  });

  lines.push(RULE);
  lines.push("Contact: المهندس سومر شاهين · 0930215022 · https://wa.me/963930215022");
  lines.push(`END OF REPORT — ${EXAM_TITLE}`);
  lines.push(RULE);
  return lines.join("\r\n");
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

/** UTF-8 TXT download (BOM included so Arabic and English names render everywhere). */
export function downloadReport(report: ExamReport): boolean {
  try {
    const blob = new Blob(["\uFEFF" + reportToText(report)], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = reportFileName(report.name);
    a.rel = "noopener";
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    return true;
  } catch {
    return false;
  }
}
