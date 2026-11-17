import type { AnswerMap, Attempt } from "../data/types";

const KEY = "g8-exam-model-a-v1";

export function loadAttempt(): Attempt | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Attempt;
    if (!parsed || typeof parsed.startedAt !== "number" || typeof parsed.name !== "string") return null;
    if (!parsed.answers) parsed.answers = {};
    if (typeof parsed.muted !== "boolean") parsed.muted = false;
    if (parsed.v !== 1) parsed.v = 1;
    return parsed;
  } catch {
    return null;
  }
}

export function saveAttempt(a: Attempt): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(a));
  } catch {
    /* التخزين ممتلئ أو محظور — يستمر العمل دون حفظ */
  }
}

export function clearAttempt(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* noop */
  }
}

export function newAttempt(name: string): Attempt {
  return { v: 1, name: name.trim(), startedAt: Date.now(), answers: {} as AnswerMap, muted: false };
}
