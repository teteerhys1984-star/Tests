import {
  Award,
  CheckCircle2,
  ClipboardList,
  Download,
  RotateCcw,
  Timer,
  Trophy,
  XCircle,
  AlertTriangle,
  CalendarClock,
} from "lucide-react";
import { EXAM_SCOPE, EXAM_TITLE, LESSON_TITLES } from "../data/questions";
import { downloadReport } from "../logic/report";
import type { SendStatus } from "../logic/submit";
import type { ExamResult, QuestionResult } from "../types";
import { formatDateTime, formatHMS } from "../utils/format";
import { cn } from "../utils/cn";
import { BrandMark, HudChip, SKILL_ICON, rankFor } from "./ui";

function ScoreGauge({ percent }: { percent: number }) {
  const r = 66;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative h-44 w-44">
      <svg viewBox="0 0 160 160" className="h-full w-full -rotate-90">
        <circle cx="80" cy="80" r={r} fill="none" stroke="#1c2610" strokeWidth="13" />
        <circle
          cx="80"
          cy="80"
          r={r}
          fill="none"
          stroke="url(#gaugeGrad)"
          strokeWidth="13"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (Math.min(100, percent) / 100) * c}
          style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.2,0.7,0.2,1)" }}
        />
        <defs>
          <linearGradient id="gaugeGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#7d9b4e" />
            <stop offset="55%" stopColor="#a5b653" />
            <stop offset="100%" stopColor="#ffb400" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-hud text-4xl font-black text-[#ffd75e] tabular-nums">
          {Math.round(percent)}
          <span className="text-xl">%</span>
        </span>
        <span className="font-hud text-[8.5px] tracking-[0.3em] text-[#8fa06d] uppercase">
          Mission Score
        </span>
      </div>
    </div>
  );
}

function QuestionReport({ q }: { q: QuestionResult }) {
  const state =
    q.earned === q.max ? "correct" : q.earned > 0 ? "partial" : "wrong";
  return (
    <article
      className={cn(
        "rounded-lg border bg-[#0d120a]/90 p-4 sm:p-5",
        state === "correct" && "border-l-4 border-[#2a4a1a] border-l-[#7dd069]",
        state === "partial" && "border-l-4 border-[#4a3a10] border-l-[#ffb400]",
        state === "wrong" && "border-l-4 border-[#4a1d16] border-l-[#ff5f56]"
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        {state === "correct" ? (
          <CheckCircle2 className="h-4.5 w-4.5 text-[#7dd069]" />
        ) : state === "partial" ? (
          <AlertTriangle className="h-4.5 w-4.5 text-[#ffb400]" />
        ) : (
          <XCircle className="h-4.5 w-4.5 text-[#ff5f56]" />
        )}
        <h3 className="font-hud text-[13px] font-bold tracking-wider text-[#f4ecd4] uppercase">
          Q{q.n}. {q.title}
        </h3>
        <span className="hud-chip">{SKILL_ICON[q.skill]} {q.skill}</span>
        <span className="hud-chip">Lesson {q.lesson} · {LESSON_TITLES[q.lesson]}</span>
        <span
          className={cn(
            "font-hud ml-auto rounded border px-2 py-1 text-[11px] font-bold tabular-nums",
            state === "correct" && "border-[#2a4a1a] bg-[#16220d] text-[#8fdf7a]",
            state === "partial" && "border-[#4a3a10] bg-[#211804] text-[#ffd75e]",
            state === "wrong" && "border-[#4a1d16] bg-[#220f0b] text-[#ff9d8f]"
          )}
        >
          {q.earned} / {q.max} marks
        </span>
      </div>

      <p className="mt-2 text-[14.5px] font-medium text-[#9aa886] italic">{q.instruction}</p>

      {q.passage && (
        <details className="mt-2 rounded border border-[#232d15] bg-[#0a0d08] px-3 py-2">
          <summary className="cursor-pointer font-hud text-[9.5px] tracking-[0.22em] text-[#8fa06d] uppercase select-none">
            Reading text
          </summary>
          <p className="mt-2 text-[15px] leading-relaxed text-[#cbb894]">{q.passage}</p>
        </details>
      )}

      <div className="mt-3 grid gap-2.5">
        {q.parts.map((p) => (
          <div key={p.partId} className="rounded-md border border-[#1c2411] bg-[#0a0d08] p-3">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[15.5px] font-semibold text-[#efe7cf]">{p.prompt}</p>
              {p.arabic && (
                <span
                  dir="rtl"
                  lang="ar"
                  className="ar-word rounded border border-[#b58500] bg-[#171304] px-3 py-0.5 text-[17px] font-bold text-[#ffd75e]"
                >
                  {p.arabic}
                </span>
              )}
            </div>
            <div className="mt-2 grid gap-1.5 text-[14.5px] sm:grid-cols-2">
              <p className="font-medium">
                <span className="font-hud mr-1.5 text-[9px] tracking-[0.2em] text-[#5c6a45] uppercase">
                  Your answer
                </span>
                <span
                  className={cn(
                    "font-bold",
                    p.correct ? "text-[#8fdf7a]" : p.earned > 0 ? "text-[#ffd75e]" : "text-[#ff9d8f]"
                  )}
                >
                  {p.studentAnswer}
                </span>
              </p>
              <p className="font-medium">
                <span className="font-hud mr-1.5 text-[9px] tracking-[0.2em] text-[#5c6a45] uppercase">
                  Correct answer
                </span>
                <span className="font-bold text-[#a9c37e]">{p.correctAnswer}</span>
              </p>
            </div>

            {p.criteria && (
              <div className="mt-2 space-y-1 rounded border border-[#232d15] bg-[#0d120a] p-2.5">
                <p className="font-hud text-[8.5px] tracking-[0.22em] text-[#8fa06d] uppercase">
                  Writing rubric — auto-scored
                </p>
                {p.criteria.map((c) => (
                  <p key={c.description} className="flex items-start gap-2 text-[13.5px] font-medium text-[#cbb894]">
                    {c.met ? (
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#7dd069]" />
                    ) : (
                      <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#ff5f56]" />
                    )}
                    <span>
                      {c.description}{" "}
                      <span className="font-hud text-[10px] font-bold text-[#8fa06d]">
                        {c.earned}/{c.max}
                      </span>
                    </span>
                  </p>
                ))}
              </div>
            )}

            <p className="mt-2 border-t border-[#1c2411] pt-2 text-[14px] leading-snug text-[#9aa886]">
              <span className="font-hud mr-1.5 text-[9px] tracking-[0.2em] text-[#55682c] uppercase">
                Why
              </span>
              {p.explanation}
              <span className="mt-1 block text-[12px] font-semibold text-[#5c6a45]">
                Marks: {p.earned}/{p.max} · Unit 1, Lesson {q.lesson} — {q.ref.book} {q.ref.pages}
              </span>
            </p>
          </div>
        ))}
      </div>
    </article>
  );
}

/* ------------------------------------------------------------------ */
/* Delivery status — teacher-only data is never shown here: no token,   */
/* no attemptId, no gradeLabel. The student sees only the send state.   */
/* ------------------------------------------------------------------ */
const SEND_META: Record<Exclude<SendStatus, "idle">, { text: string; border: string; bg: string; color: string }> = {
  sending: {
    text: "Sending your result to your teacher…",
    border: "#4a3a10",
    bg: "#1a1304",
    color: "#ffd75e",
  },
  success: {
    text: "Your result was sent to your teacher ✓",
    border: "#2a4a1a",
    bg: "#101a0a",
    color: "#8fdf7a",
  },
  failed: {
    text: "Your result could not be sent automatically. You can download your report below and give it to your teacher, or try sending it again.",
    border: "#4a1d16",
    bg: "#1d0e0a",
    color: "#ff9d8f",
  },
};

function SendBanner({ status, onResend }: { status: SendStatus; onResend: () => void }) {
  if (status === "idle") return null;
  const m = SEND_META[status];
  return (
    <div
      className="mt-4 rounded-lg border p-3 text-[13.5px] leading-relaxed font-medium"
      style={{ borderColor: m.border, background: m.bg }}
      role="status"
      aria-live="polite"
      data-send-status={status}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="min-w-[12rem] flex-1 font-bold" style={{ color: m.color }}>
          {m.text}
        </p>
        {status === "failed" && (
          <button
            type="button"
            onClick={onResend}
            className="btn-ghost shrink-0 rounded-md px-3 py-1.5 text-[11px] font-black"
            data-testid="resend-result"
          >
            Resend Result
          </button>
        )}
      </div>
      {status === "failed" && (
        <p className="mt-1.5 text-[12.5px] font-medium text-[#9aa886]">
          Your score is already shown above — a sending problem never hides or changes it.
        </p>
      )}
    </div>
  );
}

export default function ResultsScreen({
  result,
  sendStatus,
  onResend,
  onRetake,
}: {
  result: ExamResult;
  sendStatus: SendStatus;
  onResend: () => void;
  onRetake: () => void;
}) {
  const rank = rankFor(result.percentage);
  return (
    <div className="tactical-bg relative min-h-screen">
      <div className="grid-overlay pointer-events-none fixed inset-0" aria-hidden="true" />

      <main className="relative z-10 mx-auto w-full max-w-5xl px-3 py-8 sm:px-4">
        {/* header */}
        <div className="fade-up flex flex-col items-center gap-2 text-center">
          <div className="relative">
            <BrandMark size={54} />
            <span className="zone-ring" aria-hidden="true" />
          </div>
          <HudChip icon={<Trophy className="h-3.5 w-3.5" />} tone="amber">
            Final Mission — Exam Complete
          </HudChip>
          <h1 className="font-hud text-2xl font-black tracking-wide text-[#f4ecd4] uppercase sm:text-3xl">
            Mission Debrief
          </h1>
          <p className="text-[15px] font-semibold text-[#9aa886]">
            {EXAM_TITLE} · {EXAM_SCOPE}
          </p>
        </div>

        {/* score card */}
        <section className="hud-panel hud-corners fade-up mt-6 rounded-xl p-6" style={{ animationDelay: "0.08s" }}>
          <div className="flex flex-col items-center gap-6 md:flex-row md:justify-around">
            <ScoreGauge percent={result.percentage} />
            <div className="text-center md:text-left">
              <p className="font-hud text-[10px] tracking-[0.28em] text-[#8fa06d] uppercase">
                Recruit
              </p>
              <p className="font-hud text-xl font-black tracking-wide text-[#f4ecd4] uppercase">
                {result.studentName}
              </p>
              <p className="font-hud mt-2 inline-flex items-center gap-2 rounded border border-[#b58500] bg-[#221a03] px-3 py-1.5 text-[11px] font-black tracking-[0.18em] text-[#ffb400] uppercase">
                <Award className="h-4 w-4" />
                {rank.label}
              </p>
              <p className="mt-2 max-w-xs text-[14.5px] font-medium text-[#a9c37e]">{rank.blurb}</p>
            </div>
            <div className="grid w-full max-w-xs gap-2">
              <div className="flex items-center justify-between rounded border border-[#232d15] bg-[#0d120a] px-3.5 py-2.5">
                <span className="font-hud flex items-center gap-1.5 text-[9.5px] tracking-[0.18em] text-[#8fa06d] uppercase">
                  <ClipboardList className="h-3.5 w-3.5" /> Total score
                </span>
                <span className="font-hud text-lg font-black text-[#ffd75e] tabular-nums" data-testid="final-score">
                  {result.totalEarned} / {result.totalMax}
                </span>
              </div>
              <div className="flex items-center justify-between rounded border border-[#232d15] bg-[#0d120a] px-3.5 py-2.5">
                <span className="font-hud flex items-center gap-1.5 text-[9.5px] tracking-[0.18em] text-[#8fa06d] uppercase">
                  <Timer className="h-3.5 w-3.5" /> Time taken
                </span>
                <span className="font-hud text-[13px] font-bold text-[#e6dcc0] tabular-nums">
                  {formatHMS(result.durationMs)}
                </span>
              </div>
              <div className="flex items-center justify-between rounded border border-[#232d15] bg-[#0d120a] px-3.5 py-2.5">
                <span className="font-hud flex items-center gap-1.5 text-[9.5px] tracking-[0.18em] text-[#8fa06d] uppercase">
                  <CalendarClock className="h-3.5 w-3.5" /> Submitted
                </span>
                <span className="font-hud text-[11.5px] font-bold text-[#e6dcc0]">
                  {formatDateTime(result.submittedAt)}
                </span>
              </div>
            </div>
          </div>

          {/* stat chips */}
          <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              { label: "Correct", value: result.correctQuestions, cls: "text-[#8fdf7a] border-[#2a4a1a] bg-[#101a0a]" },
              { label: "Partial", value: result.partiallyCorrect, cls: "text-[#ffd75e] border-[#4a3a10] bg-[#1a1304]" },
              { label: "Incorrect", value: result.incorrectQuestions, cls: "text-[#ff9d8f] border-[#4a1d16] bg-[#1d0e0a]" },
              { label: "Rubric-scored", value: result.rubricReviewQuestions, cls: "text-[#a9c3e0] border-[#1c3149] bg-[#0b1420]" },
            ].map((s) => (
              <div key={s.label} className={cn("rounded-lg border px-3 py-3 text-center", s.cls)}>
                <p className="font-hud text-2xl font-black tabular-nums">{s.value}</p>
                <p className="font-hud text-[8.5px] tracking-[0.22em] uppercase opacity-80">{s.label}</p>
              </div>
            ))}
          </div>

          {result.rubricReviewQuestions > 0 && (
            <p className="mt-3 rounded border border-[#1c3149] bg-[#0b1420] px-3 py-2 text-[13px] font-medium text-[#a9c3e0]">
              Open writing tasks are auto-scored by the published word-rubric shown under each task.
              Your teacher may review these sentences manually.
            </p>
          )}

          {/* result delivery — always visible, never gates the score */}
          <SendBanner status={sendStatus} onResend={onResend} />

          {/* actions */}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => downloadReport(result)}
              data-testid="download-report"
              className="btn-primary flex flex-1 items-center justify-center gap-2 rounded-md px-5 py-3 text-[12px] font-black"
            >
              <Download className="h-4 w-4" />
              Download Exam Report (TXT)
            </button>
            <button
              type="button"
              onClick={onRetake}
              className="btn-ghost flex flex-1 items-center justify-center gap-2 rounded-md px-5 py-3 text-[12px] font-bold"
            >
              <RotateCcw className="h-4 w-4" />
              Retake Exam
            </button>
          </div>
        </section>

        {/* detailed breakdown */}
        <div className="fade-up mt-8" style={{ animationDelay: "0.14s" }}>
          <h2 className="font-hud mb-3 text-center text-[13px] font-black tracking-[0.28em] text-[#cbb894] uppercase">
            Question-by-Question Report
          </h2>
          <div className="grid gap-3">
            {result.questions.map((q) => (
              <QuestionReport key={q.id} q={q} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
