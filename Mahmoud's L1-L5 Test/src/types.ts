/* ------------------------------------------------------------------ */
/*  Core types for The Garden of Knowledge — Grade 4 English Exam      */
/* ------------------------------------------------------------------ */

export type Skill =
  | "Vocabulary"
  | "Grammar"
  | "Reading"
  | "Language Use"
  | "Phonics"
  | "Writing";

export type LessonNo = 1 | 2 | 3 | 4 | 5;

export interface CurriculumRef {
  lesson: LessonNo;
  lessonTitle: string;
  book: string;
  pages: string;
  activity: string;
  skill: Skill;
  detail: string;
}

export type PartKind = "mcq" | "tf" | "fill" | "match" | "order" | "rubric";

export interface Option {
  id: string;
  text: string;
}

/** Auto-scored, transparent rubric criterion for open writing tasks. */
export interface RubricCriterion {
  id: string;
  description: string;
  marks: number;
  kind: "minWords" | "includesAny" | "minLength";
  /** words for minWords, tokens for includesAny, char count for minLength */
  value: number | string[];
  scope?: "self";
}

interface PartBase {
  id: string;
  kind: PartKind;
  /** the sub-question stem shown to the student */
  prompt: string;
  /**
   * Arabic word/phrase shown to the student for translation (Vocabulary
   * questions only — the student writes the English meaning).
   */
  arabic?: string;
  marks: number;
  explanation: string;
}

export interface McqPart extends PartBase {
  kind: "mcq";
  options: Option[];
  answer: string; // option id
}

export interface TfPart extends PartBase {
  kind: "tf";
  answer: boolean;
}

export interface FillPart extends PartBase {
  kind: "fill";
  /** every accepted written form (normalized before comparison) */
  accept: string[];
  placeholder?: string;
}

export interface MatchPart extends PartBase {
  kind: "match";
  /** left-hand stem; options are defined at question level (shared pool) */
  answer: string; // option id from question.matchOptions
}

export interface OrderPart extends PartBase {
  kind: "order";
  /** correct sequence of words */
  answer: string[];
  /** additional accepted sequences (e.g. with final period) */
  acceptAlt?: string[][];
}

export interface RubricPart extends PartBase {
  kind: "rubric";
  minWordsHint: number;
  criteria: RubricCriterion[];
}

export type Part =
  | McqPart
  | TfPart
  | FillPart
  | MatchPart
  | OrderPart
  | RubricPart;

export interface MissionInfo {
  no: number;
  code: string;
  name: string;
  blurb: string;
}

export interface Question {
  n: number; // 1..35
  id: string;
  mission: number;
  skill: Skill;
  lesson: LessonNo;
  isVocabulary: boolean;
  title: string;
  instruction: string;
  passage?: string;
  /** word bank shown with the question (fills / word chips) */
  wordBank?: string[];
  /** shared option pool for match parts */
  matchOptions?: Option[];
  /** shuffled chip pool for order parts */
  chips?: string[];
  parts: Part[];
  marks: number; // equals the sum of part marks
  ref: CurriculumRef;
}

/* ------------------------------ answers --------------------------- */

export type AnswerValue = string | string[]; // mcq/fill/match/rubric = string, tf = "true"|"false", order = string[]
export type AnswerMap = Record<string, AnswerValue>;

/* ------------------------------ grading --------------------------- */

export interface CriterionResult {
  description: string;
  earned: number;
  max: number;
  met: boolean;
}

export interface PartResult {
  partId: string;
  prompt: string;
  arabic?: string;
  kind: PartKind;
  earned: number;
  max: number;
  correct: boolean;
  studentAnswer: string;
  correctAnswer: string;
  explanation: string;
  criteria?: CriterionResult[];
  /** true when writing is auto-scored by published rubric */
  rubricScored?: boolean;
}

export interface QuestionResult {
  n: number;
  id: string;
  title: string;
  skill: Skill;
  lesson: LessonNo;
  earned: number;
  max: number;
  correct: boolean;
  instruction: string;
  passage?: string;
  parts: PartResult[];
  ref: CurriculumRef;
}

export interface ExamResult {
  studentName: string;
  submittedAt: number; // epoch ms
  startedAt: number; // epoch ms
  durationMs: number;
  totalEarned: number;
  totalMax: number;
  percentage: number;
  correctQuestions: number;
  partiallyCorrect: number;
  incorrectQuestions: number;
  rubricReviewQuestions: number;
  questions: QuestionResult[];
}

/* ------------------------------ session --------------------------- */

export type Phase = "welcome" | "exam" | "results";

export interface ExamSession {
  phase: Phase;
  studentName: string;
  startedAt: number | null;
  answers: AnswerMap;
  current: number; // index 0..34
  result: ExamResult | null;
}
