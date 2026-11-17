import { useEffect, useRef } from "react";
import ContactFooter from "@/components/ContactFooter";
import QuestionCard from "@/components/QuestionCard";
import { LESSONS, type Question } from "@/data/exam";
import { allAnswered, answeredCount, isQuestionAnswered } from "@/lib/grading";

interface Props {
  questions: Question[];
  answers: Record<string, string>;
  index: number;
  name: string;
  elapsed: string;
  muted: boolean;
  onIndex: (i: number) => void;
  onChange: (partId: string, value: string) => void;
  onToggleMute: () => void;
  onSubmit: () => void;
}

function SpeakerIcon({ muted }: { muted: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M11 5 6 9H3v6h3l5 4V5z" />
      {muted ? (
        <>
          <path d="M17 9l4 6" />
          <path d="M21 9l-4 6" />
        </>
      ) : (
        <>
          <path d="M15.5 8.5a5 5 0 0 1 0 7" />
          <path d="M18.5 5.5a9 9 0 0 1 0 13" />
        </>
      )}
    </svg>
  );
}

export default function ExamScreen({
  questions,
  answers,
  index,
  name,
  elapsed,
  muted,
  onIndex,
  onChange,
  onToggleMute,
  onSubmit,
}: Props) {
  const question = questions[index];
  const lesson = LESSONS[question.lesson];
  const { answered, total } = answeredCount(questions, answers);
  const done = allAnswered(questions, answers);
  const questionsLeft = questions.filter((q) => !isQuestionAnswered(q, answers)).length;
  const answeredQuestions = questions.length - questionsLeft;
  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  }, [index]);

  return (
    <div className="flex min-h-screen flex-col">
      {/* ---- sticky exam header ---------------------------------------- */}
      <header className="sticky top-0 z-40 border-b-[3px] border-ink bg-paper/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-3 py-2.5 md:px-8">
          <div className="min-w-0 flex-1">
            <p className="label-caps truncate text-turq-deep">
              Grade 5 · English · Unit 1 · Model A
            </p>
            <p className="truncate text-sm text-ink-soft" title={name}>
              {name}
            </p>
          </div>

          <div className="hidden rounded-sm border-2 border-ink/15 bg-white px-3 py-1.5 text-center sm:block">
            <p className="label-caps text-ink-soft">Answered</p>
            <p className="tabular text-base font-semibold text-ink">
              {answeredQuestions}
              <span className="text-ink-soft">/{questions.length}</span>
            </p>
          </div>

          <div className="rounded-sm border-2 border-turq bg-turq/12 px-3 py-1.5 text-center">
            <p className="label-caps text-turq-deep">Time</p>
            <p className="tabular text-base font-semibold text-turq-deep" aria-live="off">
              {elapsed}
            </p>
          </div>

          <button
            type="button"
            onClick={onToggleMute}
            aria-pressed={muted}
            title={muted ? "Turn sound on" : "Turn sound off"}
            className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-ink/15 bg-white text-ink transition hover:border-turq hover:text-turq-deep"
          >
            <span className="sr-only">{muted ? "Turn sound on" : "Turn sound off"}</span>
            <SpeakerIcon muted={muted} />
          </button>
        </div>

        {/* progress rail */}
        <div className="h-1.5 w-full bg-ink/10">
          <div
            className="h-full bg-turq transition-[width] duration-300"
            style={{ width: `${(answered / total) * 100}%` }}
          />
        </div>
      </header>

      {/* ---- body ------------------------------------------------------ */}
      <main className="mx-auto w-full max-w-6xl flex-1 px-3 pt-5 pb-4 md:px-8">
        <div ref={topRef} className="grid gap-5 lg:grid-cols-[5.5rem_1fr]">
          {/* left margin rail */}
          <aside className="sticky top-28 hidden self-start lg:block">
            <div className="flex flex-col items-center gap-4 border-r-2 border-coral/70 pr-4">
              <span
                className="tabular flex h-14 w-14 items-center justify-center rounded-full text-xl font-bold text-white shadow-[0_3px_0_rgba(44,42,38,0.3)]"
                style={{ backgroundColor: lesson.color }}
              >
                {index + 1}
              </span>
              <div
                className="label-caps py-3 text-white"
                style={{
                  writingMode: "vertical-rl",
                  backgroundColor: lesson.color,
                  padding: "14px 8px",
                }}
              >
                Lesson {lesson.no} · {lesson.title}
              </div>
              <div className="text-center">
                <p className="label-caps text-ink-soft">Page</p>
                <p className="tabular text-sm text-ink">{lesson.pages.replace("Pupil's Book ", "")}</p>
              </div>
            </div>
          </aside>

          <div>
            {/* mobile ribbon */}
            <div
              className="mb-3 flex items-center justify-between rounded-sm px-3 py-2 text-white lg:hidden"
              style={{ backgroundColor: lesson.color }}
            >
              <span className="label-caps">
                Lesson {lesson.no} · {lesson.title}
              </span>
              <span className="tabular text-sm font-semibold">
                Q {index + 1} / {questions.length}
              </span>
            </div>

            <QuestionCard
              key={question.id}
              question={question}
              number={index + 1}
              answers={answers}
              onChange={onChange}
            />

            {/* navigation */}
            <nav className="mt-5 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => onIndex(Math.max(0, index - 1))}
                disabled={index === 0}
                className="rounded-full border-2 border-ink/20 bg-white px-5 py-2.5 font-semibold text-ink transition hover:border-turq hover:text-turq-deep disabled:cursor-not-allowed disabled:opacity-35"
              >
                ← Previous
              </button>
              <button
                type="button"
                onClick={() => onIndex(Math.min(questions.length - 1, index + 1))}
                disabled={index === questions.length - 1}
                className="rounded-full border-2 border-ink/20 bg-white px-5 py-2.5 font-semibold text-ink transition hover:border-turq hover:text-turq-deep disabled:cursor-not-allowed disabled:opacity-35"
              >
                Next →
              </button>
              <span className="tabular ml-auto text-sm text-ink-soft">
                Question {index + 1} of {questions.length}
              </span>
            </nav>

            {/* jump strip */}
            <div className="mt-4 rounded-sm border-2 border-ink/12 bg-white/70 p-3">
              <p className="label-caps mb-2 text-ink-soft">Jump to a question · filled = answered</p>
              <div className="flex flex-wrap gap-1.5">
                {questions.map((q, i) => {
                  const filled = isQuestionAnswered(q, answers);
                  const active = i === index;
                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => onIndex(i)}
                      aria-label={`Go to question ${i + 1}, ${LESSONS[q.lesson].title}`}
                      aria-current={active ? "true" : undefined}
                      className={`tabular h-9 w-9 rounded-full border-2 text-xs font-semibold transition ${
                        active
                          ? "border-ink bg-ink text-paper"
                          : filled
                            ? "border-transparent text-white"
                            : "border-ink/25 bg-white text-ink-soft hover:border-ink/50"
                      }`}
                      style={
                        active || !filled ? undefined : { backgroundColor: LESSONS[q.lesson].color }
                      }
                    >
                      {i + 1}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ---- submit bar --------------------------------------------- */}
        <div className="sticky bottom-0 z-30 mt-6 border-t-[3px] border-ink bg-paper/96 backdrop-blur">
          <div className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-ink-soft">
              {done ? (
                <span className="font-semibold text-green">
                  Every question is answered. You can submit now.
                </span>
              ) : (
                <>
                  <strong className="tabular text-coral">{questionsLeft}</strong> question
                  {questionsLeft === 1 ? "" : "s"} still need{questionsLeft === 1 ? "s" : ""} an answer
                  before you can submit.
                </>
              )}
            </p>
            <button
              type="button"
              onClick={onSubmit}
              disabled={!done}
              className="rounded-full bg-coral px-8 py-4 text-lg font-bold text-white shadow-[0_4px_0_#d24a3b] transition active:translate-y-[2px] active:shadow-[0_2px_0_#d24a3b] disabled:cursor-not-allowed disabled:bg-ink/25 disabled:shadow-none"
            >
              Submit Exam
            </button>
          </div>
        </div>
      </main>

      <ContactFooter />
    </div>
  );
}
