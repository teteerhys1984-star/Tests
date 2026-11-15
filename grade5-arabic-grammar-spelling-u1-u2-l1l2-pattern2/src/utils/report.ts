import type { ExamResult } from "../types/exam";
import { DIFFICULTY_LABELS, EXAM_META, SECTION_LABELS } from "../data/sources/lessons";
import { formatArabicDuration, formatDateTime, toArabicDigits } from "./arabic";
import { formatAnswer as displayAnswer } from "./grading";

function line(char = "─", length = 64): string {
  return char.repeat(length);
}

/**
 * Build a complete UTF-8 Arabic TXT report locally in the browser.
 * The leading BOM guarantees correct Arabic rendering in Windows Notepad.
 */
export function buildTxtReport(result: ExamResult): string {
  const { attempt } = result;
  const rows: string[] = [];

  rows.push("\uFEFFزهرة المعرفة — تقرير اختبار رسمي");
  rows.push(EXAM_META.title);
  rows.push(EXAM_META.subtitle);
  rows.push(line("═"));
  rows.push(`اسم الطالبة: ${attempt.studentName}`);
  rows.push(`معرّف المحاولة: ${attempt.id}`);
  rows.push(`تاريخ التسليم: ${attempt.submittedAt ? formatDateTime(attempt.submittedAt) : "—"}`);
  rows.push(`الزمن المستغرق: ${formatArabicDuration(result.timeSeconds)} (${Math.floor(result.timeSeconds / 3600).toString().padStart(2, "0")}:${Math.floor((result.timeSeconds % 3600) / 60).toString().padStart(2, "0")}:${(result.timeSeconds % 60).toString().padStart(2, "0")})`);
  rows.push(`الدرجة الكلية: ${toArabicDigits(result.totalEarned)} من ${toArabicDigits(result.totalMax)}`);
  rows.push(`النسبة المئوية: ${toArabicDigits(result.percentage)}٪`);
  rows.push(`التقدير: ${result.performance.label}`);
  rows.push(
    `النتيجة: ${toArabicDigits(result.correctCount)} إجابة صحيحة، ${toArabicDigits(result.incorrectCount)} خاطئة، ${toArabicDigits(result.unansweredCount)} غير مجابة.`,
  );
  rows.push("");
  rows.push("الملخّص العام:");
  rows.push(`• قواعد اللغة: ${toArabicDigits(result.grammar.earned)} / ${toArabicDigits(result.grammar.max)} (${toArabicDigits(result.grammar.percentage)}٪)`);
  rows.push(`• الإملاء: ${toArabicDigits(result.spelling.earned)} / ${toArabicDigits(result.spelling.max)} (${toArabicDigits(result.spelling.percentage)}٪)`);
  rows.push("");
  rows.push("التحليل حسب الدروس:");
  rows.push("الدرس\tقواعد اللغة\tالإملاء\tالمجموع");
  for (const lesson of result.lessons) {
    rows.push(
      `${lesson.order}. ${lesson.title}\t${toArabicDigits(lesson.grammar.earned)}/${toArabicDigits(lesson.grammar.max)}\t${toArabicDigits(lesson.spelling.earned)}/${toArabicDigits(lesson.spelling.max)}\t${toArabicDigits(lesson.earned)}/${toArabicDigits(lesson.max)}`,
    );
  }
  rows.push(line());
  rows.push("");
  rows.push("التفصيل الكامل للأسئلة والفروع:");
  rows.push("");

  for (const question of result.questions) {
    rows.push(line("═"));
    rows.push(
      `السؤال ${toArabicDigits(question.number)} — ${question.lessonTitle} | ${SECTION_LABELS[question.section]} | صفحة ${toArabicDigits(question.page)}`,
    );
    rows.push(`المهارة/المستوى: ${DIFFICULTY_LABELS[question.difficulty]}`);
    rows.push(`نص السؤال: ${question.prompt}`);
    if (question.context) rows.push(`إرشاد السؤال: ${question.context}`);
    rows.push(`الدرجة: ${toArabicDigits(question.marksEarned)} / ${toArabicDigits(question.marksMax)}`);
    rows.push("");
    for (const part of question.subparts) {
      rows.push(`${part.subpartLabel}) ${part.prompt}`);
      rows.push(`   إجابة الطالبة: ${displayAnswer(part.studentAnswer)}`);
      rows.push(`   الإجابة الصحيحة: ${displayAnswer(part.correctAnswer)}`);
      rows.push(
        `   الحالة: ${!part.answered ? "غير مجابة" : part.isCorrect ? "صحيحة" : "خاطئة"} — ${toArabicDigits(part.marksEarned)} / ${toArabicDigits(part.marksMax)}`,
      );
      rows.push(`   Explanation / التفسير: ${part.explanation}`);
      if (part.misconception) rows.push(`   مفهوم خطأ شائع: ${part.misconception}`);
      rows.push(
        `   مرجع داخلي: ${part.source.unit} — معرف الدرس: ${part.source.lessonId} — ${part.source.lessonTitle} — صفحة ${toArabicDigits(part.source.page)} — ${SECTION_LABELS[part.source.section]} — المهارة: ${part.source.skill}`,
      );
      rows.push("");
    }
  }

  rows.push(line("═"));
  rows.push("نقاط القوة:");
  rows.push(result.strengths.length ? result.strengths.map((item) => `• ${item}`).join("\n") : "• لا توجد مهارات بلغت ٨٠٪ في هذه المحاولة.");
  rows.push("");
  rows.push("المهارات المقترح تحسينها:");
  rows.push(result.improvements.length ? result.improvements.map((item) => `• ${item}`).join("\n") : "• لا توجد مهارات دون المستوى المستهدف.");
  rows.push("");
  rows.push("ملاحظات التصحيح:");
  rows.push("• لكل فرع درجة مستقلة، ولا تُمنح درجة الفرع إلا لإجابة تامة.");
  rows.push("• أسئلة الاختيار المتعدد تتطلب جميع الاختيارات الصحيحة دون زيادة.");
  rows.push("• أجوبة الكتابة تُقبل دون تشكيل، مع الحفاظ على الحرف الذي تختبره القاعدة.");
  rows.push("");
  rows.push("أُنشئ هذا التقرير في المتصفح، وتُرسل نسخة من الاسم والنتيجة والإجابات إلى المعلّمة عبر Google Sheets عند توفر الاتصال.");
  rows.push(`زهرة المعرفة — ${new Date().toLocaleDateString("ar")}`);
  rows.push("SM/ExamReport/1.0");

  return rows.join("\r\n");
}

export function safeFilePart(value: string): string {
  return value
    .trim()
    .replace(/[\\/:*?"<>|\n\r\t]/g, "")
    .replace(/\s+/g, "_")
    .slice(0, 60) || "Student";
}

const TRANSLITERATION: Record<string, string> = {
  ا: "a", أ: "a", إ: "i", آ: "aa", ب: "b", ت: "t", ث: "th", ج: "j", ح: "h", خ: "kh",
  د: "d", ذ: "dh", ر: "r", ز: "z", س: "s", ش: "sh", ص: "s", ض: "d", ط: "t", ظ: "z",
  ع: "a", غ: "gh", ف: "f", ق: "q", ك: "k", ل: "l", م: "m", ن: "n", ه: "h", و: "w",
  ي: "y", ى: "a", ة: "a", ء: "'", ئ: "e", ؤ: "o", لا: "la",
};

/** Portable Latin transliteration so download names survive every browser/OS. */
function transliterateStudentName(studentName: string): string {
  const cleaned = normalizeAnswerSafe(studentName).replace(/\s+/g, "_");
  const latin = [...cleaned]
    .map((char) => TRANSLITERATION[char] ?? (/[A-Za-z0-9_-]/.test(char) || char === " " ? char : ""))
    .join("")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 60);
  const capitalized = latin
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("_");
  return capitalized || safeFilePart(studentName);
}

function normalizeAnswerSafe(value: string): string {
  return value
    .normalize("NFKC")
    .replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g, "")
    .replace(/[\u200c\u200d\u200e\u200f]/g, "")
    .trim();
}

/**
 * The filename includes both the examination title and the student's name.
 * The name is transliterated for maximum portability, and the Arabic name is
 * printed in full inside the UTF-8 report body.
 */
export function reportFileName(studentName: string): string {
  return `Arabic_Grade5_Grammar_Spelling_${transliterateStudentName(studentName)}.txt`;
}

export function downloadTxtReport(result: ExamResult): void {
  const content = buildTxtReport(result);
  const blob = new Blob([content], { type: "text/plain; charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = reportFileName(result.attempt.studentName);
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
}


