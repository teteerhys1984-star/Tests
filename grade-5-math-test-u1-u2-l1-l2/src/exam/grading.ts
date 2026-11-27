import type { Answers, AnswerValue, ExamResult, MainQuestion, SubQuestion, SubResult } from './types'
import { compareNumbers, formatNumber, isSorted, normalizeDigits, numbersEqual, parseNumber, texNumber } from './numbers'

const asRecord = (v: AnswerValue | undefined): Record<string, string> =>
  v && typeof v === 'object' && !Array.isArray(v) ? v : {}
const asArray = (v: AnswerValue | undefined): string[] => (Array.isArray(v) ? v : [])
const asString = (v: AnswerValue | undefined): string => (typeof v === 'string' ? v : '')

const labelOf = (opts: { id: string; label: string }[], id: string) => opts.find((o) => o.id === id)?.label ?? '—'

/* ------------------------------------------------------------------ */
/* Completion (submission eligibility)                                 */
/* ------------------------------------------------------------------ */

export function isSubComplete(sub: SubQuestion, answers: Answers): boolean {
  const v = answers[sub.id]
  switch (sub.type) {
    case 'mcq':
      return asString(v) !== ''
    case 'numeric': {
      const r = asRecord(v)
      return parseNumber(r.value) !== null
    }
    case 'pair':
    case 'plot': {
      const r = asRecord(v)
      return parseNumber(r.x) !== null && parseNumber(r.y) !== null
    }
    case 'tf': {
      const r = asRecord(v)
      if (r.value !== 'true' && r.value !== 'false') return false
      return r.value === 'true' ? true : !!r.fix
    }
    case 'match': {
      const r = asRecord(v)
      return sub.left.every((l) => !!r[l.id])
    }
    case 'order':
      return asArray(v).length === sub.items.length
    case 'compare': {
      const r = asRecord(v)
      return sub.pairs.every((p) => (['<', '>', '='] as string[]).includes(r[p.id]))
    }
    case 'cells': {
      const r = asRecord(v)
      return sub.cells.every((c) => parseNumber(r[c.id]) !== null)
    }
  }
}

export function isQuestionComplete(q: MainQuestion, answers: Answers): boolean {
  return q.subs.every((s) => isSubComplete(s, answers))
}

export function completionStats(questions: MainQuestion[], answers: Answers) {
  let done = 0
  let total = 0
  for (const q of questions)
    for (const s of q.subs) {
      total++
      if (isSubComplete(s, answers)) done++
    }
  return { done, total, allDone: done === total }
}

/* ------------------------------------------------------------------ */
/* Correct-answer text (for results / teacher key)                     */
/* ------------------------------------------------------------------ */

export function correctAnswerText(sub: SubQuestion): string {
  switch (sub.type) {
    case 'mcq':
      return labelOf(sub.options, sub.correct)
    case 'numeric':
      return formatNumber(sub.expected) + (sub.unit ? ` ${sub.unit}` : '')
    case 'pair':
    case 'plot':
      return `$(${sub.expected.x}, ${sub.expected.y})$`
    case 'tf':
      return (sub.correct ? 'صحيحة' : 'خاطئة') + (sub.correct ? '' : ` — التصحيح: ${labelOf(sub.correction.options, sub.correction.correct)}`)
    case 'match':
      return sub.left.map((l) => `${l.label} ← ${labelOf(sub.right, sub.correct[l.id])}`).join(' ؛ ')
    case 'order': {
      const sorted = [...sub.items].sort((a, b) => (sub.direction === 'asc' ? a.value - b.value : b.value - a.value))
      return sorted.map((i) => formatNumber(i.value)).join(' ، ')
    }
    case 'compare':
      return sub.pairs.map((p) => `$${texNumber(p.a)} ${compareNumbers(p.a, p.b)} ${texNumber(p.b)}$`).join(' ؛ ')
    case 'cells':
      return sub.cells.map((c) => `${c.label}: ${formatNumber(c.expected)}`).join(' ؛ ')
  }
}

export function studentAnswerText(sub: SubQuestion, answers: Answers): string {
  const v = answers[sub.id]
  const answered = typeof v === 'string' ? v.trim().length > 0 : Array.isArray(v) ? v.length > 0 : !!v && Object.values(v).some(x => x.trim().length > 0)
  if (!answered) return 'لم يُجب'
  switch (sub.type) {
    case 'mcq':
      return asString(v) ? labelOf(sub.options, asString(v)) : 'لم يُجب'
    case 'numeric': {
      const r = asRecord(v)
      const w = r.working?.trim()
      return (r.value ?? '—') + (w ? ` (خطوات الحل: ${w})` : '')
    }
    case 'pair':
    case 'plot': {
      const r = asRecord(v)
      return r.x !== undefined && r.y !== undefined ? `$(${normalizeDigits(r.x).replace(/[^\d.-]/g, '')}, ${normalizeDigits(r.y).replace(/[^\d.-]/g, '')})$` : 'لم يُجب'
    }
    case 'tf': {
      const r = asRecord(v)
      if (r.value === 'true') return 'صحيحة'
      if (r.value === 'false') return `خاطئة — التصحيح: ${r.fix ? labelOf(sub.correction.options, r.fix) : '—'}`
      return 'لم يُجب'
    }
    case 'match': {
      const r = asRecord(v)
      return sub.left.map((l) => `${l.label} ← ${r[l.id] ? labelOf(sub.right, r[l.id]) : '—'}`).join(' ؛ ')
    }
    case 'order': {
      const ids = asArray(v)
      if (!ids.length) return 'لم يُجب'
      return ids.map((id) => formatNumber(sub.items.find((i) => i.id === id)?.value ?? 0)).join(' ، ')
    }
    case 'compare': {
      const r = asRecord(v)
      return sub.pairs.map((p) => `$${texNumber(p.a)} ${r[p.id] ?? '?'} ${texNumber(p.b)}$`).join(' ؛ ')
    }
    case 'cells': {
      const r = asRecord(v)
      return sub.cells.map((c) => `${c.label}: ${r[c.id] ?? '—'}`).join(' ؛ ')
    }
  }
}

/* ------------------------------------------------------------------ */
/* Grading                                                             */
/* ------------------------------------------------------------------ */

function workingContains(working: string | undefined, keys: number[] | undefined, requireAll = false): boolean {
  if (!working || !keys?.length) return false
  const clean = normalizeDigits(working).replace(/(?<=\d)[،,٬](?=\d{3}(?:\D|$))/g, '')
  const tokens: string[] = clean.match(/\d+/g) ?? []
  return requireAll ? keys.every((k) => tokens.includes(String(k))) : keys.some((k) => tokens.includes(String(k)))
}

export function gradeSub(sub: SubQuestion, answers: Answers): SubResult {
  const v = answers[sub.id]
  let earned = 0
  switch (sub.type) {
    case 'mcq':
      earned = asString(v) === sub.correct ? sub.marks : 0
      break
    case 'numeric': {
      const r = asRecord(v)
      const n = parseNumber(r.value)
      if (numbersEqual(n, sub.expected)) earned = sub.marks
      else if (sub.partialMarks && workingContains(r.working, sub.partialKeys, sub.id === 'q2d')) earned = Math.min(sub.partialMarks, sub.marks)
      break
    }
    case 'pair':
    case 'plot': {
      const r = asRecord(v)
      const x = parseNumber(r.x)
      const y = parseNumber(r.y)
      // x must be the horizontal coordinate and y the vertical one; swapped pairs earn nothing.
      earned = numbersEqual(x, sub.expected.x) && numbersEqual(y, sub.expected.y) ? sub.marks : 0
      break
    }
    case 'tf': {
      const r = asRecord(v)
      const tfMarks = sub.marks - sub.correction.marks
      const said = r.value === 'true' ? true : r.value === 'false' ? false : null
      if (said === sub.correct) {
        earned += tfMarks
        if (!sub.correct && r.fix === sub.correction.correct) earned += sub.correction.marks
        if (sub.correct) earned += sub.correction.marks
      }
      break
    }
    case 'match': {
      const r = asRecord(v)
      const per = sub.marks / sub.left.length
      for (const l of sub.left) if (r[l.id] === sub.correct[l.id]) earned += per
      break
    }
    case 'order': {
      const ids = asArray(v)
      if (ids.length === sub.items.length && new Set(ids).size === ids.length) {
        const values = ids.map((id) => sub.items.find((i) => i.id === id)?.value ?? NaN)
        if (values.every(Number.isFinite)) {
          if (isSorted(values, sub.direction)) earned = sub.marks
          else if (isSorted(values, sub.direction === 'asc' ? 'desc' : 'asc')) earned = Math.floor(sub.marks / 2)
        }
      }
      break
    }
    case 'compare': {
      const r = asRecord(v)
      const per = sub.marks / sub.pairs.length
      for (const p of sub.pairs) if (r[p.id] === compareNumbers(p.a, p.b)) earned += per
      break
    }
    case 'cells': {
      const r = asRecord(v)
      for (const c of sub.cells) if (numbersEqual(parseNumber(r[c.id]), c.expected)) earned += c.marks
      break
    }
  }
  earned = Math.round(earned * 100) / 100
  const hasAnswer = typeof v === 'string' ? v.trim().length > 0 : Array.isArray(v) ? v.length > 0 : !!v && Object.values(v).some(x => x.trim().length > 0)
  const status: SubResult['status'] = earned >= sub.marks ? 'correct' : earned > 0 ? 'partial' : hasAnswer ? 'wrong' : 'unanswered'
  return {
    subId: sub.id,
    marks: sub.marks,
    earned,
    status,
    studentText: studentAnswerText(sub, answers),
    correctText: correctAnswerText(sub),
  }
}

export function gradeExam(questions: MainQuestion[], answers: Answers): ExamResult {
  const qs = questions.map((q) => {
    const subs = q.subs.map((s) => gradeSub(s, answers))
    return { id: q.id, marks: q.marks, earned: Math.round(subs.reduce((a, s) => a + s.earned, 0) * 100) / 100, subs }
  })
  return {
    total: Math.round(qs.reduce((a, q) => a + q.earned, 0) * 100) / 100,
    max: questions.reduce((a, q) => a + q.marks, 0),
    questions: qs,
  }
}
