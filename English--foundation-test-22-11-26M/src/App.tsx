import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { QUESTIONS } from "@/data/exam";
import { countAnswered, gradeExam, totalSubs, type AnswerValue } from "@/lib/grading";
import { isMuted, playStartSound, playSubmitSound, setMuted } from "@/lib/audio";
import { clearAttempt, loadAttempt, saveAttempt, type Attempt } from "@/lib/storage";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Exam } from "./components/Exam";
import { Results } from "./components/Results";
import { TeacherArea } from "./components/TeacherArea";
import { Welcome } from "./components/Welcome";

type Screen = "welcome" | "exam" | "results" | "teacher";

export default function App() {
  const [initialAttempt] = useState(loadAttempt);
  const [attempt, setAttempt] = useState<Attempt | null>(initialAttempt);
  const [screen, setScreen] = useState<Screen>(() =>
    initialAttempt ? (initialAttempt.status === "submitted" ? "results" : "exam") : "welcome",
  );
  const [muted, setMutedState] = useState<boolean>(() => isMuted());

  const latestAttempt = useRef<Attempt | null>(attempt);
  const teacherReturn = useRef<Screen>("welcome");

  useEffect(() => {
    latestAttempt.current = attempt;
  }, [attempt]);

  // Every change to the attempt is saved, so a refresh or accidental close restores it.
  useEffect(() => {
    if (attempt) saveAttempt(attempt);
  }, [attempt]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [screen]);

  // Safety net: never allow a screen without the data it needs.
  useEffect(() => {
    if ((screen === "exam" || screen === "results") && !attempt) setScreen("welcome");
    if (screen === "exam" && attempt && attempt.status !== "in-progress") setScreen("results");
    if (screen === "results" && attempt && attempt.status !== "submitted") setScreen("exam");
  }, [screen, attempt]);

  // Grading happens only after submission and is never computed during an attempt.
  const result = useMemo(
    () => (attempt && attempt.status === "submitted" ? gradeExam(QUESTIONS, attempt.answers) : null),
    [attempt],
  );

  const startExam = useCallback((name: string) => {
    const fresh: Attempt = {
      version: 1,
      studentName: name,
      status: "in-progress",
      startedAt: Date.now(),
      submittedAt: null,
      current: 0,
      answers: {},
    };
    setAttempt(fresh);
    setScreen("exam");
    playStartSound();
  }, []);

  const handleAnswer = useCallback((subId: string, value: AnswerValue) => {
    setAttempt((prev) =>
      prev ? { ...prev, answers: { ...prev.answers, [subId]: value } } : prev,
    );
  }, []);

  const handleNavigate = useCallback((index: number) => {
    setAttempt((prev) => (prev ? { ...prev, current: index } : prev));
  }, []);

  const handleSubmit = useCallback(() => {
    const current = latestAttempt.current;
    if (!current || current.status !== "in-progress") return;
    if (countAnswered(QUESTIONS, current.answers) !== totalSubs(QUESTIONS)) return;
    setAttempt((prev) =>
      prev ? { ...prev, status: "submitted", submittedAt: Date.now() } : prev,
    );
    setScreen("results");
    playSubmitSound();
  }, []);

  const handleRestart = useCallback(() => {
    clearAttempt();
    setAttempt(null);
    setScreen("welcome");
  }, []);

  const toggleMute = useCallback(() => {
    const next = !muted;
    setMutedState(next);
    setMuted(next);
  }, [muted]);

  const openTeacher = useCallback(() => {
    teacherReturn.current = screen;
    setScreen("teacher");
  }, [screen]);

  const closeTeacher = useCallback(() => {
    setScreen(teacherReturn.current);
  }, []);

  return (
    <ErrorBoundary onReset={handleRestart}>
      {screen === "welcome" && (
        <Welcome
          onStart={startExam}
          muted={muted}
          onToggleMute={toggleMute}
          onTeacher={openTeacher}
        />
      )}
      {screen === "exam" && attempt && attempt.status === "in-progress" && (
        <Exam
          attempt={attempt}
          questions={QUESTIONS}
          onAnswer={handleAnswer}
          onNavigate={handleNavigate}
          onSubmit={handleSubmit}
          muted={muted}
          onToggleMute={toggleMute}
        />
      )}
      {screen === "results" && attempt && result && (
        <Results
          attempt={attempt}
          questions={QUESTIONS}
          result={result}
          onRestart={handleRestart}
          onTeacher={openTeacher}
        />
      )}
      {screen === "teacher" && <TeacherArea questions={QUESTIONS} onBack={closeTeacher} />}
    </ErrorBoundary>
  );
}
