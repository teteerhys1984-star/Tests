import { useRef, useState } from 'react'
import { MathPad } from './MathPad'

interface Props {
  value: string
  onChange: (v: string) => void
  label?: string
  placeholder?: string
  unit?: string
  small?: boolean
  id?: string
}

/** Text field with a toggleable, touch-friendly math pad that inserts at the caret. */
export function NumberInput({ value, onChange, label, placeholder = '?', unit, small, id }: Props) {
  const ref = useRef<HTMLInputElement>(null)
  const [padOpen, setPadOpen] = useState(false)

  const insert = (text: string) => {
    const el = ref.current
    const start = el?.selectionStart ?? value.length
    const end = el?.selectionEnd ?? value.length
    const next = value.slice(0, start) + text + value.slice(end)
    onChange(next)
    requestAnimationFrame(() => {
      if (!el) return
      el.focus()
      const pos = start + text.length
      el.setSelectionRange(pos, pos)
    })
  }
  const del = () => {
    const el = ref.current
    const start = el?.selectionStart ?? value.length
    const end = el?.selectionEnd ?? value.length
    if (start === end && start === 0) return
    const s = start === end ? start - 1 : start
    const next = value.slice(0, s) + value.slice(end)
    onChange(next)
    requestAnimationFrame(() => {
      if (!el) return
      el.focus()
      el.setSelectionRange(s, s)
    })
  }

  return (
    <div className={small ? 'inline-block' : 'block'}>
      {label && (
        <label htmlFor={id} className="mb-1 block text-sm font-medium text-ink-soft">
          {label}
        </label>
      )}
      <div className={`flex items-center ${small ? 'gap-1' : 'gap-2'}`}>
        <input
          ref={ref}
          id={id}
          type="text"
          inputMode="numeric"
          dir="ltr"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setPadOpen(true)}
          className={`${small ? 'h-11 w-16 px-1' : 'h-12 w-full max-w-xs px-3'} rounded-xl border-2 border-sky-100 bg-white text-center text-lg font-bold text-ink outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100`}
        />
        {unit && <span className="text-sm font-medium text-ink-soft">{unit}</span>}
        <button
          type="button"
          aria-label="لوحة الرموز"
          onClick={() => setPadOpen((v) => !v)}
          className={`${small ? 'h-11 w-10 text-base' : 'h-12 w-12 text-xl'} shrink-0 rounded-xl border-2 transition ${padOpen ? 'border-sky-400 bg-sky-100' : 'border-sky-100 bg-white'}`}
        >
          🔢
        </button>
      </div>
      {padOpen && <MathPad onInsert={insert} onDelete={del} onClear={() => onChange('')} onClose={() => setPadOpen(false)} />}
    </div>
  )
}
