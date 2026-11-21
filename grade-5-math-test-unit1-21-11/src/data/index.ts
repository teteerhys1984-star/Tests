import type { Question } from '../lib/types'
import { BANK_A } from './bank-a'
import { BANK_B } from './bank-b'
import { BANK_C } from './bank-c'
import { BANK_D } from './bank-d'

const ALL: Question[] = [...BANK_A, ...BANK_B, ...BANK_C, ...BANK_D]

/**
 * Presentation order. Deliberately interleaved (not lesson order): the student moves between
 * arithmetic, graphs, shapes, reasoning and error analysis.
 */
const PRESENTATION_ORDER = [
  'E1', 'A1', 'F1', 'C2', 'B2', 'D2', 'G1', 'C4', 'A2', 'E5',
  'H2', 'F4', 'D1', 'C1', 'B1', 'G2', 'E3', 'F2', 'D3', 'A3',
  'C3', 'E2', 'H3', 'F3', 'B3', 'D4', 'C5', 'E4', 'G3', 'H1',
]

const byId = new Map(ALL.map((q) => [q.id, q] as const))

/** The 30 main questions in the order they are shown to the student. */
export const QUESTIONS: Question[] = PRESENTATION_ORDER.map((id) => {
  const q = byId.get(id)
  if (!q) throw new Error(`Missing question ${id}`)
  return q
})

export const QUESTION_BY_ID: Record<string, Question> = Object.fromEntries(QUESTIONS.map((q) => [q.id, q]))

export function questionPoints(q: Question): number {
  return Math.round(q.parts.reduce((s, p) => s + p.points, 0) * 100) / 100
}

export const TOTAL_POINTS = QUESTIONS.reduce((s, q) => s + questionPoints(q), 0)
