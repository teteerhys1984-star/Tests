import { useMemo, useState } from "react";
import type { Question } from "../data/exam";
import { EXAM_META, QUESTIONS, sourceLabel } from "../data/exam";
import type { AnswerMap, ExamSummary, PartScore } from "../lib/grading";
import { formatCorrectAnswer, formatStudentAnswer, gradePart } from "../lib/grading";
import { formatDuration, partLetter } from "../lib/report";
import { FigureView, RichText } from "./Science";

export function ContactStrip() {
  return (
    <div className="contact-strip">
      <span className="contact-dot" aria-hidden="true" />
      <span>{EXAM_META.contact.name}</span>
      <span className="contact-sep">:</span>
      <a href={`tel:${EXAM_META.contact.phone}`} dir="ltr" className="contact-phone">
        {EXAM_META.contact.phone}
      </a>
      <a
        href={EXAM_META.contact.whatsapp}
        target="_blank"
        rel="noopener noreferrer"
        className="whatsapp-link"
        aria-label="تواصل عبر واتساب"
      >
        <span aria-hidden="true">واتساب</span>
        <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
          <path
            fill="currentColor"
            d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm5.1 14.1c-.2.6-1.2 1.1-1.7 1.2-.4.1-1 .1-1.6-.1a12 12 0 0 1-3.3-1.8 12.5 12.5 0 0 1-2.2-2.9c-.3-.5-.7-1.4-.7-2.6 0-1.3.7-1.9 1-2.2.2-.3.5-.4.7-.4h.5c.2 0 .4 0 .6.5l.8 1.9c.1.2.1.4 0 .6l-.4.6-.4.4c-.1.1-.2.3-.1.5.3.6.8 1.3 1.5 1.9.8.7 1.5 1.1 2.1 1.3.2.1.4 0 .5-.1l.9-1c.2-.2.4-.2.6-.1l1.9.9c.2.1.4.2.4.4.1.2.1.8-.1 1.4Z"
          />
        </svg>
      </a>
    </div>
  );
}

function StatusBadge({ status }: { status: PartScore["status"] }) {
  const labels = { correct: "صحيحة", partial: "جزئية", incorrect: "خاطئة", unanswered: "دون إجابة" };
  return <span className={`status-badge ${status}`}>{labels[status]}</span>;
}

function QuestionReview({
  question,
  number,
  answers,
  showTeacher,
}: {
  question: Question;
  number: number;
  answers: AnswerMap;
  showTeacher?: boolean;
}) {
  const totalAwarded = question.parts.reduce((s, p) => s + gradePart(p, answers[p.id]).awarded, 0);
  const totalAvailable = question.parts.reduce((s, p) => s + p.marks, 0);
  return (
    <article className="review-question">
      <header className="review-q-head">
        <div>
          <div className="review-q-kicker">السؤال {number}</div>
          <h3>{question.title}</h3>
          {question.stem && <p className="review-stem"><RichText text={question.stem} /></p>}
          <p className="source-line">{sourceLabel(question.source)}</p>
        </div>
        <div className="review-q-score" dir="ltr">
          {showTeacher ? totalAvailable : Math.round(totalAwarded * 100) / 100} / {totalAvailable}
        </div>
      </header>
      {question.figure && <div className="review-figure"><FigureView figure={question.figure} /></div>}
      <div className="review-parts">
        {question.parts.map((part, idx) => {
          const score = gradePart(part, answers[part.id]);
          return (
            <div className={`review-part ${showTeacher ? "" : score.status}`} key={part.id}>
              <div className="review-part-head">
                <span className="part-letter">({partLetter(idx)})</span>
                <div className="part-prompt"><RichText text={part.prompt} /></div>
                {!showTeacher && <StatusBadge status={score.status} />}
                <span className="marks-pill" dir="ltr">
                  {showTeacher ? `${part.marks} درجة` : `${score.awarded} / ${part.marks}`}
                </span>
              </div>
              {!showTeacher && (
                <div className="answer-compare">
                  <div>
                    <span className="compare-label">إجابتك:</span>
                    <p>{formatStudentAnswer(part, answers[part.id])}</p>
                  </div>
                  <div>
                    <span className="compare-label correct">الإجابة الصحيحة:</span>
                    <p><RichText text={formatCorrectAnswer(part)} /></p>
                  </div>
                </div>
              )}
              {showTeacher && (
                <div className="teacher-answer">
                  <span className="compare-label correct">الإجابة الصحيحة:</span>
                  <p><RichText text={formatCorrectAnswer(part)} /></p>
                </div>
              )}
              <div className="explanation-box">
                <span className="compare-label">الشرح العلمي:</span>
                <p><RichText text={part.explanation} /></p>
              </div>
              {showTeacher && (
                <div className="rubric-box">
                  <span className="compare-label">معيار التصحيح / الدرجات الجزئية:</span>
                  <p><RichText text={part.rubric} /></p>
                </div>
              )}
              <p className="part-source">{sourceLabel(part.source)}</p>
            </div>
          );
        })}
      </div>
    </article>
  );
}

export function ResultsPage({
  studentName,
  questions,
  answers,
  summary,
  elapsedSeconds,
  submittedAt,
  downloadNote,
  onDownloadReport,
  onTryAgain,
  onTeacher,
}: {
  studentName: string;
  questions: Question[];
  answers: AnswerMap;
  summary: ExamSummary;
  elapsedSeconds: number;
  submittedAt: number;
  downloadNote: string | null;
  onDownloadReport: () => void;
  onTryAgain: () => void;
  onTeacher: () => void;
}) {
  const performance =
    summary.percentage >= 90
      ? "أداء متميّز"
      : summary.percentage >= 80
        ? "أداء جيد جدًا"
        : summary.percentage >= 70
          ? "أداء جيد"
          : summary.percentage >= 60
            ? "أداء مقبول"
            : "يحتاج إلى مراجعة منظّمة";
  const pct = Math.max(0, Math.min(100, summary.percentage));
  const circumference = 2 * Math.PI * 52;
  const submittedLabel = new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date(submittedAt));

  return (
    <div className="results-page">
      <section className="results-hero">
        <div className="score-ring" aria-label={`الدرجة ${summary.totalAwarded} من 100`}>
          <svg viewBox="0 0 128 128">
            <circle cx="64" cy="64" r="52" className="ring-track" />
            <circle
              cx="64"
              cy="64"
              r="52"
              className="ring-value"
              strokeDasharray={`${(pct / 100) * circumference} ${circumference}`}
            />
          </svg>
          <div className="score-center">
            <strong dir="ltr">{summary.totalAwarded}</strong>
            <span>من 100</span>
          </div>
        </div>
        <div className="results-headline">
          <p className="eyebrow">نتيجة الاختبار</p>
          <h1>{performance}</h1>
          <p className="results-student">الطالب: <strong>{studentName}</strong></p>
          <div className="results-meta">
            <span>النسبة <b dir="ltr">{summary.percentage}%</b></span>
            <span>الزمن <b dir="ltr">{formatDuration(elapsedSeconds)}</b></span>
            <span>وقت التسليم <b dir="ltr">{submittedLabel}</b></span>
          </div>
          <div className="results-actions">
            <button type="button" className="btn btn-primary" onClick={onDownloadReport}>
              تنزيل التقرير TXT
            </button>
            <button type="button" className="btn btn-outline" onClick={onTryAgain}>
              محاولة جديدة
            </button>
            <button type="button" className="btn btn-ghost" onClick={onTeacher}>
              بوابة المعلم
            </button>
          </div>
          {downloadNote && <p className="small-note">{downloadNote}</p>}
        </div>
      </section>

      <section className="summary-grid" aria-label="ملخص التصحيح">
        <div className="summary-card"><span className="summary-num" dir="ltr">{summary.correct}</span><span>أجزاء صحيحة</span></div>
        <div className="summary-card"><span className="summary-num" dir="ltr">{summary.partial}</span><span>أجزاء جزئية</span></div>
        <div className="summary-card"><span className="summary-num" dir="ltr">{summary.incorrect}</span><span>أجزاء خاطئة</span></div>
        <div className="summary-card"><span className="summary-num" dir="ltr">{summary.unanswered}</span><span>دون إجابة</span></div>
      </section>

      <section className="results-review">
        <div className="review-title-row">
          <div>
            <h2>مراجعة تفصيلية</h2>
            <p>كل الإجابات والشرح والمصادر بعد التسليم. مجموع الأجزاء {summary.subparts} جزءًا.</p>
          </div>
          <span className="review-legend">تُعرض مصادر الأسئلة هنا فقط بعد انتهاء الاختبار</span>
        </div>
        {questions.map((q, i) => (
          <QuestionReview key={q.id} question={q} number={i + 1} answers={answers} />
        ))}
      </section>
    </div>
  );
}

export function TeacherKeyModal({ onClose }: { onClose: () => void }) {
  const [password, setPassword] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState("");
  const emptyAnswers = useMemo(() => ({} as AnswerMap), []);
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === EXAM_META.teacherPassword) {
      setUnlocked(true);
      setError("");
    } else {
      setError("كلمة المرور غير صحيحة. هذا البوابة مخصّصة للمعلم فقط.");
    }
  };
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }} onKeyDown={(e) => { if (e.key === "Escape") onClose(); }}>
      <div className="teacher-modal" role="dialog" aria-modal="true" aria-labelledby="teacher-title">
        <header className="modal-head">
          <div>
            <p className="eyebrow">منطقة محمية</p>
            <h2 id="teacher-title">مفتاح إجابات المعلم</h2>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="إغلاق">×</button>
        </header>
        {!unlocked ? (
          <form className="teacher-lock" onSubmit={submit}>
            <p>أدخل كلمة مرور المعلم لعرض الإجابات النموذجية ومعايير التصحيح والمصادر.</p>
            <label>
              <span>كلمة المرور</span>
              <input
                type="password"
                className="text-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="كلمة مرور المعلم"
                autoFocus
              />
            </label>
            {error && <p className="error-text" role="alert">{error}</p>}
            <button className="btn btn-primary" type="submit">دخول بوابة المعلم</button>
            <p className="small-note">
              ملاحظة: هذه بوابة واجهة داخل ملف ثابت، وليست تشفيرًا أو مصادقة أمنية. لا تُستخدم لحماية بيانات حسّاسة.
            </p>
          </form>
        ) : (
          <div className="teacher-content">
            <div className="teacher-banner">
              <strong>مفتاح رسمي للاختبار</strong>
              <span>15 سؤالًا • {EXAM_META.targetSubparts} جزءًا • 100 درجة</span>
              <button type="button" className="btn btn-outline btn-small" onClick={() => setUnlocked(false)}>قفل البوابة</button>
            </div>
            <div className="teacher-marks table-scroll">
              <table className="exam-table">
                <thead>
                  <tr><th>السؤال</th><th>العنوان</th><th>الأجزاء</th><th>الدرجة</th><th>المصدر</th></tr>
                </thead>
                <tbody>
                  {QUESTIONS.map((q, i) => (
                    <tr key={q.id}>
                      <td className="num">{i + 1}</td>
                      <td>{q.title}</td>
                      <td className="num">{q.parts.length}</td>
                      <td className="num">{q.parts.reduce((sum, p) => sum + p.marks, 0)}</td>
                      <td className="source-line">{sourceLabel(q.source)}</td>
                    </tr>
                  ))}
                  <tr className="total-row">
                    <td colSpan={3}><strong>المجموع</strong></td>
                    <td className="num"><strong>{QUESTIONS.reduce((sum, q) => sum + q.parts.reduce((x, p) => x + p.marks, 0), 0)}</strong></td>
                    <td><strong>100 درجة</strong></td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="small-note">حماية الواجهة بسيطة داخل ملف HTML ثابت، وليست تشفيرًا حقيقيًا. تعرض البوابة جميع الأسئلة والأجزاء أدناه، والإجابات النموذجية والشرح والمصادر ومعايير التصحيح. صياغة الأسئلة من إعداد المنصة، وبعض التصنيفات المضافة (مثل AlCl₃) تتبع قاعدة الفلز/اللافلز في قضية البحث ص16.</p>
            <div className="teacher-questions">
              <h3>الأسئلة الخمسة عشر وأجزاؤها</h3>
              {QUESTIONS.map((q, i) => (
                <details key={q.id}>
                  <summary>
                    <span className="tq-number">السؤال {i + 1}</span>
                    <span className="tq-title">{q.title}</span>
                    <span className="tq-marks" dir="ltr">
                      {q.parts.length} أجزاء • {q.parts.reduce((sum, p) => sum + p.marks, 0)} درجة
                    </span>
                  </summary>
                  <QuestionReview question={q} number={i + 1} answers={emptyAnswers} showTeacher />
                </details>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export const renderAnswersCount = (answers: AnswerMap, questions: Question[]): number =>
  questions.reduce((total, q) => total + q.parts.filter((p) => gradePart(p, answers[p.id]).answered).length, 0);
