import { useEffect, useState } from "react";
import heroImg from "@/assets/hero.jpg";
import journeyImg from "@/assets/journey.jpg";
import { LESSONS, PASSAGES, QUESTIONS, questionMarks } from "@/data/exam";
import {
  answeredCount,
  formatClock,
  isPartAnswered,
  isQuestionAnswered,
  isQuestionPartial,
  splitTextStem,
} from "@/lib/grading";
import ContactFooter from "./ContactFooter";
import {
  CheckIcon,
  ChevronIcon,
  GridIcon,
  Logo,
  SoundOffIcon,
  SoundOnIcon,
} from "./Icons";

interface Props {
  name: string;
  answers: Record<string, string>;
  index: number;
  elapsedSeconds: number;
  muted: boolean;
  onIndexChange: (i: number) => void;
  onAnswer: (partId: string, value: string) => void;
  onToggleMute: () => void;
  onSubmit: () => void;
}

const LETTERS = ["A", "B", "C", "D", "E"];

export default function ExamScreen({
  name,
  answers,
  index,
  elapsedSeconds,
  muted,
  onIndexChange,
  onAnswer,
  onToggleMute,
  onSubmit,
}: Props) {
  const [navOpen, setNavOpen] = useState(false);
  const [openPassage, setOpenPassage] = useState<number | null>(() => {
    const initial = QUESTIONS[Math.max(0, Math.min(index, QUESTIONS.length - 1))];
    return initial.topic.includes("Reading comprehension") ? initial.lesson : null;
  });

  const safeIndex = Math.max(0, Math.min(index, QUESTIONS.length - 1));
  const q = QUESTIONS[safeIndex];
  const qMarks = questionMarks(q);
  const lessonMeta = LESSONS.find((l) => l.id === q.lesson)!;
  const passage = PASSAGES.find((p) => p.lesson === q.lesson);
  const isReading = q.topic.includes("Reading comprehension");

  const answered = answeredCount(answers);
  const total = QUESTIONS.length;
  const complete = answered === total;
  const pct = Math.round((answered / total) * 100);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [safeIndex]);

  useEffect(() => {
    if (isReading) setOpenPassage(q.lesson);
  }, [isReading, q.lesson, q.n]);

  function jumpToLesson(lessonId: number) {
    const rows = QUESTIONS.map((qq, i) => ({ qq, i })).filter(
      (r) => r.qq.lesson === lessonId,
    );
    const firstUnanswered = rows.find((r) => !isQuestionAnswered(r.qq, answers));
    onIndexChange((firstUnanswered ?? rows[0]).i);
  }

  return (
    <div className="min-h-dvh dot-paper pb-36">
      {/* ------------------------- header ------------------------- */}
      <header className="sticky top-0 z-40 border-b-2 border-ink/10 bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-3xl px-3 pt-2 sm:px-4">
          <div className="flex items-center gap-2">
            <Logo className="h-8 w-8 shrink-0 rounded-lg" />
            <div className="min-w-0 flex-1">
              <p
                dir="auto"
                className="truncate text-xs font-extrabold tracking-wide text-ink/75"
              >
                <span className="uppercase text-ink/55">Model B · </span>
                {name}
              </p>
            </div>
            <span
              aria-label="Elapsed time"
              className="shrink-0 rounded-xl bg-ink px-2.5 py-1.5 font-display text-sm font-black tabular tracking-wide text-white sm:text-base"
            >
              {formatClock(elapsedSeconds)}
            </span>
            <button
              type="button"
              onClick={onToggleMute}
              aria-pressed={muted}
              aria-label={muted ? "Sound is off" : "Sound is on"}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border-2 border-ink/15 bg-white text-ink/70 hover:border-brand-blue"
            >
              {muted ? (
                <SoundOffIcon className="h-5 w-5" />
              ) : (
                <SoundOnIcon className="h-5 w-5 text-brand-turq" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setNavOpen(true)}
              aria-label="Jump to a question"
              className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border-2 border-ink/15 bg-white text-ink/70 hover:border-brand-blue"
            >
              <GridIcon className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-2 flex items-center gap-2">
            <div
              className="h-2.5 flex-1 overflow-hidden rounded-full bg-ink/10"
              role="progressbar"
              aria-valuenow={answered}
              aria-valuemin={0}
              aria-valuemax={total}
              aria-label="Answered questions"
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand-blue via-brand-turq to-brand-lime transition-[width] duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="shrink-0 text-[11px] font-extrabold tabular text-ink/65">
              Question {q.n} of {total} · {answered}/{total}
            </span>
          </div>

          <div className="mt-2 flex gap-1.5 pb-1">
            {LESSONS.map((l) => {
              const rows = QUESTIONS.filter((qq) => qq.lesson === l.id);
              const done = rows.filter((qq) => isQuestionAnswered(qq, answers)).length;
              const active = q.lesson === l.id;
              return (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => jumpToLesson(l.id)}
                  aria-current={active ? "true" : undefined}
                  className={`min-h-10 flex-1 truncate rounded-t-xl border-2 border-b-0 px-2 py-1.5 text-[11px] font-extrabold uppercase tracking-wide transition-colors sm:text-xs ${
                    active
                      ? "border-ink/10 bg-white text-ink"
                      : "border-ink/10 bg-paper text-ink/60 hover:text-ink"
                  }`}
                  style={active ? { borderTopColor: l.color, borderTopWidth: 4 } : undefined}
                  title={`Lesson ${l.id} — ${l.title}`}
                >
                  <span className="sm:hidden">L{l.id}</span>
                  <span className="hidden sm:inline">Lesson {l.id}</span>
                  <span className="tabular">
                    {" "}
                    {done}/{rows.length}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-3 pt-4 sm:px-4">
        {/* --------------------- passage --------------------- */}
        {passage && (
          <section className="mb-4 overflow-hidden rounded-3xl border-2 border-ink/10 bg-white sticker">
            <button
              type="button"
              onClick={() =>
                setOpenPassage(openPassage === passage.lesson ? null : passage.lesson)
              }
              aria-expanded={openPassage === passage.lesson}
              className="flex min-h-14 w-full items-center gap-3 p-3 text-left"
            >
              <span
                className="grid h-10 w-10 shrink-0 place-items-center rounded-xl font-display text-base font-black text-white"
                style={{ backgroundColor: lessonMeta.color }}
              >
                R
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[10px] font-extrabold uppercase tracking-[0.16em] text-ink/60">
                  Reading passage · {passage.source}
                </span>
                <span className="block text-sm font-extrabold leading-snug text-ink">
                  {passage.title}
                </span>
              </span>
              <span className="shrink-0 rounded-lg bg-paper px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-ink/65">
                {openPassage === passage.lesson ? "Hide" : "Read"}
              </span>
              <ChevronIcon
                className={`h-4 w-4 shrink-0 text-ink/60 transition-transform ${
                  openPassage === passage.lesson ? "rotate-90" : ""
                }`}
              />
            </button>

            {openPassage === passage.lesson && (
              <div className="border-t-2 border-dashed border-ink/15 px-4 py-4">
                <img
                  src={passage.lesson === 1 ? heroImg : journeyImg}
                  alt={passage.title}
                  className="mb-3 h-32 w-full rounded-2xl object-cover sm:h-44"
                />
                <h3 className="font-display text-base font-black uppercase leading-tight text-ink sm:text-lg">
                  {passage.title}
                </h3>
                <div className="mt-2 space-y-3">
                  {passage.paragraphs.map((p, i) => (
                    <p
                      key={i}
                      className="text-[15px] leading-relaxed text-ink/85 sm:text-base"
                    >
                      {p}
                    </p>
                  ))}
                </div>
                <p className="mt-3 text-[11px] font-bold uppercase tracking-wider text-ink/60">
                  {passage.source}
                </p>
              </div>
            )}
          </section>
        )}

        {/* --------------------- question --------------------- */}
        <article className="rounded-3xl border-2 border-ink/10 bg-white p-4 sticker sm:p-6">
          <div className="flex items-start gap-3">
            <span
              className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border-[3px] border-[#0b2a5b] font-display text-lg font-black tabular text-white sticker-strong"
              style={{ backgroundColor: lessonMeta.color }}
            >
              {q.n}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-ink/60">
                  Lesson {q.lesson} · {lessonMeta.title}
                </p>
                <span className="rounded-full bg-paper px-2.5 py-0.5 text-[11px] font-extrabold uppercase tabular text-brand-blue">
                  {qMarks} {qMarks === 1 ? "mark" : "marks"}
                </span>
              </div>
              <h2 className="mt-1 text-base font-extrabold leading-snug text-ink sm:text-lg">
                {q.instruction}
              </h2>
              <p className="mt-1 text-[11px] font-bold uppercase tracking-wider text-ink/60">
                {q.topic} · {q.source}
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-4">
            {q.parts.map((part, i) => {
              const value = answers[part.id] ?? "";
              const label =
                q.parts.length > 1 ? `Part ${String.fromCharCode(97 + i)}` : "";
              const controlLabel = label ? `Question ${q.n} ${label}` : `Question ${q.n}`;
              return (
                <div key={part.id}>
                  {q.parts.length > 1 && (
                    <p className="mb-1.5 text-[11px] font-extrabold uppercase tracking-[0.16em] tabular text-brand-blue">
                      {label} · {part.marks} {part.marks === 1 ? "mark" : "marks"}
                    </p>
                  )}

                  {part.kind === "choice" ? (
                    <ChoicePart
                      stem={part.stem}
                      options={part.options}
                      value={value}
                      onChange={(v) => onAnswer(part.id, v)}
                      ariaLabel={controlLabel}
                    />
                  ) : part.kind === "text" ? (
                    <TextPart
                      stem={part.stem ?? ""}
                      value={value}
                      onChange={(v) => onAnswer(part.id, v)}
                      ariaLabel={controlLabel}
                    />
                  ) : (
                    <LongPart
                      prompt={part.prompt ?? ""}
                      value={value}
                      onChange={(v) => onAnswer(part.id, v)}
                      ariaLabel={controlLabel}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </article>

        {/* next question peek */}
        {safeIndex < QUESTIONS.length - 1 && (
          <button
            type="button"
            onClick={() => onIndexChange(safeIndex + 1)}
            className="mt-4 flex min-h-12 w-full items-center justify-between gap-2 rounded-2xl border-2 border-dashed border-ink/20 bg-white/75 px-4 py-3 text-left hover:border-brand-blue"
          >
            <span className="text-xs font-extrabold uppercase tracking-wider text-ink/70">
              Next · Question {QUESTIONS[safeIndex + 1].n}
            </span>
            <ChevronIcon className="h-4 w-4 text-ink/45" />
          </button>
        )}
      </main>

      <ContactFooter compact />

      {/* --------------------- bottom bar --------------------- */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-ink/10 bg-white/97 backdrop-blur safe-bottom">
        <div className="mx-auto flex max-w-3xl items-center gap-2 px-3 py-2.5 sm:px-4">
          <button
            type="button"
            onClick={() => onIndexChange(Math.max(0, safeIndex - 1))}
            disabled={safeIndex === 0}
            aria-label="Previous question"
            className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border-2 border-ink/15 bg-white text-ink disabled:opacity-35"
          >
            <ChevronIcon className="h-4 w-4 rotate-180" />
          </button>

          <button
            type="button"
            onClick={onSubmit}
            disabled={!complete}
            aria-describedby={complete ? undefined : "submit-help"}
            className={`h-12 min-w-0 flex-1 rounded-2xl px-3 font-display text-sm font-black uppercase tracking-wide transition-colors sm:text-base ${
              complete
                ? "bg-brand-orange text-white hover:bg-[#e5680d] active:translate-y-0.5"
                : "cursor-not-allowed bg-ink/15 text-ink/60"
            }`}
          >
            Submit Exam
          </button>

          <button
            type="button"
            onClick={() => onIndexChange(Math.min(QUESTIONS.length - 1, safeIndex + 1))}
            disabled={safeIndex === QUESTIONS.length - 1}
            aria-label="Next question"
            className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border-2 border-ink/15 bg-white text-ink disabled:opacity-35"
          >
            <ChevronIcon className="h-4 w-4" />
          </button>
        </div>
        {!complete && (
          <p
            id="submit-help"
            className="mx-auto max-w-3xl px-3 pb-1.5 text-center text-[11px] font-bold tabular text-ink/60 sm:px-4"
          >
            {total - answered} question{total - answered === 1 ? "" : "s"} still unanswered —
            Submit Exam unlocks when every part is answered.
          </p>
        )}
      </div>

      {/* --------------------- navigator --------------------- */}
      {navOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-[#08204a]/55 sm:items-center"
          onClick={() => setNavOpen(false)}
          role="presentation"
        >
          <div
            className="max-h-[86dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl border-2 border-ink/10 bg-white p-4 sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Question navigator"
          >
            <div className="flex items-center gap-3">
              <h2 className="flex-1 font-display text-sm font-black uppercase tracking-wide text-ink">
                Question navigator
              </h2>
              <span className="rounded-lg bg-paper px-2 py-1 text-[11px] font-extrabold tabular text-ink/65">
                {answered}/{total} answered
              </span>
              <button
                type="button"
                onClick={() => setNavOpen(false)}
                aria-label="Close navigator"
                className="grid h-10 w-10 place-items-center rounded-xl border-2 border-ink/15 bg-white text-ink"
              >
                ×
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {LESSONS.map((l) => {
                const rows = QUESTIONS.filter((qq) => qq.lesson === l.id);
                return (
                  <div key={l.id}>
                    <p
                      className="mb-2 text-[11px] font-extrabold uppercase tracking-wider"
                      style={{ color: l.color }}
                    >
                      Lesson {l.id} — {l.title}
                    </p>
                    <div className="grid grid-cols-5 gap-2 sm:grid-cols-10">
                      {rows.map((qq) => {
                        const done = qq.parts.every((p) =>
                          isPartAnswered(p, answers[p.id]),
                        );
                        const part = !done && isQuestionPartial(qq, answers);
                        const current = qq.n === q.n;
                        const statusWord = done
                          ? "answered"
                          : part
                            ? "in progress"
                            : "unanswered";
                        return (
                          <button
                            key={qq.n}
                            type="button"
                            onClick={() => {
                              onIndexChange(QUESTIONS.findIndex((x) => x.n === qq.n));
                              setNavOpen(false);
                            }}
                            aria-label={`Question ${qq.n}, ${statusWord}`}
                            aria-current={current ? "step" : undefined}
                            className={`grid min-h-11 place-items-center rounded-xl border-2 text-sm font-extrabold tabular transition-colors ${
                              done
                                ? "border-transparent bg-brand-lime text-[#183b00]"
                                : part
                                  ? "border-brand-yellow bg-brand-yellow/35 text-ink"
                                  : "border-dashed border-ink/25 bg-white text-ink/65"
                            } ${current ? "ring-4 ring-brand-blue" : ""}`}
                          >
                            {qq.n}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3 text-[11px] font-bold text-ink/65">
              <span className="inline-flex items-center gap-1.5">
                <CheckIcon className="h-3.5 w-3.5 text-[#183b00]" /> answered
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-3.5 w-3.5 rounded border-2 border-brand-yellow bg-brand-yellow/35" />{" "}
                in progress
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-3.5 w-3.5 rounded border-2 border-dashed border-ink/30" />{" "}
                unanswered
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Answer controls                                                     */
/* ------------------------------------------------------------------ */

interface ChoiceProps {
  stem: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
  ariaLabel: string;
}

function ChoicePart({ stem, options, value, onChange, ariaLabel }: ChoiceProps) {
  const isTrueFalse =
    options.length === 2 && options[0] === "True" && options[1] === "False";
  const selected = value.trim() === "" ? -1 : Number(value);

  if (isTrueFalse) {
    return (
      <div role="radiogroup" aria-label={stem}>
        <p className="mb-2 rounded-2xl bg-paper px-3 py-2.5 text-[15px] font-semibold leading-snug text-ink">
          {stem}
        </p>
        <div className="grid grid-cols-2 gap-2.5">
          {options.map((opt, i) => {
            const on = selected === i;
            return (
              <button
                key={opt}
                type="button"
                role="radio"
                aria-checked={on}
                aria-label={`${ariaLabel}: ${opt}`}
                onClick={() => onChange(String(i))}
                className={`min-h-14 rounded-2xl border-[3px] font-display text-base font-black uppercase tracking-wide transition-colors ${
                  on
                    ? i === 0
                      ? "border-[#0b2a5b] bg-brand-lime text-[#183b00]"
                      : "border-[#0b2a5b] bg-brand-orange text-white"
                    : "border-ink/15 bg-white text-ink/75 hover:bg-paper"
                }`}
              >
                {opt}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div role="radiogroup" aria-label={stem}>
      <p className="mb-2 rounded-2xl bg-paper px-3 py-2.5 text-[15px] font-semibold leading-snug text-ink">
        {stem}
      </p>
      <div className="space-y-2">
        {options.map((opt, i) => {
          const on = selected === i;
          return (
            <button
              key={opt + i}
              type="button"
              role="radio"
              aria-checked={on}
              aria-label={`${ariaLabel}: ${opt}`}
              onClick={() => onChange(String(i))}
              className={`flex min-h-12 w-full items-center gap-3 rounded-2xl border-2 px-3 py-3 text-left transition-colors ${
                on
                  ? "border-brand-blue bg-[#E4EDFF]"
                  : "border-ink/12 bg-white hover:bg-paper"
              }`}
            >
              <span
                className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg text-xs font-extrabold ${
                  on ? "bg-brand-blue text-white" : "bg-paper text-ink/65"
                }`}
              >
                {LETTERS[i]}
              </span>
              <span
                className={`min-w-0 flex-1 break-words text-[15px] leading-snug ${
                  on ? "font-extrabold text-ink" : "font-semibold text-ink/80"
                }`}
              >
                {opt}
              </span>
              {on && <CheckIcon className="h-4 w-4 shrink-0 text-brand-blue" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface TextProps {
  stem: string;
  value: string;
  onChange: (v: string) => void;
  ariaLabel: string;
}

interface LongProps {
  prompt: string;
  value: string;
  onChange: (v: string) => void;
  ariaLabel: string;
}

function TextPart({ stem, value, onChange, ariaLabel }: TextProps) {
  const chunks = splitTextStem(stem);
  return (
    <div className="rounded-2xl border-2 border-dashed border-ink/20 bg-paper/70 p-3">
      <p className="text-[15px] font-semibold leading-loose text-ink">
        {chunks.map((chunk, i) => (
          <span key={i}>
            {chunk}
            {i < chunks.length - 1 && (
              <input
                type="text"
                inputMode="text"
                dir="ltr"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                aria-label={`${ariaLabel} — fill in the blank`}
                placeholder="…"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                className="mx-1 my-0.5 inline-block min-h-11 w-36 max-w-full rounded-xl border-2 border-brand-blue bg-white px-2.5 py-1.5 text-base font-bold text-ink placeholder:text-ink/35 focus:border-brand-orange sm:w-44"
              />
            )}
          </span>
        ))}
      </p>
    </div>
  );
}

function LongPart({ prompt, value, onChange, ariaLabel }: LongProps) {
  return (
    <div>
      <p className="mb-2 rounded-2xl bg-paper px-3 py-2.5 text-[15px] font-semibold leading-snug text-ink">
        {prompt}
      </p>
      <textarea
        dir="ltr"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        aria-label={ariaLabel}
        placeholder="Write your answer here…"
        className="w-full resize-y rounded-2xl border-2 border-ink/15 bg-white px-3.5 py-3 text-base font-semibold leading-relaxed text-ink placeholder:font-normal placeholder:text-ink/45 focus:border-brand-blue"
      />
    </div>
  );
}
