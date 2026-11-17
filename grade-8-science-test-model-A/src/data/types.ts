export type Subject = "physics" | "chemistry";

export type Phase = "start" | "exam" | "results";

export type FigureKind =
  | "beam-same"
  | "beam-opposite"
  | "perpendicular"
  | "acute45"
  | "equal60"
  | "spring-board"
  | "vector-anatomy"
  | "inclined-resolve"
  | "suspended-block"
  | "swing-chains"
  | "beam-3m"
  | "chlorine-tile"
  | "bohr-shells"
  | "rutherford-foil"
  | "hydrogen-isotopes"
  | "nacl-transfer";

/** Hidden, teacher-only provenance for a main question. Never shown to students. */
export interface SourceRef {
  subject: Subject;
  unit: string;
  lesson: string;
  page: string;
  /** Textbook exercise / platform record the item came from. */
  source: string;
  skill: string;
  /** Only for the five original independent-test problems (image number 1–14). */
  itImage?: number;
  /** Only for the five original independent-test problems (problem number). */
  itProblem?: number;
  origin: "textbook" | "independent-test";
}

export type Criterion = {
  /** Partial-credit weight of this criterion inside the sub-item. */
  w: number;
  /** Arabic keyword families — any one member of a family satisfies it. */
  any: string[];
  /** Shown in the results page as the expected-answer note for this criterion. */
  note: string;
};

export type SubAnswerSpec =
  | { kind: "numeric"; value: number; tol: number }
  | { kind: "text"; criteria: Criterion[] }
  | { kind: "matrix"; cells: { id: string; accept: string[]; note: string }[] }
  | { kind: "lewis"; shared: number; loneLeft: number; loneRight: number; single?: boolean }
  | { kind: "draw"; labels: string[]; minStrokes: number };

export interface SubItem {
  id: string;
  /** The Arabic label the student reads. */
  label: string;
  kind: "numeric" | "text" | "matrix" | "lewis" | "draw";
  points: number;
  unit?: string;
  /** Structured extra data for matrices / drawing pads. */
  rows?: { id: string; cells: string[] }[];
  headers?: string[];
  rowHeader?: string[];
  lewis?: { symbols: [string, string] | [string]; single?: boolean };
  answer: SubAnswerSpec;
}

export interface Question {
  id: string;
  n: number;
  subject: Subject;
  marks: number;
  /** Arabic stem shown to the student (may contain [[TeX]] markup tokens). */
  stem: string;
  /** Optional given-data strip (rendered in KaTeX). */
  givens?: string[];
  /** Optional figure rendered as a scientific SVG + KaTeX diagram. */
  figure?: FigureKind;
  conditions?: string;
  subs: SubItem[];
  src: SourceRef;
}

export interface AnswerMap {
  [subId: string]: string | string[] | LewisAnswer | MatrixAnswer | DrawAnswer;
}

export interface LewisAnswer {
  shared: number;
  lone: [number, number];
}

export interface MatrixAnswer {
  [cellId: string]: string;
}

export interface VectorArrowItem {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  dashed?: boolean;
  color?: string;
}

export interface DrawAnswer {
  strokes: number;
  labels: string[];
  /** Freehand ink paths (normalized 0–1). */
  paths?: number[][];
  /** Precision geometric vector arrows & construction lines (normalized 0–1). */
  vectors?: VectorArrowItem[];
}

export interface SubResult {
  subId: string;
  awarded: number;
  points: number;
  detail: { criterion?: string; ok: boolean; got?: number; want?: number }[];
  student: string;
  expected: string;
}

export interface QuestionResult {
  question: Question;
  awarded: number;
  subs: SubResult[];
}

export interface Attempt {
  v: number;
  name: string;
  startedAt: number;
  submittedAt?: number;
  answers: AnswerMap;
  muted: boolean;
  /** رقم السؤال النشط — يُستعاد بعد تحديث الصفحة. */
  idx?: number;
}
