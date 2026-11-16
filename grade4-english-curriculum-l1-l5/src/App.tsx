import { useCallback, useEffect, useRef, useState } from "react";
import ExamScreen from "./components/ExamScreen";
import Footer from "./components/Footer";
import ResultsScreen from "./components/ResultsScreen";
import TeacherKey from "./components/TeacherKey";
import WelcomeScreen from "./components/WelcomeScreen";
import { QUESTIONS } from "./data/questions";
import { gradeExam, missingPartIds } from "./logic/grading";
import { buildReport, downloadReport } from "./logic/report";
import { playStartSound, playSubmitSound } from "./logic/sounds";
import { BLANK_SESSION, clearSession, loadSession, saveSession } from "./logic/storage";
import {
  buildPayload,
  isPending,
  newAttemptId,
  retryPending,
  sendWithRetry,
  type SendStatus,
  type SubmissionPayload,
} from "./logic/submit";
import type { AnswerValue, ExamSession } from "./types";

export default function App() {
  const [session, setSession] = useState<ExamSession>(loadSession);
  const [teacherOpen, setTeacherOpen] = useState(false);

  /** The payload currently shown on the results screen (the resend button re-uses it). */
  const outbox = useRef<SubmissionPayload | null>(null);
  /** The payload currently being delivered — prevents double sends. */
  const sending = useRef<SubmissionPayload | null>(null);

  /** apply a patch, update React state and persist atomically */
  const update = useCallback((patch: Partial<ExamSession>) => {
    setSession((prev) => {
      const next = { ...prev, ...patch };
      saveSession(next);
      return next;
    });
  }, []);

  /* ------------------------------------------------------------------ */
  /* On load: silently re-send any unsent results of THIS exam only.     */
  /* The pending keys are namespaced by EXAM_ID, so other exams are      */
  /* untouched. StrictMode's double effect is de-duplicated inside       */
  /* retryPending().                                                      */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    let cancelled = false;
    void retryPending().then(() => {
      if (cancelled) return;
      setSession((prev) => {
        if (prev.phase !== "results" || !prev.attemptId || !prev.result) return prev;
        const pending = isPending(prev.attemptId);
        const nextStatus: SendStatus = pending
          ? "failed"
          : prev.sendStatus === "failed" || prev.sendStatus === "sending"
            ? "success"
            : (prev.sendStatus ?? "idle");
        if (nextStatus === prev.sendStatus) return prev;
        const next = { ...prev, sendStatus: nextStatus };
        saveSession(next);
        return next;
      });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  /** Delivery never blocks the result: it starts in the background after the phase changes. */
  const sendResult = useCallback(
    (payload: SubmissionPayload) => {
      if (sending.current === payload) return;
      sending.current = payload;
      update({ sendStatus: "sending" });
      void sendWithRetry(payload).then((ok) => {
        if (sending.current === payload) sending.current = null;
        // Ignore a late reply if the student has already started a new attempt.
        if (outbox.current === payload) update({ sendStatus: ok ? "success" : "failed" });
      });
    },
    [update]
  );

  /* ------------------------------ handlers ------------------------------ */

  const handleStart = useCallback(
    (name: string) => {
      playStartSound();
      outbox.current = null;
      sending.current = null;
      // brand-new attempt; timer starts exactly now
      const fresh: ExamSession = {
        phase: "exam",
        studentName: name,
        startedAt: Date.now(),
        answers: {},
        current: 0,
        result: null,
        attemptId: undefined,
        sendStatus: "idle",
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
    // Always hand the student the TXT report at submission, inside the click handler.
    // The results screen keeps its manual download button as a guaranteed fallback.
    try {
      downloadReport(result);
    } catch {
      /* browser blocked the automatic download — the button below still works */
    }

    const attemptId = newAttemptId();
    let payload: SubmissionPayload | null = null;
    try {
      // Same result, same answers, same report text the student sees/downloads.
      payload = buildPayload({
        attemptId,
        result,
        answers: { ...session.answers },
        reportText: buildReport(result),
      });
    } catch {
      payload = null;
    }
    outbox.current = payload;

    // The result and the TXT report button appear immediately and unconditionally,
    // independently of anything that might happen to the network later.
    update({ phase: "results", result, attemptId, sendStatus: payload ? "sending" : "failed" });
    if (payload) sendResult(payload);
  }, [session, update, sendResult]);

  /** Independent of "Retake Exam": re-sends the SAME attemptId (server de-duplicates). */
  const handleResend = useCallback(() => {
    let payload = outbox.current;
    if (!payload && session.attemptId && session.result) {
      // Restored from a refreshed page: rebuild the identical payload with the same id.
      try {
        payload = buildPayload({
          attemptId: session.attemptId,
          result: session.result,
          answers: session.answers,
          reportText: buildReport(session.result),
        });
      } catch {
        payload = null;
      }
    }
    if (payload) {
      outbox.current = payload;
      sendResult(payload);
    }
  }, [session, sendResult]);

  const handleRetake = useCallback(() => {
    clearSession();
    outbox.current = null;
    sending.current = null;
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
        <ResultsScreen
          result={session.result}
          sendStatus={session.sendStatus ?? "idle"}
          onResend={handleResend}
          onRetake={handleRetake}
        />
      )}

      <Footer onTeacherAccess={() => setTeacherOpen(true)} />
      {teacherOpen && <TeacherKey onClose={() => setTeacherOpen(false)} />}
    </div>
  );
}
