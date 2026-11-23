import {
  ATTEMPT_TIMEOUT_MS,
  EXAM_ID,
  EXAM_TITLE,
  MAX_ATTEMPTS,
  PENDING_PREFIX,
  RETRY_DELAYS_MS,
  SHEETS_TOKEN,
  SHEETS_URL,
  TOTAL_MARKS,
} from "../config";
import { lessons } from "../content/problems";
import { plainMath, SUBPART_STATUS_AR } from "./report";
import type { ExamAttempt, ExamResult } from "./types";

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
  attempt: ExamAttempt;
  result: ExamResult;
  reportText: string;
}

export function buildPayload({ attempt, result, reportText }: PayloadInput): SubmissionPayload {
  const submitAt = attempt.submittedAt ?? new Date().toISOString();
  const elapsedMs =
    attempt.elapsedMs ??
    Math.max(0, new Date(submitAt).getTime() - new Date(attempt.startedAt).getTime());

  // wrongQuestions in the Sheets summary equals questions with zero awarded marks (wrong + unanswered)
  const wrongQuestionsZeroAwarded = result.questionCounts.wrong + result.questionCounts.unanswered;

  return {
    token: SHEETS_TOKEN,
    attemptId: attempt.attemptId,
    examId: EXAM_ID,
    examTitle: EXAM_TITLE,
    studentName: attempt.studentName,
    startAt: attempt.startedAt,
    submitAt,
    elapsedSec: Math.max(0, Math.floor(elapsedMs / 1000)),
    summary: {
      total: result.total,
      max: TOTAL_MARKS,
      percentage: result.percentage,
      gradeLabel: result.gradeLabel,
      fullQuestions: result.questionCounts.correct,
      partialQuestions: result.questionCounts.partial,
      wrongQuestions: wrongQuestionsZeroAwarded,
      correctSubparts: result.subpartCounts.correct,
      partialSubparts: 0,
      wrongSubparts: result.subpartCounts.wrong,
      unansweredSubparts: result.subpartCounts.unanswered,
    },
    lessons: result.lessons.map((l) => ({
      title: l.title,
      awarded: l.awarded,
      max: l.max,
    })),
    details: result.questions.flatMap((q, idx) =>
      q.subparts.map((sp) => ({
        q: idx + 1,
        qTitle: plainMath(q.title),
        lessons: lessons[q.lessonId].title,
        label: plainMath(sp.spec.prompt),
        status: SUBPART_STATUS_AR[sp.status],
        awarded: sp.awarded,
        marks: sp.max,
        studentAnswer: plainMath(sp.displayAnswer),
        correctAnswer: plainMath(sp.spec.answerDisplay),
      })),
    ),
    reportText,
  };
}

export type SendStatus = "idle" | "sending" | "success" | "failed";

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
    /* treat as failure */
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
    /* ignore */
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
    return typeof data === "object" && data !== null && !Array.isArray(data)
      ? (data as SubmissionPayload)
      : null;
  } catch {
    return null;
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

export async function sendWithRetry(
  payload: SubmissionPayload,
  opts: SendOptions = {},
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
    /* silent retry on next load */
  }
  return sent;
}
