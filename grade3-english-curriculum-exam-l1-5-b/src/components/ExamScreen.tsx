import React, { useState } from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Compass,
  LayoutGrid,
  Send,
  User,
  Volume2,
  VolumeX,
} from "lucide-react";
import { EXAM_TITLE } from "../data/lessons";
import { AnswerMap, ExamQuestion, QuestionAnswer } from "../types/exam";
import {
  areAllQuestionsComplete,
  countCompletedQuestions,
  isQuestionComplete,
} from "../utils/grading";
import { formatDurationHHMMSS } from "../utils/timer";
import { QuestionInput } from "./QuestionInput";
import { StimulusBlock } from "./StimulusBlock";

interface ExamScreenProps {
  studentName: string;
  questions: ExamQuestion[];
  currentIndex: number;
  answers: AnswerMap;
  elapsedSeconds: number;
  muted: boolean;
  onToggleMute: () => void;
  onSelectQuestion: (index: number) => void;
  onAnswerChange: (questionId: string, answer: QuestionAnswer) => void;
  onSubmitExam: () => void;
}

export const ExamScreen: React.FC<ExamScreenProps> = ({
  studentName,
  questions,
  currentIndex,
  answers,
  elapsedSeconds,
  muted,
  onToggleMute,
  onSelectQuestion,
  onAnswerChange,
  onSubmitExam,
}) => {
  const [showMobileGrid, setShowMobileGrid] = useState(false);

  const totalQuestions = questions.length;
  const currentQuestion = questions[currentIndex];
  const completedCount = countCompletedQuestions(questions, answers);
  const remainingCount = totalQuestions - completedCount;
  const allComplete = areAllQuestionsComplete(questions, answers);
  const currentComplete = isQuestionComplete(
    currentQuestion,
    answers[currentQuestion.id]
  );
  const progressPercent = Math.round((completedCount / totalQuestions) * 100);

  const goToQuestion = (idx: number) => {
    const clamped = Math.min(Math.max(0, idx), totalQuestions - 1);
    onSelectQuestion(clamped);
    setShowMobileGrid(false);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const jumpToNextUnanswered = () => {
    for (let offset = 1; offset <= totalQuestions; offset++) {
      const idx = (currentIndex + offset) % totalQuestions;
      if (!isQuestionComplete(questions[idx], answers[questions[idx].id])) {
        goToQuestion(idx);
        return;
      }
    }
  };

  return (
    <div className="flex flex-col">
      {/* Sticky exam status bar */}
      <header className="sticky top-0 z-30 border-b-2 border-[#c2ebd0] bg-white/95 shadow-xs backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            {/* Title + student name */}
            <div className="flex items-center gap-2.5">
              <div className="hidden h-9 w-9 items-center justify-center rounded-xl bg-[#dcfce7] text-base font-extrabold text-[#15803d] sm:flex">
                G3
              </div>
              <div>
                <p className="text-sm font-extrabold leading-tight text-[#0f3d24] sm:text-base">
                  {EXAM_TITLE}
                </p>
                <p className="flex items-center gap-1 text-xs font-bold text-[#39634b]">
                  <User className="h-3.5 w-3.5 text-[#22c55e]" aria-hidden="true" />
                  <span className="max-w-[180px] truncate sm:max-w-[260px]">
                    {studentName}
                  </span>
                </p>
              </div>
            </div>

            {/* Stopwatch + Mute + Submit */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
              <div
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#b9e8c9] bg-[#eefbf2] px-3 py-1.5 text-sm font-extrabold text-[#0f3d24]"
                aria-label="Elapsed exam time"
              >
                <Clock className="h-4 w-4 text-[#16a34a]" aria-hidden="true" />
                <span className="text-xs font-bold text-[#39634b] hidden md:inline">
                  Time:
                </span>
                <span className="font-mono tracking-wider" data-testid="exam-timer">
                  {formatDurationHHMMSS(elapsedSeconds)}
                </span>
              </div>

              <button
                type="button"
                onClick={onToggleMute}
                aria-pressed={muted}
                aria-label={muted ? "Unmute sound effects" : "Mute sound effects"}
                className="inline-flex items-center gap-1 rounded-xl border border-[#c6ebd3] bg-white px-2.5 py-1.5 text-xs font-bold text-[#166534] transition-colors hover:border-[#6fd492] hover:bg-[#f0fcf4]"
              >
                {muted ? (
                  <VolumeX className="h-4 w-4 text-[#4b755d]" aria-hidden="true" />
                ) : (
                  <Volume2 className="h-4 w-4 text-[#22c55e]" aria-hidden="true" />
                )}
                <span className="hidden sm:inline">{muted ? "Muted" : "Sound"}</span>
              </button>

              <button
                type="button"
                disabled={!allComplete}
                onClick={onSubmitExam}
                data-testid="submit-exam-btn"
                className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-extrabold transition-all ${
                  allComplete
                    ? "bg-[#22c55e] text-white shadow-md shadow-[#22c55e]/30 hover:bg-[#16a34a] active:scale-[0.99]"
                    : "cursor-not-allowed border border-[#d6eadc] bg-[#edf6f0] text-[#7ca18a]"
                }`}
              >
                <Send className="h-4 w-4" aria-hidden="true" />
                <span>Submit Exam</span>
              </button>
            </div>
          </div>

          {/* Completion indicator bar */}
          <div className="mt-2.5 flex items-center gap-3">
            <div
              className="h-2.5 flex-1 overflow-hidden rounded-full bg-[#e5f6eb]"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={totalQuestions}
              aria-valuenow={completedCount}
              aria-label="Exam completion progress"
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#22c55e] to-[#84cc16] transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <span
              className="shrink-0 text-xs font-extrabold text-[#166534]"
              data-testid="completion-indicator"
            >
              {completedCount} / {totalQuestions} Answered
            </span>
          </div>
        </div>
      </header>

      {/* Main layout: Question card + Question navigator */}
      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[1fr_290px]">
        {/* Active question column */}
        <div className="space-y-5">
          {/* Mobile question navigator toggle */}
          <div className="flex items-center justify-between gap-2 lg:hidden">
            <button
              type="button"
              onClick={() => setShowMobileGrid((prev) => !prev)}
              aria-expanded={showMobileGrid}
              className="inline-flex items-center gap-2 rounded-xl border border-[#bce8cc] bg-white px-3.5 py-2 text-xs font-extrabold text-[#15803d] shadow-xs"
            >
              <LayoutGrid className="h-4 w-4 text-[#22c55e]" aria-hidden="true" />
              <span>
                {showMobileGrid ? "Hide Question Map" : "All 50 Questions"}
              </span>
            </button>

            {remainingCount > 0 && (
              <button
                type="button"
                onClick={jumpToNextUnanswered}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#c8eeb5] bg-[#f6fee8] px-3 py-2 text-xs font-extrabold text-[#3f6212]"
              >
                <Compass className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Next Unanswered ({remainingCount} left)</span>
              </button>
            )}
          </div>

          {showMobileGrid && (
            <div className="rounded-2xl border-2 border-[#c2ebd0] bg-white p-4 shadow-sm lg:hidden">
              <p className="mb-3 text-xs font-extrabold uppercase tracking-wider text-[#15803d]">
                Jump to Any Question
              </p>
              <div className="grid grid-cols-10 gap-1.5">
                {questions.map((q, idx) => {
                  const done = isQuestionComplete(q, answers[q.id]);
                  const active = idx === currentIndex;
                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => goToQuestion(idx)}
                      aria-label={`Question ${idx + 1}${done ? ", answered" : ", unanswered"}`}
                      aria-current={active ? "step" : undefined}
                      className={`flex h-8 items-center justify-center rounded-lg text-xs font-extrabold transition-all ${
                        active
                          ? "bg-[#15803d] text-white ring-2 ring-[#84cc16]"
                          : done
                          ? "border border-[#86efac] bg-[#dcfce7] text-[#14532d]"
                          : "border border-[#d8f1e1] bg-[#f9fefb] text-[#39634b]"
                      }`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Question card */}
          <article className="exam-card-shadow rounded-3xl border-2 border-[#c2ebd0] bg-white p-5 sm:p-8">
            {/* Card header */}
            <div className="mb-5 flex flex-wrap items-center justify-between gap-2 border-b border-[#e3f7ea] pb-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[#22c55e] px-3.5 py-1 text-sm font-extrabold text-white">
                  Question {currentIndex + 1} of {totalQuestions}
                </span>
                <span className="rounded-full border border-[#c6ebd3] bg-[#f1fcf5] px-3 py-1 text-xs font-extrabold text-[#166534]">
                  {currentQuestion.formatLabel}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="rounded-full border border-[#c3ebb0] bg-[#f4fee5] px-3 py-1 text-xs font-extrabold text-[#365314]">
                  {currentQuestion.marks} Marks
                </span>
                {currentComplete && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#dcfce7] px-2.5 py-1 text-xs font-extrabold text-[#15803d]">
                    <Check className="h-3.5 w-3.5" aria-hidden="true" />
                    Answered
                  </span>
                )}
              </div>
            </div>

            {/* Question instruction */}
            <h2 className="mb-5 text-lg font-extrabold leading-snug text-[#0f3d24] sm:text-xl">
              {currentQuestion.instruction}
            </h2>

            {/* Verbatim reading / timetable / word bank / pictures */}
            {currentQuestion.stimuli && currentQuestion.stimuli.length > 0 && (
              <div className="mb-6">
                <StimulusBlock stimuli={currentQuestion.stimuli} />
              </div>
            )}

            {/* Answer input */}
            <QuestionInput
              question={currentQuestion}
              answer={answers[currentQuestion.id]}
              onChange={(next) => onAnswerChange(currentQuestion.id, next)}
            />
          </article>

          {/* Previous / Next / Submit navigation controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#c6ebd3] bg-white p-4 shadow-xs">
            <button
              type="button"
              disabled={currentIndex === 0}
              onClick={() => goToQuestion(currentIndex - 1)}
              className="inline-flex items-center gap-1.5 rounded-xl border-2 border-[#c6ebd3] bg-[#f6fef8] px-4 py-2.5 text-sm font-extrabold text-[#14532d] transition-colors hover:border-[#6fd492] hover:bg-[#e7faee] disabled:cursor-not-allowed disabled:opacity-40 sm:px-5 sm:text-base"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
              <span>Previous</span>
            </button>

            <span className="text-xs font-bold text-[#3f6a52] sm:text-sm">
              {allComplete
                ? "All 50 questions answered! Ready to submit."
                : `${remainingCount} ${
                    remainingCount === 1 ? "question" : "questions"
                  } remaining to unlock Submit Exam`}
            </span>

            {currentIndex < totalQuestions - 1 ? (
              <button
                type="button"
                onClick={() => goToQuestion(currentIndex + 1)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#22c55e] px-5 py-2.5 text-sm font-extrabold text-white shadow-xs transition-colors hover:bg-[#16a34a] sm:px-6 sm:text-base"
              >
                <span>Next</span>
                <ChevronRight className="h-5 w-5" aria-hidden="true" />
              </button>
            ) : (
              <button
                type="button"
                disabled={!allComplete}
                onClick={onSubmitExam}
                className={`inline-flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-extrabold transition-all sm:px-6 sm:text-base ${
                  allComplete
                    ? "bg-[#22c55e] text-white shadow-md shadow-[#22c55e]/30 hover:bg-[#16a34a]"
                    : "cursor-not-allowed border border-[#d6eadc] bg-[#edf6f0] text-[#7ca18a]"
                }`}
              >
                <Send className="h-4 w-4" aria-hidden="true" />
                <span>Submit Exam</span>
              </button>
            )}
          </div>
        </div>

        {/* Desktop Question Navigator sidebar */}
        <aside className="hidden lg:block">
          <div className="sticky top-28 space-y-4 rounded-3xl border-2 border-[#c2ebd0] bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-[#0f3d24]">
                Question Map
              </h3>
              <span className="rounded-full bg-[#eefbf2] px-2.5 py-0.5 text-xs font-extrabold text-[#15803d]">
                {completedCount}/50
              </span>
            </div>

            <div className="grid grid-cols-5 gap-2">
              {questions.map((q, idx) => {
                const done = isQuestionComplete(q, answers[q.id]);
                const active = idx === currentIndex;
                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => goToQuestion(idx)}
                    aria-label={`Question ${idx + 1}${done ? ", answered" : ", unanswered"}`}
                    aria-current={active ? "step" : undefined}
                    className={`flex h-9 items-center justify-center rounded-xl text-xs font-extrabold transition-all ${
                      active
                        ? "bg-[#15803d] text-white ring-2 ring-[#84cc16]"
                        : done
                        ? "border border-[#86efac] bg-[#dcfce7] text-[#14532d] hover:bg-[#bbf7d0]"
                        : "border border-[#d8f1e1] bg-[#f9fefb] text-[#39634b] hover:border-[#86efac] hover:bg-[#f0fcf4]"
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-3 border-t border-[#e5f6eb] pt-3 text-xs font-bold text-[#39634b]">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-3 w-3 rounded bg-[#15803d]" /> Current
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-3 w-3 rounded border border-[#86efac] bg-[#dcfce7]" />{" "}
                Answered
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-3 w-3 rounded border border-[#d8f1e1] bg-[#f9fefb]" />{" "}
                Open
              </span>
            </div>

            {remainingCount > 0 ? (
              <button
                type="button"
                onClick={jumpToNextUnanswered}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-[#c3ebb0] bg-[#f6fee8] px-3 py-2.5 text-xs font-extrabold text-[#365314] transition-colors hover:bg-[#ecfccb]"
              >
                <Compass className="h-4 w-4 text-[#65a30d]" aria-hidden="true" />
                <span>Go to Next Unanswered ({remainingCount})</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onSubmitExam}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#22c55e] px-4 py-3 text-sm font-extrabold text-white shadow-md shadow-[#22c55e]/25 transition-colors hover:bg-[#16a34a]"
              >
                <Send className="h-4 w-4" aria-hidden="true" />
                <span>Submit Exam Now</span>
              </button>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};
