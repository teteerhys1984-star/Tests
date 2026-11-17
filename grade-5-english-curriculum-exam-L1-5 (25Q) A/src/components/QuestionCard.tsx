import type { Item, Question } from "@/data/exam";
import { PASSAGES } from "@/data/exam";

interface Props {
  q: Question;
  answers: Record<string, string>;
  onAnswer: (key: string, value: string) => void;
}

const keyOf = (qId: string, iId: string) => `${qId}/${iId}`;

export default function QuestionCard({ q, answers, onAnswer }: Props) {
  const passage = q.passage ? PASSAGES[q.passage] : null;

  return (
    <article className="settle relative">
      {/* question number medallion */}
      <div className="flex items-start gap-3 sm:gap-4">
        <span className="num grid h-12 w-12 shrink-0 place-items-center rounded-full border-[3px] border-lilac bg-white font-display text-[22px] font-black text-lilac-deep shadow-[0_8px_18px_-12px_rgba(110,63,151,0.9)] sm:h-14 sm:w-14 sm:text-[26px]">
          {q.n}
        </span>
        <div className="min-w-0 pt-1">
          <p className="eyebrow text-lilac">Question {q.n} of 25 · 4 marks</p>
          <h2 className="mt-1 text-[16px] font-extrabold leading-snug text-ink sm:text-[18px]">
            {q.instruction}
          </h2>
        </div>
      </div>

      {passage && (
        <figure className="mt-5 overflow-hidden rounded-[24px] border border-lilac-pale bg-lavender">
          <figcaption className="flex flex-wrap items-center justify-between gap-2 border-b border-white/70 bg-white/70 px-4 py-2.5">
            <span className="eyebrow text-lilac-deep">{passage.label}</span>
            <span className="text-[11px] font-semibold text-ink-soft">{passage.origin}</span>
          </figcaption>
          <div className="paper-grid px-4 py-4 sm:px-6 sm:py-5">
            <p className="text-[16px] leading-[1.85] text-ink sm:text-[17px] [&>span:first-child]:float-left [&>span:first-child]:mr-2 [&>span:first-child]:font-display [&>span:first-child]:text-[46px] [&>span:first-child]:font-black [&>span:first-child]:leading-[0.8] [&>span:first-child]:text-lilac-deep">
              <span>{passage.text.slice(0, 1)}</span>
              {passage.text.slice(1)}
            </p>
          </div>
        </figure>
      )}

      {q.table && <DataTable head={q.table.head} rows={q.table.rows} />}

      <div className="mt-5 space-y-4">
        {q.items.map((item, idx) => (
          <div
            key={item.id}
            className="rounded-[22px] border border-lilac-pale bg-white p-4 shadow-[0_16px_36px_-32px_rgba(110,63,151,0.9)] sm:p-5"
          >
            <div className="flex items-start gap-3">
              <span className="num mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-lavender text-[13px] font-extrabold text-lilac-deep">
                {String.fromCharCode(97 + idx)}
              </span>
              <p className="min-w-0 flex-1 text-[15.5px] font-bold leading-relaxed text-ink sm:text-[16.5px]">
                {item.prompt}
              </p>
              <span className="num hidden shrink-0 rounded-full bg-peach-pale px-2 py-1 text-[11px] font-extrabold text-[#b4593a] sm:block">
                {item.marks} {item.marks === 1 ? "mark" : "marks"}
              </span>
            </div>
            <div className="mt-2 sm:hidden">
              <span className="num inline-block rounded-full bg-peach-pale px-2.5 py-1 text-[11px] font-extrabold text-[#b4593a]">
                {item.marks} {item.marks === 1 ? "mark" : "marks"}
              </span>
            </div>
            <div className="mt-3 pl-0 sm:pl-10">
              <Control
                item={item}
                value={answers[keyOf(q.id, item.id)] ?? ""}
                onChange={(v) => onAnswer(keyOf(q.id, item.id), v)}
              />
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}

function Control({
  item,
  value,
  onChange,
}: {
  item: Item;
  value: string;
  onChange: (v: string) => void;
}) {
  if (item.kind === "tf") {
    return (
      <div className="flex gap-3">
        {(["True", "False"] as const).map((opt) => {
          const on = value === opt;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(opt)}
              aria-pressed={on}
              className={
                "min-h-[48px] flex-1 rounded-2xl border-2 px-4 text-[16px] font-extrabold transition active:scale-[0.98] " +
                (on
                  ? "border-lilac-deep bg-lilac-deep text-white"
                  : "border-lilac-pale bg-paper text-ink-soft hover:border-lilac")
              }
            >
              {opt}
            </button>
          );
        })}
      </div>
    );
  }

  if (item.kind === "mc") {
    const letters = ["A", "B", "C", "D", "E"];
    return (
      <div className="flex flex-col gap-2.5">
        {item.options.map((opt, i) => {
          const on = value === opt;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(opt)}
              aria-pressed={on}
              className={
                "flex min-h-[52px] w-full items-center gap-3 rounded-2xl border-2 px-3 py-3 text-left transition active:scale-[0.99] " +
                (on
                  ? "border-lilac-deep bg-lavender shadow-[0_10px_24px_-18px_rgba(110,63,151,1)]"
                  : "border-lilac-pale bg-paper hover:border-lilac")
              }
            >
              <span
                className={
                  "num grid h-7 w-7 shrink-0 place-items-center rounded-full text-[12px] font-extrabold " +
                  (on ? "bg-lilac-deep text-white" : "bg-white text-lilac ring-1 ring-lilac-pale")
                }
              >
                {letters[i]}
              </span>
              <span
                className={
                  "flex-1 text-[15.5px] font-bold " + (on ? "text-lilac-deep" : "text-ink")
                }
              >
                {opt}
              </span>
              {on && <TickDot />}
            </button>
          );
        })}
      </div>
    );
  }

  if (item.kind === "order") {
    const selected = value.split("|").filter(Boolean);
    const used = new Set(selected);
    const remaining = item.words.filter((w, i) => {
      const firstIdx = item.words.indexOf(w);
      if (firstIdx !== i) return false;
      return !used.has(w);
    });
    return (
      <div className="space-y-3">
        <div className="flex min-h-[56px] flex-wrap items-center gap-2 rounded-2xl border-2 border-dashed border-lilac bg-paper p-2.5">
          {selected.length === 0 && (
            <span className="px-1 text-[13.5px] font-semibold text-ink-soft/70">
              Tap the words below in the correct order…
            </span>
          )}
          {selected.map((w, i) => (
            <button
              key={`${w}-${i}`}
              type="button"
              onClick={() => onChange(selected.filter((_, j) => j !== i).join("|"))}
              className="min-h-[42px] rounded-xl border border-lilac-pale bg-white px-3 text-[15px] font-extrabold text-lilac-deep shadow-sm transition active:scale-95"
            >
              {w}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {remaining.map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => onChange([...selected, w].join("|"))}
              className="min-h-[46px] rounded-xl border-2 border-lilac-pale bg-lavender px-3.5 text-[15px] font-bold text-ink transition hover:border-lilac active:scale-95"
            >
              {w}
            </button>
          ))}
          {remaining.length === 0 && (
            <button
              type="button"
              onClick={() => onChange("")}
              className="min-h-[46px] rounded-xl border-2 border-peach-pale bg-peach-pale px-3.5 text-[14px] font-extrabold text-[#b4593a]"
            >
              Clear and start again
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <input
      type="text"
      inputMode="text"
      autoCapitalize="sentences"
      autoComplete="off"
      spellCheck={false}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Write your answer"
      className="min-h-[52px] w-full rounded-2xl border-2 border-lilac-pale bg-paper px-4 py-3 text-[16px] font-semibold text-ink placeholder:font-normal placeholder:text-ink-soft/55 focus:border-lilac focus:bg-white focus:outline-none"
    />
  );
}

function TickDot() {
  return (
    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-turquoise text-white">
      <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
        <path
          d="M5 12.6l4.4 4.4L19 7"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

/** Narrow-screen friendly data table: scrolls inside itself, never the page. */
function DataTable({ head, rows }: { head: string[]; rows: string[][] }) {
  return (
    <div className="mt-5 overflow-hidden rounded-[22px] border border-lilac-pale bg-white">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[340px] border-collapse text-center">
          <thead>
            <tr className="bg-lavender">
              {head.map((h) => (
                <th
                  key={h}
                  scope="col"
                  className="whitespace-nowrap border-b-2 border-white px-3 py-2.5 text-[12px] font-extrabold uppercase tracking-[0.1em] text-lilac-deep"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className={i % 2 ? "bg-paper" : "bg-white"}>
                {r.map((c, j) => (
                  <td
                    key={j}
                    className={
                      "num border-b border-lilac-pale px-3 py-2.5 text-[14.5px] " +
                      (j === 0 ? "font-extrabold text-ink" : "font-semibold text-ink-soft")
                    }
                  >
                    {c}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
