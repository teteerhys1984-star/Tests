import type { ReactNode } from "react";

/* ═══════════════════════════════════════════════════════════════════════════
   Exam data model — Unit 1: متوازيات الأضلاع والانسحاب
   ═══════════════════════════════════════════════════════════════════════════ */

export interface Option {
  id: string;
  text: string;
}

export interface FigureSlot {
  node: ReactNode;
  caption?: string;
  schematic?: boolean;
}

interface PartCommon {
  id: string;
  marks: number;
  prompt: string;
  /** Textbook anchor, e.g. «الكتاب ص ٦ — خواص الانسحاب». */
  reference: string;
  /** Full worked explanation, shown only after submission. */
  explanation: string;
  /** Teacher-only: typical wrong reasoning. */
  commonMistake?: string;
  figure?: FigureSlot;
}

export interface McqPart extends PartCommon {
  type: "mcq";
  options: Option[];
  correct: string;
}

export interface MultiPart extends PartCommon {
  type: "multi";
  options: Option[];
  correct: string[];
  /** Rendered above the options, e.g. «اختر كل العبارات الصحيحة». */
  instruction?: string;
}

export interface TfItem {
  id: string;
  text: string;
  answer: boolean;
  /** Offered only when the statement is false. */
  corrections?: Option[];
  correctCorrection?: string;
  marks: number;
  why: string;
}

export interface TfPart extends PartCommon {
  type: "tf";
  items: TfItem[];
}

export interface MatchPart extends PartCommon {
  type: "match";
  leftHeading: string;
  rightHeading: string;
  left: Option[];
  right: Option[];
  solution: Record<string, string>;
}

export interface OrderPart extends PartCommon {
  type: "order";
  steps: Option[];
  correctOrder: string[];
  /** Shuffled once, deterministically, so the control never opens solved. */
  initialOrder: string[];
}

export interface NumericField {
  id: string;
  label: string;
  answer: number;
  tol?: number;
  unit?: string;
  marks: number;
}

export interface NumericPart extends PartCommon {
  type: "numeric";
  fields: NumericField[];
}

export interface ClozeBlank {
  id: string;
  options: Option[];
  correct: string;
  marks: number;
  why: string;
}

export type ClozePiece = string | { blank: ClozeBlank };

export interface ClozePart extends PartCommon {
  type: "cloze";
  /** Ordered pieces: literal LaTeX/Arabic text, or a blank to fill. */
  pieces: ClozePiece[];
  stepLabels: string[];
}

export interface PlotTarget {
  id: string;
  label: string;
  x: number;
  y: number;
  marks: number;
}

export interface PlotUnderlay {
  polygon?: { pts: [number, number][]; labels: string[] };
  vector?: { from: [number, number]; to: [number, number]; label?: string };
}

export interface PlotPart extends PartCommon {
  type: "plot";
  cols: number;
  rows: number;
  targets: PlotTarget[];
  /** The original shape, drawn on the same grid the student plots on. */
  underlay?: PlotUnderlay;
}

export type Part =
  | McqPart
  | MultiPart
  | TfPart
  | MatchPart
  | OrderPart
  | NumericPart
  | ClozePart
  | PlotPart;

export interface Question {
  id: string;
  index: number;
  title: string;
  topic: string;
  marks: number;
  reference: string;
  intro?: string;
  figure?: FigureSlot;
  parts: Part[];
}

/* ═══════════════════════════════════════════════════════════════════════════
   Answer shapes (persisted to localStorage)
   ═══════════════════════════════════════════════════════════════════════════ */

export type TfValue = Record<string, { verdict?: "true" | "false"; correction?: string }>;
export type MatchValue = Record<string, string>;
export type NumericValue = Record<string, string>;
export type ClozeValue = Record<string, string>;
export type PlotValue = Record<string, { x: number; y: number } | null>;

export type AnswerValue =
  | string
  | string[]
  | TfValue
  | MatchValue
  | NumericValue
  | ClozeValue
  | PlotValue
  | undefined;

export type Answers = Record<string, AnswerValue>;

/* ═══════════════════════════════════════════════════════════════════════════
   Grading result
   ═══════════════════════════════════════════════════════════════════════════ */

export interface GradeLine {
  label: string;
  earned: number;
  max: number;
  ok: boolean;
}

export interface PartGrade {
  partId: string;
  earned: number;
  max: number;
  lines: GradeLine[];
  studentText: string;
  correctText: string;
}

export interface QuestionGrade {
  questionId: string;
  earned: number;
  max: number;
  parts: PartGrade[];
}

export interface ExamGrade {
  earned: number;
  max: number;
  questions: QuestionGrade[];
}