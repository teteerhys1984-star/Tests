import { useMemo } from 'react'
import type { ExamResult, MainQuestion } from '../exam/types'
import { buildReport, downloadText, safeFileName } from '../exam/report'
import { formatHMS } from '../exam/timer'
import { MathText } from './MathText'

interface Props {
  name: string
  questions: MainQuestion[]
  result: ExamResult
  elapsedMs: number
  submittedAt: number
  onRestart: () => void
}

const STATUS = {
  correct: { label: 'صحيحة', cls: 'bg-mint-100 text-mint-600 border-mint-400', icon: '✅' },
  partial: { label: 'جزئية', cls: 'bg-sun-100 text-peach-600 border-sun-400', icon: '🟡' },
  wrong: { label: 'خاطئة', cls: 'bg-red-50 text-red-600 border-red-300', icon: '❌' },
}

export function ResultsScreen({ name, questions, result, elapsedMs, submittedAt, onRestart }: Props) {
  const pct = Math.round((result.total / result.max) * 100)
  const report = useMemo(() => buildReport({ name, result, questions, elapsedMs, submittedAt }), [name, result, questions, elapsedMs, submittedAt])
  const correctCount = result.questions.flatMap((q) => q.subs).filter((s) => s.status === 'correct').length
  const subCount = result.questions.flatMap((q) => q.subs).length
  const message = pct >= 90 ? 'ممتاز! أداء رائع 🌟' : pct >= 75 ? 'جيد جداً! استمر 👏' : pct >= 50 ? 'جيد، راجع الأخطاء لتتحسّن 💪' : 'لا بأس، المراجعة طريق النجاح 📚'

  const download = (suffix = '') =>
    downloadText(`math-exam-report-${safeFileName(name)}${suffix}.txt`, report)

  return (
    <div className="mx-auto w-full max-w-3xl px-3 py-5 sm:px-4">
      <div className="card overflow-hidden">
        <div className="bg-gradient-to-l from-sky-500 via-turq-500 to-mint-500 p-6 text-center text-white">
          <div className="text-5xl">🎉</div>
          <h1 className="mt-2 text-2xl font-bold">النتيجة النهائية</h1>
          <p className="mt-1 text-base">الطالب: <span className="font-bold">{name}</span></p>
          <div className="mx-auto mt-4 flex h-32 w-32 flex-col items-center justify-center rounded-full border-8 border-white/40 bg-white/15">
            <span className="text-4xl font-bold leading-none" dir="ltr">{result.total}</span>
            <span className="text-sm">من {result.max}</span>
          </div>
          <p className="mt-3 text-lg font-bold">{message}</p>
        </div>
        <div className="grid grid-cols-3 gap-2 p-4 text-center">
          <div className="rounded-2xl bg-mint-100 p-3">
            <div className="text-xl font-bold text-mint-600">{pct}%</div>
            <div className="text-xs text-ink-soft">النسبة</div>
          </div>
          <div className="rounded-2xl bg-sky-50 p-3">
            <div className="text-xl font-bold text-sky-600" dir="ltr">{correctCount}/{subCount}</div>
            <div className="text-xs text-ink-soft">فروع صحيحة</div>
          </div>
          <div className="rounded-2xl bg-sun-100 p-3">
            <div className="font-mono text-xl font-bold text-peach-600" dir="ltr">{formatHMS(elapsedMs)}</div>
            <div className="text-xs text-ink-soft">الوقت</div>
          </div>
        </div>
        <div className="flex flex-col gap-2 px-4 pb-4 sm:flex-row">
          <button type="button" onClick={() => download()} className="btn-press h-12 flex-1 rounded-xl bg-sky-500 text-sm font-bold text-white shadow-md">
            ⬇️ تحميل التقرير (TXT)
          </button>
          <button type="button" onClick={() => download('-نسخة-احتياطية')} className="btn-press h-12 flex-1 rounded-xl border-2 border-sky-200 bg-white text-sm font-bold text-sky-700">
            🗂️ تحميل نسخة احتياطية
          </button>
          <button type="button" onClick={onRestart} className="h-12 rounded-xl border-2 border-slate-200 bg-white px-4 text-sm font-bold text-ink-soft">
            🔄 محاولة جديدة
          </button>
        </div>
      </div>

      {/* Per-question breakdown */}
      <div className="mt-5 space-y-4">
        {result.questions.map((qr, qi) => {
          const q = questions[qi]
          return (
            <section key={q.id} className="card overflow-hidden">
              <header className="flex items-center gap-3 border-b border-sky-100 bg-sky-50/60 px-4 py-3">
                <span className="text-2xl">{q.icon}</span>
                <h2 className="flex-1 text-base font-bold sm:text-lg">السؤال {q.number}: {q.title}</h2>
                <span className="rounded-full bg-ink px-3 py-1 text-sm font-bold text-white" dir="ltr">{qr.earned} / {qr.marks}</span>
              </header>
              <div className="divide-y divide-sky-50">
                {qr.subs.map((sr, si) => {
                  const s = q.subs[si]
                  const st = STATUS[sr.status]
                  return (
                    <div key={s.id} className="space-y-2 p-4">
                      <div className="flex items-start gap-2">
                        <span className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-bold ${st.cls}`}>{st.icon} {st.label}</span>
                        <p className="flex-1 text-sm font-bold leading-relaxed"><MathText text={s.prompt} /></p>
                        <span className="shrink-0 text-sm font-bold" dir="ltr">{sr.earned}/{sr.marks}</span>
                      </div>
                      <div className="grid gap-2 text-sm sm:grid-cols-2">
                        <div className="rounded-xl bg-slate-50 p-3">
                          <div className="text-xs font-bold text-ink-soft">إجابتك:</div>
                          <div className="mt-0.5 break-words"><MathText text={sr.studentText} /></div>
                        </div>
                        <div className="rounded-xl bg-mint-100/60 p-3">
                          <div className="text-xs font-bold text-mint-600">الإجابة الصحيحة:</div>
                          <div className="mt-0.5 break-words"><MathText text={sr.correctText} /></div>
                        </div>
                      </div>
                      <div className="rounded-xl border border-sun-300 bg-sun-100/50 p-3 text-sm leading-relaxed">
                        <span className="font-bold text-peach-600">💡 الشرح: </span>
                        <MathText text={s.explanation} />
                      </div>
                      <p className="text-xs text-ink-soft">
                        📖 {s.ref.unit} · {s.ref.lesson} · {s.ref.pages} · المهارة: {s.ref.skill}
                      </p>
                    </div>
                  )
                })}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
