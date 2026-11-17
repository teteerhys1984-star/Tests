import type { Item, OrderItem, Question } from "@/data/exam";
import { PASSAGES } from "@/data/exam";

interface Props {
  q: Question;
  answers: Record<string, string>;
  onAnswer: (key: string, value: string) => void;
}

export default function QuestionCard({ q, answers, onAnswer }: Props) {
  const passage = q.passage ? PASSAGES[q.passage] : null;
  const totalMarks = q.items.reduce((s, i) => s + i.marks, 0);

  return (
    <article key={q.id} className="settle space-y-6">
      {/* Header — no lesson name, no page number, no hint */}
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="eyebrow text-lilac-deep">
          Question {q.n} of 25 · {totalMarks} marks
        </p>
        <p className="text-[12px] font-bold text-ink-soft">
          {q.items.length} parts · {q.items.length === 2 ? "2 marks each" : "1 mark each"}
        </p>
      </div>

      <h2 className="font-display text-[clamp(1.32rem,4vw,1.8rem)] font-extrabold leading-snug text-ink">
        {q.instruction}
      </h2>

      {passage && (
        <figure
          aria-label="Reading text"
          className="overflow-hidden rounded-3xl border border-lilac-pale bg-white shadow-[0_18px_40px_-34px_rgba(110,63,151,0.55)]"
        >
          <figcaption className="border-b border-lilac-pale/70 bg-lavender/70 px-5 py-3">
            <p className="eyebrow text-lilac-deep">{passage.label}</p>
          </figcaption>
          <div className="paper-grid px-5 py-4 sm:px-6 sm:py-5">
            <p className="text-[16px] leading-[1.85] text-ink sm:text-[17px] [&>span:first-child]:float-left [&>span:first-child]:mr-2 [&>span:first-child]:font-display [&>span:first-child]:text-[44px] [&>span:first-child]:font-black [&>span:first-child]:leading-[0.8] [&>span:first-child]:text-lilac-deep">
              <span>{passage.text.slice(0, 1)}</span>
              {passage.text.slice(1)}
            </p>
          </div>
        </figure>
      )}

      {q.table && <DataTable head={q.table.head} rows={q.table.rows} />}

      <div className="space-y-4">
        {q.items.map((item, idx) => {
          const key = `${q.id}/${item.id}`;
          return (
            <ItemBlock
              key={key}
              label={String.fromCharCode(97 + idx)}
              item={item}
              value={answers[key] ?? ""}
              onChange={(v) => onAnswer(key, v)}
            />
          );
        })}
      </div>
    </article>
  );
}

function DataTable({ head, rows }: { head: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto rounded-3xl border border-lilac-pale bg-white shadow-[0_14px_34px_-28px_rgba(110,63,151,0.55)]">
      <table className="w-full min-w-[360px] border-collapse text-left text-[14.5px]">
        <thead>
          <tr className="bg-lavender text-lilac-deep">
            {head.map((h) => (
              <th key={h} className="px-4 py-3 text-[12px] font-extrabold uppercase tracking-wider">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, ri) => (
            <tr key={ri} className="border-t border-lilac-pale/70">
              {r.map((cell, ci) => (
                <td key={ci} className="px-4 py-3 font-semibold text-ink">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ItemBlock({
  label,
  item,
  value,
  onChange,
}: {
  label: string;
  item: Item;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="rounded-3xl border border-lilac-pale bg-white p-4 shadow-[0_14px_30px_-28px_rgba(110,63,151,0.65)] sm:p-5">
      <div className="flex items-start gap-3">
        <span className="num grid h-8 w-8 shrink-0 place-items-center rounded-full bg-lavender text-[13px] font-extrabold text-lilac-deep">
          {label}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="text-[16.5px] font-semibold leading-snug text-ink">{item.prompt}</p>
            <span className="num hidden shrink-0 rounded-full bg-peach-pale px-2 py-0.5 text-[11px] font-extrabold text-[#b4593a] sm:inline-block">
              {item.marks} {item.marks === 1 ? "mark" : "marks"}
            </span>
          </div>

          {item.kind === "tf" && <TFInput value={value} onChange={onChange} />}
          {item.kind === "mc" && (
            <MCInput options={item.options} value={value} onChange={onChange} />
          )}
          {item.kind === "text" && (
            <TextInput value={value} onChange={onChange} label={label} />
          )}
          {item.kind === "order" && <OrderInput item={item} value={value} onChange={onChange} />}
        </div>
      </div>
    </div>
  );
}

function TFInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="mt-3 grid grid-cols-2 gap-2.5 sm:max-w-xs">
      {(["True", "False"] as const).map((opt) => {
        const active = value === opt;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            aria-pressed={active}
            className={
              "min-h-[48px] rounded-2xl border-2 px-4 text-[15px] font-extrabold transition active:scale-[0.98] " +
              (active
                ? "border-lilac-deep bg-lilac-deep text-white shadow-[0_10px_22px_-14px_rgba(110,63,151,0.9)]"
                : "border-lilac-pale bg-paper text-ink hover:border-lilac")
            }
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

function MCInput({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="mt-3 grid gap-2 sm:grid-cols-2">
      {options.map((opt) => {
        const active = value === opt;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            aria-pressed={active}
            className={
              "flex min-h-[48px] items-center justify-between gap-2 rounded-2xl border-2 px-4 py-2.5 text-left text-[15.5px] font-semibold transition active:scale-[0.98] " +
              (active
                ? "border-lilac-deep bg-lilac-deep text-white shadow-[0_10px_22px_-14px_rgba(110,63,151,0.9)]"
                : "border-lilac-pale bg-paper text-ink hover:border-lilac")
            }
          >
            <span>{opt}</span>
            {active && <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-peach" />}
          </button>
        );
      })}
    </div>
  );
}

function TextInput({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Write your answer"
      aria-label={`Part ${label} answer`}
      autoComplete="off"
      autoCapitalize="none"
      spellCheck={false}
      className="mt-3 min-h-[48px] w-full rounded-2xl border-2 border-lilac-pale bg-paper px-4 py-3 text-[16px] font-semibold text-ink placeholder:font-normal placeholder:text-ink-soft/60 focus:border-lilac focus:bg-white focus:outline-none"
    />
  );
}

function OrderInput({
  item,
  value,
  onChange,
}: {
  item: OrderItem;
  value: string;
  onChange: (v: string) => void;
}) {
  const chosen = value ? value.split("|").filter(Boolean) : [];
  const chosenCounts = new Map<string, number>();
  chosen.forEach((w) => chosenCounts.set(w, (chosenCounts.get(w) ?? 0) + 1));

  const remaining: string[] = [];
  const seenCounts = new Map<string, number>();
  for (const w of item.words) {
    const used = chosenCounts.get(w) ?? 0;
    const seen = seenCounts.get(w) ?? 0;
    if (seen < used) {
      seenCounts.set(w, seen + 1);
    } else {
      remaining.push(w);
    }
  }

  const pick = (word: string) => onChange([...chosen, word].join("|"));
  const unpick = (idx: number) => onChange(chosen.filter((_, i) => i !== idx).join("|"));
  const clear = () => onChange("");

  return (
    <div className="mt-3 space-y-3">
      {/* Sentence slot */}
      <div className="flex min-h-[56px] flex-wrap items-center gap-2 rounded-2xl border-2 border-dashed border-lilac bg-lavender/60 px-3 py-2.5">
        {chosen.length === 0 ? (
          <span className="text-[14px] text-ink-soft">Tap the words below in the right order…</span>
        ) : (
          chosen.map((w, i) => (
            <button
              key={`${w}-${i}`}
              type="button"
              onClick={() => unpick(i)}
              className="pop rounded-xl bg-lilac-deep px-3 py-2 text-[15px] font-extrabold text-white transition active:scale-95"
              title="Tap to remove"
            >
              {w}
            </button>
          ))
        )}
      </div>

      {/* Word tiles */}
      <div className="flex flex-wrap items-center gap-2">
        {remaining.map((w, i) => (
          <button
            key={`${w}-${i}`}
            type="button"
            onClick={() => pick(w)}
            className="min-h-[44px] rounded-xl border-2 border-lilac-pale bg-white px-3.5 py-2 text-[15px] font-bold text-ink transition hover:border-lilac active:scale-95"
          >
            {w}
          </button>
        ))}
        {chosen.length > 0 && (
          <button
            type="button"
            onClick={clear}
            className="ml-auto rounded-xl px-3 py-2 text-[13px] font-extrabold text-lilac-deep hover:bg-blush"
          >
            Reset
          </button>
        )}
      </div>
    </div>
  );
}
