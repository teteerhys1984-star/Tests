import type { Attempt } from '../types';

const ATTEMPT_KEY = 'phys7-modelA-attempt-v1';
const MUTE_KEY = 'phys7-modelA-muted';

function isValid(a: unknown): a is Attempt {
  if (!a || typeof a !== 'object') return false;
  const x = a as Record<string, unknown>;
  return (
    x.version === 1 &&
    (x.status === 'in-progress' || x.status === 'submitted') &&
    typeof x.studentName === 'string' &&
    !!x.answers &&
    typeof x.answers === 'object' &&
    typeof x.startedAt === 'number' &&
    (x.current === undefined || typeof x.current === 'number')
  );
}

export function loadAttempt(): Attempt | null {
  try {
    const raw = localStorage.getItem(ATTEMPT_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isValid(parsed)) return null;
    return {
      ...parsed,
      answers: { ...(parsed.answers as Record<string, string>) },
      current: typeof parsed.current === 'number' ? parsed.current : 0,
      finishedAt: typeof parsed.finishedAt === 'number' ? parsed.finishedAt : null,
    };
  } catch {
    return null;
  }
}

export function saveAttempt(a: Attempt): void {
  try {
    localStorage.setItem(ATTEMPT_KEY, JSON.stringify(a));
  } catch {
    /* تجاهل أخطاء التخزين */
  }
}

export function clearAttempt(): void {
  try {
    localStorage.removeItem(ATTEMPT_KEY);
  } catch {
    /* تجاهل */
  }
}

export function loadMuted(): boolean {
  try {
    return localStorage.getItem(MUTE_KEY) === '1';
  } catch {
    return false;
  }
}

export function saveMuted(m: boolean): void {
  try {
    localStorage.setItem(MUTE_KEY, m ? '1' : '0');
  } catch {
    /* تجاهل */
  }
}
