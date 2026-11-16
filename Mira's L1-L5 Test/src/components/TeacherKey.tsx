import { useState } from "react";
import { Download, KeyRound, LockKeyhole, ShieldAlert, X } from "lucide-react";
import { QUESTIONS, EXAM_META, questionMarks } from "../data/examData";
import { downloadTeacherKey } from "../logic/report";

const TEACHER_PASSWORD = "somer173";

interface TeacherKeyProps {
  open: boolean;
  onClose: () => void;
}

export default function TeacherKey({ open, onClose }: TeacherKeyProps) {
  const [password, setPassword] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState(false);

  if (!open) return null;

  const tryUnlock = () => {
    if (password === TEACHER_PASSWORD) {
      setUnlocked(true);
      setError(false);
    } else {
      setError(true);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-stretch justify-center bg-violet-deep/45 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Teacher answer key">
      <div className="relative my-4 flex w-full max-w-4xl flex-col overflow-hidden rounded-[1.8rem] bg-cream shadow-lift">
        <header className="flex items-center justify-between gap-3 border-b-2 border-lilac/40 bg-gradient-to-r from-petal/40 to-lilac/40 px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-rose to-violet text-white">
              <KeyRound className="h-5.5 w-5.5" strokeWidth={2.4} />
            </span>
            <div>
              <h2 className="font-display text-xl font-bold text-violet-deep">Teacher Answer Key</h2>
              <p className="text-xs font-bold uppercase tracking-wider text-ink-soft">
                {EXAM_META.title} · {EXAM_META.scope} · confidential
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close teacher area"
            className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-lilac bg-white/80 text-violet hover:border-rose hover:text-rose"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        {!unlocked ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-14 text-center">
            <LockKeyhole className="h-12 w-12 text-rose" strokeWidth={1.8} />
            <p className="max-w-md text-sm font-semibold text-ink-soft">
              This area is for teachers only. Please enter the teacher password to view the
              complete answer key, mark allocations and marking rubrics.
            </p>
            <div className="flex w-full max-w-xs flex-col gap-3">
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(false); }}
                onKeyDown={(e) => e.key === "Enter" && tryUnlock()}
                placeholder="Teacher password"
                aria-label="Teacher password"
                autoComplete="off"
                className={`w-full rounded-2xl border-2 bg-white px-4 py-3 text-center font-display font-bold text-ink shadow-soft focus:border-rose ${error ? "border-rose" : "border-lilac"}`}
              />
              {error && (
                <p className="flex items-center justify-center gap-1.5 text-[13px] font-bold text-rose-deep">
                  <ShieldAlert className="h-4 w-4" /> Incorrect password. Please try again.
                </p>
              )}
              <button
                type="button"
                onClick={tryUnlock}
                className="rounded-full bg-gradient-to-r from-rose to-violet px-6 py-3 font-display text-base font-bold text-white shadow-lift transition-transform hover:scale-[1.03]"
              >
                Unlock Answer Key
              </button>
              <p className="text-[11px] leading-relaxed text-ink-soft/70">
                Note: this password is a basic client-side access barrier in a static site — it is not encryption or real authentication.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-6 py-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-lilac/40 px-4 py-3">
              <p className="text-sm font-bold text-violet-deep">
                {EXAM_META.totalQuestions} questions · {EXAM_META.vocabularyQuestions} vocabulary · {EXAM_META.totalMarks} marks total
              </p>
              <button
                type="button"
                onClick={downloadTeacherKey}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-rose to-violet px-5 py-2.5 font-display text-sm font-bold text-white shadow-soft transition-transform hover:scale-[1.03]"
              >
                <Download className="h-4 w-4" strokeWidth={2.6} /> Download Key (TXT)
              </button>
            </div>

            <ol className="space-y-4">
              {QUESTIONS.map((q) => (
                <li key={q.id} className="rounded-2xl border-2 border-lilac/40 bg-white/80 p-4">
                  <header className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="font-display text-base font-bold text-ink">
                      Q{q.id} · {q.instruction}
                    </h3>
                    <span className="text-[11px] font-extrabold uppercase tracking-wide text-ink-soft">
                      {q.category} · {questionMarks(q)} mark(s) · Lesson {q.lesson}
                    </span>
                  </header>
                  {q.stimulus && (
                    <p className="mt-2 whitespace-pre-line rounded-xl bg-cream-deep/70 px-3 py-2 text-[13px] font-semibold text-ink-soft">
                      {q.stimulusTitle ? `${q.stimulusTitle}: ` : ""}{q.stimulus}
                    </p>
                  )}
                  <ul className="mt-3 space-y-2.5">
                    {q.parts.map((p) => (
                      <li key={p.id} className="rounded-xl bg-petal/15 px-3.5 py-2.5 text-[13.5px]">
                        <p className="whitespace-pre-line font-bold text-ink">
                          {q.parts.length > 1 ? `${p.id}) ` : ""}{p.text.replace(/____/g, "………")}
                          {p.arabic && <span dir="rtl" lang="ar" className="arabic-word mx-1 rounded-md bg-petal/30 px-2 py-0.5 text-[14px] font-bold text-violet-deep">{p.arabic}</span>}{" "}
                          <span className="text-[11px] font-extrabold uppercase text-ink-soft">— {p.marks} mark(s)</span>
                        </p>
                        <p className="mt-1 font-semibold text-leaf-deep">
                          Answer:{" "}
                          {p.kind === "mcq" || p.kind === "select"
                            ? p.options?.find((o) => o.id === p.correctOptionId)?.label
                            : p.kind === "tf"
                              ? p.correctBool ? "True" : "False"
                              : p.kind === "order"
                                ? p.acceptedOrders?.[0]
                                : p.kind === "writing"
                                  ? "Teacher review — apply rubric below"
                                  : p.accepted?.[0]}
                        </p>
                        {p.accepted && p.accepted.length > 1 && (
                          <p className="mt-0.5 text-[12.5px] font-semibold text-ink-soft">
                            Also accepted: {p.accepted.slice(1).join(" · ")}
                          </p>
                        )}
                        {p.rubric && (
                          <ul className="mt-1 list-disc space-y-0.5 pl-5 text-[12.5px] font-semibold text-ink">
                            {p.rubric.map((r) => <li key={r}>{r}</li>)}
                          </ul>
                        )}
                        <p className="mt-1 text-[12.5px] font-semibold text-violet">Why: {p.explanation}</p>
                        <p className="mt-0.5 text-[11px] font-bold uppercase tracking-wide text-ink-soft/70">
                          Ref: Lesson {q.reference.lesson} — {q.reference.lessonTitle} · {q.reference.source} · Skill: {q.reference.skill}
                        </p>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ol>

            <p className="mt-5 rounded-2xl bg-gold/20 px-4 py-3 text-[12.5px] font-semibold text-ink">
              Grading notes: written answers are normalised before checking (capital letters, extra spaces and
              final punctuation are ignored). The Question 29 writing task is flagged for teacher review and is
              marked by hand using its 4-mark rubric.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
