/**
 * إرسال نتيجة الطالب إلى المعلّم (تطبيق ويب Google Apps Script يكتب في Google Sheets).
 *
 * العقد المرجعي نفسه المستخدم في grade5-math-unit1:
 *   · buildPayload — تبني الحمولة من دوالّ التصحيح والتقرير القائمة نفسها (لا منطق تصحيح جديد هنا).
 *   · sendWithRetry — إرسال في الخلفية: حتى 3 محاولات بفاصلين 2 ثم 5 ثوانٍ ومهلة 30 ثانية للمحاولة.
 *   · retryPending — عند تحميل التطبيق يُعاد بصمت إرسال الحمولات المعلّقة لهذا الاختبار وتُحذف بعد النجاح.
 *
 * لا يُسجل شيء في وحدة التحكم، وفشل الإرسال لا يمنع ظهور النتيجة أو تنزيل التقرير.
 */
import { EXAM_ID, EXAM_TITLE, SHEETS_TOKEN, SHEETS_URL } from "../config";
import {
  ALL_BRANCHES,
  TOTAL_MARKS,
  type Answers,
  type ExamQuestion,
} from "./examData";
import {
  gradeExam,
  getFeedback,
  isBranchAnswered,
  isBranchCorrect,
} from "./grading";
import { buildReport } from "./report";
import { PENDING_SUBMISSION_PREFIX } from "./storage";

/* ------------------------------------------------------------------ */
/* الحمولة — أسماء الحقول تتطابق مع عقد الإرسال المرجعي للمنصة          */
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

export interface AttemptMeta {
  studentName: string;
  startedAt: number;
  submittedAt: number;
  elapsedMs: number;
}

export interface PayloadInput {
  attemptId: string;
  meta: AttemptMeta;
  /** الأسئلة بالترتيب الذي عُرض على الطالب (يُحتفظ به للتوافق مع عقد الإرسال المرجعي). */
  order: ExamQuestion[];
  /** إجابات الطالب المجمّدة عند التسليم. */
  answers: Answers;
}

/** معرّف فريد للمحاولة؛ يُعاد استخدامه عند إعادة الإرسال، لذا الخادم يتجاهل التكرّر. */
export function newAttemptId(): string {
  try {
    const c = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
    if (c && typeof c.randomUUID === "function") return c.randomUUID();
  } catch {
    /* متصفح قديم أو سياق غير آمن — استخدم البديل أدناه */
  }
  const rand = () => Math.random().toString(36).slice(2, 10);
  return `${Date.now()}-${rand()}${rand()}`;
}

/**
 * يبني حمولة الإرسال. كل الأرقام والنصوص تأتي من gradeExam / buildReport / getFeedback
 * (دوالّ حتمية)، فتطابق صفحة النتيجة وملف التقرير بالضبط.
 */
export function buildPayload({ attemptId, meta, answers }: PayloadInput): SubmissionPayload {
  const result = gradeExam(
    meta.studentName,
    answers,
    meta.submittedAt,
    Math.max(0, Math.floor(meta.elapsedMs / 1000))
  );
  const reportText = buildReport(result);
  const feedback = getFeedback(result.score);

  const lessonOrder = [1, 2, 3, 4, 5, 18] as const;
  const lessons: PayloadLesson[] = lessonOrder.map((lesson) => {
    const lessonBranches = ALL_BRANCHES.filter(({ branch }) => branch.lesson === lesson);
    const max = lessonBranches.reduce((sum, item) => sum + item.branch.marks, 0);
    const awarded = lessonBranches.reduce(
      (sum, item) =>
        sum + (isBranchCorrect(item.branch, answers[item.branch.id]) ? item.branch.marks : 0),
      0
    );
    return { title: `Lesson ${lesson}`, awarded, max };
  });

  const details: PayloadDetail[] = ALL_BRANCHES.map(({ question, branch }) => {
    const answer = answers[branch.id];
    const answered = isBranchAnswered(branch, answer);
    const correct = answered && isBranchCorrect(branch, answer);
    const status = answered ? (correct ? "Correct" : "Incorrect") : "Not answered";
    return {
      q: question.number,
      qTitle: question.title,
      lessons: question.lessons.map((lesson) => `Lesson ${lesson}`).join(" + "),
      label: branch.skill,
      status,
      awarded: correct ? branch.marks : 0,
      marks: branch.marks,
      studentAnswer: answered
        ? Array.isArray(answer)
          ? answer.join(" ")
          : String(answer)
        : "No answer",
      correctAnswer: branch.displayCorrect,
    };
  });

  const correctSubparts = result.correctCount;
  const unansweredSubparts = details.filter((item) => item.status === "Not answered").length;
  const wrongSubparts = details.filter((item) => item.status === "Incorrect").length;

  const fullQuestions = result.questionResults.filter(
    (question) => question.earned === question.totalMarks
  ).length;
  const wrongQuestions = result.questionResults.filter(
    (question) => question.earned === 0
  ).length;
  const partialQuestions = Math.max(0, result.questionResults.length - fullQuestions - wrongQuestions);

  return {
    token: SHEETS_TOKEN,
    attemptId,
    examId: EXAM_ID,
    examTitle: EXAM_TITLE,
    studentName: meta.studentName,
    startAt: new Date(meta.startedAt).toISOString(),
    submitAt: new Date(meta.submittedAt).toISOString(),
    // ثوانٍ صحيحة بالتقريب نفسه المستعمل في عرض المدة (HH:MM:SS)
    elapsedSec: Math.max(0, Math.floor(meta.elapsedMs / 1000)),
    summary: {
      total: result.score,
      max: TOTAL_MARKS,
      percentage: result.percentage,
      gradeLabel: feedback.headline,
      fullQuestions,
      partialQuestions,
      wrongQuestions,
      correctSubparts,
      partialSubparts: 0,
      wrongSubparts,
      unansweredSubparts,
    },
    lessons,
    details,
    reportText,
  };
}

/* ------------------------------------------------------------------ */
/* الإرسال                                                             */
/* ------------------------------------------------------------------ */

/** حالة إرسال النتيجة كما تُعرض في صفحة النتيجة. */
export type SendStatus = "idle" | "sending" | "success" | "failed";

/** الانتظار قبل المحاولة الثانية ثم الثالثة (3 محاولات في المجموع). */
export const RETRY_DELAYS_MS: readonly number[] = [2000, 5000];
export const MAX_ATTEMPTS = RETRY_DELAYS_MS.length + 1;
/** مهلة المحاولة الواحدة: اتصال معلّق بلا رد يُعد فشلاً وتبدأ المحاولة التالية. */
export const ATTEMPT_TIMEOUT_MS = 30000;
/** بادئة مفاتيح الحمولات المعلّقة لهذا الاختبار: pending:<EXAM_ID>:<attemptId> */
export const PENDING_PREFIX = PENDING_SUBMISSION_PREFIX;

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

/**
 * النجاح فقط إذا قُرئ ردّ الخادم وفيه ok:true — أو duplicate:true (المحاولة مسجّلة عنده من قبل).
 * النوع text/plain مقصود: application/json يستدعي طلب CORS تمهيدياً لا يجيب عنه Apps Script.
 */
function isAccepted(data: unknown): boolean {
  if (typeof data !== "object" || data === null) return false;
  const reply = data as { ok?: unknown; duplicate?: unknown };
  return reply.ok === true || reply.duplicate === true;
}

/** محاولة إرسال واحدة. أي خطأ شبكة أو مهلة أو ردّ غير مقبول = فشل (false). */
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
    reply.catch(() => {}); // إن انتهت المهلة أولاً فلا يبقى رفض غير معالَج
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
    /* يُعد فشلاً */
  }
  return false;
}

/* ---------- التخزين المحلي (كل استدعاء داخل try/catch: التطبيق يعمل طبيعياً بلا تخزين) ---------- */

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
    /* لا شيء */
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
 * لا ترمي خطأً أبداً.
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
 * عند تحميل التطبيق: يُعاد بصمت إرسال الحمولات المعلّقة لهذا الاختبار ويُحذف ما نجح منها.
 * يعيد عدد ما أُرسل. استدعاؤه أثناء جولة جارية يعيد نفس الجولة (لا إرسال مزدوج).
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
      if (!stored) continue;
      // الرمز خاص بنسخة التطبيق الحالية لا بالمحاولة، فيؤخذ من الإعدادات الحالية
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
