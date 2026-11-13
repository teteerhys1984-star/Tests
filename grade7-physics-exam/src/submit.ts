/**
 * إرسال نتيجة الطالب إلى المعلّم (تطبيق ويب Google Apps Script يكتب في Google Sheets).
 *
 * نقل حرفي لعقد الاختبار المرجعي grade5-math-unit1 (src/exam/submit.ts): الطلب نفسه، وأسماء
 * حقول الحمولة وترتيبها وأنواعها نفسها، وقواعد المحاولات والتخزين نفسها.
 *
 *  · buildPayload  — يبني الحمولة من نتائج التصحيح والتقرير القائمين؛ لا منطق تصحيح جديد هنا.
 *  · sendWithRetry — يرسلها في الخلفية: حتى 3 محاولات بفاصلين 2 ثم 5 ثوانٍ، ومهلة 30 ثانية
 *                    للمحاولة، فإن فشلت كلها حُفظت الحمولة في localStorage.
 *  · retryPending  — عند تحميل التطبيق يعيد بصمت إرسال ما بقي معلّقاً لهذا الاختبار.
 *
 * المحاولة الواحدة تُرسَل بالمعرّف نفسه دائماً، وطلب جارٍ لا يُرسَل مرّتين بالتوازي.
 * لا يكتب هذا الملف أي شيء في console: بيانات الطلاب لا تُسجَّل.
 */
import { EXAM_ID, EXAM_TITLE, SHEETS_TOKEN, SHEETS_URL } from "./config";
// @ts-expect-error — exam-data.js و report.js ملفّا JavaScript أصليّان بلا أنواع (وهما مصدر التصحيح)
import { EXAM_META, PART_LABELS, QUESTIONS } from "./exam-data.js";
// @ts-expect-error — انظر السطر أعلاه
import * as R from "./report.js";

/* ------------------------------------------------------------------ */
/* الحمولة — أسماء الحقول يتوقّعها الخادم كما هي                        */
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
  /** بداية الاختبار (ms). */
  startTs: number;
  /** لحظة التسليم (ms). */
  submitTs: number;
  /** الأسئلة بالترتيب الذي عُرض على الطالب. */
  questions: any[];
  /** نتيجة gradeExam للأسئلة والإجابات نفسها. */
  results: any;
  /** علامات الأسئلة كاملة (مجموع علامات الأسئلة المعروضة). */
  maxMarks: number;
  /** نص التقرير الكامل كما تنزّله صفحة النتيجة (buildReport). */
  reportText: string;
}

/**
 * سلّم التقدير المعتمد في grade5-math-unit1 (حرفياً).
 * يُرسَل إلى المعلّم داخل summary فقط: لا يظهر للطالب (لم يكن في واجهة هذا الاختبار)،
 * ولا يُكتب في تقرير TXT، ولا يؤثر في العلامات.
 */
export function gradeLabel(percentage: number): string {
  if (percentage >= 95) return "ممتاز";
  if (percentage >= 85) return "جيد جداً";
  if (percentage >= 75) return "جيد";
  if (percentage >= 65) return "مقبول";
  if (percentage >= 50) return "ضعيف";
  return "يحتاج إلى دعم";
}

/**
 * «الدروس» في حمولة الإرسال = أسئلة الاختبار الرئيسية، بالترتيب الذي عرضه الاختبار.
 * هذا الاختبار لا يحوي دروساً مرقّمة مثل الاختبار المرجعي، فأقرب مكافئ لعنوان الدرس
 * وعلامته هو السؤال الرئيسي وعلامته (والاختبار يسمّيها «الأسئلة الرئيسية وأجزاؤها»).
 * تُستعمل للتوزيع المرسل للمعلّم فقط، ولا تظهر للطالب ولا في تقرير TXT.
 */
export function lessonTotals(questions: any[], results: any): PayloadLesson[] {
  return questions.map((question) => {
    const awarded = results.details
      .filter((detail: any) => detail.qid === question.id)
      .reduce((sum: number, detail: any) => sum + detail.awarded, 0);
    return { title: plainMath(question.title), awarded: Math.round(awarded * 100) / 100, max: question.marks };
  });
}

/** نص صرف بلا علامتَي الترميز الرياضي ⟦⟧ (مثل plainMath في الاختبار المرجعي). */
function plainMath(text: unknown): string {
  return String(text ?? "").replace(/⟦|⟧/g, "");
}

/** التسمية العربية لحالة الجزء، من الجدول نفسه الذي يكتب به التقرير. */
function statusOf(status: string): string {
  return (R.STATUS_AR as Record<string, string>)[status] ?? status;
}

/**
 * يبني حمولة الإرسال.
 * كل الأرقام والنصوص تأتي من النتيجة والتقرير القائمين (لا حساب جديد)،
 * والأسئلة وأجزاؤها بالترتيب الذي رآه الطالب.
 */
export function buildPayload({
  attemptId,
  studentName,
  startTs,
  submitTs,
  questions,
  results,
  maxMarks,
  reportText,
}: PayloadInput): SubmissionPayload {
  const counts = results.counts;
  let fullQuestions = 0;
  let partialQuestions = 0;
  let wrongQuestions = 0;
  for (const question of questions) {
    const awarded = results.details
      .filter((detail: any) => detail.qid === question.id)
      .reduce((sum: number, detail: any) => sum + detail.awarded, 0);
    if (awarded >= question.marks) fullQuestions += 1;
    else if (awarded > 0) partialQuestions += 1;
    else wrongQuestions += 1;
  }

  const details: PayloadDetail[] = results.details.map((detail: any) => ({
    q: detail.qNumber,
    qTitle: plainMath(detail.qTitle),
    lessons: plainMath(detail.qTitle),
    label: "",
    status: statusOf(detail.status),
    awarded: detail.awarded,
    marks: detail.part.marks,
    studentAnswer: plainMath(detail.studentText),
    correctAnswer: plainMath(detail.correctText),
  }));

  // التسمية (أ، ب، ج، د…) بالترتيب داخل كل سؤال، كما في التقرير وصفحة المراجعة.
  let indexInQuestion = 0;
  let previousQid: string | null = null;
  results.details.forEach((detail: any, index: number) => {
    if (detail.qid !== previousQid) {
      previousQid = detail.qid;
      indexInQuestion = 0;
    }
    details[index].label = PART_LABELS[indexInQuestion] ?? String(indexInQuestion + 1);
    indexInQuestion += 1;
  });

  return {
    token: SHEETS_TOKEN,
    attemptId,
    examId: EXAM_ID,
    examTitle: EXAM_TITLE,
    studentName,
    startAt: new Date(startTs).toISOString(),
    submitAt: new Date(submitTs).toISOString(),
    // ثوانٍ صحيحة، كما تُعرض المدة في صفحة النتيجة (HH:MM:SS)
    elapsedSec: Math.max(0, Math.floor((submitTs - startTs) / 1000)),
    summary: {
      total: results.score,
      max: maxMarks,
      percentage: Math.round(results.percent * 10) / 10,
      gradeLabel: gradeLabel(results.percent),
      fullQuestions,
      partialQuestions,
      wrongQuestions,
      correctSubparts: counts.correct,
      partialSubparts: counts.partial,
      wrongSubparts: counts.incorrect,
      unansweredSubparts: counts.unanswered,
    },
    lessons: lessonTotals(questions, results),
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
/** مهلة المحاولة الواحدة: اتصال معلّق بلا ردّ يُعدّ فشلاً فتبدأ المحاولة التالية. */
export const ATTEMPT_TIMEOUT_MS = 30000;
/** بادئة مفاتيح الحمولات المعلّقة لهذا الاختبار: pending:<EXAM_ID>:<attemptId> */
export const PENDING_PREFIX = `pending:${EXAM_ID}:`;

export function pendingKey(attemptId: string): string {
  return PENDING_PREFIX + attemptId;
}

/** معرّف فريد للمحاولة؛ يتجاهل الخادم تكراره، فإعادة إرسال المحاولة نفسها آمنة. */
export function newAttemptId(): string {
  try {
    const c = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
    if (c && typeof c.randomUUID === "function") return c.randomUUID();
  } catch {
    /* متصفح قديم أو سياق غير آمن — نستعمل البديل أدناه */
  }
  const rand = () => Math.random().toString(36).slice(2, 10);
  return `${Date.now()}-${rand()}${rand()}`;
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
 * أي خطأ شبكة، أو ردّ تعذّرت قراءته (CORS)، أو ردّ ليس JSON، أو انتهاء المهلة = فشل (false).
 */
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
async function runDelivery(payload: SubmissionPayload, opts: SendOptions): Promise<boolean> {
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

/**
 * المحاولة الجارية تُعاد نتائجها لكل من يطلبها: صفحة النتيجة، وزر «إعادة إرسال النتيجة»،
 * وجولة إعادة إرسال المعلّق — فلا يُرسَل الطلب نفسه مرّتين بالتوازي أبداً.
 */
const deliveriesInProgress = new Map<string, Promise<boolean>>();

function deliver(payload: SubmissionPayload, opts: SendOptions): Promise<boolean> {
  const id = String(payload.attemptId);
  const running = deliveriesInProgress.get(id);
  if (running) return running;
  const run = runDelivery(payload, opts).then((ok) => {
    deliveriesInProgress.delete(id);
    return ok;
  });
  deliveriesInProgress.set(id, run);
  return run;
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

/** الحمولة المحفوظة لمحاولة لم يصل تأكيد إرسالها بعد، إن وُجدت. */
export function pendingPayload(attemptId: string, opts: SendOptions = {}): SubmissionPayload | null {
  try {
    const storage = storageOf(opts);
    return storage ? readPending(storage, pendingKey(attemptId)) : null;
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
 * إن فشلت المحاولات كلها تُحفظ الحمولة تحت pending:<EXAM_ID>:<attemptId> لتُعاد لاحقاً. لا ترمي خطأً أبداً.
 */
export async function sendWithRetry(payload: SubmissionPayload, opts: SendOptions = {}): Promise<boolean> {
  const stopWatching = onPageExit(() => savePending(payload, opts));
  const ok = await deliver(payload, opts);
  stopWatching();
  if (ok) dropPending(pendingKey(payload.attemptId), opts);
  else savePending(payload, opts);
  return ok;
}

let pendingRound: Promise<number> | null = null;

/**
 * عند تحميل التطبيق: يعيد بصمت إرسال الحمولات المعلّقة لهذا الاختبار ويحذف ما نجح منها.
 * يعيد عدد ما أُرسل. استدعاؤها أثناء جولة جارية يعيد الجولة نفسها (لا إرسال مزدوج).
 */
export function retryPending(opts: SendOptions = {}): Promise<number> {
  if (!pendingRound) {
    pendingRound = flushPending(opts).finally(() => {
      pendingRound = null;
    });
  }
  return pendingRound;
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

/* ------------------------------------------------------------------ */
/* التقرير                                                             */
/* ------------------------------------------------------------------ */

/**
 * يبني تقرير TXT بالدالة الأصلية نفسها (buildReport)، بلا أي تغيير في نصّه.
 * جلسة التقرير تحتاج attemptId اسماً بديلاً عندما لا يكون معرّف المحاولة معروفاً بعد.
 */
export function buildAttemptReport(input: {
  questions: any[];
  answers: Record<string, unknown>;
  results: any;
  studentName: string;
  startTs: number;
  submitTs: number;
  attemptId: string;
}): string {
  return R.buildReport({
    meta: EXAM_META,
    questions: input.questions,
    answers: input.answers,
    session: {
      attemptId: input.attemptId,
      studentName: input.studentName,
      startTs: input.startTs,
      submitTs: input.submitTs,
    },
    results: input.results,
  });
}

/** الأسئلة بالترتيب المعروض (بنك الأسئلة لا يُخلط في هذا الاختبار، لكن الترتيب يُمرَّر صراحةً). */
export function questionsInOrder(): any[] {
  return QUESTIONS.slice();
}
