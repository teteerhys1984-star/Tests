/* ------------------------------------------------------------------ */
/*  The Garden of Knowledge — Grade 3 English Exam · Type definitions  */
/* ------------------------------------------------------------------ */

export type LessonNumber = 1 | 2 | 3 | 4 | 5;

export type SkillCategory =
  | "Vocabulary"
  | "Grammar"
  | "Reading Comprehension"
  | "Phonics"
  | "Language Use"
  | "Writing";

/** Internal curriculum reference — NEVER shown to students during the exam. */
export interface CurriculumRef {
  lesson: LessonNumber;
  lessonTitle: string;
  source: string; // e.g. "Pupil's Book p. 9 · Activity: Look and say"
  skill: string;
}

export interface Option {
  id: string;
  label: string;
}

export interface OrderToken {
  id: string;
  text: string;
}

export type PartKind = "mcq" | "tf" | "text" | "select" | "order" | "writing";

export interface QuestionPart {
  id: string; // "a", "b", "c"…
  kind: PartKind;
  /** The sentence / item shown for this part (may contain a ____ gap). */
  text: string;
  marks: number;
  /** Vocabulary stimulus: an Arabic curriculum word whose English meaning is required. */
  arabic?: string;

  /* mcq & select */
  options?: Option[];
  correctOptionId?: string;

  /* true / false */
  correctBool?: boolean;

  /* text input — all accepted forms, checked after normalisation */
  accepted?: string[];

  /* sentence ordering */
  tokens?: OrderToken[];
  /** Acceptable full sentences (token texts joined with spaces). */
  acceptedOrders?: string[];

  /* open writing */
  teacherReview?: boolean;
  rubric?: string[];
  placeholder?: string;

  /** Age-appropriate feedback shown only on the results page. */
  explanation: string;
}

export interface Question {
  id: number; // 1..35
  category: SkillCategory;
  lesson: LessonNumber;
  /** Short student-facing instruction, e.g. "Choose the correct word." */
  instruction: string;
  /** Optional stimulus: a short dialogue or reading passage. */
  stimulusTitle?: string;
  stimulus?: string;
  parts: QuestionPart[];
  reference: CurriculumRef;
}

/* ---------------------------- Answers ----------------------------- */

/** mcq/select/tf → option id string; text/writing → string; order → token id list */
export type AnswerValue = string | string[];
export type QuestionAnswer = Record<string, AnswerValue>;
export type AnswersMap = Record<number, QuestionAnswer>;

/* ---------------------------- Results ----------------------------- */

export type PartStatus = "correct" | "incorrect" | "review" | "unanswered";

export interface PartResult {
  partId: string;
  status: PartStatus;
  earned: number;
  maxMarks: number;
  studentDisplay: string;
  correctDisplay: string;
}

export interface QuestionResult {
  questionId: number;
  earned: number;
  maxMarks: number;
  pending: number;
  status: "correct" | "partial" | "incorrect" | "review";
  parts: PartResult[];
}

export interface ExamResult {
  earned: number;
  maxMarks: number;
  pendingMarks: number;
  percentage: number;
  fullyCorrect: number;
  partial: number;
  incorrect: number;
  reviewCount: number;
  questionResults: QuestionResult[];
}

import type { SendStatus } from "./logic/submit";

/* --------------------------- Persistence -------------------------- */

export interface ExamSession {
  version: 1;
  studentName: string;
  startedAt: number; // epoch ms — set only when Start Exam is pressed
  currentQuestion: number; // 1-based index of question being viewed
  answers: AnswersMap;
  submitted: boolean;
  submittedAt: number | null;
  /** Frozen total duration (ms) captured at submission. */
  finalElapsedMs: number | null;
  /** Unique submission attempt identifier, preserved across retries/resends. */
  attemptId?: string;
  /** Latest background delivery state for Google Sheets. */
  sendStatus?: SendStatus;
}
