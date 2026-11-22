import type { ReactNode } from "react";
import type { SubQuestion } from "@/data/exam";
import type { AnswerValue } from "@/lib/grading";
import { cn } from "@/utils/cn";
import { Icon, RichText } from "./ui";

type Props = {
  sub: SubQuestion;
  value: AnswerValue | undefined;
  onChange: (value: AnswerValue) => void;
};

export function SubQuestionView({ sub, value, onChange }: Props) {
  const label = `Answer for part ${sub.id}`;
  return (
    <div className="min-w-0">
      <p className="text-base font-bold leading-snug text-ink sm:text-lg">
        <RichText text={sub.prompt} />
      </p>
      <div className="mt-3">
        {sub.kind === "choice" && (
          <ChoiceInput
            label={label}
            options={sub.options}
            value={typeof value === "string" ? value : ""}
            onSelect={onChange}
          />
        )}
        {sub.kind === "select" && (
          <SelectInput
            label={label}
            options={sub.options}
            value={typeof value === "string" ? value : ""}
            onSelect={onChange}
          />
        )}
        {sub.kind === "text" && (
          <input
            className="input"
            type="text"
            value={typeof value === "string" ? value : ""}
            onChange={(event) => onChange(event.target.value)}
            placeholder={sub.placeholder ?? "Type your answer"}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            maxLength={80}
            aria-label={label}
            enterKeyHint="next"
          />
        )}
        {sub.kind === "order" && (
          <OrderInput
            label={label}
            words={sub.words}
            value={Array.isArray(value) ? value : []}
            onChange={onChange}
          />
        )}
      </div>
    </div>
  );
}

type ChoiceProps = {
  label: string;
  options: string[];
  value: string;
  onSelect: (value: string) => void;
};

function ChoiceInput({ label, options, value, onSelect }: ChoiceProps) {
  const short = options.every((option) => option.length <= 12);
  const layout =
    options.length <= 2
      ? "grid grid-cols-2 gap-2"
      : short
        ? "grid grid-cols-2 gap-2 sm:grid-cols-4"
        : "flex flex-col gap-2";
  return (
    <div className={layout} role="group" aria-label={label}>
      {options.map((option) => {
        const selected = value === option;
        return (
          <button
            key={option}
            type="button"
            className="opt"
            aria-pressed={selected}
            onClick={() => onSelect(option)}
          >
            <span className="opt-dot" aria-hidden="true" />
            <span className="min-w-0 break-words leading-snug">{option}</span>
          </button>
        );
      })}
    </div>
  );
}

function SelectInput({ label, options, value, onSelect }: ChoiceProps) {
  return (
    <div className="relative">
      <select
        className="input cursor-pointer appearance-none pr-10"
        value={value}
        onChange={(event) => onSelect(event.target.value)}
        aria-label={label}
      >
        <option value="" disabled>
          Choose an answer
        </option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <Icon
        name="down"
        className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-muted"
      />
    </div>
  );
}

type OrderProps = {
  label: string;
  words: string[];
  value: string[];
  onChange: (value: string[]) => void;
};

function OrderInput({ label, words, value, onChange }: OrderProps) {
  const placed = value;
  // Count how many times each label is already placed so duplicate chips work.
  const remaining: Record<string, number> = {};
  for (const word of placed) remaining[word] = (remaining[word] ?? 0) + 1;
  const used = words.map((word) => {
    if ((remaining[word] ?? 0) > 0) {
      remaining[word] -= 1;
      return true;
    }
    return false;
  });

  const add = (word: string) => {
    if (placed.length >= words.length) return;
    onChange([...placed, word]);
  };
  const remove = (index: number) => onChange(placed.filter((_, i) => i !== index));

  return (
    <div aria-label={label}>
      <div
        className="flex min-h-16 min-w-0 flex-wrap items-center gap-2 rounded-2xl border-2 border-dashed border-ocean/50 bg-ocean-soft/50 p-2"
        aria-live="polite"
      >
        {placed.length === 0 && (
          <span className="px-2 py-1 text-sm font-semibold text-muted">
            Tap the words below in order.
          </span>
        )}
        {placed.map((word, index) => (
          <button
            key={`${word}-${index}`}
            type="button"
            className="chip chip-placed gap-1.5"
            onClick={() => remove(index)}
            aria-label={`Remove ${word}`}
          >
            <span className="num text-xs opacity-80">{index + 1}</span>
            {word}
          </button>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {words.map((word, index) => (
          <button
            key={index}
            type="button"
            className="chip"
            disabled={used[index]}
            onClick={() => add(word)}
          >
            {word}
          </button>
        ))}
      </div>
      {placed.length > 0 && (
        <button
          type="button"
          onClick={() => onChange([])}
          className="mt-2 inline-flex min-h-9 cursor-pointer items-center gap-1 rounded-lg px-2 text-sm font-extrabold text-ocean-dark hover:bg-ocean-soft"
        >
          <Icon name="refresh" className="h-4 w-4" />
          Clear
        </button>
      )}
    </div>
  );
}

/** Small completion badge (never shows correctness). */
export function DoneBadge({ done }: { done: boolean }): ReactNode {
  return done ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-ocean-soft px-2 py-0.5 text-xs font-extrabold text-ocean-dark">
      <Icon name="check" className="h-3.5 w-3.5" />
      Done
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-coral-soft px-2 py-0.5 text-xs font-extrabold text-coral-dark">
      <span className="h-1.5 w-1.5 rounded-full bg-coral" aria-hidden="true" />
      To do
    </span>
  );
}

export function LetterBadge({ letter, className }: { letter: string; className?: string }) {
  return (
    <span
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border-2 border-line bg-paper-deep text-sm font-black text-ink",
        className,
      )}
      aria-hidden="true"
    >
      {letter}
    </span>
  );
}
