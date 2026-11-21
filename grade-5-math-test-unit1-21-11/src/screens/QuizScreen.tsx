import { useEffect, useMemo, useRef } from 'react'
import { EXAM_TITLE_AR } from '../config'
import { Decor, MuteButton, Timer } from '../components/Shell'
import { QuestionCard } from '../components/QuestionCard'
import { ContactBar } from '../components/ContactBar'
import { isPartAnswered } from '../lib/grading'
import type { Attempt } from '../lib/attempt'
import type { AnswerValue, Question } from '../lib/types'
import { QUESTIONS, TOTAL_POINTS } from '../data/index'

interface Props {
  attempt: Attempt
  muted: boolean
  onToggleMute: () => void
  onAnswer: (partId: string, value: AnswerValue) => void
  onGo: (index: number) => void
  onReview: () => void
}

export function QuizScreen({ attempt, muted, onToggleMute, onAnswer, onGo, onReview }: Props) {
  const questions: Question[] = QUESTIONS
  const total = questions.length
  const current = Math.min(Math.max(attempt.current, 0), total - 1)
  const q = questions[current]
  const topRef = useRef<HTMLDivElement>(null)

  const answeredParts = useMemo(
    () =>
      questions.map((qq) =>
        qq.parts.map((p) => isPartAnswered(p.input, attempt.answers[p.id])),
      ),
    [questions, attempt.answers],
  )
  const completeFlags = answeredParts.map((flags) => flags.every(Boolean))
  const answeredCount = completeFlags.filter(Boolean).length
  const remainingCount = total - answeredCount
  const missingParts = answeredParts.reduce(
    (s, flags) => s + flags.filter((f) => !f).length,
    0,
  )
  const progress = Math.round((answeredCount / total) * 100)

  useEffect(() => {
    topRef.current?.scrollIntoView({ block: 'start', behavior: 'auto' })
  }, [current])

  const go = (i: number) => {
    if (i < 0 || i >= total) return
    onGo(i)
  }

  return (
    <div className="page quiz-page" ref={topRef}>
      <Decor />
      <header className="topbar topbar-quiz">
        <div className="brand">
          <span className="brand-badge" aria-hidden="true">✿</span>
          <div className="brand-text">
            <h1 className="brand-title">{EXAM_TITLE_AR}</h1>
            <p className="brand-sub" title={attempt.studentName}>الطالب/ة: {attempt.studentName}</p>
          </div>
        </div>
        <div className="topbar-tools">
          <Timer startedAt={attempt.startedAt} submittedAt={attempt.submittedAt} />
          <MuteButton muted={muted} onToggle={onToggleMute} />
        </div>
      </header>

      <section className="progress-card" aria-label="تقدم الاختبار">
        <div className="progress-row">
          <span>أنجزت <strong>{answeredCount}</strong> من {total} سؤالاً</span>
          <span>المتبقي <strong>{remainingCount}</strong></span>
        </div>
        <div
          className="progress-track"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={answeredCount}
          aria-label={`أنجزت ${answeredCount} من ${total}`}
        >
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <nav className="navigator" aria-label="الانتقال بين الأسئلة">
          {questions.map((qq, i) => {
            const state = i === current ? 'current' : completeFlags[i] ? 'done' : 'todo'
            return (
              <button
                key={qq.id}
                type="button"
                className={`nav-dot nav-${state}`}
                onClick={() => go(i)}
                aria-label={`السؤال ${i + 1}${completeFlags[i] ? ' — مكتمل' : ' — غير مكتمل'}`}
                aria-current={i === current ? 'step' : undefined}
              >
                {i + 1}
              </button>
            )
          })}
        </nav>
        <div className="submit-row">
          <button type="button" className="btn btn-submit" onClick={onReview}>
            مراجعة الإجابات والتسليم
          </button>
          <p className="submit-hint">
            {missingParts === 0
              ? 'أجبت عن جميع الفروع. راجع إجاباتك ثم أكّد التسليم.'
              : `يبقى ${missingParts} فرعاً غير مُجاب. يمكنك المراجعة والتسليم، لكن الأفرع الفارغة تُحسب صفراً.`}
          </p>
        </div>
        <p className="points-note">مجموع العلامات الكلي {TOTAL_POINTS} علامة</p>
      </section>

      <main className="container">
        <QuestionCard
          key={q.id}
          question={q}
          index={current + 1}
          total={total}
          answers={attempt.answers}
          onAnswer={onAnswer}
        />
      </main>

      <nav className="bottom-nav" aria-label="أزرار التنقل">
        <button type="button" className="btn btn-ghost" onClick={() => go(current - 1)} disabled={current === 0}>
          السابق
        </button>
        <span className="bottom-count" aria-live="polite">{current + 1} / {total}</span>
        <button type="button" className="btn btn-primary" onClick={() => go(current + 1)} disabled={current === total - 1}>
          التالي
        </button>
      </nav>

      <div className="page-end">
        <ContactBar />
      </div>
    </div>
  )
}
