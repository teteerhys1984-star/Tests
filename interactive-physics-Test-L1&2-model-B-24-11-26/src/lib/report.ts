import type { Question, RichText } from "../data/questions";
import type { ExamResult } from "./grading";
import type { Attempt } from "./persistence";
import { formatDuration } from "./persistence";

export function richToPlain(content: RichText): string {
  return content.map((part) => {
    if ("text" in part) return part.text;
    let latex = part.math
      .replace(/\\mathrm\{([^{}]*)\}/g, "$1")
      .replace(/\\text\{([^{}]*)\}/g, "$1")
      .replace(/_\{([^{}]*)\}/g, "_$1");
    for (let i = 0; i < 5; i += 1) {
      latex = latex.replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/g, "($1)/($2)");
    }
    return latex
      .replace(/\\times/g, " × ")
      .replace(/\\quad/g, " ")
      .replace(/\\Longrightarrow/g, " ⇒ ")
      .replace(/\\,/g, " ")
      .replace(/_\{([^{}]*)\}/g, "_$1")
      .replace(/[{}\\]/g, "")
      .replace(/\s+/g, " ");
  }).join("").trim();
}

export function responseToPlain(question: Question, partId: string, value: string): string {
  const part = question.parts.find((item) => item.id === partId);
  const option = part?.options?.find((item) => item.id === value);
  return option?.label ?? value ?? "لم تُجب";
}

export function buildReport(questions: Question[], attempt: Attempt, result: ExamResult): string {
  const lines = [
    "اختبار الفيزياء — الصف السابع | النموذج B",
    "========================================",
    `اسم الطالبة: ${attempt.studentName}`,
    `العلامة النهائية: ${result.total} من ${result.possible}`,
    `النسبة المئوية: ${Math.round(result.total / result.possible * 100)}%`,
    `الوقت المستغرق: ${formatDuration((attempt.finishedAt ?? attempt.startedAt) - attempt.startedAt)}`,
    `الإجابات الصحيحة: ${result.correctCount} | الإجابات الخاطئة أو الجزئية: ${result.incorrectCount}`,
    "الفرع ذو العلامة الجزئية يُحسب غير مكتمل العلامة في عداد الإجابات.",
    "",
  ];

  questions.forEach((question, index) => {
    const graded = result.questions[index];
    lines.push(`السؤال ${index + 1}: ${question.title} (${graded.earned}/${graded.possible})`);
    lines.push(`الدرس: ${question.lesson} | المرجع: ${question.pages} | المهارة: ${question.skill}`);
    lines.push(`الموقف: ${richToPlain(question.intro)}`);
    if (question.figureSource) lines.push(`مرجع الرسم: ${question.figureSource}`);
    question.parts.forEach((part, partIndex) => {
      const branch = graded.parts[partIndex];
      lines.push(`  ${partIndex + 1}. ${richToPlain(part.label)}`);
      lines.push(`     إجابة الطالبة: ${responseToPlain(question, part.id, branch.response)}`);
      lines.push(`     الإجابة الصحيحة: ${richToPlain(branch.correct)}`);
      lines.push(`     العلامة المستحقة: ${branch.earned}/${branch.possible}`);
      lines.push(`     الشرح: ${richToPlain(branch.explanation)}`);
    });
    lines.push(`الحل الكامل: ${richToPlain(graded.solution)}`);
    lines.push("----------------------------------------", "");
  });
  return lines.join("\n");
}

export function downloadReport(questions: Question[], attempt: Attempt, result: ExamResult): void {
  const filenameName = attempt.studentName.trim().replace(/[^\p{L}\p{N}_-]+/gu, "-").slice(0, 60) || "طالبة";
  const blob = new Blob(["\ufeff", buildReport(questions, attempt, result)], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `تقرير-اختبار-الفيزياء-B-${filenameName}.txt`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}