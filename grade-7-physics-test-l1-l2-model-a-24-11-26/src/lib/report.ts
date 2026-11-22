/**
 * التقرير النصي (TXT) والملخّص المستخدم في صفحة النتيجة وفي حمولة الإرسال.
 *
 * مصدر واحد للحقيقة: كل الأرقام تأتي من gradeExam/summarize والدوال الحتمية هنا،
 * فتتطابق صفحة النتيجة وملف التقرير والبيانات المرسلة إلى Google Sheets تماماً.
 */

import {
  CONTACT,
  EXAM_ID,
  EXAM_TITLE,
  GRADE_LABEL,
  PLATFORM_PATH,
  REPORT_FILE_PREFIX,
  SEMESTER_LABEL,
  SUBJECT_LABEL,
  TOTAL_MARKS,
} from "../config";
import type { Input, Question } from "../exam/types";
import { BASE_LESSONS, EXAM_LESSON_L1, EXAM_LESSON_L2, isSharedQuestion } from "../exam/types";
import {
  countParts,
  gradeInputs,
  isPartComplete,
  lessonOverlap,
  lessonTotals,
  partLetter,
  partStatus,
  STATUS_AR,
  type AnswerKey,
  type ExamResult,
  type Responses,
  type Rubric,
} from "./grading";
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
 * الملخّص النهائي — أرقامه مشتقّة من نتيجة التصحيح والردود المجمّدة عند التسليم.
 *
 * المصطلحات هنا مقصودة ومتّسقة مع التقرير والحمولة:
 *  · «سؤال» = أحد الأسئلة العشرة الرئيسية.
 *  · «فرع» (subpart) = حقل إدخال واحد (45 حقلاً في هذا الاختبار) — وهو وحدة العلامة،
 *    لا الفرع الرئيسي المعروض (37 فرعاً). التمييز ضروري هنا لأن النموذج A يضع
 *    أكثر من حقل داخل بعض الفروع.
 * `unansweredSubparts` يُحسب من الردود الفارغة لا من العلامات، فلا يختلط
 * الحقل الذي أُجيب خطأً بالحقل الذي لم يُجب.
 */
export function summarize(_questions: Question[], _responses: Responses, result: ExamResult): Summary {
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
  const allInputs = result.questions.flatMap((question) => question.inputs);
  const unansweredSubparts = allInputs.filter((input) => !input.response.trim()).length;
  return {
    total,
    max,
    percentage: Math.round((total / max) * 1000) / 10,
    fullQuestions,
    partialQuestions,
    wrongQuestions,
    correctSubparts: allInputs.filter((input) => input.earned >= input.possible).length,
    partialSubparts: allInputs.filter((input) => input.earned > 0 && input.earned < input.possible).length,
    wrongSubparts: allInputs.filter((input) => input.earned === 0 && input.response.trim().length > 0).length,
    unansweredSubparts,
  };
}

export function buildReport(
  questions: Question[],
  meta: AttemptMeta,
  result: ExamResult,
  responses: Responses,
  key: AnswerKey,
): string {
  const summary = summarize(questions, responses, result);
  const overlap = lessonOverlap(questions, result);
  const totals = lessonTotals(questions, result);
  const lines: string[] = [];
  const push = (...items: string[]) => lines.push(...items);

  const partCount = countParts(questions);
  const sharedQuestions = questions.filter((question) => isSharedQuestion(question));
  const sharedMarks = sharedQuestions.reduce(
    (sum, question) => sum + (result.questions.find((item) => item.questionId === question.id)?.possible ?? 0),
    0,
  );

  push(LINE);
  push(`        تقرير نتيجة ${EXAM_TITLE}`);
  push(LINE);
  push(`اسم الطالب/ة              : ${meta.studentName}`);
  push(`عنوان الاختبار            : ${EXAM_TITLE}`);
  push(`الصف / الفصل / المادة     : ${GRADE_LABEL} · ${SEMESTER_LABEL} · ${SUBJECT_LABEL}`);
  push(`مسار الاختبار في المنصة   : ${PLATFORM_PATH}`);
  push(`معرّف الاختبار            : ${EXAM_ID}`);
  push(`النموذج                   : النموذج A — مستقل تماماً عن النموذج B`);
  push(`عدد الأسئلة الرئيسية      : ${num(questions.length)}`);
  push(`عدد الفروع المقوّمة       : ${num(partCount)}`);
  push(`مجموع العلامات            : ${num(TOTAL_MARKS)} علامة`);
  push("");
  push("الدرسان المشمولان:");
  push(`  1. ${EXAM_LESSON_L1} (الدرس الأول، ص 3 – 16)`);
  push(`  2. ${EXAM_LESSON_L2} (الدرس الثاني، ص 17 – 28)`);
  if (sharedQuestions.length) {
    push(
      `  · ${num(sharedQuestions.length)} سؤال تركيبي بين الدرسين (السؤال ` +
        `${sharedQuestions.map((question) => num(questions.indexOf(question) + 1)).join("، ")}) ` +
        `بعلامة ${num(sharedMarks)} تُحتسب في توزيع الدرسين معاً، ولا تُنشئ درساً ثالثاً.`,
    );
  }
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
  push(`التقدير                   : ${gradeLabel(summary.percentage)}`);
  push("");
  push(`أسئلة صحيحة بالكامل       : ${num(summary.fullQuestions)}`);
  push(`أسئلة صحيحة جزئياً        : ${num(summary.partialQuestions)}`);
  push(`أسئلة خاطئة               : ${num(summary.wrongQuestions)}`);
  push("");
  push(`فروع إجاباتها صحيحة       : ${num(summary.correctSubparts)}`);
  push(`فروع إجاباتها جزئية       : ${num(summary.partialSubparts)}`);
  push(`فروع إجاباتها خاطئة       : ${num(summary.wrongSubparts)}`);
  push(`فروع لم يُجب عنها         : ${num(summary.unansweredSubparts)}`);
  push("");
  push("توزيع العلامات على الدرسين (درسان فقط، بلا فئة ثالثة):");
  for (const row of totals) {
    const shared =
      row.sharedQuestions > 0
        ? `   (منها ${num(row.sharedEarned)} / ${num(row.sharedPossible)} للسؤال التركيبي)`
        : "";
    push(`  ${row.lesson} : ${num(row.earned)} / ${num(row.possible)}${shared}`);
  }
  push(`  مجموع الدرسين             : ${num(overlap.earned)} / ${num(overlap.possible)}`);
  push(
    `  ملاحظة التداخل: السؤال التركيبي يُحتسب في الدرسين معاً، فتظهر ${num(overlap.sharedPossible)} علامة` +
      ` مرتين (مرة في كل درس). لذلك مجموع الدرسين ${num(overlap.possible)} وليس ${num(overlap.examPossible)}؛` +
      ` ومجموع الاختبار الحقيقي هو ${num(summary.total)} / ${num(summary.max)} فقط، وهو المقام المستعمل في النسبة.`,
  );
  push("");
  push(LINE);
  push("                       المراجعة التفصيلية لكل سؤال وفرع");
  push(LINE);

  questions.forEach((question, index) => {
    const graded = result.questions[index];
    const questionKey = key[question.id];
    push("");
    push(THIN);
    push(`السؤال ${num(index + 1)} — ${question.title}`);
    push(`  العلامة: ${num(graded.earned)} من ${num(graded.possible)}`);
    push(`  الدرس/الدروس: ${question.lesson}`);
    push(`  المرجع: ${question.pages}`);
    push(`  المهارة: ${question.skill}`);
    push(`  الموقف: ${richToPlain(question.intro)}`);
    push(THIN);

    question.parts.forEach((part, partIndex) => {
      const partResult = graded.parts[partIndex];
      const status = partStatus(partResult.earned, partResult.possible, isPartComplete(part, responses));
      push(`  الفرع (${partLetter(partIndex)}) — ${richToPlain(part.label)}`);
      push(`    العلامة: ${num(partResult.earned)} / ${num(partResult.possible)} — ${STATUS_AR[status]}`);
      for (const input of gradeInputs(part, questionKey, responses)) {
        const liveInput = part.inputs.find((item) => item.id === input.inputId);
        const rubric = questionKey.rubric[input.inputId];
        if (!liveInput || !rubric) continue;
        push(`      [${num(input.earned)} / ${num(input.possible)}] ${richToPlain(inputLabel(liveInput))}`);
        push(`        إجابة الطالب   : ${toLatinDigits(input.response || "لم تُجب")}`);
        push(`        الإجابة الصحيحة: ${modelAnswerText(liveInput, rubric)}`);
        for (const criterion of input.criteria) {
          push(`        · ${criterion.label}: ${num(criterion.earned)} / ${num(criterion.marks)}`);
        }
        for (const row of input.rows ?? []) {
          push(
            `        · ${row.label}: ${row.student} (${num(row.earned)} / ${num(row.marks)}) — الصحيح: ${row.correct}`,
          );
        }
      }
      push("");
    });

    if (questionKey.solution?.length) {
      push("  خطوات الحل:");
      for (const step of questionKey.solution) push(`    - ${richToPlain(step)}`);
    }
    push(`  التفسير: ${richToPlain(questionKey.explanation)}`);
  });

  push("");
  push(LINE);
  push("                          سلّم التقويم المعتمد");
  push(LINE);
  push("  · لكل فرع علامة محدّدة، ومجموع علامات فروع السؤال = 10 علامات، ومجموع الأسئلة = 100.");
  push("  · الاختيار من متعدد: تُمنح العلامة كاملة للخيار الصحيح فقط، ولا تُخصم علامات عن الخطأ.");
  push("  · الإجابة العددية: تُقبل الأرقام العربية والفارسية واللاتينية والفواصل العشرية.");
  push("    الوحدة الصحيحة لها علامة مستقلة، وخطوة التعويض لها علامة مستقلة، والنتيجة العددية كذلك.");
  push("  · صح/خطأ: علامة الحكم مستقلة عن علامة التصحيح؛ التصحيح يُقوَّم عندما تكون العبارة خاطئة.");
  push("  · الإجابة القصيرة: تصحيح جزئي وفق معايير دلالية مستقلة، ولا يُشترط تطابق الصياغة.");
  push("  · تُحتسب الدرجات الجزئية في المجموع، وتظهر حالة كل فرع في التفاصيل أعلاه.");
  push("  · السؤال التركيبي يُحتسب في الدرسين معاً في التوزيع، ولا يدخل في تكوين مجموع الاختبار مرتين.");
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

/** وصف الحقل المطلوب في التقرير: نصّه، أو العبارة في صح/خطأ. */
export function inputLabel(input: Input): string {
  if (input.kind === "tf") return input.statement;
  return input.prompt || "أجب عن الفرع";
}

/**
 * نصّ الإجابة النموذجية لمعيار إدخال واحد — يُركَّب من المفتاح + بنك الأسئلة،
 * لأن نصّ الخيار الصحيح وتسميات أعمدة التصنيف موجودة في بنك الأسئلة لا في المفتاح.
 */
export function modelAnswerText(input: Input, rubric: Rubric): string {
  switch (rubric.kind) {
    case "choice": {
      const option = input.kind === "choice" ? input.options.find((item) => item.id === rubric.answer) : undefined;
      return option ? richToPlain(option.label) : `الخيار الصحيح (${rubric.answer})`;
    }
    case "text":
    case "number":
      return richToPlain(rubric.model);
    case "tf": {
      const verdict = rubric.verdict === "true" ? "العبارة صحيحة." : "العبارة خاطئة.";
      return rubric.correction ? `${verdict} التصحيح: ${richToPlain(rubric.correction.model)}` : verdict;
    }
    case "matrix": {
      const columns = input.kind === "matrix" ? input.columns : [];
      const rows = input.kind === "matrix" ? input.rows : [];
      return rubric.rows
        .map((row) => {
          const label = rows.find((item) => item.id === row.id)?.label ?? row.id;
          const column = columns.find((item) => item.id === row.answer)?.label ?? row.answer;
          return `${label}: ${column}`;
        })
        .join("؛ ");
    }
  }
}

/** فحص اكتمال التقرير قبل تنزيله — يمنع تنزيل ملف ناقص. */
export function validateReport(text: string, questions: Question[], meta: AttemptMeta, result: ExamResult): string[] {
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
    question.parts.forEach((part, partIndex) => {
      if (!text.includes(`الفرع (${partLetter(partIndex)}) — ${richToPlain(part.label).slice(0, 20)}`)) {
        missing.push(`الفرع ${part.id}`);
      }
    });
  });
  for (const lesson of BASE_LESSONS) {
    if (!text.includes(lesson)) missing.push(`الدرس ${lesson}`);
  }
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
  return `${REPORT_FILE_PREFIX}_${sanitizeName(studentName)}_Results.txt`;
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
