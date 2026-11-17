import { useEffect, useMemo, useRef, useState } from "react";
import Contact from "@/components/Contact";
import QuestionCard from "@/components/QuestionCard";
import { LESSONS, QUESTIONS, isAnswered, type StudentPartAnswer } from "@/data/exam";
import { elapsedMs, formatDuration, type Attempt } from "@/lib/storage";

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function SoundIcon({ muted }: { muted: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.1} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M11 5 6 9H3v6h3l5 4V5Z" />
      {muted ? <path d="m16 9 5 6M21 9l-5 6" /> : <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" />}
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" aria-hidden="true">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

function NavGrid({
  current,
  answeredSet,
  onJump,
}: {
  current: number;
  answeredSet: Set<number>;
  onJump: (id: number) => void;
}) {
  return (
    <div className="space-y-4">
      {LESSONS.map((l) => (
        <div key={l.id}>
          <div className="mb-2 flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: l.color }} aria-hidden="true" />
            <span className="text-[11px] font-black uppercase tracking-[0.14em] text-ink/55">
              {l.from}–{l.to} · {l.title}
            </span>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {QUESTIONS.filter((q) => q.id >= l.from && q.id <= l.to).map((q) => {
              const done = answeredSet.has(q.id);
              const active = current === q.id;
              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => onJump(q.id)}
                  aria-label={`Go to question ${q.id}${done ? ", answered" : ", not answered"}`}
                  aria-current={active ? "true" : undefined}
                  className={[
                    "min-h-11 rounded-xl border-2 font-display text-[15px] font-black tabular-nums transition",
                    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-electric",
                    active
                      ? "border-flame bg-flame text-white shadow-[0_4px_0_0_#D96000]"
                      : done
                        ? "border-electric bg-electric text-white"
                        : "border-hair bg-white text-ink/45 hover:border-electric/40",
                  ].join(" ")}
                >
                  {q.id}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ExamScreen({
  attempt,
  onAnswers,
  onSubmit,
  onToggleMute,
  onNavigate,
}: {
  attempt: Attempt;
  onAnswers: (a: Record<number, StudentPartAnswer[]>) => void;
  onSubmit: () => void;
  onToggleMute: () => void;
  onNavigate: (n: number) => void;
}) {
  const [current, setCurrent] = useState(attempt.current ?? 1);
  const [now, setNow] = useState(() => Date.now());
  const [navOpen, setNavOpen] = useState(false);
  const mainRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);

  const answers = attempt.answers;

  const answeredSet = useMemo(() => {
    const s = new Set<number>();
    for (const q of QUESTIONS) if (isAnswered(q, answers[q.id] ?? [])) s.add(q.id);
    return s;
  }, [answers]);

  const question = QUESTIONS.find((q) => q.id === current) ?? QUESTIONS[0];
  const allDone = answeredSet.size === QUESTIONS.length;
  const isLast = current === QUESTIONS.length;
  const showSubmit = isLast || allDone;

  const lesson = LESSONS.find((l) => l.id === question.lesson)!;
  const progress = (answeredSet.size / QUESTIONS.length) * 100;

  function setPart(index: number, value: StudentPartAnswer) {
    const prev = answers[current] ?? question.parts.map(() => null as StudentPartAnswer);
    const next = [...prev];
    next[index] = value;
    onAnswers({ ...answers, [current]: next });
  }

  function jump(id: number) {
    setCurrent(id);
    onNavigate(id);
    setNavOpen(false);
    if (mainRef.current) mainRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    else window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const elapsed = formatDuration(elapsedMs(attempt.startedAt, now));

  return (
    <div className="min-h-screen bg-paper pb-24 text-ink">
      {/* ---------------------------------------------------------- header */}
      <header className="sticky top-0 z-30 border-b border-hair bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-3 pt-2.5 pb-2 sm:px-6 sm:gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-electric font-display text-[15px] font-black text-white">
            E8
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-[13px] font-extrabold uppercase tracking-[0.08em] text-ink/70 sm:text-[14px]">
              Grade 8 · Model A <span className="hidden sm:inline">· Unit 1</span>
            </p>
            <p className="truncate text-[12px] font-semibold text-ink/45">
              {answeredSet.size} of {QUESTIONS.length} answered
            </p>
          </div>

          <div
            className="flex shrink-0 items-center gap-1.5 rounded-xl border-2 border-electric/25 bg-electric/[0.06] px-2 py-1.5 text-electric sm:px-2.5"
            title="Elapsed time"
          >
            <span className="hidden sm:block">
              <ClockIcon />
            </span>
            <span className="font-display text-[14px] font-black tabular-nums tracking-tight sm:text-[16px]">{elapsed}</span>
          </div>

          <button
            type="button"
            onClick={onToggleMute}
            aria-pressed={attempt.muted}
            aria-label={attempt.muted ? "Unmute sounds" : "Mute sounds"}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border-2 border-hair bg-white text-ink/60 transition hover:border-electric/40 hover:text-electric focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-electric"
          >
            <SoundIcon muted={attempt.muted} />
          </button>

          <button
            type="button"
            onClick={() => setNavOpen(true)}
            aria-label="Open question list"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border-2 border-hair bg-white text-ink/60 transition hover:border-electric/40 hover:text-electric focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-electric lg:hidden"
          >
            <MenuIcon />
          </button>
        </div>

        {/* progress lanes */}
        <div className="mx-auto flex max-w-6xl gap-1.5 px-3 pb-2 sm:px-6">
          {LESSONS.map((l) => {
            const total = l.to - l.from + 1;
            const done = QUESTIONS.filter((q) => q.id >= l.from && q.id <= l.to && answeredSet.has(q.id)).length;
            return (
              <div key={l.id} className="min-w-0 flex-1">
                <div className="h-2 overflow-hidden rounded-full bg-hair">
                  <div
                    className="h-full rounded-full transition-[width] duration-500 ease-out"
                    style={{ width: `${(done / total) * 100}%`, background: l.color }}
                  />
                </div>
                <p className="mt-1 hidden truncate text-[10px] font-black uppercase tracking-[0.12em] text-ink/40 sm:block">
                  {l.title}
                </p>
              </div>
            );
          })}
        </div>
      </header>

      {/* ----------------------------------------------------------- body */}
      <div className="mx-auto w-full max-w-6xl px-3 pt-5 pb-8 sm:px-6 lg:grid lg:grid-cols-[248px_minmax(0,1fr)] lg:gap-7">
        <aside className="hidden lg:block">
          <div className="sticky top-32 rounded-[22px] border border-hair bg-white p-4 shadow-card">
            <p className="mb-3 text-[11px] font-black uppercase tracking-[0.16em] text-ink/45">Question list</p>
            <NavGrid current={current} answeredSet={answeredSet} onJump={jump} />
            <div className="mt-4 border-t border-hair pt-3 text-[12px] font-semibold text-ink/55">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-electric align-middle" /> Answered
              <span className="ml-3 inline-block h-2.5 w-2.5 rounded-full border-2 border-hair bg-white align-middle" /> Not
              answered
            </div>
          </div>
        </aside>

        <main ref={mainRef} className="min-w-0 scroll-mt-32">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span
              className="rounded-full px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.14em] text-white"
              style={{ background: lesson.color }}
            >
              {lesson.title}
            </span>
            <span className="rounded-full bg-white px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.14em] text-ink/50 ring-1 ring-hair">
              Question {question.id} of {QUESTIONS.length}
            </span>
            <span className="ml-auto text-[13px] font-bold text-ink/45">
              {answeredSet.has(question.id) ? "Answered" : "Not answered yet"}
            </span>
          </div>

          <QuestionCard
            key={question.id}
            question={question}
            answers={answers[question.id] ?? []}
            onPart={setPart}
          />

          <div className="mt-5 flex items-center justify-between gap-3">
            <button
              type="button"
              disabled={current === 1}
              onClick={() => jump(current - 1)}
              className="inline-flex min-h-12 items-center gap-1.5 rounded-2xl border-2 border-hair bg-white px-4 font-display text-[15px] font-extrabold text-ink transition disabled:cursor-not-allowed disabled:opacity-40 hover:border-electric/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-electric sm:px-5"
            >
              ← Previous
            </button>
            <button
              type="button"
              disabled={current === QUESTIONS.length}
              onClick={() => jump(current + 1)}
              className="inline-flex min-h-12 items-center gap-1.5 rounded-2xl border-2 border-hair bg-white px-4 font-display text-[15px] font-extrabold text-ink transition disabled:cursor-not-allowed disabled:opacity-40 hover:border-electric/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-electric sm:px-5"
            >
              Next →
            </button>
          </div>
        </main>
      </div>

      {/* ------------------------------------------------------- bottom bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-hair bg-white/95 px-3 pt-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] backdrop-blur sm:px-6">
        <div className="mx-auto flex max-w-6xl items-center gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-2">
              <span className="truncate font-display text-[13px] font-extrabold uppercase tracking-[0.1em] text-ink/60">
                {answeredSet.size}/{QUESTIONS.length} answered
              </span>
              <span className="shrink-0 text-[12px] font-bold text-ink/45">
                {Math.round(progress)}%
              </span>
            </div>
            <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-hair">
              <div
                className="h-full rounded-full bg-gradient-to-r from-electric via-turquoise to-grass transition-[width] duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {showSubmit && (
            <button
              type="button"
              disabled={!allDone}
              onClick={onSubmit}
              className={[
                "inline-flex min-h-14 shrink-0 items-center justify-center rounded-2xl px-5 font-display text-[16px] font-black transition sm:px-8 sm:text-[17px]",
                allDone
                  ? "bg-grass text-white shadow-[0_6px_0_0_#0E9B58] active:translate-y-[3px] active:shadow-[0_3px_0_0_#0E9B58]"
                  : "cursor-not-allowed bg-hair text-ink/45",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-grass",
              ].join(" ")}
            >
              Submit Exam
            </button>
          )}
        </div>
        {!allDone && showSubmit && (
          <p className="mx-auto mt-1.5 max-w-6xl text-[12px] font-semibold text-ink/50">
            Answer every question and sub-part to unlock submission.
          </p>
        )}
      </div>

      {/* ------------------------------------------------------ mobile nav */}
      {navOpen && (
        <div className="fixed inset-0 z-40 flex flex-col bg-ink/40 backdrop-blur-sm lg:hidden" role="dialog" aria-modal="true" aria-label="Question list">
          <div className="mt-auto max-h-[88vh] overflow-y-auto rounded-t-[26px] bg-paper px-4 pt-4 pb-6 shadow-lift">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="font-display text-[17px] font-black">Question list</p>
                <p className="text-[13px] font-semibold text-ink/55">{answeredSet.size} of {QUESTIONS.length} answered</p>
              </div>
              <button
                type="button"
                onClick={() => setNavOpen(false)}
                className="grid h-11 w-11 place-items-center rounded-xl border-2 border-hair bg-white text-ink/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-electric"
                aria-label="Close question list"
              >
                ✕
              </button>
            </div>
            <NavGrid current={current} answeredSet={answeredSet} onJump={jump} />
          </div>
        </div>
      )}

      <Contact compact />
    </div>
  );
}
