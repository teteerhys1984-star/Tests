import { useMemo, useState, type FormEvent } from 'react'
import { ContactBar } from '../components/ContactBar'
import { FigureView } from '../components/Figures'
import { RichParagraphs, RichText } from '../components/RichText'
import { LESSONS } from '../data/lessons'
import { QUESTIONS, questionPoints } from '../data/index'
import { summarizeExpected } from '../lib/grading'
import type { LessonId, Question } from '../lib/types'

/** Teacher-only password. This is a visibility screen, not a security boundary (see note on the gate). */
const TEACHER_PASSWORD = 'somer173'

export function TeacherScreen() {
  const [unlocked, setUnlocked] = useState(false)
  const [pw, setPw] = useState('')
  const [wrong, setWrong] = useState(false)

  const tryUnlock = (e: FormEvent) => {
    e.preventDefault()
    if (pw === TEACHER_PASSWORD) {
      setUnlocked(true)
      setWrong(false)
    } else {
      setWrong(true)
    }
  }

  return (
    <div className="page">
      <header className="topbar">
        <div className="brand">
          <span className="brand-badge" aria-hidden="true">✎</span>
          <div className="brand-text">
            <h1 className="brand-title">لوحة المعلم — الإجابات النموذجية</h1>
            <p className="brand-sub">الوحدة الأولى · 30 سؤالاً · 100 علامة</p>
          </div>
        </div>
        <a className="btn btn-ghost btn-small" href="#">
          العودة للاختبار
        </a>
      </header>

      <main className="container">
        {!unlocked ? (
          <form className="card gate" onSubmit={tryUnlock}>
            <h2 className="section-title">منطقة المعلم</h2>
            <p className="fine-print">
              كلمة المرور هنا وسيلة لإخفاء الواجهة عن الطالبة فقط. هي ليست مصادقة أمنية ولا تشفيراً للبيانات.
            </p>
            <label htmlFor="teacher-pw" className="field-label">كلمة المرور</label>
            <input
              id="teacher-pw"
              type="password"
              className="text-input"
              dir="ltr"
              autoComplete="current-password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              aria-invalid={wrong}
            />
            {wrong && (
              <p className="form-error" role="alert">
                كلمة المرور غير صحيحة.
              </p>
            )}
            <button type="submit" className="btn btn-primary btn-block">
              دخول
            </button>
          </form>
        ) : (
          <TeacherContent />
        )}
      </main>

      <ContactBar />
    </div>
  )
}

function TeacherContent() {
  const [lesson, setLesson] = useState<LessonId | 'all'>('all')

  const blueprintRows = useMemo(
    () =>
      LESSONS.map((l) => {
        const qs = QUESTIONS.filter((q) => q.lesson === l.id)
        const points = qs.reduce((s, q) => s + questionPoints(q), 0)
        return {
          lesson: l,
          count: qs.length,
          points: Math.round(points * 100) / 100,
          ok: qs.length === l.blueprint.questions && Math.abs(points - l.blueprint.points) < 1e-9,
        }
      }),
    [],
  )
  const totalCount = QUESTIONS.length
  const totalPoints = Math.round(QUESTIONS.reduce((s, q) => s + questionPoints(q), 0) * 100) / 100

  const visible = QUESTIONS.map((q, i) => ({ q, n: i + 1 })).filter(({ q }) => lesson === 'all' || q.lesson === lesson)

  return (
    <>
      <section className="card">
        <h2 className="section-title">توزيع الأسئلة والعلامات</h2>
        <div className="table-scroll">
          <table className="qtable blueprint">
            <thead>
              <tr>
                <th scope="col">الدرس</th>
                <th scope="col">الصفحات</th>
                <th scope="col">الأسئلة</th>
                <th scope="col">العلامات</th>
                <th scope="col">المطابقة</th>
              </tr>
            </thead>
            <tbody>
              {blueprintRows.map((r) => (
                <tr key={r.lesson.id}>
                  <td>{r.lesson.title}</td>
                  <td>{r.lesson.pages}</td>
                  <td>{r.count}</td>
                  <td>{r.points}</td>
                  <td>{r.ok ? '✓' : '✗'}</td>
                </tr>
              ))}
              <tr className="total-row">
                <td>المجموع</td>
                <td>—</td>
                <td>{totalCount}</td>
                <td>{totalPoints}</td>
                <td>{totalCount === 30 && totalPoints === 100 ? '✓' : '✗'}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <div className="filter-row" role="group" aria-label="تصفية حسب الدرس">
        <button type="button" className={`pill${lesson === 'all' ? ' is-on' : ''}`} onClick={() => setLesson('all')}>
          كل الدروس
        </button>
        {LESSONS.map((l) => (
          <button key={l.id} type="button" className={`pill${lesson === l.id ? ' is-on' : ''}`} onClick={() => setLesson(l.id)}>
            {l.title}
          </button>
        ))}
      </div>

      {visible.map(({ q, n }) => (
        <TeacherQuestion key={q.id} q={q} n={n} />
      ))}
    </>
  )
}

function TeacherQuestion({ q, n }: { q: Question; n: number }) {
  const lessonMeta = LESSONS.find((l) => l.id === q.lesson)
  return (
    <article className="card tcard">
      <header className="tcard-head">
        <span className="qnum">السؤال {n}</span>
        <span className="tag">{lessonMeta?.title}</span>
        <span className="tag">{q.pages}</span>
        <span className="tag tag-style">{q.style}</span>
        <span className="qpts">{questionPoints(q)} علامات</span>
      </header>
      <p className="fine-print">المهارة: {q.skill} · المعرّف: {q.id}</p>
      <RichParagraphs text={q.prompt} className="qprompt" />
      {q.figure && (
        <div className="fig-box fig-small">
          <FigureView spec={q.figure} />
        </div>
      )}
      <ul className="rc-parts">
        {q.parts.map((p, i) => (
          <li key={p.id} className="rc-part">
            <div className="rc-part-head">
              <span>{p.label ? `الفرع ${p.label}` : `الفرع ${i + 1}`}</span>
              <span className="rc-part-score">{p.points} علامة</span>
            </div>
            <div className="rc-line rc-correct">
              <strong>الإجابة:</strong> <RichText text={summarizeExpected(p.input)} />
            </div>
          </li>
        ))}
      </ul>
      <div className="rc-answer">
        <strong>الحل النموذجي:</strong> <RichText text={q.solution.answer} />
      </div>
      <div className="rc-steps">
        <strong>خطوات الحل:</strong>
        <ol>
          {q.solution.steps.map((s, i) => (
            <li key={i}>
              <RichText text={s} />
            </li>
          ))}
        </ol>
      </div>
      <div className="rc-why">
        <strong>الشرح / الخطأ الشائع:</strong> <RichText text={q.solution.why} />
      </div>
    </article>
  )
}
