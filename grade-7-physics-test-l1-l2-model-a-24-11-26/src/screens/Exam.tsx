/**
 * شاشة الاختبار: سؤال واحد في كل شاشة، مع فهرس أسئلة وشريط تقدّم وتنبيه بالأسئلة الناقصة.
 * تعرض نصّ الأسئلة والرسوم والجداول فقط — بلا أي إجابة أو تلميح.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import type { Question } from "../exam/types";
import { Figure, DataTable } from "../exam/figures";
import { AnswerWidget, InputHeading, PartHeading } from "../components/AnswerWidgets";
import { MixedText } from "../lib/mathx";
import {
  isInputComplete,
  isPartComplete,
  isQuestionComplete,
  progressOf,
  type Responses,
} from "../lib/grading";
import { num } from "../lib/time";

export function Exam({
  studentName,
  questions,
  answers,
  setAnswer,
  elapsedMs,
  totalParts,
  initialIndex,
  onNavigate,
  onReview,
}: {
  studentName: string;
  questions: Question[];
  answers: Responses;
  setAnswer: (field: string, value: string) => void;
  elapsedMs: string;
  totalParts: number;
  initialIndex: number;
  onNavigate: (index: number) => void;
  onReview: () => void;
}) {
  const [index, setIndex] = useState(() => Math.min(Math.max(0, initialIndex), questions.length - 1));
  const [panelOpen, setPanelOpen] = useState(false);
  const topRef = useRef<HTMLDivElement | null>(null);

  /* فتح السؤال المحفوظ في المحاولة المستعادة */
  useEffect(() => {
    setIndex((current) => (current === initialIndex ? current : Math.min(Math.max(0, initialIndex), questions.length - 1)));
  }, [initialIndex, questions.length]);

  const question = questions[index];
  const statuses = useMemo(() => questions.map((item) => progressOf(item, answers)), [questions, answers]);
  const answeredFully = useMemo(() => statuses.reduce((sum, status) => sum + status.done, 0), [statuses]);
  const remaining = useMemo(
    () =>
      questions
        .map((item, itemIndex) => ({ item, itemIndex }))
        .filter(({ item }) => !isQuestionComplete(item, answers))
        .map(({ itemIndex }) => itemIndex + 1),
    [questions, answers],
  );
  const missingInCurrent = question.parts
    .flatMap((part) => part.inputs)
    .filter((input) => !isInputComplete(input, answers));
  const progressPct = totalParts ? Math.round((answeredFully / totalParts) * 100) : 0;

  const goto = (next: number) => {
    const clamped = Math.min(Math.max(0, next), questions.length - 1);
    setIndex(clamped);
    onNavigate(clamped);
    setPanelOpen(false);
    window.scrollTo({ top: 0, behavior: "auto" });
    topRef.current?.focus();
  };

  return (
    <div ref={topRef} tabIndex={-1} className="relative z-10 mx-auto max-w-6xl px-3 pb-28 pt-4 sm:px-4">
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
                className="mb-4 rounded-[var(--r-sm)] border p-3.5 text-[0.97rem] leading-relaxed"
                style={{ borderColor: "#e3d9c5", background: "var(--surface-2)" }}
              >
                <MixedText as="p" text={question.intro} />
              </div>

              {question.table && (
                <div className="mb-4">
                  <DataTable head={question.table.head} rows={question.table.rows} />
                </div>
              )}

              {question.figure && (
                <figure className="mb-4">
                  <Figure type={question.figure} />
                </figure>
              )}

              <div className="grid gap-3">
                {question.parts.map((part, partIndex) => {
                  const done = isPartComplete(part, answers);
                  return (
                    <section
                      key={part.id}
                      className="subcard"
                      data-done={done ? "1" : "0"}
                      data-part-card={part.id}
                      aria-labelledby={`${part.id}-heading`}
                    >
                      <div id={`${part.id}-heading`}>
                        <PartHeading part={part} index={partIndex} />
                      </div>
                      <div className="ps-0 sm:ps-[42px]">
                        {part.figure && (
                          <div className="mb-3">
                            <Figure type={part.figure} />
                          </div>
                        )}
                        <div className="grid gap-3.5">
                          {part.inputs.map((input) => (
                            <div key={input.id}>
                              {part.inputs.length > 1 && <InputHeading input={input} />}
                              <AnswerWidget
                                input={input}
                                value={(field) => answers[field] ?? ""}
                                set={setAnswer}
                              />
                            </div>
                          ))}
                        </div>
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

          {missingInCurrent.length > 0 && (
            <p className="mt-2 text-[0.8rem] font-bold" style={{ color: "var(--warn)" }} role="status">
              بقي في هذا السؤال {num(missingInCurrent.length)} حقلاً بلا إجابة — لا يمكن التسليم قبل إكمال كل الفروع.
            </p>
          )}
        </main>

        <aside className={`${panelOpen ? "block" : "hidden"} lg:block`}>
          <div className="card sticky top-[92px] p-3">
            <h3 className="mb-2 flex items-center justify-between text-sm font-extrabold" style={{ color: "var(--navy)" }}>
              فهرس الأسئلة
              <span className="badge badge-mute tnum">
                {num(answeredFully)}/{num(totalParts)}
              </span>
            </h3>
            <div className="grid grid-cols-5 gap-1.5 lg:grid-cols-4">
              {questions.map((item, itemIndex) => {
                const state = statuses[itemIndex];
                const kind = state.done === 0 ? "none" : state.done === state.total ? "full" : "partial";
                return (
                  <button
                    key={item.id}
                    type="button"
                    className="navpill tnum"
                    data-state={kind}
                    data-current={itemIndex === index ? "1" : "0"}
                    data-map-index={itemIndex}
                    onClick={() => goto(itemIndex)}
                    aria-label={`السؤال ${itemIndex + 1}: ${state.done} من ${state.total} فرعاً`}
                    aria-current={itemIndex === index ? "step" : undefined}
                    title={`${state.done}/${state.total} فرع مُجاب`}
                  >
                    {num(itemIndex + 1)}
                  </button>
                );
              })}
            </div>
            <div className="mt-3 grid gap-1 text-[0.72rem]" style={{ color: "var(--ink-3)" }}>
              <span className="flex items-center gap-1.5">
                <i className="inline-block h-3 w-3 rounded-[3px]" style={{ background: "var(--navy)" }} /> مُجاب بالكامل
              </span>
              <span className="flex items-center gap-1.5">
                <i
                  className="inline-block h-3 w-3 rounded-[3px]"
                  style={{ background: "var(--gold-soft)", border: "1px solid var(--gold)" }}
                />{" "}
                مُجاب جزئياً
              </span>
              <span className="flex items-center gap-1.5">
                <i
                  className="inline-block h-3 w-3 rounded-[3px] border"
                  style={{ borderColor: "var(--line)", background: "#fff" }}
                />{" "}
                لم يُجب
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
                className="bar-track h-2.5 flex-1"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={progressPct}
                aria-label="نسبة الفروع المجابة"
              >
                <div className="bar-fill" style={{ width: `${progressPct}%` }} />
              </div>
              <span className="tnum shrink-0 text-[0.78rem] font-bold" style={{ color: "var(--ink-2)" }}>
                {num(progressPct)}%
              </span>
            </div>
            <p className="mt-1 text-[0.76rem]" style={{ color: "var(--ink-3)" }}>
              {num(answeredFully)} من {num(totalParts)} فرعاً · الزمن {elapsedMs}
              {remaining.length > 0 && (
                <>
                  {" · "}أسئلة ناقصة: <span className="tnum font-bold">{remaining.map((n) => num(n)).join("، ")}</span>
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
