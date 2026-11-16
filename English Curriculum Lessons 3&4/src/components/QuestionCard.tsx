import { BookMarked } from "lucide-react";
import type { Part, Question } from "@/exam/types";

interface Props {
  question: Question;
  answers: Record<string, string>;
  onAnswer: (partId: string, value: string) => void;
}

const LETTERS = ["A", "B", "C", "D", "E", "F"];

export function QuestionCard({ question, answers, onAnswer }: Props) {
  const multi = question.parts.length > 1;

  return (
    <article className="paper-card rise-in rounded-3xl">
      {/* lesson accent bar */}
      <div
        className={`h-1.5 rounded-t-3xl ${
          question.lesson === 3
            ? "bg-gradient-to-r from-[#0f766e] via-[#14a094] to-[#0b4f4a]"
            : "bg-gradient-to-r from-[#b45309] via-[#d97b28] to-[#8a3f07]"
        }`}
      />
      <div className="p-5 sm:p-8">
        {/* header */}
        <header className="mb-5 flex flex-wrap items-center gap-2">
          <span className="chip bg-[#152a47] px-3 py-1.5 text-[#e6c877]">
            Question {question.n} of 20
          </span>
          <span
            className={`chip px-3 py-1.5 ${
              question.lesson === 3
                ? "bg-[#0f766e]/12 text-[#0b5a54]"
                : "bg-[#b45309]/12 text-[#93480a]"
            }`}
          >
            {question.sectionLabel}
          </span>
          <span className="chip bg-[#b3872e]/12 px-3 py-1.5 text-[#7c6117]">{question.skill}</span>
          <span className="chip ml-auto bg-slate-100 px-3 py-1.5 text-slate-600">5 marks</span>
        </header>

        <h2 className="font-display text-2xl font-semibold leading-snug text-[#152a47]">
          {question.title}
        </h2>
        <p className="mt-2 text-[15px] leading-relaxed text-slate-600">{question.instruction}</p>

        {question.passage && (
          <div className="passage mt-5">
            <p className="mb-2 flex items-center gap-2 font-display text-lg font-semibold text-[#152a47]">
              <BookMarked className="h-4 w-4 text-[#b3872e]" /> {question.passage.heading}
            </p>
            <p>{question.passage.text}</p>
          </div>
        )}

        <div className="mt-6 space-y-6">
          {question.parts.map((part, i) => (
            <PartField
              key={part.id}
              part={part}
              index={i}
              multi={multi}
              value={answers[part.id] ?? ""}
              onChange={(v) => onAnswer(part.id, v)}
            />
          ))}
        </div>
      </div>
    </article>
  );
}

function PartField({
  part,
  index,
  multi,
  value,
  onChange,
}: {
  part: Part;
  index: number;
  multi: boolean;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <section className="rounded-2xl border border-[#e3d9c0] bg-white/55 p-4 sm:p-5">
      {multi && (
        <span className="chip mb-3 bg-[#152a47]/8 px-2.5 py-1 text-[#152a47]">
          Part {index + 1} · {part.marks} {part.marks === 1 ? "mark" : "marks"}
        </span>
      )}

      {part.type === "mcq" && (
        <div>
          <p className="mb-3 text-[15px] font-medium leading-relaxed text-slate-800">{part.prompt}</p>
          <div className="grid gap-2.5">
            {part.options.map((opt, oi) => (
              <button
                key={opt.id}
                onClick={() => onChange(opt.id)}
                className={`option-tile ${value === opt.id ? "selected" : ""}`}
                aria-pressed={value === opt.id}
              >
                <span
                  className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-bold ${
                    value === opt.id ? "bg-[#b3872e] text-white" : "bg-[#152a47]/10 text-[#152a47]"
                  }`}
                >
                  {LETTERS[oi]}
                </span>
                <span>{opt.text}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {part.type === "select" && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[15px] font-medium leading-relaxed text-slate-800">
            {part.prompt.includes("___") ? (
              <InlineBlankPrompt text={part.prompt} />
            ) : (
              <span className="font-display text-lg font-semibold text-[#152a47]">{part.prompt}</span>
            )}
          </p>
          <select
            className={`select-field min-w-[240px] ${value ? "filled" : ""}`}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            aria-label={`Answer for ${part.prompt}`}
          >
            <option value="">— choose —</option>
            {part.options.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {part.options.length > 2 ? `${opt.id}. ${opt.text}` : opt.text}
              </option>
            ))}
          </select>
        </div>
      )}

      {part.type === "text" && (
        <div>
          <p className="mb-3 text-[15px] font-medium leading-relaxed text-slate-800">
            <InlineBlankPrompt text={part.prompt} />
          </p>
          <input
            className="field"
            value={value}
            placeholder={part.placeholder ?? "Type your answer here"}
            onChange={(e) => onChange(e.target.value)}
            autoComplete="off"
            spellCheck={false}
          />
        </div>
      )}

      {part.type === "tf" && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[15px] font-medium leading-relaxed text-slate-800">{part.prompt}</p>
          <div className="flex gap-2">
            {(["T", "F"] as const).map((v) => (
              <button
                key={v}
                onClick={() => onChange(v)}
                aria-pressed={value === v}
                className={`btn min-w-[110px] px-5 py-2.5 text-sm ${
                  value === v
                    ? v === "T"
                      ? "bg-[#0f766e] text-white shadow-[0_8px_18px_-8px_rgba(15,118,110,0.8)]"
                      : "bg-[#b45309] text-white shadow-[0_8px_18px_-8px_rgba(180,83,9,0.8)]"
                    : "btn-ghost"
                }`}
              >
                {v === "T" ? "True" : "False"}
              </button>
            ))}
          </div>
        </div>
      )}

      {part.type === "order" && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[15px] font-medium leading-relaxed text-slate-800">“{part.prompt}”</p>
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-600">
            Position
            <select
              className={`select-field w-[110px] ${value ? "filled" : ""}`}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              aria-label={`Position for: ${part.prompt}`}
            >
              <option value="">—</option>
              {Array.from({ length: part.totalItems }, (_, i) => i + 1).map((p) => (
                <option key={p} value={String(p)}>
                  {p}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}
    </section>
  );
}

/** Renders prompt text with blank underscores styled distinctly. */
function InlineBlankPrompt({ text }: { text: string }) {
  const chunks = text.split(/(_{2,})/g);
  return (
    <>
      {chunks.map((c, i) =>
        /^_{2,}$/.test(c) ? (
          <span key={i} className="mx-1 inline-block min-w-[90px] rounded-md border-b-2 border-[#b3872e] bg-[#b3872e]/8 px-1 text-center align-baseline text-transparent">
            blank
          </span>
        ) : (
          <span key={i}>{c}</span>
        )
      )}
    </>
  );
}
