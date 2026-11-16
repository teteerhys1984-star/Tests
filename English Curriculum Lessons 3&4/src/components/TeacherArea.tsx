import { KeyRound, Lock, ShieldAlert, X } from "lucide-react";
import { useState } from "react";
import { QUESTIONS } from "@/exam/questions";

const TEACHER_PASSWORD = "somer173";

interface Props {
  onClose: () => void;
}

export function TeacherArea({ onClose }: Props) {
  const [password, setPassword] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState(false);

  const tryUnlock = () => {
    if (password === TEACHER_PASSWORD) {
      setUnlocked(true);
      setError(false);
    } else {
      setError(true);
    }
  };

  return (
    <div className="fade-in fixed inset-0 z-50 overflow-y-auto bg-[#08111f]/85 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="mx-auto min-h-full max-w-5xl px-4 py-10 sm:px-6">
        <div className="paper-card relative rounded-3xl p-6 sm:p-8">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-lg border border-[#d9cfba] text-slate-500 transition-colors hover:bg-white"
            aria-label="Close teacher area"
          >
            <X className="h-4 w-4" />
          </button>

          {!unlocked ? (
            <div className="mx-auto max-w-md py-10 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#152a47]/8 text-[#152a47]">
                <Lock className="h-7 w-7" />
              </div>
              <h2 className="font-display text-2xl font-semibold text-[#152a47]">Teacher Area</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Enter the classroom password to view the answer key, mark allocation and curriculum references.
              </p>
              <div className="mt-6 flex gap-2">
                <input
                  type="password"
                  className="field flex-1"
                  placeholder="Teacher password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(false);
                  }}
                  onKeyDown={(e) => e.key === "Enter" && tryUnlock()}
                  aria-label="Teacher password"
                />
                <button onClick={tryUnlock} className="btn btn-navy px-5">
                  <KeyRound className="h-4 w-4" /> Unlock
                </button>
              </div>
              {error && (
                <p className="mt-3 text-sm font-semibold text-red-600">Incorrect password. Please try again.</p>
              )}
              <p className="mt-6 flex items-start gap-2 rounded-lg bg-[#b3872e]/8 px-3.5 py-2.5 text-left text-xs leading-relaxed text-[#6f5512]">
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                This password gate is only a client-side classroom visibility barrier. It is not secure
                authentication or encryption, and it does not protect data beyond casual viewing.
              </p>
            </div>
          ) : (
            <div>
              <h2 className="font-display text-2xl font-semibold text-[#152a47]">
                Teacher Answer Key — Grade 8 · Unit 1 · Lessons 3 &amp; 4
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                20 questions × 5 marks = 100 marks · Questions 1–10: Let's Discover · Questions 11–20: Interesting
                Destinations
              </p>

              <div className="mt-6 overflow-x-auto rounded-xl border border-[#e3d9c0]">
                <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                  <thead>
                    <tr className="bg-[#152a47] text-[#e9e0c9]">
                      <th className="px-4 py-3 font-semibold">Q</th>
                      <th className="px-4 py-3 font-semibold">Skill · Marks</th>
                      <th className="px-4 py-3 font-semibold">Correct answer(s)</th>
                      <th className="px-4 py-3 font-semibold">Curriculum reference</th>
                    </tr>
                  </thead>
                  <tbody>
                    {QUESTIONS.map((q, qi) => (
                      <tr key={q.n} className={qi % 2 ? "bg-[#f9f4e6]" : "bg-white/70"}>
                        <td className="px-4 py-3 align-top font-bold text-[#152a47]">
                          {q.n}
                          <span
                            className={`mt-1 block h-1 w-6 rounded-full ${
                              q.lesson === 3 ? "bg-[#0f766e]" : "bg-[#b45309]"
                            }`}
                          />
                        </td>
                        <td className="px-4 py-3 align-top">
                          <p className="font-semibold text-slate-800">{q.title}</p>
                          <p className="text-xs text-slate-500">
                            {q.skill} · 5 marks
                            {q.parts.length > 1 ? ` (${q.parts.length} × 1)` : ""}
                          </p>
                        </td>
                        <td className="px-4 py-3 align-top">
                          <ul className="space-y-1.5">
                            {q.parts.map((p) => (
                              <li key={p.id} className="leading-snug">
                                {q.parts.length > 1 && (
                                  <span className="font-semibold text-[#152a47]">{p.prompt.replace(/_{2,}/g, "…")} </span>
                                )}
                                <span className="font-medium text-[#0b5a54]">
                                  {p.type === "mcq" || p.type === "select"
                                    ? `${p.correctId}${p.options.length > 2 ? `: ${p.options.find((o) => o.id === p.correctId)?.text}` : ` — ${p.options.find((o) => o.id === p.correctId)?.text}`}`
                                    : p.type === "tf"
                                      ? p.answer
                                        ? "True"
                                        : "False"
                                      : p.type === "order"
                                        ? `Position ${p.correctPos}`
                                        : p.canonical}
                                </span>
                              </li>
                            ))}
                          </ul>
                          <p className="mt-2 text-xs italic leading-snug text-slate-500">{q.explanation}</p>
                        </td>
                        <td className="px-4 py-3 align-top text-xs leading-relaxed text-slate-600">
                          {q.curriculumRef}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p className="mt-5 flex items-start gap-2 rounded-lg bg-[#b3872e]/8 px-4 py-3 text-xs leading-relaxed text-[#6f5512]">
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                Reminder: this password gate is only a client-side classroom visibility barrier. It is not secure
                authentication or encryption — do not use it to protect sensitive data.
              </p>
              <p className="mt-3 rounded-lg bg-[#b3872e]/8 px-4 py-3 text-xs leading-relaxed text-[#6f5512]">
                Accepted alternatives for typed answers (grammar transformations) include optional “that”, the
                contractions ’ve / ’s / ’d and expanded negatives (haven't / have not, hadn't / had not). Differences
                in capitalization, spacing and surrounding punctuation are ignored by the grading engine.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
