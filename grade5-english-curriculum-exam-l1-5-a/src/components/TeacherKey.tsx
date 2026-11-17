import { useState } from "react";
import { EXAM_TITLE } from "@/config";
import { LESSONS, QUESTIONS, type LessonId } from "@/data/exam";
import { acceptedAnswers } from "@/lib/grading";

const PASSWORD = "somer173";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function TeacherKey({ open, onClose }: Props) {
  const [value, setValue] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState(false);

  if (!open) return null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value === PASSWORD) {
      setUnlocked(true);
      setError(false);
    } else {
      setError(true);
    }
  };

  const lessons = Object.keys(LESSONS) as LessonId[];

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-ink/70 px-3 py-8 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Teacher answer key"
    >
      <div className="mx-auto max-w-5xl rounded-sm border-[3px] border-purple bg-paper shadow-2xl">
        <header className="flex items-center justify-between gap-4 border-b-[3px] border-purple bg-purple px-5 py-3 text-white">
          <div>
            <p className="label-caps text-white/80">Restricted area</p>
            <h2 className="text-xl font-bold">Teacher Answer Key · {EXAM_TITLE}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border-2 border-white/70 px-4 py-2 text-sm font-semibold transition hover:bg-white hover:text-purple"
          >
            Close
          </button>
        </header>

        {!unlocked ? (
          <form onSubmit={submit} className="mx-auto max-w-md px-6 py-12 text-center">
            <p className="text-[1.05rem] text-ink">
              Enter the teacher password to show all 50 questions with answers, marks, explanations and
              page references.
            </p>
            <input
              type="password"
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                setError(false);
              }}
              placeholder="Password"
              autoFocus
              className="mt-6 w-full rounded-sm border-2 border-ink/25 bg-white px-4 py-3 text-center text-lg tracking-[0.3em] text-ink outline-none focus:border-purple"
            />
            {error && <p className="mt-3 text-sm font-semibold text-coral">Wrong password. Try again.</p>}
            <button
              type="submit"
              className="mt-5 w-full rounded-full bg-purple px-6 py-3.5 font-bold text-white shadow-[0_4px_0_#5d3796] transition active:translate-y-[2px] active:shadow-[0_2px_0_#5d3796]"
            >
              Unlock answer key
            </button>
            <p className="mt-6 text-xs leading-relaxed text-ink-soft">
              Note: this is a client-side educational access gate only. It is not real authentication or
              encryption, and it must not be treated as a security measure.
            </p>
          </form>
        ) : (
          <div className="px-4 py-6 md:px-6">
            <p className="rounded-sm border-l-4 border-purple bg-purple/10 px-4 py-3 text-sm text-ink">
              All 50 questions · 100 marks · 2 marks per question. “Accepted alternatives” are also marked
              correct. Rubric items are marked by the teacher against the printed rubric.
            </p>

            {lessons.map((lid) => {
              const lesson = LESSONS[lid];
              const qs = QUESTIONS.filter((q) => q.lesson === lid);
              return (
                <section key={lid} className="mt-8">
                  <h3
                    className="label-caps sticky top-0 z-10 -mx-4 border-y-2 border-ink px-4 py-2 text-white md:-mx-6 md:px-6"
                    style={{ backgroundColor: lesson.colorDeep }}
                  >
                    Lesson {lesson.no} · {lesson.title} · {lesson.pages} · {qs.length} questions ·{" "}
                    {qs.reduce((s, q) => s + q.parts.reduce((t, p) => t + p.marks, 0), 0)} marks
                  </h3>

                  <ol className="mt-4 space-y-4">
                    {qs.map((q) => {
                      const total = q.parts.reduce((s, p) => s + p.marks, 0);
                      return (
                        <li key={q.id} className="rounded-sm border-2 border-ink/15 bg-white p-4">
                          <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-dotted border-ink/20 pb-2">
                            <span className="tabular font-bold text-ink">{q.id}</span>
                            <span className="label-caps text-ink-soft">{q.ref}</span>
                            <span className="tabular rounded-full bg-green/12 px-2.5 py-1 text-sm font-semibold text-green">
                              {total} marks
                            </span>
                          </div>

                          {q.stem && <p className="mt-2 text-sm font-semibold text-ink">{q.stem}</p>}

                          <ul className="mt-3 space-y-3">
                            {q.parts.map((p) => {
                              const alts = acceptedAnswers(p);
                              return (
                                <li key={p.id} className="rounded-sm bg-paper/80 p-3">
                                  <p className="text-sm text-ink">
                                    <span className="tabular mr-2 inline-flex h-5 min-w-5 items-center justify-center rounded-sm bg-turq/20 px-1 text-[11px] font-bold text-turq-deep">
                                      {p.label}
                                    </span>
                                    {p.prompt}
                                    <span className="tabular ml-2 rounded-full bg-coral/15 px-2 text-[11px] font-bold text-coral">
                                      {p.marks} {p.marks === 1 ? "mark" : "marks"}
                                    </span>
                                  </p>

                                  <p className="mt-2 text-sm">
                                    <span className="label-caps mr-2 text-green">Answer</span>
                                    <span className="font-semibold text-ink">
                                      {p.type === "rubric" ? "Answers will vary (teacher rubric)" : p.answer}
                                    </span>
                                    {p.type === "rubric" && (
                                      <>
                                        <br />
                                        <span className="label-caps mr-2 text-purple">Rubric</span>
                                        <span className="text-ink">{p.rubric}</span>
                                      </>
                                    )}
                                  </p>

                                  {p.type === "text" && (p.accepted?.length ?? 0) > 0 && (
                                    <p className="mt-1 text-sm">
                                      <span className="label-caps mr-2 text-ink-soft">
                                        Accepted alternatives
                                      </span>
                                      <span className="text-ink">{p.accepted!.join(" · ")}</span>
                                    </p>
                                  )}

                                  {p.type === "order" && (
                                    <p className="mt-1 text-sm">
                                      <span className="label-caps mr-2 text-ink-soft">Word bank</span>
                                      <span className="text-ink">{p.words.join(" / ")}</span>
                                    </p>
                                  )}

                                  {p.type === "mcq" && (
                                    <p className="mt-1 text-sm">
                                      <span className="label-caps mr-2 text-ink-soft">Options</span>
                                      <span className="text-ink-soft">{p.options.join(" · ")}</span>
                                    </p>
                                  )}

                                  {alts.length > 1 && p.type !== "text" && (
                                    <p className="mt-1 text-sm text-ink-soft">
                                      Also accepted: {alts.slice(1).join(" · ")}
                                    </p>
                                  )}
                                </li>
                              );
                            })}
                          </ul>
                        </li>
                      );
                    })}
                  </ol>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
