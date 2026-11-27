import { useEffect, useState } from "react";
import {
  Brand,
  Icon,
  MiniSparkle,
  SectionEyebrow,
  SoundButton,
} from "../components/ui";
import {
  EXAM_QUESTIONS,
  TOTAL_BRANCHES,
  type AnswerValue,
  type Branch,
  type ExamQuestion,
} from "../exam/examData";
import {
  answeredBranchCount,
  completedBranchCount,
  formatSeconds,
  getElapsedSeconds,
  isBranchAnswered,
  isExamComplete,
  isQuestionComplete,
} from "../exam/grading";
import type { StoredAttempt } from "../exam/storage";
import { sanitizeEnglishAnswer } from "../exam/text";

const QUESTION_STYLES: Record<
  number,
  { emoji: string; bubble: string; accent: string }
> = {
  1: { emoji: "🧱", bubble: "bg-sky-100 border-sky-200", accent: "text-sky-700" },
  2: { emoji: "🧩", bubble: "bg-teal-100 border-teal-200", accent: "text-teal-700" },
  3: { emoji: "👋", bubble: "bg-violet-100 border-violet-200", accent: "text-violet-700" },
  4: { emoji: "⚖️", bubble: "bg-amber-100 border-amber-200", accent: "text-amber-700" },
  5: { emoji: "💬", bubble: "bg-orange-100 border-orange-200", accent: "text-orange-700" },
  6: { emoji: "🏷️", bubble: "bg-emerald-100 border-emerald-200", accent: "text-emerald-700" },
  7: { emoji: "🔤", bubble: "bg-cyan-100 border-cyan-200", accent: "text-cyan-700" },
  8: { emoji: "🎨", bubble: "bg-pink-100 border-pink-200", accent: "text-pink-700" },
  9: { emoji: "✨", bubble: "bg-yellow-100 border-yellow-200", accent: "text-yellow-700" },
  10: { emoji: "🔢", bubble: "bg-indigo-100 border-indigo-200", accent: "text-indigo-700" },
  11: { emoji: "🌟", bubble: "bg-lime-100 border-lime-200", accent: "text-lime-700" },
  12: { emoji: "🏆", bubble: "bg-teal-100 border-teal-200", accent: "text-teal-700" },
};

const LETTERS = "ABCDEFGH";

function optionLabelClass(selected: boolean): string {
  return `pressable flex min-h-[50px] w-full items-start gap-3 rounded-xl border-2 px-3 py-2.5 text-left text-sm font-bold leading-5 transition sm:items-center ${
    selected
      ? "choice-selected text-teal-950"
      : "border-slate-200 bg-white text-slate-700 hover:border-teal-300 hover:bg-teal-50/40"
  }`;
}

function BranchCard({
  question,
  branch,
  index,
  value,
  onChange,
}: {
  question: ExamQuestion;
  branch: Branch;
  index: number;
  value: AnswerValue | undefined;
  onChange: (value: AnswerValue) => void;
}) {
  const labelId = `label-${branch.id}`;
  const answered = isBranchAnswered(branch, value);
  const stringValue = typeof value === "string" ? value : "";
  const orderValue = Array.isArray(value) ? value : [];
  const tokens = branch.orderTokens ?? [];

  const addToken = (token: string) => {
    if (orderValue.length >= tokens.length) return;
    onChange([...orderValue, token]);
  };

  const removePosition = (position: number) => {
    onChange(orderValue.filter((_, itemIndex) => itemIndex !== position));
  };

  return (
    <article
      id={branch.id}
      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_2px_0_rgba(15,76,92,.03)] sm:p-5"
    >
      <div className="flex items-start gap-3">
        <span
          className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[11px] font-black ${
            answered ? "bg-teal-700 text-white" : "bg-slate-100 text-slate-600"
          }`}
          aria-hidden="true"
        >
          {index + 1}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
            <p id={labelId} className="text-sm font-extrabold leading-5 text-slate-800 sm:text-[15px]">
              {branch.prompt}
            </p>
            <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black text-slate-500">
              {branch.marks} {branch.marks === 1 ? "mark" : "marks"}
            </span>
          </div>

          {branch.display && (
            <div
              className="mt-2.5 w-full rounded-xl border border-sky-100 bg-sky-50/70 px-3 py-2.5 text-left text-base font-extrabold leading-6 text-slate-900 sm:text-lg"
              dir="ltr"
              lang="en"
            >
              {branch.display}
            </div>
          )}

          {branch.variant === "be" && (
            <div className="mt-3 rounded-xl border border-amber-100 bg-amber-50/60 p-3">
              <p
                className="flex flex-wrap items-center gap-x-2 gap-y-1 text-base font-extrabold text-slate-900 sm:text-lg"
                dir="ltr"
              >
                <span>{branch.prefix}</span>
                <span className="inline-flex min-w-[54px] items-center justify-center rounded-lg border-2 border-dashed border-amber-400 bg-white px-2 py-1 text-sm font-black text-amber-600">
                  {stringValue || "___"}
                </span>
                <span>{branch.suffix}</span>
              </p>
            </div>
          )}

          {branch.variant === "choice" && (
            <div
              className="mt-3 grid gap-2 sm:grid-cols-2"
              role="radiogroup"
              aria-labelledby={labelId}
            >
              {(branch.options ?? []).map((option, optionIndex) => {
                const selected = stringValue === option;
                return (
                  <button
                    key={option}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => onChange(option)}
                    className={optionLabelClass(selected)}
                  >
                    <span
                      className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 text-[10px] font-black ${
                        selected
                          ? "border-teal-700 bg-teal-700 text-white"
                          : "border-slate-300 bg-slate-50 text-slate-400"
                      }`}
                      aria-hidden="true"
                    >
                      {selected ? <Icon name="check" className="h-3.5 w-3.5" /> : LETTERS[optionIndex]}
                    </span>
                    <span className="min-w-0 break-words">{option}</span>
                  </button>
                );
              })}
            </div>
          )}

          {branch.variant === "be" && (
            <div
              className="mt-2 grid grid-cols-3 gap-2"
              role="radiogroup"
              aria-labelledby={labelId}
            >
              {(branch.options ?? ["am", "is", "are"]).map((option) => {
                const selected = stringValue === option;
                return (
                  <button
                    key={option}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => onChange(option)}
                    className={`pressable min-h-12 rounded-xl border-2 px-3 py-2 text-base font-black transition ${
                      selected
                        ? "choice-selected text-teal-950"
                        : "border-slate-200 bg-white text-slate-700 hover:border-teal-300 hover:bg-teal-50/40"
                    }`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          )}

          {branch.variant === "text" && (
            <div className="mt-3">
              <label htmlFor={`input-${branch.id}`} className="visually-hidden">
                {branch.prompt}
              </label>
              <input
                id={`input-${branch.id}`}
                type="text"
                dir="ltr"
                value={stringValue}
                onChange={(event) => onChange(sanitizeEnglishAnswer(event.target.value))}
                maxLength={100}
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                autoCapitalize={question.number === 10 || question.number === 11 ? "none" : "sentences"}
                placeholder={question.number === 10 || question.number === 11 ? "Write the plural form" : "Write your sentence"}
                className="min-h-[52px] w-full min-w-0 rounded-xl border-2 border-slate-200 bg-slate-50/60 px-3.5 py-3 text-base font-bold text-slate-900 placeholder:font-semibold placeholder:text-slate-400 transition focus:border-teal-500 focus:bg-white focus:outline-none"
              />
              <p className="mt-1.5 text-[11px] font-semibold text-slate-400">
                Write in English. Capital letters and the final punctuation mark
                do not affect your mark.
              </p>
            </div>
          )}

          {branch.variant === "order" && (
            <div className="mt-3">
              <div
                className={`min-h-[62px] rounded-xl border-2 border-dashed p-2.5 ${
                  orderValue.length === tokens.length
                    ? "border-teal-300 bg-teal-50/50"
                    : "border-slate-300 bg-slate-50"
                }`}
                aria-live="polite"
              >
                {orderValue.length === 0 ? (
                  <p className="grid min-h-[38px] place-items-center text-center text-xs font-bold text-slate-400">
                    Tap the words below to build your sentence.
                  </p>
                ) : (
                  <div className="flex flex-wrap items-center gap-1.5">
                    {orderValue.map((token, tokenIndex) => (
                      <button
                        key={`${token}-${tokenIndex}`}
                        type="button"
                        onClick={() => removePosition(tokenIndex)}
                        aria-label={`Remove word ${token}`}
                        className="word-token pressable inline-flex items-center gap-1 rounded-lg border border-teal-300 bg-white px-2.5 py-1.5 text-sm font-extrabold text-slate-800 shadow-sm hover:bg-rose-50"
                      >
                        <span className="grid h-4 w-4 place-items-center rounded-full bg-teal-700 text-[9px] text-white">
                          {tokenIndex + 1}
                        </span>
                        {token}
                        <Icon name="x" className="h-3 w-3 text-slate-400" />
                      </button>
                    ))}
                    <span className="ml-0.5 text-lg font-black text-teal-800">.</span>
                  </div>
                )}
              </div>
              <div className="mt-2 flex flex-wrap gap-2" aria-label="Word bank">
                {tokens.map((token, tokenIndex) => {
                  const usedCount = orderValue.filter((valueToken) => valueToken === token).length;
                  const totalCount = tokens.filter((valueToken) => valueToken === token).length;
                  const isUsed = usedCount >= totalCount;
                  return (
                    <button
                      key={`${token}-${tokenIndex}`}
                      type="button"
                      onClick={() => addToken(token)}
                      disabled={isUsed}
                      className={`word-token pressable rounded-xl border-2 px-3 py-2 text-sm font-extrabold ${
                        isUsed
                          ? "cursor-not-allowed border-slate-100 bg-slate-100 text-slate-300"
                          : "border-sky-200 bg-white text-slate-800 shadow-sm hover:border-teal-400 hover:bg-teal-50"
                      }`}
                    >
                      {token}
                    </button>
                  );
                })}
              </div>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                <p className="text-[11px] font-semibold text-slate-400">
                  Tap a word in your sentence to remove it.
                </p>
                {orderValue.length > 0 && (
                  <button
                    type="button"
                    onClick={() => onChange([])}
                    className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-extrabold text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                  >
                    <Icon name="refresh" className="h-3.5 w-3.5" />
                    Clear
                  </button>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </article>
  );
}

export default function ExamScreen({
  attempt,
  muted,
  onToggleMute,
  onAnswer,
  onNavigate,
  onSubmit,
}: {
  attempt: StoredAttempt;
  muted: boolean;
  onToggleMute: () => void;
  onAnswer: (branchId: string, value: AnswerValue) => void;
  onNavigate: (questionNumber: number) => void;
  onSubmit: () => void;
}) {
  const [now, setNow] = useState(() => Date.now());
  const [showRestored, setShowRestored] = useState(attempt.resumed);
  const currentQuestionNumber =
    attempt.currentQuestion >= 1 && attempt.currentQuestion <= EXAM_QUESTIONS.length
      ? attempt.currentQuestion
      : 1;
  const question =
    EXAM_QUESTIONS.find((item) => item.number === currentQuestionNumber) ?? EXAM_QUESTIONS[0];
  const style = QUESTION_STYLES[question.number] ?? QUESTION_STYLES[1];
  const answeredBranches = completedBranchCount(attempt.answers);
  const allComplete = isExamComplete(attempt.answers);
  const progress = Math.round((answeredBranches / TOTAL_BRANCHES) * 100);
  const questionAnswered = answeredBranchCount(question, attempt.answers);
  const currentComplete = isQuestionComplete(question, attempt.answers);
  const timer = formatSeconds(getElapsedSeconds(attempt.startedAt, now));

  useEffect(() => {
    const timerId = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timerId);
  }, []);

  const goTo = (number: number) => {
    onNavigate(number);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen pb-28 sm:pb-24">
      <a
        href="#exam-question"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[60] focus:rounded-lg focus:bg-white focus:px-4 focus:py-3 focus:font-bold focus:text-teal-800 focus:shadow-lg"
      >
        Skip to the question
      </a>

      <header className="sticky top-0 z-40 border-b border-teal-100 bg-white/95 shadow-[0_8px_30px_-24px_rgba(12,77,96,.5)] backdrop-blur-md">
        <div className="page-shell py-2.5 sm:py-3">
          <div className="flex items-center justify-between gap-2">
            <Brand compact />
            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
              <SoundButton muted={muted} onToggle={onToggleMute} />
              <div className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-2 sm:px-3.5">
                <Icon name="clock" className="hidden h-4 w-4 shrink-0 text-amber-700 sm:block" />
                <span className="timer-tile text-[12px] font-black text-amber-950 sm:text-sm">
                  {timer}
                </span>
                <span className="visually-hidden">Time since you started</span>
              </div>
            </div>
          </div>

          <div className="mt-2.5 flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-[11px] font-black text-slate-500 sm:text-xs">
                  {attempt.studentName} · Question {question.number} of 12
                </p>
                <p className="shrink-0 text-[11px] font-black text-teal-800 sm:text-xs">
                  {answeredBranches}/{TOTAL_BRANCHES} answered
                </p>
              </div>
              <div
                className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-200"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={TOTAL_BRANCHES}
                aria-valuenow={answeredBranches}
                aria-label="Exam answer progress"
              >
                <div className="progress-fill h-full rounded-full" style={{ width: `${progress}%` }} />
              </div>
            </div>
            <span className="hidden items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black text-emerald-700 sm:inline-flex">
              <Icon name="check" className="h-3.5 w-3.5" />
              Saved
            </span>
          </div>
        </div>
      </header>

      <main className="page-shell py-4 sm:py-6">
        {showRestored && (
          <div className="mb-4 flex items-start gap-3 rounded-2xl border border-sky-200 bg-sky-50 p-3.5">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-sky-700 shadow-sm">
              <Icon name="refresh" className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-extrabold text-sky-950">Your answers were restored.</p>
              <p className="mt-0.5 text-xs font-semibold leading-5 text-sky-800">
                The stopwatch continued from your saved start time. You can keep
                working where you stopped.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowRestored(false)}
              aria-label="Dismiss restored answers message"
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-sky-700 hover:bg-sky-100"
            >
              <Icon name="x" className="h-4 w-4" />
            </button>
          </div>
        )}

        <section className="soft-card mb-4 rounded-2xl p-3 sm:p-4" aria-label="Question map">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="flex items-center gap-1.5 text-xs font-extrabold text-slate-700">
              <Icon name="list" className="h-4 w-4 text-teal-700" />
              Question map
            </p>
            <p className="text-[10px] font-bold text-slate-500">
              <span className="mr-1 inline-block h-2 w-2 rounded-full bg-teal-500 align-middle" />
              Complete part · tap a number
            </p>
          </div>
          <nav
            aria-label="Jump to a main question"
            className="mt-2.5 grid grid-cols-4 gap-1.5 min-[380px]:grid-cols-6 sm:grid-cols-12"
          >
            {EXAM_QUESTIONS.map((item) => {
              const complete = isQuestionComplete(item, attempt.answers);
              const current = item.number === question.number;
              return (
                <button
                  key={item.number}
                  type="button"
                  onClick={() => goTo(item.number)}
                  aria-current={current ? "step" : undefined}
                  aria-label={`Question ${item.number}: ${item.title}${complete ? ", all parts answered" : ""}${current ? ", current question" : ""}`}
                  className={`pressable relative grid min-h-11 place-items-center rounded-lg border-2 text-sm font-black transition ${
                    current
                      ? "border-teal-800 bg-teal-800 text-white shadow-sm"
                      : complete
                        ? "border-teal-200 bg-teal-50 text-teal-900"
                        : "border-slate-200 bg-white text-slate-500 hover:border-teal-300 hover:text-teal-800"
                  }`}
                >
                  {item.number}
                  <span
                    className={`absolute bottom-1 h-1 w-1 rounded-full ${
                      complete
                        ? current
                          ? "bg-amber-300"
                          : "bg-teal-500"
                        : current
                          ? "bg-white/40"
                          : "bg-slate-200"
                    }`}
                    aria-hidden="true"
                  />
                </button>
              );
            })}
          </nav>
        </section>

        <section
          id="exam-question"
          className="soft-card overflow-hidden rounded-[1.5rem]"
        >
          <div className="relative overflow-hidden border-b border-slate-100 bg-gradient-to-br from-white via-sky-50/50 to-emerald-50/50 p-4 sm:p-6">
            <div className="pointer-events-none absolute -right-6 -top-6 opacity-40">
              <MiniSparkle size={64} color="#ffd267" />
            </div>
            <div className="relative flex flex-wrap items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                <span
                  className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl border text-xl shadow-sm sm:h-14 sm:w-14 sm:text-2xl ${style.bubble}`}
                  aria-hidden="true"
                >
                  {style.emoji}
                </span>
                <div className="min-w-0">
                  <SectionEyebrow>Question {question.number}</SectionEyebrow>
                  <h1 className="display-font mt-0.5 text-[1.55rem] leading-[1.05] text-slate-900 sm:text-3xl">
                    {question.title}
                  </h1>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {question.lessons.map((lesson) => (
                      <span
                        key={lesson}
                        className="rounded-full border border-slate-200 bg-white/90 px-2 py-0.5 text-[10px] font-black text-slate-500"
                      >
                        Lesson {lesson}
                      </span>
                    ))}
                    <span className="rounded-full border border-slate-200 bg-white/90 px-2 py-0.5 text-[10px] font-black text-slate-500">
                      {question.kindLabel}
                    </span>
                  </div>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/90 px-2.5 py-1.5 text-[11px] font-black text-slate-600 shadow-sm">
                <Icon name="star" className="h-3.5 w-3.5 text-amber-500" />
                {question.totalMarks} marks
              </span>
            </div>
            <p className="relative mt-3 max-w-3xl rounded-xl bg-white/75 px-3 py-2 text-sm font-semibold leading-6 text-slate-600">
              {question.instructions}
            </p>
          </div>

          <div className="p-3.5 sm:p-6">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-extrabold text-slate-600">
                {questionAnswered} of {question.branches.length} parts answered
              </p>
              <p className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                <Icon name="info" className="h-3.5 w-3.5" />
                No answers are revealed during the exam.
              </p>
            </div>

            <div className="grid gap-3">
              {question.branches.map((branch, index) => (
                <BranchCard
                  key={branch.id}
                  question={question}
                  branch={branch}
                  index={index}
                  value={attempt.answers[branch.id]}
                  onChange={(value) => onAnswer(branch.id, value)}
                />
              ))}
            </div>

            <div className="mt-5 flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={() => goTo(Math.max(1, question.number - 1))}
                disabled={question.number === 1}
                className="pressable inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-extrabold text-slate-700 hover:border-teal-300 hover:text-teal-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Icon name="arrow-left" className="h-4 w-4" />
                Previous
              </button>

              <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-500">
                {currentComplete ? (
                  <>
                    <span className="h-2 w-2 rounded-full bg-teal-600" aria-hidden="true" />
                    All parts answered
                  </>
                ) : (
                  "You can return to this question at any time."
                )}
              </div>

              <button
                type="button"
                onClick={() => goTo(Math.min(12, question.number + 1))}
                disabled={question.number === 12}
                className="pressable inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-sky-700 px-4 py-2.5 text-sm font-extrabold text-white shadow-sm hover:bg-sky-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
              >
                Next question
                <Icon name="arrow-right" className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>

        <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[11px] font-semibold text-slate-400">
          <Icon name="shield" className="h-3.5 w-3.5" />
          Answers save automatically on this device.
        </p>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-teal-100 bg-white/95 shadow-[0_-10px_35px_-25px_rgba(8,73,96,.4)] backdrop-blur-md">
        <div className="page-shell flex min-h-[74px] items-center justify-between gap-2 py-2.5 sm:gap-4">
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-slate-500 sm:text-xs">
              {allComplete ? (
                <span className="font-extrabold text-emerald-700">All {TOTAL_BRANCHES} parts complete.</span>
              ) : (
                <>
                  <span className="font-extrabold text-slate-800">{answeredBranches} / {TOTAL_BRANCHES}</span>{" "}
                  parts complete
                </>
              )}
            </p>
            <p className="mt-0.5 hidden text-[10px] font-semibold leading-4 text-slate-400 sm:block">
              {allComplete
                ? "Submit now to see your score and explanations."
                : "Finish every part to unlock Submit Exam."}
            </p>
          </div>
          <button
            type="button"
            onClick={onSubmit}
            disabled={!allComplete}
            title={allComplete ? "Submit your completed exam" : "Answer all {TOTAL_BRANCHES} parts before submitting"}
            className="pressable inline-flex min-h-[50px] shrink-0 items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-black text-white shadow-[0_8px_20px_-10px_rgba(15,118,110,.8)] hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none sm:min-w-[176px] sm:text-base"
          >
            Submit Exam
            <Icon name="arrow-right" className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
