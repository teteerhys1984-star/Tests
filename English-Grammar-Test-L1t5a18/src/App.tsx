import { useCallback, useEffect, useMemo, useState } from "react";
import ExamScreen from "./pages/ExamScreen";
import ResultsScreen from "./pages/ResultsScreen";
import StartScreen from "./pages/StartScreen";
import TeacherArea from "./pages/TeacherArea";
import type { AnswerValue } from "./exam/examData";
import {
  gradeExam,
  getElapsedSeconds,
  isExamComplete,
  type ExamResult,
} from "./exam/grading";
import { playExamSound } from "./exam/sounds";
import {
  clearAttempt,
  loadAttempt,
  loadMuted,
  saveAttempt,
  saveMuted,
  type StoredAttempt,
} from "./exam/storage";

type Screen = "start" | "exam" | "results" | "teacher";

export default function App() {
  const [initialAttempt] = useState<StoredAttempt | null>(() => loadAttempt());
  const [attempt, setAttempt] = useState<StoredAttempt | null>(() =>
    initialAttempt && initialAttempt.status === "active"
      ? { ...initialAttempt, resumed: true }
      : initialAttempt
  );
  const [screen, setScreen] = useState<Screen>(() => {
    if (!initialAttempt) return "start";
    return initialAttempt.status === "active" ? "exam" : "results";
  });
  const [muted, setMuted] = useState<boolean>(() => loadMuted());

  useEffect(() => {
    if (attempt) saveAttempt(attempt);
  }, [attempt]);

  useEffect(() => {
    if (screen === "results" || screen === "exam" || screen === "teacher") {
      window.scrollTo({ top: 0, behavior: "auto" });
    }
  }, [screen]);

  const toggleMute = useCallback(() => {
    setMuted((previous) => {
      const next = !previous;
      saveMuted(next);
      return next;
    });
  }, []);

  const startExam = useCallback(
    (studentName: string) => {
      const cleanName = studentName.trim();
      if (!cleanName) return;
      const startedAt = Date.now();
      const fresh: StoredAttempt = {
        version: 1,
        studentName: cleanName,
        status: "active",
        startedAt,
        answers: {},
        currentQuestion: 1,
        resumed: false,
      };
      setAttempt(fresh);
      saveAttempt(fresh);
      setScreen("exam");
      playExamSound("start", muted);
      window.scrollTo({ top: 0, behavior: "auto" });
    },
    [muted]
  );

  const updateAnswer = useCallback((branchId: string, value: AnswerValue) => {
    setAttempt((previous) => {
      if (!previous || previous.status !== "active") return previous;
      return {
        ...previous,
        answers: { ...previous.answers, [branchId]: value },
      };
    });
  }, []);

  const navigateQuestion = useCallback((questionNumber: number) => {
    setAttempt((previous) => {
      if (!previous || previous.status !== "active") return previous;
      return { ...previous, currentQuestion: questionNumber };
    });
  }, []);

  const submitExam = useCallback(() => {
    if (!attempt || attempt.status !== "active") return;
    if (!isExamComplete(attempt.answers)) return;
    const submittedAt = Date.now();
    const submitted: StoredAttempt = {
      ...attempt,
      status: "submitted",
      submittedAt,
      elapsedSeconds: getElapsedSeconds(attempt.startedAt, submittedAt),
      resumed: false,
    };
    setAttempt(submitted);
    saveAttempt(submitted);
    playExamSound("submit", muted);
    setScreen("results");
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [attempt, muted]);

  const restartExam = useCallback(() => {
    clearAttempt();
    setAttempt(null);
    setScreen("start");
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  const openTeacher = useCallback(() => {
    setScreen("teacher");
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  const closeTeacher = useCallback(() => {
    if (!attempt) {
      setScreen("start");
    } else if (attempt.status === "active") {
      setScreen("exam");
    } else {
      setScreen("results");
    }
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [attempt]);

  const result = useMemo<ExamResult | null>(() => {
    if (!attempt || attempt.status !== "submitted") return null;
    return gradeExam(
      attempt.studentName,
      attempt.answers,
      attempt.submittedAt,
      attempt.elapsedSeconds ?? getElapsedSeconds(attempt.startedAt, attempt.submittedAt)
    );
  }, [attempt]);

  if (screen === "teacher") {
    return <TeacherArea onBack={closeTeacher} />;
  }

  if (screen === "exam" && attempt && attempt.status === "active") {
    return (
      <ExamScreen
        attempt={attempt}
        muted={muted}
        onToggleMute={toggleMute}
        onAnswer={updateAnswer}
        onNavigate={navigateQuestion}
        onSubmit={submitExam}
      />
    );
  }

  if (screen === "results" && attempt && attempt.status === "submitted" && result) {
    return (
      <ResultsScreen
        result={result}
        onRestart={restartExam}
        onTeacher={openTeacher}
      />
    );
  }

  return (
    <StartScreen
      muted={muted}
      onToggleMute={toggleMute}
      onStart={startExam}
      onTeacher={openTeacher}
    />
  );
}
