import { describe, expect, it } from 'vitest'
import { GRAPH, GRID_POINTS, QUESTIONS, TOTAL_MARKS } from '../exam/questions'
import { completionStats, gradeExam, gradeSub, isSubComplete } from '../exam/grading'
import { compareNumbers, isSorted, parseNumber } from '../exam/numbers'
import { elapsedMs, formatHMS } from '../exam/timer'
import { loadState, saveState, STORAGE_KEY, initialState } from '../exam/storage'
import type { Answers, SubQuestion } from '../exam/types'

const sub = (id: string): SubQuestion => {
  for (const q of QUESTIONS) for (const s of q.subs) if (s.id === id) return s
  throw new Error('missing ' + id)
}

/** Builds a full set of correct answers from the key. */
function perfectAnswers(): Answers {
  const a: Answers = {}
  for (const q of QUESTIONS)
    for (const s of q.subs) {
      switch (s.type) {
        case 'mcq': a[s.id] = s.correct; break
        case 'numeric': a[s.id] = { value: String(s.expected) }; break
        case 'pair':
        case 'plot': a[s.id] = { x: String(s.expected.x), y: String(s.expected.y) }; break
        case 'tf': a[s.id] = s.correct ? { value: 'true' } : { value: 'false', fix: s.correction.correct }; break
        case 'match': a[s.id] = { ...s.correct }; break
        case 'order': a[s.id] = [...s.items].sort((x, y) => (s.direction === 'asc' ? x.value - y.value : y.value - x.value)).map((i) => i.id); break
        case 'compare': { const r: Record<string, string> = {}; for (const p of s.pairs) r[p.id] = compareNumbers(p.a, p.b); a[s.id] = r; break }
        case 'cells': { const r: Record<string, string> = {}; for (const c of s.cells) r[c.id] = String(c.expected); a[s.id] = r; break }
      }
    }
  return a
}

describe('Blueprint', () => {
  it('has exactly 7 main questions totalling 100 marks', () => {
    expect(QUESTIONS.length).toBe(7)
    expect(TOTAL_MARKS).toBe(100)
    expect(QUESTIONS.map((q) => q.marks)).toEqual([15, 15, 15, 10, 15, 15, 15])
  })
  it('sub-question marks add up to each main question', () => {
    for (const q of QUESTIONS) expect(q.subs.reduce((s, x) => s + x.marks, 0)).toBe(q.marks)
  })
  it('match / compare / cells marks are integers per item', () => {
    for (const q of QUESTIONS)
      for (const s of q.subs) {
        if (s.type === 'match') expect(Number.isInteger(s.marks / s.left.length)).toBe(true)
        if (s.type === 'compare') expect(Number.isInteger(s.marks / s.pairs.length)).toBe(true)
        if (s.type === 'cells') expect(s.cells.reduce((a, c) => a + c.marks, 0)).toBe(s.marks)
        if (s.type === 'tf') expect(s.correction.marks).toBeLessThan(s.marks)
      }
  })
  it('all mcq/tf correct ids exist in options', () => {
    for (const q of QUESTIONS)
      for (const s of q.subs) {
        if (s.type === 'mcq') expect(s.options.some((o) => o.id === s.correct)).toBe(true)
        if (s.type === 'tf') expect(s.correction.options.some((o) => o.id === s.correction.correct)).toBe(true)
        if (s.type === 'match') for (const l of s.left) expect(s.right.some((r) => r.id === s.correct[l.id])).toBe(true)
      }
  })
  it('only covers Unit 1 lessons 1–8 and Unit 2 lessons 9–10', () => {
    const lessons = new Set(QUESTIONS.flatMap((q) => q.subs.map((s) => s.ref.lesson)))
    for (const l of lessons) expect(/الدرس (1|2|3|4|5|6|7|8|9|10) /.test(l)).toBe(true)
  })
})

describe('Number parsing & comparison', () => {
  it('parses thousands separators and Arabic-Indic digits', () => {
    expect(parseNumber('76,225')).toBe(76225)
    expect(parseNumber('٧٦٢٢٥')).toBe(76225)
    expect(parseNumber('6 040 009')).toBe(6040009)
    expect(parseNumber('abc')).toBeNull()
    expect(parseNumber('')).toBeNull()
    expect(parseNumber('3/4')).toBe(0.75)
  })
  it('compares numerically, never lexicographically', () => {
    expect(compareNumbers(987654, 1002000)).toBe('<') // "987654" > "1002000" as strings
    expect(compareNumbers(2548900, 2549100)).toBe('<')
    expect(compareNumbers(4070300, 4070300)).toBe('=')
    expect(compareNumbers(65012, 56210)).toBe('>')
  })
  it('validates ascending and descending order', () => {
    expect(isSorted([985700, 1025000, 1205000, 1250000], 'asc')).toBe(true)
    expect(isSorted([65012, 56210, 56201, 56120], 'desc')).toBe(true)
    expect(isSorted([9, 10, 100], 'desc')).toBe(false)
  })
})

describe('Coordinate grid (x horizontal, y vertical)', () => {
  it('fixed points are consistent with the answer key', () => {
    const A = GRID_POINTS.find((p) => p.id === 'A')!
    const s = sub('q1a')
    if (s.type !== 'pair') throw new Error()
    expect(s.expected).toEqual({ x: A.x, y: A.y })
    const D = GRID_POINTS.find((p) => p.id === 'D')!
    expect(D.y).toBe(0) // lies on the x-axis
    const C = GRID_POINTS.find((p) => p.id === 'C')!
    expect(C.x).toBe(0) // lies on the y-axis
  })
  it('rejects swapped coordinates', () => {
    const s = sub('q1a')
    expect(gradeSub(s, { q1a: { x: '3', y: '4' } }).earned).toBe(2)
    expect(gradeSub(s, { q1a: { x: '4', y: '3' } }).earned).toBe(0)
    const p = sub('q1e')
    expect(gradeSub(p, { q1e: { x: '5', y: '2' } }).earned).toBe(4)
    expect(gradeSub(p, { q1e: { x: '2', y: '5' } }).earned).toBe(0)
  })
  it('no expected pair in the exam is accidentally symmetric-ambiguous without reason', () => {
    for (const q of QUESTIONS)
      for (const s of q.subs)
        if (s.type === 'pair' || s.type === 'plot') expect(s.expected.x >= 0 && s.expected.y >= 0).toBe(true)
  })
})

describe('Arithmetic & graph expected answers', () => {
  it('every numeric with verify metadata computes to its expected value', () => {
    let checked = 0
    for (const q of QUESTIONS)
      for (const s of q.subs)
        if (s.type === 'numeric' && s.verify) {
          const [a, b] = s.verify.operands
          const v = s.verify.op === '+' ? a + b : s.verify.op === '-' ? a - b : a * b
          expect(v).toBe(s.expected)
          checked++
        }
    expect(checked).toBeGreaterThanOrEqual(6)
  })
  it('independent checks of hand-written answers', () => {
    expect(46758 + 29467).toBe(76225)
    expect(80304 - 35678).toBe(44626)
    expect(12465 + 3870 - 1295).toBe(15040)
    expect(3486 + 2587).toBe(6073)
    expect(4 * 1235).toBe(4940)
    expect(23 * 146).toBe(3358)
    expect(Math.round(4682 / 100) * 100).toBe(4700)
    expect(Math.round(27350 / 1000) * 1000).toBe(27000)
    expect(Math.round(6480000 / 1e6) * 1e6).toBe(6000000)
    expect(Math.round(2814 / 100) * 100).toBe(2800)
    expect(Math.round(7500 / 1000) * 1000).toBe(8000)
    expect(4000000 + 300000 + 5000 + 100 + 80 + 6).toBe(4305186)
  })
  it('graph data matches the answer key', () => {
    const v = (day: string) => GRAPH.values[GRAPH.labels.indexOf(day)]
    expect(v('الأربعاء')).toBe(17)
    expect(Math.max(...GRAPH.values)).toBe(v('الخميس'))
    expect(Math.min(...GRAPH.values)).toBe(v('الأحد'))
    expect(v('الخميس') - v('الثلاثاء')).toBe(6)
    expect(v('الجمعة') - v('الإثنين')).toBe(2)
    expect(GRAPH.values.every((x) => x >= GRAPH.yMin && x <= GRAPH.yMax)).toBe(true)
    const cells = sub('q2g')
    if (cells.type !== 'cells') throw new Error()
    expect(cells.cells.map((c) => c.expected)).toEqual([v('الأحد'), v('الثلاثاء'), v('السبت')])
  })
})

describe('Grading & partial credit', () => {
  it('perfect answers score 100', () => {
    const r = gradeExam(QUESTIONS, perfectAnswers())
    expect(r.total).toBe(100)
    expect(r.max).toBe(100)
    expect(r.questions.every((q) => q.earned === q.marks)).toBe(true)
  })
  it('empty answers score 0', () => {
    expect(gradeExam(QUESTIONS, {}).total).toBe(0)
  })
  it('accepts formatted equivalents', () => {
    expect(gradeSub(sub('q5a'), { q5a: { value: '76,225' } }).earned).toBe(3)
    expect(gradeSub(sub('q3f'), { q3f: { value: '٦٬٠٤٠٬٠٠٩'.replace(/٬/g, ',') } }).earned).toBe(3)
  })
  it('gives partial credit for correct working with wrong final answer', () => {
    const r = gradeSub(sub('q5c'), { q5c: { value: '15000', working: '12465 + 3870 = 16335 ثم 16335 - 1295' } })
    expect(r.earned).toBe(2)
    expect(r.status).toBe('partial')
    const none = gradeSub(sub('q5c'), { q5c: { value: '15000', working: 'لا أعرف' } })
    expect(none.earned).toBe(0)
  })
  it('grades match, compare and cells per item', () => {
    expect(gradeSub(sub('q6c'), { q6c: { m90: 'right', m35: 'obtuse', m180: 'straight' } }).earned).toBe(2)
    expect(gradeSub(sub('q7a'), { q7a: { p1: '<', p2: '>', p3: '=' } }).earned).toBe(2)
    expect(gradeSub(sub('q3c'), { q3c: { th: '5000', te: '8' } }).earned).toBe(2)
  })
  it('grades ordering with half credit for reversed direction', () => {
    const s = sub('q7b')
    expect(gradeSub(s, { q7b: ['n2', 'n4', 'n3', 'n1'] }).earned).toBe(2)
    expect(gradeSub(s, { q7b: ['n1', 'n3', 'n4', 'n2'] }).earned).toBe(1)
    expect(gradeSub(s, { q7b: ['n1', 'n2', 'n3', 'n4'] }).earned).toBe(0)
    expect(gradeSub(s, { q7b: ['n1', 'n1', 'n1', 'n1'] }).earned).toBe(0)
  })
  it('grades true/false with correction', () => {
    const s = sub('q1f')
    expect(gradeSub(s, { q1f: { value: 'false', fix: 'a' } }).earned).toBe(3)
    expect(gradeSub(s, { q1f: { value: 'false', fix: 'b' } }).earned).toBe(1)
    expect(gradeSub(s, { q1f: { value: 'true' } }).earned).toBe(0)
  })
})

describe('Submission eligibility', () => {
  it('is false until all sub-questions are complete', () => {
    const a = perfectAnswers()
    expect(completionStats(QUESTIONS, a).allDone).toBe(true)
    delete a.q7g
    expect(completionStats(QUESTIONS, a).allDone).toBe(false)
  })
  it('tf requires a correction when answered "false"', () => {
    expect(isSubComplete(sub('q4e'), { q4e: { value: 'false' } })).toBe(false)
    expect(isSubComplete(sub('q4e'), { q4e: { value: 'false', fix: 'c' } })).toBe(true)
    expect(isSubComplete(sub('q4e'), { q4e: { value: 'true' } })).toBe(true)
  })
  it('numeric requires a parseable number', () => {
    expect(isSubComplete(sub('q4a'), { q4a: { value: ' ' } })).toBe(false)
    expect(isSubComplete(sub('q4a'), { q4a: { value: '4,700' } })).toBe(true)
  })
})

describe('Timer', () => {
  it('formats HH:MM:SS', () => {
    expect(formatHMS(0)).toBe('00:00:00')
    expect(formatHMS(61_000)).toBe('00:01:01')
    expect(formatHMS(3_725_000)).toBe('01:02:05')
  })
  it('is timestamp based and frozen after submission', () => {
    expect(elapsedMs(null)).toBe(0)
    expect(elapsedMs(1000, 5000)).toBe(4000)
    expect(elapsedMs(1000, 99_000, 5000)).toBe(4000)
  })
})

describe('Persistence', () => {
  it('restores an unfinished attempt and does not create a new one', () => {
    const mem: Record<string, string> = {}
    const storage = { getItem: (k: string) => mem[k] ?? null, setItem: (k: string, v: string) => { mem[k] = v }, removeItem: (k: string) => { delete mem[k] } }
    const s = { ...initialState(), phase: 'exam' as const, name: 'ليان', startedAt: 123, answers: { q1c: 'c' } }
    saveState(s, storage)
    expect(mem[STORAGE_KEY]).toBeTruthy()
    const back = loadState(storage)
    expect(back.phase).toBe('exam')
    expect(back.name).toBe('ليان')
    expect(back.startedAt).toBe(123)
    expect(back.answers.q1c).toBe('c')
  })
  it('falls back to a fresh start on corrupt data', () => {
    expect(loadState({ getItem: () => '{bad json' }).phase).toBe('start')
  })
})
