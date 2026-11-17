import { LESSONS, type Part, type Question } from "@/data/exam";
import { isAnswered, seededShuffle } from "@/lib/grading";

interface Props {
  question: Question;
  number: number;
  answers: Record<string, string>;
  onChange: (partId: string, value: string) => void;
}

function MarkBadge({ marks }: { marks: number }) {
  return (
    <span
      className="tabular inline-flex h-7 min-w-7 shrink-0 items-center justify-center rounded-full border-2 border-coral px-1 text-[13px] font-semibold text-coral"
      title={`${marks} mark${marks > 1 ? "s" : ""}`}
    >
      {marks}
    </span>
  );
}

function PartLabel({ label }: { label: string }) {
  return (
    <span className="tabular mr-2 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-sm bg-turq/15 text-xs font-semibold text-turq-deep">
      {label}
    </span>
  );
}

/* ---------------------------- widgets ------------------------------- */

function McqWidget({
  part,
  value,
  onChange,
}: {
  part: Extract<Part, { type: "mcq" }>;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div role="radiogroup" aria-label={part.prompt} className="mt-3 flex flex-col gap-2">
      {part.options.map((opt, i) => {
        const selected = value === opt;
        return (
          <button
            key={opt}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(opt)}
            className={`group flex w-full items-start gap-3 rounded-sm border-2 px-3 py-2.5 text-left transition ${
              selected
                ? "border-turq bg-turq/12 shadow-[2px_2px_0_rgba(14,154,167,0.35)]"
                : "border-ink/12 bg-white hover:border-turq/60 hover:bg-turq/5"
            }`}
          >
            <span
              className={`tabular mt-[1px] flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold ${
                selected ? "border-turq bg-turq text-white" : "border-ink/25 text-ink-soft"
              }`}
            >
              {String.fromCharCode(97 + i)}
            </span>
            <span className="text-[1.02rem] leading-snug text-ink">{opt}</span>
          </button>
        );
      })}
    </div>
  );
}

function TfWidget({
  part,
  value,
  onChange,
}: {
  part: Extract<Part, { type: "tf" }>;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div role="radiogroup" aria-label={part.prompt} className="mt-3 flex flex-wrap gap-3">
      {(["True", "False"] as const).map((opt) => {
        const selected = value === opt;
        return (
          <button
            key={opt}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(opt)}
            className={`min-w-32 flex-1 rounded-sm border-2 px-5 py-3 text-lg font-semibold transition sm:flex-none ${
              selected
                ? opt === "True"
                  ? "border-green bg-green text-white shadow-[3px_3px_0_rgba(30,122,57,0.4)]"
                  : "border-coral bg-coral text-white shadow-[3px_3px_0_rgba(210,74,59,0.4)]"
                : "border-ink/15 bg-white text-ink hover:border-ink/40"
            }`}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

function TextWidget({
  part,
  value,
  onChange,
}: {
  part: Extract<Part, { type: "text" }>;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="mt-3">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={part.placeholder ?? "Write your answer"}
        aria-label={part.prompt}
        className="w-full border-0 border-b-[3px] border-dotted border-turq/70 bg-[#fffef9] px-2 pb-1.5 pt-1 text-lg text-ink outline-none transition focus:border-solid focus:border-bright"
        style={{ fontFamily: "var(--font-body)" }}
      />
    </div>
  );
}

function OrderWidget({
  part,
  value,
  onChange,
}: {
  part: Extract<Part, { type: "order" }>;
  value: string;
  onChange: (v: string) => void;
}) {
  const placed = value ? value.split(" ") : [];
  const bank = seededShuffle(part.words, part.id).filter((w) => !placed.includes(w));

  return (
    <div className="mt-3">
      <div
        className="min-h-[68px] rounded-sm border-2 border-dashed border-turq/60 bg-[#fffef9] p-3"
        aria-label="Your sentence"
      >
        {placed.length === 0 ? (
          <span className="text-sm text-ink-soft">Tap the words below to build your sentence.</span>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            {placed.map((w, i) => (
              <button
                key={`${w}-${i}`}
                type="button"
                onClick={() => onChange(placed.filter((_, j) => j !== i).join(" "))}
                className="rounded-sm border-2 border-turq bg-turq/15 px-2.5 py-1.5 text-base text-ink transition hover:border-coral hover:bg-coral/10"
              >
                {w}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {bank.map((w, i) => (
          <button
            key={`${w}-${i}`}
            type="button"
            onClick={() => onChange([...placed, w].join(" "))}
            className="rounded-sm border-2 border-ink/20 bg-white px-2.5 py-1.5 text-base text-ink transition hover:border-turq hover:bg-turq/10"
          >
            {w}
          </button>
        ))}
        {bank.length === 0 && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="rounded-sm border-2 border-coral/50 bg-coral/10 px-3 py-1.5 text-sm font-semibold text-coral"
          >
            Clear sentence
          </button>
        )}
      </div>
    </div>
  );
}

function RubricWidget({
  part,
  value,
  onChange,
}: {
  part: Extract<Part, { type: "rubric" }>;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="mt-3">
      <textarea
        rows={3}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={part.starter ? `${part.starter}…` : "Write your answer in your own words"}
        aria-label={part.prompt}
        className="w-full resize-y rounded-sm border-2 border-ink/15 bg-[#fffef9] px-3 py-2 text-base text-ink outline-none transition focus:border-bright paper-rules"
        style={{ lineHeight: "32px", fontFamily: "var(--font-body)" }}
      />
      <p className="mt-1.5 text-xs text-ink-soft">
        Marked by your teacher against the lesson rubric.
      </p>
    </div>
  );
}

/* ---------------------------- card ---------------------------------- */

export default function QuestionCard({ question, number, answers, onChange }: Props) {
  const lesson = LESSONS[question.lesson];
  const totalMarks = question.parts.reduce((s, p) => s + p.marks, 0);

  return (
    <article className="paper-card anim-slide relative rounded-sm">
      {/* header */}
      <header
        className="flex flex-wrap items-center gap-3 border-b-2 border-dotted border-ink/20 px-4 py-3 md:px-7"
        style={{ background: `linear-gradient(90deg, ${lesson.color}18, transparent 65%)` }}
      >
        <span
          className="tabular flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white shadow-[0_2px_0_rgba(44,42,38,0.35)]"
          style={{ backgroundColor: lesson.color }}
        >
          {number}
        </span>
        <div className="min-w-0 flex-1">
          <p className="label-caps" style={{ color: lesson.colorDeep }}>
            Lesson {lesson.no} · {lesson.title}
          </p>
          <p className="truncate text-[13px] text-ink-soft" title={question.ref}>
            {question.ref}
          </p>
        </div>
        <span className="label-caps rounded-full border-2 border-ink/15 px-2.5 py-1 text-ink-soft">
          {totalMarks} {totalMarks === 1 ? "mark" : "marks"}
        </span>
      </header>

      <div className="px-4 py-5 md:px-7 md:py-6">
        {question.passage && (
          <section className="mb-5 rounded-sm border-l-[5px] border-turq bg-[#f2fbfc] p-4">
            <p className="label-caps text-turq-deep">{question.passage.title}</p>
            <div className="mt-2 space-y-2.5">
              {question.passage.body.map((para, i) => (
                <p key={i} className="text-[1.02rem] leading-[1.75] text-ink">
                  {para}
                </p>
              ))}
            </div>
          </section>
        )}

        {question.table && (
          <section className="mb-5 overflow-x-auto rounded-sm border-2 border-turq/40 bg-white">
            <p className="label-caps border-b-2 border-turq/40 bg-turq/10 px-3 py-2 text-turq-deep">
              {question.table.caption}
            </p>
            <table className="w-full min-w-[420px] border-collapse text-left text-[0.95rem]">
              <thead>
                <tr>
                  {question.table.headers.map((h) => (
                    <th
                      key={h}
                      className="label-caps border-b border-paper-edge px-3 py-2 text-ink-soft"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {question.table.rows.map((row, i) => (
                  <tr key={i} className={i % 2 ? "bg-paper/70" : ""}>
                    {row.map((cell, j) => (
                      <td key={j} className="border-b border-paper-edge px-3 py-2 text-ink">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {question.note && (
          <p className="mb-5 rounded-sm bg-yellow/25 px-3 py-2 text-[0.95rem] text-ink">
            <span className="label-caps mr-2 text-ink-soft">Reading note</span>
            {question.note}
          </p>
        )}

        {question.stem && (
          <p className="mb-4 text-[1.15rem] font-semibold leading-snug text-ink">{question.stem}</p>
        )}

        <ol className="space-y-6">
          {question.parts.map((part) => (
            <li key={part.id} className="border-t border-dotted border-ink/15 pt-4 first:border-0 first:pt-0">
              <div className="flex items-start gap-2">
                <div className="flex min-w-0 flex-1 items-start">
                  <PartLabel label={part.label} />
                  <p className="text-[1.05rem] leading-snug text-ink">
                    {part.type === "mcq" && part.lead && (
                      <span className="mr-2 rounded-sm bg-purple/15 px-1.5 py-0.5 font-semibold text-purple">
                        {part.lead}
                      </span>
                    )}
                    {part.prompt}
                  </p>
                </div>
                <MarkBadge marks={part.marks} />
              </div>

              {part.type === "mcq" && (
                <McqWidget part={part} value={answers[part.id] ?? ""} onChange={(v) => onChange(part.id, v)} />
              )}
              {part.type === "tf" && (
                <TfWidget part={part} value={answers[part.id] ?? ""} onChange={(v) => onChange(part.id, v)} />
              )}
              {part.type === "text" && (
                <TextWidget part={part} value={answers[part.id] ?? ""} onChange={(v) => onChange(part.id, v)} />
              )}
              {part.type === "order" && (
                <OrderWidget part={part} value={answers[part.id] ?? ""} onChange={(v) => onChange(part.id, v)} />
              )}
              {part.type === "rubric" && (
                <RubricWidget part={part} value={answers[part.id] ?? ""} onChange={(v) => onChange(part.id, v)} />
              )}

              <p className="mt-2 flex items-center gap-2 text-[11px] text-ink-soft">
                <span
                  className={`inline-block h-2 w-2 rounded-full ${
                    isAnswered(part, answers[part.id]) ? "bg-green" : "bg-ink/25"
                  }`}
                />
                {isAnswered(part, answers[part.id]) ? "Answered" : "Not answered yet"}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </article>
  );
}
