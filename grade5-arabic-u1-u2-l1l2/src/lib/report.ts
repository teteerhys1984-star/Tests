import { totalPoints } from "../data/questions";
import type { QuestionGrades } from "./grading";

const pad = (n: number) => String(n).padStart(2, "0");

export function formatHMS(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const s = safe % 60;
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

export function buildReportText(
  studentName: string,
  dateStr: string,
  timeStr: string,
  g: QuestionGrades,
): string {
  const maxPts = totalPoints();
  const lines: string[] = [];
  lines.push("====================================================================");
  lines.push("تقرير اختبار اللغة العربية - الصف الخامس الأساسي");
  lines.push("====================================================================");
  lines.push("");
  lines.push(`اسم الطالب: ${studentName}`);
  lines.push(`تاريخ ووقت التسليم: ${dateStr}`);
  lines.push(`الوقت المستغرق: ${timeStr}`);
  lines.push(
    `النتيجة النهائية: ${g.finalScore} / ${maxPts}  (${Math.round((g.finalScore / maxPts) * 100)}%)`,
  );
  lines.push("");
  lines.push(`عدد الإجابات الصحيحة: ${g.correctBranches}`);
  lines.push(`عدد الإجابات الخاطئة: ${g.wrongBranches}`);
  lines.push(`عدد الإجابات الجزئية: ${g.partialBranches}`);
  lines.push(`عدد الفروع غير المجابة: ${g.unanswered}`);
  lines.push("");
  lines.push("====================================================================");
  lines.push("المراجعة التفصيلية");
  lines.push("====================================================================");
  g.perQuestion.forEach((pq) => {
    lines.push("");
    lines.push(`---- ${pq.question.order}. ${pq.question.title} ----`);
    lines.push(`الدرس: ${pq.question.lesson}`);
    lines.push(
      `مجموع علامات السؤال: ${pq.totalMax} — حصل على: ${pq.totalEarned}`,
    );
    pq.perBranch.forEach((pb, idx) => {
      lines.push("");
      lines.push(`  الفرع ${idx + 1}: ${pb.branch.prompt}`);
      lines.push(`    إجابة الطالب: ${pb.grade.studentAnswerDisplay}`);
      lines.push(`    الإجابة الصحيحة: ${pb.grade.correctAnswerDisplay}`);
      lines.push(
        `    العلامة: ${pb.grade.earnedPoints} / ${pb.grade.maxPoints}`,
      );
      lines.push(`    الشرح: ${pb.branch.explanation}`);
      lines.push(
        `    المرجع: ${pb.branch.source.lesson} — صفحة ${pb.branch.source.page}`,
      );
    });
  });
  lines.push("");
  lines.push("====================================================================");
  lines.push("انتهى التقرير");
  lines.push("====================================================================");

  return lines.join("\n");
}

export function reportFilename(studentName: string): string {
  const safeName =
    studentName.trim().replace(/[^\p{L}\p{N}_-]/gu, "_") || "student";
  return `تقرير_اختبار_العربية_${safeName}.txt`;
}

export function downloadReport(
  studentName: string,
  dateStr: string,
  timeStr: string,
  g: QuestionGrades,
): boolean {
  try {
    const text = buildReportText(studentName, dateStr, timeStr, g);
    const blob = new Blob(["\uFEFF" + text], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = reportFilename(studentName);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return true;
  } catch {
    return false;
  }
}
