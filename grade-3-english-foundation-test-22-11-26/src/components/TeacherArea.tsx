import { useState } from "react";
import { EXAM_LABEL, EXAM_SUBLABEL, QUESTIONS, TEACHER_PASSWORD, TOTAL_MARKS } from "../data/examData";
import { correctAnswerText, formatMarks } from "../utils/grading";

interface Props {
  onClose: () => void;
}

export function TeacherArea({ onClose }: Props) {
  const [pw, setPw] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState("");

  const tryUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (pw === TEACHER_PASSWORD) {
      setUnlocked(true);
      setError("");
    } else {
      setError("Incorrect password. Please try again.");
    }
  };

  return (
    <main className="mx-auto w-full max-w-3xl px-3 py-6 sm:px-4 sm:py-10">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-900">Teacher Area</h1>
        <button type="button" onClick={onClose} className="min-h-11 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 active:bg-slate-100">
          Back to exam
        </button>
      </div>

      {!unlocked ? (
        <form onSubmit={tryUnlock} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
          <p className="text-sm text-slate-600">
            Enter the teacher password to view the complete answer key and marking criteria for {EXAM_LABEL} — {EXAM_SUBLABEL}.
          </p>
          <label htmlFor="teacher-pw" className="mt-4 block text-sm font-semibold text-slate-800">
            Password
          </label>
          <input
            id="teacher-pw"
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            autoComplete="off"
            className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 text-base outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-200"
          />
          {error && <p className="mt-2 text-sm text-rose-600">{error}</p>}
          <button type="submit" className="mt-4 min-h-12 w-full rounded-xl bg-indigo-600 font-semibold text-white active:bg-indigo-700">
            Unlock
          </button>
          <p className="mt-4 text-xs leading-relaxed text-slate-500">
            Note: this password check runs only in the browser. It is a simple access restriction for convenience, not real authentication or encryption.
          </p>
        </form>
      ) : (
        <div className="space-y-5">
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-bold text-slate-900">Marking criteria</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
              <li>{QUESTIONS.length} main questions, 5 marks each, {TOTAL_MARKS} marks in total.</li>
              <li>Each main question has five independently marked parts worth 1 mark each. No partial credit within a part.</li>
              <li>Typed answers are compared after trimming spaces and ignoring letter case, full stops, commas and question marks. Curly apostrophes are treated as straight apostrophes.</li>
              <li>Where contractions are acceptable (for example "isn't", "He's"), they are listed as accepted answers below.</li>
              <li>Word-order tasks require every word to be placed in the exact correct order.</li>
              <li>Matching tasks use a shared pool of options; each part is marked separately.</li>
            </ul>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-bold text-slate-900">Lesson and skill mapping</h2>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[32rem] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                    <th className="py-2 pr-3">Q</th>
                    <th className="py-2 pr-3">Lesson</th>
                    <th className="py-2 pr-3">Skill</th>
                    <th className="py-2">Marks</th>
                  </tr>
                </thead>
                <tbody>
                  {QUESTIONS.map((q) => (
                    <tr key={q.number} className="border-b border-slate-100 align-top">
                      <td className="py-2 pr-3 font-semibold">{q.number}</td>
                      <td className="py-2 pr-3 whitespace-nowrap">{q.lesson}</td>
                      <td className="py-2 pr-3">{q.skill}</td>
                      <td className="py-2">{formatMarks(q.subs.reduce((a, s) => a + s.marks, 0))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <h2 className="text-xl font-bold text-slate-900">Complete answer key</h2>
          {QUESTIONS.map((q) => (
            <article key={q.number} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Question {q.number}</h3>
                  <p className="mt-1 text-sm text-slate-700">{q.title}</p>
                  <p className="mt-1 text-xs text-indigo-700">
                    {q.lesson} · {q.skill}
                  </p>
                </div>
                <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold text-indigo-800">5 marks</span>
              </div>
              {q.intro && <div className="mt-3 whitespace-pre-line rounded-2xl bg-slate-50 p-3 text-sm text-slate-700">{q.intro}</div>}
              <ul className="mt-3 space-y-2">
                {q.subs.map((s) => (
                  <li key={s.id} className="rounded-2xl border border-slate-100 bg-slate-50/60 p-3 text-sm">
                    <p className="font-semibold text-slate-900">
                      {q.number}
                      {s.label}) {s.prompt} <span className="font-normal text-slate-500">({formatMarks(s.marks)} mark)</span>
                    </p>
                    {s.type === "choice" && <p className="mt-1 text-slate-600">Options: {s.options.join(" / ")}</p>}
                    {s.type === "order" && <p className="mt-1 text-slate-600">Words: {s.words.join(" / ")}</p>}
                    {s.type === "match" && <p className="mt-1 text-slate-600">Pool: {s.options.join(" / ")}</p>}
                    <p className="mt-1 text-emerald-800">
                      <span className="font-semibold">Answer:</span> {correctAnswerText(s)}
                    </p>
                    {s.type === "text" && s.accept.length > 1 && <p className="mt-0.5 text-slate-600">Also accepted: {s.accept.slice(1).join(" · ")}</p>}
                    <p className="mt-1 text-slate-700">
                      <span className="font-semibold">Explanation:</span> {s.explanation}
                    </p>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
