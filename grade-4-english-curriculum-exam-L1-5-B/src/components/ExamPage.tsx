import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  Compass,
  LayoutGrid,
  List,
  Send,
  User,
} from 'lucide-react';
import { EXAM_TITLE } from '../data/passages';
import { EXAM_QUESTIONS } from '../data/questions';
import { StudentAnswerMap } from '../types/exam';
import { getCompletionSummary, isQuestionAnswered } from '../utils/scoring';
import { formatStopwatch } from '../utils/storage';
import { ContactFooter } from './ContactFooter';
import { QuestionCard } from './QuestionCard';
import { SoundToggle } from './SoundToggle';

interface ExamPageProps {
  studentName: string;
  currentQuestionIndex: number;
  answers: StudentAnswerMap;
  elapsedMs: number;
  muted: boolean;
  onToggleMute: () => void;
  onSelectQuestion: (index: number) => void;
  onChangeAnswer: (subPartKey: string, value: string | number[]) => void;
  onSubmitExam: () => void;
}

const SECTION_BANDS = [
  { label: 'Q 1–10', start: 0, end: 10, color: 'bg-cyan-500', soft: 'bg-cyan-50 border-cyan-200 text-cyan-900' },
  { label: 'Q 11–20', start: 10, end: 20, color: 'bg-rose-500', soft: 'bg-rose-50 border-rose-200 text-rose-900' },
  { label: 'Q 21–30', start: 20, end: 30, color: 'bg-amber-500', soft: 'bg-amber-50 border-amber-200 text-amber-900' },
  { label: 'Q 31–40', start: 30, end: 40, color: 'bg-emerald-500', soft: 'bg-emerald-50 border-emerald-200 text-emerald-900' },
  { label: 'Q 41–50', start: 40, end: 50, color: 'bg-violet-500', soft: 'bg-violet-50 border-violet-200 text-violet-900' },
];

export const ExamPage: React.FC<ExamPageProps> = ({
  studentName,
  currentQuestionIndex,
  answers,
  elapsedMs,
  muted,
  onToggleMute,
  onSelectQuestion,
  onChangeAnswer,
  onSubmitExam,
}) => {
  const [viewMode, setViewMode] = useState<'single' | 'all'>('single');
  const [mapOpen, setMapOpen] = useState(false);

  const completion = useMemo(() => getCompletionSummary(answers, EXAM_QUESTIONS), [answers]);
  const progressPercent = Math.round(
    (completion.answeredSubParts / completion.totalSubParts) * 100
  );
  const remainingQuestions = completion.totalQuestions - completion.answeredQuestions;
  const activeQuestion = EXAM_QUESTIONS[currentQuestionIndex] ?? EXAM_QUESTIONS[0];

  const handleGoToQuestion = (idx: number) => {
    const clamped = Math.max(0, Math.min(EXAM_QUESTIONS.length - 1, idx));
    onSelectQuestion(clamped);
    setMapOpen(false);
    if (viewMode === 'all') {
      const el = document.getElementById(`exam-q-${clamped + 1}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleJumpNextUnanswered = () => {
    if (completion.unansweredIndices.length === 0) return;
    const afterCurrent = completion.unansweredIndices.find((i) => i > currentQuestionIndex);
    const target = afterCurrent !== undefined ? afterCurrent : completion.unansweredIndices[0];
    handleGoToQuestion(target);
  };

  return (
    <div className="flex min-h-screen flex-col">
      {/* Sticky Top Header */}
      <header className="sticky top-0 z-30 border-b-2 border-sky-100 bg-white/95 shadow-xs backdrop-blur-md">
        <div className="mx-auto max-w-5xl px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            {/* Title + Student Name */}
            <div className="min-w-0">
              <p className="truncate font-display text-sm sm:text-base font-bold text-slate-900">
                {EXAM_TITLE}
              </p>
              <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs font-bold text-slate-600">
                <span className="inline-flex items-center gap-1 text-cyan-800">
                  <User className="h-3.5 w-3.5 text-cyan-600" />
                  {studentName}
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-emerald-700">Auto-saved</span>
              </div>
            </div>

            {/* Stopwatch + Mute + Map toggle */}
            <div className="flex flex-wrap items-center gap-2">
              <div
                aria-label="Elapsed exam time"
                className="inline-flex items-center gap-1.5 rounded-full border-2 border-sky-200 bg-sky-50 px-3.5 py-1.5 text-sm font-extrabold tabular-nums text-sky-900"
              >
                <Clock className="h-4 w-4 text-sky-600" />
                <span className="text-xs font-bold text-sky-700 hidden sm:inline">Time:</span>
                <span>{formatStopwatch(elapsedMs)}</span>
              </div>

              <SoundToggle muted={muted} onToggle={onToggleMute} />

              <button
                type="button"
                onClick={() => setViewMode((m) => (m === 'single' ? 'all' : 'single'))}
                className="inline-flex items-center gap-1.5 rounded-full border-2 border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-extrabold text-violet-800 transition hover:bg-violet-100 cursor-pointer focus:outline-none focus:ring-2 focus:ring-violet-400"
              >
                {viewMode === 'single' ? (
                  <>
                    <List className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">All 50 View</span>
                  </>
                ) : (
                  <>
                    <Compass className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">One by One</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setMapOpen((prev) => !prev)}
                aria-expanded={mapOpen}
                className="inline-flex items-center gap-1.5 rounded-full border-2 border-cyan-300 bg-cyan-50 px-3.5 py-1.5 text-xs font-extrabold text-cyan-900 transition hover:bg-cyan-100 cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-400"
              >
                <LayoutGrid className="h-3.5 w-3.5 text-cyan-700" />
                <span>
                  {completion.answeredQuestions}/{completion.totalQuestions}
                </span>
              </button>
            </div>
          </div>

          {/* Completion Progress Bar */}
          <div className="mt-2.5 flex items-center gap-3">
            <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-sky-500 to-emerald-500 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="shrink-0 text-xs font-extrabold text-slate-700 tabular-nums">
              {completion.answeredQuestions} of {completion.totalQuestions} completed
            </span>
          </div>

          {/* Collapsible 50-Question Navigator Panel */}
          {mapOpen && (
            <div className="mt-3 rounded-2xl border-2 border-sky-200 bg-white p-4 shadow-lg">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <p className="font-display text-sm font-bold text-slate-900">
                  Question Navigator (1–50)
                </p>
                <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-slate-600">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded bg-emerald-500" />
                    Answered ({completion.answeredQuestions})
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded border-2 border-slate-300 bg-white" />
                    Unanswered ({remainingQuestions})
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded bg-sky-500 ring-2 ring-amber-300" />
                    Current
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-10 gap-1.5 sm:gap-2">
                {EXAM_QUESTIONS.map((q, idx) => {
                  const done = isQuestionAnswered(q, answers);
                  const isCurrent = idx === currentQuestionIndex && viewMode === 'single';
                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => handleGoToQuestion(idx)}
                      aria-label={`Question ${idx + 1} (${done ? 'answered' : 'not answered yet'})`}
                      className={`h-9 rounded-xl text-xs font-extrabold transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-sky-400 ${
                        isCurrent
                          ? 'bg-sky-600 text-white ring-2 ring-amber-400 shadow-sm'
                          : done
                          ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                          : 'border-2 border-slate-200 bg-slate-50 text-slate-700 hover:border-sky-300 hover:bg-sky-50'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Active Exam Area */}
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6 sm:py-8">
        {/* Colourful 5-band progress pills */}
        <div className="mb-5 grid grid-cols-5 gap-1.5 sm:gap-2.5">
          {SECTION_BANDS.map((band) => {
            const bandQuestions = EXAM_QUESTIONS.slice(band.start, band.end);
            const bandAnswered = bandQuestions.filter((q) =>
              isQuestionAnswered(q, answers)
            ).length;
            const isActiveBand =
              viewMode === 'single' &&
              currentQuestionIndex >= band.start &&
              currentQuestionIndex < band.end;
            return (
              <button
                key={band.label}
                type="button"
                onClick={() => handleGoToQuestion(band.start)}
                className={`rounded-2xl border-2 px-2 py-2 text-center transition cursor-pointer ${
                  band.soft
                } ${isActiveBand ? 'ring-2 ring-sky-400 shadow-sm' : 'opacity-85 hover:opacity-100'}`}
              >
                <p className="text-[11px] sm:text-xs font-extrabold">{band.label}</p>
                <p className="text-[10px] sm:text-xs font-bold opacity-80">
                  {bandAnswered}/10 done
                </p>
              </button>
            );
          })}
        </div>

        {viewMode === 'single' ? (
          <>
            <QuestionCard
              question={activeQuestion}
              examNumber={currentQuestionIndex + 1}
              answers={answers}
              onChangeAnswer={onChangeAnswer}
            />

            {/* Single-question navigation controls */}
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                disabled={currentQuestionIndex === 0}
                onClick={() => handleGoToQuestion(currentQuestionIndex - 1)}
                className={`inline-flex items-center gap-2 rounded-2xl border-2 px-5 py-3 text-sm font-extrabold transition focus:outline-none focus:ring-2 focus:ring-sky-400 ${
                  currentQuestionIndex === 0
                    ? 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
                    : 'border-sky-200 bg-white text-sky-900 shadow-xs hover:border-sky-400 hover:bg-sky-50 cursor-pointer'
                }`}
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Previous</span>
              </button>

              {remainingQuestions > 0 && (
                <button
                  type="button"
                  onClick={handleJumpNextUnanswered}
                  className="inline-flex items-center gap-1.5 rounded-2xl border-2 border-amber-300 bg-amber-50 px-4 py-2.5 text-xs sm:text-sm font-extrabold text-amber-900 transition hover:bg-amber-100 cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                  <span>Next Unanswered ({remainingQuestions} left)</span>
                </button>
              )}

              <button
                type="button"
                disabled={currentQuestionIndex === EXAM_QUESTIONS.length - 1}
                onClick={() => handleGoToQuestion(currentQuestionIndex + 1)}
                className={`inline-flex items-center gap-2 rounded-2xl border-2 px-5 py-3 text-sm font-extrabold transition focus:outline-none focus:ring-2 focus:ring-sky-400 ${
                  currentQuestionIndex === EXAM_QUESTIONS.length - 1
                    ? 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
                    : 'border-sky-500 bg-sky-500 text-white shadow-sm hover:bg-sky-600 cursor-pointer'
                }`}
              >
                <span>Next</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </>
        ) : (
          <div className="space-y-6">
            {EXAM_QUESTIONS.map((q, idx) => (
              <div key={q.id} id={`exam-q-${idx + 1}`} className="scroll-mt-32">
                <QuestionCard
                  question={q}
                  examNumber={idx + 1}
                  answers={answers}
                  onChangeAnswer={onChangeAnswer}
                />
              </div>
            ))}
          </div>
        )}

        {/* Submit Exam Panel — Immediate Submission with NO Confirmation Dialog */}
        <section className="mt-8 rounded-3xl border-2 border-emerald-200 bg-white p-5 sm:p-6 shadow-sm">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-start gap-3">
              <span
                className={`mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
                  completion.allComplete
                    ? 'bg-emerald-500 text-white'
                    : 'bg-amber-100 text-amber-700'
                }`}
              >
                <CheckCircle2 className="h-5 w-5" />
              </span>
              <div>
                <h3 className="font-display text-base sm:text-lg font-bold text-slate-900">
                  {completion.allComplete
                    ? 'All 50 questions answered — ready to submit!'
                    : `Complete all 50 questions to submit (${remainingQuestions} remaining)`}
                </h3>
                <p className="text-xs sm:text-sm font-semibold text-slate-600">
                  {completion.allComplete
                    ? 'Press Submit Exam to finish right away and view your full score report.'
                    : `Answered parts: ${completion.answeredSubParts} of ${completion.totalSubParts}. Every question and sub-part is required.`}
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled={!completion.allComplete}
              onClick={onSubmitExam}
              className={`inline-flex w-full sm:w-auto shrink-0 items-center justify-center gap-2 rounded-2xl px-7 py-3.5 font-display text-base sm:text-lg font-bold transition focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                completion.allComplete
                  ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white shadow-lg shadow-emerald-500/25 hover:-translate-y-0.5 hover:shadow-xl cursor-pointer focus:ring-emerald-400'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Send className="h-5 w-5" />
              <span>Submit Exam</span>
            </button>
          </div>
        </section>
      </main>

      <ContactFooter />
    </div>
  );
};
