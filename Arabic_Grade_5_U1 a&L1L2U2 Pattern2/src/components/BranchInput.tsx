import { ArrowDown, ArrowUp, Check, ChevronDown, ListOrdered, PenLine, X } from "lucide-react";
import type { AnswerValue } from "@/lib/grading";
import type { Branch } from "@/data/exam";
import { branchKindLabel } from "@/lib/grading";

type BranchInputProps = {
  branch: Branch;
  label: string;
  value: AnswerValue | undefined;
  onChange: (value: AnswerValue) => void;
};

const OPTION_LETTERS = ["أ", "ب", "ج", "د", "هـ", "و"];

function rotateItems<T>(items: T[]): T[] {
  if (items.length < 2) return items;
  return [...items.slice(1), items[0]];
}

export function BranchInput({ branch, label, value, onChange }: BranchInputProps) {
  return (
    <fieldset className="group rounded-2xl border border-[#e5dccb] bg-[#fffefa] p-4 transition-colors focus-within:border-[#1f7a6a]/40 sm:p-5">
      <legend className="sr-only">
        {label}: {branch.prompt}
      </legend>

      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-2">
          <span className="mt-0.5 grid h-6 min-w-6 place-items-center rounded-md bg-[#0d3b35] px-1.5 font-display text-[10px] font-bold text-[#efdcb0]">
            {label}
          </span>
          <p className="text-[13.5px] font-semibold leading-7 text-[#173f39] sm:text-[14.5px]">{branch.prompt}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <span className="rounded-full border border-[#d8e7df] bg-[#f0f7f3] px-2 py-0.5 text-[9.5px] font-bold text-[#1f6f5e]">
            {branchKindLabel(branch)}
          </span>
          <span className="rounded-full border border-[#e9dcc1] bg-[#fbf5e8] px-2 py-0.5 text-[9.5px] font-bold text-[#8b692a]">
            {branch.points} {branch.points === 1 ? "علامة" : "علامات"}
          </span>
        </div>
      </div>

      <div className="ps-0 sm:ps-8">
        {branch.kind === "single_choice" && (
          <div role="radiogroup" aria-label={branch.prompt} className="grid gap-2 sm:grid-cols-2">
            {branch.choices.map((choice, index) => {
              const selected = value === choice.id;
              return (
                <label
                  key={choice.id}
                  data-selected={selected}
                  className="option-card flex cursor-pointer items-start gap-3 rounded-xl border border-[#e5dccb] bg-white px-3 py-2.5 focus-within:ring-2 focus-within:ring-[#c4a15a]/45"
                >
                  <input
                    type="radio"
                    name={branch.id}
                    value={choice.id}
                    checked={selected}
                    onChange={() => onChange(choice.id)}
                    className="sr-only"
                  />
                  <span
                    className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border text-[9px] font-bold transition ${
                      selected
                        ? "border-[#1f7a6a] bg-[#1f7a6a] text-white"
                        : "border-[#cfc6b5] bg-[#fffdf8] text-[#8a918b]"
                    }`}
                    aria-hidden="true"
                  >
                    {selected ? <Check className="h-3 w-3" strokeWidth={3} /> : OPTION_LETTERS[index] ?? index + 1}
                  </span>
                  <span className="text-[12.5px] leading-6 text-[#354b45] sm:text-[13px]">{choice.text}</span>
                </label>
              );
            })}
          </div>
        )}

        {branch.kind === "true_false" && (
          <div role="radiogroup" aria-label={branch.prompt} className="grid grid-cols-2 gap-2 sm:max-w-sm">
            {[
              { id: "true", text: "صحيح", Icon: Check },
              { id: "false", text: "خطأ", Icon: X },
            ].map((option) => {
              const selected = value === option.id;
              return (
                <label
                  key={option.id}
                  data-selected={selected}
                  className="option-card flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#e5dccb] bg-white px-3 py-3 focus-within:ring-2 focus-within:ring-[#c4a15a]/45"
                >
                  <input
                    type="radio"
                    name={branch.id}
                    value={option.id}
                    checked={selected}
                    onChange={() => onChange(option.id)}
                    className="sr-only"
                  />
                  <option.Icon
                    className={`h-4 w-4 ${selected ? "text-[#1f7a6a]" : "text-[#83908a]"}`}
                    strokeWidth={2.5}
                  />
                  <span className="text-[12.5px] font-bold text-[#28473f] sm:text-[13px]">{option.text}</span>
                </label>
              );
            })}
          </div>
        )}

        {branch.kind === "fill_blank" && (
          <div>
            <div className="relative">
              <PenLine className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9b7938]" />
              <input
                type="text"
                value={typeof value === "string" ? value : ""}
                onChange={(event) => onChange(event.target.value)}
                placeholder={branch.placeholder ?? "اكتب إجابتك هنا…"}
                className="w-full rounded-xl border border-[#d8cdb9] bg-[#fbf8f0] py-3 pe-4 ps-10 text-[14px] font-medium text-[#0d3b35] placeholder:text-[#a0aaa3] focus:border-[#1f7a6a] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#1f7a6a]/10"
                autoComplete="off"
                spellCheck={false}
              />
            </div>
            <p className="mt-1.5 text-[10px] text-[#8a958f]">
              إجابة قصيرة. يُقبل الرسم الصحيح للكلمة مع اختلاف الحركات أو الهمزات غير المؤثرة في المعنى.
            </p>
          </div>
        )}

        {branch.kind === "multi_select" && (
          <div>
            <div className="mb-2 flex items-center justify-between text-[10px] font-semibold text-[#75827c]">
              <span>اختر {branch.requiredSelections} إجابات</span>
              <span className={Array.isArray(value) && value.length >= branch.requiredSelections ? "text-[#1f7a6a]" : "text-[#9b7938]"}>
                المحدد: {Array.isArray(value) ? value.length : 0}
              </span>
            </div>
            <div role="group" aria-label={branch.prompt} className="grid gap-2 sm:grid-cols-2">
              {branch.choices.map((choice) => {
                const current = Array.isArray(value) ? value : [];
                const selected = current.includes(choice.id);
                const atLimit = current.length >= branch.requiredSelections;
                return (
                  <button
                    key={choice.id}
                    type="button"
                    aria-pressed={selected}
                    aria-disabled={!selected && atLimit}
                    data-selected={selected}
                    onClick={() => {
                      if (!selected && atLimit) return;
                      onChange(
                        selected ? current.filter((id) => id !== choice.id) : [...current, choice.id],
                      );
                    }}
                    className={`option-card flex items-start gap-2.5 rounded-xl border border-[#e5dccb] bg-white px-3 py-2.5 text-right ${
                      !selected && atLimit ? "opacity-55" : ""
                    }`}
                  >
                    <span
                      className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border transition ${
                        selected
                          ? "border-[#1f7a6a] bg-[#1f7a6a] text-white"
                          : "border-[#cfc6b5] bg-[#fffdf8]"
                      }`}
                    >
                      {selected && <Check className="h-3 w-3" strokeWidth={3} />}
                    </span>
                    <span className="text-[12.5px] leading-6 text-[#354b45] sm:text-[13px]">{choice.text}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {branch.kind === "classification" && (
          <div className="overflow-hidden rounded-xl border border-[#e5dccb]">
            <div className="hidden items-center gap-3 bg-[#f7f1e5] px-3 py-2 text-[10px] font-bold text-[#7a6a4e] sm:flex">
              <span className="flex-1">العنصر</span>
              <span className="w-[58%] text-center">التصنيف</span>
            </div>
            <div className="divide-y divide-[#eee6d8] bg-white">
              {branch.items.map((item) => {
                const current = !!value && typeof value === "object" && !Array.isArray(value) ? value[item.id] : undefined;
                return (
                  <div
                    key={item.id}
                    className="flex flex-col gap-2 px-3 py-2.5 sm:flex-row sm:items-center sm:gap-3"
                  >
                    <span className="flex-1 text-[12.5px] font-semibold leading-6 text-[#354b45] sm:text-[13px]">{item.text}</span>
                    <div
                      role="group"
                      aria-label={`تصنيف ${item.text}`}
                      className="grid grid-cols-2 gap-1.5 sm:w-[58%] sm:grid-cols-2"
                    >
                      {branch.categories.map((category) => {
                        const selected = current === category.id;
                        return (
                          <button
                            key={category.id}
                            type="button"
                            aria-pressed={selected}
                            onClick={() => {
                              const previous =
                                !!value && typeof value === "object" && !Array.isArray(value) ? value : {};
                              onChange({ ...previous, [item.id]: category.id });
                            }}
                            className={`rounded-lg border px-2 py-1.5 text-[10.5px] font-semibold transition ${
                              selected
                                ? "border-[#1f7a6a] bg-[#1f7a6a] text-white shadow-sm"
                                : "border-[#ded4c1] bg-[#fffdf8] text-[#5c6b65] hover:border-[#1f7a6a]/40 hover:bg-[#f2f8f5]"
                            }`}
                          >
                            {category.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {branch.kind === "matching" && (
          <div className="grid gap-2">
            {branch.pairs.map((pair) => {
              const rightOptions = rotateItems(branch.pairs);
              const current = !!value && typeof value === "object" && !Array.isArray(value) ? value[pair.id] : "";
              return (
                <div
                  key={pair.id}
                  className="flex flex-col gap-1.5 rounded-xl border border-[#e5dccb] bg-white px-3 py-2.5 sm:flex-row sm:items-center sm:gap-3"
                >
                  <label
                    htmlFor={`${branch.id}-${pair.id}`}
                    className="flex flex-1 items-center gap-2 text-[12.5px] font-bold text-[#354b45] sm:text-[13px]"
                  >
                    <span className="grid h-5 w-5 place-items-center rounded-md bg-[#f4ecdb] text-[9px] text-[#8b692a]">
                      {branch.pairs.indexOf(pair) + 1}
                    </span>
                    {pair.left}
                  </label>
                  <div className="relative sm:w-[58%]">
                    <select
                      id={`${branch.id}-${pair.id}`}
                      value={current}
                      onChange={(event) => {
                        const previous =
                          !!value && typeof value === "object" && !Array.isArray(value) ? value : {};
                        onChange({ ...previous, [pair.id]: event.target.value });
                      }}
                      className={`select-field w-full rounded-lg border bg-[#fbf8f0] px-3 py-2 text-[12px] font-medium text-[#28473f] focus:border-[#1f7a6a] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#1f7a6a]/10 ${
                        current ? "border-[#bcd9ce]" : "border-[#ded4c1]"
                      }`}
                    >
                      <option value="">اختر المعنى المناسب…</option>
                      {rightOptions.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.right}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute left-2.5 top-1/2 hidden h-3.5 w-3.5 -translate-y-1/2 text-[#7b8782]" />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {branch.kind === "ordering" && (
          <div>
            <div className="mb-3 rounded-xl border border-[#d8e7df] bg-[#eef7f2] px-3 py-2.5">
              <p className="mb-1 flex items-center gap-1.5 text-[9.5px] font-bold text-[#1f6f5e]">
                <ListOrdered className="h-3.5 w-3.5" />
                الترتيب الحالي من الأعلى إلى الأسفل
              </p>
              <p className="font-poetic text-[15px] leading-8 text-[#0d3b35]">
                {(() => {
                  const order = Array.isArray(value) ? value : rotateItems(branch.items).map((item) => item.id);
                  return order
                    .map((id) => branch.items.find((item) => item.id === id)?.text)
                    .filter(Boolean)
                    .join(" ← ");
                })()}
              </p>
            </div>
            <ol className="space-y-1.5">
              {(Array.isArray(value) ? value : rotateItems(branch.items).map((item) => item.id)).map(
                (id, index, order) => {
                  const item = branch.items.find((candidate) => candidate.id === id);
                  if (!item) return null;
                  return (
                    <li
                      key={id}
                      className="flex items-center gap-2 rounded-lg border border-[#e5dccb] bg-white px-2.5 py-1.5"
                    >
                      <span className="grid h-5 w-5 place-items-center rounded-md bg-[#f4ecdb] text-[9px] font-bold text-[#8b692a]">
                        {index + 1}
                      </span>
                      <span className="flex-1 text-[12.5px] font-semibold text-[#354b45] sm:text-[13px]">{item.text}</span>
                      <button
                        type="button"
                        className="grid h-7 w-7 place-items-center rounded-md border border-[#e0d6c4] bg-[#fffdf8] text-[#5e6c67] transition hover:border-[#1f7a6a]/40 hover:bg-[#eef7f2] disabled:opacity-35"
                        disabled={index === 0}
                        aria-label={`تقديم ${item.text}`}
                        onClick={() => {
                          const next = [...order];
                          [next[index - 1], next[index]] = [next[index], next[index - 1]];
                          onChange(next);
                        }}
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        className="grid h-7 w-7 place-items-center rounded-md border border-[#e0d6c4] bg-[#fffdf8] text-[#5e6c67] transition hover:border-[#1f7a6a]/40 hover:bg-[#eef7f2] disabled:opacity-35"
                        disabled={index === order.length - 1}
                        aria-label={`تأخير ${item.text}`}
                        onClick={() => {
                          const next = [...order];
                          [next[index], next[index + 1]] = [next[index + 1], next[index]];
                          onChange(next);
                        }}
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  );
                },
              )}
            </ol>
            {!value && (
              <p className="mt-1.5 text-[10px] text-[#8a958f]">
                رتِّب العناصر بالأسهم؛ لا تُحتسب إجابة الفرع قبل بدء الترتيب.
              </p>
            )}
          </div>
        )}
      </div>
    </fieldset>
  );
}
