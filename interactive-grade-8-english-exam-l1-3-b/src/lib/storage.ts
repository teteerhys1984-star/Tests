import { EXAM_ID } from "@/config";
import type { ExamReport } from "@/lib/grading";

/** Strictly namespaced to `EXAM_ID` — never shared with Model A or any other exam. */
export const ATTEMPT_KEY = `${EXAM_ID}-attempt-v1`;
export const REPORT_KEY = `${EXAM_ID}-report-v1`;
export const PREV_REPORT_KEY = `${EXAM_ID}-previous-report-v1`;
export const MUTE_KEY = `${EXAM_ID}-muted-v1`;

export interface Attempt {
  attemptId: string;
  name: string;
  startedAt: number;
  answers: Record<string, string>;
  muted: boolean;
  index: number;
  submittedAt?: number;
  sentAt?: number;
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
  if (
    !a ||
    typeof a.attemptId !== "string" ||
    !a.attemptId ||
    typeof a.startedAt !== "number" ||
    typeof a.name !== "string" ||
    !a.name.trim()
  ) {
    return null;
  }
  const cleanAnswers: Record<string, string> = {};
  if (a.answers && typeof a.answers === "object" && !Array.isArray(a.answers)) {
    for (const [k, v] of Object.entries(a.answers)) {
      if (typeof v === "string") cleanAnswers[k] = v;
    }
  }
  return {
    ...a,
    answers: cleanAnswers,
    muted: !!a.muted,
    index: typeof a.index === "number" && Number.isFinite(a.index) ? Math.floor(a.index) : 0,
  };
}

export function saveAttempt(attempt: Attempt): void {
  write(ATTEMPT_KEY, attempt);
}

export function clearAttempt(): void {
  remove(ATTEMPT_KEY);
}

export function loadReport(): ExamReport | null {
  const r = read<ExamReport>(REPORT_KEY);
  if (!r || typeof r.name !== "string" || !Array.isArray(r.questions)) return null;
  return r;
}

export function saveReport(report: ExamReport): void {
  write(REPORT_KEY, report);
}

export function clearReport(): void {
  remove(REPORT_KEY);
}

export function loadPreviousReport(): ExamReport | null {
  const r = read<ExamReport>(PREV_REPORT_KEY);
  if (!r || typeof r.name !== "string" || !Array.isArray(r.questions)) return null;
  return r;
}

/** Keeps the last submitted report safe when a new attempt starts. */
export function archiveCurrentReport(): void {
  const current = loadReport();
  if (current) write(PREV_REPORT_KEY, current);
}

export function loadMuted(): boolean {
  try {
    return window.localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    return false;
  }
}

export function saveMuted(muted: boolean): void {
  try {
    window.localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
  } catch {
    /* ignore */
  }
}
