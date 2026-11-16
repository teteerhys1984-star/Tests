/* ------------------------------------------------------------------ */
/*  localStorage persistence — saves name, answers, start timestamp,   */
/*  current question, submission state. Fresh attempt only via Retake. */
/* ------------------------------------------------------------------ */

import type { ExamSession } from "../types";

const KEY = "gok_grade3_exam_session_v1";

export function loadSession(): ExamSession | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ExamSession;
    if (parsed?.version !== 1 || typeof parsed.startedAt !== "number") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveSession(session: ExamSession): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(session));
  } catch {
    /* storage full / unavailable — exam still works in memory */
  }
}

export function clearSession(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* noop */
  }
}
