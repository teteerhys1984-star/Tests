import { ChevronLeft, ChevronRight, Flag } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
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
import { playStartSound, playSubmitSound, warmUpAudio } from "@/lib/audio";
import {
  clearAttempt,
  elapsedMs,
  loadAttempt,
  loadMuted,
  saveAttempt,
  saveMuted,
} from "@/lib/storage";
import type { AttemptState } from "@/lib/storage";

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
  const [recovered] = useState(() => loadAttempt()?.status === "in_progress");
  const [muted, setMuted] = useState<boolean>(() => loadMuted());
  const [teacherOpen, setTeacherOpen] = useState(false);

  const elapsed = useElapsed(attempt);
  const current = attempt?.current ?? 0;

  const persist = useCallback((next: AttemptState | null) => {
    setAttempt(next);
    if (next) saveAttempt(next);
    else clearAttempt();
  }, []);

  const startExam = useCallback(
    (name: string) => {
      warmUpAudio();
      persist({
        status: "in_progress",
        studentName: name,
        startedAt: Date.now(),
        finishedAt: null,
        current: 0,
        answers: {},
        result: null,
      });
      playStartSound(loadMuted());
      window.scrollTo({ top: 0 });
    },
    [persist]
  );

  const setAnswer = useCallback(
    (qN: number, partId: string, value: string) => {
      persist(
        attempt
          ? {
              ...attempt,
              answers: { ...attempt.answers, [qN]: { ...(attempt.answers[qN] ?? {}), [partId]: value } },
            }
          : attempt
      );
    },
    [attempt, persist]
  );

  const jumpTo = useCallback(
    (index: number) => {
      if (!attempt) return;
      persist({ ...attempt, current: Math.max(0, Math.min(QUESTIONS.length - 1, index)) });
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [attempt, persist]
  );

  const submitExam = useCallback(() => {
    if (!attempt || attempt.status !== "in_progress") return;
    if (answeredCount(attempt.answers) !== QUESTIONS.length) return; // gate: all 20 required
    const result = gradeExam(attempt.answers);
    persist({ ...attempt, status: "submitted", finishedAt: Date.now(), result });
    playSubmitSound(loadMuted());
    window.scrollTo({ top: 0 });
  }, [attempt, persist]);

  const retake = useCallback(() => {
    persist(null); // fresh attempt — name is required again on the start screen
    window.scrollTo({ top: 0 });
  }, [persist]);

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
                  onClick={() => jumpTo(current - 1)}
                  disabled={current === 0}
                  className="btn btn-navy px-5 py-3"
                >
                  <ChevronLeft className="h-4 w-4" /> Previous
                </button>
                <button
                  onClick={() => jumpTo(current + 1)}
                  disabled={current === QUESTIONS.length - 1}
                  className="btn btn-navy px-5 py-3"
                >
                  Next <ChevronRight className="h-4 w-4" />
                </button>

                <div className="sm:ml-auto">
                  <button
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
          onRetake={retake}
        />
      )}

      <Footer onTeacherClick={() => setTeacherOpen(true)} />
      {teacherOpen && <TeacherArea onClose={() => setTeacherOpen(false)} />}
    </div>
  );
}
