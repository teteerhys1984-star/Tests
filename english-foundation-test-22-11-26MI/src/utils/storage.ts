import type { AnswerMap } from "../data/types";

export type AttemptStatus = "idle" | "in-progress" | "submitted";

export interface AttemptState {
  studentName: string;
  answers: AnswerMap;
  currentQuestion: number; // 0-based index
  startedAt: number | null; // epoch ms
  submittedAt: number | null; // epoch ms
  /** Elapsed ms accumulated at the last save (used as a fallback). */
  elapsedMs: number;
  status: AttemptStatus;
}

const KEY = "english-foundation-exam-test2:attempt:v1";
const MUTE_KEY = "english-foundation-exam-test2:muted";

export const emptyAttempt = (): AttemptState => ({
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
    return { ...emptyAttempt(), ...parsed, answers: parsed.answers ?? {} };
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
