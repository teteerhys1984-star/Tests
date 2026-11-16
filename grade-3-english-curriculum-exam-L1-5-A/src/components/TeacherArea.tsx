import { useState, type FormEvent } from "react";
import { EXAM, LESSONS, checkTeacherPassword, lessonById } from "../data/lessons";
import { acceptedAnswersText, correctAnswerText, formatMarks, partPrompt, sourceShort } from "../lib/format";
import { questionMax } from "../lib/grading";
import type { LessonId, Question } from "../types";
import { Card, MuteButton, TopBar } from "./Common";
import { BookIcon, ChevronLeftIcon, InfoIcon, KeyIcon, LockIcon, PrintIcon } from "./Icons";
import { PassageView } from "./PassageView";

interface TeacherProps {
  questions: Question[];
  muted: boolean;
  onToggleMute: () => void;
  onBack: () => void;
}

const GENERAL_RULES = [
  "50 main questions, 10 from each lesson. Every main question is worth 2 marks (total 100).",
  "Each sub-part shows its own marks (1 mark, or 0.5 mark when a question has four parts). There are no negative marks.",
  "Choice, True / False, matching, circling and ordering items: the selected answer must equal the key.",
  "Reorder-the-words items: 2 marks only when the whole sentence is in the correct order.",
  "Typed answers ignore capital letters, extra spaces, a final full stop and hyphen-versus-space (thirty-three = thirty three). Spelling must be correct.",
  "“Correct” = full marks for the question, “Partly correct” = some marks, “Incorrect” = 0 marks.",
];

export function TeacherArea({ questions, muted, onToggleMute, onBack }: TeacherProps) {
  const [unlocked, setUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [lesson, setLesson] = useState<0 | LessonId>(0);

  const unlock = (e: FormEvent) => {
    e.preventDefault();
    if (checkTeacherPassword(password)) {
      setUnlocked(true);
      setError("");
      setPassword("");
    } else {
      setError("Incorrect password. Please try again.");
    }
  };

  const backButton = (
    <button type="button" onClick={onBack} className="inline-flex h-10 items-center gap-1.5 rounded-full border border-green-200 bg-white px-3 text-sm font-bold text-green-800 hover:bg-green-50">
      <ChevronLeftIcon className="h-4 w-4" /> Back
    </button>
  );

  if (!unlocked) {
    return (
      <>
        <TopBar>
          {backButton}
          <MuteButton muted={muted} onToggle={onToggleMute} />
        </TopBar>
        <main className="mx-auto max-w-xl px-4">
          <Card>
            <div className="flex items-center gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-lime-200 text-green-900">
                <LockIcon className="h-6 w-6" />
              </span>
              <div>
                <h1 className="text-2xl font-black text-green-950">Teacher Answer Key</h1>
                <p className="text-sm font-semibold text-green-700">For teachers only</p>
              </div>
            </div>
            <form onSubmit={unlock} className="mt-6" noValidate>
              <label htmlFor="teacher-password" className="block text-base font-bold text-green-900">
                Password
              </label>
              <input
                id="teacher-password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError("");
                }}
                autoComplete="off"
                aria-invalid={!!error}
                aria-describedby={error ? "teacher-error" : undefined}
                className="mt-2 w-full rounded-2xl border-2 border-green-200 bg-white px-4 py-3 text-lg outline-none focus:border-lime-500 focus-visible:ring-4 focus-visible:ring-lime-300"
              />
              {error && (
                <p id="teacher-error" role="alert" className="mt-2 text-sm font-bold text-rose-700">
                  {error}
                </p>
              )}
              <button type="submit" className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-green-700 px-5 py-3 text-lg font-extrabold text-white hover:bg-green-800">
                <KeyIcon className="h-5 w-5" /> Unlock answer key
              </button>
            </form>
            <p className="mt-4 flex gap-2 rounded-2xl bg-green-50 px-3 py-2 text-xs font-semibold leading-relaxed text-green-800">
              <InfoIcon className="mt-0.5 h-4 w-4 shrink-0" />
              This password is a basic on-screen gate only. It is not secure authentication or encryption: the answers are part of the page code.
            </p>
          </Card>
        </main>
      </>
    );
  }

  const shown = questions.map((q, i) => ({ q, n: i + 1 })).filter(({ q }) => lesson === 0 || q.lesson === lesson);

  return (
    <>
      <TopBar>
        {backButton}
        <button
          type="button"
          onClick={() => window.print()}
          className="hidden h-10 items-center gap-1.5 rounded-full border border-green-200 bg-white px-3 text-sm font-bold text-green-800 hover:bg-green-50 sm:inline-flex"
        >
          <PrintIcon className="h-4 w-4" /> Print
        </button>
        <button
          type="button"
          onClick={() => setUnlocked(false)}
          className="inline-flex h-10 items-center gap-1.5 rounded-full bg-green-700 px-3 text-sm font-bold text-white hover:bg-green-800"
        >
          <LockIcon className="h-4 w-4" /> Lock
        </button>
      </TopBar>
      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4">
        <Card>
          <h1 className="text-3xl font-black text-green-950">Teacher Answer Key</h1>
          <p className="mt-1 text-base font-semibold text-green-800">
            {EXAM.title} · {EXAM.subtitle} · {EXAM.totalQuestions} questions · {EXAM.totalMarks} marks
          </p>
          <div className="mt-5 grid gap-6 lg:grid-cols-2">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[320px] border-collapse text-left text-sm">
                <thead>
                  <tr className="bg-lime-100 text-green-900">
                    <th className="rounded-l-xl px-3 py-2">Lesson</th>
                    <th className="px-3 py-2">Pages</th>
                    <th className="px-3 py-2">Questions</th>
                    <th className="rounded-r-xl px-3 py-2">Marks</th>
                  </tr>
                </thead>
                <tbody>
                  {LESSONS.map((l) => {
                    const qs = questions.filter((q) => q.lesson === l.id);
                    return (
                      <tr key={l.id} className="border-b border-green-50">
                        <td className="px-3 py-2 font-bold text-green-950">
                          {l.id}. {l.title}
                        </td>
                        <td className="px-3 py-2 text-green-800">{l.pages}</td>
                        <td className="px-3 py-2 text-green-800">{qs.length}</td>
                        <td className="px-3 py-2 text-green-800">{formatMarks(qs.reduce((s, q) => s + questionMax(q), 0))}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-green-950">Grading rules</h2>
              <ul className="mt-2 flex list-disc flex-col gap-1.5 pl-5 text-sm leading-relaxed text-green-900">
                {GENERAL_RULES.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </div>
          </div>
          <p className="mt-5 rounded-2xl bg-green-50 px-4 py-3 text-sm leading-relaxed text-green-900">
            <span className="font-extrabold">Curriculum note: </span>
            Lessons 2–5 were checked against the original Pupil’s Book and Workbook scans. No Lesson 1 page scan is available in the curriculum repository, so
            Lesson 1 uses only transcription lines that carry no OCR, picture or audio warning. Listening answers that need the missing recordings are not assessed.
          </p>
        </Card>

        <div className="no-print flex flex-wrap gap-2" role="tablist" aria-label="Filter by lesson">
          {([0, 1, 2, 3, 4, 5] as const).map((id) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={lesson === id}
              onClick={() => setLesson(id)}
              className={`rounded-full px-4 py-2 text-sm font-extrabold transition ${lesson === id ? "bg-green-700 text-white" : "border border-green-200 bg-white text-green-800 hover:bg-green-50"}`}
            >
              {id === 0 ? "All questions" : `Lesson ${id}`}
            </button>
          ))}
        </div>

        {shown.map(({ q, n }) => (
          <article key={q.id} className="break-inside-avoid rounded-3xl border border-green-100 bg-white p-4 shadow-sm sm:p-6">
            <header className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-extrabold uppercase tracking-widest text-green-700">Question {n}</span>
              <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-800 ring-1 ring-emerald-200">
                Lesson {q.lesson} – {lessonById(q.lesson).title}
              </span>
              <span className="rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-bold text-green-800 ring-1 ring-green-200">{q.format}</span>
              <span className="text-xs font-bold text-green-600">ID {q.id}</span>
              <span className="ml-auto rounded-full bg-lime-200 px-3 py-0.5 text-sm font-extrabold text-green-950">{formatMarks(questionMax(q))} marks</span>
            </header>
            <h2 className="mt-2 text-lg font-extrabold text-green-950">{q.instruction}</h2>
            {q.passage && (
              <details className="mt-2 rounded-2xl bg-green-50/60 px-3 py-2">
                <summary className="cursor-pointer text-sm font-bold text-green-800">Show the passage / picture</summary>
                <div className="mt-2">
                  <PassageView passage={q.passage} compact />
                </div>
              </details>
            )}
            <ol className="mt-3 flex flex-col gap-2">
              {q.parts.map((part) => (
                <li key={part.id} className="rounded-2xl border border-green-100 bg-green-50/40 px-3 py-2">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-base font-semibold text-green-950">{partPrompt(q, part.id)}</p>
                    <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-xs font-extrabold text-green-800 ring-1 ring-green-200">
                      {formatMarks(part.marks)} mark{part.marks === 1 ? "" : "s"}
                    </span>
                  </div>
                  <p className="mt-1 text-sm">
                    <span className="font-bold text-green-800">Answer: </span>
                    <span className="font-extrabold text-green-950">{correctAnswerText(part)}</span>
                  </p>
                  {part.kind === "text" && <p className="text-xs font-semibold text-green-700">Accepted: {acceptedAnswersText(part)}</p>}
                  {(part.kind === "choice" || part.kind === "select") && <p className="text-xs font-semibold text-green-700">Options: {part.options.join(" · ")}</p>}
                </li>
              ))}
            </ol>
            <p className="mt-3 text-sm text-green-900">
              <span className="font-extrabold">Grading: </span>
              {q.gradingRule}
            </p>
            <p className="mt-1 text-sm text-green-900">
              <span className="font-extrabold">Explanation: </span>
              {q.explanation}
            </p>
            <div className="mt-2 flex flex-col gap-1.5">
              {q.sources.map((s, i) => (
                <div key={i} className="flex items-start gap-1.5 text-xs text-green-800">
                  <BookIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <p>
                    <span className="font-bold">{sourceShort(q.lesson, s)}</span>
                    {s.detail && <span> — {s.detail}</span>}
                  </p>
                </div>
              ))}
            </div>
          </article>
        ))}
      </main>
    </>
  );
}
