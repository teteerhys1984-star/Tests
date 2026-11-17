import { EXAM_ID, EXAM_TITLE, SHEETS_TOKEN, SHEETS_URL } from './config';
import { questions } from './examData';
import { calculateResults, partIsCorrect, reportFor, scoreQuestion, type Attempt } from './examEngine';
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


export function buildPayload(attempt: Attempt): SubmissionPayload {
 const result = calculateResults(attempt);
 const details = questions.flatMap((q, i) => q.parts.map((part, j) => {
 const answer = attempt.answers[q.id]?.[j] ?? '';
 const correct = partIsCorrect(part, answer);
 return {q: i+1, qTitle: q.prompt, lessons: `Lesson ${q.lesson}`, label: String.fromCharCode(65+j), status: !answer.trim() ? STATUS_AR.unanswered : correct ? STATUS_AR.correct : STATUS_AR.wrong, awarded: correct ? part.marks : 0, marks: part.marks, studentAnswer: answer, correctAnswer: part.answer};
 }));
 const partial = questions.filter(q => {const n = scoreQuestion(q, attempt.answers); return n > 0 && n < 2;}).length;
 return {
 token: SHEETS_TOKEN, attemptId: attempt.attemptId, examId: EXAM_ID, examTitle: EXAM_TITLE,
 studentName: attempt.studentName, startAt: new Date(attempt.startedAt).toISOString(), submitAt: new Date(attempt.submittedAt ?? attempt.startedAt).toISOString(), elapsedSec: Math.floor(attempt.elapsedMs/1000),
 summary: {total:result.score,max:100,percentage:result.score,gradeLabel:gradeLabel(result.score),fullQuestions:result.correct,partialQuestions:partial,wrongQuestions:50-result.correct-partial,correctSubparts:details.filter(d=>d.status===STATUS_AR.correct).length,partialSubparts:0,wrongSubparts:details.filter(d=>d.status===STATUS_AR.wrong).length,unansweredSubparts:details.filter(d=>d.status===STATUS_AR.unanswered).length},
 lessons: result.lessonScores.map(l=>({title:l.title,awarded:l.score,max:20})), details, reportText:reportFor(attempt)
 };
}
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
  excludeAttemptId?: string;
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
    if (!payload || payload.attemptId === opts.excludeAttemptId) continue;

    if (await sendWithRetry(payload, { ...opts, storage })) {
      sent += 1;
    }
  }
  return sent;
}

export type SendState = "idle" | "sending" | "sent" | "failed";
