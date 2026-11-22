import { useMemo } from "react";
import type { SubQuestion } from "../data/types";
import { cn } from "../utils/cn";
import { parseOrderValue } from "../utils/grading";
import { PromptText } from "./PromptText";

interface Props {
  qNumber: number;
  sub: SubQuestion;
  value: string;
  onChange: (v: string) => void;
}

export function SubQuestionInput({ qNumber, sub, value, onChange }: Props) {
  return (
    <div className="rounded-3xl border-[3px] border-indigo-100 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-yellow-300 to-orange-400 text-xs font-black text-orange-950 shadow">
          {qNumber}
          {sub.label}
        </span>
        <p className="min-w-0 flex-1 break-words text-base font-bold leading-relaxed text-slate-800 sm:text-lg"><PromptText text={sub.prompt} /></p>
      </div>
      <div className="mt-3 pl-0 sm:pl-10">
        {sub.type === "text" && <TextInput sub={sub} value={value} onChange={onChange} />}
        {sub.type === "choice" && <ChoiceInput sub={sub} value={value} onChange={onChange} />}
        {sub.type === "match" && <MatchInput sub={sub} value={value} onChange={onChange} />}
        {sub.type === "order" && <OrderInput sub={sub} value={value} onChange={onChange} />}
      </div>
    </div>
  );
}

function TextInput({ sub, value, onChange }: { sub: Extract<SubQuestion, { type: "text" }>; value: string; onChange: (v: string) => void }) {
  return (
    <input
      type="text"
      inputMode="text"
      autoComplete="off"
      autoCapitalize="sentences"
      spellCheck={false}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={sub.placeholder ?? "Type your answer"}
      aria-label={`Answer for ${sub.id}`}
      className="min-h-13 w-full rounded-2xl border-[3px] border-sky-200 bg-sky-50 px-4 text-base font-bold text-slate-900 outline-none placeholder:font-semibold placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
    />
  );
}

function ChoiceInput({ sub, value, onChange }: { sub: Extract<SubQuestion, { type: "choice" }>; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap" role="radiogroup" aria-label={`Options for ${sub.id}`}>
      {sub.options.map((opt) => {
        const selected = value === opt;
        return (
          <button
            key={opt}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(opt)}
            className={cn(
              "btn-pop min-h-13 rounded-2xl border-[3px] px-4 py-2.5 text-left text-base font-bold transition sm:min-w-[7rem]",
              selected
                ? "border-indigo-500 bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white shadow-lg"
                : "border-sky-200 bg-sky-50 text-slate-800",
            )}
          >
            <span className="flex items-center gap-2">
              <span
                className={cn(
                  "inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2",
                  selected ? "border-white" : "border-sky-300 bg-white",
                )}
              >
                {selected && <span className="h-2.5 w-2.5 rounded-full bg-white" />}
              </span>
              <span className="break-words">{opt}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

function MatchInput({ sub, value, onChange }: { sub: Extract<SubQuestion, { type: "match" }>; value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={`Match for ${sub.id}`}
        className={cn(
          "min-h-13 w-full appearance-none rounded-2xl border-[3px] bg-sky-50 px-4 pr-10 text-base font-bold outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100",
          value ? "border-indigo-400 text-slate-900" : "border-sky-200 text-slate-500",
        )}
      >
        <option value="">Select a word…</option>
        {sub.options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      <svg viewBox="0 0 24 24" className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="m6 9 6 6 6-6" />
      </svg>
    </div>
  );
}

function OrderInput({ sub, value, onChange }: { sub: Extract<SubQuestion, { type: "order" }>; value: string; onChange: (v: string) => void }) {
  // value is stored as the chosen chips joined by single spaces. Chips may
  // contain spaces themselves (e.g. "the cat"), so the stored value is
  // segmented back into pool chips instead of a plain split.
  const chosen = useMemo(
    () => parseOrderValue(value, sub.words) ?? (value ? value.split(" ").filter(Boolean) : []),
    [value, sub.words],
  );

  // Remaining pool: remove one instance per chosen chip (duplicate-safe)
  const remaining = useMemo(() => {
    const pool = sub.words.map((w, i) => ({ w, i }));
    const usedIdx = new Set<number>();
    for (const chip of chosen) {
      const found = pool.find((p) => !usedIdx.has(p.i) && p.w === chip);
      if (found) usedIdx.add(found.i);
    }
    return pool.filter((p) => !usedIdx.has(p.i)).map((p) => p.w);
  }, [chosen, sub.words]);

  const add = (w: string) => onChange([...chosen, w].join(" "));
  const removeAt = (idx: number) => onChange(chosen.filter((_, i) => i !== idx).join(" "));
  const clear = () => onChange("");

  return (
    <div className="space-y-3">
      <div
        className={cn(
          "flex min-h-16 flex-wrap items-center gap-2 rounded-2xl border-[3px] border-dashed p-2",
          chosen.length ? "border-indigo-300 bg-indigo-50" : "border-sky-200 bg-sky-50",
        )}
        aria-label="Your sentence"
      >
        {chosen.length === 0 && <span className="px-2 text-sm font-semibold text-slate-400">👇 Tap the words below in the correct order.</span>}
        {chosen.map((w, i) => (
          <button
            key={`${w}-${i}`}
            type="button"
            onClick={() => removeAt(i)}
            title="Remove this word"
            className="btn-pop min-h-11 rounded-xl bg-gradient-to-b from-indigo-500 to-indigo-600 px-3.5 py-1.5 text-base font-black text-white shadow-md"
          >
            {w}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {remaining.map((w, i) => (
          <button
            key={`${w}-${i}`}
            type="button"
            onClick={() => add(w)}
            className="btn-pop min-h-11 rounded-xl border-[3px] border-yellow-300 bg-yellow-100 px-3.5 py-1.5 text-base font-black text-yellow-900 shadow-sm"
          >
            {w}
          </button>
        ))}
        {chosen.length > 0 && (
          <button type="button" onClick={clear} className="btn-pop ml-auto min-h-11 rounded-xl bg-rose-100 px-3 py-1.5 text-sm font-black text-rose-700">
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
