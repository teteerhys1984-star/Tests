import { PASSAGES, type Part, type Question, type StudentPartAnswer } from "@/data/exam";

const LETTERS = ["A", "B", "C", "D", "E"];

function PassageBlock({ id }: { id: "p1" | "p2" }) {
  const p = PASSAGES[id];
  return (
    <section className="mb-6 overflow-hidden rounded-[22px] border border-hair bg-white shadow-card">
      <div className="flex items-center gap-3 border-b border-hair bg-gradient-to-r from-electric/10 to-turquoise/10 px-4 py-3 sm:px-6">
        <span className="h-6 w-1.5 shrink-0 rounded-full bg-electric" aria-hidden="true" />
        <h2 className="font-display text-[17px] font-extrabold leading-tight sm:text-[19px]">{p.title}</h2>
        <span className="ml-auto hidden rounded-full bg-white px-2.5 py-1 text-[11px] font-black uppercase tracking-wider text-ink/50 sm:inline-block">
          Read first
        </span>
      </div>
      <div className="reading px-4 py-5 sm:px-6 sm:py-6">
        {p.blocks.map((b, i) => (
          <p key={i} className={i === 0 ? "" : "mt-4"}>
            {b}
          </p>
        ))}
        {p.bullets && (
          <ul className="mt-4 space-y-1.5 border-l-4 border-turquoise pl-4">
            {p.bullets.map((b) => (
              <li key={b} className="italic">
                {b}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function McPart({
  part,
  index,
  value,
  onChange,
  qid,
}: {
  part: Extract<Part, { kind: "mc" }>;
  index: number;
  value: StudentPartAnswer;
  onChange: (v: number) => void;
  qid: number;
}) {
  const selected = typeof value === "number" ? value : null;
  return (
    <div className="min-w-0">
      {part.stem && (
        <p className="mb-2.5 text-[16px] font-semibold leading-relaxed text-ink sm:text-[17px]">
          <span className="mr-2 inline-grid h-6 min-w-6 place-items-center rounded-md bg-paper px-1 text-[12px] font-black tabular-nums text-ink/55 align-middle">
            {index + 1}
          </span>
          {part.stem}
        </p>
      )}
      <div className="flex flex-col gap-2.5" role="radiogroup" aria-label={`Question ${qid} part ${index + 1}`}>
        {part.options.map((opt, i) => {
          const active = selected === i;
          return (
            <button
              key={i}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(i)}
              className={[
                "flex min-h-14 w-full items-start gap-3 rounded-2xl border-2 px-3.5 py-3 text-left transition sm:px-4",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-electric",
                active
                  ? "border-electric bg-electric text-white shadow-[0_5px_0_0_#0A3FB8]"
                  : "border-hair bg-white text-ink hover:border-electric/45 hover:bg-electric/[0.04] active:translate-y-px",
              ].join(" ")}
            >
              <span
                className={[
                  "grid h-7 w-7 shrink-0 place-items-center rounded-lg font-display text-[13px] font-black",
                  active ? "bg-white/25 text-white" : "bg-paper text-ink/60",
                ].join(" ")}
              >
                {LETTERS[i]}
              </span>
              <span className="min-w-0 flex-1 text-[15.5px] font-semibold leading-snug sm:text-[16px]">{opt}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function TfPart({
  part,
  index,
  value,
  onChange,
  qid,
}: {
  part: Extract<Part, { kind: "tf" }>;
  index: number;
  value: StudentPartAnswer;
  onChange: (v: boolean) => void;
  qid: number;
}) {
  const selected = typeof value === "boolean" ? value : null;
  return (
    <div className="min-w-0">
      <p className="mb-2.5 text-[16px] font-semibold leading-relaxed text-ink sm:text-[17px]">
        <span className="mr-2 inline-grid h-6 min-w-6 place-items-center rounded-md bg-paper px-1 text-[12px] font-black tabular-nums text-ink/55 align-middle">
          {index + 1}
        </span>
        {part.stem}
      </p>
      <div className="flex gap-3" role="radiogroup" aria-label={`Question ${qid} part ${index + 1}`}>
        {[true, false].map((v) => {
          const active = selected === v;
          return (
            <button
              key={String(v)}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(v)}
              className={[
                "min-h-14 flex-1 rounded-2xl border-2 font-display text-[16px] font-extrabold uppercase tracking-wide transition",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-electric",
                active
                  ? "border-electric bg-electric text-white shadow-[0_5px_0_0_#0A3FB8]"
                  : "border-hair bg-white text-ink/70 hover:border-electric/45 hover:bg-electric/[0.04]",
              ].join(" ")}
            >
              {v ? "True" : "False"}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function TextPart({
  part,
  index,
  value,
  onChange,
  qid,
}: {
  part: Extract<Part, { kind: "text" }>;
  index: number;
  value: StudentPartAnswer;
  onChange: (v: string) => void;
  qid: number;
}) {
  const v = typeof value === "string" ? value : "";
  return (
    <div className="min-w-0">
      <label
        htmlFor={`q${qid}-p${index}`}
        className="mb-2 block text-[16px] font-semibold leading-relaxed text-ink sm:text-[17px]"
      >
        <span className="mr-2 inline-grid h-6 min-w-6 place-items-center rounded-md bg-paper px-1 text-[12px] font-black tabular-nums text-ink/55 align-middle">
          {index + 1}
        </span>
        {part.stem}
      </label>
      <input
        id={`q${qid}-p${index}`}
        value={v}
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        placeholder="Type your answer"
        onChange={(e) => onChange(e.target.value)}
        className="field"
      />
    </div>
  );
}

function InlineContext({ question, answers, onPart }: { question: Question; answers: StudentPartAnswer[]; onPart: (i: number, v: string) => void }) {
  const ctx = question.context ?? "";
  const chunks = ctx.split(/(\(\d\)\s*_{4,})/g);
  return (
    <div className="reading mb-5 rounded-[22px] border border-hair bg-white px-4 py-5 shadow-card sm:px-6 sm:py-6">
      <p className="leading-[2.1]">
        {chunks.map((chunk, ci) => {
          const m = chunk.match(/^\((\d)\)/);
          if (!m) return <span key={ci}>{chunk}</span>;
          const idx = Number(m[1]) - 1;
          if (idx >= question.parts.length) return <span key={ci}>{chunk}</span>;
          const val = typeof answers[idx] === "string" ? (answers[idx] as string) : "";
          return (
            <span key={ci} className="mx-0.5 inline-flex items-center gap-1 align-baseline">
              <span className="rounded-md bg-electric/10 px-1.5 py-0.5 text-[12px] font-black tabular-nums text-electric">
                {m[1]}
              </span>
              <input
                value={val}
                onChange={(e) => onPart(idx, e.target.value)}
                placeholder="……………"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                aria-label={`Blank ${m[1]}`}
                className="w-[8.5rem] border-0 border-b-2 border-dashed border-electric/45 bg-transparent px-1 py-0.5 text-[16px] font-semibold text-ink placeholder:text-ink/30 focus:border-electric focus:outline-none sm:w-[10rem]"
              />
            </span>
          );
        })}
      </p>
    </div>
  );
}

export default function QuestionCard({
  question,
  answers,
  onPart,
}: {
  question: Question;
  answers: StudentPartAnswer[];
  onPart: (index: number, value: StudentPartAnswer) => void;
}) {
  return (
    <article className="min-w-0 enter">
      {question.passage && <PassageBlock id={question.passage} />}

      <div className="overflow-hidden rounded-[24px] border border-hair bg-white shadow-lift">
        <div className="flex flex-wrap items-center gap-3 border-b border-hair px-4 py-4 sm:px-6">
          <span className="bib" aria-hidden="true">
            {question.id}
          </span>
          <div className="min-w-0 flex-1">
            <span className="block text-[11px] font-black uppercase tracking-[0.16em] text-ink/45">
              {question.typeLabel}
            </span>
            <h2 className="mt-0.5 text-[15.5px] font-bold leading-snug text-ink sm:text-[16.5px]">
              {question.instruction}
            </h2>
          </div>
          <span className="shrink-0 rounded-full bg-sun/25 px-3 py-1.5 font-display text-[13px] font-black tabular-nums text-[#8A6200]">
            {question.marks} {question.marks === 1 ? "mark" : "marks"}
          </span>
        </div>

        <div className="px-4 py-5 sm:px-6 sm:py-6">
          {question.context && question.inline && (
            <InlineContext question={question} answers={answers} onPart={(i, v) => onPart(i, v)} />
          )}
          {question.context && !question.inline && (
            <p className="reading mb-5 rounded-2xl bg-paper px-4 py-4">{question.context}</p>
          )}

          <div className="space-y-6">
            {question.parts.map((p, i) => {
              const base = { index: i, value: answers[i] ?? null, qid: question.id };
              if (p.kind === "mc")
                return <McPart key={i} {...base} part={p} onChange={(v) => onPart(i, v)} />;
              if (p.kind === "tf")
                return <TfPart key={i} {...base} part={p} onChange={(v) => onPart(i, v)} />;
              return <TextPart key={i} {...base} part={p} onChange={(v) => onPart(i, v)} />;
            })}
          </div>
        </div>
      </div>
    </article>
  );
}
