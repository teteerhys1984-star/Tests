/**
 * عناصر إدخال الإجابة لكل نوع فرع — بلا أي كشف للإجابة الصحيحة.
 * كل عنصر يحمل `data-part-id` لتتمكّن الاختبارات الآلية من التحقّق من التغطية الكاملة.
 */

import type { Part } from "../exam/types";
import { MathText, richToPlain, Rich } from "../lib/mathx";
import { partLetter } from "../lib/grading";

const CHOICE_LETTERS = ["أ", "ب", "ج", "د"];

export function ChoiceField({
  part,
  value,
  onChange,
}: {
  part: Part;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="grid gap-2" role="radiogroup" aria-label={plainLabel(part)} data-part-id={part.id}>
      {(part.options ?? []).map((option, index) => (
        <button
          key={option.id}
          type="button"
          className="chip"
          data-opt-id={option.id}
          data-on={value === option.id ? "1" : "0"}
          role="radio"
          aria-checked={value === option.id}
          onClick={() => onChange(value === option.id ? "" : option.id)}
        >
          <span className="chip-dot" aria-hidden />
          <span className="badge badge-mute !px-1.5" style={{ minWidth: 26, justifyContent: "center" }}>
            {CHOICE_LETTERS[index] ?? String(index + 1)}
          </span>
          <span className="min-w-0">{option.latex ? <MathText tex={option.latex} /> : option.label}</span>
        </button>
      ))}
    </div>
  );
}

export function NumberField({
  part,
  value,
  onChange,
}: {
  part: Part;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex items-center gap-2" data-part-id={part.id}>
      <input
        className="field field-math"
        dir="ltr"
        inputMode="decimal"
        autoComplete="off"
        type="text"
        value={value}
        placeholder="العدد"
        aria-label={plainLabel(part)}
        onChange={(event) => onChange(event.target.value)}
      />
      {part.suffix && (
        <span className="badge badge-teal shrink-0" style={{ fontSize: "0.9rem" }} dir="ltr">
          <MathText tex={part.suffix} />
        </span>
      )}
    </div>
  );
}

export function FormulaField({
  part,
  value,
  onChange,
}: {
  part: Part;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div data-part-id={part.id}>
      <input
        className="field field-math !text-start"
        dir="ltr"
        autoComplete="off"
        type="text"
        value={value}
        placeholder={part.placeholder ?? "w = m × g"}
        aria-label={plainLabel(part)}
        onChange={(event) => onChange(event.target.value)}
      />
      <p className="mt-1 text-[0.75rem]" style={{ color: "var(--ink-3)" }}>
        اكتبي القانون بالرموز اللاتينية (w, m, g) أو بكلماتها العربية.
      </p>
    </div>
  );
}

export function ShortField({
  part,
  value,
  onChange,
}: {
  part: Part;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div data-part-id={part.id}>
      <textarea
        className="field"
        value={value}
        rows={2}
        placeholder={part.placeholder ?? "اكتبي إجابتك هنا بأسلوبك"}
        aria-label={plainLabel(part)}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

export function AnswerWidget({
  part,
  value,
  onChange,
}: {
  part: Part;
  value: string;
  onChange: (value: string) => void;
}) {
  switch (part.type) {
    case "choice":
      return <ChoiceField part={part} value={value} onChange={onChange} />;
    case "number":
      return <NumberField part={part} value={value} onChange={onChange} />;
    case "formula":
      return <FormulaField part={part} value={value} onChange={onChange} />;
    case "short":
      return <ShortField part={part} value={value} onChange={onChange} />;
  }
}

/** عنوان الفرع: حرفه + نصّه + علامته. */
export function PartHeading({ part, index, done }: { part: Part; index: number; done: boolean }) {
  return (
    <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
      <div className="flex min-w-0 flex-1 items-start gap-2.5">
        <span
          className="grid h-8 w-8 shrink-0 place-items-center rounded-[var(--r-xs)] text-base font-bold"
          style={{
            background: done ? "var(--teal)" : "var(--gold-soft)",
            color: done ? "#fff" : "var(--gold-deep)",
          }}
          aria-hidden
        >
          {partLetter(index)}
        </span>
        <p className="min-w-0 flex-1 text-[0.97rem] leading-relaxed">
          <Rich content={part.label} />
        </p>
      </div>
    </div>
  );
}

/** نصّ صرف من أجزاء RichText — للسمات الدلالية فقط (aria-label / data). */
export function plainLabel(part: Part): string {
  return richToPlain(part.label);
}
