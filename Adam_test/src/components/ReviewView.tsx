import { QUESTION_MAP } from "../exam/data";
import {
  answeredForQuestion,
  elapsedSeconds,
  formatDuration,
  unansweredSubparts,
} from "../exam/grade";
import type { Attempt } from "../exam/types";
import { Notice } from "./Chrome";

interface ReviewViewProps {
  attempt: Attempt;
  now: number;
  warning: string | null;
  submitError: string | null;
  onBack: () => void;
  onJump: (index: number) => void;
  onSubmit: () => void;
}

export function ReviewView({ attempt, now, warning, submitError, onBack, onJump, onSubmit }: ReviewViewProps) {
  const unanswered = unansweredSubparts(attempt.answers);
  const complete = unanswered.length === 0;
  return (
    <div className="review-page">
      <section className="page-heading">
        <div>
          <span className="eyebrow">قبل التسليم</span>
          <h1>مراجعة الإجابات</h1>
          <p className="muted">
            راجع الأسئلة والأجزاء التي لم تُجب عنها بعد. لن تظهر أي إجابات أو ملاحظات تصحيح قبل التسليم.
          </p>
        </div>
        <div className="review-timer">
          <span>الوقت الحالي</span>
          <bdi dir="ltr">{formatDuration(elapsedSeconds(attempt, now))}</bdi>
        </div>
      </section>

      {warning && <Notice tone="warning">{warning}</Notice>}
      {submitError && <Notice tone="warning">{submitError}</Notice>}

      <div className={`completion-banner ${complete ? "is-complete" : ""}`}>
        <div className="completion-block">
          <span className="completion-label">الأجزاء غير المجابة المتبقية</span>
          <strong className="completion-count">{unanswered.length}</strong>
        </div>
        <div className="completion-copy">
          {complete
            ? "جميع الأجزاء المطلوبة مكتملة. يمكنك الآن تسليم الاختبار."
            : "أكمل جميع الأجزاء المطلوبة حتى يصبح زر التسليم متاحاً. اضغط على السؤال للعودة إليه."}
        </div>
      </div>

      <div className="review-grid">
        <section className="card review-list-card">
          <div className="card-heading-row">
            <h2 className="card-title">الأسئلة</h2>
            <span className="muted small">{attempt.questionOrder.length} سؤالاً</span>
          </div>
          <div className="review-question-list">
            {attempt.questionOrder.map((id, index) => {
              const question = QUESTION_MAP[id];
              const done = answeredForQuestion(question, attempt.answers);
              const total = question.subparts.length;
              const isComplete = done === total;
              return (
                <div className={`review-question-row ${isComplete ? "is-done" : ""}`} key={id}>
                  <span className="review-question-number">{index + 1}</span>
                  <div className="review-question-text">
                    <strong>{question.title}</strong>
                    <span>
                      {isComplete ? "مكتمل" : `أُجيب ${done} من ${total}`}
                    </span>
                  </div>
                  <button type="button" className="button button-mini" onClick={() => onJump(index)}>
                    {isComplete ? "مراجعة" : "أكمل الآن"}
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        <aside className="review-side">
          <div className="card review-submit-card">
            <div className="submit-gem" aria-hidden="true" />
            <h2 className="card-title">تسليم نهائي</h2>
            <p className="muted">
              عند الضغط على زر التسليم تُثبّت الإجابات وتُصحح فوراً، ويُبدأ تنزيل تقرير TXT محلي.
            </p>
            <div className="submit-summary">
              <div>
                <span>الأجزاء المكتملة</span>
                <strong>{attempt.questionOrder.reduce((n, id) => n + answeredForQuestion(QUESTION_MAP[id], attempt.answers), 0)}</strong>
              </div>
              <div>
                <span>المتبقي</span>
                <strong>{unanswered.length}</strong>
              </div>
            </div>
            <button
              type="button"
              className="button button-submit"
              disabled={!complete}
              aria-disabled={!complete}
              onClick={onSubmit}
            >
              تسليم الاختبار
            </button>
            {!complete && (
              <p className="submit-lock-note">
                يبقى زر التسليم معطّلاً حتى تُجيب عن جميع الأجزاء المطلوبة.
              </p>
            )}
            <button type="button" className="button button-ghost button-wide" onClick={onBack}>
              العودة إلى الأسئلة
            </button>
          </div>
          <div className="card mini-rules">
            <h3>قبل أن تسلّم</h3>
            <ul>
              <li>تأكد من مراجعة إجاباتك النهائية؛ لا توجد مهلة انتهاء تنازلي.</li>
              <li>يُحفظ التقرير على جهازك بصيغة TXT، ولا يُرسل إلى أي خدمة خارجية.</li>
              <li>بعد التسليم تظهر النتيجة والمراجعة الكاملة، ويبقى التقرير قابلاً للتنزيل.</li>
            </ul>
          </div>
        </aside>
      </div>

    </div>
  );
}
