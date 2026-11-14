import { ExamSessionState } from '../types/exam';

export const STORAGE_KEY = 'MATHVERSE_GRADE8_EXAM_SESSION_V1';

/**
 * معرّف فريد لكل محاولة جديدة: يُفضَّل crypto.randomUUID، ويُستبدل بمعرّف زمني
 * موسّع العشوائية في المتصفحات القديمة — لا يتكرر عملياً بين محاولتين.
 */
function generateAttemptId(): string {
  try {
    const c = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
    if (c && typeof c.randomUUID === 'function') return 'ATT_' + c.randomUUID();
  } catch {
    /* سياق غير آمن — نستعمل البديل أدناه */
  }
  return (
    'ATT_' +
    Date.now() +
    '_' +
    Math.random().toString(36).substring(2, 7).toUpperCase() +
    Math.random().toString(36).substring(2, 7).toUpperCase()
  );
}

export function createInitialSessionState(): ExamSessionState {
  return {
    examId: 'MATHVERSE_G8_ALG_GEO',
    version: '1.0.0',
    attemptId: generateAttemptId(),
    studentName: '',
    isStarted: false,
    isSubmitted: false,
    currentQuestionIndex: 0,
    visitedQuestions: [0],
    answers: {},
    startTime: null,
    submissionTime: null,
    elapsedSeconds: 0
  };
}

export function loadSavedSession(): ExamSessionState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialSessionState();
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && parsed.examId === 'MATHVERSE_G8_ALG_GEO') {
      return parsed as ExamSessionState;
    }
  } catch (error) {
    console.warn('Could not read session from localStorage:', error);
  }
  return createInitialSessionState();
}

export function saveSessionState(state: ExamSessionState): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch (error) {
    console.error('Failed to save session state to localStorage:', error);
    return false;
  }
}

export function clearSessionState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear session state from localStorage:', error);
  }
}
