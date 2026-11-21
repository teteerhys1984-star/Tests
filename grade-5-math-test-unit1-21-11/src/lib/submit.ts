/**
 * إرسال نتيجة الطالب إلى المعلّم (تطبيق ويب Google Apps Script يكتب في Google Sheets).
 *
 * العقد نفسه المعتمد في الاختبار المرجعي grade5-math-unit1، دون تغيير:
 *   · buildPayload  — أسماء الحقول وبنيته كما هي (12 حقلاً عليا، 11 في summary، 3 في lessons، 9 في details).
 *   · sendWithRetry — ثلاث محاولات بفاصلين 2 ثم 5 ثوانٍ، ومهلة 30 ثانية لكل محاولة،
 *                     والحمولة تُحفظ في localStorage عند فشل المحاولات كلها.
 *   · retryPending  — عند تحميل التطبيق يعيد بصمت إرسال ما بقي معلّقاً لهذا الاختبار ويحذفه بعد النجاح.
 *
 * المحاولات المعلّقة تُحفظ تحت pending:<EXAM_ID>:<attemptId> حيث EXAM_ID هو معرّف هذا الاختبار،
 * فلا تتداخل مع محاولات أي اختبار آخر.
 *
 * لا يكتب هذا الملف أي شيء في console: بيانات الطلاب لا تُسجَّل.
 */
import { EXAM_ID, EXAM_TITLE, SHEETS_TOKEN, SHEETS_URL } from '../config'
import { LESSONS, lessonTitle } from '../data/lessons'
import { gradeQuestion, summarizeAnswer, summarizeExpected, type QuestionGrade } from './grading'
import type { Answers, Question } from './types'

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
  elapsedMs: number
  /** الأسئلة بالترتيب الذي عُرض على الطالب. */
  order: Question[]
  /** إجابات الطالب المجمّدة عند التسليم. */
  answers: Answers
  /** نص التقرير الكامل. */
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

/** تقدير لفظي للنسبة المئوية، مطابق للمعتمد في الاختبار المرجعي. */
export function gradeLabel(percentage: number): string {
  if (percentage >= 95) return 'ممتاز'
  if (percentage >= 85) return 'جيد جداً'
  if (percentage >= 75) return 'جيد'
  if (percentage >= 65) return 'مقبول'
  if (percentage >= 50) return 'ضعيف'
  return 'يحتاج إلى دعم'
}

/** النص الصرف لإجابة الطالب كما يظهر في التقرير (بلا محارف LaTeX). */
function plainRich(rich: string): string {
  return rich
    .replace(/\$/g, '')
    .replace(/\{,\}/g, ',')
    .replace(/\^\{\\circ\}/g, '°')
    .replace(/\\circ/g, '°')
    .replace(/\\text\{([^{}]*)\}/g, '$1')
    .replace(/\\to/g, '←')
    .replace(/\\parallel/g, '∥')
    .replace(/\\angle/g, '∠')
    .replace(/\\overrightarrow\{([^{}]*)\}/g, '$1 ')
    .replace(/\\ge/g, '≥')
    .replace(/\\times/g, '×')
    .replace(/\\div/g, '÷')
    .replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/g, '($1)/($2)')
    .replace(/[{}]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/** التصحيح على كل الفروع بالترتيب المعروض. */
export function gradeAll(order: Question[], answers: Answers): QuestionGrade[] {
  return order.map((q) => gradeQuestion(q, answers))
}

/**
 * علامات كل درس. كل سؤال في هذه البنوك ينتمي إلى درس واحد فقط،
 * لذلك مجموع العلامات في التوزيع يساوي مجموع علامات الاختبار (100).
 */
export function lessonTotals(
  order: Question[],
  grades: QuestionGrade[],
): PayloadLesson[] {
  return LESSONS.map((lesson) => {
    let awarded = 0
    let max = 0
    order.forEach((q, i) => {
      if (q.lesson !== lesson.id) return
      awarded += grades[i].earned
      max += grades[i].max
    })
    return { title: lesson.title, awarded: Math.round(awarded * 100) / 100, max }
  })
}

/**
 * يبني حمولة الإرسال. كل الأرقام والنصوص تأتي من دوالّ التصحيح الحتمية نفسها،
 * فتطابق ما يظهر في صفحة النتيجة وفي ملف التقرير تماماً.
 */
export function buildPayload({
  attemptId,
  studentName,
  startedAt,
  submittedAt,
  elapsedMs,
  order,
  answers,
  reportText,
}: PayloadInput): SubmissionPayload {
  const grades = gradeAll(order, answers)
  const total = Math.round(grades.reduce((s, g) => s + g.earned, 0) * 100) / 100
  const max = Math.round(grades.reduce((s, g) => s + g.max, 0) * 100) / 100
  const percentage = max > 0 ? Math.round((total / max) * 1000) / 10 : 0

  let fullQuestions = 0
  let partialQuestions = 0
  let wrongQuestions = 0
  let correctSubparts = 0
  let partialSubparts = 0
  let wrongSubparts = 0
  let unansweredSubparts = 0

  grades.forEach((g) => {
    if (Math.abs(g.earned - g.max) < 1e-9) fullQuestions++
    else if (g.earned > 0) partialQuestions++
    else wrongQuestions++
    for (const p of g.parts) {
      if (p.earned >= p.points && p.points > 0) correctSubparts++
      else if (p.earned > 0) partialSubparts++
      else if (!p.answered) unansweredSubparts++
      else wrongSubparts++
    }
  })

  return {
    token: SHEETS_TOKEN,
    attemptId,
    examId: EXAM_ID,
    examTitle: EXAM_TITLE,
    studentName,
    startAt: new Date(startedAt).toISOString(),
    submitAt: new Date(submittedAt).toISOString(),
    // ثوانٍ صحيحة بالتقريب نفسه المستعمل في عرض المدة (HH:MM:SS)
    elapsedSec: Math.max(0, Math.floor(elapsedMs / 1000)),
    summary: {
      total,
      max,
      percentage,
      gradeLabel: gradeLabel(percentage),
      fullQuestions,
      partialQuestions,
      wrongQuestions,
      correctSubparts,
      partialSubparts,
      wrongSubparts,
      unansweredSubparts,
    },
    lessons: lessonTotals(order, grades),
    details: order.flatMap((q, i) =>
      q.parts.map((part, idx) => {
        const pg = grades[i].parts[idx]
        const status = !pg.answered
          ? 'unanswered'
          : pg.earned >= pg.points && pg.points > 0
            ? 'correct'
            : pg.earned > 0
              ? 'partial'
              : 'wrong'
        return {
          q: i + 1,
          qTitle: plainRich(q.skill),
          lessons: lessonTitle(q.lesson),
          label: part.label ?? String(idx + 1),
          status: STATUS_AR[status],
          awarded: pg.earned,
          marks: pg.points,
          studentAnswer: plainRich(summarizeAnswer(part.input, answers[part.id])),
          correctAnswer: plainRich(summarizeExpected(part.input)),
        }
      }),
    ),
    reportText,
  }
}

/** يعيد بادئة محاولات الإرسال المعلّقة لهذا الاختبار. */
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
