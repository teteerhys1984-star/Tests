import { useMemo, useState } from 'react'
import type { Question } from '../exam/types'
import { TOTAL_MARKS } from '../exam/types'
import { isAnswered, type Answers } from '../exam/grading'
import { MathText } from '../lib/mathx'
import { formatDuration, num } from '../lib/time'

interface Props {
  studentName: string
  order: Question[]
  answers: Answers
  elapsedMs: number
  answeredCount: number
  totalSubparts: number
  onBackToQuestion: (index: number) => void
  onSubmit: () => void
  onExit: () => void
}

/**
 * صفحة «مراجعة الإجابات» قبل التسليم: تعرض حالة كل فرع (مُجاب/لم يُجب)
 * وتتيح العودة إلى أي سؤال لتعديل إجابته. التسليم يبقى معطّلاً ما دام فرع بلا إجابة،
 * كما في الاختبار المرجعي — فلا يفقد الطالب علامة بسبب فرع نسيه.
 */
export function Review({
  studentName, order, answers, elapsedMs, answeredCount, totalSubparts, onBackToQuestion, onSubmit, onExit,
}: Props) {
  const [filter, setFilter] = useState<'all' | 'missing'>('all')
  const stats = useMemo(
    () =>
      order.map((q) => {
        const done = q.subparts.filter((sp) => isAnswered(sp, answers[sp.id])).length
        return { done, total: q.subparts.length }
      }),
    [order, answers],
  )
  const remaining = totalSubparts - answeredCount
  const canSubmit = remaining === 0
  const rows = order
    .map((q, i) => ({ q, i, s: stats[i] }))
    .filter(({ s }) => (filter === 'missing' ? s.done < s.total : true))

  return (
    <div className="relative z-10 mx-auto max-w-5xl px-3 pb-28 pt-5 sm:px-4">
      <div className="rounded-[var(--r-lg)] p-5 text-[#f4ecd8] shadow-[var(--sh-3)] sm:p-7"
        style={{ background: 'linear-gradient(135deg,#0e2f3a 0%,#164a59 55%,#0f766e 100%)' }}>
        <p className="kicker" style={{ color: '#ffd97a' }}>الخطوة قبل الأخيرة</p>
        <h1 className="display mt-1 text-[clamp(1.4rem,4vw,2.1rem)]" style={{ color: '#fff8e8' }}>مراجعة الإجابات قبل التسليم</h1>
        <p className="mt-2 max-w-2xl text-[0.95rem] leading-relaxed opacity-90">
          راجع حالة كل سؤال أدناه. يمكنك العودة إلى أي سؤال لتعديل إجابتك. عند الضغط على
          «تسليم الاختبار» يُصحَّح الاختبار تلقائياً، ويُنزَّل تقرير TXT، وتُرسَل نتيجتك وإجاباتك إلى معلّمك.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="badge tnum" style={{ background: 'rgba(255,217,122,0.2)', color: '#ffd97a', borderColor: 'rgba(255,217,122,0.45)', fontSize: '0.92rem' }}>
            الطالب: <strong>{studentName}</strong>
          </span>
          <span className="badge tnum" style={{ background: 'rgba(255,248,232,0.14)', color: '#dcebee', borderColor: 'rgba(255,248,232,0.24)', fontSize: '0.92rem' }}>
            الفروع المُجابة: <strong>{num(answeredCount)} / {num(totalSubparts)}</strong>
          </span>
          <span className="badge tnum" style={{ background: 'rgba(15,118,110,0.35)', color: '#bff0e6', borderColor: 'rgba(15,118,110,0.6)', fontSize: '0.92rem' }}>
            الزمن: <strong>{formatDuration(elapsedMs)}</strong>
          </span>
          <span className="badge tnum" style={{ background: 'rgba(255,248,232,0.1)', color: '#e7f0f1', borderColor: 'rgba(255,248,232,0.2)', fontSize: '0.92rem' }}>
            المجموع: <strong>{num(TOTAL_MARKS)}</strong> علامة
          </span>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-2">
          {([
            ['all', `كل الأسئلة (${num(order.length)})`],
            ['missing', `غير المكتملة (${num(stats.filter((s) => s.done < s.total).length)})`],
          ] as const).map(([k, label]) => (
            <button key={k} type="button" onClick={() => setFilter(k)}
              className="btn !py-1.5 !px-3 !min-h-0 text-sm"
              style={filter === k
                ? { background: 'var(--navy)', color: '#ffd97a', border: '1px solid var(--navy)' }
                : { background: 'var(--surface)', color: 'var(--ink-2)', border: '1px solid var(--line)' }}>
              {label}
            </button>
          ))}
        </div>
        <button type="button" className="btn btn-ghost !py-1.5 !px-3 !min-h-0 text-sm" onClick={onExit}>
          العودة إلى الأسئلة
        </button>
      </div>

      <div className="mt-3 grid gap-2">
        {rows.length === 0 && (
          <p className="card p-4 text-center text-sm" style={{ color: 'var(--ok)' }}>
            أجبت عن جميع الفروع — يمكنك التسليم الآن.
          </p>
        )}
        {rows.map(({ q, i, s }) => {
          const state = s.done === 0 ? 'none' : s.done === s.total ? 'full' : 'partial'
          return (
            <div key={q.id} className="review-row" data-state={state}>
              <span className="steps-count tnum">{num(i + 1)}</span>
              <div className="min-w-0">
                <p className="text-[0.95rem] font-bold" style={{ color: 'var(--ink-1)' }}><MathText text={q.title} /></p>
                <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[0.78rem]" style={{ color: 'var(--ink-3)' }}>
                  <span className="badge badge-mute tnum">{num(s.done)} / {num(s.total)} فرعاً</span>
                  <span className="badge badge-teal tnum">{num(q.subparts.reduce((a, x) => a + x.marks, 0))} علامة</span>
                  <span>{q.source}</span>
                </p>
              </div>
              <button type="button" className="btn btn-ghost !py-1 !px-2.5 !min-h-0 text-xs shrink-0"
                onClick={() => onBackToQuestion(i)}>
                {s.done === s.total ? 'تعديل الإجابة' : 'الإجابة الآن'}
              </button>
            </div>
          )
        })}
      </div>

      <div className="card mt-5 p-4 text-[0.86rem] leading-relaxed" style={{ background: 'var(--surface-2)', color: 'var(--ink-2)' }}>
        <p className="font-bold" style={{ color: 'var(--navy)' }}>تنبيه خصوصية قبل التسليم</p>
        <p className="mt-1">
          عند الضغط على «تسليم الاختبار» تُرسَل نتيجتك واسمك وإجاباتك ونصّ تقرير نتيجتك إلكترونياً إلى معلّمك
          عبر خدمة Google Sheets المرتبطة بالاختبار. يُنشَأ ملف التقرير TXT أيضاً على جهازك كنسخة احتياطية،
          ويبقى متاحاً للتنزيل من صفحة النتيجة في أي وقت. لا يُرسَل شيء قبل التسليم.
        </p>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-[rgba(255,253,247,0.97)] backdrop-blur"
        style={{ borderColor: 'var(--line)', boxShadow: '0 -8px 24px rgba(14,47,58,0.10)' }}>
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-3 py-2.5 sm:px-4">
          <p className="min-w-0 flex-1 text-sm">
            {canSubmit ? (
              <span className="font-bold" style={{ color: 'var(--ok)' }}>
                كل الفروع مُجابة ({num(totalSubparts)} فرعاً) — يمكنك التسليم.
              </span>
            ) : (
              <span className="font-bold" style={{ color: 'var(--warn)' }}>
                تبقّى <span className="tnum">{num(remaining)}</span> فرعاً بلا إجابة، ولا يمكن التسليم قبل إكمالها.
              </span>
            )}
          </p>
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
