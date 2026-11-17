import { useEffect, useState } from "react";
import { QUESTIONS } from "./data/exam";
import type { Attempt, Phase } from "./data/types";
import { gradeAttempt, isComplete } from "./lib/grade";
import { clearAttempt, loadAttempt, newAttempt, saveAttempt } from "./lib/storage";
import { playStart, playSubmit, playTick } from "./lib/sounds";
import { StartScreen } from "./components/StartScreen";
import { ExamScreen } from "./components/ExamScreen";
import { Results } from "./components/Results";
import { TeacherKey } from "./components/TeacherKey";
import { Footer } from "./components/Footer";

export default function App() {
  const [boot] = useState<Attempt | null>(() => loadAttempt());
  const [attempt, setAttempt] = useState<Attempt | null>(boot);
  const [phase, setPhase] = useState<Phase>(boot ? (boot.submittedAt ? "results" : "exam") : "start");
  const [index, setIndex] = useState<number>(() => Math.min(boot?.idx ?? 0, QUESTIONS.length - 1));
  const [muted, setMuted] = useState<boolean>(boot?.muted ?? false);
  const [teacher, setTeacher] = useState(false);
  const [now, setNow] = useState<number>(() => Date.now());

  /* المؤقّت: عدّ تصاعدي يعتمد على الطابع الزمني، لا على عدّاد في الذاكرة. */
  useEffect(() => {
    if (phase !== "exam") return;
    setNow(Date.now());
    const t = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(t);
  }, [phase]);

  /* الحفظ التلقائي في localStorage مع كل تغيير. */
  useEffect(() => {
    if (attempt && phase !== "start") saveAttempt(attempt);
  }, [attempt, phase]);

  const start = (name: string) => {
    const a = { ...newAttempt(name), muted, idx: 0 };
    setAttempt(a);
    saveAttempt(a);
    setIndex(0);
    setPhase("exam");
    if (!muted) playStart();
  };

  const answer = (subId: string, value: string) => {
    setAttempt((prev) => (prev ? { ...prev, answers: { ...prev.answers, [subId]: value } } : prev));
  };

  const goIndex = (i: number) => {
    const clamped = Math.max(0, Math.min(i, QUESTIONS.length - 1));
    setIndex(clamped);
    setAttempt((prev) => (prev ? { ...prev, idx: clamped } : prev));
    if (!muted) playTick();
  };

  const toggleMute = () => {
    setMuted((m) => {
      const next = !m;
      setAttempt((prev) => (prev ? { ...prev, muted: next } : prev));
      return next;
    });
  };

  const submit = () => {
    if (!attempt || !isComplete(QUESTIONS, attempt.answers)) return;
    const done: Attempt = { ...attempt, submittedAt: Date.now() };
    setAttempt(done);
    saveAttempt(done);
    if (!done.muted) playSubmit();
    setPhase("results");
  };

  const retake = () => {
    clearAttempt();
    setAttempt(null);
    setIndex(0);
    setPhase("start");
    setTeacher(false);
  };

  const score = attempt && phase === "results" ? gradeAttempt(QUESTIONS, attempt.answers) : null;
  const duration =
    attempt && attempt.submittedAt ? formatDuration(attempt.submittedAt - attempt.startedAt) : "—";

  return (
    <div className="paper-grid flex min-h-full flex-col">
      <div className="flex-1">
        {teacher ? (
          <TeacherKey onClose={() => setTeacher(false)} />
        ) : phase === "start" ? (
          <StartScreen
            onStart={start}
            muted={muted}
            onToggleMute={toggleMute}
            resumable={!!boot && !boot.submittedAt}
            onResume={() => setPhase("exam")}
          />
        ) : phase === "exam" && attempt ? (
          <ExamScreen
            questions={QUESTIONS}
            attempt={attempt}
            index={index}
            onIndex={goIndex}
            onAnswer={answer}
            onSubmit={submit}
            muted={muted}
            onToggleMute={toggleMute}
            now={now}
          />
        ) : phase === "results" && attempt && score ? (
          <Results attempt={attempt} score={score} duration={duration} onRetake={retake} />
        ) : null}
      </div>

      <Footer onTeacher={() => setTeacher(true)} showTeacher={phase !== "exam"} />
    </div>
  );
}

function formatDuration(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return [h, m, sec].map((v) => String(v).padStart(2, "0")).join(":");
}
