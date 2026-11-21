/**
 * Attempt persistence (localStorage), real-timestamp timer, and results aggregation.
 */
import { gradeQuestion, type QuestionGrade } from './grading'
import type { Answers, Question } from './types'

export const STORAGE_KEY = 'arena-math-unit1-attempt-v1'
export const TOTAL_MARKS = 100

export interface Attempt {
  version: 1
  id: string
  studentName: string
  /** Real wall-clock start time (ms since epoch), set when the student presses «بدء الاختبار». */
  startedAt: number
  /** Set on «تسليم الاختبار». Null while the attempt is in progress. */
  submittedAt: number | null
  answers: Answers
  current: number
}

export function createAttempt(studentName: string, now: number): Attempt {
  return {
    version: 1,
    id: `${now.toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    studentName: studentName.trim(),
    startedAt: now,
    submittedAt: null,
    answers: {},
    current: 0,
  }
}

function isAttempt(value: unknown): value is Attempt {
  if (!value || typeof value !== 'object') return false
  const a = value as Partial<Attempt>
  return (
    a.version === 1 &&
    typeof a.id === 'string' &&
    typeof a.studentName === 'string' &&
    typeof a.startedAt === 'number' &&
    (a.submittedAt === null || typeof a.submittedAt === 'number') &&
    typeof a.answers === 'object' &&
    a.answers !== null &&
    typeof a.current === 'number'
  )
}

export function loadAttempt(): Attempt | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    return isAttempt(parsed) ? parsed : null
  } catch {
    return null
  }
}

export function saveAttempt(attempt: Attempt): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(attempt))
  } catch {
    /* storage may be full or disabled; the in-memory attempt continues to work */
  }
}

export function clearAttempt(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
}

/** Elapsed time from the real start timestamp. Pauses on navigation are not applied, by design. */
export function elapsedMs(attempt: Pick<Attempt, 'startedAt' | 'submittedAt'>, now: number): number {
  const end = attempt.submittedAt ?? now
  return Math.max(0, end - attempt.startedAt)
}

/** Formats milliseconds as HH:MM:SS (hours may exceed 23). */
export function formatHMS(ms: number): string {
  const total = Math.floor(ms / 1000)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(h)}:${pad(m)}:${pad(s)}`
}

/** Western-digit local date-time, e.g. 2026-03-05 14:07. */
export function formatDateTime(ts: number): string {
  const d = new Date(ts)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export interface ResultItem {
  index: number
  question: Question
  grade: QuestionGrade
}

export interface ResultsSummary {
  studentName: string
  startedAt: number
  submittedAt: number
  elapsedMs: number
  score: number
  max: number
  correct: number
  partial: number
  wrong: number
  answers: Answers
  items: ResultItem[]
}

export function buildResults(questions: Question[], attempt: Attempt): ResultsSummary {
  const submittedAt = attempt.submittedAt ?? Date.now()
  const items: ResultItem[] = questions.map((question, i) => ({
    index: i + 1,
    question,
    grade: gradeQuestion(question, attempt.answers),
  }))
  const score = Math.round(items.reduce((s, it) => s + it.grade.earned, 0) * 100) / 100
  const max = items.reduce((s, it) => s + it.grade.max, 0)
  return {
    studentName: attempt.studentName,
    startedAt: attempt.startedAt,
    submittedAt,
    elapsedMs: elapsedMs(attempt, submittedAt),
    score,
    max,
    correct: items.filter((it) => it.grade.status === 'correct').length,
    partial: items.filter((it) => it.grade.status === 'partial').length,
    wrong: items.filter((it) => it.grade.status === 'wrong').length,
    answers: attempt.answers,
    items,
  }
}

/** Encouraging, non-shaming message for the results page. */
export function encouragement(score: number): string {
  if (score >= 90) return 'ممتاز! أداؤك رائع ودقيق، واصلي هذا التميّز.'
  if (score >= 75) return 'أحسنتِ كثيراً! فهمك للوحدة واضح، ومراجعة بسيطة للأخطاء ستصنع فرقاً.'
  if (score >= 50) return 'عمل جميل! لديك أساس جيد، وكل خطأ هنا فرصة لتتعلّمي شيئاً جديداً.'
  return 'لا بأس، المحاولة نفسها خطوة مهمة. راجعي الشرح خطوة بخطوة وستتحسّن نتيجتك بإذن الله.'
}
