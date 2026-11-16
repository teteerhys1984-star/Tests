import { useCallback, useEffect, useState } from "react";
import { ExamScreen } from "./components/ExamScreen";
import { Footer } from "./components/Footer";
import { ResultsScreen } from "./components/ResultsScreen";
import { TeacherKeyView } from "./components/TeacherKeyView";
import { WelcomeScreen } from "./components/WelcomeScreen";
import { EXAM_QUESTIONS } from "./data/questions";
import { ExamSessionState, QuestionAnswer } from "./types/exam";
import { areAllQuestionsComplete } from "./utils/grading";
import { playExamStartSound, playExamSubmitSound } from "./utils/sound";
import {
  clearSessionForNewAttempt,
  loadSession,
  saveSession,
} from "./utils/storage";
import { computeElapsedSeconds } from "./utils/timer";

export function App() {
  const [session, setSession] = useState<ExamSessionState>(() => loadSession());
  const [teacherKeyOpen, setTeacherKeyOpen] = useState(false);

  // Persist every session state update to localStorage immediately
  useEffect(() => {
    saveSession(session);
  }, [session]);

  // Continuous timestamp-based stopwatch while the exam is in progress
  useEffect(() => {
    if (session.phase !== "in_progress" || session.startTimestamp === null) {
      return;
    }

    const syncElapsed = () => {
      const now = Date.now();
      setSession((prev) => {
        if (prev.phase !== "in_progress" || prev.startTimestamp === null) {
          return prev;
        }
        const nextElapsed = computeElapsedSeconds(
          prev.startTimestamp,
          prev.elapsedSeconds,
          now
        );
        if (nextElapsed === prev.elapsedSeconds) {
          return prev;
        }
        return {
          ...prev,
          elapsedSeconds: nextElapsed,
          lastTickTimestamp: now,
        };
      });
    };

    syncElapsed();
    const intervalId = window.setInterval(syncElapsed, 500);

    const handleVisibilityOrUnload = () => {
      syncElapsed();
    };

    document.addEventListener("visibilitychange", handleVisibilityOrUnload);
    window.addEventListener("beforeunload", handleVisibilityOrUnload);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityOrUnload);
      window.removeEventListener("beforeunload", handleVisibilityOrUnload);
    };
  }, [session.phase, session.startTimestamp]);

  const handleToggleMute = useCallback(() => {
    setSession((prev) => ({
      ...prev,
      muted: !prev.muted,
    }));
  }, []);

  const handleStartExam = useCallback((studentName: string) => {
    const trimmed = studentName.trim();
    if (!trimmed) return;
    const now = Date.now();

    setSession((prev) => {
      playExamStartSound(prev.muted);
      return {
        version: 1,
        phase: "in_progress",
        studentName: trimmed,
        currentQuestionIndex: 0,
        answers: {},
        startTimestamp: now,
        elapsedSeconds: 0,
        lastTickTimestamp: now,
        submittedAt: null,
        muted: prev.muted,
      };
    });
  }, []);

  const handleSelectQuestion = useCallback((index: number) => {
    setSession((prev) => {
      if (prev.phase !== "in_progress") return prev;
      return {
        ...prev,
        currentQuestionIndex: index,
      };
    });
  }, []);

  const handleAnswerChange = useCallback(
    (questionId: string, answer: QuestionAnswer) => {
      setSession((prev) => {
        if (prev.phase !== "in_progress") return prev;
        return {
          ...prev,
          answers: {
            ...prev.answers,
            [questionId]: answer,
          },
        };
      });
    },
    []
  );

  // Immediate submission with NO confirmation dialog once all 50 questions are complete
  const handleSubmitExam = useCallback(() => {
    setSession((prev) => {
      if (prev.phase !== "in_progress") return prev;
      if (!areAllQuestionsComplete(EXAM_QUESTIONS, prev.answers)) return prev;

      const now = Date.now();
      const finalElapsed = computeElapsedSeconds(
        prev.startTimestamp,
        prev.elapsedSeconds,
        now
      );

      playExamSubmitSound(prev.muted);

      return {
        ...prev,
        phase: "submitted",
        elapsedSeconds: finalElapsed,
        lastTickTimestamp: now,
        submittedAt: new Date(now).toISOString(),
      };
    });

    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    }
  }, []);

  // Explicit restart permitted only after completing the previous attempt
  const handleStartNewExam = useCallback(() => {
    setSession((prev) => {
      if (prev.phase !== "submitted") return prev;
      return clearSessionForNewAttempt(prev.muted);
    });
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        {teacherKeyOpen && session.phase !== "in_progress" ? (
          <TeacherKeyView
            questions={EXAM_QUESTIONS}
            onClose={() => setTeacherKeyOpen(false)}
          />
        ) : session.phase === "welcome" ? (
          <WelcomeScreen
            initialName={session.studentName}
            muted={session.muted}
            onToggleMute={handleToggleMute}
            onStartExam={handleStartExam}
            onOpenTeacherKey={() => setTeacherKeyOpen(true)}
          />
        ) : session.phase === "in_progress" ? (
          <ExamScreen
            studentName={session.studentName}
            questions={EXAM_QUESTIONS}
            currentIndex={session.currentQuestionIndex}
            answers={session.answers}
            elapsedSeconds={session.elapsedSeconds}
            muted={session.muted}
            onToggleMute={handleToggleMute}
            onSelectQuestion={handleSelectQuestion}
            onAnswerChange={handleAnswerChange}
            onSubmitExam={handleSubmitExam}
          />
        ) : (
          <ResultsScreen
            studentName={session.studentName}
            questions={EXAM_QUESTIONS}
            answers={session.answers}
            elapsedSeconds={session.elapsedSeconds}
            submittedAt={session.submittedAt || new Date().toISOString()}
            muted={session.muted}
            onToggleMute={handleToggleMute}
            onStartNewExam={handleStartNewExam}
            onOpenTeacherKey={() => setTeacherKeyOpen(true)}
          />
        )}
      </main>

      <Footer />
    </div>
  );
}

export default App;
