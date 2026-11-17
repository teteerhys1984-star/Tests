import { useState } from "react";
import ContactStrip from "@/components/ContactStrip";
import { Lock } from "@/components/Decor";
import { EXAM_TITLE } from "@/config";
import { LESSON_TITLES, PASSAGES, QUESTIONS } from "@/data/exam";
import { correctDisplay } from "@/lib/grading";

const PASS = "somer173";

export default function TeacherKey({ onClose }: { onClose: () => void }) {
  const [entry, setEntry] = useState("");
  const [err, setErr] = useState(false);
  const [open, setOpen] = useState(false);

  const unlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (entry.trim() === PASS) {
      setOpen(true);
      setErr(false);
    } else {
      setErr(true);
    }
  };

  if (!open) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/45 p-4 backdrop-blur-sm">
        <div className="settle w-full max-w-md rounded-[28px] border border-lilac-pale bg-white p-6 shadow-2xl sm:p-7">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-lilac-deep">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-lavender">
                <Lock className="h-5 w-5" />
              </span>
              <div>
                <p className="eyebrow">Teacher Portal</p>
                <h2 className="font-display text-[20px] font-black text-ink">
                  Answer Key &amp; Sources
                </h2>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close teacher dialog"
              className="rounded-xl px-3 py-2 text-[14px] font-extrabold text-ink-soft hover:bg-lavender"
            >
              Close
            </button>
          </div>

          <form onSubmit={unlock} className="mt-5 space-y-3">
            <label htmlFor="teacher-pass" className="block text-[14px] font-bold text-ink">
              Enter teacher password
            </label>
            <input
              id="teacher-pass"
              type="password"
              value={entry}
              onChange={(e) => {
                setEntry(e.target.value);
                setErr(false);
              }}
              placeholder="Password"
              autoFocus
              className="min-h-[48px] w-full rounded-2xl border-2 border-lilac-pale bg-paper px-4 py-3 text-[16px] font-semibold focus:border-lilac focus:bg-white focus:outline-none"
            />
            {err && <p className="text-[13px] font-bold text-[#a3335a]">Incorrect password.</p>}
            <button
              type="submit"
              className="min-h-[48px] w-full rounded-2xl bg-lilac-deep px-5 py-3 text-[15px] font-extrabold text-white transition hover:bg-lilac"
            >
              Unlock Answer Key
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full overflow-x-clip bg-paper pb-16">
      <header className="sticky top-0 z-30 border-b border-lilac-pale bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div>
            <p className="eyebrow text-lilac">Teacher View · Unlocked</p>
            <h1 className="font-display text-[19px] font-black text-ink">
              Answer Key · {EXAM_TITLE}
            </h1>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl bg-lilac-deep px-4 py-2.5 text-[14px] font-extrabold text-white"
          >
            Back
          </button>
        </div>
      </header>

      <main className="mx-auto mt-6 max-w-4xl space-y-4 px-4 sm:px-6">
        <div className="rounded-3xl border border-lilac-pale bg-lavender/70 p-4 text-[13.5px] font-semibold text-lilac-deep">
          25 questions · 100 marks · 98 sub-items · 5 questions (20 marks) per lesson · 2 reading
          passages · 0 listening items.
        </div>

        {QUESTIONS.map((q) => (
          <section
            key={q.id}
            className="rounded-3xl border border-lilac-pale bg-white p-5 shadow-[0_14px_30px_-28px_rgba(110,63,151,0.6)]"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="eyebrow text-lilac-deep">
                Q{q.n} · {LESSON_TITLES[q.lesson]}
              </p>
              <p className="text-[12px] font-bold text-ink-soft">
                {q.source.page} · {q.source.exercise} ({q.source.skill})
              </p>
            </div>
            <p className="mt-1 text-[16px] font-extrabold text-ink">{q.instruction}</p>
            {q.passage && (
              <p className="mt-1 text-[12px] font-bold text-lilac">
                Passage: {PASSAGES[q.passage].label} ({PASSAGES[q.passage].origin})
              </p>
            )}

            <div className="mt-3 space-y-2.5">
              {q.items.map((it, i) => (
                <div key={it.id} className="rounded-2xl bg-paper p-3 text-[14px]">
                  <p className="font-bold text-ink">
                    ({String.fromCharCode(97 + i)}) {it.prompt}
                  </p>
                  <p className="mt-1">
                    <strong className="text-[#237771]">Key:</strong>{" "}
                    <span className="font-extrabold text-[#237771]">{correctDisplay(it)}</span>{" "}
                    <span className="text-ink-soft">({it.marks} mark)</span>
                    {it.kind === "text" && it.accept.length > 1 && (
                      <span className="ml-2 text-[12.5px] text-ink-soft">
                        · Accepted: {it.accept.join(" / ")}
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 text-[13px] text-ink-soft">{it.explain}</p>
                </div>
              ))}
            </div>
          </section>
        ))}
      </main>

      <ContactStrip onOpenTeacher={undefined} />
    </div>
  );
}
