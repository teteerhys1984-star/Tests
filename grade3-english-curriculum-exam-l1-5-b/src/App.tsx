import { useCallback, useEffect, useRef, useState } from "react";
import { ExamScreen } from "./components/ExamScreen";
import { Footer } from "./components/Footer";
import { ResultsScreen } from "./components/ResultsScreen";
import { TeacherKeyView } from "./components/TeacherKeyView";
import { WelcomeScreen } from "./components/WelcomeScreen";
import { EXAM_QUESTIONS } from "./data/questions";
import { ExamSessionState, QuestionAnswer } from "./types/exam";
import { areAllQuestionsComplete, evaluateExam } from "./utils/grading";
import { generateTxtReport } from "./utils/report";
import { playExamStartSound, playExamSubmitSound } from "./utils/sound";
import {
  clearSessionForNewAttempt,
  loadSession,
  newAttemptId,
  saveSession,
} from "./utils/storage";
import {
  SendState,
  buildPayload,
  canSend,
  isPending,
  onPageExit,
  retryPending,
  savePending,
  sendWithRetry,
} from "./utils/submit";
import { computeElapsedSeconds } from "./utils/timer";

export function App() {
  const [session, setSession] = useState<ExamSessionState>(() => loadSession());
  const [teacherKeyOpen, setTeacherKeyOpen] = useState(false);
  const [sendStatus, setSendStatus] = useState<SendState>(() => {
    const initial = loadSession();
    if (initial.phase !== "submitted") return "idle";
    return isPending(initial.attemptId) ? "failed" : "sent";
  });

  const sessionRef = useRef(session);
  sessionRef.current = session;

  // Persist every session state update to localStorage immediately
  useEffect(() => {
    saveSession(session);
  }, [session]);

  // Silently retry any queued pending submissions when the exam opens
  useEffect(() => {
    let active = true;
    void retryPending().then(() => {
      if (!active) return;
      const cur = sessionRef.current;
      if (cur.phase === "submitted" && !isPending(cur.attemptId)) {
        setSendStatus("sent");
      }
    });
    return () => {
      active = false;
    };
  }, []);

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

  const deliverAttempt = useCallback(
    async (submittedSession: ExamSessionState) => {
      if (!canSend) return;
      const submittedAtIso =
        submittedSession.submittedAt || new Date().toISOString();
      const evaluation = evaluateExam(EXAM_QUESTIONS, submittedSession.answers);
      const reportText = generateTxtReport({
        studentName: submittedSession.studentName,
        submittedAtIso,
        elapsedSeconds: submittedSession.elapsedSeconds,
        evaluation,
      });
      const payload = buildPayload({
        session: { ...submittedSession, submittedAt: submittedAtIso },
        evaluation,
        reportText,
      });

      setSendStatus("sending");
      const detachExit = onPageExit(() => savePending(payload));
      let ok = false;
      try {
        ok = await sendWithRetry(payload);
      } finally {
        detachExit();
      }
      if (sessionRef.current.attemptId === submittedSession.attemptId) {
        setSendStatus(ok ? "sent" : "failed");
      }
    },
    []
  );

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
    const attemptId = newAttemptId();

    setSendStatus("idle");
    setSession((prev) => {
      playExamStartSound(prev.muted);
      return {
        version: 1,
        attemptId,
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
    const cur = sessionRef.current;
    if (cur.phase !== "in_progress") return;
    if (!areAllQuestionsComplete(EXAM_QUESTIONS, cur.answers)) return;

    const now = Date.now();
    const finalElapsed = computeElapsedSeconds(
      cur.startTimestamp,
      cur.elapsedSeconds,
      now
    );
    const submittedAt = new Date(now).toISOString();
    const submittedSession: ExamSessionState = {
      ...cur,
      phase: "submitted",
      elapsedSeconds: finalElapsed,
      lastTickTimestamp: now,
      submittedAt,
    };

    sessionRef.current = submittedSession;
    saveSession(submittedSession);
    playExamSubmitSound(cur.muted);
    setSession(submittedSession);
    void deliverAttempt(submittedSession);

    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    }
  }, [deliverAttempt]);

  const handleResendResult = useCallback(() => {
    const cur = sessionRef.current;
    if (cur.phase !== "submitted" || sendStatus === "sending") return;
    void deliverAttempt(cur);
  }, [deliverAttempt, sendStatus]);

  // Explicit restart permitted only after completing the previous attempt
  const handleStartNewExam = useCallback(() => {
    if (sessionRef.current.phase !== "submitted") return;
    const fresh = clearSessionForNewAttempt(sessionRef.current.muted);
    sessionRef.current = fresh;
    setSendStatus("idle");
    setSession(fresh);
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
            sendStatus={sendStatus}
            canSend={canSend}
            onResendResult={handleResendResult}
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
