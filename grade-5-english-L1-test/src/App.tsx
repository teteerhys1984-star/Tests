import { useCallback, useEffect, useMemo, useState } from "react";
import StartScreen from "./components/StartScreen";
import ExamScreen from "./components/ExamScreen";
import ResultsScreen from "./components/ResultsScreen";
import TeacherKey from "./components/TeacherKey";
import { ALL_ITEMS, QUESTIONS } from "./data/exam";
import { gradeExam, isItemAnswered, type Answer } from "./lib/grading";
import { playStartSound, playSubmitSound } from "./lib/sound";
import { loadAttempt, loadMuted, loadSavedName, saveAttempt, saveMuted, saveName, type Attempt } from "./lib/storage";

function useHash(): string {
  const [hash, setHash] = useState(() => window.location.hash);
  useEffect(() => {
    const onChange = () => setHash(window.location.hash);
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return hash;
}

export default function App() {
  const hash = useHash();
  // Restores any unfinished or submitted attempt from localStorage. Never creates one automatically.
  const [attempt, setAttempt] = useState<Attempt | null>(() => loadAttempt());
  const [draftName, setDraftName] = useState<string>(() => loadSavedName());
  const [muted, setMuted] = useState<boolean>(() => loadMuted());

  useEffect(() => {
    saveAttempt(attempt);
  }, [attempt]);

  const handleStart = useCallback(
    (name: string) => {
      saveName(name);
      setDraftName(name);
      setAttempt({
        studentName: name,
        status: "in-progress",
        startedAt: Date.now(),
        currentQuestion: 1,
        answers: {},
      });
      playStartSound(muted);
    },
    [muted],
  );

  const handleAnswer = useCallback((itemId: string, value: Answer) => {
    setAttempt((prev) => (prev && prev.status === "in-progress" ? { ...prev, answers: { ...prev.answers, [itemId]: value } } : prev));
  }, []);

  const handleGoto = useCallback((n: number) => {
    setAttempt((prev) => (prev && prev.status === "in-progress" ? { ...prev, currentQuestion: n } : prev));
  }, []);

  const handleSubmit = useCallback(() => {
    // Submits immediately: no confirmation dialog. Only enabled when every answer is complete.
    setAttempt((prev) => {
      if (!prev || prev.status !== "in-progress") return prev;
      const complete = ALL_ITEMS.every((x) => isItemAnswered(prev.answers[x.item.id]));
      if (!complete) return prev;
      return { ...prev, status: "submitted", submittedAt: Date.now() };
    });
    playSubmitSound(muted);
  }, [muted]);

  const handleNewAttempt = useCallback(() => {
    saveName(null);
    setDraftName("");
    setAttempt(null);
  }, []);

  const toggleMute = useCallback(() => {
    setMuted((m) => {
      saveMuted(!m);
      return !m;
    });
  }, []);

  const result = useMemo(() => (attempt ? gradeExam(attempt.answers) : null), [attempt]);

  // Hidden teacher area: reachable only by typing the #teacher address; no link is shown to students.
  if (hash === "#teacher") {
    return <TeacherKey attempt={attempt} onBack={() => (window.location.hash = "")} />;
  }

  if (!attempt) {
    return (
      <StartScreen
        draftName={draftName}
        onDraftChange={(v) => {
          setDraftName(v);
          saveName(v);
        }}
        onStart={handleStart}
        muted={muted}
        onToggleMute={toggleMute}
      />
    );
  }

  if (attempt.status === "submitted" && attempt.submittedAt && result) {
    return (
      <ResultsScreen
        studentName={attempt.studentName}
        startedAt={attempt.startedAt}
        submittedAt={attempt.submittedAt}
        result={result}
        onNewAttempt={handleNewAttempt}
      />
    );
  }

  return (
    <ExamScreen
      studentName={attempt.studentName}
      startedAt={attempt.startedAt}
      currentQuestion={attempt.currentQuestion || QUESTIONS[0].number}
      answers={attempt.answers}
      muted={muted}
      onToggleMute={toggleMute}
      onAnswer={handleAnswer}
      onGoto={handleGoto}
      onSubmit={handleSubmit}
    />
  );
}
