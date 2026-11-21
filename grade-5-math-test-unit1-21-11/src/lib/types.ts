/**
 * Core domain types shared by the question bank, the grader and the UI.
 *
 * Rich text convention: plain Arabic text, where every inline mathematical
 * expression is wrapped in single dollar signs, e.g. "النقطة $B$ تقع على المحور".
 * The UI renders the segments between $...$ with KaTeX; raw LaTeX never reaches the student.
 */
import type { MathDoc } from './expression'

export type Rich = string

export type LessonId =
  | 'coordinates'
  | 'line-graphs'
  | 'natural-numbers'
  | 'rounding'
  | 'add-subtract'
  | 'angles'
  | 'parallelogram'
  | 'rhombus'

export interface LessonMeta {
  id: LessonId
  title: string
  /** Page range exactly as in the repository's lesson registry / page-tagged teacher notes. */
  pages: string
  /** Number of main questions and points the blueprint assigns to this lesson. */
  blueprint: { questions: number; points: number }
}

export interface Opt {
  id: string
  text: Rich
}

export interface PlotPoint {
  label: string
  x: number
  y: number
}

/** Visual figures shown above a question. Coordinates are mathematical (y grows upward). */
export type FigureSpec =
  | { kind: 'coord-grid'; xMax: number; yMax: number; points?: PlotPoint[] }
  | {
      kind: 'line-chart'
      labels: string[]
      values: number[]
      yMin: number
      yMax: number
      yStep: number
      xLabel: string
      yLabel: string
    }
  | { kind: 'protractor'; degree: number }
  | { kind: 'angle'; degree: number; vertex: string; rayA: string; rayC: string }
  /**
   * Polygon with markings. `parallel` groups side indices that are parallel (1 arrow for the
   * first group, 2 arrows for the second); `equal` groups side indices with equal length
   * (1 tick for the first group, 2 for the second, ...). Side i joins vertices i and i+1.
   */
  | {
      kind: 'quad'
      vertices: [number, number][]
      labels: string[]
      parallel?: number[][]
      equal?: number[][]
      angleMarks?: { at: number; text: string }[]
    }

export interface TableSpec {
  caption: Rich
  headers: Rich[]
  rows: Rich[][]
}

export type PartInput =
  | { kind: 'choice'; options: Opt[]; answer: string }
  | { kind: 'tf'; answer: boolean }
  | { kind: 'math'; answer: number; tolerance?: number }
  | { kind: 'expanded'; n: number }
  | { kind: 'text'; exact: string[]; keywords?: string[][] }
  | { kind: 'pair'; x: number; y: number }
  | {
      kind: 'slots'
      bank: Opt[]
      slots: { id: string; label: string; answer: string }[]
      unordered?: boolean
    }
  | { kind: 'order'; items: Opt[]; answer: string[] }
  | { kind: 'match'; left: Opt[]; right: Opt[]; answer: Record<string, string> }
  | { kind: 'point'; xMax: number; yMax: number; given?: PlotPoint[]; answer: { x: number; y: number } }
  | { kind: 'numberline'; min: number; max: number; step: number; labelEvery: number; mid?: number; answer: number; tolerance: number }
  | { kind: 'angle-draw'; target: number; tolerance: number }

export interface Part {
  id: string
  label?: string
  points: number
  prompt?: Rich
  input: PartInput
}

export interface Solution {
  answer: Rich
  steps: Rich[]
  why: Rich
}

export interface Question {
  id: string
  lesson: LessonId
  skill: string
  pages: string
  style: string
  prompt: Rich
  figure?: FigureSpec
  table?: TableSpec
  parts: Part[]
  solution: Solution
}

/** Student answers, one entry per part id. */
export type AnswerValue =
  | { t: 'choice'; id: string | null }
  | { t: 'text'; v: string }
  | { t: 'math'; doc: MathDoc }
  | { t: 'order'; ids: string[] }
  | { t: 'match'; pairs: Record<string, string> }
  | { t: 'slots'; fill: Record<string, string> }
  | { t: 'point'; p: { x: number; y: number } | null }
  | { t: 'num'; v: number | null }
  | { t: 'angle'; deg: number | null }

export type Answers = Record<string, AnswerValue>
