import { useEffect, useMemo, useRef, useState } from 'react'
import type { Question } from '../exam/types'
import { isAnswered, type Answers, type AnswerValue } from '../exam/grading'
import { MathText } from '../lib/mathx'
import { formatDuration, num } from '../lib/time'
import { FigureView } from '../exam/figureViews'
import { AnswerWidget } from '../components/AnswerWidgets'
import { LESSON_BY_ID } from '../exam/types'

interface Props {
  studentName: string
  order: Question[]
  answers: Answers
  setAnswer: (subpartId: string, v: AnswerValue) => void
  elapsedMs: number
  onSubmit: () => void
  totalSubparts: number
}

function useQuestionStatus(order: Question[], answers: Answers) {
  return useMemo(
    () =>
      order.map((q) => {
        const done = q.subparts.filter((sp) => isAnswered(sp, answers[sp.id])).length
        return { done, total: q.subparts.length, marks: q.subparts.reduce((s, x) => s + x.marks, 0) }
      }),
    [order, answers],
  )
}

export function Exam({ studentName, order, answers, setAnswer, elapsedMs, onSubmit, totalSubparts }: Props) {
  const [index, setIndex] = useState(0)
  const [panelOpen, setPanelOpen] = useState(false)
  const status = useQuestionStatus(order, answers)
  const topRef = useRef<HTMLDivElement | null>(null)

  const answeredSubparts = status.reduce((s, x) => s + x.done, 0)
  const remaining = totalSubparts - answeredSubparts
  const remainingQuestions = status
    .map((s, i) => ({ s, i }))
    .filter(({ s }) => s.done < s.total)
    .map(({ i }) => i + 1)
  const canSubmit = remaining === 0
  const q = order[index]

  useEffect(() => {
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [index])

  const goto = (i: number) => {
    setIndex(Math.max(0, Math.min(order.length - 1, i)))
    setPanelOpen(false)
  }

  const progressPct = Math.round((answeredSubparts / totalSubparts) * 1000) / 10

  return (
    <div className="relative z-10 mx-auto max-w-6xl px-3 pb-32 pt-4 sm:px-4">
      {/* ======= الشريط العلوي الثابت ======= */}
      <div ref={topRef} className="sticky top-0 z-30 -mx-3 mb-4 border-b bg-[rgba(244,239,228,0.94)] px-3 pb-2.5 pt-2 backdrop-blur sm:-mx-4 sm:px-4"
        style={{ borderColor: 'var(--line)' }}>
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="display tnum grid h-11 w-11 shrink-0 place-items-center rounded-[var(--r-sm)] text-lg"
              style={{ background: 'var(--navy)', color: '#ffd97a' }}>
              {num(index + 1)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-[0.92rem] font-extrabold" style={{ color: 'var(--navy)' }}>
                السؤال {num(index + 1)} من {num(order.length)}
              </p>
              <p className="truncate text-[0.76rem]" style={{ color: 'var(--ink-3)' }}>
                {studentName} · <span className="tnum">{num(status[index]?.marks ?? 0)}</span> علامات لهذا السؤال
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-[var(--r-sm)] px-2.5 py-1.5 tnum"
              style={{ background: 'var(--navy)', color: '#ffd97a' }} title="زمن الحلّ المنقضي (عدّ تصاعدي)">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
                <circle cx="12" cy="13" r="8" /><path d="M12 9v4l2.5 2M9 2h6" />
              </svg>
              <span className="text-[0.95rem] font-bold tabular-nums">{formatDuration(elapsedMs)}</span>
            </div>
            <button type="button" className="btn btn-ghost !py-1.5 !px-3 !min-h-0 text-sm lg:hidden"
              onClick={() => setPanelOpen((v) => !v)} aria-expanded={panelOpen}>
              الفهرس
              <span className="badge badge-gold tnum !py-0">{num(answeredSubparts)}/{num(totalSubparts)}</span>
            </button>
          </div>
        </div>

        <div className="mt-2 flex items-center gap-2.5">
          <div className="bar-track flex-1" role="progressbar" aria-valuenow={progressPct} aria-valuemin={0} aria-valuemax={100}
            aria-label="نسبة الفروع المُجابة">
            <div className="bar-fill" style={{ width: `${progressPct}%` }} />
          </div>
          <span className="tnum shrink-0 text-[0.78rem] font-bold" style={{ color: 'var(--ink-2)' }}>
            {num(progressPct)}%
          </span>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_228px]">
        {/* ======= بطاقة السؤال ======= */}
        <main className="min-w-0">
          <article className="card overflow-hidden">
            <header className="relative p-4 sm:p-6" style={{ background: 'linear-gradient(135deg,#123c49 0%,#0e2f3a 60%,#164a59 100%)' }}>
              <div className="absolute inset-0 opacity-[0.1]" aria-hidden
                style={{ backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)', backgroundSize: '26px 26px' }} />
              <div className="relative flex items-start gap-4">
                <div className="qnum tnum shrink-0" style={{ color: '#ffd97a' }}>{num(index + 1)}</div>
                <div className="min-w-0 flex-1">
                  <h2 className="display text-[clamp(1.05rem,3vw,1.45rem)] leading-snug" style={{ color: '#fff8e8' }}>
                    <MathText text={q.title} />
                  </h2>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <span className="badge" style={{ background: 'rgba(255,217,122,0.18)', color: '#ffd97a', borderColor: 'rgba(255,217,122,0.4)' }}>
                      <span className="tnum">{num(status[index]?.marks ?? 0)}</span> علامات
                    </span>
                    <span className="badge" style={{ background: 'rgba(255,248,232,0.12)', color: '#dcebee', borderColor: 'rgba(255,248,232,0.22)' }}>
                      {q.difficulty}
                    </span>
                    {q.integrated && (
                      <span className="badge" style={{ background: 'rgba(15,118,110,0.35)', color: '#bff0e6', borderColor: 'rgba(15,118,110,0.6)' }}>
                        سؤال تركيبي
                      </span>
                    )}
                    {q.lessons.map((id) => (
                      <span key={id} className="badge" style={{ background: 'rgba(255,248,232,0.08)', color: '#cfe3e6', borderColor: 'rgba(255,248,232,0.16)' }}>
                        {LESSON_BY_ID[id].title}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </header>

            <div className="p-4 sm:p-6">
              {q.intro && (
                <div className="mb-4 rounded-[var(--r-sm)] border p-3.5" style={{ borderColor: '#e3d9c5', background: 'var(--surface-2)' }}>
                  <p className="text-[0.97rem] leading-relaxed"><MathText text={q.intro} /></p>
                </div>
              )}

              {q.figure && (
                <div className="mb-4">
                  <FigureView id={q.figure} />
                </div>
              )}

              {q.note && (
                <p className="mb-4 flex items-start gap-2 text-[0.83rem] leading-relaxed" style={{ color: 'var(--ink-3)' }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mt-0.5 shrink-0" aria-hidden>
                    <circle cx="12" cy="12" r="9" /><path d="M12 8h.01M11 12h1v4h1" />
                  </svg>
                  <MathText text={q.note} />
                </p>
              )}

              <div className="grid gap-3">
                {q.subparts.map((sp) => {
                  const done = isAnswered(sp, answers[sp.id])
                  return (
                    <section key={sp.id} className="subcard" data-done={done ? '1' : '0'} aria-labelledby={`${sp.id}-lbl`}>
                      <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                        <div className="flex items-start gap-2.5">
                          <span id={`${sp.id}-lbl`} className="display grid h-8 w-8 shrink-0 place-items-center rounded-[var(--r-xs)] text-base"
                            style={{ background: done ? 'var(--teal)' : 'var(--gold-soft)', color: done ? '#fff' : 'var(--gold-deep)' }}>
                            {sp.label}
                          </span>
                          <p className="min-w-0 flex-1 text-[0.97rem] leading-relaxed"><MathText text={sp.prompt} /></p>
                        </div>
                        <span className="badge badge-mute shrink-0 tnum">{num(sp.marks)} {sp.marks === 1 ? 'علامة' : 'علامات'}</span>
                      </div>
                      <div className="ps-[42px] max-lg:ps-0">
                        <AnswerWidget sp={sp} value={answers[sp.id]} onChange={(v) => setAnswer(sp.id, v)} />
                      </div>
                    </section>
                  )
                })}
              </div>
            </div>
          </article>

          {/* ======= التنقّل ======= */}
          <nav className="mt-4 flex flex-wrap items-center justify-between gap-2" aria-label="التنقل بين الأسئلة">
            <button type="button" className="btn btn-ghost" onClick={() => goto(index - 1)} disabled={index === 0}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden>
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
              السؤال السابق
            </button>
            <span className="tnum text-sm font-bold" style={{ color: 'var(--ink-3)' }}>
              {num(index + 1)} / {num(order.length)}
            </span>
            <button type="button" className="btn btn-primary" onClick={() => goto(index + 1)} disabled={index === order.length - 1}>
              السؤال التالي
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden>
                <path d="M19 12H5M11 18l-6-6 6-6" />
              </svg>
            </button>
          </nav>
        </main>

        {/* ======= فهرس الأسئلة ======= */}
        <aside className={`${panelOpen ? 'block' : 'hidden'} lg:block`}>
          <div className="card sticky top-[104px] p-3">
            <h3 className="mb-2 flex items-center justify-between text-sm font-extrabold" style={{ color: 'var(--navy)' }}>
              فهرس الأسئلة
              <span className="badge badge-mute tnum">{num(answeredSubparts)}/{num(totalSubparts)}</span>
            </h3>
            <div className="grid grid-cols-5 gap-1.5 lg:grid-cols-4">
              {order.map((_, i) => {
                const s = status[i]
                const state = s.done === 0 ? 'none' : s.done === s.total ? 'full' : 'partial'
                return (
                  <button key={i} type="button" className="navpill tnum" data-state={state} data-current={i === index ? '1' : '0'}
                    onClick={() => goto(i)} aria-label={`السؤال ${i + 1}`}
                    aria-current={i === index ? 'step' : undefined}
                    title={`${s.done}/${s.total} فرع مُجاب`}>
                    {num(i + 1)}
                  </button>
                )
              })}
            </div>
            <div className="mt-3 grid gap-1 text-[0.72rem]" style={{ color: 'var(--ink-3)' }}>
              <span className="flex items-center gap-1.5">
                <i className="inline-block h-3 w-3 rounded-[3px]" style={{ background: 'var(--navy)' }} /> مُجاب بالكامل
              </span>
              <span className="flex items-center gap-1.5">
                <i className="inline-block h-3 w-3 rounded-[3px]" style={{ background: 'var(--gold-soft)', border: '1px solid var(--gold)' }} /> مُجاب جزئياً
              </span>
              <span className="flex items-center gap-1.5">
                <i className="inline-block h-3 w-3 rounded-[3px] border" style={{ borderColor: 'var(--line)', background: '#fff' }} /> لم يُجب
              </span>
            </div>
          </div>
        </aside>
      </div>

      {/* ======= شريط التسليم ======= */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-[rgba(255,253,247,0.97)] backdrop-blur"
        style={{ borderColor: 'var(--line)', boxShadow: '0 -8px 24px rgba(14,47,58,0.10)' }}>
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-3 py-2.5 sm:px-4">
          <div className="min-w-0 flex-1">
            {canSubmit ? (
              <p className="flex items-center gap-2 text-sm font-bold" style={{ color: 'var(--ok)' }}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" aria-hidden>
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                أجبت عن جميع الفروع ({num(totalSubparts)} فرعاً). اضغط «تسليم الاختبار» لتصحيح الاختبار وتنزيل التقرير تلقائياً.
              </p>
            ) : (
              <div className="text-sm">
                <p className="font-bold" style={{ color: 'var(--warn)' }}>
                  تبقّى <span className="tnum">{num(remaining)}</span> فرعاً بلا إجابة — لا يمكن التسليم قبل إكمالها.
                </p>
                <p className="mt-0.5 text-[0.78rem]" style={{ color: 'var(--ink-3)' }}>
                  الأسئلة الناقصة:{' '}
                  <span className="tnum font-bold">
                    {remainingQuestions.slice(0, 12).map((n) => num(n)).join('، ')}
                    {remainingQuestions.length > 12 ? ' …' : ''}
                  </span>
                  {'  ·  '}
                  <button type="button" className="underline decoration-dotted underline-offset-2"
                    style={{ color: 'var(--teal)' }} onClick={() => goto(remainingQuestions[0] - 1)}>
                    انتقل إلى أول سؤال ناقص
                  </button>
                </p>
              </div>
            )}
          </div>
          <button type="button" className="btn btn-danger shrink-0 text-[1rem]" onClick={onSubmit} disabled={!canSubmit}>
            تسليم الاختبار
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" aria-hidden>
              <path d="M12 3v12M7 10l5 5 5-5M4 21h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
