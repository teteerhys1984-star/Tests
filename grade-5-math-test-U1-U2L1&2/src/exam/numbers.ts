/** Convert Arabic-Indic / Persian digits to Western digits. */
export function normalizeDigits(s: string): string {
  return s
    .replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[\u06f0-\u06f9]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
}

/**
 * Parse a student's numeric entry. Accepts thousands separators (comma, Arabic comma,
 * space), Arabic-Indic digits and simple fractions like "3/4" (evaluated exactly when integer).
 * Returns null if the text is not a valid number.
 */
export function parseNumber(raw: string | undefined | null): number | null {
  if (raw == null) return null
  let s = normalizeDigits(String(raw)).trim()
  s = s.replace(/[،,\s\u00a0]/g, '').replace(/[−–]/g, '-').replace(/٫/g, '.')
  if (s === '') return null
  const frac = s.match(/^(-?\d+)\/(\d+)$/)
  if (frac) {
    const d = Number(frac[2])
    if (d === 0) return null
    return Number(frac[1]) / d
  }
  if (!/^-?\d+(\.\d+)?$/.test(s)) return null
  return Number(s)
}

export function numbersEqual(a: number | null, b: number): boolean {
  if (a === null || !Number.isFinite(a)) return false
  return Math.abs(a - b) < 1e-9
}

/** Compare two actual numeric values (never strings). */
export function compareNumbers(a: number, b: number): '<' | '>' | '=' {
  if (a < b) return '<'
  if (a > b) return '>'
  return '='
}

export function isSorted(values: number[], direction: 'asc' | 'desc'): boolean {
  for (let i = 1; i < values.length; i++) {
    if (direction === 'asc' && values[i - 1] > values[i]) return false
    if (direction === 'desc' && values[i - 1] < values[i]) return false
  }
  return true
}

export function formatNumber(n: number): string {
  return n.toLocaleString('en-US')
}

/** Format a number for KaTeX with thin thousands separators. */
export function texNumber(n: number): string {
  return formatNumber(n).replace(/,/g, '{,}')
}
