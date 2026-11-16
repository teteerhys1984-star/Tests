/* ------------------------------------------------------------------ */
/*  Result delivery to the teacher's Google Sheet                       */
/* ------------------------------------------------------------------ */
/**
 * The contract and the delivery mechanism are copied from the platform's reference
 * exam `grade5-math-unit1` (src/exam/submit.ts + src/exam/report.ts). Nothing here
 * changes the grading engine, the questions, the marks or the student report: every
 * number in the payload is read from the very same `ExamResult` that the results
 * screen displays, and `reportText` is the very same text the TXT download writes.
 *
 *  · buildPayload  — field names/types exactly as the reference payload.
 *  · sendWithRetry — text/plain POST, 3 attempts, 2s then 5s, 30s per attempt.
 *  · retryPending  — on app load, silently re-send what is still pending.
 *
 * The same `attemptId` is reused for every attempt and for the "Resend Result"
 * button, so the server can de-duplicate the row. No student data is logged.
 */
import { EXAM_ID, EXAM_TITLE, SHEETS_TOKEN, SHEETS_URL } from "../config";
import { LESSON_TITLES, TOTAL_MARKS } from "../data/questions";
import { isAnswered } from "./grading";
import type { AnswerMap, ExamResult, PartResult } from "../types";

/* ------------------------------------------------------------------ */
/* Payload — the field names the server expects (reference contract)    */
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
  /** The frozen, graded result shown on the results screen. */
  result: ExamResult;
  /** The frozen answer map captured at submission. */
  answers: AnswerMap;
  /** The complete TXT report text (buildReport(result)). */
  reportText: string;
}

/** Status strings are the same Arabic labels the reference exam sends to the teacher. */
export const STATUS_AR: Record<string, string> = {
  correct: "إجابة صحيحة",
  partial: "إجابة صحيحة جزئياً",
  wrong: "إجابة خاطئة",
  unanswered: "لم يُجب",
};

/** Verbatim copy of `gradeLabel` from grade5-math-unit1/src/exam/report.ts. */
export function gradeLabel(p: number): string {
  if (p >= 95) return "ممتاز";
  if (p >= 85) return "جيد جداً";
  if (p >= 75) return "جيد";
  if (p >= 65) return "مقبول";
  if (p >= 50) return "ضعيف";
  return "يحتاج إلى دعم";
}

/** Unique attempt id; re-sending the same attempt keeps this id so the server de-duplicates it. */
export function newAttemptId(): string {
  try {
    const c = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
    if (c && typeof c.randomUUID === "function") return c.randomUUID();
  } catch {
    /* old browser / insecure context — use the fallback below */
  }
  const rand = () => Math.random().toString(36).slice(2, 10);
  return `${Date.now()}-${rand()}${rand()}`;
}

function partStatus(part: PartResult, answers: AnswerMap): string {
  if (!isAnswered(answers[part.partId])) return "unanswered";
  if (part.earned === part.max) return "correct";
  if (part.earned > 0) return "partial";
  return "wrong";
}

/** Marks per lesson — same idea as the reference's `lessonTotals`, using this exam's 5 lessons. */
export function lessonTotals(result: ExamResult): PayloadLesson[] {
  return [1, 2, 3, 4, 5].map((lesson) => {
    const rows = result.questions.filter((q) => q.lesson === lesson);
    return {
      title: LESSON_TITLES[lesson],
      awarded: Math.round(rows.reduce((s, q) => s + q.earned, 0) * 100) / 100,
      max: rows.reduce((s, q) => s + q.max, 0),
    };
  });
}

/**
 * Builds the delivery payload. All figures come from the graded result itself, so the
 * teacher's row always matches the student's screen and the downloaded report exactly.
 */
export function buildPayload({ attemptId, result, answers, reportText }: PayloadInput): SubmissionPayload {
  const parts = result.questions.flatMap((q) => q.parts.map((p) => ({ q, p })));
  const statusOf = (p: PartResult) => partStatus(p, answers);

  return {
    token: SHEETS_TOKEN,
    attemptId,
    examId: EXAM_ID,
    examTitle: EXAM_TITLE,
    studentName: result.studentName,
    startAt: new Date(result.startedAt).toISOString(),
    submitAt: new Date(result.submittedAt).toISOString(),
    // Same integer-seconds rounding the reference uses (HH:MM:SS display).
    elapsedSec: Math.max(0, Math.floor(result.durationMs / 1000)),
    summary: {
      total: result.totalEarned,
      max: TOTAL_MARKS,
      percentage: result.percentage,
      gradeLabel: gradeLabel(result.percentage),
      fullQuestions: result.correctQuestions,
      partialQuestions: result.partiallyCorrect,
      wrongQuestions: result.incorrectQuestions,
      correctSubparts: parts.filter(({ p }) => statusOf(p) === "correct").length,
      partialSubparts: parts.filter(({ p }) => statusOf(p) === "partial").length,
      wrongSubparts: parts.filter(({ p }) => statusOf(p) === "wrong").length,
      unansweredSubparts: parts.filter(({ p }) => statusOf(p) === "unanswered").length,
    },
    lessons: lessonTotals(result),
    // One entry per scored part, in the original question order.
    details: parts.map(({ q, p }) => ({
      q: q.n,
      qTitle: q.title,
      lessons: LESSON_TITLES[q.lesson],
      label: p.partId,
      status: STATUS_AR[statusOf(p)],
      awarded: p.earned,
      marks: p.max,
      studentAnswer: p.studentAnswer,
      correctAnswer: p.correctAnswer,
    })),
    reportText,
  };
}

/* ------------------------------------------------------------------ */
/* Delivery                                                           */
/* ------------------------------------------------------------------ */

/** Delivery status shown on the results screen. */
export type SendStatus = "idle" | "sending" | "success" | "failed";

/** Delays before the 2nd and 3rd attempts (3 attempts in total). */
export const RETRY_DELAYS_MS: readonly number[] = [2000, 5000];
export const MAX_ATTEMPTS = RETRY_DELAYS_MS.length + 1;
/** A hung request counts as a failure so the next attempt can start. */
export const ATTEMPT_TIMEOUT_MS = 30000;
/** pending:<EXAM_ID>:<attemptId> */
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

/** Injectable replacements used by the tests; the app uses fetch + localStorage. */
export interface SendOptions {
  fetchImpl?: FetchLike;
  /** null = no storage available. */
  storage?: StorageLike | null;
  sleep?: (ms: number) => Promise<void>;
  timeoutMs?: number;
}

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** Success only when the reply was read and contains ok:true — or duplicate:true. */
function isAccepted(data: unknown): boolean {
  if (typeof data !== "object" || data === null) return false;
  const reply = data as { ok?: unknown; duplicate?: unknown };
  return reply.ok === true || reply.duplicate === true;
}

/**
 * One attempt. `text/plain` is deliberate: `application/json` triggers a CORS
 * preflight that Apps Script does not answer. Network errors, unreadable replies,
 * non-JSON replies and timeouts all count as failure.
 */
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
    reply.catch(() => {}); // no unhandled rejection when the timeout wins
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

/** Up to 3 attempts with the same body and the same attemptId. Never throws. */
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

/* ---------- local storage (every call guarded: the app works without it) ---------- */

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

/** True when this attempt still has an unacknowledged payload saved locally. */
export function isPending(attemptId: string): boolean {
  try {
    const storage = typeof window !== "undefined" && window.localStorage ? window.localStorage : null;
    return storage ? storage.getItem(pendingKey(attemptId)) !== null : false;
  } catch {
    return false;
  }
}

/** If the page closes while sending, save immediately so the result is not lost. */
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
        /* nothing */
      }
    };
  } catch {
    return () => {};
  }
}

/** Sends in the background; saves the payload under pending:<EXAM_ID>:<attemptId> on failure. */
export async function sendWithRetry(payload: SubmissionPayload, opts: SendOptions = {}): Promise<boolean> {
  const stopWatching = onPageExit(() => savePending(payload, opts));
  const ok = await deliver(payload, opts);
  stopWatching();
  if (ok) dropPending(pendingKey(payload.attemptId), opts);
  else savePending(payload, opts);
  return ok;
}

let flushing: Promise<number> | null = null;

/** On app load: silently re-send pending payloads of THIS exam and delete the delivered ones. */
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
      // The token belongs to the current app build, not to the stored attempt.
      if (await deliver({ ...stored, token: SHEETS_TOKEN }, opts)) {
        dropPending(key, opts);
        sent++;
      }
    }
  } catch {
    /* silent: retry on the next load */
  }
  return sent;
}
