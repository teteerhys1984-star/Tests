/**
 * إرسال نتيجة الطالب إلى المعلّم (تطبيق ويب Google Apps Script يكتب في Google Sheets).
 *
 * هذا الملف يطبّق آلية الإرسال نفسها المستعملة في الاختبار المرجعي grade5-math-unit1
 * دون تغيير عقد البيانات: أسماء الحقول وبنية الحمولة والتوكن ونوع المحتوى والرموز
 * ومهلة المحاولة وسياسة إعادة المحاولة والتخزين المحلي كلها كما هي.
 *
 *  · buildPayload  — يبني الحمولة من دوال التصحيح والتقرير نفسها (لا منطق تصحيح جديد هنا).
 *  · sendWithRetry — يرسلها في الخلفية: 3 محاولات بفاصلين 2 ثم 5 ثوانٍ، ومهلة 30 ثانية
 *                    لكل محاولة، فإن فشلت كلها حُفظت في localStorage.
 *  · retryPending  — عند تحميل التطبيق يعيد بصمت إرسال ما بقي معلّقاً لهذا الاختبار.
 *
 * لا يكتب هذا الملف أي شيء في console: بيانات الطلاب لا تُسجَّل.
 */
import { EXAM_ID, SHEETS_TOKEN, SHEETS_URL } from '../config'
import type { ExamResult, SubResult } from './exam'
import { gradeLabel, plainText } from './report'

/* ------------------------------------------------------------------ */
/* الحمولة — أسماء الحقول يتوقّعها الخادم كما هي                       */
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

export interface AttemptMeta {
  studentName: string
  startedAt: number
  submittedAt: number
  elapsedMs: number
}

export interface PayloadInput {
  /** معرّف المحاولة نفسه المستعمل في التخزين المحلي؛ لا يتغيّر عند إعادة الإرسال. */
  attemptId: string
  meta: AttemptMeta
  /** نتيجة التصحيح الكاملة للاختبار. */
  result: ExamResult
  /** نص التقرير الكامل كما أنتجه buildReport. */
  reportText: string
}

export const EXAM_TITLE = 'اختبار الجبر — الصف الثامن — الوحدتان الأولى والثانية'

/** تسميات حالات الفروع نفسها المستعملة في الاختبار المرجعي. */
export const STATUS_AR: Record<string, string> = {
  correct: 'إجابة صحيحة',
  partial: 'إجابة صحيحة جزئياً',
  incorrect: 'إجابة خاطئة',
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

function questionLessons(subs: SubResult[]): string[] {
  const out: string[] = []
  for (const sub of subs) {
    const lesson = sub.sub.source?.lesson
    if (lesson && !out.includes(lesson)) out.push(lesson)
  }
  return out
}

/** مجموع علامات كل درس (الفرع ينتمي إلى درس واحد، فيساوي المجموع 100). */
function lessonTotals(result: ExamResult): PayloadLesson[] {
  const rows: PayloadLesson[] = []
  const index = new Map<string, PayloadLesson>()
  for (const qr of result.questions) {
    for (const sr of qr.subs) {
      const title = sr.sub.source?.lesson || 'غير مصنّف'
      let row = index.get(title)
      if (!row) {
        row = { title, awarded: 0, max: 0 }
        index.set(title, row)
        rows.push(row)
      }
      row.awarded += sr.earned
      row.max += sr.marks
    }
  }
  return rows.map((row) => ({ ...row, awarded: Math.round(row.awarded * 100) / 100 }))
}

/**
 * يبني حمولة الإرسال. كل الأرقام والنصوص تأتي من gradeExam / reportText / correctAnswerText
 * (وهي دوالّ حتمية)، فتطابق ما يظهر في صفحة النتيجة وفي ملف التقرير تماماً.
 */
export function buildPayload({ attemptId, meta, result, reportText }: PayloadInput): SubmissionPayload {
  let fullQuestions = 0
  let partialQuestions = 0
  let wrongQuestions = 0
  let correctSubparts = 0
  let partialSubparts = 0
  let wrongSubparts = 0
  let unansweredSubparts = 0

  for (const qr of result.questions) {
    if (qr.earned >= qr.marks) fullQuestions++
    else if (qr.earned > 0) partialQuestions++
    else wrongQuestions++
    for (const sr of qr.subs) {
      if (sr.status === 'correct') correctSubparts++
      else if (sr.status === 'partial') partialSubparts++
      else if (sr.status === 'unanswered') unansweredSubparts++
      else wrongSubparts++
    }
  }

  return {
    token: SHEETS_TOKEN,
    attemptId,
    examId: EXAM_ID,
    examTitle: EXAM_TITLE,
    studentName: meta.studentName,
    startAt: new Date(meta.startedAt).toISOString(),
    submitAt: new Date(meta.submittedAt).toISOString(),
    // ثوانٍ صحيحة بالتقريب نفسه المستعمل في عرض المدة (HH:MM:SS)
    elapsedSec: Math.max(0, Math.floor(meta.elapsedMs / 1000)),
    summary: {
      total: result.earned,
      max: result.max,
      percentage: result.percentage,
      gradeLabel: gradeLabel(result.percentage),
      fullQuestions,
      partialQuestions,
      wrongQuestions,
      correctSubparts,
      partialSubparts,
      wrongSubparts,
      unansweredSubparts,
    },
    // أرقام «توزيع العلامات على الدروس» نفسها الواردة في التقرير
    lessons: lessonTotals(result),
    // مدخل واحد لكل فرع، بالنص الصرف نفسه الذي يكتبه التقرير
    details: result.questions.flatMap((qr) =>
      qr.subs.map((sr) => ({
        q: qr.question.number,
        qTitle: plainText(qr.question.title),
        lessons: questionLessons(qr.subs).join(' + '),
        label: sr.sub.label,
        status: STATUS_AR[sr.status],
        awarded: sr.earned,
        marks: sr.marks,
        studentAnswer: sr.answered ? plainText(sr.studentText) : '—',
        correctAnswer: plainText(sr.correctText),
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

/** هل توجد نتيجة معلّقة لهذه المحاولة؟ تُستعمل لعرض حالة الإرسال بعد إعادة فتح الصفحة. */
export function hasPending(attemptId: string, opts: SendOptions = {}): boolean {
  try {
    const storage = storageOf(opts)
    return storage ? storage.getItem(pendingKey(attemptId)) !== null : false
  } catch {
    return false
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
