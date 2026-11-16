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
 * Everything is built from the same deterministic grading and report code that
 * produced the student's results page and TXT report, so the numbers the
 * teacher receives always match what the pupil saw.
 *
 * This module never writes to console: pupil data is never logged.
 */
import { EXAM_ID, EXAM_TITLE, SHEETS_TOKEN, SHEETS_URL } from "../config";
import { LESSONS } from "../data/lessons";
import { answerToText, correctAnswerText, gradeLabel, partPrompt } from "./format";
import type { ExamResult, ExamState, PartResult, Question } from "../types";
import { gradeExam } from "./grading";

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
  state: ExamState;
  result: ExamResult;
  questions: Question[];
  /** Full TXT report exactly as produced by buildReport. */
  reportText: string;
}

/** Status strings used by the reference contract. */
export const STATUS_AR = {
  correct: "إجابة صحيحة",
  partial: "إجابة صحيحة جزئياً",
  incorrect: "إجابة خاطئة",
  unanswered: "لم يُجب",
} as const;

export { gradeLabel };

/** Part status in the contract's four states (incorrect split from unanswered). */
function partStatus(part: PartResult): keyof typeof STATUS_AR {
  if (part.correct) return "correct";
  if (!part.answered) return "unanswered";
  return "incorrect";
}

/** Marks per lesson (Lessons 1–5), consistent with gradeExam's byLesson. */
export function lessonTotals(result: ExamResult): PayloadLesson[] {
  return LESSONS.map((lesson) => ({
    title: lesson.title,
    awarded: result.byLesson[lesson.id].earned,
    max: result.byLesson[lesson.id].max,
  }));
}

/**
 * Builds the delivery payload from the frozen attempt state plus the TXT report.
 * The result is re-derived with gradeExam so the payload can never drift from
 * the stored answers.
 */
export function buildPayload({ state, result, questions, reportText }: PayloadInput): SubmissionPayload {
  const graded = result.max > 0 ? result : gradeExam(questions, state.answers);
  const allParts = graded.questions.flatMap((r) => r.parts);
  const submitTime = state.submittedAt ?? Date.now();
  const startTime = state.startedAt ?? submitTime;

  const details: PayloadDetail[] = [];
  questions.forEach((q, index) => {
    const qr = graded.questions.find((r) => r.questionId === q.id);
    if (!qr) return;
    const answers = state.answers[q.id];
    const lessonTitle = LESSONS.find((l) => l.id === q.lesson)?.title ?? "";
    q.parts.forEach((part) => {
      const pr = qr.parts.find((x) => x.partId === part.id);
      if (!pr) return;
      details.push({
        q: index + 1,
        qTitle: `${q.format} — ${partPrompt(q, part.id)}`,
        lessons: lessonTitle,
        label: part.id,
        status: STATUS_AR[partStatus(pr)],
        awarded: pr.earned,
        marks: part.marks,
        studentAnswer: answerToText(part, answers?.[part.id]),
        correctAnswer: correctAnswerText(part),
      });
    });
  });

  const percentage = graded.max ? Math.round((graded.total / graded.max) * 1000) / 10 : 0;

  return {
    token: SHEETS_TOKEN,
    attemptId: state.attemptId,
    examId: EXAM_ID,
    examTitle: EXAM_TITLE,
    studentName: state.studentName,
    startAt: new Date(startTime).toISOString(),
    submitAt: new Date(submitTime).toISOString(),
    elapsedSec: Math.max(0, Math.floor((state.elapsedMs || submitTime - startTime) / 1000)),
    summary: {
      total: graded.total,
      max: graded.max,
      percentage,
      gradeLabel: gradeLabel(percentage),
      fullQuestions: graded.correctCount,
      partialQuestions: graded.partialCount,
      wrongQuestions: graded.incorrectCount,
      correctSubparts: allParts.filter((p) => p.correct).length,
      partialSubparts: 0,
      wrongSubparts: allParts.filter((p) => !p.correct && p.answered).length,
      unansweredSubparts: allParts.filter((p) => !p.answered).length,
    },
    lessons: lessonTotals(graded),
    details,
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

/** Injection points for the tests; the app uses the real fetch and localStorage. */
export interface SendOptions {
  fetchImpl?: FetchLike;
  /** null = storage unavailable. */
  storage?: StorageLike | null;
  sleep?: (ms: number) => Promise<void>;
  timeoutMs?: number;
}

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** Accepted only when the reply is readable and says ok:true or duplicate:true. */
function isAccepted(data: unknown): boolean {
  if (typeof data !== "object" || data === null) return false;
  const reply = data as { ok?: unknown; duplicate?: unknown };
  return reply.ok === true || reply.duplicate === true;
}

/**
 * One delivery attempt.
 * `text/plain` is deliberate: `application/json` triggers a CORS preflight that
 * Apps Script does not answer. Network errors, unreadable (CORS) replies,
 * non-JSON replies and timeouts all count as a failure.
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
    reply.catch(() => {}); // if the timeout wins, no unhandled rejection remains
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

/** Up to 3 attempts with the same payload and the same attemptId. Never throws. */
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

/* ---------- Local storage (every call in try/catch: the app works without it) ---------- */

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

/** True when this attempt still has an unsent payload waiting on this device. */
export function isPending(attemptId: string): boolean {
  try {
    const storage = storageOf({});
    return storage ? storage.getItem(pendingKey(attemptId)) !== null : false;
  } catch {
    return false;
  }
}

/**
 * If the page is closed or hidden while the send is still running, the payload is
 * saved immediately (same key) so a result whose acknowledgement never arrived is
 * not lost; it is removed once the send succeeds.
 */
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
        /* nothing to do */
      }
    };
  } catch {
    return () => {};
  }
}

/**
 * Sends the result in the background and returns true only when the server
 * confirms receipt. If every attempt fails the payload stays under
 * `pending:<EXAM_ID>:<attemptId>` to be resent later. Never throws.
 */
export async function sendWithRetry(payload: SubmissionPayload, opts: SendOptions = {}): Promise<boolean> {
  const stopWatching = onPageExit(() => savePending(payload, opts));
  const ok = await deliver(payload, opts);
  stopWatching();
  if (ok) dropPending(pendingKey(payload.attemptId), opts);
  else savePending(payload, opts);
  return ok;
}

let flushing: Promise<number> | null = null;

/**
 * On app load: silently resends this exam's pending payloads and removes the ones
 * that succeed. Returns how many were sent. Calling it during a running round
 * returns the same round (no double send).
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
      // The token belongs to the running app version, not to the stored attempt.
      if (await deliver({ ...stored, token: SHEETS_TOKEN }, opts)) {
        dropPending(key, opts);
        sent++;
      }
    }
  } catch {
    /* silent: retried on the next load */
  }
  return sent;
}
