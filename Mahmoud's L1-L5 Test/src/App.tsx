import { useCallback, useState } from "react";
import ExamScreen from "./components/ExamScreen";
import Footer from "./components/Footer";
import ResultsScreen from "./components/ResultsScreen";
import TeacherKey from "./components/TeacherKey";
import WelcomeScreen from "./components/WelcomeScreen";
import { QUESTIONS } from "./data/questions";
import { gradeExam, missingPartIds } from "./logic/grading";
import { playStartSound, playSubmitSound } from "./logic/sounds";
import { BLANK_SESSION, clearSession, loadSession, saveSession } from "./logic/storage";
import type { AnswerValue, ExamSession } from "./types";

export default function App() {
  const [session, setSession] = useState<ExamSession>(loadSession);
  const [teacherOpen, setTeacherOpen] = useState(false);

  /** apply a patch, update React state and persist atomically */
  const update = useCallback((patch: Partial<ExamSession>) => {
    setSession((prev) => {
      const next = { ...prev, ...patch };
      saveSession(next);
      return next;
    });
  }, []);

  /* ------------------------------ handlers ------------------------------ */

  const handleStart = useCallback(
    (name: string) => {
      playStartSound();
      // brand-new attempt; timer starts exactly now
      const fresh: ExamSession = {
        phase: "exam",
        studentName: name,
        startedAt: Date.now(),
        answers: {},
        current: 0,
        result: null,
      };
      saveSession(fresh);
      setSession(fresh);
    },
    []
  );

  const handleAnswer = useCallback(
    (partId: string, value: AnswerValue) => {
      setSession((prev) => {
        const next = { ...prev, answers: { ...prev.answers, [partId]: value } };
        saveSession(next);
        return next;
      });
    },
    []
  );

  const handleNavigate = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(QUESTIONS.length - 1, index));
      update({ current: clamped });
    },
    [update]
  );

  const handleSubmit = useCallback(() => {
    // strict double-guard: never submit with missing answers, no dialogs
    if (!session.startedAt) return;
    if (missingPartIds(QUESTIONS, session.answers).length > 0) return;
    const submittedAt = Date.now();
    const result = gradeExam(session.answers, session.studentName, session.startedAt, submittedAt);
    playSubmitSound();
    update({ phase: "results", result });
  }, [session, update]);

  const handleRetake = useCallback(() => {
    clearSession();
    setSession({ ...BLANK_SESSION });
  }, []);

  /* ------------------------------- render -------------------------------- */

  return (
    <div className="min-h-screen">
      {session.phase === "welcome" && (
        <WelcomeScreen defaultName="" onStart={handleStart} />
      )}

      {session.phase === "exam" && session.startedAt && (
        <ExamScreen
          session={session}
          onAnswer={handleAnswer}
          onNavigate={handleNavigate}
          onSubmit={handleSubmit}
        />
      )}

      {/* results are reachable ONLY through an actual submission */}
      {session.phase === "results" && session.result && (
        <ResultsScreen result={session.result} onRetake={handleRetake} />
      )}

      <Footer onTeacherAccess={() => setTeacherOpen(true)} />
      {teacherOpen && <TeacherKey onClose={() => setTeacherOpen(false)} />}
    </div>
  );
}
