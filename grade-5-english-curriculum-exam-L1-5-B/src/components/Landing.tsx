import { useState } from "react";
import heroUrl from "@/assets/hero-classroom.jpg";
import Contact from "@/components/Contact";
import MuteButton from "@/components/MuteButton";
import { LESSONS, TOTAL_QUESTIONS, TOTAL_MARKS } from "@/data/questions";

const FACTS: { label: string; value: string; color: string; text: string }[] = [
  { label: "Grade", value: "5", color: "#FF7A1A", text: "#2E2438" },
  { label: "Unit", value: "1", color: "#1FA8E0", text: "#FFFFFF" },
  { label: "Lessons", value: "1–5", color: "#E8288A", text: "#FFFFFF" },
  { label: "Questions", value: String(TOTAL_QUESTIONS), color: "#7BC400", text: "#2E2438" },
  { label: "Total marks", value: String(TOTAL_MARKS), color: "#FFC400", text: "#2E2438" },
  { label: "Marks each", value: "2", color: "#7A3BE0", text: "#FFFFFF" },
];

export default function Landing({
  onStart,
  onOpenTeacher,
  muted,
  onToggleMute,
  resumeName,
}: {
  onStart: (name: string) => void;
  onOpenTeacher: () => void;
  muted: boolean;
  onToggleMute: () => void;
  resumeName?: string;
}) {
  const [name, setName] = useState(resumeName ?? "");
  const ready = name.trim().length >= 2;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-5 sm:px-6">
      {/* top strip */}
      <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <span className="tab-label cut-sm inline-block bg-ink px-3 py-2 text-paper">
          English Full Curriculum
        </span>
        <MuteButton muted={muted} onToggle={onToggleMute} />
      </header>

      {/* hero */}
      <section className="cut relative overflow-hidden bg-white" style={{ boxShadow: "8px 8px 0 #2E2438" }}>
        <div className="grid md:grid-cols-[1.05fr_1fr]">
          <div className="relative z-10 bg-paper px-5 py-7 sm:px-8 sm:py-9">
            <span
              className="tab-label inline-block -rotate-1 border-[3px] border-ink px-3 py-1.5"
              style={{ background: "#FFC400" }}
            >
              Model B · Second form
            </span>
            <h1 className="mt-4 text-[2.4rem] leading-[0.95] sm:text-[3.2rem]">
              Grade 5 <span style={{ color: "#FF7A1A" }}>English</span>
              <br />
              Unit 1 <span style={{ color: "#1FA8E0" }}>Examination</span>
            </h1>
            <p className="mt-3 max-w-md text-[1.05rem] leading-snug text-ink-soft">
              Lessons 1–5 · Pupil's Book pages <strong className="text-ink">3–20</strong> · every question is
              taken from the printed exercises in your book.
            </p>

            <ul className="mt-5 grid gap-2 sm:grid-cols-2">
              {LESSONS.map((l) => (
                <li key={l.n} className="flex items-center gap-2 text-[0.95rem]">
                  <span
                    className="tnum grid h-7 w-7 shrink-0 place-items-center rounded-full border-[3px] border-ink font-display text-sm font-semibold"
                    style={{ background: l.color, color: l.textOn }}
                  >
                    {l.n}
                  </span>
                  <span className="font-semibold">
                    {l.title} <span className="text-ink-soft">· p. {l.pages}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative min-h-[210px] md:min-h-full">
            <img
              src={heroUrl}
              alt="Paper-cut collage of a classroom board with exercise books and pencils"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(90deg, rgba(255,248,236,0.95) 0%, rgba(255,248,236,0.15) 34%, rgba(255,248,236,0) 60%)",
              }}
            />
          </div>
        </div>
      </section>

      {/* facts */}
      <section className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {FACTS.map((f) => (
          <div key={f.label} className="cut-sm px-3 py-3 text-center" style={{ background: f.color, color: f.text }}>
            <div className="tab-label opacity-80">{f.label}</div>
            <div className="tnum font-display text-[1.9rem] leading-none font-semibold">{f.value}</div>
          </div>
        ))}
      </section>

      {/* start card */}
      <section className="mt-7 grid gap-6 md:grid-cols-[1.15fr_1fr]">
        <div className="cut bg-white px-5 py-6 sm:px-7" style={{ boxShadow: "7px 7px 0 #E8288A" }}>
          <h2 className="text-2xl">Write your full name, then start</h2>
          <p className="mt-1.5 text-[0.97rem] text-ink-soft">
            The timer starts only when you press <strong className="text-ink">Start Exam</strong>. It counts up in
            hours, minutes and seconds and keeps running if you refresh the page.
          </p>

          <label className="tab-label mt-5 block text-ink-soft" htmlFor="pupil-name">
            Student's full name
          </label>
          <input
            id="pupil-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && ready) onStart(name.trim());
            }}
            autoComplete="name"
            placeholder="e.g. Layla Ahmad Hamdan"
            className="cut-sm mt-2 w-full bg-paper px-4 py-3 text-lg font-semibold placeholder:font-normal placeholder:text-ink-soft/70 focus:bg-white"
          />

          <button
            type="button"
            disabled={!ready}
            onClick={() => onStart(name.trim())}
            className="cut mt-4 w-full px-6 py-4 font-display text-xl font-semibold transition-all hover:-translate-y-1 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0"
            style={{ background: ready ? "#FF7A1A" : "#F6EAD6", color: "#2E2438" }}
          >
            Start Exam
          </button>
          {!ready && (
            <p className="mt-2 text-center text-sm text-ink-soft">Please type your full name first.</p>
          )}
        </div>

        <div className="cut bg-ink px-5 py-6 text-paper sm:px-7" style={{ boxShadow: "7px 7px 0 #7BC400" }}>
          <h2 className="text-2xl text-sun">Before you start</h2>
          <ul className="mt-3 space-y-2.5 text-[0.97rem] leading-snug">
            <li>• 50 questions — exactly 10 from each lesson.</li>
            <li>• Each question is worth 2 marks. The paper is out of 100.</li>
            <li>• You can move back and forward between questions at any time.</li>
            <li>• Your answers are saved automatically on this device.</li>
            <li>• No scores, hints or correct answers are shown while you work.</li>
            <li>• The Submit Exam button unlocks only when every answer is written.</li>
            <li>• When you submit, your report opens straight away.</li>
          </ul>

          <button
            type="button"
            onClick={onOpenTeacher}
            className="cut-sm mt-5 inline-flex items-center gap-2 bg-violet px-4 py-2.5 font-display text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
              <path d="M12 2a5 5 0 00-5 5v3H6a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2v-8a2 2 0 00-2-2h-1V7a5 5 0 00-5-5zm-3 8V7a3 3 0 016 0v3H9z" />
            </svg>
            Teacher Answer Key
          </button>
        </div>
      </section>

      <div className="mt-8">
        <Contact />
      </div>
    </div>
  );
}
