import { Check, Eraser, MoveRight } from "lucide-react";
import type {
  AnswerValue,
  FillPart,
  MatchPart,
  McqPart,
  Part,
  Question,
  RubricPart,
  TfPart,
} from "../types";
import { cn } from "../utils/cn";
import { wordCount } from "../logic/grading";

const LETTERS = "ABCDEFGH";

/* ------------------------------- MCQ ------------------------------ */

function McqInput({ part, value, onAnswer, letterOffset = 0 }: {
  part: McqPart;
  value: AnswerValue | undefined;
  onAnswer: (v: string) => void;
  letterOffset?: number;
}) {
  return (
    <div className="mt-2 grid gap-2" role="radiogroup" aria-label={part.prompt}>
      {part.options.map((opt, i) => {
        const active = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onAnswer(opt.id)}
            className="opt-btn flex w-full items-center gap-3 rounded-md px-3.5 py-2.5 text-left"
          >
            <span
              className={cn(
                "opt-key font-hud flex h-6 w-6 shrink-0 items-center justify-center rounded-sm border border-[#3d4d22] bg-[#10160a] text-[11px] font-bold text-[#9aa886]"
              )}
            >
              {LETTERS[letterOffset + i]}
            </span>
            <span className="text-[16.5px] font-semibold tracking-wide text-[#e6dcc0]">
              {opt.text}
            </span>
            {active && <Check className="ml-auto h-4 w-4 shrink-0 text-[#ffb400]" />}
          </button>
        );
      })}
    </div>
  );
}

/* --------------------------- True / False ------------------------- */

function TfInput({ part, value, onAnswer }: { part: TfPart; value?: AnswerValue; onAnswer: (v: string) => void }) {
  const opts: { id: string; label: string }[] = [
    { id: "true", label: "TRUE" },
    { id: "false", label: "FALSE" },
  ];
  return (
    <div className="mt-2 flex gap-2" role="radiogroup" aria-label={part.prompt}>
      {opts.map((o) => {
        const active = value === o.id;
        return (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onAnswer(o.id)}
            className={cn(
              "font-hud flex-1 rounded-md border px-4 py-2.5 text-[12px] font-bold tracking-[0.18em] transition-all",
              active
                ? o.id === "true"
                  ? "border-[#7dd069] bg-[#2a4418] text-[#b8e99f] shadow-[0_0_16px_-4px_rgba(125,208,105,0.6)]"
                  : "border-[#ff5f56] bg-[#471d16] text-[#ffafa3] shadow-[0_0_16px_-4px_rgba(255,95,86,0.5)]"
                : "border-[#2a3819] bg-[#12180f] text-[#8fa06d] hover:border-[#55682c] hover:text-[#cbb894]"
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------- Fill ----------------------------- */

function FillInput({ part, value, onAnswer }: { part: FillPart; value?: AnswerValue; onAnswer: (v: string) => void }) {
  return (
    <div className="mt-2">
      <input
        type="text"
        value={typeof value === "string" ? value : ""}
        onChange={(e) => onAnswer(e.target.value)}
        placeholder={part.placeholder ?? "Type your answer here…"}
        autoComplete="off"
        spellCheck={false}
        className="tac-input w-full max-w-md rounded-md px-3.5 py-2.5 text-[17px] font-semibold tracking-wide"
        aria-label={part.prompt}
      />
    </div>
  );
}

/* ------------------------------- Match ---------------------------- */

function MatchInput({
  question,
  part,
  value,
  onAnswer,
}: {
  question: Question;
  part: MatchPart;
  value?: AnswerValue;
  onAnswer: (v: string) => void;
}) {
  return (
    <div className="mt-2 flex flex-wrap items-center gap-3">
      <span className="rounded border border-[#37431f] bg-[#141b0d] px-3 py-1.5 font-hud text-[13px] font-bold tracking-widest text-[#ffd75e]">
        {part.prompt}
      </span>
      <span className="text-[#5c6a45]">⟶</span>
      <select
        value={typeof value === "string" ? value : ""}
        onChange={(e) => onAnswer(e.target.value)}
        aria-label={`Match for ${part.prompt}`}
        className={cn(
          "tac-input cursor-pointer rounded-md px-3.5 py-2 text-[16px] font-semibold",
          !value && "text-[#6d7a58]"
        )}
      >
        <option value="" disabled>
          Choose a match…
        </option>
        {question.matchOptions?.map((o) => (
          <option key={o.id} value={o.id} className="bg-[#12180f] text-[#e6dcc0]">
            {o.text}
          </option>
        ))}
      </select>
    </div>
  );
}

/* ------------------------------ Order ----------------------------- */

function OrderInput({
  question,
  value,
  onAnswer,
}: {
  question: Question;
  value?: AnswerValue;
  onAnswer: (v: string[]) => void;
}) {
  const pool = question.chips ?? [];
  const chosen = Array.isArray(value) ? value : [];
  const remaining = [...pool];
  for (const w of chosen) {
    const idx = remaining.indexOf(w);
    if (idx >= 0) remaining.splice(idx, 1);
  }

  return (
    <div className="mt-3 space-y-4">
      {/* answer line */}
      <div
        className={cn(
          "flex min-h-[64px] flex-wrap items-center gap-2 rounded-lg border-2 border-dashed p-3",
          chosen.length
            ? "border-[#b58500] bg-[#171304]/80"
            : "border-[#2a3819] bg-[#0c100a]/70"
        )}
        aria-label="Your sentence"
      >
        {chosen.length === 0 && (
          <span className="px-2 text-[15px] font-semibold text-[#5c6a45] italic">
            Tap the word cards below to build your sentence here…
          </span>
        )}
        {chosen.map((w, i) => (
          <button
            key={`${w}-${i}`}
            type="button"
            onClick={() => onAnswer(chosen.filter((_, j) => j !== i))}
            className="chip chip-in-line rounded-md px-3 py-1.5 text-[16px] font-bold tracking-wide"
            title="Tap to remove"
          >
            {w}
          </button>
        ))}
        {chosen.length > 0 && (
          <button
            type="button"
            onClick={() => onAnswer([])}
            className="ml-auto inline-flex items-center gap-1 rounded border border-[#3d2d16] bg-[#22150a] px-2 py-1 font-hud text-[10px] tracking-widest text-[#d8a05a] uppercase hover:border-[#ff7a1a]"
          >
            <Eraser className="h-3 w-3" /> Clear
          </button>
        )}
      </div>
      {/* bank */}
      <div className="flex flex-wrap gap-2" aria-label="Word cards">
        {remaining.map((w, i) => (
          <button
            key={`${w}-${i}`}
            type="button"
            onClick={() => onAnswer([...chosen, w])}
            className="chip rounded-md px-3 py-1.5 text-[16px] font-bold tracking-wide"
          >
            {w}
          </button>
        ))}
        {remaining.length === 0 && (
          <span className="font-hud text-[10px] tracking-[0.2em] text-[#55682c] uppercase">
            All cards deployed
          </span>
        )}
      </div>
    </div>
  );
}

/* ------------------------------ Rubric ---------------------------- */

function RubricInput({ part, value, onAnswer }: { part: RubricPart; value?: AnswerValue; onAnswer: (v: string) => void }) {
  const text = typeof value === "string" ? value : "";
  const wc = wordCount(text);
  return (
    <div className="mt-2">
      <textarea
        value={text}
        onChange={(e) => onAnswer(e.target.value)}
        rows={3}
        placeholder="Write your answer here…"
        aria-label={part.prompt}
        className="tac-input w-full rounded-md px-3.5 py-2.5 text-[17px] leading-relaxed font-semibold"
        spellCheck={false}
      />
      <div className="mt-1.5 flex items-center justify-between">
        <span
          className={cn(
            "font-hud text-[10px] tracking-[0.16em] uppercase",
            wc >= part.minWordsHint ? "text-[#7dd069]" : "text-[#8fa06d]"
          )}
        >
          Words: {wc} {wc < part.minWordsHint ? `(aim for at least ${part.minWordsHint})` : "✓"}
        </span>
        <span className="font-hud text-[10px] tracking-[0.16em] text-[#5c6a45] uppercase">
          Writing zone
        </span>
      </div>
    </div>
  );
}

/* --------------------------- part renderer ------------------------ */

export function PartRenderer({
  question,
  part,
  value,
  onAnswer,
}: {
  question: Question;
  part: Part;
  value: AnswerValue | undefined;
  onAnswer: (partId: string, value: AnswerValue) => void;
}) {
  return (
    <div className="rounded-lg border border-[#232d15] bg-[#0d120a]/80 p-4">
      <p className="text-[17px] leading-snug font-semibold text-[#efe7cf]">
        {part.prompt}
      </p>

      {/* Arabic prompt card — vocabulary translation questions */}
      {part.arabic && (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <span
            dir="rtl"
            lang="ar"
            className="ar-card ar-word rounded-lg px-6 py-2 text-[30px] font-bold text-[#ffd75e]"
            aria-label={`Arabic word: ${part.arabic}`}
          >
            {part.arabic}
          </span>
          <span className="font-hud flex items-center gap-1.5 text-[11px] font-bold tracking-[0.2em] text-[#8fa06d] uppercase">
            <MoveRight className="h-4 w-4 text-[#ffb400]" />
            English
          </span>
        </div>
      )}
      {part.kind === "mcq" && (
        <McqInput part={part} value={value} onAnswer={(v) => onAnswer(part.id, v)} />
      )}
      {part.kind === "tf" && (
        <TfInput part={part} value={value} onAnswer={(v) => onAnswer(part.id, v)} />
      )}
      {part.kind === "fill" && (
        <FillInput part={part} value={value} onAnswer={(v) => onAnswer(part.id, v)} />
      )}
      {part.kind === "match" && (
        <MatchInput question={question} part={part} value={value} onAnswer={(v) => onAnswer(part.id, v)} />
      )}
      {part.kind === "order" && (
        <OrderInput question={question} value={value} onAnswer={(v) => onAnswer(part.id, v)} />
      )}
      {part.kind === "rubric" && (
        <RubricInput part={part} value={value} onAnswer={(v) => onAnswer(part.id, v)} />
      )}
    </div>
  );
}


