import { describe, expect, it } from 'vitest'
import { docFromText } from '../testing/answers'
import {
  gradePartFraction,
  gradeQuestion,
  isPartAnswered,
  summarizeAnswer,
  summarizeExpected,
} from './grading'
import type { AnswerValue, Part, PartInput, Question } from './types'

const grade = (input: PartInput, value: AnswerValue | undefined) => gradePartFraction(input, value)

describe('choice and true/false', () => {
  const choice: PartInput = {
    kind: 'choice',
    options: [
      { id: 'a', text: 'أ' },
      { id: 'b', text: 'ب' },
    ],
    answer: 'b',
  }
  it('gives full marks only for the model option', () => {
    expect(grade(choice, { t: 'choice', id: 'b' })).toBe(1)
    expect(grade(choice, { t: 'choice', id: 'a' })).toBe(0)
    expect(grade(choice, { t: 'choice', id: null })).toBe(0)
    expect(grade(choice, undefined)).toBe(0)
  })

  it('maps true/false to the stored ids "true" and "false"', () => {
    const tf: PartInput = { kind: 'tf', answer: false }
    expect(grade(tf, { t: 'choice', id: 'false' })).toBe(1)
    expect(grade(tf, { t: 'choice', id: 'true' })).toBe(0)
  })
})

describe('numeric answers typed with the math keypad', () => {
  it('grades the unit-one sums and differences from the typed expression', () => {
    expect(grade({ kind: 'math', answer: 61130 }, { t: 'math', doc: docFromText('48750+12380') })).toBe(1)
    expect(grade({ kind: 'math', answer: 3625650 }, { t: 'math', doc: docFromText('5004600-1378950') })).toBe(1)
    expect(grade({ kind: 'math', answer: 61130 }, { t: 'math', doc: docFromText('61130') })).toBe(1)
  })

  it('accepts a worked line whose result side is correct', () => {
    expect(grade({ kind: 'math', answer: 8120 }, { t: 'math', doc: docFromText('12500-4380=8120') })).toBe(1)
  })

  it('rejects a near-miss such as a carry error', () => {
    expect(grade({ kind: 'math', answer: 6523 }, { t: 'math', doc: docFromText('6413') })).toBe(0)
    expect(grade({ kind: 'math', answer: 275 }, { t: 'math', doc: docFromText('285') })).toBe(0)
  })

  it('honours a tolerance when one is declared', () => {
    expect(grade({ kind: 'math', answer: 10, tolerance: 1 }, { t: 'math', doc: docFromText('11') })).toBe(1)
    expect(grade({ kind: 'math', answer: 10, tolerance: 1 }, { t: 'math', doc: docFromText('12') })).toBe(0)
  })
})

describe('expanded form', () => {
  it('requires the exact place-value terms', () => {
    const input: PartInput = { kind: 'expanded', n: 2090300 }
    expect(grade(input, { t: 'math', doc: docFromText('2000000+90000+300') })).toBe(1)
    expect(grade(input, { t: 'math', doc: docFromText('2000000+900000+300') })).toBe(0)
  })
})

describe('Arabic text answers', () => {
  const words: PartInput = { kind: 'text', exact: ['ستة ملايين ومئتان وثمانية آلاف وخمسون'] }

  it('ignores spaces, punctuation and common orthographic variants', () => {
    expect(grade(words, { t: 'text', v: 'ستة ملايين ومئتان وثمانية آلاف وخمسون' })).toBe(1)
    expect(grade(words, { t: 'text', v: 'ستة ملايين، ومئتان وثمانية الاف و خمسون' })).toBe(1)
    expect(grade(words, { t: 'text', v: 'ستة ملايين ومئتان وثمانية آلاف وخمسين' })).toBe(0)
  })

  it('uses keyword groups for explanatory corrections (every group must match)', () => {
    const fix: PartInput = { kind: 'text', exact: [], keywords: [['أضلاع', 'ضلع'], ['متساو']] }
    expect(grade(fix, { t: 'text', v: 'أضلاع المعيّن الأربعة متساوية' })).toBe(1)
    expect(grade(fix, { t: 'text', v: 'زواياه قائمة' })).toBe(0)
    expect(grade(fix, { t: 'text', v: 'أضلاعه مختلفة' })).toBe(0)
  })

  it('treats an empty or whitespace answer as no credit', () => {
    expect(grade(words, { t: 'text', v: '   ' })).toBe(0)
  })
})

describe('ordered pairs', () => {
  it('keeps the horizontal-then-vertical order', () => {
    const input: PartInput = { kind: 'pair', x: 4, y: 6 }
    expect(grade(input, { t: 'text', v: '(4,6)' })).toBe(1)
    expect(grade(input, { t: 'text', v: '4,6' })).toBe(1)
    expect(grade(input, { t: 'text', v: '(6,4)' })).toBe(0)
  })
})

describe('multi-item parts award partial credit', () => {
  it('order: one mark per correctly placed position', () => {
    const input: PartInput = {
      kind: 'order',
      items: [
        { id: 'a', text: 'أ' },
        { id: 'b', text: 'ب' },
        { id: 'c', text: 'ج' },
      ],
      answer: ['b', 'c', 'a'],
    }
    expect(grade(input, { t: 'order', ids: ['b', 'c', 'a'] })).toBe(1)
    expect(grade(input, { t: 'order', ids: ['b', 'a', 'c'] })).toBeCloseTo(1 / 3)
    expect(grade(input, { t: 'order', ids: ['a', 'b', 'c'] })).toBe(0)
  })

  it('match: fraction of correct pairs', () => {
    const input: PartInput = {
      kind: 'match',
      left: [
        { id: 'A', text: 'A' },
        { id: 'B', text: 'B' },
      ],
      right: [
        { id: 'r1', text: '1' },
        { id: 'r2', text: '2' },
      ],
      answer: { A: 'r1', B: 'r2' },
    }
    expect(grade(input, { t: 'match', pairs: { A: 'r1', B: 'r2' } })).toBe(1)
    expect(grade(input, { t: 'match', pairs: { A: 'r1', B: 'r1' } })).toBe(0.5)
  })

  it('ordered slots: fraction of correctly filled slots', () => {
    const input: PartInput = {
      kind: 'slots',
      bank: [
        { id: 'A', text: 'A' },
        { id: 'B', text: 'B' },
      ],
      slots: [
        { id: 's1', label: 'الأول', answer: 'A' },
        { id: 's2', label: 'الثاني', answer: 'B' },
      ],
    }
    expect(grade(input, { t: 'slots', fill: { s1: 'A', s2: 'B' } })).toBe(1)
    expect(grade(input, { t: 'slots', fill: { s1: 'A', s2: 'A' } })).toBe(0.5)
  })

  it('unordered slots: the two sides of an angle may be given in any order', () => {
    const input: PartInput = {
      kind: 'slots',
      unordered: true,
      bank: [
        { id: 'A', text: 'A' },
        { id: 'C', text: 'C' },
        { id: 'D', text: 'D' },
      ],
      slots: [
        { id: 's1', label: 'الضلع الأول', answer: 'A' },
        { id: 's2', label: 'الضلع الثاني', answer: 'C' },
      ],
    }
    expect(grade(input, { t: 'slots', fill: { s1: 'C', s2: 'A' } })).toBe(1)
    expect(grade(input, { t: 'slots', fill: { s1: 'A', s2: 'D' } })).toBe(0)
    expect(grade(input, { t: 'slots', fill: { s1: 'A', s2: 'A' } })).toBe(0.5)
  })
})

describe('geometry and measurement inputs', () => {
  it('grid point must match exactly', () => {
    const input: PartInput = { kind: 'point', xMax: 7, yMax: 6, answer: { x: 6, y: 2 } }
    expect(grade(input, { t: 'point', p: { x: 6, y: 2 } })).toBe(1)
    expect(grade(input, { t: 'point', p: { x: 2, y: 6 } })).toBe(0)
    expect(grade(input, { t: 'point', p: null })).toBe(0)
  })

  it('number line allows only the declared tolerance', () => {
    const input: PartInput = { kind: 'numberline', min: 600, max: 700, step: 10, labelEvery: 50, answer: 643, tolerance: 4 }
    expect(grade(input, { t: 'num', v: 647 })).toBe(1)
    expect(grade(input, { t: 'num', v: 639 })).toBe(1)
    expect(grade(input, { t: 'num', v: 648 })).toBe(0)
  })

  it('protractor drawing accepts a small touch error but not a wrong angle', () => {
    const input: PartInput = { kind: 'angle-draw', target: 90, tolerance: 4 }
    expect(grade(input, { t: 'angle', deg: 86 })).toBe(1)
    expect(grade(input, { t: 'angle', deg: 94 })).toBe(1)
    expect(grade(input, { t: 'angle', deg: 95 })).toBe(0)
    expect(grade(input, { t: 'angle', deg: null })).toBe(0)
  })
})

describe('answered state and question-level totals', () => {
  it('isPartAnswered is false for an empty math field and true once a symbol exists', () => {
    const input: PartInput = { kind: 'math', answer: 5 }
    expect(isPartAnswered(input, { t: 'math', doc: docFromText('') })).toBe(false)
    expect(isPartAnswered(input, { t: 'math', doc: docFromText('5') })).toBe(true)
  })

  const question: Question = {
    id: 'T1',
    lesson: 'add-subtract',
    skill: 'اختبار',
    pages: 'ص 19',
    style: 'اختبار',
    prompt: 'نص',
    parts: [
      { id: 'p1', points: 1, input: { kind: 'tf', answer: false } },
      { id: 'p2', points: 3, input: { kind: 'expanded', n: 2090300 } },
    ],
    solution: { answer: 'جواب', steps: ['خطوة'], why: 'سبب' },
  }

  it('a wrong true/false with a correct fix earns exactly 3 of 4 marks (partial)', () => {
    const g = gradeQuestion(question, {
      p1: { t: 'choice', id: 'true' },
      p2: { t: 'math', doc: docFromText('2000000+90000+300') },
    })
    expect(g.earned).toBe(3)
    expect(g.max).toBe(4)
    expect(g.status).toBe('partial')
  })

  it('a fully correct answer is "correct" and an empty one is "wrong"', () => {
    const full = gradeQuestion(question, {
      p1: { t: 'choice', id: 'false' },
      p2: { t: 'math', doc: docFromText('2000000+90000+300') },
    })
    expect(full.status).toBe('correct')
    expect(gradeQuestion(question, {}).status).toBe('wrong')
  })

  it('summaries render student and model answers as rich text', () => {
    const input: PartInput = { kind: 'choice', options: [{ id: 'x', text: '$3{,}040{,}607$' }], answer: 'x' }
    expect(summarizeExpected(input)).toBe('$3{,}040{,}607$')
    expect(summarizeAnswer(input, { t: 'choice', id: 'x' })).toBe('$3{,}040{,}607$')
    expect(summarizeAnswer(input, undefined)).toBe('لم تُجب')
  })
})

export type { Part }
