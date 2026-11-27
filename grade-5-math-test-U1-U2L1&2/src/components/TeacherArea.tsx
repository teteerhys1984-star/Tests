import { useState } from 'react'
import { QUESTIONS, TOTAL_MARKS } from '../exam/questions'
import { correctAnswerText } from '../exam/grading'
import { MathText } from './MathText'

const TEACHER_PASSWORD = 'somer173'

export function TeacherArea({ onClose }: { onClose: () => void }) {
  const [pw, setPw] = useState('')
  const [ok, setOk] = useState(false)
  const [err, setErr] = useState(false)

  const tryLogin = () => {
    if (pw === TEACHER_PASSWORD) {
      setOk(true)
      setErr(false)
    } else setErr(true)
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-3 py-5 sm:px-4">
      <div className="card p-5 sm:p-7">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h1 className="text-xl font-bold">🔑 منطقة المعلم – مفتاح الإجابات</h1>
          <button type="button" onClick={onClose} className="h-10 rounded-xl border-2 border-slate-200 px-3 text-sm font-bold">
            العودة
          </button>
        </div>

        {!ok ? (
          <div className="space-y-3">
            <p className="text-sm text-ink-soft">أدخل كلمة المرور للاطلاع على مفتاح الإجابات ومعايير التصحيح.</p>
            <p className="rounded-xl bg-sun-100 p-3 text-xs leading-relaxed text-peach-600">
              تنبيه: هذه البوابة حماية بسيطة من جهة المتصفح فقط (client-side) لمنع وصول الطلاب العرضي، وليست مصادقة حقيقية ولا تشفيراً.
            </p>
            <div className="flex gap-2">
              <input
                type="password"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && tryLogin()}
                placeholder="كلمة المرور"
                dir="ltr"
                className="h-12 flex-1 rounded-xl border-2 border-sky-100 px-3 text-base outline-none focus:border-sky-400"
              />
              <button type="button" onClick={tryLogin} className="h-12 rounded-xl bg-sky-500 px-5 font-bold text-white">
                دخول
              </button>
            </div>
            {err && <p className="text-sm font-bold text-red-500">كلمة المرور غير صحيحة.</p>}
          </div>
        ) : (
          <div className="space-y-5">
            <div className="rounded-2xl bg-sky-50 p-4 text-sm leading-relaxed">
              <p className="font-bold">معلومات عامة</p>
              <ul className="mt-1 list-inside list-disc space-y-1 text-ink-soft">
                <li>المجموع الكلي: {TOTAL_MARKS} درجة موزّعة على {QUESTIONS.length} أسئلة رئيسية.</li>
                <li>التغطية: الوحدة الأولى (الدروس 1–8، ص 3–39) والوحدة الثانية (الدرسان 9 و10 فقط، ص 44–50).</li>
                <li>قواعد الدرجات الجزئية: الفروع متعددة الخلايا تُصحَّح خلية بخلية؛ الفروع الحسابية ذات «خطوات الحل» تمنح درجة جزئية إذا احتوت الخطوات على ناتج وسيط صحيح؛ الترتيب المعاكس يمنح نصف الدرجة.</li>
                <li>الإحداثيات: يُشترط أن يكون العدد الأول أفقياً (x) والثاني رأسياً (y)؛ الأزواج المعكوسة لا تُمنح درجات.</li>
              </ul>
            </div>

            {QUESTIONS.map((q) => (
              <section key={q.id} className="rounded-2xl border border-sky-100">
                <header className="flex items-center gap-2 rounded-t-2xl bg-sky-50 px-4 py-3">
                  <span className="text-xl">{q.icon}</span>
                  <h2 className="flex-1 font-bold">السؤال {q.number}: {q.title}</h2>
                  <span className="rounded-full bg-ink px-2.5 py-0.5 text-xs font-bold text-white">{q.marks} درجة</span>
                </header>
                <div className="divide-y divide-sky-50">
                  {q.subs.map((s, i) => (
                    <div key={s.id} className="space-y-1.5 p-4 text-sm">
                      <p className="font-bold">
                        ({i + 1}) <MathText text={s.prompt} /> <span className="text-xs text-peach-600">[{s.marks} درجة]</span>
                      </p>
                      <p><span className="font-bold text-mint-600">الإجابة الصحيحة:</span> <MathText text={correctAnswerText(s)} /></p>
                      <p><span className="font-bold text-sky-700">الحل التفصيلي:</span> <MathText text={s.explanation} /></p>
                      <p><span className="font-bold text-peach-600">معايير التصحيح:</span> {s.marking ?? `الدرجة كاملة (${s.marks}) للإجابة الصحيحة، وصفر لغير ذلك.`}</p>
                      <p className="text-xs text-ink-soft">📖 {s.ref.unit} · {s.ref.lesson} · {s.ref.pages} · المهارة: {s.ref.skill}</p>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
