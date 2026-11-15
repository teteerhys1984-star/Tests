import type { Subpart } from "../../data/questions/types";

interface Props {
  subpart: Subpart;
  value: string;
  onChange: (v: string) => void;
}

export default function SubpartInput({ subpart, value, onChange }: Props) {
  if (subpart.type === "mcq" || subpart.type === "select") {
    return (
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        {(subpart.options ?? []).map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={`opt-btn px-4 py-3 text-base ${value === opt ? "selected" : ""}`}
            aria-pressed={value === opt}
          >
            <span className="flex items-center gap-2">
              <span className={`inline-block h-4 w-4 shrink-0 rounded-full border-2 ${value === opt ? "border-pink-600 bg-pink-500" : "border-pink-300 bg-white"}`} />
              {opt}
            </span>
          </button>
        ))}
      </div>
    );
  }

  if (subpart.type === "free") {
    return (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className="input-ar mt-2 text-base"
        placeholder="اكتبي إجابتك هنا..."
        aria-label={subpart.prompt}
      />
    );
  }

  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="input-ar mt-2 text-base"
      placeholder="اكتبي الإجابة هنا..."
      aria-label={subpart.prompt}
    />
  );
}
