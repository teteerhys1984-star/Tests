import type { Level } from "@/content/problems";

/** Western digits only — the brief explicitly asks for 1, 2, 3 … everywhere. */
export function ar(value: number | string): string {
  return String(value);
}

export function padAr(value: number): string {
  return String(value).padStart(2, "0");
}

export const levelStyle: Record<Level, string> = {
  تأسيسي: "bg-[#eaf3e7] text-[#3f6d50] ring-[#d5e5cf]",
  متوسط: "bg-[#f6efdf] text-[#89642f] ring-[#eaddc2]",
  "تحدٍّ": "bg-[#e8eeec] text-[#35615b] ring-[#d5e2dd]",
};
