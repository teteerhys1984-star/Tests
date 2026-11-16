import { EXAM_SUBTITLE, EXAM_TITLE, LESSONS } from "../data/lessons";
import { ExamEvaluation, ExamQuestion } from "../types/exam";
import { formatMark, formatSourceReference } from "./grading";
import { formatDurationHHMMSS } from "./timer";

export interface ReportPayload {
  studentName: string;
  submittedAtIso: string;
  elapsedSeconds: number;
  evaluation: ExamEvaluation;
}

export function buildReportFilename(studentName: string): string {
  const cleaned = studentName
    .trim()
    .replace(/[^a-zA-Z0-9\s_-]/g, "")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");

  const safeName = cleaned.length > 0 ? cleaned.slice(0, 48) : "Student";
  return `Grade3_English_Exam_${safeName}.txt`;
}

export function formatSubmissionDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return date.toLocaleString("en-GB", {
    year: "numeric",
    month: "long",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

function describeQuestionText(question: ExamQuestion): string[] {
  const lines: string[] = [];
  lines.push(`Instruction: ${question.instruction}`);

  if (question.stimuli) {
    for (const stim of question.stimuli) {
      if (stim.kind === "reading") {
        lines.push(`Reading Text (${stim.heading}):`);
        for (const l of stim.lines) {
          const prefix = l.speaker
            ? `${l.speaker}: `
            : l.label
            ? `[${l.label}] `
            : "";
          lines.push(`  ${prefix}${l.text}`);
        }
      } else if (stim.kind === "word-bank") {
        lines.push(
          `${stim.label || "Word box"}: ${stim.words.join(" · ")}`
        );
      } else if (stim.kind === "table") {
        lines.push(`Table (${stim.heading}): ${stim.headers.join(" | ")}`);
        for (const row of stim.rows) {
          lines.push(`  ${row.map((c) => c.text || "").join(" | ")}`);
        }
      } else if (stim.kind === "example") {
        lines.push(`${stim.label}: ${stim.text}`);
      }
    }
  }

  if (question.type === "single-choice") {
    lines.push(`Prompt: ${question.prompt}`);
    lines.push(`Options: ${question.options.join(" / ")}`);
  } else if (question.type === "reorder") {
    lines.push(`Words to reorder: ${question.words.join(" / ")} (${question.endPunctuation})`);
  }

  return lines;
}

export function generateTxtReport(payload: ReportPayload): string {
  const { studentName, submittedAtIso, elapsedSeconds, evaluation } = payload;
  const divider = "=".repeat(72);
  const subDivider = "-".repeat(72);

  const lessonsCovered = LESSONS.map(
    (l) => `Lesson ${l.number}: ${l.title}`
  ).join(", ");

  const lines: string[] = [
    divider,
    `${EXAM_TITLE.toUpperCase()} — ${EXAM_SUBTITLE.toUpperCase()}`,
    divider,
    `Student Name        : ${studentName.trim()}`,
    `Grade               : Grade 3 — Unit 1`,
    `Lessons Covered     : ${lessonsCovered}`,
    `Date & Time         : ${formatSubmissionDateTime(submittedAtIso)}`,
    `Time Taken          : ${formatDurationHHMMSS(elapsedSeconds)}`,
    `Total Questions     : ${evaluation.questionResults.length}`,
    `Total Score         : ${formatMark(evaluation.totalEarned)} / ${formatMark(evaluation.totalMax)} (${evaluation.percentage}%)`,
    `Correct Questions   : ${evaluation.correctCount}`,
    ...(evaluation.partialCount > 0
      ? [`Partially Correct   : ${evaluation.partialCount}`]
      : []),
    `Incorrect Questions : ${evaluation.incorrectCount}`,
    "",
    divider,
    "LESSON-BY-LESSON SCORES",
    divider,
  ];

  for (const lesson of evaluation.lessonScores) {
    lines.push(
      `Lesson ${lesson.lesson} — ${lesson.title.padEnd(18, " ")} : ${formatMark(
        lesson.earnedMarks
      ).padStart(4, " ")} / ${lesson.maxMarks} marks  (${lesson.questionCount} questions)`
    );
  }

  lines.push("");
  lines.push(divider);
  lines.push("DETAILED QUESTION-BY-QUESTION REVIEW (QUESTIONS 1 TO 50)");
  lines.push(divider);

  for (const res of evaluation.questionResults) {
    const statusTag =
      res.status === "correct"
        ? "CORRECT"
        : res.status === "partial"
        ? "PARTIALLY CORRECT"
        : "INCORRECT";

    lines.push("");
    lines.push(
      `Question ${res.examNumber} [${res.question.formatLabel}] — ${statusTag} — Marks: ${formatMark(
        res.earnedMarks
      )} / ${formatMark(res.maxMarks)}`
    );
    lines.push(...describeQuestionText(res.question));

    if (res.subParts.length === 1) {
      lines.push(`Student Answer : ${res.studentAnswerSummary}`);
      lines.push(`Correct Answer : ${res.correctAnswerSummary}`);
    } else {
      lines.push("Sub-parts:");
      for (const sp of res.subParts) {
        const markStr = `${formatMark(sp.earnedMarks)}/${formatMark(sp.maxMarks)}`;
        lines.push(`  • ${sp.label}`);
        lines.push(`      Student Answer : ${sp.studentAnswer}`);
        lines.push(`      Correct Answer : ${sp.correctAnswer}`);
        lines.push(`      Marks Earned   : ${markStr}`);
      }
    }

    lines.push(`Explanation    : ${res.question.explanation}`);
    lines.push(`Source Ref     : ${formatSourceReference(res.question.source)}`);
    lines.push(subDivider);
  }

  lines.push("End of Report — Grade 3 English Curriculum Exam (Unit 1, Lessons 1–5)");
  return lines.join("\n");
}

export function downloadTxtReport(payload: ReportPayload): void {
  const reportText = generateTxtReport(payload);
  const filename = buildReportFilename(payload.studentName);
  // Prepend UTF-8 BOM only if needed; clean UTF-8 Blob ensures full compatibility
  const blob = new Blob([reportText], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
