/**
 * localStorage persistence for the exam attempt.
 * Refreshing the page never creates a new attempt: the stored state
 * (including the start timestamp) is recovered verbatim.
 */
import type { AttemptState } from "../types";

const KEY = "grade8.exam.unit1.attempt.v1";
const MUTE_KEY = "grade8.exam.unit1.muted";

export const EMPTY_ATTEMPT: AttemptState = {
  phase: "start",
  studentName: "",
  startTs: null,
  endTs: null,
  submittedAt: null,
  currentIndex: 0,
  answers: {},
};

export function loadAttempt(): AttemptState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...EMPTY_ATTEMPT };
    const parsed = JSON.parse(raw) as Partial<AttemptState>;
    return {
      phase:
        parsed.phase === "exam" || parsed.phase === "results"
          ? parsed.phase
          : "start",
      studentName: typeof parsed.studentName === "string" ? parsed.studentName : "",
      startTs: typeof parsed.startTs === "number" ? parsed.startTs : null,
      endTs: typeof parsed.endTs === "number" ? parsed.endTs : null,
      submittedAt:
        typeof parsed.submittedAt === "string" ? parsed.submittedAt : null,
      currentIndex:
        typeof parsed.currentIndex === "number" ? parsed.currentIndex : 0,
      answers:
        parsed.answers && typeof parsed.answers === "object"
          ? (parsed.answers as AttemptState["answers"])
          : {},
    };
  } catch {
    return { ...EMPTY_ATTEMPT };
  }
}

export function saveAttempt(state: AttemptState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* storage full or unavailable — ignore */
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
