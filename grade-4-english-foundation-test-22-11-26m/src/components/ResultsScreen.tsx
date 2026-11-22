import { EXAM_ID } from "../config";
import { useMemo } from "react";
import { EXAM_LABEL, EXAM_SUBLABEL } from "../data/examData";
import type { ExamResult } from "../data/types";
import { cn } from "../utils/cn";
import { correctAnswerText, formatMarks } from "../utils/grading";
import { buildReportText, downloadTextFile, safeFileName } from "../utils/report";
import { describeDuration, formatDateTime, formatHMS } from "../utils/time";
import mascotUrl from "../assets/mascot.jpg";
import { PromptText } from "./PromptText";

interface Props {
  studentName: string;
  startedAt: number;
  submittedAt: number;
  result: ExamResult;
  onStartAgain: () => void;
}

export function ResultsScreen({ studentName, startedAt, submittedAt, result, onStartAgain }: Props) {
  const elapsed = submittedAt - startedAt;
  const report = useMemo(() => buildReportText(result, { studentName, startedAt, submittedAt }), [result, studentName, startedAt, submittedAt]);

  const download = () => {
    const stamp = new Date(submittedAt).toISOString().slice(0, 10);
    downloadTextFile(`${EXAM_ID}_${safeFileName(studentName)}_${stamp}.txt`, report);
  };

  const grade =
    result.percentage >= 90 ? "Excellent! 🌟" : result.percentage >= 75 ? "Very good! 🎉" : result.percentage >= 60 ? "Good job! 👍" : result.percentage >= 50 ? "Pass 👏" : "Keep practising 💪";

  return (
    <main className="relative z-10 mx-auto w-full max-w-3xl px-3 py-6 sm:px-4 sm:py-10">
      <section className="card animate-pop overflow-hidden">
        <div className="relative bg-gradient-to-br from-emerald-400 via-teal-400 to-sky-400 px-5 py-7 text-white sm:px-8">
          <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-yellow-300/40" />
          <div className="relative flex items-center gap-4">
            <img src={mascotUrl} alt="" width={80} height={80} className="animate-wiggle h-16 w-16 shrink-0 rounded-3xl bg-white/90 object-cover shadow-lg sm:h-20 sm:w-20" />
            <div className="min-w-0">
              <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-yellow-100">{EXAM_LABEL} — {EXAM_SUBLABEL}</p>
              <h1 className="mt-1 text-2xl font-black drop-shadow sm:text-3xl">Your Results</h1>
            </div>
          </div>
          <p className="relative mt-3 text-base font-bold text-white/95">Well done, {studentName}! Your exam has been submitted. {grade}</p>
        </div>

        <div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-4 sm:p-8">
          <Stat label="Final score" value={`${formatMarks(result.total)} / ${formatMarks(result.max)}`} tone="bg-indigo-100 text-indigo-800" />
          <Stat label="Percentage" value={`${result.percentage}%`} tone="bg-fuchsia-100 text-fuchsia-800" />
          <Stat label="Correct answers" value={String(result.correctCount)} tone="bg-emerald-100 text-emerald-800" />
          <Stat label="Incorrect answers" value={String(result.incorrectCount)} tone="bg-rose-100 text-rose-800" />
        </div>

        <dl className="grid gap-x-6 gap-y-2 border-t border-slate-100 px-5 py-5 text-sm sm:grid-cols-2 sm:px-8">
          <Row k="Student name" v={studentName} />
          <Row k="Overall result" v={grade} />
          <Row k="Completed on" v={formatDateTime(submittedAt)} />
          <Row k="Time taken" v={`${formatHMS(elapsed)} (${describeDuration(elapsed)})`} />
        </dl>

        <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-5 sm:flex-row sm:px-8">
          <button type="button" onClick={download} className="btn-pop inline-flex min-h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-4 text-base font-black text-white shadow-lg shadow-indigo-200">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
            </svg>
            Download Report
          </button>
          <button type="button" onClick={onStartAgain} className="btn-pop min-h-14 flex-1 rounded-2xl border-[3px] border-indigo-200 bg-white px-4 text-base font-black text-indigo-700 shadow">
            Start a New Attempt
          </button>
        </div>
      </section>

      <h2 className="mt-8 text-2xl font-black text-indigo-800">📋 Detailed breakdown</h2>
      <p className="mt-1 text-sm font-semibold text-slate-600">Every question is shown with your answer, the correct answer, the marks earned and an explanation.</p>

      <div className="mt-4 space-y-5">
        {result.questions.map((qr) => (
          <article key={qr.question.number} className="card p-4 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="text-lg font-black text-indigo-700">Question {qr.question.number}</h3>
                <p className="mt-1 text-sm text-slate-700">{qr.question.title}</p>
                <p className="mt-1 text-xs text-indigo-700">
                  {qr.question.lesson} · {qr.question.skill}
                </p>
              </div>
              <span className={cn("shrink-0 rounded-full px-3 py-1 text-sm font-bold", qr.earned === qr.max ? "bg-emerald-100 text-emerald-800" : qr.earned === 0 ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-800")}>
                {formatMarks(qr.earned)} / {formatMarks(qr.max)}
              </span>
            </div>
            {qr.question.intro && <div className="mt-3 whitespace-pre-line rounded-2xl bg-slate-50 p-3 text-sm text-slate-700">{qr.question.intro}</div>}

            <ul className="mt-4 space-y-3">
              {qr.subs.map((sr) => (
                <li key={sr.sub.id} className={cn("rounded-2xl border p-3 sm:p-4", sr.correct ? "border-emerald-200 bg-emerald-50/50" : "border-rose-200 bg-rose-50/50")}>
                  <div className="flex items-start gap-2">
                    <span className={cn("mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white", sr.correct ? "bg-emerald-500" : "bg-rose-500")} aria-label={sr.correct ? "Correct" : "Incorrect"}>
                      {sr.correct ? "✓" : "✗"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-900">
                        {qr.question.number}
                        {sr.sub.label}) <PromptText text={sr.sub.prompt} />
                      </p>
                      <dl className="mt-2 grid gap-1.5 text-sm sm:grid-cols-2">
                        <div>
                          <dt className="text-xs uppercase tracking-wide text-slate-500">Your answer</dt>
                          <dd className="break-words font-medium text-slate-800">{sr.given.trim() || <span className="italic text-slate-400">No answer</span>}</dd>
                        </div>
                        <div>
                          <dt className="text-xs uppercase tracking-wide text-slate-500">Correct answer</dt>
                          <dd className="break-words font-medium text-emerald-800">{correctAnswerText(sr.sub)}</dd>
                        </div>
                      </dl>
                      <p className="mt-2 text-sm text-slate-700">
                        <span className="font-semibold">Explanation:</span> {sr.sub.explanation}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Marks: {formatMarks(sr.earned)} / {formatMarks(sr.sub.marks)}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <button type="button" onClick={download} className="btn-pop min-h-14 flex-1 rounded-2xl bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-base font-black text-white shadow-lg shadow-indigo-200">
          Download Report
        </button>
        <button type="button" onClick={onStartAgain} className="btn-pop min-h-14 flex-1 rounded-2xl border-[3px] border-indigo-200 bg-white text-base font-black text-indigo-700 shadow">
          Start a New Attempt
        </button>
      </div>
    </main>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className={cn("rounded-3xl p-3 text-center sm:p-4", tone)}>
      <p className="text-xs font-extrabold uppercase tracking-wide opacity-70">{label}</p>
      <p className="mt-1 break-words text-2xl font-black sm:text-3xl">{value}</p>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:gap-2">
      <dt className="shrink-0 font-semibold text-slate-600">{k}:</dt>
      <dd className="break-words text-slate-900">{v}</dd>
    </div>
  );
}
