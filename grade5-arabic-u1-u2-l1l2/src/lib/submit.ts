/**
 * إرسال نتيجة الطالب إلى المعلّم (تطبيق ويب Google Apps Script يكتب في Google Sheets).
 *
 * هذا الملف يطبّق عقد الإرسال المعتمد في الاختبار المرجعي grade5-math-unit1 دون تغيير:
 * أسماء الحقول وبنية الحمولة والتوكن ونوع المحتوى ومهلة المحاولة وسياسة إعادة المحاولة
 * وحفظ النتائج المعلّقة ومنع الإرسال المكرر كلها مطابقة للعقد المعتمد.
 *
 *  · buildPayload  — يبني الحمولة من نتائج التصحيح والتقرير القائمة.
 *  · sendWithRetry — يرسلها في الخلفية: حتى 3 محاولات بفاصلين 2 ثم 5 ثوانٍ ومهلة 30 ثانية
 *                    لكل محاولة، فإن فشلت كلها حُفظت في localStorage.
 *  · retryPending  — عند تحميل التطبيق يعيد بصمت إرسال ما بقي معلّقاً لهذا الاختبار.
 *
 * لا يكتب هذا الملف أي شيء في console: بيانات الطلاب لا تُسجَّل.
 */
import { EXAM_ID, EXAM_TITLE, SHEETS_TOKEN, SHEETS_URL } from "../config";
import { totalPoints } from "../data/questions";
import { computeGrades, type AnswersMap, type QuestionGrades } from "./grading";

/* ------------------------------------------------------------------ */
/* الحمولة — أسماء الحقول يتوقّعها الخادم كما هي                        */
/* ------------------------------------------------------------------ */

export interface PayloadSummary {
  total: number;
  max: number;
  percentage: number;
  gradeLabel: string;
  fullQuestions: number;
  partialQuestions: number;
  wrongQuestions: number;
  correctSubparts: number;
  partialSubparts: number;
  wrongSubparts: number;
  unansweredSubparts: number;
}

export interface PayloadLesson {
  title: string;
  awarded: number;
  max: number;
}

export interface PayloadDetail {
  q: number;
  qTitle: string;
  lessons: string;
  label: string;
  status: string;
  awarded: number;
  marks: number;
  studentAnswer: string;
  correctAnswer: string;
}

export interface SubmissionPayload {
  token: string;
  attemptId: string;
  examId: string;
  examTitle: string;
  studentName: string;
  startAt: string;
  submitAt: string;
  elapsedSec: number;
  summary: PayloadSummary;
  lessons: PayloadLesson[];
  details: PayloadDetail[];
  reportText: string;
}

export interface AttemptMeta {
  studentName: string;
  startTime: number;
  submitTime: number;
}

export interface PayloadInput {
  attemptId: string;
  meta: AttemptMeta;
  answers: AnswersMap;
  grades?: QuestionGrades;
  reportText: string;
}

const BRANCH_LABELS = ["أ", "ب", "ج", "د", "هـ", "و"] as const;

export const STATUS_AR = {
  correct: "إجابة صحيحة",
  partial: "إجابة صحيحة جزئياً",
  incorrect: "إجابة خاطئة",
  unanswered: "لم يُجب",
} as const;

export function gradeLabel(percentage: number): string {
  if (percentage >= 95) return "ممتاز";
  if (percentage >= 85) return "جيد جداً";
  if (percentage >= 75) return "جيد";
  if (percentage >= 65) return "مقبول";
  if (percentage >= 50) return "ضعيف";
  return "يحتاج إلى دعم";
}

/** معرّف فريد للمحاولة؛ يتجاهل الخادم تكراره، فإعادة إرسال المحاولة نفسها آمنة. */
export function newAttemptId(): string {
  try {
    const c = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
    if (c && typeof c.randomUUID === "function") return c.randomUUID();
  } catch {
    /* متصفح قديم أو سياق غير آمن — نستعمل البديل أدناه */
  }
  const rand = () => Math.random().toString(36).slice(2, 10);
  return `${Date.now()}-${rand()}${rand()}`;
}

function lessonTotals(grades: QuestionGrades): PayloadLesson[] {
  const rows: PayloadLesson[] = [];
  const index = new Map<string, PayloadLesson>();
  for (const pq of grades.perQuestion) {
    const title = pq.question.lesson;
    let row = index.get(title);
    if (!row) {
      row = { title, awarded: 0, max: 0 };
      index.set(title, row);
      rows.push(row);
    }
    row.awarded += pq.totalEarned;
    row.max += pq.totalMax;
  }
  return rows.map((row) => ({
    ...row,
    awarded: Math.round(row.awarded * 100) / 100,
  }));
}

function branchStatusText(pb: QuestionGrades["perQuestion"][number]["perBranch"][number]): string {
  if (pb.grade.correct) return STATUS_AR.correct;
  if (pb.grade.partial) return STATUS_AR.partial;
  if (pb.grade.studentAnswerDisplay === "(لم تُجب)") return STATUS_AR.unanswered;
  return STATUS_AR.incorrect;
}

/**
 * يبني حمولة الإرسال من نتائج التصحيح القائمة نفسها دون أي منطق تصحيح جديد.
 */
export function buildPayload({
  attemptId,
  meta,
  answers,
  grades: precomputed,
  reportText,
}: PayloadInput): SubmissionPayload {
  const grades = precomputed ?? computeGrades(answers);
  const maxPoints = totalPoints();
  const percentage = Math.round((grades.finalScore / maxPoints) * 100);

  let fullQuestions = 0;
  let partialQuestions = 0;
  let wrongQuestions = 0;

  for (const pq of grades.perQuestion) {
    if (Math.abs(pq.totalEarned - pq.totalMax) < 1e-9) fullQuestions++;
    else if (pq.totalEarned > 0) partialQuestions++;
    else wrongQuestions++;
  }

  return {
    token: SHEETS_TOKEN,
    attemptId,
    examId: EXAM_ID,
    examTitle: EXAM_TITLE,
    studentName: meta.studentName,
    startAt: new Date(meta.startTime).toISOString(),
    submitAt: new Date(meta.submitTime).toISOString(),
    elapsedSec: Math.max(0, Math.floor((meta.submitTime - meta.startTime) / 1000)),
    summary: {
      total: grades.finalScore,
      max: maxPoints,
      percentage,
      gradeLabel: gradeLabel(percentage),
      fullQuestions,
      partialQuestions,
      wrongQuestions,
      correctSubparts: grades.correctBranches,
      partialSubparts: grades.partialBranches,
      wrongSubparts: grades.wrongBranches,
      unansweredSubparts: grades.unanswered,
    },
    lessons: lessonTotals(grades),
    details: grades.perQuestion.flatMap((pq) =>
      pq.perBranch.map((pb, idx) => ({
        q: pq.question.order,
        qTitle: pq.question.title,
        lessons: pq.question.lesson,
        label: BRANCH_LABELS[idx] ?? String(idx + 1),
        status: branchStatusText(pb),
        awarded: pb.grade.earnedPoints,
        marks: pb.grade.maxPoints,
        studentAnswer: pb.grade.studentAnswerDisplay,
        correctAnswer: pb.grade.correctAnswerDisplay,
      })),
    ),
    reportText,
  };
}

/* ------------------------------------------------------------------ */
/* الإرسال                                                             */
/* ------------------------------------------------------------------ */

export type SendStatus = "idle" | "sending" | "success" | "failed";

/** الانتظار قبل المحاولة الثانية ثم الثالثة (3 محاولات في المجموع). */
export const RETRY_DELAYS_MS: readonly number[] = [2000, 5000];
export const MAX_ATTEMPTS = RETRY_DELAYS_MS.length + 1;
/** مهلة المحاولة الواحدة: اتصال معلّق بلا ردّ يُعدّ فشلاً فتبدأ المحاولة التالية. */
export const ATTEMPT_TIMEOUT_MS = 30000;
/** بادئة مفاتيح الحمولات المعلّقة لهذا الاختبار: pending:<EXAM_ID>:<attemptId> */
export const PENDING_PREFIX = `pending:${EXAM_ID}:`;

export function pendingKey(attemptId: string): string {
  return PENDING_PREFIX + attemptId;
}

export type FetchLike = (
  url: string,
  init: RequestInit,
) => Promise<Pick<Response, "text">>;

export interface StorageLike {
  readonly length: number;
  key(index: number): string | null;
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface SendOptions {
  fetchImpl?: FetchLike;
  storage?: StorageLike | null;
  sleep?: (ms: number) => Promise<void>;
  timeoutMs?: number;
}

const wait = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

function isAccepted(data: unknown): boolean {
  if (typeof data !== "object" || data === null) return false;
  const reply = data as { ok?: unknown; duplicate?: unknown };
  return reply.ok === true || reply.duplicate === true;
}

async function postOnce(body: string, opts: SendOptions): Promise<boolean> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const doFetch: FetchLike =
      opts.fetchImpl ?? ((url, init) => fetch(url, init));
    const ctrl =
      typeof AbortController === "function" ? new AbortController() : null;
    const reply = doFetch(SHEETS_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body,
      redirect: "follow",
      ...(ctrl ? { signal: ctrl.signal } : {}),
    }).then((res) => res.text());
    reply.catch(() => {});
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        ctrl?.abort();
        reject(new Error("timeout"));
      }, opts.timeoutMs ?? ATTEMPT_TIMEOUT_MS);
    });
    return isAccepted(JSON.parse(await Promise.race([reply, timeout])));
  } catch {
    return false;
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}

async function deliver(
  payload: SubmissionPayload,
  opts: SendOptions,
): Promise<boolean> {
  try {
    const body = JSON.stringify(payload);
    const sleep = opts.sleep ?? wait;
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      if (attempt > 0) await sleep(RETRY_DELAYS_MS[attempt - 1]);
      if (await postOnce(body, opts)) return true;
    }
  } catch {
    /* يُعدّ فشلاً */
  }
  return false;
}

function storageOf(opts: SendOptions): StorageLike | null {
  if (opts.storage !== undefined) return opts.storage;
  try {
    return typeof window !== "undefined" && window.localStorage
      ? window.localStorage
      : null;
  } catch {
    return null;
  }
}

function savePending(payload: SubmissionPayload, opts: SendOptions): void {
  try {
    storageOf(opts)?.setItem(
      pendingKey(payload.attemptId),
      JSON.stringify(payload),
    );
  } catch {
    /* التخزين غير متاح أو ممتلئ */
  }
}

function dropPending(key: string, opts: SendOptions): void {
  try {
    storageOf(opts)?.removeItem(key);
  } catch {
    /* التخزين غير متاح */
  }
}

function readPending(
  storage: StorageLike,
  key: string,
): SubmissionPayload | null {
  try {
    const raw = storage.getItem(key);
    const data: unknown = raw ? JSON.parse(raw) : null;
    return typeof data === "object" &&
      data !== null &&
      !Array.isArray(data) &&
      typeof (data as SubmissionPayload).attemptId === "string"
      ? (data as SubmissionPayload)
      : null;
  } catch {
    return null;
  }
}

export function hasPending(attemptId: string, opts: SendOptions = {}): boolean {
  try {
    const storage = storageOf(opts);
    return storage ? storage.getItem(pendingKey(attemptId)) !== null : false;
  } catch {
    return false;
  }
}

function onPageExit(save: () => void): () => void {
  try {
    if (typeof window === "undefined" || typeof document === "undefined") {
      return () => {};
    }
    const onHide = () => save();
    const onVisibility = () => {
      if (document.visibilityState === "hidden") save();
    };
    window.addEventListener("pagehide", onHide);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      try {
        window.removeEventListener("pagehide", onHide);
        document.removeEventListener("visibilitychange", onVisibility);
      } catch {
        /* لا شيء */
      }
    };
  } catch {
    return () => {};
  }
}

/** حارس منع الإرسال المكرر بالذاكرة: طلب واحد جارٍ لكل attemptId أثناء الإرسال الافتراضي. */
const sendInFlight = new Map<string, Promise<boolean>>();

/**
 * يرسل النتيجة في الخلفية ويعيد true فقط إذا أكّد الخادم الاستلام.
 * إن فشلت المحاولات كلها تُحفظ الحمولة تحت pending:<EXAM_ID>:<attemptId> لتُعاد لاحقاً.
 * عند تزامن استدعاءين للمحاولة نفسها يُعاد الوعد نفسه لمنع الإرسال المكرر.
 */
export function sendWithRetry(
  payload: SubmissionPayload,
  opts: SendOptions = {},
): Promise<boolean> {
  const existing = sendInFlight.get(payload.attemptId);
  if (existing) return existing;

  const job = (async () => {
    const stopWatching = onPageExit(() => savePending(payload, opts));
    const ok = await deliver(payload, opts);
    stopWatching();
    if (ok) dropPending(pendingKey(payload.attemptId), opts);
    else savePending(payload, opts);
    return ok;
  })().finally(() => {
    if (sendInFlight.get(payload.attemptId) === job) {
      sendInFlight.delete(payload.attemptId);
    }
  });

  sendInFlight.set(payload.attemptId, job);
  return job;
}

let flushing: Promise<number> | null = null;

/**
 * عند تحميل التطبيق: يعيد بصمت إرسال الحمولات المعلّقة لهذا الاختبار ويحذف ما نجح منها.
 */
export function retryPending(opts: SendOptions = {}): Promise<number> {
  if (!flushing) {
    flushing = flushPending(opts).finally(() => {
      flushing = null;
    });
  }
  return flushing;
}

async function flushPending(opts: SendOptions): Promise<number> {
  let sent = 0;
  try {
    const storage = storageOf(opts);
    if (!storage) return 0;
    const keys: string[] = [];
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (key && key.startsWith(PENDING_PREFIX)) keys.push(key);
    }
    for (const key of keys) {
      const stored = readPending(storage, key);
      if (!stored || pendingKey(stored.attemptId) !== key) continue;
      if (await sendWithRetry({ ...stored, token: SHEETS_TOKEN }, opts)) {
        sent++;
      }
    }
  } catch {
    /* صامت: يُعاد في التحميل القادم */
  }
  return sent;
}
