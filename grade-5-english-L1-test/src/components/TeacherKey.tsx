import { useState, type FormEvent } from "react";
import { ALL_ITEMS, EXAM_SUBTITLE, EXAM_TITLE, QUESTIONS, TOTAL_MARKS, TOTAL_ITEM_COUNT, type ExamItem } from "../data/exam";
import { displayAnswer, displayCorrect, gradeExam, validateExamStructure, type Answers } from "../lib/grading";
import { formatDateTime, formatHMS } from "../lib/storage";
import { ContactFooter, LockIcon, Logo } from "./ui";

// Client-side access restriction only. This is not real authentication or encryption.
const TEACHER_PASSWORD = "somer173";

interface Props {
  attempt: { studentName: string; status: "in-progress" | "submitted"; startedAt: number; submittedAt?: number; answers: Answers } | null;
  onBack: () => void;
}

export default function TeacherKey({ attempt, onBack }: Props) {
  const [password, setPassword] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const unlock = (e: FormEvent) => {
    e.preventDefault();
    if (password === TEACHER_PASSWORD) {
      setUnlocked(true);
      setError(null);
      setPassword("");
    } else {
      setError("Incorrect password. Please try again.");
    }
  };

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 pt-5 sm:px-6">
        <div className="flex items-center gap-3">
          <Logo />
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-fuchsia-500">Teacher area</p>
            <p className="text-lg font-extrabold text-[#3b2a4a]">Answer Key · {EXAM_TITLE}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="min-h-11 rounded-full bg-white px-4 text-sm font-bold text-[#7c3aed] shadow-sm ring-1 ring-violet-100"
        >
          Back to exam
        </button>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 space-y-5 px-4 pb-6 pt-5 sm:px-6">
        {!unlocked ? (
          <section className="mx-auto max-w-md overflow-hidden rounded-[28px] bg-white shadow-xl shadow-violet-100 ring-1 ring-violet-50">
            <div className="bg-gradient-to-br from-violet-400 to-fuchsia-400 px-6 py-6 text-white">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/25">
                <LockIcon size={24} />
              </span>
              <h1 className="mt-3 text-2xl font-extrabold">Teacher Answer Key</h1>
              <p className="mt-1 text-sm text-violet-50">Enter the teacher password to view the key.</p>
            </div>
            <form onSubmit={unlock} noValidate className="space-y-4 p-6">
              <div>
                <label htmlFor="teacher-password" className="block text-sm font-bold text-[#4a3566]">
                  Teacher password
                </label>
                <input
                  id="teacher-password"
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  autoComplete="off"
                  aria-invalid={error ? true : undefined}
                  aria-describedby={error ? "password-error" : undefined}
                  className="mt-2 h-13 min-h-12 w-full rounded-2xl border-2 border-pink-200 px-4 text-base text-[#3b2a4a] focus:border-fuchsia-400 focus:outline-none focus:ring-4 focus:ring-fuchsia-100"
                />
              </div>
              {error && (
                <p id="password-error" role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-600">
                  {error}
                </p>
              )}
              <button type="submit" className="min-h-12 w-full rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-5 font-extrabold text-white shadow-md">
                Unlock key
              </button>
              <p className="text-xs leading-relaxed text-[#8a7aa0]">
                This is a simple access restriction for this device only. It is not secure authentication.
              </p>
            </form>
          </section>
        ) : (
          <TeacherContent attempt={attempt} />
        )}
      </main>
      <ContactFooter />
    </div>
  );
}

function TeacherContent({ attempt }: { attempt: Props["attempt"] }) {
  const structureProblems = validateExamStructure();
  const result = attempt ? gradeExam(attempt.answers) : null;

  return (
    <div className="space-y-5">
      <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-violet-50 sm:p-6">
        <h2 className="text-lg font-extrabold text-[#3b2a4a]">{EXAM_SUBTITLE}</h2>
        <p className="mt-1 text-sm text-[#6b5680]">
          {QUESTIONS.length} questions · {TOTAL_ITEM_COUNT} marked items · {TOTAL_MARKS} marks in total
        </p>
        <p className={`mt-3 rounded-xl px-3 py-2 text-sm font-semibold ${structureProblems.length ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"}`}>
          {structureProblems.length ? `Structure check failed: ${structureProblems.join("; ")}` : "Structure check passed: 8 questions, 100 marks, 8 vocabulary items in Q1–Q3."}
        </p>
      </section>

      <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-violet-50 sm:p-6">
        <h2 className="text-lg font-extrabold text-[#3b2a4a]">Current attempt on this device</h2>
        {!attempt ? (
          <p className="mt-2 text-sm text-[#6b5680]">No attempt is stored on this device.</p>
        ) : (
          <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
            <div><dt className="font-bold text-[#6b5680]">Student</dt><dd className="font-semibold">{attempt.studentName}</dd></div>
            <div><dt className="font-bold text-[#6b5680]">Status</dt><dd className="font-semibold">{attempt.status === "submitted" ? "Submitted" : "In progress"}</dd></div>
            <div><dt className="font-bold text-[#6b5680]">Started</dt><dd className="font-semibold">{formatDateTime(attempt.startedAt)}</dd></div>
            {attempt.submittedAt && result && (
              <>
                <div><dt className="font-bold text-[#6b5680]">Submitted</dt><dd className="font-semibold">{formatDateTime(attempt.submittedAt)}</dd></div>
                <div><dt className="font-bold text-[#6b5680]">Time taken</dt><dd className="font-semibold">{formatHMS(attempt.submittedAt - attempt.startedAt)}</dd></div>
                <div><dt className="font-bold text-[#6b5680]">Score</dt><dd className="font-semibold">{result.total} / {TOTAL_MARKS} ({result.percent}%)</dd></div>
              </>
            )}
          </dl>
        )}
      </section>

      <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-violet-50 sm:p-6">
        <h2 className="text-lg font-extrabold text-[#3b2a4a]">Mark allocation and grading rules</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[320px] text-left text-sm">
            <thead>
              <tr className="border-b border-pink-100 text-xs uppercase tracking-wide text-[#8a7aa0]">
                <th className="py-2 pr-3">Question</th>
                <th className="py-2 pr-3">Focus</th>
                <th className="py-2 text-right">Marks</th>
              </tr>
            </thead>
            <tbody>
              {QUESTIONS.map((q) => (
                <tr key={q.number} className="border-b border-pink-50">
                  <td className="py-2 pr-3 font-semibold">Q{q.number}. {q.title}</td>
                  <td className="py-2 pr-3 text-[#6b5680]">{q.focus}</td>
                  <td className="py-2 text-right font-bold">{q.targetMarks}</td>
                </tr>
              ))}
              <tr>
                <td className="py-2 pr-3 font-extrabold" colSpan={2}>Total</td>
                <td className="py-2 text-right font-extrabold">{TOTAL_MARKS}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <ul className="mt-4 list-disc space-y-1.5 pl-5 text-sm text-[#5b4a6e]">
          <li>Vocabulary (Q1–Q3): each of the 8 words is worth 4 marks. The typed English word is required. Capitalisation, extra spaces, hyphens and a leading “a/an/the” are ignored.</li>
          <li>Spelling mistakes (one wrong letter for 5–9 letter words, two for 10+ letters, or a missing/extra space) earn half marks and are reported as “Spelling mistake”.</li>
          <li>Plurals and different words (e.g. “libraries” for “library”) are incorrect.</li>
          <li>Choice, dropdown, true/false and ordering items: exact match only; ordering items need every slot correct.</li>
          <li>Every sub-part is marked independently; there are no partial marks for multi-slot items.</li>
        </ul>
      </section>

      {attempt && result && (
        <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-violet-50 sm:p-6">
          <h2 className="text-lg font-extrabold text-[#3b2a4a]">Student responses on this device</h2>
          <div className="mt-3 space-y-2">
            {result.items.map((r) => (
              <div key={r.item.id} className="rounded-xl bg-[#fdf9ff] p-3 text-sm ring-1 ring-violet-50">
                <p className="font-bold text-[#4a3566]">{r.label} · {r.status} · {r.awarded}/{r.item.marks}</p>
                <p className="text-[#5b4a6e]">Given: {displayAnswer(r.item, r.submitted)}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {QUESTIONS.map((q) => (
        <section key={q.number} className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-violet-50">
          <div className="bg-gradient-to-r from-pink-50 via-fuchsia-50 to-sky-50 px-5 py-4">
            <p className="text-xs font-bold uppercase tracking-wider text-fuchsia-500">Question {q.number} · {q.targetMarks} marks</p>
            <h2 className="text-lg font-extrabold text-[#3b2a4a]">{q.title}</h2>
          </div>
          <div className="space-y-3 p-4 sm:p-6">
            {ALL_ITEMS.filter((x) => x.questionNumber === q.number).map(({ item, label, partTitle }) => (
              <KeyRow key={item.id} label={label} partTitle={partTitle} item={item} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function KeyRow({ label, partTitle, item }: { label: string; partTitle: string; item: ExamItem }) {
  return (
    <div className="rounded-2xl border border-pink-100 p-4">
      <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
        <span className="rounded-full bg-violet-50 px-2.5 py-0.5 text-violet-700">Item {label}</span>
        <span className="rounded-full bg-sky-50 px-2.5 py-0.5 text-sky-700">{item.kind === "vocab" ? "Vocabulary (type)" : item.kind}</span>
        <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-amber-800">{item.marks} mark{item.marks === 1 ? "" : "s"}</span>
        <span className="text-[#8a7aa0]">{partTitle}</span>
      </div>
      {item.kind === "vocab" ? (
        <p className="mt-2 text-sm">
          <span className="font-bold text-[#6b5680]">Arabic prompt: </span>
          <span lang="ar" dir="rtl" className="font-extrabold">{item.arabic}</span>
        </p>
      ) : (
        <p className="mt-2 text-sm font-semibold text-[#3b2a4a]">{item.prompt}</p>
      )}
      <p className="mt-1 text-sm">
        <span className="font-bold text-[#6b5680]">Correct answer: </span>
        <span className="font-extrabold text-emerald-700">{displayCorrect(item)}</span>
      </p>
      {item.options && item.kind !== "vocab" && (
        <p className="mt-1 text-xs text-[#8a7aa0]">Options: {item.options.join(" | ")}</p>
      )}
      <p className="mt-1 text-xs text-[#5b4a6e]"><span className="font-bold">Explanation:</span> {item.explanation}</p>
      <p className="mt-2 border-t border-pink-50 pt-2 text-[11px] leading-relaxed text-[#8a7aa0]">
        {item.ref.unit} · {item.ref.lesson} · {item.ref.source} · Skill: {item.ref.skill}
      </p>
    </div>
  );
}
