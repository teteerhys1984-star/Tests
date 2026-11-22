import { useCallback, useEffect, useState } from 'react';
import type { Attempt } from '../types';
import { clearAttempt, loadAttempt, saveAttempt } from '../lib/storage';

/** إدارة المحاولة مع الحفظ والاستعادة من localStorage */
export function useAttempt(totalQuestions: number) {
  const [attempt, setAttempt] = useState<Attempt | null>(() => loadAttempt());

  useEffect(() => {
    if (attempt) saveAttempt(attempt);
  }, [attempt]);

  const start = useCallback((studentName: string) => {
    setAttempt({ version: 1, status: 'in-progress', studentName, answers: {}, current: 0, startedAt: Date.now(), finishedAt: null });
  }, []);

  const setAnswer = useCallback((key: string, value: string) => {
    setAttempt((a) => (a && a.status === 'in-progress' ? { ...a, answers: { ...a.answers, [key]: value } } : a));
  }, []);

  const goTo = useCallback(
    (index: number) => {
      setAttempt((a) => (a && a.status === 'in-progress' ? { ...a, current: Math.min(Math.max(0, index), totalQuestions - 1) } : a));
    },
    [totalQuestions],
  );

  const submit = useCallback(() => {
    setAttempt((a) => (a && a.status === 'in-progress' ? { ...a, status: 'submitted', finishedAt: Date.now() } : a));
  }, []);

  const reset = useCallback(() => {
    clearAttempt();
    setAttempt(null);
  }, []);

  return { attempt, start, setAnswer, goTo, submit, reset };
}
