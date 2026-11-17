import { useState } from "react";
import {
  LESSONS,
  QUESTIONS,
  TOTAL_MARKS,
  lessonMarks,
  questionMarks,
} from "../data/exam";
import ContactFooter from "./ContactFooter";
import { XIcon, KeyIcon } from "./Icons";

interface Props {
  onClose: () => void;
}

const PASSWORD = "somer173";

export default function TeacherArea({ onClose }: Props) {
  const [value, setValue] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (value === PASSWORD) {
      setUnlocked(true);
      setError(false);
    } else {
      setError(true);
    }
  }

  return (
    <div className="min-h-dvh dot-paper">
      <header className="sticky top-0 z-30 border-b-2 border-ink/10 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-3">
          <KeyIcon className="h-5 w-5 text-brand-orange" />
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-display text-sm uppercase tracking-wide text-ink sm:text-base">
              Teacher Area · Model B
            </h1>
            <p className="text-[11px] font-bold uppercase tracking-wider text-ink/60">
              Answer key · marks · explanations
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border-2 border-ink/15 bg-white text-ink"
            aria-label="Close Teacher Area"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
        {!unlocked ? (
          <form
            onSubmit={submit}
            className="mx-auto max-w-md rounded-3xl border-[3px] border-[#0b2a5b] bg-white p-5 sticker-strong"
          >
            <h2 className="font-display text-lg uppercase text-ink">Protected area</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink/65">
              Enter the teacher password to see the full answer key, mark distribution,
              explanations, accepted alternatives and source references.
            </p>
            <label
              htmlFor="teacher-pass"
              className="mt-4 block text-xs font-extrabold uppercase tracking-[0.16em] text-ink/60"
            >
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
              className="mt-1.5 w-full rounded-2xl border-2 border-ink/15 bg-paper px-4 py-3 text-base font-bold text-ink focus:border-brand-blue focus:bg-white"
              placeholder="••••••••"
            />
            {error && (
              <p className="mt-2 text-sm font-bold text-[#d43a1f]">Wrong password. Try again.</p>
            )}
            <button
              type="submit"
              className="mt-4 min-h-12 w-full rounded-2xl bg-ink px-4 font-display text-sm uppercase tracking-wide text-white"
            >
              Unlock
            </button>
            <p className="mt-3 text-[11px] leading-relaxed text-ink/60">
              This is a client-side convenience gate only — it is not real authentication or
              encryption, and it must not be presented as such.
            </p>
          </form>
        ) : (
          <>
            {/* mark distribution */}
            <section className="rounded-3xl border-2 border-ink/10 bg-white p-4 sticker sm:p-5">
              <h2 className="font-display text-base uppercase tracking-wide text-ink">
                Mark distribution
              </h2>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <Stat label="Total" value={`${TOTAL_MARKS}`} accent="#1257FF" />
                {LESSONS.map((l) => (
                <Stat
                  key={l.id}
                  label={`Lesson ${l.id} — ${l.title}`}
                  value={`${lessonMarks(l.id)}`}
                  accent={l.color}
                />
                ))}
              </div>
              <p className="mt-3 text-xs leading-relaxed text-ink/60">
                30 main questions · 10 per lesson · 33 + 34 + 33 = 100 marks · two reading
                passages only (Student’s Book p. 7 and p. 21) · no listening tasks · no
                vocabulary section.
              </p>
            </section>

            {/* answer key */}
            <section className="mt-4 space-y-3">
              {QUESTIONS.map((q) => {
                const meta = LESSONS.find((l) => l.id === q.lesson)!;
                return (
                  <article
                    key={q.n}
                    className="rounded-3xl border-2 border-ink/10 bg-white p-4 sticker"
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className="grid h-10 w-10 shrink-0 place-items-center rounded-xl font-display text-sm text-white"
                        style={{ backgroundColor: meta.color }}
                      >
                        {q.n}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-extrabold uppercase tracking-wider text-ink/60">
                          Lesson {q.lesson} · {q.topic} · {q.source}
                        </p>
                        <p className="mt-1 text-sm font-extrabold leading-snug text-ink">
                          {q.instruction}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-lg bg-paper px-2 py-1 text-xs font-extrabold tabular text-brand-blue">
                        {questionMarks(q)} m
                      </span>
                    </div>

                    <div className="mt-3 space-y-2">
                      {q.parts.map((p, i) => (
                        <div
                          key={p.id}
                          className="rounded-2xl border-2 border-ink/10 bg-paper/70 p-3"
                        >
                          <p className="text-xs font-bold text-ink/70">
                            {q.parts.length > 1 ? `Part ${String.fromCharCode(97 + i)} — ` : ""}
                            {p.kind === "choice" ? p.stem : (p.prompt ?? p.stem)}
                          </p>
                          <p className="mt-1.5 break-words text-sm font-extrabold text-[#0a7d3f]">
                            ✓ {p.kind === "choice" ? p.options[p.answer] : p.answers[0]}
                          </p>
                          <p className="mt-1 text-xs leading-relaxed text-ink/60">
                            Marks: {p.marks}
                            {p.kind !== "choice" && p.answers.length > 1 && (
                              <>
                                {" · "}
                                Accepted alternatives: {p.answers.join(" | ")}
                              </>
                            )}
                          </p>
                        </div>
                      ))}
                    </div>

                    <p className="mt-3 rounded-2xl border-l-4 border-brand-yellow bg-brand-yellow/10 p-3 text-xs leading-relaxed text-ink/75">
                      <span className="font-extrabold uppercase tracking-wider text-ink/65">
                        Marking note:{" "}
                      </span>
                      {q.explanation}
                    </p>
                  </article>
                );
              })}
            </section>
          </>
        )}
      </main>

      <ContactFooter compact />
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="rounded-2xl border-2 border-ink/10 bg-paper p-3 text-center">
      <div className="font-display text-lg" style={{ color: accent }}>
        {value}
      </div>
      <div className="text-[10px] font-extrabold uppercase tracking-wider text-ink/65">
        {label}
      </div>
    </div>
  );
}
