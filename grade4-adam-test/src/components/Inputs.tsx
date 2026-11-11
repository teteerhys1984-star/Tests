import type { AnswerValue, Subpart } from "../exam/types";

const OPTION_LETTERS = ["أ", "ب", "ج", "د", "هـ", "و", "ز", "ح"];

export interface AnswerInputProps {
  sub: Subpart;
  value: AnswerValue;
  optionOrder?: number[];
  onChange: (value: AnswerValue) => void;
}

function fieldValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export function AnswerInput({ sub, value, optionOrder, onChange }: AnswerInputProps) {
  if (sub.kind === "mcq") {
    const ordered =
      optionOrder && optionOrder.length === sub.options.length
        ? optionOrder
        : sub.options.map((_, i) => i);
    return (
      <div className="choices" role="radiogroup" aria-label={sub.prompt}>
        {ordered.map((originalIndex, position) => {
          const selected = value === originalIndex;
          return (
            <button
              type="button"
              key={`${sub.id}-${originalIndex}`}
              role="radio"
              aria-checked={selected}
              className={`choice ${selected ? "is-selected" : ""}`}
              onClick={() => onChange(originalIndex)}
            >
              <span className="choice-letter">{OPTION_LETTERS[position] ?? position + 1}</span>
              <span className="choice-text">{sub.options[originalIndex]}</span>
              <span className="choice-dot" aria-hidden="true" />
            </button>
          );
        })}
      </div>
    );
  }

  if (sub.kind === "tf") {
    const options = [
      { label: "صواب", val: true },
      { label: "خطأ", val: false },
    ];
    return (
      <div className="choices choices-inline" role="radiogroup" aria-label={sub.prompt}>
        {options.map((opt) => (
          <button
            type="button"
            key={String(opt.val)}
            role="radio"
            aria-checked={value === opt.val}
            className={`choice choice-tf ${value === opt.val ? "is-selected" : ""}`}
            onClick={() => onChange(opt.val)}
          >
            <span className={`tf-mark ${opt.val ? "tf-true" : "tf-false"}`} aria-hidden="true">
              {opt.val ? "ص" : "خ"}
            </span>
            <span className="choice-text">{opt.label}</span>
          </button>
        ))}
      </div>
    );
  }

  if (sub.kind === "numeric") {
    return (
      <div className="numeric-wrap">
        <input
          className="numeric-input"
          type="text"
          inputMode="numeric"
          autoComplete="off"
          dir="ltr"
          aria-label={sub.prompt}
          placeholder={sub.placeholder ?? "اكتب الإجابة"}
          value={fieldValue(value)}
          onChange={(e) => onChange(e.target.value)}
        />
        {sub.unit && <span className="unit-label">{sub.unit}</span>}
      </div>
    );
  }

  if (sub.kind === "pair") {
    const pair =
      value && typeof value === "object" && !Array.isArray(value) && "a" in value && "b" in value
        ? (value as { a: string; b: string })
        : { a: "", b: "" };
    return (
      <div className="field-pair">
        {[0, 1].map((index) => {
          const key = index === 0 ? "a" : "b";
          return (
            <label className="field-box" key={key}>
              <span>{sub.labels[index]}</span>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="off"
                dir="ltr"
                aria-label={sub.labels[index]}
                placeholder={index === 0 ? "أفقي" : "شاقولي"}
                value={pair[key]}
                onChange={(e) => onChange({ ...pair, [key]: e.target.value })}
              />
            </label>
          );
        })}
      </div>
    );
  }

  if (sub.kind === "multi") {
    const values = Array.isArray(value) ? (value as string[]) : [];
    return (
      <div className="field-pair">
        {sub.labels.map((label, index) => (
          <label className="field-box" key={label}>
            <span>{label}</span>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="off"
              dir="ltr"
              aria-label={label}
              placeholder="اكتب العدد"
              value={values[index] ?? ""}
              onChange={(e) => {
                const next = [...sub.labels].map((_, i) => (i === index ? e.target.value : values[i] ?? ""));
                onChange(next);
              }}
            />
          </label>
        ))}
      </div>
    );
  }

  if (sub.kind === "order") {
    const selected = Array.isArray(value) ? (value as string[]) : [];
    const remaining = sub.items.filter((item) => !selected.includes(item));
    return (
      <div className="order-widget">
        <div className="order-bank" aria-label="الأعداد المتاحة">
          {remaining.map((item) => (
            <button
              type="button"
              key={item}
              className="order-chip"
              onClick={() => onChange([...selected, item])}
            >
              <span dir="ltr">{item}</span>
              <span className="chip-add" aria-hidden="true">+</span>
            </button>
          ))}
          {remaining.length === 0 && <span className="order-note">اخترت جميع الأعداد.</span>}
        </div>
        <div className="order-line">
          {sub.items.map((_, index) => (
            <div className="order-slot" key={index}>
              <span className="order-position">{index + 1}</span>
              {selected[index] ? (
                <button
                  type="button"
                  className="order-chip is-placed"
                  onClick={() => onChange(selected.filter((_, i) => i !== index))}
                  aria-label={`إزالة ${selected[index]}`}
                >
                  <span dir="ltr">{selected[index]}</span>
                  <span className="chip-remove" aria-hidden="true">×</span>
                </button>
              ) : (
                <span className="order-empty">—</span>
              )}
            </div>
          ))}
        </div>
        {selected.length > 0 && (
          <button type="button" className="text-button" onClick={() => onChange([])}>
            إعادة ضبط الترتيب
          </button>
        )}
        <p className="field-caption">اضغط الأعداد بالترتيب المطلوب.</p>
      </div>
    );
  }

  if (sub.kind === "compare") {
    const symbols: (">" | "<" | "=")[] = [">", "<", "="];
    return (
      <div className="compare-widget">
        <div className="compare-expression">
          <span className="compare-number" dir="ltr">{sub.left}</span>
          <span className={`compare-slot ${value ? "has-value" : ""}`} dir="ltr">
            {typeof value === "string" ? value : ""}
          </span>
          <span className="compare-number" dir="ltr">{sub.right}</span>
        </div>
        <div className="symbol-choices" role="radiogroup" aria-label="اختر إشارة المقارنة">
          {symbols.map((symbol) => (
            <button
              type="button"
              key={symbol}
              role="radio"
              aria-checked={value === symbol}
              className={`symbol-button ${value === symbol ? "is-selected" : ""}`}
              onClick={() => onChange(symbol)}
            >
              {symbol}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return null;
}
