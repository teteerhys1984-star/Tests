/**
 * Test helpers: build a model (perfect) answer for any part, and a MathDoc from typed text
 * using the same editor operations the keypad uses.
 */
import { expandedTerms, emptyDoc, type MathDoc } from '../lib/expression'
import { insertSymbol, startCursor } from '../lib/mathEditor'
import type { AnswerValue, Answers, Part, Question } from '../lib/types'

export function docFromText(text: string): MathDoc {
  let doc = emptyDoc()
  let cur = startCursor(doc)
  for (const ch of text) {
    const r = insertSymbol(doc, cur, ch)
    doc = r.doc
    cur = r.cur
  }
  return doc
}

/** The exact model answer for a part, expressed as the student's AnswerValue. */
export function perfectAnswer(part: Part): AnswerValue {
  const input = part.input
  switch (input.kind) {
    case 'choice':
      return { t: 'choice', id: input.answer }
    case 'tf':
      return { t: 'choice', id: String(input.answer) }
    case 'math':
      return { t: 'math', doc: docFromText(String(input.answer)) }
    case 'expanded':
      return { t: 'math', doc: docFromText(expandedTerms(input.n).join('+')) }
    case 'text':
      return { t: 'text', v: input.exact[0] ?? (input.keywords ?? []).map((g) => g[0]).join(' ') }
    case 'pair':
      return { t: 'text', v: `(${input.x},${input.y})` }
    case 'slots':
      return { t: 'slots', fill: Object.fromEntries(input.slots.map((s) => [s.id, s.answer])) }
    case 'order':
      return { t: 'order', ids: [...input.answer] }
    case 'match':
      return { t: 'match', pairs: { ...input.answer } }
    case 'point':
      return { t: 'point', p: { ...input.answer } }
    case 'numberline':
      return { t: 'num', v: input.answer }
    case 'angle-draw':
      return { t: 'angle', deg: input.target }
  }
}

export function perfectAnswers(question: Question): Answers {
  const out: Answers = {}
  for (const p of question.parts) out[p.id] = perfectAnswer(p)
  return out
}
