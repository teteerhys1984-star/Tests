/**
 * Grading: converts a student's answers into earned marks, including partial credit for
 * multi-item parts (order, match, slots). Pure functions only; fully unit-tested.
 */
import { docToLatex, docToText, evaluateExpression, expandedTerms, formatLatex, isExpandedForm, numericCandidates, parsePair } from './expression'
import { normalizeArabicText } from './normalize'
import { withinTolerance } from './geometry'
import type { AnswerValue, Answers, Opt, Part, PartInput, Question, Rich } from './types'

const round2 = (n: number) => Math.round(n * 100) / 100

/** True when the student has provided something for this part (used to enable submission). */
export function isPartAnswered(input: PartInput, value: AnswerValue | undefined): boolean {
  if (!value) return false
  switch (input.kind) {
    case 'choice':
    case 'tf':
      return value.t === 'choice' && value.id !== null
    case 'math':
    case 'expanded':
      return value.t === 'math' && docToText(value.doc).trim().length > 0
    case 'text':
    case 'pair':
      return value.t === 'text' && value.v.trim().length > 0
    case 'order':
      return value.t === 'order' && value.ids.length === input.answer.length
    case 'match':
      return value.t === 'match' && Object.keys(value.pairs).length === Object.keys(input.answer).length
    case 'slots':
      return value.t === 'slots' && input.slots.every((s) => Boolean(value.fill[s.id]))
    case 'point':
      return value.t === 'point' && value.p !== null
    case 'numberline':
      return value.t === 'num' && value.v !== null
    case 'angle-draw':
      return value.t === 'angle' && value.deg !== null
    default:
      return false
  }
}

/** Returns the fraction of the part's marks earned, between 0 and 1. */
export function gradePartFraction(input: PartInput, value: AnswerValue | undefined): number {
  if (!value) return 0
  switch (input.kind) {
    case 'choice': {
      if (value.t !== 'choice' || value.id === null) return 0
      return value.id === input.answer ? 1 : 0
    }
    case 'tf': {
      if (value.t !== 'choice' || value.id === null) return 0
      return value.id === String(input.answer) ? 1 : 0
    }
    case 'math': {
      if (value.t !== 'math') return 0
      const tol = input.tolerance ?? 0
      const ok = numericCandidates(docToText(value.doc)).some((v) => withinTolerance(v, input.answer, tol))
      return ok ? 1 : 0
    }
    case 'expanded': {
      if (value.t !== 'math') return 0
      return isExpandedForm(docToText(value.doc), input.n) ? 1 : 0
    }
    case 'text': {
      if (value.t !== 'text') return 0
      const norm = normalizeArabicText(value.v)
      if (!norm) return 0
      if (input.exact.some((e) => normalizeArabicText(e) === norm)) return 1
      if (input.keywords && input.keywords.length > 0) {
        const allGroups = input.keywords.every((group) => group.some((k) => norm.includes(normalizeArabicText(k))))
        if (allGroups) return 1
      }
      return 0
    }
    case 'pair': {
      if (value.t !== 'text') return 0
      const p = parsePair(value.v)
      return p !== null && p.x === input.x && p.y === input.y ? 1 : 0
    }
    case 'slots': {
      if (value.t !== 'slots') return 0
      if (input.unordered) {
        const expected = new Set(input.slots.map((s) => s.answer))
        const chosen = new Set(Object.values(value.fill).filter((v) => v !== undefined && v !== ''))
        const matched = [...expected].filter((e) => chosen.has(e)).length
        const wrong = [...chosen].filter((c) => !expected.has(c)).length
        return Math.max(0, (matched - wrong) / expected.size)
      }
      const correct = input.slots.filter((s) => value.fill[s.id] === s.answer).length
      return correct / input.slots.length
    }
    case 'order': {
      if (value.t !== 'order') return 0
      const n = input.answer.length
      let ok = 0
      for (let i = 0; i < n; i++) if (value.ids[i] === input.answer[i]) ok++
      return ok / n
    }
    case 'match': {
      if (value.t !== 'match') return 0
      const keys = Object.keys(input.answer)
      const ok = keys.filter((k) => value.pairs[k] === input.answer[k]).length
      return ok / keys.length
    }
    case 'point': {
      if (value.t !== 'point' || !value.p) return 0
      return value.p.x === input.answer.x && value.p.y === input.answer.y ? 1 : 0
    }
    case 'numberline': {
      if (value.t !== 'num' || value.v === null) return 0
      return withinTolerance(value.v, input.answer, input.tolerance) ? 1 : 0
    }
    case 'angle-draw': {
      if (value.t !== 'angle' || value.deg === null) return 0
      return withinTolerance(value.deg, input.target, input.tolerance) ? 1 : 0
    }
    default:
      return 0
  }
}

export interface PartGrade {
  partId: string
  label?: string
  points: number
  earned: number
  fraction: number
  answered: boolean
}

export type QuestionStatus = 'correct' | 'partial' | 'wrong'

export interface QuestionGrade {
  questionId: string
  earned: number
  max: number
  status: QuestionStatus
  parts: PartGrade[]
}

export function gradePart(part: Part, value: AnswerValue | undefined): PartGrade {
  const fraction = gradePartFraction(part.input, value)
  return {
    partId: part.id,
    label: part.label,
    points: part.points,
    earned: round2(part.points * fraction),
    fraction,
    answered: isPartAnswered(part.input, value),
  }
}

export function gradeQuestion(question: Question, answers: Answers): QuestionGrade {
  const parts = question.parts.map((p) => gradePart(p, answers[p.id]))
  const max = round2(question.parts.reduce((s, p) => s + p.points, 0))
  const earned = round2(parts.reduce((s, p) => s + p.earned, 0))
  const status: QuestionStatus = earned >= max ? 'correct' : earned > 0 ? 'partial' : 'wrong'
  return { questionId: question.id, earned, max, status, parts }
}

export function isQuestionComplete(question: Question, answers: Answers): boolean {
  return question.parts.every((p) => isPartAnswered(p.input, answers[p.id]))
}

function optionText(options: Opt[], id: string | null | undefined): Rich | null {
  if (!id) return null
  return options.find((o) => o.id === id)?.text ?? null
}

/** Human-readable (Rich) summary of what the student answered. */
export function summarizeAnswer(input: PartInput, value: AnswerValue | undefined): Rich {
  const none = 'لم تُجب'
  if (!value) return none
  switch (input.kind) {
    case 'choice':
      return optionText(input.options, value.t === 'choice' ? value.id : null) ?? none
    case 'tf':
      return value.t === 'choice' && value.id ? (value.id === 'true' ? 'صح' : 'خطأ') : none
    case 'math':
    case 'expanded':
      if (value.t !== 'math' || !docToText(value.doc)) return none
      return `$${docToLatex(value.doc)}$`
    case 'text':
    case 'pair':
      return value.t === 'text' && value.v.trim() ? value.v.trim() : none
    case 'slots': {
      if (value.t !== 'slots') return none
      return input.slots
        .map((s) => `${s.label}: ${optionText(input.bank, value.fill[s.id]) ?? 'فارغ'}`)
        .join('، ')
    }
    case 'order': {
      if (value.t !== 'order' || value.ids.length === 0) return none
      return value.ids.map((id) => optionText(input.items, id) ?? id).join(' ← ')
    }
    case 'match': {
      if (value.t !== 'match') return none
      return Object.keys(input.answer)
        .map((l) => {
          const left = optionText(input.left, l) ?? l
          const right = value.pairs[l] ? (optionText(input.right, value.pairs[l]) ?? value.pairs[l]) : 'فارغ'
          return `${left} ↔ ${right}`
        })
        .join('، ')
    }
    case 'point':
      return value.t === 'point' && value.p ? `$(${value.p.x},${value.p.y})$` : none
    case 'numberline':
      return value.t === 'num' && value.v !== null ? `$${formatLatex(Math.round(value.v))}$` : none
    case 'angle-draw':
      return value.t === 'angle' && value.deg !== null ? `$${value.deg}^{\\circ}$` : none
    default:
      return none
  }
}

/** Rich summary of the model answer for one part. */
export function summarizeExpected(input: PartInput): Rich {
  switch (input.kind) {
    case 'choice':
      return optionText(input.options, input.answer) ?? ''
    case 'tf':
      return input.answer ? 'صح' : 'خطأ'
    case 'math':
      return `$${formatLatex(input.answer)}$`
    case 'expanded':
      return `$${expandedTerms(input.n).map((t) => formatLatex(t)).join('+')}$`
    case 'text':
      return input.exact[0] ?? (input.keywords ?? []).map((g) => g.join(' أو ')).join(' و')
    case 'pair':
      return `$(${input.x},${input.y})$`
    case 'slots':
      return input.slots.map((s) => `${s.label}: ${optionText(input.bank, s.answer) ?? s.answer}`).join('، ')
    case 'order':
      return input.answer.map((id) => optionText(input.items, id) ?? id).join(' ← ')
    case 'match':
      return Object.entries(input.answer)
        .map(([l, r]) => `${optionText(input.left, l) ?? l} ↔ ${optionText(input.right, r) ?? r}`)
        .join('، ')
    case 'point':
      return `$(${input.answer.x},${input.answer.y})$`
    case 'numberline':
      return `$${formatLatex(input.answer)}$`
    case 'angle-draw':
      return `$${input.target}^{\\circ}$`
    default:
      return ''
  }
}

/** Sanity helper used by tests: an arithmetic check that does not depend on the grader. */
export function evaluateForCheck(raw: string): number | null {
  return evaluateExpression(raw)
}
