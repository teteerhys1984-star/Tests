import type { Responses } from "./grading";

const ATTEMPT_KEY = "physics-7-model-b-attempt-v1";
const SOUND_KEY = "physics-7-model-b-muted-v1";

export type Attempt = {
  version: 1;
  status: "in_progress" | "submitted";
  studentName: string;
  responses: Responses;
  questionIndex: number;
  startedAt: number;
  finishedAt?: number;
};

export function loadAttempt(): Attempt | null {
  try {
    const raw = localStorage.getItem(ATTEMPT_KEY);
    if (!raw) return null;
    const attempt: unknown = JSON.parse(raw);
    if (!attempt || typeof attempt !== "object") return null;
    const value = attempt as Partial<Attempt>;
    if (
      value.version !== 1 ||
      (value.status !== "in_progress" && value.status !== "submitted") ||
      typeof value.studentName !== "string" || !value.studentName.trim() ||
      typeof value.startedAt !== "number" || !Number.isFinite(value.startedAt) ||
      typeof value.questionIndex !== "number" || !Number.isInteger(value.questionIndex) ||
      value.questionIndex < 0 || value.questionIndex > 9 ||
      !value.responses || typeof value.responses !== "object" || Array.isArray(value.responses) ||
      Object.values(value.responses).some((response) => typeof response !== "string") ||
      (value.status === "submitted" && (typeof value.finishedAt !== "number" || value.finishedAt < value.startedAt))
    ) return null;
    return value as Attempt;
  } catch {
    return null;
  }
}

export function saveAttempt(attempt: Attempt): void {
  try {
    localStorage.setItem(ATTEMPT_KEY, JSON.stringify(attempt));
  } catch {
    // The attempt remains usable in memory if storage is blocked or full.
  }
}

export function clearAttempt(): void {
  try { localStorage.removeItem(ATTEMPT_KEY); } catch { /* Storage may be unavailable. */ }
}

export function loadMuted(): boolean {
  try { return localStorage.getItem(SOUND_KEY) === "true"; } catch { return false; }
}

export function saveMuted(value: boolean): void {
  try { localStorage.setItem(SOUND_KEY, String(value)); } catch { /* Keep the in-memory setting. */ }
}

export function formatDuration(milliseconds: number): string {
  const totalSeconds = Math.floor(Math.max(0, milliseconds) / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map((part) => String(part).padStart(2, "0")).join(":");
}