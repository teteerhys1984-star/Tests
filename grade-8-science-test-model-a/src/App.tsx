import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { QUESTIONS } from "@/data/exam";
import type { Attempt, Phase } from "@/data/types";
import { gradeAttempt, isComplete } from "@/lib/grade";
import {
  archiveCurrentReport,
  clearAttempt,
  clearReport,
  loadAttempt,
  loadMuted,
  loadReport,
  newAttempt,
  saveAttempt,
  saveMuted,
  saveReport,
} from "@/lib/storage";
import { buildExamReport, reportToText, type ExamReport } from "@/lib/report";
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
import { playStart, playSubmit, playTick } from "@/lib/sounds";
import { StartScreen } from "@/components/StartScreen";
import { ExamScreen } from "@/components/ExamScreen";
import { Results } from "@/components/Results";
import { TeacherKey } from "@/components/TeacherKey";
import { Footer } from "@/components/Footer";

interface Boot {
  phase: Phase;
  attempt: Attempt | null;
  report: ExamReport | null;
  index: number;
  muted: boolean;
  sendStatus: SendStatus;
  outbox: SubmissionPayload | null;
}

function clampIndex(idx: number | undefined): number {
  const n = typeof idx === "number" && Number.isFinite(idx) ? Math.floor(idx) : 0;
  return Math.max(0, Math.min(QUESTIONS.length - 1, n));
}

function bootState(): Boot {
  const attempt = loadAttempt();
  const savedReport = loadReport();
  const muted = loadMuted();

  if (attempt && attempt.submittedAt) {
    const score = gradeAttempt(QUESTIONS, attempt.answers);
    const report =
      savedReport ??
      buildExamReport(
        { ...attempt, submittedAt: attempt.submittedAt },
        score,
      );
    const pending = loadPendingAttempt(attempt.attemptId);
    const payload =
      pending ??
      buildPayload({
        attemptId: attempt.attemptId,
        startedAt: attempt.startedAt,
        submittedAt: attempt.submittedAt,
        report,
        reportText: reportToText(report),
      });
    return {
      phase: "results",
      attempt,
      report,
      index: clampIndex(attempt.idx),
      muted,
      sendStatus: pending ? "sending" : attempt.sentAt ? "success" : "failed",
      outbox: payload,
    };
  }

  if (attempt) {
    return {
      phase: "exam",
      attempt,
      report: null,
      index: clampIndex(attempt.idx),
      muted,
      sendStatus: "idle",
      outbox: null,
    };
  }

  if (savedReport) {
    return {
      phase: "results",
      attempt: null,
      report: savedReport,
      index: 0,
      muted,
      sendStatus: "idle",
      outbox: null,
    };
  }

  return { phase: "start", attempt: null, report: null, index: 0, muted, sendStatus: "idle", outbox: null };
}

export default function App() {
  const boot = useMemo(bootState, []);
  const [phase, setPhase] = useState<Phase>(boot.phase);
  const [attempt, setAttempt] = useState<Attempt | null>(boot.attempt);
  const [report, setReport] = useState<ExamReport | null>(boot.report);
  const [index, setIndex] = useState<number>(boot.index);
  const [muted, setMuted] = useState<boolean>(boot.muted);
  const [teacher, setTeacher] = useState(false);
  const [now, setNow] = useState<number>(() => Date.now());
  const [sendStatus, setSendStatus] = useState<SendStatus>(boot.sendStatus);

  const outboxRef = useRef<SubmissionPayload | null>(boot.outbox);
  const inFlightRef = useRef<string | null>(null);
  const displayedIdRef = useRef<string | null>(boot.attempt?.attemptId ?? null);

  useEffect(() => {
    displayedIdRef.current = attempt?.attemptId ?? null;
  }, [attempt]);

  /* المؤقّت: عدّ تصاعدي يعتمد على الطابع الزمني، لا على عدّاد في الذاكرة. */
  useEffect(() => {
    if (phase !== "exam") return;
    setNow(Date.now());
    const t = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(t);
  }, [phase]);

  /* الحفظ التلقائي في localStorage مع كل تغيير. */
  useEffect(() => {
    if (attempt && phase !== "start") saveAttempt(attempt);
  }, [attempt, phase]);

  const markAttemptSent = useCallback((attemptId: string) => {
    setAttempt((prev) => {
      if (!prev || prev.attemptId !== attemptId) return prev;
      const updated: Attempt = { ...prev, sentAt: Date.now() };
      saveAttempt(updated);
      return updated;
    });
  }, []);

  const sendPayload = useCallback(
    (payload: SubmissionPayload) => {
      if (inFlightRef.current === payload.attemptId) return;
      inFlightRef.current = payload.attemptId;
      setSendStatus("sending");
      void sendWithRetry(payload).then((ok) => {
        if (inFlightRef.current === payload.attemptId) inFlightRef.current = null;
        if (ok) markAttemptSent(payload.attemptId);
        if (displayedIdRef.current === payload.attemptId) {
          setSendStatus(ok ? "success" : "failed");
        }
      });
    },
    [markAttemptSent],
  );

  /* إعادة إرسال المحاولات المعلّقة عند فتح الاختبار — لمفاتيح هذا الاختبار فقط. */
  useEffect(() => {
    const restoredId = boot.attempt?.submittedAt ? boot.attempt.attemptId : null;
    const hadPending = restoredId ? hasPendingAttempt(restoredId) : false;
    if (hadPending && restoredId) {
      inFlightRef.current = restoredId;
      setSendStatus("sending");
    }
    void retryPending().then(() => {
      if (!hadPending || !restoredId) return;
      if (inFlightRef.current === restoredId) inFlightRef.current = null;
      if (displayedIdRef.current !== restoredId) return;
      if (!hasPendingAttempt(restoredId)) {
        markAttemptSent(restoredId);
        setSendStatus("success");
      } else {
        setSendStatus("failed");
      }
    });
  }, [boot, markAttemptSent]);

  const start = (name: string) => {
    archiveCurrentReport();
    clearReport();
    const a: Attempt = { ...newAttempt(name, newAttemptId()), muted, idx: 0 };
    outboxRef.current = null;
    setSendStatus("idle");
    setAttempt(a);
    saveAttempt(a);
    setIndex(0);
    setPhase("exam");
    setTeacher(false);
    if (!muted) playStart();
  };

  const answer = (subId: string, value: string) => {
    setAttempt((prev) => (prev ? { ...prev, answers: { ...prev.answers, [subId]: value } } : prev));
  };

  const goIndex = (i: number) => {
    const clamped = Math.max(0, Math.min(i, QUESTIONS.length - 1));
    setIndex(clamped);
    setAttempt((prev) => (prev ? { ...prev, idx: clamped } : prev));
    if (!muted) playTick();
  };

  const toggleMute = () => {
    setMuted((m) => {
      const next = !m;
      saveMuted(next);
      setAttempt((prev) => (prev ? { ...prev, muted: next } : prev));
      return next;
    });
  };

  const submit = () => {
    if (!attempt || !isComplete(QUESTIONS, attempt.answers)) return;
    const done: Attempt = { ...attempt, submittedAt: Date.now() };
    const score = gradeAttempt(QUESTIONS, done.answers);
    const built = buildExamReport(done, score);
    const text = reportToText(built);
    saveAttempt(done);
    saveReport(built);
    setAttempt(done);
    setReport(built);
    setPhase("results");
    if (!done.muted) playSubmit();

    const payload = buildPayload({
      attemptId: done.attemptId,
      startedAt: done.startedAt,
      submittedAt: done.submittedAt as number,
      report: built,
      reportText: text,
    });
    outboxRef.current = payload;
    sendPayload(payload);
  };

  const resend = () => {
    const payload = outboxRef.current;
    if (payload) sendPayload(payload);
  };

  const retake = () => {
    archiveCurrentReport();
    clearAttempt();
    clearReport();
    outboxRef.current = null;
    inFlightRef.current = null;
    setAttempt(null);
    setReport(null);
    setIndex(0);
    setSendStatus("idle");
    setPhase("start");
    setTeacher(false);
  };

  const score =
    attempt && phase === "results" && attempt.submittedAt
      ? gradeAttempt(QUESTIONS, attempt.answers)
      : null;

  const teacherAllowed = phase !== "exam";

  return (
    <div className="paper-grid flex min-h-full flex-col">
      <div className="flex-1">
        {teacher && teacherAllowed ? (
          <TeacherKey onClose={() => setTeacher(false)} />
        ) : phase === "start" ? (
          <StartScreen
            onStart={start}
            muted={muted}
            onToggleMute={toggleMute}
            resumable={!!boot.attempt && !boot.attempt.submittedAt}
            onResume={() => setPhase("exam")}
          />
        ) : phase === "exam" && attempt ? (
          <ExamScreen
            questions={QUESTIONS}
            attempt={attempt}
            index={index}
            onIndex={goIndex}
            onAnswer={answer}
            onSubmit={submit}
            muted={muted}
            onToggleMute={toggleMute}
            now={now}
          />
        ) : phase === "results" && report ? (
          <Results
            attempt={attempt}
            score={score}
            report={report}
            sendStatus={sendStatus}
            onResend={resend}
            onRetake={retake}
            onOpenTeacher={() => setTeacher(true)}
          />
        ) : null}
      </div>

      <Footer onTeacher={() => setTeacher(true)} showTeacher={teacherAllowed} />
    </div>
  );
}
