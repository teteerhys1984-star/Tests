import type { MainQuestion, SubQuestion } from "@/data/exam";

export type AnswerValue = string | string[];
export const MARKS_PER_SUB = 1;

/** Lower-cases, unifies apostrophes, removes end punctuation and extra spaces. */
export function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[.!?,;:"]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function isAnswered(sub: SubQuestion, value: AnswerValue | undefined): boolean {
  if (value === undefined || value === null) return false;
  switch (sub.kind) {
    case "choice":
    case "select":
      return typeof value === "string" && value.trim().length > 0;
    case "text":
      return typeof value === "string" && value.trim().length > 0;
    case "order":
      return Array.isArray(value) && value.length === sub.words.length;
    default:
      return false;
  }
}

export function isCorrect(sub: SubQuestion, value: AnswerValue | undefined): boolean {
  if (!isAnswered(sub, value)) return false;
  switch (sub.kind) {
    case "choice":
    case "select":
      return value === sub.answer;
    case "text":
      return typeof value === "string" && sub.accepted.some((a) => normalize(a) === normalize(value));
    case "order":
      return (
        Array.isArray(value) && normalize(value.join(" ")) === normalize(sub.answer.join(" "))
      );
    default:
      return false;
  }
}

/** Human-friendly correct answer for results, report and teacher key. */
export function correctDisplay(sub: SubQuestion): string {
  switch (sub.kind) {
    case "text":
      return sub.display;
    case "order":
      return sub.display ?? sub.answer.join(" ");
    default:
      return sub.answer;
  }
}

/** Accepted alternatives for typed answers (used in the teacher key). */
export function acceptedDisplay(sub: SubQuestion): string[] {
  switch (sub.kind) {
    case "text":
      return sub.accepted;
    case "order":
      return [sub.answer.join(" ")];
    default:
      return [sub.answer];
  }
}

export function answerDisplay(value: AnswerValue | undefined): string {
  if (value === undefined || value === null) return "No answer";
  if (Array.isArray(value)) return value.length ? value.join(" ") : "No answer";
  return value.trim().length ? value : "No answer";
}

export function totalSubs(questions: MainQuestion[]): number {
  return questions.reduce((sum, q) => sum + q.subs.length, 0);
}

export function countAnswered(questions: MainQuestion[], answers: Record<string, AnswerValue>): number {
  let count = 0;
  for (const q of questions) {
    for (const sub of q.subs) if (isAnswered(sub, answers[sub.id])) count += 1;
  }
  return count;
}

export function questionAnsweredFlags(
  questions: MainQuestion[],
  answers: Record<string, AnswerValue>,
): boolean[] {
  return questions.map((q) => q.subs.every((sub) => isAnswered(sub, answers[sub.id])));
}

export type SubResult = { id: string; correct: boolean; earned: number; max: number };
export type QuestionResult = { id: number; earned: number; max: number; subs: SubResult[] };
export type ExamResult = {
  questions: QuestionResult[];
  total: number;
  max: number;
  correctCount: number;
  incorrectCount: number;
  percentage: number;
};

export function gradeExam(
  questions: MainQuestion[],
  answers: Record<string, AnswerValue>,
): ExamResult {
  const perQuestion: QuestionResult[] = questions.map((q) => {
    const subs: SubResult[] = q.subs.map((sub) => {
      const correct = isCorrect(sub, answers[sub.id]);
      return { id: sub.id, correct, earned: correct ? MARKS_PER_SUB : 0, max: MARKS_PER_SUB };
    });
    return {
      id: q.id,
      earned: subs.reduce((s, r) => s + r.earned, 0),
      max: subs.reduce((s, r) => s + r.max, 0),
      subs,
    };
  });
  const total = perQuestion.reduce((s, q) => s + q.earned, 0);
  const max = perQuestion.reduce((s, q) => s + q.max, 0);
  const correctCount = perQuestion.reduce(
    (s, q) => s + q.subs.filter((r) => r.correct).length,
    0,
  );
  return {
    questions: perQuestion,
    total,
    max,
    correctCount,
    incorrectCount: max - correctCount,
    percentage: max > 0 ? Math.round((total / max) * 100) : 0,
  };
}
