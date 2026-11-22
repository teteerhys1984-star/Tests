/**
 * إرسال نتيجة الطالب إلى المعلّم (تطبيق ويب Google Apps Script يكتب في Google Sheets).
 *
 * هذا الملف يطبّق عقد الإرسال المعتمد في الاختبار المرجعي `grade5-math-unit1`
 * كما اعتمده `grade-7-physics-test-l1-l2-model-b-24-11-26`، مع تعديل واحد إلزامي:
 *   · lessons: **الدرسان فقط** (لا بند ثالث للسؤال التركيبي).
 *   · lessonTotals: حقول التداخل المشتركة بالطريقة نفسها.
 *   · summary.total / summary.max: مجموع الاختبار الحقيقي 100 — وهو وحده المقام.
 *
 * buildPayload    — الحقول والأسماء نفسها (لا منطق تصحيح جديد هنا).
 * sendWithRetry   — حتى 3 محاولات بفاصلين 2 ثم 5 ثوانٍ، فإن فشلت حُفظت الحمولة محلياً.
 * retryPending    — عند تحميل التطبيق يعيد إرسال ما بقي معلّقاً لهذا الاختبار ويحذفه بعد النجاح.
 * POST بنوع text/plain — لتجنّب طلب preflight لا يجيب عنه Apps Script.
 *
 * لم يُغيّر SHEETS_URL ولا SHEETS_TOKEN (مصدرهما src/config.ts).
 * لا يكتب هذا الملف أي شيء في console: بيانات الطلاب لا تُسجَّل.
 */

import { EXAM_ID, EXAM_TITLE, PENDING_PREFIX, SHEETS_TOKEN, SHEETS_URL } from "../config";
import type { Input, Question } from "./types";
import { isSharedQuestion } from "./types";
import {
  lessonOverlap,
  lessonTotals,
  partStatus,
  STATUS_AR,
  type AnswerKey,
  type ExamResult,
  type Responses,
} from "../lib/grading";
import { gradeLabel, inputLabel, modelAnswerText, summarize, type AttemptMeta } from "../lib/report";
import { richToPlain } from "../lib/mathx";

/* ------------------------------------------------------------------ */
/* الحمولة — أسماء الحقول كما يتوقّعها الخادم                          */
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
  /** عدد الأسئلة المحتسبة في الدرس (بما فيها التركيبي). */
  questions: number;
  /** عدد الأسئلة التركيبية المحتسبة في الدرس (حصة مشتركة مع الدرس الآخر). */
  sharedQuestions: number;
  /** علامة الحصة المشتركة المحقَّقة داخل هذا الدرس. */
  sharedAwarded: number;
  /** علامة الحصة المشتركة القصوى داخل هذا الدرس. */
  sharedMax: number;
}

/**
 * أرقام توزيع الدرسين الإجمالية — للتوضيح فقط: `possible` هو مجموع توزيع الدرسين
 * (قد يتجاوز مجموع الاختبار بسبب الاحتساب المشترك)، و`sharedPossible` هو الجزء المكرّر.
 * المرجع النهائي لعلامة الطالب ونسبتها يبقى `summary.total` و`summary.max`.
 */
export interface PayloadLessonTotals {
  lessons: number;
  total: number;
  possible: number;
  sharedQuestions: number;
  sharedAwarded: number;
  sharedPossible: number;
  uniquePossible: number;
  examTotal: number;
  examPossible: number;
  note: string;
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
  /** حصيلة الدرسين مع بيان التداخل — لا تُستعمل مقاماً للنسبة. */
  lessonTotals: PayloadLessonTotals;
  details: PayloadDetail[];
  reportText: string;
}

export interface PayloadInput {
  attemptId: string;
  meta: AttemptMeta;
  /** الأسئلة بالترتيب الذي عُرض على الطالب. */
  order: Question[];
  /** إجابات الطالب المجمّدة عند التسليم. */
  answers: Responses;
  /** نتيجة التصحيح نفسها المعروضة للطالب. */
  result: ExamResult;
  /** نصّ التقرير الكامل كما أنتجه buildReport. */
  reportText: string;
  /** مفتاح الإجابات — لتوليد نصّ الإجابة الصحيحة في التفصيل. */
  key: AnswerKey;
}

/** معرّف فريد للمحاولة؛ يتجاهل الخادم تكراره، فإعادة إرسال المحاولة نفسها آمنة. */
export function newAttemptId(): string {
  try {
    const crypto = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
    if (crypto && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  } catch {
    /* متجر قديم أو سياق غير آمن — نستعمل البديل أدناه */
  }
  const rand = () => Math.random().toString(36).slice(2, 10);
  return `${Date.now()}-${rand()}${rand()}`;
}

/** إجابة الطالب مقروءة — بنصّ الخيار الصحيح من بنك الأسئلة، كما في التقرير. */
function answerText(input: Input, answers: Responses): string {
  switch (input.kind) {
    case "choice": {
      const id = (answers[input.id] ?? "").trim();
      if (!id) return "لم تُجب";
      return input.options.find((option) => option.id === id)?.label ?? id;
    }
    case "text":
      return (answers[input.id] ?? "").trim() || "لم تُجب";
    case "tf": {
      const verdict = (answers[`${input.id}:verdict`] ?? "").trim();
      if (!verdict) return "لم تُجب";
      const label = verdict === "true" ? "صحيحة" : "خاطئة";
      const correction = (answers[`${input.id}:correction`] ?? "").trim();
      return correction ? `${label} — التصحيح: ${correction}` : label;
    }
    case "number": {
      const value = (answers[`${input.id}:value`] ?? "").trim();
      const unit = (answers[`${input.id}:unit`] ?? "").trim();
      const steps = (answers[`${input.id}:steps`] ?? "").trim();
      const chunks: string[] = [];
      if (steps) chunks.push(`خطوة الحل: ${steps}`);
      if (value) chunks.push(`${value}${unit ? ` ${unit}` : ""}`);
      return chunks.join(" — ") || "لم تُجب";
    }
    case "matrix": {
      const chosen = input.rows.some((row) => (answers[`${input.id}:${row.id}`] ?? "").trim());
      if (!chosen) return "لم تُجب";
      return input.rows
        .map((row) => {
          const id = (answers[`${input.id}:${row.id}`] ?? "").trim();
          const label = id ? input.columns.find((column) => column.id === id)?.label ?? id : "—";
          return `${row.label}: ${label}`;
        })
        .join("؛ ");
    }
  }
}

/**
 * يبني حمولة الإرسال. كل الأرقام والنصوص تأتي من gradeExam / summarize / gradeLabel
 * (وهي دوالّ حتمية)، فتطابق ما يظهر في صفحة النتيجة وفي ملف التقرير تماماً.
 */
export function buildPayload({
  attemptId,
  meta,
  order,
  answers,
  result,
  reportText,
  key,
}: PayloadInput): SubmissionPayload {
  const sum = summarize(order, answers, result);

  /*
   * الدروس: **الدرسان الأصليان فقط**، ولا فئة ثالثة للسؤال التركيبي.
   * السؤال التركيبي تُضاف علاماته إلى الدرسين معاً، فمجموع `max` قد يتجاوز مجموع
   * الاختبار بمقدار حصته المشتركة؛ ولهذا يُرسَل `shared*` لكل درس و`overlap` للأرقام
   * الإجمالية، بينما يبقى `summary.total` (مجموع الاختبار) هو المرجع للعلامة والنسبة.
   */
  const overlap = lessonOverlap(order, result);
  const lessons: PayloadLesson[] = lessonTotals(order, result).map((row) => ({
    title: row.lesson,
    awarded: row.earned,
    max: row.possible,
    questions: row.questions,
    sharedQuestions: row.sharedQuestions,
    sharedAwarded: row.sharedEarned,
    sharedMax: row.sharedPossible,
  }));

  const details: PayloadDetail[] = order.flatMap((question, questionIndex) => {
    const graded = result.questions[questionIndex];
    const questionKey = key[question.id];
    return question.parts.flatMap((part, partIndex) => {
      const partResult = graded.parts[partIndex];
      return part.inputs.map((input) => {
        const rubric = questionKey.rubric[input.id];
        const gradedInput = graded.inputs.find((item) => item.inputId === input.id);
        const status = partStatus(gradedInput?.earned ?? 0, gradedInput?.possible ?? 0);
        return {
          q: questionIndex + 1,
          qTitle: question.title,
          lessons: question.lesson,
          label: `${richToPlain(part.label)} — ${richToPlain(inputLabel(input))}`,
          status: STATUS_AR[status],
          awarded: gradedInput?.earned ?? partResult.earned,
          marks: gradedInput?.possible ?? partResult.possible,
          studentAnswer: richToPlain(answerText(input, answers)),
          correctAnswer: modelAnswerText(input, rubric),
        };
      });
    });
  });

  return {
    token: SHEETS_TOKEN,
    attemptId,
    examId: EXAM_ID,
    examTitle: EXAM_TITLE,
    studentName: meta.studentName,
    startAt: meta.startAt.toISOString(),
    submitAt: meta.submitAt.toISOString(),
    // ثوانٍ صحيحة بالتقريب نفسه المستعمل في عرض المدة (HH:MM:SS)
    elapsedSec: Math.max(0, Math.floor(meta.elapsedMs / 1000)),
    summary: {
      total: sum.total,
      max: sum.max,
      percentage: sum.percentage,
      gradeLabel: gradeLabel(sum.percentage),
      fullQuestions: sum.fullQuestions,
      partialQuestions: sum.partialQuestions,
      wrongQuestions: sum.wrongQuestions,
      correctSubparts: sum.correctSubparts,
      partialSubparts: sum.partialSubparts,
      wrongSubparts: sum.wrongSubparts,
      unansweredSubparts: sum.unansweredSubparts,
    },
    lessons,
    lessonTotals: {
      lessons: lessons.length,
      total: overlap.earned,
      possible: overlap.possible,
      sharedQuestions: overlap.sharedQuestions,
      sharedAwarded: overlap.sharedEarned,
      sharedPossible: overlap.sharedPossible,
      uniquePossible: overlap.uniquePossible,
      examTotal: overlap.examTotal,
      examPossible: overlap.examPossible,
      note:
        "توزيع الدرسين فقط (بدون فئة ثالثة). السؤال التركيبي يُحتسب في الدرسين معاً، " +
        `فتظهر ${overlap.sharedPossible} علامة مرتين ولا تُجمع الدرسان كمقام؛ مجموع الاختبار هو summary.total من summary.max.`,
    },
    details,
    reportText,
  };
}

/** عدد الأسئلة التركيبية في الاختبار (للتوثيق والاختبارات). */
export function sharedQuestionCount(order: Question[]): number {
  return order.filter((question) => isSharedQuestion(question)).length;
}

/* ------------------------------------------------------------------ */
/* الإرسال                                                             */
/* ------------------------------------------------------------------ */

/** حالة إرسال النتيجة كما تُعرض في صفحة النتيجة. */
export type SendStatus = "idle" | "sending" | "success" | "failed";

/** الانتظار قبل المحاولة الثانية ثم الثالثة (3 محاولات في المجموع). */
export const RETRY_DELAYS_MS: readonly number[] = [2000, 5000];
export const MAX_ATTEMPTS = RETRY_DELAYS_MS.length + 1;
/** مهلة المحاولة الواحدة: اتصال معلّق بلا ردّ يُعدّ فشلاً فتبدأ المحاولة التالية. */
export const ATTEMPT_TIMEOUT_MS = 30000;
/** بادئة مفاتيح الحمولات المعلّقة لهذا الاختبار: pending:<EXAM_ID>:<attemptId> — مصدرها src/config.ts */
export { PENDING_PREFIX };

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

/** بدائل تُحقن في الاختبارات؛ في التطبيق تُستعمل القيم الافتراضية (fetch و localStorage). */
export interface SendOptions {
  fetchImpl?: FetchLike;
  /** null = لا تخزين متاح. */
  storage?: StorageLike | null;
  sleep?: (ms: number) => Promise<void>;
  timeoutMs?: number;
}

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** النجاح فقط إذا قُرئ ردّ الخادم وفيه ok:true — أو duplicate:true (المحاولة مسجّلة عنده من قبل). */
function isAccepted(data: unknown): boolean {
  if (typeof data !== "object" || data === null) return false;
  const reply = data as { ok?: unknown; duplicate?: unknown };
  return reply.ok === true || reply.duplicate === true;
}

/**
 * محاولة إرسال واحدة.
 * النوع text/plain مقصود: application/json يستدعي طلب CORS تمهيدياً (preflight) لا يجيب عنه Apps Script.
 * أي خطأ شبكة، أو ردّ تعذّرت قراءته (CORS)، أو ردّ ليس JSON، أو انتهاء المهلة = فشل.
 */
async function postOnce(body: string, opts: SendOptions): Promise<boolean> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const doFetch: FetchLike = opts.fetchImpl ?? ((url, init) => fetch(url, init));
    const controller = typeof AbortController === "function" ? new AbortController() : null;
    const reply = doFetch(SHEETS_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body,
      redirect: "follow",
      ...(controller ? { signal: controller.signal } : {}),
    }).then((response) => response.text());
    reply.catch(() => {}); // إن انتهت المهلة أولاً فلا يبقى رفض غير معالَج
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        controller?.abort();
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

/** حتى 3 محاولات بالحمولة نفسها والمعرّف نفسه. لا ترمي خطأً أبداً. */
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

/* ---------- التخزين المحلي (كل استدعاء داخل try/catch) ---------- */

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
    return typeof data === "object" && data !== null && !Array.isArray(data) ? (data as SubmissionPayload) : null;
  } catch {
    return null;
  }
}

/**
 * إن أُغلقت الصفحة أو أُخفيت والإرسال ما زال جارياً تُحفظ الحمولة فوراً (بالمفتاح نفسه)،
 * كي لا تضيع نتيجة لم يصل تأكيد استلامها بعد؛ وتُحذف عند نجاح الإرسال.
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
        /* لا شيء */
      }
    };
  } catch {
    return () => {};
  }
}

/**
 * يرسل النتيجة في الخلفية ويعيد true فقط إذا أكّد الخادم الاستلام.
 * إن فشلت المحاولات كلها تُحفظ الحمولة تحت pending:<EXAM_ID>:<attemptId> لتُعاد لاحقاً.
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
 * عند تحميل التطبيق: يعيد بصمت إرسال الحمولات المعلّقة لهذا الاختبار ويحذف ما نجح منها.
 * يعيد عدد ما أُرسل. استدعاؤها أثناء جولة جارية يعيد الجولة نفسها (لا إرسال مزدوج).
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
    for (let index = 0; index < storage.length; index++) {
      const key = storage.key(index);
      if (key && key.startsWith(PENDING_PREFIX)) keys.push(key);
    }
    for (const key of keys) {
      const stored = readPending(storage, key);
      if (!stored) continue;
      // الرمز خاص بنسخة التطبيق الحالية لا بالمحاولة، فيُؤخذ من الإعدادات الحالية
      if (await deliver({ ...stored, token: SHEETS_TOKEN }, opts)) {
        dropPending(key, opts);
        sent++;
      }
    }
  } catch {
    /* صامت: يُعاد في التحميل القادم */
  }
  return sent;
}
