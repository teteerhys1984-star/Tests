import { useState } from 'react'
import { QUESTIONS, TOTAL_MARKS } from '../exam/questions'

interface Props {
  onStart: (name: string) => void
  muted: boolean
  onToggleMute: () => void
}

export function StartScreen({ onStart, muted, onToggleMute }: Props) {
  const [name, setName] = useState('')
  const [touched, setTouched] = useState(false)
  const valid = name.trim().length >= 2

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6 sm:py-10">
      <div className="card overflow-hidden">
        <div className="relative bg-gradient-to-l from-sky-500 via-turq-500 to-mint-500 px-5 py-8 text-white sm:px-8">
          <div className="absolute -left-6 -top-6 h-28 w-28 rounded-full bg-white/15" />
          <div className="absolute -bottom-10 right-10 h-32 w-32 rotate-12 rounded-3xl bg-white/10" />
          <div className="relative flex items-center gap-4">
            <div className="animate-float flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/90 text-4xl shadow-lg">🧮</div>
            <div>
              <h1 className="text-2xl font-bold sm:text-3xl">اختبار الرياضيات – الصف الخامس</h1>
              <p className="mt-1 text-sm text-white/90 sm:text-base">الوحدة الأولى كاملة + الدرسان الأول والثاني من الوحدة الثانية</p>
            </div>
          </div>
        </div>

        <div className="space-y-6 p-5 sm:p-8">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-2xl bg-sky-50 p-3">
              <div className="text-2xl font-bold text-sky-600">{QUESTIONS.length}</div>
              <div className="text-xs font-medium text-ink-soft">أسئلة رئيسية</div>
            </div>
            <div className="rounded-2xl bg-mint-100 p-3">
              <div className="text-2xl font-bold text-mint-600">{TOTAL_MARKS}</div>
              <div className="text-xs font-medium text-ink-soft">درجة</div>
            </div>
            <div className="rounded-2xl bg-sun-100 p-3">
              <div className="text-2xl font-bold text-peach-600">⏱️</div>
              <div className="text-xs font-medium text-ink-soft">مؤقّت تصاعدي</div>
            </div>
          </div>

          <div className="rounded-2xl border-2 border-sky-100 bg-sky-50/60 p-4">
            <h2 className="mb-2 text-base font-bold">تعليمات مهمة:</h2>
            <ul className="list-inside list-disc space-y-1.5 text-sm leading-relaxed text-ink-soft">
              <li>اقرأ كل سؤال بتمعّن، وأجب عن جميع الفروع قبل التسليم.</li>
              <li>تُحفظ إجاباتك تلقائياً، ويمكنك التنقل بين الأسئلة بحرية.</li>
              <li>في الزوج المرتّب <span className="math-ltr font-bold" dir="ltr">(x, y)</span> العدد الأول أفقي والثاني رأسي.</li>
              <li>لن تظهر الإجابات الصحيحة ولا الدرجات إلا بعد التسليم.</li>
              <li>يبدأ المؤقّت عند الضغط على زر «ابدأ الاختبار».</li>
            </ul>
          </div>

          <div>
            <label htmlFor="student-name" className="mb-1.5 block text-base font-bold">
              اسم الطالب <span className="text-red-500">*</span>
            </label>
            <input
              id="student-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => setTouched(true)}
              placeholder="اكتب اسمك الكامل هنا"
              autoComplete="name"
              className="h-14 w-full rounded-2xl border-2 border-sky-100 bg-white px-4 text-lg outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
            />
            {touched && !valid && <p className="mt-1.5 text-sm font-medium text-red-500">الرجاء كتابة اسمك قبل البدء (حرفان على الأقل).</p>}
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={onToggleMute}
              className="flex h-12 items-center justify-center gap-2 rounded-2xl border-2 border-slate-200 bg-white px-4 text-sm font-bold text-ink-soft"
              aria-pressed={muted}
            >
              {muted ? '🔇 الصوت مكتوم' : '🔊 الصوت مفعّل'}
            </button>
            <button
              type="button"
              disabled={!valid}
              onClick={() => onStart(name.trim())}
              className="btn-press h-14 flex-1 rounded-2xl bg-gradient-to-l from-peach-500 to-sun-500 text-lg font-bold text-white shadow-lg shadow-peach-500/30 transition disabled:cursor-not-allowed disabled:opacity-40"
            >
              🚀 ابدأ الاختبار
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
