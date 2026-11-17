import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ExamScreen from "@/components/ExamScreen";
import ResultScreen from "@/components/ResultScreen";
import StartScreen from "@/components/StartScreen";
import TeacherKey from "@/components/TeacherKey";
import { QUESTIONS } from "@/data/exam";
import {
  clearAttempt,
  loadAttempt,
  loadMuted,
  newAttemptId,
  saveAttempt,
  saveMuted,
  type Attempt,
} from "@/lib/attempt";
import { allAnswered, gradeExam } from "@/lib/grading";
import { buildReport } from "@/lib/report";
import { playStart, playSubmit, setMuted as syncSoundMute } from "@/lib/sound";
import {
  buildPayload,
  hasReceipt,
  retryPending,
  sendWithRetry,
  type SendStatus,
  type SubmissionPayload,
} from "@/lib/submit";

export default function App() {
  const [attempt, setAttempt] = useState<Attempt | null>(() => loadAttempt());
  const [teacherOpen, setTeacherOpen] = useState(false);
  const [muted, setMuted] = useState<boolean>(() => {
    const m = loadMuted();
    syncSoundMute(m);
    return m;
  });
  const [sendStatus, setSendStatus] = useState<SendStatus>(() => {
    const saved = loadAttempt();
    return saved?.submittedAt && hasReceipt(saved.attemptId) ? "success" : "idle";
  });

  // Keeps the built payload of the active submitted attempt so "Resend result"
  // sends the exact same payload and the exact same attemptId.
  const outboxRef = useRef<SubmissionPayload | null>(null);
  const sendingRef = useRef(false);

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    saveMuted(next);
    syncSoundMute(next);
  };

  useEffect(() => {
    if (attempt) saveAttempt(attempt);
  }, [attempt]);

  const sendOnce = useCallback(async (payload: SubmissionPayload) => {
    if (hasReceipt(payload.attemptId)) {
      setSendStatus("success");
      return;
    }
    if (sendingRef.current) return;
    sendingRef.current = true;
    setSendStatus("sending");
    try {
      const ok = await sendWithRetry(payload);
      setSendStatus(ok ? "success" : "failed");
    } finally {
      sendingRef.current = false;
    }
  }, []);

  // On app load: flush any pending payloads from earlier failed attempts of this exam.
  // If the current page already shows a submitted attempt without a receipt,
  // send it once automatically.
  useEffect(() => {
    const activeId = attempt?.submittedAt ? attempt.attemptId : undefined;
    void retryPending({ excludeAttemptId: activeId });

    if (attempt?.submittedAt && !hasReceipt(attempt.attemptId)) {
      const graded = gradeExam(attempt.answers, attempt.name);
      const reportText = buildReport(attempt, graded);
      const payload = buildPayload({
        attempt,
        result: graded,
        questions: QUESTIONS,
        reportText,
      });
      outboxRef.current = payload;
      void sendOnce(payload);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const start = (name: string) => {
    playStart();
    setTeacherOpen(false);
    outboxRef.current = null;
    sendingRef.current = false;
    setSendStatus("idle");
    const next: Attempt = {
      v: 1,
      attemptId: newAttemptId(),
      name,
      startedAt: Date.now(),
      answers: {},
      currentIndex: 0,
      submittedAt: null,
    };
    saveAttempt(next);
    setAttempt(next);
  };

  const setAnswer = (key: string, value: string) => {
    setAttempt((prev) =>
      prev ? { ...prev, answers: { ...prev.answers, [key]: value } } : prev,
    );
  };

  const setQuestionIndex = (index: number) => {
    setAttempt((prev) => (prev ? { ...prev, currentIndex: index } : prev));
  };

  const submit = () => {
    if (!attempt || attempt.submittedAt) return;
    if (!allAnswered(attempt.answers)) return;
    playSubmit();
    const submitted: Attempt = { ...attempt, submittedAt: Date.now() };
    saveAttempt(submitted);
    setAttempt(submitted);

    const graded = gradeExam(submitted.answers, submitted.name);
    const reportText = buildReport(submitted, graded);
    const payload = buildPayload({
      attempt: submitted,
      result: graded,
      questions: QUESTIONS,
      reportText,
    });
    outboxRef.current = payload;
    void sendOnce(payload);
  };

  const handleResend = useCallback(() => {
    if (!attempt?.submittedAt) return;
    const payload =
      outboxRef.current && outboxRef.current.attemptId === attempt.attemptId
        ? outboxRef.current
        : (() => {
            const graded = gradeExam(attempt.answers, attempt.name);
            return buildPayload({
              attempt,
              result: graded,
              questions: QUESTIONS,
              reportText: buildReport(attempt, graded),
            });
          })();
    outboxRef.current = payload;
    void sendOnce(payload);
  }, [attempt, sendOnce]);

  const retake = () => {
    clearAttempt();
    outboxRef.current = null;
    sendingRef.current = false;
    setSendStatus("idle");
    setAttempt(null);
  };

  const result = useMemo(
    () => (attempt?.submittedAt ? gradeExam(attempt.answers, attempt.name) : null),
    [attempt],
  );

  return (
    <>
      {!attempt && (
        <StartScreen
          onStart={start}
          onOpenTeacher={() => setTeacherOpen(true)}
          muted={muted}
          onToggleMute={toggleMute}
        />
      )}

      {attempt && !attempt.submittedAt && (
        <ExamScreen
          attempt={attempt}
          onAnswer={setAnswer}
          onNavigate={setQuestionIndex}
          onSubmit={submit}
          muted={muted}
          onToggleMute={toggleMute}
        />
      )}

      {attempt && attempt.submittedAt && result && (
        <ResultScreen
          attempt={attempt}
          result={result}
          sendStatus={sendStatus}
          onResend={handleResend}
          onRetake={retake}
          onOpenTeacher={() => setTeacherOpen(true)}
        />
      )}

      {teacherOpen && (!attempt || !!attempt.submittedAt) && (
        <TeacherKey onClose={() => setTeacherOpen(false)} />
      )}
    </>
  );
}
