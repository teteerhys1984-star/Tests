/**
 * إرسال نتيجة الطالبة إلى المعلّمة عبر Google Apps Script / Google Sheets.
 *
 * يطبّق نفس العقد والسلوك المعتمدين في الاختبارات المرجعية للمنصة
 * (grade5-math-unit1، والنموذجين الأول والثاني):
 *  · buildPayload  — يبني الحمولة من دوالّ التصحيح والتقرير القائمة دون منطق تصحيح جديد.
 *  · sendWithRetry — 3 محاولات بفاصلين 2s ثم 5s ومهلة 30s، مع حارس ذاكرة وعلامة sent:<EXAM_ID>:<attemptId> لمنع التكرار، وحفظ معلّق في localStorage عند الفشل.
 *  · retryPending  — عند فتح الاختبار يعيد بصمت إرسال المحاولات المعلّقة الخاصة بهذا الاختبار فقط.
 */
import { EXAM_ID, EXAM_TITLE, SHEETS_TOKEN, SHEETS_URL } from "../config";
import { LESSONS } from "../data/curriculum/lessons";
import { EXAM_DATA } from "../data/questions/examQuestions";
import { performanceLevel, scoreSubpart, type SubpartResult } from "./scoring";
import { buildTxtReport } from "./report";

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
  startTimestamp: number;
  submittedAt: number;
  durationMs: number;
  answers: Record<string, string>;
}

export function newAttemptId(): string {
  try {
    if (typeof globalThis.crypto?.randomUUID === "function") {
      return globalThis.crypto.randomUUID();
    }
  } catch {
    /* متصفح قديم أو بيئة غير آمنة */
  }
  const rnd = Math.random().toString(36).slice(2, 10);
  return `attempt-${Date.now()}-${rnd}`;
}

export function buildPayload(input: PayloadInput): SubmissionPayload {
  const results = new Map<string, SubpartResult>();
  let totalEarned = 0;
  let totalMax = 0;
  let grammarEarned = 0;
  let grammarMax = 0;
  let spellingEarned = 0;
  let spellingMax = 0;
  let fullQuestions = 0;
  let partialQuestions = 0;
  let wrongQuestions = 0;
  let correctSubparts = 0;
  let partialSubparts = 0;
  let wrongSubparts = 0;
  let unansweredSubparts = 0;

  const lessonMap = new Map<
    string,
    {
      lessonId: string;
      earned: number;
      max: number;
      grammarEarned: number;
      grammarMax: number;
      spellingEarned: number;
      spellingMax: number;
    }
  >();
  for (const l of LESSONS) {
    lessonMap.set(l.id, {
      lessonId: l.id,
      earned: 0,
      max: 0,
      grammarEarned: 0,
      grammarMax: 0,
      spellingEarned: 0,
      spellingMax: 0,
    });
  }

  const details: PayloadDetail[] = [];

  for (const q of EXAM_DATA.questions) {
    const ls = lessonMap.get(q.lessonId)!;
    const lessonTitle = LESSONS.find((l) => l.id === q.lessonId)?.title ?? q.lessonId;
    const qResults: SubpartResult[] = [];

    for (const sp of q.subparts) {
      const r = scoreSubpart(sp, input.answers[sp.id] ?? "");
      results.set(sp.id, r);
      qResults.push(r);

      totalEarned += r.earned;
      totalMax += sp.maxMarks;
      ls.earned += r.earned;
      ls.max += sp.maxMarks;
      if (q.category === "grammar") {
        grammarEarned += r.earned;
        grammarMax += sp.maxMarks;
        ls.grammarEarned += r.earned;
        ls.grammarMax += sp.maxMarks;
      } else {
        spellingEarned += r.earned;
        spellingMax += sp.maxMarks;
        ls.spellingEarned += r.earned;
        ls.spellingMax += sp.maxMarks;
      }

      const answered = r.studentAnswer.length > 0;
      let status: string;
      if (!answered) {
        unansweredSubparts++;
        status = "لم يُجب";
      } else if (r.correct) {
        correctSubparts++;
        status = "إجابة صحيحة";
      } else if (r.partial) {
        partialSubparts++;
        status = "إجابة صحيحة جزئياً";
      } else {
        wrongSubparts++;
        status = "إجابة خاطئة";
      }

      details.push({
        q: q.number,
        qTitle: q.instruction,
        lessons: lessonTitle,
        label: sp.label,
        status,
        awarded: r.earned,
        marks: sp.maxMarks,
        studentAnswer: answered ? r.studentAnswer : "—",
        correctAnswer: sp.acceptedAnswers?.length
          ? `${sp.correctAnswer} (${sp.acceptedAnswers.join(" / ")})`
          : sp.correctAnswer,
      });
    }

    if (qResults.every((r) => r.correct)) fullQuestions++;
    else if (qResults.some((r) => r.earned > 0)) partialQuestions++;
    else wrongQuestions++;
  }

  const pct = totalMax ? Math.round((totalEarned / totalMax) * 100) : 0;
  const lessonStats = [...lessonMap.values()];
  const reportText = buildTxtReport({
    studentName: input.studentName,
    attemptId: input.attemptId,
    questions: EXAM_DATA.questions,
    results,
    totalEarned,
    totalMax,
    grammarEarned,
    grammarMax,
    spellingEarned,
    spellingMax,
    durationMs: input.durationMs,
    submittedAt: new Date(input.submittedAt),
    lessonStats,
  });

  return {
    token: SHEETS_TOKEN,
    attemptId: input.attemptId,
    examId: EXAM_ID,
    examTitle: EXAM_TITLE,
    studentName: input.studentName,
    startAt: new Date(input.startTimestamp).toISOString(),
    submitAt: new Date(input.submittedAt).toISOString(),
    elapsedSec: Math.max(0, Math.floor(input.durationMs / 1000)),
    summary: {
      total: Math.round(totalEarned * 100) / 100,
      max: totalMax,
      percentage: pct,
      gradeLabel: performanceLevel(pct),
      fullQuestions,
      partialQuestions,
      wrongQuestions,
      correctSubparts,
      partialSubparts,
      wrongSubparts,
      unansweredSubparts,
    },
    lessons: LESSONS.map((l) => {
      const st = lessonMap.get(l.id);
      return {
        title: l.title,
        awarded: Math.round((st?.earned ?? 0) * 100) / 100,
        max: st?.max ?? 0,
      };
    }),
    details,
    reportText,
  };
}

export type SendStatus = "idle" | "sending" | "success" | "failed";

export const RETRY_DELAYS_MS: readonly number[] = [2000, 5000];
export const MAX_ATTEMPTS = RETRY_DELAYS_MS.length + 1;
export const ATTEMPT_TIMEOUT_MS = 30000;
export const PENDING_PREFIX = `pending:${EXAM_ID}:`;
export const SENT_PREFIX = `sent:${EXAM_ID}:`;

export function pendingKey(attemptId: string): string {
  return PENDING_PREFIX + attemptId;
}

export function sentKey(attemptId: string): string {
  return SENT_PREFIX + attemptId;
}

export type FetchLike = (
  url: string,
  init: RequestInit,
) => Promise<Pick<Response, "text">>;

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

const wait = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

function isAccepted(data: unknown): boolean {
  if (typeof data !== "object" || data === null) return false;
  const reply = data as { ok?: unknown; duplicate?: unknown };
  return reply.ok === true || reply.duplicate === true;
}

async function postOnce(body: string, opts: SendOptions): Promise<boolean> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const doFetch: FetchLike =
      opts.fetchImpl ?? ((url, init) => fetch(url, init));
    const ctrl =
      typeof AbortController === "function" ? new AbortController() : null;
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

async function deliver(
  payload: SubmissionPayload,
  opts: SendOptions,
): Promise<boolean> {
  try {
    const body = JSON.stringify(payload);
    const sleep = opts.sleep ?? wait;
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      if (attempt > 0) await sleep(RETRY_DELAYS_MS[attempt - 1]);
      if (await postOnce(body, opts)) return true;
    }
  } catch {
    /* يُعدّ فشلاً */
  }
  return false;
}

function storageOf(opts: SendOptions): StorageLike | null {
  if (opts.storage !== undefined) return opts.storage;
  try {
    return typeof window !== "undefined" && window.localStorage
      ? window.localStorage
      : null;
  } catch {
    return null;
  }
}

function savePending(payload: SubmissionPayload, opts: SendOptions): void {
  try {
    storageOf(opts)?.setItem(
      pendingKey(payload.attemptId),
      JSON.stringify(payload),
    );
  } catch {
    /* التخزين غير متاح أو ممتلئ */
  }
}

function dropPending(key: string, opts: SendOptions): void {
  try {
    storageOf(opts)?.removeItem(key);
  } catch {
    /* التخزين غير متاح */
  }
}

function readPending(
  storage: StorageLike,
  key: string,
): SubmissionPayload | null {
  try {
    const raw = storage.getItem(key);
    const data: unknown = raw ? JSON.parse(raw) : null;
    return typeof data === "object" &&
      data !== null &&
      !Array.isArray(data) &&
      typeof (data as SubmissionPayload).attemptId === "string"
      ? (data as SubmissionPayload)
      : null;
  } catch {
    return null;
  }
}

export function hasPending(attemptId: string, opts: SendOptions = {}): boolean {
  try {
    const storage = storageOf(opts);
    return storage ? storage.getItem(pendingKey(attemptId)) !== null : false;
  } catch {
    return false;
  }
}

export function isSent(attemptId: string, opts: SendOptions = {}): boolean {
  try {
    const storage = storageOf(opts);
    return storage ? storage.getItem(sentKey(attemptId)) === "1" : false;
  } catch {
    return false;
  }
}

function onPageExit(save: () => void): () => void {
  try {
    if (typeof window === "undefined" || typeof document === "undefined") {
      return () => {};
    }
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
        /* لا شيء */
      }
    };
  } catch {
    return () => {};
  }
}

/** حارس منع الإرسال المتزامن بالذاكرة لكل attemptId داخل هذا النموذج. */
const sendInFlight = new Map<string, Promise<boolean>>();

export function sendWithRetry(
  payload: SubmissionPayload,
  opts: SendOptions = {},
): Promise<boolean> {
  try {
    if (storageOf(opts)?.getItem(sentKey(payload.attemptId)) === "1") {
      return Promise.resolve(true);
    }
  } catch {
    /* التخزين غير متاح */
  }
  const existing = sendInFlight.get(payload.attemptId);
  if (existing) return existing;

  const job = (async () => {
    savePending(payload, opts);
    const stopWatching = onPageExit(() => savePending(payload, opts));
    const ok = await deliver(payload, opts);
    stopWatching();
    if (ok) {
      try {
        storageOf(opts)?.setItem(sentKey(payload.attemptId), "1");
      } catch {
        /* التخزين غير متاح */
      }
      dropPending(pendingKey(payload.attemptId), opts);
    } else {
      savePending(payload, opts);
    }
    return ok;
  })().finally(() => {
    if (sendInFlight.get(payload.attemptId) === job) {
      sendInFlight.delete(payload.attemptId);
    }
  });

  sendInFlight.set(payload.attemptId, job);
  return job;
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
      if (!stored || pendingKey(stored.attemptId) !== key) continue;
      if (await sendWithRetry({ ...stored, token: SHEETS_TOKEN }, opts)) {
        sent++;
      }
    }
  } catch {
    /* صامت: يُعاد في التحميل القادم */
  }
  return sent;
}
