import type { Answers } from '../data/types';

export type ExamStatus = 'idle' | 'in_progress' | 'submitted';

export interface ExamSession {
  version: 1;
  attemptId: string;
  studentName: string;
  status: ExamStatus;
  startedAt: number | null;
  submittedAt: number | null;
  answers: Answers;
  currentIndex: number;
  soundOn: boolean;
}

const KEY = 'arabic-g5-grammar-spelling-exam:v1';

export function newSession(soundOn = true): ExamSession {
  return {
    version: 1,
    attemptId: '',
    studentName: '',
    status: 'idle',
    startedAt: null,
    submittedAt: null,
    answers: {},
    currentIndex: 0,
    soundOn,
  };
}

export function loadSession(): ExamSession {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return newSession();
    const s = JSON.parse(raw) as ExamSession;
    if (s.version !== 1) return newSession();
    return { ...newSession(), ...s };
  } catch {
    return newSession();
  }
}

export function saveSession(s: ExamSession) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* storage unavailable – exam still works in memory */
  }
}

export function makeAttemptId(): string {
  const rnd = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `ATT-${Date.now().toString(36).toUpperCase()}-${rnd}`;
}
