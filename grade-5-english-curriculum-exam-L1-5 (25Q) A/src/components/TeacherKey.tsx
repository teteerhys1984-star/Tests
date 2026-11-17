import { useState } from "react";
import ContactStrip from "@/components/ContactStrip";
import { Lock, Star } from "@/components/Decor";
import { LESSON_TITLES, QUESTIONS, TOTAL_MARKS } from "@/data/exam";
import { LESSON_COUNTS } from "@/data/exam";

const PASSWORD = "somer173";

interface Props {
  onClose: () => void;
}

export default function TeacherKey({ onClose }: Props) {
  const [value, setValue] = useState("");
  const [ok, setOk] = useState(false);
  const [error, setError] = useState(false);

  const unlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (value === PASSWORD) {
      setOk(true);
      setError(false);
    } else {
      setError(true);
    }
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-paper">
      <div className="mx-auto max-w-4xl px-3 pt-5 sm:px-6 sm:pt-8">
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-2 rounded-full border border-lilac-pale bg-white px-3 py-2">
            <Lock className="h-4 w-4 text-lilac" />
            <span className="eyebrow text-lilac-deep">Teacher only</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] rounded-full border-2 border-lilac-pale bg-white px-4 text-[14px] font-extrabold text-lilac-deep transition active:scale-95"
          >
            Close
          </button>
        </div>

        {!ok ? (
          <section className="mx-auto mt-10 max-w-md rounded-[28px] border border-lilac-pale bg-white p-6 text-center shadow-[0_36px_70px_-58px_rgba(110,63,151,1)]">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-lavender">
              <Lock className="h-7 w-7 text-lilac-deep" />
            </span>
            <h1 className="mt-4 font-display text-[26px] font-black text-lilac-deep">
              Answer Key
            </h1>
            <p className="mt-2 text-[14px] leading-relaxed text-ink-soft">
              Enter the teacher password to reveal all correct answers, marks, explanations and the
              internal lesson mapping.
            </p>
            <form onSubmit={unlock} className="mt-5">
              <input
                type="password"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Teacher password"
                autoComplete="off"
                className="w-full rounded-2xl border-2 border-lilac-pale bg-paper px-4 py-3.5 text-[16px] font-semibold text-ink focus:border-lilac focus:bg-white focus:outline-none"
              />
              {error && (
                <p className="mt-2 text-[13px] font-bold text-[#c25a4a]">
                  Incorrect password. Please try again.
                </p>
              )}
              <button
                type="submit"
                className="mt-4 min-h-[52px] w-full rounded-2xl bg-lilac-deep text-[16px] font-extrabold text-white transition hover:bg-lilac active:scale-[0.99]"
              >
                Unlock Solutions
              </button>
            </form>
            <p className="mt-4 rounded-xl bg-blush px-3 py-2.5 text-[12px] leading-relaxed text-ink-soft">
              Note: this is a visibility barrier only, not real authentication or encryption. The
              answer text already ships inside the published page source.
            </p>
          </section>
        ) : (
          <section className="mt-6">
            <div className="rounded-[26px] border border-lilac-pale bg-white p-5">
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-peach" />
                <h1 className="font-display text-[26px] font-black text-lilac-deep">
                  Answer Key · Grade 5 Unit 1 · Model A
                </h1>
              </div>
              <p className="mt-2 text-[14px] text-ink-soft">
                25 questions · {TOTAL_MARKS} marks · five questions from each lesson · two reading
                passages · no listening-dependent item.
              </p>
              <div className="mt-4 grid gap-2 sm:grid-cols-5">
                {LESSON_COUNTS.map((l) => (
                  <div
                    key={l.lesson}
                    className="rounded-2xl border border-lilac-pale bg-lavender px-3 py-2.5 text-center"
                  >
                    <p className="num font-display text-[20px] font-black text-lilac-deep">
                      {l.count}
                    </p>
                    <p className="text-[11px] font-extrabold leading-tight text-ink-soft">
                      {LESSON_TITLES[l.lesson as 1 | 2 | 3 | 4 | 5]}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 space-y-4">
              {QUESTIONS.map((q) => (
                <article
                  key={q.id}
                  className="overflow-hidden rounded-[24px] border border-lilac-pale bg-white"
                >
                  <div className="flex flex-wrap items-center gap-2 border-b border-lilac-pale bg-lilac-deep px-4 py-3 text-white">
                    <span className="num grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/15 font-display text-[16px] font-black">
                      {q.n}
                    </span>
                    <p className="min-w-0 flex-1 text-[13.5px] font-extrabold">
                      {LESSON_TITLES[q.lesson]}
                    </p>
                    <p className="num w-full text-[11.5px] opacity-90 sm:w-auto">
                      {q.items.reduce((s, i) => s + i.marks, 0)} marks
                    </p>
                  </div>

                  <div className="border-b border-lilac-pale bg-lavender px-4 py-2.5">
                    <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-lilac">
                      Internal source
                    </p>
                    <p className="text-[13px] font-bold text-ink">
                      {q.source.page} · {q.source.exercise}
                    </p>
                    <p className="text-[13px] text-ink-soft">Skill: {q.source.skill}</p>
                  </div>

                  <p className="px-4 pt-3 text-[14.5px] font-extrabold text-ink">
                    {q.instruction}
                  </p>

                  <div className="divide-y divide-lilac-pale">
                    {q.items.map((it, idx) => (
                      <div key={it.id} className="px-4 py-3">
                        <div className="flex items-start gap-2">
                          <span className="num text-[13px] font-extrabold text-lilac">
                            {String.fromCharCode(97 + idx)}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-[14px] font-bold text-ink">{it.prompt}</p>
                            <p className="mt-1 rounded-xl bg-mint px-3 py-2 text-[14px] font-extrabold text-[#216b66]">
                              Answer:{" "}
                              {it.kind === "order"
                                ? it.answer.split("|").join(" ")
                                : it.kind === "text"
                                  ? `${it.answer}  (accepts: ${it.accept.join(", ")})`
                                  : it.answer}
                            </p>
                            <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-soft">
                              {it.explain}
                            </p>
                            <p className="num mt-1 text-[12px] font-bold text-ink-soft/75">
                              Marks: {it.marks} · Q{q.n}
                              {String.fromCharCode(97 + idx)} · {q.source.page}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </div>
      <ContactStrip />
    </div>
  );
}
