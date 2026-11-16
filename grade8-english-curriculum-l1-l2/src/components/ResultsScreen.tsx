/**
 * Results page shown immediately after submission: score summary, stats,
 * and the detailed per-question breakdown with correct answers,
 * marks earned and explanations.
 */
import {
  BadgeCheck,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  CircleSlash,
  Clock3,
  Download,
  MinusCircle,
  RotateCcw,
  Trophy,
  XCircle,
} from "lucide-react";
import { EXAM_TITLE } from "../data/questions";
import { formatMarks, gradeExam } from "../lib/grading";
import { QUESTIONS } from "../data/questions";
import { downloadReport } from "../lib/report";
import { formatDateTime, formatElapsed } from "../lib/time";
import type { AnswerMap, QuestionResult } from "../types";
import { cn } from "../utils/cn";
import { LessonChip } from "./QuestionPalette";
import { useEffect, useMemo, useState } from "react";
import { buildPayload, reportForSubmission, sendWithRetry } from "../lib/submit";

function ScoreRing({ percentage }: { percentage: number }) {
  const R = 74;
  const C = 2 * Math.PI * R;
  const filled = (percentage / 100) * C;
  const tone =
    percentage >= 85 ? "#34d399" : percentage >= 50 ? "#22d3ee" : "#fb7185";
  return (
    <div className="relative h-44 w-44">
      <svg viewBox="0 0 180 180" className="h-full w-full -rotate-90">
        <circle cx="90" cy="90" r={R} fill="none" stroke="rgba(148,163,184,0.12)" strokeWidth="13" />
        <circle
          cx="90"
          cy="90"
          r={R}
          fill="none"
          stroke={tone}
          strokeWidth="13"
          strokeLinecap="round"
          strokeDasharray={`${filled} ${C - filled}`}
          style={{
            transition: "stroke-dasharray 1.4s cubic-bezier(0.22,1,0.36,1)",
            filter: `drop-shadow(0 0 14px ${tone}66)`,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="tabular font-display text-4xl font-bold text-slate-50">
          {percentage}%
        </span>
        <span className="mt-1 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">
          Score
        </span>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  value,
  label,
  tone,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  tone: string;
}) {
  return (
    <div className="glass rounded-2xl p-4">
      <div className={cn("mb-2 flex h-9 w-9 items-center justify-center rounded-lg", tone)}>
        {icon}
      </div>
      <div className="tabular font-display text-xl font-bold text-slate-100">{value}</div>
      <div className="text-xs font-medium uppercase tracking-wider text-slate-500">{label}</div>
    </div>
  );
}

function QuestionBreakdownCard({ q }: { q: QuestionResult }) {
  const state =
    q.earned === q.max ? "full" : q.earned === 0 ? "zero" : "partial";
  return (
    <article className="glass overflow-hidden rounded-3xl">
      <header className="flex flex-wrap items-center gap-2.5 border-b border-slate-800/80 px-5 py-4 sm:px-6">
        <span className="font-display text-xl font-bold text-slate-100">Q{q.number}</span>
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
        <span
          className={cn(
            "ml-auto inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold",
            state === "full" &&
              "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
            state === "partial" &&
              "border-amber-400/30 bg-amber-400/10 text-amber-300",
            state === "zero" && "border-rose-400/30 bg-rose-400/10 text-rose-300",
          )}
        >
          {state === "full" ? (
            <CheckCircle2 className="h-3.5 w-3.5" />
          ) : state === "partial" ? (
            <MinusCircle className="h-3.5 w-3.5" />
          ) : (
            <XCircle className="h-3.5 w-3.5" />
          )}
          {formatMarks(q.earned)} / {formatMarks(q.max)} marks
        </span>
      </header>

      <div className="space-y-4 px-5 py-5 sm:px-6">
        <p className="text-sm leading-relaxed text-slate-400">{q.instruction}</p>

        {q.passage && (
          <details className="group rounded-xl border border-slate-800 bg-slate-950/50">
            <summary className="cursor-pointer select-none px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-500 transition hover:text-slate-300">
              {q.passage.title} — show passage
            </summary>
            <p className="px-4 pb-4 text-sm leading-[1.8] text-slate-300">
              {q.passage.text}
            </p>
          </details>
        )}

        <div className="space-y-3">
          {q.subparts.map((s, i) => (
            <div
              key={s.id}
              className={cn(
                "rounded-xl border p-3.5 sm:p-4",
                s.isCorrect
                  ? "border-emerald-400/20 bg-emerald-400/[0.045]"
                  : "border-rose-400/20 bg-rose-400/[0.045]",
              )}
            >
              <div className="flex items-start gap-2.5">
                {s.isCorrect ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                ) : (
                  <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-200">
                    {q.number}.{i + 1} — {s.prompt}
                  </p>
                  <div className="mt-2 grid gap-1.5 text-[13px] sm:grid-cols-2">
                    <p className={cn("leading-snug", s.isCorrect ? "text-emerald-200/90" : "text-rose-200/90")}>
                      <span className="font-semibold text-slate-400">Your answer: </span>
                      {s.studentDisplay}
                    </p>
                    <p className="leading-snug text-slate-300">
                      <span className="font-semibold text-slate-400">Correct answer: </span>
                      {s.correctDisplay}
                    </p>
                  </div>
                </div>
                <span className="tabular shrink-0 text-xs font-bold text-slate-500">
                  {formatMarks(s.earned)} / {formatMarks(s.max)}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-sky-400/20 bg-sky-400/[0.06] p-4">
          <p className="flex items-start gap-2 text-sm leading-relaxed text-sky-100/90">
            <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-sky-300" />
            <span>
              <span className="font-bold">Why: </span>
              {q.explanation}
            </span>
          </p>
        </div>
      </div>

      <footer className="border-t border-slate-800/60 bg-slate-950/40 px-5 py-2.5 sm:px-6">
        <p className="text-[11px] font-medium uppercase tracking-wider text-slate-600">
          {q.curriculumRef}
        </p>
      </footer>
    </article>
  );
}

export function ResultsScreen({
  studentName,
  submittedAt,
  startTs,
  endTs,
  answers,
  attemptId,
  onRetake,
}: {
  studentName: string;
  submittedAt: string;
  startTs: number;
  endTs: number;
  answers: AnswerMap;
  attemptId: string;
  onRetake: () => void;
}) {
  const result = gradeExam(QUESTIONS, answers);
  const elapsedMs = Math.max(0, endTs - startTs);
  const [sendState, setSendState] = useState<"sending"|"success"|"failed">("sending");
  const reportText = useMemo(() => reportForSubmission({studentName,startTs,endTs,answers}), [studentName,startTs,endTs,answers]);
  const transmit = () => { setSendState("sending"); void sendWithRetry(buildPayload({attemptId,studentName,startTs,endTs,answers,reportText})).then(ok=>setSendState(ok?"success":"failed")); };
  useEffect(() => { transmit(); }, [attemptId]);

  const handleDownload = () =>
    downloadReport(
      {
        studentName,
        examTitle: EXAM_TITLE,
        coverage:
          "Unit 1 · Lesson 1: Future Plans (Q1–10) · Lesson 2: School Challenges (Q11–20)",
        submittedAt,
        elapsedMs,
      },
      result,
    );

  return (
    <div className="animate-fade-up mx-auto w-full max-w-5xl px-4 pb-10 pt-8 sm:pt-12">
      {/* Summary hero */}
      <section className="glass overflow-hidden rounded-3xl">
        <div className="border-b border-slate-800/80 bg-gradient-to-r from-cyan-400/10 via-transparent to-violet-400/10 px-6 py-6 sm:px-8">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:gap-10">
            <ScoreRing percentage={result.percentage} />
            <div className="text-center sm:text-left">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3.5 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-300">
                <Trophy className="h-3.5 w-3.5" />
                Exam completed
              </div>
              <h1 className="mt-3 font-display text-2xl font-bold text-slate-50 sm:text-3xl">
                Well done, {studentName}!
              </h1>
              <p className="mt-1.5 text-sm text-slate-400">
                {EXAM_TITLE}
              </p>
              <p className="tabular mt-4 font-display text-5xl font-bold text-slate-50">
                {formatMarks(result.totalScore)}
                <span className="text-2xl text-slate-500"> / {result.maxScore}</span>
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 px-6 py-6 sm:grid-cols-3 lg:grid-cols-5 sm:px-8">
          <StatCard
            icon={<CheckCircle2 className="h-4.5 w-4.5 text-emerald-300" />}
            value={String(result.fullyCorrect)}
            label="Fully correct"
            tone="bg-emerald-400/10 border border-emerald-400/25"
          />
          <StatCard
            icon={<CircleSlash className="h-4.5 w-4.5 text-amber-300" />}
            value={String(result.partiallyCorrect)}
            label="Partially correct"
            tone="bg-amber-400/10 border border-amber-400/25"
          />
          <StatCard
            icon={<XCircle className="h-4.5 w-4.5 text-rose-300" />}
            value={String(result.incorrect)}
            label="Incorrect"
            tone="bg-rose-400/10 border border-rose-400/25"
          />
          <StatCard
            icon={<Clock3 className="h-4.5 w-4.5 text-cyan-300" />}
            value={formatElapsed(elapsedMs)}
            label="Time taken"
            tone="bg-cyan-400/10 border border-cyan-400/25"
          />
          <StatCard
            icon={<CalendarClock className="h-4.5 w-4.5 text-violet-300" />}
            value={new Date(submittedAt).toLocaleDateString("en-GB")}
            label="Submitted"
            tone="bg-violet-400/10 border border-violet-400/25"
          />
        </div>

        <div className="border-t border-slate-800/80 px-6 py-4 sm:px-8">
          <p className="text-xs text-slate-500">
            <span className="font-semibold text-slate-400">Submission time:</span>{" "}
            {formatDateTime(submittedAt)}
          </p>
        </div>

        <div className="border-t border-slate-800/80 px-6 py-3 text-sm" role="status" aria-live="polite">{sendState === "sending" ? "Sending result…" : sendState === "success" ? "Result sent successfully." : "Result not sent yet. Your score and TXT report remain available; try again below."}</div>
        <div className="flex flex-col gap-3 px-6 pb-5 sm:flex-row sm:px-8">
          {sendState === "failed" && <button type="button" onClick={transmit} className="rounded-xl border border-amber-500 px-5 py-3 text-sm font-semibold text-amber-200">Retry sending result</button>}
          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-sky-500 px-6 py-3.5 font-display text-[15px] font-bold text-slate-950 shadow-[0_14px_40px_-12px_rgba(34,211,238,0.7)] transition hover:brightness-110 active:scale-[0.98]"
          >
            <Download className="h-4.5 w-4.5" />
            Download Exam Report
          </button>
          <button
            type="button"
            onClick={onRetake}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 px-6 py-3.5 text-sm font-semibold text-slate-300 transition hover:border-slate-500 hover:text-white"
          >
            <RotateCcw className="h-4 w-4" />
            Retake Exam (new attempt)
          </button>
        </div>
      </section>

      {/* Breakdown */}
      <section className="mt-10">
        <div className="mb-5 flex items-center gap-3">
          <BadgeCheck className="h-5 w-5 text-cyan-300" />
          <h2 className="font-display text-xl font-bold text-slate-100">
            Detailed breakdown — all 20 questions
          </h2>
        </div>
        <div className="mb-4 flex flex-wrap gap-2">
          <LessonChip lesson="lesson1" />
          <LessonChip lesson="lesson2" />
        </div>
        <div className="space-y-5">
          {result.questionResults.map((q) => (
            <QuestionBreakdownCard key={q.id} q={q} />
          ))}
        </div>
      </section>
    </div>
  );
}
