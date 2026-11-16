import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ExamScreen } from "./components/ExamScreen";
import { Footer } from "./components/Footer";
import { ResultsScreen } from "./components/ResultsScreen";
import { TeacherArea } from "./components/TeacherArea";
import { WelcomeScreen } from "./components/WelcomeScreen";
import { EXAM_QUESTIONS } from "./data/questions";
import { gradeExam, isExamComplete } from "./lib/grading";
import { buildReport } from "./lib/report";
import { playSound } from "./lib/sound";
import {
  buildPayload,
  isPending,
  retryPending,
  sendWithRetry,
  type SendStatus,
} from "./lib/submit";
import {
  MUTE_KEY,
  STORAGE_KEY,
  createIdleState,
  loadState,
  safeStorage,
  saveState,
  startAttempt,
  submitAttempt,
} from "./lib/storage";
import type { AnswerValue, ExamState } from "./types";

type Route = "main" | "teacher";
const routeFromHash = (): Route => (window.location.hash === "#teacher" ? "teacher" : "main");

export default function App() {
  const storage = useMemo(() => safeStorage(), []);
  const [initial] = useState<ExamState>(() => loadState(safeStorage()) ?? createIdleState());
  const [state, setState] = useState<ExamState>(initial);
  const [restored, setRestored] = useState(initial.status === "active");
  const [muted, setMuted] = useState<boolean>(() => safeStorage()?.getItem(MUTE_KEY) === "1");
  const [route, setRoute] = useState<Route>(routeFromHash);
  const [sendStatus, setSendStatus] = useState<SendStatus>("idle");
  const stateRef = useRef(state);
  stateRef.current = state;
  /** Attempt id already being delivered, so a re-render never sends twice. */
  const sendingRef = useRef<string | null>(null);

  // Persist every change (answers, current question, status, timestamps).
  useEffect(() => saveState(storage, state), [state, storage]);

  useEffect(() => {
    try {
      storage?.setItem(MUTE_KEY, muted ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [muted, storage]);

  /** Re-read from storage so a successful background flush updates the badge. */
  const [queueVersion, setQueueVersion] = useState(0);

  // On load: silently resend this exam's unsent results (never blocks the UI).
  useEffect(() => {
    let alive = true;
    void retryPending().then(() => {
      if (alive) setQueueVersion((v) => v + 1);
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const onHash = () => setRoute(routeFromHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  // Keep other tabs of the same browser in sync with the single saved attempt.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return;
      const next = loadState(storage);
      if (next) setState(next);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [storage]);

  // While the exam is active, save the elapsed time regularly and when the page is hidden/closed.
  useEffect(() => {
    if (state.status !== "active") return;
    const snapshot = () => {
      const s = stateRef.current;
      if (s.status !== "active" || s.startedAt === null) return null;
      const now = Date.now();
      return { ...s, elapsedMs: now - s.startedAt, lastSavedAt: now };
    };
    const tick = window.setInterval(() => {
      const next = snapshot();
      if (next) setState(next);
    }, 5000);
    const flush = () => {
      const next = snapshot();
      if (next) saveState(storage, next);
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") flush();
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", flush);
    return () => {
      window.clearInterval(tick);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", flush);
    };
  }, [state.status, storage]);

  const closeTeacher = useCallback(() => {
    if (window.location.hash) window.history.replaceState(null, "", window.location.pathname + window.location.search);
    setRoute("main");
  }, []);

  // The answer key is never available while an attempt is in progress.
  useEffect(() => {
    if (route === "teacher" && state.status === "active") closeTeacher();
  }, [route, state.status, closeTeacher]);

  const openTeacher = () => {
    window.location.hash = "teacher";
    window.scrollTo({ top: 0 });
  };

  const handleStart = (name: string) => {
    const now = Date.now();
    setState(startAttempt(name, now));
    setRestored(false);
    playSound("start", muted);
    window.scrollTo({ top: 0 });
  };

  const handleAnswer = (questionId: string, partId: string, value: AnswerValue) => {
    setState((s) =>
      s.status !== "active"
        ? s
        : {
            ...s,
            answers: { ...s.answers, [questionId]: { ...(s.answers[questionId] ?? {}), [partId]: value } },
            lastSavedAt: Date.now(),
          },
    );
  };

  const handleGoTo = (index: number) => {
    setState((s) => ({ ...s, currentIndex: Math.max(0, Math.min(EXAM_QUESTIONS.length - 1, index)) }));
  };

  /**
   * Sends the finished attempt to the teacher's Google Sheet in the background.
   * Failures are stored locally and retried later; the results page and the TXT
   * report never depend on the delivery outcome.
   */
  const deliver = useCallback(
    async (finished: ExamState, result: ReturnType<typeof gradeExam>) => {
      if (sendingRef.current === finished.attemptId) return;
      sendingRef.current = finished.attemptId;
      setSendStatus("sending");
      try {
        const payload = buildPayload({
          state: finished,
          result,
          questions: EXAM_QUESTIONS,
          reportText: buildReport(finished, result, EXAM_QUESTIONS),
        });
        const ok = await sendWithRetry(payload);
        setSendStatus(ok ? "success" : "failed");
        setQueueVersion((v) => v + 1);
      } catch {
        setSendStatus("failed");
      }
    },
    [],
  );

  // Immediate submission: no confirmation dialog or extra message.
  const handleSubmit = () => {
    if (state.status !== "active" || !isExamComplete(EXAM_QUESTIONS, state.answers)) return;
    playSound("submit", muted);
    const finished = submitAttempt(state, Date.now());
    setState(finished);
    setRestored(false);
    window.scrollTo({ top: 0 });
    void deliver(finished, gradeExam(EXAM_QUESTIONS, finished.answers));
  };

  const handleResend = () => {
    if (state.status !== "submitted") return;
    sendingRef.current = null;
    void deliver(state, gradeExam(EXAM_QUESTIONS, state.answers));
  };

  // Explicit restart (only offered after submission). The name is asked for again.
  const handleRestart = () => {
    setState(createIdleState());
    setSendStatus("idle");
    sendingRef.current = null;
    window.scrollTo({ top: 0 });
  };

  const result = useMemo(() => (state.status === "submitted" ? gradeExam(EXAM_QUESTIONS, state.answers) : null), [state.status, state.answers]);

  // A submitted attempt restored after a reload: show whether delivery is still owed.
  // queueVersion re-reads localStorage after a background flush or a resend.
  const queued = useMemo(
    () => state.status === "submitted" && isPending(state.attemptId),
    [state.status, state.attemptId, queueVersion],
  );
  const shownSendStatus: SendStatus = sendStatus !== "idle" ? sendStatus : queued ? "failed" : "success";
  const toggleMute = () => setMuted((m) => !m);
  const showTeacher = route === "teacher" && state.status !== "active";

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex-1">
        {showTeacher ? (
          <TeacherArea questions={EXAM_QUESTIONS} muted={muted} onToggleMute={toggleMute} onBack={closeTeacher} />
        ) : state.status === "active" ? (
          <ExamScreen
            state={state}
            questions={EXAM_QUESTIONS}
            muted={muted}
            restored={restored}
            onDismissRestored={() => setRestored(false)}
            onToggleMute={toggleMute}
            onAnswer={handleAnswer}
            onGoTo={handleGoTo}
            onSubmit={handleSubmit}
          />
        ) : state.status === "submitted" && result ? (
          <ResultsScreen
            state={state}
            result={result}
            questions={EXAM_QUESTIONS}
            muted={muted}
            sendStatus={shownSendStatus}
            canSend={shownSendStatus !== "success"}
            onResend={handleResend}
            onToggleMute={toggleMute}
            onRestart={handleRestart}
            onOpenTeacher={openTeacher}
          />
        ) : (
          <WelcomeScreen muted={muted} onToggleMute={toggleMute} onStart={handleStart} onOpenTeacher={openTeacher} />
        )}
      </div>
      <Footer />
    </div>
  );
}
