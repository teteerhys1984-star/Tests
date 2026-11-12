/**
 * Delivery of the student's result to the teacher (Google Apps Script web app → Google Sheets).
 * Port of the delivery used by the reference exam grade5-math-unit1 (src/exam/submit.ts): the
 * same request, the same payload field names and types, the same retry and pending-store rules.
 *
 *  · buildPayload  — builds the payload from the existing grading result and TXT report.
 *                    No grading logic lives here: every mark and text is read from the result
 *                    of gradeAll() that the results page and the report already use.
 *  · sendWithRetry — background delivery: up to 3 tries (waits of 2 s, then 5 s; 30 s limit per
 *                    try). If every try fails the payload is kept in localStorage.
 *  · retryPending  — on app load, quietly re-sends the payloads kept from earlier attempts of
 *                    THIS exam and removes each one once the server confirms it.
 *
 * The same attemptId is used for every re-send of an attempt, so the server can ignore repeats.
 * Nothing in this file writes to the console: student data is never logged.
 */
import { EXAM_ID, SHEETS_TOKEN, SHEETS_URL } from "../config";
import { EXAM_TITLE, QUESTIONS } from "../data/exam";
import { STATUS_AR, gradeAll, round2, type GradeResult } from "./grade";
import { buildReport, plain } from "./report";
import type { Attempt } from "./store";

/* ------------------------------------------------------------------ */
/* Payload — the field names are fixed by the server                   */
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

/**
 * Grade label for summary.gradeLabel — the scale of the reference exam (grade5-math-unit1).
 * It is sent to the teacher only: it is not shown to the student, it is not written to the
 * TXT report, and it has no effect on marks.
 */
export function gradeLabel(percentage: number): string {
  if (percentage >= 95) return "ممتاز";
  if (percentage >= 85) return "جيد جداً";
  if (percentage >= 75) return "جيد";
  if (percentage >= 65) return "مقبول";
  if (percentage >= 50) return "ضعيف";
  return "يحتاج إلى دعم";
}

/**
 * The lessons of this exam: the topic every question of the bank already carries (it is shown
 * on the results page and written to the TXT report as «الموضوع»), in the order of the bank.
 */
export const LESSON_TITLES: readonly string[] = Array.from(new Set(QUESTIONS.map((question) => question.topic)));

/**
 * Title of a question for the teacher's sheet. A question of this exam has no title of its own,
 * so it is named the way the TXT report names it: its topic, its internal id (the students get
 * the questions in a different order each, the id stays the same) and its text when it has one.
 */
export function questionTitle(question: { id: string; topic: string; intro?: string }): string {
  return `${question.topic} (${question.id})` + (question.intro ? ` — ${plain(question.intro)}` : "");
}

/**
 * Builds the delivery payload of a submitted attempt.
 * `result` is the marking stored with the attempt at submission (gradeAll() is deterministic,
 * so it is recomputed if it is missing). Every number and answer text is the one shown on the
 * results page and written to the TXT report; questions are listed in the order the student
 * saw them.
 */
export function buildPayload(attempt: Attempt, result: GradeResult = attempt.result ?? gradeAll(attempt.answers)): SubmissionPayload {
  // Marks per question (bank order), for the question counts and the per-lesson totals.
  const perQuestion = QUESTIONS.map((question) => {
    let awarded = 0;
    let max = 0;
    for (const item of result.items) {
      if (item.qId !== question.id) continue;
      awarded += item.awarded;
      max += item.marks;
    }
    return { topic: question.topic, awarded: round2(awarded), max };
  });

  // Question totals by the rule of the reference exam: full marks / some marks / none.
  let fullQuestions = 0;
  let partialQuestions = 0;
  let wrongQuestions = 0;
  for (const question of perQuestion) {
    if (Math.abs(question.awarded - question.max) < 1e-9) fullQuestions += 1;
    else if (question.awarded > 0) partialQuestions += 1;
    else wrongQuestions += 1;
  }

  const lessons: PayloadLesson[] = LESSON_TITLES.map((title) => {
    let awarded = 0;
    let max = 0;
    for (const question of perQuestion) {
      if (question.topic !== title) continue;
      awarded += question.awarded;
      max += question.max;
    }
    return { title, awarded: round2(awarded), max };
  });

  // One entry per part, in the order of the results page, with the texts the results page shows
  // and the TXT report prints (Western digits, as stored in the result).
  const details: PayloadDetail[] = [];
  attempt.order.forEach((questionId, position) => {
    const question = QUESTIONS.find((item) => item.id === questionId);
    if (!question) return;
    for (const sub of question.subs) {
      const graded = result.items.find((item) => item.subId === sub.id);
      if (!graded) continue;
      details.push({
        q: position + 1,
        qTitle: questionTitle(question),
        lessons: question.topic,
        label: graded.letter,
        status: STATUS_AR[graded.status],
        awarded: graded.awarded,
        marks: graded.marks,
        studentAnswer: graded.studentText,
        correctAnswer: graded.correctText,
      });
    }
  });

  const submittedAt = attempt.submittedAt ?? attempt.startedAt;
  const durationMs = attempt.durationMs ?? submittedAt - attempt.startedAt;

  return {
    token: SHEETS_TOKEN,
    // The attempt's own id (created when the attempt starts, printed in the TXT report).
    attemptId: attempt.attemptId,
    examId: EXAM_ID,
    examTitle: EXAM_TITLE,
    studentName: attempt.name,
    startAt: new Date(attempt.startedAt).toISOString(),
    submitAt: new Date(submittedAt).toISOString(),
    // Whole seconds, exactly the duration shown on the results page and in the report.
    elapsedSec: Math.max(0, Math.floor(durationMs / 1000)),
    summary: {
      total: result.total,
      max: result.max,
      percentage: result.percent,
      gradeLabel: gradeLabel(result.percent),
      fullQuestions,
      partialQuestions,
      wrongQuestions,
      correctSubparts: result.correct,
      partialSubparts: result.partial,
      wrongSubparts: result.incorrect,
      unansweredSubparts: result.unanswered,
    },
    lessons,
    details,
    // The TXT report exactly as it is downloaded (downloadText() puts the same BOM first).
    reportText: "\uFEFF" + (attempt.reportText ?? buildReport(attempt, result)),
  };
}

/* ------------------------------------------------------------------ */
/* Sending                                                             */
/* ------------------------------------------------------------------ */

/** Delivery state as shown on the results page. */
export type SendStatus = "idle" | "sending" | "success" | "failed";

/** Waits before the second and the third try (3 tries in total). */
export const RETRY_DELAYS_MS: readonly number[] = [2000, 5000];
export const MAX_ATTEMPTS = RETRY_DELAYS_MS.length + 1;
/** One try: a connection that gives no reply within this time counts as a failure. */
export const ATTEMPT_TIMEOUT_MS = 30000;
/** Stored payloads of this exam: pending:<EXAM_ID>:<attemptId> */
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

/** Substitutes injected by the tests; the app uses the defaults (fetch and localStorage). */
export interface SendOptions {
  fetchImpl?: FetchLike;
  /** null = no storage available. */
  storage?: StorageLike | null;
  sleep?: (ms: number) => Promise<void>;
  timeoutMs?: number;
}

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** Success only when the reply was read and says ok:true — or duplicate:true (already stored). */
function isAccepted(data: unknown): boolean {
  if (typeof data !== "object" || data === null) return false;
  const reply = data as { ok?: unknown; duplicate?: unknown };
  return reply.ok === true || reply.duplicate === true;
}

/**
 * One try.
 * text/plain is deliberate: application/json triggers a CORS preflight that Apps Script does not
 * answer. A network error, an unreadable reply (CORS), a non-JSON reply or the time limit all
 * count as a failure (false).
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
    reply.catch(() => {}); // If the time limit wins, no unhandled rejection is left behind.
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

/** Up to 3 tries with the same payload and the same attemptId. Never throws. */
async function runDelivery(payload: SubmissionPayload, opts: SendOptions): Promise<boolean> {
  try {
    const body = JSON.stringify(payload);
    const sleep = opts.sleep ?? wait;
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
      if (attempt > 0) await sleep(RETRY_DELAYS_MS[attempt - 1]);
      if (await postOnce(body, opts)) return true;
    }
  } catch {
    /* Counts as a failure. */
  }
  return false;
}

/**
 * An attempt that is already being sent is never sent a second time in parallel: every caller
 * for that attemptId (the results page, the resend button, the pending round on load) receives
 * the outcome of the delivery in progress.
 */
const deliveriesInProgress = new Map<string, Promise<boolean>>();

function deliver(payload: SubmissionPayload, opts: SendOptions): Promise<boolean> {
  const id = String(payload.attemptId);
  const running = deliveriesInProgress.get(id);
  if (running) return running;
  const run = runDelivery(payload, opts).then((ok) => {
    deliveriesInProgress.delete(id);
    return ok;
  });
  deliveriesInProgress.set(id, run);
  return run;
}

/* ---------- Local storage (every call is guarded: the exam works without storage) ---------- */

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
    /* Storage is unavailable or full. */
  }
}

function dropPending(key: string, opts: SendOptions): void {
  try {
    storageOf(opts)?.removeItem(key);
  } catch {
    /* Storage is unavailable. */
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

/** The payload kept for this attempt after a failed or interrupted delivery, if there is one. */
export function pendingPayload(attemptId: string, opts: SendOptions = {}): SubmissionPayload | null {
  try {
    const storage = storageOf(opts);
    return storage ? readPending(storage, pendingKey(attemptId)) : null;
  } catch {
    return null;
  }
}

/**
 * If the page is closed or hidden while a delivery is still running, the payload is stored at
 * once (under the same key) so that an unconfirmed result is not lost; it is removed when the
 * delivery succeeds.
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
        /* Nothing to do. */
      }
    };
  } catch {
    return () => {};
  }
}

/**
 * Sends the result in the background; resolves true only when the server confirmed receipt.
 * If every try failed, the payload stays under pending:<EXAM_ID>:<attemptId> to be sent again
 * later. Never throws.
 */
export async function sendWithRetry(payload: SubmissionPayload, opts: SendOptions = {}): Promise<boolean> {
  const stopWatching = onPageExit(() => savePending(payload, opts));
  const ok = await deliver(payload, opts);
  stopWatching();
  if (ok) dropPending(pendingKey(payload.attemptId), opts);
  else savePending(payload, opts);
  return ok;
}

let pendingRound: Promise<number> | null = null;

/**
 * On app load: quietly re-sends the stored payloads of this exam and removes the ones the
 * server confirms. Resolves with how many were sent. A call made while a round is running
 * returns that same round (no double sending).
 */
export function retryPending(opts: SendOptions = {}): Promise<number> {
  if (!pendingRound) {
    pendingRound = flushPending(opts).finally(() => {
      pendingRound = null;
    });
  }
  return pendingRound;
}

async function flushPending(opts: SendOptions): Promise<number> {
  let sent = 0;
  try {
    const storage = storageOf(opts);
    if (!storage) return 0;
    const keys: string[] = [];
    for (let i = 0; i < storage.length; i += 1) {
      const key = storage.key(i);
      if (key && key.startsWith(PENDING_PREFIX)) keys.push(key);
    }
    for (const key of keys) {
      const stored = readPending(storage, key);
      if (!stored) continue;
      // The token belongs to the current copy of the app, not to the attempt.
      if (await deliver({ ...stored, token: SHEETS_TOKEN }, opts)) {
        dropPending(key, opts);
        sent += 1;
      }
    }
  } catch {
    /* Quiet: tried again on the next load. */
  }
  return sent;
}
