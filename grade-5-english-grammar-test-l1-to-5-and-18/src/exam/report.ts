import { EXAM_QUESTIONS } from "./examData";
import { EXAM_TITLE } from "../config";
import { formatDate, formatSeconds, type ExamResult } from "./grading";

export function safeFilename(name: string): string {
  const cleaned = name
    .normalize("NFKC")
    .replace(/[\\/:*?"<>|\u0000-\u001f]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return cleaned || "Student";
}

export function buildReport(result: ExamResult, backup = false): string {
  const lines: string[] = [];
  const rule = "==============================================";
  const thinRule = "----------------------------------------------";
  lines.push(rule);
  lines.push("GRAMMAR TEST LESSONS 1 TO 5 AND 18");
  lines.push(backup ? "BACKUP EXAM REPORT" : "EXAM REPORT");
  lines.push(rule);
  lines.push("");
  lines.push(`Student name: ${result.studentName}`);
  lines.push(`Final score: ${result.score} / ${result.totalMarks}`);
  lines.push(`Percentage: ${result.percentage}%`);
  lines.push(`Branches correct: ${result.correctCount} / ${result.branchCount}`);
  lines.push(`Branches incorrect: ${result.incorrectCount}`);
  lines.push(`Time taken: ${formatSeconds(result.elapsedSeconds)}`);
  lines.push(`Submitted: ${formatDate(result.submittedAt)}`);
  lines.push(`Lessons covered: Lessons 1, 2, 3, 4, 5 and 18`);
  lines.push(`Exam: ${EXAM_TITLE}`);
  lines.push("");
  lines.push("QUESTION SCORES");
  lines.push(thinRule);
  result.questionResults.forEach((question) => {
    lines.push(
      `Question ${question.number}: ${question.title} - ${question.earned} / ${question.totalMarks}`
    );
  });
  lines.push("");
  lines.push("DETAILED REVIEW");
  lines.push(thinRule);

  result.questionResults.forEach((question) => {
    lines.push("");
    lines.push(
      `QUESTION ${question.number} - ${question.title} (${question.earned}/${question.totalMarks} marks)`
    );
    lines.push(`Lesson reference: ${question.lessons.map((lesson) => `Lesson ${lesson}`).join(", ")}`);
    lines.push("");
    question.branches.forEach((branch) => {
      lines.push(`Sub-question ${branch.branchId} - ${branch.marks} mark(s)`);
      lines.push(`Instruction: ${branch.prompt}`);
      if (branch.display) lines.push(`Item: ${branch.display}`);
      lines.push(`Student answer: ${branch.submitted}`);
      lines.push(`Correct answer: ${branch.correct}`);
      lines.push(`Result: ${branch.isCorrect ? "Correct" : "Incorrect"} - ${branch.earned}/${branch.marks}`);
      lines.push(`Lesson: ${branch.lesson} | Skill: ${branch.skill}`);
      lines.push(`Explanation: ${branch.explanation}`);
      lines.push("");
    });
    lines.push(thinRule);
  });

  lines.push("");
  lines.push("MARKING SUMMARY");
  lines.push("Each sub-question is marked independently using its listed mark value.");
  lines.push("No correct answers, hints, or scores were shown before submission.");
  lines.push("No half marks are used. Written answers ignore capital letters and final punctuation only.");
  lines.push("Word-order answers require the complete sentence in the correct order.");
  lines.push("");
  lines.push("Lessons covered: Lesson 1, Lesson 2, Lesson 3, Lesson 4, Lesson 5, Lesson 18.");
  lines.push("Teacher contact: Eng. Somer Shaheen - 0930215022");
  lines.push("");
  lines.push(backup ? "End of backup report." : "End of report.");
  lines.push(rule);

  return lines.join("\r\n");
}

export function downloadTextFile(filename: string, content: string): void {
  const blob = new Blob([`\ufeff${content}`], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadReport(result: ExamResult, backup = false): void {
  const suffix = backup ? "-Backup" : "";
  const filename = `Grammar-Test-Lessons-1-to-5-and-18-Report-${safeFilename(result.studentName)}${suffix}.txt`;
  downloadTextFile(filename, buildReport(result, backup));
}

export const EXAM_MARK_TOTAL = EXAM_QUESTIONS.reduce(
  (sum, question) => sum + question.totalMarks,
  0
);
