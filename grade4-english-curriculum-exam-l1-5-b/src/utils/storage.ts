import { ATTEMPT_STORAGE_KEY } from '../config';
import { TOTAL_MAIN_QUESTIONS } from '../data/passages';
import { PersistedExamState } from '../types/exam';

/**
 * Version-B-only attempt storage key, namespaced by this exam's own id so no
 * other exam on the platform can read or overwrite this attempt.
 */
export const EXAM_STORAGE_KEY = ATTEMPT_STORAGE_KEY;

/**
 * Stable attempt id. The id is created once when the attempt starts and is
 * reused for every resend, so the server can de-duplicate it.
 */
export function createAttemptId(): string {
  try {
    const c = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
    if (c && typeof c.randomUUID === 'function') return c.randomUUID();
  } catch {
    /* Old browser or insecure context — fall back to the id below. */
  }
  const rand = () => Math.random().toString(36).slice(2, 10);
  return `${Date.now()}-${rand()}${rand()}`;
}

export function createInitialExamState(muted = false): PersistedExamState {
  return {
    version: 1,
    phase: 'welcome',
    studentName: '',
    currentQuestionIndex: 0,
    answers: {},
    startedAtTimestamp: null,
    elapsedMs: 0,
    submittedAtIso: null,
    muted,
    attemptId: '',
    startedAtIso: null,
  };
}

export function loadExamState(storage: Storage | null = getBrowserStorage()): PersistedExamState {
  if (!storage) return createInitialExamState();
  try {
    const raw = storage.getItem(EXAM_STORAGE_KEY);
    if (!raw) return createInitialExamState();
    const parsed = JSON.parse(raw) as Partial<PersistedExamState>;
    if (!parsed || parsed.version !== 1) return createInitialExamState();

    const phase =
      parsed.phase === 'active' || parsed.phase === 'submitted' || parsed.phase === 'welcome'
        ? parsed.phase
        : 'welcome';
    const studentName = typeof parsed.studentName === 'string' ? parsed.studentName : '';
    const muted = Boolean(parsed.muted);
    const rawIdx = typeof parsed.currentQuestionIndex === 'number' ? parsed.currentQuestionIndex : 0;
    const currentQuestionIndex = Math.max(
      0,
      Math.min(TOTAL_MAIN_QUESTIONS - 1, Math.floor(rawIdx))
    );
    const answers =
      parsed.answers && typeof parsed.answers === 'object' && !Array.isArray(parsed.answers)
        ? parsed.answers
        : {};
    const startedAtTimestamp =
      typeof parsed.startedAtTimestamp === 'number' && Number.isFinite(parsed.startedAtTimestamp)
        ? parsed.startedAtTimestamp
        : null;
    const elapsedMs =
      typeof parsed.elapsedMs === 'number' && Number.isFinite(parsed.elapsedMs) && parsed.elapsedMs >= 0
        ? parsed.elapsedMs
        : 0;
    const submittedAtIso =
      typeof parsed.submittedAtIso === 'string' ? parsed.submittedAtIso : null;
    const attemptId = typeof parsed.attemptId === 'string' ? parsed.attemptId : '';
    const startedAtIso = typeof parsed.startedAtIso === 'string' ? parsed.startedAtIso : null;

    // Safeguard: an active or submitted exam must have a non-empty student name
    if ((phase === 'active' || phase === 'submitted') && studentName.trim().length === 0) {
      return createInitialExamState(muted);
    }

    // Recompute live elapsed time on recovery if active
    const recoveredElapsed =
      phase === 'active' && startedAtTimestamp !== null
        ? Math.max(elapsedMs, Date.now() - startedAtTimestamp)
        : elapsedMs;

    const recoveredStart =
      phase === 'active' && startedAtTimestamp === null
        ? Date.now() - recoveredElapsed
        : startedAtTimestamp;

    // Records written before Version B delivered results keep their identity:
    // a missing attempt id is replaced once, on recovery, and then persisted.
    return {
      version: 1,
      phase,
      studentName,
      currentQuestionIndex,
      answers,
      startedAtTimestamp: recoveredStart,
      elapsedMs: recoveredElapsed,
      submittedAtIso,
      muted,
      attemptId:
        (phase === 'active' || phase === 'submitted') && !attemptId
          ? createAttemptId()
          : attemptId,
      startedAtIso:
        startedAtIso ??
        (recoveredStart !== null ? new Date(recoveredStart).toISOString() : null),
    };
  } catch {
    return createInitialExamState();
  }
}

export function saveExamState(
  state: PersistedExamState,
  storage: Storage | null = getBrowserStorage()
): void {
  if (!storage) return;
  try {
    storage.setItem(EXAM_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage quota errors gracefully
  }
}

export function resetForNewAttempt(
  muted: boolean,
  storage: Storage | null = getBrowserStorage()
): PersistedExamState {
  const fresh = createInitialExamState(muted);
  saveExamState(fresh, storage);
  return fresh;
}

function getBrowserStorage(): Storage | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage;
    }
  } catch {
    return null;
  }
  return null;
}

export function formatStopwatch(elapsedMs: number): string {
  const totalSeconds = Math.max(0, Math.floor(elapsedMs / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

export function formatSubmissionDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat('en-GB', {
    year: 'numeric',
    month: 'long',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(date);
}
