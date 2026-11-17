import { ExamQuestion } from '../types/exam';
import { QUESTIONS_L1_TO_L3 } from './questionsL1toL3';
import { QUESTIONS_L4_TO_L5 } from './questionsL4toL5';

/**
 * Complete verified bank of 50 Grade 4 Unit 1 curriculum questions
 * (10 each from Lessons 1, 2, 3, 4, and 5; 2 marks each = 100 marks).
 */
export const ALL_CURRICULUM_QUESTIONS: ExamQuestion[] = [
  ...QUESTIONS_L1_TO_L3,
  ...QUESTIONS_L4_TO_L5,
];

/**
 * Mixed exam presentation order so questions across Lessons 1–5 and across
 * varied activity formats are interleaved rather than following textbook sequence.
 * Every single one of the 50 IDs appears strictly once.
 */
export const MIXED_EXAM_ORDER_IDS: readonly string[] = [
  // Block 1 (Q1–Q10)
  'l1-q4',
  'l3-q8',
  'l2-q1',
  'l4-q8',
  'l5-q3',
  'l1-q1',
  'l3-q4',
  'l4-q3',
  'l5-q4',
  'l2-q9',
  // Block 2 (Q11–Q20)
  'l3-q1',
  'l1-q7',
  'l4-q1',
  'l2-q4',
  'l5-q1',
  'l1-q5',
  'l3-q5',
  'l2-q8',
  'l4-q6',
  'l5-q8',
  // Block 3 (Q21–Q30)
  'l2-q2',
  'l4-q5',
  'l1-q6',
  'l5-q6',
  'l3-q2',
  'l2-q7',
  'l1-q8',
  'l4-q7',
  'l3-q9',
  'l5-q9',
  // Block 4 (Q31–Q40)
  'l4-q9',
  'l1-q2',
  'l5-q2',
  'l3-q6',
  'l2-q5',
  'l4-q2',
  'l1-q10',
  'l5-q5',
  'l3-q10',
  'l2-q10',
  // Block 5 (Q41–Q50)
  'l5-q10',
  'l1-q3',
  'l4-q4',
  'l2-q3',
  'l3-q3',
  'l5-q7',
  'l1-q9',
  'l4-q10',
  'l2-q6',
  'l3-q7',
];

const questionById = new Map<string, ExamQuestion>(
  ALL_CURRICULUM_QUESTIONS.map((q) => [q.id, q])
);

export const EXAM_QUESTIONS: ExamQuestion[] = MIXED_EXAM_ORDER_IDS.map((id) => {
  const question = questionById.get(id);
  if (!question) {
    throw new Error(`Missing exam question for ID: ${id}`);
  }
  return question;
});
