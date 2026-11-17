import type { ExamResult, StudentPartAnswer } from "@/data/exam";

const ATTEMPT_KEY = "interactive-grade-8-english-exam-l1-3-a-attempt-v1";
const REPORTS_KEY = "interactive-grade-8-english-exam-l1-3-a-reports-v1";

export interface Attempt {
  name: string;
  startedAt: number;
  answers: Record<number, StudentPartAnswer[]>;
  muted: boolean;
  submittedAt?: number;
  attemptId: string;
  current?: number;
}

export function loadAttempt(): Attempt | null {
  try {
    const raw = localStorage.getItem(ATTEMPT_KEY);
    if (!raw) return null;
    const a = JSON.parse(raw) as Attempt;
    if (!a || typeof a.startedAt !== "number" || typeof a.name !== "string") return null;
    if (!a.answers) a.answers = {};
    return a;
  } catch {
    return null;
  }
}

export function saveAttempt(a: Attempt): void {
  try {
    localStorage.setItem(ATTEMPT_KEY, JSON.stringify(a));
  } catch {
    /* storage unavailable — the attempt simply will not persist */
  }
}

export function clearAttempt(): void {
  try {
    localStorage.removeItem(ATTEMPT_KEY);
  } catch {
    /* ignore */
  }
}

export function saveReport(r: ExamResult): void {
  try {
    const list = loadReports();
    list.unshift(r);
    localStorage.setItem(REPORTS_KEY, JSON.stringify(list.slice(0, 5)));
  } catch {
    /* ignore */
  }
}

export function loadReports(): ExamResult[] {
  try {
    const raw = localStorage.getItem(REPORTS_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw) as ExamResult[];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function latestReport(): ExamResult | null {
  const list = loadReports();
  return list.length ? list[0] : null;
}

export function elapsedMs(startedAt: number, now = Date.now()): number {
  return Math.max(0, now - startedAt);
}

export function formatDuration(ms: number): string {
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}
