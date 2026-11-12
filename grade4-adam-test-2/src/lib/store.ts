import type { Answers, GradeResult } from "./grade";

/** Delivery of a submitted attempt's result to the teacher: started, confirmed by the server, or failed. */
export type DeliveryState = "pending" | "sent" | "failed";

export interface Attempt {
  examId: string;
  version: string;
  attemptId: string;
  name: string;
  phase: "exam" | "done";
  view: "q" | "review";
  order: string[]; // question ids in this attempt's order
  optionOrder: Record<string, string[]>; // shuffled option keys per subpart
  answers: Answers;
  current: number;
  visited: number[];
  startedAt: number;
  submittedAt?: number;
  durationMs?: number;
  result?: GradeResult;
  reportText?: string;
  reportName?: string;
  /** Set at submission; "sent" stops a reload of the results page from sending again. */
  delivery?: DeliveryState;
}

const KEY = "adam_g4_math_attempt_v1";

export function loadAttempt(): { attempt: Attempt | null; storageOk: boolean } {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { attempt: null, storageOk: probe() };
    const a = JSON.parse(raw) as Attempt;
    if (!a || !a.attemptId || !Array.isArray(a.order)) return { attempt: null, storageOk: probe() };
    return { attempt: a, storageOk: true };
  } catch {
    return { attempt: null, storageOk: probe() };
  }
}

function probe(): boolean {
  try {
    const k = KEY + "_probe";
    localStorage.setItem(k, "1");
    localStorage.removeItem(k);
    return true;
  } catch {
    return false;
  }
}

export function saveAttempt(a: Attempt): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(a));
    return true;
  } catch {
    return false;
  }
}

export function clearAttempt(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

export function newId(): string {
  const r = () => Math.random().toString(36).slice(2, 8);
  return `A${Date.now().toString(36)}-${r()}${r()}`.toUpperCase();
}

export function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
