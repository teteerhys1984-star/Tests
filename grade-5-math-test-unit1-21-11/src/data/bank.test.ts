import katex from 'katex'
import { describe, expect, it } from 'vitest'
import { gradeQuestion } from '../lib/grading'
import { perfectAnswers } from '../testing/answers'
import type { Question, Rich } from '../lib/types'
import { LESSONS } from './lessons'
import { QUESTIONS, QUESTION_BY_ID, TOTAL_POINTS, questionPoints } from './index'

/** Every rich-text string a student or teacher can see for a question. */
function richStrings(q: Question): Rich[] {
  const out: Rich[] = [q.prompt, q.solution.answer, q.solution.why, ...q.solution.steps]
  if (q.table) out.push(q.table.caption, ...q.table.headers, ...q.table.rows.flat())
  for (const p of q.parts) {
    if (p.prompt) out.push(p.prompt)
    const i = p.input
    if (i.kind === 'choice') out.push(...i.options.map((o) => o.text))
    if (i.kind === 'order') out.push(...i.items.map((o) => o.text))
    if (i.kind === 'match') out.push(...i.left.map((o) => o.text), ...i.right.map((o) => o.text))
    if (i.kind === 'slots') out.push(...i.bank.map((o) => o.text), ...i.slots.map((s) => s.label))
  }
  return out
}

const pageRange = (text: string): [number, number] => {
  const m = /(\d+)(?:\s*–\s*(\d+))?/.exec(text)
  if (!m) throw new Error(`no page in ${text}`)
  const a = Number(m[1])
  return [a, m[2] ? Number(m[2]) : a]
}

describe('blueprint: 30 questions, 100 marks, the required lesson distribution', () => {
  it('has exactly 30 main questions with unique identifiers', () => {
    expect(QUESTIONS).toHaveLength(30)
    expect(new Set(QUESTIONS.map((q) => q.id)).size).toBe(30)
  })

  it('totals exactly 100 marks, and each question has a clear mark value', () => {
    expect(TOTAL_POINTS).toBe(100)
    for (const q of QUESTIONS) {
      expect(Number.isInteger(questionPoints(q))).toBe(true)
      expect(questionPoints(q)).toBeGreaterThan(0)
    }
  })

  it('matches the questions and marks of every lesson in the blueprint', () => {
    for (const lesson of LESSONS) {
      const qs = QUESTIONS.filter((q) => q.lesson === lesson.id)
      const points = qs.reduce((s, q) => s + questionPoints(q), 0)
      expect({ lesson: lesson.id, count: qs.length, points }).toEqual({
        lesson: lesson.id,
        count: lesson.blueprint.questions,
        points: lesson.blueprint.points,
      })
    }
    expect(LESSONS.reduce((s, l) => s + l.blueprint.questions, 0)).toBe(30)
    expect(LESSONS.reduce((s, l) => s + l.blueprint.points, 0)).toBe(100)
  })

  it('covers all eight lessons and does not follow lesson order', () => {
    expect(new Set(QUESTIONS.map((q) => q.lesson)).size).toBe(8)
    const lessonOrder = LESSONS.map((l) => l.id)
    const sequence = QUESTIONS.map((q) => lessonOrder.indexOf(q.lesson))
    const sorted = [...sequence].sort((a, b) => a - b)
    expect(sequence).not.toEqual(sorted)
    // Consecutive questions should jump between subjects, not stay on one lesson.
    const adjacentSame = sequence.filter((v, i) => i > 0 && v === sequence[i - 1]).length
    expect(adjacentSame).toBeLessThan(3)
  })

  it('every question cites page references that fall inside its lesson range', () => {
    for (const q of QUESTIONS) {
      const lesson = LESSONS.find((l) => l.id === q.lesson)!
      const [lo, hi] = pageRange(lesson.pages)
      const [qa, qb] = pageRange(q.pages)
      expect(qa).toBeGreaterThanOrEqual(lo)
      expect(qb).toBeLessThanOrEqual(hi)
    }
  })
})

describe('answer keys are internally consistent', () => {
  it('every choice, match, slot and order reference points to an existing option', () => {
    for (const q of QUESTIONS) {
      for (const p of q.parts) {
        const i = p.input
        if (i.kind === 'choice') {
          expect(i.options.map((o) => o.id)).toContain(i.answer)
        }
        if (i.kind === 'order') {
          const ids = i.items.map((o) => o.id)
          expect(i.answer.every((id) => ids.includes(id))).toBe(true)
          expect(new Set(i.answer).size).toBe(ids.length)
        }
        if (i.kind === 'match') {
          const left = i.left.map((o) => o.id)
          const right = i.right.map((o) => o.id)
          for (const [l, r] of Object.entries(i.answer)) {
            expect(left).toContain(l)
            expect(right).toContain(r)
          }
          expect(new Set(Object.values(i.answer)).size).toBe(Object.keys(i.answer).length)
        }
        if (i.kind === 'slots') {
          const bank = i.bank.map((o) => o.id)
          for (const s of i.slots) expect(bank).toContain(s.answer)
        }
      }
    }
  })

  it('a model answer earns full marks for every question (perfect-answer test)', () => {
    for (const q of QUESTIONS) {
      const g = gradeQuestion(q, perfectAnswers(q))
      expect({ id: q.id, earned: g.earned, max: g.max }).toEqual({ id: q.id, earned: g.max, max: g.max })
      expect(g.status).toBe('correct')
    }
  })

  it('an empty submission earns nothing', () => {
    for (const q of QUESTIONS) {
      expect(gradeQuestion(q, {}).earned).toBe(0)
    }
  })

  it('a deliberately wrong answer never earns full marks', () => {
    // A numeric wrong answer, a wrong choice, and an invalid point, on the questions that use them.
    const q = QUESTION_BY_ID['E1']
    const wrong = { [q.parts[0].id]: { t: 'math' as const, doc: { boxes: { r: [{ k: 's' as const, v: '1' }] }, counter: 0 } } }
    expect(gradeQuestion(q, wrong).status).toBe('wrong')

    const f1 = QUESTION_BY_ID['F1']
    const pick = { [f1.parts[0].id]: { t: 'choice' as const, id: 'a' } }
    expect(gradeQuestion(f1, pick).earned).toBe(0)

    const g3 = QUESTION_BY_ID['G3']
    const point = { [g3.parts[0].id]: { t: 'point' as const, p: { x: 4, y: 1 } } }
    expect(gradeQuestion(g3, point).parts[0].earned).toBe(0)
  })
})

describe('mathematical content is renderable and clean', () => {
  it('every rich string has balanced $ markers', () => {
    for (const q of QUESTIONS) {
      for (const s of richStrings(q)) {
        expect((s.match(/\$/g) ?? []).length % 2, `${q.id}: ${s}`).toBe(0)
      }
    }
  })

  it('every math segment compiles with KaTeX in strict-free mode without throwing', () => {
    for (const q of QUESTIONS) {
      for (const s of richStrings(q)) {
        s.split('$').forEach((seg, i) => {
          if (i % 2 === 1) {
            expect(() => katex.renderToString(seg, { throwOnError: true })).not.toThrow()
          }
        })
      }
    }
  })

  it('shows no raw LaTeX commands in plain Arabic text (backslashes only inside math)', () => {
    for (const q of QUESTIONS) {
      for (const s of richStrings(q)) {
        const outside = s.split('$').filter((_, i) => i % 2 === 0).join('')
        expect(outside.includes('\\'), `${q.id}: ${outside}`).toBe(false)
      }
    }
  })

  it('every question has at least one part and a complete solution (steps, why, answer)', () => {
    for (const q of QUESTIONS) {
      expect(q.parts.length).toBeGreaterThan(0)
      expect(q.solution.steps.length).toBeGreaterThanOrEqual(2)
      expect(q.solution.why.length).toBeGreaterThan(10)
      expect(q.solution.answer.length).toBeGreaterThan(0)
    }
  })
})
