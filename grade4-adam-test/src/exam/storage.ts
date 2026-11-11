import { QUESTIONS, STORAGE_KEY } from "./data";
import type { Attempt } from "./types";

export interface LoadResult {
  attempt: Attempt | null;
  warning: string | null;
  storageAvailable: boolean;
}

export function storageAvailable(): boolean {
  try {
    const test = "__adam_math_test__";
    window.localStorage.setItem(test, "1");
    window.localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

export function loadAttempt(): LoadResult {
  if (!storageAvailable()) {
    return {
      attempt: null,
      warning: "تعذّر الحفظ التلقائي في هذا المتصفح؛ قد تُفقد الإجابات عند إعادة التحميل.",
      storageAvailable: false,
    };
  }
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return {
      attempt: null,
      warning: "تعذّر الوصول إلى بيانات الحفظ في هذا المتصفح. يمكنك متابعة الاختبار لكن الحفظ التلقائي غير متاح.",
      storageAvailable: false,
    };
  }
  if (!raw) return { attempt: null, warning: null, storageAvailable: true };

  try {
    const parsed = JSON.parse(raw) as Partial<Attempt>;
    const validOrder =
      Array.isArray(parsed.questionOrder) &&
      parsed.questionOrder.length === QUESTIONS.length &&
      QUESTIONS.every((q) => parsed.questionOrder!.includes(q.id));
    const valid =
      parsed.schema === 2 &&
      parsed.examId === "adam-math-grade4-minecraft" &&
      typeof parsed.attemptId === "string" &&
      parsed.attemptId.length > 0 &&
      typeof parsed.studentName === "string" &&
      parsed.studentName.trim().length > 0 &&
      (parsed.phase === "exam" || parsed.phase === "results") &&
      validOrder;
    if (!valid) {
      return {
        attempt: null,
        warning:
          "توجد بيانات محفوظة غير مكتملة أو غير متوافقة، ولم يتم حذفها. ابدأ محاولة جديدة عند الضغط على زر البدء.",
        storageAvailable: true,
      };
    }
    const restored: Attempt = {
      schema: 2,
      examId: "adam-math-grade4-minecraft",
      examVersion: parsed.examVersion ?? "1.0.0",
      attemptId: parsed.attemptId!,
      studentName: parsed.studentName!,
      phase: parsed.phase!,
      questionOrder: parsed.questionOrder!,
      optionOrders: parsed.optionOrders ?? {},
      answers: parsed.answers ?? {},
      currentIndex:
        typeof parsed.currentIndex === "number" && parsed.currentIndex >= 0 && parsed.currentIndex < 30
          ? parsed.currentIndex
          : 0,
      visited: Array.isArray(parsed.visited) ? parsed.visited : [],
      reviewing: Boolean(parsed.reviewing),
      startTime: typeof parsed.startTime === "number" ? parsed.startTime : Date.now(),
      submissionTime: parsed.submissionTime,
      durationSeconds: parsed.durationSeconds,
      startSoundPlayed: Boolean(parsed.startSoundPlayed),
      submissionSoundPlayed: Boolean(parsed.submissionSoundPlayed),
      reportText: parsed.reportText,
      reportFileName: parsed.reportFileName,
    };
    if (restored.phase === "results" && (!restored.reportText || !restored.reportFileName)) {
      return {
        attempt: null,
        warning:
          "توجد نتيجة محفوظة ناقصة، ولم يتم حذفها. يمكنك بدء محاولة جديدة عند الضغط على زر البدء.",
        storageAvailable: true,
      };
    }
    return { attempt: restored, warning: null, storageAvailable: true };
  } catch {
    return {
      attempt: null,
      warning:
        "تعذّرت قراءة البيانات المحفوظة، ولم يتم حذفها. يمكنك بدء محاولة جديدة عند الضغط على زر البدء.",
      storageAvailable: true,
    };
  }
}

export function saveAttempt(attempt: Attempt): { ok: boolean; error?: string } {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(attempt));
    return { ok: true };
  } catch {
    return {
      ok: false,
      error: "تعذّر حفظ بيانات المحاولة في هذا المتصفح (قد تكون مساحة التخزين ممتلئة). أكمل الاختبار ونزّل التقرير بعد التسليم.",
    };
  }
}

export function clearAttempt(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // storage failure is reported by saveAttempt/loadAttempt
  }
}

export function makeAttemptId(): string {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
  } catch {
    // fall through
  }
  return `attempt-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
