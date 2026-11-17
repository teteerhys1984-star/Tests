import { useMemo } from "react";
import marked from "@/assets/marked.jpg";
import ContactFooter from "@/components/ContactFooter";
import { EXAM_TITLE } from "@/config";
import { LESSONS, LESSON_ORDER, type Question } from "@/data/exam";
import type { ExamResult, PartResult } from "@/lib/grading";
import { downloadReport, formatDuration, formatStamp } from "@/lib/report";
import { gradeLabelEn, type SendStatus } from "@/lib/submit";

interface Props {
  name: string;
  result: ExamResult;
  questions: Question[];
  submittedAt: number;
  elapsedMs: number;
  sendStatus: SendStatus;
  onResend: () => void;
  onRestart: () => void;
  onOpenTeacherKey: () => void;
}

/**
 * Delivery state of the result. A failed delivery never hides the score or the
 * TXT report — it only offers to send the very same result again.
 */
function SendBanner({ status, onResend }: { status: SendStatus; onResend: () => void }) {
  if (status === "idle") return null;
  if (status === "sending") {
    return (
      <p className="rounded-sm border-2 border-turq/40 bg-turq/8 px-4 py-3 text-[0.98rem] text-ink">
        <span className="label-caps mr-2 text-turq-deep">Sending</span>
        Your result is on its way to your teacher. Your score and report below are already final.
      </p>
    );
  }
  if (status === "success") {
    return (
      <p className="rounded-sm border-2 border-green/40 bg-green/10 px-4 py-3 text-[0.98rem] text-ink">
        <span className="label-caps mr-2 text-green">Sent</span>
        Your result was sent to your teacher.
      </p>
    );
  }
  return (
    <div className="rounded-sm border-2 border-coral/50 bg-coral/10 px-4 py-3 text-[0.98rem] text-ink">
      <p>
        <span className="label-caps mr-2 text-coral">Not sent</span>
        Your result could not be sent to your teacher automatically. Your score and the TXT report
        below are complete — you can also send the result again from here.
      </p>
      <button
        type="button"
        onClick={onResend}
        className="mt-3 rounded-full bg-coral px-5 py-2.5 font-semibold text-white shadow-[0_3px_0_#d24a3b] transition active:translate-y-[1px] active:shadow-[0_1px_0_#d24a3b]"
      >
        Resend result
      </button>
    </div>
  );
}

function Verdict({ part }: { part: PartResult }) {
  const ok = part.correct;
  return (
    <span
      className={`label-caps inline-flex items-center gap-1.5 rounded-full px-2 py-1 ${
        part.isRubric
          ? "bg-purple/12 text-purple"
          : ok
            ? "bg-green/12 text-green"
            : part.answered
              ? "bg-coral/12 text-coral"
              : "bg-ink/10 text-ink-soft"
      }`}
    >
      {part.isRubric ? "Teacher rubric" : ok ? "Correct" : part.answered ? "Incorrect" : "Not answered"}
    </span>
  );
}

function Tick({ ok, delay }: { ok: boolean; delay: number }) {
  return (
    <svg viewBox="0 0 32 32" className="h-7 w-7 shrink-0" aria-hidden="true">
      <path
        d={ok ? "M5 17 l7 8 L27 5" : "M7 7 L25 25 M25 7 L7 25"}
        fill="none"
        stroke={ok ? "#2fa84f" : "#ff6b5a"}
        strokeWidth={4}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="60"
        strokeDashoffset="60"
        style={{ animation: `tick-draw 340ms ease-out ${delay}ms forwards` }}
      />
    </svg>
  );
}

export default function ResultsScreen({
  name,
  result,
  questions,
  submittedAt,
  elapsedMs,
  sendStatus,
  onResend,
  onRestart,
  onOpenTeacherKey,
}: Props) {
  const qIndex = useMemo(() => new Map(questions.map((q, i) => [q.id, i + 1])), [questions]);
  const qById = useMemo(() => new Map(questions.map((q) => [q.id, q])), [questions]);
  const pct = Math.round((result.score / result.maxScore) * 100);

  const perLesson = LESSON_ORDER.map((id) => {
    const rows = result.questions.filter((r) => r.lesson === id);
    return {
      id,
      earned: rows.reduce((s, r) => s + r.earned, 0),
      max: rows.reduce((s, r) => s + r.marks, 0),
    };
  });

  return (
    <div className="min-h-screen">
      {/* ---- marked banner ------------------------------------------- */}
      <header className="relative overflow-hidden border-b-[4px] border-ink">
        <img src={marked} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover" />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to right, #fbf7ec 0%, rgba(251,247,236,0.94) 52%, rgba(251,247,236,0.5) 100%)",
          }}
        />
        <div className="relative mx-auto max-w-6xl px-4 py-8 md:px-8 md:py-10">
          <p className="label-caps text-coral">Marked · {EXAM_TITLE}</p>
          <h1
            className="mt-2 text-[clamp(2rem,6vw,3.6rem)] leading-none text-ink"
            style={{ fontFamily: "var(--font-display)" }}
          >
            YOUR RESULTS
          </h1>
          <p className="mt-3 text-lg text-ink-soft">
            Submitted {formatStamp(submittedAt)} · completion time{" "}
            <span className="tabular font-semibold text-ink">{formatDuration(elapsedMs)}</span>
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 md:px-8">
        {/* ---- delivery state of the result ---------------------------- */}
        <div className="mb-6">
          <SendBanner status={sendStatus} onResend={onResend} />
        </div>
        <div className="grid gap-6 lg:grid-cols-[19rem_1fr]">
          {/* ---- sticky score stamp ---------------------------------- */}
          <aside className="self-start lg:sticky lg:top-6">
            <div className="paper-card relative overflow-hidden rounded-sm p-6">
              <span
                className="anim-stamp absolute -right-3 top-4 rotate-[-8deg] border-[3px] border-purple px-3 py-1 label-caps text-purple"
                style={{ opacity: 0.85 }}
              >
                Marked
              </span>

              <p className="label-caps text-ink-soft">Student</p>
              <p className="text-xl font-semibold leading-snug text-ink">{name}</p>

              <div className="mt-5 flex items-end gap-3">
                <span
                  className="tabular flex h-32 w-32 items-center justify-center rounded-full border-[5px] border-coral text-5xl font-bold text-coral"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  {result.score}
                </span>
                <span className="pb-3 text-2xl text-ink-soft">
                  <span className="tabular">/ {result.maxScore}</span>
                  <span className="block label-caps mt-1">out of 100</span>
                </span>
              </div>

              <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-ink/10">
                <div className="h-full bg-green transition-[width] duration-700" style={{ width: `${pct}%` }} />
              </div>
              <p className="tabular mt-1.5 text-sm text-ink-soft">{pct}%</p>

              <p className="mt-2 flex items-baseline gap-2 text-sm">
                <span className="label-caps text-ink-soft">Grade</span>
                <span className="text-lg font-semibold text-purple">{gradeLabelEn(pct)}</span>
              </p>

              <dl className="mt-5 space-y-2 text-sm">
                <div className="flex justify-between border-b border-dotted border-ink/20 pb-2">
                  <dt className="text-ink-soft">Correct answers</dt>
                  <dd className="tabular font-semibold text-green">
                    {result.correctCount} of {result.totalParts}
                  </dd>
                </div>
                <div className="flex justify-between border-b border-dotted border-ink/20 pb-2">
                  <dt className="text-ink-soft">Incorrect answers</dt>
                  <dd className="tabular font-semibold text-coral">
                    {result.incorrectCount} of {result.totalParts}
                  </dd>
                </div>
                <div className="flex justify-between border-b border-dotted border-ink/20 pb-2">
                  <dt className="text-ink-soft">Questions fully correct</dt>
                  <dd className="tabular font-semibold text-turq-deep">
                    {result.questions.filter((r) => r.earned === r.marks).length} of{" "}
                    {result.questions.length}
                  </dd>
                </div>
                <div className="flex justify-between border-b border-dotted border-ink/20 pb-2">
                  <dt className="text-ink-soft">Completion time</dt>
                  <dd className="tabular font-semibold text-ink">{formatDuration(elapsedMs)}</dd>
                </div>
              </dl>

              <div className="mt-5 space-y-2">
                <button
                  type="button"
                  onClick={() =>
                    downloadReport({ name, result, questions, submittedAt, elapsedMs })
                  }
                  className="w-full rounded-full bg-bright px-5 py-3 font-semibold text-white shadow-[0_3px_0_#164fa6] transition active:translate-y-[2px] active:shadow-[0_1px_0_#164fa6]"
                >
                  Download Report
                </button>
                <button
                  type="button"
                  onClick={onRestart}
                  className="w-full rounded-full border-2 border-ink/20 bg-white px-5 py-3 font-semibold text-ink transition hover:border-coral hover:text-coral"
                >
                  Start a new attempt
                </button>
              </div>
            </div>

            {/* per-lesson breakdown */}
            <div className="paper-card mt-5 rounded-sm p-5">
              <p className="label-caps border-b-2 border-coral pb-2 text-ink">Score by lesson</p>
              <ul className="mt-3 space-y-3">
                {perLesson.map(({ id, earned, max }) => (
                  <li key={id}>
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-sm font-semibold text-ink">
                        {LESSONS[id].no}. {LESSONS[id].title}
                      </span>
                      <span className="tabular text-sm text-ink-soft">
                        {earned}/{max}
                      </span>
                    </div>
                    <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-ink/10">
                      <div
                        className="h-full"
                        style={{
                          width: `${(earned / max) * 100}%`,
                          backgroundColor: LESSONS[id].color,
                        }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          {/* ---- question-by-question review -------------------------- */}
          <section>
            <p className="label-caps border-b-2 border-ink pb-2 text-ink">
              Question-by-question review
            </p>

            <ol className="mt-4 space-y-4">
              {result.questions.map((qr, i) => {
                const lesson = LESSONS[qr.lesson];
                const allRight = qr.earned === qr.marks;
                const delay = Math.min(i * 45, 900);
                return (
                  <li key={qr.questionId} className="paper-card anim-slide rounded-sm">
                    <header
                      className="flex items-center gap-3 border-b-2 border-dotted border-ink/20 px-4 py-3"
                      style={{ background: `linear-gradient(90deg, ${lesson.color}18, transparent 65%)` }}
                    >
                      <Tick ok={allRight} delay={delay} />
                      <span
                        className="tabular flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white"
                        style={{ backgroundColor: lesson.color }}
                      >
                        {qIndex.get(qr.questionId) ?? i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="label-caps" style={{ color: lesson.colorDeep }}>
                          Lesson {lesson.no} · {lesson.title} · {lesson.pages}
                        </p>
                        <p className="truncate text-[12px] text-ink-soft">{qr.ref}</p>
                      </div>
                      <span className="tabular rounded-full border-2 border-ink/15 px-2.5 py-1 text-sm font-semibold text-ink">
                        {qr.earned}/{qr.marks}
                      </span>
                    </header>

                    {qById.get(qr.questionId)?.stem && (
                      <p className="border-b border-dotted border-ink/15 px-4 pt-3 text-[1.05rem] font-semibold text-ink">
                        {qById.get(qr.questionId)!.stem}
                      </p>
                    )}

                    <div className="divide-y divide-dotted divide-ink/15 px-4">
                      {qr.parts.map((p) => (
                        <div key={p.partId} className="py-4">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <p className="text-[1.02rem] leading-snug text-ink">
                              <span className="tabular mr-2 inline-flex h-5 min-w-5 items-center justify-center rounded-sm bg-turq/15 px-1 text-[11px] font-semibold text-turq-deep">
                                {p.label}
                              </span>
                              {p.prompt}
                            </p>
                            <span className="tabular shrink-0 rounded-full bg-ink/8 px-2.5 py-1 text-sm font-semibold text-ink">
                              {p.earned}/{p.marks}
                            </span>
                          </div>

                          <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                            <div className="rounded-sm border-l-4 border-turq bg-turq/8 px-3 py-2">
                              <dt className="label-caps text-turq-deep">Your answer</dt>
                              <dd className="mt-1 whitespace-pre-wrap text-ink">
                                {p.studentAnswer || <span className="text-ink-soft">(blank)</span>}
                              </dd>
                            </div>
                            <div className="rounded-sm border-l-4 border-green bg-green/8 px-3 py-2">
                              <dt className="label-caps text-green">Correct answer</dt>
                              <dd className="mt-1 whitespace-pre-wrap text-ink">{p.correctAnswer}</dd>
                            </div>
                          </dl>

                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <Verdict part={p} />
                            <span className="label-caps text-ink-soft">
                              {p.earned} of {p.marks} {p.marks === 1 ? "mark" : "marks"}
                            </span>
                          </div>

                          {p.explanation && (
                            <p className="mt-2 rounded-sm bg-yellow/20 px-3 py-2 text-sm leading-relaxed text-ink">
                              <span className="label-caps mr-2 text-ink-soft">Note</span>
                              {p.explanation}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>
        </div>
      </main>

      <ContactFooter showTeacherKey onOpenTeacherKey={onOpenTeacherKey} />
    </div>
  );
}
