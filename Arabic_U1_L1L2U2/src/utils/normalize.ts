/**
 * Normalise Arabic text for comparison: removes diacritics (tashkeel), tatweel,
 * punctuation and extra spaces. Hamza forms (أ إ ا آ) and taa forms (ة ه ت) are
 * deliberately PRESERVED because they are the very spelling skills being tested.
 */
export function normalizeArabic(s: string): string {
  return s
    .replace(/[\u064B-\u0652\u0670\u0640]/g, '')
    .replace(/[.،,؛;:!؟?«»"'()\-–]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';
export const toArabicDigits = (v: number | string) =>
  String(v).replace(/\d/g, (d) => ARABIC_DIGITS[Number(d)]);

export function fmtMarks(n: number): string {
  const r = Math.round(n * 100) / 100;
  return toArabicDigits(Number.isInteger(r) ? r : r.toFixed(r * 10 === Math.round(r * 10) ? 1 : 2));
}
