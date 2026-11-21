/**
 * Pure editing operations for the math answer editor (boxes + cursor).
 * Every operation returns a new document and cursor; nothing is mutated.
 */
import { ROOT, docToText, emptyDoc, type MathDoc, type MathTok } from './expression'

export interface Cursor {
  box: string
  pos: number
}

type FractionTok = Extract<MathTok, { k: 'f' }>

export function startCursor(doc: MathDoc = emptyDoc()): Cursor {
  return { box: ROOT, pos: (doc.boxes[ROOT] ?? []).length }
}

function withBoxes(doc: MathDoc, patch: Record<string, MathTok[]>, counter = doc.counter): MathDoc {
  return { boxes: { ...doc.boxes, ...patch }, counter }
}

function boxLength(doc: MathDoc, box: string): number {
  return (doc.boxes[box] ?? []).length
}

/** Locates the fraction whose numerator or denominator is `box`. */
export function findParent(
  doc: MathDoc,
  box: string,
): { box: string; index: number; token: FractionTok; which: 'n' | 'd' } | null {
  for (const bid of Object.keys(doc.boxes)) {
    const toks = doc.boxes[bid] ?? []
    for (let index = 0; index < toks.length; index++) {
      const t = toks[index]
      if (t.k !== 'f') continue
      if (t.n === box) return { box: bid, index, token: t, which: 'n' }
      if (t.d === box) return { box: bid, index, token: t, which: 'd' }
    }
  }
  return null
}

export function insertSymbol(doc: MathDoc, cur: Cursor, v: string): { doc: MathDoc; cur: Cursor } {
  const toks = doc.boxes[cur.box] ?? []
  const next = [...toks.slice(0, cur.pos), { k: 's' as const, v }, ...toks.slice(cur.pos)]
  return { doc: withBoxes(doc, { [cur.box]: next }), cur: { box: cur.box, pos: cur.pos + 1 } }
}

/** Inserts an empty fraction and places the cursor in its numerator. */
export function insertFraction(doc: MathDoc, cur: Cursor): { doc: MathDoc; cur: Cursor } {
  const counter = doc.counter + 1
  const id = `f${counter}`
  const tok: FractionTok = { k: 'f', id, n: `${id}n`, d: `${id}d` }
  const toks = doc.boxes[cur.box] ?? []
  const next = [...toks.slice(0, cur.pos), tok, ...toks.slice(cur.pos)]
  const next2 = withBoxes(doc, { [cur.box]: next, [tok.n]: [], [tok.d]: [] }, counter)
  return { doc: next2, cur: { box: tok.n, pos: 0 } }
}

/** Deletes the symbol before the cursor. At the start of an empty fraction, removes the fraction. */
export function backspace(doc: MathDoc, cur: Cursor): { doc: MathDoc; cur: Cursor } {
  if (cur.pos > 0) {
    const toks = doc.boxes[cur.box] ?? []
    const next = [...toks.slice(0, cur.pos - 1), ...toks.slice(cur.pos)]
    return { doc: withBoxes(doc, { [cur.box]: next }), cur: { box: cur.box, pos: cur.pos - 1 } }
  }
  const parent = findParent(doc, cur.box)
  if (parent && boxLength(doc, parent.token.n) === 0 && boxLength(doc, parent.token.d) === 0) {
    const toks = doc.boxes[parent.box] ?? []
    const next = [...toks.slice(0, parent.index), ...toks.slice(parent.index + 1)]
    return { doc: withBoxes(doc, { [parent.box]: next }), cur: { box: parent.box, pos: parent.index } }
  }
  return { doc, cur }
}

export function moveLeft(doc: MathDoc, cur: Cursor): Cursor {
  if (cur.pos > 0) return { box: cur.box, pos: cur.pos - 1 }
  const parent = findParent(doc, cur.box)
  if (!parent) return cur
  if (parent.which === 'd') return { box: parent.token.n, pos: boxLength(doc, parent.token.n) }
  return { box: parent.box, pos: parent.index }
}

export function moveRight(doc: MathDoc, cur: Cursor): Cursor {
  if (cur.pos < boxLength(doc, cur.box)) return { box: cur.box, pos: cur.pos + 1 }
  const parent = findParent(doc, cur.box)
  if (!parent) return cur
  if (parent.which === 'n') return { box: parent.token.d, pos: 0 }
  return { box: parent.box, pos: parent.index + 1 }
}

/** Moves the cursor to the numerator of the relevant fraction (▲). */
export function goNumerator(doc: MathDoc, cur: Cursor): Cursor {
  const parent = findParent(doc, cur.box)
  if (parent) {
    if (parent.which === 'n') return cur
    return { box: parent.token.n, pos: boxLength(doc, parent.token.n) }
  }
  const toks = doc.boxes[cur.box] ?? []
  const f = pickAdjacentFraction(toks, cur.pos)
  return f ? { box: f.n, pos: boxLength(doc, f.n) } : cur
}

/** Moves the cursor to the denominator of the relevant fraction (▼). */
export function goDenominator(doc: MathDoc, cur: Cursor): Cursor {
  const parent = findParent(doc, cur.box)
  if (parent) {
    if (parent.which === 'd') return cur
    return { box: parent.token.d, pos: boxLength(doc, parent.token.d) }
  }
  const toks = doc.boxes[cur.box] ?? []
  const f = pickAdjacentFraction(toks, cur.pos)
  return f ? { box: f.d, pos: boxLength(doc, f.d) } : cur
}

function pickAdjacentFraction(toks: MathTok[], pos: number): FractionTok | null {
  const before = toks[pos - 1]
  if (before && before.k === 'f') return before
  const after = toks[pos]
  if (after && after.k === 'f') return after
  return null
}

/** Places the cursor at the end of a box after the student taps it. */
export function tapBox(doc: MathDoc, box: string): Cursor {
  return { box, pos: boxLength(doc, box) }
}

/** Places the cursor right after the token at `index` in `box`. */
export function tapToken(box: string, index: number): Cursor {
  return { box, pos: index + 1 }
}

export function clearDoc(): { doc: MathDoc; cur: Cursor } {
  return { doc: emptyDoc(), cur: { box: ROOT, pos: 0 } }
}

export function isEmptyDoc(doc: MathDoc): boolean {
  return docToText(doc).length === 0
}
