import { useMemo } from "react";
import {
  Award,
  BadgeCheck,
  CalendarClock,
  CircleCheck,
  CircleX,
  Clock3,
  Download,
  Eye,
  RotateCcw,
  Sprout,
  UserRound,
} from "lucide-react";
import type { ExamResult, ExamSession } from "../types";
import type { SendStatus } from "../logic/submit";
import { EXAM_META, QUESTIONS, questionMarks } from "../data/examData";
import { formatDuration } from "../logic/report";
import { Flower, Sparkle } from "./Decor";

interface ResultsProps {
  session: ExamSession;
  result: ExamResult;
  sendStatus?: SendStatus;
  onResend?: () => void;
  onDownload: () => void;
  onRetake: () => void;
}

const SEND_META: Record<Exclude<SendStatus, "idle">, { text: string; cls: string }> = {
  sending: {
    text: "Sending your result to your teacher…",
    cls: "border-gold/60 bg-gold/20 text-[#92400e]",
  },
  success: {
    text: "Your result was sent to your teacher ✓",
    cls: "border-leaf/60 bg-leaf/25 text-leaf-deep",
  },
  failed: {
    text: "Your result could not be sent automatically. You can download your report below and give it to your teacher, or try sending it again.",
    cls: "border-petal-deep/70 bg-petal/45 text-rose-deep",
  },
};

function SendBanner({ status, onResend }: { status: SendStatus; onResend?: () => void }) {
  if (status === "idle") return null;
  const meta = SEND_META[status];
  return (
    <div
      className={`mx-auto mt-6 max-w-2xl rounded-2xl border px-4 py-3 text-left text-[13px] font-semibold no-print ${meta.cls}`}
      role="status"
      aria-live="polite"
      data-send-status={status}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="min-w-[12rem] flex-1 font-bold">{meta.text}</p>
        {status === "failed" && onResend && (
          <button
            type="button"
            onClick={onResend}
            data-testid="resend-result"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border-2 border-rose/50 bg-white/90 px-4 py-1.5 font-display text-xs font-bold text-rose-deep shadow-soft transition-all hover:border-rose hover:bg-white"
          >
            Resend Result
          </button>
        )}
      </div>
      {status === "failed" && (
        <p className="mt-1 text-[12px] font-medium text-ink-soft">
          Your score is already shown above — a sending problem never hides your result or blocks downloading the TXT report.
        </p>
      )}
    </div>
  );
}

const STATUS_META = {
  correct: { label: "Correct", cls: "bg-leaf/30 text-leaf-deep border-leaf/60", Icon: CircleCheck },
  partial: { label: "Partially correct", cls: "bg-gold/25 text-[#a16207] border-gold/60", Icon: Sprout },
  incorrect: { label: "Incorrect", cls: "bg-petal/60 text-rose-deep border-petal-deep/60", Icon: CircleX },
  review: { label: "Teacher review", cls: "bg-sky/50 text-[#1d4ed8] border-sky/70", Icon: Eye },
} as const;

export default function Results({
  session,
  result,
  sendStatus = "idle",
  onResend,
  onDownload,
  onRetake,
}: ResultsProps) {
  const submitted = useMemo(() => (session.submittedAt ? new Date(session.submittedAt) : new Date()), [session.submittedAt]);

  const gradeMessage =
    result.percentage >= 90
      ? { title: "A magnificent bloom!", text: "Outstanding work — your garden is full of flowers!" }
      : result.percentage >= 75
        ? { title: "Beautifully grown!", text: "Great job! A few petals need a little more rain." }
        : result.percentage >= 50
          ? { title: "Growing nicely!", text: "Good effort — keep watering your knowledge every day." }
          : { title: "A brave little seed!", text: "Every garden starts small. Review the answers below and try again." };

  return (
    <div className="mx-auto w-full max-w-5xl px-3 pb-16 pt-8 sm:px-5">
      {/* ── hero card ─────────────────────────────────────────── */}
      <section className="paper-card animate-bloom relative overflow-hidden rounded-[2.2rem] p-8 text-center sm:p-12">
        <Sparkle className="absolute left-10 top-10 h-5 w-5 text-gold animate-twinkle" />
        <Sparkle className="absolute right-12 top-16 h-4 w-4 text-lilac-deep animate-twinkle" style={{ animationDelay: "-1.2s" }} />
        <Flower className="absolute -left-8 -bottom-8 h-32 w-32 text-petal-deep opacity-30" />
        <Flower className="absolute -right-10 -top-10 h-36 w-36 text-lilac opacity-40" />

        <p className="font-serif text-xs font-semibold uppercase tracking-[0.35em] text-violet">
          {EXAM_META.brand}
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold text-gradient-rose sm:text-4xl">Your Exam Results</h1>

        {/* score flower */}
        <div className="relative mx-auto mt-8 flex h-44 w-44 items-center justify-center">
          <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full -rotate-90">
            <circle cx="100" cy="100" r="84" fill="none" stroke="#EFE3F8" strokeWidth="17" />
            <circle
              cx="100" cy="100" r="84" fill="none"
              stroke="url(#scoreGrad)" strokeWidth="17" strokeLinecap="round"
              strokeDasharray={`${(result.earned / result.maxMarks) * 527.8} 527.8`}
              className="transition-all duration-1000"
            />
            <defs>
              <linearGradient id="scoreGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#EC6BA8" />
                <stop offset="100%" stopColor="#7C5CB0" />
              </linearGradient>
            </defs>
          </svg>
          <div className="text-center">
            <p className="font-display text-5xl font-extrabold text-gradient-rose leading-none">{result.earned}</p>
            <p className="mt-1 font-display text-sm font-bold text-ink-soft">out of {result.maxMarks}</p>
            <p className="mt-1 inline-block rounded-full bg-petal/50 px-3 py-0.5 font-display text-sm font-bold text-rose-deep">
              {result.percentage}%
            </p>
          </div>
        </div>

        <h2 className="mt-5 font-display text-2xl font-bold text-violet-deep">{gradeMessage.title}</h2>
        <p className="mx-auto mt-1 max-w-md text-sm font-semibold text-ink-soft">{gradeMessage.text}</p>

        {/* fact strip */}
        <div className="mx-auto mt-8 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { Icon: UserRound, label: "Student", value: session.studentName },
            { Icon: CalendarClock, label: "Submitted", value: submitted.toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) },
            { Icon: Clock3, label: "Time taken", value: formatDuration(session.finalElapsedMs ?? 0) },
            { Icon: Award, label: "Scope", value: "Grade 3 · Unit 1 · L1–5" },
          ].map(({ Icon, label, value }) => (
            <div key={label} className="rounded-2xl bg-cream-deep/80 px-3 py-3">
              <Icon className="mx-auto h-5 w-5 text-rose" strokeWidth={2.4} />
              <p className="mt-1 text-[10px] font-extrabold uppercase tracking-widest text-ink-soft/70">{label}</p>
              <p className="mt-0.5 break-words font-display text-[13px] font-bold text-ink leading-tight">{value}</p>
            </div>
          ))}
        </div>

        {/* counters */}
        <div className="mx-auto mt-5 flex max-w-2xl flex-wrap items-center justify-center gap-2.5">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-leaf/60 bg-leaf/25 px-4 py-2 text-[13px] font-extrabold text-leaf-deep">
            <CircleCheck className="h-4 w-4" /> Correct: {result.fullyCorrect}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/60 bg-gold/20 px-4 py-2 text-[13px] font-extrabold text-[#a16207]">
            <Sprout className="h-4 w-4" /> Partial: {result.partial}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-petal-deep/60 bg-petal/50 px-4 py-2 text-[13px] font-extrabold text-rose-deep">
            <CircleX className="h-4 w-4" /> Incorrect: {result.incorrect}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-sky/70 bg-sky/40 px-4 py-2 text-[13px] font-extrabold text-[#1d4ed8]">
            <Eye className="h-4 w-4" /> Teacher review: {result.reviewCount}
          </span>
        </div>
        {result.pendingMarks > 0 && (
          <p className="mt-3 text-xs font-semibold text-ink-soft">
            Your writing answer is waiting for your teacher's review ({result.pendingMarks} marks pending).
            The score above counts only the automatically marked questions.
          </p>
        )}

        {/* delivery status — always non-blocking */}
        <SendBanner status={sendStatus} onResend={onResend} />

        {/* actions */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3 no-print">
          <button
            type="button"
            onClick={onDownload}
            data-testid="download-report"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-rose to-violet px-7 py-3.5 font-display text-base font-bold text-white shadow-lift transition-all hover:scale-[1.03]"
          >
            <Download className="h-5 w-5" strokeWidth={2.5} />
            Download Exam Report (TXT)
          </button>
          <button
            type="button"
            onClick={onRetake}
            className="inline-flex items-center gap-2 rounded-full border-2 border-lilac-deep bg-white/80 px-7 py-3.5 font-display text-base font-bold text-violet shadow-soft transition-all hover:border-rose hover:text-rose"
          >
            <RotateCcw className="h-5 w-5" strokeWidth={2.5} />
            Retake Exam
          </button>
        </div>
      </section>

      {/* ── detailed report ───────────────────────────────────── */}
      <section className="mt-8">
        <h2 className="flex items-center gap-2.5 px-2 font-display text-2xl font-bold text-violet-deep">
          <BadgeCheck className="h-6 w-6 text-rose" strokeWidth={2.4} />
          Question-by-question report
        </h2>
        <p className="px-2 pt-1 text-sm font-semibold text-ink-soft">
          Compare your answers with the correct ones — every mistake is a seed for next time.
        </p>

        <div className="mt-5 space-y-5">
          {QUESTIONS.map((question) => {
            const qr = result.questionResults.find((r) => r.questionId === question.id);
            if (!qr) return null;
            const meta = STATUS_META[qr.status];
            const total = questionMarks(question);
            return (
              <article key={question.id} className="paper-card animate-rise overflow-hidden rounded-[1.6rem]">
                <header className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-lilac/30 bg-gradient-to-r from-cream to-petal/15 px-5 py-3.5 sm:px-6">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-rose to-violet font-display text-sm font-bold text-white">
                      {question.id}
                    </span>
                    <div>
                      <p className="font-display text-sm font-bold text-ink">{question.instruction}</p>
                      <p className="text-[11px] font-bold uppercase tracking-wide text-ink-soft/70">
                        {question.category} · Lesson {question.lesson}: {question.reference.lessonTitle}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-extrabold ${meta.cls}`}>
                      <meta.Icon className="h-3.5 w-3.5" strokeWidth={2.6} /> {meta.label}
                    </span>
                    <span className="rounded-full border border-gold/60 bg-gold/20 px-3 py-1 font-display text-[12px] font-bold text-[#a16207]">
                      {qr.earned} / {total}{qr.pending ? ` · ${qr.pending} pending` : ""}
                    </span>
                  </div>
                </header>

                <div className="px-5 py-4 sm:px-6">
                  {question.stimulus && (
                    <div className="mb-4 rounded-xl border border-lilac/40 bg-cream/70 px-4 py-3 text-[13.5px] leading-relaxed text-ink-soft">
                      <p className="font-serif font-semibold italic text-violet">{question.stimulusTitle}</p>
                      {question.stimulus.split("\n\n").map((p, i) => (
                        <p key={i} className="mt-1">{p.split("\n").map((l, j) => <span key={j}>{l}{j < p.split("\n").length - 1 && <br />}</span>)}</p>
                      ))}
                    </div>
                  )}
                  <ul className="space-y-4">
                    {qr.parts.map((pr) => {
                      const part = question.parts.find((p) => p.id === pr.partId)!;
                      const sm = STATUS_META[pr.status === "unanswered" ? "incorrect" : pr.status];
                      return (
                        <li key={pr.partId} className="rounded-2xl bg-white/60 p-4 ring-1 ring-lilac/40">
                          <div className="flex items-start justify-between gap-3">
                            <p className="whitespace-pre-line text-[14.5px] font-bold text-ink">
                              {question.parts.length > 1 && <span className="mr-1.5 text-violet">{part.id})</span>}
                              {part.text.replace(/____/g, "………")}
                              {part.arabic && (
                                <span dir="rtl" lang="ar" className="arabic-word mx-1.5 inline-flex -translate-y-0.5 rounded-lg border border-petal-deep/40 bg-petal/25 px-2.5 py-0 text-[15px] font-bold text-violet-deep">
                                  {part.arabic}
                                </span>
                              )}
                            </p>
                            <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10.5px] font-extrabold ${sm.cls}`}>
                              <sm.Icon className="h-3 w-3" strokeWidth={3} />
                              {pr.status === "review" ? "review" : `${pr.earned}/${pr.maxMarks}`}
                            </span>
                          </div>
                          <div className="mt-2.5 grid gap-2 text-[13.5px] sm:grid-cols-2">
                            <p className="rounded-xl bg-petal/25 px-3 py-2">
                              <span className="block text-[10.5px] font-extrabold uppercase tracking-wider text-rose-deep">Your answer</span>
                              <span className="font-semibold text-ink">{pr.studentDisplay}</span>
                            </p>
                            <p className="rounded-xl bg-leaf/20 px-3 py-2">
                              <span className="block text-[10.5px] font-extrabold uppercase tracking-wider text-leaf-deep">Correct answer</span>
                              <span className="font-semibold text-ink">{pr.correctDisplay}</span>
                            </p>
                          </div>
                          {part.rubric && (
                            <ul className="mt-2.5 list-disc space-y-0.5 rounded-xl bg-sky/25 px-4 py-2.5 pl-8 text-[12.5px] font-semibold text-ink">
                              {part.rubric.map((r) => <li key={r}>{r}</li>)}
                            </ul>
                          )}
                          <p className="mt-2.5 flex gap-2 rounded-xl bg-gold/15 px-3 py-2 text-[13px] font-semibold text-ink">
                            <Sparkle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold" />
                            {part.explanation}
                          </p>
                          <p className="mt-2 text-[11px] font-bold uppercase tracking-wide text-ink-soft/60">
                            Reference: Lesson {question.reference.lesson} — {question.reference.lessonTitle} · {part.kind === "writing" ? "Writing rubric" : question.reference.skill}
                          </p>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
