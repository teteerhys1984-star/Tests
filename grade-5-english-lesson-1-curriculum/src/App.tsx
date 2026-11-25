import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import StartScreen from "./components/StartScreen";
import ExamScreen from "./components/ExamScreen";
import ResultsScreen from "./components/ResultsScreen";
import TeacherKey from "./components/TeacherKey";
import { ALL_ITEMS, QUESTIONS } from "./data/exam";
import { gradeExam, isItemAnswered, type Answer } from "./lib/grading";
import { buildReport } from "./lib/report";
import { playStartSound, playSubmitSound } from "./lib/sound";
import {
  loadAttempt,
  loadMuted,
  loadSavedName,
  newAttemptId,
  saveAttempt,
  saveMuted,
  saveName,
  type Attempt,
} from "./lib/storage";
import {
  buildPayload,
  hasReceipt,
  retryPending,
  sendWithRetry,
  type SendStatus,
  type SubmissionPayload,
} from "./lib/submit";

function useHash(): string {
  const [hash, setHash] = useState(() => window.location.hash);
  useEffect(() => {
    const onChange = () => setHash(window.location.hash);
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return hash;
}

export default function App() {
  const hash = useHash();
  // Restores any unfinished or submitted attempt from localStorage. Never creates one automatically.
  const [attempt, setAttempt] = useState<Attempt | null>(() => loadAttempt());
  const [draftName, setDraftName] = useState<string>(() => loadSavedName());
  const [muted, setMuted] = useState<boolean>(() => loadMuted());
  const [sendStatus, setSendStatus] = useState<SendStatus>("idle");
  const outbox = useRef<SubmissionPayload | null>(null);
  const sending = useRef<SubmissionPayload | null>(null);

  useEffect(() => {
    saveAttempt(attempt);
  }, [attempt]);

  useEffect(() => {
    void retryPending({ excludeAttemptId: attempt?.attemptId });
  }, [attempt?.attemptId]);

  const handleStart = useCallback(
    (name: string) => {
      saveName(name);
      setDraftName(name);
      outbox.current = null;
      sending.current = null;
      setSendStatus("idle");
      setAttempt({
        attemptId: newAttemptId(),
        studentName: name,
        status: "in-progress",
        startedAt: Date.now(),
        currentQuestion: 1,
        answers: {},
      });
      playStartSound(muted);
    },
    [muted],
  );

  const handleAnswer = useCallback((itemId: string, value: Answer) => {
    setAttempt((prev) =>
      prev && prev.status === "in-progress" ? { ...prev, answers: { ...prev.answers, [itemId]: value } } : prev,
    );
  }, []);

  const handleGoto = useCallback((n: number) => {
    setAttempt((prev) => (prev && prev.status === "in-progress" ? { ...prev, currentQuestion: n } : prev));
  }, []);

  const handleSubmit = useCallback(() => {
    // Submits immediately: no confirmation dialog. Only enabled when every answer is complete.
    setAttempt((prev) => {
      if (!prev || prev.status !== "in-progress") return prev;
      const complete = ALL_ITEMS.every((x) => isItemAnswered(prev.answers[x.item.id]));
      if (!complete) return prev;
      return { ...prev, status: "submitted", submittedAt: Date.now() };
    });
    playSubmitSound(muted);
  }, [muted]);

  const handleNewAttempt = useCallback(() => {
    saveName(null);
    setDraftName("");
    outbox.current = null;
    sending.current = null;
    setSendStatus("idle");
    setAttempt(null);
  }, []);

  const toggleMute = useCallback(() => {
    setMuted((m) => {
      saveMuted(!m);
      return !m;
    });
  }, []);

  const openTeacherKey = useCallback(() => {
    window.location.hash = "#teacher";
  }, []);

  const result = useMemo(() => (attempt ? gradeExam(attempt.answers) : null), [attempt]);

  const reportText = useMemo(() => {
    if (!attempt || attempt.status !== "submitted" || !attempt.submittedAt || !result) return "";
    return buildReport({
      studentName: attempt.studentName,
      result,
      startedAt: attempt.startedAt,
      submittedAt: attempt.submittedAt,
    });
  }, [attempt, result]);

  const sendResult = useCallback((payload: SubmissionPayload) => {
    if (sending.current === payload) return;
    sending.current = payload;
    setSendStatus("sending");
    void sendWithRetry(payload).then((ok) => {
      if (sending.current === payload) sending.current = null;
      if (outbox.current === payload) setSendStatus(ok ? "success" : "failed");
    });
  }, []);

  useEffect(() => {
    if (!attempt || attempt.status !== "submitted" || !attempt.submittedAt || !result) return;
    if (outbox.current && outbox.current.attemptId === attempt.attemptId) return;
    const payload = buildPayload({ attempt, result, reportText });
    outbox.current = payload;
    if (hasReceipt(attempt.attemptId)) {
      setSendStatus("success");
      return;
    }
    sendResult(payload);
  }, [attempt, result, reportText, sendResult]);

  const handleResend = useCallback(() => {
    if (outbox.current) sendResult(outbox.current);
  }, [sendResult]);

  // Teacher area: reachable via #teacher or Teacher area button on start/results screens.
  if (hash === "#teacher") {
    return <TeacherKey attempt={attempt} onBack={() => (window.location.hash = "")} />;
  }

  if (!attempt) {
    return (
      <StartScreen
        draftName={draftName}
        onDraftChange={(v) => {
          setDraftName(v);
          saveName(v);
        }}
        onStart={handleStart}
        muted={muted}
        onToggleMute={toggleMute}
        onOpenTeacherKey={openTeacherKey}
      />
    );
  }

  if (attempt.status === "submitted" && attempt.submittedAt && result) {
    return (
      <ResultsScreen
        studentName={attempt.studentName}
        startedAt={attempt.startedAt}
        submittedAt={attempt.submittedAt}
        result={result}
        sendStatus={sendStatus}
        onResend={handleResend}
        onNewAttempt={handleNewAttempt}
        onOpenTeacherKey={openTeacherKey}
      />
    );
  }

  return (
    <ExamScreen
      studentName={attempt.studentName}
      startedAt={attempt.startedAt}
      currentQuestion={attempt.currentQuestion || QUESTIONS[0].number}
      answers={attempt.answers}
      muted={muted}
      onToggleMute={toggleMute}
      onAnswer={handleAnswer}
      onGoto={handleGoto}
      onSubmit={handleSubmit}
    />
  );
}
