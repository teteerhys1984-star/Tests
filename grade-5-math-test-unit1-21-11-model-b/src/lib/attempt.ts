/**
 * المحاولة كما تُحفظ في localStorage — مفاتيح هذا الاختبار (نموذج B) وحدها.
 *
 * بنية الحالة هي نفسها `SavedAttemptState` المعرّفة في مصدر الاختبار
 * (src/types/exam.ts) مع حقلين إضافيين للمنصة:
 *   · attemptId — معرّف إرسال المحاولة إلى Google Sheets. يُولَّد عند بدء
 *     الاختبار ويُثبَّت في المحاولة، فتبقى إعادة الإرسال (تلقائية أو يدوية،
 *     وحتى بعد تحديث الصفحة) للمحاولة نفسها ولا تُنشأ محاولة جديدة.
 *   · submitConfirmed — تصبح true بعد تأكيد التسليم من نافذة التأكيد النهائي.
 *
 * المفاتيح:
 *   · المحاولة: `${EXAM_ID}-attempt-v1`
 * لا يستعمل هذا الملف أي مفتاح عام أو مفتاح اختبار آخر.
 */
import { EXAM_ID } from '../config'
import { examQuestions } from '../data/questions'
import type { SavedAttemptState, StudentAnswersMap } from '../types/exam'

/** المفتاح namespace-ed بالمعرّف، فلا يتعارض مع أي اختبار آخر على المنصة. */
export const STORAGE_KEY = `${EXAM_ID}-attempt-v1`

export interface PlatformAttemptState extends SavedAttemptState {
  /** معرّف الإرسال الثابت للمحاولة (يولد عند البدء). */
  attemptId: string
  /** هل ضغطت الطالبة «تأكيد التسليم» في نافذة التأكيد النهائي؟ */
  submitConfirmed: boolean
  /** هل أكّد الخادم استلام نتيجة هذه المحاولة؟ (لعرض حالة الإرسال بعد إعادة التحميل) */
  submitDelivered: boolean
}

export const DEFAULT_ATTEMPT: PlatformAttemptState = {
  version: 1,
  attemptId: '',
  studentName: '',
  hasStarted: false,
  isSubmitted: false,
  submitConfirmed: false,
  submitDelivered: false,
  startedAtTimestamp: null,
  submittedAtTimestamp: null,
  currentQuestionIndex: 0,
  answers: {},
  isMuted: false,
}

function isStudentAnswersMap(value: unknown): value is StudentAnswersMap {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  return Object.values(value as Record<string, unknown>).every((v) => typeof v === 'string')
}

/** يقبل الحالة المحفوظة فقط إن كانت سليمة البنية؛ وإلا يعيد الحالة الافتراضية. */
export function sanitizeAttempt(parsed: unknown): PlatformAttemptState {
  if (!parsed || typeof parsed !== 'object') return { ...DEFAULT_ATTEMPT }
  const p = parsed as Partial<PlatformAttemptState>
  return {
    version: 1,
    attemptId: typeof p.attemptId === 'string' ? p.attemptId : '',
    studentName: typeof p.studentName === 'string' ? p.studentName : '',
    hasStarted: Boolean(p.hasStarted),
    isSubmitted: Boolean(p.isSubmitted),
    submitConfirmed: Boolean(p.submitConfirmed),
    submitDelivered: Boolean(p.submitDelivered),
    startedAtTimestamp:
      typeof p.startedAtTimestamp === 'number' ? p.startedAtTimestamp : null,
    submittedAtTimestamp:
      typeof p.submittedAtTimestamp === 'number' ? p.submittedAtTimestamp : null,
    currentQuestionIndex:
      typeof p.currentQuestionIndex === 'number' &&
      p.currentQuestionIndex >= 0 &&
      p.currentQuestionIndex < examQuestions.length
        ? p.currentQuestionIndex
        : 0,
    answers: isStudentAnswersMap(p.answers) ? p.answers : {},
    isMuted: Boolean(p.isMuted),
  }
}

export function loadAttempt(): PlatformAttemptState {
  if (typeof window === 'undefined') return { ...DEFAULT_ATTEMPT }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT_ATTEMPT }
    return sanitizeAttempt(JSON.parse(raw))
  } catch {
    return { ...DEFAULT_ATTEMPT }
  }
}

export function saveAttempt(attempt: PlatformAttemptState): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(attempt))
  } catch {
    /* التخزين قد يكون ممتلئاً أو معطّلاً؛ المحاولة في الذاكرة تستمر */
  }
}

export function clearAttempt(): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* لا شيء */
  }
}

/** الزمن المنقضي بالثواني من وقت البدء الحقيقي؛ يتوقف عند التسليم. */
export function elapsedSecondsOf(attempt: PlatformAttemptState, now: number): number {
  if (!attempt.hasStarted || attempt.startedAtTimestamp === null) return 0
  const end =
    attempt.isSubmitted && attempt.submittedAtTimestamp !== null
      ? attempt.submittedAtTimestamp
      : now
  return Math.max(0, Math.floor((end - attempt.startedAtTimestamp) / 1000))
}

/** التاريخ والوقت المحليان بأرقام إنجليزية، مثال: 2026-11-21 14:07. */
export function formatDateTime(ts: number): string {
  const d = new Date(ts)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}
