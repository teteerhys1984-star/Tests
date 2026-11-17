import { useEffect, useMemo, useState } from "react";
import ExamScreen from "./components/ExamScreen";
import Results from "./components/Results";
import TeacherArea from "./components/TeacherArea";
import Welcome from "./components/Welcome";
import { QUESTIONS } from "./data/exam";
import { buildReport, type ExamReport } from "./lib/grading";
import { playStartSound, playSubmitSound } from "./lib/sound";
import {
  archiveCurrentReport,
  clearAttempt,
  clearReport,
  loadAttempt,
  loadPreviousReport,
  loadReport,
  saveAttempt,
  saveReport,
  type Attempt,
} from "./lib/storage";

type View = "welcome" | "exam" | "results";

const MUTE_KEY = "g8-unit1-modelB.muted.v1";

interface Boot {
  view: View;
  attempt: Attempt | null;
  report: ExamReport | null;
  index: number;
}

function bootState(): Boot {
  const report = loadReport();
  const attempt = loadAttempt();
  if (report && attempt?.submittedAt) {
    return {
      view: "results",
      attempt,
      report,
      index: Math.min(attempt.index ?? 0, QUESTIONS.length - 1),
    };
  }
  if (attempt && !attempt.submittedAt) {
    return {
      view: "exam",
      attempt,
      report: null,
      index: Math.max(0, Math.min(attempt.index ?? 0, QUESTIONS.length - 1)),
    };
  }
  if (attempt) {
    // stale attempt without a report — start clean, never lose a saved report
    clearAttempt();
  }
  return { view: report ? "results" : "welcome", attempt: null, report, index: 0 };
}

export default function App() {
  const boot = useMemo(bootState, []);
  const [view, setView] = useState<View>(boot.view);
  const [attempt, setAttempt] = useState<Attempt | null>(boot.attempt);
  const [report, setReport] = useState<ExamReport | null>(boot.report);
  const [index, setIndex] = useState<number>(boot.index);
  const [teacherOpen, setTeacherOpen] = useState(false);
  const [tick, setTick] = useState<number>(() => Date.now());
  const [previousReport, setPreviousReport] = useState<ExamReport | null>(null);
  const [muted, setMuted] = useState<boolean>(() => {
    try {
      return window.localStorage.getItem(MUTE_KEY) === "1";
    } catch {
      return false;
    }
  });

  /* autosave the active attempt (answers + position) */
  useEffect(() => {
    if (attempt && view === "exam") saveAttempt(attempt);
  }, [attempt, view]);

  /* count-up timer, timestamp based so refresh restores it exactly */
  useEffect(() => {
    if (view !== "exam") return;
    const id = window.setInterval(() => setTick(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [view]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [view]);

  useEffect(() => {
    if (view === "welcome") setPreviousReport(loadPreviousReport());
  }, [view]);

  const elapsedSeconds =
    attempt && view === "exam"
      ? Math.max(0, Math.floor((tick - attempt.startedAt) / 1000))
      : 0;

  function handleStart(name: string) {
    const fresh: Attempt = {
      name,
      startedAt: Date.now(),
      answers: {},
      muted,
      index: 0,
    };
    setAttempt(fresh);
    saveAttempt(fresh);
    setIndex(0);
    setTick(Date.now());
    setView("exam");
    if (!muted) playStartSound();
  }

  function handleAnswer(partId: string, value: string) {
    setAttempt((prev) =>
      prev ? { ...prev, answers: { ...prev.answers, [partId]: value } } : prev,
    );
  }

  function handleIndex(i: number) {
    const clamped = Math.max(0, Math.min(QUESTIONS.length - 1, i));
    setIndex(clamped);
    setAttempt((prev) => (prev ? { ...prev, index: clamped } : prev));
  }

  function toggleMute() {
    setMuted((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(MUTE_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  function handleSubmit() {
    if (!attempt || attempt.submittedAt) return;
    const submittedAt = Date.now();
    const timeSpentSeconds = Math.max(
      0,
      Math.floor((submittedAt - attempt.startedAt) / 1000),
    );
    const built = buildReport(
      attempt.name,
      attempt.answers,
      submittedAt,
      timeSpentSeconds,
    );
    const updated: Attempt = { ...attempt, submittedAt, index };
    saveReport(built);
    setReport(built);
    saveAttempt(updated);
    setAttempt(updated);
    if (!muted) playSubmitSound();
    setView("results");
  }

  function handleRetake() {
    archiveCurrentReport();
    clearReport();
    clearAttempt();
    setReport(null);
    setAttempt(null);
    setIndex(0);
    setView("welcome");
  }

  if (teacherOpen) {
    return <TeacherArea onClose={() => setTeacherOpen(false)} />;
  }

  if (view === "exam" && attempt) {
    return (
      <ExamScreen
        name={attempt.name}
        answers={attempt.answers}
        index={index}
        elapsedSeconds={elapsedSeconds}
        muted={muted}
        onIndexChange={handleIndex}
        onAnswer={handleAnswer}
        onToggleMute={toggleMute}
        onSubmit={handleSubmit}
      />
    );
  }

  if (view === "results" && report) {
    return (
      <Results
        report={report}
        onRetake={handleRetake}
        onOpenTeacher={() => setTeacherOpen(true)}
      />
    );
  }

  return (
    <Welcome
      onStart={handleStart}
      previousReport={previousReport}
      onOpenTeacher={() => setTeacherOpen(true)}
    />
  );
}
