import type { StoredAttempt } from '../lib/storage';
import type { AnswerValue, JustifyAnswer } from '../lib/exam';
import {
  questions,
  isPartAnswered,
  countUnanswered,
  DIFFICULTY_LABEL,
  marksWord,
} from '../lib/exam';
import type { SubQuestion } from '../data/types';
import { formatDuration } from '../lib/time';
import { RichText, MathTex } from './Math';
import {
  LogoMark,
  ClockIcon,
  CheckIcon,
  AlertIcon,
  ArrowLeft,
  ArrowRight,
  LockIcon,
} from './Icons';

interface ExamViewProps {
  attempt: StoredAttempt;
  now: number;
  onAnswer: (subId: string, value: AnswerValue) => void;
  onNavigate: (index: number) => void;
  onReview: () => void;
  saveState: 'saved' | 'error' | 'idle';
}

const OPTION_LETTERS = ['أ', 'ب', 'ج', 'د', 'هـ'];

export function ExamView({ attempt, now, onAnswer, onNavigate, onReview, saveState }: ExamViewProps) {
  const index = Math.min(Math.max(attempt.currentIndex, 0), questions.length - 1);
  const question = questions[index];
  const totalParts = questions.reduce((sum, q) => sum + q.subparts.length, 0);
  const unanswered = countUnanswered(attempt.answers);
  const answered = totalParts - unanswered;
  const progress = Math.round((answered / totalParts) * 100);
  const elapsed = Math.max(0, now - attempt.startedAt);

  return (
    <div className="exam-screen">
      <header className="exam-topbar">
        <div className="exam-topbar-inner">
          <div className="exam-brand">
            <LogoMark size={32} />
            <div className="brand-copy">
              <span className="brand-en brand-en-small" dir="ltr">ALGEBRA NEXUS</span>
              <span className="brand-ar">اختبار الجبر · الصف الثامن</span>
            </div>
          </div>
          <div className="exam-top-progress" aria-hidden="true">
            <div className="top-progress-meta">
              <span>السؤال {String(index + 1).padStart(2, '0')} / 15</span>
              <span>{answered} من {totalParts} جزءًا</span>
            </div>
            <div className="progress-track">
              <span className="progress-fill" style={{ width: `${Math.max(2, progress)}%` }} />
            </div>
          </div>
          <div className="exam-top-actions">
            <div className="timer-pill" title="مؤقّت تصاعدي">
              <ClockIcon size={16} />
              <time dir="ltr" className="timer-digits">{formatDuration(elapsed)}</time>
            </div>
            <span className={`save-indicator ${saveState === 'error' ? 'is-error' : ''}`} role="status">
              {saveState === 'error' ? <AlertIcon size={14} /> : <CheckIcon size={14} />}
              {saveState === 'error' ? 'تعذر الحفظ المحلي' : 'محفوظ محليًا'}
            </span>
            <button type="button" className="btn btn-ghost btn-small top-review-btn" onClick={onReview}>
              المراجعة
            </button>
          </div>
        </div>
        <div className="exam-student-bar">
          <span className="student-chip">
            <span className="student-avatar" aria-hidden="true">{attempt.studentName.trim().charAt(0)}</span>
            {attempt.studentName}
          </span>
          <span className="exam-student-note">
            <LockIcon size={13} />
            الإجابات محفوظة محليًا · لا تُكشف الصحة أثناء الاختبار
          </span>
        </div>
      </header>

      <div className="page-container exam-page">
        <ExamMobileStrip
          attempt={attempt}
          currentIndex={index}
          onNavigate={onNavigate}
          onReview={onReview}
        />

        <div className="exam-layout">
          <main className="question-main">
            <article className="question-card glass-card" key={question.id}>
              <div className="question-head">
                <div className="question-index-block">
                  <span className="question-index-label">QUESTION</span>
                  <span className="question-index-number" dir="ltr">{String(question.number).padStart(2, '0')}</span>
                </div>
                <div className="question-head-copy">
                  <div className="question-overline">
                    <span className="difficulty-chip">{DIFFICULTY_LABEL[question.difficulty]}</span>
                    <span className="marks-chip">{question.marks} {marksWord(question.marks)}</span>
                    <span className="required-chip">كل الأجزاء مطلوبة</span>
                  </div>
                  <h1 className="question-title">{question.title}</h1>
                  {question.context && <RichText as="p" className="question-context" text={question.context} />}
                </div>
              </div>

              <div className="subparts-list">
                {question.subparts.map((part) => (
                  <SubpartCard
                    key={part.id}
                    part={part}
                    answer={attempt.answers[part.id]}
                    optionOrder={attempt.optionOrder}
                    onAnswer={onAnswer}
                  />
                ))}
              </div>

              <div className="question-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => onNavigate(index - 1)}
                  disabled={index === 0}
                >
                  <ArrowRight size={17} />
                  السؤال السابق
                </button>
                <span className="question-footer-center">
                  تنتقل إجاباتك معك بين الأسئلة تلقائيًا
                </span>
                {index === questions.length - 1 ? (
                  <button type="button" className="btn btn-primary" onClick={onReview}>
                    مراجعة الإجابات
                    <ArrowLeft size={17} />
                  </button>
                ) : (
                  <button type="button" className="btn btn-primary" onClick={() => onNavigate(index + 1)}>
                    السؤال التالي
                    <ArrowLeft size={17} />
                  </button>
                )}
              </div>
            </article>
            <p className="keyboard-note">
              لا تُعرض الحلول أو التصحيح قبل التسليم. يمكنك تعديل أي إجابة في أي وقت قبل ذلك.
            </p>
          </main>

          <ExamSidebar
            attempt={attempt}
            currentIndex={index}
            unanswered={unanswered}
            answered={answered}
            totalParts={totalParts}
            elapsed={elapsed}
            onNavigate={onNavigate}
            onReview={onReview}
          />
        </div>
      </div>
    </div>
  );
}

function SubpartCard({
  part,
  answer,
  optionOrder,
  onAnswer,
}: {
  part: SubQuestion;
  answer: AnswerValue | undefined;
  optionOrder: Record<string, string[]>;
  onAnswer: (subId: string, value: AnswerValue) => void;
}) {
  const answered = isPartAnswered(part, answer);

  return (
    <section className={`subpart-card ${answered ? 'is-answered' : ''}`} aria-labelledby={`${part.id}-label`} data-subpart-id={part.id}>
      <div className="subpart-head">
        <div className="subpart-title-wrap">
          <span className="subpart-letter" aria-hidden="true">{part.label}</span>
          <div>
            <h2 id={`${part.id}-label`} className="subpart-prompt">
              <RichText as="span" text={part.prompt} />
            </h2>
            {part.helper && <RichText as="p" className="subpart-helper" text={part.helper} />}
          </div>
        </div>
        <div className="subpart-head-meta">
          <span className="subpart-marks">{part.marks} {marksWord(part.marks)}</span>
          <span className={`answer-status ${answered ? 'answered' : ''}`}>
            {answered ? <CheckIcon size={13} /> : <span className="status-hollow" aria-hidden="true" />}
            {answered ? 'تمت الإجابة' : 'بانتظار الإجابة'}
          </span>
        </div>
      </div>

      <div className="subpart-body">
        <SubpartInput part={part} answer={answer} optionOrder={optionOrder} onAnswer={onAnswer} />
      </div>
    </section>
  );
}

function SubpartInput({
  part,
  answer,
  optionOrder,
  onAnswer,
}: {
  part: SubQuestion;
  answer: AnswerValue | undefined;
  optionOrder: Record<string, string[]>;
  onAnswer: (subId: string, value: AnswerValue) => void;
}) {
  if (part.kind === 'rational') {
    const value = typeof answer === 'string' ? answer : '';
    return (
      <div className="rational-entry">
        <label htmlFor={`${part.id}-answer`}>الإجابة</label>
        <div className="input-shell">
          <input
            id={`${part.id}-answer`}
            type="text"
            inputMode="text"
            dir="ltr"
            autoComplete="off"
            spellCheck={false}
            className="answer-input"
            placeholder={part.placeholder ?? 'اكتب الناتج'}
            value={value}
            onChange={(event) => onAnswer(part.id, event.target.value)}
          />
          <span className="input-tail" dir="ltr">a/b</span>
        </div>
        <p className="input-hint">أدخل كسرًا مثل <span dir="ltr" className="inline-code">3/8</span> أو عددًا عشريًا مضبوطًا. تُقبل الصور المكافئة.</p>
      </div>
    );
  }

  if (part.kind === 'fields') {
    const values = answer && typeof answer === 'object' && !Array.isArray(answer) ? (answer as Record<string, string>) : {};
    return (
      <fieldset className="fields-entry">
        <legend className="sr-only">حقول الإجابة</legend>
        <div className="fields-grid">
          {(part.fields ?? []).map((field) => (
            <div className="field-box" key={field.id}>
              <label htmlFor={`${part.id}-${field.id}`}>
                <RichText as="span" text={field.label} />
              </label>
              <div className="field-input-row">
                <input
                  id={`${part.id}-${field.id}`}
                  type="text"
                  inputMode="text"
                  dir="ltr"
                  autoComplete="off"
                  spellCheck={false}
                  className="answer-input small-input"
                  placeholder={field.placeholder}
                  value={values[field.id] ?? ''}
                  onChange={(event) => onAnswer(part.id, { ...values, [field.id]: event.target.value })}
                />
                {field.suffix && <span className="field-suffix"><RichText as="span" text={field.suffix} /></span>}
              </div>
            </div>
          ))}
        </div>
      </fieldset>
    );
  }

  if (part.kind === 'mcq') {
    const selected = typeof answer === 'string' ? answer : '';
    const ids = optionOrder[part.id] ?? (part.options ?? []).map((o) => o.id);
    const ordered = ids.map((id) => part.options?.find((o) => o.id === id)).filter((o) => !!o);
    return (
      <div className="options-list" role="radiogroup" aria-label="اختر الإجابة الصحيحة">
        {ordered.map((option, optionIndex) => (
          <label className={`option-card ${selected === option!.id ? 'is-selected' : ''}`} key={option!.id}>
            <input
              type="radio"
              name={`mcq-${part.id}`}
              value={option!.id}
              checked={selected === option!.id}
              onChange={() => onAnswer(part.id, option!.id)}
            />
            <span className="option-letter" aria-hidden="true">{OPTION_LETTERS[optionIndex] ?? optionIndex + 1}</span>
            <span className="option-text"><RichText as="span" text={option!.text} /></span>
            <span className="option-check" aria-hidden="true"><CheckIcon size={13} /></span>
          </label>
        ))}
      </div>
    );
  }

  if (part.kind === 'justify') {
    const value = answer && typeof answer === 'object' && !Array.isArray(answer) ? (answer as JustifyAnswer) : {};
    const ids = optionOrder[part.id] ?? (part.reasons ?? []).map((o) => o.id);
    const orderedReasons = ids.map((id) => part.reasons?.find((o) => o.id === id)).filter((o) => !!o);
    return (
      <div className="justify-entry">
        <div className="statement-box">
          <span className="statement-label">العبارة</span>
          {part.statement && <RichText as="p" className="statement-text" text={part.statement} />}
        </div>
        <div className="verdict-row" role="radiogroup" aria-label="حدد حكمك على العبارة">
          <label className={`verdict-chip ${value.verdict === 'true' ? 'is-selected' : ''}`}>
            <input
              type="radio"
              name={`verdict-${part.id}`}
              checked={value.verdict === 'true'}
              onChange={() => onAnswer(part.id, { ...value, verdict: 'true' })}
            />
            <CheckIcon size={15} />
            موافق
          </label>
          <label className={`verdict-chip ${value.verdict === 'false' ? 'is-selected' : ''}`}>
            <input
              type="radio"
              name={`verdict-${part.id}`}
              checked={value.verdict === 'false'}
              onChange={() => onAnswer(part.id, { ...value, verdict: 'false' })}
            />
            <span className="cross-mark" aria-hidden="true">×</span>
            غير موافق
          </label>
        </div>
        <p className="reasons-label">التبرير الرياضي المطلوب</p>
        <div className="options-list reasons-list" role="radiogroup" aria-label="اختر التبرير الرياضي">
          {orderedReasons.map((reason, reasonIndex) => (
            <label className={`option-card ${value.reason === reason!.id ? 'is-selected' : ''}`} key={reason!.id}>
              <input
                type="radio"
                name={`reason-${part.id}`}
                value={reason!.id}
                checked={value.reason === reason!.id}
                onChange={() => onAnswer(part.id, { ...value, reason: reason!.id })}
              />
              <span className="option-letter" aria-hidden="true">{OPTION_LETTERS[reasonIndex] ?? reasonIndex + 1}</span>
              <span className="option-text"><RichText as="span" text={reason!.text} /></span>
              <span className="option-check" aria-hidden="true"><CheckIcon size={13} /></span>
            </label>
          ))}
        </div>
        {!value.verdict || !value.reason ? (
          <p className="input-hint">يلزم اختيار الحكم والتبرير معًا لاعتماد الجزء.</p>
        ) : null}
      </div>
    );
  }

  if (part.kind === 'order') {
    const chosen = Array.isArray(answer) ? (answer as string[]) : [];
    const displayIds = optionOrder[part.id] ?? (part.items ?? []).map((o) => o.id);
    const itemFor = (id: string) => part.items?.find((item) => item.id === id);
    return (
      <div className="order-entry">
        <div className="order-slots" aria-label="ترتيبك المختار">
          {[0, 1, 2].map((slot) => {
            const id = chosen[slot];
            const item = id ? itemFor(id) : undefined;
            return (
              <div className={`order-slot ${item ? 'is-filled' : ''}`} key={slot}>
                <span className="slot-index" dir="ltr">{slot + 1}</span>
                {item ? (
                  <button
                    type="button"
                    className="order-value"
                    onClick={() => onAnswer(part.id, chosen.filter((v) => v !== item.id))}
                    aria-label={`إزالة العنصر ${slot + 1}`}
                  >
                    <RichText as="span" text={item.text} />
                    <span className="remove-order" aria-hidden="true">×</span>
                  </button>
                ) : (
                  <span className="slot-empty">اختر العنصر التالي</span>
                )}
              </div>
            );
          })}
        </div>
        <div className="order-available">
          <span className="available-label">العناصر المتاحة</span>
          <div className="available-items">
            {displayIds.filter((id) => !chosen.includes(id)).map((id) => {
              const item = itemFor(id);
              if (!item) return null;
              return (
                <button
                  type="button"
                  key={id}
                  className="order-token"
                  data-item-id={id}
                  onClick={() => onAnswer(part.id, [...chosen, id])}
                  aria-label="أضف إلى الترتيب"
                >
                  <RichText as="span" text={item.text} />
                  <span className="add-order" aria-hidden="true">+</span>
                </button>
              );
            })}
          </div>
        </div>
        <div className="order-footer">
          <p className="input-hint">اضغط العناصر بالترتيب المطلوب. اضغط عنصرًا موضوعًا لإزالته.</p>
          {chosen.length > 0 && (
            <button type="button" className="text-button" onClick={() => onAnswer(part.id, [])}>
              إعادة الترتيب
            </button>
          )}
        </div>
      </div>
    );
  }

  return null;
}

function ExamSidebar({
  attempt,
  currentIndex,
  unanswered,
  answered,
  totalParts,
  elapsed,
  onNavigate,
  onReview,
}: {
  attempt: StoredAttempt;
  currentIndex: number;
  unanswered: number;
  answered: number;
  totalParts: number;
  elapsed: number;
  onNavigate: (index: number) => void;
  onReview: () => void;
}) {
  const progress = Math.round((answered / totalParts) * 100);
  return (
    <aside className="exam-sidebar" aria-label="لوحة التقدم والتنقل">
      <div className="sidebar-card timer-card">
        <div className="sidebar-card-head">
          <span className="sidebar-icon"><ClockIcon size={17} /></span>
          <span>الوقت المنقضي</span>
        </div>
        <div className="sidebar-timer" dir="ltr">{formatDuration(elapsed)}</div>
        <p className="sidebar-note">مؤقّت تصاعدي. يتوقف فقط عند التسليم النهائي.</p>
      </div>

      <div className="sidebar-card progress-card">
        <div className="progress-card-head">
          <span>إنجاز المحاولة</span>
          <strong>{progress}%</strong>
        </div>
        <div className="progress-track sidebar-progress">
          <span className="progress-fill" style={{ width: `${Math.max(2, progress)}%` }} />
        </div>
        <div className="progress-numbers">
          <span><b>{answered}</b> مجاب</span>
          <span><b>{unanswered}</b> متبقٍ</span>
        </div>
      </div>

      <div className="sidebar-card nav-card">
        <div className="sidebar-card-head">
          <span>خريطة الأسئلة</span>
          <span className="sidebar-count">{questions.length}</span>
        </div>
        <div className="question-grid">
          {questions.map((q, idx) => {
            const complete = q.subparts.every((p) => isPartAnswered(p, attempt.answers[p.id]));
            const started = q.subparts.some((p) => isPartAnswered(p, attempt.answers[p.id]));
            return (
              <button
                key={q.id}
                type="button"
                className={`question-grid-btn ${idx === currentIndex ? 'is-current' : ''} ${complete ? 'is-complete' : started ? 'is-started' : ''}`}
                onClick={() => onNavigate(idx)}
                aria-current={idx === currentIndex ? 'step' : undefined}
                aria-label={`السؤال ${q.number}: ${complete ? 'مكتمل' : started ? 'غير مكتمل' : 'لم يبدأ'}`}
              >
                <span dir="ltr">{String(q.number).padStart(2, '0')}</span>
                {complete ? <CheckIcon size={11} /> : <span className="grid-dot" aria-hidden="true" />}
              </button>
            );
          })}
        </div>
        <div className="nav-legend">
          <span><i className="legend-dot complete" /> مكتمل</span>
          <span><i className="legend-dot current" /> الحالي</span>
          <span><i className="legend-dot pending" /> غير مكتمل</span>
        </div>
        <button type="button" className="btn btn-sidebar" onClick={onReview}>
          مراجعة قبل التسليم
          <ArrowLeft size={16} />
        </button>
      </div>

      <div className="sidebar-quote">
        <MathTex tex={String.raw`\frac{a}{b}\times\frac{c}{d}=\frac{ac}{bd}`} block />
        <p>الدقة في كل خطوة... والنتيجة صورة كاملة.</p>
      </div>
    </aside>
  );
}

function ExamMobileStrip({
  attempt,
  currentIndex,
  onNavigate,
  onReview,
}: {
  attempt: StoredAttempt;
  currentIndex: number;
  onNavigate: (index: number) => void;
  onReview: () => void;
}) {
  return (
    <div className="mobile-question-strip">
      <div className="mobile-strip-scroll" aria-label="التنقل بين الأسئلة">
        {questions.map((q, idx) => {
          const complete = q.subparts.every((p) => isPartAnswered(p, attempt.answers[p.id]));
          return (
            <button
              key={q.id}
              type="button"
              className={`mobile-q-btn ${idx === currentIndex ? 'is-current' : ''} ${complete ? 'is-complete' : ''}`}
              onClick={() => onNavigate(idx)}
              aria-label={`السؤال ${q.number}${complete ? ' مكتمل' : ''}`}
              aria-current={idx === currentIndex ? 'step' : undefined}
            >
              {String(q.number).padStart(2, '0')}
            </button>
          );
        })}
      </div>
      <button type="button" className="mobile-review-btn" onClick={onReview}>
        المراجعة
        <ArrowLeft size={14} />
      </button>
    </div>
  );
}
