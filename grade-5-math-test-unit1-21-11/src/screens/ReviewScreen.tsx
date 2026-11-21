import { useMemo, useState } from 'react'
import { EXAM_TITLE_AR } from '../config'
import { Decor, MuteButton } from '../components/Shell'
import { ContactBar } from '../components/ContactBar'
import { RichText } from '../components/RichText'
import { isPartAnswered, summarizeAnswer } from '../lib/grading'
import type { Attempt } from '../lib/attempt'
import { QUESTIONS } from '../data/index'

interface Props {
  attempt: Attempt
  muted: boolean
  onToggleMute: () => void
  onBack: () => void
  onConfirm: () => void
}

/**
 * شاشة المراجعة قبل التسليم: تعرض كل سؤال وما أُجيب عنه، مع عدد الأفرع الفارغة،
 * ثم تطلب تأكيداً صريحاً قبل إنهاء المحاولة. لا تعرض أي إجابة نموذجية.
 */
export function ReviewScreen({ attempt, muted, onToggleMute, onBack, onConfirm }: Props) {
  const [asking, setAsking] = useState(false)

  const rows = useMemo(
    () =>
      QUESTIONS.map((q, i) => {
        const flags = q.parts.map((p) => isPartAnswered(p.input, attempt.answers[p.id]))
        return {
          index: i + 1,
          question: q,
          flags,
          missing: flags.filter((f) => !f).length,
        }
      }),
    [attempt.answers],
  )
  const missingTotal = rows.reduce((s, r) => s + r.missing, 0)

  return (
    <div className="page">
      <Decor />
      <header className="topbar">
        <div className="brand">
          <span className="brand-badge" aria-hidden="true">✓</span>
          <div className="brand-text">
            <h1 className="brand-title">مراجعة قبل التسليم — {EXAM_TITLE_AR}</h1>
            <p className="brand-sub">الطالب/ة: {attempt.studentName}</p>
          </div>
        </div>
        <MuteButton muted={muted} onToggle={onToggleMute} />
      </header>

      <main className="container">
        <section className="card">
          <h2 className="section-title">ملخّص إجاباتك</h2>
          <p className="hero-text">
            {missingTotal === 0
              ? 'أجبت عن جميع الفروع. راجع القائمة أدناه ثم أكّد التسليم.'
              : `لديك ${missingTotal} فرعاً بلا إجابة (معلَّم بـ «لم تُجب»). يمكنك الرجوع وإكمالها، أو التسليم كما هو.`}
          </p>
          <ul className="review-list">
            {rows.map((r) => (
              <li key={r.question.id} className={`review-row${r.missing > 0 ? ' has-missing' : ''}`}>
                <div className="review-head">
                  <span className="qnum">السؤال {r.index}</span>
                  <span className="review-state">
                    {r.missing === 0 ? 'مكتمل' : `${r.missing} فرع بلا إجابة`}
                  </span>
                </div>
                <div className="review-parts">
                  {r.question.parts.map((p, idx) => (
                    <div key={p.id} className="review-part">
                      <span className="review-label">{p.label ? `الفرع ${p.label}` : `الفرع ${idx + 1}`}</span>
                      <span className={`review-value${r.flags[idx] ? '' : ' is-missing'}`}>
                        <RichText text={summarizeAnswer(p.input, attempt.answers[p.id])} />
                      </span>
                    </div>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </section>

        {!asking ? (
          <div className="review-actions">
            <button type="button" className="btn btn-ghost" onClick={onBack}>
              العودة إلى الأسئلة
            </button>
            <button type="button" className="btn btn-submit" onClick={() => setAsking(true)}>
              تسليم الاختبار
            </button>
          </div>
        ) : (
          <section className="card confirm-card" role="alertdialog" aria-labelledby="confirm-title">
            <h2 id="confirm-title" className="section-title">تأكيد التسليم</h2>
            <p className="hero-text">
              بعد التسليم يُغلق الاختبار وتُصحَّح إجاباتك فوراً، ولا يمكن تعديلها.
              {missingTotal > 0 && ` لديك ${missingTotal} فرعاً بلا إجابة ستُحسب صفراً.`}
              {' '}هل تريد التسليم الآن؟
            </p>
            <div className="review-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setAsking(false)}>
                إلغاء
              </button>
              <button type="button" className="btn btn-submit" onClick={onConfirm}>
                نعم، سلّم الاختبار
              </button>
            </div>
          </section>
        )}
      </main>

      <ContactBar />
    </div>
  )
}
