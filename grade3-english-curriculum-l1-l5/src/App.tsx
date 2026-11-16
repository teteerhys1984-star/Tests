import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { KeyRound } from "lucide-react";
import type { AnswersMap, AnswerValue, ExamSession } from "./types";
import { clearSession, loadSession, saveSession } from "./logic/storage";
import { gradeFullExam } from "./logic/grading";
import { buildTextReport, downloadTextReport } from "./logic/report";
import { isMuted, playStartSound, playSubmitSound, setMuted } from "./logic/sound";
import {
  buildPayload,
  isPending,
  newAttemptId,
  retryPending,
  sendWithRetry,
  type SendStatus,
  type SubmissionPayload,
} from "./logic/submit";
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

  /** Payload currently displayed on the results screen (reused by Resend Result). */
  const outbox = useRef<SubmissionPayload | null>(null);
  /** Payload currently in flight — guards against duplicate sends. */
  const sending = useRef<SubmissionPayload | null>(null);

  const toggleMute = useCallback(() => {
    setMutedState((m) => {
      setMuted(!m);
      return !m;
    });
  }, []);

  /* On load: silently retry any pending submissions for THIS exam only. */
  useEffect(() => {
    let cancelled = false;
    void retryPending().then((flushed) => {
      if (cancelled) return;
      setSession((prev) => {
        if (!prev || !prev.submitted || !prev.attemptId) return prev;
        const pending = isPending(prev.attemptId);
        let nextStatus: SendStatus = prev.sendStatus ?? "idle";
        if (pending) {
          nextStatus = "failed";
        } else if (flushed > 0 && (prev.sendStatus === "failed" || prev.sendStatus === "sending")) {
          nextStatus = "success";
        } else if (prev.sendStatus === "sending" && sending.current === null) {
          nextStatus = "failed";
        }
        if (nextStatus === prev.sendStatus) return prev;
        const next: ExamSession = { ...prev, sendStatus: nextStatus };
        saveSession(next);
        return next;
      });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const sendResult = useCallback((payload: SubmissionPayload) => {
    if (sending.current === payload) return;
    sending.current = payload;
    setSession((prev) => {
      if (!prev || !prev.submitted) return prev;
      const next: ExamSession = { ...prev, sendStatus: "sending" };
      saveSession(next);
      return next;
    });
    void sendWithRetry(payload).then((ok) => {
      if (sending.current === payload) sending.current = null;
      if (outbox.current === payload) {
        setSession((prev) => {
          if (!prev || !prev.submitted) return prev;
          const next: ExamSession = { ...prev, sendStatus: ok ? "success" : "failed" };
          saveSession(next);
          return next;
        });
      }
    });
  }, []);

  /** Press Start Exam → brand-new timer begins exactly here. */
  const handleStart = useCallback((name: string) => {
    playStartSound();
    outbox.current = null;
    sending.current = null;
    const fresh: ExamSession = {
      version: 1,
      studentName: name,
      startedAt: Date.now(),
      currentQuestion: 1,
      answers: {},
      submitted: false,
      submittedAt: null,
      finalElapsedMs: null,
      attemptId: undefined,
      sendStatus: "idle",
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
    if (!session || session.submitted) return;
    playSubmitSound();
    const now = Date.now();
    const frozenAnswers: AnswersMap = { ...session.answers };
    const attemptId = newAttemptId();
    const submittedSession: ExamSession = {
      ...session,
      answers: frozenAnswers,
      submitted: true,
      submittedAt: now,
      finalElapsedMs: now - session.startedAt,
      attemptId,
      sendStatus: "sending",
    };

    let payload: SubmissionPayload | null = null;
    try {
      const graded = gradeFullExam(frozenAnswers);
      const reportText = buildTextReport(submittedSession, graded);
      payload = buildPayload({ attemptId, session: submittedSession, result: graded, reportText });
    } catch {
      payload = null;
    }

    outbox.current = payload;
    if (!payload) submittedSession.sendStatus = "failed";

    saveSession(submittedSession);
    setSession(submittedSession);
    window.scrollTo({ top: 0 });

    if (payload) sendResult(payload);
  }, [session, sendResult]);

  const result = useMemo(
    () => (session?.submitted ? gradeFullExam(session.answers) : null),
    [session?.submitted, session?.answers]
  );

  /** Independent of Retake Exam: reuses the SAME attemptId so the server de-duplicates. */
  const handleResend = useCallback(() => {
    if (!session || !session.submitted || !result) return;
    const attemptId = session.attemptId ?? newAttemptId();
    let payload = outbox.current;
    if (!payload || payload.attemptId !== attemptId) {
      try {
        const sessionWithId: ExamSession = session.attemptId ? session : { ...session, attemptId };
        if (!session.attemptId) {
          saveSession(sessionWithId);
          setSession(sessionWithId);
        }
        const reportText = buildTextReport(sessionWithId, result);
        payload = buildPayload({ attemptId, session: sessionWithId, result, reportText });
      } catch {
        payload = null;
      }
    }
    if (payload) {
      outbox.current = payload;
      sendResult(payload);
    }
  }, [session, result, sendResult]);

  /** Only an explicit Retake creates a fresh attempt (new name + new timer). */
  const handleRetake = useCallback(() => {
    clearSession();
    outbox.current = null;
    sending.current = null;
    setSession(null);
    window.scrollTo({ top: 0 });
  }, []);

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
          <Results
            session={session}
            result={result}
            sendStatus={session.sendStatus ?? "idle"}
            onResend={handleResend}
            onDownload={handleDownload}
            onRetake={handleRetake}
          />
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
