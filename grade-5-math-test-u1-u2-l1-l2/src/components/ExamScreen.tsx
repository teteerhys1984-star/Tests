import { useEffect, useMemo, useState } from 'react'
import type { Answers, AnswerValue, MainQuestion } from '../exam/types'
import { GRAPH, GRID_POINTS, GRID_SIZE } from '../exam/questions'
import { completionStats, isQuestionComplete, isSubComplete, studentAnswerText } from '../exam/grading'
import { elapsedMs, formatHMS } from '../exam/timer'
import { parseNumber } from '../exam/numbers'
import { MathText } from './MathText'
import { CoordinateGrid } from './CoordinateGrid'
import { LineGraph } from './LineGraph'
import { SubQuestionView } from './SubQuestionView'

interface Props {
  questions: MainQuestion[]
  answers: Answers
  current: number
  name: string
  startedAt: number
  muted: boolean
  onToggleMute: () => void
  onAnswer: (subId: string, v: AnswerValue) => void
  onNavigate: (index: number) => void
  onSubmit: () => void
}

const COLOR: Record<string, string> = {
  sky: 'from-sky-500 to-sky-600',
  mint: 'from-turq-500 to-mint-500',
  yellow: 'from-sun-400 to-peach-500',
  orange: 'from-peach-500 to-peach-600',
}

export function ExamScreen({ questions, answers, current, name, startedAt, muted, onToggleMute, onAnswer, onNavigate, onSubmit }: Props) {
  const q = questions[current]
  const [now, setNow] = useState(Date.now())
  const [review, setReview] = useState(false)
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 500)
    return () => clearInterval(id)
  }, [])

  const stats = useMemo(() => completionStats(questions, answers), [questions, answers])
  const pct = Math.round((stats.done / stats.total) * 100)

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [current])

  const plotSub = q.subs.find((s) => s.type === 'plot')
  const plotVal = plotSub ? (answers[plotSub.id] as Record<string, string> | undefined) : undefined
  const plotted =
    plotVal && parseNumber(plotVal.x) !== null && parseNumber(plotVal.y) !== null
      ? { x: parseNumber(plotVal.x)!, y: parseNumber(plotVal.y)! }
      : null

  return (
    <div className="mx-auto w-full max-w-3xl px-3 pb-28 pt-3 sm:px-4">
      {/* Sticky header */}
      <header className="card sticky top-2 z-20 mb-4 flex items-center gap-3 px-3 py-2.5 sm:px-4">
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-ink-soft">الطالب: {name}</p>
          <div className="mt-1 flex items-center gap-2">
            <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-sky-100" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
              <div className="h-full rounded-full bg-gradient-to-l from-turq-500 to-mint-500 transition-all" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-xs font-bold text-turq-600">{stats.done}/{stats.total}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="rounded-xl bg-ink px-2.5 py-1.5 text-center">
            <div className="text-[10px] font-medium leading-none text-white/70">الوقت</div>
            <div className="font-mono text-base font-bold tabular-nums text-white" dir="ltr">
              {formatHMS(elapsedMs(startedAt, now))}
            </div>
          </div>
          <button type="button" onClick={onToggleMute} aria-label={muted ? 'تشغيل الصوت' : 'كتم الصوت'} className="h-10 w-10 rounded-xl bg-sky-50 text-lg">
            {muted ? '🔇' : '🔊'}
          </button>
        </div>
      </header>

      {/* Question navigator */}
      <nav className="mb-4 grid grid-cols-7 gap-1.5" aria-label="الأسئلة">
        {questions.map((qq, i) => {
          const done = isQuestionComplete(qq, answers)
          const active = i === current
          return (
            <button
              key={qq.id}
              type="button"
              onClick={() => onNavigate(i)}
              aria-current={active ? 'step' : undefined}
              className={`flex h-12 flex-col items-center justify-center rounded-xl border-2 text-sm font-bold transition ${
                active ? 'border-sky-500 bg-sky-500 text-white shadow-md' : done ? 'border-mint-400 bg-mint-100 text-mint-600' : 'border-slate-200 bg-white text-ink-soft'
              }`}
            >
              <span>{qq.number}</span>
              <span className="text-[10px] leading-none">{done ? '✓' : ''}</span>
            </button>
          )
        })}
      </nav>

      {/* Question card */}
      <article className="card overflow-hidden">
        <div className={`bg-gradient-to-l ${COLOR[q.color]} px-4 py-4 text-white sm:px-6`}>
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-2xl">{q.icon}</span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-white/80">السؤال {q.number} من {questions.length}</p>
              <h2 className="text-lg font-bold leading-snug sm:text-xl">{q.title}</h2>
            </div>
            <span className="shrink-0 rounded-full bg-white/25 px-3 py-1 text-sm font-bold">{q.marks} درجة</span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-white/95 sm:text-base">
            <MathText text={q.intro} />
          </p>
        </div>

        <div className="space-y-4 p-3 sm:p-5">
          {q.figure === 'grid' && (
            <div className="rounded-2xl border-2 border-sky-100 bg-sky-50/50 p-2">
              <CoordinateGrid
                size={GRID_SIZE}
                points={GRID_POINTS}
                plotted={plotted}
                onPlot={plotSub ? (x, y) => onAnswer(plotSub.id, { x: String(x), y: String(y) }) : undefined}
              />
              <p className="mt-1 text-center text-xs text-ink-soft">انقر على أي تقاطع في الشبكة لتعيين النقطة المطلوبة في الفرع (هـ).</p>
            </div>
          )}
          {q.figure === 'graph' && (
            <div className="rounded-2xl border-2 border-mint-400/40 bg-mint-100/30 p-2">
              <LineGraph data={GRAPH} />
            </div>
          )}

          {q.subs.map((s, i) => (
            <SubQuestionView key={s.id} sub={s} index={i} value={answers[s.id]} onChange={(v) => onAnswer(s.id, v)} complete={isSubComplete(s, answers)} />
          ))}
        </div>
      </article>

      {review && <div className="fixed inset-0 z-30 overflow-y-auto bg-ink/60 p-3" role="dialog" aria-modal="true" aria-label="مراجعة الإجابات">
        <div className="card mx-auto my-4 max-w-3xl p-5">
          <h2 className="text-xl font-bold">مراجعة الإجابات قبل التسليم</h2>
          <p className="my-2 text-sm">الفروع المكتملة {stats.done} من {stats.total}. يمكنك العودة للتعديل أو التسليم مع فروع غير مكتملة.</p>
          {questions.map(q => <section key={q.id} className="my-3 rounded-xl bg-sky-50 p-3">
            <h3 className="font-bold">السؤال {q.number}: {q.title}</h3>
            {q.subs.map((s, i) => <p key={s.id} className="my-1 text-sm">({i + 1}) <MathText text={s.prompt} /> — <MathText text={studentAnswerText(s, answers)} /></p>)}
          </section>)}
          <div className="flex flex-wrap gap-2"><button type="button" className="rounded-xl border-2 border-sky-200 p-3 font-bold" onClick={() => setReview(false)}>العودة للتعديل</button>
          <button type="button" className="rounded-xl bg-mint-500 p-3 font-bold text-white" onClick={onSubmit}>تأكيد التسليم</button></div>
        </div>
      </div>}

      {/* Bottom bar */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-sky-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-2 px-3 py-2.5 sm:px-4">
          <button
            type="button"
            disabled={current === 0}
            onClick={() => onNavigate(current - 1)}
            className="h-12 rounded-xl border-2 border-slate-200 bg-white px-3 text-sm font-bold disabled:opacity-30 sm:px-4"
          >
            → السابق
          </button>
          {current < questions.length - 1 ? (
            <button type="button" onClick={() => onNavigate(current + 1)} className="btn-press h-12 flex-1 rounded-xl bg-sky-500 text-base font-bold text-white shadow-md">
              التالي ←
            </button>
          ) : (
            <span className="flex-1" />
          )}
          <button
            type="button"
            onClick={() => setReview(true)}
            title="مراجعة الإجابات قبل التسليم"
            className="btn-press h-12 rounded-xl bg-gradient-to-l from-mint-500 to-turq-500 px-3 text-sm font-bold text-white shadow-md transition disabled:cursor-not-allowed disabled:opacity-40 sm:px-5 sm:text-base"
          >
            مراجعة وتسليم
          </button>
        </div>
        {!stats.allDone && <p className="pb-1.5 text-center text-[11px] text-ink-soft">فروع غير مكتملة: {stats.total - stats.done}</p>}
      </div>
    </div>
  )
}
