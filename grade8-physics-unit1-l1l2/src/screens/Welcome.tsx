import { useState } from 'react'
import { GlyphField, HeroMotif } from '../components/Chrome'
import { LESSONS, TOTAL_MARKS } from '../exam/types'
import { num } from '../lib/time'
import { QUESTIONS, SUBPART_COUNT } from '../exam/questions'

export function Welcome({ onStart }: { onStart: (name: string) => void }) {
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const trimmed = name.trim()

  const go = () => {
    if (trimmed.length < 3) {
      setError('اكتب اسمك الكامل (ثلاثة أحرف على الأقل) لبدء الاختبار.')
      return
    }
    setError('')
    onStart(trimmed)
  }

  const stats = [
    { k: num(QUESTIONS.length), v: 'أسئلة رئيسية' },
    { k: num(SUBPART_COUNT), v: 'فروع مُقوّمة' },
    { k: '2', v: 'درسان (الوحدة الأولى)' },
    { k: num(TOTAL_MARKS), v: 'علامة' },
  ]

  return (
    <div className="relative z-10 mx-auto max-w-6xl px-4 pb-4 pt-6 sm:pt-10">
      <GlyphField />

      {/* ===== اللوحة العلوية ===== */}
      <div className="relative overflow-hidden rounded-[var(--r-lg)] shadow-[var(--sh-3)]"
        style={{ background: 'linear-gradient(135deg,#0e2f3a 0%,#164a59 48%,#0f766e 100%)' }}>
        <div className="absolute inset-0 opacity-[0.13]" aria-hidden
          style={{
            backgroundImage:
              'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)',
            backgroundSize: '30px 30px',
          }} />
        <div className="relative grid gap-6 p-5 sm:p-8 lg:grid-cols-[1.15fr_1fr] lg:gap-10 lg:p-10">
          <div className="text-[#f4ecd8]">
            <p className="kicker" style={{ color: '#ffd97a' }}>الوحدة الأولى · الحركة والقوى · الصف الثامن</p>
            <h1 className="display mt-2 text-[clamp(1.85rem,5.4vw,3.1rem)] leading-[1.18]" style={{ color: '#fff8e8' }}>
              اختبار الفيزياء
              <span className="mt-1 block text-[clamp(1.05rem,2.8vw,1.5rem)] font-normal opacity-85">
                الدرس الأول والدرس الثاني — القوى المتلاقية والقوى المتوازية
              </span>
            </h1>

            <p className="mt-4 max-w-xl text-[0.98rem] leading-relaxed opacity-90">
              اختبار إلكتروني تفاعلي يقيس أهداف الدرسين الأول والثاني من الوحدة الأولى فقط:
              القوة كمية متجهة، والقوى المتلاقية وقاعدة متوازي الأضلاع ومحصلة القوتين المتعامدتين،
              وتحليل القوة إلى مركّبتين والمستوى المائل، والقوى المتوازية ومحصّلتها في حالتي
              الجهة الواحدة والجهتين المتعاكستين. التصحيح تلقائي بالكامل داخل المتصفح.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {stats.map((s) => (
                <div key={s.v} className="rounded-[var(--r-md)] border p-3 text-center transition-transform duration-300 hover:-translate-y-1"
                  style={{ borderColor: 'rgba(255,248,232,0.24)', background: 'rgba(255,248,232,0.07)' }}>
                  <div className="display tnum text-[clamp(1.5rem,4vw,2.1rem)] leading-none" style={{ color: '#ffd97a' }}>{s.k}</div>
                  <div className="mt-1 text-[0.78rem] opacity-85">{s.v}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="w-full max-w-[420px] rounded-[var(--r-md)] p-3"
              style={{ background: 'rgba(14,47,58,0.42)', border: '1px solid rgba(255,248,232,0.18)' }}>
              <HeroMotif />
            </div>
          </div>
        </div>
      </div>

      {/* ===== نطاق الاختبار + بطاقة البدء ===== */}
      <div className="mt-6 grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <section className="card p-4 sm:p-6">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <p className="kicker">نطاق الاختبار</p>
              <h2 className="display text-2xl sm:text-[1.7rem]" style={{ color: 'var(--navy)' }}>
                الدرسان المشمولان فقط
              </h2>
            </div>
            <span className="badge badge-gold shrink-0">ص 55 – 70</span>
          </div>
          <ol className="grid gap-2">
            {LESSONS.map((l) => (
              <li key={l.id}
                className="group flex items-start gap-3 rounded-[var(--r-sm)] border p-2.5 transition-all duration-300 hover:-translate-y-0.5"
                style={{ borderColor: 'var(--line-soft)', background: 'var(--surface-2)' }}>
                <span className="display tnum grid h-8 w-8 shrink-0 place-items-center rounded-[var(--r-sm)] text-base"
                  style={{ background: 'var(--navy)', color: '#ffd97a' }}>
                  {num(l.num)}
                </span>
                <span className="min-w-0">
                  <span className="block text-[0.95rem] font-bold" style={{ color: 'var(--ink-1)' }}>{l.title}</span>
                  <span className="block text-[0.76rem]" style={{ color: 'var(--ink-3)' }}>{l.pages}</span>
                  <span className="mt-1 block text-[0.8rem] leading-relaxed" style={{ color: 'var(--ink-2)' }}>
                    {l.objectives[0]}
                  </span>
                </span>
              </li>
            ))}
          </ol>
          <p className="mt-3 rounded-[var(--r-sm)] border p-2.5 text-[0.83rem] leading-relaxed"
            style={{ borderColor: '#e3d9c5', background: '#fffdf6', color: 'var(--ink-2)' }}>
            <strong>لا أسئلة من خارج الدرسين:</strong> لا تُشمَل أسئلة الوحدة (ص 71 – 72) ولا أي درس من
            الوحدة الثانية، وكل سؤال مبنيّ على نصوص الدرسين وتعريفاتهما وأمثلتهما وتدريباتهما.
          </p>
        </section>

        <section className="card card-lift overflow-hidden p-4 sm:p-6" style={{ borderColor: '#cdbfa4' }}>
          <p className="kicker">ابدأ الاختبار</p>
          <h2 className="display mt-1 text-[1.6rem] leading-snug" style={{ color: 'var(--navy)' }}>
            اكتب اسمك ثم اضغط «بدء الاختبار»
          </h2>

          <div className="mt-4">
            <label htmlFor="student-name" className="mb-1.5 block text-sm font-bold" style={{ color: 'var(--ink-2)' }}>
              اسم الطالب / الطالبة <span style={{ color: 'var(--clay)' }}>*</span>
            </label>
            <input
              id="student-name" className="field" value={name} autoComplete="name"
              placeholder="مثال: سارة أحمد" onChange={(e) => { setName(e.target.value); setError('') }}
              onKeyDown={(e) => { if (e.key === 'Enter') go() }}
              aria-required="true" aria-invalid={!!error} aria-describedby="student-name-note"
            />
            {error && (
              <p role="alert" className="mt-2 flex items-start gap-1.5 text-sm font-semibold" style={{ color: 'var(--err)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
                  <circle cx="12" cy="12" r="10" /><path d="M12 8v5M12 16.5v.5" />
                </svg>
                {error}
              </p>
            )}
            <p id="student-name-note" className="mt-2 text-[0.85rem]" style={{ color: 'var(--ink-2)' }}>
              سيتم إرسال نتيجتك وإجاباتك وتقرير نتيجتك إلى معلّمك عند التسليم.
            </p>
          </div>

          <button type="button" className="btn btn-gold mt-4 w-full text-[1.05rem]" onClick={go} disabled={trimmed.length < 3}>
            بدء الاختبار
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden>
              <path d="M19 12H5M11 18l-6-6 6-6" />
            </svg>
          </button>

          <ul className="mt-4 grid gap-1.5 text-[0.85rem]" style={{ color: 'var(--ink-2)' }}>
            {[
              'لا يوجد عدّ تنازلي — المؤقّت يعدّ زمن الحلّ فقط.',
              'لا تظهر تلميحات ولا تصحيح أثناء الاختبار؛ الحلول بعد التسليم.',
              'يمكنك مراجعة إجاباتك وتعديلها في صفحة «مراجعة الإجابات» قبل التسليم.',
              'بمجرد الضغط على التسليم يُنزَّل تقرير النتيجة TXT تلقائياً كنسخة احتياطية.',
            ].map((t) => (
              <li key={t} className="flex items-start gap-2">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--teal)" strokeWidth="3" className="mt-1 shrink-0" aria-hidden>
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                <span>{t}</span>
              </li>
            ))}
          </ul>

          <div className="mt-4 rounded-[var(--r-sm)] p-3" style={{ background: 'var(--gold-soft)' }}>
            <p className="text-[0.82rem] leading-relaxed" style={{ color: 'var(--gold-deep)' }}>
              المجموع الكلي <strong className="tnum">{num(TOTAL_MARKS)}</strong> علامة موزّعة على{' '}
              <strong className="tnum">{num(QUESTIONS.length)}</strong> أسئلة رئيسية و
              <strong className="tnum"> {num(SUBPART_COUNT)}</strong> فرعاً، مع علامات جزئية للفروع المترابطة.
            </p>
          </div>
        </section>
      </div>

      {/* ===== الخصوصية والأنماط ===== */}
      <section className="card mt-5 p-4 sm:p-5" id="privacy">
        <h2 className="display mb-2 text-xl" style={{ color: 'var(--navy)' }}>قبل أن تبدأ: كيف يُصحَّح الاختبار وكيف تُعالَج بياناتك؟</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            {
              t: 'التصحيح والتقرير',
              d: 'يُصحَّح الاختبار تلقائياً داخل متصفحك بعد الضغط على «تسليم الاختبار»، ويُنشَأ تقرير TXT كامل بكل سؤال وفرع وحلّ، ويُنزَّل على جهازك فوراً كنسخة احتياطية.',
            },
            {
              t: 'أنماط الأسئلة',
              d: 'اختيار من متعدد، اختيار متعدد العبارات، صواب/خطأ مع التصويب، إجابات عددية بالوحدة، تعليل بكلمات مفتاحية، مطابقة، وترتيب خطوات.',
            },
            {
              t: 'الخصوصية والإرسال',
              d: 'عند التسليم تُرسَل نتيجتك واسمك وإجاباتك ونصّ تقرير نتيجتك إلى معلّمك عبر خدمة Google Sheets المرتبطة بالاختبار، ويحتاج ذلك إلى اتصال بالإنترنت. لا يُرسَل شيء قبل ضغطك على «تسليم الاختبار».',
            },
          ].map((b) => (
            <div key={b.t}>
              <h3 className="mb-1 flex items-center gap-2 text-[0.98rem] font-extrabold" style={{ color: 'var(--navy)' }}>
                <span className="inline-block h-2.5 w-2.5 rotate-45" style={{ background: 'var(--gold)' }} aria-hidden />
                {b.t}
              </h3>
              <p className="text-[0.86rem] leading-relaxed" style={{ color: 'var(--ink-2)' }}>{b.d}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
