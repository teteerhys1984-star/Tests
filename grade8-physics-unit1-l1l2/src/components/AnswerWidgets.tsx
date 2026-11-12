import type { Subpart } from '../exam/types'
import { MathText } from '../lib/mathx'
import { num } from '../lib/time'
import type { AnswerValue, TfAnswer } from '../exam/grading'

interface Common {
  sp: Subpart
  value: AnswerValue
  onChange: (v: AnswerValue) => void
  disabled?: boolean
}

const LETTERS = ['أ', 'ب', 'ج', 'د', 'هـ', 'و', 'ز']

export function ChoiceList({ sp, value, onChange, disabled }: Common) {
  return (
    <div className="grid gap-2">
      {(sp.options ?? []).map((o, i) => (
        <button
          key={o.id} type="button" className="chip" data-opt-id={o.id} data-on={value === o.id ? '1' : '0'}
          disabled={disabled} aria-pressed={value === o.id}
          onClick={() => onChange(value === o.id ? null : o.id)}
        >
          <span className="chip-dot" aria-hidden />
          <span className="badge badge-mute !px-1.5" style={{ minWidth: 26, justifyContent: 'center' }}>{LETTERS[i]}</span>
          <MathText text={o.label} />
        </button>
      ))}
    </div>
  )
}

export function MultiSelectList({ sp, value, onChange, disabled }: Common) {
  const picked = Array.isArray(value) ? value : []
  const toggle = (id: string) => {
    if (disabled) return
    const next = picked.includes(id) ? picked.filter((x) => x !== id) : [...picked, id]
    onChange(next.length ? next : null)
  }
  return (
    <div className="grid gap-2">
      <p className="text-xs" style={{ color: 'var(--ink-3)' }}>يمكن اختيار أكثر من عبارة.</p>
      {(sp.options ?? []).map((o, i) => (
        <button
          key={o.id} type="button" className="chip" data-opt-id={o.id} data-square="1" data-on={picked.includes(o.id) ? '1' : '0'}
          disabled={disabled} aria-pressed={picked.includes(o.id)} onClick={() => toggle(o.id)}
        >
          <span className="chip-dot" aria-hidden />
          <span className="badge badge-mute !px-1.5" style={{ minWidth: 26, justifyContent: 'center' }}>{num(i + 1)}</span>
          <MathText text={o.label} />
        </button>
      ))}
    </div>
  )
}

export function TextField({ sp, value, onChange, disabled, numeric }: Common & { numeric?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <input
        className={`field ${numeric ? 'field-math' : ''}`}
        dir={numeric ? 'ltr' : 'rtl'}
        inputMode={numeric ? 'decimal' : 'text'}
        type="text"
        value={typeof value === 'string' ? value : ''}
        placeholder={sp.placeholder ?? (numeric ? 'اكتب الرقم فقط…' : '')}
        disabled={disabled}
        aria-label={sp.label}
        onChange={(e) => onChange(e.target.value)}
      />
      {sp.unit && (
        <span className="badge badge-teal tnum shrink-0" style={{ fontSize: '0.9rem' }}>
          <MathText text={sp.unit} />
        </span>
      )}
    </div>
  )
}

export function TextArea({ value, onChange, disabled, sp }: Common) {
  return (
    <textarea
      className="field"
      value={typeof value === 'string' ? value : ''}
      placeholder={sp.placeholder ?? 'اكتب إجابتك هنا بأسلوبك…'}
      disabled={disabled}
      aria-label={sp.label}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}

export function TfField({ sp, value, onChange, disabled }: Common) {
  const v = (value && typeof value === 'object' && 'value' in value ? value : { value: '', correction: '' }) as TfAnswer
  const set = (patch: Partial<TfAnswer>) => {
    const next = { ...v, ...patch }
    onChange(next.value || next.correction ? next : null)
  }
  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap gap-2">
        {(['true', 'false'] as const).map((t) => (
          <button
            key={t} type="button" className="chip !w-auto" data-on={v.value === t ? '1' : '0'}
            disabled={disabled} aria-pressed={v.value === t} onClick={() => set({ value: t })}
            style={{ minWidth: 130, justifyContent: 'center' }}
          >
            <span className="chip-dot" aria-hidden />
            {t === 'true' ? 'صواب' : 'خطأ'}
          </button>
        ))}
      </div>
      {sp.requireCorrection && (
        <div>
          <label className="mb-1 block text-sm font-bold" style={{ color: 'var(--ink-2)' }}>
            التصويب (مطلوب): اكتب العبارة الصحيحة أو سبب الخطأ
          </label>
          <textarea
            className="field" value={v.correction ?? ''} disabled={disabled}
            aria-label="تصويب العبارة"
            placeholder="اكتب التصويب…"
            onChange={(e) => set({ correction: e.target.value })}
          />
        </div>
      )}
    </div>
  )
}

export function MatchingField({ sp, value, onChange, disabled }: Common) {
  const rec = (value && !Array.isArray(value) && typeof value === 'object' && !('value' in value)
    ? (value as Record<string, string>)
    : {}) as Record<string, string>
  const set = (rowId: string, opt: string) => onChange({ ...rec, [rowId]: opt })
  return (
    <div className="grid gap-2">
      {(sp.rows ?? []).map((r) => (
        <div key={r.id} className="flex flex-wrap items-center gap-2 rounded-lg border p-2"
          style={{ borderColor: 'var(--line-soft)', background: '#fff' }}>
          <span className="min-w-[92px] flex-1 font-bold"><MathText text={r.left} /></span>
          <span style={{ color: 'var(--ink-3)' }}>⟵</span>
          <select
            className="field !w-auto field-math" value={rec[r.id] ?? ''} disabled={disabled}
            data-row-id={r.id}
            aria-label={`مطابقة ${r.left}`} onChange={(e) => set(r.id, e.target.value)}
          >
            <option value="">اختر…</option>
            {r.options.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
      ))}
    </div>
  )
}

export function OrderingField({ sp, value, onChange, disabled }: Common) {
  const items = sp.items ?? []
  const seq = Array.isArray(value) ? value : []
  const remaining = items.filter((it) => !seq.includes(it.id))
  return (
    <div className="grid gap-3">
      <div>
        <p className="mb-1.5 text-xs font-bold" style={{ color: 'var(--ink-3)' }}>
          الترتيب الذي اخترته ({num(seq.length)} من {num(items.length)}):
        </p>
        <ol className="grid gap-1.5">
          {seq.length === 0 && (
            <li className="rounded-lg border border-dashed p-2 text-center text-sm" style={{ borderColor: 'var(--line)', color: 'var(--ink-3)' }}>
              انقر العناصر بالترتيب المطلوب من الأسفل
            </li>
          )}
          {seq.map((id, i) => {
            const it = items.find((x) => x.id === id)
            return (
              <li key={id} className="flex items-center gap-2 rounded-lg border p-2 pop"
                style={{ borderColor: 'var(--line)', background: '#fff' }}>
                <span className="badge badge-gold tnum" style={{ minWidth: 28, justifyContent: 'center' }}>{num(i + 1)}</span>
                <span className="flex-1"><MathText text={it?.text ?? ''} /></span>
                {!disabled && (
                  <button type="button" className="btn btn-ghost !py-1 !px-2 !min-h-0 text-xs" onClick={() => onChange(seq.filter((x) => x !== id))}>
                    إزالة
                  </button>
                )}
              </li>
            )
          })}
        </ol>
      </div>
      {remaining.length > 0 && (
        <div>
          <p className="mb-1.5 text-xs font-bold" style={{ color: 'var(--ink-3)' }}>العناصر المتاحة:</p>
          <div className="grid gap-1.5">
            {remaining.map((it) => (
              <button key={it.id} type="button" className="chip" data-item-id={it.id} disabled={disabled}
                onClick={() => onChange([...seq, it.id])}>
                <span className="chip-dot" aria-hidden />
                <MathText text={it.text} />
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="flex gap-2">
        <button type="button" className="btn btn-ghost !py-1.5 !px-3 !min-h-0 text-sm" onClick={() => onChange(seq.slice(0, -1))} disabled={disabled || !seq.length}>
          تراجع خطوة
        </button>
        <button type="button" className="btn btn-ghost !py-1.5 !px-3 !min-h-0 text-sm" onClick={() => onChange(null)} disabled={disabled || !seq.length}>
          إعادة الترتيب
        </button>
      </div>
    </div>
  )
}

export function AnswerWidget(props: Common) {
  const { sp } = props
  switch (sp.kind) {
    case 'choice': return <ChoiceList {...props} />
    case 'multiselect': return <MultiSelectList {...props} />
    case 'numeric': return <TextField {...props} numeric />
    case 'text': return <TextField {...props} />
    case 'explain': return <TextArea {...props} />
    case 'tf': return <TfField {...props} />
    case 'matching': return <MatchingField {...props} />
    case 'ordering': return <OrderingField {...props} />
    default: return <TextField {...props} />
  }
}
