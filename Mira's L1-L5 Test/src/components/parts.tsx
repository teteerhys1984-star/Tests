/* ------------------------------------------------------------------ */
/*  Question part renderers — one per answer format                    */
/* ------------------------------------------------------------------ */

import type { KeyboardEvent } from "react";
import { Eraser, RotateCcw } from "lucide-react";
import type { AnswerValue, QuestionPart } from "../types";

/** Arabic curriculum word shown as the vocabulary stimulus (RTL chip). */
export function ArabicWord({ word }: { word: string }) {
  return (
    <span
      dir="rtl"
      lang="ar"
      className="arabic-word mx-1.5 inline-flex -translate-y-0.5 items-center rounded-xl border-2 border-petal-deep/50 bg-gradient-to-br from-petal/60 to-lilac/40 px-4 py-1 text-lg font-bold leading-relaxed text-violet-deep shadow-soft"
    >
      {word}
    </span>
  );
}

/** Renders sub-part text, styling the ____ gap with a dashed line. */
export function GapText({ text }: { text: string }) {
  const chunks = text.split(/(____)/g);
  return (
    <>
      {chunks.map((c, i) =>
        c === "____" ? (
          <span key={i} className="gap-line mx-1 inline-block min-w-[3.2rem] text-transparent select-none">
            gap
          </span>
        ) : (
          <span key={i}>{c}</span>
        )
      )}
    </>
  );
}

interface PartProps {
  part: QuestionPart;
  value: AnswerValue | undefined;
  onChange: (v: AnswerValue) => void;
  accent: string; // per-category accent class
}

/* ------------------------------ MCQ ------------------------------- */

export function McqPart({ part, value, onChange }: PartProps) {
  return (
    <div className="mt-3 grid gap-2.5" role="radiogroup" aria-label={part.text}>
      {part.options?.map((opt, idx) => {
        const selected = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(opt.id)}
            className={`group flex items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left font-semibold transition-all duration-200 ${
              selected
                ? "border-rose bg-gradient-to-r from-petal/70 to-lilac/50 text-violet-deep shadow-soft scale-[1.01]"
                : "border-lilac/60 bg-white/70 text-ink hover:border-petal-deep hover:bg-petal/25 hover:translate-x-1"
            }`}
          >
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 font-display text-[13px] font-bold transition-colors ${
                selected ? "border-rose bg-rose text-white" : "border-lilac-deep/60 bg-white text-violet group-hover:border-rose"
              }`}
            >
              {String.fromCharCode(65 + idx)}
            </span>
            <span className="text-[15px] sm:text-base">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* --------------------------- True / False -------------------------- */

export function TfPart({ part, value, onChange }: PartProps) {
  const opts: { id: string; label: string; glyph: string }[] = [
    { id: "true", label: "True", glyph: "✓" },
    { id: "false", label: "False", glyph: "✕" },
  ];
  return (
    <div className="mt-3 flex gap-3" role="radiogroup" aria-label={part.text}>
      {opts.map((o) => {
        const selected = value === o.id;
        return (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(o.id)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-2xl border-2 px-4 py-3 font-display text-base font-bold transition-all ${
              selected
                ? "border-rose bg-gradient-to-r from-petal/70 to-lilac/50 text-violet-deep shadow-soft scale-[1.02]"
                : "border-lilac/60 bg-white/70 text-ink-soft hover:border-petal-deep hover:text-ink"
            }`}
          >
            <span className={`flex h-6 w-6 items-center justify-center rounded-full text-sm ${selected ? "bg-rose text-white" : "bg-lilac/50 text-violet"}`}>
              {o.glyph}
            </span>
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------ Text ------------------------------- */

export function TextPart({ part, value, onChange }: PartProps) {
  return (
    <div className="mt-3">
      <input
        type="text"
        value={typeof value === "string" ? value : ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={part.placeholder ?? "Type your answer"}
        aria-label={part.text}
        autoComplete="off"
        spellCheck={false}
        className="w-full rounded-2xl border-2 border-lilac bg-white/90 px-4 py-3 font-semibold text-ink shadow-soft transition-all placeholder:font-normal placeholder:text-ink-soft/50 focus:border-rose focus:shadow-lift"
      />
    </div>
  );
}

/* --------------------------- Matching row -------------------------- */

export function SelectPart({ part, value, onChange }: PartProps) {
  return (
    <div className="mt-2 flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-lilac/50 bg-white/60 px-4 py-3">
      <span className="font-display text-lg font-bold text-violet">{part.text}</span>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={`Match ${part.text}`}>
        {part.options?.map((opt) => {
          const selected = value === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(opt.id)}
              className={`rounded-full border-2 px-4 py-1.5 font-display text-sm font-bold transition-all ${
                selected
                  ? "border-rose bg-rose text-white shadow-soft scale-105"
                  : "border-lilac bg-white/80 text-violet hover:border-petal-deep hover:bg-petal/30"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------ Sentence ordering ------------------------ */

export function OrderPart({ part, value, onChange }: PartProps) {
  const chosen = Array.isArray(value) ? value : [];
  const tokens = part.tokens ?? [];
  const remaining = tokens.filter((t) => !chosen.includes(t.id));

  const pick = (id: string) => {
    if (chosen.includes(id)) return;
    onChange([...chosen, id]);
  };
  const unpick = (id: string) => onChange(chosen.filter((c) => c !== id));
  const onTokenKey = (e: KeyboardEvent, fn: () => void) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      fn();
    }
  };

  return (
    <div className="mt-3">
      {/* answer strip */}
      <div
        className={`flex min-h-[3.4rem] flex-wrap items-center gap-2 rounded-2xl border-2 border-dashed px-3 py-2.5 transition-colors ${
          chosen.length ? "border-rose/60 bg-petal/20" : "border-lilac-deep/60 bg-white/60"
        }`}
        aria-label="Your sentence"
      >
        {chosen.length === 0 && (
          <span className="px-2 text-sm font-semibold text-ink-soft/60">Tap the flowers below to build your sentence…</span>
        )}
        {chosen.map((id, i) => {
          const t = tokens.find((tk) => tk.id === id);
          if (!t) return null;
          return (
            <button
              key={id}
              type="button"
              onClick={() => unpick(id)}
              onKeyDown={(e) => onTokenKey(e, () => unpick(id))}
              title="Tap to remove"
              className="animate-bloom rounded-full border-2 border-rose bg-gradient-to-r from-petal to-lilac px-4 py-1.5 font-display text-sm font-bold text-violet-deep shadow-soft transition-transform hover:scale-105"
            >
              {i + 1}. {t.text}
            </button>
          );
        })}
      </div>

      {/* token pool */}
      <div className="mt-3 flex flex-wrap items-center gap-2" aria-label="Word choices">
        {remaining.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => pick(t.id)}
            onKeyDown={(e) => onTokenKey(e, () => pick(t.id))}
            className="rounded-full border-2 border-lilac bg-white px-4 py-1.5 font-display text-sm font-bold text-violet shadow-soft transition-all hover:-translate-y-0.5 hover:border-rose hover:bg-petal/30"
          >
            {t.text}
          </button>
        ))}
        {chosen.length > 0 && (
          <button
            type="button"
            onClick={() => onChange([])}
            className="ml-1 inline-flex items-center gap-1.5 rounded-full border-2 border-peach-deep/60 bg-peach/40 px-3.5 py-1.5 text-[13px] font-bold text-rose-deep transition-colors hover:bg-peach/70"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </button>
        )}
      </div>
      {chosen.length > 0 && chosen.length < tokens.length && (
        <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-ink-soft">
          <Eraser className="h-3.5 w-3.5" /> Tap a flower in the strip to send it back.
        </p>
      )}
    </div>
  );
}

/* ----------------------------- Writing ----------------------------- */

export function WritingPart({ part, value, onChange }: PartProps) {
  const v = typeof value === "string" ? value : "";
  return (
    <div className="mt-3">
      <textarea
        value={v}
        onChange={(e) => onChange(e.target.value)}
        placeholder={part.placeholder ?? "Write your answer here"}
        aria-label={part.text}
        rows={3}
        maxLength={300}
        className="w-full resize-none rounded-2xl border-2 border-lilac bg-white/90 px-4 py-3 font-semibold text-ink shadow-soft transition-all placeholder:font-normal placeholder:text-ink-soft/50 focus:border-rose focus:shadow-lift"
      />
      <p className="mt-1.5 text-right text-xs font-semibold text-ink-soft/70">{v.trim().length} / 300 characters</p>
    </div>
  );
}

/* ---------------------------- dispatcher --------------------------- */

export function PartRenderer(props: PartProps) {
  switch (props.part.kind) {
    case "mcq":
      return <McqPart {...props} />;
    case "tf":
      return <TfPart {...props} />;
    case "text":
      return <TextPart {...props} />;
    case "select":
      return <SelectPart {...props} />;
    case "order":
      return <OrderPart {...props} />;
    case "writing":
      return <WritingPart {...props} />;
  }
}
