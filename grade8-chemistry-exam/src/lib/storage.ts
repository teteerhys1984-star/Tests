import type { ExamSummary } from "./grading";
import type { AnswerMap } from "./grading";

export const STORAGE_KEY = "chem8_unit1_lessons1_2_exam_v1";

export type StoredResult = {
  summary: ExamSummary;
  answers: AnswerMap;
  submittedAt: number;
  elapsedSeconds: number;
  reportText: string;
  reportFilename: string;
};

export type AttemptState = {
  examId: string;
  version: string;
  attemptId: string;
  studentName: string;
  status: "active" | "submitted";
  startedAt: number;
  submittedAt: number | null;
  answers: AnswerMap;
  currentIndex: number;
  visited: number[];
  questionOrder: string[];
  optionOrder: Record<string, string[]>;
  itemOrder: Record<string, string[]>;
  startSoundPlayed: boolean;
  result?: StoredResult;
};

export type LoadOutcome = { attempt: AttemptState | null; error: boolean; available: boolean };

const hasStorage = (): boolean => {
  try {
    const k = "__chem8_probe__";
    window.localStorage.setItem(k, "1");
    window.localStorage.removeItem(k);
    return true;
  } catch {
    return false;
  }
};

export const loadAttempt = (examId: string, version: string): LoadOutcome => {
  if (!hasStorage()) return { attempt: null, error: false, available: false };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { attempt: null, error: false, available: true };
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return { attempt: null, error: true, available: true };
    const a = parsed as AttemptState;
    const valid =
      a.examId === examId &&
      a.version === version &&
      typeof a.attemptId === "string" &&
      typeof a.studentName === "string" &&
      (a.status === "active" || a.status === "submitted") &&
      typeof a.startedAt === "number" &&
      a.startedAt > 0 &&
      Array.isArray(a.questionOrder) &&
      a.questionOrder.length === 15 &&
      new Set(a.questionOrder).size === 15 &&
      a.answers !== null &&
      typeof a.answers === "object";
    if (!valid) return { attempt: null, error: true, available: true };
    const normalized: AttemptState = {
      ...a,
      answers: a.answers && typeof a.answers === "object" ? a.answers : {},
      visited: Array.isArray(a.visited) ? a.visited.filter((n) => Number.isInteger(n)) : [],
      currentIndex: Number.isInteger(a.currentIndex) ? a.currentIndex : 0,
      optionOrder: a.optionOrder && typeof a.optionOrder === "object" ? a.optionOrder : {},
      itemOrder: a.itemOrder && typeof a.itemOrder === "object" ? a.itemOrder : {},
      startSoundPlayed: Boolean(a.startSoundPlayed),
      submittedAt: typeof a.submittedAt === "number" ? a.submittedAt : null,
    };
    return { attempt: normalized, error: false, available: true };
  } catch {
    return { attempt: null, error: true, available: true };
  }
};

export const saveAttempt = (attempt: AttemptState): boolean => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(attempt));
    return true;
  } catch {
    return false;
  }
};

export const clearAttempt = (): boolean => {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
};
