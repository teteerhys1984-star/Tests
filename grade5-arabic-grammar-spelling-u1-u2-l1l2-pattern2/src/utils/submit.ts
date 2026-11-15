import { EXAM_ID, EXAM_TITLE, SHEETS_TOKEN, SHEETS_URL } from "../config";
import { QUESTIONS } from "../data/questions";
import { ORDERED_LESSONS, SECTION_LABELS } from "../data/sources/lessons";
import type { Attempt } from "../types/exam";
import { gradeAttempt, formatAnswer } from "./grading";
import { buildTxtReport } from "./report";
import { subpartLetter } from "./arabic";

export interface SubmissionPayload {
  token: string; attemptId: string; examId: string; examTitle: string; studentName: string;
  startAt: string; submitAt: string; elapsedSec: number;
  summary: { total: number; max: number; percentage: number; gradeLabel: string; fullQuestions: number; partialQuestions: number; wrongQuestions: number; correctSubparts: number; partialSubparts: number; wrongSubparts: number; unansweredSubparts: number };
  lessons: { title: string; awarded: number; max: number }[];
  details: { q: number; qTitle: string; lessons: string; label: string; status: string; awarded: number; marks: number; studentAnswer: string; correctAnswer: string }[];
  reportText: string;
}

export function buildPayload(attempt: Attempt): SubmissionPayload {
  const r = gradeAttempt(attempt);
  let fullQuestions = 0, partialQuestions = 0, wrongQuestions = 0;
  const details = r.questions.flatMap((q) => {
    if (q.subparts.every((s) => s.isCorrect)) fullQuestions++;
    else if (q.subparts.some((s) => s.marksEarned > 0)) partialQuestions++;
    else wrongQuestions++;
    return q.subparts.map((s, i) => ({
      q: q.number, qTitle: q.prompt, lessons: q.lessonTitle, label: subpartLetter(i),
      status: !s.answered ? "لم يُجب" : s.isCorrect ? "إجابة صحيحة" : "إجابة خاطئة",
      awarded: s.marksEarned, marks: s.marksMax,
      studentAnswer: formatAnswer(s.studentAnswer), correctAnswer: formatAnswer(s.correctAnswer),
    }));
  });
  void QUESTIONS; void SECTION_LABELS;
  const submittedAt = attempt.submittedAt ?? Date.now();
  return {
    token: SHEETS_TOKEN, attemptId: attempt.id, examId: EXAM_ID, examTitle: EXAM_TITLE,
    studentName: attempt.studentName,
    startAt: new Date(attempt.startedAt).toISOString(), submitAt: new Date(submittedAt).toISOString(),
    elapsedSec: Math.max(0, Math.floor((submittedAt - attempt.startedAt) / 1000)),
    summary: { total: r.totalEarned, max: r.totalMax, percentage: r.percentage, gradeLabel: r.performance.label, fullQuestions, partialQuestions, wrongQuestions, correctSubparts: r.correctCount, partialSubparts: 0, wrongSubparts: r.incorrectCount, unansweredSubparts: r.unansweredCount },
    lessons: ORDERED_LESSONS.map((l) => { const b = r.lessons.find((x) => x.lessonId === l.id); return { title: l.title, awarded: b?.earned ?? 0, max: b?.max ?? 0 }; }),
    details, reportText: buildTxtReport(r),
  };
}

export type SendStatus = "idle" | "sending" | "success" | "failed";
export const RETRY_DELAYS_MS: readonly number[] = [2000, 5000];
export const MAX_ATTEMPTS = RETRY_DELAYS_MS.length + 1;
export const ATTEMPT_TIMEOUT_MS = 30000;
export const PENDING_PREFIX = `pending:${EXAM_ID}:`;
export function pendingKey(attemptId: string): string { return PENDING_PREFIX + attemptId; }
export type FetchLike = (url: string, init: RequestInit) => Promise<Pick<Response, "text">>;
export interface StorageLike { readonly length: number; key(i: number): string | null; getItem(k: string): string | null; setItem(k: string, v: string): void; removeItem(k: string): void; }
export interface SendOptions { fetchImpl?: FetchLike; storage?: StorageLike | null; sleep?: (ms: number) => Promise<void>; timeoutMs?: number; }
const wait = (ms: number) => new Promise<void>((res) => setTimeout(res, ms));
function isAccepted(data: unknown): boolean { if (typeof data !== "object" || data === null) return false; const r = data as { ok?: unknown; duplicate?: unknown }; return r.ok === true || r.duplicate === true; }
async function postOnce(body: string, opts: SendOptions): Promise<boolean> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const doFetch: FetchLike = opts.fetchImpl ?? ((u, i) => fetch(u, i));
    const ctrl = typeof AbortController === "function" ? new AbortController() : null;
    const reply = doFetch(SHEETS_URL, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body, redirect: "follow", ...(ctrl ? { signal: ctrl.signal } : {}) }).then((r) => r.text());
    reply.catch(() => {});
    const timeout = new Promise<never>((_, rej) => { timer = setTimeout(() => { ctrl?.abort(); rej(new Error("timeout")); }, opts.timeoutMs ?? ATTEMPT_TIMEOUT_MS); });
    return isAccepted(JSON.parse(await Promise.race([reply, timeout])));
  } catch { return false; } finally { if (timer !== undefined) clearTimeout(timer); }
}
async function deliver(payload: SubmissionPayload, opts: SendOptions): Promise<boolean> {
  try { const body = JSON.stringify(payload); const sleep = opts.sleep ?? wait;
    for (let a = 0; a < MAX_ATTEMPTS; a++) { if (a > 0) await sleep(RETRY_DELAYS_MS[a - 1]); if (await postOnce(body, opts)) return true; }
  } catch { /* failure */ } return false;
}
function storageOf(opts: SendOptions): StorageLike | null { if (opts.storage !== undefined) return opts.storage; try { return typeof window !== "undefined" && window.localStorage ? window.localStorage : null; } catch { return null; } }
function savePending(p: SubmissionPayload, opts: SendOptions): void { try { storageOf(opts)?.setItem(pendingKey(p.attemptId), JSON.stringify(p)); } catch { /* unavailable */ } }
function dropPending(k: string, opts: SendOptions): void { try { storageOf(opts)?.removeItem(k); } catch { /* ignore */ } }
function readPending(s: StorageLike, k: string): SubmissionPayload | null { try { const raw = s.getItem(k); const d: unknown = raw ? JSON.parse(raw) : null; return typeof d === "object" && d !== null && !Array.isArray(d) && typeof (d as SubmissionPayload).attemptId === "string" ? (d as SubmissionPayload) : null; } catch { return null; } }
export function hasPending(attemptId: string, opts: SendOptions = {}): boolean { try { const s = storageOf(opts); return s ? s.getItem(pendingKey(attemptId)) !== null : false; } catch { return false; } }
const sendInFlight = new Map<string, Promise<boolean>>();
export function sendWithRetry(payload: SubmissionPayload, opts: SendOptions = {}): Promise<boolean> {
  try { if (storageOf(opts)?.getItem(`sent:${EXAM_ID}:${payload.attemptId}`) === "1") return Promise.resolve(true); } catch { /* ignore */ }
  const existing = sendInFlight.get(payload.attemptId); if (existing) return existing;
  const job = (async () => { savePending(payload, opts); const ok = await deliver(payload, opts); if (ok) { try { storageOf(opts)?.setItem(`sent:${EXAM_ID}:${payload.attemptId}`, "1"); } catch { /* ignore */ } dropPending(pendingKey(payload.attemptId), opts); } else savePending(payload, opts); return ok; })().finally(() => { if (sendInFlight.get(payload.attemptId) === job) sendInFlight.delete(payload.attemptId); });
  sendInFlight.set(payload.attemptId, job); return job;
}
let flushing: Promise<number> | null = null;
export function retryPending(opts: SendOptions = {}): Promise<number> { if (!flushing) flushing = flushPending(opts).finally(() => { flushing = null; }); return flushing; }
async function flushPending(opts: SendOptions): Promise<number> { let sent = 0; try { const s = storageOf(opts); if (!s) return 0; const keys: string[] = []; for (let i = 0; i < s.length; i++) { const k = s.key(i); if (k && k.startsWith(PENDING_PREFIX)) keys.push(k); } for (const k of keys) { const stored = readPending(s, k); if (!stored || pendingKey(stored.attemptId) !== k) continue; if (await sendWithRetry({ ...stored, token: SHEETS_TOKEN }, opts)) sent++; } } catch { /* silent */ } return sent; }
