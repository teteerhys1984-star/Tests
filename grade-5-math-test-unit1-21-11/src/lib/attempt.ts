/**
 * المحاولة كما تُحفظ في localStorage — مفاتيح هذا الاختبار وحدها.
 */
import { EXAM_ID } from '../config'
import { gradeQuestion, type QuestionGrade } from './grading'
import type { Answers, Question } from './types'

/** المفتاح namespace-ed بالمعرّف، فلا يتعارض مع أي اختبار آخر على المنصة. */
export const STORAGE_KEY = `${EXAM_ID}-attempt-v1`

export interface Attempt {
  version: 1
  id: string
  studentName: string
  startedAt: number
  submittedAt: number | null
  /** True after the student confirmed submission from the review screen. */
  confirmed: boolean
  /**
   * معرّف إرسال المحاولة إلى Google Sheets. يُثبَّت عند التسليم ويُحفظ مع المحاولة،
   * فتبقى إعادة الإرسال (تلقائية أو يدوية، حتى بعد تحديث الصفحة) للمحاولة نفسها.
   */
  attemptId?: string
  answers: Answers
  current: number
}

export function createAttempt(studentName: string, now: number): Attempt {
  return {
    version: 1,
    id: `${now.toString(36)}-${Math.random().toString(36).slice(2, 10)}`,
    studentName: studentName.trim().replace(/\s+/g, ' '),
    startedAt: now,
    submittedAt: null,
    confirmed: false,
    answers: {},
    current: 0,
  }
}

/**
 * يقبل المحاولات المحفوظة. المحاولات التي كُتبت قبل إضافة حقل confirmed
 * تُكمَل بـ false حتى لا يُعاد تسليم محاولة قديمة تلقائياً.
 */
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
    if (!isAttempt(parsed)) return null
    return parsed.confirmed === true ? parsed : { ...parsed, confirmed: false }
  } catch {
    return null
  }
}

export function saveAttempt(attempt: Attempt): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(attempt))
  } catch {
    /* التخزين قد يكون ممتلئاً أو معطّلاً؛ المحاولة في الذاكرة تستمر */
  }
}

export function clearAttempt(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* لا شيء */
  }
}

/** الزمن المنقضي من وقت البدء الحقيقي؛ يتوقف عند التسليم. */
export function elapsedMs(attempt: Pick<Attempt, 'startedAt' | 'submittedAt'>, now: number): number {
  const end = attempt.submittedAt ?? now
  return Math.max(0, end - attempt.startedAt)
}

/** يحوّل الميلي ثانية إلى HH:MM:SS (قد تتجاوز الساعات 23). */
export function formatHMS(ms: number): string {
  const total = Math.floor(ms / 1000)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(h)}:${pad(m)}:${pad(s)}`
}

/** التاريخ والوقت المحليان بأرقام إنجليزية، مثال: 2026-03-05 14:07. */
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
  const max = Math.round(items.reduce((s, it) => s + it.grade.max, 0) * 100) / 100
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

/** رسالة تشجيعية غير لائمة للطالب. */
export function encouragement(score: number): string {
  if (score >= 90) return 'ممتاز! أداؤك رائع ودقيق، واصلي هذا التميّز.'
  if (score >= 75) return 'أحسنتِ كثيراً! فهمك للوحدة واضح، ومراجعة بسيطة للأخطاء ستصنع فرقاً.'
  if (score >= 50) return 'عمل جميل! لديك أساس جيد، وكل خطأ هنا فرصة لتتعلّمي شيئاً جديداً.'
  return 'لا بأس، المحاولة نفسها خطوة مهمة. راجعي الشرح خطوة بخطوة وستتحسّن نتيجتك بإذن الله.'
}
