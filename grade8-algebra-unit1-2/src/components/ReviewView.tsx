import { useState } from 'react';
import type { StoredAttempt } from '../lib/storage';
import { countUnanswered, isPartAnswered, questions, studentAnswerText, marksWord } from '../lib/exam';
import { formatDuration } from '../lib/time';
import { RichText } from './Math';
import { LogoMark, ClockIcon, AlertIcon, CheckIcon, ArrowRight, ArrowLeft, LockIcon, ShieldIcon } from './Icons';

interface ReviewViewProps {
  attempt: StoredAttempt;
  now: number;
  onEdit: (index: number) => void;
  onBackToExam: () => void;
  onSubmit: () => void;
  submitting: boolean;
}

export function ReviewView({ attempt, now, onEdit, onBackToExam, onSubmit, submitting }: ReviewViewProps) {
  const unanswered = countUnanswered(attempt.answers);
  const elapsed = Math.max(0, now - attempt.startedAt);
  const [openAll, setOpenAll] = useState(true);

  return (
    <div className="review-screen">
      <header className="exam-topbar">
        <div className="exam-topbar-inner">
          <div className="exam-brand">
            <LogoMark size={32} />
            <div className="brand-copy">
              <span className="brand-en brand-en-small" dir="ltr">ALGEBRA NEXUS</span>
              <span className="brand-ar">المراجعة النهائية</span>
            </div>
          </div>
          <div className="review-top-timer">
            <ClockIcon size={16} />
            <time dir="ltr" className="timer-digits">{formatDuration(elapsed)}</time>
            <span>المؤقّت ما زال يعمل</span>
          </div>
          <button type="button" className="btn btn-ghost btn-small" onClick={onBackToExam}>
            العودة للأسئلة
          </button>
        </div>
      </header>

      <main className="page-container review-page">
        <section className="review-hero">
          <div>
            <div className="eyebrow">
              <span className="eyebrow-line" aria-hidden="true" />
              FINAL REVIEW · قبل التسليم
            </div>
            <h1 className="review-title">راجع إجاباتك.<br /><span className="gradient-text">ثم سلّم بثقة.</span></h1>
            <p className="review-subtitle">
              هذه آخر محطة قبل التصحيح. يمكنك فتح أي سؤال وتعديل إجاباته. لا تُعرض هنا إجابات صحيحة ولا تصحيح.
            </p>
          </div>
          <div className="review-summary-card glass-card">
            <div className="review-summary-head">
              <span className="sidebar-icon"><ShieldIcon size={17} /></span>
              <span>جاهزية التسليم</span>
            </div>
            <div className={`readiness-count ${unanswered === 0 ? 'is-ready' : ''}`}>
              <strong dir="ltr">{15 - questions.filter((q) => q.subparts.every((p) => isPartAnswered(p, attempt.answers[p.id]))).length}</strong>
              <span>أسئلة تحتاج إكمالًا</span>
            </div>
            <div className="review-summary-row">
              <span>الاسم</span>
              <b>{attempt.studentName}</b>
            </div>
            <div className="review-summary-row">
              <span>الدرجة الكلية</span>
              <b dir="ltr">100</b>
            </div>
            <div className="review-summary-row">
              <span>الوقت المنقضي</span>
              <b dir="ltr">{formatDuration(elapsed)}</b>
            </div>
            {unanswered > 0 ? (
              <div className="unanswered-warning" role="status">
                <AlertIcon size={16} />
                <span>هناك <b dir="ltr">{unanswered}</b> أجزاء غير مجاب عنها. أكملها لتفعيل زر التسليم.</span>
              </div>
            ) : (
              <div className="ready-note" role="status">
                <CheckIcon size={16} />
                <span>جميع الأجزاء المطلوبة مكتملة. يمكنك التسليم الآن.</span>
              </div>
            )}
            <button
              type="button"
              className="btn btn-primary submit-final-btn"
              onClick={onSubmit}
              disabled={unanswered > 0 || submitting}
            >
              تسليم الاختبار
              <ArrowLeft size={18} />
            </button>
            <p className="submit-note">التسليم فوري: يُوقف المؤقّت ويُنشئ تقرير TXT ويبدأ تنزيله في النقرة نفسها.</p>
          </div>
        </section>

        <div className="review-toolbar">
          <div>
            <h2>إجاباتك حسب الأسئلة</h2>
            <p>الحالة هنا تعني «تمت الإجابة» أو «لم تكتمل»، ولا تكشف الصحة.</p>
          </div>
          <div className="review-toolbar-actions">
            <button type="button" className="btn btn-secondary btn-small" onClick={() => setOpenAll((v) => !v)}>
              {openAll ? 'طيّ جميع التفاصيل' : 'عرض جميع التفاصيل'}
            </button>
            <span className="review-unanswered-chip">
              <LockIcon size={13} />
              {unanswered} جزءًا متبقيًا
            </span>
          </div>
        </div>

        <div className="review-question-list">
          {questions.map((question, index) => {
            const answeredParts = question.subparts.filter((p) => isPartAnswered(p, attempt.answers[p.id])).length;
            const complete = answeredParts === question.subparts.length;
            return (
              <article className={`review-question ${complete ? 'is-complete' : ''}`} key={question.id}>
                <div className="review-question-head">
                  <div className="review-q-number" dir="ltr">{String(question.number).padStart(2, '0')}</div>
                  <div className="review-q-copy">
                    <h3>{question.title}</h3>
                    <p>{answeredParts} من {question.subparts.length} أجزاء مكتملة · {question.marks} {marksWord(question.marks)}</p>
                  </div>
                  <div className="review-q-actions">
                    <span className={`completion-chip ${complete ? 'done' : ''}`}>
                      {complete ? <CheckIcon size={13} /> : <span className="status-hollow" />}
                      {complete ? 'مكتمل' : 'بحاجة لإكمال'}
                    </span>
                    <button type="button" className="btn btn-ghost btn-small" onClick={() => onEdit(index)}>
                      تعديل
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
                {openAll && (
                  <div className="review-subparts">
                    {question.subparts.map((part) => {
                      const answered = isPartAnswered(part, attempt.answers[part.id]);
                      return (
                        <div className="review-subpart" key={part.id}>
                          <div className="review-subpart-head">
                            <span className="review-subpart-letter">{part.label}</span>
                            <span>{answered ? `تمت الإجابة · ${part.marks} ${marksWord(part.marks)}` : `بانتظار الإجابة · ${part.marks} ${marksWord(part.marks)}`}</span>
                          </div>
                          <div className={`review-answer-preview ${answered ? '' : 'is-empty'}`}>
                            {answered ? (
                              <div className={part.kind === 'order' ? 'order-answer-preview' : undefined} dir={part.kind === 'order' ? 'ltr' : undefined}>
                                <RichText as="div" text={studentAnswerText(part, attempt.answers[part.id])} />
                              </div>
                            ) : (
                              <span>لا توجد إجابة محفوظة لهذا الجزء.</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </article>
            );
          })}
        </div>

        <div className="review-final-bar">
          <div>
            <strong>هل راجعت جميع الأجزاء؟</strong>
            <span>لا توجد نافذة تأكيد إضافية. الضغط على «تسليم الاختبار» يعني التسليم النهائي.</span>
          </div>
          <button
            type="button"
            className="btn btn-primary"
            onClick={onSubmit}
            disabled={unanswered > 0 || submitting}
          >
            تسليم الاختبار
            <ArrowLeft size={18} />
          </button>
        </div>
      </main>
    </div>
  );
}
