import { describe, expect, it } from 'vitest'
import {
  docToLatex,
  docToText,
  emptyDoc,
  evaluateExpression,
  expandedTerms,
  formatNumber,
  isExpandedForm,
  numericCandidates,
  parsePair,
  type MathDoc,
} from './expression'

describe('evaluateExpression — arithmetic used by the grader', () => {
  it('computes the unit-one addition and subtraction examples exactly', () => {
    expect(evaluateExpression('48,750 + 12,380')).toBe(61130)
    expect(evaluateExpression('5,004,600 − 1,378,950')).toBe(3625650)
    expect(evaluateExpression('12500-4380-3250')).toBe(4870)
    expect(evaluateExpression('3120−2845')).toBe(275)
    expect(evaluateExpression('3678+2845')).toBe(6523)
  })

  it('accepts Arabic-Indic digits typed on an Arabic keyboard', () => {
    expect(evaluateExpression('٤٨٧٥٠ + ١٢٣٨٠')).toBe(61130)
  })

  it('respects precedence and parentheses', () => {
    expect(evaluateExpression('2+3×4')).toBe(14)
    expect(evaluateExpression('(2+3)×4')).toBe(20)
    expect(evaluateExpression('12÷4')).toBe(3)
    expect(evaluateExpression('2×(9+6)')).toBe(30)
  })

  it('returns null for empty, malformed, unbalanced and divide-by-zero input', () => {
    expect(evaluateExpression('')).toBeNull()
    expect(evaluateExpression('5+')).toBeNull()
    expect(evaluateExpression('(2+3')).toBeNull()
    expect(evaluateExpression('8÷0')).toBeNull()
    expect(evaluateExpression('2x3')).toBeNull()
  })
})

describe('numericCandidates — a student may write a full line such as 12500-4380=8120', () => {
  it('evaluates both sides of an equality', () => {
    expect(numericCandidates('12500-4380=8120')).toContain(8120)
    expect(numericCandidates('8120=12500-4380')).toContain(8120)
  })

  it('returns a single value for a plain number and nothing for garbage', () => {
    expect(numericCandidates('61,130')).toEqual([61130])
    expect(numericCandidates('abc')).toEqual([])
  })
})

describe('expanded form (الصيغة الموسّعة)', () => {
  it('derives one term per non-zero digit, in place-value order', () => {
    expect(expandedTerms(8070406)).toEqual([8000000, 70000, 400, 6])
    expect(expandedTerms(2090300)).toEqual([2000000, 90000, 300])
    expect(expandedTerms(1000)).toEqual([1000])
  })

  it('accepts exact expanded forms in any order and with separators', () => {
    expect(isExpandedForm('8000000+70000+400+6', 8070406)).toBe(true)
    expect(isExpandedForm('8,000,000 + 70,000 + 400 + 6', 8070406)).toBe(true)
    expect(isExpandedForm('6+400+70000+8000000', 8070406)).toBe(true)
    expect(isExpandedForm('2000000+90000+300', 2090300)).toBe(true)
  })

  it('rejects the classic place-value mistake and other wrong forms', () => {
    expect(isExpandedForm('2000000+900000+300', 2090300)).toBe(false)
    expect(isExpandedForm('8000000+7000+400+6', 8070406)).toBe(false)
    expect(isExpandedForm('8070406', 8070406)).toBe(false)
    expect(isExpandedForm('8000000+70000+400+6+0', 8070406)).toBe(false)
    expect(isExpandedForm('8000000+70000+400', 8070406)).toBe(false)
  })

  it('accepts the two-term form of 11 (10 + 1) but not 1 + 1 + ... for a single digit', () => {
    expect(isExpandedForm('10+1', 11)).toBe(true)
    expect(isExpandedForm('1+1', 11)).toBe(false)
  })
})

describe('formatting and ordered pairs', () => {
  it('formats thousands separators', () => {
    expect(formatNumber(3040607)).toBe('3,040,607')
    expect(formatNumber(500)).toBe('500')
  })

  it('reads ordered pairs in (horizontal, vertical) order and rejects malformed input', () => {
    expect(parsePair('(4,6)')).toEqual({ x: 4, y: 6 })
    expect(parsePair('6،4')).toEqual({ x: 6, y: 4 })
    expect(parsePair(' 4 , 6 ')).toEqual({ x: 4, y: 6 })
    expect(parsePair('(4,6,2)')).toBeNull()
    expect(parsePair('abc')).toBeNull()
  })
})

describe('MathDoc serialization', () => {
  const doc: MathDoc = {
    boxes: {
      r: [
        { k: 's', v: '1' },
        { k: 'f', id: 'f1', n: 'f1n', d: 'f1d' },
      ],
      f1n: [{ k: 's', v: '2' }],
      f1d: [{ k: 's', v: '3' }],
    },
    counter: 1,
  }

  it('serializes fractions with explicit parentheses for grading', () => {
    expect(docToText(doc)).toBe('1(2)/(3)')
  })

  it('renders fractions as LaTeX for KaTeX display', () => {
    expect(docToLatex(doc)).toBe('1\\frac{2}{3}')
    expect(docToText(emptyDoc())).toBe('')
  })
})
