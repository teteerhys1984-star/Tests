export type Difficulty = 'foundational' | 'intermediate' | 'advanced' | 'reasoning';

export interface SourceRef {
  unit: string;
  lesson: string;
  page: string;
  item: string;
  note?: string;
}

export interface Option {
  id: string;
  text: string;
}

export interface Field {
  id: string;
  /** Arabic label, may contain $...$ mathematical runs. */
  label: string;
  /** Exact expected value. Accepts any mathematically equivalent rational form. */
  expected: string;
  marks: number;
  placeholder?: string;
  /** Optional suffix rendered after the input as an isolated math run. */
  suffix?: string;
}

export type SubKind = 'rational' | 'mcq' | 'justify' | 'order' | 'fields';

export interface SubQuestion {
  id: string;
  label: string;
  prompt: string;
  kind: SubKind;
  marks: number;
  options?: Option[];
  correctOption?: string;
  reasons?: Option[];
  correctReason?: string;
  correctVerdict?: 'true' | 'false';
  statement?: string;
  expectedRational?: string;
  placeholder?: string;
  helper?: string;
  items?: Option[];
  correctOrder?: string[];
  fields?: Field[];
  solution: string;
  rationale: string;
  marking: string;
  commonMistakes: string;
  source: SourceRef;
}

export interface Question {
  id: string;
  number: number;
  title: string;
  domain: string;
  difficulty: Difficulty;
  marks: number;
  context?: string;
  subparts: SubQuestion[];
}

export interface QuestionOrderState {
  [subId: string]: string[];
}
