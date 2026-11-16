/**
 * Shared exam domain types.
 * Question data lives in src/data/questions.ts; grading logic in src/lib/grading.ts.
 */

export type LessonId = "lesson1" | "lesson2";

export type SubpartType = "mcq" | "tf" | "select" | "text" | "reorder";

interface SubpartBase {
  /** Stable unique id, e.g. "q1-s1". */
  id: string;
  type: SubpartType;
  /** Student-facing sub-question text. */
  prompt: string;
  /** Marks this subpart is worth (subpart marks of a question sum to 5). */
  marks: number;
}

export interface McqSubpart extends SubpartBase {
  type: "mcq";
  options: string[];
  correctIndex: number;
}

export interface TfSubpart extends SubpartBase {
  type: "tf";
  correct: boolean;
}

/** Dropdown-based subpart (fill-in-the-blank with a word bank, or matching row). */
export interface SelectSubpart extends SubpartBase {
  type: "select";
  options: string[];
  correct: string;
  /** Optional sentence fragments rendered around the select control. */
  before?: string;
  after?: string;
}

/** Free-text subpart graded against a documented set of acceptable answers. */
export interface TextSubpart extends SubpartBase {
  type: "text";
  /** Canonical first entry is displayed as the model answer. */
  accept: string[];
  placeholder?: string;
  /** Used for sentence-correction display: the error highlighted in context. */
  segments?: { before: string; wrong: string; after: string };
}

/** Click-to-build word ordering subpart. */
export interface ReorderSubpart extends SubpartBase {
  type: "reorder";
  /** Words shown in scrambled order. */
  words: string[];
  /** The correct order. */
  target: string[];
}

export type Subpart =
  | McqSubpart
  | TfSubpart
  | SelectSubpart
  | TextSubpart
  | ReorderSubpart;

export type QuestionTypeLabel =
  | "Reading Comprehension"
  | "Vocabulary Matching"
  | "Fill in the Blanks"
  | "Choose the Correct Tense"
  | "Sentence Correction"
  | "Word Formation"
  | "True or False"
  | "Reorder the Words"
  | "Short Answer"
  | "Pronunciation";

export interface Question {
  /** 1-based main question number (1..20). */
  number: number;
  id: string;
  lesson: LessonId;
  typeLabel: QuestionTypeLabel;
  /** Main student-facing instruction. */
  instruction: string;
  /** Optional reading passage shown inside the question card. */
  passage?: { title: string; text: string; source: string };
  /** Word bank shown for select-based questions. */
  wordBank?: string[];
  marks: number; // always 5
  explanation: string;
  curriculumRef: string;
  subparts: Subpart[];
}

/* ---------------- Student answers ---------------- */

export type AnswerValue =
  | { kind: "mcq"; index: number | null }
  | { kind: "tf"; value: boolean | null }
  | { kind: "select"; value: string }
  | { kind: "text"; value: string }
  | { kind: "reorder"; value: string[] };

export type AnswerMap = Record<string, AnswerValue | undefined>;

/* ---------------- Results ---------------- */

export interface SubpartResult {
  id: string;
  prompt: string;
  type: SubpartType;
  earned: number;
  max: number;
  studentDisplay: string;
  correctDisplay: string;
  isCorrect: boolean;
}

export interface QuestionResult {
  number: number;
  id: string;
  lesson: LessonId;
  typeLabel: QuestionTypeLabel;
  instruction: string;
  passage?: { title: string; text: string; source: string };
  earned: number;
  max: number;
  explanation: string;
  curriculumRef: string;
  subparts: SubpartResult[];
}

export interface ExamResult {
  totalScore: number;
  maxScore: number;
  percentage: number;
  fullyCorrect: number;
  partiallyCorrect: number;
  incorrect: number;
  questionResults: QuestionResult[];
}

/* ---------------- Persisted attempt ---------------- */

export type ExamPhase = "start" | "exam" | "results";

export interface AttemptState {
  phase: ExamPhase;
  studentName: string;
  startTs: number | null;
  endTs: number | null;
  submittedAt: string | null;
  currentIndex: number;
  answers: AnswerMap;
}
