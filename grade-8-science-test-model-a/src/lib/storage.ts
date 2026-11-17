/**
 * Local persistence — every key is namespaced by EXAM_ID so this exam never
 * shares attempt, report or mute state with any other exam on the platform.
 */
import { EXAM_ID } from "@/config";
import type { AnswerMap, Attempt } from "@/data/types";
import type { ExamReport } from "@/lib/report";

export const ATTEMPT_KEY = `${EXAM_ID}-attempt-v1`;
export const REPORT_KEY = `${EXAM_ID}-report-v1`;
export const PREV_REPORT_KEY = `${EXAM_ID}-previous-report-v1`;
export const MUTE_KEY = `${EXAM_ID}-muted-v1`;

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

export function newAttempt(name: string, attemptId: string): Attempt {
  return {
    v: 1,
    attemptId,
    name: name.trim(),
    startedAt: Date.now(),
    answers: {} as AnswerMap,
    muted: false,
    idx: 0,
  };
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
  const cleanAnswers: AnswerMap = {};
  if (a.answers && typeof a.answers === "object" && !Array.isArray(a.answers)) {
    for (const [k, v] of Object.entries(a.answers)) {
      if (typeof v === "string") cleanAnswers[k] = v;
    }
  }
  return {
    ...a,
    answers: cleanAnswers,
    muted: !!a.muted,
    idx: typeof a.idx === "number" && Number.isFinite(a.idx) ? Math.floor(a.idx) : 0,
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
