import { useMemo } from 'react'
import { Decor, MuteButton } from '../components/Shell'
import { ContactBar } from '../components/ContactBar'
import { FigureView } from '../components/Figures'
import { RichParagraphs, RichText } from '../components/RichText'
import { buildResults, encouragement, formatDateTime, formatHMS, type Attempt, type ResultItem } from '../lib/attempt'
import { summarizeAnswer, summarizeExpected } from '../lib/grading'
import { buildReportText, reportFileName } from '../lib/report'
import { QUESTIONS } from '../data/index'
import { lessonTitle } from '../data/lessons'

interface Props {
  attempt: Attempt
  muted: boolean
  onToggleMute: () => void
  onRestart: () => void
}

const STATUS_LABEL = {
  correct: 'إجابة صحيحة',
  partial: 'صحيحة جزئياً',
  wrong: 'تحتاج مراجعة',
} as const

export function ResultsScreen({ attempt, muted, onToggleMute, onRestart }: Props) {
  const summary = useMemo(() => buildResults(QUESTIONS, attempt), [attempt])

  const downloadReport = () => {
    const text = buildReportText(summary)
    // UTF-8 BOM so Arabic displays correctly in Windows editors as well.
    const blob = new Blob(['\uFEFF', text], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = reportFileName(summary.studentName, summary.submittedAt)
    document.body.appendChild(a)
    a.click()
    a.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  const percent = summary.max > 0 ? Math.round((summary.score / summary.max) * 100) : 0

  return (
    <div className="page">
      <Decor />
      <header className="topbar">
        <div className="brand">
          <span className="brand-badge" aria-hidden="true">✿</span>
          <div className="brand-text">
            <h1 className="brand-title">نتيجة الاختبار</h1>
            <p className="brand-sub">الوحدة الأولى — الرياضيات</p>
          </div>
        </div>
        <MuteButton muted={muted} onToggle={onToggleMute} />
      </header>

      <main className="container">
        <section className="card result-hero">
          <p className="result-name">
            الطالبة: <strong>{summary.studentName}</strong>
          </p>
          <div className="score-ring" style={{ ['--p' as string]: `${percent}` }} aria-label={`العلامة النهائية ${summary.score} من ${summary.max}`}>
            <div className="score-inner">
              <span className="score-num">{summary.score}</span>
              <span className="score-of">من {summary.max}</span>
            </div>
          </div>
          <p className="encourage">{encouragement(summary.score)}</p>

          <dl className="stats">
            <div>
              <dt>صحيحة كاملة</dt>
              <dd>{summary.correct}</dd>
            </div>
            <div>
              <dt>صحيحة جزئياً</dt>
              <dd>{summary.partial}</dd>
            </div>
            <div>
              <dt>خاطئة</dt>
              <dd>{summary.wrong}</dd>
            </div>
            <div>
              <dt>الوقت المستغرق</dt>
              <dd dir="ltr">{formatHMS(summary.elapsedMs)}</dd>
            </div>
          </dl>
          <p className="result-meta">
            <span>بدأ: {formatDateTime(summary.startedAt)}</span>
            <span>سُلّم: {formatDateTime(summary.submittedAt)}</span>
          </p>

          <div className="result-actions">
            <button type="button" className="btn btn-primary btn-block" onClick={downloadReport}>
              تنزيل التقرير (ملف TXT)
            </button>
            <p className="fine-print">ملف التقرير يحفظ اسم الطالبة والعلامات وتفاصيل الإجابات بترميز UTF-8.</p>
          </div>
        </section>

        <section className="results-list" aria-label="تفاصيل كل سؤال">
          <h2 className="section-title">تفاصيل الأسئلة</h2>
          {summary.items.map((item) => (
            <ResultCard key={item.question.id} item={item} answers={attempt.answers} />
          ))}
        </section>

        <div className="restart-row">
          <button type="button" className="btn btn-ghost" onClick={onRestart}>
            بدء محاولة جديدة
          </button>
        </div>
      </main>

      <ContactBar />
    </div>
  )
}

function ResultCard({ item, answers }: { item: ResultItem; answers: Attempt['answers'] }) {
  const q = item.question
  const g = item.grade
  return (
    <details className={`rcard rcard-${g.status}`}>
      <summary>
        <span className="rc-num">{item.index}</span>
        <span className="rc-title">
          <span className="rc-lesson">{lessonTitle(q.lesson)}</span>
          <span className="rc-skill">{q.skill}</span>
        </span>
        <span className="rc-score">
          {g.earned} / {g.max}
        </span>
      </summary>
      <div className="rc-body">
        <p className="rc-status">{STATUS_LABEL[g.status]}</p>
        <div className="rc-ref">
          <span>الدرس: {lessonTitle(q.lesson)}</span>
          <span>المهارة: {q.skill}</span>
          <span>الصفحة المرجعية: {q.pages}</span>
        </div>
        <RichParagraphs text={q.prompt} className="rc-prompt" />
        {q.figure && (
          <div className="fig-box fig-small">
            <FigureView spec={q.figure} />
          </div>
        )}
        <ul className="rc-parts">
          {q.parts.map((part, idx) => {
            const pg = g.parts[idx]
            return (
              <li key={part.id} className="rc-part">
                <div className="rc-part-head">
                  <span>{part.label ? `الفرع ${part.label}` : `الفرع ${idx + 1}`}</span>
                  <span className="rc-part-score">
                    {pg.earned} من {part.points}
                  </span>
                </div>
                {part.prompt && (
                  <div className="rc-line">
                    <RichText text={part.prompt} />
                  </div>
                )}
                <div className="rc-line">
                  <strong>إجابتك:</strong> <RichText text={summarizeAnswer(part.input, answers[part.id])} />
                </div>
                <div className="rc-line rc-correct">
                  <strong>الإجابة النموذجية:</strong> <RichText text={summarizeExpected(part.input)} />
                </div>
              </li>
            )
          })}
        </ul>
        <div className="rc-answer">
          <strong>الإجابة النموذجية الكاملة:</strong> <RichText text={q.solution.answer} />
        </div>
        <div className="rc-steps">
          <strong>خطوات الحل الصحيحة:</strong>
          <ol>
            {q.solution.steps.map((s, i) => (
              <li key={i}>
                <RichText text={s} />
              </li>
            ))}
          </ol>
        </div>
        <div className="rc-why">
          <strong>شرح:</strong> <RichText text={q.solution.why} />
        </div>
      </div>
    </details>
  )
}
