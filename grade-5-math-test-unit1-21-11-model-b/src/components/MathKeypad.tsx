import React, { useState, useRef } from 'react'
import { Delete, Eraser, Calculator, ArrowUpDown, Check } from 'lucide-react'
import { MathTex } from './MathTex'

interface MathKeypadProps {
  activeBranchLabel: string | null
  onInsertSymbol: (text: string) => void
  onBackspace: () => void
  onClear: () => void
}

export const MathKeypad: React.FC<MathKeypadProps> = ({
  activeBranchLabel,
  onInsertSymbol,
  onBackspace,
  onClear,
}) => {
  const [fractionMode, setFractionMode] = useState(false)
  const [numerator, setNumerator] = useState('')
  const [denominator, setDenominator] = useState('')
  const [activePart, setActivePart] = useState<'num' | 'den'>('num')

  const numInputRef = useRef<HTMLInputElement | null>(null)
  const denInputRef = useRef<HTMLInputElement | null>(null)

  const handleDigitOrOpClick = (symbol: string) => {
    if (fractionMode) {
      if (activePart === 'num') {
        setNumerator(prev => prev + symbol)
        numInputRef.current?.focus()
      } else {
        setDenominator(prev => prev + symbol)
        denInputRef.current?.focus()
      }
      return
    }
    onInsertSymbol(symbol)
  }

  const handleFractionBackspace = () => {
    if (activePart === 'num') {
      setNumerator(prev => prev.slice(0, -1))
    } else {
      setDenominator(prev => prev.slice(0, -1))
    }
  }

  const handleInsertBuiltFraction = () => {
    const cleanNum = numerator.trim() || '0'
    const cleanDen = denominator.trim() || '1'
    onInsertSymbol(`(${cleanNum}/${cleanDen})`)
    setNumerator('')
    setDenominator('')
    setFractionMode(false)
  }

  const toggleFractionSlot = () => {
    if (activePart === 'num') {
      setActivePart('den')
      setTimeout(() => denInputRef.current?.focus(), 10)
    } else {
      setActivePart('num')
      setTimeout(() => numInputRef.current?.focus(), 10)
    }
  }

  const digits = ['7', '8', '9', '4', '5', '6', '1', '2', '3', '0']
  const operations = [
    { label: '+', value: ' + ', title: 'جمع' },
    { label: '−', value: ' − ', title: 'طرح' },
    { label: '×', value: ' × ', title: 'ضرب' },
    { label: '÷', value: ' ÷ ', title: 'قسمة' },
    { label: '=', value: ' = ', title: 'يساوي' },
    { label: '(', value: '(', title: 'فتح قوس' },
    { label: ')', value: ')', title: 'إغلاق قوس' },
    { label: ',', value: ',', title: 'فاصلة' },
  ]

  return (
    <div
      className="mt-4 rounded-2xl border-2 border-pink-200/90 bg-gradient-to-br from-pink-50/90 via-white to-purple-50/90 p-3.5 shadow-sm"
      aria-label="لوحة الرموز الرياضية التفاعلية"
    >
      <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2 border-b border-pink-100 pb-2">
        <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-purple-900">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-pink-200/70 text-pink-800">
            <Calculator className="h-3.5 w-3.5" />
          </span>
          <span>لوحة الرموز الرياضية التفاعلية</span>
        </div>
        <span className="rounded-full bg-purple-100/80 px-2.5 py-0.5 text-xs font-medium text-purple-800">
          {activeBranchLabel
            ? `الحقل النشط: الفرع (${activeBranchLabel})`
            : 'انقري داخل حقل الإجابة ثم اضغطي الرمز'}
        </span>
      </div>

      {/* Real Interactive Fraction Editor */}
      {fractionMode && (
        <div className="mb-3 rounded-xl border-2 border-purple-300 bg-white p-3 shadow-inner">
          <div className="mb-2 flex items-center justify-between text-xs font-bold text-purple-900">
            <span>محرّر الكسر التفاعلي (بسط ومقام منفصلان)</span>
            <button
              type="button"
              onClick={() => setFractionMode(false)}
              className="text-pink-600 hover:text-pink-800 underline text-xs"
            >
              إغلاق محرّر الكسر
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <div className="flex flex-col items-center gap-1.5" dir="ltr">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-semibold text-purple-700" dir="rtl">
                  البسط:
                </span>
                <input
                  ref={numInputRef}
                  type="text"
                  dir="ltr"
                  value={numerator}
                  onFocus={() => setActivePart('num')}
                  onChange={e => setNumerator(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'ArrowDown' || e.key === 'Enter') {
                      e.preventDefault()
                      setActivePart('den')
                      denInputRef.current?.focus()
                    }
                  }}
                  placeholder="البسط"
                  aria-label="بسط الكسر"
                  className={`w-24 rounded-lg border-2 px-2.5 py-1.5 text-center text-sm font-bold outline-none transition ${
                    activePart === 'num'
                      ? 'border-pink-500 bg-pink-50/50 ring-2 ring-pink-200'
                      : 'border-purple-200 bg-slate-50'
                  }`}
                />
              </div>

              <div className="h-0.5 w-28 bg-purple-800 rounded-full" />

              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-semibold text-purple-700" dir="rtl">
                  المقام:
                </span>
                <input
                  ref={denInputRef}
                  type="text"
                  dir="ltr"
                  value={denominator}
                  onFocus={() => setActivePart('den')}
                  onChange={e => setDenominator(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'ArrowUp') {
                      e.preventDefault()
                      setActivePart('num')
                      numInputRef.current?.focus()
                    } else if (e.key === 'Enter') {
                      e.preventDefault()
                      handleInsertBuiltFraction()
                    }
                  }}
                  placeholder="المقام"
                  aria-label="مقام الكسر"
                  className={`w-24 rounded-lg border-2 px-2.5 py-1.5 text-center text-sm font-bold outline-none transition ${
                    activePart === 'den'
                      ? 'border-pink-500 bg-pink-50/50 ring-2 ring-pink-200'
                      : 'border-purple-200 bg-slate-50'
                  }`}
                />
              </div>
            </div>

            <div className="flex flex-col items-center gap-2">
              <div className="rounded-lg bg-purple-50 px-3 py-1.5 text-center border border-purple-200">
                <span className="block text-[10px] text-purple-600 mb-0.5">معاينة الكسر:</span>
                <MathTex
                  math={`\\frac{${numerator.trim() || '\\square'}}{${denominator.trim() || '\\square'}}`}
                />
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onMouseDown={e => e.preventDefault()}
                  onClick={toggleFractionSlot}
                  className="inline-flex items-center gap-1 rounded-lg border border-purple-300 bg-purple-100/80 px-2.5 py-1.5 text-xs font-semibold text-purple-900 hover:bg-purple-200 active:scale-95 transition"
                >
                  <ArrowUpDown className="h-3.5 w-3.5" />
                  <span>تنقّل بسط/مقام</span>
                </button>
                <button
                  type="button"
                  onMouseDown={e => e.preventDefault()}
                  onClick={handleInsertBuiltFraction}
                  className="inline-flex items-center gap-1 rounded-lg bg-pink-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-pink-700 active:scale-95 transition"
                >
                  <Check className="h-3.5 w-3.5" />
                  <span>إدراج الكسر</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Keypad Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
        {/* Digits 0-9 */}
        <div className="sm:col-span-6 grid grid-cols-5 gap-1.5" dir="ltr">
          {digits.map(d => (
            <button
              key={d}
              type="button"
              onMouseDown={e => e.preventDefault()}
              onClick={() => handleDigitOrOpClick(d)}
              className="flex h-10 items-center justify-center rounded-xl border border-pink-200 bg-white text-base font-bold text-purple-950 shadow-xs hover:border-pink-400 hover:bg-pink-50 active:scale-95 transition"
            >
              {d}
            </button>
          ))}
        </div>

        {/* Operations & Brackets */}
        <div className="sm:col-span-4 grid grid-cols-4 gap-1.5" dir="ltr">
          {operations.map(op => (
            <button
              key={op.label}
              type="button"
              title={op.title}
              onMouseDown={e => e.preventDefault()}
              onClick={() => handleDigitOrOpClick(op.value)}
              className="flex h-10 items-center justify-center rounded-xl border border-purple-200 bg-purple-50/70 text-base font-bold text-purple-900 shadow-xs hover:border-purple-400 hover:bg-purple-100 active:scale-95 transition"
            >
              {op.label}
            </button>
          ))}
        </div>

        {/* Fraction Builder + Backspace + Clear */}
        <div className="sm:col-span-2 grid grid-cols-3 sm:grid-cols-1 gap-1.5">
          <button
            type="button"
            onMouseDown={e => e.preventDefault()}
            onClick={() => {
              setFractionMode(prev => !prev)
              setActivePart('num')
              setTimeout(() => numInputRef.current?.focus(), 20)
            }}
            className={`flex h-10 sm:h-8 items-center justify-center gap-1 rounded-xl border px-2 text-xs font-bold transition active:scale-95 ${
              fractionMode
                ? 'border-pink-500 bg-pink-600 text-white'
                : 'border-pink-300 bg-pink-100/80 text-pink-900 hover:bg-pink-200'
            }`}
          >
            <span>كسر</span>
            <span dir="ltr" className="text-[11px] font-mono">
              أ/ب
            </span>
          </button>

          <button
            type="button"
            onMouseDown={e => e.preventDefault()}
            onClick={() => (fractionMode ? handleFractionBackspace() : onBackspace())}
            className="flex h-10 sm:h-8 items-center justify-center gap-1 rounded-xl border border-amber-200 bg-amber-50 px-2 text-xs font-bold text-amber-900 hover:bg-amber-100 active:scale-95 transition"
            title="حذف الرمز السابق"
          >
            <Delete className="h-3.5 w-3.5" />
            <span>حذف</span>
          </button>

          <button
            type="button"
            onMouseDown={e => e.preventDefault()}
            onClick={() => {
              if (fractionMode) {
                setNumerator('')
                setDenominator('')
              } else {
                onClear()
              }
            }}
            className="flex h-10 sm:h-8 items-center justify-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-2 text-xs font-bold text-rose-800 hover:bg-rose-100 active:scale-95 transition"
            title="مسح الإجابة"
          >
            <Eraser className="h-3.5 w-3.5" />
            <span>مسح</span>
          </button>
        </div>
      </div>
    </div>
  )
}
