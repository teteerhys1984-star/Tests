import { ChevronLeft, ChevronRight, Flag } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Backdrop } from "@/components/Backdrop";
import { ExamHeader } from "@/components/ExamHeader";
import { Footer } from "@/components/Footer";
import { QuestionCard } from "@/components/QuestionCard";
import { QuestionPalette } from "@/components/QuestionPalette";
import { ResultsScreen } from "@/components/ResultsScreen";
import { StartScreen } from "@/components/StartScreen";
import { TeacherArea } from "@/components/TeacherArea";
import { answeredCount, gradeExam, isQuestionComplete } from "@/exam/grading";
import { QUESTIONS } from "@/exam/questions";
import type { AnswerMap } from "@/exam/types";
import { playStartSound, playSubmitSound, warmUpAudio } from "@/lib/audio";
import { buildReport } from "@/lib/report";
import {
  clearAttempt,
  elapsedMs,
  loadAttempt,
  loadMuted,
  saveAttempt,
  saveMuted,
} from "@/lib/storage";
import type { AttemptState } from "@/lib/storage";
import {
  buildPayload,
  isPending,
  newAttemptId,
  retryPending,
  sendWithRetry,
  type SendStatus,
  type SubmissionPayload,
} from "@/lib/submit";

/** Ticking clock bound to the stored startedAt timestamp (survives refresh). */
function useElapsed(attempt: AttemptState | null): number {
  const [now, setNow] = useState(() => Date.now());
  const running = attempt?.status === "in_progress";

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [running]);

  if (!attempt) return 0;
  return elapsedMs(attempt, now);
}

export default function App() {
  const [attempt, setAttempt] = useState<AttemptState | null>(() => loadAttempt());
  const attemptRef = useRef<AttemptState | null>(attempt);
  const [recovered] = useState(() => loadAttempt()?.status === "in_progress");
  const [muted, setMuted] = useState<boolean>(() => loadMuted());
  const [teacherOpen, setTeacherOpen] = useState(false);

  /** Payload currently displayed on the results screen (reused by Resend Result). */
  const outbox = useRef<SubmissionPayload | null>(null);
  /** Payload currently in flight — guards against duplicate sends. */
  const sending = useRef<SubmissionPayload | null>(null);

  const elapsed = useElapsed(attempt);
  const current = attempt?.current ?? 0;

  const commitAttempt = useCallback(
    (
      updater:
        | AttemptState
        | null
        | ((prev: AttemptState | null) => AttemptState | null)
    ): AttemptState | null => {
      const prev = attemptRef.current;
      const next = typeof updater === "function" ? updater(prev) : updater;
      attemptRef.current = next;
      setAttempt(next);
      if (next) saveAttempt(next);
      else clearAttempt();
      return next;
    },
    []
  );

  /* On load: silently retry any pending submissions for THIS exam only. */
  useEffect(() => {
    let cancelled = false;
    void retryPending().then((flushed) => {
      if (cancelled) return;
      commitAttempt((prev) => {
        if (!prev || prev.status !== "submitted" || !prev.attemptId) return prev;
        const pending = isPending(prev.attemptId);
        let nextStatus: SendStatus = prev.sendStatus ?? "idle";
        if (pending) {
          nextStatus = "failed";
        } else if (
          flushed > 0 &&
          (prev.sendStatus === "failed" || prev.sendStatus === "sending")
        ) {
          nextStatus = "success";
        } else if (prev.sendStatus === "sending" && sending.current === null) {
          nextStatus = "failed";
        }
        if (nextStatus === prev.sendStatus) return prev;
        return { ...prev, sendStatus: nextStatus };
      });
    });
    return () => {
      cancelled = true;
    };
  }, [commitAttempt]);

  const sendResult = useCallback(
    (payload: SubmissionPayload) => {
      if (sending.current === payload) return;
      sending.current = payload;
      commitAttempt((prev) =>
        prev && prev.status === "submitted" ? { ...prev, sendStatus: "sending" } : prev
      );
      void sendWithRetry(payload).then((ok) => {
        if (sending.current === payload) sending.current = null;
        if (outbox.current === payload) {
          commitAttempt((prev) =>
            prev && prev.status === "submitted"
              ? { ...prev, sendStatus: ok ? "success" : "failed" }
              : prev
          );
        }
      });
    },
    [commitAttempt]
  );

  const startExam = useCallback(
    (name: string) => {
      warmUpAudio();
      outbox.current = null;
      sending.current = null;
      commitAttempt({
        status: "in_progress",
        studentName: name,
        startedAt: Date.now(),
        finishedAt: null,
        current: 0,
        answers: {},
        result: null,
        attemptId: undefined,
        sendStatus: "idle",
      });
      playStartSound(loadMuted());
      window.scrollTo({ top: 0 });
    },
    [commitAttempt]
  );

  const setAnswer = useCallback(
    (qN: number, partId: string, value: string) => {
      commitAttempt((prev) =>
        prev && prev.status === "in_progress"
          ? {
              ...prev,
              answers: {
                ...prev.answers,
                [qN]: { ...(prev.answers[qN] ?? {}), [partId]: value },
              },
            }
          : prev
      );
    },
    [commitAttempt]
  );

  const jumpTo = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(QUESTIONS.length - 1, index));
      commitAttempt((prev) => (prev ? { ...prev, current: clamped } : prev));
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [commitAttempt]
  );

  const submitExam = useCallback(() => {
    const latest = attemptRef.current;
    if (!latest || latest.status !== "in_progress") return;
    if (answeredCount(latest.answers) !== QUESTIONS.length) return; // gate: all 20 required

    const finishedAt = Date.now();
    const frozenAnswers: AnswerMap = { ...latest.answers };
    const result = gradeExam(frozenAnswers);
    const attemptId = newAttemptId();

    let payload: SubmissionPayload | null = null;
    try {
      const reportText = buildReport({
        studentName: latest.studentName,
        result,
        startedAt: latest.startedAt,
        finishedAt,
      });
      payload = buildPayload({
        attemptId,
        studentName: latest.studentName,
        startedAt: latest.startedAt,
        finishedAt,
        answers: frozenAnswers,
        result,
        reportText,
      });
    } catch {
      payload = null;
    }

    outbox.current = payload;

    commitAttempt({
      ...latest,
      answers: frozenAnswers,
      status: "submitted",
      finishedAt,
      result,
      attemptId,
      sendStatus: payload ? "sending" : "failed",
    });

    playSubmitSound(loadMuted());
    window.scrollTo({ top: 0 });

    if (payload) sendResult(payload);
  }, [commitAttempt, sendResult]);

  const handleResend = useCallback(() => {
    const latest = attemptRef.current;
    if (!latest || latest.status !== "submitted" || !latest.result || !latest.finishedAt) {
      return;
    }
    const attemptId = latest.attemptId ?? newAttemptId();
    let payload = outbox.current;
    if (!payload || payload.attemptId !== attemptId) {
      try {
        const resolved = latest.attemptId
          ? latest
          : commitAttempt((prev) => (prev ? { ...prev, attemptId } : prev)) ?? latest;
        const reportText = buildReport({
          studentName: resolved.studentName,
          result: resolved.result!,
          startedAt: resolved.startedAt,
          finishedAt: resolved.finishedAt!,
        });
        payload = buildPayload({
          attemptId,
          studentName: resolved.studentName,
          startedAt: resolved.startedAt,
          finishedAt: resolved.finishedAt!,
          answers: resolved.answers,
          result: resolved.result!,
          reportText,
        });
      } catch {
        payload = null;
      }
    }
    if (payload) {
      outbox.current = payload;
      sendResult(payload);
    }
  }, [commitAttempt, sendResult]);

  const retake = useCallback(() => {
    outbox.current = null;
    sending.current = null;
    commitAttempt(null); // fresh attempt — name is required again on the start screen
    window.scrollTo({ top: 0 });
  }, [commitAttempt]);

  const toggleMute = useCallback(() => {
    setMuted((m) => {
      saveMuted(!m);
      return !m;
    });
  }, []);

  const answered = useMemo(
    () => (attempt ? answeredCount(attempt.answers) : 0),
    [attempt]
  );

  return (
    <div className="min-h-screen overflow-x-hidden bg-transparent font-sans">
      <Backdrop />

      {/* ── Phase: start ── */}
      {!attempt && <StartScreen onStart={startExam} />}

      {/* ── Phase: exam in progress ── */}
      {attempt && attempt.status === "in_progress" && (
        <div className="relative z-10 flex min-h-screen flex-col">
          <ExamHeader
            elapsedMs={elapsed}
            answered={answered}
            total={QUESTIONS.length}
            muted={muted}
            onToggleMute={toggleMute}
            recovered={recovered}
          />

          <main className="mx-auto grid w-full max-w-6xl flex-1 gap-6 px-4 pb-10 pt-6 sm:px-6 lg:grid-cols-[250px_1fr]">
            {/* question map */}
            <aside className="lg:sticky lg:top-24 lg:self-start">
              <QuestionPalette
                questions={QUESTIONS}
                current={current}
                isComplete={(q) => isQuestionComplete(q, attempt.answers)}
                onJump={jumpTo}
              />
            </aside>

            <div className="min-w-0">
              <QuestionCard
                key={QUESTIONS[current].n}
                question={QUESTIONS[current]}
                answers={attempt.answers[QUESTIONS[current].n] ?? {}}
                onAnswer={(partId, value) => setAnswer(QUESTIONS[current].n, partId, value)}
              />

              {/* navigation + submit */}
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={() => jumpTo(current - 1)}
                  disabled={current === 0}
                  className="btn btn-navy px-5 py-3"
                >
                  <ChevronLeft className="h-4 w-4" /> Previous
                </button>
                <button
                  type="button"
                  onClick={() => jumpTo(current + 1)}
                  disabled={current === QUESTIONS.length - 1}
                  className="btn btn-navy px-5 py-3"
                >
                  Next <ChevronRight className="h-4 w-4" />
                </button>

                <div className="sm:ml-auto">
                  <button
                    type="button"
                    onClick={submitExam}
                    disabled={answered !== QUESTIONS.length}
                    className="btn btn-brass w-full px-8 py-3.5 text-base sm:w-auto"
                    title={
                      answered === QUESTIONS.length
                        ? "Submit your exam now"
                        : `Answer all questions to submit (${QUESTIONS.length - answered} remaining)`
                    }
                  >
                    <Flag className="h-5 w-5" /> Submit Exam
                  </button>
                </div>
              </div>
              {answered !== QUESTIONS.length && (
                <p className="mt-2 text-right text-xs font-medium text-[#8fa1bc]">
                  {QUESTIONS.length - answered} question{QUESTIONS.length - answered === 1 ? "" : "s"} remaining —
                  the Submit Exam button unlocks when all 20 are answered.
                </p>
              )}
            </div>
          </main>
        </div>
      )}

      {/* ── Phase: results ── */}
      {attempt && attempt.status === "submitted" && attempt.result && attempt.finishedAt && (
        <ResultsScreen
          attempt={
            attempt as AttemptState & {
              result: NonNullable<AttemptState["result"]>;
              finishedAt: number;
            }
          }
          sendStatus={attempt.sendStatus ?? "idle"}
          onResend={handleResend}
          onRetake={retake}
        />
      )}

      <Footer onTeacherClick={() => setTeacherOpen(true)} />
      {teacherOpen && <TeacherArea onClose={() => setTeacherOpen(false)} />}
    </div>
  );
}
