/**
 * إرسال نتيجة الطالب إلى المعلّم (تطبيق ويب Google Apps Script يكتب في Google Sheets).
 *
 *  · buildPayload  — يبني الحمولة بدوالّ التصحيح والتقرير القائمة نفسها (لا منطق تصحيح جديد هنا).
 *  · sendWithRetry — يرسلها في الخلفية: حتى 3 محاولات بفاصلين 2 ثم 5 ثوانٍ، فإن فشلت كلها حُفظت في localStorage.
 *  · retryPending  — عند تحميل التطبيق يعيد بصمت إرسال ما بقي معلّقاً لهذا الاختبار ويحذفه بعد النجاح.
 *
 * لا يكتب هذا الملف أي شيء في console: بيانات الطلاب لا تُسجَّل.
 */
import { EXAM_ID, SHEETS_TOKEN, SHEETS_URL } from '../config'
import { plainMath } from '../lib/mathx'
import { describeAnswer, type Answers } from './grading'
import { gradeAll, gradeLabel, lessonTotals, STATUS_AR, summarize, type AttemptMeta } from './report'
import { EXAM_TITLE, LESSON_BY_ID, TOTAL_MARKS, type Question } from './types'

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
  meta: AttemptMeta
  /** الأسئلة بالترتيب الذي عُرض على الطالب. */
  order: Question[]
  /** إجابات الطالب المجمّدة عند التسليم. */
  answers: Answers
  /** نص التقرير الكامل كما أنتجه buildReport. */
  reportText: string
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

/**
 * يبني حمولة الإرسال. كل الأرقام والنصوص تأتي من gradeAll / summarize / describeAnswer / gradeLabel
 * (وهي دوالّ حتمية)، فتطابق ما يظهر في صفحة النتيجة وفي ملف التقرير تماماً.
 */
export function buildPayload({ attemptId, meta, order, answers, reportText }: PayloadInput): SubmissionPayload {
  const results = gradeAll(order, answers)
  const sum = summarize(results)

  return {
    token: SHEETS_TOKEN,
    attemptId,
    examId: EXAM_ID,
    examTitle: EXAM_TITLE,
    studentName: meta.studentName,
    startAt: meta.startAt.toISOString(),
    submitAt: meta.submitAt.toISOString(),
    // ثوانٍ صحيحة بالتقريب نفسه المستعمل في عرض المدة (HH:MM:SS)
    elapsedSec: Math.max(0, Math.floor(meta.elapsedMs / 1000)),
    summary: {
      total: sum.total,
      max: TOTAL_MARKS,
      percentage: sum.percentage,
      gradeLabel: gradeLabel(sum.percentage),
      fullQuestions: sum.full,
      partialQuestions: sum.partial,
      wrongQuestions: sum.wrong,
      correctSubparts: sum.correctSubparts,
      partialSubparts: sum.partialSubparts,
      wrongSubparts: sum.wrongSubparts,
      unansweredSubparts: sum.unansweredSubparts,
    },
    // أرقام «توزيع العلامات على الدروس» نفسها الواردة في التقرير
    lessons: lessonTotals(results),
    // مدخل واحد لكل فرع، بالنص الصرف نفسه الذي يكتبه التقرير
    details: results.flatMap((r) =>
      r.subparts.map((s) => ({
        q: r.displayNumber,
        qTitle: plainMath(r.q.title),
        lessons: r.q.lessons.map((id) => LESSON_BY_ID[id].title).join(' + '),
        label: s.sp.label,
        status: STATUS_AR[s.res.status],
        awarded: s.res.awarded,
        marks: s.sp.marks,
        studentAnswer: plainMath(describeAnswer(s.sp, answers[s.sp.id])),
        correctAnswer: plainMath(s.sp.answerText),
      })),
    ),
    reportText,
  }
}

/* ------------------------------------------------------------------ */
/* الإرسال                                                             */
/* ------------------------------------------------------------------ */

/** حالة إرسال النتيجة كما تُعرض في صفحة النتيجة. */
export type SendStatus = 'idle' | 'sending' | 'success' | 'failed'

/** الانتظار قبل المحاولة الثانية ثم الثالثة (3 محاولات في المجموع). */
export const RETRY_DELAYS_MS: readonly number[] = [2000, 5000]
export const MAX_ATTEMPTS = RETRY_DELAYS_MS.length + 1
/** مهلة المحاولة الواحدة: اتصال معلّق بلا ردّ يُعدّ فشلاً فتبدأ المحاولة التالية. */
export const ATTEMPT_TIMEOUT_MS = 30000
/** بادئة مفاتيح الحمولات المعلّقة لهذا الاختبار: pending:<EXAM_ID>:<attemptId> */
export const PENDING_PREFIX = `pending:${EXAM_ID}:`

export function pendingKey(attemptId: string): string {
  return PENDING_PREFIX + attemptId
}

export type FetchLike = (url: string, init: RequestInit) => Promise<Pick<Response, 'text'>>

export interface StorageLike {
  readonly length: number
  key(index: number): string | null
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

/** بدائل تُحقن في الاختبارات؛ في التطبيق تُستعمل القيم الافتراضية (fetch و localStorage). */
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
 * أي خطأ شبكة، أو ردّ تعذّرت قراءته (CORS)، أو ردّ ليس JSON، أو انتهاء المهلة = فشل (false).
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

/* ---------- التخزين المحلي (كل استدعاء داخل try/catch: التطبيق يعمل طبيعياً بلا تخزين) ---------- */

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
    return typeof data === 'object' && data !== null && !Array.isArray(data) ? (data as SubmissionPayload) : null
  } catch {
    return null
  }
}

/**
 * إن أُغلقت الصفحة أو أُخفيت والإرسال ما زال جارياً تُحفظ الحمولة فوراً (بالمفتاح نفسه)،
 * كي لا تضيع نتيجة لم يصل تأكيد استلامها بعد؛ وتُحذف عند نجاح الإرسال.
 */
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
 * إن فشلت المحاولات كلها تُحفظ الحمولة تحت pending:<EXAM_ID>:<attemptId> لتُعاد لاحقاً. لا ترمي خطأً أبداً.
 */
export async function sendWithRetry(payload: SubmissionPayload, opts: SendOptions = {}): Promise<boolean> {
  const stopWatching = onPageExit(() => savePending(payload, opts))
  const ok = await deliver(payload, opts)
  stopWatching()
  if (ok) dropPending(pendingKey(payload.attemptId), opts)
  else savePending(payload, opts)
  return ok
}

let flushing: Promise<number> | null = null

/**
 * عند تحميل التطبيق: يعيد بصمت إرسال الحمولات المعلّقة لهذا الاختبار ويحذف ما نجح منها.
 * يعيد عدد ما أُرسل. استدعاؤها أثناء جولة جارية يعيد الجولة نفسها (لا إرسال مزدوج).
 */
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
