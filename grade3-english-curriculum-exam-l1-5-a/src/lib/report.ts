import { EXAM, LESSONS, lessonLabel } from "../data/lessons";
import type { ExamResult, ExamState, Question } from "../types";
import {
  answerToText,
  correctAnswerText,
  formatDateTime,
  formatHMS,
  formatMarks,
  gradeLabel,
  partPrompt,
  passageToLines,
  sourceShort,
} from "./format";

export function reportFileName(studentName: string): string {
  const safe =
    studentName
      .trim()
      .replace(/[\\/:*?"<>|\u0000-\u001f]+/g, "")
      .replace(/\s+/g, "_")
      .replace(/_+/g, "_")
      .slice(0, 60) || "Student";
  return `Grade3_English_Exam_${safe}.txt`;
}

const STATUS_LABEL = { correct: "Correct", partial: "Partly correct", incorrect: "Incorrect" } as const;

export function buildReport(state: ExamState, result: ExamResult, questions: Question[]): string {
  const line = "=".repeat(64);
  const thin = "-".repeat(64);
  const out: string[] = [];
  const submitted = state.submittedAt ?? Date.now();
  const percent = result.max ? Math.round((result.total / result.max) * 100) : 0;

  out.push(line);
  out.push(`${EXAM.title.toUpperCase()} — ${EXAM.unit.toUpperCase()}, LESSONS 1–5`);
  out.push(line);
  out.push(`Student name:      ${state.studentName}`);
  out.push(`Grade:             ${EXAM.grade}`);
  out.push(`Unit:              ${EXAM.unit}`);
  out.push(`Lessons covered:   ${LESSONS.map((l) => `Lesson ${l.id} – ${l.title}`).join("; ")}`);
  out.push(`Attempt ID:        ${state.attemptId}`);
  if (state.startedAt) out.push(`Exam started:      ${formatDateTime(state.startedAt)}`);
  out.push(`Submitted:         ${formatDateTime(submitted)} (${new Date(submitted).toISOString()})`);
  out.push(`Time taken:        ${formatHMS(state.elapsedMs)}`);
  out.push(`Total score:       ${formatMarks(result.total)} / ${formatMarks(result.max)} (${percent}%)`);
  out.push(`Grade label:       ${gradeLabel(percent)}`);
  out.push(
    `Questions:         ${questions.length} · Correct (full marks): ${result.correctCount} · Partly correct: ${result.partialCount} · Incorrect: ${result.incorrectCount}`,
  );
  out.push("");
  out.push("SCORES BY LESSON");
  out.push(thin);
  LESSONS.forEach((l) => {
    const s = result.byLesson[l.id];
    out.push(`${lessonLabel(l.id).padEnd(34, " ")} ${formatMarks(s.earned).padStart(4, " ")} / ${formatMarks(s.max)}  (${s.questions} questions)`);
  });
  out.push("");
  out.push("QUESTION-BY-QUESTION REVIEW");
  out.push(line);

  questions.forEach((q, index) => {
    const r = result.questions.find((x) => x.questionId === q.id);
    if (!r) return;
    out.push("");
    out.push(`Question ${index + 1} of ${questions.length}  ·  ${lessonLabel(q.lesson)}  ·  ${formatMarks(r.earned)} / ${formatMarks(r.max)} marks  ·  ${STATUS_LABEL[r.status]}`);
    out.push(`Format:      ${q.format}`);
    out.push(`Instruction: ${q.instruction}`);
    const passage = passageToLines(q);
    if (passage.length) {
      out.push(`Text (${q.passage?.title}):`);
      passage.forEach((p) => out.push(`   ${p}`));
    }
    q.parts.forEach((part) => {
      const pr = r.parts.find((x) => x.partId === part.id);
      const answers = state.answers[q.id];
      out.push(`  • ${partPrompt(q, part.id)}`);
      out.push(`      Student answer: ${answerToText(part, answers?.[part.id])}`);
      out.push(`      Correct answer: ${correctAnswerText(part)}`);
      out.push(`      Marks:          ${formatMarks(pr?.earned ?? 0)} / ${formatMarks(part.marks)}${pr?.correct ? "  ✓" : "  ✗"}`);
    });
    out.push(`Explanation: ${q.explanation}`);
    q.sources.forEach((s) => out.push(`Source:      ${sourceShort(q.lesson, s)}${s.detail ? ` — ${s.detail}` : ""}`));
    out.push(thin);
  });

  out.push("");
  out.push(`Report generated: ${formatDateTime(Date.now())}`);
  out.push("Curriculum basis: Grade 3 Pupil’s Book and Workbook, Unit 1, Lessons 1–5.");
  return out.join("\n");
}

export function downloadTextFile(fileName: string, content: string): void {
  const blob = new Blob(["\uFEFF" + content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
