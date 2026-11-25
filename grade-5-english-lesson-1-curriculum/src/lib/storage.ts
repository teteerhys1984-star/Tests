import { EXAM_ID } from "../config";
import type { Answers } from "./grading";

export const ATTEMPT_KEY = `${EXAM_ID}:attempt:v1`;
export const NAME_KEY = `${EXAM_ID}:studentName:v1`;
export const MUTE_KEY = `${EXAM_ID}:muted:v1`;

export interface Attempt {
  attemptId: string;
  studentName: string;
  status: "in-progress" | "submitted";
  startedAt: number; // epoch ms, set when the student presses Start Exam
  submittedAt?: number; // epoch ms, set on submission
  currentQuestion: number; // 1–8, remembered across refreshes
  answers: Answers;
}

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
      Number.isFinite(p.startedAt) &&
      typeof p.currentQuestion === "number" &&
      Number.isFinite(p.currentQuestion) &&
      typeof p.answers === "object" &&
      p.answers !== null &&
      !Array.isArray(p.answers);
    if (!valid) return null;
    return {
      attemptId: typeof p.attemptId === "string" && p.attemptId ? p.attemptId : newAttemptId(),
      studentName: p.studentName!,
      status: p.status!,
      startedAt: p.startedAt!,
      submittedAt: typeof p.submittedAt === "number" && Number.isFinite(p.submittedAt) ? p.submittedAt : undefined,
      currentQuestion: p.currentQuestion!,
      answers: p.answers!,
    };
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
