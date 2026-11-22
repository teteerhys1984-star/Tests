/**
 * التصحيح: تصحيح مستقل لكل فرع، مع علامات جزئية معتمدة على سلّم البنود.
 *
 * يطابق هذا الملف سلوك التصحيح في المصدر (src/lib/grading.ts) مع إضافة
 * توثيق الحالات الحدّية وتوسيع قبول الوحدات العربية.
 */

import type { Part, Question, RichText } from "../exam/types";
import {
  isEquivalentWeightFormula,
  normalizeArabic,
  parseQuantity,
  type Unit,
} from "./physics";

export type Responses = Record<string, string>;

export type SemanticCriterion = {
  points: number;
  description: string;
  /** كل مجموعة داخل البديل يجب أن تتحقّق؛ وكل مجموعة تقبل أيّاً من مترادفاتها. */
  alternatives: string[][][];
  /** عبارات تُبطل المعيار إن ظهرت (علمياً خاطئة). */
  reject?: string[];
};

type BaseRubric = {
  points: number;
  correct: RichText;
  explanation: RichText;
};

export type Rubric = BaseRubric &
  (
    | { kind: "choice"; correctOption: string }
    | { kind: "number"; value: number; unit: Unit; tolerance?: number }
    | { kind: "short"; criteria: SemanticCriterion[] }
    | { kind: "formula" }
  );

export type AnswerKey = Record<string, { solution: RichText; rubric: Record<string, Rubric> }>;

export type PartResult = {
  partId: string;
  earned: number;
  possible: number;
  response: string;
  correct: RichText;
  explanation: RichText;
};

export type QuestionResult = {
  questionId: string;
  earned: number;
  possible: number;
  parts: PartResult[];
  solution: RichText;
};

export type ExamResult = {
  total: number;
  possible: number;
  /** عدد الفروع التي نالت علامتها كاملة. */
  correctCount: number;
  /** عدد الفروع التي لم تنل علامتها كاملة (خاطئة أو جزئية). */
  incorrectCount: number;
  /** عدد الفروع ذات العلامة الجزئية صراحةً (0 < العلامة < العلامة الكاملة). */
  partialCount: number;
  questions: QuestionResult[];
};

export function isPartAnswered(response: string | undefined): boolean {
  return typeof response === "string" && response.trim().length > 0;
}

export function isQuestionComplete(question: Question, responses: Responses): boolean {
  return question.parts.every((part) => isPartAnswered(responses[part.id]));
}

export function isExamComplete(questions: Question[], responses: Responses): boolean {
  return questions.every((question) => isQuestionComplete(question, responses));
}

/** عدد الفروع المجابة، وعدد الأسئلة المكتملة — لشريط التقدّم والفهرس. */
export function progressOf(question: Question, responses: Responses): { done: number; total: number } {
  const total = question.parts.length;
  const done = question.parts.filter((part) => isPartAnswered(responses[part.id])).length;
  return { done, total };
}

export function criterionMatches(response: string, criterion: SemanticCriterion): boolean {
  const normalized = normalizeArabic(response);
  if (!normalized) return false;
  if (criterion.reject?.some((phrase) => normalized.includes(normalizeArabic(phrase)))) return false;
  return criterion.alternatives.some((groups) =>
    groups.every((group) => group.some((synonym) => normalized.includes(normalizeArabic(synonym)))),
  );
}

/**
 * علامة فرع واحد.
 * · الاختيار: مطابقة المعرّف حصراً.
 * · العدد: قيمة صحيحة بغضّ النظر عن كتابة الوحدة (المكعب يعرضها)، فإن كتب الطالب
 *   وحدة مختلفة أو غير معروفة حُسمت علامة واحدة (كما في المصدر) ما لم تكن علامة الفرع واحدة.
 * · الصيغة: تكافؤ جبري مع قانون الثقل، لا مطابقة نصّية.
 * · الإجابة القصيرة: مجموع معايير دلالية مستقلة.
 */
export function gradePart(response: string, rubric: Rubric): number {
  if (!response.trim()) return 0;
  switch (rubric.kind) {
    case "choice":
      return response.trim() === rubric.correctOption ? rubric.points : 0;
    case "number": {
      const quantity = parseQuantity(response);
      if (!quantity || Math.abs(quantity.value - rubric.value) > (rubric.tolerance ?? 0.000001)) return 0;
      if (quantity.unknownUnit) return Math.max(0, rubric.points - 1);
      if (quantity.unit !== null && quantity.unit !== rubric.unit) {
        return Math.max(0, rubric.points - 1);
      }
      return rubric.points;
    }
    case "formula":
      return isEquivalentWeightFormula(response) ? rubric.points : 0;
    case "short":
      return rubric.criteria.reduce(
        (score, criterion) => score + (criterionMatches(response, criterion) ? criterion.points : 0),
        0,
      );
  }
}

export function gradeExam(questions: Question[], responses: Responses, key: AnswerKey): ExamResult {
  const results = questions.map((question): QuestionResult => {
    const answer = key[question.id];
    if (!answer) throw new Error(`Missing answer key for ${question.id}`);
    const parts = question.parts.map((part): PartResult => {
      const rubric = answer.rubric[part.id];
      if (!rubric) throw new Error(`Missing rubric for ${part.id}`);
      const response = responses[part.id] ?? "";
      return {
        partId: part.id,
        response,
        earned: gradePart(response, rubric),
        possible: rubric.points,
        correct: rubric.correct,
        explanation: rubric.explanation,
      };
    });
    return {
      questionId: question.id,
      earned: parts.reduce((score, part) => score + part.earned, 0),
      possible: parts.reduce((score, part) => score + part.possible, 0),
      parts,
      solution: answer.solution,
    };
  });
  const allParts = results.flatMap((question) => question.parts);
  return {
    total: results.reduce((score, question) => score + question.earned, 0),
    possible: results.reduce((score, question) => score + question.possible, 0),
    correctCount: allParts.filter((part) => part.earned === part.possible).length,
    incorrectCount: allParts.filter((part) => part.earned !== part.possible).length,
    partialCount: allParts.filter((part) => part.earned > 0 && part.earned < part.possible).length,
    questions: results,
  };
}

/** تسمية حالة الفرع بالعربية — تُستعمل في المراجعة والتقرير. */
export function partStatus(earned: number, possible: number): "correct" | "partial" | "wrong" {
  if (earned >= possible) return "correct";
  return earned > 0 ? "partial" : "wrong";
}

export const STATUS_AR: Record<ReturnType<typeof partStatus>, string> = {
  correct: "إجابة صحيحة",
  partial: "إجابة صحيحة جزئياً",
  wrong: "إجابة خاطئة",
};

/** ترتيب الفروع بحروف عربية — يُستعمل في واجهة الطالب والمعلّم معاً. */
export const BRANCH_LETTERS = ["أ", "ب", "ج", "د", "هـ", "و", "ز", "ح"] as const;

export function partLetter(index: number): string {
  return BRANCH_LETTERS[index] ?? String(index + 1);
}

/** إجمالي العلامات لكل درس، مع احتساب السؤال التركيبي في الدرسين. */
export function lessonTotals(
  questions: Question[],
  result: ExamResult,
): { lesson: string; earned: number; possible: number }[] {
  const names = Array.from(new Set(questions.map((question) => question.lesson)));
  return names.map((lesson) => {
    let earned = 0;
    let possible = 0;
    questions.forEach((question, index) => {
      const touches = question.lesson === lesson || question.lesson.includes(lesson);
      if (!touches) return;
      earned += result.questions[index].earned;
      possible += result.questions[index].possible;
    });
    return { lesson, earned, possible };
  });
}

/** وصف مقروء لإجابة الطالب داخل فرع (للمراجعة والتقرير والحمولة). */
export function describeResponse(part: Part, response: string): string {
  if (!response.trim()) return "لم تُجب";
  if (part.type === "choice") {
    const option = part.options?.find((item) => item.id === response);
    return option ? (option.latex ? option.label : option.label) : response;
  }
  return response.trim();
}
