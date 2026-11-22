/**
 * شاشة الأسئلة: سؤال واحد في كل شاشة، فهرس جانبي بحالة كل سؤال،
 * شريط تقدّم، تنقّل سابق/تالي، وزر انتقال إلى مراجعة الإجابات.
 * لا يُكشف أي تصحيح هنا.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import type { Question } from "../exam/types";
import { isPartAnswered, progressOf } from "../lib/grading";
import { Rich } from "../lib/mathx";
import { num } from "../lib/time";
import { Figure } from "../exam/figures";
import { AnswerWidget, PartHeading } from "../components/AnswerWidgets";
import type { Responses } from "../lib/grading";

export function Exam({
  studentName,
  questions,
  answers,
  setAnswer,
  elapsedMs,
  totalParts,
  initialIndex = 0,
  onNavigate,
  onReview,
}: {
  studentName: string;
  questions: Question[];
  answers: Responses;
  setAnswer: (partId: string, value: string) => void;
  elapsedMs: string;
  totalParts: number;
  initialIndex?: number;
  onNavigate?: (index: number) => void;
  onReview: () => void;
}) {
  const [index, setIndex] = useState(() => Math.max(0, Math.min(questions.length - 1, initialIndex)));
  const [panelOpen, setPanelOpen] = useState(false);
  const topRef = useRef<HTMLDivElement | null>(null);

  const status = useMemo(
    () =>
      questions.map((question) => ({
        ...progressOf(question, answers),
        marks: question.parts.length,
      })),
    [questions, answers],
  );

  const answeredParts = questions
    .flatMap((question) => question.parts)
    .filter((part) => isPartAnswered(answers[part.id])).length;
  const remainingQuestions = status
    .map((state, i) => ({ state, i }))
    .filter(({ state }) => state.done < state.total)
    .map(({ i }) => i + 1);
  const progressPct = Math.round((answeredParts / totalParts) * 1000) / 10;
  const question = questions[index];

  useEffect(() => {
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [index]);

  const goto = (next: number) => {
    const clamped = Math.max(0, Math.min(questions.length - 1, next));
    setIndex(clamped);
    setPanelOpen(false);
    onNavigate?.(clamped);
  };

  return (
    <div className="relative z-10 mx-auto max-w-6xl px-3 pb-28 pt-4 sm:px-4">
      <div ref={topRef} />

      <div className="grid gap-4 lg:grid-cols-[1fr_236px]">
        <main className="min-w-0">
          <article className="card overflow-hidden" data-question-id={question.id}>
            <header
              className="relative p-4 sm:p-6"
              style={{ background: "linear-gradient(135deg,#174c5b 0%,#10313c 62%,#1b5c68 100%)" }}
            >
              <div className="relative flex items-start gap-3">
                <div className="tnum shrink-0 text-[2.1rem] font-extrabold leading-none" style={{ color: "#ffd97a" }}>
                  {num(index + 1)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[0.74rem] font-bold opacity-80" style={{ color: "#dcebee" }}>
                    السؤال {num(index + 1)} من {num(questions.length)} · {question.lesson}
                  </p>
                  <h2 className="mt-1 text-[clamp(1.05rem,3vw,1.4rem)] font-extrabold leading-snug" style={{ color: "#fff8e8" }}>
                    {question.title}
                  </h2>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <span
                      className="badge"
                      style={{ background: "rgba(255,217,122,0.18)", color: "#ffd97a", borderColor: "rgba(255,217,122,0.4)" }}
                    >
                      <span className="tnum">{num(question.parts.length)}</span> فروع
                    </span>
                    <span
                      className="badge"
                      style={{ background: "rgba(255,248,232,0.1)", color: "#cfe3e6", borderColor: "rgba(255,248,232,0.18)" }}
                    >
                      {question.pages}
                    </span>
                  </div>
                </div>
              </div>
            </header>

            <div className="p-4 sm:p-6">
              <div
                className="mb-4 rounded-[var(--r-sm)] border p-3.5"
                style={{ borderColor: "#e3d9c5", background: "var(--surface-2)" }}
              >
                <p className="text-[0.97rem] leading-relaxed">
                  <Rich content={question.intro} />
                </p>
              </div>

              {question.figure && (
                <figure className="mb-4">
                  <Figure type={question.figure} />
                  {question.figureCaption && (
                    <figcaption className="mt-1.5 text-center text-[0.78rem]" style={{ color: "var(--ink-3)" }}>
                      <Rich content={question.figureCaption} />
                    </figcaption>
                  )}
                </figure>
              )}

              <div className="grid gap-3">
                {question.parts.map((part, partIndex) => {
                  const done = isPartAnswered(answers[part.id]);
                  return (
                    <section
                      key={part.id}
                      className="subcard"
                      data-done={done ? "1" : "0"}
                      data-part-card={part.id}
                      aria-labelledby={`${part.id}-heading`}
                    >
                      <div id={`${part.id}-heading`}>
                        <PartHeading part={part} index={partIndex} done={done} />
                      </div>
                      <div className="ps-[42px] max-lg:ps-0">
                        <AnswerWidget
                          part={part}
                          value={answers[part.id] ?? ""}
                          onChange={(value) => setAnswer(part.id, value)}
                        />
                      </div>
                    </section>
                  );
                })}
              </div>
            </div>
          </article>

          <nav className="mt-4 flex flex-wrap items-center justify-between gap-2" aria-label="التنقل بين الأسئلة">
            <button type="button" className="btn btn-ghost" onClick={() => goto(index - 1)} disabled={index === 0}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden>
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
              السؤال السابق
            </button>
            <span className="tnum text-sm font-bold" style={{ color: "var(--ink-3)" }}>
              {num(index + 1)} / {num(questions.length)}
            </span>
            {index < questions.length - 1 ? (
              <button type="button" className="btn btn-primary" onClick={() => goto(index + 1)}>
                السؤال التالي
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden>
                  <path d="M19 12H5M11 18l-6-6 6-6" />
                </svg>
              </button>
            ) : (
              <button type="button" className="btn btn-primary" onClick={onReview} data-action="go-review">
                مراجعة الإجابات
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden>
                  <path d="M19 12H5M11 18l-6-6 6-6" />
                </svg>
              </button>
            )}
          </nav>
        </main>

        <aside className={`${panelOpen ? "block" : "hidden"} lg:block`}>
          <div className="card sticky top-[92px] p-3">
            <h3 className="mb-2 flex items-center justify-between text-sm font-extrabold" style={{ color: "var(--navy)" }}>
              فهرس الأسئلة
              <span className="badge badge-mute tnum">
                {num(answeredParts)}/{num(totalParts)}
              </span>
            </h3>
            <div className="grid grid-cols-5 gap-1.5 lg:grid-cols-4">
              {questions.map((item, i) => {
                const state = status[i];
                const kind = state.done === 0 ? "none" : state.done === state.total ? "full" : "partial";
                return (
                  <button
                    key={item.id}
                    type="button"
                    className="navpill tnum"
                    data-state={kind}
                    data-current={i === index ? "1" : "0"}
                    data-map-index={i}
                    onClick={() => goto(i)}
                    aria-label={`السؤال ${i + 1}: ${state.done} من ${state.total} فرعاً`}
                    aria-current={i === index ? "step" : undefined}
                    title={`${state.done}/${state.total} فرع مُجاب`}
                  >
                    {num(i + 1)}
                  </button>
                );
              })}
            </div>
            <div className="mt-3 grid gap-1 text-[0.72rem]" style={{ color: "var(--ink-3)" }}>
              <span className="flex items-center gap-1.5">
                <i className="inline-block h-3 w-3 rounded-[3px]" style={{ background: "var(--navy)" }} /> مُجاب بالكامل
              </span>
              <span className="flex items-center gap-1.5">
                <i className="inline-block h-3 w-3 rounded-[3px]" style={{ background: "var(--gold-soft)", border: "1px solid var(--gold)" }} /> مُجاب جزئياً
              </span>
              <span className="flex items-center gap-1.5">
                <i className="inline-block h-3 w-3 rounded-[3px] border" style={{ borderColor: "var(--line)", background: "#fff" }} /> لم يُجب
              </span>
            </div>
            <button type="button" className="btn btn-gold mt-3 w-full !min-h-0 !py-2 text-sm" onClick={onReview}>
              مراجعة الإجابات والتسليم
            </button>
          </div>
        </aside>
      </div>

      {/* شريط سفلي ثابت: التقدّم + التنقّل + المراجعة */}
      <div
        className="fixed inset-x-0 bottom-0 z-40 border-t backdrop-blur"
        style={{ borderColor: "var(--line)", background: "rgba(255,253,248,0.97)", boxShadow: "0 -8px 24px rgba(16,49,60,0.10)" }}
      >
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-3 py-2.5 sm:px-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2.5">
              <div
                className="h-2.5 flex-1 overflow-hidden rounded-full"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={progressPct}
                aria-label="نسبة الفروع المجابة"
                style={{ background: "#e4dac6" }}
              >
                <div
                  className="h-full rounded-full"
                  style={{ width: `${progressPct}%`, background: "linear-gradient(90deg,#0f766e,#b5851d)" }}
                />
              </div>
              <span className="tnum shrink-0 text-[0.78rem] font-bold" style={{ color: "var(--ink-2)" }}>
                {num(progressPct)}%
              </span>
            </div>
            <p className="mt-1 text-[0.76rem]" style={{ color: "var(--ink-3)" }}>
              {num(answeredParts)} من {num(totalParts)} فرعاً · الزمن {elapsedMs}
              {remainingQuestions.length > 0 && (
                <>
                  {" · "}أسئلة ناقصة: <span className="tnum font-bold">{remainingQuestions.map((n) => num(n)).join("، ")}</span>
                </>
              )}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              className="btn btn-ghost !min-h-0 !px-3 !py-1.5 text-sm lg:hidden"
              onClick={() => setPanelOpen((open) => !open)}
              aria-expanded={panelOpen}
            >
              الفهرس
            </button>
            <button type="button" className="btn btn-gold !min-h-0 !px-3 !py-1.5 text-sm" onClick={onReview}>
              مراجعة الإجابات
            </button>
          </div>
        </div>
      </div>
      <p className="sr-only" data-testid="student-name-display">
        {studentName}
      </p>
    </div>
  );
}
