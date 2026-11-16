import type { AnswerMap, ExamResult } from "@/exam/types";
import type { SendStatus } from "@/lib/submit";

/**
 * localStorage persistence layer — attempts survive refresh/closure.
 * Keys are namespaced to this exam (`grade8-english-curriculum-l3-l4`) so
 * multiple exams hosted under the same origin never overwrite each other.
 * Timer integrity comes from storing the absolute startedAt timestamp,
 * never an interval counter.
 */

export const ATTEMPT_KEY = "grade8-english-curriculum-l3-l4.attempt.v1";
export const MUTE_KEY = "grade8-english-curriculum-l3-l4.muted.v1";

export interface AttemptState {
  status: "in_progress" | "submitted";
  studentName: string;
  startedAt: number; // epoch ms — the single source of truth for elapsed time
  finishedAt: number | null; // epoch ms when submitted
  current: number; // last visited question index (0-based)
  answers: AnswerMap;
  result: ExamResult | null;
  attemptId?: string;
  sendStatus?: SendStatus;
}

export function loadAttempt(): AttemptState | null {
  try {
    const raw = localStorage.getItem(ATTEMPT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AttemptState;
    if (parsed && (parsed.status === "in_progress" || parsed.status === "submitted")) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function saveAttempt(state: AttemptState): void {
  try {
    localStorage.setItem(ATTEMPT_KEY, JSON.stringify(state));
  } catch {
    /* storage full/unavailable — exam still works in-memory */
  }
}

export function clearAttempt(): void {
  try {
    localStorage.removeItem(ATTEMPT_KEY);
  } catch {
    /* noop */
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
    /* noop */
  }
}

/** Milliseconds elapsed for an attempt at a given instant (default: now). */
export function elapsedMs(state: AttemptState, at: number = Date.now()): number {
  const end = state.status === "submitted" && state.finishedAt ? state.finishedAt : at;
  return Math.max(0, end - state.startedAt);
}
