/**
 * حفظ المحاولة محلياً واستعادتها — معزول بهذا الاختبار وحده.
 *
 * · المفتاح الرئيسي `<EXAM_ID>:attempt:v1`، وإعداد الصوت `<EXAM_ID>:sound:v1`.
 * · التحقّق صارم عند القراءة: أي محاولة بصيغة غير متوقّعة، أو تحمل معرّف اختبار
 *   آخر (مثل Model B)، تُهمَل بلا كسر الواجهة.
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
export function loadAttempt(examId: string, questionCount: number): Attempt | null {
  try {
    const raw = storage()?.getItem(ATTEMPT_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    const attempt = parsed as Partial<Attempt>;
    if (attempt.version !== 1 || attempt.examId !== examId) return null;
    if (attempt.status !== "in_progress" && attempt.status !== "submitted") return null;
    if (typeof attempt.studentName !== "string" || !attempt.studentName.trim()) return null;
    if (typeof attempt.startedAt !== "number" || !Number.isFinite(attempt.startedAt)) return null;
    if (
      typeof attempt.questionIndex !== "number" ||
      !Number.isInteger(attempt.questionIndex) ||
      attempt.questionIndex < 0 ||
      attempt.questionIndex >= Math.max(1, questionCount)
    ) {
      return null;
    }
    if (!attempt.responses || typeof attempt.responses !== "object" || Array.isArray(attempt.responses)) return null;
    if (Object.values(attempt.responses).some((response) => typeof response !== "string")) return null;
    if (
      attempt.status === "submitted" &&
      (typeof attempt.finishedAt !== "number" ||
        !Number.isFinite(attempt.finishedAt) ||
        attempt.finishedAt < attempt.startedAt)
    ) {
      return null;
    }
    return attempt as Attempt;
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

/** هل ثمّة محاولة محفوظة؟ (تُستعمل في الاختبارات دون كشف إجابات). */
export function hasStoredAttempt(): boolean {
  try {
    return storage()?.getItem(ATTEMPT_KEY) !== null;
  } catch {
    return false;
  }
}
