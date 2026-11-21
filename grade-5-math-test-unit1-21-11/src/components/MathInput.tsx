import type { ReactNode } from 'react'
import type { MathDoc, MathTok } from '../lib/expression'
import { ROOT } from '../lib/expression'
import { tapBox, tapToken, type Cursor } from '../lib/mathEditor'

/** Displays a MathDoc as an editable-looking field. Every box (including fraction boxes) is tappable. */
export function MathDisplay({
  doc,
  cursor,
  active,
  placeholder,
  onFocusTap,
}: {
  doc: MathDoc
  cursor: Cursor | null
  active: boolean
  placeholder: string
  onFocusTap: (c: Cursor) => void
}) {
  const isEmpty = (doc.boxes[ROOT] ?? []).length === 0
  const showCaret = (box: string, pos: number) => active && cursor !== null && cursor.box === box && cursor.pos === pos

  const renderBox = (box: string): ReactNode[] => {
    const toks: MathTok[] = doc.boxes[box] ?? []
    const out: ReactNode[] = []
    toks.forEach((t, i) => {
      if (showCaret(box, i)) out.push(<span key={`c${i}`} className="caret" aria-hidden="true" />)
      if (t.k === 's') {
        out.push(
          <span
            key={`t${i}`}
            className="mtok"
            onPointerDown={(e) => {
              e.stopPropagation()
              onFocusTap(tapToken(box, i))
            }}
          >
            {t.v}
          </span>,
        )
      } else {
        out.push(
          <span key={`f${i}`} className="mfrac" aria-label="كسر">
            <span
              className="mbox mbox-n"
              onPointerDown={(e) => {
                e.stopPropagation()
                onFocusTap(tapBox(doc, t.n))
              }}
            >
              {renderBox(t.n)}
              {showCaret(t.n, (doc.boxes[t.n] ?? []).length) && <span className="caret" aria-hidden="true" />}
            </span>
            <span className="mbox mbox-d"
              onPointerDown={(e) => {
                e.stopPropagation()
                onFocusTap(tapBox(doc, t.d))
              }}
            >
              {renderBox(t.d)}
              {showCaret(t.d, (doc.boxes[t.d] ?? []).length) && <span className="caret" aria-hidden="true" />}
            </span>
          </span>,
        )
      }
    })
    if (showCaret(box, toks.length) && box === ROOT) out.push(<span key="end" className="caret" aria-hidden="true" />)
    return out
  }

  return (
    <div
      className={`math-field${active ? ' is-active' : ''}`}
      dir="ltr"
      role="textbox"
      aria-label="حقل الإجابة الرياضية"
      aria-multiline="false"
      onPointerDown={() => onFocusTap(tapBox(doc, ROOT))}
    >
      {isEmpty && !active ? <span className="math-placeholder">{placeholder}</span> : null}
      <div className="math-root">{renderBox(ROOT)}</div>
    </div>
  )
}

export type KeyAction =
  | { type: 'insert'; value: string }
  | { type: 'frac' }
  | { type: 'back' }
  | { type: 'clear' }
  | { type: 'left' }
  | { type: 'right' }
  | { type: 'numerator' }
  | { type: 'denominator' }

interface KeySpec {
  label: string
  aria: string
  action: KeyAction
  kind?: 'num' | 'op' | 'fn' | 'danger' | 'nav'
  wide?: boolean
}

const KEYS: KeySpec[] = [
  { label: '7', aria: '7', action: { type: 'insert', value: '7' }, kind: 'num' },
  { label: '8', aria: '8', action: { type: 'insert', value: '8' }, kind: 'num' },
  { label: '9', aria: '9', action: { type: 'insert', value: '9' }, kind: 'num' },
  { label: '÷', aria: 'قسمة', action: { type: 'insert', value: '÷' }, kind: 'op' },
  { label: '4', aria: '4', action: { type: 'insert', value: '4' }, kind: 'num' },
  { label: '5', aria: '5', action: { type: 'insert', value: '5' }, kind: 'num' },
  { label: '6', aria: '6', action: { type: 'insert', value: '6' }, kind: 'num' },
  { label: '×', aria: 'ضرب', action: { type: 'insert', value: '×' }, kind: 'op' },
  { label: '1', aria: '1', action: { type: 'insert', value: '1' }, kind: 'num' },
  { label: '2', aria: '2', action: { type: 'insert', value: '2' }, kind: 'num' },
  { label: '3', aria: '3', action: { type: 'insert', value: '3' }, kind: 'num' },
  { label: '−', aria: 'طرح', action: { type: 'insert', value: '−' }, kind: 'op' },
  { label: '0', aria: '0', action: { type: 'insert', value: '0' }, kind: 'num' },
  { label: '(', aria: 'قوس مفتوح', action: { type: 'insert', value: '(' }, kind: 'op' },
  { label: ')', aria: 'قوس مغلق', action: { type: 'insert', value: ')' }, kind: 'op' },
  { label: '+', aria: 'جمع', action: { type: 'insert', value: '+' }, kind: 'op' },
  { label: '=', aria: 'يساوي', action: { type: 'insert', value: '=' }, kind: 'op' },
  { label: 'كسر', aria: 'إدراج كسر ببسط ومقام', action: { type: 'frac' }, kind: 'fn' },
  { label: '⌫', aria: 'حذف الرمز السابق', action: { type: 'back' }, kind: 'danger' },
  { label: 'مسح', aria: 'مسح الإجابة', action: { type: 'clear' }, kind: 'danger' },
]

const NAV: KeySpec[] = [
  { label: '◀', aria: 'تحريك المؤشر إلى اليسار', action: { type: 'left' }, kind: 'nav' },
  { label: '▲ البسط', aria: 'الانتقال إلى البسط', action: { type: 'numerator' }, kind: 'nav' },
  { label: '▼ المقام', aria: 'الانتقال إلى المقام', action: { type: 'denominator' }, kind: 'nav' },
  { label: '▶', aria: 'تحريك المؤشر إلى اليمين', action: { type: 'right' }, kind: 'nav' },
]

/** On-screen math keypad. Buttons are large, touch-first, and never depend on hover. */
export function Keypad({ onKey, disabled }: { onKey: (a: KeyAction) => void; disabled: boolean }) {
  return (
    <div className="keypad" role="group" aria-label="لوحة الرموز الرياضية" dir="ltr">
      <div className="keypad-grid">
        {KEYS.map((k) => (
          <button
            key={k.aria + k.label}
            type="button"
            className={`key key-${k.kind ?? 'num'}`}
            aria-label={k.aria}
            disabled={disabled}
            onClick={() => onKey(k.action)}
          >
            {k.label}
          </button>
        ))}
      </div>
      <div className="keypad-nav">
        {NAV.map((k) => (
          <button
            key={k.aria}
            type="button"
            className="key key-nav"
            aria-label={k.aria}
            disabled={disabled}
            onClick={() => onKey(k.action)}
          >
            {k.label}
          </button>
        ))}
      </div>
    </div>
  )
}
