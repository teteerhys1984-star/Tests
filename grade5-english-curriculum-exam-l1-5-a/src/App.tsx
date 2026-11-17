import { useEffect, useMemo, useRef, useState } from "react";
import EntryScreen from "@/components/EntryScreen";
import ExamScreen from "@/components/ExamScreen";
import ResultsScreen from "@/components/ResultsScreen";
import TeacherKey from "@/components/TeacherKey";
import { QUESTIONS } from "@/data/exam";
import { playStartSound, playSubmitSound } from "@/lib/audio";
import { gradeExam } from "@/lib/grading";
import { buildReport } from "@/lib/report";
import {
  buildPayload,
  hasReceipt,
  retryPending,
  sendWithRetry,
  type SendStatus,
  type SubmissionPayload,
} from "@/lib/submit";
import {
  clearAttempt,
  elapsedBetween,
  formatElapsed,
  loadAttempt,
  newAttemptId,
  saveAttempt,
  type Attempt,
} from "@/lib/storage";

type Screen = "entry" | "exam" | "results";

export default function App() {
  const [attempt, setAttempt] = useState<Attempt | null>(() => loadAttempt());
  const [tick, setTick] = useState(() => Date.now());
  const [teacherOpen, setTeacherOpen] = useState(false);
  const [sendStatus, setSendStatus] = useState<SendStatus>("idle");
  /** The payload of the attempt shown on screen — the "Resend result" button re-sends it. */
  const outbox = useRef<SubmissionPayload | null>(null);
  /** The payload that is currently being sent (guards against double sending). */
  const sending = useRef<SubmissionPayload | null>(null);

  const screen: Screen = !attempt
    ? "entry"
    : attempt.status === "submitted"
      ? "results"
      : "exam";

  /* ---- count-up timer driven by timestamps, re-checked every second --- */
  useEffect(() => {
    if (screen !== "exam") return;
    const id = window.setInterval(() => setTick(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [screen]);

  /* ---- on load: silently resend this exam's pending results ----------- */
  useEffect(() => {
    // The attempt already on screen sends itself below, so it is skipped here.
    void retryPending({ excludeAttemptId: attempt?.attemptId });
  }, [attempt?.attemptId]);

  const commit = (next: Attempt) => {
    setAttempt(next);
    saveAttempt(next);
  };

  const index = attempt ? Math.min(Math.max(0, attempt.index), QUESTIONS.length - 1) : 0;
  const answers = attempt?.answers ?? {};
  const startedAt = attempt?.startedAt ?? 0;
  const submittedAt = attempt?.submittedAt ?? null;
  const elapsedMs =
    attempt === null ? 0 : elapsedBetween(startedAt, attempt.status === "submitted" ? submittedAt : tick);

  const result = useMemo(
    () => (attempt?.status === "submitted" ? gradeExam(QUESTIONS, answers) : null),
    [attempt?.status, answers],
  );

  /** The very same TXT report the pupil downloads — one source of truth. */
  const reportText = useMemo(() => {
    if (!attempt || attempt.status !== "submitted" || !result || submittedAt === null) return "";
    return buildReport({ name: attempt.name, result, questions: QUESTIONS, submittedAt, elapsedMs });
  }, [attempt, result, submittedAt, elapsedMs]);

  /* --------------------------- delivery ------------------------------ */
  const sendResult = (payload: SubmissionPayload) => {
    if (sending.current === payload) return;
    sending.current = payload;
    setSendStatus("sending");
    void sendWithRetry(payload).then((ok) => {
      if (sending.current === payload) sending.current = null;
      if (outbox.current === payload) setSendStatus(ok ? "success" : "failed");
    });
  };

  /** Builds the payload of the submitted attempt and sends it (once per attempt). */
  useEffect(() => {
    if (!attempt || attempt.status !== "submitted" || !result) return;
    if (outbox.current && outbox.current.attemptId === attempt.attemptId) return;
    if (hasReceipt(attempt.attemptId)) {
      setSendStatus("success");
      return;
    }
    const payload = buildPayload({ attempt, result, questions: QUESTIONS, reportText });
    outbox.current = payload;
    sendResult(payload);
    // `reportText` is derived from `attempt` and `result`; both are listed.
  }, [attempt, result, reportText]);

  const handleResend = () => {
    if (outbox.current) sendResult(outbox.current);
  };

  /* --------------------------- actions ------------------------------- */
  const handleStart = (name: string) => {
    const next: Attempt = {
      v: 1,
      attemptId: newAttemptId(),
      name,
      answers: {},
      startedAt: Date.now(),
      index: 0,
      status: "in-progress",
      submittedAt: null,
      muted: false,
    };
    outbox.current = null;
    setSendStatus("idle");
    commit(next);
    setTick(Date.now());
    playStartSound();
  };

  const handleChange = (partId: string, value: string) => {
    if (!attempt || attempt.status !== "in-progress") return;
    commit({ ...attempt, answers: { ...attempt.answers, [partId]: value } });
  };

  const handleIndex = (i: number) => {
    if (!attempt) return;
    commit({ ...attempt, index: i });
    setTick(Date.now());
  };

  const handleToggleMute = () => {
    if (!attempt) return;
    commit({ ...attempt, muted: !attempt.muted });
  };

  const handleSubmit = () => {
    if (!attempt || attempt.status !== "in-progress") return;
    const now = Date.now();
    // Submit immediately: no confirmation dialog, no intermediate message.
    commit({ ...attempt, status: "submitted", submittedAt: now, index: attempt.index });
    if (!attempt.muted) playSubmitSound();
  };

  const handleRestart = () => {
    clearAttempt();
    setAttempt(null);
    setTick(Date.now());
    outbox.current = null;
    sending.current = null;
    setSendStatus("idle");
  };

  const openTeacherKey = () => setTeacherOpen(true);

  /* --------------------------- screens ------------------------------ */
  if (screen === "entry") {
    return (
      <>
        <EntryScreen
          hasSavedAttempt={false}
          savedName=""
          onStart={handleStart}
          onOpenTeacherKey={openTeacherKey}
        />
        <TeacherKey open={teacherOpen} onClose={() => setTeacherOpen(false)} />
      </>
    );
  }

  if (screen === "exam" && attempt) {
    return (
      <>
        <ExamScreen
          questions={QUESTIONS}
          answers={answers}
          index={index}
          name={attempt.name}
          elapsed={formatElapsed(elapsedMs)}
          muted={attempt.muted}
          onIndex={handleIndex}
          onChange={handleChange}
          onToggleMute={handleToggleMute}
          onSubmit={handleSubmit}
        />
        <TeacherKey open={teacherOpen} onClose={() => setTeacherOpen(false)} />
      </>
    );
  }

  if (screen === "results" && attempt && result && submittedAt !== null) {
    return (
      <>
        <ResultsScreen
          name={attempt.name}
          result={result}
          questions={QUESTIONS}
          submittedAt={submittedAt}
          elapsedMs={elapsedMs}
          sendStatus={sendStatus}
          onResend={handleResend}
          onRestart={handleRestart}
          onOpenTeacherKey={openTeacherKey}
        />
        <TeacherKey open={teacherOpen} onClose={() => setTeacherOpen(false)} />
      </>
    );
  }

  /* Recovered state that cannot be classified — fall back to a fresh entry. */
  return (
    <>
      <EntryScreen
        hasSavedAttempt={false}
        savedName=""
        onStart={handleStart}
        onOpenTeacherKey={openTeacherKey}
      />
      <TeacherKey open={teacherOpen} onClose={() => setTeacherOpen(false)} />
    </>
  );
}
