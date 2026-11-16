import { useEffect, useRef } from "react";
import { EXAM } from "../data/lessons";
import { answeredCount, completedQuestions } from "../lib/grading";
import type { AnswerValue, ExamState, Question } from "../types";
import { Brand, MuteButton, Stopwatch } from "./Common";
import { ChevronLeftIcon, ChevronRightIcon, ClockIcon, GridIcon, InfoIcon, SendIcon, UserIcon, XIcon } from "./Icons";
import { QuestionView } from "./QuestionView";

interface ExamScreenProps {
  state: ExamState;
  questions: Question[];
  muted: boolean;
  restored: boolean;
  onDismissRestored: () => void;
  onToggleMute: () => void;
  onAnswer: (questionId: string, partId: string, value: AnswerValue) => void;
  onGoTo: (index: number) => void;
  onSubmit: () => void;
}

export function ExamScreen({ state, questions, muted, restored, onDismissRestored, onToggleMute, onAnswer, onGoTo, onSubmit }: ExamScreenProps) {
  const total = questions.length;
  const index = Math.min(Math.max(state.currentIndex, 0), total - 1);
  const question = questions[index];
  const done = completedQuestions(questions, state.answers);
  const allDone = done === total;
  const left = total - done;
  const topRef = useRef<HTMLDivElement>(null);
  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [index]);

  const statusOf = (i: number) => {
    const { answered, total: parts } = answeredCount(questions[i], state.answers[questions[i].id]);
    return answered === parts ? "done" : answered > 0 ? "partial" : "empty";
  };

  const nextUnanswered = () => {
    for (let step = 1; step <= total; step++) {
      const i = (index + step) % total;
      if (statusOf(i) !== "done") return i;
    }
    return -1;
  };
  const jumpTarget = nextUnanswered();

  const submitPanel = (
    <div className="rounded-2xl border border-green-100 bg-white p-4">
      <button
        type="button"
        onClick={onSubmit}
        disabled={!allDone}
        aria-describedby="submit-help"
        className={`inline-flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-lg font-extrabold transition ${
          allDone
            ? "bg-green-700 text-white shadow-[0_10px_24px_-10px_rgba(21,128,61,0.8)] hover:bg-green-800 focus-visible:ring-4 focus-visible:ring-lime-300"
            : "cursor-not-allowed bg-green-100 text-green-400"
        }`}
      >
        <SendIcon className="h-5 w-5" /> Submit Exam
      </button>
      <p id="submit-help" className="mt-2 text-center text-sm font-semibold text-green-800">
        {allDone ? "All 50 questions are answered. You can submit now." : `Answer all questions to unlock Submit · ${left} left`}
      </p>
    </div>
  );

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-green-100 bg-white/85 backdrop-blur no-print">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2.5">
          <div className="hidden sm:block">
            <Brand />
          </div>
          <span className="inline-flex max-w-[9rem] items-center gap-1.5 truncate rounded-full bg-green-50 px-3 py-1.5 text-sm font-bold text-green-900 ring-1 ring-green-100 sm:ml-auto sm:max-w-[14rem]">
            <UserIcon className="h-4 w-4 shrink-0" />
            <span className="truncate">{state.studentName}</span>
          </span>
          <span
            role="timer"
            aria-label="Time elapsed"
            className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-lime-200 px-3 py-1.5 text-base font-extrabold text-green-950 sm:ml-0"
          >
            <ClockIcon className="h-4 w-4" />
            {state.startedAt !== null && <Stopwatch startedAt={state.startedAt} />}
          </span>
          <MuteButton muted={muted} onToggle={onToggleMute} />
        </div>
        <div className="mx-auto max-w-6xl px-4 pb-2.5">
          <div className="flex items-center gap-3 text-xs font-bold text-green-800 sm:text-sm">
            <span className="whitespace-nowrap">
              Answered {done} / {total}
            </span>
            <div
              className="h-2.5 flex-1 overflow-hidden rounded-full bg-green-100"
              role="progressbar"
              aria-label="Questions answered"
              aria-valuemin={0}
              aria-valuemax={total}
              aria-valuenow={done}
            >
              <div className="h-full rounded-full bg-gradient-to-r from-lime-400 to-green-500 transition-all" style={{ width: `${(done / total) * 100}%` }} />
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pt-5">
        {restored && (
          <div role="status" className="mb-4 flex items-start gap-3 rounded-2xl border border-lime-200 bg-lime-50 px-4 py-3 text-green-900">
            <InfoIcon className="mt-0.5 h-5 w-5 shrink-0 text-green-700" />
            <p className="flex-1 text-sm font-semibold sm:text-base">Welcome back! Your exam was restored. Your answers and your time were saved.</p>
            <button type="button" onClick={onDismissRestored} aria-label="Close message" className="rounded-full p-1 text-green-700 hover:bg-lime-100">
              <XIcon className="h-4 w-4" />
            </button>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div ref={topRef} className="scroll-mt-28">
            <QuestionView
              key={question.id}
              question={question}
              number={index + 1}
              total={total}
              answers={state.answers[question.id]}
              onChange={(partId, value) => onAnswer(question.id, partId, value)}
            />

            <nav aria-label="Question navigation" className="mt-4 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => onGoTo(index - 1)}
                disabled={index === 0}
                className="inline-flex items-center gap-1.5 rounded-2xl border-2 border-green-200 bg-white px-4 py-3 text-base font-extrabold text-green-800 transition hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeftIcon className="h-5 w-5" /> Previous
              </button>
              {jumpTarget >= 0 && jumpTarget !== index + 1 && (
                <button
                  type="button"
                  onClick={() => onGoTo(jumpTarget)}
                  className="hidden rounded-2xl px-3 py-3 text-sm font-bold text-green-700 underline underline-offset-4 hover:text-green-900 sm:inline-flex"
                >
                  Next unanswered: {jumpTarget + 1}
                </button>
              )}
              {index < total - 1 ? (
                <button
                  type="button"
                  onClick={() => onGoTo(index + 1)}
                  className="inline-flex items-center gap-1.5 rounded-2xl bg-green-700 px-5 py-3 text-base font-extrabold text-white shadow-sm transition hover:bg-green-800"
                >
                  Next <ChevronRightIcon className="h-5 w-5" />
                </button>
              ) : (
                <span className="text-sm font-bold text-green-700">Last question</span>
              )}
            </nav>
          </div>

          <aside className="flex flex-col gap-4 lg:sticky lg:top-28 lg:self-start" aria-label="Exam progress">
            <div className="rounded-2xl border border-green-100 bg-white p-4">
              <h2 className="flex items-center gap-2 text-base font-extrabold text-green-950">
                <GridIcon className="h-5 w-5 text-green-600" /> Questions
              </h2>
              <ol className="mt-3 grid grid-cols-10 gap-1.5">
                {questions.map((q, i) => {
                  const status = statusOf(i);
                  const current = i === index;
                  return (
                    <li key={q.id}>
                      <button
                        type="button"
                        onClick={() => onGoTo(i)}
                        aria-current={current ? "step" : undefined}
                        aria-label={`Question ${i + 1}, ${status === "done" ? "answered" : status === "partial" ? "partly answered" : "not answered"}`}
                        className={`grid aspect-square w-full place-items-center rounded-lg text-xs font-extrabold transition sm:text-sm ${
                          status === "done"
                            ? "bg-lime-300 text-green-950 hover:bg-lime-400"
                            : status === "partial"
                              ? "border-2 border-dashed border-lime-500 bg-lime-50 text-green-900"
                              : "border border-green-200 bg-white text-green-700 hover:bg-green-50"
                        } ${current ? "ring-[3px] ring-green-700 ring-offset-1" : ""}`}
                      >
                        {i + 1}
                      </button>
                    </li>
                  );
                })}
              </ol>
              <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold text-green-800">
                <li className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded bg-lime-300" /> Answered
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded border-2 border-dashed border-lime-500 bg-lime-50" /> Partly answered
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded border border-green-200 bg-white" /> Not answered
                </li>
              </ul>
            </div>
            {submitPanel}
            <p className="px-1 text-center text-xs font-semibold text-green-700">
              {EXAM.totalQuestions} questions · {EXAM.totalMarks} marks · Answers save automatically
            </p>
          </aside>
        </div>
      </main>
    </>
  );
}
