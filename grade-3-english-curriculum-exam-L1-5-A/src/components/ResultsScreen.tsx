import { useMemo, useState } from "react";
import { EXAM, LESSONS, lessonById } from "../data/lessons";
import { answerToText, correctAnswerText, formatDateTime, formatHMS, formatMarks, partPrompt, sourceShort } from "../lib/format";
import { buildReport, downloadTextFile, reportFileName } from "../lib/report";
import type { ExamResult, ExamState, Question, QuestionResult } from "../types";
import { Card, MuteButton, TopBar } from "./Common";
import { BookIcon, CheckIcon, ClockIcon, DownloadIcon, KeyIcon, RefreshIcon, XIcon } from "./Icons";
import { PassageView } from "./PassageView";

interface ResultsProps {
  state: ExamState;
  result: ExamResult;
  questions: Question[];
  muted: boolean;
  onToggleMute: () => void;
  onRestart: () => void;
  onOpenTeacher: () => void;
}

const STATUS = {
  correct: { label: "Correct", className: "bg-lime-200 text-green-950" },
  partial: { label: "Partly correct", className: "bg-amber-100 text-amber-900" },
  incorrect: { label: "Incorrect", className: "bg-rose-100 text-rose-800" },
} as const;

function ScoreRing({ value, max }: { value: number; max: number }) {
  const pct = max ? value / max : 0;
  const r = 52;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative grid h-40 w-40 shrink-0 place-items-center">
      <svg viewBox="0 0 120 120" className="absolute inset-0 h-full w-full -rotate-90" aria-hidden="true">
        <circle cx="60" cy="60" r={r} fill="none" stroke="#dcfce7" strokeWidth="12" />
        <circle cx="60" cy="60" r={r} fill="none" stroke="url(#scoreGradient)" strokeWidth="12" strokeLinecap="round" strokeDasharray={`${c * pct} ${c}`} />
        <defs>
          <linearGradient id="scoreGradient" x1="0" x2="1">
            <stop offset="0%" stopColor="#a3e635" />
            <stop offset="100%" stopColor="#16a34a" />
          </linearGradient>
        </defs>
      </svg>
      <div className="text-center">
        <p className="text-4xl font-black text-green-950">{formatMarks(value)}</p>
        <p className="text-sm font-bold text-green-700">out of {formatMarks(max)}</p>
      </div>
    </div>
  );
}

export function ResultsScreen({ state, result, questions, muted, onToggleMute, onRestart, onOpenTeacher }: ResultsProps) {
  const [filter, setFilter] = useState<"all" | "review">("all");
  const [confirmRestart, setConfirmRestart] = useState(false);
  const percent = result.max ? Math.round((result.total / result.max) * 100) : 0;
  const resultById = useMemo(() => new Map(result.questions.map((r) => [r.questionId, r])), [result]);
  const visible = questions
    .map((q, i) => ({ q, i, r: resultById.get(q.id) as QuestionResult }))
    .filter(({ r }) => filter === "all" || r.status !== "correct");

  const download = () => downloadTextFile(reportFileName(state.studentName), buildReport(state, result, questions));

  return (
    <>
      <TopBar>
        <MuteButton muted={muted} onToggle={onToggleMute} />
      </TopBar>
      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4">
        <Card>
          <div className="flex flex-col items-center gap-6 md:flex-row md:items-center">
            <ScoreRing value={result.total} max={result.max} />
            <div className="flex-1 text-center md:text-left">
              <p className="text-sm font-extrabold uppercase tracking-widest text-green-700">Exam submitted</p>
              <h1 className="mt-1 text-3xl font-black text-green-950 sm:text-4xl">Well done, {state.studentName}!</h1>
              <p className="mt-1 text-lg font-semibold text-green-800">
                {EXAM.title} · {EXAM.subtitle}
              </p>
              <p className="mt-2 inline-flex rounded-full bg-lime-200 px-3 py-1 text-base font-extrabold text-green-950">
                Total score: {formatMarks(result.total)} / {formatMarks(result.max)} ({percent}%)
              </p>
            </div>
          </div>
          <dl className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-5">
            {[
              { label: "Correct (full marks)", value: String(result.correctCount), tone: "text-green-800" },
              { label: "Partly correct", value: String(result.partialCount), tone: "text-amber-700" },
              { label: "Incorrect", value: String(result.incorrectCount), tone: "text-rose-700" },
              { label: "Time taken", value: formatHMS(state.elapsedMs), tone: "text-green-900" },
              { label: "Questions", value: String(questions.length), tone: "text-green-900" },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl border border-green-100 bg-green-50/50 px-3 py-3 text-center">
                <dt className="text-xs font-bold uppercase tracking-wider text-green-700">{s.label}</dt>
                <dd className={`mt-1 text-2xl font-black tabular-nums ${s.tone}`}>{s.value}</dd>
              </div>
            ))}
          </dl>
          {state.submittedAt && (
            <p className="mt-3 flex items-center justify-center gap-2 text-sm font-semibold text-green-700 md:justify-start">
              <ClockIcon className="h-4 w-4" /> Submitted on {formatDateTime(state.submittedAt)}
            </p>
          )}
        </Card>

        <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
          <Card>
            <h2 className="text-xl font-extrabold text-green-950">Score per lesson</h2>
            <ul className="mt-4 flex flex-col gap-4">
              {LESSONS.map((l) => {
                const s = result.byLesson[l.id];
                const pct = s.max ? (s.earned / s.max) * 100 : 0;
                return (
                  <li key={l.id}>
                    <div className="flex items-center justify-between gap-2 text-base font-bold text-green-950">
                      <span>
                        <span aria-hidden="true" className="mr-2">
                          {l.icon}
                        </span>
                        Lesson {l.id} – {l.title}
                      </span>
                      <span className="tabular-nums">
                        {formatMarks(s.earned)} / {formatMarks(s.max)}
                      </span>
                    </div>
                    <div className="mt-1.5 h-3 overflow-hidden rounded-full bg-green-100">
                      <div className="h-full rounded-full bg-gradient-to-r from-lime-400 to-green-600" style={{ width: `${pct}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          </Card>
          <Card className="self-start">
            <h2 className="text-xl font-extrabold text-green-950">Your report</h2>
            <p className="mt-2 text-base text-green-900">Download a text file with your answers, the correct answers and your marks.</p>
            <button
              type="button"
              onClick={download}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-green-700 px-5 py-3.5 text-lg font-extrabold text-white shadow-sm transition hover:bg-green-800"
            >
              <DownloadIcon className="h-5 w-5" /> Download report (.txt)
            </button>
            {!confirmRestart ? (
              <button
                type="button"
                onClick={() => setConfirmRestart(true)}
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-green-200 bg-white px-5 py-3 text-base font-extrabold text-green-800 transition hover:bg-green-50"
              >
                <RefreshIcon className="h-5 w-5" /> Start a new attempt
              </button>
            ) : (
              <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-3">
                <p className="text-sm font-semibold text-amber-900">A new attempt clears these results from this device. Download the report first if you need it.</p>
                <div className="mt-3 flex gap-2">
                  <button type="button" onClick={onRestart} className="flex-1 rounded-xl bg-green-700 px-3 py-2 text-sm font-extrabold text-white hover:bg-green-800">
                    Yes, start again
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmRestart(false)}
                    className="flex-1 rounded-xl border border-green-200 bg-white px-3 py-2 text-sm font-extrabold text-green-800 hover:bg-green-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
            <button type="button" onClick={onOpenTeacher} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-2 text-sm font-bold text-green-700 hover:bg-green-50">
              <KeyIcon className="h-4 w-4" /> Teacher area
            </button>
          </Card>
        </div>

        <section aria-labelledby="review-title" className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="review-title" className="text-2xl font-black text-green-950">
              Question review
            </h2>
            <div role="tablist" aria-label="Filter questions" className="inline-flex rounded-full border border-green-200 bg-white p-1">
              {(
                [
                  ["all", `All (${questions.length})`],
                  ["review", `To review (${result.partialCount + result.incorrectCount})`],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  role="tab"
                  type="button"
                  aria-selected={filter === key}
                  onClick={() => setFilter(key)}
                  className={`rounded-full px-4 py-1.5 text-sm font-extrabold transition ${filter === key ? "bg-green-700 text-white" : "text-green-800 hover:bg-green-50"}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          {visible.length === 0 && <p className="rounded-2xl bg-lime-100 px-4 py-3 font-bold text-green-900">Every question is fully correct. Excellent work!</p>}
          {visible.map(({ q, i, r }) => (
            <ReviewCard key={q.id} question={q} number={i + 1} total={questions.length} result={r} state={state} />
          ))}
        </section>
      </main>
    </>
  );
}

function ReviewCard({ question, number, total, result, state }: { question: Question; number: number; total: number; result: QuestionResult; state: ExamState }) {
  const status = STATUS[result.status];
  const answers = state.answers[question.id];
  return (
    <article className="rounded-3xl border border-green-100 bg-white p-4 shadow-sm sm:p-6">
      <header className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-extrabold uppercase tracking-widest text-green-700">
          Question {number} <span className="text-green-500">of {total}</span>
        </span>
        <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-800 ring-1 ring-emerald-200">
          Lesson {question.lesson} – {lessonById(question.lesson).title}
        </span>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-extrabold ${status.className}`}>{status.label}</span>
        <span className="ml-auto rounded-full bg-green-700 px-3 py-0.5 text-sm font-extrabold tabular-nums text-white">
          {formatMarks(result.earned)} / {formatMarks(result.max)}
        </span>
      </header>
      <h3 className="mt-2 text-lg font-extrabold text-green-950">{question.instruction}</h3>
      {question.passage && (
        <details className="mt-2 rounded-2xl bg-green-50/60 px-3 py-2">
          <summary className="cursor-pointer text-sm font-bold text-green-800">Show the text from the question</summary>
          <div className="mt-2">
            <PassageView passage={question.passage} compact />
          </div>
        </details>
      )}
      <ul className="mt-3 flex flex-col gap-2">
        {question.parts.map((part) => {
          const pr = result.parts.find((p) => p.partId === part.id);
          const ok = !!pr?.correct;
          return (
            <li key={part.id} className={`rounded-2xl border px-3 py-2.5 ${ok ? "border-lime-200 bg-lime-50/60" : "border-rose-100 bg-rose-50/50"}`}>
              <div className="flex items-start justify-between gap-3">
                <p className="text-base font-semibold text-green-950">{partPrompt(question, part.id)}</p>
                <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-extrabold ${ok ? "bg-lime-200 text-green-950" : "bg-rose-100 text-rose-800"}`}>
                  {ok ? <CheckIcon className="h-3.5 w-3.5" /> : <XIcon className="h-3.5 w-3.5" />}
                  {formatMarks(pr?.earned ?? 0)} / {formatMarks(part.marks)}
                </span>
              </div>
              <dl className="mt-1 grid gap-x-4 gap-y-0.5 text-sm sm:grid-cols-2">
                <div>
                  <dt className="inline font-bold text-green-800">Your answer: </dt>
                  <dd className={`inline font-semibold ${ok ? "text-green-900" : "text-rose-800"}`}>{answerToText(part, answers?.[part.id])}</dd>
                </div>
                <div>
                  <dt className="inline font-bold text-green-800">Correct answer: </dt>
                  <dd className="inline font-semibold text-green-900">{correctAnswerText(part)}</dd>
                </div>
              </dl>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-sm leading-relaxed text-green-900">
        <span className="font-extrabold">Explanation: </span>
        {question.explanation}
      </p>
      <div className="mt-2 flex flex-col gap-1">
        {question.sources.map((s, i) => (
          <p key={i} className="flex items-start gap-1.5 text-xs font-semibold text-green-700">
            <BookIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {sourceShort(question.lesson, s)}
          </p>
        ))}
      </div>
    </article>
  );
}
