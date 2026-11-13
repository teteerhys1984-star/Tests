import type { Answers, OptionOrder } from './exam';
import { EXAM_META } from './exam';

export const STORAGE_KEY = 'grade8-algebra-unit1-2_attempt_v1';

export interface StoredAttempt {
  schemaVersion: 1;
  examId: string;
  examVersion: string;
  attemptId: string;
  studentName: string;
  status: 'active' | 'submitted';
  answers: Answers;
  currentIndex: number;
  visited: number[];
  optionOrder: OptionOrder;
  questionOrder: string[];
  activeView?: 'exam' | 'review';
  startedAt: number;
  submittedAt: number | null;
  elapsedMs: number | null;
  startCuePlayed: boolean;
  submissionCuePlayed: boolean;
  reportFilename: string | null;
  /** نتيجة آخر إرسال للنتيجة إلى المعلّم (اتجاهل «sending» لأنه حالة مؤقتة). */
  sendOutcome?: 'success' | 'failed';
  resultSummary?: {
    earned: number;
    max: number;
    percentage: number;
    counts: { correct: number; partial: number; incorrect: number; unanswered: number };
  };
  lastSavedAt: number;
}

export interface LoadResult {
  attempt: StoredAttempt | null;
  error: string | null;
}

function isAttempt(value: unknown): value is StoredAttempt {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    v.schemaVersion === 1 &&
    typeof v.examId === 'string' &&
    typeof v.examVersion === 'string' &&
    typeof v.attemptId === 'string' &&
    typeof v.studentName === 'string' &&
    (v.status === 'active' || v.status === 'submitted') &&
    typeof v.answers === 'object' &&
    typeof v.optionOrder === 'object' &&
    typeof v.currentIndex === 'number' &&
    typeof v.startedAt === 'number' &&
    (v.activeView === undefined || v.activeView === 'exam' || v.activeView === 'review') &&
    (v.sendOutcome === undefined || v.sendOutcome === 'success' || v.sendOutcome === 'failed')
  );
}

export function loadAttempt(): LoadResult {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return { attempt: null, error: 'تعذر الوصول إلى التخزين المحلي في هذا المتصفح.' };
    }
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { attempt: null, error: null };
    const parsed: unknown = JSON.parse(raw);
    if (!isAttempt(parsed)) {
      return { attempt: null, error: 'وجدت بيانات محاولة غير مكتملة أو تالفة، ولم يتم استبدالها تلقائيًا.' };
    }
    if (parsed.examId !== EXAM_META.id || parsed.examVersion !== EXAM_META.version) {
      return { attempt: null, error: 'توجد محاولة محفوظة من إصدار آخر من الاختبار. لن تُستبدل إلا عند بدء محاولة جديدة.' };
    }
    return { attempt: parsed, error: null };
  } catch {
    return { attempt: null, error: 'تعذرت قراءة المحاولة المحفوظة من التخزين المحلي.' };
  }
}

export function saveAttempt(attempt: StoredAttempt): boolean {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return false;
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...attempt, lastSavedAt: Date.now() }));
    return true;
  } catch {
    return false;
  }
}

export function clearAttempt(): boolean {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}

export function newAttemptId(): string {
  try {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  } catch {
    /* fall through */
  }
  return `attempt-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
