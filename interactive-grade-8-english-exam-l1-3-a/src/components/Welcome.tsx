import { useState } from "react";
import hero from "@/assets/hero.jpg";
import Contact from "@/components/Contact";
import { LESSONS, TOTAL_MARKS, TOTAL_QUESTIONS } from "@/data/exam";

const FACTS = [
  { k: String(TOTAL_QUESTIONS), v: "Questions" },
  { k: String(TOTAL_MARKS), v: "Marks" },
  { k: "2", v: "Reading passages" },
  { k: "3", v: "Lessons" },
];

export default function Welcome({ onStart }: { onStart: (name: string) => void }) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const v = name.trim().replace(/\s+/g, " ");
    if (v.split(" ").filter(Boolean).length < 2) {
      setError("Please enter your full name (first and last name).");
      return;
    }
    setError("");
    onStart(v);
  }

  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 pt-5 sm:px-6">
        <div className="flex items-center gap-2.5">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-electric font-display text-[17px] font-black text-white shadow-[0_5px_0_0_#0A3FB8]">
            E8
          </span>
          <span className="font-display text-sm font-extrabold uppercase tracking-[0.16em] text-ink/70">
            Unit 1 Exam
          </span>
        </div>
        <span className="rounded-full border-2 border-flame bg-flame/10 px-3 py-1.5 text-[12px] font-black uppercase tracking-[0.16em] text-flame">
          Model A
        </span>
      </header>

      <main className="mx-auto max-w-6xl px-4 sm:px-6">
        <p className="mt-4 font-display text-xl font-bold">Interactive Grade 8 English Exam L1-3 A</p>
        {/* Hero */}
        <section className="grid items-center gap-8 pt-8 pb-4 lg:grid-cols-[1.05fr_1fr] lg:gap-12 lg:pt-14">
          <div className="min-w-0">
            <div className="flex flex-wrap gap-2">
              <span className="chip bg-electric/10 text-electric">Grade 8</span>
              <span className="chip bg-turquoise/15 text-[#0A8F8F]">Lessons 1 · 2 · 3</span>
              <span className="chip bg-grass/15 text-[#0E9B58]">English</span>
            </div>

            <h1 className="mt-4 font-display text-[clamp(2.4rem,9vw,4.6rem)] font-black leading-[0.94] tracking-[-0.035em]">
              Future Plans,
              <br />
              <span className="text-electric">School Challenges</span>
              <br />
              &amp; Discovery
            </h1>

            <p className="mt-4 max-w-xl text-[17px] leading-relaxed text-ink/70">
              A complete 100-mark examination covering reading comprehension, tenses, past
              actions in progress, the present perfect and reported speech. Your work is saved
              automatically on this device.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {FACTS.map((f) => (
                <div key={f.v} className="rounded-2xl border border-hair bg-white px-3 py-3 text-center shadow-card">
                  <div className="font-display text-2xl font-black tabular-nums text-ink">{f.k}</div>
                  <div className="mt-0.5 text-[11px] font-bold uppercase tracking-[0.1em] text-ink/50">{f.v}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative min-w-0">
            <div className="overflow-hidden rounded-[26px] border border-hair bg-white shadow-lift">
              <img
                src={hero}
                alt="An open exam booklet, pencil and coloured stationery on a bright desk"
                className="aspect-[4/3] w-full object-cover"
                loading="eager"
              />
            </div>
            <div className="pointer-events-none absolute -bottom-3 left-4 right-4 flex gap-1.5" aria-hidden="true">
              <span className="h-2.5 flex-1 rounded-full bg-electric" />
              <span className="h-2.5 flex-1 rounded-full bg-turquoise" />
              <span className="h-2.5 flex-1 rounded-full bg-flame" />
              <span className="h-2.5 flex-1 rounded-full bg-grass" />
              <span className="h-2.5 flex-1 rounded-full bg-sun" />
            </div>
          </div>
        </section>

        {/* Lessons */}
        <section className="mt-8">
          <h2 className="font-display text-lg font-extrabold uppercase tracking-[0.14em] text-ink/60">
            What is included
          </h2>
          <div className="mt-3 grid gap-3.5 sm:grid-cols-3">
            {LESSONS.map((l, i) => (
              <article
                key={l.id}
                className="relative overflow-hidden rounded-[22px] border border-hair bg-white p-5 shadow-card"
              >
                <span className="absolute inset-x-0 top-0 h-1.5" style={{ background: l.color }} />
                <div className="flex items-start justify-between gap-3">
                  <span
                    className="font-display text-[42px] font-black leading-none tabular-nums"
                    style={{ color: l.color }}
                  >
                    {String(l.id).padStart(2, "0")}
                  </span>
                  <span className="rounded-full bg-paper px-2.5 py-1 text-[11px] font-black uppercase tracking-wider text-ink/55">
                    {l.marks} marks
                  </span>
                </div>
                <h3 className="mt-3 font-display text-[19px] font-extrabold leading-tight">{l.title}</h3>
                <p className="mt-1.5 text-[14px] leading-relaxed text-ink/60">
                  {i === 0 && "Reading comprehension, tenses, present simple and progressive, will / going to."}
                  {i === 1 && "Past simple and past progressive, interrupted actions, verb-form accuracy."}
                  {i === 2 && "Journey reading, present perfect and reported speech."}
                </p>
                <p className="mt-3 text-[13px] font-bold text-ink/45">
                  Questions {l.from}–{l.to}
                </p>
              </article>
            ))}
          </div>
        </section>

        {/* Start form */}
        <section className="mt-8 overflow-hidden rounded-[26px] border-2 border-ink/10 bg-white shadow-lift">
          <div className="grid gap-0 md:grid-cols-[1.2fr_1fr]">
            <div className="p-6 sm:p-8">
              <h2 className="font-display text-[26px] font-black leading-tight sm:text-[32px]">
                Ready? Enter your name to begin.
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-ink/65">
                The timer starts the moment you press <strong className="font-bold">Start Exam</strong>. You can move
                between questions freely — everything is saved as you go.
              </p>

              <form onSubmit={submit} className="mt-5" noValidate>
                <label htmlFor="student-name" className="block text-[13px] font-black uppercase tracking-[0.12em] text-ink/60">
                  Full name
                </label>
                <input
                  id="student-name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (error) setError("");
                  }}
                  placeholder="e.g. Omar Al-Hassan"
                  autoComplete="name"
                  aria-invalid={!!error}
                  aria-describedby={error ? "name-error" : undefined}
                  className="field mt-2"
                />
                <div id="name-error" aria-live="polite" className="min-h-6 text-[14px] font-semibold text-[#D93025]">
                  {error}
                </div>

                <button
                  type="submit"
                  className="mt-1 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-electric px-8 font-display text-[18px] font-extrabold text-white shadow-[0_7px_0_0_#0A3FB8] transition active:translate-y-[4px] active:shadow-[0_3px_0_0_#0A3FB8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-electric sm:w-auto"
                >
                  Start Exam
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </button>
                <p className="mt-3 text-[13px] text-ink/50">
                  A short sound plays when you start and when you submit. You can mute it at any time.
                </p>
              </form>
            </div>

            <div className="relative hidden overflow-hidden md:block">
              <div className="absolute inset-0 bg-gradient-to-br from-electric via-turquoise to-grass opacity-95" />
              <div className="absolute inset-0 lane-stripes opacity-25" />
              <div className="relative flex h-full flex-col justify-center gap-4 p-8 text-white">
                {[
                  "Two official reading passages",
                  "Thirty numbered questions",
                  "Instant, detailed results",
                ].map((t, i) => (
                  <div key={t} className="flex items-center gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/20 font-display text-[15px] font-black tabular-nums">
                      {i + 1}
                    </span>
                    <span className="font-display text-[17px] font-bold leading-snug">{t}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <Contact />
    </div>
  );
}
