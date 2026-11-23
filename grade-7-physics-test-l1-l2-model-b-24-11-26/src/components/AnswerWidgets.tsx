/**
 * عناصر إدخال الإجابة لكل نوع فرع — بلا أي كشف للإجابة الصحيحة.
 * تصميم المصدر حرفياً: الحرف والتسمية، أزرار الخيارات، حقل العدد مع الوحدة المعروضة،
 * حقل الصيغة، وحقل الإجابة القصيرة. كل عنصر يحمل `data-part-id` وبداخله `data-opt-id` للخيارات.
 */

import { Check } from "lucide-react";
import type { Part } from "../exam/types";
import { MathText, richToPlain, Rich } from "../lib/mathx";
import { partLetter } from "../lib/grading";

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
    <div className="options-list" role="group" aria-label={plainLabel(part)} data-part-id={part.id}>
      {(part.options ?? []).map((option) => (
        <button
          key={option.id}
          type="button"
          className={`answer-option ${value === option.id ? "is-selected" : ""}`}
          data-opt-id={option.id}
          aria-pressed={value === option.id}
          onClick={() => onChange(value === option.id ? "" : option.id)}
        >
          <span className="option-indicator" aria-hidden="true">
            {value === option.id && <Check size={13} strokeWidth={3} />}
          </span>
          <span>{option.latex ? <MathText tex={option.latex} /> : option.label}</span>
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
    <div className="number-answer" data-part-id={part.id}>
      <input
        id={`answer-${part.id}`}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        dir="ltr"
        value={value}
        placeholder="العدد"
        aria-label={plainLabel(part)}
        onChange={(event) => onChange(event.target.value)}
      />
      {part.suffix && <span className="input-suffix"><MathText tex={part.suffix} /></span>}
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
        id={`answer-${part.id}`}
        type="text"
        dir="ltr"
        autoComplete="off"
        className="text-answer formula-answer"
        value={value}
        placeholder={part.placeholder}
        aria-label={plainLabel(part)}
        onChange={(event) => onChange(event.target.value)}
      />
      <p className="formula-note">اكتبي القانون بالرموز اللاتينية (w, m, g) أو بكلماتها العربية.</p>
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
        id={`answer-${part.id}`}
        className="text-answer short-answer"
        rows={2}
        value={value}
        placeholder={part.placeholder}
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

/** عنوان الفرع: حرفه + نصّه. */
export function PartHeading({ part, index }: { part: Part; index: number }) {
  return (
    <div className="part-heading">
      <span className="part-letter" aria-hidden="true">{partLetter(index)}</span>
      <h3 id={`label-${part.id}`}><Rich content={part.label} /></h3>
    </div>
  );
}

/** نصّ صرف من أجزاء RichText — للسمات الدلالية فقط (aria-label). */
export function plainLabel(part: Part): string {
  return richToPlain(part.label);
}
