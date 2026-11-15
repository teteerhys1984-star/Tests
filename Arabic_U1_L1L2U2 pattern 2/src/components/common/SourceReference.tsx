import type { SourceRef } from "../../types/exam";
import { SECTION_LABELS } from "../../data/sources/lessons";
import { toArabicDigits } from "../../utils/arabic";
import { Icon } from "./Icon";

interface SourceReferenceProps {
  source: SourceRef;
  compact?: boolean;
}

/** Internal curriculum reference — shown after submission and in the teacher key only. */
export function SourceReference({ source, compact = false }: SourceReferenceProps) {
  return (
    <div
      className={`flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-[#9b878d] ${
        compact ? "" : "rounded-lg bg-[#fbf6f2] px-2.5 py-1.5"
      }`}
    >
      <span className="inline-flex items-center gap-1 font-semibold text-[#896b77]">
        <Icon name="book" size={11} /> مرجع داخلي:
      </span>
      <span>{source.unit}</span>
      <span aria-hidden="true">•</span>
      <span>درس {source.lessonTitle}</span>
      <span aria-hidden="true">•</span>
      <span>صفحة {toArabicDigits(source.page)}</span>
      <span aria-hidden="true">•</span>
      <span>{SECTION_LABELS[source.section]}</span>
      <span aria-hidden="true">•</span>
      <span>{source.skill}</span>
    </div>
  );
}
