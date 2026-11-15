import { QUESTIONS, subKey } from '../data/questions';
import { LESSONS, LESSON_ORDER } from '../data/sources/lessons';
import { correctAnswerText, studentAnswerText } from '../data/answers/answerKey';
import { buildReport, type ReportInput } from './report';
export const EXAM_ID = 'grade5-arabic-grammar-spelling-u1-u2-l1l2';
export const EXAM_TITLE = 'قواعد اللغة والإملاء للوحدة الأولى وأول درسين من الوحدة الثانية';
export const SHEETS_URL = 'https://script.google.com/macros/s/AKfycbwqv4hE1AFy73L7MhyhFwXx0nl4QF5-Nme5jvP-ank-BY_LQr91xA8A_IiQqMuTdh8B/exec';
export const SHEETS_TOKEN = '7U25pymFzsSqmt8ejzPOTPTFJmSvj9Rm';
export interface SubmissionPayload {
 token: string; attemptId: string; examId: string; examTitle: string; studentName: string;
 startAt: string; submitAt: string; elapsedSec: number;
 summary: { total: number; max: number; percentage: number; gradeLabel: string; fullQuestions: number; partialQuestions: number; wrongQuestions: number; correctSubparts: number; partialSubparts: number; wrongSubparts: number; unansweredSubparts: number };
 lessons: {title:string; awarded:number; max:number}[];
 details: {q:number; qTitle:string; lessons:string; label:string; status:string; awarded:number; marks:number; studentAnswer:string; correctAnswer:string}[];
 reportText:string;
}
export function buildPayload(input: ReportInput): SubmissionPayload {
 const { result:r, answers } = input;
 let fullQuestions=0, partialQuestions=0, wrongQuestions=0;
 const details = QUESTIONS.flatMap((q, qi) => {
   const scores=q.subparts.map(sp=>r.bySub[subKey(q,sp.id)]);
   if(scores.every(s=>s.status==='correct')) fullQuestions++;
   else if(scores.some(s=>s.earned>0)) partialQuestions++;
   else wrongQuestions++;
   return q.subparts.map((sp, si)=> {
    const key=subKey(q,sp.id), s=r.bySub[key];
    return {q:qi+1,qTitle:q.instruction,lessons:LESSONS[q.lessonId].title,label:['أ','ب','ج','د','هـ','و'][si] ?? String(si+1),status:({correct:'إجابة صحيحة',partial:'إجابة صحيحة جزئياً',incorrect:'إجابة خاطئة',unanswered:'لم يُجب'} as const)[s.status],awarded:s.earned,marks:s.max,studentAnswer:studentAnswerText(sp,answers[key]),correctAnswer:correctAnswerText(sp)};
   });
 });
 return {token:SHEETS_TOKEN,attemptId:input.attemptId,examId:EXAM_ID,examTitle:EXAM_TITLE,studentName:input.studentName,startAt:new Date(input.submittedAt-input.elapsedMs).toISOString(),submitAt:new Date(input.submittedAt).toISOString(),elapsedSec:Math.max(0,Math.floor(input.elapsedMs/1000)),summary:{total:r.total,max:r.max,percentage:r.percentage,gradeLabel:r.level,fullQuestions,partialQuestions,wrongQuestions,correctSubparts:r.correct,partialSubparts:r.partial,wrongSubparts:r.incorrect,unansweredSubparts:r.unanswered},lessons:LESSON_ORDER.map(l=>({title:LESSONS[l].title,awarded:Math.round((r.byLesson[l].grammar+r.byLesson[l].spelling)*100)/100,max:r.byLesson[l].grammarMax+r.byLesson[l].spellingMax})),details,reportText:buildReport(input)};
}

export type SendStatus = "idle" | "sending" | "success" | "failed";

/** الانتظار قبل المحاولة الثانية ثم الثالثة (3 محاولات في المجموع). */
export const RETRY_DELAYS_MS: readonly number[] = [2000, 5000];
export const MAX_ATTEMPTS = RETRY_DELAYS_MS.length + 1;
/** مهلة المحاولة الواحدة: اتصال معلّق بلا ردّ يُعدّ فشلاً فتبدأ المحاولة التالية. */
export const ATTEMPT_TIMEOUT_MS = 30000;
/** بادئة مفاتيح الحمولات المعلّقة لهذا الاختبار: pending:<EXAM_ID>:<attemptId> */
export const PENDING_PREFIX = `pending:${EXAM_ID}:`;

export function pendingKey(attemptId: string): string {
  return PENDING_PREFIX + attemptId;
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

/** حارس منع الإرسال المكرر بالذاكرة: طلب واحد جارٍ لكل attemptId أثناء الإرسال الافتراضي. */
const sendInFlight = new Map<string, Promise<boolean>>();

/**
 * يرسل النتيجة في الخلفية ويعيد true فقط إذا أكّد الخادم الاستلام.
 * إن فشلت المحاولات كلها تُحفظ الحمولة تحت pending:<EXAM_ID>:<attemptId> لتُعاد لاحقاً.
 * عند تزامن استدعاءين للمحاولة نفسها يُعاد الوعد نفسه لمنع الإرسال المكرر.
 */
export function sendWithRetry(
  payload: SubmissionPayload,
  opts: SendOptions = {},
): Promise<boolean> {
  try { if (storageOf(opts)?.getItem(`sent:${EXAM_ID}:${payload.attemptId}`) === '1') return Promise.resolve(true); } catch { /* storage unavailable */ }
  const existing = sendInFlight.get(payload.attemptId);
  if (existing) return existing;

  const job = (async () => {
    savePending(payload, opts);
    const stopWatching = onPageExit(() => savePending(payload, opts));
    const ok = await deliver(payload, opts);
    stopWatching();
    if (ok) {
      try { storageOf(opts)?.setItem(`sent:${EXAM_ID}:${payload.attemptId}`, "1"); } catch { /* storage unavailable */ }
      dropPending(pendingKey(payload.attemptId), opts);
    }
    else savePending(payload, opts);
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

/**
 * عند تحميل التطبيق: يعيد بصمت إرسال الحمولات المعلّقة لهذا الاختبار ويحذف ما نجح منها.
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
