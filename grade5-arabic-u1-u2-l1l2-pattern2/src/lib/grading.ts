import { EXAM_MODEL_LABEL, EXAM_TITLE } from "../config";
import {
  Branch,
  EXAM_QUESTIONS,
  LessonMeta,
  LESSONS,
  MainQuestion,
  TOTAL_BRANCHES,
  TOTAL_MARKS,
} from "@/data/exam";

export type AnswerValue = string | string[] | Record<string, string>;
export type AnswerMap = Record<string, AnswerValue>;

export type DetailLine = {
  label: string;
  actual: string;
  expected: string;
  correct: boolean;
};

export type BranchResult = {
  branch: Branch;
  answer: AnswerValue | undefined;
  isAnswered: boolean;
  earned: number;
  max: number;
  full: boolean;
  partial: boolean;
  studentText: string;
  correctText: string;
  details: DetailLine[];
  explanation: string;
  ref: string;
};

export type QuestionResult = {
  question: MainQuestion;
  lesson: LessonMeta;
  branchResults: BranchResult[];
  earned: number;
  max: number;
  fullBranches: number;
  partialBranches: number;
  wrongBranches: number;
};

export type ExamResult = {
  score: number;
  max: number;
  percentage: number;
  questions: QuestionResult[];
  fullBranches: number;
  partialBranches: number;
  wrongBranches: number;
  answeredBranches: number;
  totalBranches: number;
};

export const round2 = (value: number): number => Math.round((value + Number.EPSILON) * 100) / 100;

export const formatScore = (value: number): string => {
  const rounded = round2(value);
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
};

export const stripTashkeel = (value: string): string =>
  value
    .replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g, "")
    .replace(/\u0640/g, "")
    .trim();

export const normalizeAnswer = (value: string, strictHamza = false): string => {
  let normalized = stripTashkeel(value)
    .replace(/[.,،؛;:!?؟«»"'“”()\[\]{}…\-–—_/\\]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

  if (!strictHamza) {
    normalized = normalized
      .replace(/[أإآٱ]/g, "ا")
      .replace(/ى/g, "ي")
      .replace(/ة/g, "ه");
  }
  return normalized.replace(/\s+/g, " ").trim();
};

export const isBranchAnswered = (branch: Branch, value: AnswerValue | undefined): boolean => {
  if (value === undefined || value === null) return false;
  switch (branch.kind) {
    case "single_choice":
    case "true_false":
      return typeof value === "string" && value.length > 0;
    case "fill_blank":
      return typeof value === "string" && value.trim().length > 0;
    case "multi_select": {
      if (!Array.isArray(value)) return false;
      const unique = new Set(value);
      return unique.size >= branch.requiredSelections;
    }
    case "classification": {
      if (!value || typeof value !== "object" || Array.isArray(value)) return false;
      return branch.items.every((item) => Boolean(value[item.id]));
    }
    case "matching": {
      if (!value || typeof value !== "object" || Array.isArray(value)) return false;
      return branch.pairs.every((pair) => Boolean(value[pair.id]));
    }
    case "ordering": {
      if (!Array.isArray(value)) return false;
      return value.length === branch.items.length;
    }
    default:
      return false;
  }
};

export const countAnsweredBranches = (answers: AnswerMap): number =>
  EXAM_QUESTIONS.reduce(
    (sum, question) =>
      sum + question.branches.filter((branch) => isBranchAnswered(branch, answers[branch.id])).length,
    0,
  );

export const countAnsweredInQuestion = (question: MainQuestion, answers: AnswerMap): number =>
  question.branches.filter((branch) => isBranchAnswered(branch, answers[branch.id])).length;

export const isQuestionComplete = (question: MainQuestion, answers: AnswerMap): boolean =>
  question.branches.every((branch) => isBranchAnswered(branch, answers[branch.id]));

export const getChoiceText = (choices: { id: string; text: string }[], id: string | undefined): string =>
  choices.find((choice) => choice.id === id)?.text ?? "—";

export const branchKindLabel = (branch: Branch): string => {
  switch (branch.kind) {
    case "single_choice":
      return "اختيار من متعدد";
    case "true_false":
      return "صحيح أو خطأ";
    case "fill_blank":
      return "أكمل الفراغ";
    case "multi_select":
      return "اختيار متعدد الإجابات";
    case "classification":
      return "تصنيف";
    case "matching":
      return "مطابقة";
    case "ordering":
      return "ترتيب";
    default:
      return "سؤال";
  }
};

const categoryLabel = (branch: Extract<Branch, { kind: "classification" }>, categoryId: string): string =>
  branch.categories.find((category) => category.id === categoryId)?.label ?? "—";

export const correctAnswerText = (branch: Branch): string => {
  switch (branch.kind) {
    case "single_choice":
      return getChoiceText(branch.choices, branch.correctChoiceId);
    case "true_false":
      return branch.correct ? "صحيح" : "خطأ";
    case "fill_blank":
      return branch.acceptedAnswers.join(" / ");
    case "multi_select":
      return branch.correctChoiceIds.map((id) => getChoiceText(branch.choices, id)).join("، ");
    case "classification":
      return branch.items
        .map((item) => `${item.text}: ${categoryLabel(branch, item.categoryId)}`)
        .join("؛ ");
    case "matching":
      return branch.pairs.map((pair) => `${pair.left} ← ${pair.right}`).join("؛ ");
    case "ordering":
      return branch.correctOrderIds
        .map((id) => branch.items.find((item) => item.id === id)?.text ?? "")
        .filter(Boolean)
        .join(" ← ");
    default:
      return "—";
  }
};

export const studentAnswerText = (branch: Branch, value: AnswerValue | undefined): string => {
  if (value === undefined) return "—";
  switch (branch.kind) {
    case "single_choice":
      return typeof value === "string" ? getChoiceText(branch.choices, value) : "—";
    case "true_false":
      return value === "true" ? "صحيح" : value === "false" ? "خطأ" : "—";
    case "fill_blank":
      return typeof value === "string" && value.trim() ? value.trim() : "—";
    case "multi_select":
      if (!Array.isArray(value) || value.length === 0) return "—";
      return value.map((id) => getChoiceText(branch.choices, id)).join("، ");
    case "classification": {
      if (!value || typeof value !== "object" || Array.isArray(value)) return "—";
      return branch.items
        .map((item) => {
          const selected = value[item.id];
          return `${item.text}: ${selected ? categoryLabel(branch, selected) : "لم يُحدَّد"}`;
        })
        .join("؛ ");
    }
    case "matching": {
      if (!value || typeof value !== "object" || Array.isArray(value)) return "—";
      return branch.pairs
        .map((pair) => {
          const selectedId = value[pair.id];
          const selected = branch.pairs.find((candidate) => candidate.id === selectedId);
          return `${pair.left} ← ${selected?.right ?? "لم يُحدَّد"}`;
        })
        .join("؛ ");
    }
    case "ordering": {
      if (!Array.isArray(value) || value.length === 0) return "—";
      return value
        .map((id) => branch.items.find((item) => item.id === id)?.text ?? "")
        .filter(Boolean)
        .join(" ← ");
    }
    default:
      return "—";
  }
};

const buildDetails = (branch: Branch, value: AnswerValue | undefined): DetailLine[] => {
  if (branch.kind === "classification") {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return branch.items.map((item) => ({
        label: item.text,
        actual: "لم يُحدَّد",
        expected: categoryLabel(branch, item.categoryId),
        correct: false,
      }));
    }
    return branch.items.map((item) => {
      const actualId = value[item.id];
      return {
        label: item.text,
        actual: actualId ? categoryLabel(branch, actualId) : "لم يُحدَّد",
        expected: categoryLabel(branch, item.categoryId),
        correct: actualId === item.categoryId,
      };
    });
  }

  if (branch.kind === "matching") {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return branch.pairs.map((pair) => ({
        label: pair.left,
        actual: "لم يُحدَّد",
        expected: pair.right,
        correct: false,
      }));
    }
    return branch.pairs.map((pair) => {
      const actualId = value[pair.id];
      const actual = branch.pairs.find((candidate) => candidate.id === actualId);
      return {
        label: pair.left,
        actual: actual?.right ?? "لم يُحدَّد",
        expected: pair.right,
        correct: actualId === pair.id,
      };
    });
  }

  if (branch.kind === "ordering") {
    const selected = Array.isArray(value) ? value : [];
    return branch.correctOrderIds.map((id, index) => {
      const item = branch.items.find((candidate) => candidate.id === id);
      const actualId = selected[index];
      const actualItem = branch.items.find((candidate) => candidate.id === actualId);
      return {
        label: `الموضع ${index + 1}`,
        actual: actualItem?.text ?? "فارغ",
        expected: item?.text ?? "—",
        correct: actualId === id,
      };
    });
  }

  return [];
};

export const gradeBranch = (branch: Branch, value: AnswerValue | undefined): BranchResult => {
  let earned = 0;
  let full = false;

  switch (branch.kind) {
    case "single_choice":
      full = typeof value === "string" && value === branch.correctChoiceId;
      earned = full ? branch.points : 0;
      break;
    case "true_false":
      full = typeof value === "string" && value === String(branch.correct);
      earned = full ? branch.points : 0;
      break;
    case "fill_blank": {
      if (typeof value === "string" && value.trim()) {
        const normalized = normalizeAnswer(value, branch.strictHamza);
        full = branch.acceptedAnswers.some(
          (accepted) => normalizeAnswer(accepted, branch.strictHamza) === normalized,
        );
      }
      earned = full ? branch.points : 0;
      break;
    }
    case "multi_select": {
      if (Array.isArray(value)) {
        const selected = new Set(value);
        const expected = new Set(branch.correctChoiceIds);
        full =
          selected.size === expected.size &&
          branch.correctChoiceIds.every((id) => selected.has(id));
      }
      earned = full ? branch.points : 0;
      break;
    }
    case "classification": {
      if (!!value && typeof value === "object" && !Array.isArray(value)) {
        const correctCount = branch.items.filter((item) => value[item.id] === item.categoryId).length;
        const ratio = correctCount / branch.items.length;
        earned = round2(branch.points * ratio);
        full = correctCount === branch.items.length;
      }
      break;
    }
    case "matching": {
      if (!!value && typeof value === "object" && !Array.isArray(value)) {
        const correctCount = branch.pairs.filter((pair) => value[pair.id] === pair.id).length;
        const ratio = correctCount / branch.pairs.length;
        earned = round2(branch.points * ratio);
        full = correctCount === branch.pairs.length;
      }
      break;
    }
    case "ordering": {
      if (Array.isArray(value) && value.length === branch.items.length) {
        const correctCount = branch.correctOrderIds.filter((id, index) => value[index] === id).length;
        const ratio = correctCount / branch.correctOrderIds.length;
        earned = round2(branch.points * ratio);
        full = correctCount === branch.correctOrderIds.length;
      }
      break;
    }
    default:
      break;
  }

  const max = branch.points;
  const partial = earned > 0 && earned < max;
  const isAnswered = isBranchAnswered(branch, value);

  return {
    branch,
    answer: value,
    isAnswered,
    earned,
    max,
    full,
    partial,
    studentText: studentAnswerText(branch, value),
    correctText: correctAnswerText(branch),
    details: buildDetails(branch, value),
    explanation: branch.explanation,
    ref: branch.ref,
  };
};

export const evaluateExam = (answers: AnswerMap): ExamResult => {
  const questions: QuestionResult[] = EXAM_QUESTIONS.map((question) => {
    const branchResults = question.branches.map((branch) => gradeBranch(branch, answers[branch.id]));
    return {
      question,
      lesson: LESSONS[question.lessonKey],
      branchResults,
      earned: round2(branchResults.reduce((sum, result) => sum + result.earned, 0)),
      max: branchResults.reduce((sum, result) => sum + result.max, 0),
      fullBranches: branchResults.filter((result) => result.full).length,
      partialBranches: branchResults.filter((result) => result.partial).length,
      wrongBranches: branchResults.filter((result) => !result.full && !result.partial).length,
    };
  });

  const allBranches = questions.flatMap((question) => question.branchResults);
  const score = round2(allBranches.reduce((sum, result) => sum + result.earned, 0));
  return {
    score,
    max: TOTAL_MARKS,
    percentage: round2((score / TOTAL_MARKS) * 100),
    questions,
    fullBranches: allBranches.filter((result) => result.full).length,
    partialBranches: allBranches.filter((result) => result.partial).length,
    wrongBranches: allBranches.filter((result) => !result.full && !result.partial).length,
    answeredBranches: allBranches.filter((result) => result.isAnswered).length,
    totalBranches: TOTAL_BRANCHES,
  };
};

export const formatDuration = (totalSeconds: number): string => {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  return [hours, minutes, seconds].map((part) => String(part).padStart(2, "0")).join(":");
};

/**
 * سلّم التقدير المعتمد في المشروع (الاختبار المرجعي grade5-math-unit1 والاختبار
 * العربي السابق): ست درجات، وحدّ «مقبول» 65. كان في هذا الملف سلّم مختلف
 * (90/80/65/50 وأربع درجات) فيظهر التقدير على الشاشة وفي التقرير مختلفاً عن
 * التقدير المسجَّل في Google Sheets من الحمولة نفسها؛ وُحِّد هنا على المعتمد.
 */
export const gradeLabel = (percentage: number): string => {
  if (percentage >= 95) return "ممتاز";
  if (percentage >= 85) return "جيد جداً";
  if (percentage >= 75) return "جيد";
  if (percentage >= 65) return "مقبول";
  if (percentage >= 50) return "ضعيف";
  return "يحتاج إلى دعم";
};

export const formatDateTime = (date: Date): string =>
  new Intl.DateTimeFormat("ar-SY", {
    dateStyle: "full",
    timeStyle: "medium",
  }).format(date);

export const buildTextReport = (
  studentName: string,
  result: ExamResult,
  submittedAt: Date,
  elapsedSeconds: number,
): string => {
  const line = "=".repeat(64);
  const separator = "-".repeat(56);
  const lines: string[] = [];

  /**
   * ترويسة التقرير: آخر سطر هنا (EXAM_TITLE) هو رمز التصنيف الدقيق الذي يقرأه
   * مولّد الفهرس في landing/generate.py، وهو مطابق لعنوان <title> في index.html
   * ومطابق لعنوان بطاقة الاختبار في الصفحة الرئيسية (الكلمة «العربية» ثم
   * «الخامس»). الأسطر الثلاثة الأولى من التقرير نفسه لم تتغيّر.
   */
  lines.push("تقرير اختبار اللغة العربية — الصف الخامس الأساسي");
  lines.push(EXAM_TITLE);
  lines.push(`(${EXAM_MODEL_LABEL})`);
  lines.push(line);
  lines.push(`اسم الطالب: ${studentName}`);
  lines.push(`تاريخ ووقت التسليم: ${formatDateTime(submittedAt)}`);
  lines.push(`مدة الاختبار: ${formatDuration(elapsedSeconds)} (الساعات:الدقائق:الثواني)`);
  lines.push(`النتيجة النهائية: ${formatScore(result.score)} من ${result.max}`);
  lines.push(`النسبة المئوية: ${formatScore(result.percentage)}%`);
  lines.push(`التقدير: ${gradeLabel(result.percentage)}`);
  lines.push(
    `الفروع: الصحيحة ${result.fullBranches} | الخاطئة ${result.wrongBranches} | الجزئية ${result.partialBranches} | المجموع ${result.totalBranches}`,
  );
  lines.push("نطاق الاختبار: خمسة دروس موثقة من الوحدة الأولى والوحدة الثانية (الدرسان الأول والثاني).");
  lines.push("ملاحظة: أُسقطت الأقسام المستثناة (أعبر كتابياً، الخط، استكشاف الصور، استمع وأتحدث، ألعب وأتعلم، أتواصل شفهياً) من جميع الأسئلة.");
  lines.push(line);
  lines.push("");

  result.questions.forEach((questionResult) => {
    const { question, lesson } = questionResult;
    lines.push(
      `السؤال الرئيسي ${question.number}: ${question.title} — [${formatScore(questionResult.earned)} / ${questionResult.max}]`,
    );
    lines.push(`الدرس: ${lesson.unit} — ${lesson.title} (${lesson.pages})`);
    lines.push(`المهارة: ${question.skill}`);
    if (question.intro) lines.push(`تمهيد السؤال: ${question.intro}`);
    lines.push(separator);

    questionResult.branchResults.forEach((branchResult, index) => {
      lines.push(
        `${question.number}.${index + 1} ${branchResult.branch.prompt} [${branchKindLabel(branchResult.branch)}]`,
      );
      lines.push(`إجابة الطالب: ${branchResult.studentText}`);
      lines.push(`الإجابة الصحيحة: ${branchResult.correctText}`);
      lines.push(
        `العلامة المستحقة: ${formatScore(branchResult.earned)} من ${formatScore(branchResult.max)}`,
      );
      if (branchResult.isAnswered === false) lines.push("تنبيه: الفرع غير مُجاب.");
      if (branchResult.details.length > 0) {
        lines.push("تفصيل العناصر:");
        branchResult.details.forEach((detail) => {
          lines.push(
            `  - ${detail.label}: إجابة الطالب: ${detail.actual} | الصحيح: ${detail.expected} | ${detail.correct ? "صحيح" : "خطأ"}`,
          );
        });
      }
      lines.push(`الشرح: ${branchResult.explanation}`);
      lines.push(`المرجع: ${branchResult.ref}`);
      lines.push(separator);
    });

    lines.push("");
  });

  lines.push(line);
  lines.push("نهاية التقرير");
  return lines.join("\r\n");
};

export const sanitizeFileName = (name: string): string => {
  const cleaned = name.trim().replace(/[\\/:*?"<>|\r\n\t]+/g, "_").replace(/\s+/g, "_");
  return cleaned.slice(0, 48) || "طالب";
};

export const downloadTextReport = (
  studentName: string,
  result: ExamResult,
  submittedAt: Date,
  elapsedSeconds: number,
): void => {
  const report = buildTextReport(studentName, result, submittedAt, elapsedSeconds);
  const blob = new Blob(["\uFEFF", report], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `تقرير_اختبار_اللغة_العربية_النموذج_الثاني_${sanitizeFileName(studentName)}.txt`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
};
