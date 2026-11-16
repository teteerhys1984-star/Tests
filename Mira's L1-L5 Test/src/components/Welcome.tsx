import { useState } from "react";
import { BookOpenText, ChevronRight, Clock3, Flower2, Languages, ListChecks, Sparkles, TimerReset } from "lucide-react";
import { EXAM_META } from "../data/examData";
import { Butterfly, Flower, FlowerStem, Sparkle } from "./Decor";

interface WelcomeProps {
  onStart: (name: string) => void;
}

const facts = [
  { icon: ListChecks, text: "35 questions · 13 vocabulary questions" },
  { icon: Languages, text: "Vocabulary: Arabic word → write it in English" },
  { icon: BookOpenText, text: "Unit 1 · Lessons 1–5 (both books)" },
  { icon: TimerReset, text: "Total: 100 marks · take your time" },
  { icon: Clock3, text: "A friendly stopwatch counts up for you" },
];

export default function Welcome({ onStart }: WelcomeProps) {
  const [name, setName] = useState("");
  const [touched, setTouched] = useState(false);
  const valid = name.trim().length >= 2;

  const start = () => {
    setTouched(true);
    if (valid) onStart(name.trim().replace(/\s+/g, " "));
  };

  return (
    <div className="relative mx-auto flex min-h-[70vh] w-full max-w-4xl flex-col items-center justify-center px-4 py-10">
      {/* crown of flowers */}
      <div className="pointer-events-none absolute -top-4 left-1/2 flex -translate-x-1/2 items-end gap-3 opacity-80" aria-hidden>
        <FlowerStem className="h-16 w-10 -rotate-12 text-petal-deep" />
        <FlowerStem className="h-24 w-12 text-lilac-deep" />
        <FlowerStem className="h-20 w-11 rotate-6 text-peach-deep" />
        <FlowerStem className="h-16 w-10 rotate-12 text-rose" />
      </div>

      <div className="paper-card animate-bloom relative mt-20 w-full overflow-hidden rounded-[2.2rem] px-6 py-10 text-center sm:px-12">
        <Sparkle className="absolute left-8 top-8 h-5 w-5 text-gold animate-twinkle" />
        <Sparkle className="absolute right-10 top-14 h-4 w-4 text-lilac-deep animate-twinkle" style={{ animationDelay: "-1.6s" }} />
        <Butterfly className="absolute right-8 top-8 h-8 w-12 text-rose opacity-70 animate-flutter" />

        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-petal to-lilac shadow-soft">
          <Flower2 className="h-8 w-8 text-rose-deep" strokeWidth={2.4} />
        </div>

        <p className="font-serif text-sm font-semibold uppercase tracking-[0.35em] text-violet">
          {EXAM_META.brand}
        </p>
        <h1 className="mt-2 font-display text-4xl font-bold leading-tight text-gradient-rose sm:text-5xl">
          {EXAM_META.title}
        </h1>
        <p className="mt-3 font-display text-lg font-semibold text-ink-soft">
          {EXAM_META.grade} · {EXAM_META.scope}
        </p>

        <p className="mx-auto mt-5 max-w-xl text-[15px] leading-relaxed text-ink-soft">
          Welcome, little gardener! Take a lovely walk through five lessons and let every
          answer bloom. Read each question carefully — your flowers of knowledge are ready to grow.
        </p>

        <div className="mx-auto mt-6 grid max-w-lg grid-cols-1 gap-2.5 sm:grid-cols-2">
          {facts.map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-2.5 rounded-2xl bg-cream-deep/80 px-4 py-2.5 text-left">
              <Icon className="h-4.5 w-4.5 shrink-0 text-rose" strokeWidth={2.4} />
              <span className="text-[13px] font-semibold text-ink">{text}</span>
            </div>
          ))}
        </div>

        <div className="mx-auto mt-8 max-w-md">
          <label htmlFor="student-name" className="mb-2 block font-display text-sm font-bold uppercase tracking-widest text-violet">
            Your full name
          </label>
          <input
            id="student-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && start()}
            placeholder="e.g. Lina Ahmad"
            autoComplete="name"
            className={`w-full rounded-2xl border-2 bg-white/90 px-5 py-3.5 text-center font-display text-lg font-semibold text-ink shadow-soft transition-all placeholder:font-body placeholder:text-sm placeholder:font-normal placeholder:text-ink-soft/50 focus:border-rose focus:shadow-lift ${
              touched && !valid ? "border-rose" : "border-lilac"
            }`}
          />
          {touched && !valid && (
            <p className="mt-2 flex items-center justify-center gap-1.5 text-[13px] font-semibold text-rose-deep animate-rise">
              <Sparkles className="h-3.5 w-3.5" /> Please write your full name to enter the garden.
            </p>
          )}

          <button
            type="button"
            onClick={start}
            disabled={!valid && touched}
            className="group mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-rose to-violet px-8 py-4 font-display text-lg font-bold text-white shadow-lift transition-all hover:scale-[1.025] hover:brightness-105 active:scale-[0.99] disabled:opacity-60"
          >
            Start Exam
            <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1" strokeWidth={2.8} />
          </button>
          <p className="mt-3 text-xs text-ink-soft/80">
            The stopwatch starts only when you press Start Exam.
          </p>
        </div>
      </div>

      <Flower className="pointer-events-none absolute bottom-2 left-6 h-14 w-14 text-peach-deep opacity-60 animate-float" />
      <Flower className="pointer-events-none absolute bottom-10 right-8 h-10 w-10 text-lilac-deep opacity-60 animate-float-slow" />
    </div>
  );
}
