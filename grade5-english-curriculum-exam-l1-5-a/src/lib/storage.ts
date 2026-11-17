export type AttemptStatus = "in-progress" | "submitted";

export interface Attempt {
  v: 1;
  /** Unique id of this attempt — stable across refreshes and resends. */
  attemptId: string;
  name: string;
  answers: Record<string, string>;
  /** Epoch ms when the pupil pressed Start Exam. */
  startedAt: number;
  /** Index of the question currently on screen. */
  index: number;
  status: AttemptStatus;
  /** Epoch ms when Submit Exam was pressed (null until submitted). */
  submittedAt: number | null;
  muted: boolean;
}

/** Storage key of THIS exam only — never shared with any other published exam. */
export const STORAGE_KEY = "grade5-english-curriculum-exam-l1-5-a-attempt-v1";

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

export function loadAttempt(): Attempt | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Attempt;
    if (!parsed || parsed.v !== 1 || typeof parsed.name !== "string") return null;
    if (typeof parsed.startedAt !== "number" || !Number.isFinite(parsed.startedAt)) return null;
    return {
      v: 1,
      attemptId: typeof parsed.attemptId === "string" && parsed.attemptId ? parsed.attemptId : newAttemptId(),
      name: parsed.name,
      answers: parsed.answers && typeof parsed.answers === "object" ? parsed.answers : {},
      startedAt: parsed.startedAt,
      index: Number.isFinite(parsed.index) ? parsed.index : 0,
      status: parsed.status === "submitted" ? "submitted" : "in-progress",
      submittedAt:
        parsed.status === "submitted"
          ? typeof parsed.submittedAt === "number"
            ? parsed.submittedAt
            : parsed.startedAt
          : null,
      muted: Boolean(parsed.muted),
    };
  } catch {
    return null;
  }
}

export function saveAttempt(attempt: Attempt): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(attempt));
  } catch {
    /* storage unavailable — the exam still runs, it just will not survive a refresh */
  }
}

export function clearAttempt(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * Count-up timer in HH:MM:SS driven purely by timestamps, so it keeps counting
 * accurately across navigation, re-renders and page refreshes.
 */
export function formatElapsed(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

export function elapsedBetween(startedAt: number, endedAt: number | null): number {
  const end = endedAt ?? Date.now();
  return Math.max(0, end - startedAt);
}
