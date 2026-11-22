/**
 * عناصر إدخال الإجابة لكل نوع حقل — بلا أي كشف للإجابة الصحيحة.
 * كل عنصر يحمل `data-part-id` و`data-input-id` لتتمكّن الاختبارات الآلية من التحقّق
 * من التغطية الكاملة لكل الفروع والحقول.
 */

import type { Input, Part } from "../exam/types";
import { FIGURE_CHOICE_IDS } from "../exam/types";
import { Figure } from "../exam/figures";
import { MathText, MixedText, richToPlain } from "../lib/mathx";
import { partLetter, ANSWER_KEYS } from "../lib/grading";

const CHOICE_LETTERS = ["أ", "ب", "ج", "د", "هـ"];

/** نصّ صرف من نصّ قد يحوي $...$ — للسمات الدلالية فقط. */
export function plainLabel(part: Part): string {
  return richToPlain(part.label);
}

type WidgetProps = {
  input: Input;
  value: (key: string) => string;
  set: (key: string, value: string) => void;
};

/* ------------------------------------------------------------------ */
/* اختيار من متعدد                                                    */
/* ------------------------------------------------------------------ */

function ChoiceField({ input, value, set }: WidgetProps & { input: Extract<Input, { kind: "choice" }> }) {
  const selected = value(input.id);
  const withFigures = input.options.some((option) => option.diagram && FIGURE_CHOICE_IDS.has(option.diagram));
  return (
    <div
      className={withFigures ? "grid gap-2.5 sm:grid-cols-2" : "grid gap-2"}
      role="radiogroup"
      aria-label={richToPlain(input.prompt) || "اختر الإجابة"}
      data-part-id={input.id}
      data-input-id={input.id}
      data-input-kind="choice"
    >
      {input.options.map((option, index) => {
        const on = selected === option.id;
        return (
          <button
            key={option.id}
            type="button"
            className="chip"
            data-opt-id={option.id}
            data-on={on ? "1" : "0"}
            role="radio"
            aria-checked={on}
            onClick={() => set(input.id, on ? "" : option.id)}
          >
            <span className="chip-dot" aria-hidden />
            <span className="badge badge-mute !px-1.5" style={{ minWidth: 26, justifyContent: "center" }}>
              {CHOICE_LETTERS[index] ?? String(index + 1)}
            </span>
            <span className="min-w-0 flex-1">
              {option.diagram ? (
                <span className="figure-option">
                  <span className="text-[0.86rem] font-bold" style={{ color: "var(--ink-2)" }}>
                    {option.label}
                  </span>
                  <span className="rounded-[var(--r-xs)] bg-white p-1">
                    <Figure type={option.diagram} />
                  </span>
                </span>
              ) : (
                <MixedText as="span" text={option.label} />
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* إجابة قصيرة                                                        */
/* ------------------------------------------------------------------ */

function TextField({ input, value, set }: WidgetProps & { input: Extract<Input, { kind: "text" }> }) {
  return (
    <div data-part-id={input.id} data-input-id={input.id} data-input-kind="text">
      <textarea
        className="field"
        rows={input.rows ?? 3}
        value={value(input.id)}
        placeholder={input.placeholder ?? "اكتبي إجابتك بأسلوبك"}
        aria-label={richToPlain(input.prompt) || "إجابة قصيرة"}
        onChange={(event) => set(input.id, event.target.value)}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* إجابة عددية                                                        */
/* ------------------------------------------------------------------ */

function NumberField({ input, value, set }: WidgetProps & { input: Extract<Input, { kind: "number" }> }) {
  return (
    <div className="grid gap-2" data-part-id={input.id} data-input-id={input.id} data-input-kind="number">
      {input.requiresSteps && (
        <label className="block">
          <span className="mb-1 block text-[0.82rem] font-bold" style={{ color: "var(--ink-3)" }}>
            خطوة الحل (التعويض):
          </span>
          <textarea
            className="field !min-h-[64px]"
            rows={2}
            value={value(ANSWER_KEYS.steps(input.id))}
            placeholder="مثال: v = d ÷ t = 27 ÷ 0.5"
            aria-label="خطوة الحل للفرع"
            data-step-field={input.id}
            onChange={(event) => set(ANSWER_KEYS.steps(input.id), event.target.value)}
          />
        </label>
      )}
      <div className="flex flex-wrap items-end gap-2">
        <label className="min-w-[8rem] flex-1">
          <span className="mb-1 block text-[0.82rem] font-bold" style={{ color: "var(--ink-3)" }}>
            النتيجة العددية
          </span>
          <input
            className="field field-math"
            dir="ltr"
            inputMode="decimal"
            autoComplete="off"
            type="text"
            value={value(ANSWER_KEYS.value(input.id))}
            placeholder="العدد"
            aria-label={`النتيجة العددية — ${richToPlain(input.prompt) || "الفرع"}`}
            data-value-field={input.id}
            onChange={(event) => set(ANSWER_KEYS.value(input.id), event.target.value)}
          />
        </label>
        {input.unitOptions && (
          <label className="w-32 shrink-0">
            <span className="mb-1 block text-[0.82rem] font-bold" style={{ color: "var(--ink-3)" }}>
              الوحدة
            </span>
            <select
              className="field"
              value={value(ANSWER_KEYS.unit(input.id))}
              aria-label="وحدة النتيجة"
              data-unit-field={input.id}
              onChange={(event) => set(ANSWER_KEYS.unit(input.id), event.target.value)}
            >
              <option value="">اختيار</option>
              {input.unitOptions.map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* صح أو خطأ                                                          */
/* ------------------------------------------------------------------ */

function TrueFalseField({ input, value, set }: WidgetProps & { input: Extract<Input, { kind: "tf" }> }) {
  const verdict = value(ANSWER_KEYS.verdict(input.id));
  return (
    <div data-part-id={input.id} data-input-id={input.id} data-input-kind="tf">
      <p
        className="mb-2 rounded-[var(--r-sm)] border p-2.5 text-[0.94rem] leading-relaxed"
        style={{ borderColor: "var(--line-soft)", background: "var(--surface-2)" }}
      >
        <MixedText text={input.statement} />
      </p>
      <div className="flex gap-2" role="group" aria-label="حكم العبارة">
        {[
          { id: "true", label: "صحيحة" },
          { id: "false", label: "خاطئة" },
        ].map((option) => {
          const on = verdict === option.id;
          return (
            <button
              key={option.id}
              type="button"
              className="chip flex-1"
              data-verdict={option.id}
              data-on={on ? "1" : "0"}
              aria-pressed={on}
              onClick={() => set(ANSWER_KEYS.verdict(input.id), on ? "" : option.id)}
            >
              <span className="chip-dot" aria-hidden />
              <span className="font-bold">{option.label}</span>
            </button>
          );
        })}
      </div>
      {verdict === "false" && input.allowsCorrection && (
        <label className="mt-2 block">
          <span className="mb-1 block text-[0.82rem] font-bold" style={{ color: "var(--ink-3)" }}>
            صحّحي العبارة:
          </span>
          <textarea
            className="field !min-h-[64px]"
            rows={2}
            value={value(ANSWER_KEYS.correction(input.id))}
            placeholder="العبارة الصحيحة هي…"
            aria-label="تصحيح العبارة"
            data-correction-field={input.id}
            onChange={(event) => set(ANSWER_KEYS.correction(input.id), event.target.value)}
          />
        </label>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* تصنيف صفوف على أعمدة                                               */
/* ------------------------------------------------------------------ */

function MatrixField({ input, value, set }: WidgetProps & { input: Extract<Input, { kind: "matrix" }> }) {
  return (
    <div data-part-id={input.id} data-input-id={input.id} data-input-kind="matrix">
      <div className="overflow-hidden rounded-[var(--r-sm)] border" style={{ borderColor: "var(--line-soft)" }}>
        <div
          className="hidden gap-2 px-2.5 py-1.5 text-[0.8rem] font-bold sm:grid"
          style={{
            gridTemplateColumns: `minmax(0,1.15fr) repeat(${input.columns.length}, minmax(0,1fr))`,
            background: "var(--surface-2)",
            color: "var(--navy)",
          }}
        >
          <span>الحالة</span>
          {input.columns.map((column) => (
            <span key={column.id} className="text-center">
              {column.label}
            </span>
          ))}
        </div>
        {input.rows.map((row, rowIndex) => {
          const current = value(ANSWER_KEYS.matrixRow(input.id, row.id));
          return (
            <div
              key={row.id}
              className="border-t px-2.5 py-2"
              style={{ borderColor: "var(--line-soft)", background: rowIndex % 2 ? "#fff" : "var(--surface-2)" }}
              data-matrix-row={row.id}
            >
              <div
                className="grid gap-2 sm:items-center"
                style={{ gridTemplateColumns: `minmax(0,1.15fr) repeat(${input.columns.length}, minmax(0,1fr))` }}
              >
                <p className="text-[0.9rem] leading-relaxed">
                  <MixedText text={row.label} />
                </p>
                <div
                  className="grid gap-1.5 sm:col-span-full"
                  style={{ gridTemplateColumns: `repeat(${input.columns.length}, minmax(0,1fr))` }}
                >
                  {input.columns.map((column) => {
                    const on = current === column.id;
                    return (
                      <button
                        key={column.id}
                        type="button"
                        className="matrix-chip"
                        data-col-id={column.id}
                        data-on={on ? "1" : "0"}
                        aria-pressed={on}
                        aria-label={`${row.label}: ${column.label}`}
                        onClick={() => set(ANSWER_KEYS.matrixRow(input.id, row.id), on ? "" : column.id)}
                      >
                        {column.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* الحقل الموحّد                                                      */
/* ------------------------------------------------------------------ */

export function AnswerWidget({ input, value, set }: WidgetProps) {
  switch (input.kind) {
    case "choice":
      return <ChoiceField input={input} value={value} set={set} />;
    case "text":
      return <TextField input={input} value={value} set={set} />;
    case "number":
      return <NumberField input={input} value={value} set={set} />;
    case "tf":
      return <TrueFalseField input={input} value={value} set={set} />;
    case "matrix":
      return <MatrixField input={input} value={value} set={set} />;
  }
}

/** عنوان الفرع: حرفه + نصّه. */
export function PartHeading({ part, index }: { part: Part; index: number }) {
  return (
    <div className="mb-2 flex items-start gap-2.5">
      <span
        className="grid h-8 w-8 shrink-0 place-items-center rounded-[var(--r-xs)] text-base font-bold"
        style={{ background: "var(--gold-soft)", color: "var(--gold-deep)" }}
        aria-hidden
      >
        {partLetter(index)}
      </span>
      <p className="min-w-0 flex-1 text-[0.97rem] font-bold leading-relaxed" style={{ color: "var(--navy)" }}>
        <MixedText text={part.label} />
      </p>
    </div>
  );
}

/** عنوان حقول الإدخال داخل الفرع عندما يكون للفرع أكثر من حقل. */
export function InputHeading({ input }: { input: Input }) {
  if (!input.prompt) return null;
  return (
    <p className="mb-1.5 text-[0.9rem] leading-relaxed" style={{ color: "var(--ink-2)" }}>
      <MixedText text={input.prompt} />
    </p>
  );
}

/** نصّ رياضي حقيقي (LTR) — يُصدَّر للاستعمال في العناوين عند الحاجة. */
export { MathText };
