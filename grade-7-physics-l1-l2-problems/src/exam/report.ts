import {
  EXAM_ID,
  EXAM_TITLE,
  GRADE_LABEL,
  SEMESTER_LABEL,
  SUBJECT_LABEL,
  TOTAL_MARKS,
} from "../config";
import { allProblems, lessons } from "../content/problems";
import { site } from "../lib/site";
import { formatMarks } from "./grading";
import type { ExamAttempt, ExamResult, QuestionStatus, SubpartStatus } from "./types";

export const QUESTION_STATUS_AR: Record<QuestionStatus, string> = {
  correct: "إجابة صحيحة",
  partial: "إجابة جزئية",
  wrong: "إجابة خاطئة",
  unanswered: "غير مجابة",
};

export const SUBPART_STATUS_AR: Record<SubpartStatus, string> = {
  correct: "إجابة صحيحة",
  wrong: "إجابة خاطئة",
  unanswered: "غير مجابة",
};

export function plainMath(text: string): string {
  return text
    .replace(/\$\$/g, "")
    .replace(/\$/g, "")
    .replace(/\\dfrac\{([^{}]+)\}\{([^{}]+)\}/g, "($1)/($2)")
    .replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, "($1)/($2)")
    .replace(/\\text\{([^{}]+)\}/g, "$1")
    .replace(/\\times/g, "×")
    .replace(/\\div/g, "÷")
    .replace(/\\cdot/g, "·")
    .replace(/\\Rightarrow/g, "⇐")
    .replace(/\\approx/g, "≈")
    .replace(/\\oplus/g, "الأرض")
    .replace(/\\Delta/g, "Δ")
    .replace(/\\quad/g, " ")
    .replace(/\\,/g, " ")
    .replace(/\^\{-1\}/g, "⁻¹")
    .replace(/_\{([^{}]+)\}/g, "_$1")
    .replace(/[{}]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function formatDurationArabic(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const hrs = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
}

export function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export function buildReportText(attempt: ExamAttempt, result: ExamResult): string {
  const hr = "=".repeat(64);
  const dash = "-".repeat(64);
  const lines: string[] = [];

  const startIso = attempt.startedAt;
  const submitIso = attempt.submittedAt ?? new Date().toISOString();
  const elapsedMs =
    attempt.elapsedMs ?? Math.max(0, new Date(submitIso).getTime() - new Date(startIso).getTime());

  lines.push(hr);
  lines.push(`${EXAM_TITLE} — تقرير نتيجة الطالب`);
  lines.push(`${GRADE_LABEL} | ${SEMESTER_LABEL} | ${SUBJECT_LABEL}`);
  lines.push(`معرّف الاختبار: ${EXAM_ID}`);
  lines.push(`إشراف: ${site.teacher} — واتساب: ${site.whatsappDisplay}`);
  lines.push(hr);
  lines.push(`اسم الطالب/ة: ${attempt.studentName}`);
  lines.push(`معرّف المحاولة: ${attempt.attemptId}`);
  lines.push(`وقت البدء: ${formatTimestamp(startIso)}`);
  lines.push(`وقت التسليم: ${formatTimestamp(submitIso)}`);
  lines.push(`المدة المستغرقة: ${formatDurationArabic(elapsedMs)}`);
  lines.push(dash);
  lines.push(
    `العلامة النهائية: ${formatMarks(result.total)} / ${TOTAL_MARKS} (${result.percentage}%) — التقدير: ${result.gradeLabel}`,
  );
  lines.push(
    `حالة المسائل (${result.questionCounts.total}): صحيحة ${result.questionCounts.correct} | جزئية ${result.questionCounts.partial} | خاطئة ${result.questionCounts.wrong} | غير مجابة ${result.questionCounts.unanswered}`,
  );
  lines.push(
    `حالة الفروع (${result.subpartCounts.total}): صحيحة ${result.subpartCounts.correct} | خاطئة ${result.subpartCounts.wrong} | غير مجابة ${result.subpartCounts.unanswered}`,
  );
  lines.push("");
  lines.push("توزيع العلامات حسب الدرس:");
  for (const l of result.lessons) {
    lines.push(
      `  • ${l.title}: ${formatMarks(l.awarded)} / ${l.max} (${l.percentage}%) — صحيحة: ${l.correctCount}، جزئية: ${l.partialCount}، خاطئة: ${l.wrongCount}، غير مجابة: ${l.unansweredCount}`,
    );
  }
  lines.push("");
  lines.push("توزيع العلامات حسب المستوى:");
  for (const lvl of result.levels) {
    lines.push(`  • ${lvl.level} (${lvl.count} مسائل): ${formatMarks(lvl.awarded)} / ${lvl.max}`);
  }
  lines.push(hr);
  lines.push("المراجعة التفصيلية للمسائل:");
  lines.push("");

  const problemById = new Map(allProblems.map((p) => [p.id, p]));
  result.questions.forEach((q, idx) => {
    const prob = problemById.get(q.problemId);
    const lessonMeta = lessons[q.lessonId];
    lines.push(
      `[${idx + 1}] ${q.title} (${lessonMeta.title} — ${q.level}) | ${QUESTION_STATUS_AR[q.status]} | ${formatMarks(q.awarded)} / ${q.max}`,
    );
    for (const sp of q.subparts) {
      lines.push(
        `    - ${sp.spec.prompt}: [${SUBPART_STATUS_AR[sp.status]}] (${formatMarks(sp.awarded)}/${sp.max})`,
      );
      lines.push(`      إجابة الطالب: ${plainMath(sp.displayAnswer)}`);
      lines.push(`      الإجابة الصحيحة: ${plainMath(sp.spec.answerDisplay)}`);
    }
    if (prob) {
      lines.push(`    الحل النموذجي: ${plainMath(prob.solution.answer.tex)}`);
    }
    lines.push(dash);
  });

  return lines.join("\n");
}

export function buildReportFilename(studentName: string): string {
  const safeName = studentName
    .trim()
    .replace(/[^\p{L}\p{N}_-]+/gu, "-")
    .replace(/^-+|-+$/g, "");
  return `${EXAM_ID}-${safeName || "student"}-report.txt`;
}

export function downloadTextReport(text: string, filename: string): void {
  const blob = new Blob(["\uFEFF" + text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
