import { useMemo, useState } from "react";
import celebrationUrl from "@/assets/celebration.jpg";
import Contact from "@/components/Contact";
import Confetti from "@/components/Confetti";
import MuteButton from "@/components/MuteButton";
import { LESSONS, lessonMeta } from "@/data/questions";
import type { ExamResult } from "@/lib/grading";
import { downloadReport, formatSubmissionDate } from "@/lib/report";
import { formatHMS } from "@/lib/storage";

interface Props {
  name: string;
  result: ExamResult;
  submittedTs: number;
  elapsedMs: number;
  muted: boolean;
  onToggleMute: () => void;
  onRestart: () => void;
  onOpenTeacher: () => void;
}

function ScoreRing({ score, max }: { score: number; max: number }) {
  const r = 74;
  const circ = 2 * Math.PI * r;
  const pct = max > 0 ? score / max : 0;
  const offset = circ * (1 - pct);
  const colour = pct >= 0.85 ? "#7BC400" : pct >= 0.6 ? "#FFC400" : pct >= 0.4 ? "#FF7A1A" : "#E8288A";
  return (
    <div className="relative h-[190px] w-[190px] shrink-0">
      <svg viewBox="0 0 190 190" className="h-full w-full -rotate-90">
        <circle cx="95" cy="95" r={r} fill="#FFF8EC" stroke="#2E2438" strokeWidth="14" />
        <circle
          cx="95"
          cy="95"
          r={r}
          fill="none"
          stroke={colour}
          strokeWidth="14"
          strokeLinecap="butt"
          strokeDasharray={circ}
          style={
            {
              "--ring-circ": `${circ}`,
              "--ring-offset": `${offset}`,
              animation: "ringDraw 900ms cubic-bezier(.2,.8,.3,1) 120ms both",
            } as React.CSSProperties
          }
        />
      </svg>
      <div className="absolute inset-0 grid place-content-center text-center">
        <div className="tnum font-display text-[3.3rem] leading-none font-semibold">{score}</div>
        <div className="tab-label text-ink-soft">out of {max}</div>
      </div>
    </div>
  );
}

export default function Results({
  name,
  result,
  submittedTs,
  elapsedMs,
  muted,
  onToggleMute,
  onRestart,
  onOpenTeacher,
}: Props) {
  const [showPassages, setShowPassages] = useState(false);

  const perLesson = useMemo(
    () =>
      LESSONS.map((l) => {
        const items = result.questions.filter((q) => q.question.lesson === l.n);
        const earned = items.reduce((s, q) => s + q.earned, 0);
        const max = items.reduce((s, q) => s + q.max, 0);
        return { lesson: l, earned, max, count: items.length };
      }),
    [result]
  );

  return (
    <div className="relative">
      <Confetti />

      <div className="mx-auto w-full max-w-6xl px-3 pb-16 pt-4 sm:px-6">
        <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <span className="tab-label cut-sm inline-block bg-ink px-3 py-2 text-paper">
            Examination report · Model B
          </span>
          <MuteButton muted={muted} onToggle={onToggleMute} />
        </header>

        {/* score panel */}
        <section
          className="cut relative overflow-hidden bg-white"
          style={{ boxShadow: "9px 9px 0 #2E2438" }}
        >
          <div className="absolute inset-0">
            <img src={celebrationUrl} alt="" aria-hidden="true" className="h-full w-full object-cover" />
            <div className="absolute inset-0" style={{ background: "rgba(255,248,236,0.86)" }} />
          </div>

          <div className="relative grid gap-6 px-5 py-6 sm:px-8 sm:py-8 md:grid-cols-[auto_1fr] md:items-center">
            <div className="justify-self-center md:justify-self-start">
              <ScoreRing score={result.score} max={result.maxScore} />
            </div>

            <div>
              <span
                className="tab-label inline-block -rotate-1 border-[3px] border-ink px-3 py-1.5"
                style={{ background: "#7A3BE0", color: "#FFFFFF" }}
              >
                Model B · Grade 5 · Unit 1
              </span>
              <h1 className="mt-3 text-[2rem] leading-none sm:text-[2.6rem]">{name}</h1>
              <p className="mt-2 text-ink-soft">
                Lessons 1–5 · Pupil's Book pages 3–20 · submitted{" "}
                <strong className="text-ink">{formatSubmissionDate(submittedTs)}</strong>
              </p>

              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { k: "Score", v: `${result.score}/${result.maxScore}`, c: "#FF7A1A" },
                  { k: "Correct", v: String(result.correctCount), c: "#7BC400" },
                  { k: "Incorrect", v: String(result.incorrectCount), c: "#E8288A" },
                  { k: "Time", v: formatHMS(elapsedMs), c: "#1FA8E0" },
                ].map((s) => (
                  <div key={s.k} className="cut-flat px-3 py-2.5" style={{ background: s.c, color: "#2E2438" }}>
                    <div className="tab-label opacity-80">{s.k}</div>
                    <div className="tnum font-display text-xl leading-tight font-semibold">{s.v}</div>
                  </div>
                ))}
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() =>
                    downloadReport({ name, result, submittedTs, elapsedMs })
                  }
                  className="cut px-5 py-3 font-display text-lg font-semibold transition-all hover:-translate-y-1"
                  style={{ background: "#FFC400", color: "#2E2438" }}
                >
                  ↓ Download Report (.txt)
                </button>
                <button
                  type="button"
                  onClick={onRestart}
                  className="cut px-5 py-3 font-display text-lg font-semibold transition-all hover:-translate-y-1"
                  style={{ background: "#1FA8E0", color: "#FFFFFF" }}
                >
                  Start a new attempt
                </button>
                <button
                  type="button"
                  onClick={onOpenTeacher}
                  className="cut px-5 py-3 font-display text-lg font-semibold transition-all hover:-translate-y-1"
                  style={{ background: "#7A3BE0", color: "#FFFFFF" }}
                >
                  Teacher Answer Key
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* per lesson summary */}
        <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {perLesson.map(({ lesson, earned, max, count }) => (
            <div key={lesson.n} className="cut-sm bg-white px-3 py-3">
              <div className="flex items-center gap-2">
                <span
                  className="grid h-7 w-7 place-items-center rounded-full border-2 border-ink font-display text-sm font-semibold"
                  style={{ background: lesson.color, color: lesson.textOn }}
                >
                  {lesson.n}
                </span>
                <span className="truncate font-display text-sm font-semibold">{lesson.title}</span>
              </div>
              <div className="tnum mt-2 font-display text-2xl leading-none font-semibold">
                {earned}
                <span className="text-ink-soft"> / {max}</span>
              </div>
              <div className="tab-label text-ink-soft">{count} questions</div>
              <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full border-2 border-ink bg-paper-deep">
                <div
                  className="h-full"
                  style={{ width: `${max ? (earned / max) * 100 : 0}%`, background: lesson.color }}
                />
              </div>
            </div>
          ))}
        </section>

        {/* detailed review */}
        <section className="mt-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-2xl">Question-by-question review</h2>
            <button
              type="button"
              onClick={() => setShowPassages((v) => !v)}
              className="cut-flat bg-white px-3 py-2 font-display text-sm font-semibold transition-transform hover:-translate-y-0.5"
            >
              {showPassages ? "Hide printed passages" : "Show printed passages"}
            </button>
          </div>

          <ol className="mt-4 space-y-4">
            {result.questions.map((qr, i) => {
              const q = qr.question;
              const meta = lessonMeta(q.lesson);
              return (
                <li key={q.id} className="cut bg-white" style={{ boxShadow: "5px 5px 0 #2E2438" }}>
                  <div
                    className="flex flex-wrap items-center justify-between gap-2 border-b-[3px] border-ink px-3.5 py-2"
                    style={{ background: meta.color, color: meta.textOn }}
                  >
                    <span className="tab-label">
                      Q {i + 1} · Lesson {q.lesson} — {meta.title}
                    </span>
                    <span className="tnum tab-label opacity-90">
                      {qr.earned} / {qr.max} marks
                    </span>
                  </div>

                  <div className="px-3.5 py-4 sm:px-5">
                    <div className="tab-label text-ink-soft">
                      {q.exercise} · {q.page}
                    </div>
                    <p className="mt-1.5 text-base font-semibold">{q.instruction}</p>

                    {showPassages && q.context && (
                      <div className="mt-2 border-2 border-dashed border-ink/40 bg-paper px-3 py-2 text-sm whitespace-pre-line">
                        {q.context}
                      </div>
                    )}

                    <div className="mt-3 space-y-3">
                      {qr.parts.map((p, pi) => (
                        <div key={p.partId} className="border-l-[5px] border-ink bg-paper px-3 py-2.5">
                          <p className="text-[0.98rem] font-semibold">
                            {q.parts.length > 1 ? `${String.fromCharCode(97 + pi)}. ` : ""}
                            {q.parts[pi].prompt}
                          </p>

                          <div className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
                            <div
                              className="border-2 border-ink px-2.5 py-1.5"
                              style={{ background: p.correct ? "#E9F7CE" : "#FFE3EF" }}
                            >
                              <span className="tab-label text-ink-soft">Your answer</span>
                              <br />
                              <span className="font-semibold">{p.studentAnswer || "— not answered —"}</span>
                            </div>
                            <div className="border-2 border-ink bg-paper-deep px-2.5 py-1.5">
                              <span className="tab-label text-ink-soft">Correct answer</span>
                              <br />
                              <span className="font-semibold">{p.correctAnswer}</span>
                            </div>
                          </div>

                          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
                            <span
                              className="tnum border-2 border-ink px-2 py-0.5 font-display font-semibold"
                              style={{ background: p.earned === p.max ? "#7BC400" : "#E8288A", color: "#2E2438" }}
                            >
                              {p.earned} / {p.max} marks
                            </span>
                            {p.explanation && (
                              <span className="text-ink-soft">{p.explanation}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>

        <div className="mt-8">
          <Contact />
        </div>
      </div>
    </div>
  );
}
