/**
 * حفظ المحاولة محلياً واستعادتها — معزول بهذا الاختبار وحده.
 *
 * · المفتاح الرئيسي `<EXAM_ID>:attempt:v1`، وإعداد الصوت `<EXAM_ID>:sound:v1`.
 * · التحقّق صارم عند القراءة: أي محاولة بصيغة غير متوقّعة تُهمَل بلا كسر الواجهة.
 * · كل عمليات التخزين داخل try/catch: التطبيق يعمل طبيعياً إذا كان التخزين محجوباً أو ممتلئاً.
 */

import { ATTEMPT_KEY, SOUND_KEY } from "../config";
import type { Responses } from "./grading";

export type AttemptStatus = "in_progress" | "submitted";

export type Attempt = {
  version: 1;
  examId: string;
  status: AttemptStatus;
  studentName: string;
  responses: Responses;
  questionIndex: number;
  startedAt: number;
  finishedAt?: number;
};

const QUESTION_COUNT = 10;

function storage(): Storage | null {
  try {
    return typeof window !== "undefined" && window.localStorage ? window.localStorage : null;
  } catch {
    return null;
  }
}

/**
 * يقرأ المحاولة المحفوظة.
 * @param examId معرّف الاختبار المتوقّع — يمنع تسرّب بيانات اختبار آخر إلى هنا.
 */
export function loadAttempt(examId: string, questionCount = QUESTION_COUNT): Attempt | null {
  try {
    const raw = storage()?.getItem(ATTEMPT_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    const value = parsed as Partial<Attempt>;
    if (value.version !== 1 || value.examId !== examId) return null;
    if (value.status !== "in_progress" && value.status !== "submitted") return null;
    if (typeof value.studentName !== "string" || !value.studentName.trim()) return null;
    if (typeof value.startedAt !== "number" || !Number.isFinite(value.startedAt)) return null;
    if (
      typeof value.questionIndex !== "number" ||
      !Number.isInteger(value.questionIndex) ||
      value.questionIndex < 0 ||
      value.questionIndex >= Math.max(1, questionCount)
    ) {
      return null;
    }
    if (!value.responses || typeof value.responses !== "object" || Array.isArray(value.responses)) {
      return null;
    }
    if (Object.values(value.responses).some((response) => typeof response !== "string")) return null;
    if (
      value.status === "submitted" &&
      (typeof value.finishedAt !== "number" || !Number.isFinite(value.finishedAt) || value.finishedAt < value.startedAt)
    ) {
      return null;
    }
    return value as Attempt;
  } catch {
    return null;
  }
}

export function saveAttempt(attempt: Attempt): boolean {
  try {
    const store = storage();
    if (!store) return false;
    store.setItem(ATTEMPT_KEY, JSON.stringify(attempt));
    return true;
  } catch {
    return false;
  }
}

export function clearAttempt(): void {
  try {
    storage()?.removeItem(ATTEMPT_KEY);
  } catch {
    /* التخزين غير متاح */
  }
}

export function loadMuted(): boolean {
  try {
    return storage()?.getItem(SOUND_KEY) === "true";
  } catch {
    return false;
  }
}

export function saveMuted(value: boolean): void {
  try {
    storage()?.setItem(SOUND_KEY, String(value));
  } catch {
    /* يبقى الإعداد في الذاكرة */
  }
}

/** هل ثمّة محاولة محفوظة مكتملة؟ (تُستعمل لاختبار الاستعادة بدون كشف الإجابات). */
export function hasStoredAttempt(): boolean {
  try {
    return storage()?.getItem(ATTEMPT_KEY) !== null;
  } catch {
    return false;
  }
}
