import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ExamScreen from "@/components/ExamScreen";
import Results from "@/components/Results";
import TeacherArea from "@/components/TeacherArea";
import Welcome from "@/components/Welcome";
import { QUESTIONS } from "@/data/exam";
import { buildReport, isExamComplete, type ExamReport } from "@/lib/grading";
import { reportToText } from "@/lib/report";
import { playStartSound, playSubmitSound } from "@/lib/sound";
import {
  archiveCurrentReport,
  clearAttempt,
  clearReport,
  loadAttempt,
  loadMuted,
  loadPreviousReport,
  loadReport,
  saveAttempt,
  saveMuted,
  saveReport,
  type Attempt,
} from "@/lib/storage";
import {
  buildPayload,
  hasPendingAttempt,
  loadPendingAttempt,
  newAttemptId,
  retryPending,
  sendWithRetry,
  type SendStatus,
  type SubmissionPayload,
} from "@/lib/submit";

type View = "welcome" | "exam" | "results";

interface Boot {
  view: View;
  attempt: Attempt | null;
  report: ExamReport | null;
  index: number;
  initialSendStatus: SendStatus;
  initialOutbox: SubmissionPayload | null;
}

function clampIndex(idx: number | undefined): number {
  const n = typeof idx === "number" && Number.isFinite(idx) ? Math.floor(idx) : 0;
  return Math.max(0, Math.min(QUESTIONS.length - 1, n));
}

function bootState(): Boot {
  const savedReport = loadReport();
  const attempt = loadAttempt();

  if (attempt && attempt.submittedAt) {
    const elapsedSec = Math.max(
      0,
      Math.floor((attempt.submittedAt - attempt.startedAt) / 1000),
    );
    const report =
      savedReport ??
      buildReport(
        attempt.name,
        attempt.answers,
        attempt.submittedAt,
        elapsedSec,
        attempt.startedAt,
      );
    const pending = loadPendingAttempt(attempt.attemptId);
    const fallbackPayload =
      pending ??
      buildPayload({
        attemptId: attempt.attemptId,
        startedAt: attempt.startedAt,
        submittedAt: attempt.submittedAt,
        report,
        reportText: reportToText(report),
      });
    const initialSendStatus: SendStatus = pending
      ? "sending"
      : attempt.sentAt
        ? "success"
        : "failed";
    return {
      view: "results",
      attempt,
      report,
      index: clampIndex(attempt.index),
      initialSendStatus,
      initialOutbox: fallbackPayload,
    };
  }

  if (attempt && !attempt.submittedAt) {
    return {
      view: "exam",
      attempt,
      report: null,
      index: clampIndex(attempt.index),
      initialSendStatus: "idle",
      initialOutbox: null,
    };
  }

  if (savedReport) {
    return {
      view: "results",
      attempt: null,
      report: savedReport,
      index: 0,
      initialSendStatus: "idle",
      initialOutbox: null,
    };
  }

  return {
    view: "welcome",
    attempt: null,
    report: null,
    index: 0,
    initialSendStatus: "idle",
    initialOutbox: null,
  };
}

export default function App() {
  const boot = useMemo(bootState, []);
  const [view, setView] = useState<View>(boot.view);
  const [attempt, setAttempt] = useState<Attempt | null>(boot.attempt);
  const [report, setReport] = useState<ExamReport | null>(boot.report);
  const [index, setIndex] = useState<number>(boot.index);
  const [teacherOpen, setTeacherOpen] = useState(false);
  const [tick, setTick] = useState<number>(() => Date.now());
  const [previousReport, setPreviousReport] = useState<ExamReport | null>(() =>
    loadPreviousReport(),
  );
  const [muted, setMuted] = useState<boolean>(() => boot.attempt?.muted ?? loadMuted());
  const [sendStatus, setSendStatus] = useState<SendStatus>(boot.initialSendStatus);

  /** Current displayed submission payload (keeps the same `attemptId` for manual resend). */
  const outboxRef = useRef<SubmissionPayload | null>(boot.initialOutbox);
  const inFlightAttemptRef = useRef<string | null>(null);
  const displayedAttemptIdRef = useRef<string | null>(boot.attempt?.attemptId ?? null);

  const markAttemptSent = useCallback((attemptId: string) => {
    const sentAt = Date.now();
    setAttempt((prev) => {
      if (!prev || prev.attemptId !== attemptId) return prev;
      const updated: Attempt = { ...prev, sentAt };
      saveAttempt(updated);
      return updated;
    });
  }, []);

  /* Automatic retry of pending submissions whenever the exam is opened */
  useEffect(() => {
    const restoredId =
      boot.view === "results" && boot.attempt?.submittedAt ? boot.attempt.attemptId : null;
    const hadPending = restoredId ? hasPendingAttempt(restoredId) : false;
    if (hadPending && restoredId) {
      inFlightAttemptRef.current = restoredId;
      setSendStatus("sending");
    }
    void retryPending().then(() => {
      if (!hadPending || !restoredId) return;
      if (inFlightAttemptRef.current === restoredId) {
        inFlightAttemptRef.current = null;
      }
      if (displayedAttemptIdRef.current !== restoredId) return;
      if (!hasPendingAttempt(restoredId)) {
        markAttemptSent(restoredId);
        setSendStatus("success");
      } else {
        setSendStatus("failed");
      }
    });
  }, [boot, markAttemptSent]);

  const sendPayload = useCallback(
    (payload: SubmissionPayload) => {
      if (inFlightAttemptRef.current === payload.attemptId) return;
      inFlightAttemptRef.current = payload.attemptId;
      setSendStatus("sending");
      void sendWithRetry(payload).then((ok) => {
        if (inFlightAttemptRef.current === payload.attemptId) {
          inFlightAttemptRef.current = null;
        }
        if (ok) markAttemptSent(payload.attemptId);
        if (displayedAttemptIdRef.current === payload.attemptId) {
          setSendStatus(ok ? "success" : "failed");
        }
      });
    },
    [markAttemptSent],
  );

  const handleResend = useCallback(() => {
    const payload = outboxRef.current;
    if (!payload) return;
    sendPayload(payload);
  }, [sendPayload]);

  /* Count-up timer, timestamp-based so refresh or backgrounded tabs stay accurate */
  useEffect(() => {
    if (view !== "exam") return;
    const sync = () => setTick(Date.now());
    sync();
    const id = window.setInterval(sync, 1000);
    document.addEventListener("visibilitychange", sync);
    window.addEventListener("focus", sync);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", sync);
      window.removeEventListener("focus", sync);
    };
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
    const now = Date.now();
    const fresh: Attempt = {
      attemptId: newAttemptId(),
      name,
      startedAt: now,
      answers: {},
      muted,
      index: 0,
    };
    displayedAttemptIdRef.current = fresh.attemptId;
    outboxRef.current = null;
    setTeacherOpen(false);
    setSendStatus("idle");
    setReport(null);
    setAttempt(fresh);
    saveAttempt(fresh);
    setIndex(0);
    setTick(now);
    setView("exam");
    if (!muted) playStartSound();
  }

  function handleAnswer(partId: string, value: string) {
    setAttempt((prev) => {
      if (!prev || prev.submittedAt) return prev;
      const next: Attempt = {
        ...prev,
        answers: { ...prev.answers, [partId]: value },
      };
      saveAttempt(next);
      return next;
    });
  }

  function handleIndex(i: number) {
    const clamped = clampIndex(i);
    setIndex(clamped);
    setAttempt((prev) => {
      if (!prev || prev.submittedAt) return prev;
      const next: Attempt = { ...prev, index: clamped };
      saveAttempt(next);
      return next;
    });
  }

  function toggleMute() {
    setMuted((prev) => {
      const next = !prev;
      saveMuted(next);
      setAttempt((curr) => {
        if (!curr) return curr;
        const updated: Attempt = { ...curr, muted: next };
        saveAttempt(updated);
        return updated;
      });
      return next;
    });
  }

  function handleSubmit() {
    if (!attempt || attempt.submittedAt || !isExamComplete(attempt.answers)) return;
    const submittedAt = Date.now();
    const timeSpentSeconds = Math.max(
      0,
      Math.floor((submittedAt - attempt.startedAt) / 1000),
    );
    const frozenAnswers = { ...attempt.answers };
    const built = buildReport(
      attempt.name,
      frozenAnswers,
      submittedAt,
      timeSpentSeconds,
      attempt.startedAt,
    );
    const updated: Attempt = {
      ...attempt,
      answers: frozenAnswers,
      submittedAt,
      index,
    };

    displayedAttemptIdRef.current = attempt.attemptId;
    saveReport(built);
    saveAttempt(updated);
    setReport(built);
    setAttempt(updated);
    setTeacherOpen(false);
    setView("results");
    if (!muted) playSubmitSound();

    // Background submission — failure never blocks viewing results or downloading TXT report.
    try {
      const reportText = reportToText(built);
      const payload = buildPayload({
        attemptId: attempt.attemptId,
        startedAt: attempt.startedAt,
        submittedAt,
        report: built,
        reportText,
      });
      outboxRef.current = payload;
      sendPayload(payload);
    } catch {
      outboxRef.current = null;
      setSendStatus("failed");
    }
  }

  function handleRetake() {
    displayedAttemptIdRef.current = null;
    outboxRef.current = null;
    archiveCurrentReport();
    clearReport();
    clearAttempt();
    setSendStatus("idle");
    setTeacherOpen(false);
    setReport(null);
    setAttempt(null);
    setIndex(0);
    setView("welcome");
  }

  /* Teacher area is strictly forbidden during an active student attempt */
  if (teacherOpen && view !== "exam") {
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
        sendStatus={sendStatus}
        onResend={handleResend}
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
