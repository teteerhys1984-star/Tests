/**
 * Grade 8 English Exam — Unit 1 (Lessons 1 & 2).
 * Orchestrates: start screen → exam (with autosave + stopwatch) → results.
 * Attempt state persists in localStorage so refresh never resets progress.
 */
import { useCallback, useEffect, useState } from "react";
import { QUESTIONS } from "./data/questions";
import { playStartSound, playSubmitSound, setSoundMuted } from "./lib/audio";
import { isQuestionAnswered } from "./lib/grading";
import {
  EMPTY_ATTEMPT,
  clearAttempt,
  loadAttempt,
  loadMuted,
  saveAttempt,
  saveMuted,
} from "./lib/storage";
import type { AnswerValue, AttemptState } from "./types";
import { Backdrop } from "./components/Backdrop";
import { Footer } from "./components/Footer";
import { StartScreen } from "./components/StartScreen";
import { ExamScreen } from "./components/ExamScreen";
import { ResultsScreen } from "./components/ResultsScreen";
import { TeacherArea } from "./components/TeacherArea";
import { newAttemptId, retryPending } from "./lib/submit";

export default function App() {
  const [attempt, setAttempt] = useState<AttemptState>(() => loadAttempt());
  const [muted, setMuted] = useState<boolean>(() => loadMuted());
  const [teacherOpen, setTeacherOpen] = useState(false);

  useEffect(() => { void retryPending(); }, []);

  // Persist every change (autosave + refresh recovery).
  useEffect(() => {
    saveAttempt(attempt);
  }, [attempt]);

  useEffect(() => {
    setSoundMuted(muted);
    saveMuted(muted);
  }, [muted]);

  const startExam = useCallback((name: string) => {
    setAttempt({
      phase: "exam",
      studentName: name,
      attemptId: newAttemptId(),
      startTs: Date.now(),
      endTs: null,
      submittedAt: null,
      currentIndex: 0,
      answers: {},
    });
    playStartSound();
    window.scrollTo({ top: 0 });
  }, []);

  const answer = useCallback((id: string, value: AnswerValue) => {
    setAttempt((prev) =>
      prev.phase === "exam"
        ? { ...prev, answers: { ...prev.answers, [id]: value } }
        : prev,
    );
  }, []);

  const navigate = useCallback((index: number) => {
    setAttempt((prev) => ({ ...prev, currentIndex: index }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  /**
   * Submit: immediate — no confirmation dialog. Stops the stopwatch,
   * saves the finished attempt, and moves straight to the results page.
   */
  const submitExam = useCallback(() => {
    setAttempt((prev) => {
      if (prev.phase !== "exam") return prev;
      const allAnswered = QUESTIONS.every((q) =>
        isQuestionAnswered(q, prev.answers),
      );
      if (!allAnswered) return prev;
      return {
        ...prev,
        phase: "results",
        currentIndex: 0,
        endTs: Date.now(),
        submittedAt: new Date().toISOString(),
      };
    });
    // Play sound optimistically — the button is disabled unless complete.
    playSubmitSound();
    window.scrollTo({ top: 0 });
  }, []);

  /** A brand-new attempt exists only after explicit retake. */
  const retake = useCallback(() => {
    clearAttempt();
    setAttempt({ ...EMPTY_ATTEMPT });
    window.scrollTo({ top: 0 });
  }, []);

  const inResults =
    attempt.phase === "results" &&
    attempt.startTs !== null &&
    attempt.endTs !== null &&
    attempt.submittedAt !== null;

  return (
    <div className="relative flex min-h-screen flex-col">
      <Backdrop />

      <div className="relative z-10 flex flex-1 flex-col">
        {attempt.phase === "start" && (
          <StartScreen
            onStart={startExam}
            muted={muted}
            onToggleMute={() => setMuted((m) => !m)}
          />
        )}

        {attempt.phase === "exam" && (
          <ExamScreen
            attempt={attempt}
            muted={muted}
            onToggleMute={() => setMuted((m) => !m)}
            onAnswer={answer}
            onNavigate={navigate}
            onSubmit={submitExam}
          />
        )}

        {inResults && (
          <ResultsScreen
            studentName={attempt.studentName}
            submittedAt={attempt.submittedAt as string}
            startTs={attempt.startTs as number}
            endTs={attempt.endTs as number}
            answers={attempt.answers}
            attemptId={attempt.attemptId ?? newAttemptId()}
            onRetake={retake}
          />
        )}
      </div>

      <Footer onOpenTeacher={() => setTeacherOpen(true)} />
      <TeacherArea open={teacherOpen} onClose={() => setTeacherOpen(false)} />
    </div>
  );
}
