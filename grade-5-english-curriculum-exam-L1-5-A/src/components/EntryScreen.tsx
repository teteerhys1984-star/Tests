import { useState } from "react";
import cover from "@/assets/cover.jpg";
import ContactFooter from "@/components/ContactFooter";
import { LESSONS, LESSON_ORDER, TOTAL_MARKS, TOTAL_QUESTIONS } from "@/data/exam";

interface Props {
  hasSavedAttempt: boolean;
  savedName: string;
  onStart: (name: string) => void;
  onOpenTeacherKey: () => void;
}

const DETAILS: Array<[string, string]> = [
  ["Grade", "5"],
  ["Subject", "English"],
  ["Unit", "Unit 1"],
  ["Lessons", "1 · 2 · 3 · 4 · 5"],
  ["Questions", String(TOTAL_QUESTIONS)],
  ["Marks", String(TOTAL_MARKS)],
];

export default function EntryScreen({ hasSavedAttempt, savedName, onStart, onOpenTeacherKey }: Props) {
  const [name, setName] = useState(savedName);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onStart(trimmed);
  };

  return (
    <div className="min-h-screen">
      {/* ---- Cover ------------------------------------------------------ */}
      <header className="relative overflow-hidden border-b-[4px] border-ink/80">
        <img
          src={cover}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover object-right"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to right, rgba(10,110,120,0.97) 0%, rgba(14,154,167,0.9) 45%, rgba(14,154,167,0.45) 100%)",
          }}
        />
        <div className="paper-grain absolute inset-0 opacity-[0.12] mix-blend-multiply" />

        <div className="relative mx-auto max-w-6xl px-4 pt-8 pb-12 md:px-8 md:pt-12 md:pb-16">
          <p className="label-caps text-[#bff0f3]">English Full Curriculum · Examination booklet</p>
          <div className="mt-3 inline-block rotate-[-1.2deg] border-[3px] border-white/85 bg-white/95 px-4 py-2">
            <span className="label-caps text-turq-deep">Model A · Official paper</span>
          </div>

          <h1
            className="mt-6 max-w-[16ch] text-[clamp(2.6rem,8.5vw,6rem)] leading-[0.92] tracking-tight text-white"
            style={{ fontFamily: "var(--font-display)" }}
          >
            GRADE 5
            <span className="block text-[#ffe9a8]">ENGLISH</span>
            <span className="block text-[0.44em] leading-tight tracking-[0.06em] text-white/95">
              UNIT 1 EXAMINATION
            </span>
          </h1>

          <div className="mt-7 flex flex-wrap gap-2">
            {LESSON_ORDER.map((id) => (
              <span
                key={id}
                className="label-caps rounded-full px-3 py-1.5 text-white"
                style={{ backgroundColor: LESSONS[id].color }}
              >
                L{LESSONS[id].no} · {LESSONS[id].title}
              </span>
            ))}
          </div>
        </div>
      </header>

      {/* ---- Body ------------------------------------------------------- */}
      <main className="mx-auto max-w-6xl px-4 py-10 md:px-8">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          {/* Details card */}
          <section className="paper-card relative rounded-sm p-6 md:p-8">
            <span className="absolute -top-3 left-6 rotate-[-1deg] bg-yellow px-3 py-1 label-caps text-ink">
              What is in this paper
            </span>
            <p className="mt-3 max-w-[58ch] text-[1.05rem] leading-relaxed text-ink">
              This examination covers <strong>Unit 1</strong> of the Grade 5 Pupil&rsquo;s Book, pages 3–20:
              five lessons, ten questions each. Every question is worth two marks.
            </p>

            <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-0 sm:grid-cols-3">
              {DETAILS.map(([k, v]) => (
                <div key={k} className="border-t-2 border-dotted border-turq/40 py-3">
                  <dt className="label-caps text-ink-soft">{k}</dt>
                  <dd className="tabular mt-1 text-2xl font-semibold text-turq-deep">{v}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-6 rounded-sm border-l-4 border-coral bg-coral/8 p-4 text-sm leading-relaxed text-ink">
              <strong className="label-caps block text-coral">Before you start</strong>
              The timer starts only when you press <strong>Start Exam</strong>. It counts up and keeps
              running if you refresh the page. Your answers are saved automatically. You can move between
              questions, but <strong>Submit Exam</strong> unlocks only when every question is answered.
            </div>
          </section>

          {/* Name / start card */}
          <section className="paper-card rounded-sm p-6 md:p-8">
            <p className="label-caps text-purple">Pupil details</p>
            <h2 className="mt-2 text-3xl leading-tight" style={{ fontFamily: "var(--font-display)" }}>
              Write your full name
            </h2>

            {hasSavedAttempt && (
              <p className="mt-4 rounded-sm border-2 border-green/40 bg-green/10 px-3 py-2 text-sm text-ink">
                A saved attempt for <strong>{savedName}</strong> was found and will be continued exactly
                where it was left.
              </p>
            )}

            <form onSubmit={submit} className="mt-6">
              <label htmlFor="pupil-name" className="label-caps text-ink-soft">
                Full name
              </label>
              <input
                id="pupil-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                placeholder="e.g. Layla Ahmad Hamdan"
                className="mt-2 w-full border-0 border-b-[3px] border-ink/30 bg-transparent px-1 pb-2 pt-1 text-2xl text-ink outline-none transition focus:border-bright"
                style={{ fontFamily: "var(--font-body)" }}
              />
              <p className="mt-2 text-xs text-ink-soft">
                Your name is printed on the results page and the downloadable report.
              </p>

              <button
                type="submit"
                disabled={!name.trim()}
                className="mt-7 w-full rounded-full bg-bright px-6 py-4 text-lg font-bold text-white shadow-[0_4px_0_#164fa6] transition active:translate-y-[2px] active:shadow-[0_2px_0_#164fa6] disabled:cursor-not-allowed disabled:bg-ink/25 disabled:shadow-none"
              >
                Start Exam
              </button>
            </form>

            <ul className="mt-6 space-y-2 text-sm text-ink-soft">
              <li className="flex gap-2">
                <span className="text-turq">◆</span> No answers, marks or hints are shown while you work.
              </li>
              <li className="flex gap-2">
                <span className="text-turq">◆</span> {TOTAL_QUESTIONS} questions · {TOTAL_MARKS} marks ·
                count-up timer in HH:MM:SS.
              </li>
              <li className="flex gap-2">
                <span className="text-turq">◆</span> A short sound plays when you start and when you submit.
              </li>
            </ul>
          </section>
        </div>

        {/* Lesson index */}
        <section className="mt-10">
          <p className="label-caps border-b-2 border-coral pb-2 text-ink">Lessons in this paper</p>
          <ol className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {LESSON_ORDER.map((id) => {
              const l = LESSONS[id];
              return (
                <li key={id} className="paper-card rounded-sm p-4" style={{ borderTop: `6px solid ${l.color}` }}>
                  <span className="tabular text-4xl font-semibold" style={{ color: l.color }}>
                    0{l.no}
                  </span>
                  <p className="mt-1 text-lg font-semibold leading-snug text-ink">{l.title}</p>
                  <p className="label-caps mt-2 text-ink-soft">{l.pages}</p>
                  <p className="mt-2 text-sm text-ink-soft">10 questions · 20 marks</p>
                </li>
              );
            })}
          </ol>
        </section>
      </main>

      <ContactFooter showTeacherKey onOpenTeacherKey={onOpenTeacherKey} />
    </div>
  );
}
