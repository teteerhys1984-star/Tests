/**
 * إرسال نتيجة الطالب إلى المعلّم (تطبيق ويب Google Apps Script يكتب في Google Sheets).
 *
 * العقد نفسه المعتمد في الاختبار المرجعي grade5-math-unit1 وفي نموذج A
 * (grade-5-math-test-unit1-21-11)، دون تغيير:
 *   · buildPayload  — أسماء الحقول وبنيته كما هي (12 حقلاً عليا، 11 في summary،
 *                     3 في lessons، 9 في details).
 *   · sendWithRetry — ثلاث محاولات بفاصلين 2 ثم 5 ثوانٍ، ومهلة 30 ثانية لكل محاولة،
 *                     والحمولة تُحفظ في localStorage عند فشل المحاولات كلها.
 *   · retryPending  — عند تحميل التطبيق يعيد بصمت إرسال ما بقي معلّقاً لهذا
 *                     الاختبار ويحذفه بعد النجاح.
 *
 * المحاولات المعلّقة تُحفظ تحت pending:<EXAM_ID>:<attemptId> حيث EXAM_ID هو معرّف
 * هذا الاختبار (نموذج B)، فلا تتداخل مع محاولات نموذج A أو أي اختبار آخر.
 *
 * لا يكتب هذا الملف أي شيء في console: بيانات الطلاب لا تُسجَّل.
 */
import { EXAM_ID, EXAM_TITLE, SHEETS_TOKEN, SHEETS_URL } from '../config'
import { examQuestions, unitOneLessons } from '../data/questions'
import type { QuestionScoreResult, StudentAnswersMap } from '../types/exam'
import { gradeFullExam } from '../utils/scoring'

/* ------------------------------------------------------------------ */
/* الحمولة — أسماء الحقول يتوقّعها الخادم كما هي                        */
/* ------------------------------------------------------------------ */

export interface PayloadSummary {
  total: number
  max: number
  percentage: number
  gradeLabel: string
  fullQuestions: number
  partialQuestions: number
  wrongQuestions: number
  correctSubparts: number
  partialSubparts: number
  wrongSubparts: number
  unansweredSubparts: number
}

export interface PayloadLesson {
  title: string
  awarded: number
  max: number
}

export interface PayloadDetail {
  q: number
  qTitle: string
  lessons: string
  label: string
  status: string
  awarded: number
  marks: number
  studentAnswer: string
  correctAnswer: string
}

export interface SubmissionPayload {
  token: string
  attemptId: string
  examId: string
  examTitle: string
  studentName: string
  startAt: string
  submitAt: string
  elapsedSec: number
  summary: PayloadSummary
  lessons: PayloadLesson[]
  details: PayloadDetail[]
  reportText: string
}

export interface PayloadInput {
  attemptId: string
  studentName: string
  /** الطوابع الزمنية الحقيقية للمحاولة. */
  startedAt: number
  submittedAt: number
  elapsedSec: number
  /** إجابات الطالب المجمّدة عند التسليم. */
  answers: StudentAnswersMap
  /** نص التقرير الكامل (من lib/report.ts). */
  reportText: string
}

export const STATUS_AR: Record<string, string> = {
  correct: 'إجابة صحيحة',
  partial: 'إجابة صحيحة جزئياً',
  wrong: 'إجابة خاطئة',
  unanswered: 'لم يُجب',
}

/** معرّف فريد للمحاولة؛ يتجاهل الخادم تكراره، فإعادة إرسال المحاولة نفسها آمنة. */
export function newAttemptId(): string {
  try {
    const c = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto
    if (c && typeof c.randomUUID === 'function') return c.randomUUID()
  } catch {
    /* متصفح قديم أو سياق غير آمن — نستعمل البديل أدناه */
  }
  const rand = () => Math.random().toString(36).slice(2, 10)
  return `${Date.now()}-${rand()}${rand()}`
}

/** النسبة المئوية بتقريب منزلة عشرية واحدة، كما في الاختبار المرجعي. */
export function percentageOf(total: number, max: number): number {
  return max > 0 ? Math.round((total / max) * 1000) / 10 : 0
}

/** التقدير اللفظي المعتمد في المنصة (نفس سلّم الاختبار المرجعي حرفياً). */
export function gradeLabel(percentage: number): string {
  if (percentage >= 95) return 'ممتاز'
  if (percentage >= 85) return 'جيد جداً'
  if (percentage >= 75) return 'جيد'
  if (percentage >= 65) return 'مقبول'
  if (percentage >= 50) return 'ضعيف'
  return 'يحتاج إلى دعم'
}

/**
 * علامات كل درس من دروس الوحدة الثمانية. كل سؤال ينتمي إلى درس واحد فقط،
 * لذلك مجموع العلامات في التوزيع يساوي مجموع علامات الاختبار (100).
 */
export function lessonTotals(questionResults: QuestionScoreResult[]): PayloadLesson[] {
  return unitOneLessons.map((lesson) => {
    let awarded = 0
    let max = 0
    for (const q of questionResults) {
      if (q.lessonId !== lesson.id) continue
      awarded += q.earnedMarks
      max += q.maxMarks
    }
    return { title: lesson.title, awarded: Math.round(awarded * 100) / 100, max }
  })
}

/** يحوّل أي آثار LaTeX بسيطة في نصوص العرض إلى نص صرف مقروء في Sheets. */
function plainText(text: string): string {
  return text
    .replace(/\$/g, '')
    .replace(/\^\{\\circ\}/g, '°')
    .replace(/\\circ/g, '°')
    .replace(/\\text\{([^{}]*)\}/g, '$1')
    .replace(/\\widehat\{([^{}]*)\}/g, '∠$1')
    .replace(/\\angle/g, '∠')
    .replace(/\\times/g, '×')
    .replace(/\\div/g, '÷')
    .replace(/\\ge/g, '≥')
    .replace(/\\le/g, '≤')
    .replace(/\\parallel/g, '∥')
    .replace(/\\to/g, '←')
    .replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/g, '($1)/($2)')
    .replace(/[{}]/g, '')
    .replace(/\\[,;:!]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** حالة الفرع بالعربية: فارغ = لم يُجب، وإلا بحسب العلامة المستحقة. */
function branchStatus(
  branchId: string,
  answers: StudentAnswersMap,
  awarded: number,
  marks: number,
): string {
  const raw = (answers[branchId] ?? '').trim()
  if (!raw) return STATUS_AR.unanswered
  if (marks > 0 && awarded >= marks) return STATUS_AR.correct
  if (awarded > 0) return STATUS_AR.partial
  return STATUS_AR.wrong
}

/**
 * يبني حمولة الإرسال. كل الأرقام والنصوص تأتي من دوالّ التصحيح الحتمية نفسها
 * (gradeFullExam في مصدر الاختبار)، فتطابق ما يظهر في صفحة النتيجة وفي ملف
 * التقرير تماماً.
 */
export function buildPayload({
  attemptId,
  studentName,
  startedAt,
  submittedAt,
  elapsedSec,
  answers,
  reportText,
}: PayloadInput): SubmissionPayload {
  const summary = gradeFullExam(answers, examQuestions)
  const total = Math.round(summary.totalEarned * 100) / 100
  const max = Math.round(summary.totalMax * 100) / 100
  const percentage = percentageOf(total, max)

  let correctSubparts = 0
  let partialSubparts = 0
  let wrongSubparts = 0
  let unansweredSubparts = 0

  const details: PayloadDetail[] = []
  for (const q of summary.questionResults) {
    for (const b of q.branchResults) {
      const status = branchStatus(b.branchId, answers, b.earnedMarks, b.maxMarks)
      if (status === STATUS_AR.unanswered) unansweredSubparts++
      else if (status === STATUS_AR.correct) correctSubparts++
      else if (status === STATUS_AR.partial) partialSubparts++
      else wrongSubparts++
      details.push({
        q: q.questionNumber,
        qTitle: plainText(q.skill),
        lessons: q.lessonTitle,
        label: b.label,
        status,
        awarded: b.earnedMarks,
        marks: b.maxMarks,
        studentAnswer: plainText(b.studentAnswerDisplay),
        correctAnswer: plainText(b.modelAnswerDisplay),
      })
    }
  }

  return {
    token: SHEETS_TOKEN,
    attemptId,
    examId: EXAM_ID,
    examTitle: EXAM_TITLE,
    studentName,
    startAt: new Date(startedAt).toISOString(),
    submitAt: new Date(submittedAt).toISOString(),
    elapsedSec: Math.max(0, Math.floor(elapsedSec)),
    summary: {
      total,
      max,
      percentage,
      gradeLabel: gradeLabel(percentage),
      fullQuestions: summary.correctQuestionCount,
      partialQuestions: summary.partialQuestionCount,
      wrongQuestions: summary.wrongQuestionCount,
      correctSubparts,
      partialSubparts,
      wrongSubparts,
      unansweredSubparts,
    },
    lessons: lessonTotals(summary.questionResults),
    details,
    reportText,
  }
}

/** يعيد بادئة محاولات الإرسال المعلّقة لهذا الاختبار وحده. */
export const PENDING_PREFIX = `pending:${EXAM_ID}:`

export function pendingKey(attemptId: string): string {
  return PENDING_PREFIX + attemptId
}

/* ------------------------------------------------------------------ */
/* الإرسال                                                             */
/* ------------------------------------------------------------------ */

export type SendStatus = 'idle' | 'sending' | 'success' | 'failed'

/** الانتظار قبل المحاولة الثانية ثم الثالثة (3 محاولات في المجموع). */
export const RETRY_DELAYS_MS: readonly number[] = [2000, 5000]
export const MAX_ATTEMPTS = RETRY_DELAYS_MS.length + 1
/** مهلة المحاولة الواحدة: اتصال معلّق بلا ردّ يُعدّ فشلاً فتبدأ المحاولة التالية. */
export const ATTEMPT_TIMEOUT_MS = 30000

export type FetchLike = (url: string, init: RequestInit) => Promise<Pick<Response, 'text'>>

export interface StorageLike {
  readonly length: number
  key(index: number): string | null
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

export interface SendOptions {
  fetchImpl?: FetchLike
  /** null = لا تخزين متاح. */
  storage?: StorageLike | null
  sleep?: (ms: number) => Promise<void>
  timeoutMs?: number
}

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

/** النجاح فقط إذا قُرئ ردّ الخادم وفيه ok:true — أو duplicate:true (المحاولة مسجّلة عنده من قبل). */
function isAccepted(data: unknown): boolean {
  if (typeof data !== 'object' || data === null) return false
  const reply = data as { ok?: unknown; duplicate?: unknown }
  return reply.ok === true || reply.duplicate === true
}

/**
 * محاولة إرسال واحدة.
 * النوع text/plain مقصود: application/json يستدعي طلب CORS تمهيدياً (preflight) لا يجيب عنه Apps Script.
 * أي خطأ شبكة، أو ردّ تعذّرت قراءته (CORS)، أو ردّ ليس JSON، أو انتهاء المهلة = فشل.
 */
async function postOnce(body: string, opts: SendOptions): Promise<boolean> {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    const doFetch: FetchLike = opts.fetchImpl ?? ((url, init) => fetch(url, init))
    const ctrl = typeof AbortController === 'function' ? new AbortController() : null
    const reply = doFetch(SHEETS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body,
      redirect: 'follow',
      ...(ctrl ? { signal: ctrl.signal } : {}),
    }).then((res) => res.text())
    reply.catch(() => {}) // إن انتهت المهلة أولاً فلا يبقى رفض غير معالَج
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        ctrl?.abort()
        reject(new Error('timeout'))
      }, opts.timeoutMs ?? ATTEMPT_TIMEOUT_MS)
    })
    return isAccepted(JSON.parse(await Promise.race([reply, timeout])))
  } catch {
    return false
  } finally {
    if (timer !== undefined) clearTimeout(timer)
  }
}

/** حتى 3 محاولات بالحمولة نفسها والمعرّف نفسه. لا ترمي خطأً أبداً. */
async function deliver(payload: SubmissionPayload, opts: SendOptions): Promise<boolean> {
  try {
    const body = JSON.stringify(payload)
    const sleep = opts.sleep ?? wait
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      if (attempt > 0) await sleep(RETRY_DELAYS_MS[attempt - 1])
      if (await postOnce(body, opts)) return true
    }
  } catch {
    /* يُعدّ فشلاً */
  }
  return false
}

/* ---------- التخزين المحلي (كل استدعاء داخل try/catch) ---------- */

function storageOf(opts: SendOptions): StorageLike | null {
  if (opts.storage !== undefined) return opts.storage
  try {
    return typeof window !== 'undefined' && window.localStorage ? window.localStorage : null
  } catch {
    return null
  }
}

function savePending(payload: SubmissionPayload, opts: SendOptions): void {
  try {
    storageOf(opts)?.setItem(pendingKey(payload.attemptId), JSON.stringify(payload))
  } catch {
    /* التخزين غير متاح أو ممتلئ */
  }
}

function dropPending(key: string, opts: SendOptions): void {
  try {
    storageOf(opts)?.removeItem(key)
  } catch {
    /* التخزين غير متاح */
  }
}

function readPending(storage: StorageLike, key: string): SubmissionPayload | null {
  try {
    const raw = storage.getItem(key)
    const data: unknown = raw ? JSON.parse(raw) : null
    return typeof data === 'object' && data !== null && !Array.isArray(data)
      ? (data as SubmissionPayload)
      : null
  } catch {
    return null
  }
}

/** إن أُغلقت الصفحة أو أُخفيت والإرسال جارٍ تُحفظ الحمولة فوراً بالمفتاح نفسه. */
function onPageExit(save: () => void): () => void {
  try {
    if (typeof window === 'undefined' || typeof document === 'undefined') return () => {}
    const onHide = () => save()
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') save()
    }
    window.addEventListener('pagehide', onHide)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      try {
        window.removeEventListener('pagehide', onHide)
        document.removeEventListener('visibilitychange', onVisibility)
      } catch {
        /* لا شيء */
      }
    }
  } catch {
    return () => {}
  }
}

/**
 * يرسل النتيجة في الخلفية ويعيد true فقط إذا أكّد الخادم الاستلام.
 * إن فشلت المحاولات كلها تُحفظ الحمولة تحت pending:<EXAM_ID>:<attemptId>. لا ترمي خطأً أبداً.
 */
export async function sendWithRetry(
  payload: SubmissionPayload,
  opts: SendOptions = {},
): Promise<boolean> {
  const stopWatching = onPageExit(() => savePending(payload, opts))
  const ok = await deliver(payload, opts)
  stopWatching()
  if (ok) dropPending(pendingKey(payload.attemptId), opts)
  else savePending(payload, opts)
  return ok
}

let flushing: Promise<number> | null = null

/** عند تحميل التطبيق: يعيد بصمت إرسال الحمولات المعلّقة لهذا الاختبار ويحذف ما نجح منها. */
export function retryPending(opts: SendOptions = {}): Promise<number> {
  if (!flushing) {
    flushing = flushPending(opts).finally(() => {
      flushing = null
    })
  }
  return flushing
}

async function flushPending(opts: SendOptions): Promise<number> {
  let sent = 0
  try {
    const storage = storageOf(opts)
    if (!storage) return 0
    const keys: string[] = []
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i)
      if (key && key.startsWith(PENDING_PREFIX)) keys.push(key)
    }
    for (const key of keys) {
      const stored = readPending(storage, key)
      if (!stored) continue
      // الرمز خاص بنسخة التطبيق الحالية لا بالمحاولة، فيُؤخذ من الإعدادات الحالية
      if (await deliver({ ...stored, token: SHEETS_TOKEN }, opts)) {
        dropPending(key, opts)
        sent++
      }
    }
  } catch {
    /* صامت: يُعاد في التحميل القادم */
  }
  return sent
}

/** عدد المحاولات المعلّقة المحفوظة لهذا الاختبار (لعرضها في الواجهة عند الفشل). */
export function pendingCount(storage?: StorageLike | null): number {
  try {
    const st = storage !== undefined ? storage : storageOf({})
    if (!st) return 0
    let n = 0
    for (let i = 0; i < st.length; i++) {
      const key = st.key(i)
      if (key && key.startsWith(PENDING_PREFIX)) n++
    }
    return n
  } catch {
    return 0
  }
}
