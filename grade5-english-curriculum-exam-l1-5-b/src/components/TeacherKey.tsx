import { useState } from "react";
import Contact from "@/components/Contact";
import { EXAM_GRADE, EXAM_SEMESTER, EXAM_TITLE } from "@/config";
import { LESSONS, QUESTIONS, TOTAL_MARKS, TOTAL_QUESTIONS, lessonMeta } from "@/data/questions";

export const TEACHER_PASSWORD = "somer173";

function questionsForLesson(n: number) {
  return QUESTIONS.filter((q) => q.lesson === n);
}

/**
 * Teacher-only answer key. This is a simple client-side gate for convenience —
 * it is deliberately NOT described as secure authentication or encryption.
 */
export default function TeacherKey({ onClose }: { onClose: () => void }) {
  const [value, setValue] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState(false);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pb-16 pt-5 sm:px-6">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <span className="tab-label cut-sm inline-block bg-violet px-3 py-2 text-white">
          Teacher area · Answer key
        </span>
        <button
          type="button"
          onClick={onClose}
          className="cut-sm bg-white px-4 py-2 font-display text-sm font-semibold transition-transform hover:-translate-y-0.5"
        >
          ← Back
        </button>
      </header>

      {!unlocked ? (
        <section
          className="cut mx-auto max-w-lg bg-white px-5 py-7 text-center"
          style={{ boxShadow: "8px 8px 0 #7A3BE0" }}
        >
          <div className="tab-label text-ink-soft">{EXAM_TITLE}</div>
          <h1 className="mt-1 text-3xl">Teacher Answer Key</h1>
          <p className="mt-2 text-[0.97rem] text-ink-soft">
            All {TOTAL_QUESTIONS} questions · {TOTAL_MARKS} marks. Enter the teacher password to open the full
            key for Version B — correct answers, marks, explanations, accepted alternatives and page
            references.
          </p>
          <p className="mt-3 border-2 border-dashed border-ink/40 bg-paper px-3 py-2 text-sm text-ink-soft">
            This is a simple client-side gate for convenience only. It is not secure authentication and nothing
            here is encrypted.
          </p>

          <form
            className="mt-5"
            onSubmit={(e) => {
              e.preventDefault();
              if (value === TEACHER_PASSWORD) {
                setUnlocked(true);
                setError(false);
              } else {
                setError(true);
              }
            }}
          >
            <label className="tab-label block text-left text-ink-soft" htmlFor="teacher-pass">
              Password
            </label>
            <input
              id="teacher-pass"
              type="password"
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                setError(false);
              }}
              className="cut-flat mt-2 w-full bg-paper px-4 py-3 text-lg font-semibold"
              autoComplete="off"
            />
            {error && (
              <p className="mt-2 text-sm font-semibold" style={{ color: "#A80F5D" }}>
                Wrong password. Try again.
              </p>
            )}
            <button
              type="submit"
              className="cut mt-4 w-full px-5 py-3 font-display text-lg font-semibold transition-all hover:-translate-y-1"
              style={{ background: "#7A3BE0", color: "#FFFFFF" }}
            >
              Open Answer Key
            </button>
          </form>
        </section>
      ) : (
        <section>
          <div className="cut bg-ink px-5 py-5 text-paper" style={{ boxShadow: "7px 7px 0 #FF7A1A" }}>
            <div className="tab-label" style={{ color: "#FF7A1A" }}>
              {EXAM_TITLE}
            </div>
            <h1 className="mt-1 text-3xl" style={{ color: "#FFC400" }}>
              Teacher Answer Key · Grade {EXAM_GRADE} · Semester {EXAM_SEMESTER} · Model B
            </h1>
            <p className="mt-1.5 text-sm">
              Grade {EXAM_GRADE} · English · Semester {EXAM_SEMESTER} · Unit 1 · Lessons 1–5 · Pupil's Book
              pages 3–20 · {TOTAL_QUESTIONS} main questions · {TOTAL_MARKS} marks (each question is worth 2
              marks).
            </p>
          </div>

          {LESSONS.map((l) => {
            const meta = lessonMeta(l.n);
            const qs = questionsForLesson(l.n);
            return (
              <div key={l.n} className="mt-6">
                <h2
                  className="cut-sm inline-block px-4 py-2 text-xl"
                  style={{ background: meta.color, color: meta.textOn }}
                >
                  Lesson {l.n} — {meta.title} (pages {l.pages})
                </h2>

                <ol className="mt-3 space-y-4">
                  {qs.map((q, qi) => (
                    <li key={q.id} className="cut bg-white" style={{ boxShadow: "5px 5px 0 #2E2438" }}>
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b-[3px] border-ink bg-paper-deep px-3.5 py-2">
                        <span className="tab-label">
                          Lesson {l.n} · Q{qi + 1} · {q.exercise}
                        </span>
                        <span className="tab-label">{q.page}</span>
                      </div>
                      <div className="px-3.5 py-4 sm:px-5">
                        <p className="text-base font-semibold">{q.instruction}</p>
                        {q.context && (
                          <div className="mt-2 border-2 border-dashed border-ink/40 bg-paper px-3 py-2 text-sm whitespace-pre-line">
                            {q.context}
                          </div>
                        )}
                        <div className="mt-3 space-y-2.5">
                          {q.parts.map((p, pi) => (
                            <div key={p.id} className="border-l-[5px] bg-paper px-3 py-2 text-sm" style={{ borderColor: "#7BC400" }}>
                              <div className="font-semibold">
                                {q.parts.length > 1 ? `${String.fromCharCode(97 + pi)}. ` : ""}
                                {p.prompt}
                              </div>
                              <div className="mt-1 flex flex-wrap gap-x-6 gap-y-1">
                                <span>
                                  <span className="tab-label text-ink-soft">Answer: </span>
                                  <strong className="tnum">{p.accept.join("  |  ")}</strong>
                                </span>
                                <span className="tnum">
                                  <span className="tab-label text-ink-soft">Marks: </span>
                                  <strong>
                                    {p.marks} / {p.marks}
                                  </strong>
                                </span>
                              </div>
                              {p.explanation && <div className="mt-1 text-ink-soft">{p.explanation}</div>}
                              <div className="mt-1 text-ink-soft">
                                Accepted alternatives: {p.accept.join(", ")}
                              </div>
                            </div>
                          ))}
                          <div className="tnum tab-label">
                            Question total: {q.parts.reduce((s, p) => s + p.marks, 0)} /{" "}
                            {q.parts.reduce((s, p) => s + p.marks, 0)} marks
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            );
          })}

          <div className="mt-8">
            <Contact />
          </div>
        </section>
      )}
    </div>
  );
}
