import type { Subpart } from "../../types/exam";
import { subpartLetter } from "../../utils/arabic";
import { Icon } from "../common/Icon";

interface SubpartInputProps {
  subpart: Subpart;
  index: number;
  values: string[];
  onChange: (values: string[]) => void;
}

export function SubpartInput({ subpart, index, values, onChange }: SubpartInputProps) {
  const selected = values ?? [];
  const inputId = `subpart-${subpart.id}`;
  const options = subpart.options ?? [];

  if (subpart.kind === "text") {
    return (
      <div className="rounded-2xl border border-[#f0e4df] bg-white/60 p-3.5 sm:p-4">
        <label htmlFor={inputId} className="flex items-start gap-2.5">
          <span className="mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-lg bg-[#f6e6ea] text-[11px] font-bold text-[#94425f]">
            {subpartLetter(index)}
          </span>
          <span className="text-[13.5px] font-semibold leading-7 text-[#554047]">{subpart.prompt}</span>
        </label>
        <div className="relative mt-2.5 sm:mr-8.5">
          <input
            id={inputId}
            type="text"
            dir="rtl"
            lang="ar"
            autoComplete="off"
            spellCheck={false}
            value={selected[0] ?? ""}
            onChange={(event) => onChange(event.target.value ? [event.target.value] : [])}
            placeholder="اكتبي الإجابة هنا..."
            className="text-field py-2.5 text-[13.5px]"
          />
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-[#c6a7b1]">
            <Icon name="pen" size={15} />
          </span>
        </div>
      </div>
    );
  }

  const isMulti = subpart.kind === "multi";

  return (
    <fieldset className="rounded-2xl border border-[#f0e4df] bg-white/60 p-3.5 sm:p-4">
      <legend className="w-full">
        <span className="flex items-start gap-2.5">
          <span className="mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-lg bg-[#f6e6ea] text-[11px] font-bold text-[#94425f]">
            {subpartLetter(index)}
          </span>
          <span>
            <span className="block text-[13.5px] font-semibold leading-7 text-[#554047]">{subpart.prompt}</span>
            <span className="mt-0.5 flex items-center gap-1 text-[10.5px] font-medium text-[#a49298]">
              <Icon name={isMulti ? "check" : "list"} size={11} />
              {isMulti ? "اختاري جميع الإجابات الصحيحة" : "اختاري إجابة واحدة"}
            </span>
          </span>
        </span>
      </legend>
      <div className="mt-2.5 grid gap-1.5 sm:mr-8.5">
        {options.map((option, optionIndex) => {
          const isSelected = selected.includes(option);
          return (
            <label
              key={`${subpart.id}-${optionIndex}`}
              className={`option-row cursor-pointer ${isMulti ? "option-row--square" : ""}`}
              data-selected={isSelected}
            >
              <input
                type={isMulti ? "checkbox" : "radio"}
                name={`group-${subpart.id}`}
                value={option}
                checked={isSelected}
                onChange={() => {
                  if (isMulti) {
                    onChange(isSelected ? selected.filter((value) => value !== option) : [...selected, option]);
                  } else {
                    onChange([option]);
                  }
                }}
                className="sr-only"
              />
              <span className="option-letter">
                {isSelected ? <Icon name="check" size={13} strokeWidth={2.4} /> : subpartLetter(optionIndex)}
              </span>
              <span className="pt-0.5 text-[13px] leading-7 text-[#55434a]">{option}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
