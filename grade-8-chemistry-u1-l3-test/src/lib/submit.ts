/**
 * إرسال نتيجة الطالب إلى المعلّم (تطبيق ويب Google Apps Script يكتب في Google Sheets).
 *
 *  · buildPayload  — يبني الحمولة بدوالّ التصحيح والتقرير القائمة نفسها (عقد grade5-math-unit1).
 *  · sendWithRetry — يرسلها في الخلفية: حتى 3 محاولات بفاصلين 2 ثم 5 ثوانٍ، مهلة 30 ثانية للمحاولة،
 *                    وإن تعذّر الاتصال تُحفظ في localStorage تحت pending:<EXAM_ID>:<attemptId>.
 *  · retryPending  — عند تحميل التطبيق يعيد بصمت إرسال ما بقي معلّقاً لهذا الاختبار ويحذفه بعد النجاح.
 *
 * لا يكتب هذا الملف أي شيء في console: بيانات الطلاب لا تُسجَّل.
 */
import { EXAM_ID, EXAM_TITLE, PENDING_PREFIX, RECEIPT_PREFIX, SHEETS_TOKEN, SHEETS_URL } from '../config';
import { LESSON_TITLE, TOTAL_MARKS } from '../data/exam';
import { plainChemText } from './chemistry';
import { gradeExam, hasAnyAnswer } from './grading';
import { buildReport } from './report';
import type { Attempt, ExamResult } from './types';

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
  attempt: Attempt;
  result?: ExamResult;
  reportText?: string;
}

export const STATUS_AR = {
  correct: 'إجابة صحيحة',
  partial: 'إجابة صحيحة جزئياً',
  incorrect: 'إجابة خاطئة',
  unanswered: 'لم يُجب',
} as const;

export function gradeLabel(p: number): string {
  if (p >= 95) return 'ممتاز';
  if (p >= 85) return 'جيد جداً';
  if (p >= 75) return 'جيد';
  if (p >= 65) return 'مقبول';
  if (p >= 50) return 'ضعيف';
  return 'يحتاج إلى دعم';
}

/** معرّف فريد للمحاولة؛ يتجاهل الخادم تكراره، فإعادة إرسال المحاولة نفسها آمنة. */
export function newAttemptId(): string {
  try {
    const c = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
    if (c && typeof c.randomUUID === 'function') return c.randomUUID();
  } catch {
    /* متصفح قديم أو سياق غير آمن — نستعمل البديل أدناه */
  }
  const rand = () => Math.random().toString(36).slice(2, 10);
  return `${Date.now()}-${rand()}${rand()}`;
}

/**
 * يبني حمولة الإرسال. كل الأرقام والنصوص تأتي من gradeExam / buildReport / gradeLabel
 * (وهي دوالّ حتمية)، فتطابق ما يظهر في صفحة النتيجة وفي ملف التقرير تماماً.
 */
export function buildPayload({ attempt, result, reportText }: PayloadInput): SubmissionPayload {
  const graded = result ?? gradeExam(attempt.answers);
  const fullReport = reportText ?? buildReport(attempt, graded);
  const startMs = attempt.startedAt ?? attempt.submittedAt ?? Date.now();
  const submitMs = attempt.submittedAt ?? Date.now();
  const elapsedSec = Math.max(0, Math.floor(attempt.elapsedMs / 1000));

  const details: PayloadDetail[] = graded.questions.flatMap(qr =>
    qr.parts.map(pr => {
      const any = hasAnyAnswer(pr.part, attempt.answers[pr.part.id]);
      const status = !any
        ? STATUS_AR.unanswered
        : pr.earned === pr.available
          ? STATUS_AR.correct
          : pr.earned > 0
            ? STATUS_AR.partial
            : STATUS_AR.incorrect;
      return {
        q: qr.question.number,
        qTitle: plainChemText(qr.question.title),
        lessons: `الدرس الثالث: ${LESSON_TITLE} (ص${pr.part.reference.pages.join('، ')})`,
        label: `${pr.part.label}) ${plainChemText(pr.part.title)}`,
        status,
        awarded: pr.earned,
        marks: pr.available,
        studentAnswer: plainChemText(pr.studentText),
        correctAnswer: plainChemText(pr.correctText),
      };
    }),
  );

  const countStatus = (s: string) => details.filter(d => d.status === s).length;

  return {
    token: SHEETS_TOKEN,
    attemptId: attempt.attemptId,
    examId: EXAM_ID,
    examTitle: EXAM_TITLE,
    studentName: attempt.studentName,
    startAt: new Date(startMs).toISOString(),
    submitAt: new Date(submitMs).toISOString(),
    elapsedSec,
    summary: {
      total: graded.earned,
      max: TOTAL_MARKS,
      percentage: graded.percentage,
      gradeLabel: gradeLabel(graded.percentage),
      fullQuestions: graded.questions.filter(q => q.earned === q.available).length,
      partialQuestions: graded.questions.filter(q => q.earned > 0 && q.earned < q.available).length,
      wrongQuestions: graded.questions.filter(q => q.earned === 0).length,
      correctSubparts: countStatus(STATUS_AR.correct),
      partialSubparts: countStatus(STATUS_AR.partial),
      wrongSubparts: countStatus(STATUS_AR.incorrect),
      unansweredSubparts: countStatus(STATUS_AR.unanswered),
    },
    lessons: graded.questions.map(qr => ({
      title: `س${qr.question.number}: ${qr.question.title}`,
      awarded: qr.earned,
      max: qr.available,
    })),
    details,
    reportText: fullReport,
  };
}

/* ------------------------------------------------------------------ */
/* الإرسال                                                             */
/* ------------------------------------------------------------------ */

export type SendStatus = 'idle' | 'sending' | 'success' | 'failed';

export const RETRY_DELAYS_MS: readonly number[] = [2000, 5000];
export const MAX_ATTEMPTS = RETRY_DELAYS_MS.length + 1;
export const ATTEMPT_TIMEOUT_MS = 30000;
export { PENDING_PREFIX, RECEIPT_PREFIX };

export function pendingKey(attemptId: string): string {
  return PENDING_PREFIX + attemptId;
}

export function receiptKey(attemptId: string): string {
  return RECEIPT_PREFIX + attemptId;
}

export type FetchLike = (url: string, init: RequestInit) => Promise<Pick<Response, 'text'>>;

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

const wait = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

function isAccepted(data: unknown): boolean {
  if (typeof data !== 'object' || data === null) return false;
  const reply = data as { ok?: unknown; duplicate?: unknown };
  return reply.ok === true || reply.duplicate === true;
}

async function postOnce(body: string, opts: SendOptions): Promise<boolean> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const doFetch: FetchLike = opts.fetchImpl ?? ((url, init) => fetch(url, init));
    const ctrl = typeof AbortController === 'function' ? new AbortController() : null;
    const reply = doFetch(SHEETS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body,
      redirect: 'follow',
      ...(ctrl ? { signal: ctrl.signal } : {}),
    }).then(res => res.text());
    reply.catch(() => {});
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        ctrl?.abort();
        reject(new Error('timeout'));
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
    /* يُعدّ فشلاً */
  }
  return false;
}

function storageOf(opts: SendOptions): StorageLike | null {
  if (opts.storage !== undefined) return opts.storage;
  try {
    return typeof window !== 'undefined' && window.localStorage ? window.localStorage : null;
  } catch {
    return null;
  }
}

function savePending(payload: SubmissionPayload, opts: SendOptions): void {
  try {
    storageOf(opts)?.setItem(pendingKey(payload.attemptId), JSON.stringify(payload));
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

function readPending(storage: StorageLike, key: string): SubmissionPayload | null {
  try {
    const raw = storage.getItem(key);
    const data: unknown = raw ? JSON.parse(raw) : null;
    return typeof data === 'object' && data !== null && !Array.isArray(data) ? (data as SubmissionPayload) : null;
  } catch {
    return null;
  }
}

export function isPending(attemptId: string, opts: SendOptions = {}): boolean {
  try {
    const storage = storageOf(opts);
    return storage ? storage.getItem(pendingKey(attemptId)) !== null : false;
  } catch {
    return false;
  }
}

export function hasReceipt(attemptId: string, opts: SendOptions = {}): boolean {
  try {
    const storage = storageOf(opts);
    return storage ? storage.getItem(receiptKey(attemptId)) !== null : false;
  } catch {
    return false;
  }
}

export function markReceipt(attemptId: string, opts: SendOptions = {}): void {
  try {
    storageOf(opts)?.setItem(receiptKey(attemptId), new Date().toISOString());
  } catch {
    /* التخزين غير متاح */
  }
}

function onPageExit(save: () => void): () => void {
  try {
    if (typeof window === 'undefined' || typeof document === 'undefined') return () => {};
    const onHide = () => save();
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') save();
    };
    window.addEventListener('pagehide', onHide);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      try {
        window.removeEventListener('pagehide', onHide);
        document.removeEventListener('visibilitychange', onVisibility);
      } catch {
        /* لا شيء */
      }
    };
  } catch {
    return () => {};
  }
}

export async function sendWithRetry(payload: SubmissionPayload, opts: SendOptions = {}): Promise<boolean> {
  savePending(payload, opts);
  const stopWatching = onPageExit(() => savePending(payload, opts));
  const ok = await deliver(payload, opts);
  stopWatching();
  if (ok) {
    dropPending(pendingKey(payload.attemptId), opts);
    markReceipt(payload.attemptId, opts);
  } else {
    savePending(payload, opts);
  }
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
      if (stored.attemptId === opts.excludeAttemptId) continue;
      if (await deliver({ ...stored, token: SHEETS_TOKEN }, opts)) {
        dropPending(key, opts);
        markReceipt(stored.attemptId, opts);
        sent++;
      }
    }
  } catch {
    /* صامت: يُعاد في التحميل القادم */
  }
  return sent;
}
