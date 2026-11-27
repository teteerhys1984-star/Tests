import { useRef, useState } from 'react'

interface Props {
  onInsert: (text: string) => void
  onDelete: () => void
  onClear: () => void
  onClose: () => void
}

const KEYS: { label: string; value: string; cls?: string }[] = [
  { label: '7', value: '7' },
  { label: '8', value: '8' },
  { label: '9', value: '9' },
  { label: '÷', value: '÷', cls: 'op' },
  { label: '(', value: '(', cls: 'op' },
  { label: '4', value: '4' },
  { label: '5', value: '5' },
  { label: '6', value: '6' },
  { label: '×', value: '×', cls: 'op' },
  { label: ')', value: ')', cls: 'op' },
  { label: '1', value: '1' },
  { label: '2', value: '2' },
  { label: '3', value: '3' },
  { label: '−', value: '−', cls: 'op' },
  { label: '=', value: '=', cls: 'op' },
  { label: '0', value: '0' },
  { label: ',', value: ',' },
  { label: '+', value: '+', cls: 'op' },
]

export function MathPad({ onInsert, onDelete, onClear, onClose }: Props) {
  const [fracOpen, setFracOpen] = useState(false)
  const numRef = useRef<HTMLInputElement>(null)
  const denRef = useRef<HTMLInputElement>(null)

  const insertFraction = () => {
    const n = numRef.current?.value.trim() ?? ''
    const d = denRef.current?.value.trim() ?? ''
    if (!n || !d) return
    onInsert(`${n}/${d}`)
    if (numRef.current) numRef.current.value = ''
    if (denRef.current) denRef.current.value = ''
    setFracOpen(false)
  }

  const base =
    'h-11 min-w-0 rounded-xl text-lg font-bold shadow-sm active:scale-95 transition select-none touch-manipulation'

  return (
    <div
      className="mt-2 rounded-2xl border-2 border-sky-100 bg-sky-50 p-2 animate-pop"
      dir="ltr"
      onMouseDown={(e) => e.preventDefault()}
    >
      <div className="grid grid-cols-5 gap-1.5">
        {KEYS.map((k) => (
          <button
            key={k.label}
            type="button"
            aria-label={k.label}
            onClick={() => onInsert(k.value)}
            className={`${base} ${k.cls === 'op' ? 'bg-sun-100 text-peach-600' : 'bg-white text-ink'}`}
          >
            {k.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setFracOpen((v) => !v)}
          aria-label="كسر"
          className={`${base} bg-turq-100 text-turq-600 text-sm leading-tight`}
        >
          <span className="inline-flex flex-col items-center leading-none">
            <span className="border-b border-turq-600 px-1">a</span>
            <span className="px-1">b</span>
          </span>
        </button>
        <button type="button" onClick={onDelete} aria-label="حذف" className={`${base} bg-white text-peach-600`}>
          ⌫
        </button>
      </div>
      {fracOpen && (
        <div className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-white p-2" dir="rtl">
          <span className="text-sm text-ink-soft">البسط</span>
          <input
            ref={numRef}
            inputMode="numeric"
            className="h-10 w-16 rounded-lg border-2 border-sky-100 text-center text-base"
            dir="ltr"
          />
          <span className="text-xl font-bold">/</span>
          <span className="text-sm text-ink-soft">المقام</span>
          <input
            ref={denRef}
            inputMode="numeric"
            className="h-10 w-16 rounded-lg border-2 border-sky-100 text-center text-base"
            dir="ltr"
          />
          <button type="button" onClick={insertFraction} className="h-10 rounded-lg bg-turq-500 px-3 text-sm font-bold text-white">
            إدراج
          </button>
        </div>
      )}
      <div className="mt-1.5 flex gap-1.5" dir="rtl">
        <button type="button" onClick={onClear} className="h-10 flex-1 rounded-xl bg-white text-sm font-bold text-red-500">
          مسح الكل
        </button>
        <button type="button" onClick={onClose} className="h-10 flex-1 rounded-xl bg-sky-500 text-sm font-bold text-white">
          إغلاق اللوحة
        </button>
      </div>
    </div>
  )
}
