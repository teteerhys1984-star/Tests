/**
 * Math answer documents produced by the on-screen math keypad, plus the arithmetic
 * evaluator and the expanded-form checker used by the grader.
 *
 * A MathDoc is a tree of "boxes": the root box and the numerator/denominator boxes of
 * fractions. Every box is an ordered list of tokens (symbols or fractions). This keeps the
 * fraction editor real: the student types the numerator and the denominator in their own boxes.
 */
import { toWesternDigits } from './normalize'

export type MathTok = { k: 's'; v: string } | { k: 'f'; id: string; n: string; d: string }

export interface MathDoc {
  boxes: Record<string, MathTok[]>
  counter: number
}

export const ROOT = 'r'

export function emptyDoc(): MathDoc {
  return { boxes: { [ROOT]: [] }, counter: 0 }
}

/** Plain text serialization used for grading, e.g. "48750+12380" or "(1)/(2)". */
export function docToText(doc: MathDoc, box: string = ROOT): string {
  return (doc.boxes[box] ?? [])
    .map((t) => (t.k === 's' ? t.v : `(${docToText(doc, t.n)})/(${docToText(doc, t.d)})`))
    .join('')
}

const SYMBOL_LATEX: Record<string, string> = {
  '×': '\\times',
  '÷': '\\div',
  '−': '-',
  '-': '-',
  '+': '+',
  '=': '=',
  '(': '(',
  ')': ')',
}

/** LaTeX used to display a student's answer with KaTeX. */
export function docToLatex(doc: MathDoc, box: string = ROOT): string {
  return (doc.boxes[box] ?? [])
    .map((t) => (t.k === 's' ? (SYMBOL_LATEX[t.v] ?? t.v) : `\\frac{${docToLatex(doc, t.n)}}{${docToLatex(doc, t.d)}}`))
    .join('')
}

/** Normalizes display symbols to the arithmetic symbols the evaluator understands. */
export function normalizeExpression(raw: string): string {
  return toWesternDigits(raw)
    .replace(/[\u200e\u200f\u202a-\u202e\u2066-\u2069]/g, '')
    .replace(/\u066b/g, '.')
    .replace(/[\s,،\u066c]/g, '')
    .replace(/[−–—]/g, '-')
    .replace(/[×⋅]/g, '*')
    .replace(/÷/g, '/')
}

class ParseError extends Error {}

function evaluateNormalized(s: string): number | null {
  if (s.length === 0 || s.length > 300) return null
  let i = 0
  const fail = (): never => {
    throw new ParseError('unexpected input')
  }
  const parseFactor = (): number => {
    const c = s[i]
    if (c === '-') {
      i++
      return -parseFactor()
    }
    if (c === '(') {
      i++
      const v = parseSum()
      if (s[i] !== ')') fail()
      i++
      return v
    }
    const m = /^\d+(?:\.\d+)?/.exec(s.slice(i))
    if (!m) return fail()
    i += m[0].length
    return Number(m[0])
  }
  const parseTerm = (): number => {
    let v = parseFactor()
    while (s[i] === '*' || s[i] === '/') {
      const op = s[i++]
      const r = parseFactor()
      if (op === '*') {
        v *= r
      } else {
        if (r === 0) fail()
        v /= r
      }
    }
    return v
  }
  const parseSum = (): number => {
    let v = parseTerm()
    while (s[i] === '+' || s[i] === '-') {
      const op = s[i++]
      const r = parseTerm()
      v = op === '+' ? v + r : v - r
    }
    return v
  }
  try {
    const v = parseSum()
    if (i !== s.length || !Number.isFinite(v)) return null
    return v
  } catch {
    return null
  }
}

/** Evaluates an arithmetic expression with + − × ÷ and parentheses. Returns null if invalid. */
export function evaluateExpression(raw: string): number | null {
  return evaluateNormalized(normalizeExpression(raw))
}

/**
 * Values a student's typed line may stand for. A line such as "12500-4380=8120" yields the
 * value of each side, so the result is accepted when either side equals the expected number.
 */
export function numericCandidates(raw: string): number[] {
  return normalizeExpression(raw)
    .split('=')
    .map((side) => evaluateNormalized(side))
    .filter((v): v is number => v !== null)
}

/** Place-value terms of n in descending order, e.g. 8070406 → [8000000, 70000, 400, 6]. */
export function expandedTerms(n: number): number[] {
  const digits = String(n).split('')
  const len = digits.length
  const terms: number[] = []
  digits.forEach((d, idx) => {
    if (d !== '0') terms.push(Number(d) * 10 ** (len - 1 - idx))
  })
  return terms
}

/**
 * True when the typed text is exactly the expanded form of n: a sum of terms of the form
 * digit × 10^k, one term per non-zero digit, each term matching a digit and place of n.
 */
export function isExpandedForm(raw: string, n: number): boolean {
  const expected = expandedTerms(n)
  return normalizeExpression(raw)
    .split('=')
    .some((side) => {
      if (!/^[0-9+]+$/.test(side)) return false
      const pieces = side.split('+')
      if (pieces.length !== expected.length) return false
      if (!pieces.every((p) => /^[1-9]0*$/.test(p))) return false
      const values = pieces.map((p) => Number(p)).sort((a, b) => b - a)
      return values.every((v, i) => v === expected[i])
    })
}

/** Formats an integer with thousands separators, e.g. 3040607 → "3,040,607". */
export function formatNumber(n: number): string {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

/** Same as formatNumber but with LaTeX-safe separators for KaTeX. */
export function formatLatex(n: number): string {
  return formatNumber(n).replace(/,/g, '{,}')
}

/** Reads "(x,y)" or "x,y" typed by a student into an ordered pair. The order is preserved. */
export function parsePair(raw: string): { x: number; y: number } | null {
  const s = toWesternDigits(raw)
    .replace(/[\s()\[\]]/g, '')
    .replace(/[،;]/g, ',')
  const m = /^(\d+),(\d+)$/.exec(s)
  if (!m) return null
  return { x: Number(m[1]), y: Number(m[2]) }
}
