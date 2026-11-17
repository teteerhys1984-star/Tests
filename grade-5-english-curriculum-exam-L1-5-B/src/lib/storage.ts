export interface Attempt {
  name: string;
  answers: Record<string, string>;
  /** epoch ms when the pupil pressed Start Exam */
  startTs: number;
  /** index of the question currently on screen */
  current: number;
  status: "active" | "submitted";
  submittedTs?: number;
  elapsedMs?: number;
  model: "B";
}

const KEY = "grade5-unit1-exam-model-b-attempt-v1";
const MUTE_KEY = "grade5-unit1-exam-model-b-muted";

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
  const raw = safeGet(KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Attempt;
    if (!parsed || typeof parsed.name !== "string" || typeof parsed.startTs !== "number") return null;
    if (parsed.status !== "active" && parsed.status !== "submitted") return null;
    return {
      ...parsed,
      answers: parsed.answers ?? {},
      current: Number.isFinite(parsed.current) ? parsed.current : 0,
      model: "B",
    };
  } catch {
    return null;
  }
}

export function saveAttempt(attempt: Attempt): void {
  safeSet(KEY, JSON.stringify(attempt));
}

export function clearAttempt(): void {
  safeRemove(KEY);
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
