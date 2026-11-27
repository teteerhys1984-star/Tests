import type { Answers } from './types'

export type Phase = 'start' | 'exam' | 'results'

export interface ExamState {
  phase: Phase
  attemptId: string
  name: string
  startedAt: number | null
  submittedAt: number | null
  answers: Answers
  current: number
  muted: boolean
}

export const STORAGE_KEY = 'grade-5-math-test-u1-u2-l1-l2:attempt:v1'

function defaultStorage(): Storage | null {
  try { return typeof localStorage !== 'undefined' ? localStorage : null } catch { return null }
}

export const initialState = (): ExamState => ({
  phase: 'start',
  attemptId: '',
  name: '',
  startedAt: null,
  submittedAt: null,
  answers: {},
  current: 0,
  muted: false,
})

export function loadState(storage: Pick<Storage, 'getItem'> | null = defaultStorage()): ExamState {
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

export function saveState(state: ExamState, storage: Pick<Storage, 'setItem'> | null = defaultStorage()) {
  if (!storage) return false
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state))
    return true
  } catch {
    return false
  }
}

export function clearState(storage: Pick<Storage, 'removeItem'> | null = defaultStorage()) {
  try { storage?.removeItem(STORAGE_KEY) } catch { /* unavailable storage */ }
}
