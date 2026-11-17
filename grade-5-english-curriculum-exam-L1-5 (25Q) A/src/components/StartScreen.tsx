import { useState } from "react";
import hero from "@/assets/paper-hero.jpg";
import ContactStrip from "@/components/ContactStrip";
import { Flower, Ribbon, Star } from "@/components/Decor";

interface Props {
  onStart: (name: string) => void;
  muted: boolean;
  onToggleMute: () => void;
}

export default function StartScreen({ onStart, muted, onToggleMute }: Props) {
  const [name, setName] = useState("");
  const ready = name.trim().length >= 2;

  return (
    <div className="min-h-screen w-full overflow-x-hidden">
      {/* Hero — the examination paper itself */}
      <header className="relative isolate overflow-hidden">
        <img
          src={hero}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover object-right"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-paper/95 via-paper/85 to-blush/70" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(253,246,251,0.35),rgba(253,246,251,0.95))]" />

        <div className="relative mx-auto flex max-w-3xl flex-col px-4 pb-10 pt-8 sm:px-6 sm:pb-14 sm:pt-12">
          <TopBar muted={muted} onToggleMute={onToggleMute} />

          <div className="mt-10 flex items-center gap-3">
            <Flower className="h-7 w-7 shrink-0 text-lilac drift" />
            <p className="eyebrow text-lilac-deep">English Full Curriculum · Model A</p>
            <span className="hidden h-px flex-1 bg-lilac-pale sm:block" />
          </div>

          <h1 className="mt-4 font-display text-[clamp(2.3rem,10vw,4.6rem)] font-black leading-[0.94] tracking-[-0.02em] text-lilac-deep">
            Grade 5
            <span className="block text-ink">Examination</span>
          </h1>

          <Ribbon className="mt-3 h-9 w-32 text-lilac/70 sm:w-40" />

          <p className="mt-3 max-w-xl text-[16px] leading-relaxed text-ink-soft sm:text-[17px]">
            Unit 1 · Lessons 1 to 5 —{" "}
            <strong className="font-extrabold text-lilac-deep">At School, Family, Daily Routines, The Five Senses</strong>{" "}
            and <strong className="font-extrabold text-lilac-deep">Clothes</strong>.
            Twenty-five questions, four marks each.
          </p>

          <ul className="mt-6 flex flex-wrap gap-2">
            {["25 questions", "100 marks", "2 reading texts", "Count-up stopwatch", "Saved automatically"].map(
              (t, i) => (
                <li
                  key={t}
                  className={
                    "rounded-full border px-3 py-1.5 text-[12px] font-extrabold tracking-wide " +
                    [
                      "border-lilac-pale bg-lavender text-lilac-deep",
                      "border-blush bg-blush text-lilac-deep",
                      "border-peach-pale bg-peach-pale text-[#b4593a]",
                      "border-mint bg-mint text-[#2f8f89]",
                      "border-lilac-pale bg-white text-ink-soft",
                    ][i]
                  }
                >
                  {t}
                </li>
              ),
            )}
          </ul>

          {/* Name gate */}
          <div className="relative mt-8 rounded-[28px] border border-white bg-white/90 p-5 shadow-[0_30px_60px_-45px_rgba(110,63,151,0.9)] backdrop-blur sm:p-7">
            <Star className="absolute -top-3 -right-3 h-7 w-7 text-peach" />
            <label htmlFor="student-name" className="eyebrow block text-lilac-deep">
              Write your full name
            </label>
            <input
              id="student-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              placeholder="e.g. Layan Al-Ahmad"
              className="mt-3 w-full rounded-2xl border-2 border-lilac-pale bg-paper px-4 py-3.5 text-[17px] font-semibold text-ink placeholder:font-normal placeholder:text-ink-soft/60 focus:border-lilac focus:bg-white focus:outline-none"
            />
            <p className="mt-2 text-[13px] text-ink-soft">
              Your name is required before the exam can begin. The stopwatch starts only when you
              press <strong className="text-lilac-deep">Start Exam</strong>.
            </p>

            <button
              type="button"
              disabled={!ready}
              onClick={() => onStart(name.trim())}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-lilac-deep px-6 py-4 text-[17px] font-extrabold text-white transition enabled:hover:bg-lilac enabled:active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-lilac-pale disabled:text-lilac"
            >
              Start Exam
              <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                <path
                  d="M5 12h13M13 6l6 6-6 6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            <div className="mt-4 grid gap-2 text-[13px] leading-relaxed text-ink-soft sm:grid-cols-2">
              <p className="rounded-2xl bg-lavender px-3 py-2.5">
                Answers are saved on this device — refreshing will restore your attempt, not restart
                it.
              </p>
              <p className="rounded-2xl bg-mint px-3 py-2.5">
                No answers, hints or scores are shown during the exam. Feedback comes after you
                submit.
              </p>
            </div>
          </div>
        </div>
      </header>

      <ContactStrip />
    </div>
  );
}

function TopBar({ muted, onToggleMute }: { muted: boolean; onToggleMute: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 rounded-full border border-lilac-pale bg-white/85 px-3 py-1.5">
        <span className="h-2 w-2 rounded-full bg-turquoise" />
        <span className="eyebrow text-lilac-deep">Unit 1 · Lessons 1–5</span>
      </div>
      <button
        type="button"
        onClick={onToggleMute}
        aria-pressed={muted}
        className="flex items-center gap-1.5 rounded-full border border-lilac-pale bg-white/85 px-3 py-2 text-[12px] font-extrabold text-lilac-deep transition active:scale-95"
      >
        <SoundGlyph muted={muted} />
        {muted ? "Sound off" : "Sound on"}
      </button>
    </div>
  );
}

function SoundGlyph({ muted }: { muted: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path d="M4 9.5h3.2L12 5.4v13.2L7.2 14.5H4z" fill="currentColor" />
      {muted ? (
        <path
          d="M16 9.6l4.6 4.8M20.6 9.6L16 14.4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      ) : (
        <path
          d="M15.4 9a4.2 4.2 0 010 6M18 6.4a7.8 7.8 0 010 11.2"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}
