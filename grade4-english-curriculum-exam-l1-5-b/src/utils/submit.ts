/**
 * إرسال نتيجة الطالب إلى المعلّم — تطبيق ويب Google Apps Script يكتب في Google Sheets.
 *
 * هذا الملف يطبّق عقد الإرسال المعتمد في `grade5-math-unit1/src/exam/submit.ts`
 * حرفيًا في أسمائه وحقوله وسلوكه، مع معرّف مستقل للنسخة B:
 *
 *   · buildPayload  — يبني الحمولة بدوالّ التصحيح والتقرير نفسها (لا منطق تصحيح جديد).
 *   · sendWithRetry — يرسلها في الخلفية: حتى 3 محاولات بفاصلين 2 ثم 5 ثوانٍ،
 *                     ويحفظ الحمولة قبل الإرسال، فإن فشلت كلها بقيت في localStorage.
 *   · retryPending  — عند تحميل التطبيق يعيد بصمت إرسال ما بقي معلّقاً لهذا الاختبار.
 *   · onPageExit    — إن أُغلقت الصفحة والإرسال جارٍ تُحفظ الحمولة فوراً.
 *
 * لا يكتب هذا الملف أي شيء في console: بيانات الطلاب لا تُسجَّل.
 * لا يعدّل Apps Script ولا التوكن ولا إعدادات المنصة؛ القيم نفسها المعتمدة في المرجع.
 */
import {
  EXAM_ID,
  EXAM_TITLE,
  PENDING_PREFIX,
  SHEETS_TOKEN,
  SHEETS_URL,
} from '../config';
import { EXAM_QUESTIONS } from '../data/questions';
import { ExamEvaluation } from '../types/exam';
import { generateTxtReport } from './report';
import { formatMark } from './scoring';

/* ------------------------------------------------------------------ */
/* الحمولة — أسماء الحقول يتوقّعها الخادم كما هي (نفس عقد المرجع)      */
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

/** حالات الإجابة العربية الثلاث/الأربع — نصوص المرجع حرفيًا. */
export const STATUS_AR = {
  correct: 'إجابة صحيحة',
  partial: 'إجابة صحيحة جزئياً',
  wrong: 'إجابة خاطئة',
  unanswered: 'لم يُجب',
} as const;

/**
 * سلم التقديرات المعتمد في المنصة — نسخة `grade5-math-unit1/src/exam/report.ts`
 * نفسها بحدودها: 95 / 85 / 75 / 65 / 50.
 */
export function gradeLabel(p: number): string {
  if (p >= 95) return 'ممتاز';
  if (p >= 85) return 'جيد جداً';
  if (p >= 75) return 'جيد';
  if (p >= 65) return 'مقبول';
  if (p >= 50) return 'ضعيف';
  return 'يحتاج إلى دعم';
}

/**
 * النسبة المئوية بالتقريب نفسه المعتمد في المرجع:
 * `Math.round((total / TOTAL_MARKS) * 1000) / 10` — خانة عشرية واحدة.
 * المجموع الكلي لهذا الاختبار 100، فلا يتغيّر الرقم.
 */
export function percentageOf(total: number): number {
  const max = EXAM_QUESTIONS.reduce((sum, q) => sum + q.marks, 0);
  return Math.round((total / max) * 1000) / 10;
}

/** وصف الهدف المطلوب لكل سؤال داخل الحمولة (نصّ السؤال نفسه). */
function questionTitle(index: number): string {
  const question = EXAM_QUESTIONS[index];
  return question.instruction;
}

/** مرجع الدرس داخل الحمولة، كما في المرجع: `Lesson <n>`. */
function lessonNames(lesson: number): string {
  return `Lesson ${lesson}`;
}

/**
 * قيم الحقول الرقمية تُقرَّب إلى خانتين عشريتين — نفس تقريب التصحيح المعروض.
 */
function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * يبني حمولة الإرسال من التصحيح المعروض نفسه (`ExamEvaluation`)، فتطابق
 * الأرقام صفحة النتيجة وملف التقرير تماماً — لا منطق تصحيح ثانٍ هنا.
 */
export function buildPayload(
  evaluation: ExamEvaluation,
  attempt: { attemptId: string; startedAtIso: string }
): SubmissionPayload {
  const details: PayloadDetail[] = evaluation.gradedQuestions.flatMap((gq) =>
    gq.subPartResults.map((spr) => {
      const answered = spr.studentAnswerDisplay !== '(No answer)';
      const status = !answered
        ? STATUS_AR.unanswered
        : spr.isCorrect
          ? STATUS_AR.correct
          : STATUS_AR.wrong;
      return {
        q: gq.examNumber,
        qTitle: questionTitle(gq.examNumber - 1),
        lessons: lessonNames(gq.question.lesson),
        label: spr.subPart.label ?? spr.subPart.id,
        status,
        awarded: round2(spr.earnedMarks),
        marks: round2(spr.maxMarks),
        studentAnswer: spr.studentAnswerDisplay,
        correctAnswer: spr.correctAnswerDisplay,
      };
    })
  );

  const lessonPayload: PayloadLesson[] = evaluation.lessonScores.map((ls) => ({
    title: ls.title,
    awarded: round2(ls.earnedMarks),
    max: ls.maxMarks,
  }));

  return {
    token: SHEETS_TOKEN,
    attemptId: attempt.attemptId,
    examId: EXAM_ID,
    examTitle: EXAM_TITLE,
    studentName: evaluation.studentName,
    startAt: attempt.startedAtIso,
    submitAt: evaluation.submittedAtIso,
    elapsedSec: Math.max(0, Math.floor(evaluation.elapsedMs / 1000)),
    summary: {
      total: round2(evaluation.totalEarnedMarks),
      max: evaluation.totalMaxMarks,
      percentage: percentageOf(evaluation.totalEarnedMarks),
      gradeLabel: gradeLabel(percentageOf(evaluation.totalEarnedMarks)),
      // تقييم المرجع: «صحيح» = السؤال كامل العلامة، «جزئي» = بعض العلامة،
      // و«خاطئ» = بقية الأسئلة (وتشمل غير المجابة) — مثل `wrongQuestions` في المرجع.
      fullQuestions: evaluation.correctQuestionCount,
      partialQuestions: evaluation.partialQuestionCount,
      wrongQuestions: evaluation.totalQuestions - evaluation.correctQuestionCount - evaluation.partialQuestionCount,
      // في المرجع `partialSubparts` صفر دائماً لأن الفروع تُقيَّم صح/خطأ فقط،
      // وكذلك هنا: كل فرع إمّا صحيح أو خاطئ، ولا درجات جزئية داخل الفرع.
      correctSubparts: details.filter((d) => d.status === STATUS_AR.correct).length,
      partialSubparts: 0,
      wrongSubparts: details.filter((d) => d.status === STATUS_AR.wrong).length,
      unansweredSubparts: details.filter((d) => d.status === STATUS_AR.unanswered).length,
    },
    lessons: lessonPayload,
    details,
    reportText: generateTxtReport(evaluation),
  };
}

/** رقم مقروء للتحقق (يُستعمل في الاختبارات والتقرير فقط). */
export const TOTAL_MARKS = 100;
export const payloadMarkTotal = (payload: SubmissionPayload): string =>
  `${formatMark(payload.summary.total)} / ${formatMark(payload.summary.max)}`;

/* ------------------------------------------------------------------ */
/* الإرسال                                                             */
/* ------------------------------------------------------------------ */

/** حالة إرسال النتيجة كما تُعرض في صفحة النتيجة. */
export type SendStatus = 'idle' | 'sending' | 'success' | 'failed';

/** الانتظار قبل المحاولة الثانية ثم الثالثة (3 محاولات في المجموع). */
export const RETRY_DELAYS_MS: readonly number[] = [2000, 5000];
export const MAX_ATTEMPTS = RETRY_DELAYS_MS.length + 1;
/** مهلة المحاولة الواحدة: اتصال معلّق بلا ردّ يُعدّ فشلاً فتبدأ المحاولة التالية. */
export const ATTEMPT_TIMEOUT_MS = 30000;
/** بادئة مفاتيح الحمولات المعلّقة لهذا الاختبار: pending:<EXAM_ID>:<attemptId> */
export { PENDING_PREFIX };

export function pendingKey(attemptId: string): string {
  return PENDING_PREFIX + attemptId;
}

export type FetchLike = (
  url: string,
  init: RequestInit
) => Promise<Pick<Response, 'text'>>;

export interface StorageLike {
  readonly length: number;
  key(index: number): string | null;
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/** بدائل تُحقن في الاختبارات؛ في التطبيق تُستعمل القيم الافتراضية. */
export interface SendOptions {
  fetchImpl?: FetchLike;
  /** null = لا تخزين متاح. */
  storage?: StorageLike | null;
  sleep?: (ms: number) => Promise<void>;
  timeoutMs?: number;
  /** المحاولة التي أُرسلت من صفحتها كي لا يعيدها الفحص الدوري فوراً. */
  excludeAttemptId?: string;
}

/** هل الإرسال مُهيّأ (رابط الخدمة والتوكن موجودان)؟ */
export const canSend = Boolean(SHEETS_URL && SHEETS_TOKEN);

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** النجاح فقط إذا قُرئ ردّ الخادم وفيه ok:true — أو duplicate:true. */
function isAccepted(data: unknown): boolean {
  if (typeof data !== 'object' || data === null) return false;
  const reply = data as { ok?: unknown; duplicate?: unknown };
  return reply.ok === true || reply.duplicate === true;
}

/**
 * محاولة إرسال واحدة.
 * النوع text/plain مقصود: application/json يستدعي طلب CORS تمهيدياً (preflight)
 * لا يجيب عنه Apps Script.
 */
async function postOnce(body: string, opts: SendOptions): Promise<boolean> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const doFetch: FetchLike = opts.fetchImpl ?? ((url, init) => fetch(url, init));
    const ctrl = typeof AbortController === 'function' ? new AbortController() : null;
    const reply = doFetch(SHEETS_URL, {
      method: 'POST',
      // text/plain يتجنّب طلب CORS التمهيدي الذي لا يجيب عنه Google Apps Script.
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body,
      redirect: 'follow',
      ...(ctrl ? { signal: ctrl.signal } : {}),
    }).then((res) => res.text());
    reply.catch(() => {}); // إن انتهت المهلة أولاً فلا يبقى رفض غير معالَج
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
    return typeof window !== 'undefined' && window.localStorage ? window.localStorage : null;
  } catch {
    return null;
  }
}

export function savePending(payload: SubmissionPayload, opts: SendOptions = {}): void {
  try {
    storageOf(opts)?.setItem(pendingKey(payload.attemptId), JSON.stringify(payload));
  } catch {
    /* التخزين غير متاح أو ممتلئ */
  }
}

export function isPending(attemptId: string, opts: SendOptions = {}): boolean {
  try {
    return Boolean(attemptId) && storageOf(opts)?.getItem(pendingKey(attemptId)) !== null;
  } catch {
    return false;
  }
}

export function removePending(attemptId: string, opts: SendOptions = {}): void {
  try {
    storageOf(opts)?.removeItem(pendingKey(attemptId));
  } catch {
    /* التخزين غير متاح */
  }
}

function readPending(storage: StorageLike, key: string): SubmissionPayload | null {
  try {
    const raw = storage.getItem(key);
    const data: unknown = raw ? JSON.parse(raw) : null;
    return typeof data === 'object' && data !== null && !Array.isArray(data)
      ? (data as SubmissionPayload)
      : null;
  } catch {
    return null;
  }
}

/**
 * إن أُغلقت الصفحة أو أُخفيت والإرسال ما زال جارياً تُحفظ الحمولة فوراً،
 * كي لا تضيع نتيجة لم يصل تأكيد استلامها بعد؛ وتُحذف عند نجاح الإرسال.
 */
export function onPageExit(save: () => void): () => void {
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

/**
 * يرسل النتيجة في الخلفية ويعيد true فقط إذا أكّد الخادم الاستلام.
 * الحمولة تُحفظ **قبل** الإرسال، وتُحذف عند النجاح، وتبقى عند الفشل
 * تحت pending:<EXAM_ID>:<attemptId> لتُعاد لاحقاً. لا ترمي خطأً أبداً.
 */
export async function sendWithRetry(
  payload: SubmissionPayload,
  opts: SendOptions = {}
): Promise<boolean> {
  savePending(payload, opts);
  const stopWatching = onPageExit(() => savePending(payload, opts));
  const ok = await deliver(payload, opts);
  stopWatching();
  if (ok) removePending(payload.attemptId, opts);
  return ok;
}

let flushing: Promise<number> | null = null;

/** عند تحميل التطبيق: يعيد بصمت إرسال الحمولات المعلّقة لهذا الاختبار فقط. */
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
      if (!stored.attemptId || stored.attemptId === opts.excludeAttemptId) continue;
      // الرمز خاص بنسخة التطبيق الحالية لا بالمحاولة، فيُؤخذ من الإعدادات الحالية
      if (await deliver({ ...stored, token: SHEETS_TOKEN }, opts)) {
        try {
          storage.removeItem(key);
        } catch {
          /* التخزين غير متاح */
        }
        sent++;
      }
    }
  } catch {
    /* صامت: يُعاد في التحميل القادم */
  }
  return sent;
}

/* ---------- إيصال الإرسال الناجح (يمنع إعادة الإرسال عند التحديث) ---------- */

export function sentReceiptKey(attemptId: string, prefix: string): string {
  return `${prefix}${attemptId}`;
}

export function hasSentReceipt(attemptId: string): boolean {
  try {
    const storage = typeof window !== 'undefined' ? window.localStorage : null;
    return Boolean(attemptId) && storage?.getItem(`sent:${EXAM_ID}:${attemptId}`) === '1';
  } catch {
    return false;
  }
}

export function markSentReceipt(attemptId: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(`sent:${EXAM_ID}:${attemptId}`, '1');
    }
  } catch {
    /* الإيصال اختياري */
  }
}
