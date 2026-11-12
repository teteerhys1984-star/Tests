import type { AnswerValue, Subpart } from "../types";
import { IconCheck, IconX } from "./Icons";
import { RichText } from "./RichText";

const ARABIC_LETTERS = ["أ", "ب", "ج", "د", "هـ"];

export function AnswerInput({
  subpart,
  value,
  optionOrder,
  onChange,
}: {
  subpart: Subpart;
  value: AnswerValue;
  optionOrder: string[];
  onChange: (value: AnswerValue) => void;
}) {
  const orderedOptions =
    optionOrder.length && subpart.options
      ? optionOrder
          .map((v) => subpart.options?.find((o) => o.value === v))
          .filter((o): o is NonNullable<typeof o> => Boolean(o))
      : (subpart.options ?? []);

  if (subpart.type === "mcq") {
    return (
      <fieldset className="mt-2">
        <legend className="sr-only">{subpart.prompt}</legend>
        <div className="choice-grid">
          {orderedOptions.map((option, index) => {
            const selected = value === option.value;
            return (
              <label
                key={option.value}
                className={`choice${selected ? " is-selected" : ""}`}
                data-selected={selected ? "true" : "false"}
              >
                <input
                  type="radio"
                  className="sr-only"
                  name={`answer-${subpart.id}`}
                  value={option.value}
                  checked={selected}
                  onChange={() => onChange(option.value)}
                />
                <span className="choice-letter" aria-hidden>
                  {ARABIC_LETTERS[index] ?? index + 1}
                </span>
                <span style={{ flex: 1 }}>
                  <RichText>{option.label}</RichText>
                </span>
                {selected ? (
                  <span className="mt-0.5 shrink-0" style={{ color: "#bb5b7c" }} aria-hidden>
                    <IconCheck size={16} />
                  </span>
                ) : null}
              </label>
            );
          })}
        </div>
      </fieldset>
    );
  }

  if (subpart.type === "tf") {
    return (
      <div className="tf-grid mt-2">
        {orderedOptions.map((option) => {
          const selected = value === option.value;
          return (
            <label
              key={option.value}
              className={`choice justify-center${selected ? " is-selected" : ""}`}
              style={{ minHeight: 46 }}
            >
              <input
                type="radio"
                className="sr-only"
                name={`answer-${subpart.id}`}
                value={option.value}
                checked={selected}
                onChange={() => onChange(option.value)}
              />
              <span style={{ fontWeight: 700 }}>{option.label}</span>
              {selected ? (
                <span style={{ color: "#bb5b7c" }} aria-hidden>
                  <IconCheck size={15} />
                </span>
              ) : null}
            </label>
          );
        })}
      </div>
    );
  }

  if (subpart.type === "ordering") {
    const items = subpart.items ?? [];
    const chosen = Array.isArray(value) ? value : [];
    const remaining = items.filter((item) => !chosen.includes(item));
    return (
      <div className="mt-2">
        <div
          className="order-picked mb-2 rounded-xl border border-dashed p-2"
          style={{ borderColor: "#e7d3de", background: "#fffdfc" }}
        >
          {chosen.length === 0 ? (
            <span className="answer-note px-1">لم تختر أي عدد بعد.</span>
          ) : (
            chosen.map((item, index) => (
              <span className="order-chip" key={item}>
                <span className="order-rank" aria-hidden>
                  {index + 1}
                </span>
                <span dir="ltr" style={{ fontVariantNumeric: "tabular-nums", fontWeight: 700 }}>
                  {item}
                </span>
                <button
                  type="button"
                  aria-label={`إزالة ${item}`}
                  onClick={() => onChange(chosen.filter((v) => v !== item))}
                  className="inline-grid h-5 w-5 place-items-center rounded-md border"
                  style={{ borderColor: "#e6ccd9", color: "#8d3b5a", background: "#fff" }}
                >
                  <IconX size={11} />
                </button>
              </span>
            ))
          )}
        </div>
        <div className="order-pool">
          {remaining.map((item) => (
            <button
              key={item}
              type="button"
              className="order-item"
              onClick={() => onChange([...chosen, item])}
            >
              {item}
            </button>
          ))}
        </div>
        {chosen.length > 0 ? (
          <button
            type="button"
            className="btn btn-ghost btn-sm mt-2"
            onClick={() => onChange([])}
          >
            إعادة الاختيار
          </button>
        ) : null}
        <p className="answer-note mt-1.5">
          تظهر الأعداد بترتيب اختيارك من الأول إلى الأخير.
        </p>
      </div>
    );
  }

  const stringValue = typeof value === "string" ? value : "";
  if (subpart.type === "text") {
    return (
      <div className="mt-2">
        <input
          className="field"
          style={{ direction: "ltr", textAlign: "left" }}
          value={stringValue}
          onChange={(e) => onChange(e.target.value)}
          placeholder={subpart.placeholder ?? "اكتب إجابتك"}
          aria-label={subpart.prompt}
          autoComplete="off"
          spellCheck={false}
        />
      </div>
    );
  }

  return (
    <div className="mt-2">
      <input
        className="field field-num"
        value={stringValue}
        onChange={(e) => onChange(e.target.value)}
        placeholder={subpart.placeholder ?? "اكتب العدد"}
        aria-label={subpart.prompt}
        inputMode="decimal"
        autoComplete="off"
        spellCheck={false}
      />
      <p className="answer-note mt-1">اكتب القيمة العددية فقط.</p>
    </div>
  );
}
