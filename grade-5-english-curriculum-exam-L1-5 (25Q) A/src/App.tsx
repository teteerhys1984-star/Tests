import { useCallback, useEffect, useMemo, useState } from "react";
import StartScreen from "@/components/StartScreen";
import ExamScreen from "@/components/ExamScreen";
import ResultScreen from "@/components/ResultScreen";
import TeacherKey from "@/components/TeacherKey";
import type { Attempt } from "@/lib/attempt";
import {
  clearAttempt,
  loadAttempt,
  loadMuted,
  saveAttempt,
  saveMuted,
} from "@/lib/attempt";
import { gradeExam } from "@/lib/grading";
import { playStart, playSubmit, setMuted } from "@/lib/sound";

type Screen = "start" | "exam" | "results" | "teacher";

export default function App() {
  const [screen, setScreen] = useState<Screen>("start");
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [muted, setMutedState] = useState<boolean>(() => loadMuted());
  const [returnTo, setReturnTo] = useState<Screen>("start");

  /* Restore the active attempt after a refresh — never silently start a new one. */
  useEffect(() => {
    const existing = loadAttempt();
    if (existing) {
      setAttempt(existing);
      setScreen(existing.submittedAt ? "results" : "exam");
    }
    setMuted(loadMuted());
  }, []);

  useEffect(() => {
    setMuted(muted);
    saveMuted(muted);
  }, [muted]);

  const toggleMute = useCallback(() => setMutedState((m) => !m), []);

  const handleStart = useCallback((name: string) => {
    const fresh: Attempt = {
      name,
      startedAt: Date.now(),
      answers: {},
      submittedAt: null,
    };
    saveAttempt(fresh);
    setAttempt(fresh);
    setScreen("exam");
    playStart();
  }, []);

  const handleAnswer = useCallback(
    (key: string, value: string) => {
      setAttempt((prev) => {
        if (!prev || prev.submittedAt) return prev;
        const next: Attempt = { ...prev, answers: { ...prev.answers, [key]: value } };
        saveAttempt(next);
        return next;
      });
    },
    [],
  );

  const handleSubmit = useCallback(() => {
    setAttempt((prev) => {
      if (!prev || prev.submittedAt) return prev;
      const next: Attempt = { ...prev, submittedAt: Date.now() };
      saveAttempt(next);
      return next;
    });
    playSubmit();
    setScreen("results");
  }, []);

  const handleRetake = useCallback(() => {
    clearAttempt();
    setAttempt(null);
    setScreen("start");
  }, []);

  const handleOpenTeacher = useCallback(() => {
    setReturnTo(screen === "teacher" ? "results" : screen);
    setScreen("teacher");
  }, [screen]);

  const handleCloseTeacher = useCallback(() => setScreen(returnTo), [returnTo]);

  const result = useMemo(() => {
    if (!attempt?.submittedAt) return null;
    return gradeExam(attempt.answers, attempt.name);
  }, [attempt]);

  /* Edge: a stored attempt with no name falls back to the start gate. */
  useEffect(() => {
    if (screen !== "teacher" && attempt && !attempt.name.trim()) {
      setScreen("start");
    }
  }, [attempt, screen]);

  if (screen === "teacher") return <TeacherKey onClose={handleCloseTeacher} />;

  if (screen === "exam" && attempt && !attempt.submittedAt) {
    return (
      <ExamScreen
        attempt={attempt}
        onAnswer={handleAnswer}
        onSubmit={handleSubmit}
        muted={muted}
        onToggleMute={toggleMute}
      />
    );
  }

  if (screen === "results" && attempt && result) {
    return (
      <ResultScreen
        attempt={attempt}
        result={result}
        muted={muted}
        onToggleMute={toggleMute}
        onRetake={handleRetake}
        onOpenTeacher={handleOpenTeacher}
      />
    );
  }

  return <StartScreen onStart={handleStart} muted={muted} onToggleMute={toggleMute} />;
}
