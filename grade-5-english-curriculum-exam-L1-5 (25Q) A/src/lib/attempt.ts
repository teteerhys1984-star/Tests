export interface Attempt {
  name: string;
  startedAt: number;
  answers: Record<string, string>;
  submittedAt: number | null;
}

const KEY = "g5-unit1-model-a-attempt-v1";
const MUTE_KEY = "g5-unit1-model-a-muted-v1";

export function loadAttempt(): Attempt | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const a = JSON.parse(raw) as Attempt;
    if (!a || typeof a.name !== "string" || typeof a.startedAt !== "number") return null;
    if (!a.answers || typeof a.answers !== "object") a.answers = {};
    return a;
  } catch {
    return null;
  }
}

export function saveAttempt(a: Attempt): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(a));
  } catch {
    /* storage may be unavailable — the exam still runs in memory */
  }
}

export function clearAttempt(): void {
  try {
    localStorage.removeItem(KEY);
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
  const total = Math.floor(ms / 1000);
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
