const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";
const FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

/** Western digits -> Arabic-Indic digits (textbook style) for on-screen content. */
export function toAr(s: string | number): string {
  return String(s).replace(/[0-9]/g, (d) => AR_DIGITS[Number(d)]);
}

/** Any digit style -> Western digits (used for grading and the TXT report). */
export function toWestern(s: string): string {
  return String(s)
    .replace(/[٠-٩]/g, (d) => String(AR_DIGITS.indexOf(d)))
    .replace(/[۰-۹]/g, (d) => String(FA_DIGITS.indexOf(d)));
}

/** Normalise a typed numeric answer: Western digits, no spaces/separators. */
export function normNum(s: string): string {
  let t = toWestern(s ?? "").replace(/[\s\u200e\u200f\u061c,،٬٫.]/g, "");
  if (/^\d+$/.test(t)) t = String(parseInt(t, 10));
  return t;
}

export function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

export function fmtDuration(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${pad2(h)}:${pad2(m)}:${pad2(s)}`;
}

export function fmtStamp(ts: number): string {
  const d = new Date(ts);
  const off = -d.getTimezoneOffset();
  const sign = off >= 0 ? "+" : "-";
  const oh = pad2(Math.floor(Math.abs(off) / 60));
  const om = pad2(Math.abs(off) % 60);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(
    d.getMinutes()
  )}:${pad2(d.getSeconds())} (UTC${sign}${oh}:${om})`;
}

export function fmtNum(n: number): string {
  const r = Math.round(n * 100) / 100;
  return Number.isInteger(r) ? String(r) : String(r);
}
