import { useEffect, useMemo, useState } from "react";
import {
  AlarmClock,
  ChevronLeft,
  ChevronRight,
  Flower2,
  Map,
  SendHorizonal,
  UserRound,
  Volume2,
  VolumeX,
} from "lucide-react";
import type { AnswersMap, ExamSession } from "../types";
import { QUESTIONS, EXAM_META } from "../data/examData";
import { formatDuration } from "../logic/report";
import { isQuestionAnswered, unansweredQuestionIds } from "../logic/grading";
import QuestionCard from "./QuestionCard";

interface ExamScreenProps {
  session: ExamSession;
  onAnswer: (questionId: number, partId: string, value: AnswersMap[number][string]) => void;
  onNavigate: (q: number) => void;
  onSubmit: () => void;
  muted: boolean;
  onToggleMute: () => void;
}

function Stopwatch({ startedAt }: { startedAt: number }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(t);
  }, []);
  return (
    <span className="font-display text-lg font-bold tabular-nums tracking-wide text-violet-deep">
      {formatDuration(now - startedAt)}
    </span>
  );
}

export default function ExamScreen({ session, onAnswer, onNavigate, onSubmit, muted, onToggleMute }: ExamScreenProps) {
  const [mapOpen, setMapOpen] = useState(false);
  const q = QUESTIONS.find((x) => x.id === session.currentQuestion) ?? QUESTIONS[0];
  const answers = session.answers;

  const unanswered = useMemo(() => unansweredQuestionIds(QUESTIONS, answers), [answers]);
  const answeredCount = QUESTIONS.length - unanswered.length;
  const progress = Math.round((answeredCount / QUESTIONS.length) * 100);
  const allDone = unanswered.length === 0;
  const qIndex = QUESTIONS.findIndex((x) => x.id === q.id);
  const isFirst = qIndex <= 0;
  const isLast = qIndex >= QUESTIONS.length - 1;

  return (
    <div className="mx-auto w-full max-w-6xl px-3 pb-16 sm:px-5">
      {/* ── sticky header ─────────────────────────────────────── */}
      <header className="sticky top-2 z-30 mt-2 animate-rise">
        <div className="paper-card flex flex-wrap items-center gap-x-4 gap-y-2 rounded-3xl px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-petal to-lilac">
              <Flower2 className="h-5 w-5 text-rose-deep" strokeWidth={2.5} />
            </span>
            <div className="leading-tight">
              <p className="font-display text-[13px] font-bold text-violet-deep">{EXAM_META.brand}</p>
              <p className="text-[11px] font-bold uppercase tracking-wider text-ink-soft/80">{EXAM_META.scope}</p>
            </div>
          </div>

          <div className="hidden h-8 w-px bg-lilac/70 sm:block" />

          <div className="flex min-w-0 items-center gap-2 text-ink">
            <UserRound className="h-4.5 w-4.5 shrink-0 text-rose" strokeWidth={2.5} />
            <span className="truncate font-display text-sm font-bold sm:text-base">{session.studentName}</span>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-full bg-cream-deep px-3.5 py-1.5" title="Elapsed time">
              <AlarmClock className="h-4.5 w-4.5 text-rose" strokeWidth={2.5} />
              <Stopwatch startedAt={session.startedAt} />
            </div>
            <button
              type="button"
              onClick={onToggleMute}
              aria-label={muted ? "Unmute sounds" : "Mute sounds"}
              title={muted ? "Unmute sounds" : "Mute sounds"}
              className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-lilac bg-white/80 text-violet transition-colors hover:border-rose hover:text-rose"
            >
              {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* progress */}
        <div className="paper-card mt-2 rounded-3xl px-4 py-2.5 sm:px-6">
          <div className="flex items-center justify-between gap-3 text-[12px] font-extrabold uppercase tracking-wider text-ink-soft">
            <span>
              Question <span className="text-rose-deep">{q.id}</span> of {QUESTIONS.length}
            </span>
            <span className="hidden sm:inline">{answeredCount} / {QUESTIONS.length} answered · {progress}%</span>
            <span className="sm:hidden">{progress}%</span>
          </div>
          <div className="mt-1.5 h-3 overflow-hidden rounded-full bg-lilac/40">
            <div
              className="h-full rounded-full bg-gradient-to-r from-rose via-petal-deep to-lilac-deep transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        </div>
      </header>

      {/* ── main grid ─────────────────────────────────────────── */}
      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_19rem]">
        <main>
          <QuestionCard
            question={q}
            answers={answers[q.id] ?? {}}
            onAnswer={(partId, v) => onAnswer(q.id, partId, v)}
          />

          {/* prev / next */}
          <div className="mt-5 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => !isFirst && onNavigate(QUESTIONS[qIndex - 1].id)}
              disabled={isFirst}
              className="inline-flex items-center gap-1.5 rounded-full border-2 border-lilac bg-white/80 px-5 py-3 font-display text-sm font-bold text-violet shadow-soft transition-all hover:border-rose hover:text-rose disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-4.5 w-4.5" strokeWidth={2.6} /> Previous
            </button>
            <span className="hidden items-center gap-2 text-[13px] font-bold text-ink-soft sm:flex">
              {isQuestionAnswered(q, answers[q.id]) ? (
                <>
                  <span className="h-2.5 w-2.5 rounded-full bg-leaf-deep" /> This question is answered
                </>
              ) : (
                <>
                  <span className="h-2.5 w-2.5 rounded-full bg-peach-deep animate-pulse" /> This question still needs your answer
                </>
              )}
            </span>
            <button
              type="button"
              onClick={() => !isLast && onNavigate(QUESTIONS[qIndex + 1].id)}
              disabled={isLast}
              className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-rose to-violet px-5 py-3 font-display text-sm font-bold text-white shadow-lift transition-all hover:scale-[1.03] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next <ChevronRight className="h-4.5 w-4.5" strokeWidth={2.6} />
            </button>
          </div>

          {/* submit bar */}
          <div className={`paper-card mt-6 rounded-3xl p-5 transition-all ${allDone ? "animate-pulse-soft" : ""}`}>
            <div className="flex flex-col items-center gap-4 text-center">
              {!allDone ? (
                <p className="text-sm font-bold text-ink-soft">
                  Answer every question to finish your garden walk.{" "}
                  <span className="text-rose-deep">
                    Still waiting: {unanswered.length} question{unanswered.length !== 1 ? "s" : ""}
                  </span>
                </p>
              ) : (
                <p className="text-sm font-bold text-leaf-deep">
                  Every flower has bloomed — all 35 questions are answered. You can submit now!
                </p>
              )}
              <button
                type="button"
                onClick={onSubmit}
                disabled={!allDone}
                className={`inline-flex items-center gap-2.5 rounded-full px-10 py-4 font-display text-lg font-bold text-white shadow-lift transition-all ${
                  allDone
                    ? "bg-gradient-to-r from-rose via-rose-deep to-violet hover:scale-[1.04] hover:brightness-105 active:scale-[0.99]"
                    : "cursor-not-allowed bg-ink-soft/40"
                }`}
              >
                <SendHorizonal className="h-5 w-5" strokeWidth={2.6} />
                Submit Exam
              </button>
              {!allDone && (
                <div className="flex max-w-full flex-wrap items-center justify-center gap-1.5">
                  {unanswered.slice(0, 20).map((id) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => onNavigate(id)}
                      className="rounded-full border border-peach-deep bg-peach/40 px-2.5 py-1 text-[11px] font-extrabold text-[#b45309] transition-colors hover:bg-peach/70"
                      title={`Go to question ${id}`}
                    >
                      Q{id}
                    </button>
                  ))}
                  {unanswered.length > 20 && (
                    <span className="text-xs font-bold text-ink-soft">+{unanswered.length - 20} more</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </main>

        {/* ── garden map (desktop) ─────────────────────────────── */}
        <aside className="hidden lg:block">
          <div className="paper-card sticky top-32 rounded-3xl p-5">
            <h3 className="flex items-center gap-2 font-display text-base font-bold text-violet-deep">
              <Map className="h-4.5 w-4.5 text-rose" strokeWidth={2.5} /> Garden Map
            </h3>
            <p className="mt-1 text-xs font-semibold text-ink-soft">Tap a flower to visit its question.</p>
            <GardenGrid current={q.id} answers={answers} onNavigate={onNavigate} />
            <div className="mt-4 space-y-1.5 border-t border-lilac/50 pt-3 text-[11px] font-bold text-ink-soft">
              <p className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-gradient-to-br from-rose to-violet" /> Answered</p>
              <p className="flex items-center gap-2"><span className="h-3 w-3 rounded-full border-2 border-peach-deep bg-white" /> Still waiting</p>
              <p className="flex items-center gap-2"><span className="h-3 w-3 rounded-full border-2 border-rose bg-petal" /> You are here</p>
            </div>
          </div>
        </aside>

        {/* garden map toggle (mobile) */}
        <button
          type="button"
          onClick={() => setMapOpen((o) => !o)}
          className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-rose to-violet text-white shadow-lift transition-transform hover:scale-105 lg:hidden"
          aria-label="Open question map"
        >
          <Map className="h-6 w-6" />
        </button>
        {mapOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-violet-deep/30 backdrop-blur-sm lg:hidden" onClick={() => setMapOpen(false)}>
            <div
              className="paper-card max-h-[70vh] w-full overflow-y-auto rounded-t-[2rem] p-5"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="flex items-center gap-2 font-display text-base font-bold text-violet-deep">
                <Map className="h-4.5 w-4.5 text-rose" /> Garden Map
              </h3>
              <GardenGrid current={q.id} answers={answers} onNavigate={(id) => { onNavigate(id); setMapOpen(false); }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function GardenGrid({
  current,
  answers,
  onNavigate,
}: {
  current: number;
  answers: AnswersMap;
  onNavigate: (id: number) => void;
}) {
  return (
    <div className="mt-3 grid grid-cols-7 gap-1.5 lg:grid-cols-5">
      {QUESTIONS.map((question) => {
        const done = isQuestionAnswered(question, answers[question.id]);
        const isNow = question.id === current;
        return (
          <button
            key={question.id}
            type="button"
            onClick={() => onNavigate(question.id)}
            aria-label={`Question ${question.id}${done ? ", answered" : ", not answered"}`}
            className={`flex aspect-square items-center justify-center rounded-full font-display text-[13px] font-bold transition-all hover:scale-110 ${
              isNow
                ? "border-2 border-rose bg-petal text-rose-deep shadow-soft"
                : done
                  ? "bg-gradient-to-br from-rose to-violet text-white shadow-soft"
                  : "border-2 border-peach-deep/70 bg-white/80 text-ink-soft"
            }`}
          >
            {question.id}
          </button>
        );
      })}
    </div>
  );
}
