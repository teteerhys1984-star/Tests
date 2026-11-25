import { EXAM_SUBTITLE, EXAM_TITLE, TOTAL_MARKS } from "../data/exam";
import { displayAnswer, displayCorrect, type ExamResult, type ItemStatus } from "./grading";
import { formatDateTime, formatHMS, safeFileName } from "./storage";

const STATUS_TEXT: Record<ItemStatus, string> = {
  correct: "CORRECT",
  spelling: "SPELLING MISTAKE (half marks: the word is right but the spelling is not exact)",
  incorrect: "INCORRECT",
  unanswered: "NO ANSWER",
};

const RULE = "=".repeat(68);
const THIN = "-".repeat(68);

/** Builds the plain-text (UTF-8) student report. Generated entirely in the browser. */
export function buildReport(params: {
  studentName: string;
  result: ExamResult;
  startedAt: number;
  submittedAt: number;
}): string {
  const { studentName, result, startedAt, submittedAt } = params;
  const lines: string[] = [];
  const push = (s = "") => lines.push(s);

  push(RULE);
  push(`${EXAM_TITLE.toUpperCase()} – STUDENT REPORT`);
  push(RULE);
  push(`Exam title      : ${EXAM_TITLE} – ${EXAM_SUBTITLE}`);
  push(`Student name    : ${studentName}`);
  push(`Submitted on    : ${formatDateTime(submittedAt)}`);
  push(`Time taken      : ${formatHMS(submittedAt - startedAt)} (HH:MM:SS)`);
  push(`Total score     : ${result.total} / ${TOTAL_MARKS}`);
  push(`Percentage      : ${result.percent}%`);
  push();

  push("SCORE BY QUESTION");
  push(THIN);
  for (const q of result.questions) {
    push(`Question ${q.question.number}: ${q.question.title}`.padEnd(64) + `${q.awarded} / ${q.max}`);
  }
  push(THIN);
  push(`TOTAL${"".padEnd(59)}${result.total} / ${TOTAL_MARKS}`);
  push();

  push("DETAILED RESULTS");
  push(RULE);
  for (const q of result.questions) {
    push();
    push(`QUESTION ${q.question.number}: ${q.question.title}`);
    push(`Score: ${q.awarded} / ${q.max} marks`);
    push(`Curriculum: Unit 1 · Lesson 1 – At School`);
    let lastPart = "";
    for (const r of q.items) {
      if (r.partTitle !== lastPart) {
        push();
        push(`  ${r.partTitle}`);
        lastPart = r.partTitle;
      }
      const ref = r.item.ref;
      push(`  Item ${r.label}  [${r.item.kind === "vocab" ? "Vocabulary" : "Question"}]`);
      if (r.item.arabic) push(`    Arabic prompt   : ${r.item.arabic}`);
      else push(`    Prompt          : ${r.item.prompt}`);
      if (r.item.kind === "vocab") push(`    Prompt (task)   : Type the English word.`);
      push(`    Student answer  : ${displayAnswer(r.item, r.submitted)}`);
      push(`    Correct answer  : ${displayCorrect(r.item)}`);
      push(`    Result          : ${STATUS_TEXT[r.status]}`);
      push(`    Marks           : ${r.awarded} / ${r.item.marks}`);
      if (r.status !== "correct") push(`    Explanation     : ${r.item.explanation}`);
      push(`    Curriculum ref  : ${ref.unit} · ${ref.lesson} · ${ref.source}`);
      push(`                      Skill: ${ref.skill}`);
    }
  }

  push();
  push(RULE);
  push("MARKING RULES");
  push(THIN);
  push("Vocabulary (Questions 1–3): the English word is typed. Capital letters and extra");
  push("spaces are ignored. A small spelling slip earns half marks and is shown as a");
  push("SPELLING MISTAKE. A different word earns no marks.");
  push("Other questions: full marks for the correct choice or order; no partial marks.");
  push("Each sub-part is marked independently.");
  push(RULE);
  push("End of report.");

  return lines.join("\r\n") + "\r\n";
}

/** Triggers a UTF-8 .txt download (BOM included so Windows editors show Arabic prompts correctly). */
export function downloadTextReport(name: string, content: string) {
  const blob = new Blob(["\uFEFF", content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `English-Exam-Report_${safeFileName(name)}.txt`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
