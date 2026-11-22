import { QUESTIONS } from "../data/examData";
import { EXAM_ID } from "../config";
import type { AnswerMap } from "../data/types";

export type AttemptStatus = "idle" | "in-progress" | "submitted";

export interface AttemptState {
  attemptId: string;
  studentName: string;
  answers: AnswerMap;
  currentQuestion: number; // 0-based index
  startedAt: number | null; // epoch ms
  submittedAt: number | null; // epoch ms
  /** Elapsed ms accumulated at the last save (used as a fallback). */
  elapsedMs: number;
  status: AttemptStatus;
}

const KEY = `${EXAM_ID}:attempt:v1`;
const MUTE_KEY = `${EXAM_ID}:muted`;

export const emptyAttempt = (): AttemptState => ({
  attemptId: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`,
  studentName: "",
  answers: {},
  currentQuestion: 0,
  startedAt: null,
  submittedAt: null,
  elapsedMs: 0,
  status: "idle",
});

export function loadAttempt(): AttemptState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyAttempt();
    const parsed = JSON.parse(raw) as Partial<AttemptState>;
    if (!parsed || typeof parsed !== "object" ||
      typeof parsed.attemptId !== "string" || typeof parsed.studentName !== "string" ||
      !["idle", "in-progress", "submitted"].includes(parsed.status ?? "") ||
      (parsed.status !== "idle" && (!Number.isFinite(parsed.startedAt) || !parsed.startedAt)) ||
      (parsed.status === "submitted" && (!Number.isFinite(parsed.submittedAt) || !parsed.submittedAt))) return emptyAttempt();
    const answers = Object.fromEntries(Object.entries(parsed.answers ?? {}).filter(([,v]) => typeof v === "string"));
    const currentQuestion = Number.isInteger(parsed.currentQuestion) ? Math.max(0, Math.min(QUESTIONS.length - 1, parsed.currentQuestion!)) : 0;
    return { ...emptyAttempt(), ...parsed, answers, currentQuestion };
  } catch {
    return emptyAttempt();
  }
}

export function saveAttempt(state: AttemptState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* storage unavailable — ignore */
  }
}

export function clearAttempt(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

export function loadMuted(): boolean {
  try {
    return localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    return false;
  }
}

export function saveMuted(muted: boolean): void {
  try {
    localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
  } catch {
    /* ignore */
  }
}
