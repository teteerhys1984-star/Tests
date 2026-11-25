/**
 * Result delivery to the teacher's Google Sheet (Apps Script web app).
 *
 * Contract and delivery logic matched to the platform's reference exam
 * `grade5-math-unit1` (`src/exam/submit.ts` + `src/exam/report.ts`):
 *
 *  · buildPayload  — exact field names / shapes of the reference contract.
 *  · sendWithRetry — POST `text/plain;charset=utf-8` (no CORS preflight),
 *                    3 attempts with 2 s then 5 s delays, 30 s per attempt.
 *  · retryPending  — silently flushes `pending:<EXAM_ID>:<attemptId>` on load.
 *
 * This module never writes to console: pupil data is never logged.
 */
import { EXAM_ID, EXAM_TITLE, SHEETS_TOKEN, SHEETS_URL } from "../config";
import { displayAnswer, displayCorrect, gradeExam, type ExamResult, type ItemStatus } from "./grading";
import type { Attempt } from "./storage";

/* ------------------------------------------------------------------ */
/* Payload — field names and shapes expected by Google Apps Script     */
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

export interface PayloadInput {
  attempt: Attempt;
  result?: ExamResult;
  reportText: string;
}

export const STATUS_AR: Record<ItemStatus, string> = {
  correct: "إجابة صحيحة",
  spelling: "إجابة صحيحة جزئياً",
  incorrect: "إجابة خاطئة",
  unanswered: "لم يُجب",
};

export function gradeLabel(p: number): string {
  if (p >= 95) return "ممتاز";
  if (p >= 85) return "جيد جداً";
  if (p >= 75) return "جيد";
  if (p >= 65) return "مقبول";
  if (p >= 50) return "ضعيف";
  return "يحتاج إلى دعم";
}

export function buildPayload({ attempt, result, reportText }: PayloadInput): SubmissionPayload {
  const graded = result ?? gradeExam(attempt.answers);
  const submitTime = attempt.submittedAt ?? Date.now();
  const startTime = attempt.startedAt || submitTime;
  const elapsedMs = Math.max(0, submitTime - startTime);

  const qTitleByNo = new Map(graded.questions.map((qr) => [qr.question.number, qr.question.title]));

  return {
    token: SHEETS_TOKEN,
    attemptId: attempt.attemptId,
    examId: EXAM_ID,
    examTitle: EXAM_TITLE,
    studentName: attempt.studentName,
    startAt: new Date(startTime).toISOString(),
    submitAt: new Date(submitTime).toISOString(),
    elapsedSec: Math.max(0, Math.floor(elapsedMs / 1000)),
    summary: {
      total: graded.total,
      max: graded.max,
      percentage: graded.percent,
      gradeLabel: gradeLabel(graded.percent),
      fullQuestions: graded.questions.filter((q) => q.awarded === q.max).length,
      partialQuestions: graded.questions.filter((q) => q.awarded > 0 && q.awarded < q.max).length,
      wrongQuestions: graded.questions.filter((q) => q.awarded === 0).length,
      correctSubparts: graded.items.filter((i) => i.status === "correct").length,
      partialSubparts: graded.items.filter((i) => i.status === "spelling").length,
      wrongSubparts: graded.items.filter((i) => i.status === "incorrect").length,
      unansweredSubparts: graded.items.filter((i) => i.status === "unanswered").length,
    },
    lessons: graded.questions.map((qr) => ({
      title: `Q${qr.question.number}. ${qr.question.title}`,
      awarded: qr.awarded,
      max: qr.max,
    })),
    details: graded.items.map((r) => ({
      q: r.questionNumber,
      qTitle: qTitleByNo.get(r.questionNumber) ?? `Question ${r.questionNumber}`,
      lessons: r.item.ref.lesson,
      label: r.label,
      status: STATUS_AR[r.status],
      awarded: r.awarded,
      marks: r.item.marks,
      studentAnswer: displayAnswer(r.item, r.submitted),
      correctAnswer: displayCorrect(r.item),
    })),
    reportText,
  };
}

/* ------------------------------------------------------------------ */
/* Delivery                                                            */
/* ------------------------------------------------------------------ */

export type SendStatus = "idle" | "sending" | "success" | "failed";

/** Delays before the 2nd and 3rd attempts (3 attempts total). */
export const RETRY_DELAYS_MS: readonly number[] = [2000, 5000];
export const MAX_ATTEMPTS = RETRY_DELAYS_MS.length + 1;
/** Per-attempt timeout (30 seconds). */
export const ATTEMPT_TIMEOUT_MS = 30000;
/** localStorage prefix for unsent payloads of THIS exam only. */
export const PENDING_PREFIX = `pending:${EXAM_ID}:`;
/** localStorage prefix for delivery receipts of THIS exam only. */
export const RECEIPT_PREFIX = `sent:${EXAM_ID}:`;

export function pendingKey(attemptId: string): string {
  return PENDING_PREFIX + attemptId;
}

export function receiptKey(attemptId: string): string {
  return RECEIPT_PREFIX + attemptId;
}

export type FetchLike = (url: string, init: RequestInit) => Promise<Pick<Response, "text">>;

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
  excludeAttemptId?: string;
}

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function isAccepted(data: unknown): boolean {
  if (typeof data !== "object" || data === null) return false;
  const reply = data as { ok?: unknown; duplicate?: unknown };
  return reply.ok === true || reply.duplicate === true;
}

async function postOnce(body: string, opts: SendOptions): Promise<boolean> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const doFetch: FetchLike = opts.fetchImpl ?? ((url, init) => fetch(url, init));
    const ctrl = typeof AbortController === "function" ? new AbortController() : null;
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

async function deliver(payload: SubmissionPayload, opts: SendOptions): Promise<boolean> {
  try {
    const body = JSON.stringify(payload);
    const sleep = opts.sleep ?? wait;
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      if (attempt > 0) await sleep(RETRY_DELAYS_MS[attempt - 1]);
      if (await postOnce(body, opts)) return true;
    }
  } catch {
    /* counts as a failure */
  }
  return false;
}

function storageOf(opts: SendOptions): StorageLike | null {
  if (opts.storage !== undefined) return opts.storage;
  try {
    return typeof window !== "undefined" && window.localStorage ? window.localStorage : null;
  } catch {
    return null;
  }
}

function savePending(payload: SubmissionPayload, opts: SendOptions): void {
  try {
    storageOf(opts)?.setItem(pendingKey(payload.attemptId), JSON.stringify(payload));
  } catch {
    /* storage unavailable or full */
  }
}

function dropPending(key: string, opts: SendOptions): void {
  try {
    storageOf(opts)?.removeItem(key);
  } catch {
    /* storage unavailable */
  }
}

function readPending(storage: StorageLike, key: string): SubmissionPayload | null {
  try {
    const raw = storage.getItem(key);
    const data: unknown = raw ? JSON.parse(raw) : null;
    return typeof data === "object" && data !== null && !Array.isArray(data) ? (data as SubmissionPayload) : null;
  } catch {
    return null;
  }
}

export function isPending(attemptId: string, opts: SendOptions = {}): boolean {
  try {
    const storage = storageOf(opts);
    return storage ? storage.getItem(pendingKey(attemptId)) !== null : false;
  } catch {
    return false;
  }
}

export function hasReceipt(attemptId: string, opts: SendOptions = {}): boolean {
  try {
    const storage = storageOf(opts);
    return storage ? storage.getItem(receiptKey(attemptId)) !== null : false;
  } catch {
    return false;
  }
}

export function markReceipt(attemptId: string, opts: SendOptions = {}): void {
  try {
    storageOf(opts)?.setItem(receiptKey(attemptId), new Date().toISOString());
  } catch {
    /* storage unavailable */
  }
}

function onPageExit(save: () => void): () => void {
  try {
    if (typeof window === "undefined" || typeof document === "undefined") return () => {};
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
        /* ignore */
      }
    };
  } catch {
    return () => {};
  }
}

export async function sendWithRetry(payload: SubmissionPayload, opts: SendOptions = {}): Promise<boolean> {
  const stopWatching = onPageExit(() => savePending(payload, opts));
  const ok = await deliver(payload, opts);
  stopWatching();
  if (ok) {
    dropPending(pendingKey(payload.attemptId), opts);
    markReceipt(payload.attemptId, opts);
  } else {
    savePending(payload, opts);
  }
  return ok;
}

let flushing: Promise<number> | null = null;

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
      if (!stored) continue;
      if (stored.attemptId === opts.excludeAttemptId) continue;
      if (await deliver({ ...stored, token: SHEETS_TOKEN }, opts)) {
        dropPending(key, opts);
        markReceipt(stored.attemptId, opts);
        sent++;
      }
    }
  } catch {
    /* silent: retried on the next load */
  }
  return sent;
}
