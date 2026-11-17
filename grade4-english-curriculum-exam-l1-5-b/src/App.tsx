import { useCallback, useEffect, useMemo, useState } from 'react';
import { ExamPage } from './components/ExamPage';
import { ResultsPage } from './components/ResultsPage';
import { TeacherKeyPage } from './components/TeacherKeyPage';
import { WelcomePage } from './components/WelcomePage';
import { EXAM_QUESTIONS } from './data/questions';
import { PersistedExamState } from './types/exam';
import { evaluateExam, getCompletionSummary } from './utils/scoring';
import { playExamStartSound, playExamSubmitSound } from './utils/soundEffects';
import {
  createAttemptId,
  loadExamState,
  resetForNewAttempt,
  saveExamState,
} from './utils/storage';
import { retryPending } from './utils/submit';

export function App() {
  const [examState, setExamState] = useState<PersistedExamState>(() => loadExamState());
  const [showTeacherKey, setShowTeacherKey] = useState(false);

  // Persist every exam state change to localStorage for seamless recovery
  useEffect(() => {
    saveExamState(examState);
  }, [examState]);

  // Safety guard: never allow the Teacher Answer Key to be visible during an active attempt
  useEffect(() => {
    if (examState.phase === 'active' && showTeacherKey) {
      setShowTeacherKey(false);
    }
  }, [examState.phase, showTeacherKey]);

  // Live upward-counting stopwatch driven by start timestamp
  useEffect(() => {
    if (examState.phase !== 'active' || examState.startedAtTimestamp === null) {
      return;
    }

    const startTs = examState.startedAtTimestamp;
    const tick = () => {
      const nextElapsed = Math.max(0, Date.now() - startTs);
      setExamState((prev) => {
        if (prev.phase !== 'active' || prev.startedAtTimestamp !== startTs) return prev;
        return { ...prev, elapsedMs: nextElapsed };
      });
    };

    tick();
    const intervalId = window.setInterval(tick, 500);
    return () => window.clearInterval(intervalId);
  }, [examState.phase, examState.startedAtTimestamp]);

  const handleToggleMute = useCallback(() => {
    setExamState((prev) => ({ ...prev, muted: !prev.muted }));
  }, []);

  const handleStartExam = useCallback(
    (studentName: string) => {
      const trimmed = studentName.trim();
      if (!trimmed) return;
      const now = Date.now();
      setShowTeacherKey(false);
      playExamStartSound(examState.muted);
      setExamState((prev) => ({
        version: 1,
        phase: 'active',
        studentName: trimmed,
        currentQuestionIndex: 0,
        answers: {},
        startedAtTimestamp: now,
        elapsedMs: 0,
        submittedAtIso: null,
        muted: prev.muted,
        // One stable attempt identity per attempt: every resend reuses it.
        attemptId: createAttemptId(),
        startedAtIso: new Date(now).toISOString(),
      }));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [examState.muted]
  );

  const handleSelectQuestion = useCallback((index: number) => {
    setExamState((prev) => {
      if (prev.phase !== 'active') return prev;
      return {
        ...prev,
        currentQuestionIndex: Math.max(0, Math.min(EXAM_QUESTIONS.length - 1, index)),
      };
    });
  }, []);

  const handleChangeAnswer = useCallback((subPartKey: string, value: string | number[]) => {
    setExamState((prev) => {
      if (prev.phase !== 'active') return prev;
      const liveElapsed =
        prev.startedAtTimestamp !== null
          ? Math.max(prev.elapsedMs, Date.now() - prev.startedAtTimestamp)
          : prev.elapsedMs;
      return {
        ...prev,
        elapsedMs: liveElapsed,
        answers: {
          ...prev.answers,
          [subPartKey]: value,
        },
      };
    });
  }, []);

  // Immediate submission with zero confirmation dialogs once all 50 questions are complete
  const handleSubmitExam = useCallback(() => {
    setExamState((prev) => {
      if (prev.phase !== 'active') return prev;
      const completion = getCompletionSummary(prev.answers, EXAM_QUESTIONS);
      if (!completion.allComplete) return prev;

      const now = Date.now();
      const finalElapsed =
        prev.startedAtTimestamp !== null
          ? Math.max(prev.elapsedMs, now - prev.startedAtTimestamp)
          : prev.elapsedMs;

      playExamSubmitSound(prev.muted);

      return {
        ...prev,
        phase: 'submitted',
        elapsedMs: finalElapsed,
        submittedAtIso: new Date(now).toISOString(),
      };
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Explicit restart allowed only after completion; clears name so a new name is required
  const handleStartNewAttempt = useCallback(() => {
    setShowTeacherKey(false);
    setExamState((prev) => resetForNewAttempt(prev.muted));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Queued results (a previous failure) are retried silently on load. The
  // attempt currently on screen is excluded so ResultsPage owns its own delivery.
  useEffect(() => {
    void retryPending({
      excludeAttemptId: examState.phase === 'submitted' ? examState.attemptId : undefined,
    });
    // Run once per page load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleOpenTeacherKey = useCallback(() => {
    if (examState.phase === 'active') return;
    setShowTeacherKey(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [examState.phase]);

  const evaluation = useMemo(() => {
    if (examState.phase !== 'submitted') return null;
    return evaluateExam({
      studentName: examState.studentName,
      answers: examState.answers,
      elapsedMs: examState.elapsedMs,
      submittedAtIso: examState.submittedAtIso ?? new Date().toISOString(),
      questions: EXAM_QUESTIONS,
    });
  }, [examState]);

  if (showTeacherKey && examState.phase !== 'active') {
    return (
      <TeacherKeyPage
        onClose={() => setShowTeacherKey(false)}
        returnLabel={examState.phase === 'submitted' ? 'Back to Results' : 'Back to Welcome'}
      />
    );
  }

  if (examState.phase === 'active') {
    return (
      <ExamPage
        studentName={examState.studentName}
        currentQuestionIndex={examState.currentQuestionIndex}
        answers={examState.answers}
        elapsedMs={examState.elapsedMs}
        muted={examState.muted}
        onToggleMute={handleToggleMute}
        onSelectQuestion={handleSelectQuestion}
        onChangeAnswer={handleChangeAnswer}
        onSubmitExam={handleSubmitExam}
      />
    );
  }

  if (examState.phase === 'submitted' && evaluation) {
    return (
      <ResultsPage
        evaluation={evaluation}
        attemptId={examState.attemptId}
        startedAtIso={examState.startedAtIso ?? examState.submittedAtIso ?? new Date().toISOString()}
        muted={examState.muted}
        onToggleMute={handleToggleMute}
        onStartNewAttempt={handleStartNewAttempt}
        onOpenTeacherKey={handleOpenTeacherKey}
      />
    );
  }

  return (
    <WelcomePage
      muted={examState.muted}
      onToggleMute={handleToggleMute}
      onStartExam={handleStartExam}
      onOpenTeacherKey={handleOpenTeacherKey}
    />
  );
}

export default App;
