import { ALL_SUBPARTS, QUESTION_MAP, TOTAL_MARKS, EXAM_TITLE, GRADE_LABEL } from "../exam/data";
import {
  answeredForQuestion,
  countAnswered,
  elapsedSeconds,
  formatDuration,
  marksLabel,
  unansweredSubparts,
} from "../exam/grade";
import type { AnswerValue, Attempt, Question } from "../exam/types";
import { BrandMark, Notice } from "./Chrome";
import { AnswerInput } from "./Inputs";
import { QuestionVisual } from "./Visuals";

interface ExamViewProps {
  attempt: Attempt;
  now: number;
  warning: string | null;
  autosaveOk: boolean;
  onAnswer: (subpartId: string, value: AnswerValue) => void;
  onNavigate: (index: number) => void;
  onReview: () => void;
}

function questionMarks(question: Question): number {
  return question.subparts.reduce((sum, part) => sum + part.marks, 0);
}

function IndexGrid({
  attempt,
  onNavigate,
}: {
  attempt: Attempt;
  onNavigate: (index: number) => void;
}) {
  return (
    <div className="index-grid" role="list" aria-label="فهرس الأسئلة الثلاثين">
      {attempt.questionOrder.map((id, index) => {
        const question = QUESTION_MAP[id];
        const isCurrent = index === attempt.currentIndex;
        const answeredAll = answeredForQuestion(question, attempt.answers) === question.subparts.length;
        const visited = attempt.visited.includes(id);
        const state = isCurrent ? "current" : answeredAll ? "done" : visited ? "visited" : "new";
        return (
          <button
            key={id}
            type="button"
            role="listitem"
            className={`index-cell index-${state}`}
            aria-current={isCurrent ? "true" : undefined}
            aria-label={`السؤال ${index + 1}${answeredAll ? "، مكتمل" : visited ? "، تمت زيارته" : ""}`}
            onClick={() => onNavigate(index)}
          >
            {index + 1}
          </button>
        );
      })}
    </div>
  );
}

export function ExamView({ attempt, now, warning, autosaveOk, onAnswer, onNavigate, onReview }: ExamViewProps) {
  const currentQuestion = QUESTION_MAP[attempt.questionOrder[attempt.currentIndex]];
  const answered = countAnswered(attempt.answers);
  const totalParts = ALL_SUBPARTS.length;
  const remaining = unansweredSubparts(attempt.answers).length;
  const percent = Math.round((answered / totalParts) * 100);
  const time = formatDuration(elapsedSeconds(attempt, now));
  const qMarks = questionMarks(currentQuestion);
  const answeredHere = answeredForQuestion(currentQuestion, attempt.answers);

  return (
    <div className="exam-page">
      <section className="hud" aria-label="لوحة معلومات الاختبار">
        <div className="hud-brand">
          <BrandMark />
          <div>
            <div className="hud-title">{EXAM_TITLE}</div>
            <div className="hud-subtitle">
              {GRADE_LABEL} · {attempt.studentName}
            </div>
          </div>
        </div>
        <div className="hud-stats">
          <div className="hud-box hud-timer">
            <span className="hud-label">الوقت</span>
            <bdi dir="ltr" className="timer-value">
              {time}
            </bdi>
            <span className="live-dot" aria-label="ساعة العد التصاعدي تعمل" />
          </div>
          <div className="hud-box">
            <span className="hud-label">السؤال</span>
            <span className="hud-value">
              <bdi dir="ltr">{attempt.currentIndex + 1} / 30</bdi>
            </span>
          </div>
          <div className="hud-box">
            <span className="hud-label">المجموع</span>
            <span className="hud-value">{TOTAL_MARKS} درجة</span>
          </div>
        </div>
      </section>

      <section className="progress-panel" aria-label="مؤشر التقدم">
        <div className="progress-topline">
          <span>
            تقدّم الإجابة: <b>{answered}</b> من <b>{totalParts}</b> جزءاً
          </span>
          <span className="progress-percent">{percent}%</span>
        </div>
        <div
          className="progress-track"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={totalParts}
          aria-valuenow={answered}
          aria-label="عدد الأجزاء المجابة"
        >
          <div className="progress-fill" style={{ width: `${percent}%` }}>
            <span className="progress-shine" aria-hidden="true" />
          </div>
        </div>
        <div className="progress-footer">
          <span className="status-dot done" aria-hidden="true" /> مُجاب
          <span className="status-dot current" aria-hidden="true" /> السؤال الحالي
          <span className="status-dot new" aria-hidden="true" /> لم يُجب بعد
          {remaining > 0 && <span className="remaining-text">متبقٍ {remaining} جزءاً</span>}
        </div>
      </section>

      {warning && <Notice tone="warning">{warning}</Notice>}

      <details className="mobile-index">
        <summary>فهرس الأسئلة · السؤال {attempt.currentIndex + 1} من 30</summary>
        <IndexGrid attempt={attempt} onNavigate={onNavigate} />
      </details>

      <div className="exam-layout">
        <aside className="exam-sidebar" aria-label="فهرس الأسئلة">
          <div className="sidebar-title">
            <span>فهرس الأسئلة</span>
            <span className="sidebar-count">30</span>
          </div>
          <IndexGrid attempt={attempt} onNavigate={onNavigate} />
          <div className="sidebar-legend">
            <span><i className="legend-swatch swatch-done" /> مُجاب</span>
            <span><i className="legend-swatch swatch-current" /> الحالي</span>
            <span><i className="legend-swatch swatch-new" /> لم يُجب</span>
          </div>
          <div className="sidebar-note">
            <span className="note-title">حفظ تلقائي</span>
            {autosaveOk
              ? "إجاباتك محفوظة على هذا الجهاز وتُستعاد عند إعادة فتح الصفحة."
              : "الحفظ التلقائي غير متاح في هذا المتصفح؛ لا تغلق الصفحة قبل التسليم."}
          </div>
        </aside>

        <main className="question-main">
          <article className="question-card" aria-labelledby={`question-title-${currentQuestion.id}`}>
            <div className="question-topline">
              <span className="question-number">السؤال {attempt.currentIndex + 1} من 30</span>
              <div className="question-meta">
                <span className="answered-pill">
                  أُجيب {answeredHere} / {currentQuestion.subparts.length}
                </span>
                <span className="marks-pill">{qMarks} درجة</span>
              </div>
            </div>
            <h2 className="question-title" id={`question-title-${currentQuestion.id}`}>
              {currentQuestion.title}
            </h2>
            <p className="question-stem">{currentQuestion.stem}</p>
            <QuestionVisual visual={currentQuestion.visual} />

            <div className="subparts">
              {currentQuestion.subparts.map((subpart, index) => (
                <section className="subpart" key={subpart.id} aria-labelledby={`${subpart.id}-prompt`}>
                  <div className="subpart-head">
                    <span className="part-index">الجزء {index + 1}</span>
                    <span className="part-marks">{marksLabel(subpart.marks)}</span>
                  </div>
                  <p className="subpart-prompt" id={`${subpart.id}-prompt`}>
                    {subpart.prompt}
                  </p>
                  <AnswerInput
                    sub={subpart}
                    value={attempt.answers[subpart.id] ?? null}
                    optionOrder={attempt.optionOrders[currentQuestion.id]}
                    onChange={(value) => onAnswer(subpart.id, value)}
                  />
                </section>
              ))}
            </div>
          </article>

          <nav className="exam-nav" aria-label="التنقل بين الأسئلة">
            <button
              type="button"
              className="button button-secondary"
              disabled={attempt.currentIndex === 0}
              onClick={() => onNavigate(attempt.currentIndex - 1)}
            >
              <span aria-hidden="true">→</span> السابق
            </button>
            <button
              type="button"
              className="button button-ghost"
              disabled={attempt.currentIndex === attempt.questionOrder.length - 1}
              onClick={() => onNavigate(attempt.currentIndex + 1)}
            >
              التالي <span aria-hidden="true">←</span>
            </button>
            <button type="button" className="button button-primary nav-review" onClick={onReview}>
              مراجعة الإجابات
            </button>
          </nav>
          <p className="nav-help">
            السؤال {attempt.currentIndex + 1} من 30 · لا يظهر تصحيح أو تلميح قبل التسليم النهائي.
          </p>
        </main>
      </div>
    </div>
  );
}
