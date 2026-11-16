/**
 * Teacher Answer Key — hidden behind a password gate.
 *
 * NOTE (shown to teachers inside the view): a client-side password gate is a
 * classroom visibility barrier only. It is NOT real authentication or
 * encryption — the answers ship in the browser bundle and a technically
 * skilled user could inspect them. We never claim otherwise.
 */
import { useEffect, useRef, useState } from "react";
import { KeyRound, Lock, ShieldAlert, X } from "lucide-react";
import { QUESTIONS } from "../data/questions";
import { formatMarks, gradeExam } from "../lib/grading";
import type { AnswerValue } from "../types";
import { cn } from "../utils/cn";

const TEACHER_PASSWORD = "somer173";

/** Build the canonical correct answer for every subpart by grading with the
 * correct values and reading the displays back. */
function useAnswerKey() {
  const answers: Record<string, AnswerValue> = {};
  for (const q of QUESTIONS)
    for (const s of q.subparts) {
      switch (s.type) {
        case "mcq":
          answers[s.id] = { kind: "mcq", index: s.correctIndex };
          break;
        case "tf":
          answers[s.id] = { kind: "tf", value: s.correct };
          break;
        case "select":
          answers[s.id] = { kind: "select", value: s.correct };
          break;
        case "text":
          answers[s.id] = { kind: "text", value: s.accept[0] };
          break;
        case "reorder":
          answers[s.id] = { kind: "reorder", value: [...s.target] };
          break;
      }
    }
  return gradeExam(QUESTIONS, answers);
}

export function TeacherArea({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [password, setPassword] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const key = useAnswerKey();

  useEffect(() => {
    if (open) {
      setPassword("");
      setError("");
      window.setTimeout(() => inputRef.current?.focus(), 60);
      document.body.style.overflow = "hidden";
    } else {
      setUnlocked(false);
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  const tryUnlock = () => {
    if (password === TEACHER_PASSWORD) {
      setUnlocked(true);
      setError("");
    } else {
      setError("Incorrect password. Please try again.");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Teacher answer key"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {!unlocked ? (
        <div className="glass animate-pop w-full max-w-sm rounded-3xl p-7">
          <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-400/30 bg-amber-400/10">
            <Lock className="h-5 w-5 text-amber-300" />
          </div>
          <h2 className="text-center font-display text-xl font-bold text-slate-100">
            Teacher Area
          </h2>
          <p className="mt-1.5 text-center text-sm text-slate-400">
            Enter the teacher password to view the full answer key.
          </p>
          <div className="mt-5">
            <label htmlFor="teacher-pass" className="sr-only">
              Teacher password
            </label>
            <input
              id="teacher-pass"
              ref={inputRef}
              type="password"
              dir="ltr"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError("");
              }}
              onKeyDown={(e) => e.key === "Enter" && tryUnlock()}
              placeholder="Password"
              className={cn(
                "w-full rounded-xl border bg-slate-950/70 px-4 py-3 text-center text-[15px] text-slate-100 transition-colors",
                error ? "border-rose-400/70" : "border-slate-700",
              )}
            />
            {error && (
              <p role="alert" className="mt-2 text-center text-sm font-medium text-rose-400">
                {error}
              </p>
            )}
          </div>
          <div className="mt-5 flex gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:border-slate-500"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={tryUnlock}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 font-display text-sm font-bold text-slate-950 transition hover:brightness-110"
            >
              <KeyRound className="h-4 w-4" />
              Unlock
            </button>
          </div>
        </div>
      ) : (
        <div className="glass animate-pop flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl">
          <div className="flex items-center gap-3 border-b border-slate-800 px-5 py-4 sm:px-6">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-400/30 bg-amber-400/10">
              <KeyRound className="h-4.5 w-4.5 text-amber-300" />
            </span>
            <div>
              <h2 className="font-display text-lg font-bold text-slate-100">
                Teacher Answer Key
              </h2>
              <p className="text-xs text-slate-500">
                20 questions · 5 marks each · Unit 1 Lessons 1 &amp; 2
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="ml-auto flex h-9 w-9 items-center justify-center rounded-xl border border-slate-700 text-slate-400 transition hover:border-slate-500 hover:text-slate-200"
              aria-label="Close teacher area"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5 sm:px-6">
            <div className="flex items-start gap-2.5 rounded-xl border border-amber-400/25 bg-amber-400/[0.07] p-3.5 text-xs leading-relaxed text-amber-200/90">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                This password gate is a simple classroom visibility barrier
                implemented in the browser. It is not secure authentication or
                encryption, and it does not prevent a determined user from
                inspecting the bundled data.
              </p>
            </div>

            {key.questionResults.map((q) => (
              <div
                key={q.id}
                className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4 sm:p-5"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-display text-base font-bold text-slate-100">
                    Question {q.number}
                  </span>
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                      q.lesson === "lesson1"
                        ? "bg-cyan-400/10 text-cyan-300"
                        : "bg-violet-400/10 text-violet-300",
                    )}
                  >
                    {q.typeLabel}
                  </span>
                  <span className="ml-auto text-xs font-bold text-amber-300/90">
                    {formatMarks(q.max)} marks
                  </span>
                </div>
                <ol className="mt-3 space-y-1.5">
                  {q.subparts.map((s, i) => (
                    <li
                      key={s.id}
                      className="flex items-baseline gap-2 text-sm text-slate-300"
                    >
                      <span className="shrink-0 font-semibold text-slate-500">
                        {q.number}.{i + 1}
                      </span>
                      <span className="font-medium text-emerald-200/90">
                        {s.correctDisplay}
                      </span>
                    </li>
                  ))}
                </ol>
                <p className="mt-3 border-t border-slate-800/80 pt-2.5 text-xs leading-relaxed text-slate-400">
                  <span className="font-semibold text-slate-300">Explanation: </span>
                  {q.explanation}
                </p>
                <p className="mt-1 text-[11px] font-medium uppercase tracking-wider text-slate-600">
                  {q.curriculumRef}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
