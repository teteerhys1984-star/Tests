import React, { useRef, useState } from 'react'
import { ArrowUp, ArrowDown, Check, Sparkles, BookOpen } from 'lucide-react'
import type { ExamQuestion, StudentAnswersMap, SubQuestionBranch } from '../types/exam'
import { isBranchAnswered } from '../utils/scoring'
import { MathTex, RichMathText } from './MathTex'
import { QuestionVisualRenderer } from './InteractiveVisuals'
import { MathKeypad } from './MathKeypad'

interface QuestionCardProps {
  question: ExamQuestion
  answers: StudentAnswersMap
  onUpdateAnswer: (branchId: string, value: string) => void
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  answers,
  onUpdateAnswer,
}) => {
  const [activeBranchId, setActiveBranchId] = useState<string | null>(() => {
    const firstTextBranch = question.branches.find(
      b =>
        b.inputKind === 'number' ||
        b.inputKind === 'text' ||
        b.inputKind === 'ordered-pair' ||
        b.inputKind === 'interactive-point'
    )
    return firstTextBranch?.id ?? null
  })

  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  // Reset active branch when question changes
  React.useEffect(() => {
    const firstTextBranch = question.branches.find(
      b =>
        b.inputKind === 'number' ||
        b.inputKind === 'text' ||
        b.inputKind === 'ordered-pair' ||
        b.inputKind === 'interactive-point'
    )
    setActiveBranchId(firstTextBranch?.id ?? null)
  }, [question.id, question.branches])

  const activeBranchObj = question.branches.find(b => b.id === activeBranchId) ?? null

  const handleInsertSymbolAtCursor = (symbolText: string) => {
    const targetBranch =
      activeBranchObj ??
      question.branches.find(
        b =>
          b.inputKind === 'number' ||
          b.inputKind === 'text' ||
          b.inputKind === 'ordered-pair' ||
          b.inputKind === 'interactive-point'
      )
    if (!targetBranch) return

    const branchId = targetBranch.id
    const inputEl = inputRefs.current[branchId]
    const currentVal = answers[branchId] ?? ''

    if (inputEl && document.activeElement === inputEl) {
      const start = inputEl.selectionStart ?? currentVal.length
      const end = inputEl.selectionEnd ?? currentVal.length
      const nextVal = currentVal.slice(0, start) + symbolText + currentVal.slice(end)
      onUpdateAnswer(branchId, nextVal)
      const nextCursor = start + symbolText.length
      setTimeout(() => {
        inputEl.focus()
        inputEl.setSelectionRange(nextCursor, nextCursor)
      }, 0)
    } else {
      const nextVal = currentVal + symbolText
      onUpdateAnswer(branchId, nextVal)
      setTimeout(() => {
        inputEl?.focus()
      }, 0)
    }
  }

  const handleBackspaceAtCursor = () => {
    const targetBranch =
      activeBranchObj ??
      question.branches.find(
        b =>
          b.inputKind === 'number' ||
          b.inputKind === 'text' ||
          b.inputKind === 'ordered-pair' ||
          b.inputKind === 'interactive-point'
      )
    if (!targetBranch) return

    const branchId = targetBranch.id
    const inputEl = inputRefs.current[branchId]
    const currentVal = answers[branchId] ?? ''
    if (!currentVal) return

    if (inputEl && document.activeElement === inputEl) {
      const start = inputEl.selectionStart ?? currentVal.length
      const end = inputEl.selectionEnd ?? currentVal.length
      if (start !== end) {
        const nextVal = currentVal.slice(0, start) + currentVal.slice(end)
        onUpdateAnswer(branchId, nextVal)
        setTimeout(() => inputEl.setSelectionRange(start, start), 0)
      } else if (start > 0) {
        const nextVal = currentVal.slice(0, start - 1) + currentVal.slice(start)
        onUpdateAnswer(branchId, nextVal)
        setTimeout(() => inputEl.setSelectionRange(start - 1, start - 1), 0)
      }
    } else {
      onUpdateAnswer(branchId, currentVal.slice(0, -1))
    }
  }

  const handleClearActiveBranch = () => {
    const targetBranch =
      activeBranchObj ??
      question.branches.find(
        b =>
          b.inputKind === 'number' ||
          b.inputKind === 'text' ||
          b.inputKind === 'ordered-pair' ||
          b.inputKind === 'interactive-point'
      )
    if (!targetBranch) return
    onUpdateAnswer(targetBranch.id, '')
  }

  return (
    <article
      className="rounded-3xl border-2 border-pink-200/90 bg-white p-4 sm:p-6 shadow-md transition-all"
      aria-label={`السؤال ${question.number}`}
    >
      {/* Card Header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-pink-100 pb-3.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-2xl bg-gradient-to-r from-pink-600 to-purple-600 px-3.5 py-1.5 text-xs sm:text-sm font-extrabold text-white shadow-xs">
            <Sparkles className="h-3.5 w-3.5" />
            <span>السؤال {question.number} من 30</span>
          </span>

          <span className="inline-flex items-center gap-1 rounded-xl bg-purple-100/90 px-3 py-1 text-xs font-bold text-purple-900">
            <BookOpen className="h-3.5 w-3.5 text-pink-600" />
            <span>{question.lessonTitle}</span>
            <span className="text-purple-700" dir="ltr">
              (ص {question.pages})
            </span>
          </span>

          <span className="rounded-xl border border-pink-200 bg-pink-50/80 px-2.5 py-1 text-xs font-semibold text-pink-800">
            {question.patternBadge}
          </span>
        </div>

        <div className="inline-flex items-center gap-1 rounded-2xl border border-amber-300/80 bg-amber-50 px-3.5 py-1 text-xs sm:text-sm font-extrabold text-amber-900">
          <span>العلامة:</span>
          <span dir="ltr">{question.totalMarks}</span>
        </div>
      </div>

      {/* Main Prompt */}
      <div className="mb-4 rounded-2xl bg-gradient-to-l from-pink-50/60 via-purple-50/40 to-pink-50/60 p-3.5 sm:p-4 text-sm sm:text-base font-medium text-purple-950 border border-pink-100/80 leading-relaxed">
        <RichMathText text={question.prompt} />
      </div>

      {/* Interactive Visual / Diagram */}
      {question.visual && (
        <QuestionVisualRenderer
          visual={question.visual}
          answers={answers}
          onUpdateAnswer={onUpdateAnswer}
        />
      )}

      {/* Sub-Question Branches */}
      <div className="mt-4 space-y-3.5">
        {question.branches.map(branch => (
          <BranchInputRow
            key={branch.id}
            branch={branch}
            value={answers[branch.id] ?? ''}
            isActive={activeBranchId === branch.id}
            onFocus={() => setActiveBranchId(branch.id)}
            onChange={val => onUpdateAnswer(branch.id, val)}
            registerInputRef={el => {
              inputRefs.current[branch.id] = el
            }}
          />
        ))}
      </div>

      {/* Interactive Math Symbols Keypad */}
      {question.showMathKeypad && (
        <MathKeypad
          activeBranchLabel={activeBranchObj?.label ?? null}
          onInsertSymbol={handleInsertSymbolAtCursor}
          onBackspace={handleBackspaceAtCursor}
          onClear={handleClearActiveBranch}
        />
      )}
    </article>
  )
}

interface BranchInputRowProps {
  branch: SubQuestionBranch
  value: string
  isActive: boolean
  onFocus: () => void
  onChange: (value: string) => void
  registerInputRef: (el: HTMLInputElement | null) => void
}

const BranchInputRow: React.FC<BranchInputRowProps> = ({
  branch,
  value,
  isActive,
  onFocus,
  onChange,
  registerInputRef,
}) => {
  const answered = isBranchAnswered(branch, { [branch.id]: value })

  // Handle 'order-list' state
  const currentOrderedIds = React.useMemo(() => {
    if (branch.inputKind !== 'order-list' || !branch.initialOrderItems) return []
    if (value.trim()) {
      const parts = value.split(',').map(s => s.trim())
      if (parts.length === branch.initialOrderItems.length) return parts
    }
    return branch.initialOrderItems.map(item => item.id)
  }, [branch.inputKind, branch.initialOrderItems, value])

  const moveOrderItem = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction
    if (nextIndex < 0 || nextIndex >= currentOrderedIds.length) return
    const copy = [...currentOrderedIds]
    const temp = copy[index]
    copy[index] = copy[nextIndex]
    copy[nextIndex] = temp
    onChange(copy.join(','))
  }

  return (
    <div
      className={`rounded-2xl border-2 p-3.5 sm:p-4 transition ${
        isActive
          ? 'border-pink-400 bg-pink-50/40 shadow-xs'
          : answered
          ? 'border-purple-200 bg-purple-50/25'
          : 'border-pink-100 bg-slate-50/50'
      }`}
    >
      <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-start gap-2">
          <span
            className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-xl text-xs font-extrabold ${
              answered
                ? 'bg-pink-600 text-white'
                : 'bg-purple-100 text-purple-900 border border-purple-200'
            }`}
          >
            {branch.label}
          </span>
          <label
            htmlFor={`input-${branch.id}`}
            className="text-sm sm:text-base font-bold text-purple-950 leading-relaxed cursor-pointer"
          >
            <RichMathText text={branch.prompt} />
          </label>
        </div>

        <span className="rounded-full bg-white border border-pink-200 px-2.5 py-0.5 text-xs font-bold text-pink-800 shrink-0">
          {branch.marks} {branch.marks === 1 ? 'علامة' : branch.marks === 2 ? 'علامتان' : 'علامات'}
        </span>
      </div>

      {/* 1. Standard Text / Number / Ordered Pair / Interactive Point Input */}
      {(branch.inputKind === 'number' ||
        branch.inputKind === 'text' ||
        branch.inputKind === 'ordered-pair' ||
        branch.inputKind === 'interactive-point') && (
        <div className="flex flex-wrap items-center gap-2">
          <input
            id={`input-${branch.id}`}
            ref={registerInputRef}
            type="text"
            dir={branch.inputKind === 'text' ? 'rtl' : 'ltr'}
            value={value}
            onFocus={onFocus}
            onChange={e => onChange(e.target.value)}
            placeholder={branch.placeholder ?? 'اكتبي إجابتكِ هنا...'}
            className={`flex-1 min-w-[180px] rounded-xl border-2 bg-white px-3.5 py-2.5 text-sm sm:text-base font-bold text-purple-950 outline-none transition ${
              branch.inputKind === 'text' ? 'text-right' : 'text-left font-mono'
            } ${
              isActive
                ? 'border-pink-500 ring-2 ring-pink-200'
                : 'border-purple-200 focus:border-pink-500'
            }`}
          />
          {branch.unitSuffix && (
            <span className="rounded-xl bg-purple-100 px-3 py-2 text-xs sm:text-sm font-bold text-purple-900">
              {branch.unitSuffix}
            </span>
          )}
        </div>
      )}

      {/* 2. Interactive Angle Status + Quick Select */}
      {branch.inputKind === 'interactive-angle' && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white p-3 border border-purple-200">
          <div className="text-xs sm:text-sm font-bold text-purple-900">
            القياس المعيّن حالياً على المنقلة:{' '}
            {value ? (
              <span className="inline-block rounded-lg bg-pink-600 px-2.5 py-0.5 text-white font-extrabold" dir="ltr">
                {value}°
              </span>
            ) : (
              <span className="text-rose-600">لم يتم تعيين الشعاع بعد — انقري على المنقلة أعلاه</span>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5" dir="ltr">
            {[60, 90, 120, 150].map(deg => (
              <button
                key={deg}
                type="button"
                onClick={() => onChange(String(deg))}
                className={`rounded-lg border px-2.5 py-1 text-xs font-bold transition ${
                  value === String(deg)
                    ? 'border-pink-600 bg-pink-600 text-white'
                    : 'border-purple-200 bg-purple-50 text-purple-900 hover:bg-purple-100'
                }`}
              >
                {deg}°
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 3. Multiple Choice Options */}
      {branch.inputKind === 'choice' && branch.options && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
          {branch.options.map(opt => {
            const isSelected = value === opt.id
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => onChange(opt.id)}
                className={`flex items-center justify-between gap-2 rounded-xl border-2 px-3.5 py-2.5 text-right text-xs sm:text-sm font-bold transition active:scale-99 ${
                  isSelected
                    ? 'border-pink-600 bg-pink-600 text-white shadow-xs'
                    : 'border-purple-200/90 bg-white text-purple-950 hover:border-pink-300 hover:bg-pink-50/60'
                }`}
              >
                <span className="leading-relaxed">
                  {opt.label}{' '}
                  {opt.math && (
                    <MathTex
                      math={opt.math}
                      className={isSelected ? '!text-white' : ''}
                    />
                  )}
                </span>
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                    isSelected
                      ? 'border-white bg-white text-pink-600'
                      : 'border-purple-300 bg-purple-50'
                  }`}
                >
                  {isSelected && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {/* 4. Compare Symbol Buttons (>, <, =) */}
      {branch.inputKind === 'compare-symbol' && branch.options && (
        <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
          {branch.options.map(opt => {
            const isSelected = value === opt.id
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => onChange(opt.id)}
                className={`flex min-w-[110px] flex-col items-center justify-center rounded-2xl border-2 px-4 py-2.5 transition active:scale-95 ${
                  isSelected
                    ? 'border-pink-600 bg-pink-600 text-white shadow-sm'
                    : 'border-purple-200 bg-white text-purple-950 hover:border-pink-400 hover:bg-pink-50'
                }`}
              >
                <span className="text-2xl font-extrabold" dir="ltr">
                  {opt.math}
                </span>
                <span className="text-[11px] font-bold mt-0.5">{opt.label}</span>
              </button>
            )
          })}
        </div>
      )}

      {/* 5. Reorderable Number List */}
      {branch.inputKind === 'order-list' && branch.initialOrderItems && (
        <div className="space-y-2 mt-2">
          <div className="space-y-1.5">
            {currentOrderedIds.map((itemId, idx) => {
              const itemObj = branch.initialOrderItems?.find(i => i.id === itemId)
              if (!itemObj) return null
              return (
                <div
                  key={itemObj.id}
                  className="flex items-center justify-between gap-2 rounded-xl border border-purple-200 bg-white px-3.5 py-2 shadow-2xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-purple-100 text-xs font-extrabold text-purple-900">
                      {idx + 1}
                    </span>
                    <span className="font-mono text-sm sm:text-base font-extrabold text-purple-950" dir="ltr">
                      {itemObj.display}
                    </span>
                    <span className="text-[11px] text-purple-600 font-semibold">
                      {idx === 0 ? '(الأصغر)' : idx === currentOrderedIds.length - 1 ? '(الأكبر)' : ''}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => moveOrderItem(idx, -1)}
                      aria-label="تحريك للأعلى"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-pink-200 bg-pink-50 text-pink-900 hover:bg-pink-100 disabled:opacity-40"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === currentOrderedIds.length - 1}
                      onClick={() => moveOrderItem(idx, 1)}
                      aria-label="تحريك للأسفل"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-pink-200 bg-pink-50 text-pink-900 hover:bg-pink-100 disabled:opacity-40"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          <button
            type="button"
            onClick={() => onChange(currentOrderedIds.join(','))}
            className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-extrabold transition ${
              answered
                ? 'bg-emerald-600 text-white'
                : 'bg-pink-600 text-white hover:bg-pink-700'
            }`}
          >
            <Check className="h-3.5 w-3.5" />
            <span>{answered ? 'تم اعتماد هذا الترتيب التصاعدي ✓' : 'تثبيت هذا الترتيب التصاعدي'}</span>
          </button>
        </div>
      )}
    </div>
  )
}
