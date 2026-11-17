import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ExamScreen from "@/components/ExamScreen";
import Landing from "@/components/Landing";
import Results from "@/components/Results";
import TeacherKey from "@/components/TeacherKey";
import { playStartSound, playSubmitSound } from "@/lib/audio";
import { gradeExam } from "@/lib/grading";
import {
  clearAttempt,
  elapsedMs,
  isMuted,
  loadAttempt,
  saveAttempt,
  setMuted as persistMuted,
  type Attempt,
} from "@/lib/storage";

type Screen = "entry" | "exam" | "results" | "teacher";

export default function App() {
  const [attempt, setAttempt] = useState<Attempt | null>(() => loadAttempt());
  const [screen, setScreen] = useState<Screen>(() => {
    const saved = loadAttempt();
    if (!saved) return "entry";
    return saved.status === "submitted" ? "results" : "exam";
  });
  const [muted, setMutedState] = useState<boolean>(() => isMuted());
  const [now, setNow] = useState<number>(() => Date.now());
  const returnTo = useRef<Screen>("entry");

  /* count-up clock — timestamp based, so refreshes and navigation stay correct */
  useEffect(() => {
    if (screen !== "exam" || attempt?.status !== "active") return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [screen, attempt?.status]);

  const toggleMute = useCallback(() => {
    setMutedState((prev) => {
      const next = !prev;
      persistMuted(next);
      return next;
    });
  }, []);

  const start = useCallback((name: string) => {
    const fresh: Attempt = {
      name,
      answers: {},
      startTs: Date.now(),
      current: 0,
      status: "active",
      model: "B",
    };
    saveAttempt(fresh);
    setAttempt(fresh);
    setNow(Date.now());
    setScreen("exam");
    if (!isMuted()) playStartSound();
  }, []);

  const patch = useCallback((updater: (prev: Attempt) => Attempt) => {
    setAttempt((prev) => {
      if (!prev) return prev;
      const next = updater(prev);
      saveAttempt(next);
      return next;
    });
  }, []);

  const answer = useCallback(
    (partId: string, value: string) => {
      patch((prev) => ({ ...prev, answers: { ...prev.answers, [partId]: value } }));
    },
    [patch]
  );

  const navigate = useCallback(
    (index: number) => {
      patch((prev) => ({ ...prev, current: Math.max(0, Math.min(49, index)) }));
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [patch]
  );

  const submit = useCallback(() => {
    if (!attempt || attempt.status !== "active") return;
    const submittedTs = Date.now();
    const next: Attempt = {
      ...attempt,
      status: "submitted",
      submittedTs,
      elapsedMs: elapsedMs(attempt.startTs, submittedTs),
    };
    saveAttempt(next);
    setAttempt(next);
    setScreen("results");
    if (!isMuted()) playSubmitSound();
  }, [attempt]);

  const restart = useCallback(() => {
    clearAttempt();
    setAttempt(null);
    setScreen("entry");
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  const openTeacher = useCallback(() => {
    returnTo.current = screen === "teacher" ? "entry" : screen;
    setScreen("teacher");
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [screen]);

  const closeTeacher = useCallback(() => {
    setScreen(returnTo.current);
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  /* never show an exam/results screen without an attempt behind it */
  const safeScreen: Screen =
    (screen === "exam" || screen === "results") && !attempt ? "entry" : screen;

  const result = useMemo(
    () => (attempt && attempt.status === "submitted" ? gradeExam(attempt.answers) : null),
    [attempt]
  );

  if (safeScreen === "exam" && attempt) {
    return (
      <ExamScreen
        name={attempt.name}
        answers={attempt.answers}
        current={attempt.current}
        elapsed={elapsedMs(attempt.startTs, now)}
        muted={muted}
        onToggleMute={toggleMute}
        onAnswer={answer}
        onNavigate={navigate}
        onSubmit={submit}
      />
    );
  }

  if (safeScreen === "results" && attempt && result && attempt.submittedTs !== undefined) {
    return (
      <Results
        name={attempt.name}
        result={result}
        submittedTs={attempt.submittedTs}
        elapsedMs={attempt.elapsedMs ?? elapsedMs(attempt.startTs, attempt.submittedTs)}
        muted={muted}
        onToggleMute={toggleMute}
        onRestart={restart}
        onOpenTeacher={openTeacher}
      />
    );
  }

  if (safeScreen === "teacher") {
    return <TeacherKey onClose={closeTeacher} />;
  }

  return (
    <Landing
      onStart={start}
      onOpenTeacher={openTeacher}
      muted={muted}
      onToggleMute={toggleMute}
      resumeName={attempt?.name}
    />
  );
}
