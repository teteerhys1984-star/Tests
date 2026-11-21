import { useMemo, useState } from 'react'
import type { AnswerValue, Answers, Question } from '../lib/types'
import { emptyDoc, type MathDoc } from '../lib/expression'
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
  type Cursor,
} from '../lib/mathEditor'
import { lessonTitle } from '../data/lessons'
import { questionPoints } from '../data/index'
import { FigureView } from './Figures'
import { RichParagraphs, RichText } from './RichText'
import { PartInputView } from './PartInputs'
import { Keypad, type KeyAction } from './MathInput'

interface Props {
  question: Question
  index: number
  total: number
  answers: Answers
  onAnswer: (partId: string, value: AnswerValue) => void
}

const isMathKind = (k: string) => k === 'math' || k === 'expanded'

/** One main question: prompt, figure/table, every part with its own input, and the math keypad when needed. */
export function QuestionCard({ question, index, total, answers, onAnswer }: Props) {
  const mathParts = useMemo(() => question.parts.filter((p) => isMathKind(p.input.kind)), [question])
  const [activeId, setActiveId] = useState<string | null>(mathParts[0]?.id ?? null)
  const [cursors, setCursors] = useState<Record<string, Cursor>>({})

  const activePart = mathParts.find((p) => p.id === activeId) ?? mathParts[0] ?? null

  const applyKey = (action: KeyAction) => {
    if (!activePart) return
    const value = answers[activePart.id]
    const doc: MathDoc = value?.t === 'math' ? value.doc : emptyDoc()
    const cur = cursors[activePart.id] ?? startCursor(doc)
    let next: { doc: MathDoc; cur: Cursor }
    switch (action.type) {
      case 'insert':
        next = insertSymbol(doc, cur, action.value)
        break
      case 'frac':
        next = insertFraction(doc, cur)
        break
      case 'back':
        next = backspace(doc, cur)
        break
      case 'clear':
        next = clearDoc()
        break
      case 'left':
        next = { doc, cur: moveLeft(doc, cur) }
        break
      case 'right':
        next = { doc, cur: moveRight(doc, cur) }
        break
      case 'numerator':
        next = { doc, cur: goNumerator(doc, cur) }
        break
      case 'denominator':
        next = { doc, cur: goDenominator(doc, cur) }
        break
      default:
        return
    }
    onAnswer(activePart.id, { t: 'math', doc: next.doc })
    setCursors((prev) => ({ ...prev, [activePart.id]: next.cur }))
  }

  const points = questionPoints(question)

  return (
    <article className="qcard" aria-labelledby={`q-${question.id}-title`}>
      <header className="qhead">
        <div className="qhead-main">
          <span className="qnum" id={`q-${question.id}-title`}>
            السؤال {index} <span className="qnum-of">من {total}</span>
          </span>
          <span className="qlesson">{lessonTitle(question.lesson)}</span>
        </div>
        <span className="qpts" aria-label={`${points} علامات`}>
          {points} <small>علامات</small>
        </span>
      </header>
      <div className="qmeta">
        <span className="tag tag-style">{question.style}</span>
      </div>

      <RichParagraphs text={question.prompt} className="qprompt" />

      {question.figure && (
        <div className="fig-box">
          <FigureView spec={question.figure} />
        </div>
      )}

      {question.table && (
        <div className="table-scroll">
          <table className="qtable">
            <caption>
              <RichText text={question.table.caption} />
            </caption>
            <thead>
              <tr>
                {question.table.headers.map((h, i) => (
                  <th key={i} scope="col">
                    <RichText text={h} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {question.table.rows.map((row, r) => (
                <tr key={r}>
                  {row.map((cell, c) => (
                    <td key={c}>
                      <RichText text={cell} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="parts">
        {question.parts.map((part) => {
          const isMath = isMathKind(part.input.kind)
          const isActive = isMath && activePart?.id === part.id
          return (
            <section key={part.id} className={`part${isActive ? ' part-active' : ''}`} aria-label={part.label ? `الفرع ${part.label}` : 'الإجابة'}>
              <div className="part-head">
                {part.label && <span className="part-label">{part.label}</span>}
                {part.prompt && (
                  <span className="part-prompt">
                    <RichText text={part.prompt} />
                  </span>
                )}
                <span className="part-pts">{part.points} ع</span>
              </div>
              <PartInputView
                part={part}
                value={answers[part.id]}
                onChange={(v) => onAnswer(part.id, v)}
                cursor={isMath ? (cursors[part.id] ?? null) : null}
                mathActive={isActive}
                onMathFocus={(c) => {
                  setActiveId(part.id)
                  setCursors((prev) => ({ ...prev, [part.id]: c }))
                }}
              />
            </section>
          )
        })}
      </div>

      {activePart && (
        <div className="keypad-wrap">
          <div className="keypad-hint">
            <span>لوحة الرموز — تكتبين في {activePart.label ? `الفرع ${activePart.label}` : 'حقل الإجابة'}</span>
          </div>
          <Keypad onKey={applyKey} disabled={!activePart} />
        </div>
      )}
    </article>
  )
}

export { isMathKind, RichText }
