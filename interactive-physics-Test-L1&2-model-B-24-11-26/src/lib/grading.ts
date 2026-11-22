import type { Question, RichText } from "../data/questions";
import { isEquivalentWeightFormula, normalizeArabic, parseQuantity, type Unit } from "./physics";

export type Responses = Record<string, string>;
export type SemanticCriterion = {
  points: number;
  description: string;
  // Every group in an alternative must match; a group accepts any of its synonyms.
  alternatives: string[][][];
  reject?: string[];
};

type BaseRubric = {
  points: number;
  correct: RichText;
  explanation: RichText;
};

export type Rubric = BaseRubric & (
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
  correctCount: number;
  incorrectCount: number;
  questions: QuestionResult[];
};

export function isQuestionComplete(question: Question, responses: Responses): boolean {
  return question.parts.every((part) => typeof responses[part.id] === "string" && responses[part.id].trim().length > 0);
}

export function isExamComplete(questions: Question[], responses: Responses): boolean {
  return questions.every((question) => isQuestionComplete(question, responses));
}

function criterionMatches(response: string, criterion: SemanticCriterion): boolean {
  const normalized = normalizeArabic(response);
  if (criterion.reject?.some((phrase) => normalized.includes(normalizeArabic(phrase)))) return false;
  return criterion.alternatives.some((groups) =>
    groups.every((group) => group.some((synonym) => normalized.includes(normalizeArabic(synonym)))),
  );
}

export function gradePart(response: string, rubric: Rubric): number {
  if (!response.trim()) return 0;
  switch (rubric.kind) {
    case "choice":
      return response === rubric.correctOption ? rubric.points : 0;
    case "number": {
      const quantity = parseQuantity(response);
      if (!quantity || Math.abs(quantity.value - rubric.value) > (rubric.tolerance ?? 0.000001)) return 0;
      if (quantity.unknownUnit || (quantity.unit !== null && quantity.unit !== rubric.unit)) {
        return Math.max(0, rubric.points - 1);
      }
      return rubric.points;
    }
    case "formula":
      return isEquivalentWeightFormula(response) ? rubric.points : 0;
    case "short":
      return rubric.criteria.reduce((score, criterion) => score + (criterionMatches(response, criterion) ? criterion.points : 0), 0);
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
    questions: results,
  };
}