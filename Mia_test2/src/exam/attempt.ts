import { EXAM_ID, EXAM_VERSION, QUESTIONS } from "./data";
import type { Answers } from "./grade";

export interface Attempt {
  examId: string;
  version: string;
  attemptId: string;
  studentName: string;
  answers: Answers;
  questionOrder: number[];
  optionOrders: Record<string, string[]>;
  currentIndex: number;
  visited: number[];
  startTimestamp: number;
  submittedAt: number | null;
  status: "active" | "submitted";
  lastSavedAt: number;
  startSoundPlayed: boolean;
}

export const STORAGE_KEY = "mia_grade6_mathematics_attempt_v1";

function makeId(): string {
  try {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      return crypto.randomUUID();
    }
  } catch {
    // ignored: fall back below
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function randomInt(max: number): number {
  if (max <= 1) return 0;
  try {
    if (typeof crypto !== "undefined" && "getRandomValues" in crypto) {
      const values = new Uint32Array(1);
      crypto.getRandomValues(values);
      return values[0] % max;
    }
  } catch {
    // ignored: fall back below
  }
  return Math.floor(Math.random() * max);
}

export function shuffleArray<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = randomInt(i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function buildOptionOrders(): Record<string, string[]> {
  const orders: Record<string, string[]> = {};
  for (const question of QUESTIONS) {
    for (const part of question.parts) {
      if (part.kind === "mcq" && part.options && part.options.length > 1) {
        orders[part.id] = shuffleArray(part.options.map((option) => option.id));
      }
    }
  }
  return orders;
}

export function createAttempt(studentName: string): Attempt {
  return {
    examId: EXAM_ID,
    version: EXAM_VERSION,
    attemptId: makeId(),
    studentName: studentName.trim(),
    answers: {},
    // The authored sequence is deliberately interleaved across textbook units.
    questionOrder: QUESTIONS.map((question) => question.id),
    optionOrders: buildOptionOrders(),
    currentIndex: 0,
    visited: [0],
    startTimestamp: Date.now(),
    submittedAt: null,
    status: "active",
    lastSavedAt: Date.now(),
    startSoundPlayed: false,
  };
}

export interface LoadResult {
  attempt: Attempt | null;
  warning: string | null;
  hadStoredData: boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function loadAttempt(): LoadResult {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    return {
      attempt: null,
      warning:
        "تعذّر الوصول إلى التخزين المحلي في هذا المتصفح. يمكنك أداء الاختبار، لكن الحفظ التلقائي غير متاح.",
      hadStoredData: false,
    };
  }
  if (!raw) return { attempt: null, warning: null, hadStoredData: false };

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) throw new Error("invalid");
    if (parsed.examId !== EXAM_ID) throw new Error("invalid exam");
    if (typeof parsed.studentName !== "string" || !parsed.studentName.trim()) {
      throw new Error("invalid name");
    }
    if (!parsed.answers || !isRecord(parsed.answers)) throw new Error("invalid answers");
    if (!Array.isArray(parsed.questionOrder)) throw new Error("invalid order");

    const allIds = QUESTIONS.map((question) => question.id);
    const validIds = parsed.questionOrder.filter(
      (id): id is number => typeof id === "number" && allIds.includes(id)
    );
    const uniqueIds = [...new Set(validIds)];
    for (const id of allIds) {
      if (!uniqueIds.includes(id)) uniqueIds.push(id);
    }

    const optionOrders: Record<string, string[]> = {};
    const savedOrders = isRecord(parsed.optionOrders) ? parsed.optionOrders : {};
    for (const question of QUESTIONS) {
      for (const part of question.parts) {
        if (part.kind === "mcq" && part.options) {
          const saved = savedOrders[part.id];
          const allowed = part.options.map((option) => option.id);
          if (Array.isArray(saved)) {
            const filtered = saved.filter(
              (item): item is string => typeof item === "string" && allowed.includes(item)
            );
            for (const id of allowed) {
              if (!filtered.includes(id)) filtered.push(id);
            }
            optionOrders[part.id] = filtered;
          } else {
            optionOrders[part.id] = allowed;
          }
        }
      }
    }

    const currentIndex = Math.min(
      Math.max(0, typeof parsed.currentIndex === "number" ? parsed.currentIndex : 0),
      uniqueIds.length - 1
    );
    const visited = Array.isArray(parsed.visited)
      ? parsed.visited.filter(
          (index): index is number =>
            typeof index === "number" && index >= 0 && index < uniqueIds.length
        )
      : [];
    if (!visited.includes(currentIndex)) visited.push(currentIndex);

    const status: Attempt["status"] =
      parsed.status === "submitted" ? "submitted" : "active";
    const startTimestamp =
      typeof parsed.startTimestamp === "number" && parsed.startTimestamp > 0
        ? parsed.startTimestamp
        : Date.now();
    const submittedAt =
      status === "submitted" && typeof parsed.submittedAt === "number"
        ? parsed.submittedAt
        : null;

    const attempt: Attempt = {
      examId: EXAM_ID,
      version:
        typeof parsed.version === "string" ? parsed.version : EXAM_VERSION,
      attemptId:
        typeof parsed.attemptId === "string" && parsed.attemptId
          ? parsed.attemptId
          : makeId(),
      studentName: parsed.studentName.trim(),
      answers: parsed.answers as Answers,
      questionOrder: uniqueIds,
      optionOrders,
      currentIndex,
      visited,
      startTimestamp,
      submittedAt,
      status,
      lastSavedAt:
        typeof parsed.lastSavedAt === "number" ? parsed.lastSavedAt : Date.now(),
      startSoundPlayed: true,
    };

    return {
      attempt,
      warning:
        parsed.version !== EXAM_VERSION
          ? "جرى استعادة المحاولة المحفوظة من نسخة سابقة من الاختبار."
          : null,
      hadStoredData: true,
    };
  } catch {
    return {
      attempt: null,
      warning:
        "وُجدت بيانات محفوظة غير صالحة، ولم يتم حذف الإجابات تلقائياً. بدأ عرض شاشة الترحيب.",
      hadStoredData: true,
    };
  }
}

export function saveAttempt(attempt: Attempt): boolean {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...attempt, lastSavedAt: Date.now() })
    );
    return true;
  } catch {
    return false;
  }
}

export function clearAttempt(): boolean {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}
