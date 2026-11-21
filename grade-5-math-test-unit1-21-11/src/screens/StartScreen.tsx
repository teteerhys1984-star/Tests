import { useState, type FormEvent } from 'react'
import { Decor, MuteButton } from '../components/Shell'
import { ContactBar } from '../components/ContactBar'
import { QUESTIONS, TOTAL_POINTS } from '../data/index'
import { PART_COUNT } from '../data/stats'

interface Props {
  titleAr: string
  titleEn: string
  muted: boolean
  onToggleMute: () => void
  pending: number
  onStart: (name: string) => void
}

export function StartScreen({ titleAr, titleEn, muted, onToggleMute, pending, onStart }: Props) {
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const clean = name.trim().replace(/\s+/g, ' ')
    if (clean.length < 3) {
      setError('يرجى كتابة الاسم الكامل للطالب/ة (ثلاثة أحرف على الأقل) قبل بدء الاختبار.')
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
            <h1 className="brand-title">{titleAr}</h1>
            <p className="brand-sub">الرياضيات — الصف الخامس الأساسي — الفصل الأول</p>
          </div>
        </div>
        <MuteButton muted={muted} onToggle={onToggleMute} />
      </header>

      <main className="container">
        <section className="card hero">
          <h2 className="hero-title">مرحباً بك!</h2>
          <p className="hero-sub">{titleEn}</p>
          <p className="hero-text">
            اختبار شامل يغطي دروس الوحدة الأولى الثمانية، ويضم <strong>{QUESTIONS.length}</strong> سؤالاً
            رئيسياً و<strong>{PART_COUNT}</strong> فرعاً مقوَّماً، مجموع علاماتها <strong>{TOTAL_POINTS}</strong>{' '}
            علامة. ستجد أنماطاً متنوعة: اختيار من متعدد، وصح أو خطأ، وكتابة الأعداد، والصيغة الموسّعة،
            وخط الأعداد، والمنقلة، ورسم الزوايا، وقراءة التمثيلات البيانية، وأشكال متوازي الأضلاع والمعيّن.
          </p>
          <ul className="rules">
            <li>يبدأ المؤقت فقط بعد الضغط على زر «بدء الاختبار».</li>
            <li>لا توجد مدة محددة في المصدر، فلا يوجد عدّ تنازلي ولا إغلاق تلقائي.</li>
            <li>تُحفظ إجاباتك تلقائياً؛ إذا حدّثت الصفحة تعود المحاولة نفسها بوقتها وإجاباتها.</li>
            <li>يمكنك الانتقال بين الأسئلة بحرّية، ثم مراجعة إجاباتك قبل التسليم.</li>
            <li>لا تُعرض الإجابات الصحيحة أثناء الحل؛ تظهر بعد التسليم فقط.</li>
          </ul>
          {pending > 0 && (
            <p className="notice">
              محاولة سابقة لم تُؤكَّد إرسالها إلى المعلّم محفوظة على هذا الجهاز، وسيُعاد إرسالها
              تلقائياً عند فتح الاختبار ({pending}).
            </p>
          )}
        </section>

        <form className="card start-form" onSubmit={submit} noValidate>
          <label htmlFor="student-name" className="field-label">اسم الطالب/ة</label>
          <input
            id="student-name"
            className="text-input"
            type="text"
            autoComplete="name"
            placeholder="اكتب الاسم الكامل"
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-invalid={error !== null}
            aria-describedby={error ? 'name-error' : undefined}
          />
          {error && (
            <p id="name-error" className="form-error" role="alert">{error}</p>
          )}
          <button type="submit" className="btn btn-primary btn-block">بدء الاختبار</button>
        </form>
      </main>

      <ContactBar />
    </div>
  )
}
