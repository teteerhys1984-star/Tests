/**
 * إرسال نتيجة الطالب إلى المعلّم (تطبيق ويب Google Apps Script يكتب في Google Sheets).
 *
 * هذا الملف يطبّق آلية الإرسال نفسها المستعملة في الاختبار المرجعي grade5-math-unit1
 * دون تغيير عقد البيانات: أسماء الحقول وبنية الحمولة والتوكن ونوع المحتوى والرموز
 * ومهلة المحاولة وسياسة إعادة المحاولة والتخزين المحلي كلها كما هي.
 *
 *  · buildPayload  — يبني الحمولة من نتيجة التصحيح والتقرير نفسيهما (لا منطق تصحيح جديد هنا).
 *  · sendWithRetry — يرسلها في الخلفية: 3 محاولات بفاصلين 2 ثم 5 ثوانٍ، ومهلة 30 ثانية
 *                    لكل محاولة، فإن فشلت كلها حُفظت في localStorage.
 *  · retryPending  — عند تحميل التطبيق يعيد بصمت إرسال ما بقي معلّقاً لهذا الاختبار.
 *
 * لا يكتب هذا الملف أي شيء في console: بيانات الطلاب لا تُسجَّل.
 */
import { EXAM_ID, SHEETS_TOKEN, SHEETS_URL } from '../config';
import { FinalGradingReport, ExamSessionState } from '../types/exam';

/* ------------------------------------------------------------------ */
/* الحمولة — أسماء الحقول يتوقّعها الخادم كما هي                       */
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
  /** معرّف المحاولة نفسه المستعمل في التخزين المحلي؛ لا يتغيّر عند إعادة الإرسال. */
  attemptId: string;
  /** حالة الجلسة المجمّدة عند التسليم (الاسم والتوقيتات والمدة). */
  session: ExamSessionState;
  /** نتيجة التصحيح الكاملة للاختبار. */
  report: FinalGradingReport;
  /** نص التقرير الكامل كما أنتجه generateReportText. */
  reportText: string;
}

/** تسميات حالات الفروع — قيم الحالة نفسها المستعملة في الاختبار المرجعي grade5-math-unit1. */
export const STATUS_AR: Record<string, string> = {
  correct: 'إجابة صحيحة',
  partial: 'إجابة صحيحة جزئياً',
  incorrect: 'إجابة خاطئة',
  unanswered: 'لم يُجب'
};

/**
 * التقدير الوصفي لنسبة الطالب — حدود الاختبار المرجعي grade5-math-unit1 حرفيًا.
 * يُرسل للمعلّم داخل الحمولة فقط، ولا يظهر للطالب ولا في تقرير الطالب.
 */
export function gradeLabel(p: number): string {
  if (p >= 95) return 'ممتاز';
  if (p >= 85) return 'جيد جداً';
  if (p >= 75) return 'جيد';
  if (p >= 65) return 'مقبول';
  if (p >= 50) return 'ضعيف';
  return 'يحتاج إلى دعم';
}

/* ------------------------------------------------------------------ */
/* تحويل النصوص إلى صياغة صريحة (بلا LaTeX) للإرسال                    */
/* ------------------------------------------------------------------ */

export function latexToPlain(tex: string): string {
  let t = tex;
  for (let i = 0; i < 4; i += 1) {
    t = t.replace(/\\[dt]?frac\s*\{([^{}]*)\}\s*\{([^{}]*)\}/g, '($1)/($2)');
    t = t.replace(/\\sqrt\s*\{([^{}]*)\}/g, '√($1)');
  }
  t = t
    .replace(/\\left|\\right/g, '')
    .replace(/\\times/g, '×')
    .replace(/\\div/g, '÷')
    .replace(/\\cdot/g, '·')
    .replace(/\\pm/g, '±')
    .replace(/\\neq|\\ne/g, '≠')
    .replace(/\\leq|\\le/g, '≤')
    .replace(/\\geq|\\ge/g, '≥')
    .replace(/\\approx/g, '≈')
    .replace(/\\widehat/g, '∠')
    .replace(/\\(?:quad|qquad|,|;|!|:)/g, ' ')
    .replace(/\\text\s*\{([^{}]*)\}/g, '$1')
    .replace(/\^\{([^{}]*)\}/g, '^($1)')
    .replace(/\^(-?\d+)/g, '^$1')
    .replace(/_\{([^{}]*)\}/g, '_($1)')
    .replace(/\\vec\s*\{([^{}]*)\}/g, '→$1')
    .replace(/\\[a-zA-Z]+/g, ' ')
    .replace(/[{}]/g, '')
    .replace(/[ \t]+/g, ' ')
    .trim();
  return t;
}

/** يحوّل نصاً يحتوي على $...$ وأو على LaTeX خام إلى نص صريح للإرسال إلى المعلّم. */
export function plainText(input: string): string {
  if (!input) return '';
  let result = '';
  let rest = input;
  while (rest.length > 0) {
    const start = rest.indexOf('$');
    if (start < 0) {
      result += rest;
      break;
    }
    const end = rest.indexOf('$', start + 1);
    if (end < 0) {
      result += rest;
      break;
    }
    result += rest.slice(0, start);
    result += latexToPlain(rest.slice(start + 1, end));
    rest = rest.slice(end + 1);
  }
  return latexToPlain(result)
    .replace(/[ \t]+/g, ' ')
    .replace(/\s+([،:؛.!؟])/g, '$1')
    .trim() || '—';
}

/* ------------------------------------------------------------------ */
/* بناء الحمولة                                                        */
/* ------------------------------------------------------------------ */

/** مجموع علامات كل درس (الفروع تنتمي إلى درس السؤال نفسه). */
function lessonTotals(report: FinalGradingReport): PayloadLesson[] {
  const rows: PayloadLesson[] = [];
  const index = new Map<string, PayloadLesson>();
  for (const qr of report.questionResults) {
    const title = qr.curriculumRef.lesson;
    let row = index.get(title);
    if (!row) {
      row = { title, awarded: 0, max: 0 };
      index.set(title, row);
      rows.push(row);
    }
    row.awarded += qr.earnedMarks;
    row.max += qr.totalMarks;
  }
  return rows.map(row => ({ ...row, awarded: Math.round(row.awarded * 100) / 100 }));
}

/**
 * يبني حمولة الإرسال. كل الأرقام والنصوص تأتي من نتيجة التصحيح ونص التقرير
 * (وهما ناتجان حتميان من نفس البيانات)، فتطابق ما يظهر في صفحة النتيجة تماماً.
 *
 * ملاحظة موثّقة: الاختبار الأصلي مجموع علامات فروعه 101 بينما تعرض واجهته
 * وتقريره «من 100»؛ تُرسَل الحمولة بنفس أرقام التقرير حرفياً دون تعديل العلامات.
 */
export function buildPayload({ attemptId, session, report, reportText }: PayloadInput): SubmissionPayload {
  const fullQuestions = report.questionResults.filter(q => q.earnedMarks >= q.totalMarks).length;
  const wrongQuestions = report.questionResults.filter(q => q.earnedMarks === 0).length;
  const partialQuestions = report.questionResults.length - fullQuestions - wrongQuestions;

  return {
    token: SHEETS_TOKEN,
    attemptId,
    examId: EXAM_ID,
    examTitle: report.examTitle,
    studentName: report.studentName,
    startAt: new Date(session.startTime ?? Date.now()).toISOString(),
    submitAt: new Date(session.submissionTime ?? Date.now()).toISOString(),
    // ثوانٍ صحيحة بالتقريب نفسه المستعمل في عرض المدة (HH:MM:SS)
    elapsedSec: Math.max(0, Math.floor(session.elapsedSeconds ?? 0)),
    summary: {
      total: report.totalScore,
      max: 100,
      percentage: report.percentage,
      gradeLabel: gradeLabel(report.percentage),
      fullQuestions,
      partialQuestions,
      wrongQuestions,
      correctSubparts: report.counts.correct,
      partialSubparts: report.counts.partial,
      wrongSubparts: report.counts.incorrect,
      unansweredSubparts: report.counts.unanswered
    },
    // أرقام توزيع العلامات على الدروس كما تُستخرج من مراجع المناهج في التقرير
    lessons: lessonTotals(report),
    // مدخل واحد لكل فرع، بصياغة صريحة للنص نفسه الوارد في التقرير
    details: report.questionResults.flatMap(qr =>
      qr.subpartResults.map(sub => ({
        q: qr.questionNumber,
        qTitle: plainText(qr.title),
        lessons: qr.curriculumRef.lesson,
        label: sub.subpartNumber,
        status: STATUS_AR[sub.status],
        awarded: sub.marksEarned,
        marks: sub.marksAllocated,
        studentAnswer: plainText(sub.studentAnswer),
        correctAnswer: plainText(sub.correctAnswer)
      }))
    ),
    reportText
  };
}

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
export const PENDING_PREFIX = `pending:${EXAM_ID}:`;

export function pendingKey(attemptId: string): string {
  return PENDING_PREFIX + attemptId;
}

export type FetchLike = (url: string, init: RequestInit) => Promise<Pick<Response, 'text'>>;

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

const wait = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

/** النجاح فقط إذا قُرئ ردّ الخادم وفيه ok:true — أو duplicate:true (المحاولة مسجّلة عنده من قبل). */
function isAccepted(data: unknown): boolean {
  if (typeof data !== 'object' || data === null) return false;
  const reply = data as { ok?: unknown; duplicate?: unknown };
  return reply.ok === true || reply.duplicate === true;
}

/**
 * محاولة إرسال واحدة.
 * النوع text/plain مقصود: application/json يستدعي طلب CORS تمهيدياً (preflight)
 * لا يجيب عنه Apps Script.
 * أي خطأ شبكة، أو ردّ تعذّرت قراءته (CORS)، أو ردّ ليس JSON، أو انتهاء المهلة = فشل (false).
 */
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
      ...(ctrl ? { signal: ctrl.signal } : {})
    }).then(res => res.text());
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

/* ---------- التخزين المحلي (كل استدعاء داخل try/catch: التطبيق يعمل طبيعياً بلا تخزين) ---------- */

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

/**
 * إن أُغلقت الصفحة أو أُخفيت والإرسال ما زال جارياً تُحفظ الحمولة فوراً (بالمفتاح نفسه),
 * كي لا تضيع نتيجة لم يصل تأكيد استلامها بعد؛ وتُحذف عند نجاح الإرسال.
 */
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

/** هل توجد حمولة معلّقة لهذا المحاولة؟ (تُستعمل لاستعادة حالة الإرسال عند فتح الصفحة) */
export function hasPending(attemptId: string, opts: SendOptions = {}): boolean {
  try {
    const storage = storageOf(opts);
    return !!storage && storage.getItem(pendingKey(attemptId)) != null;
  } catch {
    return false;
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
