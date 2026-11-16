/* ------------------------------------------------------------------ */
/*  Session persistence — one atomic localStorage record               */
/* ------------------------------------------------------------------ */

import type { ExamSession } from "../types";

const KEY = "gok.g4u1.session.v1";

export const BLANK_SESSION: ExamSession = {
  phase: "welcome",
  studentName: "",
  startedAt: null,
  answers: {},
  current: 0,
  result: null,
};

export function loadSession(): ExamSession {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...BLANK_SESSION };
    const parsed = JSON.parse(raw) as ExamSession;
    if (!parsed || typeof parsed !== "object" || !parsed.phase) {
      return { ...BLANK_SESSION };
    }
    return {
      phase: parsed.phase,
      studentName: typeof parsed.studentName === "string" ? parsed.studentName : "",
      startedAt: typeof parsed.startedAt === "number" ? parsed.startedAt : null,
      answers: parsed.answers && typeof parsed.answers === "object" ? parsed.answers : {},
      current: typeof parsed.current === "number" ? parsed.current : 0,
      result: parsed.result ?? null,
    };
  } catch {
    return { ...BLANK_SESSION };
  }
}

export function saveSession(session: ExamSession): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(session));
  } catch {
    /* storage full / unavailable — ignore silently */
  }
}

export function clearSession(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

const MUTE_KEY = "gok.g4u1.muted";

export function loadMuted(): boolean {
  try {
    return localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    return false;
  }
}

export function saveMuted(muted: boolean): void {
  try {
    localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
  } catch {
    /* ignore */
  }
}
