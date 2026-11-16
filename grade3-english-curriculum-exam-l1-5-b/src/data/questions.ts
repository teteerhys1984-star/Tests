import { ExamQuestion } from "../types/exam";
import {
  LESSON_1_QUESTIONS,
  LESSON_2_QUESTIONS,
  LESSON_3_QUESTIONS,
} from "./questionsLessons1to3";
import { LESSON_4_QUESTIONS, LESSON_5_QUESTIONS } from "./questionsLessons4to5";

export const ALL_QUESTIONS_BY_LESSON: ExamQuestion[] = [
  ...LESSON_1_QUESTIONS,
  ...LESSON_2_QUESTIONS,
  ...LESSON_3_QUESTIONS,
  ...LESSON_4_QUESTIONS,
  ...LESSON_5_QUESTIONS,
];

const QUESTION_LOOKUP = new Map<string, ExamQuestion>(
  ALL_QUESTIONS_BY_LESSON.map((q) => [q.id, q])
);

/**
 * Deterministic mixed ordering of all 50 exam questions.
 * Keeps exact 10 questions per lesson while varying both lesson topic
 * and exercise format across the exam so the lesson sequence is never exposed.
 */
const MIXED_EXAM_ORDER: string[] = [
  "l1-q1",
  "l3-q1",
  "l2-q4",
  "l4-q6",
  "l5-q7",
  "l2-q1",
  "l4-q4",
  "l1-q4",
  "l5-q1",
  "l3-q5",
  "l4-q1",
  "l1-q8",
  "l2-q7",
  "l3-q3",
  "l5-q3",
  "l2-q3",
  "l4-q8",
  "l1-q3",
  "l3-q9",
  "l5-q4",
  "l1-q6",
  "l2-q8",
  "l4-q2",
  "l5-q6",
  "l3-q4",
  "l4-q5",
  "l1-q2",
  "l5-q2",
  "l2-q2",
  "l3-q7",
  "l5-q8",
  "l1-q5",
  "l4-q3",
  "l2-q6",
  "l3-q6",
  "l1-q9",
  "l5-q5",
  "l4-q7",
  "l3-q2",
  "l2-q9",
  "l4-q9",
  "l1-q7",
  "l3-q8",
  "l5-q9",
  "l2-q5",
  "l3-q10",
  "l4-q10",
  "l1-q10",
  "l2-q10",
  "l5-q10",
];

export const EXAM_QUESTIONS: ExamQuestion[] = MIXED_EXAM_ORDER.map((id) => {
  const question = QUESTION_LOOKUP.get(id);
  if (!question) {
    throw new Error(`Missing exam question for id: ${id}`);
  }
  return question;
});
