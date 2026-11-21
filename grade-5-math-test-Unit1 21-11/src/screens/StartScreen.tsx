import { useState, type FormEvent } from 'react'
import { Decor, MuteButton } from '../components/Shell'
import { ContactBar } from '../components/ContactBar'
import { QUESTIONS, TOTAL_POINTS } from '../data/index'

interface Props {
  muted: boolean
  onToggleMute: () => void
  onStart: (name: string) => void
}

export function StartScreen({ muted, onToggleMute, onStart }: Props) {
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const clean = name.trim().replace(/\s+/g, ' ')
    if (clean.length < 3) {
      setError('يرجى كتابة الاسم الكامل للطالبة (ثلاثة أحرف على الأقل) قبل بدء الاختبار.')
      return
    }
    setError(null)
    onStart(clean)
  }

  return (
    <div className="page">
      <Decor />
      <header className="topbar">
        <div className="brand">
          <span className="brand-badge" aria-hidden="true">✿</span>
          <div>
            <h1 className="brand-title">اختبار الوحدة الأولى</h1>
            <p className="brand-sub">الرياضيات — الصف الخامس الأساسي</p>
          </div>
        </div>
        <MuteButton muted={muted} onToggle={onToggleMute} />
      </header>

      <main className="container">
        <section className="card hero">
          <h2 className="hero-title">مرحباً بكِ يا بطلتي!</h2>
          <p className="hero-text">
            اختبار شامل يغطي الدروس الثمانية للوحدة الأولى، ويضم <strong>{QUESTIONS.length}</strong> سؤالاً رئيسياً
            مجموع علاماتها <strong>{TOTAL_POINTS}</strong> علامة. ستجدين أنماطاً متنوعة: اختيار، وصح أو خطأ، وكتابة
            الأعداد، وخط الأعداد، والمنقلة، ورسم الأشكال، وقراءة التمثيلات البيانية.
          </p>
          <ul className="rules">
            <li>يبدأ المؤقت فقط بعد الضغط على زر «بدء الاختبار».</li>
            <li>تُحفظ إجاباتك تلقائياً؛ إذا حدّثتِ الصفحة تعود المحاولة نفسها بوقتها.</li>
            <li>أجيبي عن جميع الفروع قبل تسليم الاختبار.</li>
          </ul>
        </section>

        <form className="card start-form" onSubmit={submit} noValidate>
          <label htmlFor="student-name" className="field-label">اسم الطالبة</label>
          <input
            id="student-name"
            className="text-input"
            type="text"
            autoComplete="name"
            placeholder="اكتبي اسمك الكامل"
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-invalid={error !== null}
            aria-describedby={error ? 'name-error' : undefined}
          />
          {error && (
            <p id="name-error" className="form-error" role="alert">
              {error}
            </p>
          )}
          <button type="submit" className="btn btn-primary btn-block">
            بدء الاختبار
          </button>
        </form>
      </main>

      <ContactBar />
    </div>
  )
}
