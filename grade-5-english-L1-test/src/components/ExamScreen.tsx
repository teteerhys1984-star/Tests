import { useEffect, useMemo, useRef, useState } from "react";
import { ALL_ITEMS, EXAM_TITLE, QUESTIONS, TOTAL_ITEM_COUNT, type ExamItem, type ExamPart, type ExamQuestion } from "../data/exam";
import { isItemAnswered, type Answer, type Answers } from "../lib/grading";
import { formatHMS } from "../lib/storage";
import { CheckIcon, ChevronLeft, ChevronRight, ClockIcon, ContactCard, ContactFooter, SpeakerOff, SpeakerOn } from "./ui";

interface Props {
  studentName: string;
  startedAt: number;
  currentQuestion: number;
  answers: Answers;
  muted: boolean;
  onToggleMute: () => void;
  onAnswer: (itemId: string, value: Answer) => void;
  onGoto: (n: number) => void;
  onSubmit: () => void;
}

/** Ticks while the exam is running; elapsed time is always computed from the stored start timestamp. */
function useNow(active: boolean): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 500);
    const onVis = () => setNow(Date.now());
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [active]);
  return now;
}

function questionAnswered(q: ExamQuestion, answers: Answers): { done: number; total: number } {
  const items = q.parts.flatMap((p) => p.items);
  return { done: items.filter((i) => isItemAnswered(answers[i.id])).length, total: items.length };
}

export default function ExamScreen(props: Props) {
  const { studentName, startedAt, currentQuestion, answers, muted, onToggleMute, onAnswer, onGoto, onSubmit } = props;
  const now = useNow(true);
  const elapsed = now - startedAt;
  const headerRef = useRef<HTMLElement>(null);

  const answeredTotal = useMemo(() => ALL_ITEMS.filter((x) => isItemAnswered(answers[x.item.id])).length, [answers]);
  const complete = answeredTotal === TOTAL_ITEM_COUNT;
  const remaining = TOTAL_ITEM_COUNT - answeredTotal;
  const percentDone = Math.round((answeredTotal / TOTAL_ITEM_COUNT) * 100);
  const question = QUESTIONS.find((q) => q.number === currentQuestion) ?? QUESTIONS[0];
  const qIndex = QUESTIONS.indexOf(question);
  const current = questionAnswered(question, answers);
  const hasPassage = Boolean(question.passage);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [currentQuestion]);

  // Expose the sticky header height so the reading passage can stick just below it on large screens.
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const apply = () => document.documentElement.style.setProperty("--header-h", `${el.offsetHeight}px`);
    apply();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div className="flex min-h-dvh flex-col">
      {/* ───── Sticky header: name, timer, sound, progress, submit, section nav ───── */}
      <header
        ref={headerRef}
        className="sticky top-0 z-30 border-b border-pink-100 bg-white/95 shadow-sm shadow-pink-100/50 backdrop-blur [@media(max-height:500px)]:static"
      >
        <div className="mx-auto max-w-6xl space-y-2 px-3 py-2 sm:space-y-2.5 sm:px-6 sm:py-2.5">
          <div className="flex items-center gap-2">
            <div className="min-w-0 flex-1">
              <p className="truncate text-[11px] font-bold uppercase tracking-wider text-fuchsia-500">{EXAM_TITLE}</p>
              <p className="truncate text-sm font-bold text-[#4a3566]" title={studentName}>{studentName}</p>
            </div>
            <div
              className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full bg-gradient-to-r from-sky-100 to-teal-100 px-3 text-sm font-extrabold tabular-nums text-[#0e6b73]"
              role="timer"
              aria-label={`Time elapsed ${formatHMS(elapsed)}`}
            >
              <ClockIcon size={17} />
              <span>{formatHMS(elapsed)}</span>
            </div>
            <button
              type="button"
              onClick={onToggleMute}
              aria-pressed={muted}
              aria-label={muted ? "Turn sound on" : "Turn sound off"}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-violet-50 text-violet-700 ring-1 ring-violet-100 active:scale-95"
            >
              {muted ? <SpeakerOff size={18} /> : <SpeakerOn size={18} />}
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex justify-between text-xs font-semibold text-[#6b5680]">
                <span>{answeredTotal} of {TOTAL_ITEM_COUNT} answered</span>
                <span>{percentDone}%</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-pink-100" role="progressbar" aria-valuemin={0} aria-valuemax={TOTAL_ITEM_COUNT} aria-valuenow={answeredTotal} aria-label="Answers completed">
                <div className="h-full rounded-full bg-gradient-to-r from-pink-400 via-fuchsia-400 to-violet-500 transition-all duration-500" style={{ width: `${percentDone}%` }} />
              </div>
            </div>
            <SubmitButton disabled={!complete} onSubmit={onSubmit} compact />
          </div>

          <nav aria-label="Exam sections" className="flex gap-1 sm:grid sm:grid-cols-8 sm:gap-2">
            {QUESTIONS.map((q) => {
              const { done, total } = questionAnswered(q, answers);
              const finished = done === total;
              const active = q.number === currentQuestion;
              return (
                <button
                  key={q.number}
                  type="button"
                  onClick={() => onGoto(q.number)}
                  aria-current={active ? "step" : undefined}
                  aria-label={`Section ${q.number}, ${done} of ${total} answered${finished ? ", complete" : ""}`}
                  className={`flex min-h-11 min-w-0 flex-1 flex-col items-center justify-center rounded-xl px-0.5 py-1 text-sm font-bold transition active:scale-95 ${
                    active
                      ? "bg-gradient-to-br from-pink-500 to-violet-500 text-white shadow-md shadow-fuchsia-200"
                      : finished
                        ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                        : "bg-pink-50 text-[#7c3aed] ring-1 ring-pink-100"
                  }`}
                >
                  <span className="flex items-center gap-1 leading-none">
                    <span className="sm:hidden">{q.number}</span>
                    <span className="hidden sm:inline">Q{q.number}</span>
                    {finished && <CheckIcon size={13} className="hidden sm:block" />}
                  </span>
                  <span className={`mt-1 hidden text-[10px] font-semibold leading-none sm:block ${active ? "text-pink-50" : "text-[#8a7aa0]"}`}>
                    {done}/{total}
                  </span>
                  <span
                    aria-hidden="true"
                    className={`mt-1 h-1.5 w-1.5 rounded-full sm:hidden ${
                      active ? "bg-white" : finished ? "bg-emerald-500" : done > 0 ? "bg-amber-400" : "bg-pink-200"
                    }`}
                  />
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* ───── Question content ───── */}
      <main className="mx-auto w-full max-w-6xl flex-1 px-3 pb-4 pt-3 sm:px-6 sm:pt-4">
        <ContactCard variant="compact" />

        <section
          aria-labelledby="question-title"
          className={`mt-4 ${hasPassage ? "lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-5" : ""}`}
        >
          <div className={hasPassage ? "lg:self-stretch" : ""}>
            <div
              className={`overflow-hidden rounded-3xl bg-white shadow-lg shadow-violet-100/70 ring-1 ring-violet-50 ${
                hasPassage ? "lg:sticky lg:top-[calc(var(--header-h,10rem)+1rem)] lg:max-h-[calc(100dvh-var(--header-h,10rem)-2rem)] lg:overflow-y-auto" : ""
              }`}
            >
              <div className="flex flex-wrap items-center gap-2 bg-gradient-to-r from-pink-50 via-fuchsia-50 to-sky-50 px-4 py-3 sm:px-6">
                <span className="rounded-full bg-white px-3 py-1 text-xs font-extrabold text-fuchsia-600 shadow-sm">
                  Section {question.number} of {QUESTIONS.length}
                </span>
                <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-[#6b5680]">{question.focus}</span>
                <span
                  className={`ml-auto rounded-full px-3 py-1 text-xs font-bold ${
                    current.done === current.total ? "bg-emerald-100 text-emerald-700" : "bg-white/80 text-[#7c3aed]"
                  }`}
                >
                  {current.done}/{current.total} answered
                </span>
              </div>
              <div className="space-y-3 px-4 pb-5 pt-4 sm:px-6 sm:pb-6">
                <h1 id="question-title" className="text-xl font-extrabold leading-snug text-[#3b2a4a] sm:text-2xl">
                  {question.title}
                </h1>
                <p className="text-base leading-relaxed text-[#5b4a6e]">{question.instruction}</p>
                {question.passage && <PassageCard passage={question.passage} />}
              </div>
            </div>
          </div>

          <div className={`mt-4 space-y-4 ${hasPassage ? "lg:mt-0" : ""}`}>
            {question.parts.map((part) => (
              <PartBlock key={part.id} part={part} answers={answers} onAnswer={onAnswer} twoColumns={!hasPassage} />
            ))}
          </div>
        </section>

        {/* ───── Previous / next ───── */}
        <div className="mt-6 flex items-center gap-3">
          <button
            type="button"
            onClick={() => onGoto(QUESTIONS[qIndex - 1]?.number ?? currentQuestion)}
            disabled={qIndex === 0}
            className="flex min-h-12 flex-1 items-center justify-center gap-1.5 rounded-2xl bg-white px-4 text-base font-bold text-[#7c3aed] shadow-sm ring-1 ring-violet-100 transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 sm:flex-none sm:px-8"
          >
            <ChevronLeft size={18} /> Previous
          </button>
          <p className="flex-1 whitespace-nowrap text-center text-xs font-semibold text-[#6b5680] sm:text-sm">
            <span className="sm:hidden">{qIndex + 1} / {QUESTIONS.length}</span>
            <span className="hidden sm:inline">Section {qIndex + 1} of {QUESTIONS.length}</span>
          </p>
          <button
            type="button"
            onClick={() => onGoto(QUESTIONS[qIndex + 1]?.number ?? currentQuestion)}
            disabled={qIndex === QUESTIONS.length - 1}
            className="flex min-h-12 flex-1 items-center justify-center gap-1.5 rounded-2xl bg-gradient-to-r from-pink-500 to-violet-500 px-4 text-base font-bold text-white shadow-md shadow-fuchsia-200 transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 sm:flex-none sm:px-8"
          >
            Next <ChevronRight size={18} />
          </button>
        </div>

        {/* ───── Completion status and submit ───── */}
        <div
          className={`mt-5 rounded-3xl p-4 ring-1 sm:p-5 ${complete ? "bg-emerald-50 ring-emerald-200" : "bg-amber-50/80 ring-amber-200"}`}
          role="status"
        >
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className={`text-base font-extrabold ${complete ? "text-emerald-700" : "text-amber-800"}`}>
                {complete ? "All answers are complete." : `${remaining} answer${remaining === 1 ? "" : "s"} still to complete.`}
              </p>
              <p className="mt-1 text-sm text-[#5b4a6e]">
                {complete
                  ? "You can press Submit Exam when you are ready. Your answers will be marked straight away."
                  : "Answer every question and part. Submit Exam unlocks when every answer is complete."}
              </p>
            </div>
            <SubmitButton disabled={!complete} onSubmit={onSubmit} />
          </div>
        </div>
      </main>

      <ContactFooter />
    </div>
  );
}

function PartBlock({
  part,
  answers,
  onAnswer,
  twoColumns,
}: {
  part: ExamPart;
  answers: Answers;
  onAnswer: (itemId: string, value: Answer) => void;
  twoColumns: boolean;
}) {
  const multi = part.items.length > 1;
  const allVocab = part.items.every((i) => i.kind === "vocab");
  const gridClass = multi && twoColumns ? (allVocab ? "grid gap-3 md:grid-cols-2 xl:grid-cols-3" : "grid gap-3 md:grid-cols-2") : "grid gap-3";
  return (
    <div className="space-y-3 rounded-3xl bg-white/70 p-3 ring-1 ring-white sm:p-4">
      <div className="px-1">
        <h2 className="text-lg font-bold text-[#4a3566]">{part.title}</h2>
        <p className="text-sm text-[#6b5680]">{part.instruction}</p>
      </div>
      <div className={gridClass}>
        {part.items.map((item) => {
          const label = ALL_ITEMS.find((x) => x.item.id === item.id)?.label ?? item.id;
          return (
            <div key={item.id} className={item.kind === "arrange" ? "md:col-span-full" : ""}>
              <ItemCard item={item} label={label} value={answers[item.id]} onChange={(v) => onAnswer(item.id, v)} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SubmitButton({ disabled, onSubmit, compact = false }: { disabled: boolean; onSubmit: () => void; compact?: boolean }) {
  return (
    <button
      type="button"
      onClick={onSubmit}
      disabled={disabled}
      aria-disabled={disabled}
      className={`inline-flex shrink-0 items-center justify-center rounded-2xl font-extrabold transition active:scale-[0.98] ${
        compact ? "h-11 px-4 text-sm" : "min-h-13 w-full px-8 py-3 text-base md:w-auto"
      } ${
        disabled
          ? "cursor-not-allowed bg-slate-200 text-slate-500"
          : "bg-gradient-to-r from-emerald-400 via-teal-400 to-sky-400 text-white shadow-lg shadow-teal-200"
      }`}
    >
      Submit Exam
    </button>
  );
}

function PassageCard({ passage }: { passage: { title: string; paragraphs: string[] } }) {
  return (
    <article className="rounded-2xl bg-gradient-to-br from-amber-50 via-white to-sky-50 p-4 ring-1 ring-amber-100 sm:p-5">
      <h3 className="mb-2 text-base font-extrabold text-[#4a3566]">📖 {passage.title}</h3>
      <div className="space-y-3 text-[15px] leading-7 text-[#3b2a4a] sm:text-base">
        {passage.paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
    </article>
  );
}

function ItemCard({ item, label, value, onChange }: { item: ExamItem; label: string; value: Answer | undefined; onChange: (v: Answer) => void }) {
  const answered = isItemAnswered(value);
  return (
    <div
      className={`h-full rounded-2xl border-2 bg-white p-4 shadow-sm transition sm:p-5 ${
        answered ? "border-emerald-200" : "border-pink-100"
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`grid h-9 min-w-9 shrink-0 place-items-center rounded-full px-2 text-xs font-extrabold text-white ${
            answered ? "bg-gradient-to-br from-emerald-400 to-teal-400" : "bg-gradient-to-br from-pink-400 to-violet-500"
          }`}
        >
          {answered ? <CheckIcon size={16} /> : label}
        </span>
        <div className="min-w-0 flex-1 space-y-3">
          {item.kind === "vocab" && <VocabInput item={item} value={(value as string) ?? ""} onChange={onChange} />}
          {item.kind === "choice" && <ChoiceInput item={item} value={(value as string) ?? ""} onChange={onChange} />}
          {item.kind === "truefalse" && <TrueFalseInput item={item} value={(value as string) ?? ""} onChange={onChange} />}
          {item.kind === "select" && <SelectInput item={item} value={(value as string) ?? ""} onChange={onChange} />}
          {item.kind === "arrange" && <ArrangeInput item={item} value={(value as string[]) ?? []} onChange={onChange} />}
        </div>
      </div>
    </div>
  );
}

function VocabInput({ item, value, onChange }: { item: ExamItem; value: string; onChange: (v: Answer) => void }) {
  const id = `input-${item.id}`;
  return (
    <div className="space-y-3">
      <div className="rounded-2xl bg-gradient-to-br from-sky-50 via-white to-pink-50 px-4 py-3 text-center ring-1 ring-sky-100">
        <p className="text-[11px] font-bold uppercase tracking-wider text-[#6b5680]">Arabic word</p>
        <p lang="ar" dir="rtl" className="mt-1 text-2xl font-extrabold text-[#3b2a4a] sm:text-3xl">
          {item.arabic}
        </p>
      </div>
      <div>
        <label htmlFor={id} className="block text-base font-bold text-[#4a3566]">
          Type the English word
        </label>
        <input
          id={id}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete="off"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          placeholder="Type the English word here"
          className="mt-2 h-13 min-h-12 w-full rounded-2xl border-2 border-pink-200 bg-white px-4 text-lg font-semibold text-[#3b2a4a] placeholder:font-normal placeholder:text-[#b3a2c6] focus:border-fuchsia-400 focus:outline-none focus:ring-4 focus:ring-fuchsia-100"
        />
      </div>
    </div>
  );
}

function ChoiceInput({ item, value, onChange }: { item: ExamItem; value: string; onChange: (v: Answer) => void }) {
  return (
    <div className="space-y-3">
      <p className="text-base font-semibold leading-relaxed text-[#3b2a4a]">{item.prompt}</p>
      <div role="radiogroup" aria-label={item.prompt} className="grid gap-2">
        {item.options?.map((opt, i) => {
          const selected = value === opt;
          return (
            <button
              key={opt}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(opt)}
              className={`flex min-h-12 items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left text-[15px] font-medium leading-snug transition active:scale-[0.99] sm:text-base ${
                selected ? "border-fuchsia-400 bg-fuchsia-50 text-[#6d28d9]" : "border-pink-100 bg-white text-[#3b2a4a] hover:border-pink-200"
              }`}
            >
              <span
                className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-extrabold ${
                  selected ? "bg-fuchsia-500 text-white" : "bg-pink-50 text-[#a21caf]"
                }`}
              >
                {selected ? <CheckIcon size={15} /> : String.fromCharCode(65 + i)}
              </span>
              <span className="min-w-0 flex-1">{opt}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function TrueFalseInput({ item, value, onChange }: { item: ExamItem; value: string; onChange: (v: Answer) => void }) {
  return (
    <div className="space-y-3">
      <p className="text-base font-semibold leading-relaxed text-[#3b2a4a]">{item.prompt}</p>
      <div role="radiogroup" aria-label={item.prompt} className="grid grid-cols-2 gap-2">
        {item.options?.map((opt) => {
          const selected = value === opt;
          const isTrue = opt === "True";
          return (
            <button
              key={opt}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(opt)}
              className={`flex min-h-12 items-center justify-center gap-2 rounded-2xl border-2 px-3 py-3 text-base font-bold transition active:scale-[0.98] ${
                selected
                  ? isTrue
                    ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                    : "border-rose-400 bg-rose-50 text-rose-600"
                  : "border-pink-100 bg-white text-[#4a3566]"
              }`}
            >
              {selected && <CheckIcon size={16} />}
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SelectInput({ item, value, onChange }: { item: ExamItem; value: string; onChange: (v: Answer) => void }) {
  const id = `select-${item.id}`;
  const hasBlank = item.prompt.includes("___");
  const [before, after] = hasBlank ? item.prompt.split("___") : [item.prompt, ""];
  const select = (
    <select
      id={id}
      aria-label={hasBlank ? "Choose the missing word" : item.prompt}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`min-h-12 rounded-xl border-2 bg-white px-3 py-2 text-base font-semibold text-[#3b2a4a] focus:border-fuchsia-400 focus:outline-none focus:ring-4 focus:ring-fuchsia-100 ${
        hasBlank ? "w-auto max-w-full" : "w-full"
      } ${value ? "border-fuchsia-300" : "border-pink-200"}`}
    >
      <option value="">Choose an answer</option>
      {item.options?.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
  if (hasBlank) {
    return (
      <div className="flex flex-wrap items-center gap-x-2 gap-y-2 text-base leading-relaxed text-[#3b2a4a]">
        {before && <span>{before}</span>}
        {select}
        {after && <span>{after}</span>}
      </div>
    );
  }
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-base font-semibold leading-relaxed text-[#3b2a4a]">
        {item.prompt}
      </label>
      {select}
    </div>
  );
}

function ArrangeInput({ item, value, onChange }: { item: ExamItem; value: string[]; onChange: (v: Answer) => void }) {
  const slots = item.slotLabels ?? item.options?.map((_, i) => `Slot ${i + 1}`) ?? [];
  return (
    <div className="space-y-3">
      <p className="text-base font-semibold leading-relaxed text-[#3b2a4a]">{item.prompt}</p>
      <div className="grid gap-3 sm:grid-cols-3">
        {slots.map((label, i) => (
          <div key={label} className="space-y-1.5">
            <label htmlFor={`${item.id}-slot-${i}`} className="block text-sm font-bold text-[#7c3aed]">
              {label}
            </label>
            <select
              id={`${item.id}-slot-${i}`}
              value={value[i] ?? ""}
              onChange={(e) => {
                const next = [...(value.length ? value : slots.map(() => ""))];
                next[i] = e.target.value;
                onChange(next);
              }}
              className="min-h-12 w-full rounded-xl border-2 border-pink-200 bg-white px-3 py-2 text-base font-semibold text-[#3b2a4a] focus:border-fuchsia-400 focus:outline-none focus:ring-4 focus:ring-fuchsia-100"
            >
              <option value="">Choose…</option>
              {item.options?.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}
