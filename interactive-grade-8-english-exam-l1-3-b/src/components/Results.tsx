import heroImg from "@/assets/hero.jpg";
import journeyImg from "@/assets/journey.jpg";
import { EXAM_TITLE } from "@/config";
import { LESSONS, PASSAGES } from "@/data/exam";
import { formatClock, formatDateTime, type ExamReport } from "@/lib/grading";
import { downloadReport } from "@/lib/report";
import type { SendStatus } from "@/lib/submit";
import ContactFooter from "./ContactFooter";
import { CheckIcon, DownloadIcon, KeyIcon, RefreshIcon, XIcon } from "./Icons";

interface Props {
  report: ExamReport;
  sendStatus: SendStatus;
  onResend: () => void;
  onRetake: () => void;
  onOpenTeacher: () => void;
}

function SendStatusBanner({
  status,
  onResend,
}: {
  status: SendStatus;
  onResend: () => void;
}) {
  if (status === "idle") return null;

  if (status === "sending") {
    return (
      <div
        role="status"
        aria-live="polite"
        data-send-status="sending"
        className="mb-4 rounded-2xl border-2 border-brand-yellow bg-brand-yellow/20 px-4 py-3 text-sm font-bold text-ink"
      >
        <p>Sending result to teacher…</p>
        <p dir="rtl" lang="ar" className="mt-0.5 text-xs font-bold text-ink/75">
          جارٍ إرسال النتيجة إلى المعلّم…
        </p>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div
        role="status"
        aria-live="polite"
        data-send-status="success"
        className="mb-4 flex items-start gap-2.5 rounded-2xl border-2 border-[#0a7d3f]/30 bg-[#eefaf1] px-4 py-3 text-sm font-bold text-[#0a7d3f]"
      >
        <CheckIcon className="mt-0.5 h-4 w-4 shrink-0" />
        <div className="min-w-0 flex-1">
          <p>Result sent to teacher.</p>
          <p dir="rtl" lang="ar" className="mt-0.5 text-xs font-bold text-[#0a7d3f]/85">
            تم إرسال النتيجة إلى المعلّم بنجاح.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-live="polite"
      data-send-status="failed"
      className="mb-4 flex flex-col gap-3 rounded-2xl border-2 border-[#d43a1f]/35 bg-[#fff4f1] px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-extrabold text-[#b42c14]">
          Could not send the result automatically. It is saved on this device and will retry when
          the exam opens. You can resend it now or download your TXT report below.
        </p>
        <p dir="rtl" lang="ar" className="mt-1 text-xs font-bold text-[#b42c14]/85">
          تعذّر إرسال النتيجة تلقائيًا؛ حُفظت محليًا لإعادة المحاولة عند فتح الاختبار، ويمكنك
          إعادة الإرسال الآن أو تنزيل ملف التقرير.
        </p>
      </div>
      <button
        type="button"
        onClick={onResend}
        className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border-2 border-[#b42c14] bg-white px-4 py-2 text-xs font-extrabold uppercase tracking-wide text-[#b42c14] transition-colors hover:bg-[#b42c14] hover:text-white"
      >
        <RefreshIcon className="h-4 w-4" />
        <span>Resend result</span>
      </button>
    </div>
  );
}

export default function Results({
  report,
  sendStatus,
  onResend,
  onRetake,
  onOpenTeacher,
}: Props) {
  const pct = report.percentage;
  const ringColor =
    pct >= 85 ? "#86D40B" : pct >= 60 ? "#06B6B0" : pct >= 45 ? "#FF7A18" : "#e0452a";
  const circumference = 2 * Math.PI * 52;

  return (
    <div className="min-h-dvh dot-paper">
      <header className="relative overflow-hidden">
        <div className="h-2.5 stripe-band" />
        <div className="mx-auto max-w-3xl px-4 pb-5 pt-6 sm:px-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-lg bg-brand-yellow px-2.5 py-1 font-display text-[11px] font-black uppercase tracking-wide text-[#0b2a5b]">
              Model B
            </span>
            <span className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-ink/60">
              {EXAM_TITLE}
            </span>
          </div>
          <h1 className="mt-2 font-display text-3xl font-black uppercase leading-none text-ink sm:text-4xl">
            Results
          </h1>
          <p
            dir="auto"
            className="mt-2 break-words text-base font-extrabold text-brand-blue sm:text-lg"
          >
            {report.name}
          </p>
          <p className="mt-1 text-xs font-bold uppercase tracking-wider tabular text-ink/65">
            Submitted {formatDateTime(report.submittedAt)} · Time spent{" "}
            {formatClock(report.timeSpentSeconds)}
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 pb-4 sm:px-6">
        <SendStatusBanner status={sendStatus} onResend={onResend} />

        {/* score */}
        <section className="rounded-3xl border-[3px] border-[#0b2a5b] bg-white p-4 sticker-strong sm:p-6">
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <div className="relative h-36 w-36 shrink-0">
              <svg viewBox="0 0 120 120" className="h-full w-full" aria-hidden="true">
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  fill="none"
                  stroke="#E4EDFF"
                  strokeWidth="13"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  fill="none"
                  stroke={ringColor}
                  strokeWidth="13"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference * (1 - pct / 100)}
                  transform="rotate(-90 60 60)"
                />
              </svg>
              <div className="absolute inset-0 grid place-items-center text-center">
                <div>
                  <div className="font-display text-3xl font-black leading-none tabular text-ink">
                    {pct}%
                  </div>
                  <div className="mt-0.5 text-[10px] font-extrabold uppercase tracking-wider text-ink/60">
                    Score
                  </div>
                </div>
              </div>
            </div>

            <div className="w-full flex-1 text-center sm:text-left">
              <div className="flex flex-wrap items-baseline justify-center gap-3 sm:justify-start">
                <p className="font-display text-4xl font-black leading-none tabular text-ink sm:text-5xl">
                  {report.total}
                  <span className="text-xl text-ink/45"> / {report.maxTotal}</span>
                </p>
                <span
                  dir="rtl"
                  lang="ar"
                  className="rounded-full bg-paper px-3 py-1 text-xs font-extrabold text-brand-blue"
                >
                  التقدير: {report.gradeLabel}
                </span>
              </div>
              <p className="mt-1 text-xs font-extrabold uppercase tracking-[0.16em] tabular text-ink/60">
                {report.total} of {report.maxTotal} marks earned
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <StatBox
                  value={String(report.correctCount)}
                  label="Correct parts"
                  color="#0a7d3f"
                />
                <StatBox
                  value={String(report.incorrectCount)}
                  label="Wrong parts"
                  color="#d43a1f"
                />
                <StatBox
                  value={String(report.fullQuestions)}
                  label="Full Qs"
                  color="#1257FF"
                />
                <StatBox
                  value={String(report.partialQuestions)}
                  label="Partial Qs"
                  color="#b56200"
                />
              </div>
            </div>
          </div>

          {/* lesson scores */}
          <div className="mt-5 grid gap-2.5 sm:grid-cols-3">
            {report.lessons.map((l) => {
              const meta = LESSONS.find((m) => m.id === l.id)!;
              const p = l.max ? Math.round((l.earned / l.max) * 100) : 0;
              return (
                <div
                  key={l.id}
                  className="rounded-2xl border-2 border-ink/10 p-3"
                  style={{ backgroundColor: meta.soft }}
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-ink/60">
                      Lesson {l.id}
                    </span>
                    <span
                      className="font-display text-base font-black tabular"
                      style={{ color: meta.color }}
                    >
                      {l.earned} / {l.max}
                    </span>
                  </div>
                  <p className="truncate text-sm font-extrabold text-ink">{l.title}</p>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
                    <div
                      className="h-full rounded-full transition-[width] duration-700"
                      style={{ width: `${p}%`, backgroundColor: meta.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
            <button
              type="button"
              onClick={() => downloadReport(report)}
              className="flex min-h-13 flex-1 items-center justify-center gap-2 rounded-2xl bg-brand-blue px-4 py-3.5 font-display text-sm font-black uppercase tracking-wide text-white hover:bg-brand-blue-deep sm:text-base"
            >
              <DownloadIcon className="h-5 w-5" />
              Download TXT report
            </button>
            <button
              type="button"
              onClick={onRetake}
              className="min-h-13 flex-1 rounded-2xl border-[3px] border-[#0b2a5b] bg-white px-4 py-3.5 font-display text-sm font-black uppercase tracking-wide text-ink hover:bg-paper sm:text-base"
            >
              Start New Attempt
            </button>
          </div>
          <p className="mt-2 text-center text-[11px] font-bold text-ink/60">
            Starting a new attempt asks for your name again. Your report stays archived on this
            device for download.
          </p>
        </section>

        {/* review */}
        <h2 className="mt-7 font-display text-base font-black uppercase tracking-wide text-ink sm:text-lg">
          Question-by-question review
        </h2>
        <div className="mt-3 space-y-3">
          {report.questions.map((q) => {
            const meta = LESSONS.find((l) => l.id === q.lesson)!;
            const full = q.earned === q.max;
            const zero = q.earned === 0;
            const passage = PASSAGES.find((p) => p.lesson === q.lesson);
            const passageTitle =
              q.topic.includes("Reading") && passage ? passage.title : null;
            return (
              <article key={q.n} className="rounded-3xl border-2 border-ink/10 bg-white p-4 sticker">
                <div className="flex items-start gap-3">
                  <span
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-xl font-display text-sm font-black tabular text-white"
                    style={{ backgroundColor: meta.color }}
                  >
                    {q.n}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-ink/60">
                      Lesson {q.lesson} · {q.topic}
                    </p>
                    <p className="mt-0.5 text-sm font-extrabold leading-snug text-ink">
                      {q.instruction}
                    </p>
                    <p className="mt-1 text-[11px] font-bold uppercase tracking-wider text-ink/60">
                      {q.source}
                      {passageTitle ? ` · “${passageTitle}”` : ""}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-xl px-2.5 py-1.5 font-display text-sm font-black tabular ${
                      full
                        ? "bg-brand-lime text-[#183b00]"
                        : zero
                          ? "bg-[#ffe4df] text-[#d43a1f]"
                          : "bg-brand-yellow text-[#0b2a5b]"
                    }`}
                  >
                    {q.earned}/{q.max}
                  </span>
                </div>

                <div className="mt-3 space-y-2.5">
                  {q.parts.map((p) => (
                    <div
                      key={p.partId}
                      className={`rounded-2xl border-2 p-3 ${
                        p.ok
                          ? "border-[#0a7d3f]/25 bg-[#eefaf1]"
                          : "border-[#d43a1f]/20 bg-[#fff4f1]"
                      }`}
                    >
                      <p className="mb-1.5 break-words text-xs font-bold text-ink/70">
                        {q.parts.length > 1 ? `${p.label} — ` : ""}
                        {p.promptText}
                      </p>
                      <p className="break-words text-sm leading-snug text-ink">
                        <span className="font-extrabold text-ink/65">Your answer: </span>
                        {p.student}
                      </p>
                      <p className="mt-1 break-words text-sm leading-snug text-ink">
                        <span className="font-extrabold text-ink/65">Correct answer: </span>
                        <span className="font-extrabold text-[#0a7d3f]">{p.correct}</span>
                      </p>
                      <p className="mt-1.5 flex items-center gap-1.5 text-xs font-extrabold">
                        {p.ok ? (
                          <CheckIcon className="h-3.5 w-3.5 text-[#0a7d3f]" />
                        ) : (
                          <XIcon className="h-3.5 w-3.5 text-[#d43a1f]" />
                        )}
                        <span className="tabular text-ink/70">
                          Marks earned: {p.earned} / {p.max}
                        </span>
                      </p>
                    </div>
                  ))}
                </div>

                <p className="mt-2.5 rounded-2xl bg-paper p-3 text-xs leading-relaxed text-ink/75">
                  <span className="font-extrabold uppercase tracking-wider text-ink/65">
                    Why:{" "}
                  </span>
                  {q.explanation}
                </p>
              </article>
            );
          })}
        </div>

        <div className="mt-6 flex items-center justify-center">
          <button
            type="button"
            onClick={onOpenTeacher}
            aria-label="Teacher Area"
            title="Teacher Area"
            className="flex min-h-10 items-center gap-1.5 rounded-full px-3 text-[11px] font-bold uppercase tracking-wider text-ink/55 hover:text-ink"
          >
            <KeyIcon className="h-3.5 w-3.5" />
            Teacher Area
          </button>
        </div>
      </main>

      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <img
          src={heroImg}
          alt=""
          className="mt-6 hidden h-32 w-full rounded-3xl object-cover opacity-90 sm:block"
        />
        <img
          src={journeyImg}
          alt=""
          className="mt-3 hidden h-32 w-full rounded-3xl object-cover opacity-90 sm:block"
        />
      </div>

      <ContactFooter />
    </div>
  );
}

function StatBox({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <div className="rounded-xl border-2 border-ink/10 bg-paper px-2 py-2 text-center">
      <div className="font-display text-lg font-black leading-none tabular" style={{ color }}>
        {value}
      </div>
      <div className="mt-1 text-[10px] font-extrabold uppercase tracking-wider text-ink/65">
        {label}
      </div>
    </div>
  );
}
