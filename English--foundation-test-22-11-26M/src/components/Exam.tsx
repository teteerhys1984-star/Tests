import { useEffect, useMemo, useRef, useState } from "react";
import { EXAM_SUBTITLE, EXAM_TITLE, type MainQuestion } from "@/data/exam";
import {
  countAnswered,
  isAnswered,
  questionAnsweredFlags,
  totalSubs,
  type AnswerValue,
} from "@/lib/grading";
import { formatDuration, subLetter } from "@/lib/format";
import { useElapsed } from "@/hooks/useElapsed";
import type { Attempt } from "@/lib/storage";
import { cn } from "@/utils/cn";
import { DoneBadge, LetterBadge, SubQuestionView } from "./SubQuestionView";
import { Button, Card, Icon, Passage } from "./ui";

type Props = {
  attempt: Attempt;
  questions: MainQuestion[];
  onAnswer: (subId: string, value: AnswerValue) => void;
  onNavigate: (index: number) => void;
  onSubmit: () => void;
  muted: boolean;
  onToggleMute: () => void;
};

export function Exam({
  attempt,
  questions,
  onAnswer,
  onNavigate,
  onSubmit,
  muted,
  onToggleMute,
}: Props) {
  const index = Math.min(Math.max(attempt.current, 0), questions.length - 1);
  const question = questions[index];
  const last = questions.length - 1;
  const elapsed = useElapsed(attempt.startedAt, null);
  const total = totalSubs(questions);
  const answered = useMemo(
    () => countAnswered(questions, attempt.answers),
    [questions, attempt.answers],
  );
  const flags = useMemo(
    () => questionAnsweredFlags(questions, attempt.answers),
    [questions, attempt.answers],
  );
  const allAnswered = answered === total;
  const missing = total - answered;
  const [showMap, setShowMap] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Every question change starts at the top and moves focus to the question title.
  useEffect(() => {
    window.scrollTo({ top: 0 });
    headingRef.current?.focus({ preventScroll: true });
  }, [index]);

  const pick = (itemIndex: number) => {
    onNavigate(itemIndex);
    setShowMap(false);
  };

  return (
    <div className="flex min-w-0 flex-col">
      {/* Sticky study bar: stopwatch, sound, progress */}
      <header className="sticky top-0 z-30 border-b-2 border-line bg-paper/95 backdrop-blur">
        <div className="wrap flex min-h-14 items-center gap-2 py-2">
          <p className="min-w-0 truncate text-sm leading-tight font-black text-ink sm:text-base">
            <span className="sm:hidden">{EXAM_SHORT_LABEL}</span>
            <span className="hidden sm:inline">
              {EXAM_TITLE} · {EXAM_SUBTITLE}
            </span>
          </p>
          <div className="ml-auto flex shrink-0 items-center gap-2">
            <div
              className="num inline-flex h-10 items-center gap-1.5 rounded-xl border-2 border-ocean/40 bg-ocean-soft px-3 text-base font-black text-ocean-dark"
              role="timer"
              aria-label={`Time elapsed ${formatDuration(elapsed)}`}
            >
              <Icon name="clock" className="h-4.5 w-4.5" />
              {formatDuration(elapsed)}
            </div>
            <button
              type="button"
              onClick={onToggleMute}
              className="icon-btn"
              aria-pressed={!muted}
              aria-label={muted ? "Sound is off. Turn sound on" : "Sound is on. Turn sound off"}
            >
              <Icon name={muted ? "volumeOff" : "volume"} />
            </button>
          </div>
        </div>
        <div className="exam-progress-row wrap flex items-center gap-3 pb-2">
          <p className="shrink-0 text-sm font-extrabold text-ink">
            Question <span className="num">{index + 1}</span> of {questions.length}
          </p>
          <div
            className="h-3 min-w-0 flex-1 overflow-hidden rounded-full border-2 border-line bg-white"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={total}
            aria-valuenow={answered}
            aria-label="Parts answered"
          >
            <div
              className="h-full rounded-full bg-ocean transition-[width] duration-300 ease-out"
              style={{ width: `${(answered / total) * 100}%` }}
            />
          </div>
          <p className="num shrink-0 text-sm font-extrabold text-muted">
            {answered}/{total}
          </p>
        </div>
      </header>

      <main className="wrap flex-1 pt-4 pb-6 sm:pt-6">
        <Card className="p-4 sm:p-6">
          <div className="flex items-start gap-3">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border-2 border-sun-dark bg-sun text-xl font-black text-ink shadow-[0_3px_0_var(--color-sun-dark)]"
              aria-hidden="true"
            >
              {index + 1}
            </div>
            <div className="min-w-0">
              <h2
                ref={headingRef}
                tabIndex={-1}
                className="text-xl leading-tight font-black text-ink outline-none sm:text-2xl"
              >
                {question.title}
              </h2>
              <p className="mt-1 text-sm leading-relaxed font-semibold text-muted sm:text-base">
                {question.instruction}
              </p>
            </div>
          </div>

          {question.passage && <Passage lines={question.passage} />}

          <ol className="mt-5 space-y-4">
            {question.subs.map((sub, subIndex) => {
              const done = isAnswered(sub, attempt.answers[sub.id]);
              return (
                <li
                  key={sub.id}
                  className="rounded-2xl border-2 border-line bg-white p-3 sm:p-4"
                >
                  <div className="mb-2 flex items-center gap-2">
                    <LetterBadge letter={subLetter(subIndex)} />
                    <DoneBadge done={done} />
                  </div>
                  <SubQuestionView
                    sub={sub}
                    value={attempt.answers[sub.id]}
                    onChange={(value) => onAnswer(sub.id, value)}
                  />
                </li>
              );
            })}
          </ol>
        </Card>
      </main>

      {/* Sticky navigation. The question map opens as an overlay so it never pushes content. */}
      <nav className="exam-nav z-30 border-t-2 border-line bg-paper/95 backdrop-blur" aria-label="Exam navigation">
        <div className="wrap relative pt-2 pb-3">
          {showMap && (
            <div
              id="question-map"
              className="absolute right-4 bottom-full left-4 z-10 mb-2 rounded-3xl border-2 border-line bg-white p-3 shadow-[0_-12px_32px_-16px_rgba(43,49,73,0.5)] sm:right-6 sm:left-6"
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="flex items-center gap-1.5 text-xs font-extrabold tracking-wide text-muted uppercase">
                  <Icon name="list" className="h-4 w-4" />
                  Choose a question
                </p>
                <button
                  type="button"
                  onClick={() => setShowMap(false)}
                  className="inline-flex min-h-9 cursor-pointer items-center gap-1 rounded-lg px-2 text-sm font-extrabold text-ocean-dark hover:bg-ocean-soft"
                >
                  <Icon name="x" className="h-4 w-4" />
                  Close
                </button>
              </div>
              <div className="grid grid-cols-5 gap-2 sm:grid-cols-10">
                {questions.map((item, itemIndex) => {
                  const isCurrent = itemIndex === index;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => pick(itemIndex)}
                      aria-label={`Question ${itemIndex + 1}${flags[itemIndex] ? ", answered" : ", not answered yet"}`}
                      aria-current={isCurrent ? "step" : undefined}
                      className={cn(
                        "qchip justify-self-center",
                        flags[itemIndex] && "done",
                        isCurrent && "current",
                      )}
                    >
                      {itemIndex + 1}
                      {!flags[itemIndex] && <span className="todo" aria-hidden="true" />}
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-xs leading-relaxed font-semibold text-muted">
                Blue numbers are fully answered. A red dot means part of the question is still
                missing.
              </p>
            </div>
          )}

          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setShowMap((open) => !open)}
              aria-expanded={showMap}
              className="inline-flex min-h-10 shrink-0 cursor-pointer items-center gap-2 rounded-xl px-2 text-sm font-extrabold text-ocean-dark hover:bg-ocean-soft"
            >
              <Icon name="list" className="h-4 w-4" />
              Question map
              <Icon
                name="down"
                className={cn("h-4 w-4 transition-transform duration-200", showMap && "rotate-180")}
              />
            </button>
            <p className="num min-w-0 text-right text-sm font-bold text-muted" aria-live="polite">
              {allAnswered
                ? "All parts answered"
                : `${missing} ${missing === 1 ? "part" : "parts"} left`}
            </p>
          </div>

          <div className="mt-2 flex items-center gap-3">
            <Button
              variant="secondary"
              className="w-12 flex-none px-0 sm:w-auto sm:px-5"
              onClick={() => onNavigate(index - 1)}
              disabled={index === 0}
              aria-label="Previous question"
            >
              <Icon name="chevronLeft" />
              <span className="hidden sm:inline">Previous</span>
            </Button>
            <Button
              variant="sun"
              className="min-w-0 flex-1"
              disabled={!allAnswered}
              onClick={onSubmit}
            >
              Submit Exam
            </Button>
            <Button
              variant="secondary"
              className="w-12 flex-none px-0 sm:w-auto sm:px-5"
              onClick={() => onNavigate(index + 1)}
              disabled={index === last}
              aria-label="Next question"
            >
              <span className="hidden sm:inline">Next</span>
              <Icon name="chevronRight" />
            </Button>
          </div>
        </div>
      </nav>
    </div>
  );
}

/** Short neutral label used on very narrow screens so the stopwatch stays visible. */
const EXAM_SHORT_LABEL = "English Exam";
