import { useState } from "react";
import { LESSONS, QUESTIONS } from "@/data/exam";

const PASSWORD = "somer173";

export default function TeacherArea({ onClose }: { onClose: () => void }) {
  const [pw, setPw] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pw === PASSWORD) {
      setUnlocked(true);
      setError("");
    } else {
      setError("Incorrect password. Try again.");
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-ink/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Teacher area"
    >
      <div className="mx-auto flex h-full w-full max-w-5xl flex-col overflow-hidden rounded-none bg-paper shadow-lift sm:mt-6 sm:h-[92vh] sm:rounded-[26px]">
        <header className="flex items-center gap-3 border-b border-hair bg-white px-4 py-3.5 sm:px-6">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-ink font-display text-[15px] font-black text-white">
            T
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-display text-[15px] font-black">Teacher Area</p>
            <p className="truncate text-[12px] font-semibold text-ink/50">Grade 8 · Unit 1 · Model A answer key</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close teacher area"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border-2 border-hair bg-white text-ink/70 transition hover:border-electric/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-electric"
          >
            ✕
          </button>
        </header>

        {!unlocked ? (
          <div className="flex flex-1 items-center justify-center px-4 py-8">
            <form onSubmit={submit} className="w-full max-w-sm rounded-[24px] border border-hair bg-white p-6 shadow-card">
              <h2 className="font-display text-[22px] font-black">Enter the teacher password</h2>
              <p className="mt-2 text-[14px] leading-relaxed text-ink/60">
                This gate is a convenience for the classroom only. It is a client-side check — not authentication, not
                encryption, and not a substitute for keeping the key private.
              </p>
              <label htmlFor="teacher-pw" className="mt-4 block text-[13px] font-black uppercase tracking-[0.12em] text-ink/60">
                Password
              </label>
              <input
                id="teacher-pw"
                type="password"
                value={pw}
                autoFocus
                onChange={(e) => {
                  setPw(e.target.value);
                  setError("");
                }}
                className="field mt-2"
                placeholder="••••••••"
              />
              <div aria-live="polite" className="min-h-6 text-[14px] font-semibold text-[#D93025]">
                {error}
              </div>
              <button
                type="submit"
                className="mt-1 min-h-14 w-full rounded-2xl bg-ink font-display text-[17px] font-extrabold text-white transition hover:bg-electric focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-electric"
              >
                Unlock answer key
              </button>
            </form>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6">
            <div className="rounded-[20px] border-2 border-sun bg-sun/15 px-4 py-3 text-[14px] font-semibold leading-relaxed text-ink/75">
              <strong className="font-black">Answer key · 30 questions · 100 marks.</strong> Lesson 1 = 33 marks,
              Lesson 2 = 34 marks, Lesson 3 = 33 marks. Two reading passages only: “Schools in the Past, Present and
              Future” (Student’s Book p. 7) and “My Amazing Journey” (Student’s Book p. 21).
            </div>

            {LESSONS.map((l) => (
              <section key={l.id} className="mt-6">
                <h3 className="font-display text-[19px] font-black" style={{ color: l.color }}>
                  Lesson {l.id} — {l.title} · {l.marks} marks
                </h3>
                <div className="mt-3 space-y-3">
                  {QUESTIONS.filter((q) => q.lesson === l.id).map((q) => (
                    <article key={q.id} className="overflow-hidden rounded-[20px] border border-hair bg-white">
                      <header className="flex flex-wrap items-center gap-2 border-b border-hair bg-paper px-4 py-2.5">
                        <span className="grid h-8 min-w-8 place-items-center rounded-md bg-white px-2 font-display text-[14px] font-black tabular-nums ring-1 ring-hair">
                          Q{q.id}
                        </span>
                        <span className="text-[14px] font-bold text-ink/75">{q.typeLabel}</span>
                        <span className="ml-auto rounded-full bg-white px-2.5 py-1 text-[12px] font-black tabular-nums ring-1 ring-hair">
                          {q.marks} marks
                        </span>
                      </header>
                      <div className="px-4 py-3">
                        <p className="text-[14.5px] font-semibold leading-relaxed text-ink">{q.instruction}</p>
                        <ol className="mt-3 space-y-2">
                          {q.parts.map((p, i) => {
                            const answer =
                              p.kind === "mc"
                                ? p.options[p.answer]
                                : p.kind === "tf"
                                  ? p.answer
                                    ? "True"
                                    : "False"
                                  : p.key;
                            const alts =
                              p.kind === "text" && p.answers.length > 1
                                ? p.answers.filter((a) => a !== p.key && a.toLowerCase() !== p.key.toLowerCase())
                                : [];
                            return (
                              <li key={i} className="rounded-xl bg-paper px-3 py-2.5">
                                <div className="flex flex-wrap items-baseline gap-2">
                                  <span className="font-display text-[13px] font-black tabular-nums text-ink/45">
                                    {i + (q.id === 14 ? 5 : 1)}.
                                  </span>
                                  <span className="min-w-0 flex-1 break-words text-[14.5px] font-bold text-ink">
                                    {p.stem && p.stem.trim() ? `${p.stem} → ` : ""}
                                    <span className="text-[#0E9B58]">{answer}</span>
                                  </span>
                                </div>
                                {p.kind === "text" && (
                                  <p className="mt-1 break-words text-[13px] text-ink/60">
                                    Accepted: {[p.key, ...alts].join("  ·  ")}
                                  </p>
                                )}
                              </li>
                            );
                          })}
                        </ol>
                        <p className="mt-3 text-[13.5px] leading-relaxed text-ink/70">
                          <span className="font-black text-ink/80">Why:</span> {q.explanation}
                        </p>
                        <p className="mt-1.5 text-[13px] font-semibold text-ink/50">
                          <span className="font-black text-ink/60">Source:</span> {q.ref}
                        </p>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
