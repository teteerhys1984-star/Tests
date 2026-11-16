/**
 * Result delivery to the teacher's Google Sheet.
 *
 * Implements the platform reference contract (`grade5-math-unit1/src/exam/submit.ts`
 * and `grade5-math-unit1/src/exam/report.ts`):
 *  - POST `text/plain;charset=utf-8` (CORS simple request, `redirect: "follow"`)
 *  - 3 attempts with 2 s then 5 s backoff and 30 s per-attempt timeout
 *  - Reuses a single `attemptId` across retries/resends for server de-duplication
 *  - Stores failed submissions in `localStorage` under `pending:<EXAM_ID>:<attemptId>`
 *    and flushes them silently via `retryPending()` when the exam opens again
 *  - Never logs pupil answers or personal data to the console
 */
import { EXAM_ID, EXAM_TITLE, SHEETS_TOKEN, SHEETS_URL } from "../config";
import { ExamEvaluation, ExamSessionState } from "../types/exam";

/* ------------------------------------------------------------------ */
/* Payload types — exact field names expected by Google Apps Script    */
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
  session: ExamSessionState;
  evaluation: ExamEvaluation;
  reportText: string;
}

export type SendState = "idle" | "sending" | "sent" | "failed";

/** Reference Arabic sub-part status strings for the teacher's Google Sheet. */
export const STATUS_AR = {
  correct: "إجابة صحيحة",
  partial: "إجابة صحيحة جزئياً",
  wrong: "إجابة خاطئة",
  unanswered: "لم يُجب",
} as const;

/**
 * Teacher-facing Arabic grade label — verbatim scale from
 * `grade5-math-unit1/src/exam/report.ts`.
 */
export function gradeLabel(p: number): string {
  if (p >= 95) return "ممتاز";
  if (p >= 85) return "جيد جداً";
  if (p >= 75) return "جيد";
  if (p >= 65) return "مقبول";
  if (p >= 50) return "ضعيف";
  return "يحتاج إلى دعم";
}

/** Lesson mark breakdown matching the grading engine (`Lessons 1–5`). */
export function lessonTotals(evaluation: ExamEvaluation): PayloadLesson[] {
  return evaluation.lessonScores.map((ls) => ({
    title: ls.title,
    awarded: ls.earnedMarks,
    max: ls.maxMarks,
  }));
}

/**
 * Builds the reference Google Sheets payload from the same `ExamEvaluation` and
 * `reportText` shown on the results screen and downloaded as `.txt`.
 */
export function buildPayload(input: PayloadInput): SubmissionPayload {
  const { session, evaluation, reportText } = input;
  const details: PayloadDetail[] = [];

  let correctSubparts = 0;
  let partialSubparts = 0;
  let wrongSubparts = 0;
  let unansweredSubparts = 0;

  for (const res of evaluation.questionResults) {
    for (const sp of res.subParts) {
      const answered =
        typeof sp.isAnswered === "boolean"
          ? sp.isAnswered
          : sp.studentAnswer !== "(No answer)";

      let status: string;
      if (sp.isCorrect) {
        status = STATUS_AR.correct;
        correctSubparts += 1;
      } else if (!answered) {
        status = STATUS_AR.unanswered;
        unansweredSubparts += 1;
      } else if (sp.earnedMarks > 0 && sp.earnedMarks < sp.maxMarks) {
        status = STATUS_AR.partial;
        partialSubparts += 1;
      } else {
        status = STATUS_AR.wrong;
        wrongSubparts += 1;
      }

      details.push({
        q: res.examNumber,
        qTitle: `${res.question.formatLabel} — ${sp.label}`,
        lessons: res.question.source.lessonTitle,
        label: sp.id,
        status,
        awarded: sp.earnedMarks,
        marks: sp.maxMarks,
        studentAnswer: sp.studentAnswer,
        correctAnswer: sp.correctAnswer,
      });
    }
  }

  const submitMs = session.submittedAt
    ? Date.parse(session.submittedAt)
    : Date.now();
  const safeSubmitMs = Number.isFinite(submitMs) ? submitMs : Date.now();
  const elapsedSec = Math.max(0, Math.round(session.elapsedSeconds));
  const safeStartMs =
    typeof session.startTimestamp === "number" &&
    Number.isFinite(session.startTimestamp)
      ? session.startTimestamp
      : safeSubmitMs - elapsedSec * 1000;

  return {
    token: SHEETS_TOKEN,
    attemptId: session.attemptId,
    examId: EXAM_ID,
    examTitle: EXAM_TITLE,
    studentName: session.studentName.trim(),
    startAt: new Date(safeStartMs).toISOString(),
    submitAt: new Date(safeSubmitMs).toISOString(),
    elapsedSec,
    summary: {
      total: evaluation.totalEarned,
      max: evaluation.totalMax,
      percentage: evaluation.percentage,
      gradeLabel: gradeLabel(evaluation.percentage),
      fullQuestions: evaluation.correctCount,
      partialQuestions: evaluation.partialCount,
      wrongQuestions: evaluation.incorrectCount,
      correctSubparts,
      partialSubparts,
      wrongSubparts,
      unansweredSubparts,
    },
    lessons: lessonTotals(evaluation),
    details,
    reportText,
  };
}

/* ------------------------------------------------------------------ */
/* Delivery & local queue                                              */
/* ------------------------------------------------------------------ */

export const MAX_ATTEMPTS = 3;
export const RETRY_DELAYS_MS = [2000, 5000] as const;
export const ATTEMPT_TIMEOUT_MS = 30000;
export const PENDING_PREFIX = `pending:${EXAM_ID}:`;

export const canSend = Boolean(SHEETS_URL && SHEETS_TOKEN);

export function pendingKey(attemptId: string): string {
  return `${PENDING_PREFIX}${attemptId}`;
}

export type FetchLike = (
  url: string,
  init: RequestInit
) => Promise<{ text(): Promise<string> }>;

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

function defaultStorage(): StorageLike | null {
  try {
    return typeof localStorage !== "undefined" ? localStorage : null;
  } catch {
    return null;
  }
}

export function savePending(
  payload: SubmissionPayload,
  storage: StorageLike | null = defaultStorage()
): void {
  if (!storage) return;
  try {
    storage.setItem(pendingKey(payload.attemptId), JSON.stringify(payload));
  } catch {
    /* ignore storage quota / privacy-mode failures */
  }
}

export function removePending(
  attemptId: string,
  storage: StorageLike | null = defaultStorage()
): void {
  if (!storage) return;
  try {
    storage.removeItem(pendingKey(attemptId));
  } catch {
    /* ignore */
  }
}

export function isPending(
  attemptId: string,
  storage: StorageLike | null = defaultStorage()
): boolean {
  if (!storage || !attemptId) return false;
  try {
    return storage.getItem(pendingKey(attemptId)) !== null;
  } catch {
    return false;
  }
}

/** Runs `cb` if the page is hidden or unloaded while an attempt is still sending. */
export function onPageExit(cb: () => void): () => void {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return () => {};
  }
  let fired = false;
  const once = () => {
    if (fired) return;
    fired = true;
    cb();
  };
  const onVis = () => {
    if (document.visibilityState === "hidden") once();
  };
  window.addEventListener("pagehide", once);
  document.addEventListener("visibilitychange", onVis);
  return () => {
    window.removeEventListener("pagehide", once);
    document.removeEventListener("visibilitychange", onVis);
  };
}

async function postOnce(
  payload: SubmissionPayload,
  fetchImpl: FetchLike,
  timeoutMs: number
): Promise<boolean> {
  if (!SHEETS_URL) return false;
  const ctrl =
    typeof AbortController !== "undefined" ? new AbortController() : undefined;
  const timer = setTimeout(() => ctrl?.abort(), timeoutMs);
  try {
    const res = await fetchImpl(SHEETS_URL, {
      method: "POST",
      // text/plain avoids a CORS preflight, which Google Apps Script does not answer.
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
      redirect: "follow",
      signal: ctrl?.signal,
    });
    const text = await res.text();
    const data = JSON.parse(text) as { ok?: unknown; duplicate?: unknown };
    return Boolean(data && (data.ok === true || data.duplicate === true));
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

const realSleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

const defaultFetch: FetchLike = (url, init) => fetch(url, init);

/**
 * Sends `payload` with up to 3 attempts (0 s, +2 s, +5 s).
 * Stores the payload under `pending:<EXAM_ID>:<attemptId>` if all attempts fail
 * and clears that key as soon as delivery succeeds.
 */
export async function sendWithRetry(
  payload: SubmissionPayload,
  opts: SendOptions = {}
): Promise<boolean> {
  const fetchImpl = opts.fetchImpl ?? defaultFetch;
  const storage =
    opts.storage === undefined ? defaultStorage() : opts.storage;
  const sleep = opts.sleep ?? realSleep;
  const timeoutMs = opts.timeoutMs ?? ATTEMPT_TIMEOUT_MS;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    if (attempt > 0) {
      await sleep(RETRY_DELAYS_MS[attempt - 1]);
    }
    if (await postOnce(payload, fetchImpl, timeoutMs)) {
      removePending(payload.attemptId, storage);
      return true;
    }
  }
  savePending(payload, storage);
  return false;
}

/**
 * Silently retries every queued `pending:<EXAM_ID>:*` payload in `localStorage`.
 * Returns the number of queued payloads successfully delivered.
 */
export async function retryPending(opts: SendOptions = {}): Promise<number> {
  if (!canSend && !opts.fetchImpl) return 0;
  const storage =
    opts.storage === undefined ? defaultStorage() : opts.storage;
  if (!storage) return 0;

  const keys: string[] = [];
  try {
    for (let i = 0; i < storage.length; i++) {
      const k = storage.key(i);
      if (k && k.startsWith(PENDING_PREFIX)) keys.push(k);
    }
  } catch {
    return 0;
  }

  let sent = 0;
  for (const key of keys) {
    let raw: string | null = null;
    try {
      raw = storage.getItem(key);
    } catch {
      raw = null;
    }
    if (!raw) continue;

    let payload: SubmissionPayload | null = null;
    try {
      const parsed = JSON.parse(raw) as SubmissionPayload;
      if (parsed && typeof parsed.attemptId === "string") {
        payload = { ...parsed, token: SHEETS_TOKEN };
      }
    } catch {
      try {
        storage.removeItem(key);
      } catch {
        /* ignore */
      }
    }
    if (!payload) continue;

    if (await sendWithRetry(payload, { ...opts, storage })) {
      sent += 1;
    }
  }
  return sent;
}
