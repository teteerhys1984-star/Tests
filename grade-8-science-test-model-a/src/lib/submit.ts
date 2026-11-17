/**
 * Google Sheets result delivery — adheres strictly to the `grade5-math-unit1` contract:
 *  - buildPayload  — deterministic payload matching the on-screen results and TXT report.
 *  - sendWithRetry — POST `text/plain;charset=utf-8`, up to 3 attempts, 2s then 5s delays,
 *                    30s timeout per attempt, identical `attemptId` on retries/resends,
 *                    persists pending payloads under `pending:<EXAM_ID>:<attemptId>`.
 *  - retryPending  — automatically retries pending payloads for this exam on load without
 *                    touching any other exam's keys; deduplicates concurrent flushes.
 *  - Never logs student data to the console and never throws into the UI.
 */
import { EXAM_ID, EXAM_TITLE, SHEETS_TOKEN, SHEETS_URL } from "@/config";
import { TOTAL_MARKS } from "@/data/exam";
import { STATUS_AR, gradeLabel, type ExamReport } from "@/lib/report";

/* ------------------------------------------------------------------ */
/* Payload contract (field names match `grade5-math-unit1` verbatim)   */
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
  startedAt: number;
  submittedAt: number;
  report: ExamReport;
  reportText: string;
}

/** Generates a unique attempt identifier reused across every retry/resend of the same attempt. */
export function newAttemptId(): string {
  try {
    const c = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
    if (c && typeof c.randomUUID === "function") return c.randomUUID();
  } catch {
    /* fallback below */
  }
  const rand = () => Math.random().toString(36).slice(2, 10);
  return `${Date.now()}-${rand()}${rand()}`;
}

export function buildPayload({
  attemptId,
  startedAt,
  submittedAt,
  report,
  reportText,
}: PayloadInput): SubmissionPayload {
  const details: PayloadDetail[] = report.questions.flatMap((q) =>
    q.parts.map((p) => ({
      q: q.n,
      qTitle: q.topic,
      lessons: q.lesson,
      label: q.parts.length > 1 ? `المطلب ${p.index}: ${p.promptText}` : p.promptText,
      status: STATUS_AR[p.status],
      awarded: p.earned,
      marks: p.max,
      studentAnswer: p.student,
      correctAnswer: p.correct,
    })),
  );

  return {
    token: SHEETS_TOKEN,
    attemptId,
    examId: EXAM_ID,
    examTitle: EXAM_TITLE,
    studentName: report.name,
    startAt: new Date(startedAt).toISOString(),
    submitAt: new Date(submittedAt).toISOString(),
    elapsedSec: Math.max(0, Math.floor((submittedAt - startedAt) / 1000)),
    summary: {
      total: report.total,
      max: TOTAL_MARKS,
      percentage: report.percentage,
      gradeLabel: gradeLabel(report.percentage),
      fullQuestions: report.fullQuestions,
      partialQuestions: report.partialQuestions,
      wrongQuestions: report.wrongQuestions,
      correctSubparts: report.stats.correctSubparts,
      partialSubparts: report.stats.partialSubparts,
      wrongSubparts: report.stats.wrongSubparts,
      unansweredSubparts: report.stats.unansweredSubparts,
    },
    lessons: report.lessons.map((l) => ({
      title: l.title,
      awarded: l.earned,
      max: l.max,
    })),
    details,
    reportText,
  };
}

/* ------------------------------------------------------------------ */
/* Delivery & retry contract                                           */
/* ------------------------------------------------------------------ */

export type SendStatus = "idle" | "sending" | "success" | "failed";

/** Delays before attempt 2 (2s) and attempt 3 (5s) — 3 attempts in total. */
export const RETRY_DELAYS_MS: readonly number[] = [2000, 5000];
export const MAX_ATTEMPTS = RETRY_DELAYS_MS.length + 1;
/** Per-attempt timeout: 30 seconds. */
export const ATTEMPT_TIMEOUT_MS = 30000;
/** Namespaced pending storage prefix: `pending:<EXAM_ID>:<attemptId>`. */
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
    /* treated as delivery failure */
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
    /* storage unavailable or quota exceeded */
  }
}

function dropPending(key: string, opts: SendOptions): void {
  try {
    storageOf(opts)?.removeItem(key);
  } catch {
    /* ignore */
  }
}

function readPending(storage: StorageLike, key: string): SubmissionPayload | null {
  try {
    const raw = storage.getItem(key);
    const data: unknown = raw ? JSON.parse(raw) : null;
    if (typeof data !== "object" || data === null || Array.isArray(data)) return null;
    const p = data as Partial<SubmissionPayload>;
    if (typeof p.attemptId !== "string" || !p.attemptId || p.examId !== EXAM_ID) return null;
    return p as SubmissionPayload;
  } catch {
    return null;
  }
}

export function loadPendingAttempt(
  attemptId: string,
  opts: SendOptions = {},
): SubmissionPayload | null {
  const storage = storageOf(opts);
  if (!storage) return null;
  return readPending(storage, pendingKey(attemptId));
}

export function hasPendingAttempt(attemptId: string, opts: SendOptions = {}): boolean {
  return loadPendingAttempt(attemptId, opts) !== null;
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

/**
 * Sends the payload (up to 3 attempts, 2s then 5s delays, 30s timeout each).
 * Saves the pending payload before sending so closing/refreshing mid-flight never
 * loses it; removes the pending entry only when the endpoint confirms receipt.
 */
export async function sendWithRetry(
  payload: SubmissionPayload,
  opts: SendOptions = {},
): Promise<boolean> {
  savePending(payload, opts);
  const stopWatching = onPageExit(() => savePending(payload, opts));
  const ok = await deliver(payload, opts);
  stopWatching();
  if (ok) dropPending(pendingKey(payload.attemptId), opts);
  else savePending(payload, opts);
  return ok;
}

let flushing: Promise<number> | null = null;

/**
 * Retries all pending payloads belonging strictly to this exam (`pending:<EXAM_ID>:*`).
 * Deduplicates overlapping invocations so the same pending item is never flushed twice at once.
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
      if (!stored) continue;
      if (await deliver({ ...stored, token: SHEETS_TOKEN }, opts)) {
        dropPending(key, opts);
        sent++;
      }
    }
  } catch {
    /* silent — retried next time the exam opens */
  }
  return sent;
}
