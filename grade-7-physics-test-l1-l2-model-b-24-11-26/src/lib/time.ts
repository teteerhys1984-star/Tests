/**
 * تنسيق التواريخ والأزمنة والأرقام بأرقام لاتينية (0–9) حصراً،
 * تماشياً مع قواعد عرض المنصة (لا أرقام عربية-هندية في الواجهة المنشورة).
 */

const EASTERN_DIGITS = /[٠١٢٣٤٥٦٧٨٩]/g;

export function toLatinDigits(value: string | number): string {
  return String(value).replace(EASTERN_DIGITS, (digit) => String(digit.charCodeAt(0) - 0x0660));
}

export function num(value: number | string): string {
  return toLatinDigits(value);
}

function fmt(date: Date, options: Intl.DateTimeFormatOptions): string {
  try {
    return new Intl.DateTimeFormat("ar", { ...options, numberingSystem: "latn" }).format(date);
  } catch {
    return toLatinDigits(date.toLocaleString());
  }
}

const WEEKDAYS = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

/** «السبت 22/11/2026 — الساعة 14:05:09» بأرقام لاتينية. */
export function formatLong(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const day = pad(date.getDate());
  const month = pad(date.getMonth() + 1);
  const year = date.getFullYear();
  const hour = pad(date.getHours());
  const minute = pad(date.getMinutes());
  const second = pad(date.getSeconds());
  return `${WEEKDAYS[date.getDay()]} ${toLatinDigits(`${day}/${month}/${year}`)} — الساعة ${toLatinDigits(
    `${hour}:${minute}:${second}`,
  )}`;
}

export function formatDateOnly(date: Date): string {
  return toLatinDigits(fmt(date, { year: "numeric", month: "2-digit", day: "2-digit" }));
}

/** HH:MM:SS */
export function formatDuration(milliseconds: number): string {
  const total = Math.max(0, Math.floor(milliseconds / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return toLatinDigits(`${pad(h)}:${pad(m)}:${pad(s)}`);
}

/** «3 دقيقة و 12 ثانية» */
export function formatDurationWords(milliseconds: number): string {
  const total = Math.max(0, Math.floor(milliseconds / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const parts: string[] = [];
  if (h) parts.push(`${toLatinDigits(h)} ساعة`);
  if (m) parts.push(`${toLatinDigits(m)} دقيقة`);
  parts.push(`${toLatinDigits(s)} ثانية`);
  return parts.join(" و");
}

/** نسبة مئوية بمنزلة عشرية واحدة افتراضياً. */
export function pct(value: number, digits = 1): string {
  return `${toLatinDigits(value.toFixed(digits))}%`;
}
