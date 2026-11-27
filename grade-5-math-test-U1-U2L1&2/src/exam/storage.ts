import type { Answers } from './types'

export type Phase = 'start' | 'exam' | 'results'

export interface ExamState {
  phase: Phase
  name: string
  startedAt: number | null
  submittedAt: number | null
  answers: Answers
  current: number
  muted: boolean
}

export const STORAGE_KEY = 'g5-math-exam-attempt-v1'

export const initialState = (): ExamState => ({
  phase: 'start',
  name: '',
  startedAt: null,
  submittedAt: null,
  answers: {},
  current: 0,
  muted: false,
})

export function loadState(storage: Pick<Storage, 'getItem'> | null = typeof localStorage !== 'undefined' ? localStorage : null): ExamState {
  if (!storage) return initialState()
  try {
    const raw = storage.getItem(STORAGE_KEY)
    if (!raw) return initialState()
    const parsed = JSON.parse(raw) as Partial<ExamState>
    const base = initialState()
    const state: ExamState = { ...base, ...parsed, answers: parsed.answers ?? {} }
    // Guard against corrupt/incoherent states
    if (state.phase === 'exam' && !state.startedAt) state.phase = 'start'
    if (state.phase === 'results' && !state.submittedAt) state.phase = 'exam'
    return state
  } catch {
    return initialState()
  }
}

export function saveState(state: ExamState, storage: Pick<Storage, 'setItem'> | null = typeof localStorage !== 'undefined' ? localStorage : null) {
  if (!storage) return
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    /* quota or private mode: ignore */
  }
}

export function clearState(storage: Pick<Storage, 'removeItem'> | null = typeof localStorage !== 'undefined' ? localStorage : null) {
  storage?.removeItem(STORAGE_KEY)
}
