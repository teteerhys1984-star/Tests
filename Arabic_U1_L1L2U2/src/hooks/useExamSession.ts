import { useCallback, useEffect, useState } from 'react';
import type { AnswerValue } from '../data/types';
import { loadSession, makeAttemptId, newSession, saveSession, type ExamSession } from '../utils/storage';

export function useExamSession() {
  const [session, setSession] = useState<ExamSession>(() => loadSession());

  useEffect(() => saveSession(session), [session]);

  const start = useCallback((name: string) => {
    setSession((s) => ({
      ...newSession(s.soundOn),
      attemptId: makeAttemptId(),
      studentName: name.trim(),
      status: 'in_progress',
      startedAt: Date.now(),
    }));
  }, []);

  const setAnswer = useCallback((key: string, v: AnswerValue | undefined) => {
    setSession((s) => (s.status !== 'in_progress' ? s : { ...s, answers: { ...s.answers, [key]: v } }));
  }, []);

  const goTo = useCallback((i: number) => setSession((s) => ({ ...s, currentIndex: i })), []);

  const submit = useCallback(() => {
    setSession((s) => (s.status !== 'in_progress' ? s : { ...s, status: 'submitted', submittedAt: Date.now() }));
  }, []);

  /** Only allowed after submission: wipes the previous attempt entirely. */
  const reset = useCallback(() => {
    setSession((s) => (s.status === 'submitted' ? newSession(s.soundOn) : s));
  }, []);

  const toggleSound = useCallback(() => setSession((s) => ({ ...s, soundOn: !s.soundOn })), []);

  return { session, start, setAnswer, goTo, submit, reset, toggleSound };
}
