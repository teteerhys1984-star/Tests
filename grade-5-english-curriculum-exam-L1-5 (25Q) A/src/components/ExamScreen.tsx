import { useEffect, useMemo, useRef, useState } from "react";
import QuestionCard from "@/components/QuestionCard";
import { Flower, SoundOff, SoundOn, Star } from "@/components/Decor";
import type { Attempt } from "@/lib/attempt";
import { elapsedMs, formatClock } from "@/lib/attempt";
import { QUESTIONS } from "@/data/exam";
import { answeredCount, isAnswered, requiredItemCount } from "@/lib/grading";

interface Props {
  attempt: Attempt;
  onAnswer: (key: string, value: string) => void;
  onSubmit: () => void;
  muted: boolean;
  onToggleMute: () => void;
}

export default function ExamScreen({ attempt, onAnswer, onSubmit, muted, onToggleMute }: Props) {
  /* Resume at the first question that still has an unanswered part. */
  const [index, setIndex] = useState(() => {
    const a = attempt.answers;
    const first = QUESTIONS.findIndex((q) =>
      q.items.some((it) => !isAnswered(it, a[`${q.id}/${it.id}`])),
    );
    return first === -1 ? QUESTIONS.length - 1 : first;
  });
  const [now, setNow] = useState(() => Date.now());
  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);

  const answered = answeredCount(attempt.answers);
  const total = requiredItemCount();
  const complete = answered === total;
  const pct = Math.round((answered / total) * 100);
  const q = QUESTIONS[index];
  const clock = formatClock(elapsedMs(attempt, now));

  const states = useMemo(
    () =>
      QUESTIONS.map((question) => {
        const done = question.items.filter((it) =>
          isAnswered(it, attempt.answers[`${question.id}/${it.id}`]),
        ).length;
        return done === question.items.length ? "done" : done > 0 ? "part" : "empty";
      }),
    [attempt.answers],
  );

  const go = (i: number) => {
    const next = Math.max(0, Math.min(QUESTIONS.length - 1, i));
    setIndex(next);
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden pb-[124px] xl:pl-24">
      <div ref={topRef} />

      {/* ── sticky ribbon: name · stopwatch · mute ── */}
      <header className="sticky top-0 z-30 border-b border-lilac-pale bg-paper/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center gap-2 px-3 py-2.5 sm:px-6">
          <span className="hidden h-9 w-9 shrink-0 place-items-center rounded-full bg-lavender text-lilac sm:grid">
            <Flower className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="eyebrow hidden text-lilac sm:block">Grade 5 · Unit 1 · Model A</p>
            <p className="truncate text-[14px] font-extrabold text-ink">{attempt.name}</p>
          </div>
          <div
            className="num flex shrink-0 items-center gap-1.5 rounded-full border border-lilac-pale bg-white px-2.5 py-2 text-[14.5px] font-extrabold text-lilac-deep sm:px-3 sm:text-[15px]"
            aria-label="Elapsed time"
          >
            <ClockIcon />
            {clock}
          </div>
          <button
            type="button"
            onClick={onToggleMute}
            aria-pressed={muted}
            aria-label={muted ? "Unmute sounds" : "Mute sounds"}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-lilac-pale bg-white text-lilac-deep transition active:scale-95"
          >
            {muted ? <SoundOff className="h-5 w-5" /> : <SoundOn className="h-5 w-5" />}
          </button>
        </div>
        <div className="h-1.5 w-full bg-lilac-pale">
          <div
            className="h-full bg-gradient-to-r from-lilac via-lilac-deep to-turquoise transition-[width] duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </header>

      {/* ── question index strip (< xl) ── */}
      <nav
        aria-label="Question list"
        className="border-b border-lilac-pale bg-white/70 xl:hidden [@media(max-height:430px)]:hidden"
      >
        <div className="mx-auto flex max-w-3xl gap-1.5 overflow-x-auto px-3 py-2 sm:px-6">
          {QUESTIONS.map((qq, i) => {
            const st = states[i];
            const cur = i === index;
            return (
              <button
                key={qq.id}
                type="button"
                onClick={() => go(i)}
                aria-current={cur ? "true" : undefined}
                aria-label={`Go to question ${qq.n}`}
                className={
                  "num h-9 w-9 shrink-0 rounded-full border-2 text-[13px] font-extrabold transition active:scale-90 " +
                  (cur
                    ? "border-lilac-deep bg-lilac-deep text-white"
                    : st === "done"
                      ? "border-turquoise bg-mint text-[#2f8f89]"
                      : st === "part"
                        ? "border-peach bg-peach-pale text-[#b4593a]"
                        : "border-lilac-pale bg-white text-ink-soft")
                }
              >
                {qq.n}
              </button>
            );
          })}
        </div>
      </nav>

      {/* ── left spine rail (xl+) ── */}
      <aside
        aria-hidden="true"
        className="fixed left-0 top-32 bottom-40 hidden w-24 xl:block"
      >
        <div className="relative mx-auto flex h-full w-16 flex-col items-center">
          <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-lilac-pale" />
          <span
            className="absolute inset-y-0 left-1/2 w-4 -translate-x-1/2 opacity-70"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, rgba(155,107,199,0.45) 1px, transparent 0)",
              backgroundSize: "8px 8px",
            }}
          />
          <div className="relative flex min-h-0 flex-1 flex-col items-center gap-2 overflow-y-auto py-1">
            {QUESTIONS.map((qq, i) => {
              const st = states[i];
              const cur = i === index;
              return (
                <span
                  key={qq.id}
                  className={
                    "num grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 text-[10px] font-extrabold " +
                    (cur
                      ? "border-lilac-deep bg-lilac-deep text-white"
                      : st === "done"
                        ? "border-turquoise bg-mint text-[#2f8f89]"
                        : st === "part"
                          ? "border-peach bg-peach-pale text-[#b4593a]"
                          : "border-lilac-pale bg-white text-ink-soft")
                  }
                >
                  {qq.n}
                </span>
              );
            })}
          </div>
          <Star className="relative mt-3 h-5 w-5 shrink-0 text-peach" />
        </div>
      </aside>

      {/* ── question ── */}
      <main className="mx-auto w-full max-w-3xl px-3 pt-6 sm:px-6 sm:pt-9">
        <QuestionCard q={q} answers={attempt.answers} onAnswer={onAnswer} />

        <div className="mt-7 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => go(index - 1)}
            disabled={index === 0}
            className="min-h-[52px] rounded-2xl border-2 border-lilac-pale bg-white px-5 text-[15px] font-extrabold text-lilac-deep transition enabled:hover:border-lilac disabled:opacity-40 active:scale-95"
          >
            ← Previous
          </button>
          <p className="num text-[13px] font-extrabold text-ink-soft">
            {index + 1} / {QUESTIONS.length}
          </p>
          <button
            type="button"
            onClick={() => go(index + 1)}
            disabled={index === QUESTIONS.length - 1}
            className="min-h-[52px] rounded-2xl border-2 border-lilac-pale bg-white px-5 text-[15px] font-extrabold text-lilac-deep transition enabled:hover:border-lilac disabled:opacity-40 active:scale-95"
          >
            Next →
          </button>
        </div>

        <p className="mt-6 rounded-2xl bg-lavender px-4 py-3 text-center text-[13px] leading-relaxed text-ink-soft">
          Your answers are saved on this device after every tap. Nothing is marked until you press
          Submit Exam.
        </p>
      </main>

      {/* ── fixed action bar ── */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-lilac-pale bg-paper/95 backdrop-blur-md">
        <div className="mx-auto max-w-3xl px-3 pb-[max(10px,env(safe-area-inset-bottom))] pt-2.5 sm:px-6">
          <div className="mb-2 flex items-center gap-2">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-lilac-pale">
              <div
                className="h-full rounded-full bg-turquoise transition-[width] duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="num shrink-0 text-[12px] font-extrabold text-ink-soft">
              {answered}/{total} parts
            </span>
          </div>
          <button
            type="button"
            onClick={onSubmit}
            disabled={!complete}
            className={
              "flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl px-6 text-[17px] font-extrabold transition active:scale-[0.99] " +
              (complete
                ? "bg-lilac-deep text-white shadow-[0_14px_30px_-18px_rgba(110,63,151,1)] hover:bg-lilac"
                : "cursor-not-allowed bg-lilac-pale text-lilac-deep opacity-80")
            }
          >
            Submit Exam
            {!complete && (
              <span className="text-[12px] font-bold opacity-90">
                · {total - answered} left
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <circle cx="12" cy="12" r="8.6" fill="none" stroke="currentColor" strokeWidth="2" />
      <path
        d="M12 7.6V12l3 1.8"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
