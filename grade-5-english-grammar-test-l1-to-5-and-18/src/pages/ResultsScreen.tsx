import { useEffect, useState } from "react";
import {
  Brand,
  Footer,
  Icon,
  MiniSparkle,
  SectionEyebrow,
} from "../components/ui";
import { EXAM_QUESTIONS } from "../exam/examData";
import {
  buildPayload,
  sendWithRetry,
  type SendStatus,
} from "../exam/submit";
import { getFeedback, formatDate, formatSeconds, type ExamResult } from "../exam/grading";
import { downloadReport } from "../exam/report";
import type { StoredAttempt } from "../exam/storage";

function ScoreRing({ percentage }: { percentage: number }) {
  const degrees = Math.max(0, Math.min(100, percentage)) * 3.6;
  return (
    <div
      className="grid h-[146px] w-[146px] place-items-center rounded-full p-[10px] shadow-[0_20px_50px_-24px_rgba(18,107,116,.5)] sm:h-[178px] sm:w-[178px] sm:p-[12px]"
      style={{
        background: `conic-gradient(#0f9f9c 0deg, #45c79f ${degrees * 0.65}deg, #f5c84c ${degrees}deg, rgba(255,255,255,.5) ${degrees}deg 360deg)`,
      }}
      role="img"
      aria-label={`Score ${percentage} percent`}
    >
      <div className="grid h-full w-full place-items-center rounded-full border border-white bg-white/95 text-center">
        <div>
          <p className="display-font text-4xl leading-none text-slate-900 sm:text-5xl">{percentage}%</p>
          <p className="mt-1 text-[10px] font-black tracking-[0.14em] text-slate-400 uppercase">
            Your score
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ResultsScreen({
  attempt,
  result,
  onRestart,
  onTeacher,
}: {
  attempt: StoredAttempt;
  result: ExamResult;
  onRestart: () => void;
  onTeacher: () => void;
}) {
  const feedback = getFeedback(result.score);
  const fullQuestions = result.questionResults.filter(
    (question) => question.earned === question.totalMarks
  ).length;

  const [sendStatus, setSendStatus] = useState<SendStatus>("idle");

  useEffect(() => {
    const payload = buildPayload({
      attemptId: attempt.attemptId,
      meta: {
        studentName: attempt.studentName,
        startedAt: attempt.startedAt,
        submittedAt: attempt.submittedAt ?? Date.now(),
        elapsedMs: (attempt.elapsedSeconds ?? 0) * 1000,
      },
      order: EXAM_QUESTIONS,
      answers: attempt.answers,
    });
    setSendStatus("sending");
    sendWithRetry(payload).then((ok) => setSendStatus(ok ? "success" : "failed"));
  }, [attempt]);

  return (
    <div className="min-h-screen">
      <header className="border-b border-teal-100/70 bg-white/75 backdrop-blur-md">
        <div className="page-shell flex min-h-[68px] flex-wrap items-center justify-between gap-3 py-3">
          <Brand />
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-black text-emerald-800">
              <Icon name="check" className="h-3.5 w-3.5" />
              Exam submitted
            </span>
            <span
              className={`inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-black ${
                sendStatus === "sending"
                  ? "border-sky-200 bg-sky-50 text-sky-900"
                  : sendStatus === "success"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : sendStatus === "failed"
                      ? "border-rose-200 bg-rose-50 text-rose-800"
                      : "border-slate-200 bg-slate-50 text-slate-600"
              }`}
            >
              {sendStatus === "sending" && (
                <>
                  <Icon name="clock" className="h-3.5 w-3.5 animate-spin" /> Sending result…
                </>
              )}
              {sendStatus === "success" && (
                <>
                  <Icon name="check" className="h-3.5 w-3.5" /> Result sent to teacher
                </>
              )}
              {sendStatus === "failed" && (
                <>
                  <Icon name="x" className="h-3.5 w-3.5" /> Sending failed
                </>
              )}
              {sendStatus === "idle" && <span>Result not sent yet</span>}
            </span>
            <button
              type="button"
              onClick={() => downloadReport(result)}
              className="pressable inline-flex min-h-10 items-center gap-2 rounded-full bg-teal-700 px-3.5 py-2 text-xs font-extrabold text-white shadow-sm hover:bg-teal-800 sm:text-sm"
            >
              <Icon name="download" className="h-4 w-4" />
              Download Report
            </button>
          </div>
        </div>
      </header>

      <main className="page-shell pb-4 pt-5 sm:pt-7">
        <section className="relative overflow-hidden rounded-[1.75rem] border border-teal-100 bg-gradient-to-br from-emerald-50 via-sky-50 to-amber-50 p-5 shadow-[0_25px_65px_-42px_rgba(12,91,112,.55)] sm:p-8">
          <div className="pointer-events-none absolute -right-14 -top-20 h-64 w-64 rounded-full bg-emerald-200/40 blur-2xl" />
          <div className="pointer-events-none absolute bottom-0 left-1/3 h-48 w-48 rounded-full bg-amber-200/35 blur-3xl" />
          <div className="pointer-events-none absolute right-8 top-8 opacity-70">
            <MiniSparkle className="star-twinkle" size={22} color="#eebc3e" />
          </div>
          <div className="pointer-events-none absolute bottom-7 left-7 opacity-60">
            <MiniSparkle size={14} color="#1ba6b3" />
          </div>

          <div className="relative grid items-center gap-7 md:grid-cols-[1fr_auto] lg:gap-12">
            <div className="min-w-0">
              <SectionEyebrow>Your results</SectionEyebrow>
              <h1 className="display-font mt-1 break-words text-[2.1rem] leading-[1.02] text-slate-900 sm:text-5xl">
                Well done, {result.studentName}!
              </h1>
              <p className="mt-2 max-w-2xl text-base font-bold leading-6 text-slate-600 sm:text-lg">
                {feedback.headline} {feedback.message}
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white bg-white/90 px-3 py-1.5 text-xs font-extrabold text-slate-700 shadow-sm">
                  <Icon name="star" className="h-4 w-4 text-amber-500" />
                  {result.score} / {result.totalMarks} marks
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white bg-white/90 px-3 py-1.5 text-xs font-extrabold text-slate-700 shadow-sm">
                  <Icon name="trophy" className="h-4 w-4 text-teal-700" />
                  {fullQuestions} / {result.questionResults.length} full-mark questions
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white bg-white/90 px-3 py-1.5 text-xs font-extrabold text-slate-700 shadow-sm">
                  <Icon name="clock" className="h-4 w-4 text-sky-700" />
                  {formatSeconds(result.elapsedSeconds)}
                </span>
              </div>

              <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <button
                  type="button"
                  onClick={() => downloadReport(result)}
                  className="pressable inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-black text-white shadow-[0_9px_20px_-11px_rgba(15,118,110,.8)] hover:bg-teal-800"
                >
                  <Icon name="download" className="h-4 w-4" />
                  Download Report (.txt)
                </button>
                <button
                  type="button"
                  onClick={() => downloadReport(result, true)}
                  className="pressable inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-teal-300 bg-white px-4 py-2.5 text-sm font-black text-teal-900 shadow-sm hover:border-teal-500 hover:bg-teal-50"
                >
                  <Icon name="download" className="h-4 w-4" />
                  Download Backup Report
                </button>
                {sendStatus === "failed" && (
                  <button
                    type="button"
                    onClick={() => {
                      const payload = buildPayload({
                        attemptId: attempt.attemptId,
                        meta: {
                          studentName: attempt.studentName,
                          startedAt: attempt.startedAt,
                          submittedAt: attempt.submittedAt ?? Date.now(),
                          elapsedMs: (attempt.elapsedSeconds ?? 0) * 1000,
                        },
                        order: EXAM_QUESTIONS,
                        answers: attempt.answers,
                      });
                      setSendStatus("sending");
                      sendWithRetry(payload).then((ok) =>
                        setSendStatus(ok ? "success" : "failed")
                      );
                    }}
                    className="pressable inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-black text-rose-800 shadow-sm hover:border-rose-400 hover:bg-rose-100"
                  >
                    <Icon name="refresh" className="h-4 w-4" />
                    Retry sending
                  </button>
                )}
              </div>
              <p className="mt-2 flex items-start gap-1.5 text-[11px] font-semibold leading-4 text-slate-500">
                <Icon name="info" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                Your UTF-8 TXT report includes your name, score, every answer,
                the correct answers, and explanations.
              </p>
            </div>

            <div className="relative flex items-center justify-center pb-2 sm:justify-end">
              <div className="relative">
                <ScoreRing percentage={result.percentage} />
                <span className="absolute -right-3 -top-2 rounded-full border border-white bg-white/95 px-2.5 py-1 text-[10px] font-black text-teal-800 shadow-sm">
                  {result.score}/{result.totalMarks}
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Result summary">
          {[
            {
              label: "Correct branches",
              value: `${result.correctCount}`,
              detail: `out of ${result.branchCount}`,
              icon: "check" as const,
              color: "bg-emerald-50 text-emerald-800 border-emerald-200",
              iconBg: "bg-emerald-100 text-emerald-700",
            },
            {
              label: "Incorrect branches",
              value: `${result.incorrectCount}`,
              detail: "review each one below",
              icon: "x" as const,
              color: "bg-rose-50 text-rose-900 border-rose-200",
              iconBg: "bg-rose-100 text-rose-700",
            },
            {
              label: "Time taken",
              value: formatSeconds(result.elapsedSeconds),
              detail: "count-up stopwatch",
              icon: "clock" as const,
              color: "bg-sky-50 text-sky-900 border-sky-200",
              iconBg: "bg-sky-100 text-sky-700",
            },
            {
              label: "Lessons covered",
              value: "6",
              detail: "Lessons 1, 2, 3, 4, 5, 18",
              icon: "book" as const,
              color: "bg-amber-50 text-amber-900 border-amber-200",
              iconBg: "bg-amber-100 text-amber-700",
            },
          ].map((item) => (
            <div key={item.label} className={`rounded-2xl border p-4 ${item.color}`}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[10px] font-black tracking-[0.1em] uppercase opacity-70">
                    {item.label}
                  </p>
                  <p className="mt-1 text-2xl font-black leading-tight">{item.value}</p>
                  <p className="mt-0.5 text-[11px] font-semibold opacity-70">{item.detail}</p>
                </div>
                <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${item.iconBg}`}>
                  <Icon name={item.icon} className="h-5 w-5" />
                </span>
              </div>
            </div>
          ))}
        </section>

        <section className="mt-7" aria-labelledby="overview-heading">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <SectionEyebrow>Mark breakdown</SectionEyebrow>
              <h2 id="overview-heading" className="display-font mt-1 text-2xl text-slate-900 sm:text-3xl">
                Question overview
              </h2>
            </div>
            <p className="text-xs font-bold text-slate-500">
              {result.correctCount} of {result.branchCount} branches correct
            </p>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {result.questionResults.map((question) => {
              const ratio = question.totalMarks === 0 ? 0 : question.earned / question.totalMarks;
              const full = ratio === 1;
              const low = ratio < 0.5;
              return (
                <a
                  key={question.number}
                  href={`#result-question-${question.number}`}
                  className="soft-card group flex min-w-0 min-h-[80px] items-center gap-3 rounded-2xl p-3 transition hover:border-teal-300 hover:shadow-md"
                >
                  <span
                    className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl text-base font-black ${
                      full
                        ? "bg-emerald-100 text-emerald-800"
                        : low
                          ? "bg-amber-100 text-amber-800"
                          : "bg-sky-100 text-sky-800"
                    }`}
                  >
                    {question.number}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-extrabold text-slate-800">
                      {question.title}
                    </p>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full ${full ? "bg-emerald-500" : low ? "bg-amber-400" : "bg-teal-500"}`}
                        style={{ width: `${Math.round(ratio * 100)}%` }}
                      />
                    </div>
                  </div>
                  <span className="shrink-0 text-xs font-black text-slate-600">
                    {question.earned}/{question.totalMarks}
                  </span>
                </a>
              );
            })}
          </div>
        </section>

        <section className="mt-7" aria-labelledby="review-heading">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <SectionEyebrow>Answers and explanations</SectionEyebrow>
              <h2 id="review-heading" className="display-font mt-1 text-2xl text-slate-900 sm:text-3xl">
                Detailed review
              </h2>
            </div>
            <p className="text-xs font-bold text-slate-500">Every branch is marked separately.</p>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3">
            {result.questionResults.map((question) => (
              <details
                key={question.number}
                id={`result-question-${question.number}`}
                open
                className="group scroll-mt-24 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_30px_-24px_rgba(12,74,93,.4)]"
              >
                <summary className="flex cursor-pointer list-none items-center gap-3 bg-gradient-to-r from-slate-50 to-sky-50/60 p-3.5 marker:content-none sm:p-4">
                  <span
                    className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl text-sm font-black ${
                      question.earned === question.totalMarks
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-800 text-white"
                    }`}
                  >
                    {question.number}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="display-font truncate text-lg leading-tight text-slate-900 sm:text-xl">
                      {question.title}
                    </h3>
                    <p className="mt-0.5 text-[10px] font-bold text-slate-500">
                      {question.lessons.map((lesson) => `Lesson ${lesson}`).join(" · ")}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-black ${
                      question.earned === question.totalMarks
                        ? "bg-emerald-100 text-emerald-800"
                        : question.earned === 0
                          ? "bg-rose-100 text-rose-800"
                          : "bg-amber-100 text-amber-900"
                    }`}
                  >
                    {question.earned} / {question.totalMarks}
                  </span>
                  <Icon
                    name="arrow-right"
                    className="h-4 w-4 shrink-0 text-slate-400 transition group-open:rotate-90"
                  />
                </summary>

                <div className="grid gap-2.5 p-3 pt-2 sm:p-4 sm:pt-3">
                  {question.branches.map((branch) => (
                    <div
                      key={branch.branchId}
                      className={`rounded-xl border p-3 sm:p-4 ${
                        branch.isCorrect
                          ? "border-emerald-200 bg-emerald-50/25"
                          : "border-rose-200 bg-rose-50/25"
                      }`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="flex min-w-0 items-start gap-2">
                          <span
                            className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-white ${
                              branch.isCorrect ? "bg-emerald-600" : "bg-rose-600"
                            }`}
                          >
                            <Icon
                              name={branch.isCorrect ? "check" : "x"}
                              className="h-3.5 w-3.5"
                            />
                          </span>
                          <div className="min-w-0">
                            <p className="text-[10px] font-black tracking-[0.08em] text-slate-500 uppercase">
                              {branch.branchId} · {branch.prompt}
                            </p>
                            {branch.display && (
                              <p className="mt-1 break-words text-sm font-extrabold text-slate-900" dir="ltr">
                                {branch.display}
                              </p>
                            )}
                          </div>
                        </div>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black ${
                            branch.isCorrect
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {branch.earned}/{branch.marks} {branch.marks === 1 ? "mark" : "marks"}
                        </span>
                      </div>

                      <div className="mt-2.5 grid gap-2 sm:grid-cols-2">
                        <div className="rounded-lg border border-white bg-white/80 p-2.5">
                          <p className="text-[9px] font-black tracking-[0.1em] text-slate-400 uppercase">
                            Your answer
                          </p>
                          <p
                            className={`mt-0.5 break-words text-sm font-extrabold ${
                              branch.isCorrect ? "text-emerald-800" : "text-rose-800"
                            }`}
                          >
                            {branch.submitted}
                          </p>
                        </div>
                        <div className="rounded-lg border border-emerald-100 bg-white/80 p-2.5">
                          <p className="text-[9px] font-black tracking-[0.1em] text-slate-400 uppercase">
                            Correct answer
                          </p>
                          <p className="mt-0.5 break-words text-sm font-extrabold text-emerald-900">
                            {branch.correct}
                          </p>
                        </div>
                      </div>

                      <div className="mt-2 rounded-lg bg-white/75 p-2.5">
                        <p className="text-xs font-semibold leading-5 text-slate-700">
                          <span className="font-black text-slate-900">Explanation: </span>
                          {branch.explanation}
                        </p>
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-black text-sky-800">
                            Lesson {branch.lesson}
                          </span>
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                            {branch.skill}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </details>
            ))}
          </div>
        </section>

        <section className="mt-7 overflow-hidden rounded-2xl border border-teal-200 bg-teal-50/60 p-4 sm:flex sm:items-center sm:justify-between sm:gap-6 sm:p-5">
          <div>
            <p className="text-[10px] font-black tracking-[0.13em] text-teal-700 uppercase">
              Ready to practise again?
            </p>
            <h2 className="display-font mt-1 text-xl text-slate-900 sm:text-2xl">
              Start a new attempt
            </h2>
            <p className="mt-1 max-w-xl text-xs font-semibold leading-5 text-slate-600">
              You will return to the name screen. Your current answers and score
              stay available on this results page until you begin a new attempt.
            </p>
          </div>
          <button
            type="button"
            onClick={onRestart}
            className="pressable mt-3 inline-flex min-h-12 w-full shrink-0 items-center justify-center gap-2 rounded-xl border border-teal-300 bg-white px-4 py-2.5 text-sm font-extrabold text-teal-900 shadow-sm hover:border-teal-500 hover:bg-teal-50 sm:mt-0 sm:w-auto"
          >
            <Icon name="refresh" className="h-4 w-4" />
            Start a New Attempt
          </button>
        </section>

        <p className="mt-4 text-center text-[11px] font-semibold text-slate-400">
          Submitted {formatDate(result.submittedAt)} · Grammar Test Lessons 1 to 5 and 18
        </p>
      </main>

      <Footer onTeacher={onTeacher} />
    </div>
  );
}
