import { useState } from "react";
import { EXAM_TITLE } from "@/config";
import {
  LESSONS,
  QUESTIONS,
  TOTAL_MARKS,
  TOTAL_PARTS,
  lessonMarks,
  questionMarks,
} from "@/data/exam";
import {
  CHOICE_ANSWER_OVERRIDES,
  correctAnswerText,
  partPromptText,
} from "@/lib/grading";
import ContactFooter from "./ContactFooter";
import { KeyIcon, XIcon } from "./Icons";

interface Props {
  onClose: () => void;
}

const PASSWORD = "somer173";

export default function TeacherArea({ onClose }: Props) {
  const [value, setValue] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (value === PASSWORD) {
      setUnlocked(true);
      setError("");
    } else {
      setError("Incorrect password. Try again.");
    }
  }

  return (
    <div
      className="min-h-dvh dot-paper"
      role="dialog"
      aria-modal="true"
      aria-label="Teacher Area"
    >
      <header className="sticky top-0 z-30 border-b-2 border-ink/10 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-3">
          <KeyIcon className="h-5 w-5 shrink-0 text-brand-orange" />
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-display text-sm font-black uppercase tracking-wide text-ink sm:text-base">
              Teacher Area · {EXAM_TITLE}
            </h1>
            <p className="text-[11px] font-bold uppercase tracking-wider text-ink/60">
              Answer key · marks · grading details
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border-2 border-ink/15 bg-white text-ink hover:border-brand-blue"
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
            className="mx-auto max-w-md rounded-3xl border-[3px] border-[#0b2a5b] bg-white p-5 sticker-strong sm:p-6"
          >
            <h2 className="font-display text-lg font-black uppercase text-ink">
              Enter the teacher password
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-ink/65">
              Unlock the full answer key, mark distribution, grading rules, accepted alternatives
              and curriculum references for Model B.
            </p>
            <label
              htmlFor="teacher-pass"
              className="mt-4 block text-xs font-extrabold uppercase tracking-[0.16em] text-ink/65"
            >
              Password
            </label>
            <input
              id="teacher-pass"
              type="password"
              value={value}
              autoFocus
              onChange={(e) => {
                setValue(e.target.value);
                if (error) setError("");
              }}
              className="mt-1.5 min-h-12 w-full rounded-2xl border-2 border-ink/15 bg-paper px-4 py-3 text-base font-bold text-ink focus:border-brand-blue focus:bg-white"
              placeholder="••••••••"
            />
            <div
              aria-live="polite"
              className="mt-1.5 min-h-5 text-sm font-bold text-[#d43a1f]"
            >
              {error}
            </div>
            <button
              type="submit"
              className="mt-2 min-h-12 w-full rounded-2xl bg-ink px-4 font-display text-sm font-black uppercase tracking-wide text-white hover:bg-brand-blue"
            >
              Unlock answer key
            </button>
            <div className="mt-4 rounded-2xl bg-paper p-3 text-[11px] leading-relaxed text-ink/65">
              <p>
                This is a cosmetic client-side convenience gate for classroom viewing only — not
                real authentication, encryption, or security protection.
              </p>
              <p dir="rtl" lang="ar" className="mt-1 font-semibold">
                تنبيه: هذه بوابة تجميلية على جهة العميل فقط لتنظيم العرض داخل الصف، وليست حماية
                أمنية أو تشفيرًا حقيقيًا.
              </p>
            </div>
          </form>
        ) : (
          <>
            {/* mark distribution */}
            <section className="rounded-3xl border-2 border-ink/10 bg-white p-4 sticker sm:p-5">
              <h2 className="font-display text-base font-black uppercase tracking-wide text-ink">
                Answer key · {QUESTIONS.length} questions · {TOTAL_PARTS} parts · {TOTAL_MARKS}{" "}
                marks
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
              <p className="mt-3 text-xs leading-relaxed text-ink/65">
                30 main questions · 10 per lesson · 47 answerable parts (20 MCQ, 2 True/False, 21
                fill-in-the-blank, 4 extended short-answer) · 33 + 34 + 33 = 100 marks · two
                reading passages (Student’s Book p. 7 and p. 21). Typed answers are graded
                case-insensitively with punctuation and apostrophe normalisation (exact match or
                required-phrase inclusion). Client-side convenience gate only, not real security.
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
                        className="grid h-10 w-10 shrink-0 place-items-center rounded-xl font-display text-sm font-black tabular text-white"
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
                      <span className="shrink-0 rounded-lg bg-paper px-2.5 py-1 text-xs font-extrabold tabular text-brand-blue">
                        {questionMarks(q)} {questionMarks(q) === 1 ? "mark" : "marks"}
                      </span>
                    </div>

                    <div className="mt-3 space-y-2">
                      {q.parts.map((p, i) => {
                        const overridden =
                          p.kind === "choice" && p.id in CHOICE_ANSWER_OVERRIDES;
                        return (
                          <div
                            key={p.id}
                            className="rounded-2xl border-2 border-ink/10 bg-paper/70 p-3"
                          >
                            <p className="break-words text-xs font-bold text-ink/75">
                              {q.parts.length > 1
                                ? `Part ${String.fromCharCode(97 + i)} — `
                                : ""}
                              {partPromptText(p)}
                            </p>
                            <p className="mt-1.5 break-words text-sm font-extrabold text-[#0a7d3f]">
                              ✓ {correctAnswerText(p)}
                            </p>
                            <p className="mt-1 break-words text-xs leading-relaxed text-ink/65">
                              Marks: {p.marks}
                              {p.kind !== "choice" && ` · Mode: ${p.mode}`}
                              {p.kind !== "choice" && p.answers.length > 1 && (
                                <> · Accepted alternatives: {p.answers.join(" | ")}</>
                              )}
                              {overridden && (
                                <>
                                  {" "}
                                  · Grading adapter: matched option index 0 to the passage and
                                  explanation (Student’s Book p. 8 · Reading B).
                                </>
                              )}
                            </p>
                          </div>
                        );
                      })}
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
      <div className="font-display text-lg font-black tabular" style={{ color: accent }}>
        {value}
      </div>
      <div className="text-[10px] font-extrabold uppercase tracking-wider text-ink/65">
        {label}
      </div>
    </div>
  );
}
