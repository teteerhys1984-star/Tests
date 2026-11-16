/**
 * The live exam experience: sticky header with stopwatch + mute control,
 * question palette, single focused question card, navigation and the
 * always-labelled "Submit Exam" button (enabled only when all 20 are done).
 */
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock3,
  Send,
  User,
  Volume2,
  VolumeX,
} from "lucide-react";
import { EXAM_TITLE, QUESTIONS } from "../data/questions";
import { isQuestionAnswered } from "../lib/grading";
import { formatElapsed } from "../lib/time";
import type { AnswerMap, AnswerValue, Question, Subpart } from "../types";
import { cn } from "../utils/cn";
import { LessonChip, QuestionPalette } from "./QuestionPalette";
import { McqInput, ReorderInput, SelectInput, TextInput, TfInput } from "./inputs";

function useElapsedMs(startTs: number | null, endTs: number | null): number {
  const [now, setNow] = useState(() => Date.now());
  const running = startTs !== null && endTs === null;
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(id);
  }, [running]);
  if (startTs === null) return 0;
  return (endTs ?? now) - startTs;
}

function SubpartBlock({
  q,
  sub,
  index,
  value,
  onAnswer,
}: {
  q: Question;
  sub: Subpart;
  index: number;
  value: AnswerValue | undefined;
  onAnswer: (id: string, v: AnswerValue) => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-800/80 bg-slate-950/40 p-4 sm:p-5">
      <div className="mb-3 flex items-baseline gap-2.5">
        <span className="font-display text-sm font-bold text-slate-500">
          {q.number}.{index + 1}
        </span>
        {sub.type !== "text" && sub.type !== "select" && sub.prompt && (
          <p className="text-[15px] leading-relaxed text-slate-200">{sub.prompt}</p>
        )}
        <span className="ml-auto shrink-0 text-[11px] font-bold uppercase tracking-wider text-slate-600">
          {sub.marks} {sub.marks === 1 ? "mark" : "marks"}
        </span>
      </div>

      {sub.type === "mcq" && (
        <McqInput
          sub={sub}
          value={value?.kind === "mcq" ? value.index : null}
          onChange={(index) => onAnswer(sub.id, { kind: "mcq", index })}
        />
      )}
      {sub.type === "tf" && (
        <TfInput
          sub={sub}
          value={value?.kind === "tf" ? value.value : null}
          onChange={(v) => onAnswer(sub.id, { kind: "tf", value: v })}
        />
      )}
      {sub.type === "select" && (
        <SelectInput
          sub={sub}
          value={value?.kind === "select" ? value.value : ""}
          onChange={(v) => onAnswer(sub.id, { kind: "select", value: v })}
        />
      )}
      {sub.type === "text" && (
        <TextInput
          sub={sub}
          value={value?.kind === "text" ? value.value : ""}
          onChange={(v) => onAnswer(sub.id, { kind: "text", value: v })}
        />
      )}
      {sub.type === "reorder" && (
        <ReorderInput
          sub={sub}
          value={value?.kind === "reorder" ? value.value : []}
          onChange={(v) => onAnswer(sub.id, { kind: "reorder", value: v })}
        />
      )}
    </div>
  );
}

export function ExamScreen({
  attempt,
  muted,
  onToggleMute,
  onAnswer,
  onNavigate,
  onSubmit,
}: {
  attempt: { studentName: string; startTs: number | null; currentIndex: number; answers: AnswerMap };
  muted: boolean;
  onToggleMute: () => void;
  onAnswer: (id: string, v: AnswerValue) => void;
  onNavigate: (index: number) => void;
  onSubmit: () => void;
}) {
  const elapsed = useElapsedMs(attempt.startTs, null);
  const answeredFlags = QUESTIONS.map((q) => isQuestionAnswered(q, attempt.answers));
  const answeredCount = answeredFlags.filter(Boolean).length;
  const allAnswered = answeredCount === QUESTIONS.length;
  const current = QUESTIONS[attempt.currentIndex];
  const progressPct = Math.round((answeredCount / QUESTIONS.length) * 100);

  return (
    <div className="animate-fade-in">
      {/* Sticky exam header */}
      <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-ink-950/85 backdrop-blur-lg">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <div className="hidden min-w-0 items-center gap-2.5 sm:flex">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-sky-600 text-slate-950">
              <BookOpen className="h-4.5 w-4.5" />
            </span>
            <div className="min-w-0">
              <p className="truncate font-display text-sm font-bold text-slate-100">
                {EXAM_TITLE.split("—")[0].trim()}
              </p>
              <p className="flex items-center gap-1 text-xs text-slate-500">
                <User className="h-3 w-3" />
                <span className="max-w-[180px] truncate">{attempt.studentName}</span>
              </p>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2">
            {/* Answered progress */}
            <div className="hidden items-center gap-2 md:flex" aria-live="polite">
              <div className="h-1.5 w-28 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-violet-400 transition-all duration-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <span className="tabular text-xs font-semibold text-slate-400">
                {answeredCount} / {QUESTIONS.length} answered
              </span>
            </div>

            {/* Stopwatch */}
            <div
              className="tabular flex items-center gap-2 rounded-xl border border-slate-700/80 bg-slate-900/60 px-3.5 py-2"
              role="timer"
              aria-label="Elapsed time"
            >
              <Clock3 className="h-4 w-4 animate-pulse-soft text-cyan-300" />
              <span className="font-display text-sm font-bold tracking-wider text-slate-100">
                {formatElapsed(elapsed)}
              </span>
            </div>

            {/* Mute */}
            <button
              type="button"
              onClick={onToggleMute}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-700/80 bg-slate-900/60 text-slate-400 transition hover:border-slate-500 hover:text-slate-200"
              aria-label={muted ? "Unmute sounds" : "Mute sounds"}
              title={muted ? "Unmute sounds" : "Mute sounds"}
            >
              {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <div className="h-0.5 w-full bg-slate-800/60">
          <div
            className="h-full bg-gradient-to-r from-cyan-400 via-sky-400 to-violet-400 transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[260px_1fr] lg:py-8">
        {/* Palette — sidebar on desktop, top strip on mobile */}
        <aside className="order-first lg:order-none">
          <div className="glass rounded-2xl p-4 lg:sticky lg:top-24">
            <QuestionPalette
              questions={QUESTIONS}
              answeredFlags={answeredFlags}
              currentIndex={attempt.currentIndex}
              onJump={onNavigate}
            />
            <div className="mt-4 border-t border-slate-800 pt-4">
              <button
                type="button"
                onClick={onSubmit}
                disabled={!allAnswered}
                className={cn(
                  "flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 font-display text-sm font-bold transition",
                  allAnswered
                    ? "bg-gradient-to-r from-emerald-400 to-cyan-500 text-slate-950 shadow-[0_12px_32px_-10px_rgba(52,211,153,0.6)] hover:brightness-110 active:scale-[0.98]"
                    : "cursor-not-allowed border border-slate-700/70 bg-slate-900/50 text-slate-600",
                )}
              >
                <Send className="h-4 w-4" />
                Submit Exam
              </button>
              {!allAnswered && (
                <p className="mt-2 text-center text-[11px] font-medium text-slate-500">
                  Answer all {QUESTIONS.length} questions to submit —{" "}
                  {QUESTIONS.length - answeredCount} remaining
                </p>
              )}
            </div>
          </div>
        </aside>

        {/* Question card */}
        <main className="min-w-0">
          <article
            key={current.id}
            className="glass animate-fade-up rounded-3xl p-5 sm:p-7"
          >
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="font-display text-3xl font-bold text-slate-100">
                Q{current.number}
              </span>
              <span
                className={cn(
                  "rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider",
                  current.lesson === "lesson1"
                    ? "bg-cyan-400/10 text-cyan-300"
                    : "bg-violet-400/10 text-violet-300",
                )}
              >
                {current.typeLabel}
              </span>
              <span className="ml-auto rounded-full border border-amber-400/25 bg-amber-400/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-amber-300">
                {current.marks} marks
              </span>
            </div>
            <LessonChip lesson={current.lesson} className="mt-3" />

            <p className="mt-4 text-[15px] font-medium leading-relaxed text-slate-200 sm:text-base">
              {current.instruction}
            </p>

            {current.passage && (
              <div className="mt-5 rounded-2xl border border-slate-700/60 bg-slate-900/60 p-5">
                <p className="font-display text-sm font-bold text-slate-100">
                  {current.passage.title}
                </p>
                <p className="mt-0.5 text-[11px] font-medium uppercase tracking-wider text-slate-500">
                  {current.passage.source}
                </p>
                <p className="mt-3 text-[15px] leading-[1.85] text-slate-300">
                  {current.passage.text}
                </p>
              </div>
            )}

            {current.wordBank && (
              <div className="mt-5 rounded-2xl border border-dashed border-slate-600/70 bg-slate-900/40 p-4">
                <p className="mb-2.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Word box
                </p>
                <div className="flex flex-wrap gap-2">
                  {current.wordBank.map((w) => (
                    <span
                      key={w}
                      className="rounded-lg border border-slate-600/60 bg-slate-800/70 px-3 py-1.5 text-sm font-medium text-slate-200"
                    >
                      {w}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 space-y-4">
              {current.subparts.map((sub, i) => (
                <SubpartBlock
                  key={sub.id}
                  q={current}
                  sub={sub}
                  index={i}
                  value={attempt.answers[sub.id]}
                  onAnswer={onAnswer}
                />
              ))}
            </div>

            {/* Prev / Next */}
            <div className="mt-7 flex items-center justify-between gap-3 border-t border-slate-800 pt-5">
              <button
                type="button"
                onClick={() => onNavigate(Math.max(0, attempt.currentIndex - 1))}
                disabled={attempt.currentIndex === 0}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-700/80 px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:border-slate-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-35"
              >
                <ArrowLeft className="h-4 w-4" />
                Previous
              </button>
              {answeredFlags[attempt.currentIndex] ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400/90">
                  <CheckCircle2 className="h-4 w-4" />
                  Answered
                </span>
              ) : (
                <span className="text-xs font-semibold text-slate-500">
                  Question {attempt.currentIndex + 1} of {QUESTIONS.length}
                </span>
              )}
              <button
                type="button"
                onClick={() =>
                  onNavigate(Math.min(QUESTIONS.length - 1, attempt.currentIndex + 1))
                }
                disabled={attempt.currentIndex === QUESTIONS.length - 1}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-700/80 px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:border-slate-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-35"
              >
                Next
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </article>

          {/* Mobile submit */}
          <div className="mt-5 lg:hidden">
            <button
              type="button"
              onClick={onSubmit}
              disabled={!allAnswered}
              className={cn(
                "flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 font-display text-[15px] font-bold transition",
                allAnswered
                  ? "bg-gradient-to-r from-emerald-400 to-cyan-500 text-slate-950 shadow-[0_12px_32px_-10px_rgba(52,211,153,0.6)] hover:brightness-110 active:scale-[0.98]"
                  : "cursor-not-allowed border border-slate-700/70 bg-slate-900/50 text-slate-600",
              )}
            >
              <Send className="h-4 w-4" />
              Submit Exam
            </button>
            {!allAnswered && (
              <p className="mt-2 text-center text-xs font-medium text-slate-500">
                Answer all {QUESTIONS.length} questions to submit —{" "}
                {QUESTIONS.length - answeredCount} remaining
              </p>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
