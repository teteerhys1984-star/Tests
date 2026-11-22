import type { AnswerValue } from "./grading";

export type AttemptStatus = "in-progress" | "submitted";

export type Attempt = {
  version: 1;
  studentName: string;
  status: AttemptStatus;
  startedAt: number;
  submittedAt: number | null;
  current: number;
  answers: Record<string, AnswerValue>;
};

const ATTEMPT_KEY = "english-foundation-exam-test1-attempt";
const MUTE_KEY = "english-foundation-exam-muted";
const TEACHER_KEY = "english-foundation-exam-teacher-unlocked";

function sanitizeAnswers(raw: unknown): Record<string, AnswerValue> {
  const out: Record<string, AnswerValue> = {};
  if (!raw || typeof raw !== "object") return out;
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof value === "string") out[key] = value;
    else if (Array.isArray(value) && value.every((v) => typeof v === "string")) out[key] = value as string[];
  }
  return out;
}

export function loadAttempt(): Attempt | null {
  try {
    const raw = localStorage.getItem(ATTEMPT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Attempt> | null;
    if (!parsed || typeof parsed !== "object") return null;
    if (parsed.status !== "in-progress" && parsed.status !== "submitted") return null;
    if (typeof parsed.studentName !== "string" || typeof parsed.startedAt !== "number") return null;
    return {
      version: 1,
      studentName: parsed.studentName,
      status: parsed.status,
      startedAt: parsed.startedAt,
      submittedAt: typeof parsed.submittedAt === "number" ? parsed.submittedAt : null,
      current: typeof parsed.current === "number" && parsed.current >= 0 ? parsed.current : 0,
      answers: sanitizeAnswers(parsed.answers),
    };
  } catch {
    return null;
  }
}

export function saveAttempt(attempt: Attempt): void {
  try {
    localStorage.setItem(ATTEMPT_KEY, JSON.stringify(attempt));
  } catch {
    /* storage unavailable — the exam still works for this session */
  }
}

export function clearAttempt(): void {
  try {
    localStorage.removeItem(ATTEMPT_KEY);
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

/** Session-only flag for the client-side teacher area. */
export function loadTeacherUnlocked(): boolean {
  try {
    return sessionStorage.getItem(TEACHER_KEY) === "1";
  } catch {
    return false;
  }
}

export function setTeacherUnlocked(unlocked: boolean): void {
  try {
    if (unlocked) sessionStorage.setItem(TEACHER_KEY, "1");
    else sessionStorage.removeItem(TEACHER_KEY);
  } catch {
    /* ignore */
  }
}
