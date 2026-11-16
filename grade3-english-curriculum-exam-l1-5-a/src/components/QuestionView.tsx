import type {
  AnswerValue,
  Block,
  ChoicePart,
  ImageAsset,
  OrderPart,
  Part,
  Question,
  QuestionAnswers,
  Segment,
  SelectPart,
  TextPart,
} from "../types";
import { answeredCount, questionMax } from "../lib/grading";
import { formatMarks } from "../lib/format";
import { CheckIcon, ChevronRightIcon, XIcon } from "./Icons";
import { PassageView } from "./PassageView";

interface QuestionViewProps {
  question: Question;
  number: number;
  total: number;
  answers: QuestionAnswers | undefined;
  onChange: (partId: string, value: AnswerValue) => void;
}

type Ctx = {
  question: Question;
  answers: QuestionAnswers | undefined;
  onChange: (partId: string, value: AnswerValue) => void;
  name: (partId: string) => string;
  part: (partId: string) => Part;
};

const LABEL = "mr-2 inline-grid min-w-8 place-items-center rounded-lg bg-green-100 px-1.5 py-0.5 align-middle text-base font-bold text-green-800";

export function QuestionView({ question, number, total, answers, onChange }: QuestionViewProps) {
  const ctx: Ctx = {
    question,
    answers,
    onChange,
    name: (partId) => `q${number}-${partId}`,
    part: (partId) => {
      const found = question.parts.find((p) => p.id === partId);
      if (!found) throw new Error(`Unknown part ${partId}`);
      return found;
    },
  };
  const { answered, total: partCount } = answeredCount(question, answers);
  const marks = questionMax(question);
  const sameMarks = question.parts.every((p) => p.marks === question.parts[0].marks);
  const complete = answered === partCount;

  return (
    <article aria-labelledby={`q-title-${number}`} className="rounded-3xl border border-green-100 bg-white/95 p-4 shadow-[0_18px_40px_-24px_rgba(21,128,61,0.45)] sm:p-7">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-extrabold uppercase tracking-widest text-green-700">
          Question {number} <span className="font-bold text-green-500">of {total}</span>
        </p>
        <div className="flex flex-wrap gap-2 text-xs font-bold sm:text-sm">
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-800 ring-1 ring-emerald-200">{question.format}</span>
          <span className="rounded-full bg-lime-200 px-3 py-1 text-green-950">
            {formatMarks(marks)} marks
            {partCount > 1 && sameMarks ? ` · ${formatMarks(question.parts[0].marks)} each` : ""}
          </span>
        </div>
      </header>

      <h2 id={`q-title-${number}`} className="mt-3 text-xl font-extrabold leading-snug text-green-950 sm:text-2xl">
        {question.instruction}
      </h2>

      {question.passage && (
        <div className="mt-4">
          <PassageView passage={question.passage} />
        </div>
      )}

      <div className="mt-5 flex flex-col gap-4">
        {question.blocks.map((block, i) => (
          <BlockView key={i} block={block} ctx={ctx} />
        ))}
      </div>

      <p
        aria-live="polite"
        className={`mt-6 flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold ${complete ? "bg-lime-100 text-green-900" : "bg-green-50 text-green-800"}`}
      >
        {complete ? (
          <>
            <CheckIcon className="h-4 w-4" /> {partCount > 1 ? "All parts answered" : "Answered"}
          </>
        ) : partCount > 1 ? (
          <>
            {answered} of {partCount} parts answered
          </>
        ) : (
          <>Not answered yet</>
        )}
      </p>
    </article>
  );
}

function BlockView({ block, ctx }: { block: Block; ctx: Ctx }) {
  switch (block.type) {
    case "choice": {
      const part = ctx.part(block.part) as ChoicePart;
      return <ChoiceBlock part={part} name={ctx.name(part.id)} value={ctx.answers?.[part.id]} onChange={(v) => ctx.onChange(part.id, v)} />;
    }
    case "sentence":
      return <SentenceBlock segments={block.segments} label={block.label} images={block.images} ctx={ctx} />;
    case "order": {
      const part = ctx.part(block.part) as OrderPart;
      return <OrderBlock part={part} value={ctx.answers?.[part.id]} onChange={(v) => ctx.onChange(part.id, v)} />;
    }
    case "wordbank":
      return (
        <div className="rounded-2xl border-2 border-dashed border-lime-300 bg-lime-50 px-4 py-3">
          <p className="text-xs font-extrabold uppercase tracking-widest text-green-700">Word box</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {block.words.map((w) => (
              <span key={w} className="rounded-full bg-white px-3 py-1 text-base font-bold text-green-900 ring-1 ring-lime-300">
                {w}
              </span>
            ))}
          </div>
        </div>
      );
    case "gallery":
      return (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {block.images.map((img) => (
            <figure key={img.label} className="relative rounded-2xl border border-green-100 bg-white p-2 shadow-sm">
              <span className="absolute left-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-green-700 text-sm font-extrabold text-white shadow">
                {img.label}
              </span>
              <img src={img.src} alt={img.alt} className="mx-auto h-24 w-full object-contain sm:h-28" />
            </figure>
          ))}
        </div>
      );
    case "timetable":
      return (
        <div className="flex flex-col gap-3">
          {block.rows.map((row) => (
            <div key={row.day} className="rounded-2xl border border-green-100 bg-sky-50/0 bg-gradient-to-r from-green-50 to-white p-3">
              <p className="mb-2 text-base font-extrabold text-green-900">{row.day}</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {row.cells.map((cell, i) => (
                  <div key={i} className="flex min-h-[5.5rem] flex-col items-center justify-center gap-2 rounded-xl border border-green-100 bg-white p-2 text-center">
                    {cell.image && <img src={cell.image.src} alt={cell.image.alt} className="h-12 w-12 object-contain" />}
                    {cell.text && <span className="text-base font-bold text-green-950">{cell.text}</span>}
                    {cell.blank && <BlankControl part={ctx.part(cell.blank)} ctx={ctx} fullWidth />}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      );
    case "sequence":
      return (
        <div className="rounded-2xl border border-green-100 bg-white p-3 sm:p-4">
          <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-3">
            {block.items.map((item, i) => (
              <li key={i} className="flex items-center gap-1.5">
                {typeof item === "string" ? (
                  <span className="rounded-full bg-lime-100 px-3 py-2 text-base font-extrabold text-green-900 ring-1 ring-lime-300 sm:text-lg">{item}</span>
                ) : "blank" in item ? (
                  <BlankControl part={ctx.part(item.blank)} ctx={ctx} />
                ) : null}
                {i < block.items.length - 1 && <ChevronRightIcon className="h-4 w-4 text-green-300" />}
              </li>
            ))}
          </ol>
        </div>
      );
    case "example":
      return (
        <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-green-200 bg-green-50/70 p-3 sm:flex-row sm:items-center sm:p-4">
          {block.images && <Pictures images={block.images} />}
          <p className="text-lg text-green-900 sm:text-xl">
            <span className="mr-2 rounded-full bg-white px-2 py-0.5 align-middle text-xs font-extrabold uppercase tracking-wider text-green-700 ring-1 ring-green-200">
              Example
            </span>
            {block.label && <span className={LABEL}>{block.label}</span>}
            {block.text}
          </p>
        </div>
      );
  }
}

function Pictures({ images }: { images: ImageAsset[] }) {
  return (
    <div className="flex shrink-0 gap-2">
      {images.map((img, i) => (
        <img key={i} src={img.src} alt={img.alt} className="h-20 w-24 rounded-xl border border-green-100 bg-white object-contain p-1 sm:h-24 sm:w-28" />
      ))}
    </div>
  );
}

function ChoiceBlock({ part, name, value, onChange }: { part: ChoicePart; name: string; value: AnswerValue | undefined; onChange: (v: string) => void }) {
  const row = part.layout === "row";
  return (
    <fieldset className="m-0 min-w-0 rounded-2xl border border-green-100 bg-white p-3 sm:p-4">
      <legend className="sr-only">
        {part.label ? `${part.label} ` : ""}
        {part.stem}
      </legend>
      <p aria-hidden="true" className="mb-3 text-lg font-semibold leading-snug text-green-950 sm:text-xl">
        {part.label && <span className={LABEL}>{part.label}</span>}
        {part.stem}
      </p>
      <div className={row ? "flex flex-wrap gap-2" : "grid gap-2"}>
        {part.options.map((opt) => {
          const checked = value === opt;
          return (
            <label
              key={opt}
              className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 px-4 py-2.5 text-base transition has-[input:focus-visible]:ring-4 has-[input:focus-visible]:ring-lime-300 sm:text-lg ${
                row ? "min-w-[7.5rem] justify-center" : ""
              } ${checked ? "border-lime-500 bg-lime-100 text-green-950 shadow-sm" : "border-green-100 bg-green-50/40 text-green-950 hover:border-green-300 hover:bg-green-50"}`}
            >
              <input type="radio" name={name} value={opt} checked={checked} onChange={() => onChange(opt)} className="sr-only" />
              <span
                aria-hidden="true"
                className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 ${checked ? "border-green-700 bg-green-700 text-white" : "border-green-300 bg-white"}`}
              >
                {checked && <CheckIcon className="h-4 w-4" />}
              </span>
              <span className="font-semibold">{opt}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function SentenceBlock({ segments, label, images, ctx }: { segments: Segment[]; label?: string; images?: ImageAsset[]; ctx: Ctx }) {
  const buttonParts = segments
    .filter((s): s is { blank: string } => typeof s === "object" && "blank" in s)
    .map((s) => ctx.part(s.blank))
    .filter((p): p is SelectPart => p.kind === "select" && p.style === "buttons");

  return (
    <div className="rounded-2xl border border-green-100 bg-white p-3 sm:p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {images && images.length > 0 && <Pictures images={images} />}
        <div className="min-w-0 flex-1">
          <p className="text-lg leading-[2.75rem] text-green-950 sm:text-xl">
            {label && <span className={LABEL}>{label}</span>}
            {segments.map((seg, i) => {
              if (typeof seg === "string") return <span key={i}>{seg}</span>;
              if ("image" in seg)
                return (
                  <img
                    key={i}
                    src={seg.image.src}
                    alt={seg.image.alt}
                    className="mx-1 inline-block h-12 w-12 rounded-lg border border-green-100 bg-white object-contain p-0.5 align-middle sm:h-14 sm:w-14"
                  />
                );
              const part = ctx.part(seg.blank);
              if (part.kind === "select" && part.style === "buttons") {
                const value = ctx.answers?.[part.id];
                const index = buttonParts.length > 1 ? buttonParts.indexOf(part) + 1 : 0;
                return (
                  <span
                    key={i}
                    aria-hidden="true"
                    className={`mx-1 inline-block min-w-[4.5rem] rounded-lg border-b-4 px-2 text-center align-middle font-bold leading-9 ${
                      value ? "border-green-600 bg-lime-100 text-green-950" : "border-dashed border-green-300 bg-green-50 text-green-400"
                    }`}
                  >
                    {index > 0 && <sup className="mr-0.5 text-[0.6rem] text-green-600">{index}</sup>}
                    {typeof value === "string" && value ? value : "\u00A0?\u00A0"}
                  </span>
                );
              }
              return <BlankControl key={i} part={part} ctx={ctx} />;
            })}
          </p>
          {buttonParts.map((part, i) => (
            <ButtonGroup key={part.id} part={part} ctx={ctx} index={buttonParts.length > 1 ? i + 1 : 0} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ButtonGroup({ part, ctx, index }: { part: SelectPart; ctx: Ctx; index: number }) {
  const value = ctx.answers?.[part.id];
  return (
    <div role="radiogroup" aria-label={part.ariaLabel} className="mt-2 flex flex-wrap items-center gap-2">
      {index > 0 && <span className="text-sm font-bold text-green-700">Blank {index}:</span>}
      {part.options.map((opt) => {
        const checked = value === opt;
        return (
          <label
            key={opt}
            className={`cursor-pointer rounded-full border-2 px-4 py-1.5 text-base font-bold transition has-[input:focus-visible]:ring-4 has-[input:focus-visible]:ring-lime-300 ${
              checked ? "border-green-700 bg-green-700 text-white shadow-sm" : "border-green-200 bg-white text-green-900 hover:border-green-400 hover:bg-green-50"
            }`}
          >
            <input type="radio" className="sr-only" name={ctx.name(part.id)} value={opt} checked={checked} onChange={() => ctx.onChange(part.id, opt)} />
            {opt}
          </label>
        );
      })}
    </div>
  );
}

function BlankControl({ part, ctx, fullWidth = false }: { part: Part; ctx: Ctx; fullWidth?: boolean }) {
  const value = ctx.answers?.[part.id];
  if (part.kind === "select") {
    const long = part.options.some((o) => o.length > 18);
    const filled = typeof value === "string" && value !== "";
    return (
      <select
        aria-label={part.ariaLabel}
        value={typeof value === "string" ? value : ""}
        onChange={(e) => ctx.onChange(part.id, e.target.value)}
        className={`rounded-xl border-2 px-3 py-2 text-base font-semibold outline-none transition focus-visible:ring-4 focus-visible:ring-lime-300 sm:text-lg ${
          filled ? "border-lime-500 bg-lime-50 text-green-950" : "border-green-200 bg-white text-green-700"
        } ${long ? "mt-1 block w-full" : fullWidth ? "w-full" : "mx-1 inline-block max-w-full align-middle"}`}
      >
        <option value="" disabled>
          Choose…
        </option>
        {part.options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    );
  }
  if (part.kind === "text") {
    return <TextBlank part={part} value={value} onChange={(v) => ctx.onChange(part.id, v)} />;
  }
  return null;
}

function TextBlank({ part, value, onChange }: { part: TextPart; value: AnswerValue | undefined; onChange: (v: string) => void }) {
  const width = part.size === "sm" ? "w-24" : part.size === "lg" ? "w-64" : "w-40 sm:w-44";
  const filled = typeof value === "string" && value.trim() !== "";
  return (
    <input
      type="text"
      aria-label={part.ariaLabel}
      value={typeof value === "string" ? value : ""}
      onChange={(e) => onChange(e.target.value)}
      inputMode={part.inputMode ?? "text"}
      autoComplete="off"
      autoCorrect="off"
      autoCapitalize="none"
      spellCheck={false}
      maxLength={40}
      placeholder="write here"
      className={`mx-1 inline-block max-w-full rounded-xl border-2 px-3 py-1.5 align-middle text-base font-bold outline-none transition placeholder:font-normal placeholder:text-green-300 focus-visible:ring-4 focus-visible:ring-lime-300 sm:text-lg ${width} ${
        filled ? "border-lime-500 bg-lime-50 text-green-950" : "border-dashed border-green-300 bg-white text-green-950"
      }`}
    />
  );
}

function OrderBlock({ part, value, onChange }: { part: OrderPart; value: AnswerValue | undefined; onChange: (v: number[]) => void }) {
  const chosen = Array.isArray(value) ? value : [];
  const remaining = part.tokens.map((_, i) => i).filter((i) => !chosen.includes(i));
  return (
    <div className="rounded-2xl border border-green-100 bg-white p-3 sm:p-4">
      <p className="text-sm font-extrabold uppercase tracking-widest text-green-700">Your sentence</p>
      <div className="mt-2 flex min-h-[3.75rem] flex-wrap items-center gap-2 rounded-xl border-2 border-dashed border-lime-400 bg-lime-50/70 p-2" aria-live="polite">
        {chosen.length === 0 ? (
          <span className="px-2 text-base text-green-700/80">Tap the words below in the correct order.</span>
        ) : (
          chosen.map((idx, pos) => (
            <button
              key={`${idx}-${pos}`}
              type="button"
              onClick={() => onChange(chosen.filter((_, p) => p !== pos))}
              aria-label={`Remove the word ${part.tokens[idx]}`}
              className="inline-flex items-center gap-1.5 rounded-xl bg-green-700 px-3 py-2 text-lg font-bold text-white shadow-sm transition hover:bg-green-800"
            >
              {part.tokens[idx]}
              <XIcon className="h-4 w-4 opacity-80" />
            </button>
          ))
        )}
      </div>
      <p className="mt-4 text-sm font-extrabold uppercase tracking-widest text-green-700">Words</p>
      <div className="mt-2 flex min-h-[3rem] flex-wrap gap-2">
        {remaining.map((idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onChange([...chosen, idx])}
            className="rounded-xl border-2 border-green-200 bg-white px-3 py-2 text-lg font-bold text-green-900 shadow-sm transition hover:border-lime-500 hover:bg-lime-50"
          >
            {part.tokens[idx]}
          </button>
        ))}
        {remaining.length === 0 && <span className="py-2 text-base text-green-700">All words are used.</span>}
      </div>
      {chosen.length > 0 && (
        <button type="button" onClick={() => onChange([])} className="mt-3 text-sm font-bold text-green-700 underline underline-offset-4 hover:text-green-900">
          Clear and start again
        </button>
      )}
    </div>
  );
}
