import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ExamScreen from "@/components/ExamScreen";
import Landing from "@/components/Landing";
import Results from "@/components/Results";
import TeacherKey from "@/components/TeacherKey";
import { QUESTIONS } from "@/data/questions";
import { playStartSound, playSubmitSound } from "@/lib/audio";
import { gradeExam } from "@/lib/grading";
import { buildReport } from "@/lib/report";
import {
  clearAttempt,
  elapsedMs,
  isMuted,
  loadAttempt,
  newAttemptId,
  saveAttempt,
  setMuted as persistMuted,
  type Attempt,
} from "@/lib/storage";
import {
  buildPayload,
  hasReceipt,
  isPending,
  retryPending,
  sendWithRetry,
  type SendStatus,
} from "@/lib/submit";

type Screen = "entry" | "exam" | "results" | "teacher";

export default function App() {
  const [attempt, setAttempt] = useState<Attempt | null>(() => loadAttempt());
  const [screen, setScreen] = useState<Screen>(() => {
    const saved = loadAttempt();
    if (!saved) return "entry";
    return saved.status === "submitted" ? "results" : "exam";
  });
  const [muted, setMutedState] = useState<boolean>(() => isMuted());
  const [now, setNow] = useState<number>(() => Date.now());
  /* idle = nothing to deliver yet · sending · success · failed */
  const [delivery, setDelivery] = useState<SendStatus>(() => {
    const saved = loadAttempt();
    if (!saved || saved.status !== "submitted") return "idle";
    if (hasReceipt(saved.attemptId)) return "success";
    if (isPending(saved.attemptId)) return "sending";
    return "idle";
  });
  const returnTo = useRef<Screen>("entry");
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  /* count-up clock — timestamp based, so refreshes and navigation stay correct */
  useEffect(() => {
    if (screen !== "exam" || attempt?.status !== "active") return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [screen, attempt?.status]);

  /*
   * On every load: silently resend this exam's pending results (a previous
   * delivery that never got an acknowledgement). The keys are namespaced by
   * this exam's EXAM_ID, so Model A's queue is never touched.
   */
  useEffect(() => {
    const saved = loadAttempt();
    if (!saved || saved.status !== "submitted") {
      void retryPending();
      return;
    }
    if (isPending(saved.attemptId) && !hasReceipt(saved.attemptId)) setDelivery("sending");
    void retryPending().then(() => {
      if (!mounted.current) return;
      if (hasReceipt(saved.attemptId)) setDelivery("success");
      else if (isPending(saved.attemptId)) setDelivery("failed");
    });
  }, []);

  const toggleMute = useCallback(() => {
    setMutedState((prev) => {
      const next = !prev;
      persistMuted(next);
      return next;
    });
  }, []);

  const start = useCallback((name: string) => {
    const fresh: Attempt = {
      v: 1,
      attemptId: newAttemptId(),
      name,
      answers: {},
      startTs: Date.now(),
      current: 0,
      status: "active",
      model: "B",
    };
    saveAttempt(fresh);
    setAttempt(fresh);
    setNow(Date.now());
    setDelivery("idle");
    setScreen("exam");
    if (!isMuted()) playStartSound();
  }, []);

  const patch = useCallback((updater: (prev: Attempt) => Attempt) => {
    setAttempt((prev) => {
      if (!prev) return prev;
      const next = updater(prev);
      saveAttempt(next);
      return next;
    });
  }, []);

  const answer = useCallback(
    (partId: string, value: string) => {
      patch((prev) => ({ ...prev, answers: { ...prev.answers, [partId]: value } }));
    },
    [patch]
  );

  const navigate = useCallback(
    (index: number) => {
      patch((prev) => ({ ...prev, current: Math.max(0, Math.min(QUESTIONS.length - 1, index)) }));
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [patch]
  );

  /** Builds the exact payload/report the pupil sees and sends it to the sheet. */
  const deliver = useCallback(async (frozen: Attempt) => {
    const submittedTs = frozen.submittedTs ?? Date.now();
    const total = frozen.elapsedMs ?? elapsedMs(frozen.startTs, submittedTs);
    const result = gradeExam(frozen.answers);
    const reportText = buildReport({
      name: frozen.name,
      result,
      submittedTs,
      elapsedMs: total,
    });
    if (mounted.current) setDelivery("sending");
    const ok = await sendWithRetry(
      buildPayload({ attempt: frozen, result, questions: QUESTIONS, reportText })
    );
    if (mounted.current) setDelivery(ok ? "success" : "failed");
  }, []);

  const submit = useCallback(() => {
    if (!attempt || attempt.status !== "active") return;
    const submittedTs = Date.now();
    const next: Attempt = {
      ...attempt,
      status: "submitted",
      submittedTs,
      elapsedMs: elapsedMs(attempt.startTs, submittedTs),
    };
    saveAttempt(next);
    setAttempt(next);
    setScreen("results");
    if (!isMuted()) playSubmitSound();
    // The results page is shown immediately; delivery happens in the background
    // and a failure never hides the score or the TXT report.
    void deliver(next);
  }, [attempt, deliver]);

  /** Manual resend: same attemptId, same payload shape, never a new attempt. */
  const resend = useCallback(() => {
    if (!attempt || attempt.status !== "submitted") return;
    void deliver(attempt);
  }, [attempt, deliver]);

  const restart = useCallback(() => {
    clearAttempt();
    setAttempt(null);
    setDelivery("idle");
    setScreen("entry");
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  const openTeacher = useCallback(() => {
    returnTo.current = screen === "teacher" ? "entry" : screen;
    setScreen("teacher");
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [screen]);

  const closeTeacher = useCallback(() => {
    setScreen(returnTo.current);
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  /* never show an exam/results screen without an attempt behind it */
  const safeScreen: Screen =
    (screen === "exam" || screen === "results") && !attempt ? "entry" : screen;

  const result = useMemo(
    () => (attempt && attempt.status === "submitted" ? gradeExam(attempt.answers) : null),
    [attempt]
  );

  if (safeScreen === "exam" && attempt) {
    return (
      <ExamScreen
        name={attempt.name}
        answers={attempt.answers}
        current={attempt.current}
        elapsed={elapsedMs(attempt.startTs, now)}
        muted={muted}
        onToggleMute={toggleMute}
        onAnswer={answer}
        onNavigate={navigate}
        onSubmit={submit}
      />
    );
  }

  if (safeScreen === "results" && attempt && result && attempt.submittedTs !== undefined) {
    return (
      <Results
        name={attempt.name}
        result={result}
        submittedTs={attempt.submittedTs}
        elapsedMs={attempt.elapsedMs ?? elapsedMs(attempt.startTs, attempt.submittedTs)}
        muted={muted}
        onToggleMute={toggleMute}
        onRestart={restart}
        onOpenTeacher={openTeacher}
        delivery={delivery}
        onResend={resend}
        attemptId={attempt.attemptId}
      />
    );
  }

  if (safeScreen === "teacher") {
    return <TeacherKey onClose={closeTeacher} />;
  }

  return (
    <Landing
      onStart={start}
      onOpenTeacher={openTeacher}
      muted={muted}
      onToggleMute={toggleMute}
      resumeName={attempt?.name}
    />
  );
}
