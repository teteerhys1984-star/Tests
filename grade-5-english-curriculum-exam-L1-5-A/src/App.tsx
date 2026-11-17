import { useEffect, useMemo, useState } from "react";
import EntryScreen from "@/components/EntryScreen";
import ExamScreen from "@/components/ExamScreen";
import ResultsScreen from "@/components/ResultsScreen";
import TeacherKey from "@/components/TeacherKey";
import { QUESTIONS } from "@/data/exam";
import { playStartSound, playSubmitSound } from "@/lib/audio";
import { gradeExam } from "@/lib/grading";
import {
  clearAttempt,
  elapsedBetween,
  formatElapsed,
  loadAttempt,
  saveAttempt,
  type Attempt,
} from "@/lib/storage";

type Screen = "entry" | "exam" | "results";

export default function App() {
  const [attempt, setAttempt] = useState<Attempt | null>(() => loadAttempt());
  const [tick, setTick] = useState(() => Date.now());
  const [teacherOpen, setTeacherOpen] = useState(false);

  const screen: Screen = !attempt
    ? "entry"
    : attempt.status === "submitted"
      ? "results"
      : "exam";

  /* ---- count-up timer driven by timestamps, re-checked every second --- */
  useEffect(() => {
    if (screen !== "exam") return;
    const id = window.setInterval(() => setTick(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [screen]);

  const commit = (next: Attempt) => {
    setAttempt(next);
    saveAttempt(next);
  };

  const index = attempt ? Math.min(Math.max(0, attempt.index), QUESTIONS.length - 1) : 0;
  const answers = attempt?.answers ?? {};
  const startedAt = attempt?.startedAt ?? 0;
  const submittedAt = attempt?.submittedAt ?? null;
  const elapsedMs =
    attempt === null ? 0 : elapsedBetween(startedAt, attempt.status === "submitted" ? submittedAt : tick);

  const result = useMemo(
    () => (attempt?.status === "submitted" ? gradeExam(QUESTIONS, answers) : null),
    [attempt?.status, answers],
  );

  /* --------------------------- actions ------------------------------- */
  const handleStart = (name: string) => {
    const next: Attempt = {
      v: 1,
      name,
      answers: {},
      startedAt: Date.now(),
      index: 0,
      status: "in-progress",
      submittedAt: null,
      muted: false,
    };
    commit(next);
    setTick(Date.now());
    playStartSound();
  };

  const handleChange = (partId: string, value: string) => {
    if (!attempt || attempt.status !== "in-progress") return;
    commit({ ...attempt, answers: { ...attempt.answers, [partId]: value } });
  };

  const handleIndex = (i: number) => {
    if (!attempt) return;
    commit({ ...attempt, index: i });
    setTick(Date.now());
  };

  const handleToggleMute = () => {
    if (!attempt) return;
    commit({ ...attempt, muted: !attempt.muted });
  };

  const handleSubmit = () => {
    if (!attempt || attempt.status !== "in-progress") return;
    const now = Date.now();
    // Submit immediately: no confirmation dialog, no intermediate message.
    commit({ ...attempt, status: "submitted", submittedAt: now, index: attempt.index });
    if (!attempt.muted) playSubmitSound();
  };

  const handleRestart = () => {
    clearAttempt();
    setAttempt(null);
    setTick(Date.now());
  };

  const openTeacherKey = () => setTeacherOpen(true);

  /* --------------------------- screens ------------------------------ */
  if (screen === "entry") {
    return (
      <>
        <EntryScreen
          hasSavedAttempt={false}
          savedName=""
          onStart={handleStart}
          onOpenTeacherKey={openTeacherKey}
        />
        <TeacherKey open={teacherOpen} onClose={() => setTeacherOpen(false)} />
      </>
    );
  }

  if (screen === "exam" && attempt) {
    return (
      <>
        <ExamScreen
          questions={QUESTIONS}
          answers={answers}
          index={index}
          name={attempt.name}
          elapsed={formatElapsed(elapsedMs)}
          muted={attempt.muted}
          onIndex={handleIndex}
          onChange={handleChange}
          onToggleMute={handleToggleMute}
          onSubmit={handleSubmit}
        />
        <TeacherKey open={teacherOpen} onClose={() => setTeacherOpen(false)} />
      </>
    );
  }

  if (screen === "results" && attempt && result && submittedAt !== null) {
    return (
      <>
        <ResultsScreen
          name={attempt.name}
          result={result}
          questions={QUESTIONS}
          submittedAt={submittedAt}
          elapsedMs={elapsedMs}
          onRestart={handleRestart}
          onOpenTeacherKey={openTeacherKey}
        />
        <TeacherKey open={teacherOpen} onClose={() => setTeacherOpen(false)} />
      </>
    );
  }

  /* Recovered state that cannot be classified — fall back to a fresh entry. */
  return (
    <>
      <EntryScreen
        hasSavedAttempt={false}
        savedName=""
        onStart={handleStart}
        onOpenTeacherKey={openTeacherKey}
      />
      <TeacherKey open={teacherOpen} onClose={() => setTeacherOpen(false)} />
    </>
  );
}
