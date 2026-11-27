export interface Ref {
  unit: string
  lesson: string
  pages: string
  skill: string
}

export interface Option {
  id: string
  label: string
}

interface BaseSub {
  id: string
  marks: number
  prompt: string
  ref: Ref
  explanation: string
  /** Teacher-only marking notes */
  marking?: string
}

export interface McqSub extends BaseSub {
  type: 'mcq'
  options: Option[]
  correct: string
  /** optional figure to render above the options */
  figure?: FigureKind
}

export interface NumericSub extends BaseSub {
  type: 'numeric'
  expected: number
  unit?: string
  working?: boolean
  partialKeys?: number[]
  partialMarks?: number
  verify?: { op: '+' | '-' | '*'; operands: number[] }
}

export interface PairSub extends BaseSub {
  type: 'pair'
  expected: { x: number; y: number }
}

export interface PlotSub extends BaseSub {
  type: 'plot'
  expected: { x: number; y: number }
}

export interface TfSub extends BaseSub {
  type: 'tf'
  statement: string
  correct: boolean
  correction: { options: Option[]; correct: string; marks: number }
}

export interface MatchSub extends BaseSub {
  type: 'match'
  left: Option[]
  right: Option[]
  correct: Record<string, string>
}

export interface OrderSub extends BaseSub {
  type: 'order'
  items: { id: string; value: number }[]
  direction: 'asc' | 'desc'
}

export interface CompareSub extends BaseSub {
  type: 'compare'
  pairs: { id: string; a: number; b: number }[]
}

export interface CellsSub extends BaseSub {
  type: 'cells'
  cells: { id: string; label: string; expected: number; marks: number }[]
  prefix?: string
}

export type FigureKind = 'angle' | 'angle-name' | 'parallelogram' | 'shapes' | 'missing-digit'

export type SubQuestion =
  | McqSub
  | NumericSub
  | PairSub
  | PlotSub
  | TfSub
  | MatchSub
  | OrderSub
  | CompareSub
  | CellsSub

export interface MainQuestion {
  id: string
  number: number
  title: string
  intro: string
  marks: number
  color: string
  icon: string
  /** which shared figure to render at the top */
  figure?: 'grid' | 'graph'
  subs: SubQuestion[]
}

export type AnswerValue = string | string[] | Record<string, string>
export type Answers = Record<string, AnswerValue>

export interface SubResult {
  subId: string
  marks: number
  earned: number
  status: 'correct' | 'partial' | 'wrong' | 'unanswered'
  studentText: string
  correctText: string
}

export interface ExamResult {
  total: number
  max: number
  questions: { id: string; earned: number; marks: number; subs: SubResult[] }[]
}

export interface GridPoint {
  id: string
  x: number
  y: number
}
