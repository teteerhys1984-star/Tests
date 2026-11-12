import type {
  AnswerValue,
  Attempt,
  ExamResult,
  Question,
  Subpart,
  SubpartResult,
  SubpartStatus,
} from "../types";
import {
  EXAM_ID,
  EXAM_TITLE,
  EXAM_VERSION,
  TOTAL_MARKS,
  TOTAL_SUBPARTS,
  allSubparts,
  questions,
} from "../data/questions";

export const ATTEMPT_KEY = "mia-math-g6:grade6:attempt:v1";
export const RESULT_KEY = "mia-math-g6:grade6:result:v1";
export const ENDPOINT_KEY = "mia-math-g6:grade6:meta:v1";

/* ------------------------------------------------------------------ */
/* Digits and normalization                                            */
/* ------------------------------------------------------------------ */

const ARABIC_INDIC = "٠١٢٣٤٥٦٧٨٩";
const PERSIAN_INDIAN = "۰۱۲۳۴۵۶۷۸۹";

export function toWesternDigits(input: string): string {
  return input.replace(/[٠-٩۰-۹]/g, (d) => {
    const ai = ARABIC_INDIC.indexOf(d);
    if (ai >= 0) return String(ai);
    return String(PERSIAN_INDIAN.indexOf(d));
  });
}

export function normalizeText(input: string): string {
  return toWesternDigits(input)
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670\u0640]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[×xX✕*]/g, "*")
    .replace(/٫/g, ".")
    .replace(/٬/g, ",")
    .replace(/[\[\]\(\)\{\}<>«»"']/g, " ")
    .replace(/[\s_\-–—،,.;:!?]+/g, "");
}

export function normalizeNumeric(input: string): number | null {
  let s = toWesternDigits(input).trim();
  if (!s) return null;
  s = s.replace(/٬/g, ",").replace(/٫/g, ".").replace(/[ \u00A0\u202F]/g, "");
  // Allow a trailing unit word without turning it into a number.
  s = s.replace(/(سم|سم²|سم2|م|م²|م2|ليرة|كغ|كيلوغرام|كيلوغراماً|درجة|°)$/g, "");
  // A single comma followed by 1–2 decimals is a decimal comma.
  if (!s.includes(".") && /^-?\d+,\d{1,2}$/.test(s)) s = s.replace(",", ".");
  else s = s.replace(/,/g, "");
  if (!/^-?\d+(\.\d+)?$/.test(s)) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

/* ------------------------------------------------------------------ */
/* Answers                                                             */
/* ------------------------------------------------------------------ */

export function isSubpartAnswered(subpart: Subpart, value: AnswerValue): boolean {
  if (value === null || value === undefined) return false;
  if (Array.isArray(value)) return value.length === (subpart.items?.length ?? 0);
  return value.trim().length > 0;
}

export function countAnswered(attempt: Attempt, bank: Question[] = questions): number {
  return bank.reduce(
    (total, q) =>
      total +
      q.subparts.filter((s) => isSubpartAnswered(s, attempt.answers[s.id] ?? null)).length,
    0,
  );
}

export function totalSubparts(bank: Question[] = questions): number {
  return bank.reduce((n, q) => n + q.subparts.length, 0);
}

/* ------------------------------------------------------------------ */
/* Attempt creation and validation                                     */
/* ------------------------------------------------------------------ */

export function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function createAttempt(studentName: string): Attempt {
  const questionOrder = shuffle(questions.map((q) => q.id));
  const optionOrders: Record<string, string[]> = {};
  allSubparts.forEach(({ subpart }) => {
    if (subpart.type === "mcq" && subpart.options) {
      optionOrders[subpart.id] = shuffle(subpart.options.map((o) => o.value));
    }
  });
  const answers: Record<string, AnswerValue> = {};
  allSubparts.forEach(({ subpart }) => {
    answers[subpart.id] = subpart.type === "ordering" ? [] : null;
  });
  const now = Date.now();
  return {
    examId: EXAM_ID,
    version: EXAM_VERSION,
    attemptId: `attempt-${now}-${Math.random().toString(36).slice(2, 8)}`,
    studentName,
    startedAt: now,
    savedAt: now,
    currentIndex: 0,
    visited: [0],
    questionOrder,
    optionOrders,
    answers,
    mode: "exam",
  };
}

export function questionsInOrder(attempt: Attempt, bank: Question[] = questions): Question[] {
  const byId = new Map(bank.map((q) => [q.id, q]));
  return attempt.questionOrder
    .map((id) => byId.get(id))
    .filter((q): q is Question => Boolean(q));
}

export function optionValuesFor(attempt: Attempt, subpart: Subpart): string[] {
  const canonical = subpart.options?.map((o) => o.value) ?? [];
  const stored = attempt.optionOrders[subpart.id];
  if (
    stored &&
    stored.length === canonical.length &&
    canonical.every((v) => stored.includes(v))
  ) {
    return stored;
  }
  return canonical;
}

export function isAttemptValid(value: unknown): value is Attempt {
  if (!value || typeof value !== "object") return false;
  const a = value as Partial<Attempt>;
  if (a.examId !== EXAM_ID) return false;
  if (typeof a.studentName !== "string" || !a.studentName.trim()) return false;
  if (typeof a.startedAt !== "number" || !Number.isFinite(a.startedAt)) return false;
  if (!Array.isArray(a.questionOrder) || a.questionOrder.length !== questions.length)
    return false;
  const wanted = new Set(questions.map((q) => q.id));
  if (!a.questionOrder.every((id) => wanted.has(id))) return false;
  if (typeof a.currentIndex !== "number") return false;
  if (!a.answers || typeof a.answers !== "object") return false;
  return true;
}

/* ------------------------------------------------------------------ */
/* Grading                                                             */
/* ------------------------------------------------------------------ */

function matchesTarget(subpart: Subpart, value: string, target: string): boolean {
  if (subpart.type === "numeric") {
    const a = normalizeNumeric(value);
    const b = normalizeNumeric(target);
    if (a === null || b === null) return false;
    const tolerance = subpart.tolerance ?? 0.001;
    return Math.abs(a - b) <= tolerance;
  }
  if (subpart.type === "text") {
    const n = normalizeText(value);
    if (!n) return false;
    const targets = new Set<string>([
      normalizeText(target),
      ...(subpart.textAnswers ?? []).map(normalizeText),
    ]);
    return targets.has(n);
  }
  return value === target;
}

function matchesSubpart(subpart: Subpart, value: AnswerValue): boolean {
  if (!isSubpartAnswered(subpart, value)) return false;
  const correct = subpart.correct;
  if (Array.isArray(value) || Array.isArray(correct)) {
    if (!Array.isArray(value) || !Array.isArray(correct)) return false;
    return value.length === correct.length && value.every((v, i) => v === correct[i]);
  }
  if (typeof value !== "string") return false;
  return matchesTarget(subpart, value, correct);
}

export function optionLabel(subpart: Subpart, value: string | null): string {
  if (value === null || value === undefined || value === "") return "—";
  if (subpart.type === "mcq" || subpart.type === "tf") {
    return subpart.options?.find((o) => o.value === value)?.label ?? value;
  }
  return value;
}

export function formatNumberDisplay(value: string): string {
  if (/^-?\d+$/.test(value)) {
    return new Intl.NumberFormat("en-US").format(Number(value));
  }
  return value;
}

export function displayAnswer(subpart: Subpart, value: AnswerValue): string {
  if (!isSubpartAnswered(subpart, value)) return "—";
  if (Array.isArray(value)) return value.join(" ، ");
  if (typeof value !== "string") return "—";
  if (subpart.type === "numeric") return formatNumberDisplay(value);
  return optionLabel(subpart, value);
}

export function correctAnswerDisplay(subpart: Subpart): string {
  const correct = subpart.correct;
  if (Array.isArray(correct)) return correct.join(" ، ");
  if (subpart.type === "numeric") return formatNumberDisplay(correct);
  return optionLabel(subpart, correct);
}

function judgeSubpart(subpart: Subpart, value: AnswerValue): Omit<SubpartResult, "questionId" | "subpartId" | "prompt" | "explanation" | "page"> {
  const base = {
    max: subpart.marks,
    studentDisplay: displayAnswer(subpart, value),
    correctDisplay: correctAnswerDisplay(subpart),
  };
  if (!isSubpartAnswered(subpart, value)) {
    return { ...base, status: "unanswered" as SubpartStatus, awarded: 0 };
  }
  if (matchesSubpart(subpart, value)) {
    return { ...base, status: "correct" as SubpartStatus, awarded: subpart.marks };
  }
  const raw = Array.isArray(value) ? null : value;
  if (raw && subpart.accepted?.length) {
    const alt = subpart.accepted.find((a) => matchesTarget(subpart, raw, a.value));
    if (alt) {
      if (alt.marks >= subpart.marks) {
        return { ...base, status: "correct" as SubpartStatus, awarded: subpart.marks };
      }
      return {
        ...base,
        status: "partial" as SubpartStatus,
        awarded: Math.max(0, Math.min(alt.marks, subpart.marks)),
      };
    }
  }
  return { ...base, status: "incorrect" as SubpartStatus, awarded: 0 };
}

export function gradeAttempt(attempt: Attempt): ExamResult {
  const bank = questionsInOrder(attempt);
  const subparts: SubpartResult[] = [];
  let score = 0;
  bank.forEach((q) => {
    q.subparts.forEach((sp) => {
      const judged = judgeSubpart(sp, attempt.answers[sp.id] ?? null);
      score += judged.awarded;
      subparts.push({
        ...judged,
        questionId: q.id,
        subpartId: sp.id,
        prompt: sp.prompt,
        explanation: sp.explanation,
        page: sp.page,
      });
    });
  });
  const counts = { correct: 0, partial: 0, incorrect: 0, unanswered: 0 };
  subparts.forEach((s) => {
    counts[s.status] += 1;
  });
  return {
    examId: EXAM_ID,
    version: attempt.version,
    attemptId: attempt.attemptId,
    studentName: attempt.studentName,
    startedAt: attempt.startedAt,
    submittedAt: Date.now(),
    durationMs: Math.max(0, Date.now() - attempt.startedAt),
    score,
    maxScore: TOTAL_MARKS,
    percentage: Math.round((score / TOTAL_MARKS) * 10000) / 100,
    counts,
    subparts,
    questionOrder: [...attempt.questionOrder],
    answers: { ...attempt.answers },
    optionOrders: { ...attempt.optionOrders },
  };
}

export function isResultValid(value: unknown): value is ExamResult {
  if (!value || typeof value !== "object") return false;
  const r = value as Partial<ExamResult>;
  return (
    r.examId === EXAM_ID &&
    typeof r.studentName === "string" &&
    typeof r.score === "number" &&
    typeof r.startedAt === "number" &&
    typeof r.submittedAt === "number" &&
    Array.isArray(r.subparts) &&
    r.subparts.length === TOTAL_SUBPARTS
  );
}

/* ------------------------------------------------------------------ */
/* Storage                                                             */
/* ------------------------------------------------------------------ */

export interface StorageState<T> {
  value: T | null;
  warning: string | null;
}

export function probeStorage(): boolean {
  try {
    const k = `${ENDPOINT_KEY}:probe`;
    window.localStorage.setItem(k, "ok");
    const read = window.localStorage.getItem(k);
    window.localStorage.removeItem(k);
    return read === "ok";
  } catch {
    return false;
  }
}

export function loadAttempt(): StorageState<Attempt> {
  try {
    const raw = window.localStorage.getItem(ATTEMPT_KEY);
    if (!raw) return { value: null, warning: null };
    const parsed: unknown = JSON.parse(raw);
    if (!isAttemptValid(parsed)) {
      return {
        value: null,
        warning: "توجد بيانات محاولة محفوظة لكنها غير مكتملة، فتعذّر استعادتها.",
      };
    }
    // Repair missing answer keys without erasing existing answers.
    const repaired: Attempt = {
      ...parsed,
      answers: { ...parsed.answers },
      optionOrders: { ...(parsed.optionOrders ?? {}) },
      visited: Array.isArray(parsed.visited) ? parsed.visited : [0],
    };
    allSubparts.forEach(({ subpart }) => {
      if (!(subpart.id in repaired.answers)) {
        repaired.answers[subpart.id] = subpart.type === "ordering" ? [] : null;
      }
    });
    return { value: repaired, warning: null };
  } catch {
    return {
      value: null,
      warning: "تعذّر قراءة بيانات المحاولة المحفوظة من متصفحك.",
    };
  }
}

export function loadResult(): StorageState<ExamResult> {
  try {
    const raw = window.localStorage.getItem(RESULT_KEY);
    if (!raw) return { value: null, warning: null };
    const parsed: unknown = JSON.parse(raw);
    if (!isResultValid(parsed)) {
      return { value: null, warning: "تعذّر استعادة نتيجة سابقة محفوظة." };
    }
    // A result saved before delivery existed carries no delivery state.
    if (parsed.delivery !== "pending" && parsed.delivery !== "sent" && parsed.delivery !== "failed") {
      delete parsed.delivery;
    }
    return { value: parsed, warning: null };
  } catch {
    return { value: null, warning: "تعذّر قراءة النتيجة المحفوظة من متصفحك." };
  }
}

export function saveAttempt(attempt: Attempt): boolean {
  try {
    const payload = {
      ...attempt,
      savedAt: Date.now(),
      elapsedMs: Math.max(0, Date.now() - attempt.startedAt),
    };
    window.localStorage.setItem(ATTEMPT_KEY, JSON.stringify(payload));
    return true;
  } catch {
    return false;
  }
}

export function saveResult(result: ExamResult): boolean {
  try {
    window.localStorage.setItem(RESULT_KEY, JSON.stringify(result));
    return true;
  } catch {
    return false;
  }
}

export function clearAttemptAndResult(): boolean {
  try {
    window.localStorage.removeItem(ATTEMPT_KEY);
    window.localStorage.removeItem(RESULT_KEY);
    return true;
  } catch {
    return false;
  }
}

/* ------------------------------------------------------------------ */
/* Formatting                                                          */
/* ------------------------------------------------------------------ */

export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

export function formatTimestamp(ms: number): string {
  const d = new Date(ms);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(
    d.getMinutes(),
  )}:${p(d.getSeconds())}`;
}

export function sanitizeStudentNameForFile(name: string): string {
  const cleaned = name
    .trim()
    .replace(/[\\/:*?"<>|\u0000-\u001F]/g, "")
    .replace(/[.\s]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80);
  return cleaned || "Student";
}

export function reportFilename(studentName: string): string {
  return `Grade6_Mathematics_Mia_Report_${sanitizeStudentNameForFile(studentName)}.txt`;
}

/**
 * Converts the inline $...$ math used by the UI into readable plain text for
 * the UTF-8 TXT report, where LaTeX delimiters would be noise for teachers.
 */
export function texToPlain(text: string): string {
  return text.replace(/\$([^$]+)\$/g, (_match, tex: string) =>
    tex
      .replace(/\\,/g, " ")
      .replace(/\\;/g, " ")
      .replace(/\\!/g, "")
      .replace(/\\quad/g, " ")
      .replace(/\\times/g, "×")
      .replace(/\\div/g, "÷")
      .replace(/\\parallel/g, "∥")
      .replace(/\\perp/g, "⊥")
      .replace(/\\ne(q)?/g, "≠")
      .replace(/\\lt/g, "<")
      .replace(/\\gt/g, ">")
      .replace(/\\le/g, "≤")
      .replace(/\\ge/g, "≥")
      .replace(/\\ldots/g, "…")
      .replace(/\\widehat\{([^}]*)\}/g, "$1̂")
      .replace(/\\hat\{([^}]*)\}/g, "$1̂")
      .replace(/\\overline\{([^}]*)\}/g, "$1")
      .replace(/\\[a-zA-Z]+/g, "")
      .replace(/[{}]/g, "")
      .replace(/\s+/g, " ")
      .trim(),
  );
}

const STATUS_LABEL: Record<SubpartStatus, string> = {
  correct: "صحيحة",
  partial: "صحيحة جزئياً",
  incorrect: "خاطئة",
  unanswered: "دون إجابة",
};

export function buildReport(result: ExamResult): string {
  const lines: string[] = [];
  const sep = "════════════════════════════════════════════════════════════";
  const sub = "────────────────────────────────────────────────────────────";
  lines.push("\uFEFF" + "ميا والرياضيات — تقرير نتيجة الاختبار");
  lines.push(sep);
  lines.push(`عنوان الاختبار: ${EXAM_TITLE}`);
  lines.push("الصف: السادس الأساسي");
  lines.push("المبحث: الرياضيات");
  lines.push(`معرّف الاختبار: ${EXAM_ID}`);
  lines.push(`إصدار الاختبار: ${EXAM_VERSION}`);
  lines.push(`معرّف المحاولة: ${result.attemptId}`);
  lines.push(`اسم الطالب: ${result.studentName}`);
  lines.push(`وقت البدء: ${formatTimestamp(result.startedAt)}`);
  lines.push(`وقت التسليم: ${formatTimestamp(result.submittedAt)}`);
  lines.push(`المدة الزمنية: ${formatDuration(result.durationMs)}`);
  lines.push("");
  lines.push(`الدرجة النهائية: ${result.score} / ${result.maxScore}`);
  lines.push(`النسبة المئوية: ${result.percentage.toFixed(2)}%`);
  lines.push(
    `الأجزاء الصحيحة: ${result.counts.correct} | الجزئية: ${result.counts.partial} | الخاطئة: ${result.counts.incorrect} | دون إجابة: ${result.counts.unanswered}`,
  );
  lines.push(`عدد الأسئلة: ${result.questionOrder.length} | عدد الأجزاء: ${TOTAL_SUBPARTS}`);
  lines.push("");
  lines.push("ملاحظة: أُنشئ هذا التقرير محلياً في متصفح الطالب، وتُرسَل النتيجة أيضاً إلكترونياً إلى المعلّم عند التسليم.");
  lines.push(sep);
  lines.push("تفاصيل الأسئلة والأجزاء");
  lines.push(sep);

  const byQuestion = new Map<number, SubpartResult[]>();
  result.subparts.forEach((s) => {
    const arr = byQuestion.get(s.questionId) ?? [];
    arr.push(s);
    byQuestion.set(s.questionId, arr);
  });

  result.questionOrder.forEach((questionId, index) => {
    const question = questions.find((q) => q.id === questionId);
    if (!question) return;
    const items = byQuestion.get(questionId) ?? [];
    const earned = items.reduce((sum, s) => sum + s.awarded, 0);
    lines.push("");
    lines.push(`السؤال ${index + 1} من ${result.questionOrder.length} — [${question.topic}]`);
    lines.push(`الدرجة: ${earned} / ${question.marks}`);
    lines.push(`نص السؤال: ${texToPlain(question.stem)}`);
    if (question.figure) lines.push(`الشكل المرفق: ${question.figure}`);
    items.forEach((item, sIndex) => {
      lines.push(sub);
      lines.push(`  الجزء ${sIndex + 1} (${item.subpartId})`);
      lines.push(`  نص الجزء: ${texToPlain(item.prompt)}`);
      lines.push(`  إجابة الطالب: ${texToPlain(item.studentDisplay)}`);
      lines.push(`  الإجابة الصحيحة: ${texToPlain(item.correctDisplay)}`);
      lines.push(`  الدرجة الممنوحة: ${item.awarded} / ${item.max}`);
      lines.push(`  الحالة: ${STATUS_LABEL[item.status]}`);
      lines.push(`  الشرح: ${texToPlain(item.explanation)}`);
      lines.push(`  المرجع الداخلي: ${item.page}`);
    });
  });

  lines.push("");
  lines.push(sep);
  lines.push(
    `المجموع من الأجزاء: ${result.subparts.reduce((sum, x) => sum + x.awarded, 0)} من ${TOTAL_MARKS}`,
  );
  lines.push("نهاية التقرير — ميا والرياضيات");
  return lines.join("\r\n");
}

export function validateReport(report: string, result: ExamResult): string[] {
  const errors: string[] = [];
  if (!report || report.length < 1000) errors.push("التقرير قصير جداً.");
  if (!report.includes("ميا والرياضيات")) errors.push("عنوان الاختبار مفقود.");
  if (!report.includes(result.studentName)) errors.push("اسم الطالب مفقود.");
  if (!report.includes(`الدرجة النهائية: ${result.score} / ${result.maxScore}`))
    errors.push("الدرجة النهائية مفقودة أو غير مطابقة.");
  if (!report.includes(EXAM_TITLE)) errors.push("عنوان الاختبار الرسمي مفقود.");
  if (!report.includes(result.attemptId)) errors.push("معرّف المحاولة مفقود.");
  if (!report.includes(`وقت التسليم: ${formatTimestamp(result.submittedAt)}`))
    errors.push("وقت التسليم مفقود.");
  const statusCount = (report.match(/الحالة:/g) ?? []).length;
  if (statusCount !== result.subparts.length)
    errors.push(`عدد الأجزاء في التقرير ${statusCount} لا يساوي ${result.subparts.length}.`);
  result.subparts.forEach((s) => {
    if (!report.includes(`(${s.subpartId})`)) errors.push(`الجزء ${s.subpartId} مفقود.`);
    if (!report.includes(`المرجع الداخلي: ${s.page}`))
      errors.push(`المرجع الداخلي للجزء ${s.subpartId} مفقود.`);
  });
  return errors;
}

export function triggerDownload(content: string, filename: string): boolean {
  try {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.rel = "noopener";
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 15000);
    return true;
  } catch {
    return false;
  }
}

export const STATUS_TEXT = STATUS_LABEL;
export const storageKeys = { ATTEMPT_KEY, RESULT_KEY };
