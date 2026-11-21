import { useMemo, useState, type FormEvent } from 'react'
import { EXAM_TITLE, EXAM_TITLE_AR } from '../config'
import { ContactBar } from '../components/ContactBar'
import { FigureView } from '../components/Figures'
import { RichParagraphs, RichText } from '../components/RichText'
import { LESSONS } from '../data/lessons'
import { QUESTIONS, TOTAL_POINTS, questionPoints } from '../data/index'
import { summarizeExpected } from '../lib/grading'
import type { LessonId, Question } from '../lib/types'

/**
 * كلمة مرور بوابة المعلم — بوابة واجهة أمامية تجميلية فقط.
 * ليست مصادقة أمنية ولا تشفيراً: الكود منشور مع الصفحة، ومن يعرف الرابط
 * يستطيع قراءته. الغرض منها منع الطالب من رؤية الإجابات بالخطأ فقط.
 * (كلمة المرور المرجعية للمنصة: somer173)
 */
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
            <p className="brand-sub">{EXAM_TITLE_AR} · {QUESTIONS.length} سؤالاً · {TOTAL_POINTS} علامة</p>
          </div>
        </div>
        <a className="btn btn-ghost btn-small" href="#">العودة للاختبار</a>
      </header>

      <main className="container">
        {!unlocked ? (
          <form className="card gate" onSubmit={tryUnlock}>
            <h2 className="section-title">منطقة المعلم</h2>
            <p className="fine-print">
              كلمة المرور هنا وسيلة لإخفاء الواجهة عن الطالب فقط. <strong>هي ليست حماية أمنية حقيقية</strong>{' '}
              ولا تشفيراً للبيانات، والكود منشور مع الصفحة. الغرض منها منع الاطّلاع العَرَضي على
              الإجابات النموذجية.
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
            {wrong && <p className="form-error" role="alert">كلمة المرور غير صحيحة.</p>}
            <button type="submit" className="btn btn-primary btn-block">دخول</button>
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

  const rows = useMemo(
    () =>
      LESSONS.map((l) => {
        const qs = QUESTIONS.filter((q) => q.lesson === l.id)
        const points = Math.round(qs.reduce((s, q) => s + questionPoints(q), 0) * 100) / 100
        const parts = qs.reduce((s, q) => s + q.parts.length, 0)
        return {
          lesson: l,
          count: qs.length,
          parts,
          points,
          ok:
            qs.length === l.blueprint.questions &&
            Math.abs(points - l.blueprint.points) < 1e-9,
        }
      }),
    [],
  )
  const partsTotal = QUESTIONS.reduce((s, q) => s + q.parts.length, 0)
  const totalPoints = Math.round(QUESTIONS.reduce((s, q) => s + questionPoints(q), 0) * 100) / 100
  const visible = QUESTIONS.map((q, i) => ({ q, n: i + 1 })).filter(
    ({ q }) => lesson === 'all' || q.lesson === lesson,
  )

  return (
    <>
      <section className="card">
        <h2 className="section-title">بطاقة الاختبار</h2>
        <ul className="meta-list">
          <li><span>العنوان الظاهر</span><strong>{EXAM_TITLE_AR}</strong></li>
          <li><span>عنوان الاختبار</span><strong dir="ltr">{EXAM_TITLE}</strong></li>
          <li><span>الصف / الفصل / المادة</span><strong>الخامس · الفصل الأول · الرياضيات</strong></li>
          <li><span>عدد الأسئلة الرئيسية</span><strong>{QUESTIONS.length}</strong></li>
          <li><span>عدد الفروع المقوّمة</span><strong>{partsTotal}</strong></li>
          <li><span>مجموع العلامات</span><strong>{TOTAL_POINTS}</strong></li>
          <li><span>المدة</span><strong>غير محددة في المصدر (عدّ تصاعدي فقط)</strong></li>
        </ul>
      </section>

      <section className="card">
        <h2 className="section-title">توزيع الأسئلة والعلامات حسب الدروس</h2>
        <div className="table-scroll">
          <table className="qtable blueprint">
            <thead>
              <tr>
                <th scope="col">الدرس</th>
                <th scope="col">الصفحات</th>
                <th scope="col">الأسئلة</th>
                <th scope="col">الفروع</th>
                <th scope="col">العلامات</th>
                <th scope="col">وفق المخطط</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.lesson.id}>
                  <td>{r.lesson.title}</td>
                  <td>{r.lesson.pages}</td>
                  <td>{r.count}</td>
                  <td>{r.parts}</td>
                  <td>{r.points}</td>
                  <td>{r.ok ? '✓' : '✗'}</td>
                </tr>
              ))}
              <tr className="total-row">
                <td>المجموع</td>
                <td>—</td>
                <td>{QUESTIONS.length}</td>
                <td>{partsTotal}</td>
                <td>{totalPoints}</td>
                <td>{totalPoints === 100 ? '✓' : '✗'}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="fine-print">
          <strong>تنبيه:</strong> كلمة مرور هذه المنطقة بوابة واجهة تجميلية فقط، وليست حماية أمنية
          حقيقية ولا تشفيراً للبيانات؛ فالكود منشور مع الصفحة ويمكن تجاوزه تقنياً.
        </p>
        <p className="fine-print">
          ملاحظة: «وفق المخطط» يقارن بتوزيع الوحدة المرجعي (30 سؤالاً و100 علامة) الوارد في بنك
          الأسئلة نفسه؛ وهو مطابق تماماً للمصدر.
        </p>
      </section>

      <div className="filter-row" role="group" aria-label="تصفية حسب الدرس">
        <button
          type="button"
          className={`pill${lesson === 'all' ? ' is-on' : ''}`}
          onClick={() => setLesson('all')}
        >
          كل الدروس
        </button>
        {LESSONS.map((l) => (
          <button
            key={l.id}
            type="button"
            className={`pill${lesson === l.id ? ' is-on' : ''}`}
            onClick={() => setLesson(l.id)}
          >
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
      {q.table && (
        <div className="table-scroll">
          <table className="qtable">
            <caption><RichText text={q.table.caption} /></caption>
            <thead>
              <tr>
                {q.table.headers.map((h, i) => (
                  <th key={i} scope="col"><RichText text={h} /></th>
                ))}
              </tr>
            </thead>
            <tbody>
              {q.table.rows.map((row, r) => (
                <tr key={r}>
                  {row.map((cell, c) => (
                    <td key={c}><RichText text={cell} /></td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <ul className="rc-parts">
        {q.parts.map((p, i) => (
          <li key={p.id} className="rc-part">
            <div className="rc-part-head">
              <span>{p.label ? `الفرع ${p.label}` : `الفرع ${i + 1}`}</span>
              <span className="rc-part-score">{p.points} علامة</span>
            </div>
            {p.prompt && <div className="rc-line"><RichText text={p.prompt} /></div>}
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
            <li key={i}><RichText text={s} /></li>
          ))}
        </ol>
      </div>
      <div className="rc-why">
        <strong>الشرح / الخطأ الشائع:</strong> <RichText text={q.solution.why} />
      </div>
    </article>
  )
}
