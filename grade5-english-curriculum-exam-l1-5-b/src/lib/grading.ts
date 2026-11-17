import type { Part, Question } from "@/data/questions";
import { ALL_PARTS, QUESTIONS, TOTAL_MARKS } from "@/data/questions";

/** Normalise a pupil answer so trivial typing differences never lose marks. */
export function normalizeAnswer(raw: string | undefined | null): string {
  if (!raw) return "";
  return raw
    .replace(/[\u2018\u2019\u02BC]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u00A0/g, " ")
    .toLowerCase()
    .trim()
    .replace(/\s*\/\s*/g, "/")
    .replace(/\s+/g, " ")
    .replace(/[.!?;]+$/g, "")
    .trim();
}

export function isAnswered(answer: string | undefined | null): boolean {
  return normalizeAnswer(answer).length > 0;
}

export function isPartCorrect(part: Part, answer: string | undefined | null): boolean {
  const given = normalizeAnswer(answer);
  if (!given) return false;
  return part.accept.some((a) => normalizeAnswer(a) === given);
}

export interface PartResult {
  partId: string;
  questionId: string;
  correct: boolean;
  earned: number;
  max: number;
  studentAnswer: string;
  correctAnswer: string;
  explanation?: string;
}

export interface QuestionResult {
  question: Question;
  earned: number;
  max: number;
  correct: boolean;
  parts: PartResult[];
}

export interface ExamResult {
  score: number;
  maxScore: number;
  correctCount: number;
  incorrectCount: number;
  questions: QuestionResult[];
}

export type AnswerMap = Record<string, string>;

/** Grade one main question (all of its sub-parts). */
export function gradeQuestion(q: Question, answers: AnswerMap): QuestionResult {
  const parts: PartResult[] = q.parts.map((p) => {
    const student = answers[p.id] ?? "";
    const correct = isPartCorrect(p, student);
    return {
      partId: p.id,
      questionId: q.id,
      correct,
      earned: correct ? p.marks : 0,
      max: p.marks,
      studentAnswer: student.trim(),
      correctAnswer: p.accept[0],
      explanation: p.explanation,
    };
  });
  const earned = parts.reduce((s, p) => s + p.earned, 0);
  const max = parts.reduce((s, p) => s + p.max, 0);
  return { question: q, earned, max, correct: earned === max && max > 0, parts };
}

/** Grade the whole paper. Score is out of 100. */
export function gradeExam(answers: AnswerMap): ExamResult {
  const questions = QUESTIONS.map((q) => gradeQuestion(q, answers));
  const score = questions.reduce((s, q) => s + q.earned, 0);
  const correctCount = questions.filter((q) => q.correct).length;
  return {
    score,
    maxScore: TOTAL_MARKS,
    correctCount,
    incorrectCount: questions.length - correctCount,
    questions,
  };
}

/** True when every required sub-part of every question has an answer. */
export function isComplete(answers: AnswerMap): boolean {
  return ALL_PARTS.every((p) => isAnswered(answers[p.id]));
}

/** How many of the 50 main questions are fully answered. */
export function answeredQuestionCount(answers: AnswerMap): number {
  return QUESTIONS.filter((q) => q.parts.every((p) => isAnswered(answers[p.id]))).length;
}

/** How many of the sub-parts have been answered (for the progress dots). */
export function questionAnswered(q: Question, answers: AnswerMap): boolean {
  return q.parts.every((p) => isAnswered(answers[p.id]));
}

export function lessonAnsweredCount(lesson: number, answers: AnswerMap): number {
  return QUESTIONS.filter((q) => q.lesson === lesson && questionAnswered(q, answers)).length;
}
