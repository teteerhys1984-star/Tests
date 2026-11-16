/**
 * Start screen: exam title, coverage, instructions and the required
 * Student Full Name field. The timer NEVER runs here — it starts only
 * when the student presses Start Exam.
 */
import { useState } from "react";
import {
  ArrowRight,
  BookOpenCheck,
  ClipboardList,
  FileQuestion,
  HeartHandshake,
  Rocket,
  Timer,
  Volume2,
  VolumeX,
  type LucideIcon,
} from "lucide-react";
import { EXAM_TITLE, TOTAL_MARKS, TOTAL_QUESTIONS } from "../data/questions";
import { cn } from "../utils/cn";

const INSTRUCTIONS = [
  "Answer all 20 questions — every question is worth 5 marks.",
  "Use the question numbers to move freely; your answers are saved automatically.",
  "Reading passages stay inside their question cards so you can re-read them.",
  "Typed answers are checked for correct spelling — capital letters do not matter.",
  "The stopwatch starts when you press Start Exam and keeps running if you refresh.",
  "The Submit Exam button becomes active only when every question is answered.",
];

function MetaCard({
  icon: Icon,
  value,
  label,
  tone,
}: {
  icon: LucideIcon;
  value: string;
  label: string;
  tone: "cyan" | "violet" | "amber" | "emerald";
}) {
  const tones = {
    cyan: "text-cyan-300 border-cyan-400/25 bg-cyan-400/8",
    violet: "text-violet-300 border-violet-400/25 bg-violet-400/8",
    amber: "text-amber-300 border-amber-400/25 bg-amber-400/8",
    emerald: "text-emerald-300 border-emerald-400/25 bg-emerald-400/8",
  } as const;
  return (
    <div className={cn("glass flex items-center gap-3 rounded-2xl px-4 py-3.5")}>
      <span
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-xl border",
          tones[tone],
        )}
      >
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <div className="font-display text-lg font-bold leading-tight text-slate-100">
          {value}
        </div>
        <div className="text-xs font-medium uppercase tracking-wider text-slate-500">
          {label}
        </div>
      </div>
    </div>
  );
}

export function StartScreen({
  onStart,
  muted,
  onToggleMute,
}: {
  onStart: (name: string) => void;
  muted: boolean;
  onToggleMute: () => void;
}) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Please enter your full name before starting the exam.");
      return;
    }
    onStart(trimmed);
  };

  return (
    <div className="animate-fade-up mx-auto w-full max-w-4xl px-4 pb-8 pt-10 sm:pt-16">
      <div className="mb-2 flex justify-end">
        <button
          type="button"
          onClick={onToggleMute}
          className="flex h-9 items-center gap-2 rounded-xl border border-slate-700/80 bg-slate-900/60 px-3 text-xs font-semibold text-slate-400 transition hover:border-slate-500 hover:text-slate-200"
          aria-label={muted ? "Unmute sounds" : "Mute sounds"}
        >
          {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          {muted ? "Sound off" : "Sound on"}
        </button>
      </div>
      <div className="text-center">
        <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-400/25 bg-cyan-400/8 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">
          <BookOpenCheck className="h-3.5 w-3.5" />
          Grade 8 · English · Unit 1
        </div>
        <h1 className="font-display text-4xl font-bold leading-[1.08] tracking-tight text-slate-50 sm:text-6xl">
          Future Plans{" "}
          <span className="bg-gradient-to-r from-cyan-300 via-sky-300 to-violet-300 bg-clip-text text-transparent">
            &amp; School Challenges
          </span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-[15px] leading-relaxed text-slate-400 sm:text-base">
          {EXAM_TITLE}. Lesson 1 covers schools of the past, present and future
          with present and future tenses; Lesson 2 covers school life
          challenges and bullying with past tenses and silent letters.
        </p>
      </div>

      <div className="mt-10 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetaCard icon={FileQuestion} value={String(TOTAL_QUESTIONS)} label="Questions" tone="cyan" />
        <MetaCard icon={ClipboardList} value={String(TOTAL_MARKS)} label="Total marks" tone="amber" />
        <MetaCard icon={Rocket} value="Lesson 1" label="Future Plans (Q1–10)" tone="emerald" />
        <MetaCard icon={HeartHandshake} value="Lesson 2" label="Challenges (Q11–20)" tone="violet" />
      </div>

      <div className="glass mt-6 rounded-3xl p-6 sm:p-8">
        <h2 className="font-display text-lg font-bold text-slate-100">
          Exam instructions
        </h2>
        <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
          {INSTRUCTIONS.map((ins, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-slate-300">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-400" />
              <span className="leading-relaxed">{ins}</span>
            </li>
          ))}
        </ul>

        <div className="mt-8 border-t border-slate-800 pt-6">
          <label
            htmlFor="student-name"
            className="mb-2 block text-sm font-semibold text-slate-200"
          >
            Student Full Name <span className="text-rose-400">*</span>
          </label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              id="student-name"
              type="text"
              dir="ltr"
              value={name}
              autoComplete="name"
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError("");
              }}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="e.g. Sara Ahmad Khalil"
              className={cn(
                "w-full flex-1 rounded-xl border bg-slate-950/70 px-4 py-3 text-[15px] text-slate-100 placeholder:text-slate-600 transition-colors",
                error ? "border-rose-400/70" : "border-slate-700 hover:border-slate-600",
              )}
            />
            <button
              type="button"
              onClick={submit}
              className="group inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-sky-500 px-7 py-3 font-display text-[15px] font-bold text-slate-950 shadow-[0_14px_40px_-12px_rgba(34,211,238,0.7)] transition hover:brightness-110 active:scale-[0.98]"
            >
              <Timer className="h-4 w-4" />
              Start Exam
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
          {error && (
            <p role="alert" className="mt-2.5 text-sm font-medium text-rose-400">
              {error}
            </p>
          )}
          <p className="mt-3 text-xs leading-relaxed text-slate-500">
            Your name is saved only in this browser, together with your answers,
            so you can safely refresh the page while taking the exam.
          </p>
        </div>
      </div>
    </div>
  );
}
