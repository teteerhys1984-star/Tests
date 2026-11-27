import type { AnswerValue, SubQuestion } from '../exam/types'
import { MathText, Tex } from './MathText'
import { NumberInput } from './NumberInput'
import { AngleNameFigure, ParallelogramFigure, ShapesFigure } from './Geometry'
import { texNumber } from '../exam/numbers'

interface Props {
  sub: SubQuestion
  index: number
  value: AnswerValue | undefined
  onChange: (v: AnswerValue) => void
  complete: boolean
}

const rec = (v: AnswerValue | undefined): Record<string, string> => (v && typeof v === 'object' && !Array.isArray(v) ? v : {})
const arr = (v: AnswerValue | undefined): string[] => (Array.isArray(v) ? v : [])
const str = (v: AnswerValue | undefined): string => (typeof v === 'string' ? v : '')

const AR_LETTERS = ['أ', 'ب', 'ج', 'د', 'هـ', 'و', 'ز', 'ح']

function ChoiceButton({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`btn-press flex min-h-12 w-full items-center gap-3 rounded-2xl border-2 px-4 py-3 text-right text-base transition ${
        selected ? 'border-sky-500 bg-sky-50 shadow-md' : 'border-slate-200 bg-white hover:border-sky-300'
      }`}
    >
      <span
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${selected ? 'border-sky-500 bg-sky-500' : 'border-slate-300'}`}
      >
        {selected && <span className="h-2.5 w-2.5 rounded-full bg-white" />}
      </span>
      <span className="leading-relaxed">{children}</span>
    </button>
  )
}

export function SubQuestionView({ sub, index, value, onChange, complete }: Props) {
  return (
    <section className="rounded-2xl border border-sky-100 bg-white/80 p-4 sm:p-5" aria-labelledby={`${sub.id}-title`}>
      <header className="mb-3 flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-500 text-base font-bold text-white">
          {AR_LETTERS[index]}
        </span>
        <h3 id={`${sub.id}-title`} className="flex-1 text-base font-bold leading-relaxed text-ink sm:text-lg">
          <MathText text={sub.prompt} />
        </h3>
        <span className="shrink-0 rounded-full bg-sun-100 px-2.5 py-1 text-xs font-bold text-peach-600">
          {sub.marks} {sub.marks === 1 ? 'درجة' : sub.marks === 2 ? 'درجتان' : 'درجات'}
        </span>
      </header>
      <div className="ps-0 sm:ps-12">
        <Body sub={sub} value={value} onChange={onChange} />
        {!complete && <p className="mt-3 text-xs font-medium text-peach-600">⚠️ هذا الفرع لم يُستكمل بعد.</p>}
      </div>
    </section>
  )
}

function Body({ sub, value, onChange }: { sub: SubQuestion; value: AnswerValue | undefined; onChange: (v: AnswerValue) => void }) {
  switch (sub.type) {
    case 'mcq':
      return (
        <div>
          {sub.figure === 'angle-name' && <div className="mb-3"><AngleNameFigure /></div>}
          {sub.figure === 'shapes' && <div className="mb-3"><ShapesFigure /></div>}
          <div className="grid gap-2.5 sm:grid-cols-2">
            {sub.options.map((o) => (
              <ChoiceButton key={o.id} selected={str(value) === o.id} onClick={() => onChange(o.id)}>
                <MathText text={o.label} />
              </ChoiceButton>
            ))}
          </div>
        </div>
      )

    case 'numeric': {
      const r = rec(value)
      return (
        <div className="space-y-3">
          <NumberInput id={sub.id} value={r.value ?? ''} onChange={(v) => onChange({ ...r, value: v })} label="الإجابة:" unit={sub.unit} />
          {sub.working && (
            <div>
              <label htmlFor={`${sub.id}-w`} className="mb-1 block text-sm font-medium text-ink-soft">
                خطوات الحل (اختياري – قد تمنحك درجات جزئية):
              </label>
              <textarea
                id={`${sub.id}-w`}
                value={r.working ?? ''}
                onChange={(e) => onChange({ ...r, working: e.target.value })}
                rows={3}
                dir="auto"
                className="w-full rounded-xl border-2 border-sky-100 bg-white p-3 text-base outline-none focus:border-sky-400"
                placeholder="اكتب هنا كيف وصلت إلى الإجابة..."
              />
            </div>
          )}
        </div>
      )
    }

    case 'pair': {
      const r = rec(value)
      return (
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-3" dir="ltr">
          <span className="text-2xl font-bold text-ink">(</span>
          <div className="flex flex-col items-center">
            <span className="text-xs font-bold text-sky-700">x (أفقي)</span>
            <NumberInput small id={`${sub.id}-x`} value={r.x ?? ''} onChange={(v) => onChange({ ...r, x: v })} />
          </div>
          <span className="text-2xl font-bold text-ink">,</span>
          <div className="flex flex-col items-center">
            <span className="text-xs font-bold text-turq-600">y (رأسي)</span>
            <NumberInput small id={`${sub.id}-y`} value={r.y ?? ''} onChange={(v) => onChange({ ...r, y: v })} />
          </div>
          <span className="text-2xl font-bold text-ink">)</span>
        </div>
      )
    }

    case 'plot': {
      const r = rec(value)
      return (
        <p className="rounded-xl bg-turq-100 p-3 text-sm font-medium text-turq-600">
          {r.x !== undefined && r.y !== undefined ? (
            <>
              ✅ عيّنت النقطة عند <Tex tex={`(${r.x}, ${r.y})`} />. يمكنك النقر على موقع آخر لتغييرها.
            </>
          ) : (
            'انقر على الشبكة في الأعلى لتعيين النقطة.'
          )}
        </p>
      )
    }

    case 'tf': {
      const r = rec(value)
      return (
        <div className="space-y-3">
          <p className="rounded-xl bg-sun-100 p-3 text-base font-bold leading-relaxed">
            <MathText text={sub.statement} />
          </p>
          <div className="grid grid-cols-2 gap-2.5">
            <ChoiceButton selected={r.value === 'true'} onClick={() => onChange({ value: 'true' })}>
              ✔️ صحيحة
            </ChoiceButton>
            <ChoiceButton selected={r.value === 'false'} onClick={() => onChange({ ...r, value: 'false' })}>
              ✖️ خاطئة
            </ChoiceButton>
          </div>
          {r.value === 'false' && (
            <div className="animate-pop space-y-2 rounded-xl border-2 border-dashed border-peach-400 p-3">
              <p className="text-sm font-bold text-peach-600">اختر التصحيح المناسب:</p>
              {sub.correction.options.map((o) => (
                <ChoiceButton key={o.id} selected={r.fix === o.id} onClick={() => onChange({ ...r, fix: o.id })}>
                  <MathText text={o.label} />
                </ChoiceButton>
              ))}
            </div>
          )}
        </div>
      )
    }

    case 'match': {
      const r = rec(value)
      return (
        <div className="space-y-2.5">
          {sub.left.map((l) => (
            <div key={l.id} className="flex flex-wrap items-center gap-2 rounded-xl bg-sky-50 p-2.5">
              <span className="min-w-[5rem] flex-1 text-base font-bold">
                <MathText text={l.label} />
              </span>
              <span className="text-sky-500">←</span>
              <div className="flex flex-wrap gap-1.5">
                {sub.right.map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    aria-pressed={r[l.id] === o.id}
                    onClick={() => onChange({ ...r, [l.id]: o.id })}
                    className={`min-h-10 rounded-xl border-2 px-3 py-1.5 text-sm font-bold transition ${
                      r[l.id] === o.id ? 'border-turq-500 bg-turq-500 text-white' : 'border-slate-200 bg-white'
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )
    }

    case 'order': {
      const chosen = arr(value)
      const remaining = sub.items.filter((i) => !chosen.includes(i.id))
      return (
        <div className="space-y-3">
          <p className="text-sm text-ink-soft">انقر على الأعداد بالترتيب المطلوب؛ وسيظهر ترتيبك في الأسفل.</p>
          <div className="flex flex-wrap gap-2" dir="ltr">
            {remaining.map((i) => (
              <button
                key={i.id}
                type="button"
                onClick={() => onChange([...chosen, i.id])}
                className="btn-press min-h-12 rounded-xl border-2 border-sun-300 bg-sun-100 px-4 text-lg font-bold text-ink"
              >
                <Tex tex={texNumber(i.value)} />
              </button>
            ))}
            {remaining.length === 0 && <span className="text-sm text-mint-600">✅ رتّبت جميع الأعداد.</span>}
          </div>
          <div className="flex min-h-14 flex-wrap items-center gap-2 rounded-xl border-2 border-dashed border-turq-400 bg-turq-100/40 p-2" dir="ltr">
            {chosen.length === 0 && <span className="text-sm text-ink-soft" dir="rtl">الترتيب يظهر هنا</span>}
            {chosen.map((id, idx) => {
              const it = sub.items.find((i) => i.id === id)!
              return (
                <span key={id} className="flex items-center gap-1">
                  <span className="rounded-xl bg-turq-500 px-3 py-2 text-lg font-bold text-white">
                    <Tex tex={texNumber(it.value)} />
                  </span>
                  {idx < chosen.length - 1 && <span className="font-bold text-turq-600">{sub.direction === 'asc' ? '<' : '>'}</span>}
                </span>
              )
            })}
            {chosen.length > 0 && (
              <button type="button" onClick={() => onChange([])} className="ms-auto min-h-10 rounded-lg bg-white px-3 text-sm font-bold text-red-500" dir="rtl">
                إعادة الترتيب
              </button>
            )}
          </div>
        </div>
      )
    }

    case 'compare': {
      const r = rec(value)
      return (
        <div className="space-y-2.5">
          {sub.pairs.map((p) => (
            <div key={p.id} className="flex flex-wrap items-center justify-center gap-2 rounded-xl bg-sky-50 p-2.5" dir="ltr">
              <span className="text-lg font-bold">
                <Tex tex={texNumber(p.a)} />
              </span>
              <div className="flex gap-1.5">
                {(['<', '=', '>'] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    aria-pressed={r[p.id] === s}
                    onClick={() => onChange({ ...r, [p.id]: s })}
                    className={`h-11 w-11 rounded-xl border-2 text-xl font-bold transition ${
                      r[p.id] === s ? 'border-peach-500 bg-peach-500 text-white' : 'border-slate-200 bg-white'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <span className="text-lg font-bold">
                <Tex tex={texNumber(p.b)} />
              </span>
            </div>
          ))}
        </div>
      )
    }

    case 'cells': {
      const r = rec(value)
      return (
        <div className="space-y-3">
          {sub.id === 'q6d' && <ParallelogramFigure />}
          {sub.prefix && (
            <div className="scroll-x rounded-xl bg-sun-100 p-3 text-center">
              <Tex tex={sub.prefix} display />
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            {sub.cells.map((c) => (
              <div key={c.id} className="rounded-xl bg-sky-50 p-3">
                <NumberInput id={`${sub.id}-${c.id}`} label={c.label} value={r[c.id] ?? ''} onChange={(v) => onChange({ ...r, [c.id]: v })} />
              </div>
            ))}
          </div>
        </div>
      )
    }
  }
}
