import { useCallback, useMemo, useState } from "react";
import { KeyRound } from "lucide-react";
import type { AnswersMap, AnswerValue, ExamSession } from "./types";
import { clearSession, loadSession, saveSession } from "./logic/storage";
import { gradeFullExam } from "./logic/grading";
import { downloadTextReport } from "./logic/report";
import { isMuted, playStartSound, playSubmitSound, setMuted } from "./logic/sound";
import Welcome from "./components/Welcome";
import ExamScreen from "./components/ExamScreen";
import Results from "./components/Results";
import TeacherKey from "./components/TeacherKey";
import GardenFooter from "./components/GardenFooter";
import { GardenAmbient } from "./components/Decor";

export default function App() {
  const [session, setSession] = useState<ExamSession | null>(() => loadSession());
  const [teacherOpen, setTeacherOpen] = useState(false);
  const [muted, setMutedState] = useState<boolean>(() => isMuted());

  const toggleMute = useCallback(() => {
    setMutedState((m) => {
      setMuted(!m);
      return !m;
    });
  }, []);

  /** Press Start Exam → brand-new timer begins exactly here. */
  const handleStart = useCallback((name: string) => {
    playStartSound();
    const fresh: ExamSession = {
      version: 1,
      studentName: name,
      startedAt: Date.now(),
      currentQuestion: 1,
      answers: {},
      submitted: false,
      submittedAt: null,
      finalElapsedMs: null,
    };
    setSession(fresh);
    saveSession(fresh);
  }, []);

  const handleAnswer = useCallback((questionId: number, partId: string, value: AnswerValue) => {
    setSession((prev) => {
      if (!prev || prev.submitted) return prev;
      const next: ExamSession = {
        ...prev,
        answers: {
          ...prev.answers,
          [questionId]: { ...(prev.answers[questionId] as AnswersMap[number] | undefined), [partId]: value },
        },
      };
      saveSession(next);
      return next;
    });
  }, []);

  const handleNavigate = useCallback((q: number) => {
    setSession((prev) => {
      if (!prev || prev.submitted) return prev;
      const next = { ...prev, currentQuestion: q };
      saveSession(next);
      return next;
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  /** Immediate submission — no confirmation dialogs, results shown at once. */
  const handleSubmit = useCallback(() => {
    setSession((prev) => {
      if (!prev || prev.submitted) return prev;
      playSubmitSound();
      const now = Date.now();
      const next: ExamSession = {
        ...prev,
        submitted: true,
        submittedAt: now,
        finalElapsedMs: now - prev.startedAt,
      };
      saveSession(next);
      return next;
    });
    window.scrollTo({ top: 0 });
  }, []);

  /** Only an explicit Retake creates a fresh attempt (new name + new timer). */
  const handleRetake = useCallback(() => {
    clearSession();
    setSession(null);
    window.scrollTo({ top: 0 });
  }, []);

  const result = useMemo(
    () => (session?.submitted ? gradeFullExam(session.answers) : null),
    [session?.submitted, session?.answers]
  );

  const handleDownload = useCallback(() => {
    if (session && result) downloadTextReport(session, result);
  }, [session, result]);

  return (
    <div className="garden-bg relative flex min-h-screen flex-col">
      <GardenAmbient />

      <div className="relative z-10 flex-1">
        {!session && <Welcome onStart={handleStart} />}

        {session && !session.submitted && (
          <ExamScreen
            session={session}
            onAnswer={handleAnswer}
            onNavigate={handleNavigate}
            onSubmit={handleSubmit}
            muted={muted}
            onToggleMute={toggleMute}
          />
        )}

        {session && session.submitted && result && (
          <Results session={session} result={result} onDownload={handleDownload} onRetake={handleRetake} />
        )}
      </div>

      <GardenFooter />

      {/* discreet, password-gated teacher entrance — outside the student flow */}
      <div className="relative z-10 pb-5 text-center no-print">
        <button
          type="button"
          onClick={() => setTeacherOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold text-ink-soft/60 transition-colors hover:text-violet"
        >
          <KeyRound className="h-3.5 w-3.5" strokeWidth={2.4} />
          Teacher Area
        </button>
      </div>

      <TeacherKey open={teacherOpen} onClose={() => setTeacherOpen(false)} />
    </div>
  );
}
