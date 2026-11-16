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
import { isPartAnswered } from "../exam/grading";
import { QUESTIONS, TOTAL_MARKS } from "../exam/questions";
import type { AnswerMap, ExamResult, Lesson, PartResult } from "../exam/types";

export const LESSON_TITLES: Record<Lesson, string> = {
  3: "Lesson 3 · Let's Discover",
  4: "Lesson 4 · Interesting Destinations",
};

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
  studentName: string;
  startedAt: number;
  finishedAt: number;
  answers: AnswerMap;
  result: ExamResult;
  reportText: string;
}

export type SubpartStatus = "correct" | "partial" | "incorrect" | "unanswered";

/** Status strings matching the reference contract. */
export const STATUS_AR: Record<SubpartStatus, string> = {
  correct: "إجابة صحيحة",
  partial: "إجابة صحيحة جزئياً",
  incorrect: "إجابة خاطئة",
  unanswered: "لم يُجب",
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

export function partStatus(partResult: PartResult, rawAnswer: string | undefined): SubpartStatus {
  if (!isPartAnswered(rawAnswer)) return "unanswered";
  if (partResult.earned >= partResult.possible - 1e-9) return "correct";
  if (partResult.earned > 0) return "partial";
  return "incorrect";
}

/** Marks per lesson (Lessons 3 & 4), consistent with `QUESTIONS` and `ExamResult`. */
export function lessonTotals(result: ExamResult): PayloadLesson[] {
  return ([3, 4] as const).map((lesson) => {
    const rows = result.questions.filter((q) => q.lesson === lesson);
    return {
      title: LESSON_TITLES[lesson],
      awarded: Math.round(rows.reduce((s, q) => s + q.earned, 0) * 100) / 100,
      max: rows.reduce((s, q) => s + q.possible, 0),
    };
  });
}

/**
 * Builds the delivery payload using the exact graded result and TXT report
 * produced for the student.
 */
export function buildPayload({
  attemptId,
  studentName,
  startedAt,
  finishedAt,
  answers,
  result,
  reportText,
}: PayloadInput): SubmissionPayload {
  const partEntries: {
    qN: number;
    qTitle: string;
    lesson: Lesson;
    partResult: PartResult;
    status: SubpartStatus;
  }[] = [];

  for (const q of QUESTIONS) {
    const qr = result.questions.find((r) => r.n === q.n);
    if (!qr) continue;
    const qAnswers = answers[q.n] ?? {};
    for (const part of q.parts) {
      const pr = qr.parts.find((x) => x.partId === part.id);
      if (!pr) continue;
      partEntries.push({
        qN: q.n,
        qTitle: q.title,
        lesson: q.lesson,
        partResult: pr,
        status: partStatus(pr, qAnswers[part.id]),
      });
    }
  }

  return {
    token: SHEETS_TOKEN,
    attemptId,
    examId: EXAM_ID,
    examTitle: EXAM_TITLE,
    studentName,
    startAt: new Date(startedAt).toISOString(),
    submitAt: new Date(finishedAt).toISOString(),
    elapsedSec: Math.max(0, Math.floor(Math.max(0, finishedAt - startedAt) / 1000)),
    summary: {
      total: result.score,
      max: TOTAL_MARKS,
      percentage: result.percentage,
      gradeLabel: gradeLabel(result.percentage),
      fullQuestions: result.fullyCorrect,
      partialQuestions: result.partiallyCorrect,
      wrongQuestions: result.incorrect,
      correctSubparts: partEntries.filter((e) => e.status === "correct").length,
      partialSubparts: partEntries.filter((e) => e.status === "partial").length,
      wrongSubparts: partEntries.filter((e) => e.status === "incorrect").length,
      unansweredSubparts: partEntries.filter((e) => e.status === "unanswered").length,
    },
    lessons: lessonTotals(result),
    details: partEntries.map((e) => ({
      q: e.qN,
      qTitle: e.qTitle,
      lessons: LESSON_TITLES[e.lesson],
      label: e.partResult.partId,
      status: STATUS_AR[e.status],
      awarded: e.partResult.earned,
      marks: e.partResult.possible,
      studentAnswer: e.partResult.studentAnswer,
      correctAnswer: e.partResult.correctAnswer,
    })),
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
    return typeof data === "object" && data !== null && !Array.isArray(data)
      ? (data as SubmissionPayload)
      : null;
  } catch {
    return null;
  }
}

export function isPending(attemptId: string): boolean {
  try {
    const storage =
      typeof window !== "undefined" && window.localStorage ? window.localStorage : null;
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

export async function sendWithRetry(
  payload: SubmissionPayload,
  opts: SendOptions = {}
): Promise<boolean> {
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
