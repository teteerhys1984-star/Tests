import type { AnswerValue } from "../lib/grading";
import type { FieldsPart, Part, Question } from "../data/exam";
import { FigureView, LewisDiagram, MarksPill, RichText } from "./Science";

const LETTERS = ["أ", "ب", "ج", "د", "هـ", "و", "ز", "ح", "ط", "ي"];

type PartProps = {
  part: Part;
  index: number;
  value: AnswerValue;
  onChange: (value: AnswerValue) => void;
  optionOrder?: string[];
  itemOrder?: string[];
};

const ordered = <T extends { id: string }>(items: T[], ids?: string[]): T[] => {
  if (!ids || ids.length === 0) return items;
  const map = new Map(items.map((i) => [i.id, i]));
  const result = ids.map((id) => map.get(id)).filter((x): x is T => Boolean(x));
  items.forEach((i) => {
    if (!result.includes(i)) result.push(i);
  });
  return result;
};

function TfInput({ part, value, onChange }: Pick<PartProps, "part" | "value" | "onChange">) {
  if (part.type !== "tf") return null;
  const current = (value && typeof value === "object" ? value : {}) as { judgment?: boolean; correction?: string };
  const set = (next: { judgment?: boolean; correction?: string }) => onChange(next);
  return (
    <div className="tf-block">
      <div className="tf-options" role="radiogroup" aria-label="الحكم على العبارة">
        <button
          type="button"
          className={`choice-btn tf-btn ${current.judgment === true ? "selected" : ""}`}
          aria-pressed={current.judgment === true}
          onClick={() => set({ judgment: true, correction: "" })}
        >
          صواب
        </button>
        <button
          type="button"
          className={`choice-btn tf-btn ${current.judgment === false ? "selected" : ""}`}
          aria-pressed={current.judgment === false}
          onClick={() => set({ judgment: false, correction: current.correction ?? "" })}
        >
          خطأ
        </button>
      </div>
      {current.judgment === false && (
        <label className="correction-wrap">
          <span className="field-label">التصحيح المطلوب للعبارة:</span>
          <textarea
            className="textarea-input"
            rows={3}
            value={current.correction ?? ""}
            onChange={(e) => set({ judgment: false, correction: e.target.value })}
            placeholder="اكتب التصحيح العلمي للعبارة الخاطئة..."
          />
        </label>
      )}
    </div>
  );
}

function OrderInput({ part, value, onChange, itemOrder }: Pick<PartProps, "part" | "value" | "onChange" | "itemOrder">) {
  if (part.type !== "order") return null;
  const chosen = Array.isArray(value) ? (value as string[]) : [];
  const displayItems = ordered(part.items, itemOrder);
  const remaining = displayItems.filter((i) => !chosen.includes(i.id));
  return (
    <div className="order-block">
      <p className="small-instruction">اضغط على الخطوات بالترتيب الذي تراه صحيحًا. يمكنك إزالة أي خطوة ثم إعادة إضافتها.</p>
      <div className="order-slots">
        {chosen.length === 0 && <span className="empty-note">لم تُختر أي خطوة بعد.</span>}
        {chosen.map((id, idx) => {
          const item = part.items.find((i) => i.id === id);
          return (
            <div className="order-slot filled" key={id}>
              <span className="order-index">{idx + 1}</span>
              <span className="order-text">{item?.label}</span>
              <button
                type="button"
                className="remove-chip"
                aria-label="إزالة الخطوة"
                onClick={() => onChange(chosen.filter((x) => x !== id))}
              >
                ×
              </button>
            </div>
          );
        })}
      </div>
      {remaining.length > 0 && (
        <div className="order-bank">
          <span className="bank-label">الخطوات المتاحة:</span>
          <div className="chip-list">
            {remaining.map((item) => (
              <button
                type="button"
                key={item.id}
                className="chip"
                onClick={() => onChange([...chosen, item.id])}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}
      {chosen.length > 0 && (
        <button type="button" className="text-btn" onClick={() => onChange([])}>
          إعادة ترتيب الخطوات
        </button>
      )}
    </div>
  );
}

function FieldsInput({ part, value, onChange }: Pick<PartProps, "part" | "value" | "onChange">) {
  if (part.type !== "fields") return null;
  const current = (value && typeof value === "object" ? value : {}) as Record<string, string>;
  const update = (id: string, next: string) => onChange({ ...current, [id]: next });
  return (
    <div className="fields-list">
      {(part as FieldsPart).fields.map((field) => (
        <label className="field-row" key={field.id}>
          <span className="field-label">
            <RichText text={field.label} />
          </span>
          <span className="field-input-wrap">
            <input
              className={`text-input ${field.kind === "number" || field.kind === "formula" ? "ltr-input" : ""}`}
              dir={field.kind === "number" || field.kind === "formula" ? "ltr" : "rtl"}
              inputMode={field.kind === "number" ? "decimal" : undefined}
              value={current[field.id] ?? ""}
              onChange={(e) => update(field.id, e.target.value)}
              placeholder={field.placeholder ?? (field.kind === "number" ? "العدد" : "الإجابة")}
              aria-label={field.label.replace(/\[\[|\]\]/g, "")}
            />
            {field.kind === "number" && <span className="input-unit"> </span>}
          </span>
        </label>
      ))}
    </div>
  );
}

export function PartView({ part, index, value, onChange, optionOrder, itemOrder }: PartProps) {
  const letter = LETTERS[index] ?? String(index + 1);
  const opts = "options" in part ? ordered(part.options, optionOrder) : [];
  const setObject = (id: string, next: string, currentValue: AnswerValue) => {
    const obj = currentValue && typeof currentValue === "object" ? { ...(currentValue as Record<string, string>) } : {};
    obj[id] = next;
    onChange(obj);
  };
  return (
    <section className="part-card" aria-label={`الجزء ${letter}`}>
      <div className="part-head">
        <span className="part-letter">({letter})</span>
        <div className="part-prompt">
          <RichText text={part.prompt} />
        </div>
        <MarksPill marks={part.marks} />
      </div>

      {part.type === "mc" && (
        <div className="options-grid" role="radiogroup" aria-label={`خيارات الجزء ${letter}`}>
          {opts.map((opt, i) => (
            <button
              type="button"
              key={opt.id}
              role="radio"
              aria-checked={value === opt.id}
              className={`choice-btn ${value === opt.id ? "selected" : ""} ${opt.lewis ? "choice-lewis" : ""}`}
              onClick={() => onChange(opt.id)}
            >
              <span className="option-letter">{LETTERS[i] ?? ""}</span>
              {opt.lewis ? (
                <span className="lewis-option-inner">
                  <LewisDiagram spec={opt.lewis} compact />
                  <span className="option-label">{opt.label}</span>
                </span>
              ) : (
                <span className="option-label"><RichText text={opt.label} /></span>
              )}
            </button>
          ))}
        </div>
      )}

      {part.type === "multi" && (
        <div className="options-grid" role="group" aria-label={`اختيارات متعددة للجزء ${letter}`}>
          {opts.map((opt, i) => {
            const selected = Array.isArray(value) ? (value as string[]) : [];
            const isOn = selected.includes(opt.id);
            return (
              <button
                type="button"
                key={opt.id}
                aria-pressed={isOn}
                className={`choice-btn multi-choice ${isOn ? "selected" : ""} ${opt.lewis ? "choice-lewis" : ""}`}
                onClick={() =>
                  onChange(isOn ? selected.filter((x) => x !== opt.id) : [...selected, opt.id])
                }
              >
                <span className={`check-square ${isOn ? "on" : ""}`} aria-hidden="true">
                  {isOn ? "✓" : ""}
                </span>
                <span className="option-letter">{LETTERS[i] ?? ""}</span>
                {opt.lewis ? (
                  <span className="lewis-option-inner">
                    <LewisDiagram spec={opt.lewis} compact />
                    <span className="option-label"><RichText text={opt.label} /></span>
                  </span>
                ) : (
                  <span className="option-label"><RichText text={opt.label} /></span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {part.type === "lewis-select" && (
        <div className="options-grid lewis-options" role="radiogroup" aria-label={`تمثيلات الجزء ${letter}`}>
          {opts.map((opt, i) => (
            <button
              type="button"
              key={opt.id}
              role="radio"
              aria-checked={value === opt.id}
              aria-label={`${LETTERS[i] ?? i + 1} — ${opt.label}`}
              className={`choice-btn choice-lewis ${value === opt.id ? "selected" : ""}`}
              onClick={() => onChange(opt.id)}
            >
              <span className="option-letter">{LETTERS[i] ?? ""}</span>
              {opt.lewis && <LewisDiagram spec={opt.lewis} />}
            </button>
          ))}
        </div>
      )}

      {part.type === "tf" && <TfInput part={part} value={value} onChange={onChange} />}

      {part.type === "fields" && <FieldsInput part={part} value={value} onChange={onChange} />}

      {part.type === "short" && (
        <textarea
          className="textarea-input answer-area"
          rows={part.lines ?? 3}
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="اكتب إجابتك العلمية هنا..."
          aria-label={`إجابة الجزء ${letter}`}
        />
      )}

      {part.type === "order" && <OrderInput part={part} value={value} onChange={onChange} itemOrder={itemOrder} />}

      {part.type === "match" && (
        <div className="match-table">
          {part.rows.map((row, idx) => {
            const current = value && typeof value === "object" ? (value as Record<string, string>) : {};
            return (
              <label className="match-row" key={row.id}>
                <span className="match-row-label">{idx + 1}. {row.label}</span>
                <select
                  className="select-input"
                  value={current[row.id] ?? ""}
                  onChange={(e) => setObject(row.id, e.target.value, value)}
                  aria-label={`اختيار الجزء ${letter} للبند ${idx + 1}`}
                >
                  <option value="">— اختر —</option>
                  {ordered(part.choices, optionOrder).map((choice) => (
                    <option value={choice.id} key={choice.id}>{choice.label}</option>
                  ))}
                </select>
              </label>
            );
          })}
        </div>
      )}

      {part.type === "classification" && (
        <div className="classification-list">
          {part.items.map((item) => {
            const current = value && typeof value === "object" ? (value as Record<string, string>) : {};
            return (
              <div className="classification-row" key={item.id}>
                <span className="classification-label"><RichText text={item.label} /></span>
                <div className="segmented" role="radiogroup" aria-label={`تصنيف ${item.label}`}>
                  {part.categories.map((category) => (
                    <button
                      type="button"
                      key={category}
                      role="radio"
                      aria-checked={current[item.id] === category}
                      className={`segment ${current[item.id] === category ? "selected" : ""}`}
                      onClick={() => setObject(item.id, category, value)}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

export function QuestionView({
  question,
  number,
  answers,
  onAnswer,
  optionOrder,
  itemOrder,
}: {
  question: Question;
  number: number;
  answers: Record<string, AnswerValue>;
  onAnswer: (partId: string, value: AnswerValue) => void;
  optionOrder: Record<string, string[]>;
  itemOrder: Record<string, string[]>;
}) {
  return (
    <article className="question-view">
      <div className="question-kicker">السؤال {number} من 15</div>
      <h2 className="question-title">{question.title}</h2>
      {question.stem && (
        <p className="question-stem">
          <RichText text={question.stem} />
        </p>
      )}
      {question.figure && <FigureView figure={question.figure} />}
      <div className="parts-stack">
        {question.parts.map((part, idx) => (
          <PartView
            key={part.id}
            part={part}
            index={idx}
            value={answers[part.id]}
            onChange={(v) => onAnswer(part.id, v)}
            optionOrder={optionOrder[part.id]}
            itemOrder={itemOrder[part.id]}
          />
        ))}
      </div>
    </article>
  );
}
