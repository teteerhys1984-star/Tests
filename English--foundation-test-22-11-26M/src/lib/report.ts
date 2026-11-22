import type { MainQuestion, SubQuestion } from "@/data/exam";
import type { LessonId } from "@/data/exam";
import { LESSONS } from "@/data/lessons";
import { formatDateTime, formatDuration } from "./format";
import {
  answerDisplay,
  correctDisplay,
  acceptedDisplay,
  type AnswerValue,
  type ExamResult,
} from "./grading";

const RULE = "=".repeat(64);
const THIN = "-".repeat(64);

function pad(text: string, width: number): string {
  return text.length >= width ? text : text + " ".repeat(width - text.length);
}

/** Builds the UTF-8 plain-text report entirely on the device. */
export function buildReport(options: {
  studentName: string;
  startedAt: number;
  submittedAt: number;
  result: ExamResult;
  questions: MainQuestion[];
  answers: Record<string, AnswerValue>;
}): string {
  const { studentName, startedAt, submittedAt, result, questions, answers } = options;
  const out: string[] = [];

  out.push("ENGLISH FOUNDATION EXAM - TEST 1");
  out.push(RULE);
  out.push("");
  out.push("STUDENT INFORMATION");
  out.push(pad("Student name:", 22) + studentName);
  out.push(pad("Exam started:", 22) + formatDateTime(startedAt));
  out.push(pad("Completed:", 22) + formatDateTime(submittedAt));
  out.push(pad("Total time taken:", 22) + formatDuration(submittedAt - startedAt));
  out.push("");
  out.push("FINAL RESULT");
  out.push(pad("Final score:", 22) + `${result.total} / ${result.max} marks`);
  out.push(pad("Percentage:", 22) + `${result.percentage}%`);
  out.push(pad("Correct answers:", 22) + `${result.correctCount} of ${result.max}`);
  out.push(pad("Incorrect answers:", 22) + `${result.incorrectCount} of ${result.max}`);
  out.push("");
  out.push("QUESTION BREAKDOWN");
  out.push(RULE);
  out.push("");

  questions.forEach((q, index) => {
    const rq = result.questions[index];
    if (!rq) return;
    out.push(`QUESTION ${q.id}: ${q.title}`);
    out.push(`Reference: Lesson ${q.lesson} - ${LESSONS[q.lesson as LessonId].title}`);
    out.push(`Skill: ${q.skill}`);
    out.push(`Instruction: ${q.instruction}`);
    out.push(`Marks earned: ${rq.earned} / ${rq.max}`);
    out.push(THIN);
    q.subs.forEach((sub, subIndex) => {
      const rs = rq.subs[subIndex];
      const letter = String.fromCharCode(97 + subIndex);
      out.push(`(${letter}) ${stripMarks(sub.prompt)}`);
      out.push(`    Your answer:     ${answerDisplay(answers[sub.id])}`);
      out.push(`    Correct answer:  ${correctDisplay(sub)}`);
      out.push(`    Marks: ${rs ? rs.earned : 0} / ${rs ? rs.max : 1}`);
      out.push(`    Why: ${sub.explanation}`);
      out.push("");
    });
    out.push("");
  });

  out.push(RULE);
  out.push("Report generated locally on this device. No student data was sent anywhere.");
  out.push("");
  return out.join("\n");
}

function stripMarks(text: string): string {
  return text.replace(/\*\*(.+?)\*\*/g, "$1");
}

export function reportFileName(studentName: string): string {
  const safe = studentName
    .trim()
    .replace(/[^A-Za-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `English-Exam-Report-${safe || "Student"}.txt`;
}

export function downloadTextFile(text: string, fileName: string): void {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/** Exposed for the teacher area: every accepted form per part. */
export function acceptedForms(sub: SubQuestion): string {
  return acceptedDisplay(sub).join(" | ");
}
