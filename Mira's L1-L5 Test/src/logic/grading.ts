/* ------------------------------------------------------------------ */
/*  Grading engine — deterministic, testable, no hidden state          */
/* ------------------------------------------------------------------ */

import type {
  AnswerValue,
  AnswersMap,
  ExamResult,
  PartResult,
  PartStatus,
  Question,
  QuestionAnswer,
  QuestionPart,
  QuestionResult,
} from "../types";
import { QUESTIONS } from "../data/examData";

/** Normalise harmless formatting differences in written answers. */
export function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[’‘`]/g, "'") // unify apostrophes
    .replace(/[“”]/g, '"')
    .replace(/[.!?]+$/g, "") // strip final punctuation
    .replace(/\s+/g, " ") // collapse spaces
    .trim();
}

/** Sequence normalisation for sentence ordering (keeps internal punctuation). */
function normalizeOrder(s: string): string {
  return s.toLowerCase().replace(/\s+/g, " ").trim();
}

export function isPartAnswered(part: QuestionPart, value: AnswerValue | undefined): boolean {
  if (value === undefined || value === null) return false;
  switch (part.kind) {
    case "mcq":
    case "tf":
    case "select":
      return typeof value === "string" && value.length > 0;
    case "text":
      return typeof value === "string" && normalize(value).length > 0;
    case "writing":
      return typeof value === "string" && value.trim().length >= 3;
    case "order":
      return Array.isArray(value) && value.length === (part.tokens?.length ?? 0);
    default:
      return false;
  }
}

export function isQuestionAnswered(q: Question, ans: QuestionAnswer | undefined): boolean {
  return q.parts.every((p) => isPartAnswered(p, ans?.[p.id]));
}

/** List of question ids with at least one unanswered part. */
export function unansweredQuestionIds(questions: Question[], answers: AnswersMap): number[] {
  return questions.filter((q) => !isQuestionAnswered(q, answers[q.id])).map((q) => q.id);
}

/* ------------------------ display helpers ------------------------- */

export function correctDisplay(part: QuestionPart): string {
  switch (part.kind) {
    case "mcq":
    case "select":
      return part.options?.find((o) => o.id === part.correctOptionId)?.label ?? "";
    case "tf":
      return part.correctBool ? "True" : "False";
    case "text":
      return part.accepted?.[0] ?? "";
    case "order":
      return part.acceptedOrders?.[0] ?? "";
    case "writing":
      return "Teacher review (marked with the rubric)";
  }
}

export function studentDisplay(part: QuestionPart, value: AnswerValue | undefined): string {
  if (value === undefined || value === "" || (Array.isArray(value) && value.length === 0)) {
    return "— not answered —";
  }
  switch (part.kind) {
    case "mcq":
    case "select":
      return part.options?.find((o) => o.id === value)?.label ?? String(value);
    case "tf":
      return value === "true" ? "True" : value === "false" ? "False" : String(value);
    case "order": {
      if (!Array.isArray(value)) return String(value);
      const map = new Map(part.tokens?.map((t) => [t.id, t.text]));
      return value.map((id) => map.get(id) ?? id).join(" ");
    }
    default:
      return String(value);
  }
}

/* --------------------------- grading ------------------------------ */

export function gradePart(part: QuestionPart, value: AnswerValue | undefined): PartResult {
  const max = part.marks;
  const student = studentDisplay(part, value);
  const correct = correctDisplay(part);

  if (!isPartAnswered(part, value)) {
    return { partId: part.id, status: "unanswered", earned: 0, maxMarks: max, studentDisplay: student, correctDisplay: correct };
  }

  if (part.kind === "writing" || part.teacherReview) {
    return { partId: part.id, status: "review", earned: 0, maxMarks: max, studentDisplay: student, correctDisplay: correct };
  }

  let ok = false;
  switch (part.kind) {
    case "mcq":
    case "select":
      ok = value === part.correctOptionId;
      break;
    case "tf":
      ok = value === String(part.correctBool);
      break;
    case "text": {
      const v = normalize(String(value));
      ok = (part.accepted ?? []).some((a) => normalize(a) === v);
      break;
    }
    case "order": {
      if (Array.isArray(value)) {
        const map = new Map(part.tokens?.map((t) => [t.id, t.text]));
        const sentence = normalizeOrder(value.map((id) => map.get(id) ?? "").join(" "));
        ok = (part.acceptedOrders ?? []).some((a) => normalizeOrder(a) === sentence);
      }
      break;
    }
    default:
      ok = false;
  }

  return {
    partId: part.id,
    status: ok ? "correct" : "incorrect",
    earned: ok ? max : 0,
    maxMarks: max,
    studentDisplay: student,
    correctDisplay: correct,
  };
}

export function gradeQuestion(q: Question, ans: QuestionAnswer | undefined): QuestionResult {
  const parts = q.parts.map((p) => gradePart(p, ans?.[p.id]));
  const earned = parts.reduce((s, p) => s + p.earned, 0);
  const maxMarks = parts.reduce((s, p) => s + p.maxMarks, 0);
  const pending = parts.filter((p) => p.status === "review").reduce((s, p) => s + p.maxMarks, 0);

  let status: QuestionResult["status"];
  const allCorrect = parts.every((p) => p.status === "correct");
  const anyReview = parts.some((p) => p.status === "review");
  const anyEarned = parts.some((p) => p.earned > 0);

  if (anyReview && !allCorrect) status = "review";
  else if (allCorrect && parts.length > 0) status = "correct";
  else if (anyEarned) status = "partial";
  else status = "incorrect";

  return { questionId: q.id, earned, maxMarks, pending, status, parts };
}

export function gradeExam(questions: Question[], answers: AnswersMap): ExamResult {
  const questionResults = questions.map((q) => gradeQuestion(q, answers[q.id]));
  const earned = questionResults.reduce((s, r) => s + r.earned, 0);
  const maxMarks = questionResults.reduce((s, r) => s + r.maxMarks, 0);
  const pendingMarks = questionResults.reduce((s, r) => s + r.pending, 0);

  const statusOf = (r: QuestionResult): PartStatus | "partial" =>
    r.status === "review" ? "review" : r.status;

  return {
    earned,
    maxMarks,
    pendingMarks,
    percentage: maxMarks > 0 ? Math.round((earned / maxMarks) * 1000) / 10 : 0,
    fullyCorrect: questionResults.filter((r) => statusOf(r) === "correct").length,
    partial: questionResults.filter((r) => r.status === "partial").length,
    incorrect: questionResults.filter((r) => r.status === "incorrect").length,
    reviewCount: questionResults.filter((r) => r.status === "review").length,
    questionResults,
  };
}

export function gradeFullExam(answers: AnswersMap): ExamResult {
  return gradeExam(QUESTIONS, answers);
}
