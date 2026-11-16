import type { ExamState } from "../types";

export const STORAGE_KEY = "g3u1-english-exam:v1";
export const MUTE_KEY = "g3u1-english-exam:muted";

type ReadStore = Pick<Storage, "getItem">;
type WriteStore = Pick<Storage, "setItem">;

export function makeAttemptId(now: number = Date.now()): string {
  return `A-${now.toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}

/**
 * Globally unique attempt id (crypto.randomUUID when available).
 * Reused across retries and manual resends, so Apps Script can de-duplicate.
 */
export function newAttemptId(): string {
  try {
    const c = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
    if (c && typeof c.randomUUID === "function") return c.randomUUID();
  } catch {
    /* older browser or insecure context — use the fallback below */
  }
  const rand = () => Math.random().toString(36).slice(2, 10);
  return `${Date.now()}-${rand()}${rand()}`;
}

export function createIdleState(): ExamState {
  return {
    version: 1,
    status: "idle",
    attemptId: "",
    studentName: "",
    currentIndex: 0,
    answers: {},
    startedAt: null,
    submittedAt: null,
    elapsedMs: 0,
    lastSavedAt: Date.now(),
  };
}

/** A new attempt: the timer starts at `now` (the moment Start Exam is pressed). */
export function startAttempt(studentName: string, now: number = Date.now()): ExamState {
  return {
    version: 1,
    status: "active",
    attemptId: newAttemptId(),
    studentName: studentName.trim(),
    currentIndex: 0,
    answers: {},
    startedAt: now,
    submittedAt: null,
    elapsedMs: 0,
    lastSavedAt: now,
  };
}

/** Live elapsed time based on timestamps, so a refresh never resets it. */
export function elapsedFor(state: ExamState, now: number = Date.now()): number {
  if (state.status === "submitted") return state.elapsedMs;
  if (state.status === "active" && state.startedAt !== null) return Math.max(0, now - state.startedAt);
  return 0;
}

export function submitAttempt(state: ExamState, now: number = Date.now()): ExamState {
  return {
    ...state,
    status: "submitted",
    submittedAt: now,
    elapsedMs: state.startedAt !== null ? Math.max(0, now - state.startedAt) : state.elapsedMs,
    lastSavedAt: now,
  };
}

function isValidState(value: unknown): value is ExamState {
  if (!value || typeof value !== "object") return false;
  const s = value as Partial<ExamState>;
  return (
    s.version === 1 &&
    (s.status === "idle" || s.status === "active" || s.status === "submitted") &&
    typeof s.studentName === "string" &&
    typeof s.currentIndex === "number" &&
    !!s.answers &&
    typeof s.answers === "object" &&
    (s.status === "idle" || typeof s.startedAt === "number")
  );
}

export function loadState(store: ReadStore | undefined | null): ExamState | null {
  if (!store) return null;
  try {
    const raw = store.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isValidState(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function saveState(store: WriteStore | undefined | null, state: ExamState): void {
  if (!store) return;
  try {
    store.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* storage full or blocked – the exam keeps working in memory */
  }
}

export function safeStorage(): Storage | null {
  try {
    return typeof window !== "undefined" ? window.localStorage : null;
  } catch {
    return null;
  }
}
