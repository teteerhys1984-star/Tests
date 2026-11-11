import {
  ALL_SUBPARTS,
  EXAM_ID,
  EXAM_TITLE,
  EXAM_VERSION,
  GRADE_LABEL,
  QUESTIONS,
  SUBJECT_LABEL,
  TOTAL_MARKS,
} from "./data";
import {
  formatDuration,
  formatTimestamp,
  sanitizeStudentName,
  statusLabel,
} from "./grade";
import type { Attempt, GradeResult, Question, SubpartGrade, Visual } from "./types";

export function buildReportFilename(studentName: string): string {
  return `Grade4_Mathematics_Adam_Report_${sanitizeStudentName(studentName)}.txt`;
}

function visualDataText(question: Question): string {
  if (!question.visual) return "";
  const visual: Visual = question.visual;
  if (visual.kind === "barV" || visual.kind === "barH") {
    const rows = visual.data.map((d) => `${d.label}: ${d.value}`).join(" | ");
    return `بيانات التمثيل البياني (${visual.title}، الوحدة: ${visual.unit}): ${rows}`;
  }
  if (visual.kind === "grid") {
    const pts = visual.points
      .map((p) => `${p.label}(${p.x}، ${p.y})`)
      .join(" | ");
    return `إحداثيات النقاط كما رُسمت على الشبكة (${visual.title}): ${pts}${visual.legend ? ` — ${visual.legend}` : ""}`;
  }
  if (visual.kind === "sequence") {
    return `حدود النمط المعروضة: ${visual.values.join("، ")}${visual.trailing ? "، ..." : ""}`;
  }
  if (visual.kind === "addition") {
    return `عمليات الجمع المعروضة: ${visual.problems.map((p) => `${p.a} + ${p.b}`).join(" | ")}`;
  }
  return "";
}

function subpartReport(grade: SubpartGrade, index: number): string {
  const marker = `${index + 1}`;
  const lines: string[] = [];
  lines.push(`  الجزء ${marker} [${grade.subpartId}] — ${grade.marks} درجة — الحالة: ${statusLabel(grade.status)} — الدرجة الممنوحة: ${grade.awarded}/${grade.marks}`);
  lines.push(`  نص الجزء: ${grade.prompt}`);
  lines.push(`  إجابة الطالب: ${grade.studentAnswer}`);
  lines.push(`  الإجابة الصحيحة: ${grade.correctAnswer}`);
  if (grade.fields && grade.fields.length) {
    grade.fields.forEach((f) => {
      lines.push(
        `    - ${f.label}: إجابة الطالب «${f.student || "—"}» | الصحيح «${f.correct}» | ${f.isCorrect ? "مطابقة" : "غير مطابقة"}`
      );
    });
  }
  lines.push(`  بدائل مقبولة: ${grade.accepted}`);
  lines.push(`  قاعدة الدرجة الجزئية: ${grade.partialRule}`);
  lines.push(`  الشرح: ${grade.explanation}`);
  lines.push(`  المرجع الداخلي للكتاب: ${grade.page}`);
  return lines.join("\n");
}

export function buildReport(attempt: Attempt, result: GradeResult): string {
  const lines: string[] = [];
  const rule = "=".repeat(64);
  lines.push(rule);
  lines.push(`${EXAM_TITLE} — تقرير اختبار الرياضيات`);
  lines.push(rule);
  lines.push(`الصف: ${GRADE_LABEL}`);
  lines.push(`المادة: ${SUBJECT_LABEL}`);
  lines.push(`معرّف الاختبار: ${EXAM_ID}`);
  lines.push(`إصدار الاختبار: ${EXAM_VERSION}`);
  lines.push(`معرّف المحاولة: ${attempt.attemptId}`);
  lines.push(`اسم الطالب: ${attempt.studentName}`);
  lines.push(`بدء الاختبار: ${formatTimestamp(attempt.startTime)}`);
  lines.push(`وقت التسليم: ${formatTimestamp(attempt.submissionTime ?? attempt.startTime)}`);
  lines.push(`مدة الاختبار: ${formatDuration(attempt.durationSeconds ?? 0)}`);
  lines.push("");
  lines.push(`الدرجة النهائية: ${result.awarded} / ${TOTAL_MARKS}`);
  lines.push(`النسبة المئوية: ${result.percentage}%`);
  lines.push(
    `ملخص الأجزاء (${result.subparts.length} جزءاً): صحيحة ${result.counts.correct} | جزئية ${result.counts.partial} | خاطئة ${result.counts.incorrect} | غير مجابة ${result.counts.unanswered}`
  );
  lines.push(`عدد الأسئلة الرئيسة: ${result.questions.length}`);
  lines.push(`نسخة الاختبار: مستوحاة من عالم المكعبات — ${EXAM_VERSION}`);
  lines.push("");
  lines.push("ملاحظة للمعلم: هذا التقرير محلي ولا يُرسل عبر الشبكة. التصحيح على مستوى الأجزاء، والمجموع الكلي 100 درجة.");
  lines.push("");

  result.questions.forEach((qg, qIndex) => {
    lines.push("-".repeat(64));
    lines.push(`السؤال ${qIndex + 1} [${qg.question.id}] — ${qg.marks} درجة — الدرجة الممنوحة: ${qg.awarded}/${qg.marks}`);
    lines.push(`العنوان: ${qg.question.title}`);
    lines.push(`نص السؤال: ${qg.question.stem}`);
    const visual = visualDataText(qg.question);
    if (visual) lines.push(visual);
    lines.push(`المرجع الداخلي للكتاب: ${qg.question.page}`);
    qg.question.subparts.forEach((sub, index) => {
      const grade = qg.subparts.find((s) => s.subpartId === sub.id);
      if (grade) {
        lines.push("");
        lines.push(subpartReport(grade, index));
      }
    });
    lines.push("");
  });

  lines.push(rule);
  lines.push(`المجموع النهائي: ${result.awarded} / ${TOTAL_MARKS} درجة — النسبة: ${result.percentage}%`);
  lines.push(`المدة: ${formatDuration(attempt.durationSeconds ?? 0)}`);
  lines.push(`نهاية التقرير — ${EXAM_TITLE}`);
  lines.push(rule);
  return lines.join("\n");
}

export function validateReport(
  report: string,
  attempt: Attempt,
  result: GradeResult,
  filename: string
): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  const required = [
    EXAM_TITLE,
    GRADE_LABEL,
    SUBJECT_LABEL,
    attempt.studentName,
    attempt.attemptId,
    formatTimestamp(attempt.startTime),
    formatTimestamp(attempt.submissionTime ?? attempt.startTime),
    formatDuration(attempt.durationSeconds ?? 0),
    `${result.awarded} / ${TOTAL_MARKS}`,
    `${result.percentage}%`,
  ];
  required.forEach((text) => {
    if (!text || !report.includes(text)) errors.push(`حقل مفقود أو غير مطابق: ${text}`);
  });
  if (result.total !== TOTAL_MARKS) errors.push("مجموع درجات الاختبار ليس 100.");
  if (result.questions.length !== 30) errors.push("عدد الأسئلة ليس 30.");
  if (result.subparts.length !== ALL_SUBPARTS.length) errors.push("عدد الأجزاء لا يطابق بنك الاختبار.");
  if (!QUESTIONS.every((q) => report.includes(`[${q.id}]`))) errors.push("بعض الأسئلة غير مدرجة في التقرير.");
  if (!result.subparts.every((s) => report.includes(`[${s.subpartId}]`))) errors.push("بعض الأجزاء غير مدرجة في التقرير.");
  if (!result.subparts.every((s) => report.includes(s.explanation))) errors.push("بعض الشروح غير مدرجة.");
  if (!result.subparts.every((s) => report.includes(s.page))) errors.push("بعض مراجع الصفحات غير مدرجة.");
  const countSum =
    result.counts.correct + result.counts.partial + result.counts.incorrect + result.counts.unanswered;
  if (countSum !== result.subparts.length) errors.push("عدد الحالات لا يطابق عدد الأجزاء.");
  if (result.awarded < 0 || result.awarded > result.total) errors.push("الدرجة النهائية خارج النطاق.");
  if (!filename.startsWith("Grade4_Mathematics_Adam_Report_")) errors.push("اسم الملف غير صحيح.");
  if (!filename.endsWith(".txt")) errors.push("امتداد الملف غير صحيح.");
  if (report.includes("somer173")) errors.push("يجب ألا تحتوي نسخة الطالب على كلمة مرور المعلم.");
  return { ok: errors.length === 0, errors };
}

export function downloadReport(text: string, filename: string): void {
  const payload = "\uFEFF" + text;
  const blob = new Blob([payload], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.setTimeout(() => URL.revokeObjectURL(url), 20000);
}
