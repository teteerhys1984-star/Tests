import { describe, expect, it } from 'vitest'
import { docToText, emptyDoc, type MathDoc } from './expression'
import {
  backspace,
  clearDoc,
  goDenominator,
  goNumerator,
  insertFraction,
  insertSymbol,
  moveLeft,
  moveRight,
  startCursor,
  tapBox,
  type Cursor,
} from './mathEditor'

type State = { doc: MathDoc; cur: Cursor }

const start = (): State => ({ doc: emptyDoc(), cur: startCursor(emptyDoc()) })
const type_ = (s: State, text: string): State => {
  let out = s
  for (const ch of text) {
    const r = insertSymbol(out.doc, out.cur, ch)
    out = { doc: r.doc, cur: r.cur }
  }
  return out
}

describe('math keypad editor', () => {
  it('inserts digits and operators at the cursor and advances it', () => {
    const s = type_(start(), '48+12')
    expect(docToText(s.doc)).toBe('48+12')
    expect(s.cur.pos).toBe(5)
  })

  it('inserts into the middle of an expression at the cursor position', () => {
    let s = type_(start(), '13')
    s = { ...s, cur: { box: 'r', pos: 1 } }
    s = type_(s, '2')
    expect(docToText(s.doc)).toBe('123')
  })

  it('creates a real fraction whose numerator and denominator are separate boxes', () => {
    let s = type_(start(), '1')
    const f = insertFraction(s.doc, s.cur)
    s = { doc: f.doc, cur: f.cur }
    expect(s.cur.box).not.toBe('r')
    s = type_(s, '2')
    s = { ...s, cur: goDenominator(s.doc, s.cur) }
    s = type_(s, '3')
    expect(docToText(s.doc)).toBe('1(2)/(3)')
  })

  it('moves between numerator and denominator with ▲ and ▼', () => {
    let s = type_(start(), '5')
    const f = insertFraction(s.doc, s.cur)
    s = { doc: f.doc, cur: f.cur }
    s = type_(s, '7')
    s = { ...s, cur: goDenominator(s.doc, s.cur) }
    s = type_(s, '9')
    s = { ...s, cur: goNumerator(s.doc, s.cur) }
    s = type_(s, '1')
    expect(docToText(s.doc)).toBe('5(71)/(9)')
  })

  it('moves the cursor out of a fraction to the right of it with ▶', () => {
    let s = type_(start(), '2')
    const f = insertFraction(s.doc, s.cur)
    s = { doc: f.doc, cur: f.cur }
    s = type_(s, '4')
    s = { ...s, cur: goDenominator(s.doc, s.cur) }
    s = type_(s, '5')
    s = { ...s, cur: moveRight(s.doc, s.cur) }
    expect(s.cur.box).toBe('r')
    s = type_(s, '+1')
    expect(docToText(s.doc)).toBe('2(4)/(5)+1')
  })

  it('left arrow walks back through the fraction without losing content', () => {
    let s = type_(start(), '8')
    const f = insertFraction(s.doc, s.cur)
    s = { doc: f.doc, cur: f.cur }
    s = type_(s, '6')
    s = { ...s, cur: moveLeft(s.doc, s.cur) }
    expect(s.cur.box).not.toBe('r')
    s = { ...s, cur: moveLeft(s.doc, s.cur) }
    expect(s.cur).toEqual({ box: 'r', pos: 1 })
    expect(docToText(s.doc)).toBe('8(6)/()')
  })

  it('backspace deletes the symbol before the cursor', () => {
    let s = type_(start(), '480')
    const r = backspace(s.doc, s.cur)
    s = { doc: r.doc, cur: r.cur }
    expect(docToText(s.doc)).toBe('48')
  })

  it('backspace on an empty fraction removes the fraction', () => {
    let s = type_(start(), '3')
    const f = insertFraction(s.doc, s.cur)
    s = { doc: f.doc, cur: f.cur }
    const r = backspace(s.doc, s.cur)
    expect(docToText(r.doc)).toBe('3')
    expect(r.cur).toEqual({ box: 'r', pos: 1 })
  })

  it('tapping a box puts the cursor at its end; clear resets everything', () => {
    let s = type_(start(), '12')
    expect(tapBox(s.doc, 'r')).toEqual({ box: 'r', pos: 2 })
    const cleared = clearDoc()
    expect(docToText(cleared.doc)).toBe('')
    expect(cleared.cur).toEqual({ box: 'r', pos: 0 })
  })
})
