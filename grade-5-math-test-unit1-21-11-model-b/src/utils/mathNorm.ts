/**
 * Mathematical & Arabic normalization utilities for Grade 5 Unit 1 Exam.
 * Ensures numerical comparisons are always performed numerically (never as raw strings)
 * and ordered pairs strictly preserve (x, y) = (horizontal, vertical).
 */

export function normalizeDigitsAndSymbols(raw: string): string {
  if (!raw) return ''
  return raw
    .replace(/[\u200e\u200f\u202a-\u202e\u2066-\u2069]/gu, '')
    .replace(/[٠-٩]/gu, d => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/gu, d => String(d.charCodeAt(0) - 0x06f0))
    .replace(/[−–—]/gu, '-')
    .replace(/[×✕∗]/gu, '*')
    .replace(/[÷]/gu, '/')
}

/**
 * Parses a natural number from student input, allowing standard commas/spaces/units
 * (e.g. "7,050,309", "7050309", "7 050 309", "70°", "5 cm", "5سم").
 * Returns null if the input does not contain a valid natural number.
 */
export function parseNaturalNumber(raw: string): number | null {
  const cleaned = normalizeDigitsAndSymbols(raw)
    .replace(/°|درجة|درجات|سم|cm|ل\.س|دفتر|دفتراً|زائر|زائراً|قصة|قصص|نقطة|زهور|زهرة/giu, '')
    .trim()
  if (!cleaned) return null

  // Remove grouping separators (comma, Arabic comma, thousands separator, spaces)
  const stripped = cleaned.replace(/[,،٬\s]+/gu, '')
  if (!/^\d+$/u.test(stripped)) return null

  const num = Number(stripped)
  if (!Number.isSafeInteger(num) || num < 0) return null
  return num
}

/**
 * Compares two numeric inputs strictly by numerical value.
 */
export function isNumericallyEqual(studentRaw: string, expectedValue: number): boolean {
  const parsed = parseNaturalNumber(studentRaw)
  return parsed !== null && parsed === expectedValue
}

export interface OrderedPairValue {
  x: number
  y: number
}

/**
 * Parses an ordered pair (x, y) where the first coordinate is strictly horizontal (X)
 * and the second coordinate is strictly vertical (Y).
 * Accepts "(6, 4)", "6, 4", "6 , 4", "(6 ، 4)", "A(6,4)", etc.
 */
export function parseOrderedPair(raw: string): OrderedPairValue | null {
  const cleaned = normalizeDigitsAndSymbols(raw).trim()
  if (!cleaned) return null

  const match = cleaned.match(
    /^[A-Za-zأ-ي]?\s*\(?\s*(\d+)\s*[,،;؛\s]\s*(\d+)\s*\)?$/u
  )
  if (!match) return null

  const x = Number(match[1])
  const y = Number(match[2])
  if (!Number.isSafeInteger(x) || !Number.isSafeInteger(y)) return null
  return { x, y }
}

/**
 * Normalizes Arabic text for robust comparison of verbal numbers and mathematical explanations.
 */
export function normalizeArabicText(raw: string): string {
  if (!raw) return ''
  return normalizeDigitsAndSymbols(raw)
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[\u064b-\u065f\u0670\u0640]/gu, '') // strip tashkeel & tatweel
    .replace(/[أإآٱ]/gu, 'ا')
    .replace(/ة/gu, 'ه')
    .replace(/ى/gu, 'ي')
    .replace(/ؤ/gu, 'و')
    .replace(/ئ/gu, 'ي')
    .replace(/ثلاثمايه|ثلاثمائه|ثلاثميه/gu, 'ثلاثمئه')
    .replace(/اربعمايه|اربعمائه|اربعميه/gu, 'اربعمئه')
    .replace(/خمسمايه|خمسمائه|خمسميه/gu, 'خمسمئه')
    .replace(/ستمايه|ستمائه|ستميه/gu, 'ستمئه')
    .replace(/سبعمايه|سبعمائه|سبعميه/gu, 'سبعمئه')
    .replace(/ثمانمايه|ثمانمائه|ثمانميه/gu, 'ثمانمئه')
    .replace(/تسعمايه|تسعمائه|تسعميه/gu, 'تسعمئه')
    .replace(/مائتان|مئتين|مائتين/gu, 'مئتان')
    .replace(/مائه|ميه/gu, 'مئه')
    .replace(/[.,،؛:!؟"'()[\]{}]/gu, ' ')
    .replace(/\s+/gu, ' ')
    .trim()
}

/**
 * Formats a number with commas in LTR safe format (e.g., 7,050,309).
 */
export function formatNumberCommas(n: number): string {
  return n.toLocaleString('en-US')
}

/**
 * Formats seconds into HH:MM:SS strictly.
 */
export function formatDurationHHMMSS(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds))
  const hours = Math.floor(safeSeconds / 3600)
  const minutes = Math.floor((safeSeconds % 3600) / 60)
  const seconds = safeSeconds % 60
  const pad = (v: number) => String(v).padStart(2, '0')
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
}
