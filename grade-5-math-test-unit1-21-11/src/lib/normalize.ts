/** Converts Arabic-Indic and Persian digits to Western digits (0–9). */
export function toWesternDigits(input: string): string {
  return input
    .replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[\u06f0-\u06f9]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
}

/**
 * Normalizes Arabic text for comparison of typed answers:
 * removes harakat, tatweel, spaces and punctuation; unifies alef/hamza, ya/alef-maqsura, ta-marbuta.
 */
export function normalizeArabicText(input: string): string {
  return toWesternDigits(input)
    .normalize('NFKD')
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    .replace(/[إأآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/[\s\p{P}]/gu, '')
    .toLowerCase()
}
