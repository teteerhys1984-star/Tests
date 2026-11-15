const ARABIC_INDIC = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];

/** Convert western digits to Arabic-Indic numerals for display. */
export function toArabicDigits(value: string | number): string {
  return String(value).replace(/\d/g, (d) => ARABIC_INDIC[Number(d)]);
}

/** Format a duration as an exact HH:MM:SS stopwatch (western digits, required format). */
export function formatStopwatch(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  return [hours, minutes, seconds].map((part) => String(part).padStart(2, "0")).join(":");
}

/** Human readable Arabic duration (used on results/report). */
export function formatArabicDuration(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  const pieces: string[] = [];
  if (hours > 0) pieces.push(`${toArabicDigits(hours)} ساعة`);
  if (minutes > 0) pieces.push(`${toArabicDigits(minutes)} دقيقة`);
  pieces.push(`${toArabicDigits(seconds)} ثانية`);
  return pieces.join(" و");
}

export function formatDateTime(timestamp: number): string {
  try {
    const formatted = new Intl.DateTimeFormat("ar", {
      dateStyle: "full",
      timeStyle: "medium",
      calendar: "gregory",
      numberingSystem: "latn",
    }).format(new Date(timestamp));
    return toArabicDigits(formatted);
  } catch {
    return new Date(timestamp).toLocaleString("ar");
  }
}

export const SUBPART_LABELS = ["أ", "ب", "ج", "د", "هـ", "و", "ز", "ح"];

export function subpartLetter(index: number): string {
  return SUBPART_LABELS[index] ?? String(index + 1);
}
