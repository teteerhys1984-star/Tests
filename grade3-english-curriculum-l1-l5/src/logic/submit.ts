/* ------------------------------------------------------------------ */
/*  Result delivery to the teacher's Google Sheet                       */
/* ------------------------------------------------------------------ */
/**
 * Contract and delivery logic matched to the platform's reference exam
 * `grade5-math-unit1` (`src/exam/submit.ts` + `src/exam/report.ts`).
 *
 *  · buildPayload  — exact field names/types from the reference contract.
 *  · sendWithRetry — POST text/plain;charset=utf-8, 3 attempts (2s then 5s), 30s timeout.
 *  · retryPending  — silently flushes pending:<EXAM_ID>:<attemptId> on app load.
 */
import { EXAM_ID, EXAM_TITLE, SHEETS_TOKEN, SHEETS_URL } from "../config";
import { LESSON_TITLES, QUESTIONS, TOTAL_MARKS } from "../data/examData";
import type { ExamResult, ExamSession, PartStatus } from "../types";

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
  attemptId: string;
  session: ExamSession;
  result: ExamResult;
  reportText: string;
}

/** Status strings matching the reference contract (plus teacher-review status for Q29). */
export const STATUS_AR: Record<PartStatus | "partial", string> = {
  correct: "إجابة صحيحة",
  partial: "إجابة صحيحة جزئياً",
  incorrect: "إجابة خاطئة",
  unanswered: "لم يُجب",
  review: "مراجعة المعلّم",
};

/** Verbatim copy of `gradeLabel` from `grade5-math-unit1/src/exam/report.ts`. */
export function gradeLabel(p: number): string {
  if (p >= 95) return "ممتاز";
  if (p >= 85) return "جيد جداً";
  if (p >= 75) return "جيد";
  if (p >= 65) return "مقبول";
  if (p >= 50) return "ضعيف";
  return "يحتاج إلى دعم";
}

/** Unique attempt id; reused across retries and manual resends so Apps Script de-duplicates. */
export function newAttemptId(): string {
  try {
    const c = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
    if (c && typeof c.randomUUID === "function") return c.randomUUID();
  } catch {
    /* fallback below for older environments */
  }
  const rand = () => Math.random().toString(36).slice(2, 10);
  return `${Date.now()}-${rand()}${rand()}`;
}

/** Marks per lesson (Lessons 1–5), consistent with `QUESTIONS` and `ExamResult`. */
export function lessonTotals(result: ExamResult): PayloadLesson[] {
  return [1, 2, 3, 4, 5].map((lesson) => {
    let awarded = 0;
    let max = 0;
    for (const q of QUESTIONS) {
      if (q.lesson !== lesson) continue;
      const qr = result.questionResults.find((r) => r.questionId === q.id);
      if (qr) {
        awarded += qr.earned;
        max += qr.maxMarks;
      }
    }
    return {
      title: LESSON_TITLES[lesson],
      awarded: Math.round(awarded * 100) / 100,
      max,
    };
  });
}

/**
 * Builds the delivery payload using the exact graded result and TXT report
 * produced for the student.
 */
export function buildPayload({ attemptId, session, result, reportText }: PayloadInput): SubmissionPayload {
  const allParts = result.questionResults.flatMap((qr) => qr.parts);
  const submitTime = session.submittedAt ?? Date.now();

  const details: PayloadDetail[] = [];
  for (const q of QUESTIONS) {
    const qr = result.questionResults.find((r) => r.questionId === q.id);
    if (!qr) continue;
    for (const part of q.parts) {
      const pr = qr.parts.find((x) => x.partId === part.id);
      if (!pr) continue;
      details.push({
        q: q.id,
        qTitle: `[${q.category}] ${q.instruction}`,
        lessons: LESSON_TITLES[q.lesson],
        label: part.id,
        status: STATUS_AR[pr.status],
        awarded: pr.earned,
        marks: pr.maxMarks,
        studentAnswer: pr.studentDisplay,
        correctAnswer: pr.correctDisplay,
      });
    }
  }

  return {
    token: SHEETS_TOKEN,
    attemptId,
    examId: EXAM_ID,
    examTitle: EXAM_TITLE,
    studentName: session.studentName,
    startAt: new Date(session.startedAt).toISOString(),
    submitAt: new Date(submitTime).toISOString(),
    elapsedSec: Math.max(0, Math.floor((session.finalElapsedMs ?? 0) / 1000)),
    summary: {
      total: result.earned,
      max: TOTAL_MARKS,
      percentage: result.percentage,
      gradeLabel: gradeLabel(result.percentage),
      fullQuestions: result.fullyCorrect,
      partialQuestions: result.partial,
      wrongQuestions: result.incorrect,
      correctSubparts: allParts.filter((p) => p.status === "correct").length,
      partialSubparts: 0,
      wrongSubparts: allParts.filter((p) => p.status === "incorrect").length,
      unansweredSubparts: allParts.filter((p) => p.status === "unanswered").length,
    },
    lessons: lessonTotals(result),
    details,
    reportText,
  };
}

/* ------------------------------------------------------------------ */
/* Delivery                                                           */
/* ------------------------------------------------------------------ */

export type SendStatus = "idle" | "sending" | "success" | "failed";

/** Delays before the 2nd and 3rd attempts (3 attempts total). */
export const RETRY_DELAYS_MS: readonly number[] = [2000, 5000];
export const MAX_ATTEMPTS = RETRY_DELAYS_MS.length + 1;
/** Per-attempt timeout (30 seconds). */
export const ATTEMPT_TIMEOUT_MS = 30000;
/** LocalStorage prefix for unsent payloads of THIS exam only. */
export const PENDING_PREFIX = `pending:${EXAM_ID}:`;

export function pendingKey(attemptId: string): string {
  return PENDING_PREFIX + attemptId;
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
  /** null = storage unavailable. */
  storage?: StorageLike | null;
  sleep?: (ms: number) => Promise<void>;
  timeoutMs?: number;
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
    /* counts as failure */
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

export function isPending(attemptId: string): boolean {
  try {
    const storage = typeof window !== "undefined" && window.localStorage ? window.localStorage : null;
    return storage ? storage.getItem(pendingKey(attemptId)) !== null : false;
  } catch {
    return false;
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
        /* noop */
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
  if (ok) dropPending(pendingKey(payload.attemptId), opts);
  else savePending(payload, opts);
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
      if (await deliver({ ...stored, token: SHEETS_TOKEN }, opts)) {
        dropPending(key, opts);
        sent++;
      }
    }
  } catch {
    /* retry on next load */
  }
  return sent;
}
