import type { Answers } from "./examData";

export const ATTEMPT_STORAGE_KEY =
  "grade-5-english-grammar-test-l1-to-5-and-18-attempt-v1";
export const MUTE_STORAGE_KEY =
  "grade-5-english-grammar-test-l1-to-5-and-18-muted-v1";
export const PENDING_SUBMISSION_PREFIX =
  "pending:grade-5-english-grammar-test-l1-to-5-and-18:";

export type AttemptStatus = "active" | "submitted";

export interface StoredAttempt {
  version: 1;
  studentName: string;
  status: AttemptStatus;
  startedAt: number;
  answers: Answers;
  currentQuestion: number;
  resumed: boolean;
  attemptId: string;
  submittedAt?: number;
  elapsedSeconds?: number;
}

export function loadAttempt(): StoredAttempt | null {
  try {
    const raw = window.localStorage.getItem(ATTEMPT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredAttempt>;
    if (parsed.version !== 1) return null;
    if (typeof parsed.studentName !== "string" || !parsed.studentName.trim()) return null;
    if (parsed.status !== "active" && parsed.status !== "submitted") return null;
    if (typeof parsed.startedAt !== "number" || !Number.isFinite(parsed.startedAt)) return null;
    if (typeof parsed.attemptId !== "string" || !parsed.attemptId.trim()) return null;
    const answers: Answers = {};
    if (parsed.answers && typeof parsed.answers === "object") {
      for (const [key, value] of Object.entries(parsed.answers)) {
        if (typeof value === "string") answers[key] = value;
        else if (Array.isArray(value) && value.every((item) => typeof item === "string")) {
          answers[key] = value;
        }
      }
    }
    const current =
      typeof parsed.currentQuestion === "number" &&
      parsed.currentQuestion >= 1 &&
      parsed.currentQuestion <= 12
        ? parsed.currentQuestion
        : 1;
    return {
      version: 1,
      studentName: parsed.studentName.trim(),
      status: parsed.status,
      startedAt: parsed.startedAt,
      answers,
      currentQuestion: current,
      resumed: Boolean(parsed.resumed),
      attemptId: parsed.attemptId.trim(),
      submittedAt:
        typeof parsed.submittedAt === "number" && Number.isFinite(parsed.submittedAt)
          ? parsed.submittedAt
          : undefined,
      elapsedSeconds:
        typeof parsed.elapsedSeconds === "number" && Number.isFinite(parsed.elapsedSeconds)
          ? parsed.elapsedSeconds
          : undefined,
    };
  } catch {
    return null;
  }
}

export function saveAttempt(attempt: StoredAttempt): void {
  try {
    window.localStorage.setItem(ATTEMPT_STORAGE_KEY, JSON.stringify(attempt));
  } catch {
    // The exam can continue even when browser storage is unavailable.
  }
}

export function clearAttempt(): void {
  try {
    window.localStorage.removeItem(ATTEMPT_STORAGE_KEY);
  } catch {
    // Nothing else to do if storage is blocked.
  }
}

export function loadMuted(): boolean {
  try {
    return window.localStorage.getItem(MUTE_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

export function saveMuted(muted: boolean): void {
  try {
    window.localStorage.setItem(MUTE_STORAGE_KEY, String(muted));
  } catch {
    // Sound preference is optional.
  }
}
