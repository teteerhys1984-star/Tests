import { EXAM_ID } from "@/config";

export type AttemptStatus = "active" | "submitted";

export interface Attempt {
  v: 1;
  /** Unique id of this attempt — stable across refreshes and resends. */
  attemptId: string;
  name: string;
  answers: Record<string, string>;
  /** epoch ms when the pupil pressed Start Exam */
  startTs: number;
  /** index of the question currently on screen */
  current: number;
  status: AttemptStatus;
  submittedTs?: number;
  elapsedMs?: number;
  model: "B";
}

/**
 * Storage keys of THIS exam only. They are derived from this exam's EXAM_ID, so
 * they can never collide with `grade5-english-curriculum-exam-l1-5-a` (or with
 * any other published exam) on the same device.
 */
export const STORAGE_KEY = `${EXAM_ID}-attempt-v1`;
export const MUTE_KEY = `${EXAM_ID}-muted-v1`;

/**
 * A globally unique attempt id (crypto.randomUUID when available).
 * The same id is reused for every resend of the same attempt, so the Apps
 * Script side can de-duplicate a result that was delivered twice.
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

function safeGet(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* storage may be unavailable — the exam still runs in memory */
  }
}

function safeRemove(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

export function loadAttempt(): Attempt | null {
  const raw = safeGet(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<Attempt>;
    if (!parsed || typeof parsed.name !== "string" || typeof parsed.startTs !== "number") return null;
    if (parsed.status !== "active" && parsed.status !== "submitted") return null;
    return {
      v: 1,
      attemptId:
        typeof parsed.attemptId === "string" && parsed.attemptId ? parsed.attemptId : newAttemptId(),
      name: parsed.name,
      answers: parsed.answers ?? {},
      startTs: parsed.startTs,
      current: Number.isFinite(parsed.current) ? (parsed.current as number) : 0,
      status: parsed.status,
      ...(typeof parsed.submittedTs === "number" ? { submittedTs: parsed.submittedTs } : {}),
      ...(typeof parsed.elapsedMs === "number" ? { elapsedMs: parsed.elapsedMs } : {}),
      model: "B",
    };
  } catch {
    return null;
  }
}

export function saveAttempt(attempt: Attempt): void {
  safeSet(STORAGE_KEY, JSON.stringify(attempt));
}

export function clearAttempt(): void {
  safeRemove(STORAGE_KEY);
}

export function isMuted(): boolean {
  return safeGet(MUTE_KEY) === "1";
}

export function setMuted(value: boolean): void {
  safeSet(MUTE_KEY, value ? "1" : "0");
}

/** HH:MM:SS count-up from a start timestamp. */
export function formatHMS(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
}

/** Timestamp-based elapsed time — correct across navigation and refresh. */
export function elapsedMs(startTs: number, now: number = Date.now()): number {
  return Math.max(0, now - startTs);
}
