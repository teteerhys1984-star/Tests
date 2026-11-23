import type { AnswerMap } from '../types';

/**
 * Local, browser-only persistence. A new attempt is created only when the
 * student explicitly starts (or retakes) the exam — never on refresh.
 */

const ATTEMPT_KEY = 'g4_english_exam_attempt_v1';
const MUTED_KEY = 'g4_english_exam_muted_v1';

export interface StoredAttempt {
  version: 1;
  name: string;
  /** epoch ms — the stopwatch counts up from here */
  startedAt: number;
  answers: AnswerMap;
  submitted: boolean;
  /** epoch ms — set on submission */
  submittedAt?: number;
}

function safeParse(raw: string | null): StoredAttempt | null {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as StoredAttempt;
    if (data && data.version === 1 && typeof data.name === 'string' && typeof data.startedAt === 'number' && data.answers) {
      return data;
    }
    return null;
  } catch {
    return null;
  }
}

export function loadAttempt(): StoredAttempt | null {
  try {
    return safeParse(window.localStorage.getItem(ATTEMPT_KEY));
  } catch {
    return null; // storage unavailable (private mode) — app still works in-memory
  }
}

export function saveAttempt(attempt: StoredAttempt): void {
  try {
    window.localStorage.setItem(ATTEMPT_KEY, JSON.stringify(attempt));
  } catch {
    /* storage full or unavailable — keep in-memory state only */
  }
}

export function clearAttempt(): void {
  try {
    window.localStorage.removeItem(ATTEMPT_KEY);
  } catch {
    /* ignore */
  }
}

export function loadMuted(): boolean {
  try {
    return window.localStorage.getItem(MUTED_KEY) === '1';
  } catch {
    return false;
  }
}

export function saveMuted(muted: boolean): void {
  try {
    window.localStorage.setItem(MUTED_KEY, muted ? '1' : '0');
  } catch {
    /* ignore */
  }
}
