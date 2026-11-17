import { useState } from "react";
import hero from "../assets/hero.jpg";
import { LESSONS, TOTAL_MARKS, questionMarks, lessonQuestions } from "../data/exam";
import type { ExamReport } from "../lib/grading";
import { downloadReport } from "../lib/report";
import ContactFooter from "./ContactFooter";
import { KeyIcon, Logo } from "./Icons";

interface Props {
  onStart: (name: string) => void;
  previousReport: ExamReport | null;
  onOpenTeacher: () => void;
}

export default function Welcome({ onStart, previousReport, onOpenTeacher }: Props) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  function handleStart(e: React.FormEvent) {
    e.preventDefault();
    const clean = name.trim().replace(/\s+/g, " ");
    if (clean.length < 2) {
      setError("Please enter your full name before starting.");
      return;
    }
    setError("");
    onStart(clean);
  }

  return (
    <div className="min-h-dvh dot-paper">
      {/* ---------------- hero ---------------- */}
      <header className="relative">
        <div className="relative h-60 w-full overflow-hidden sm:h-80">
          <img
            src={hero}
            alt="Illustration of a school moving from the past into the future"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#08204a]/92 via-[#08204a]/60 to-[#08204a]/10" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#08204a]/70 to-transparent" />

          <span className="absolute right-3 top-3 rotate-6 rounded-xl border-[3px] border-[#0b2a5b] bg-brand-yellow px-3 py-1.5 font-display text-xs uppercase tracking-wide text-[#0b2a5b] sticker-strong sm:right-6 sm:top-6 sm:text-sm">
            Model B
          </span>

          <div className="relative mx-auto flex h-full max-w-3xl flex-col justify-end px-4 pb-5 sm:px-6">
            <div className="mb-3 flex items-center gap-2">
              <Logo className="h-9 w-9 shrink-0 rounded-xl" />
              <span className="rounded-full border border-white/40 bg-white/15 px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-[0.18em] text-white">
                Final exam
              </span>
            </div>
            <h1 className="font-display text-[1.75rem] uppercase leading-[1.02] text-white sm:text-5xl">
              Grade 8 English Examination
            </h1>
            <p className="mt-2 max-w-lg text-sm font-bold leading-snug text-white/90 sm:text-base">
              <span className="rounded-md bg-brand-orange px-1.5 py-0.5 text-[11px] uppercase tracking-wide text-white">
                Model B
              </span>{" "}
              · Unit 1 · Lessons 1, 2 and 3 — Future Plans · School Challenges · Let’s Discover
            </p>
          </div>
        </div>
        <div className="h-2.5 stripe-band" />
      </header>

      {/* ---------------- body ---------------- */}
      <main className="mx-auto max-w-3xl px-4 pb-4 pt-6 sm:px-6">
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {[
            { k: "30", v: "Questions" },
            { k: `${TOTAL_MARKS}`, v: "Marks" },
            { k: "2", v: "Passages" },
          ].map((s) => (
            <div
              key={s.v}
              className="rounded-2xl border-2 border-ink/10 bg-white px-2 py-3 text-center sticker"
            >
              <div className="font-display text-xl text-brand-blue sm:text-2xl">{s.k}</div>
              <div className="text-[11px] font-extrabold uppercase tracking-wider text-ink/65">
                {s.v}
              </div>
            </div>
          ))}
        </div>

        {/* lessons */}
        <section className="mt-5 rounded-3xl border-2 border-ink/10 bg-white p-4 sticker sm:p-5">
          <h2 className="font-display text-base uppercase tracking-wide text-ink sm:text-lg">
            What this exam covers
          </h2>
          <ul className="mt-3 space-y-2.5">
            {LESSONS.map((l) => (
              <li
                key={l.id}
                className="flex items-start gap-3 rounded-2xl border-2 border-ink/10 p-3"
                style={{ backgroundColor: l.soft }}
              >
                <span
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-xl font-display text-sm text-white"
                  style={{ backgroundColor: l.color }}
                >
                  {l.id}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-extrabold leading-tight text-ink sm:text-base">
                    Lesson {l.id} — {l.title}
                  </span>
                  <span className="mt-0.5 block text-xs leading-snug text-ink/65">{l.focus}</span>
                  <span className="mt-1 block text-[11px] font-extrabold uppercase tracking-wider text-ink/60">
                    {lessonQuestions(l.id).length} questions ·{" "}
                    {lessonQuestions(l.id).reduce((s, q) => s + questionMarks(q), 0)} marks
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* start form */}
        <form
          onSubmit={handleStart}
          className="mt-5 rounded-3xl border-[3px] border-[#0b2a5b] bg-white p-4 sticker-strong sm:p-6"
        >
          <h2 className="font-display text-base uppercase tracking-wide text-ink sm:text-lg">
            Student details
          </h2>
          <label
            htmlFor="student-name"
            className="mt-4 block text-xs font-extrabold uppercase tracking-[0.16em] text-ink/60"
          >
            Full name
          </label>
          <input
            id="student-name"
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (error) setError("");
            }}
            placeholder="e.g. Ahmad Al-Ali"
            autoComplete="name"
            aria-invalid={!!error}
            aria-describedby={error ? "name-error" : "name-help"}
            className="mt-1.5 w-full rounded-2xl border-2 border-ink/15 bg-paper px-4 py-3.5 text-base font-bold text-ink placeholder:font-medium placeholder:text-ink/45 focus:border-brand-blue focus:bg-white"
          />
          {error ? (
            <p id="name-error" className="mt-2 text-sm font-bold text-[#d43a1f]">
              {error}
            </p>
          ) : (
            <p id="name-help" className="mt-2 text-xs leading-relaxed text-ink/65">
              Your answers are saved on this device automatically. The timer starts the moment
              you press Start Exam.
            </p>
          )}

          <button
            type="submit"
            className="mt-4 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-brand-blue px-4 font-display text-base uppercase tracking-wide text-white transition-transform active:translate-y-0.5 sm:text-lg"
          >
            Start Exam
          </button>
        </form>

        {previousReport && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-dashed border-ink/20 bg-white/70 px-4 py-3">
            <p className="text-xs leading-snug text-ink/60">
              A previous report ({previousReport.total}/{previousReport.maxTotal}) is saved on
              this device.
            </p>
            <button
              type="button"
              onClick={() => downloadReport(previousReport)}
              className="min-h-10 rounded-xl border-2 border-ink/15 bg-white px-3 text-xs font-extrabold uppercase tracking-wide text-ink/70"
            >
              Download previous report
            </button>
          </div>
        )}
      </main>

      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <button
          type="button"
          onClick={onOpenTeacher}
          className="mx-auto flex min-h-9 items-center gap-1.5 rounded-full px-2 text-[11px] font-bold uppercase tracking-wider text-ink/55"
          title="Teacher Area"
        >
          <KeyIcon className="h-3 w-3" />
          Teacher Area
        </button>
      </div>

      <ContactFooter />
    </div>
  );
}
