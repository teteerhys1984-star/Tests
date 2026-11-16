import { useState } from "react";
import { KeyRound, Lock, ShieldCheck, X } from "lucide-react";
import { LESSON_TITLES, MISSIONS, QUESTIONS, TOTAL_MARKS } from "../data/questions";
import { cn } from "../utils/cn";

const TEACHER_PASSWORD = "somer173";

/**
 * Hidden teacher area — a static client-side password gate only.
 * NOT real authentication or encryption: the password is embedded in
 * frontend code and only hides the key from casual student viewing.
 */
export default function TeacherKey({ onClose }: { onClose: () => void }) {
  const [pw, setPw] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState(false);

  const tryUnlock = () => {
    if (pw === TEACHER_PASSWORD) {
      setUnlocked(true);
      setError(false);
    } else {
      setError(true);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Teacher answer key"
    >
      <div className="hud-panel hud-corners flex max-h-[88vh] w-full max-w-4xl flex-col rounded-xl">
        <div className="flex items-center gap-3 border-b border-[#232d15] px-5 py-4">
          <span className="flex h-9 w-9 items-center justify-center rounded border border-[#b58500] bg-[#221a03]">
            <Lock className="h-4.5 w-4.5 text-[#ffb400]" />
          </span>
          <div>
            <h2 className="font-hud text-sm font-black tracking-[0.22em] text-[#f4ecd4] uppercase">
              Teacher Answer Key
            </h2>
            <p className="text-[12.5px] font-semibold text-[#8fa06d]">
              Grade 4 · Unit 1 · Lessons 1–5 · staff only
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close teacher area"
            className="btn-ghost ml-auto rounded-md p-2"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {!unlocked ? (
          <div className="px-5 py-8">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                tryUnlock();
              }}
              className="mx-auto max-w-sm"
            >
              <label
                htmlFor="teacher-pw"
                className="font-hud mb-2 flex items-center gap-2 text-[10px] font-bold tracking-[0.22em] text-[#cbb894] uppercase"
              >
                <KeyRound className="h-3.5 w-3.5 text-[#ffb400]" />
                Access password
              </label>
              <input
                id="teacher-pw"
                type="password"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                autoComplete="off"
                className="tac-input w-full rounded-md px-4 py-2.5 text-[15px] font-semibold tracking-[0.2em]"
                placeholder="••••••••"
              />
              {error && (
                <p className="mt-2 text-[13px] font-semibold text-[#ff8d7e]">
                  Incorrect password. This area is for teachers only.
                </p>
              )}
              <button
                type="submit"
                className="btn-primary mt-4 w-full rounded-md px-5 py-2.5 text-[12px] font-black"
              >
                Unlock Answer Key
              </button>
              <p className="mt-3 text-center text-[11.5px] leading-snug font-medium text-[#5c6a45]">
                Note: this is a static client-side gate — a basic access barrier, not real
                authentication or encryption.
              </p>
            </form>
          </div>
        ) : (
          <div className="overflow-y-auto px-5 py-5">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <ShieldCheck className="h-4.5 w-4.5 text-[#7dd069]" />
              <p className="text-[14px] font-semibold text-[#a9c37e]">
                All 35 questions · {TOTAL_MARKS} marks total · correct answers, accepted forms,
                rubrics and curriculum references.
              </p>
            </div>
            <ol className="grid gap-3">
              {QUESTIONS.map((q) => {
                const m = MISSIONS[q.mission - 1];
                return (
                  <li key={q.id} className="rounded-lg border border-[#232d15] bg-[#0d120a] p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-hud rounded border border-[#b58500] bg-[#221a03] px-2 py-0.5 text-[10px] font-black text-[#ffb400]">
                        Q{String(q.n).padStart(2, "0")}
                      </span>
                      <span className="font-hud text-[11px] font-bold tracking-wider text-[#e6dcc0] uppercase">
                        {q.title}
                      </span>
                      <span className="hud-chip">{q.skill}</span>
                      <span className="hud-chip">
                        L{q.lesson} · {LESSON_TITLES[q.lesson]}
                      </span>
                      <span className="hud-chip">
                        {m.code} {m.name}
                      </span>
                      <span className="font-hud ml-auto text-[11px] font-bold text-[#ffd75e] tabular-nums">
                        {q.marks} marks
                      </span>
                    </div>
                    <p className="mt-2 text-[14px] font-medium text-[#9aa886] italic">{q.instruction}</p>
                    {q.passage && (
                      <p className="mt-1 rounded border border-[#232d15] bg-[#0a0d08] p-2 text-[13px] leading-relaxed text-[#cbb894]">
                        {q.passage}
                      </p>
                    )}
                    <div className="mt-2 grid gap-1.5">
                      {q.parts.map((p) => (
                        <div
                          key={p.id}
                          className="rounded border border-[#1c2411] bg-[#090c07] px-3 py-2 text-[13.5px]"
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-[#efe7cf]">{p.prompt}</p>
                            {p.arabic && (
                              <span
                                dir="rtl"
                                lang="ar"
                                className="ar-word rounded border border-[#b58500] bg-[#171304] px-2.5 py-0.5 text-[15px] font-bold text-[#ffd75e]"
                              >
                                {p.arabic}
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5">
                            <span className="font-hud mr-2 text-[8.5px] tracking-[0.2em] text-[#55682c] uppercase">
                              Key
                            </span>
                            <span className={cn("font-bold", "text-[#8fdf7a]")}>
                              {p.kind === "mcq" &&
                                p.options.find((o) => o.id === p.answer)?.text}
                              {p.kind === "tf" && (p.answer ? "True" : "False")}
                              {p.kind === "fill" &&
                                `${p.accept[0]}${p.accept.length > 1 ? `  (also accepted: ${p.accept.slice(1).join(", ")})` : ""}`}
                              {p.kind === "match" &&
                                q.matchOptions?.find((o) => o.id === p.answer)?.text}
                              {p.kind === "order" && p.answer.join(" ") + "."}
                              {p.kind === "rubric" && "Auto-rubric (see criteria)"}
                            </span>
                            <span className="font-hud ml-2 text-[9.5px] text-[#8fa06d]">
                              [{p.marks} {p.marks === 1 ? "mark" : "marks"}]
                            </span>
                          </p>
                          {p.kind === "rubric" && (
                            <ul className="mt-1 ml-1 space-y-0.5">
                              {p.criteria.map((c) => (
                                <li key={c.id} className="text-[12.5px] font-medium text-[#a9c37e]">
                                  • {c.description} — {c.marks} {c.marks === 1 ? "mark" : "marks"}
                                </li>
                              ))}
                            </ul>
                          )}
                          <p className="mt-0.5 text-[12.5px] text-[#5c6a45]">{p.explanation}</p>
                        </div>
                      ))}
                    </div>
                    <p className="mt-2 border-t border-[#1c2411] pt-2 font-hud text-[9px] leading-relaxed tracking-[0.14em] text-[#5c6a45] uppercase">
                      Source — Unit 1 · Lesson {q.lesson} ({LESSON_TITLES[q.lesson]}) · {q.ref.book}{" "}
                      {q.ref.pages} · {q.ref.activity} · {q.ref.detail}
                    </p>
                  </li>
                );
              })}
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}
