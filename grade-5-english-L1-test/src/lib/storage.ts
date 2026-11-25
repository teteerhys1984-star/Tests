import type { Answers } from "./grading";

const ATTEMPT_KEY = "englishExam.attempt.v1";
const NAME_KEY = "englishExam.studentName.v1";
const MUTE_KEY = "englishExam.muted.v1";

export interface Attempt {
  studentName: string;
  status: "in-progress" | "submitted";
  startedAt: number; // epoch ms, set when the student presses Start Exam
  submittedAt?: number; // epoch ms, set on submission
  currentQuestion: number; // 1–8, remembered across refreshes
  answers: Answers;
}

function safeGet(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string | null) {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    /* storage unavailable (private mode); the exam still works in memory */
  }
}

export function loadAttempt(): Attempt | null {
  const raw = safeGet(ATTEMPT_KEY);
  if (!raw) return null;
  try {
    const p = JSON.parse(raw) as Partial<Attempt>;
    const valid =
      typeof p.studentName === "string" &&
      (p.status === "in-progress" || p.status === "submitted") &&
      typeof p.startedAt === "number" &&
      typeof p.currentQuestion === "number" &&
      typeof p.answers === "object" &&
      p.answers !== null;
    if (!valid) return null;
    return p as Attempt;
  } catch {
    return null;
  }
}

export function saveAttempt(attempt: Attempt | null) {
  safeSet(ATTEMPT_KEY, attempt ? JSON.stringify(attempt) : null);
}

export function loadSavedName(): string {
  return safeGet(NAME_KEY) ?? "";
}

export function saveName(name: string | null) {
  safeSet(NAME_KEY, name);
}

export function loadMuted(): boolean {
  return safeGet(MUTE_KEY) === "1";
}

export function saveMuted(muted: boolean) {
  safeSet(MUTE_KEY, muted ? "1" : "0");
}

/* ───────── Formatting helpers ───────── */

const pad = (n: number) => String(n).padStart(2, "0");

/** Milliseconds → HH:MM:SS (hours may exceed 99). */
export function formatHMS(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

/** Locale-independent date and time: YYYY-MM-DD HH:MM (24-hour, local time). */
export function formatDateTime(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function safeFileName(name: string): string {
  const cleaned = name.trim().replace(/[^\p{L}\p{N}]+/gu, "_").replace(/^_+|_+$/g, "");
  return cleaned || "student";
}
