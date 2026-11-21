import { useMemo } from 'react'
import { EXAM_TITLE_AR } from '../config'
import { Decor, MuteButton } from '../components/Shell'
import { ContactBar } from '../components/ContactBar'
import { FigureView } from '../components/Figures'
import { RichParagraphs, RichText } from '../components/RichText'
import {
  buildResults,
  encouragement,
  formatDateTime,
  formatHMS,
  type Attempt,
  type ResultItem,
} from '../lib/attempt'
import { summarizeAnswer, summarizeExpected } from '../lib/grading'
import { buildReportText, lessonAwarded, reportFileName, STATUS_LABEL } from '../lib/report'
import type { SendStatus } from '../lib/submit'
import { QUESTIONS } from '../data/index'
import { lessonTitle } from '../data/lessons'

interface Props {
  attempt: Attempt
  muted: boolean
  onToggleMute: () => void
  sendStatus: SendStatus
  pending: number
  onResend: () => void
  onRestart: () => void
  onTeacher: () => void
}

function SendBanner({
  status,
  pending,
  onResend,
}: {
  status: SendStatus
  pending: number
  onResend: () => void
}) {
  if (status === 'idle') {
    if (pending <= 0) return null
    return (
      <div className="send-banner send-fail" role="status" aria-live="polite">
        <p>
          محاولة هذا الاختبار محفوظة محلياً ولم يتأكد وصولها إلى المعلّم بعد ({pending}). ستُعاد
          تلقائياً عند فتح الاختبار، أو أعد إرسالها الآن.
        </p>
        <button type="button" className="btn btn-ghost btn-small" onClick={onResend}>
          إعادة إرسال يدوي
        </button>
      </div>
    )
  }
  if (status === 'sending') {
    return (
      <p className="send-banner send-sending" role="status" aria-live="polite">
        جارٍ إرسال النتيجة إلى المعلّم…
      </p>
    )
  }
  if (status === 'success') {
    return (
      <p className="send-banner send-ok" role="status" aria-live="polite">
        ✓ تم إرسال النتيجة إلى المعلّم.
      </p>
    )
  }
  return (
    <div className="send-banner send-fail" role="status" aria-live="polite">
      <p>
        تعذّر إرسال النتيجة إلى المعلّم الآن. نتيجتك محفوظة على هذا الجهاز، وملف التقرير يعمل
        كما هو، وسيُعاد الإرسال تلقائياً عند فتح الاختبار.
        {pending > 0 ? ` (محاولات معلّقة: ${pending})` : ''}
      </p>
      <button type="button" className="btn btn-ghost btn-small" onClick={onResend}>
        إعادة إرسال يدوي
      </button>
    </div>
  )
}

export function ResultsScreen({
  attempt,
  muted,
  onToggleMute,
  sendStatus,
  pending,
  onResend,
  onRestart,
  onTeacher,
}: Props) {
  const summary = useMemo(() => buildResults(QUESTIONS, attempt), [attempt])
  const lessons = useMemo(() => lessonAwarded(summary), [summary])

  const downloadReport = () => {
    const text = buildReportText(summary)
    const blob = new Blob(['\uFEFF', text.replace(/^\uFEFF/, '')], {
      type: 'text/plain;charset=utf-8',
    })
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
            <h1 className="brand-title">نتيجة — {EXAM_TITLE_AR}</h1>
            <p className="brand-sub">الرياضيات — الصف الخامس — الوحدة الأولى</p>
          </div>
        </div>
        <MuteButton muted={muted} onToggle={onToggleMute} />
      </header>

      <main className="container">
        <section className="card result-hero">
          <p className="result-name">الطالب/ة: <strong>{summary.studentName}</strong></p>
          <div
            className="score-ring"
            style={{ ['--p' as string]: `${percent}` }}
            aria-label={`العلامة النهائية ${summary.score} من ${summary.max}`}
          >
            <div className="score-inner">
              <span className="score-num">{summary.score}</span>
              <span className="score-of">من {summary.max}</span>
            </div>
          </div>
          <p className="encourage">{encouragement(percent)}</p>

          <dl className="stats">
            <div><dt>صحيحة كاملة</dt><dd>{summary.correct}</dd></div>
            <div><dt>صحيحة جزئياً</dt><dd>{summary.partial}</dd></div>
            <div><dt>خاطئة</dt><dd>{summary.wrong}</dd></div>
            <div><dt>الوقت المستغرق</dt><dd dir="ltr">{formatHMS(summary.elapsedMs)}</dd></div>
          </dl>
          <p className="result-meta">
            <span>بدأ: {formatDateTime(summary.startedAt)}</span>
            <span>سُلّم: {formatDateTime(summary.submittedAt)}</span>
          </p>

          <div className="lesson-grid">
            <h3 className="section-sub">توزيع العلامات على الدروس</h3>
            <ul className="lesson-list">
              {lessons.map((l) => (
                <li key={l.title}>
                  <span>{l.title}</span>
                  <span className="lesson-score">{l.awarded} / {l.max}</span>
                </li>
              ))}
            </ul>
          </div>

          <SendBanner status={sendStatus} pending={pending} onResend={onResend} />

          <div className="result-actions">
            <button type="button" className="btn btn-primary btn-block" onClick={downloadReport}>
              تنزيل التقرير (ملف TXT)
            </button>
            <p className="fine-print">
              ملف التقرير بترميز UTF-8 ويعرض إجاباتك والإجابات النموذجية والدرجات والتفاصيل.
            </p>
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
          <button type="button" className="btn btn-ghost btn-small" onClick={onTeacher}>
            عرض الإجابات النموذجية للمعلّم
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
    <details className={`rcard rcard-${g.status}`} open>
      <summary>
        <span className="rc-num">{item.index}</span>
        <span className="rc-title">
          <span className="rc-lesson">{lessonTitle(q.lesson)}</span>
          <span className="rc-skill">{q.skill}</span>
        </span>
        <span className="rc-score">{g.earned} / {g.max}</span>
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
                  <span className="rc-part-score">{pg.earned} من {part.points}</span>
                </div>
                {part.prompt && (
                  <div className="rc-line"><RichText text={part.prompt} /></div>
                )}
                <div className="rc-line">
                  <strong>إجابتك:</strong>{' '}
                  <RichText text={summarizeAnswer(part.input, answers[part.id])} />
                </div>
                <div className="rc-line rc-correct">
                  <strong>الإجابة النموذجية:</strong>{' '}
                  <RichText text={summarizeExpected(part.input)} />
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
              <li key={i}><RichText text={s} /></li>
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
