export type SubpartType = "mcq" | "tf" | "numeric" | "text" | "ordering";

export type FigureId =
  | "line-symbols"
  | "intersecting-lines"
  | "parallel-lines"
  | "vertical-angles"
  | "triangle-types"
  | "triangle-angles"
  | "triangle-exterior"
  | "triangle-isosceles"
  | "rectangle";

export interface Option {
  value: string;
  label: string;
}

export interface Alternative {
  /** A canonical normalized answer value. */
  value: string;
  /** Marks awarded when this alternative is matched. */
  marks: number;
  label?: string;
}

export interface Subpart {
  id: string;
  prompt: string;
  type: SubpartType;
  marks: number;
  options?: Option[];
  /** Canonical correct value (string for all types; string[] for ordering). */
  correct: string | string[];
  /** Additional accepted text answers / partial-credit alternatives. */
  accepted?: Alternative[];
  numericAnswer?: number;
  tolerance?: number;
  textAnswers?: string[];
  explanation: string;
  page: string;
  rubric?: string;
  placeholder?: string;
  items?: string[];
  calc?: { lines: string[]; operator: string };
}

export interface Question {
  id: number;
  topic: string;
  stem: string;
  figure?: FigureId;
  figureCaption?: string;
  marks: number;
  page: string;
  subparts: Subpart[];
}

export type AnswerValue = string | string[] | null;

export interface Attempt {
  examId: string;
  version: string;
  attemptId: string;
  studentName: string;
  startedAt: number;
  savedAt: number;
  currentIndex: number;
  visited: number[];
  questionOrder: number[];
  optionOrders: Record<string, string[]>;
  answers: Record<string, AnswerValue>;
  /** Persisted view state so a refresh restores the exact active screen. */
  mode?: "exam" | "review";
}

export type SubpartStatus = "correct" | "partial" | "incorrect" | "unanswered";

export interface SubpartResult {
  subpartId: string;
  questionId: number;
  status: SubpartStatus;
  awarded: number;
  max: number;
  studentDisplay: string;
  correctDisplay: string;
  explanation: string;
  page: string;
  prompt: string;
}

export interface ExamResult {
  examId: string;
  version: string;
  attemptId: string;
  studentName: string;
  startedAt: number;
  submittedAt: number;
  durationMs: number;
  score: number;
  maxScore: number;
  percentage: number;
  counts: { correct: number; partial: number; incorrect: number; unanswered: number };
  subparts: SubpartResult[];
  questionOrder: number[];
  answers: Record<string, AnswerValue>;
  optionOrders: Record<string, string[]>;
}
