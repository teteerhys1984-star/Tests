/**
 * Shared types for the Grade 4 English exam (Unit 1 · Lessons 1–6).
 */

export type QuestionKind =
  | 'vocab' // Arabic prompt -> student writes the English meaning
  | 'cloze' // fill-in-the-blank text input (auto-graded)
  | 'match' // match each prompt with an answer using a dropdown
  | 'choice' // inline two-option chips (radio behaviour)
  | 'mcq' // multiple-choice option cards (radio behaviour)
  | 'clock' // analog clock face -> student writes the time
  | 'order' // tap scrambled word chips to build the sentence
  | 'fix'; // find and correct the single mistake (writes the correct word)

export interface ExamPart {
  /** Unique id across the whole exam, e.g. "q1p1". */
  id: string;
  /** Marks available for this part. */
  marks: number;

  /* --- Presentation --- */
  /** Main prompt text. For vocab parts this is the Arabic word (rendered RTL). */
  prompt: string;
  /** Render the prompt as an Arabic vocabulary prompt (only the 15 allowed Arabic strings). */
  arabic?: boolean;
  /** Text shown before the input control (cloze/fix). */
  before?: string;
  /** Text shown after the input control (cloze). */
  after?: string;
  /** Optional bracketed base-verb shown with the sentence (L3 / L12 style), e.g. “wash”. */
  hint?: string;
  /** The incorrect word in a fix-style sentence (rendered underlined). */
  wrongWord?: string;
  /** Options for match/choice/mcq parts (exact option text). */
  options?: string[];
  /** Static option order override — used so match dropdowns show the same list. */
  /** Clock face for clock parts (static exam clock, not real time). */
  clock?: { hour: number; minute: number };
  /** Scrambled chips display order for order parts. */
  tokens?: string[];
  /** Correct token sequence for order parts. */
  targetTokens?: string[];
  /** Placeholder for text inputs. */
  placeholder?: string;

  /* --- Marking --- */
  /** Accepted correct answers (compared after normalisation). */
  accepted: string[];
  /** The canonical correct answer shown on the results page and in the teacher key. */
  displayAnswer: string;
  /** Documented partial-credit rule, e.g. swapped "to/past" scores half. */
  partialRule?: 'time-to-past-swap' | 'order-any-order';
  /** Lesson reference for this part, e.g. "Lesson 3 · Daily Routine (Pupil's Book pp. 9–11)". */
  reference: string;
}

export interface ExamQuestion {
  /** 1–12, displayed number. */
  id: number;
  kind: QuestionKind;
  /** Short title, e.g. "Vocabulary — Lessons 1 & 2". */
  title: string;
  /** Skill being assessed, e.g. "Vocabulary · meaning recall". */
  skill: string;
  /** Lesson tag shown as a chip, e.g. "Lessons 1–2". */
  lessons: string;
  /** Detailed source reference for the results page and teacher key. */
  reference: string;
  /** Student-facing instruction (English). */
  instructions: string;
  /** Total marks for the question (sum of parts). */
  marks: number;
  parts: ExamPart[];
  /** Clear English explanation shown on the results page when the question is not at full marks. */
  explanation: string;
}

/** Answer value per part: a string for typed/selected answers, number[] (token indices) for ordering. */
export type AnswerValue = string | number[];
export type AnswerMap = Record<string, AnswerValue>;

export interface PartResult {
  partId: string;
  prompt: string;
  displayAnswer: string;
  submitted: string; // human-readable rendering of the submitted answer
  marks: number;
  earned: number;
  status: 'correct' | 'partial' | 'wrong' | 'empty';
}

export interface QuestionResult {
  question: ExamQuestion;
  parts: PartResult[];
  earned: number;
  max: number;
  fullMarks: boolean;
}

export interface ExamResult {
  totalEarned: number;
  totalPossible: number;
  percentage: number;
  gradeBand: string;
  perfectQuestions: number;
  questions: QuestionResult[];
  startedAt: number;
  submittedAt: number;
  completionSeconds: number;
}
