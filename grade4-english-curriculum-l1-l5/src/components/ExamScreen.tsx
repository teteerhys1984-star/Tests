import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Crosshair,
  Flag,
  Package,
  Target,
  Timer,
  UserRound,
  Volume2,
  VolumeX,
} from "lucide-react";
import {
  LESSON_TITLES,
  MISSIONS,
  QUESTIONS,
  TOTAL_MARKS,
} from "../data/questions";
import { questionAnswered } from "../logic/grading";
import { loadMuted, saveMuted } from "../logic/storage";
import type { AnswerValue, ExamSession } from "../types";
import { formatHMS } from "../utils/format";
import { cn } from "../utils/cn";
import { PartRenderer } from "./Parts";
import { BrandMark, SKILL_ICON } from "./ui";

export default function ExamScreen({
  session,
  onAnswer,
  onNavigate,
  onSubmit,
}: {
  session: ExamSession;
  onAnswer: (partId: string, value: AnswerValue) => void;
  onNavigate: (index: number) => void;
  onSubmit: () => void;
}) {
  const q = QUESTIONS[session.current];
  const [, setTick] = useState(0);
  const [muted, setMuted] = useState(loadMuted);
  const topRef = useRef<HTMLDivElement>(null);

  /* count-up stopwatch — timestamps are the source of truth */
  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 500);
    return () => window.clearInterval(id);
  }, []);
  const elapsed = session.startedAt ? Date.now() - session.startedAt : 0;

  useEffect(() => {
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [session.current]);

  const answeredCount = useMemo(
    () => QUESTIONS.filter((x) => questionAnswered(x, session.answers)).length,
    [session.answers]
  );
  const unanswered = QUESTIONS.length - answeredCount;
  const allAnswered = unanswered === 0;
  const mission = MISSIONS[q.mission - 1];
  const progress = Math.round((answeredCount / QUESTIONS.length) * 100);

  const toggleMute = () => {
    setMuted((m) => {
      saveMuted(!m);
      return !m;
    });
  };

  return (
    <div className="tactical-bg relative min-h-screen" ref={topRef}>
      <div className="grid-overlay pointer-events-none fixed inset-0" aria-hidden="true" />

      {/* ------------------------------ HUD bar ------------------------------ */}
      <header className="sticky top-0 z-30 border-b border-[#232d15] bg-[#070906]/92 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-3 py-2.5 sm:px-4">
          <div className="flex items-center gap-2.5">
            <BrandMark size={30} glow={false} />
            <div className="hidden leading-none sm:block">
              <p className="font-hud text-[8.5px] tracking-[0.3em] text-[#8fa06d] uppercase">
                Garden of Knowledge
              </p>
              <p className="font-hud text-[10.5px] font-bold tracking-[0.14em] text-[#e6dcc0] uppercase">
                {mission.code} · {mission.name}
              </p>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <span className="font-hud inline-flex items-center gap-1.5 rounded border border-[#2a3819] bg-[#0e1209] px-2.5 py-1.5 text-[10px] font-semibold tracking-widest text-[#cbb894] uppercase">
              <UserRound className="h-3.5 w-3.5 text-[#ffb400]" />
              <span className="max-w-[130px] truncate sm:max-w-[220px]">{session.studentName}</span>
            </span>
            <span
              className="font-hud inline-flex items-center gap-1.5 rounded border border-[#3d4d22] bg-[#131a0c] px-2.5 py-1.5 text-[12px] font-bold tracking-[0.12em] text-[#ffd75e] tabular-nums"
              aria-label="Elapsed time"
              data-testid="exam-timer"
            >
              <Timer className="h-3.5 w-3.5 text-[#ffb400]" />
              {formatHMS(elapsed)}
            </span>
            <button
              type="button"
              onClick={toggleMute}
              aria-label={muted ? "Unmute sound effects" : "Mute sound effects"}
              className={cn(
                "inline-flex h-[34px] w-[34px] items-center justify-center rounded border transition",
                muted
                  ? "border-[#3d2d16] bg-[#22150a] text-[#d8a05a]"
                  : "border-[#2a3819] bg-[#0e1209] text-[#9aa886] hover:text-[#e6dcc0]"
              )}
            >
              {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
          </div>
        </div>
        {/* thin segmented mission progress strip */}
        <div className="h-[7px] w-full bg-[#0a0d08]">
          <div className="flex h-full gap-[2px] px-[2px]">
            {QUESTIONS.map((x, i) => (
              <button
                key={x.id}
                type="button"
                aria-label={`Question ${x.n}`}
                onClick={() => onNavigate(i)}
                className={cn(
                  "h-full flex-1 rounded-[1px] transition-colors",
                  i === session.current
                    ? "bg-[#ffb400]"
                    : questionAnswered(x, session.answers)
                      ? "bg-[#6f8c3e]"
                      : "bg-[#232d15] hover:bg-[#37431f]"
                )}
              />
            ))}
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto grid w-full max-w-6xl gap-5 px-3 py-6 sm:px-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* --------------------------- Question card --------------------------- */}
        <section
          key={q.id}
          className="hud-panel hud-corners crate-glow fade-up rounded-xl"
          aria-live="polite"
        >
          {/* crate top stripe */}
          <div className="stripe-edge h-2 rounded-t-xl" aria-hidden="true" />
          <div className="px-5 pt-5 pb-6 sm:px-7">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-hud inline-flex items-center gap-1.5 rounded-sm border border-[#b58500] bg-[#221a03] px-2.5 py-1 text-[10px] font-black tracking-[0.18em] text-[#ffb400] uppercase">
                <Package className="h-3.5 w-3.5" />
                Supply {String(q.n).padStart(2, "0")} / 35
              </span>
              <span className="hud-chip">
                {SKILL_ICON[q.skill]}
                {q.skill}
              </span>
              <span className="hud-chip">
                <Crosshair className="h-3.5 w-3.5" />
                {q.marks} {q.marks === 1 ? "mark" : "marks"}
              </span>
              <span className="hud-chip ml-auto hidden sm:inline-flex">
                Lesson {q.lesson}
              </span>
            </div>

            <h2 className="font-hud mt-4 text-xl font-black tracking-wide text-[#f4ecd4] uppercase sm:text-[22px]">
              {q.title}
            </h2>
            <p className="mt-1 text-[16px] leading-snug font-semibold text-[#a9c37e]">
              {q.instruction}
            </p>

            {q.passage && (
              <div className="mt-4 rounded-lg border border-[#37431f] bg-[#111a0b]/85 p-4">
                <p className="font-hud mb-2 flex items-center gap-1.5 text-[9.5px] font-bold tracking-[0.28em] text-[#8fbf5f] uppercase">
                  <Target className="h-3.5 w-3.5" /> Intel file — read carefully
                </p>
                <p className="text-[17px] leading-relaxed font-medium text-[#efe7cf]">
                  {q.passage}
                </p>
              </div>
            )}

            {q.wordBank && (
              <div className="mt-4 flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-[#3d4d22] bg-[#0c100a]/70 px-3.5 py-2.5">
                <span className="font-hud text-[9.5px] font-bold tracking-[0.24em] text-[#8fa06d] uppercase">
                  Supply box:
                </span>
                {q.wordBank.map((w) => (
                  <span
                    key={w}
                    className="rounded border border-[#55682c] bg-[#1c2610] px-2.5 py-1 text-[15px] font-bold text-[#d6e2b8]"
                  >
                    {w}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-4 grid gap-3">
              {q.parts.map((p) => (
                <PartRenderer
                  key={p.id}
                  question={q}
                  part={p}
                  value={session.answers[p.id]}
                  onAnswer={onAnswer}
                />
              ))}
            </div>

            {/* prev / next */}
            <div className="mt-6 flex items-center justify-between gap-3">
              <button
                type="button"
                className="btn-ghost inline-flex items-center gap-1.5 rounded-md px-4 py-2.5 text-[11px] font-bold"
                disabled={session.current === 0}
                onClick={() => onNavigate(session.current - 1)}
              >
                <ChevronLeft className="h-4 w-4" /> Previous
              </button>
              <span className="font-hud text-[10px] tracking-[0.2em] text-[#5c6a45] uppercase">
                Target {String(q.n).padStart(2, "0")} · 35
              </span>
              <button
                type="button"
                className="btn-ghost inline-flex items-center gap-1.5 rounded-md px-4 py-2.5 text-[11px] font-bold"
                disabled={session.current === QUESTIONS.length - 1}
                onClick={() => onNavigate(session.current + 1)}
              >
                Next <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>

        {/* ------------------------------ Right rail ---------------------------- */}
        <aside className="flex flex-col gap-4">
          {/* mission status */}
          <div className="hud-panel rounded-xl p-4">
            <p className="font-hud text-[10px] font-bold tracking-[0.24em] text-[#8fa06d] uppercase">
              Mission Status
            </p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-hud text-3xl font-black text-[#ffd75e] tabular-nums">
                {answeredCount}
              </span>
              <span className="font-hud text-[12px] font-semibold tracking-widest text-[#8fa06d]">
                / 35 TARGETS SECURED
              </span>
            </div>
            <div className="mt-3 h-2.5 overflow-hidden rounded-full border border-[#2a3819] bg-[#0a0d08]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#6f8c3e] via-[#a5b653] to-[#ffb400] transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-2 font-hud text-[9.5px] tracking-[0.2em] text-[#5c6a45] uppercase">
              Zone coverage {progress}% · {unanswered} remaining
            </p>

            {/* legend */}
            <div className="mt-4 grid grid-cols-3 gap-1.5 text-center">
              {(["done", "current", "empty"] as const).map((s) => (
                <div key={s} className="flex flex-col items-center gap-1">
                  <span
                    className="marker font-hud flex h-7 w-7 items-center justify-center rounded border text-[10px] font-bold"
                    data-state={s === "current" ? "current" : s}
                  >
                    {s === "done" ? "12" : s === "current" ? "▸" : "·"}
                  </span>
                  <span className="font-hud text-[8px] tracking-[0.18em] text-[#5c6a45] uppercase">
                    {s === "done" ? "Answered" : s === "current" ? "Current" : "Waiting"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* question map */}
          <div className="hud-panel rounded-xl p-4">
            <p className="font-hud mb-3 flex items-center gap-2 text-[10px] font-bold tracking-[0.24em] text-[#8fa06d] uppercase">
              <Flag className="h-3.5 w-3.5 text-[#ffb400]" /> Tactical Map
            </p>
            <div className="grid grid-cols-7 gap-1.5">
              {QUESTIONS.map((x, i) => {
                const done = questionAnswered(x, session.answers);
                const current = i === session.current;
                return (
                  <button
                    key={x.id}
                    type="button"
                    onClick={() => onNavigate(i)}
                    aria-label={`Go to question ${x.n}${done ? " (answered)" : " (unanswered)"}`}
                    className="marker font-hud flex h-9 items-center justify-center rounded border text-[11px] font-bold"
                    data-state={current ? (done ? "current-done" : "current") : done ? "done" : "empty"}
                  >
                    {x.n}
                  </button>
                );
              })}
            </div>
          </div>

          {/* submit */}
          <div className="hud-panel hud-corners rounded-xl p-4">
            <button
              type="button"
              onClick={onSubmit}
              disabled={!allAnswered}
              className="btn-primary flex w-full items-center justify-center gap-2 rounded-md px-5 py-3.5 text-[13px] font-black"
              data-testid="submit-exam"
            >
              <Flag className="h-4 w-4" />
              Submit Exam
            </button>
            {!allAnswered ? (
              <p className="mt-2 text-center text-[13px] font-semibold text-[#d8a05a]">
                Secure {unanswered} more supply {unanswered === 1 ? "crate" : "crates"} to unlock
                submission.
              </p>
            ) : (
              <p className="pulse-amber mt-2 text-center font-hud text-[10px] tracking-[0.18em] text-[#ffd75e] uppercase">
                All targets secured — ready to extract
              </p>
            )}
          </div>

          {/* scope plate */}
          <div className="hud-panel rounded-xl p-4">
            <p className="font-hud text-[9.5px] leading-relaxed tracking-[0.18em] text-[#5c6a45] uppercase">
              Grade 4 · English · Unit 1
            </p>
            <p className="mt-1 text-[13px] font-semibold text-[#8fa06d]">
              {LESSON_TITLES[1]} · {LESSON_TITLES[2]} · {LESSON_TITLES[3]} · {LESSON_TITLES[4]} ·{" "}
              {LESSON_TITLES[5]}
            </p>
            <p className="mt-2 font-hud text-[9.5px] tracking-[0.2em] text-[#55682c] uppercase">
              {TOTAL_MARKS} marks total
            </p>
          </div>
        </aside>
      </main>
    </div>
  );
}
