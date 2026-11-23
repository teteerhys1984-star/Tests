import { useEffect, useMemo, useState } from 'react';
import {
  ChevronLeft, ChevronRight, Clock3, Check, GraduationCap, Send, Volume2, VolumeX, Info, X,
} from 'lucide-react';
import { QUESTIONS } from '../data/exam';
import { allQuestionsComplete, completedQuestionCount, formatHMS, isQuestionComplete } from '../lib/grading';
import type { AnswerMap, AnswerValue } from '../types';
import QuestionCard from './QuestionCard';

interface ExamScreenProps {
  name: string;
  startedAt: number;
  answers: AnswerMap;
  onAnswer: (partId: string, value: AnswerValue) => void;
  onSubmit: () => void;
  muted: boolean;
  onToggleMute: () => void;
  /** true when a saved attempt was restored from localStorage */
  resumed: boolean;
}

export default function ExamScreen({ name, startedAt, answers, onAnswer, onSubmit, muted, onToggleMute, resumed }: ExamScreenProps) {
  const [index, setIndex] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [showResumed, setShowResumed] = useState(resumed);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(id);
  }, []);

  const elapsedSeconds = Math.max(0, (now - startedAt) / 1000);
  const answeredCount = completedQuestionCount(answers);
  const allDone = allQuestionsComplete(answers);
  const progress = (answeredCount / QUESTIONS.length) * 100;
  const question = QUESTIONS[index];
  const firstName = name.trim().split(/\s+/)[0] || name;

  const go = (delta: number) => {
    setIndex((i) => Math.min(QUESTIONS.length - 1, Math.max(0, i + delta)));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const jump = (i: number) => {
    setIndex(i);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const completion = useMemo(() => QUESTIONS.map((q) => isQuestionComplete(q, answers)), [answers]);

  return (
    <div className="min-h-screen bg-cream">
      {/* ============ sticky control bar ============ */}
      <header className="sticky top-0 z-40 border-b border-black/30 bg-pine-950/95 text-cream backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-2 gap-y-1.5 px-3 py-2 sm:flex-nowrap sm:gap-x-3 sm:px-5">
          <div className="order-1 flex min-w-0 items-center gap-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gold-400 text-pine-950 shadow" aria-hidden="true">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate font-display text-[13px] font-bold leading-tight sm:text-base">English Exam — Grade 4</p>
              <p className="text-[8px] font-extrabold uppercase tracking-[0.2em] text-gold-200">Unit 1 · Lessons 1–6</p>
            </div>
          </div>

          <div className="order-2 ml-auto flex items-center gap-1.5 sm:gap-2">
            <div
              className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 py-1.5 pl-2 pr-2.5 sm:py-2 sm:pl-2.5 sm:pr-3"
              title="Time elapsed — the stopwatch counts up"
              aria-label={`Time elapsed: ${formatHMS(elapsedSeconds)}`}
            >
              <Clock3 className="h-4 w-4 shrink-0 text-gold-400" aria-hidden="true" />
              <span className="tnum text-sm font-extrabold tracking-wide text-cream sm:text-base">{formatHMS(elapsedSeconds)}</span>
            </div>

            <button
              type="button"
              onClick={onToggleMute}
              aria-pressed={muted}
              aria-label={muted ? 'Unmute sounds' : 'Mute sounds'}
              title={muted ? 'Unmute sounds' : 'Mute sounds'}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/10 text-cream transition-colors hover:bg-white/20"
            >
              {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>

            <button
              type="button"
              onClick={onSubmit}
              disabled={!allDone}
              aria-disabled={!allDone}
              title={allDone ? 'Submit your exam now' : `Answer all 12 questions to submit (${answeredCount}/12 done)`}
              className="btn btn-primary h-9 gap-1 px-2.5 text-[11px] sm:h-10 sm:px-5 sm:text-sm"
            >
              <Send className="h-4 w-4" aria-hidden="true" />
              Submit Exam
            </button>
          </div>
        </div>
        {/* progress bar */}
        <div className="h-1.5 w-full bg-black/40" role="progressbar" aria-valuemin={0} aria-valuemax={12} aria-valuenow={answeredCount} aria-label="Questions answered">
          <div className="h-full bg-gradient-to-r from-gold-400 via-gold-500 to-coral-500 transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-3 pb-16 pt-3 sm:px-5 sm:pt-4">
        {/* resumed notice */}
        {showResumed && (
          <div role="status" className="mb-3 flex items-start gap-2 rounded-2xl border-2 border-gold-200 bg-gold-100 px-3 py-2 text-xs font-bold text-ink sm:text-sm">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-gold-600" aria-hidden="true" />
            <span className="flex-1">Your saved attempt was restored — your answers were kept and the stopwatch never stopped.</span>
            <button type="button" onClick={() => setShowResumed(false)} aria-label="Dismiss" className="rounded-full p-1 hover:bg-gold-200">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* welcome line + counter */}
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2 px-1">
          <p className="text-sm font-extrabold text-pine-900 sm:text-base">
            Good luck, <span className="text-coral-600">{firstName}</span>! You can do this.
          </p>
          <p className="rounded-full border border-pine-100 bg-paper px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-pine-800 sm:text-xs">
            {answeredCount} / 12 answered
          </p>
        </div>

        {/* ============ question navigator ============ */}
        <nav aria-label="Jump to question" className="nice-scroll -mx-3 mb-3 overflow-x-auto px-3 pb-1 sm:-mx-5 sm:px-5">
          <ol className="flex w-max gap-1.5 sm:gap-2">
            {QUESTIONS.map((q, i) => {
              const done = completion[i];
              const current = i === index;
              return (
                <li key={q.id}>
                  <button
                    type="button"
                    onClick={() => jump(i)}
                    aria-current={current ? 'step' : undefined}
                    aria-label={`Question ${q.id}${done ? ', answered' : ', not answered yet'}`}
                    className={`flex h-11 w-11 flex-col items-center justify-center rounded-xl border-2 font-display text-base font-bold transition-all sm:h-12 sm:w-12 ${
                      current
                        ? 'border-pine-900 bg-pine-900 text-gold-400 shadow-md'
                        : done
                          ? 'border-leaf-600 bg-leaf-600 text-white hover:brightness-110'
                          : 'border-pine-200 bg-paper text-pine-800 hover:border-pine-500'
                    }`}
                  >
                    {done && !current ? <Check className="h-5 w-5" strokeWidth={3.2} aria-hidden="true" /> : q.id}
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>

        {/* ============ active question ============ */}
        <div key={question.id} className="animate-pop-in">
          <QuestionCard question={question} answers={answers} onAnswer={onAnswer} />
        </div>

        {/* ============ previous / next ============ */}
        <div className="mt-4 flex items-center justify-between gap-2">
          <button type="button" onClick={() => go(-1)} disabled={index === 0} className="btn btn-ghost h-12 px-4 text-sm sm:px-6 sm:text-base disabled:cursor-not-allowed disabled:opacity-40">
            <ChevronLeft className="h-5 w-5" aria-hidden="true" /> Previous
          </button>
          {index < QUESTIONS.length - 1 ? (
            <button type="button" onClick={() => go(1)} className="btn btn-pine h-12 px-5 text-sm sm:px-8 sm:text-base">
              Next <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </button>
          ) : (
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-ink-soft sm:text-xs">Last question</span>
          )}
        </div>

        {/* ============ submit panel ============ */}
        <section
          aria-label="Submit your exam"
          className={`mt-5 overflow-hidden rounded-3xl border-2 p-5 text-center transition-colors sm:p-6 ${
            allDone ? 'border-gold-400 bg-gradient-to-br from-gold-100 via-paper to-gold-100' : 'border-pine-100 bg-paper'
          }`}
        >
          <p className="font-display text-xl font-bold text-pine-900 sm:text-2xl">Ready to hand in?</p>
          <p className="mx-auto mt-1 max-w-md text-xs font-semibold text-ink-soft sm:text-sm">
            {allDone
              ? 'Everything is answered. Press Submit Exam to finish — your results will appear immediately.'
              : `Answer all 12 questions to unlock Submit Exam. You have completed ${answeredCount} of 12.`}
          </p>
          <button
            type="button"
            onClick={onSubmit}
            disabled={!allDone}
            className="btn btn-primary mx-auto mt-4 h-14 w-full max-w-xs gap-2 text-lg sm:h-16 sm:text-xl"
          >
            <Send className="h-6 w-6" aria-hidden="true" />
            Submit Exam
          </button>
          <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.18em] text-ink-soft/80 sm:text-[11px]">
            Submission is immediate — answers cannot be changed afterwards
          </p>
        </section>
      </main>
    </div>
  );
}
