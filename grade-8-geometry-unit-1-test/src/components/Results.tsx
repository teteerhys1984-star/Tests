import { useMemo, useState } from "react";
import { QUESTIONS } from "../exam/questions";
import { gradeExam } from "../exam/grading";
import type { Answers } from "../exam/types";
import { formatDuration } from "../lib/session";
import { downloadReport } from "../lib/report";
import { Rich } from "../lib/mathx";
import { hasAnswer } from "../lib/answerStatus";
import { playChime } from "../lib/audio";
import { FigureFrame } from "./Chrome";

function ScoreRing({ earned, max }: { earned: number; max: number }) {
  const pct = max ? earned / max : 0;
  const r = 62;
  const circ = 2 * Math.PI * r;
  return (
    <div className="relative grid size-[9.5rem] shrink-0 place-items-center">
      <svg viewBox="0 0 150 150" className="size-full -rotate-90">
        <defs>
          <linearGradient id="ringG" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="50%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#2dd4bf" />
          </linearGradient>
        </defs>
        <circle cx="75" cy="75" r={r} fill="none" stroke="rgba(125,211,252,0.14)" strokeWidth="11" />
        <circle
          cx="75"
          cy="75"
          r={r}
          fill="none"
          stroke="url(#ringG)"
          strokeWidth="11"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - pct)}
          style={{ transition: "stroke-dashoffset 1.1s cubic-bezier(.22,1,.36,1)" }}
        />
      </svg>
      <div className="absolute text-center">
        <div className="text-[2rem] font-bold leading-none text-white tabular-nums" dir="ltr">
          {Math.round(earned * 100) / 100}
        </div>
        <div className="mt-1 text-[0.78rem] text-slate-400">من {max}</div>
      </div>
    </div>
  );
}

export function Results({
  name,
  answers,
  startedAt,
  submittedAt,
  onRestart,
}: {
  name: string;
  answers: Answers;
  startedAt: number | null;
  submittedAt: number | null;
  onRestart: () => void;
}) {
  const grade = useMemo(() => gradeExam(QUESTIONS, answers), [answers]);
  const pct = grade.max ? Math.round((grade.earned / grade.max) * 1000) / 10 : 0;
  const elapsed = startedAt && submittedAt ? submittedAt - startedAt : 0;
  const [open, setOpen] = useState<string | null>(QUESTIONS[0].id);

  const verdict =
    pct >= 90
      ? { t: "ممتاز", c: "text-emerald-300", b: "border-emerald-400/40 bg-emerald-400/10" }
      : pct >= 75
        ? { t: "جيّد جداً", c: "text-cyan-300", b: "border-cyan-400/40 bg-cyan-400/10" }
        : pct >= 50
          ? { t: "مقبول", c: "text-amber-300", b: "border-amber-400/40 bg-amber-400/10" }
          : { t: "يحتاج مراجعة", c: "text-rose-300", b: "border-rose-400/40 bg-rose-400/10" };

  return (
    <div className="mx-auto max-w-5xl px-3 pb-16 sm:px-5">
      {/* ── score header ── */}
      <section className="rise mt-4 overflow-hidden rounded-3xl border border-sky-400/20 bg-gradient-to-bl from-ink-800/90 via-ink-850/80 to-ink-900/90 p-4 sm:p-6">
        <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:gap-7">
          <ScoreRing earned={grade.earned} max={grade.max} />
          <div className="min-w-0 flex-1 text-center sm:text-start">
            <p className="text-[0.8rem] font-semibold tracking-wide text-cyan-300">نتيجة الاختبار</p>
            <h1 className="mt-1 truncate text-2xl font-bold text-white sm:text-3xl">{name}</h1>
            <p className="mt-1 text-[0.85rem] text-slate-400">
              اختبار الهندسة – الصف الثامن · الوحدة الأولى: متوازيات الأضلاع والانسحاب
            </p>
            <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
              <span className={`rounded-full border px-3 py-1 text-[0.8rem] font-bold ${verdict.b} ${verdict.c}`}>
                {verdict.t} · {pct}%
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-400/25 bg-white/[0.03] px-3 py-1 text-[0.8rem] font-semibold text-slate-200">
                <svg viewBox="0 0 24 24" className="size-4 text-sky-300" fill="none" stroke="currentColor" strokeWidth="1.9">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 2" strokeLinecap="round" />
                </svg>
                <span dir="ltr" className="tabular-nums">{formatDuration(elapsed)}</span>
              </span>
              <span className="rounded-full border border-violet-400/25 bg-violet-400/10 px-3 py-1 text-[0.8rem] font-semibold text-violet-200">
                {submittedAt
                  ? new Date(submittedAt).toLocaleString("ar-SY", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })
                  : ""}
              </span>
            </div>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto">
            <button
              type="button"
              onClick={() => {
                playChime();
                downloadReport({ name, answers, startedAt, submittedAt });
              }}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-l from-cyan-400 to-sky-500 px-5 font-bold text-ink-950 shadow-[0_10px_30px_-12px_rgba(34,211,238,0.9)] transition-transform hover:scale-[1.02] active:scale-[0.99]"
            >
              <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <path d="M7 10l5 5 5-5" />
                <path d="M12 15V3" />
              </svg>
              تحميل التقرير
            </button>
            <button
              type="button"
              onClick={onRestart}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-sky-400/30 bg-white/[0.03] px-5 text-[0.88rem] font-semibold text-sky-100 transition-colors hover:bg-sky-400/10"
            >
              محاولة جديدة
            </button>
          </div>
        </div>

        {/* per-question bars */}
        <div className="mt-6 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          {QUESTIONS.map((q) => {
            const g = grade.questions.find((x) => x.questionId === q.id)!;
            const p = q.marks ? g.earned / q.marks : 0;
            const hue = p >= 0.75 ? "#34d399" : p >= 0.5 ? "#fbbf24" : "#fb7185";
            return (
              <button
                key={q.id}
                type="button"
                onClick={() => {
                  setOpen(q.id);
                  document.getElementById(`res-${q.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className="rounded-xl border border-sky-400/18 bg-white/[0.025] p-3 text-start transition-colors hover:border-sky-300/45"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-[0.78rem] font-bold text-slate-300">س{q.index}</span>
                  <span className="text-[0.85rem] font-bold tabular-nums" style={{ color: hue }} dir="ltr">
                    {Math.round(g.earned * 100) / 100}/{q.marks}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-[0.75rem] text-slate-400">{q.title}</p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/8">
                  <div
                    className="h-full rounded-full transition-[width] duration-700"
                    style={{ width: `${Math.max(3, p * 100)}%`, backgroundColor: hue }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* ── detailed breakdown ── */}
      <div className="mt-5 space-y-3">
        {QUESTIONS.map((q) => {
          const g = grade.questions.find((x) => x.questionId === q.id)!;
          const isOpen = open === q.id;
          const full = g.earned === q.marks;
          return (
            <section
              key={q.id}
              id={`res-${q.id}`}
              className="overflow-hidden rounded-2xl border border-sky-400/16 bg-ink-900/60"
            >
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : q.id)}
                aria-expanded={isOpen}
                className="flex w-full items-center gap-3 px-3.5 py-3.5 text-start transition-colors hover:bg-white/[0.03] sm:px-5"
              >
                <span
                  className={`grid size-9 shrink-0 place-items-center rounded-xl text-[0.85rem] font-bold ${
                    full ? "bg-emerald-400/18 text-emerald-200" : "bg-sky-400/14 text-sky-200"
                  }`}
                >
                  {q.index}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[0.98rem] font-bold text-white">{q.title}</span>
                  <span className="block truncate text-[0.75rem] text-slate-500">{q.reference}</span>
                </span>
                <span className="shrink-0 text-[0.95rem] font-bold tabular-nums text-slate-200" dir="ltr">
                  {Math.round(g.earned * 100) / 100} / {q.marks}
                </span>
                <svg
                  viewBox="0 0 20 20"
                  className={`size-5 shrink-0 text-sky-300 transition-transform ${isOpen ? "rotate-180" : ""}`}
                >
                  <path d="M5 8l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>

              {isOpen && (
                <div className="space-y-4 border-t border-sky-400/12 px-3.5 py-4 sm:px-5">
                  {q.intro && (
                    <p className="rounded-xl border border-sky-400/15 bg-white/[0.02] p-3 text-[0.86rem] leading-relaxed text-slate-300">
                      <Rich text={q.intro} />
                    </p>
                  )}
                  {q.figure && (
                    <FigureFrame caption={q.figure.caption} schematic={q.figure.schematic}>
                      {q.figure.node}
                    </FigureFrame>
                  )}
                  {q.parts.map((p, i) => {
                    const pg = g.parts.find((x) => x.partId === p.id)!;
                    const ok = pg.earned === p.marks;
                    const unanswered = !hasAnswer(answers[p.id]);
                    return (
                      <article
                        key={p.id}
                        className={`rounded-xl border p-3.5 ${
                          ok ? "border-emerald-400/25 bg-emerald-400/[0.045]" : "border-rose-400/22 bg-rose-400/[0.035]"
                        }`}
                      >
                        <header className="mb-2.5 flex flex-wrap items-start gap-2">
                          <span className="rounded-md bg-ink-700 px-2 py-0.5 text-[0.75rem] font-bold text-sky-200">
                            {q.index}.{i + 1}
                          </span>
                          <span
                            className={`rounded-md px-2 py-0.5 text-[0.75rem] font-bold tabular-nums ${
                              ok ? "bg-emerald-400/20 text-emerald-100" : "bg-rose-400/20 text-rose-100"
                            }`}
                            dir="ltr"
                          >
                            {Math.round(pg.earned * 100) / 100} / {p.marks}
                          </span>
                          <span className="rounded-md border border-sky-400/20 px-2 py-0.5 text-[0.7rem] text-slate-400">
                            {p.reference}
                          </span>
                        </header>

                        <p className="mb-2 text-sm font-bold">{unanswered ? "غير مجاب" : ok ? "إجابة صحيحة" : pg.earned > 0 ? "إجابة صحيحة جزئياً" : "إجابة خاطئة"}</p>
                        <p className="text-[0.92rem] leading-relaxed text-slate-100">
                          <Rich text={p.prompt} />
                        </p>

                        {p.figure && (
                          <div className="my-3">
                            <FigureFrame caption={p.figure.caption} schematic={p.figure.schematic}>
                              {p.figure.node}
                            </FigureFrame>
                          </div>
                        )}

                        <dl className="mt-3 grid gap-2 sm:grid-cols-2">
                          <div className="rounded-lg border border-white/8 bg-ink-900/70 p-2.5">
                            <dt className="mb-1 text-[0.72rem] font-bold text-slate-400">إجابتك</dt>
                            <dd className="text-[0.85rem] leading-relaxed text-slate-200">
                              <Rich text={pg.studentText} />
                            </dd>
                          </div>
                          <div className="rounded-lg border border-emerald-400/22 bg-emerald-400/[0.06] p-2.5">
                            <dt className="mb-1 text-[0.72rem] font-bold text-emerald-300">الإجابة الصحيحة</dt>
                            <dd className="text-[0.85rem] leading-relaxed text-emerald-50">
                              <Rich text={pg.correctText} />
                            </dd>
                          </div>
                        </dl>

                        {pg.lines.length > 1 && (
                          <div className="mt-3">
                            <p className="mb-1.5 text-[0.75rem] font-bold text-slate-400">
                              تفصيل الرصد الجزئي
                            </p>
                            <ul className="space-y-1.5">
                              {pg.lines.map((l, k) => (
                                <li
                                  key={k}
                                  className="flex items-start gap-2 rounded-lg bg-ink-900/60 px-2.5 py-1.5 text-[0.8rem]"
                                >
                                  <span className={l.ok ? "text-emerald-300" : "text-rose-300"}>
                                    {l.ok ? "✓" : "✗"}
                                  </span>
                                  <span className="min-w-0 flex-1 text-slate-300">{l.label}</span>
                                  {l.max > 0 ? (
                                    <span className="shrink-0 tabular-nums text-slate-400" dir="ltr">
                                      {Math.round(l.earned * 100) / 100}/{l.max}
                                    </span>
                                  ) : (
                                    <span className="shrink-0 text-[0.72rem] text-slate-500">
                                      {l.ok ? "مطابق" : "غير مطابق"}
                                    </span>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <div className="mt-3 rounded-lg border border-sky-400/18 bg-sky-400/[0.05] p-3">
                          <p className="mb-1 text-[0.74rem] font-bold text-sky-300">الشرح الهندسي</p>
                          <p className="text-[0.86rem] leading-relaxed text-slate-200">
                            <Rich text={p.explanation} />
                          </p>
                          {!ok && p.commonMistake && (
                            <p className="mt-2 border-t border-white/8 pt-2 text-[0.82rem] leading-relaxed text-amber-200/90">
                              <span className="font-bold">خطأ شائع: </span>
                              <Rich text={p.commonMistake} />
                            </p>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })}
      </div>

      <p className="mt-6 text-center text-[0.76rem] leading-relaxed text-slate-500">
        يُنشأ التقرير النصّي محلياً داخل متصفّحك بصيغة UTF-8، ولا تُرسل أيّ بيانات إلى أيّ خدمة خارجية.
      </p>
    </div>
  );
}