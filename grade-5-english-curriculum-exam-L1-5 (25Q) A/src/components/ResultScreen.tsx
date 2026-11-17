import { useEffect, useMemo, useState } from "react";
import ornament from "@/assets/report-seal.jpg";
import ContactStrip from "@/components/ContactStrip";
import { Cross, Flower, Ribbon, Star, Tick } from "@/components/Decor";
import type { Attempt } from "@/lib/attempt";
import { formatClock } from "@/lib/attempt";
import type { ExamResult } from "@/lib/grading";
import { buildReport, downloadText, safeName } from "@/lib/report";

interface Props {
  attempt: Attempt;
  result: ExamResult;
  muted: boolean;
  onToggleMute: () => void;
  onRetake: () => void;
  onOpenTeacher: () => void;
}

export default function ResultScreen({
  attempt,
  result,
  muted,
  onToggleMute,
  onRetake,
  onOpenTeacher,
}: Props) {
  const timeUsed = formatClock((attempt.submittedAt ?? Date.now()) - attempt.startedAt);
  const report = useMemo(() => buildReport(attempt, result), [attempt, result]);
  const filename = `Grade5-Unit1-Exam-Report-${safeName(result.name)}.txt`;
  const [shown, setShown] = useState(0);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setShown(result.score);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / 1100);
      const eased = 1 - Math.pow(1 - p, 3);
      setShown(Math.round(result.score * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [result.score]);

  const pct = Math.round((result.score / result.total) * 100);
  const band =
    pct >= 85
      ? { label: "Excellent", color: "text-turquoise", pill: "bg-mint text-[#2f8f89]" }
      : pct >= 70
        ? { label: "Very good", color: "text-lilac-deep", pill: "bg-lavender text-lilac-deep" }
        : pct >= 50
          ? { label: "Pass", color: "text-[#b4593a]", pill: "bg-peach-pale text-[#b4593a]" }
          : { label: "Needs more practice", color: "text-[#b4593a]", pill: "bg-blush text-[#b4593a]" };

  return (
    <div className="min-h-screen w-full overflow-x-hidden">
      <div className="mx-auto max-w-3xl px-3 pt-5 sm:px-6 sm:pt-9">
        <div className="flex items-center justify-between gap-2">
          <p className="eyebrow text-lilac">Report card · Model A</p>
          <button
            type="button"
            onClick={onToggleMute}
            aria-pressed={muted}
            className="rounded-full border border-lilac-pale bg-white px-3 py-2 text-[12px] font-extrabold text-lilac-deep transition active:scale-95"
          >
            {muted ? "Sound off" : "Sound on"}
          </button>
        </div>

        {/* ── the seal ── */}
        <section className="relative mt-4 overflow-hidden rounded-[30px] border border-lilac-pale bg-white p-5 shadow-[0_36px_70px_-55px_rgba(110,63,151,1)] sm:p-7">
          <div className="paper-grid absolute inset-0 opacity-70" aria-hidden="true" />
          <div className="relative flex flex-col items-center gap-5 sm:flex-row sm:items-start">
            <div className="relative grid h-40 w-40 shrink-0 place-items-center overflow-hidden rounded-full bg-paper ring-[6px] ring-lilac-pale sm:h-44 sm:w-44">
              <img
                src={ornament}
                alt=""
                aria-hidden="true"
                className="seal-in absolute inset-0 h-full w-full object-cover"
              />
              <div className="relative text-center">
                <p className="num font-display text-[54px] font-black leading-none text-lilac-deep sm:text-[62px]">
                  {shown}
                </p>
                <p className="num text-[13px] font-extrabold text-ink-soft">out of {result.total}</p>
              </div>
            </div>

            <div className="min-w-0 flex-1 text-center sm:text-left">
              <p className="eyebrow text-lilac">Final score</p>
              <h1 className="mt-1 break-words font-display text-[clamp(1.9rem,7vw,3rem)] font-black leading-[1.02] text-ink">
                {result.name}
              </h1>
              <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
                <span className={"rounded-full px-3 py-1.5 text-[12.5px] font-extrabold " + band.pill}>
                  {band.label}
                </span>
                <span className="num rounded-full bg-lavender px-3 py-1.5 text-[12.5px] font-extrabold text-lilac-deep">
                  {pct}%
                </span>
                <span className="num rounded-full bg-blush px-3 py-1.5 text-[12.5px] font-extrabold text-lilac-deep">
                  {result.correctItems}/{result.totalItems} parts correct
                </span>
                <span className="num rounded-full bg-mint px-3 py-1.5 text-[12.5px] font-extrabold text-[#2f8f89]">
                  Time {timeUsed}
                </span>
              </div>

              <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-lilac-pale">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-lilac via-lilac-deep to-turquoise transition-[width] duration-1000 ease-out"
                  style={{ width: `${pct}%` }}
                />
              </div>

              <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <button
                  type="button"
                  onClick={() => downloadText(filename, report)}
                  className="min-h-[52px] flex-1 rounded-2xl bg-lilac-deep px-5 text-[15.5px] font-extrabold text-white transition hover:bg-lilac active:scale-[0.99]"
                >
                  Download Report (TXT)
                </button>
                <button
                  type="button"
                  onClick={() => downloadText(filename.replace(".txt", "-backup.txt"), report)}
                  className="min-h-[52px] flex-1 rounded-2xl border-2 border-lilac-pale bg-white px-5 text-[15.5px] font-extrabold text-lilac-deep transition hover:border-lilac active:scale-[0.99]"
                >
                  Backup Copy
                </button>
              </div>
              <p className="mt-2 break-all text-[11.5px] text-ink-soft">File: {filename}</p>

              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={onRetake}
                  className="min-h-[48px] flex-1 rounded-2xl border-2 border-peach-pale bg-peach-pale px-4 text-[14.5px] font-extrabold text-[#b4593a] transition hover:border-peach active:scale-[0.99]"
                >
                  Retake Exam
                </button>
                <button
                  type="button"
                  onClick={onOpenTeacher}
                  className="min-h-[48px] flex-1 rounded-2xl border-2 border-mint bg-mint px-4 text-[14.5px] font-extrabold text-[#2f8f89] transition hover:border-turquoise active:scale-[0.99]"
                >
                  Teacher Answer Key
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ── per-question marking ── */}
        <section className="mt-7 space-y-4">
          <div className="flex items-center gap-2">
            <Flower className="h-5 w-5 text-lilac" />
            <h2 className="font-display text-[22px] font-black text-lilac-deep">
              Question-by-question marking
            </h2>
          </div>

          {result.questions.map((qr) => {
            const full = qr.awarded === qr.marks;
            return (
              <article
                key={qr.question.id}
                className="overflow-hidden rounded-[24px] border border-lilac-pale bg-white shadow-[0_20px_44px_-38px_rgba(110,63,151,1)]"
              >
                <div
                  className={
                    "flex items-center gap-3 border-b border-lilac-pale px-4 py-3 " +
                    (full ? "bg-mint" : "bg-peach-pale")
                  }
                >
                  <span
                    className={
                      "grid h-9 w-9 shrink-0 place-items-center rounded-full font-display text-[17px] font-black " +
                      (full ? "bg-turquoise text-white" : "bg-peach text-white")
                    }
                  >
                    {qr.question.n}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="eyebrow text-ink-soft/80">
                      Lesson {qr.question.lesson} · {qr.question.source.page} ·{" "}
                      {qr.question.source.exercise.split("—")[0].trim()}
                    </p>
                    <p className="truncate text-[13.5px] font-extrabold text-ink">
                      {qr.question.source.skill}
                    </p>
                  </div>
                  <span className="num shrink-0 rounded-full bg-white px-3 py-1.5 text-[14px] font-extrabold text-lilac-deep">
                    {qr.awarded}/{qr.marks}
                  </span>
                </div>

                <div className="divide-y divide-lilac-pale">
                  {qr.items.map((it, idx) => (
                    <div key={it.itemId} className="px-4 py-3.5">
                      <div className="flex items-start gap-2.5">
                        <span
                          className={
                            "mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-white " +
                            (it.isCorrect ? "bg-turquoise" : "bg-peach")
                          }
                        >
                          {it.isCorrect ? (
                            <Tick className="h-3.5 w-3.5" />
                          ) : (
                            <Cross className="h-3.5 w-3.5" />
                          )}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-[14.5px] font-bold leading-snug text-ink">
                            <span className="num mr-1 text-lilac">
                              {String.fromCharCode(97 + idx)}
                            </span>
                            {it.prompt}
                          </p>
                          <div className="mt-2 grid gap-1.5 text-[13.5px] sm:grid-cols-2">
                            <p className="rounded-xl bg-paper px-3 py-2">
                              <span className="eyebrow block text-ink-soft/70">Your answer</span>
                              <span className="font-bold text-ink">
                                {it.student || <em className="font-normal text-ink-soft/70">not answered</em>}
                              </span>
                            </p>
                            <p className="rounded-xl bg-lavender px-3 py-2">
                              <span className="eyebrow block text-lilac">Correct answer</span>
                              <span className="font-extrabold text-lilac-deep">{it.correct}</span>
                            </p>
                          </div>
                          <p className="mt-2 rounded-xl border border-lilac-pale bg-white px-3 py-2 text-[13.5px] leading-relaxed text-ink-soft">
                            <span className="eyebrow mr-1.5 text-lilac">Why</span>
                            {it.explain}
                          </p>
                          <p className="num mt-1.5 text-[12px] font-bold text-ink-soft/75">
                            Mark: {it.awarded} / {it.marks} · Source: Lesson {qr.question.lesson} ·{" "}
                            {qr.question.source.page} · {qr.question.source.exercise}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            );
          })}
        </section>

        <section className="mt-6 rounded-[24px] border border-lilac-pale bg-lavender p-4 sm:p-5">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-peach" />
              <h2 className="font-display text-[19px] font-black text-lilac-deep">Reading texts</h2>
              <Ribbon className="ml-auto h-7 w-24 text-lilac/70" />
            </div>
          <ul className="mt-2 space-y-1.5 text-[13.5px] leading-relaxed text-ink-soft">
            <li>
              <strong className="text-ink">Reading Text A</strong> — Pupil’s Book p. 7 · Activity 6
              (the John family passage).
            </li>
            <li>
              <strong className="text-ink">Reading Text B</strong> — Pupil’s Book p. 13 · Activity 6
              (the five senses passage).
            </li>
            <li>No listening-dependent item appears in this paper; no audio answer has been invented.</li>
          </ul>
        </section>
      </div>

      <ContactStrip />
    </div>
  );
}
