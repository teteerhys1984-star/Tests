import { useEffect, useMemo, useState } from "react";
import banner from "@/assets/banner.jpg";
import Contact from "@/components/Contact";
import { LESSONS, type ExamResult, type QuestionResult } from "@/data/exam";
import { downloadReport } from "@/lib/report";
import { formatDuration } from "@/lib/storage";

function useCountUp(target: number, ms = 1100) {
  const [v, setV] = useState(0);
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setV(target);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / ms);
      setV(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return v;
}

function scoreColor(pct: number) {
  if (pct >= 85) return "#1FC77A";
  if (pct >= 70) return "#0B5CFF";
  if (pct >= 55) return "#FF7A18";
  return "#E4453A";
}

function Dial({ score }: { score: number }) {
  const pct = score / 100;
  const shown = useCountUp(score);
  const C = 2 * Math.PI * 66;
  const color = scoreColor(score);
  return (
    <div className="relative h-[172px] w-[172px] shrink-0">
      <svg viewBox="0 0 160 160" className="h-full w-full -rotate-90">
        <circle cx="80" cy="80" r="66" fill="none" stroke="#E7EEFA" strokeWidth="15" />
        <circle
          cx="80"
          cy="80"
          r="66"
          fill="none"
          stroke={color}
          strokeWidth="15"
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={C * (1 - pct)}
          style={{ transition: "stroke-dashoffset 1.1s cubic-bezier(.2,.8,.2,1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-[46px] font-black leading-none tabular-nums" style={{ color }}>
          {shown}
        </span>
        <span className="mt-0.5 text-[13px] font-black uppercase tracking-[0.14em] text-ink/45">out of 100</span>
      </div>
    </div>
  );
}

function QuestionReview({ r, index }: { r: QuestionResult; index: number }) {
  const correct = r.earned === r.available;
  return (
    <article className="overflow-hidden rounded-[22px] border border-hair bg-white shadow-card">
      <header
        className={[
          "flex flex-wrap items-center gap-2.5 border-b border-hair px-4 py-3 sm:px-5",
          correct ? "bg-grass/10" : "bg-flame/10",
        ].join(" ")}
      >
        <span className="grid h-9 min-w-9 place-items-center rounded-lg bg-white px-2 font-display text-[15px] font-black tabular-nums ring-1 ring-hair">
          Q{r.question.id}
        </span>
        <span className="min-w-0 flex-1 truncate text-[14px] font-bold text-ink/75">{r.question.typeLabel}</span>
        <span
          className={[
            "rounded-full px-2.5 py-1 font-display text-[13px] font-black tabular-nums",
            correct ? "bg-grass text-white" : "bg-flame text-white",
          ].join(" ")}
        >
          {r.earned}/{r.available}
        </span>
        <span className="w-full text-[11px] font-black uppercase tracking-[0.14em] text-ink/45 sm:w-auto">
          {LESSONS.find((l) => l.id === r.question.lesson)?.title}
        </span>
      </header>

      <div className="px-4 py-4 sm:px-5">
        <p className="text-[15.5px] font-semibold leading-relaxed text-ink">
          <span className="mr-2 inline-grid h-6 min-w-6 place-items-center rounded-md bg-paper px-1 text-[12px] font-black tabular-nums text-ink/55 align-middle">
            {index + 1}
          </span>
          {r.question.instruction}
        </p>

        <div className="mt-4 space-y-3">
          {r.parts.map((p, i) => (
            <div
              key={i}
              className={[
                "rounded-2xl border-2 px-3.5 py-3",
                p.ok ? "border-grass/40 bg-grass/[0.06]" : "border-flame/40 bg-flame/[0.06]",
              ].join(" ")}
            >
              <div className="flex items-start gap-2.5">
                <span
                  className={[
                    "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-[12px] font-black text-white",
                    p.ok ? "bg-grass" : "bg-flame",
                  ].join(" ")}
                  aria-hidden="true"
                >
                  {p.ok ? "✓" : "✕"}
                </span>
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="text-[14.5px] leading-snug text-ink/80">
                    <span className="font-black text-ink/50">Your answer:</span>{" "}
                    <span className="break-words">{p.student}</span>
                  </p>
                  <p className="text-[14.5px] leading-snug text-ink">
                    <span className="font-black text-grass">Correct answer:</span>{" "}
                    <span className="break-words font-semibold">{p.correct}</span>
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-2xl bg-paper px-3.5 py-3">
          <p className="text-[14px] leading-relaxed text-ink/70">
            <span className="font-black text-ink/80">Why:</span> {r.question.explanation}
          </p>
          <p className="mt-2 text-[13px] font-semibold text-ink/50">
            <span className="font-black text-ink/60">Source:</span> {r.question.ref}
            {r.question.passage && (
              <span>
                {" "}
                · Passage:{" "}
                {r.question.passage === "p1" ? "Schools in the Past, Present and Future" : "My Amazing Journey"}
              </span>
            )}
          </p>
        </div>
      </div>
    </article>
  );
}

export default function Results({ result, onRetake }: { result: ExamResult; onRetake: () => void }) {
  const [lessonFilter, setLessonFilter] = useState<0 | 1 | 2 | 3>(0);
  const [wrongOnly, setWrongOnly] = useState(false);

  const totalParts = result.questions.reduce((s, q) => s + q.available, 0);
  const correctParts = result.questions.reduce((s, q) => s + q.earned, 0);

  const list = useMemo(
    () =>
      result.questions.filter(
        (q) =>
          (lessonFilter === 0 || q.question.lesson === lessonFilter) &&
          (!wrongOnly || q.earned < q.available),
      ),
    [result, lessonFilter, wrongOnly],
  );

  const grade =
    result.percent >= 90 ? "Excellent" : result.percent >= 75 ? "Very good" : result.percent >= 60 ? "Good" : "Needs more practice";

  return (
    <div className="min-h-screen bg-paper text-ink">
      {/* banner */}
      <div className="relative overflow-hidden">
        <img src={banner} alt="" aria-hidden="true" className="h-44 w-full object-cover sm:h-56" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink/75 via-ink/45 to-transparent" />
        <div className="absolute inset-0 flex items-center">
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
            <span className="inline-block rounded-full bg-sun px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-ink">
              Model A · Results
            </span>
            <h1 className="mt-2 font-display text-[clamp(1.7rem,6vw,3rem)] font-black leading-[1.02] text-white drop-shadow-sm">
              {result.name}
            </h1>
            <p className="mt-1 text-[14px] font-bold text-white/85 sm:text-[15px]">
              Grade 8 · Unit 1 · Lessons 1, 2 and 3 · {new Date(result.submittedAt).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-4 pt-6 sm:px-6">
        {/* scoreboard */}
        <section className="rounded-[26px] border border-hair bg-white p-5 shadow-lift sm:p-7">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
            <Dial score={result.total} />
            <div className="min-w-0 flex-1 text-center sm:text-left">
              <p className="font-display text-[13px] font-black uppercase tracking-[0.16em] text-ink/45">
                Overall performance
              </p>
              <p className="mt-1 font-display text-[clamp(1.6rem,5vw,2.4rem)] font-black leading-none">
                {result.percent}% <span className="text-ink/40">·</span>{" "}
                <span style={{ color: scoreColor(result.percent) }}>{grade}</span>
              </p>
              <p className="mt-2 text-[15px] text-ink/65">
                {correctParts} of {totalParts} marks earned across {result.questions.length} questions.
              </p>
              <div className="mt-4 grid gap-2.5 sm:grid-cols-3">
                {[
                  { k: "Time spent", v: formatDuration(result.timeSpentMs) },
                  { k: "Submitted", v: new Date(result.submittedAt).toLocaleTimeString() },
                  { k: "Correct answers", v: `${correctParts}/${totalParts}` },
                ].map((s) => (
                  <div key={s.k} className="rounded-2xl bg-paper px-3 py-3">
                    <div className="text-[11px] font-black uppercase tracking-[0.12em] text-ink/45">{s.k}</div>
                    <div className="mt-1 font-display text-[17px] font-black tabular-nums">{s.v}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* lesson scores */}
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {result.lessons.map((l, i) => {
              const pct = Math.round((l.score / l.marks) * 100);
              const color = LESSONS[i].color;
              return (
                <div key={l.id} className="rounded-[20px] border border-hair bg-white p-4">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-[13px] font-black uppercase tracking-[0.1em] text-ink/55">
                      Lesson {l.id} · {l.title}
                    </span>
                    <span className="font-display text-[20px] font-black tabular-nums" style={{ color }}>
                      {l.score}/{l.marks}
                    </span>
                  </div>
                  <div className="mt-2.5 h-3 overflow-hidden rounded-full bg-hair">
                    <div
                      className="h-full rounded-full transition-[width] duration-700"
                      style={{ width: `${pct}%`, background: color }}
                    />
                  </div>
                  <div className="mt-1.5 text-[12px] font-bold text-ink/45">{pct}%</div>
                </div>
              );
            })}
          </div>

          {/* actions */}
          <div className="mt-6 flex flex-col gap-3 border-t border-hair pt-5 sm:flex-row sm:flex-wrap">
            <button
              type="button"
              onClick={() => downloadReport(result)}
              className="inline-flex min-h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-electric px-6 font-display text-[16px] font-extrabold text-white shadow-[0_6px_0_0_#0A3FB8] transition active:translate-y-[3px] active:shadow-[0_3px_0_0_#0A3FB8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-electric"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 3v12m0 0 4-4m-4 4-4-4M4 19h16" />
              </svg>
              Download TXT report
            </button>
            <button
              type="button"
              onClick={() => downloadReport(result)}
              className="inline-flex min-h-14 flex-1 items-center justify-center gap-2 rounded-2xl border-2 border-hair bg-white px-6 font-display text-[16px] font-extrabold text-ink transition hover:border-electric/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-electric"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 3v12m0 0 4-4m-4 4-4-4M4 19h16" />
              </svg>
              Backup: download again
            </button>
            <button
              type="button"
              onClick={onRetake}
              className="inline-flex min-h-14 flex-1 items-center justify-center rounded-2xl border-2 border-flame/40 bg-flame/10 px-6 font-display text-[16px] font-extrabold text-flame transition hover:bg-flame hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flame"
            >
              Start a new attempt
            </button>
          </div>
          <p className="mt-3 text-[13px] text-ink/50">
            The TXT report includes every question, your answer, the correct answer, the marks and the source page
            reference. Starting a new attempt asks for your name again and keeps this report available for download.
          </p>
        </section>

        {/* review */}
        <section className="mt-8">
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="mr-auto font-display text-[20px] font-black">Question-by-question review</h2>
            <div className="flex flex-wrap gap-2">
              {([0, 1, 2, 3] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLessonFilter(l)}
                  className={[
                    "min-h-11 rounded-full px-3.5 text-[13px] font-black transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-electric",
                    lessonFilter === l ? "bg-ink text-white" : "bg-white text-ink/60 ring-1 ring-hair hover:ring-electric/40",
                  ].join(" ")}
                >
                  {l === 0 ? "All" : `Lesson ${l}`}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setWrongOnly((v) => !v)}
                aria-pressed={wrongOnly}
                className={[
                  "min-h-11 rounded-full px-3.5 text-[13px] font-black transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-flame",
                  wrongOnly ? "bg-flame text-white" : "bg-white text-ink/60 ring-1 ring-hair hover:ring-flame/40",
                ].join(" ")}
              >
                Incorrect only
              </button>
            </div>
          </div>

          <div className="mt-4 space-y-4">
            {list.length === 0 ? (
              <div className="rounded-[22px] border-2 border-dashed border-grass/50 bg-grass/[0.07] px-5 py-10 text-center">
                <p className="font-display text-[19px] font-black text-[#0E9B58]">Nothing to review here.</p>
                <p className="mt-1 text-[15px] text-ink/65">No incorrect answers in this filter — well done.</p>
              </div>
            ) : (
              list.map((q) => <QuestionReview key={q.question.id} r={q} index={q.question.id - 1} />)
            )}
          </div>
        </section>

        <section className="mt-8 rounded-[24px] border-2 border-electric/25 bg-electric/[0.05] p-5 sm:p-6">
          <h2 className="font-display text-[18px] font-black">What to revise next</h2>
          <ul className="mt-3 space-y-2 text-[15px] leading-relaxed text-ink/75">
            <li>• Lesson 1 — future forms: use <strong>will</strong> for decisions, promises and facts, and <strong>be going to</strong> for plans made before speaking.</li>
            <li>• Lesson 2 — the longer action in progress takes the past progressive; the shorter interrupting action takes the past simple.</li>
            <li>• Lesson 3 — present perfect is <strong>have/has + past participle</strong>; in reported speech the tense shifts back one step.</li>
          </ul>
        </section>
      </main>

      <Contact />
    </div>
  );
}
