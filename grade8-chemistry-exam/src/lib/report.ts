import type { Question, QuestionFigure } from "../data/exam";
import { EXAM_META, sourceLabel } from "../data/exam";
import type { AnswerMap, ExamSummary } from "./grading";
import { formatCorrectAnswer, formatStudentAnswer, gradePart, toEnglishDigits } from "./grading";

export const pad2 = (n: number): string => String(n).padStart(2, "0");

export const formatTimestamp = (ts: number): string => {
  const d = new Date(ts);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
};

export const formatDuration = (totalSeconds: number): string => {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${pad2(h)}:${pad2(m)}:${pad2(sec)}`;
};

export const sanitizeName = (name: string): string => {
  const cleaned = name
    .normalize("NFC")
    .replace(/[\\/:*?"<>|\u0000-\u001F\u007F]/g, "")
    .trim()
    .replace(/\s+/g, "_");
  return cleaned || "طالب";
};

export const reportFilename = (studentName: string): string =>
  `Grade8_Chemistry_Unit1_Lessons1-2_Report_${sanitizeName(studentName)}.txt`;

const statusArabic = (status: string): string => {
  if (status === "correct") return "صحيحة";
  if (status === "partial") return "صحيحة جزئيًا";
  if (status === "unanswered") return "دون إجابة";
  return "خاطئة";
};

const clean = (value: string): string => toEnglishDigits(String(value ?? "")).replace(/\r/g, "");

const letters = ["أ", "ب", "ج", "د", "هـ", "و", "ز", "ح", "ط", "ي"];

const partBankText = (part: Question["parts"][number], order?: string[]): string => {
  if (part.type === "mc" || part.type === "multi" || part.type === "lewis-select") {
    const options = order
      ? [...order.map((id) => part.options.find((o) => o.id === id)).filter((o): o is NonNullable<typeof o> => Boolean(o))]
      : part.options;
    return `الخيارات: ${options.map((o, i) => `${letters[i] ?? i + 1}) ${o.label.replace(/\[\[|\]\]/g, "")}`).join(" • ")}`;
  }
  if (part.type === "classification") return `فئات التصنيف: ${part.categories.join(" • ")} — المواد: ${part.items.map((x) => x.label.replace(/\[\[|\]\]/g, "")).join("، ")}`;
  if (part.type === "match") return `البنود: ${part.rows.map((r) => r.label).join(" • ")} — الاختيارات: ${part.choices.map((c) => c.label).join(" • ")}`;
  if (part.type === "order") return `الخطوات المتاحة للترتيب: ${part.items.map((x) => x.label).join(" • ")}`;
  return "";
};

const figureText = (figure: QuestionFigure): string => {
  if (figure.kind === "nuclear-table") {
    const rows = figure.rows
      .map((r) => `(${r.tag}) ${r.symbol}: A=${r.mass}، Z=${r.atomic}${r.charge ? `، الشحنة ${r.charge}` : ""}`)
      .join(" | ");
    return `جدول السؤال: ${figure.caption} — ${rows}`;
  }
  if (figure.kind === "data-table") {
    const rows = figure.rows.map((r) => r.map((c) => c.replace(/\[\[|\]\]/g, "")).join("، ")).join(" | ");
    return `جدول السؤال: ${figure.caption} — الأعمدة: ${figure.columns.join("، ")} — الصفوف: ${rows}`;
  }
  return `التمثيل المرفق: ${figure.caption} — ${figure.items.map((i) => i.label).join("، ")}`;
};

export type ReportInput = {
  studentName: string;
  questions: Question[];
  answers: AnswerMap;
  summary: ExamSummary;
  startedAt: number;
  submittedAt: number;
  elapsedSeconds: number;
  attemptId: string;
  optionOrder?: Record<string, string[]>;
};

export const buildReport = (input: ReportInput): string => {
  const { studentName, questions, answers, summary, startedAt, submittedAt, elapsedSeconds, attemptId, optionOrder } = input;
  const lines: string[] = [];
  const rule = "=".repeat(70);
  lines.push(rule);
  lines.push("تقرير اختبار رسمي — الصف الثامن — مادة الكيمياء");
  lines.push(rule);
  lines.push(`اسم الطالب: ${clean(studentName)}`);
  lines.push(`عنوان الاختبار: ${EXAM_META.title}`);
  lines.push(`الصف: ${EXAM_META.grade}`);
  lines.push(`المادة: ${EXAM_META.subject}`);
  lines.push(`الوحدة: ${EXAM_META.unit}`);
  lines.push(`التغطية: ${EXAM_META.coverage}`);
  lines.push(`معرّف المحاولة: ${attemptId}`);
  lines.push(`نسخة الاختبار: ${EXAM_META.version}`);
  lines.push(`وقت البدء: ${formatTimestamp(startedAt)}`);
  lines.push(`وقت التسليم: ${formatTimestamp(submittedAt)}`);
  lines.push(`الزمن المستغرق: ${formatDuration(elapsedSeconds)}`);
  lines.push(`الدرجة النهائية: ${summary.totalAwarded} من ${summary.totalAvailable}`);
  lines.push(`النسبة المئوية: ${summary.percentage}%`);
  lines.push("");
  lines.push("ملخّص تصحيح الأجزاء:");
  lines.push(`  • أجزاء صحيحة تمامًا: ${summary.correct}`);
  lines.push(`  • أجزاء صحيحة جزئيًا: ${summary.partial}`);
  lines.push(`  • أجزاء خاطئة: ${summary.incorrect}`);
  lines.push(`  • أجزاء دون إجابة: ${summary.unanswered}`);
  lines.push(`  • مجموع الأجزاء: ${summary.subparts} جزءًا`);
  lines.push("");
  lines.push("ملاحظة إعداد: صياغة أسئلة هذا الاختبار من إعداد المنصة اعتمادًا على محتوى الدرسين المحدد، وليست نسخًا حرفيًا من أسئلة الكتاب.");
  lines.push("ملاحظة: هذا التقرير مُولَّد محليًا في المتصفح، وتُجمَّد الإجابات لحظة التسليم.");
  lines.push(rule);
  lines.push("");

  questions.forEach((question, qIndex) => {
    const qScore = summary.questions.find((q) => q.questionId === question.id);
    lines.push(rule);
    lines.push(`السؤال ${qIndex + 1}: ${clean(question.title)}`);
    if (question.stem) lines.push(`نص السؤال: ${clean(question.stem).replace(/\[\[|\]\]/g, "")}`);
    if (question.figure) lines.push(figureText(question.figure));
    lines.push(`درجة السؤال: ${qScore?.awarded ?? 0} من ${qScore?.available ?? question.parts.reduce((s, p) => s + p.marks, 0)}`);
    lines.push(`المصدر: ${sourceLabel(question.source)}`);
    lines.push(rule);
    question.parts.forEach((part, pIndex) => {
      const score = gradePart(part, answers[part.id]);
      const letter = ["أ", "ب", "ج", "د", "هـ", "و", "ز", "ح", "ط", "ي"][pIndex] ?? String(pIndex + 1);
      lines.push("");
      lines.push(`  (${letter}) ${clean(part.prompt).replace(/\[\[|\]\]/g, "")}`);
      const bank = partBankText(part, optionOrder?.[part.id]);
      if (bank) lines.push(`      ${clean(bank)}`);
      lines.push(`      الدرجة: ${score.awarded} من ${part.marks}`);
      lines.push(`      حالة التصحيح: ${statusArabic(score.status)}`);
      lines.push(`      إجابة الطالب: ${clean(formatStudentAnswer(part, answers[part.id])).replace(/\[\[|\]\]/g, "")}`);
      lines.push(`      الإجابة الصحيحة: ${clean(formatCorrectAnswer(part)).replace(/\[\[|\]\]/g, "")}`);
      lines.push(`      شرح علمي: ${clean(part.explanation).replace(/\[\[|\]\]/g, "")}`);
      lines.push(`      معيار التصحيح: ${clean(part.rubric)}`);
      lines.push(`      المصدر: ${sourceLabel(part.source)}`);
    });
    lines.push("");
  });

  lines.push(rule);
  lines.push("نهاية التقرير");
  lines.push(`${EXAM_META.contact.name}: ${EXAM_META.contact.phone}`);
  lines.push(rule);
  return `${lines.join("\n")}\n`;
};

export const validateReport = (text: string, filename: string, questions: Question[]): boolean => {
  if (!text || text.length < 1500) return false;
  if (!text.includes("اسم الطالب:") || !text.includes("الدرجة النهائية:") || !text.includes("نهاية التقرير")) return false;
  for (let i = 1; i <= questions.length; i += 1) {
    if (!text.includes(`السؤال ${i}:`)) return false;
  }
  for (const q of questions) {
    for (const p of q.parts) {
      if (!text.includes(clean(p.prompt).replace(/\[\[|\]\]/g, ""))) return false;
      if (!text.includes(sourceLabel(p.source))) return false;
    }
  }
  if (!/\.txt$/.test(filename)) return false;
  return true;
};

export const downloadTextFile = (text: string, filename: string): boolean => {
  try {
    const blob = new Blob([`\uFEFF${text}`], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.style.display = "none";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 5000);
    return true;
  } catch {
    return false;
  }
};

export const partLetter = (index: number): string =>
  ["أ", "ب", "ج", "د", "هـ", "و", "ز", "ح", "ط", "ي"][index] ?? String(index + 1);
