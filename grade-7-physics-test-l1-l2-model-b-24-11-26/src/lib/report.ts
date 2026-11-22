/**
 * التقرير النصي (TXT) والملخّص المستخدم في صفحة النتيجة وفي حمولة الإرسال.
 *
 * مصدر واحد للحقيقة: كل الأرقام في التقرير وفي الحمولة تأتي من gradeExam/summarize
 * والوظائف الحتمية هنا، فتتطابق صفحة النتيجة والتقرير والبيانات المرسلة تماماً.
 */

import {
  EXAM_ID,
  EXAM_TITLE,
  GRADE_LABEL,
  PLATFORM_PATH,
  SEMESTER_LABEL,
  SUBJECT_LABEL,
  TOTAL_MARKS,
  CONTACT,
} from "../config";
import type { Part, Question } from "../exam/types";
import { describeResponse, lessonOverlap, lessonTotals, partStatus, STATUS_AR, type ExamResult } from "./grading";
import { richToPlain } from "./mathx";
import { formatDuration, formatDurationWords, formatLong, num, pct, toLatinDigits } from "./time";

export interface AttemptMeta {
  studentName: string;
  startAt: Date;
  submitAt: Date;
  elapsedMs: number;
}

export interface Summary {
  total: number;
  max: number;
  percentage: number;
  fullQuestions: number;
  partialQuestions: number;
  wrongQuestions: number;
  correctSubparts: number;
  partialSubparts: number;
  wrongSubparts: number;
  unansweredSubparts: number;
}

const LINE = "=".repeat(78);
const THIN = "-".repeat(78);

/** سلّم التقدير المعتمد في الاختبار المرجعي حرفياً. */
export function gradeLabel(percentage: number): string {
  if (percentage >= 95) return "ممتاز";
  if (percentage >= 85) return "جيد جداً";
  if (percentage >= 75) return "جيد";
  if (percentage >= 65) return "مقبول";
  if (percentage >= 50) return "ضعيف";
  return "يحتاج إلى دعم";
}

/**
 * الملخّص النهائي: الأرقام كلها مشتقّة من نتيجة التصحيح والردود المجمّدة عند التسليم.
 * `unansweredSubparts` يُحسب من الردود الفارغة (لا من العلامات)، لذلك لا يختلط
 * الفرع الذي أُجيب خطأً بالفرع الذي لم يُجب.
 */
export function summarize(
  questions: Question[],
  responses: Record<string, string>,
  result: ExamResult,
): Summary {
  const total = Math.round(result.total * 100) / 100;
  const max = result.possible || TOTAL_MARKS;
  let fullQuestions = 0;
  let partialQuestions = 0;
  let wrongQuestions = 0;
  for (const question of result.questions) {
    if (question.earned >= question.possible) fullQuestions += 1;
    else if (question.earned > 0) partialQuestions += 1;
    else wrongQuestions += 1;
  }
  const allParts = result.questions.flatMap((question) => question.parts);
  const unansweredSubparts = questions
    .flatMap((question) => question.parts)
    .filter((part) => !(responses[part.id] ?? "").trim()).length;
  const wrongSubparts = allParts.filter((part) => part.earned === 0).length - unansweredSubparts;
  return {
    total,
    max,
    percentage: Math.round((total / max) * 1000) / 10,
    fullQuestions,
    partialQuestions,
    wrongQuestions,
    correctSubparts: allParts.filter((part) => part.earned >= part.possible).length,
    partialSubparts: allParts.filter((part) => part.earned > 0 && part.earned < part.possible).length,
    wrongSubparts: Math.max(0, wrongSubparts),
    unansweredSubparts,
  };
}

/** أول فرع غير مجاب — يُستعمل في زر «انتقلي إلى أول سؤال ناقص». */
export function firstUnanswered(questions: Question[], responses: Record<string, string>): number {
  return questions.findIndex((question) =>
    question.parts.some((part) => !(responses[part.id] ?? "").trim()),
  );
}

function partLines(part: Part, partIndex: number, partResult: ExamResult["questions"][number]["parts"][number], responseText: string): string[] {
  const status = partStatus(partResult.earned, partResult.possible);
  return [
    `  الفرع (${partIndex + 1}) — [${num(partResult.earned)} / ${num(partResult.possible)}] — ${STATUS_AR[status]}`,
    `    المطلوب          : ${richToPlain(part.label)}`,
    `    إجابة الطالب     : ${toLatinDigits(responseText)}`,
    `    الإجابة الصحيحة  : ${richToPlain(partResult.correct)}`,
    `    التفسير          : ${richToPlain(partResult.explanation)}`,
  ];
}

export function buildReport(questions: Question[], meta: AttemptMeta, result: ExamResult, responses: Record<string, string>): string {
  const summary = summarize(questions, responses, result);
  const overlap = lessonOverlap(questions, result);
  const lines: string[] = [];
  const push = (...items: string[]) => lines.push(...items);

  const partCount = questions.reduce((sum, question) => sum + question.parts.length, 0);

  push(LINE);
  push(`        تقرير نتيجة ${EXAM_TITLE}`);
  push(LINE);
  push(`اسم الطالب/ة              : ${meta.studentName}`);
  push(`عنوان الاختبار            : ${EXAM_TITLE}`);
  push(`الصف / الفصل / المادة     : ${GRADE_LABEL} · ${SEMESTER_LABEL} · ${SUBJECT_LABEL}`);
  push(`مسار الاختبار في المنصة   : ${PLATFORM_PATH}`);
  push(`معرّف الاختبار            : ${EXAM_ID}`);
  push(`عدد الأسئلة الرئيسية      : ${num(questions.length)}`);
  push(`عدد الفروع المقوّمة       : ${num(partCount)}`);
  push(`مجموع العلامات            : ${num(TOTAL_MARKS)} علامة`);
  push("");
  push("الدرسان المشمولان:");
  push("  1. الحركة والسكون (الدرس الأول، ص 3 – 16)");
  push("  2. القوة والحركة (الدرس الثاني، ص 17 – 28)");
  push("  · السؤال الأخير تركيبي بين الدرسين، ويُحتسب في توزيع الدرسين معاً.");
  push("");
  push(LINE);
  push("                                  الزمن");
  push(LINE);
  push(`بداية الاختبار            : ${formatLong(meta.startAt)}`);
  push(`تسليم الاختبار            : ${formatLong(meta.submitAt)}`);
  push(`المدة المنقضية            : ${formatDuration(meta.elapsedMs)}  (HH:MM:SS)`);
  push(`                            أي ${formatDurationWords(meta.elapsedMs)}`);
  push("");
  push(LINE);
  push("                                النتيجة");
  push(LINE);
  push(`العلامة النهائية          : ${num(summary.total)} من ${num(summary.max)}`);
  push(`النسبة المئوية            : ${pct(summary.percentage)}`);
  push("");
  push(`أسئلة صحيحة بالكامل       : ${num(summary.fullQuestions)}`);
  push(`أسئلة صحيحة جزئياً         : ${num(summary.partialQuestions)}`);
  push(`أسئلة خاطئة                : ${num(summary.wrongQuestions)}`);
  push("");
  push(`فروع إجاباتها صحيحة        : ${num(summary.correctSubparts)}`);
  push(`فروع إجاباتها جزئية        : ${num(summary.partialSubparts)}`);
  push(`فروع إجاباتها خاطئة        : ${num(summary.wrongSubparts)}`);
  push(`فروع لم يُجب عنها          : ${num(summary.unansweredSubparts)}`);
  push("");
  push("توزيع العلامات على الدرسين (درسان فقط):");
  const totals = lessonTotals(questions, result);
  for (const row of totals) {
    const shared =
      row.sharedQuestions > 0
        ? `   (منها ${num(row.sharedEarned)} / ${num(row.sharedPossible)} للسؤال التركيبي)`
        : "";
    push(`  ${row.lesson.padEnd(30, " ")} : ${num(row.earned)} / ${num(row.possible)}${shared}`);
  }
  push(`  مجموع الدرسين                        : ${num(overlap.total)} / ${num(overlap.possible)}`);
  push(
    `  (السؤال التركيبي يُحتسب في الدرسين معاً، فتظهر ${num(overlap.sharedPossible)} علامة مرتين:` +
      ` مرة في كل درس. لا تُجمع الدرجات أعلاه، ومجموع الاختبار هو` +
      ` ${num(summary.total)} / ${num(summary.max)} فقط.)`,
  );
  push("");
  push(LINE);
  push("                       المراجعة التفصيلية لكل سؤال وفرع");
  push(LINE);

  questions.forEach((question, index) => {
    const graded = result.questions[index];
    const possible = graded.parts.reduce((sum, part) => sum + part.possible, 0);
    push("");
    push(THIN);
    push(`السؤال ${num(index + 1)} — ${question.title}`);
    push(`  العلامة: ${num(graded.earned)} من ${num(possible)}`);
    push(`  الدرس/الدروس: ${question.lesson}`);
    push(`  المرجع: ${question.pages}`);
    push(`  المهارة: ${question.skill}`);
    push(`  الموقف: ${richToPlain(question.intro)}`);
    if (question.figureCaption) push(`  الرسم: ${richToPlain(question.figureCaption)}`);
    if (question.figureSource) push(`  مرجع الرسم: ${question.figureSource}`);
    push(THIN);
    question.parts.forEach((part, partIndex) => {
      const partResult = graded.parts[partIndex];
      push(
        ...partLines(
          part,
          partIndex,
          partResult,
          describeResponse(part, partResult.response),
        ),
      );
      push("");
    });
    push(`  خطوات الحل والتفسير الكامل: ${richToPlain(graded.solution)}`);
  });

  push(LINE);
  push("                          سلّم التقويم المعتمد");
  push(LINE);
  push("  · لكل فرع علامة محدّدة، ومجموع علامات فروع السؤال يساوي 10 علامات، ومجموع الأسئلة = 100.");
  push("  · الاختيار من متعدد: تُمنح العلامة كاملة للخيار الصحيح فقط، ولا تُخصم علامات عن الخطأ.");
  push("  · الإجابة العددية: تُقبل الأرقام العربية والفارسية والإنكليزية والفواصل العشرية.");
  push("    عند صحة القيمة مع كتابة وحدة خاطئة تُحسم علامة واحدة، ما لم تكن علامة الفرع واحدة.");
  push("  · صيغة قانون الثقل: تُقبل أي صيغة مكافئة جبرياً (w=mg أو m=w/g أو g=w/m).");
  push("  · أسئلة التفسير: تصحيح جزئي وفق معايير دلالية مستقلة، ولا يُشترط تطابق الصياغة.");
  push("  · تُحتسب الدرجات الجزئية في المجموع، وتظهر حالة كل فرع في التفاصيل أعلاه.");
  push("");
  push(LINE);
  push("                              معلومات التواصل");
  push(LINE);
  push(`  ${CONTACT.name}: ${CONTACT.phone}`);
  push(`  واتساب: ${CONTACT.whatsapp}`);
  push("");
  push(`  أُصدر هذا التقرير بتاريخ: ${formatLong(meta.submitAt)}`);
  push("  تم إنشاء التقرير داخل متصفح الطالب، وتُرسَل النتيجة وإجابات الطالب ونصّ هذا التقرير إلى المعلّم عند التسليم.");
  push(LINE);

  return `\uFEFF${lines.join("\r\n")}`;
}

/** فحص اكتمال التقرير قبل تنزيله — يمنع تنزيل ملف ناقص. */
export function validateReport(
  text: string,
  questions: Question[],
  meta: AttemptMeta,
  result: ExamResult,
): string[] {
  const missing: string[] = [];
  const must = [
    meta.studentName,
    formatLong(meta.startAt),
    formatLong(meta.submitAt),
    formatDuration(meta.elapsedMs),
    `العلامة النهائية          : ${num(result.total)} من ${num(result.possible)}`,
  ];
  for (const item of must) if (item && !text.includes(toLatinDigits(String(item)))) missing.push(item);
  questions.forEach((question, index) => {
    if (!text.includes(`السؤال ${num(index + 1)} —`)) missing.push(`السؤال ${index + 1}`);
    for (const part of question.parts) {
      if (!text.includes(`المطلوب          : ${richToPlain(part.label).slice(0, 20)}`)) {
        missing.push(`الفرع ${part.id}`);
      }
    }
  });
  if (!text.includes("سلّم التقويم")) missing.push("سلّم التقويم");
  return missing;
}

export function sanitizeName(name: string): string {
  const cleaned = name
    .trim()
    .replace(/[^\p{L}\p{N}\s_-]/gu, "")
    .replace(/\s+/g, "_")
    .slice(0, 40);
  return cleaned || "Student";
}

export function reportFilename(studentName: string): string {
  return `Grade7_Physics_L1L2_ModelB_${sanitizeName(studentName)}_Results.txt`;
}

/**
 * التنزيل الفعلي — يجب أن يُستدعى داخل معالج حدث النقر نفسه.
 * يعيد true إذا بدأ التنزيل، وfalse إذا اعترضه المتصفح.
 */
export function triggerDownload(text: string, filename: string): boolean {
  try {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.rel = "noopener";
    anchor.style.display = "none";
    document.body.appendChild(anchor);
    anchor.click();
    window.setTimeout(() => {
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
    }, 12000);
    return true;
  } catch {
    return false;
  }
}
