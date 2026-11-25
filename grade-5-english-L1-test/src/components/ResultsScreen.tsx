import { Fragment } from "react";
import { EXAM_SUBTITLE, EXAM_TITLE, QUESTIONS, TOTAL_MARKS, type ExamItem } from "../data/exam";
import { displayAnswer, displayCorrect, type ExamResult, type ItemResult, type ItemStatus } from "../lib/grading";
import { downloadTextReport, buildReport } from "../lib/report";
import { formatDateTime, formatHMS } from "../lib/storage";
import { CheckIcon, ContactCard, ContactFooter, DownloadIcon, Logo, RefreshIcon, SparkleIcon } from "./ui";

interface Props {
  studentName: string;
  startedAt: number;
  submittedAt: number;
  result: ExamResult;
  onNewAttempt: () => void;
}

const BADGE: Record<ItemStatus, { label: string; cls: string }> = {
  correct: { label: "Correct", cls: "bg-emerald-100 text-emerald-700" },
  spelling: { label: "Spelling mistake", cls: "bg-amber-100 text-amber-800" },
  incorrect: { label: "Incorrect", cls: "bg-rose-100 text-rose-700" },
  unanswered: { label: "No answer", cls: "bg-slate-100 text-slate-600" },
};

export default function ResultsScreen({ studentName, startedAt, submittedAt, result, onNewAttempt }: Props) {
  const elapsed = submittedAt - startedAt;
  const scoreTone =
    result.percent >= 80 ? "from-emerald-400 to-teal-400" : result.percent >= 50 ? "from-pink-400 to-fuchsia-500" : "from-amber-400 to-orange-400";

  const handleDownload = () => {
    const content = buildReport({ studentName, result, startedAt, submittedAt });
    downloadTextReport(studentName, content);
  };

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center gap-3 px-4 pt-5 sm:px-6">
        <Logo />
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wider text-fuchsia-500">{EXAM_TITLE} · Results</p>
          <p className="truncate text-lg font-extrabold text-[#3b2a4a]">{studentName}</p>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 space-y-5 px-4 pb-6 pt-4 sm:px-6">
        <ContactCard variant="compact" />

        {/* Score summary */}
        <section aria-labelledby="results-title" className="overflow-hidden rounded-[28px] bg-white shadow-xl shadow-violet-100 ring-1 ring-violet-50">
          <div className={`bg-gradient-to-br ${scoreTone} px-5 pb-6 pt-6 text-white sm:px-8`}>
            <p className="inline-flex items-center gap-1.5 rounded-full bg-white/25 px-3 py-1 text-xs font-bold uppercase tracking-wider">
              <SparkleIcon size={14} /> Exam submitted
            </p>
            <h1 id="results-title" className="mt-3 text-lg font-bold text-white/90">{EXAM_SUBTITLE}</h1>
            <div className="mt-2 flex flex-wrap items-end gap-x-3 gap-y-1">
              <p className="text-5xl font-extrabold sm:text-6xl">
                {result.total}
                <span className="text-2xl font-bold text-white/85 sm:text-3xl"> / {TOTAL_MARKS}</span>
              </p>
              <p className="pb-2 text-xl font-extrabold">{result.percent}%</p>
            </div>
          </div>
          <dl className="grid grid-cols-1 gap-3 px-5 py-5 sm:grid-cols-3 sm:px-8">
            <Stat label="Student" value={studentName} />
            <Stat label="Time taken" value={formatHMS(elapsed)} />
            <Stat label="Submitted" value={formatDateTime(submittedAt)} />
          </dl>
          <div className="space-y-2 border-t border-violet-50 px-5 py-5 sm:px-8">
            <p className="text-sm font-bold text-[#4a3566]">Score by section</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {result.questions.map((q) => (
                <a
                  key={q.question.number}
                  href={`#q${q.question.number}`}
                  className="rounded-2xl bg-pink-50/70 p-3 ring-1 ring-pink-100 transition hover:bg-pink-100/60"
                >
                  <p className="text-xs font-bold text-[#7c3aed]">Question {q.question.number}</p>
                  <p className="mt-0.5 text-lg font-extrabold text-[#3b2a4a]">
                    {q.awarded}
                    <span className="text-sm font-semibold text-[#6b5680]"> / {q.max}</span>
                  </p>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white">
                    <div className="h-full rounded-full bg-gradient-to-r from-pink-400 to-violet-500" style={{ width: `${(q.awarded / q.max) * 100}%` }} />
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* Actions */}
        <section className="grid gap-3 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-pink-100 sm:grid-cols-2 sm:p-5">
          <button
            type="button"
            onClick={handleDownload}
            className="flex min-h-13 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-400 to-teal-400 px-5 py-3 text-base font-extrabold text-white shadow-md shadow-teal-100 active:scale-[0.99]"
          >
            <DownloadIcon size={20} /> Download Report
          </button>
          <button
            type="button"
            onClick={onNewAttempt}
            className="flex min-h-13 items-center justify-center gap-2 rounded-2xl bg-pink-50 px-5 py-3 text-base font-bold text-[#be185d] ring-1 ring-pink-200 active:scale-[0.99]"
          >
            <RefreshIcon size={18} /> Start a new attempt
          </button>
          <p className="text-xs leading-relaxed text-[#6b5680] sm:col-span-2">
            Download your report before you start a new attempt. Starting a new attempt clears this result from this device and asks for the student’s name again.
          </p>
        </section>

        {/* Detailed results */}
        <section aria-labelledby="details-title" className="space-y-4">
          <h2 id="details-title" className="px-1 text-xl font-extrabold text-[#3b2a4a]">Detailed results</h2>
          {result.questions.map((q) => (
            <article key={q.question.number} id={`q${q.question.number}`} className="scroll-mt-4 overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-violet-50">
              <div className="flex flex-wrap items-center justify-between gap-2 bg-gradient-to-r from-pink-50 via-fuchsia-50 to-sky-50 px-4 py-3 sm:px-6">
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wider text-fuchsia-500">Question {q.question.number}</p>
                  <h3 className="text-base font-extrabold text-[#3b2a4a] sm:text-lg">{q.question.title}</h3>
                </div>
                <p className="rounded-full bg-white px-3 py-1 text-sm font-extrabold text-[#7c3aed] shadow-sm">
                  {q.awarded} / {q.max} marks
                </p>
              </div>
              <div className="grid gap-3 p-4 sm:p-6 lg:grid-cols-2">
                <QuestionPartsList question={q.question} items={q.items} />
              </div>
            </article>
          ))}
        </section>

        <section className="rounded-3xl bg-white p-5 text-sm leading-relaxed text-[#5b4a6e] shadow-sm ring-1 ring-violet-50">
          <p className="mb-1 font-extrabold text-[#4a3566]">How answers are marked</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Vocabulary (Questions 1–3): the English word is typed. Capital letters and extra spaces are ignored.</li>
            <li>A small spelling slip earns half marks and is labelled “Spelling mistake”. A different word earns no marks.</li>
            <li>All other questions earn full marks for the correct answer, or no marks. Each part is marked on its own.</li>
          </ul>
        </section>
      </main>

      <ContactFooter />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[#fdf9ff] p-3 ring-1 ring-violet-50">
      <dt className="text-xs font-bold uppercase tracking-wide text-[#8a7aa0]">{label}</dt>
      <dd className="mt-0.5 break-words text-base font-extrabold text-[#3b2a4a] tabular-nums">{value}</dd>
    </div>
  );
}

function QuestionPartsList({ question, items }: { question: (typeof QUESTIONS)[number]; items: ItemResult[] }) {
  let lastPart = "";
  return (
    <>
      {items.map((r) => {
        const showPartHeading = r.partTitle !== lastPart;
        lastPart = r.partTitle;
        return (
          <Fragment key={r.item.id}>
            {showPartHeading && <h4 className="pt-1 text-sm font-extrabold text-[#7c3aed] lg:col-span-2">{r.partTitle}</h4>}
            <ResultItem r={r} />
          </Fragment>
        );
      })}
      <p className="sr-only lg:col-span-2">Question {question.number} complete.</p>
    </>
  );
}

function ResultItem({ r }: { r: ItemResult }) {
  const badge = BADGE[r.status];
  const item: ExamItem = r.item;
  return (
    <div className="rounded-2xl border border-pink-100 bg-[#fffbfe] p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-extrabold text-[#7c3aed] ring-1 ring-violet-100">Item {r.label}</span>
        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-extrabold ${badge.cls}`}>
          {r.status === "correct" && <CheckIcon size={13} />}
          {badge.label}
        </span>
        <span className="ml-auto text-xs font-bold text-[#6b5680]">
          {r.awarded} / {item.marks} mark{item.marks === 1 ? "" : "s"}
        </span>
      </div>

      {item.kind === "vocab" ? (
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl bg-white px-3 py-2 ring-1 ring-sky-100">
          <span className="text-xs font-bold uppercase tracking-wide text-[#6b5680]">Arabic prompt</span>
          <span lang="ar" dir="rtl" className="text-lg font-extrabold text-[#3b2a4a]">{item.arabic}</span>
        </div>
      ) : (
        <p className="mt-3 text-[15px] font-semibold leading-relaxed text-[#3b2a4a]">{item.prompt}</p>
      )}

      <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-[9rem_1fr]">
        <dt className="font-bold text-[#6b5680]">Your answer</dt>
        <dd className={`break-words font-semibold ${r.status === "correct" ? "text-emerald-700" : "text-[#3b2a4a]"}`}>{displayAnswer(item, r.submitted)}</dd>
        <dt className="font-bold text-[#6b5680]">Correct answer</dt>
        <dd className="break-words font-semibold text-emerald-700">{displayCorrect(item)}</dd>
      </dl>

      {r.status === "spelling" && (
        <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">
          <strong>Spelling mistake:</strong> the word is almost right, so half marks were given. Check the spelling of the correct answer.
        </p>
      )}
      {r.status === "incorrect" && (
        <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-800">
          <strong>Incorrect:</strong> {item.explanation}
        </p>
      )}
      {r.status === "unanswered" && (
        <p className="mt-3 rounded-xl bg-slate-100 px-3 py-2 text-sm text-slate-700">
          <strong>No answer given.</strong> {item.explanation}
        </p>
      )}
      {r.status === "correct" && (
        <p className="mt-3 text-sm text-[#5b4a6e]">{item.explanation}</p>
      )}

      <p className="mt-3 border-t border-pink-100 pt-2 text-[11px] leading-relaxed text-[#8a7aa0]">
        <span className="font-bold">Curriculum:</span> {item.ref.unit} · {item.ref.lesson} · {item.ref.source}
        <br />
        <span className="font-bold">Skill:</span> {item.ref.skill}
      </p>
    </div>
  );
}
