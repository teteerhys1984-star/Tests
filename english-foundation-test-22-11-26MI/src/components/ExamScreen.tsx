import { useEffect, useMemo, useRef } from "react";
import { EXAM_LABEL, QUESTIONS } from "../data/examData";
import type { AnswerMap } from "../data/types";
import { cn } from "../utils/cn";
import { isQuestionComplete, isSubAnswered } from "../utils/grading";
import { SubQuestionInput } from "./SubQuestionInput";
import { Timer } from "./Timer";

interface Props {
  studentName: string;
  startedAt: number;
  answers: AnswerMap;
  current: number;
  muted: boolean;
  onToggleMute: () => void;
  onAnswer: (id: string, value: string) => void;
  onNavigate: (index: number) => void;
  onSubmit: () => void;
}

export function ExamScreen({ studentName, startedAt, answers, current, muted, onToggleMute, onAnswer, onNavigate, onSubmit }: Props) {
  const q = QUESTIONS[current];
  const topRef = useRef<HTMLDivElement>(null);

  const completion = useMemo(() => QUESTIONS.map((qq) => isQuestionComplete(qq, answers)), [answers]);
  const answeredCount = completion.filter(Boolean).length;
  const allDone = answeredCount === QUESTIONS.length;
  const unansweredSubs = q.subs.filter((s) => !isSubAnswered(s, answers[s.id])).length;

  useEffect(() => {
    topRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
  }, [current]);

  return (
    <div className="flex min-h-screen flex-col">
      {/* Sticky header */}
      <header className="sticky top-0 z-20 border-b-4 border-indigo-200 bg-gradient-to-r from-sky-100 via-indigo-100 to-fuchsia-100/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-2 px-3 py-2 sm:px-4">
          <div className="min-w-0">
            <p className="truncate text-xs font-black uppercase tracking-wide text-indigo-600">{EXAM_LABEL}</p>
            <p className="truncate text-sm font-bold text-slate-700">👋 {studentName}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Timer startedAt={startedAt} />
            <button
              type="button"
              onClick={onToggleMute}
              aria-label={muted ? "Unmute sounds" : "Mute sounds"}
              aria-pressed={muted}
              className="btn-pop inline-flex h-11 w-11 items-center justify-center rounded-full border-2 border-indigo-200 bg-white text-indigo-700 shadow"
            >
              <SoundIcon muted={muted} />
            </button>
          </div>
        </div>
        <div className="mx-auto max-w-3xl px-3 pb-2 sm:px-4">
          <div className="flex items-center justify-between text-xs font-extrabold text-indigo-800">
            <span>
              Question {current + 1} of {QUESTIONS.length}
            </span>
            <span>
              {answeredCount} / {QUESTIONS.length} completed
            </span>
          </div>
          <div className="mt-1 h-3 w-full overflow-hidden rounded-full border-2 border-white bg-white/70 shadow-inner" role="progressbar" aria-valuemin={0} aria-valuemax={QUESTIONS.length} aria-valuenow={answeredCount}>
            <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-lime-400 to-yellow-400 transition-all" style={{ width: `${(answeredCount / QUESTIONS.length) * 100}%` }} />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-3 py-4 sm:px-4 sm:py-6">
        <div ref={topRef} className="scroll-mt-28" />

        {/* Question navigator */}
        <nav aria-label="Questions" className="mb-4 grid grid-cols-10 gap-1.5 sm:gap-2">
          {QUESTIONS.map((qq, i) => {
            const done = completion[i];
            const active = i === current;
            return (
              <button
                key={qq.number}
                type="button"
                onClick={() => onNavigate(i)}
                aria-label={`Question ${qq.number}${done ? ", completed" : ", not completed"}`}
                aria-current={active ? "step" : undefined}
                className={cn(
                  "btn-pop flex h-9 items-center justify-center rounded-xl border-2 text-xs font-black transition sm:h-11 sm:text-sm",
                  active && "scale-110 ring-4 ring-indigo-300",
                  done ? "border-emerald-500 bg-gradient-to-b from-emerald-400 to-emerald-500 text-white shadow" : "border-amber-300 bg-amber-100 text-amber-800",
                )}
              >
                {qq.number}
              </button>
            );
          })}
        </nav>
        <div className="mb-4 flex flex-wrap gap-x-4 gap-y-1 text-xs font-bold text-slate-600">
          <span className="inline-flex items-center gap-1.5"><span className="h-3.5 w-3.5 rounded-md bg-emerald-500" />Done ✓</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-3.5 w-3.5 rounded-md border-2 border-amber-300 bg-amber-100" />Still to do</span>
        </div>

        {/* Question card */}
        <section className="card animate-pop p-4 sm:p-6" key={q.number}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-xl font-black text-indigo-700 sm:text-2xl"><span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-400 to-indigo-500 text-lg text-white shadow">{q.number}</span>Question {q.number}</h2>
            <span className="rounded-full bg-yellow-200 px-3 py-1 text-xs font-black text-yellow-900">⭐ 5 marks</span>
          </div>
          <p className="mt-3 rounded-2xl bg-sky-50 px-4 py-3 text-base font-bold leading-relaxed text-slate-800 sm:text-lg">{q.title}</p>
          {q.intro && (
            <div className="mt-3 whitespace-pre-line rounded-2xl border-[3px] border-dashed border-fuchsia-200 bg-fuchsia-50/60 p-4 text-base font-semibold leading-relaxed text-slate-800 sm:text-lg">
              {q.intro}
            </div>
          )}

          <div className="mt-4 space-y-3">
            {q.subs.map((sub) => (
              <SubQuestionInput key={sub.id} qNumber={q.number} sub={sub} value={answers[sub.id] ?? ""} onChange={(v) => onAnswer(sub.id, v)} />
            ))}
          </div>

          <p className={cn("mt-4 rounded-2xl px-4 py-2 text-sm font-extrabold", unansweredSubs ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800")}>
            {unansweredSubs ? `✏️ ${unansweredSubs} part${unansweredSubs === 1 ? "" : "s"} of this question still need${unansweredSubs === 1 ? "s" : ""} an answer.` : "🎉 Great! All parts of this question are answered."}
          </p>
        </section>

        {/* Navigation */}
        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => onNavigate(Math.max(0, current - 1))}
            disabled={current === 0}
            className="btn-pop min-h-14 rounded-2xl border-[3px] border-indigo-200 bg-white text-base font-black text-indigo-700 shadow disabled:opacity-40"
          >
            ← Previous
          </button>
          <button
            type="button"
            onClick={() => onNavigate(Math.min(QUESTIONS.length - 1, current + 1))}
            disabled={current === QUESTIONS.length - 1}
            className="btn-pop min-h-14 rounded-2xl bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-base font-black text-white shadow-lg shadow-indigo-200 disabled:opacity-40"
          >
            Next →
          </button>
        </div>

        <div className="card mt-6 p-4 text-center">
          <button
            type="button"
            onClick={onSubmit}
            disabled={!allDone}
            className="btn-pop min-h-16 w-full rounded-3xl bg-gradient-to-r from-emerald-400 to-green-500 text-xl font-black text-white shadow-xl shadow-emerald-200 transition disabled:cursor-not-allowed disabled:from-slate-300 disabled:to-slate-300 disabled:shadow-none"
          >
            Submit Exam
          </button>
          <p className="mt-2 text-sm font-bold text-slate-600">
            {allDone
              ? "🌟 Everything is answered. Press the button when you are ready!"
              : `Answer all parts of every question to enable submission (${QUESTIONS.length - answeredCount} question${QUESTIONS.length - answeredCount === 1 ? "" : "s"} remaining).`}
          </p>
        </div>
      </main>
    </div>
  );
}

export function SoundIcon({ muted }: { muted: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M11 5 6 9H2v6h4l5 4V5z" />
      {muted ? <path d="m23 9-6 6M17 9l6 6" /> : <path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a9 9 0 0 1 0 14" />}
    </svg>
  );
}
