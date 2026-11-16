export type LessonId = 1 | 2 | 3 | 4 | 5;

export interface LessonInfo {
  id: LessonId;
  title: string;
  pages: string;
  icon: string;
}

/** Internal curriculum reference. Never shown during an active exam. */
export interface SourceRef {
  book: "Pupil’s Book" | "Workbook";
  page: string;
  exercise: string;
  detail?: string;
}

export interface ImageAsset {
  src: string;
  alt: string;
}

export interface LabeledImage extends ImageAsset {
  label: string;
}

export interface ChoicePart {
  id: string;
  kind: "choice";
  marks: number;
  label?: string;
  stem: string;
  options: string[];
  answer: string;
  layout?: "list" | "row";
}

export interface SelectPart {
  id: string;
  kind: "select";
  marks: number;
  options: string[];
  answer: string;
  style: "dropdown" | "buttons";
  ariaLabel: string;
}

export interface TextPart {
  id: string;
  kind: "text";
  marks: number;
  accepted: string[];
  answerDisplay: string;
  ariaLabel: string;
  size?: "sm" | "md" | "lg";
  inputMode?: "text" | "numeric";
}

export interface OrderPart {
  id: string;
  kind: "order";
  marks: number;
  /** Tiles in the (mixed) order shown to the pupil. */
  tokens: string[];
  answer: string[];
}

export type Part = ChoicePart | SelectPart | TextPart | OrderPart;

export type Segment = string | { blank: string } | { image: ImageAsset };

export interface TableCell {
  text?: string;
  image?: ImageAsset;
  blank?: string;
}

export type Block =
  | { type: "choice"; part: string }
  | { type: "sentence"; label?: string; segments: Segment[]; images?: ImageAsset[] }
  | { type: "order"; part: string }
  | { type: "wordbank"; words: string[] }
  | { type: "gallery"; images: LabeledImage[] }
  | { type: "timetable"; rows: { day: string; cells: TableCell[] }[] }
  | { type: "sequence"; items: Segment[] }
  | { type: "example"; label?: string; text: string; images?: ImageAsset[] };

export type Passage =
  | { id: string; kind: "dialogue"; title: string; panels: string[][]; source: string }
  | { id: string; kind: "song"; title: string; lines: string[]; source: string }
  | { id: string; kind: "text"; title: string; lines: string[]; source: string }
  | { id: string; kind: "table"; title: string; header: string[]; rows: string[][]; source: string; note?: string }
  | {
      id: string;
      kind: "picture";
      title: string;
      image: ImageAsset;
      labels: { text: string; x: number; y: number }[];
      source: string;
    };

export interface Question {
  id: string;
  lesson: LessonId;
  format: string;
  instruction: string;
  passage?: Passage;
  blocks: Block[];
  parts: Part[];
  sources: SourceRef[];
  explanation: string;
  gradingRule: string;
}

export type AnswerValue = string | number[];
export type QuestionAnswers = Record<string, AnswerValue>;
export type AnswerSheet = Record<string, QuestionAnswers>;

export type ExamStatus = "idle" | "active" | "submitted";

export interface ExamState {
  version: 1;
  status: ExamStatus;
  attemptId: string;
  studentName: string;
  currentIndex: number;
  answers: AnswerSheet;
  startedAt: number | null;
  submittedAt: number | null;
  /** Last known elapsed time (ms). While active the live value is now - startedAt. */
  elapsedMs: number;
  lastSavedAt: number;
}

export interface PartResult {
  partId: string;
  earned: number;
  max: number;
  correct: boolean;
  answered: boolean;
}

export interface QuestionResult {
  questionId: string;
  lesson: LessonId;
  earned: number;
  max: number;
  status: "correct" | "partial" | "incorrect";
  parts: PartResult[];
}

export interface LessonScore {
  earned: number;
  max: number;
  questions: number;
}

export interface ExamResult {
  total: number;
  max: number;
  correctCount: number;
  partialCount: number;
  incorrectCount: number;
  byLesson: Record<LessonId, LessonScore>;
  questions: QuestionResult[];
}
