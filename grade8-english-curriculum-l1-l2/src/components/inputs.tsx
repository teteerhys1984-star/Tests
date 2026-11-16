/**
 * Interactive answer inputs for each subpart type.
 * During the exam these never reveal correctness — selection states only.
 */
import { RotateCcw } from "lucide-react";
import type {
  McqSubpart,
  ReorderSubpart,
  SelectSubpart,
  TextSubpart,
  TfSubpart,
} from "../types";
import { cn } from "../utils/cn";

/* ------------------------------ MCQ ------------------------------ */

export function McqInput({
  sub,
  value,
  onChange,
}: {
  sub: McqSubpart;
  value: number | null;
  onChange: (idx: number) => void;
}) {
  return (
    <div className="grid gap-2 sm:gap-2.5" role="radiogroup" aria-label={sub.prompt}>
      {sub.options.map((opt, i) => {
        const active = value === i;
        return (
          <button
            key={i}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(i)}
            className={cn(
              "group flex w-full items-center gap-3 rounded-xl border px-3.5 py-2.5 text-left text-[15px] transition-all duration-200 sm:px-4 sm:py-3",
              active
                ? "border-cyan-400/70 bg-cyan-400/10 text-cyan-50 shadow-[0_0_0_1px_rgba(34,211,238,0.35),0_10px_30px_-14px_rgba(34,211,238,0.45)]"
                : "border-slate-700/60 bg-slate-900/40 text-slate-300 hover:border-slate-500/70 hover:bg-slate-800/50 hover:text-slate-100",
            )}
          >
            <span
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[13px] font-bold transition-colors",
                active
                  ? "bg-cyan-400 text-slate-950"
                  : "bg-slate-800 text-slate-400 group-hover:bg-slate-700 group-hover:text-slate-200",
              )}
            >
              {String.fromCharCode(97 + i)}
            </span>
            <span className="leading-snug">{opt}</span>
          </button>
        );
      })}
    </div>
  );
}

/* --------------------------- True / False --------------------------- */

export function TfInput({
  sub,
  value,
  onChange,
}: {
  sub: TfSubpart;
  value: boolean | null;
  onChange: (v: boolean) => void;
}) {
  void sub;
  return (
    <div className="flex gap-2" role="radiogroup" aria-label="True or False">
      {([true, false] as const).map((v) => {
        const active = value === v;
        return (
          <button
            key={String(v)}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(v)}
            className={cn(
              "min-w-[96px] rounded-xl border px-5 py-2.5 text-sm font-semibold tracking-wide transition-all duration-200",
              active
                ? v
                  ? "border-emerald-400/70 bg-emerald-400/10 text-emerald-200 shadow-[0_0_0_1px_rgba(52,211,153,0.35)]"
                  : "border-rose-400/70 bg-rose-400/10 text-rose-200 shadow-[0_0_0_1px_rgba(251,113,133,0.35)]"
                : "border-slate-700/60 bg-slate-900/40 text-slate-400 hover:border-slate-500/70 hover:text-slate-200",
            )}
          >
            {v ? "TRUE" : "FALSE"}
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------ Select ------------------------------ */

export function SelectInput({
  sub,
  value,
  onChange,
  inline = true,
}: {
  sub: SelectSubpart;
  value: string;
  onChange: (v: string) => void;
  inline?: boolean;
}) {
  const selectEl = (
    <span className="relative inline-block align-middle">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={sub.prompt}
        className={cn(
          "appearance-none rounded-lg border bg-slate-950/80 py-1.5 pl-3 pr-9 text-[14px] font-medium transition-colors",
          value
            ? "border-cyan-400/60 text-cyan-200"
            : "border-slate-600/80 text-slate-400 hover:border-slate-500",
        )}
      >
        <option value="" disabled>
          choose…
        </option>
        {sub.options.map((o) => (
          <option key={o} value={o} className="bg-slate-900 text-slate-100">
            {o}
          </option>
        ))}
      </select>
      <svg
        className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </span>
  );

  if (!inline || !sub.before) {
    return (
      <div className="flex flex-wrap items-center gap-x-2 gap-y-2">
        <span className="text-[15px] leading-relaxed text-slate-200">{sub.prompt}</span>
        {selectEl}
      </div>
    );
  }
  return (
    <p className="text-[15px] leading-[2.2] text-slate-200">
      {sub.before} {selectEl} {sub.after}
    </p>
  );
}

/* ------------------------------- Text ------------------------------- */

export function TextInput({
  sub,
  value,
  onChange,
}: {
  sub: TextSubpart;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-2.5">
      {sub.segments ? (
        <p className="text-[15px] leading-relaxed text-slate-200">
          {sub.segments.before}{" "}
          <span className="wrong-word">{sub.segments.wrong}</span>{" "}
          {sub.segments.after}
        </p>
      ) : (
        <p className="text-[15px] leading-relaxed text-slate-200">{sub.prompt}</p>
      )}
      <input
        type="text"
        dir="ltr"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={sub.placeholder ?? "Type your answer"}
        aria-label={sub.prompt}
        autoComplete="off"
        spellCheck={false}
        className={cn(
          "w-full max-w-md rounded-xl border bg-slate-950/70 px-3.5 py-2.5 text-[15px] text-slate-100 placeholder:text-slate-600 transition-colors",
          value.trim()
            ? "border-cyan-400/50"
            : "border-slate-700/70 hover:border-slate-600",
        )}
      />
    </div>
  );
}

/* ------------------------------ Reorder ------------------------------ */

export function ReorderInput({
  sub,
  value,
  onChange,
}: {
  sub: ReorderSubpart;
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const usedCounts = new Map<string, number>();
  value.forEach((w) => usedCounts.set(w, (usedCounts.get(w) ?? 0) + 1));

  const remaining: { word: string; key: number }[] = [];
  const poolCounts = new Map<string, number>();
  sub.words.forEach((w, i) => {
    const seen = poolCounts.get(w) ?? 0;
    poolCounts.set(w, seen + 1);
    if (seen >= (usedCounts.get(w) ?? 0)) remaining.push({ word: w, key: i });
  });

  const add = (word: string) => onChange([...value, word]);
  const removeAt = (idx: number) => onChange(value.filter((_, i) => i !== idx));

  return (
    <div className="space-y-3">
      <p className="text-[15px] font-medium text-slate-200">{sub.prompt}</p>

      {/* Answer strip */}
      <div
        className={cn(
          "flex min-h-[56px] flex-wrap items-center gap-2 rounded-xl border border-dashed px-3 py-2.5 transition-colors",
          value.length
            ? "border-cyan-400/50 bg-cyan-400/5"
            : "border-slate-700/80 bg-slate-950/40",
        )}
        aria-label="Your sentence"
      >
        {value.length === 0 && (
          <span className="text-sm text-slate-600">
            Tap the words below in the correct order…
          </span>
        )}
        {value.map((w, i) => (
          <button
            key={`${w}-${i}`}
            type="button"
            onClick={() => removeAt(i)}
            title="Remove word"
            className="animate-pop rounded-lg border border-cyan-400/50 bg-cyan-400/15 px-3 py-1.5 text-sm font-semibold text-cyan-100 transition hover:border-rose-400/60 hover:bg-rose-400/10 hover:text-rose-200"
          >
            {w}
          </button>
        ))}
        {value.length === sub.words.length && (
          <span className="select-none text-xl font-bold text-slate-500">.</span>
        )}
      </div>

      {/* Word pool */}
      <div className="flex flex-wrap items-center gap-2">
        {remaining.map(({ word, key }) => (
          <button
            key={key}
            type="button"
            onClick={() => add(word)}
            className="rounded-lg border border-slate-600/70 bg-slate-800/70 px-3 py-1.5 text-sm font-medium text-slate-200 transition hover:-translate-y-0.5 hover:border-cyan-400/60 hover:bg-cyan-400/10 hover:text-cyan-100"
          >
            {word}
          </button>
        ))}
        {value.length > 0 && (
          <button
            type="button"
            onClick={() => onChange([])}
            className="ml-1 inline-flex items-center gap-1.5 rounded-lg border border-slate-700/70 px-2.5 py-1.5 text-xs font-semibold text-slate-400 transition hover:border-slate-500 hover:text-slate-200"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </button>
        )}
      </div>
    </div>
  );
}
