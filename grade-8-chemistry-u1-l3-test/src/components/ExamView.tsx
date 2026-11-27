import { useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Circle,
  Clock3,
  ListChecks,
  Save,
  Send,
} from 'lucide-react';
import { ALL_PARTS, QUESTIONS } from '../data/exam';
import { answerText, completedCount, firstIncompletePartId, firstIncompleteQuestion, isPartComplete } from '../lib/grading';
import { formatDuration } from '../lib/session';
import type { AnswerValue, Attempt, Part, Question } from '../lib/types';
import { AnswerControl } from './AnswerControl';
import { ScientificText } from './Chem';
import { ProgressRing, QuestionIcon } from './Layout';

export function PartCard({ part, value, onChange }: { part: Part; value: AnswerValue | undefined; onChange: (v: AnswerValue) => void }) {
  const complete = isPartComplete(part, value);
  return (
    <section className={`part-card ${complete ? 'part-complete' : ''}`} id={part.id} aria-labelledby={`${part.id}-title`}>
      <div className="part-heading">
        <span className="part-letter">{part.label}</span>
        <div>
          <span className="part-kind">{part.difficulty === 'easy' ? 'فهم أساسي' : part.difficulty === 'medium' ? 'تطبيق' : 'تحدٍّ واستدلال'}</span>
          <h3 id={`${part.id}-title`}>{part.title}</h3>
        </div>
        <span className="marks-badge">
          {part.marks}
          <span>علامات</span>
        </span>
      </div>
      <p className="part-prompt">
        <ScientificText text={part.prompt} />
      </p>
      <AnswerControl part={part} value={value} onChange={onChange} />
      <div className={`part-status ${complete ? 'is-complete' : ''}`}>
        {complete ? <CheckCircle2 size={13} /> : <Circle size={12} />}
        <span>{complete ? 'تمت الإجابة عن هذا الجزء' : 'بانتظار إجابتك'}</span>
      </div>
    </section>
  );
}

function ReviewPanel({
  attempt,
  completed,
  total,
  remaining,
  onJumpToPart,
  onClose,
  onConfirmSubmit,
}: {
  attempt: Attempt;
  completed: number;
  total: number;
  remaining: number;
  onJumpToPart: (questionIndex: number, partId?: string) => void;
  onClose: () => void;
  onConfirmSubmit: () => void;
}) {
  const firstMissingQuestion = firstIncompleteQuestion(attempt.answers);
  const firstMissingPart = firstIncompletePartId(attempt.answers);

  return (
    <section className="review-panel" aria-labelledby="review-heading">
      <div className="review-header">
        <div>
          <span className="section-kicker">مراجعة قبل التسليم</span>
          <h2 id="review-heading">ملخّص إجاباتك في الاختبار</h2>
          <p>
            أكملت <b>{completed}</b> من أصل <b>{total}</b> جزءًا. راجع إجاباتك أدناه قبل التأكيد النهائي.
          </p>
        </div>
        <div className="review-header-actions">
          <button type="button" className="button button-secondary" onClick={onClose}>
            <ArrowRight size={16} />
            العودة إلى الأسئلة
          </button>
          <button type="button" className="button button-primary" onClick={onConfirmSubmit}>
            <Send size={16} />
            {remaining > 0 ? 'تأكيد التسليم رغم نقص الإجابات' : 'تأكيد التسليم النهائي'}
          </button>
        </div>
      </div>

      {remaining > 0 ? (
        <div className="review-alert is-warning" role="alert">
          <AlertTriangle size={19} />
          <div className="review-alert-body">
            <strong>تنبيه: بقي {remaining} جزءًا غير مجاب عنه أو غير مكتمل.</strong>
            <p>الأجزاء غير المجاب عنها ستُحتسب علامتها صفرًا عند التسليم. يمكنك العودة لإكمالها أو المتابعة للتسليم.</p>
          </div>
          {firstMissingPart && (
            <button
              type="button"
              className="button button-secondary review-jump-missing"
              onClick={() => onJumpToPart(firstMissingQuestion, firstMissingPart)}
            >
              الانتقال إلى أول جزء غير مجاب
            </button>
          )}
        </div>
      ) : (
        <div className="review-alert is-ready" role="status">
          <CheckCircle2 size={19} />
          <div className="review-alert-body">
            <strong>جميع الأجزاء مكتملة ({total} / {total}).</strong>
            <p>يمكنك مراجعة أو تعديل أي سؤال قبل الضغط على زر التأكيد النهائي.</p>
          </div>
        </div>
      )}

      <div className="review-questions">
        {QUESTIONS.map((q, qi) => {
          const qDone = q.parts.filter(p => isPartComplete(p, attempt.answers[p.id])).length;
          return (
            <article className={`review-question-card ${qDone === q.parts.length ? 'is-done' : 'is-missing'}`} key={q.id}>
              <div className="review-question-head">
                <div className="review-question-title">
                  <QuestionIcon type={q.icon} size={19} />
                  <h3>
                    السؤال {q.number}: {q.title}
                  </h3>
                </div>
                <span className="review-question-count">
                  {qDone} / {q.parts.length} أجزاء
                </span>
                <button type="button" className="text-button review-edit-btn" onClick={() => onJumpToPart(qi)}>
                  تعديل السؤال
                  <ArrowLeft size={14} />
                </button>
              </div>
              <ul className="review-parts-list">
                {q.parts.map(p => {
                  const done = isPartComplete(p, attempt.answers[p.id]);
                  return (
                    <li className={`review-part-row ${done ? 'is-complete' : 'is-incomplete'}`} key={p.id}>
                      <span className="review-part-badge">{done ? <Check size={13} /> : <AlertTriangle size={13} />}</span>
                      <div className="review-part-info">
                        <strong>
                          {p.label}. {p.title}
                        </strong>
                        <div className="review-part-answer">
                          {done ? <ScientificText text={answerText(p, attempt.answers[p.id])} /> : 'غير مجاب عنه أو غير مكتمل'}
                        </div>
                      </div>
                      <button
                        type="button"
                        className="review-part-btn"
                        onClick={() => onJumpToPart(qi, p.id)}
                        aria-label={`الانتقال إلى ${p.label}. ${p.title}`}
                      >
                        <span>{done ? 'مكتمل · تعديل' : 'ناقص · إكمال'}</span>
                        <ArrowLeft size={13} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </article>
          );
        })}
      </div>

      <div className="review-footer-actions">
        <button type="button" className="button button-secondary" onClick={onClose}>
          <ArrowRight size={16} />
          العودة للتعديل
        </button>
        <button type="button" className="button button-primary" onClick={onConfirmSubmit}>
          <Send size={16} />
          {remaining > 0 ? 'تأكيد التسليم رغم نقص الإجابات' : 'تأكيد التسليم النهائي'}
        </button>
      </div>
    </section>
  );
}

export function ExamView({
  attempt,
  elapsed,
  onAnswer,
  onNavigate,
  onSubmit,
  saved,
}: {
  attempt: Attempt;
  elapsed: number;
  onAnswer: (id: string, value: AnswerValue) => void;
  onNavigate: (index: number) => void;
  onSubmit: () => void;
  saved: boolean;
}) {
  const [reviewOpen, setReviewOpen] = useState(false);
  const question: Question = QUESTIONS[attempt.currentQuestion];
  const completed = completedCount(attempt.answers);
  const total = ALL_PARTS.length;
  const remaining = total - completed;
  const questionComplete = question.parts.filter(p => isPartComplete(p, attempt.answers[p.id])).length;
  const submitHelp = remaining
    ? `بقي ${remaining} جزءًا غير مكتمل؛ اضغط للمراجعة قبل التسليم.`
    : 'جميع الأجزاء مكتملة. راجع إجاباتك ثم سلّم.';

  const openReview = () => {
    setReviewOpen(true);
    window.scrollTo({ top: 0, behavior: 'auto' });
  };

  const jumpFromReview = (questionIndex: number, partId?: string) => {
    setReviewOpen(false);
    onNavigate(questionIndex);
    if (partId) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          document.getElementById(partId)?.scrollIntoView({ block: 'start', behavior: 'auto' });
        });
      });
    }
  };

  return (
    <main className="exam-page page-container">
      <div className="exam-topline">
        <div className="student-welcome">
          <span className="student-avatar">{attempt.studentName.charAt(0)}</span>
          <div>
            <span>مساحة الطالب</span>
            <strong>{attempt.studentName}</strong>
          </div>
        </div>
        <div className="exam-lesson-label">
          الوحدة الأولى <span>/</span> الدرس الثالث <span>/</span> صيغة المركّبات الكيميائية
        </div>
        <div className="mobile-timer" role="timer" aria-label="الوقت المنقضي">
          <Clock3 size={16} />
          <span dir="ltr">{formatDuration(elapsed)}</span>
        </div>
      </div>

      {reviewOpen ? (
        <ReviewPanel
          attempt={attempt}
          completed={completed}
          total={total}
          remaining={remaining}
          onJumpToPart={jumpFromReview}
          onClose={() => setReviewOpen(false)}
          onConfirmSubmit={() => {
            setReviewOpen(false);
            onSubmit();
          }}
        />
      ) : (
        <>
          <div className="exam-layout">
            <aside className="exam-sidebar" aria-label="التنقل بين الأسئلة والتسليم">
              <div className="progress-card">
                <ProgressRing value={(completed / total) * 100}>
                  <strong dir="ltr">
                    {completed}
                    <small> / {total}</small>
                  </strong>
                  <span>جزءًا مكتملًا</span>
                </ProgressRing>
                <div className="progress-copy">
                  <h3>تقدّمك في الاختبار</h3>
                  <p>{remaining ? `بقي ${remaining} جزءًا لتكمل رحلتك` : 'أنهيت جميع الأجزاء. أحسنت!'}</p>
                </div>
                <div
                  className="progress-track"
                  role="progressbar"
                  aria-label="اكتمال الإجابات"
                  aria-valuemin={0}
                  aria-valuemax={total}
                  aria-valuenow={completed}
                >
                  <span style={{ width: `${(completed / total) * 100}%` }} />
                </div>
              </div>
              <nav className="question-navigation" aria-label="أسئلة الاختبار">
                {QUESTIONS.map((q, i) => {
                  const done = q.parts.filter(p => isPartComplete(p, attempt.answers[p.id])).length;
                  return (
                    <button
                      key={q.id}
                      className={`question-nav-item ${i === attempt.currentQuestion ? 'current' : ''} ${done === q.parts.length ? 'done' : ''}`}
                      onClick={() => onNavigate(i)}
                      aria-current={i === attempt.currentQuestion ? 'step' : undefined}
                    >
                      <span className="nav-question-number">{done === q.parts.length ? <Check size={16} /> : `0${q.number}`}</span>
                      <span className="nav-question-copy">
                        <strong>{q.shortTitle}</strong>
                        <span>
                          {q.marks} علامة <i>·</i> {done}/{q.parts.length} أجزاء
                        </span>
                      </span>
                      {done > 0 && done < q.parts.length ? (
                        <span className="partial-dot" aria-label="مكتمل جزئيًا" />
                      ) : i === attempt.currentQuestion ? (
                        <ArrowLeft size={15} className="nav-current-arrow" />
                      ) : null}
                    </button>
                  );
                })}
              </nav>
              <div className="sidebar-submit">
                <button type="button" className="button button-primary submit-button" onClick={openReview}>
                  <Send size={16} />
                  <span>تسليم الاختبار</span>
                </button>
                <p id="submit-help">{submitHelp}</p>
                <span className="sidebar-save">
                  <Save size={13} />
                  {saved ? 'الحفظ التلقائي مفعّل' : 'الحفظ المحلي غير متاح'}
                </span>
              </div>
            </aside>
            <div className="question-main" id="question-top">
              <div className="question-main-heading">
                <div className="question-title-group">
                  <span className={`question-icon tone-${question.number}`}>
                    <QuestionIcon type={question.icon} size={26} />
                  </span>
                  <div>
                    <span className="question-overline">السؤال {question.number} من 7</span>
                    <h2>{question.title}</h2>
                  </div>
                </div>
                <span className="question-total">
                  {question.marks}
                  <small>علامة</small>
                </span>
              </div>
              <div className="question-description">
                <p>{question.description}</p>
                <span>
                  <ListChecks size={14} />
                  {questionComplete} / {question.parts.length} أجزاء مكتملة
                </span>
              </div>
              <div className="part-jump-links" aria-label="أجزاء السؤال">
                {question.parts.map(p => (
                  <a key={p.id} href={`#${p.id}`} className={isPartComplete(p, attempt.answers[p.id]) ? 'answered' : ''}>
                    <span>{p.label}</span>
                    {isPartComplete(p, attempt.answers[p.id]) ? <Check size={12} /> : <Circle size={10} />}
                  </a>
                ))}
              </div>
              <div className="question-parts">
                {question.parts.map(p => (
                  <PartCard key={p.id} part={p} value={attempt.answers[p.id]} onChange={value => onAnswer(p.id, value)} />
                ))}
              </div>
              <div className="question-pagination">
                <button
                  className="button button-secondary"
                  disabled={attempt.currentQuestion === 0}
                  onClick={() => onNavigate(attempt.currentQuestion - 1)}
                >
                  <ArrowRight size={17} />
                  السؤال السابق
                </button>
                <span dir="ltr">{attempt.currentQuestion + 1} / 7</span>
                <button
                  className="button button-secondary"
                  disabled={attempt.currentQuestion === 6}
                  onClick={() => onNavigate(attempt.currentQuestion + 1)}
                >
                  السؤال التالي
                  <ArrowLeft size={17} />
                </button>
              </div>
              <p className="exam-no-feedback">
                <CheckCircle2 size={14} />
                لا تظهر الدرجات أو التصحيحات قبل تسليم الاختبار.
              </p>
            </div>
          </div>
          <div className="mobile-submit-bar">
            <div>
              <strong>
                {completed} من {total} جزءًا
              </strong>
              <span>{remaining ? `${remaining} جزءًا متبقيًا` : 'جاهز للمراجعة والتسليم'}</span>
            </div>
            <button type="button" className="button button-primary submit-button" onClick={openReview}>
              <Send size={16} />
              <span>تسليم الاختبار</span>
            </button>
          </div>
        </>
      )}
    </main>
  );
}
