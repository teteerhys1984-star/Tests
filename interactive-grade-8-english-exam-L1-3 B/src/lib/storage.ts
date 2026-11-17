import type { ExamReport } from "./grading";

const ATTEMPT_KEY = "g8-unit1-modelB.attempt.v1";
const REPORT_KEY = "g8-unit1-modelB.report.v1";
const PREV_REPORT_KEY = "g8-unit1-modelB.previousReport.v1";

export interface Attempt {
  name: string;
  startedAt: number;
  answers: Record<string, string>;
  muted: boolean;
  index: number;
  submittedAt?: number;
}

function read<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable — the exam keeps working in memory */
  }
}

function remove(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

export function loadAttempt(): Attempt | null {
  const a = read<Attempt>(ATTEMPT_KEY);
  if (!a || typeof a.startedAt !== "number" || !a.name) return null;
  return { ...a, answers: a.answers ?? {}, muted: !!a.muted, index: a.index ?? 0 };
}

export function saveAttempt(attempt: Attempt): void {
  write(ATTEMPT_KEY, attempt);
}

export function clearAttempt(): void {
  remove(ATTEMPT_KEY);
}

export function loadReport(): ExamReport | null {
  return read<ExamReport>(REPORT_KEY);
}

export function saveReport(report: ExamReport): void {
  write(REPORT_KEY, report);
}

export function clearReport(): void {
  remove(REPORT_KEY);
}

export function loadPreviousReport(): ExamReport | null {
  return read<ExamReport>(PREV_REPORT_KEY);
}

/** Keeps the last submitted report safe when a new attempt starts. */
export function archiveCurrentReport(): void {
  const current = loadReport();
  if (current) write(PREV_REPORT_KEY, current);
}
