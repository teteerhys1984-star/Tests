import seal from "@/assets/report-seal.jpg";
import ContactStrip from "@/components/ContactStrip";
import { Cross, Flower, Tick } from "@/components/Decor";
import { EXAM_TITLE } from "@/config";
import { LESSON_TITLES, type LessonTag } from "@/data/exam";
import type { Attempt } from "@/lib/attempt";
import { elapsedMs, formatClock } from "@/lib/attempt";
import type { ExamResult } from "@/lib/grading";
import { buildReport, downloadText, safeName } from "@/lib/report";
import { gradeLabelEn, type SendStatus } from "@/lib/submit";

interface Props {
  attempt: Attempt;
  result: ExamResult;
  sendStatus: SendStatus;
  onResend: () => void;
  onRetake: () => void;
  onOpenTeacher: () => void;
}

export default function ResultScreen({
  attempt,
  result,
  sendStatus,
  onResend,
  onRetake,
  onOpenTeacher,
}: Props) {
  const pct = Math.round((result.score / result.total) * 100);
  const verdict = gradeLabelEn(pct);
  const fullQuestions = result.questions.filter((q) => q.awarded === q.marks).length;
  const timeUsed = formatClock(elapsedMs(attempt, attempt.submittedAt ?? Date.now()));
  const reportText = buildReport(attempt, result);
  const reportName = `${safeName(attempt.name)}-Grade5-L1-5-25Q-A-Report.txt`;

  const downloadReport = () => downloadText(reportName, reportText);
  const downloadBackup = () =>
    downloadText(`${safeName(attempt.name)}-Grade5-L1-5-25Q-A-Backup.txt`, reportText);

  return (
    <div className="min-h-screen w-full overflow-x-clip pb-12">
      {/* ── score crest ── */}
      <header className="border-b border-lilac-pale bg-gradient-to-b from-blush/65 via-paper to-paper">
        <div className="mx-auto max-w-3xl px-4 pb-8 pt-8 sm:px-6 sm:pt-12">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Flower className="h-6 w-6 text-lilac" />
              <p className="eyebrow text-lilac-deep">Exam Complete · {EXAM_TITLE}</p>
            </div>
            <p className="num text-[11px] font-bold text-ink-soft" dir="ltr">
              Attempt ID: {attempt.attemptId}
            </p>
          </div>

          <div className="mt-6">
            <SendBanner status={sendStatus} onResend={onResend} />
          </div>

          <div className="mt-6 flex flex-col items-center gap-6 rounded-[32px] border border-white bg-white/90 p-6 text-center shadow-[0_30px_60px_-42px_rgba(110,63,151,0.85)] sm:flex-row sm:p-8 sm:text-left">
            <div className="relative h-36 w-36 shrink-0">
              <img
                src={seal}
                alt="Award wreath"
                className="seal-in h-full w-full rounded-full object-cover shadow-sm"
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="num font-display text-[36px] font-black leading-none text-lilac-deep">
                  {result.score}
                </span>
                <span className="num text-[12px] font-extrabold text-ink-soft">
                  / {result.total}
                </span>
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <p className="eyebrow text-lilac">Student</p>
              <h1 className="mt-1 truncate font-display text-[clamp(1.6rem,5vw,2.3rem)] font-black text-ink">
                {result.name}
              </h1>
              <p className="mt-2 inline-flex items-center gap-2 rounded-full bg-lavender px-3.5 py-1 text-[14px] font-extrabold text-lilac-deep">
                <span>{pct}%</span>
                <span>·</span>
                <span>{verdict}</span>
              </p>

              <dl className="mt-4 grid grid-cols-3 gap-2 text-left">
                <Stat label="Parts" value={`${result.correctItems} / ${result.totalItems}`} />
                <Stat label="Full Qs" value={`${fullQuestions} / ${result.questions.length}`} />
                <Stat label="Time" value={timeUsed} />
              </dl>
            </div>
          </div>

          {/* ── per-lesson totals ── */}
          <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-5">
            {([1, 2, 3, 4, 5] as LessonTag[]).map((l) => {
              const rows = result.questions.filter((q) => q.question.lesson === l);
              const got = rows.reduce((s, r) => s + r.awarded, 0);
              const max = rows.reduce((s, r) => s + r.marks, 0);
              const w = max ? Math.round((got / max) * 100) : 0;
              return (
                <div
                  key={l}
                  className="rounded-2xl border border-lilac-pale bg-white/85 px-3 py-3 text-center"
                >
                  <p className="eyebrow truncate text-lilac">{LESSON_TITLES[l]}</p>
                  <p className="num mt-1 font-display text-[20px] font-black text-ink">
                    {got}
                    <span className="text-[13px] font-bold text-ink-soft">/{max}</span>
                  </p>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-lilac-pale">
                    <div className="h-full rounded-full bg-lilac" style={{ width: `${w}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── actions ── */}
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={downloadReport}
              className="flex min-h-[50px] flex-1 items-center justify-center gap-2 rounded-2xl bg-lilac-deep px-5 py-3 text-[15px] font-extrabold text-white transition hover:bg-lilac active:scale-[0.98]"
            >
              Download Report (TXT)
            </button>
            <button
              type="button"
              onClick={downloadBackup}
              className="flex min-h-[50px] items-center justify-center gap-2 rounded-2xl border-2 border-lilac-pale bg-white px-5 py-3 text-[14px] font-extrabold text-lilac-deep transition hover:border-lilac active:scale-[0.98]"
            >
              Backup Copy
            </button>
            <button
              type="button"
              onClick={onRetake}
              className="flex min-h-[50px] items-center justify-center rounded-2xl border-2 border-lilac-pale bg-white px-5 py-3 text-[14px] font-extrabold text-ink-soft transition hover:border-lilac hover:text-lilac-deep active:scale-[0.98]"
            >
              Retake Exam
            </button>
            <button
              type="button"
              onClick={onOpenTeacher}
              className="flex min-h-[50px] items-center justify-center rounded-2xl border-2 border-lilac-pale bg-lavender px-5 py-3 text-[14px] font-extrabold text-lilac-deep transition hover:border-lilac active:scale-[0.98]"
            >
              Teacher Answer Key
            </button>
          </div>
        </div>
      </header>

      {/* ── question-by-question feedback ── */}
      <main className="mx-auto mt-8 max-w-3xl space-y-5 px-4 sm:px-6">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-[22px] font-black text-ink">
            Every question &amp; explanation
          </h2>
          <p className="eyebrow text-ink-soft">{result.questions.length} questions</p>
        </div>

        {result.questions.map((qr) => {
          const q = qr.question;
          const allRight = qr.awarded === qr.marks;
          const partial = qr.awarded > 0 && qr.awarded < qr.marks;
          return (
            <section
              key={q.id}
              className="rounded-3xl border border-lilac-pale bg-white p-5 shadow-[0_16px_36px_-30px_rgba(110,63,151,0.6)] sm:p-6"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="eyebrow text-lilac">
                    Question {q.n} · {LESSON_TITLES[q.lesson]}
                  </p>
                  <p className="mt-1 text-[16px] font-extrabold text-ink">{q.instruction}</p>
                </div>
                <span
                  className={
                    "num shrink-0 rounded-full px-3 py-1 text-[13px] font-extrabold " +
                    (allRight
                      ? "bg-mint text-[#237771]"
                      : partial
                        ? "bg-peach-pale text-[#b4593a]"
                        : "bg-blush text-[#9c325e]")
                  }
                >
                  {qr.awarded} / {qr.marks} marks
                </span>
              </div>

              <div className="mt-4 space-y-3">
                {qr.items.map((it, idx) => (
                  <div
                    key={it.itemId}
                    className={
                      "rounded-2xl border p-3.5 " +
                      (it.isCorrect
                        ? "border-mint bg-mint/45"
                        : "border-peach-pale bg-peach-pale/45")
                    }
                  >
                    <div className="flex items-start gap-2.5">
                      <span
                        className={
                          "mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-white " +
                          (it.isCorrect ? "bg-turquoise" : "bg-peach")
                        }
                      >
                        {it.isCorrect ? (
                          <Tick className="h-3.5 w-3.5" />
                        ) : (
                          <Cross className="h-3.5 w-3.5" />
                        )}
                      </span>
                      <div className="min-w-0 flex-1 text-[14.5px]">
                        <p className="font-bold text-ink">
                          ({String.fromCharCode(97 + idx)}) {it.prompt}
                        </p>
                        <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[13.5px]">
                          <span>
                            <strong className="text-ink-soft">Your answer:</strong>{" "}
                            <span
                              className={
                                "font-extrabold " +
                                (it.isCorrect ? "text-[#237771]" : "text-[#9c325e]")
                              }
                            >
                              {it.student || "—"}
                            </span>
                          </span>
                          {!it.isCorrect && (
                            <span>
                              <strong className="text-ink-soft">Correct answer:</strong>{" "}
                              <span className="font-extrabold text-[#237771]">{it.correct}</span>
                            </span>
                          )}
                        </div>
                        <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-soft">
                          {it.explain}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <p className="mt-3 text-[12px] font-semibold text-ink-soft/80">
                Curriculum source: {q.source.page} · {q.source.exercise} ({q.source.skill})
              </p>
            </section>
          );
        })}
      </main>

      <ContactStrip onOpenTeacher={onOpenTeacher} />
    </div>
  );
}

function SendBanner({ status, onResend }: { status: SendStatus; onResend: () => void }) {
  if (status === "idle") return null;

  if (status === "sending") {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex items-center gap-3 rounded-2xl border border-lilac-pale bg-lavender px-4 py-3 text-[13.5px] font-bold text-lilac-deep"
      >
        <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-lilac-deep border-t-transparent" />
        <span>Sending your result to the teacher&apos;s gradebook…</span>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex items-center gap-3 rounded-2xl border border-mint bg-mint/85 px-4 py-3 text-[13.5px] font-bold text-[#237771]"
      >
        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-turquoise text-white">
          <Tick className="h-3.5 w-3.5" />
        </span>
        <span>Result recorded and sent to the teacher&apos;s sheet.</span>
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-peach bg-peach-pale px-4 py-3 text-[13.5px] font-bold text-[#9a4629]"
    >
      <span>
        Your score is saved on this device, but automatic sending did not complete. Use Resend
        result or download the TXT report.
      </span>
      <button
        type="button"
        onClick={onResend}
        className="shrink-0 rounded-xl bg-lilac-deep px-4 py-2 text-[13px] font-extrabold text-white transition hover:bg-lilac active:scale-95"
      >
        Resend result
      </button>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-paper px-3 py-2">
      <dt className="eyebrow text-ink-soft">{label}</dt>
      <dd className="num mt-0.5 text-[15px] font-extrabold text-ink">{value}</dd>
    </div>
  );
}
