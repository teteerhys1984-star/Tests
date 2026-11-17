import { TOTAL_MAIN_QUESTIONS } from '../data/passages';
import { PersistedExamState } from '../types/exam';

export const EXAM_STORAGE_KEY = 'grade4_unit1_lessons1_5_exam_state_v1';

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

    // Safeguard: an active or submitted exam must have a non-empty student name
    if ((phase === 'active' || phase === 'submitted') && studentName.trim().length === 0) {
      return createInitialExamState(muted);
    }

    // Recompute live elapsed time on recovery if active
    const recoveredElapsed =
      phase === 'active' && startedAtTimestamp !== null
        ? Math.max(elapsedMs, Date.now() - startedAtTimestamp)
        : elapsedMs;

    return {
      version: 1,
      phase,
      studentName,
      currentQuestionIndex,
      answers,
      startedAtTimestamp:
        phase === 'active' && startedAtTimestamp === null
          ? Date.now() - recoveredElapsed
          : startedAtTimestamp,
      elapsedMs: recoveredElapsed,
      submittedAtIso,
      muted,
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
