/**
 * عناصر إدخال الإجابة لكل نوع حقل — بهوية المصدر الأصلي
 * (grade-7-physics-test-Model-A-24-11-26/src/components/inputs.tsx):
 * أزرار الخيارات الدائرية، بطاقة صح/خطأ، حقول الإدخال بحدود وردية،
 * جدول التصنيف، وبطاقة الفرع بحرفها وشارة علاماتها.
 *
 * كل عنصر يحمل `data-input-id` (وما يلزم من `data-opt-id` و`data-verdict`
 * و`data-*-field` و`data-matrix-row`/`data-col-id`) لتتمكّن الاختبارات
 * الآلية من التحقّق من التغطية الكاملة لكل الفروع والحقول.
 */

import type { Input, Part } from "../exam/types";
import { FIGURE_CHOICE_IDS } from "../exam/types";
import { Figure } from "../exam/figures";
import { MixedText, richToPlain } from "../lib/mathx";
import { ANSWER_KEYS, partLetter } from "../lib/grading";
import { partMaxMarks } from "../lib/marks";
import { cn } from "../utils/cn";
import { inputCls, labelCls, MarkBadge } from "./ui";

export { richToPlain };
export const LETTERS = ["أ", "ب", "ج", "د", "هـ", "و", "ز", "ح"];

/** نصّ صرف من نصّ قد يحوي $...$ — للسمات الدلالية فقط. */
export function plainLabel(part: Part): string {
  return richToPlain(part.label);
}

type WidgetProps = {
  input: Input;
  value: (key: string) => string;
  set: (key: string, value: string) => void;
};

function RadioDot({ selected }: { selected: boolean }) {
  return (
    <span className={cn("mt-1.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 bg-white", selected ? "border-plum-600" : "border-ink-faint")}>
      {selected && <span className="h-2.5 w-2.5 rounded-full bg-plum-600" />}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* اختيار من متعدد                                                    */
/* ------------------------------------------------------------------ */

function ChoiceField({ input, value, set }: WidgetProps & { input: Extract<Input, { kind: "choice" }> }) {
  const selected = value(input.id);
  const withFigures = input.options.some((option) => option.diagram && FIGURE_CHOICE_IDS.has(option.diagram));
  return (
    <div
      className={withFigures ? "grid gap-2 sm:grid-cols-2" : "grid gap-2"}
      role="radiogroup"
      aria-label={richToPlain(input.prompt) || "اختر الإجابة"}
      data-part-id={input.id}
      data-input-id={input.id}
      data-input-kind="choice"
    >
      {input.options.map((option) => {
        const on = selected === option.id;
        return (
          <label
            key={option.id}
            data-opt-id={option.id}
            className={cn(
              "relative flex cursor-pointer items-start gap-3 rounded-2xl border-2 px-4 py-3 transition-colors",
              on ? "border-plum-500 bg-lilac-100" : "border-blush-100 bg-white hover:border-lilac-300",
            )}
          >
            <input type="radio" name={input.id} className="sr-only" checked={on} onChange={() => set(input.id, on ? "" : option.id)} />
            {option.diagram ? (
              <div className="w-full">
                <div className="mb-1 flex items-center gap-2">
                  <RadioDot selected={on} />
                  <span className="text-sm font-medium">{option.label}</span>
                </div>
                <Figure type={option.diagram} variant="option" />
              </div>
            ) : (
              <>
                <RadioDot selected={on} />
                <span className="leading-7">
                  <MixedText as="span" text={option.label} />
                </span>
              </>
            )}
          </label>
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
      {input.prompt && (
        <p className="mb-1.5 font-medium leading-7">
          <MixedText as="span" text={input.prompt} />
        </p>
      )}
      <textarea
        rows={input.rows ?? 3}
        value={value(input.id)}
        placeholder={input.placeholder ?? "اكتبي إجابتك بأسلوبك"}
        aria-label={richToPlain(input.prompt) || "إجابة قصيرة"}
        className={inputCls}
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
    <div className="space-y-3" data-part-id={input.id} data-input-id={input.id} data-input-kind="number">
      {input.prompt && (
        <p className="font-medium leading-7">
          <MixedText as="span" text={input.prompt} />
        </p>
      )}
      {input.requiresSteps && (
        <label className="block">
          <span className={labelCls}>خطوة الحل (التعويض):</span>
          <textarea
            rows={2}
            value={value(ANSWER_KEYS.steps(input.id))}
            placeholder="مثال: v = d ÷ t = 27 ÷ 0.5"
            aria-label="خطوة الحل للفرع"
            data-step-field={input.id}
            className={inputCls}
            onChange={(event) => set(ANSWER_KEYS.steps(input.id), event.target.value)}
          />
        </label>
      )}
      <div className="flex items-end gap-2">
        <label className="block flex-1">
          <span className={labelCls}>النتيجة العددية</span>
          <input
            type="text"
            inputMode="decimal"
            dir="ltr"
            autoComplete="off"
            value={value(ANSWER_KEYS.value(input.id))}
            placeholder="العدد"
            aria-label={`النتيجة العددية — ${richToPlain(input.prompt) || "الفرع"}`}
            data-value-field={input.id}
            className={cn(inputCls, "tabular")}
            onChange={(event) => set(ANSWER_KEYS.value(input.id), event.target.value)}
          />
        </label>
        {input.unitOptions && (
          <label className="block w-32 shrink-0">
            <span className={labelCls}>الوحدة</span>
            <select
              value={value(ANSWER_KEYS.unit(input.id))}
              aria-label="وحدة النتيجة"
              data-unit-field={input.id}
              className={inputCls}
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
  const options: { v: "true" | "false"; label: string }[] = [
    { v: "true", label: "صحيحة" },
    { v: "false", label: "خاطئة" },
  ];
  return (
    <div data-part-id={input.id} data-input-id={input.id} data-input-kind="tf">
      <p className="mb-3 rounded-2xl bg-blush-50 px-4 py-3 font-medium leading-8">
        <MixedText as="span" text={input.statement} />
      </p>
      <div className="flex gap-2" role="group" aria-label="حكم العبارة">
        {options.map((o) => {
          const on = verdict === o.v;
          return (
            <button
              type="button"
              key={o.v}
              aria-pressed={on}
              data-verdict={o.v}
              data-on={on ? "1" : "0"}
              onClick={() => set(ANSWER_KEYS.verdict(input.id), on ? "" : o.v)}
              className={cn(
                "flex-1 cursor-pointer rounded-2xl border-2 px-4 py-3 font-semibold transition-colors",
                on
                  ? o.v === "true"
                    ? "border-mint-500 bg-mint-100 text-mint-700"
                    : "border-coral-500 bg-coral-100 text-[#a9374b]"
                  : "border-blush-100 bg-white hover:border-lilac-300",
              )}
            >
              {o.label}
            </button>
          );
        })}
      </div>
      {verdict === "false" && input.allowsCorrection && (
        <label className="mt-3 block">
          <span className={labelCls}>اكتبي التصحيح:</span>
          <textarea
            rows={2}
            value={value(ANSWER_KEYS.correction(input.id))}
            placeholder="العبارة الصحيحة هي…"
            aria-label="تصحيح العبارة"
            data-correction-field={input.id}
            className={inputCls}
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
  const cols = `minmax(0,1.3fr) repeat(${input.columns.length}, minmax(0,1fr))`;
  return (
    <div data-part-id={input.id} data-input-id={input.id} data-input-kind="matrix">
      <div className="overflow-hidden rounded-2xl border border-blush-100">
        <div className="hidden bg-lilac-100/60 px-4 py-2 text-sm font-semibold sm:grid" style={{ gridTemplateColumns: cols }}>
          <span>الحالة</span>
          {input.columns.map((column) => (
            <span key={column.id} className="text-center">
              {column.label}
            </span>
          ))}
        </div>
        {input.rows.map((row, index) => {
          const current = value(ANSWER_KEYS.matrixRow(input.id, row.id));
          return (
            <div key={row.id} className={cn("border-t border-blush-100 px-4 py-3", index % 2 ? "bg-white" : "bg-blush-50/40")} data-matrix-row={row.id}>
              <div className="sm:grid sm:items-center" style={{ gridTemplateColumns: cols }}>
                <p className="mb-2 leading-7 sm:mb-0">
                  <MixedText as="span" text={row.label} />
                </p>
                <div className="flex flex-wrap gap-2 sm:justify-center">
                  {input.columns.map((column) => {
                    const on = current === column.id;
                    return (
                      <button
                        type="button"
                        key={column.id}
                        aria-pressed={on}
                        data-col-id={column.id}
                        data-on={on ? "1" : "0"}
                        onClick={() => set(ANSWER_KEYS.matrixRow(input.id, row.id), on ? "" : column.id)}
                        className={cn(
                          "cursor-pointer rounded-full border-2 px-3 py-1.5 text-sm font-medium transition-colors",
                          on ? "border-plum-600 bg-plum-600 text-white" : "border-blush-100 bg-white hover:border-lilac-300",
                        )}
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

/* ------------------------------------------------------------------ */
/* بطاقة الفرع — حرف الفرع + نصّه + شارة علاماته                       */
/* ------------------------------------------------------------------ */

export function PartView({
  part,
  index,
  questionId,
  value,
  set,
}: {
  part: Part;
  index: number;
  questionId: string;
  value: (key: string) => string;
  set: (key: string, value: string) => void;
}) {
  return (
    <section className="rounded-2xl border border-blush-100 bg-white/80 p-4 sm:p-5" data-part-card={part.id} aria-labelledby={`${part.id}-heading`}>
      <div id={`${part.id}-heading`} className="mb-3 flex items-start gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-lilac-100 font-bold text-plum-700" aria-hidden>
          {LETTERS[index] ?? ""}
        </span>
        <p className="flex-1 pt-0.5 text-[17px] leading-8">
          <MixedText as="span" text={part.label} />
        </p>
        <MarkBadge marks={partMaxMarks(part, questionId)} />
      </div>
      {part.figure && <Figure type={part.figure} variant="part" />}
      <div className="space-y-5">
        {part.inputs.map((input) => (
          <div key={input.id}>
            {part.inputs.length > 1 && input.prompt && (
              <p className="mb-1.5 text-sm font-semibold text-ink-soft">
                <MixedText as="span" text={input.prompt} />
              </p>
            )}
            <AnswerWidget input={input} value={value} set={set} />
          </div>
        ))}
      </div>
    </section>
  );
}

/** عنوان حقول الإدخال داخل الفرع عندما يكون للفرع أكثر من حقل. */
export function InputHeading({ input }: { input: Input }) {
  if (!input.prompt) return null;
  return (
    <p className="mb-1.5 text-sm font-semibold text-ink-soft">
      <MixedText as="span" text={input.prompt} />
    </p>
  );
}

/** عنوان الفرع: حرفه + نصّه (يُستعمل في المراجعة). */
export function PartHeading({ part, index }: { part: Part; index: number }) {
  return (
    <div className="mb-2 flex items-start gap-2.5">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-lilac-100 font-bold text-plum-700" aria-hidden>
        {partLetter(index)}
      </span>
      <p className="min-w-0 flex-1 text-[17px] font-semibold leading-8">
        <MixedText as="span" text={part.label} />
      </p>
    </div>
  );
}
