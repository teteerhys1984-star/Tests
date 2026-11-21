import { useState } from 'react'
import type { AnswerValue, Opt, Part, PartInput as PartSpec } from '../lib/types'
import type { Cursor } from '../lib/mathEditor'
import { emptyDoc, type MathDoc } from '../lib/expression'
import { RichText } from './RichText'
import { MathDisplay } from './MathInput'
import { CoordGrid, NumberLine, Protractor } from './Figures'

interface Props {
  part: Part
  value: AnswerValue | undefined
  onChange: (value: AnswerValue) => void
  /** Math parts only: the cursor and whether this part currently receives keypad input. */
  cursor?: Cursor | null
  mathActive?: boolean
  onMathFocus?: (c: Cursor) => void
}

/** Renders the answer control for one part. Each control is touch-first with large targets. */
export function PartInputView({ part, value, onChange, cursor = null, mathActive = false, onMathFocus }: Props) {
  const spec = part.input
  switch (spec.kind) {
    case 'choice':
      return (
        <ChoiceInput
          options={spec.options}
          selected={value?.t === 'choice' ? value.id : null}
          onPick={(id) => onChange({ t: 'choice', id })}
        />
      )
    case 'tf':
      return (
        <ChoiceInput
          options={[
            { id: 'true', text: 'صح' },
            { id: 'false', text: 'خطأ' },
          ]}
          selected={value?.t === 'choice' ? value.id : null}
          onPick={(id) => onChange({ t: 'choice', id })}
        />
      )
    case 'math':
    case 'expanded':
      return (
        <MathField
          doc={value?.t === 'math' ? value.doc : emptyDoc()}
          cursor={cursor}
          active={mathActive}
          onFocusTap={(c) => onMathFocus?.(c)}
        />
      )
    case 'text':
      return <TextInput value={value?.t === 'text' ? value.v : ''} onChange={(v) => onChange({ t: 'text', v })} />
    case 'pair':
      return (
        <TextInput
          ltr
          placeholder="مثال: (4,6)"
          value={value?.t === 'text' ? value.v : ''}
          onChange={(v) => onChange({ t: 'text', v })}
        />
      )
    case 'order':
      return (
        <OrderInput
          items={spec.items}
          ids={value?.t === 'order' ? value.ids : []}
          onChange={(ids) => onChange({ t: 'order', ids })}
        />
      )
    case 'match':
      return (
        <MatchInput
          spec={spec}
          pairs={value?.t === 'match' ? value.pairs : {}}
          onChange={(pairs) => onChange({ t: 'match', pairs })}
        />
      )
    case 'slots':
      return (
        <SlotsInput
          spec={spec}
          fill={value?.t === 'slots' ? value.fill : {}}
          onChange={(fill) => onChange({ t: 'slots', fill })}
        />
      )
    case 'point': {
      const p = value?.t === 'point' ? value.p : null
      return (
        <div className="point-input">
          <CoordGrid
            xMax={spec.xMax}
            yMax={spec.yMax}
            points={spec.given}
            picked={p}
            label="شبكة نقاط. اضغطي على التقاطع لتحديد موقع الرأس"
            onPick={(q) => onChange({ t: 'point', p: q })}
          />
          <p className="hint-line">{p ? `الموقع المحدد: (${p.x}, ${p.y})` : 'اضغطي على تقاطع في الشبكة لتحديد الموقع.'}</p>
        </div>
      )
    }
    case 'numberline': {
      const v = value?.t === 'num' ? value.v : null
      return (
        <div className="point-input">
          <NumberLine
            min={spec.min}
            max={spec.max}
            step={spec.step}
            labelEvery={spec.labelEvery}
            mid={spec.mid}
            value={v}
            onPick={(n) => onChange({ t: 'num', v: n })}
          />
          <p className="hint-line">اضغطي على المستقيم لوضع النقطة في موضعها.</p>
        </div>
      )
    }
    case 'angle-draw': {
      const deg = value?.t === 'angle' ? value.deg : null
      return (
        <div className="point-input">
          <Protractor value={deg} onPick={(d) => onChange({ t: 'angle', deg: d })} />
          <p className="hint-line">
            {deg === null ? 'اضغطي على موضع الضلع الثاني فوق المنقلة.' : `قياس الزاوية المرسومة: ${deg}°`}
          </p>
        </div>
      )
    }
    default:
      return null
  }
}

function ChoiceInput({ options, selected, onPick }: { options: Opt[]; selected: string | null; onPick: (id: string) => void }) {
  return (
    <div className="choices" role="radiogroup">
      {options.map((o, i) => {
        const on = selected === o.id
        return (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={on}
            className={`choice${on ? ' is-on' : ''}`}
            onClick={() => onPick(o.id)}
          >
            <span className="choice-letter" aria-hidden="true">
              {arabicLetter(i)}
            </span>
            <span className="choice-text">
              <RichText text={o.text} />
            </span>
          </button>
        )
      })}
    </div>
  )
}

function arabicLetter(i: number): string {
  return ['أ', 'ب', 'ج', 'د', 'هـ', 'و'][i] ?? String(i + 1)
}

function MathField({
  doc,
  cursor,
  active,
  onFocusTap,
}: {
  doc: MathDoc
  cursor: Cursor | null
  active: boolean
  onFocusTap: (c: Cursor) => void
}) {
  return (
    <div className="math-wrap">
      <MathDisplay doc={doc} cursor={cursor} active={active} placeholder="اكتبي الإجابة بلوحة الرموز" onFocusTap={onFocusTap} />
    </div>
  )
}

function TextInput({
  value,
  onChange,
  ltr = false,
  placeholder = 'اكتبي إجابتك هنا',
}: {
  value: string
  onChange: (v: string) => void
  ltr?: boolean
  placeholder?: string
}) {
  return (
    <input
      type="text"
      className="text-input"
      dir={ltr ? 'ltr' : 'rtl'}
      value={value}
      placeholder={placeholder}
      autoComplete="off"
      autoCapitalize="off"
      spellCheck={false}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}

function OrderInput({ items, ids, onChange }: { items: Opt[]; ids: string[]; onChange: (ids: string[]) => void }) {
  const toggle = (id: string) => {
    if (ids.includes(id)) onChange(ids.filter((x) => x !== id))
    else onChange([...ids, id])
  }
  return (
    <div className="order-wrap">
      <p className="hint-line">اضغطي العناصر بالترتيب المطلوب من الأصغر إلى الأكبر. الضغط على عنصر مختار يلغي اختياره.</p>
      <div className="order-chips">
        {items.map((it) => {
          const pos = ids.indexOf(it.id)
          return (
            <button key={it.id} type="button" className={`chip-btn${pos >= 0 ? ' is-on' : ''}`} onClick={() => toggle(it.id)} aria-pressed={pos >= 0}>
              {pos >= 0 && <span className="chip-num">{pos + 1}</span>}
              <RichText text={it.text} />
            </button>
          )
        })}
      </div>
      <div className="order-current" aria-live="polite">
        <span className="order-label">ترتيبك:</span>
        {ids.length === 0 ? (
          <span className="muted">لم تختاري بعد</span>
        ) : (
          ids.map((id, i) => (
            <span key={id} className="order-step">
              {i + 1}. <RichText text={items.find((x) => x.id === id)?.text ?? id} />
            </span>
          ))
        )}
      </div>
      {ids.length > 0 && (
        <button type="button" className="btn btn-ghost btn-small" onClick={() => onChange([])}>
          إعادة الترتيب
        </button>
      )}
    </div>
  )
}

function MatchInput({
  spec,
  pairs,
  onChange,
}: {
  spec: Extract<PartSpec, { kind: 'match' }>
  pairs: Record<string, string>
  onChange: (p: Record<string, string>) => void
}) {
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null)
  const usedRight = new Set(Object.values(pairs))

  const pickLeft = (id: string) => {
    if (pairs[id]) {
      const next = { ...pairs }
      delete next[id]
      onChange(next)
      setSelectedLeft(null)
      return
    }
    setSelectedLeft(selectedLeft === id ? null : id)
  }
  const pickRight = (rid: string) => {
    if (!selectedLeft) return
    const next: Record<string, string> = {}
    for (const [l, r] of Object.entries(pairs)) if (r !== rid) next[l] = r
    next[selectedLeft] = rid
    onChange(next)
    setSelectedLeft(null)
  }

  return (
    <div className="match-wrap">
      <p className="hint-line">اختاري عنصراً من العمود الأول، ثم اضغطي ما يناسبه في العمود الثاني. لإلغاء المطابقة اضغطي العنصر الموصول.</p>
      <div className="match-grid">
        <div className="match-col" role="group" aria-label="العمود الأول">
          {spec.left.map((l) => (
            <button
              key={l.id}
              type="button"
              className={`match-btn${selectedLeft === l.id ? ' is-selected' : ''}${pairs[l.id] ? ' is-paired' : ''}`}
              onClick={() => pickLeft(l.id)}
              aria-pressed={selectedLeft === l.id}
            >
              <RichText text={l.text} />
              {pairs[l.id] && <span className="match-tag">مطابَق</span>}
            </button>
          ))}
        </div>
        <div className="match-col" role="group" aria-label="العمود الثاني">
          {spec.right.map((r) => (
            <button
              key={r.id}
              type="button"
              className={`match-btn${usedRight.has(r.id) ? ' is-paired' : ''}`}
              disabled={!selectedLeft && !usedRight.has(r.id)}
              onClick={() => pickRight(r.id)}
            >
              <RichText text={r.text} />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function SlotsInput({
  spec,
  fill,
  onChange,
}: {
  spec: Extract<PartSpec, { kind: 'slots' }>
  fill: Record<string, string>
  onChange: (f: Record<string, string>) => void
}) {
  const [chip, setChip] = useState<string | null>(null)
  const usedChips = new Set(Object.values(fill))

  const placeInto = (slotId: string) => {
    if (chip) {
      const next: Record<string, string> = {}
      for (const [s, c] of Object.entries(fill)) if (c !== chip && s !== slotId) next[s] = c
      next[slotId] = chip
      onChange(next)
      setChip(null)
      return
    }
    if (fill[slotId]) {
      const next = { ...fill }
      delete next[slotId]
      onChange(next)
    }
  }

  return (
    <div className="slots-wrap">
      <p className="hint-line">اضغطي الحرف أولاً، ثم اضغطي المكان المناسب له. اضغطي مكاناً ممتلئاً دون اختيار حرف لإفراغه.</p>
      <div className="slots-list">
        {spec.slots.map((s) => {
          const chosen = fill[s.id]
          const chosenText = spec.bank.find((b) => b.id === chosen)?.text
          return (
            <div key={s.id} className="slot-row">
              <span className="slot-label">{s.label}:</span>
              <button type="button" className={`slot-box${chosen ? ' is-filled' : ''}${chip ? ' is-target' : ''}`} onClick={() => placeInto(s.id)} aria-label={`${s.label}: ${chosenText ?? 'فارغ'}`}>
                {chosenText ? <RichText text={chosenText} /> : <span className="slot-empty">＿＿</span>}
              </button>
            </div>
          )
        })}
      </div>
      <div className="bank" role="group" aria-label="الحروف المتاحة">
        {spec.bank.map((b) => {
          const used = usedChips.has(b.id)
          return (
            <button
              key={b.id}
              type="button"
              className={`bank-chip${chip === b.id ? ' is-selected' : ''}${used ? ' is-used' : ''}`}
              onClick={() => setChip(chip === b.id ? null : b.id)}
              aria-pressed={chip === b.id}
            >
              <RichText text={b.text} />
            </button>
          )
        })}
      </div>
    </div>
  )
}
