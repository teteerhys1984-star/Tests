import { useEffect, useState } from "react";
import heroImg from "../assets/hero.jpg";
import journeyImg from "../assets/journey.jpg";
import { LESSONS, PASSAGES, QUESTIONS } from "../data/exam";
import { answeredCount, formatClock, isPartAnswered } from "../lib/grading";
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
  const [openPassage, setOpenPassage] = useState<number | null>(null);

  const q = QUESTIONS[Math.min(index, QUESTIONS.length - 1)];
  const lessonMeta = LESSONS.find((l) => l.id === q.lesson)!;
  const passage = PASSAGES.find((p) => p.lesson === q.lesson);
  const isReading = q.topic.includes("Reading comprehension");

  const answered = answeredCount(answers);
  const total = QUESTIONS.length;
  const complete = answered === total;
  const pct = Math.round((answered / total) * 100);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [index]);

  useEffect(() => {
    if (isReading) setOpenPassage(q.lesson);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q.n]);

  function jumpToLesson(lessonId: number) {
    const rows = QUESTIONS.map((qq, i) => ({ qq, i })).filter(
      (r) => r.qq.lesson === lessonId,
    );
    const firstUnanswered = rows.find(
      (r) => !r.qq.parts.every((p) => isPartAnswered(p, answers[p.id])),
    );
    onIndexChange((firstUnanswered ?? rows[0]).i);
  }

  return (
    <div className="min-h-dvh dot-paper pb-36">
      {/* ------------------------- header ------------------------- */}
      <header className="sticky top-0 z-40 border-b-2 border-ink/10 bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-3xl px-3 pt-2 sm:px-4">
          <div className="flex items-center gap-2">
            <Logo className="h-8 w-8 shrink-0 rounded-lg" />
            <div className="hidden min-w-0 flex-1 sm:block">
              <p className="truncate text-xs font-extrabold uppercase tracking-wider text-ink/65">
                Model B · {name}
              </p>
            </div>
            <span className="ml-auto rounded-xl bg-ink px-2.5 py-1.5 font-display text-sm tabular tracking-wide text-white sm:text-base">
              {formatClock(elapsedSeconds)}
            </span>
            <button
              type="button"
              onClick={onToggleMute}
              aria-pressed={muted}
              aria-label={muted ? "Sound is off" : "Sound is on"}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border-2 border-ink/15 bg-white text-ink/70"
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
              className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border-2 border-ink/15 bg-white text-ink/70"
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
            <span className="shrink-0 text-[11px] font-extrabold tabular text-ink/60">
              Q{q.n} · {answered}/{total}
            </span>
          </div>

          <div className="mt-2 flex gap-1.5 pb-1">
            {LESSONS.map((l) => {
              const rows = QUESTIONS.filter((qq) => qq.lesson === l.id);
              const done = rows.filter((qq) =>
                qq.parts.every((p) => isPartAnswered(p, answers[p.id])),
              ).length;
              const active = q.lesson === l.id;
              return (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => jumpToLesson(l.id)}
                  aria-current={active ? "true" : undefined}
                  className={`min-h-9 flex-1 truncate rounded-t-xl border-2 border-b-0 px-2 py-1.5 text-[11px] font-extrabold uppercase tracking-wide transition-colors sm:text-xs ${
                    active
                      ? "border-ink/10 bg-white text-ink"
                      : "border-ink/10 bg-paper text-ink/60"
                  }`}
                  style={active ? { borderTopColor: l.color, borderTopWidth: 4 } : undefined}
                  title={`Lesson ${l.id} — ${l.title}`}
                >
                  <span className="sm:hidden">L{l.id}</span>
                  <span className="hidden sm:inline">Lesson {l.id}</span>
                  <span className="tabular"> {done}/{rows.length}</span>
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
              onClick={() => setOpenPassage(openPassage === passage.lesson ? null : passage.lesson)}
              aria-expanded={openPassage === passage.lesson}
              className="flex w-full items-center gap-3 p-3 text-left"
            >
              <span
                className="grid h-10 w-10 shrink-0 place-items-center rounded-xl font-display text-base text-white"
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
              <span className="shrink-0 rounded-lg bg-paper px-2 py-1 text-[10px] font-extrabold uppercase tracking-wide text-ink/65">
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
                  alt=""
                  className="mb-3 h-28 w-full rounded-2xl object-cover sm:h-40"
                />
                <h3 className="font-display text-base uppercase leading-tight text-ink sm:text-lg">
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
              className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border-[3px] border-[#0b2a5b] font-display text-lg text-white sticker-strong"
              style={{ backgroundColor: lessonMeta.color }}
            >
              {q.n}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-ink/60">
                Lesson {q.lesson} · {lessonMeta.title}
              </p>
              <h2 className="mt-0.5 text-base font-extrabold leading-snug text-ink sm:text-lg">
                {q.instruction}
              </h2>
              <p className="mt-1 text-[11px] font-bold uppercase tracking-wider text-ink/60">
                {q.topic} · {q.source} · {q.parts.reduce((s, p) => s + p.marks, 0)} marks
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-4">
            {q.parts.map((part, i) => {
              const value = answers[part.id] ?? "";
              const label =
                q.parts.length > 1 ? `Part ${String.fromCharCode(97 + i)}` : "";
              return (
                <div key={part.id}>
                  {q.parts.length > 1 && (
                    <p className="mb-1.5 text-[11px] font-extrabold uppercase tracking-[0.16em] text-brand-blue">
                      {label} · {part.marks} {part.marks === 1 ? "mark" : "marks"}
                    </p>
                  )}

                  {part.kind === "choice" ? (
                    <ChoicePart
                      stem={part.stem}
                      options={part.options}
                      value={value}
                      onChange={(v) => onAnswer(part.id, v)}
                      ariaLabel={`${label || "Question"} ${q.n}`}
                    />
                  ) : part.kind === "text" ? (
                    <TextPart
                      stem={part.stem ?? ""}
                      value={value}
                      onChange={(v) => onAnswer(part.id, v)}
                      ariaLabel={`${label || "Question"} ${q.n}`}
                    />
                  ) : (
                    <LongPart
                      prompt={part.prompt ?? ""}
                      value={value}
                      onChange={(v) => onAnswer(part.id, v)}
                      ariaLabel={`${label || "Question"} ${q.n}`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </article>

        {/* next question peek */}
        {index < QUESTIONS.length - 1 && (
          <button
            type="button"
            onClick={() => onIndexChange(index + 1)}
            className="mt-4 flex w-full items-center justify-between gap-2 rounded-2xl border-2 border-dashed border-ink/20 bg-white/70 px-4 py-3 text-left"
          >
            <span className="text-xs font-extrabold uppercase tracking-wider text-ink/65">
              Next · Question {QUESTIONS[index + 1].n}
            </span>
            <ChevronIcon className="h-4 w-4 text-ink/40" />
          </button>
        )}
      </main>

      <ContactFooter compact />

      {/* --------------------- bottom bar --------------------- */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-ink/10 bg-white/97 backdrop-blur safe-bottom">
        <div className="mx-auto flex max-w-3xl items-center gap-2 px-3 py-2.5 sm:px-4">
          <button
            type="button"
            onClick={() => onIndexChange(Math.max(0, index - 1))}
            disabled={index === 0}
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
            className={`h-12 min-w-0 flex-1 rounded-2xl px-3 font-display text-sm uppercase tracking-wide transition-colors sm:text-base ${
              complete
                ? "bg-brand-orange text-white active:translate-y-0.5"
                : "cursor-not-allowed bg-ink/15 text-ink/60"
            }`}
          >
            Submit Exam
          </button>

          <button
            type="button"
            onClick={() => onIndexChange(Math.min(QUESTIONS.length - 1, index + 1))}
            disabled={index === QUESTIONS.length - 1}
            aria-label="Next question"
            className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border-2 border-ink/15 bg-white text-ink disabled:opacity-35"
          >
            <ChevronIcon className="h-4 w-4" />
          </button>
        </div>
        {!complete && (
          <p
            id="submit-help"
            className="mx-auto max-w-3xl px-3 pb-1.5 text-center text-[11px] font-bold text-ink/60 sm:px-4"
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
            aria-label="Question navigator"
          >
            <div className="flex items-center gap-3">
              <h2 className="flex-1 font-display text-sm uppercase tracking-wide text-ink">
                Question navigator
              </h2>
              <span className="rounded-lg bg-paper px-2 py-1 text-[11px] font-extrabold tabular text-ink/60">
                {answered}/{total} answered
              </span>
              <button
                type="button"
                onClick={() => setNavOpen(false)}
                aria-label="Close navigator"
                className="grid h-9 w-9 place-items-center rounded-xl border-2 border-ink/15 bg-white text-ink"
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
                    <div className="grid grid-cols-6 gap-2 sm:grid-cols-10">
                      {rows.map((qq) => {
                        const done = qq.parts.every((p) =>
                          isPartAnswered(p, answers[p.id]),
                        );
                        const current = qq.n === q.n;
                        return (
                          <button
                            key={qq.n}
                            type="button"
                            onClick={() => {
                              onIndexChange(QUESTIONS.findIndex((x) => x.n === qq.n));
                              setNavOpen(false);
                            }}
                            aria-label={`Question ${qq.n}${done ? ", answered" : ", unanswered"}`}
                            className={`grid aspect-square place-items-center rounded-xl border-2 text-sm font-extrabold tabular transition-colors ${
                              done
                                ? "border-transparent bg-brand-lime text-[#183b00]"
                                : "border-dashed border-ink/25 bg-white text-ink/60"
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

            <div className="mt-4 flex items-center gap-3 text-[11px] font-bold text-ink/65">
              <span className="inline-flex items-center gap-1.5">
                <CheckIcon className="h-3.5 w-3.5 text-[#183b00]" /> answered
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
  const selected = value === "" ? -1 : Number(value);

  if (isTrueFalse) {
    return (
      <div>
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
                className={`min-h-14 rounded-2xl border-[3px] font-display text-base uppercase tracking-wide transition-colors ${
                  on
                    ? i === 0
                      ? "border-[#0b2a5b] bg-brand-lime text-[#183b00]"
                      : "border-[#0b2a5b] bg-brand-orange text-white"
                    : "border-ink/15 bg-white text-ink/70"
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
                className={`min-w-0 flex-1 text-[15px] leading-snug ${
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
  const chunks = stem.split("[[blank]]");
  return (
    <div className="rounded-2xl border-2 border-dashed border-ink/20 bg-paper/70 p-3">
      <p className="text-[15px] font-semibold leading-relaxed text-ink">
        {chunks.map((chunk, i) => (
          <span key={i}>
            {chunk}
            {i < chunks.length - 1 && (
              <input
                type="text"
                inputMode="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                aria-label={`${ariaLabel} — fill in the blank`}
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                className="mx-1 w-28 max-w-full rounded-xl border-2 border-brand-blue bg-white px-2 py-2 text-base font-bold text-ink focus:border-brand-orange sm:w-40"
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
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        aria-label={ariaLabel}
        placeholder="Write your answer here…"
        className="w-full resize-y rounded-2xl border-2 border-ink/15 bg-white px-3 py-3 text-[15px] font-semibold leading-relaxed text-ink placeholder:font-normal placeholder:text-ink/45 focus:border-brand-blue"
      />
    </div>
  );
}
