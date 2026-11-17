import { EXAM_ID } from "@/config";

export interface Attempt {
  v: 1;
  /** Unique id of this attempt — stable across refreshes and resends. */
  attemptId: string;
  name: string;
  startedAt: number;
  answers: Record<string, string>;
  currentIndex: number;
  submittedAt: number | null;
}

/**
 * Storage keys of THIS exam only — derived from EXAM_ID so they remain
 * isolated from every other exam on the platform.
 */
export const STORAGE_KEY = `${EXAM_ID}-attempt-v1`;
export const MUTE_KEY = `${EXAM_ID}-muted-v1`;

/**
 * Generates a unique attempt id (crypto.randomUUID when available).
 * The same id is reused across retries, refreshes, and manual resends so
 * Google Apps Script can de-duplicate deliveries safely.
 */
export function newAttemptId(): string {
  try {
    const c = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
    if (c && typeof c.randomUUID === "function") return c.randomUUID();
  } catch {
    /* older browser or insecure context — fall back below */
  }
  const rand = () => Math.random().toString(36).slice(2, 10);
  return `${Date.now()}-${rand()}${rand()}`;
}

export function loadAttempt(): Attempt | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const a = JSON.parse(raw) as Partial<Attempt>;
    if (
      !a ||
      typeof a.name !== "string" ||
      typeof a.startedAt !== "number" ||
      !Number.isFinite(a.startedAt)
    ) {
      return null;
    }
    return {
      v: 1,
      attemptId:
        typeof a.attemptId === "string" && a.attemptId.trim() ? a.attemptId : newAttemptId(),
      name: a.name,
      startedAt: a.startedAt,
      answers: a.answers && typeof a.answers === "object" ? a.answers : {},
      currentIndex:
        typeof a.currentIndex === "number" && Number.isFinite(a.currentIndex) && a.currentIndex >= 0
          ? a.currentIndex
          : 0,
      submittedAt:
        typeof a.submittedAt === "number" && Number.isFinite(a.submittedAt)
          ? a.submittedAt
          : null,
    };
  } catch {
    return null;
  }
}

export function saveAttempt(a: Attempt): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(a));
  } catch {
    /* storage may be unavailable — the exam still runs in memory */
  }
}

export function clearAttempt(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/** Count-up stopwatch, timestamp based: survives refresh and question changes. */
export function elapsedMs(attempt: Attempt, now: number = Date.now()): number {
  const end = attempt.submittedAt ?? now;
  return Math.max(0, end - attempt.startedAt);
}

export function formatClock(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(h)}:${p(m)}:${p(s)}`;
}

export function loadMuted(): boolean {
  try {
    return localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    return false;
  }
}

export function saveMuted(v: boolean): void {
  try {
    localStorage.setItem(MUTE_KEY, v ? "1" : "0");
  } catch {
    /* ignore */
  }
}
