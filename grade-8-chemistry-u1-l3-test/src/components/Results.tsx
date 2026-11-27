import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  Check,
  CheckCircle2,
  Clock3,
  Download,
  FileText,
  Loader2,
  RefreshCw,
  RotateCcw,
  X,
} from 'lucide-react';
import { EXAM_TITLE, LESSON_TITLE } from '../data/exam';
import { downloadReport } from '../lib/report';
import { formatDuration } from '../lib/session';
import type { SendStatus } from '../lib/submit';
import type { Attempt, ExamResult, PartResult } from '../lib/types';
import { ScientificText } from './Chem';
import { ProgressRing, QuestionIcon } from './Layout';

function AnswerList({ text }: { text: string }) {
  const items = text.split('؛ ');
  return items.length > 1 ? (
    <ul>
      {items.map((item, i) => (
        <li key={i}>
          <ScientificText text={item} />
        </li>
      ))}
    </ul>
  ) : (
    <ScientificText text={text} />
  );
}

function ResultPart({ result }: { result: PartResult }) {
  const full = result.earned === result.available;
  const partial = result.earned > 0 && !full;
  const Icon = full ? CheckCircle2 : partial ? AlertCircle : X;
  return (
    <article className={`result-part ${full ? 'correct' : partial ? 'partial' : 'incorrect'}`}>
      <div className="result-part-heading">
        <span className="result-status-icon">
          <Icon size={18} />
        </span>
        <h4>
          {result.part.label}. {result.part.title}
        </h4>
        <span className="result-mark">
          {result.earned} <small>/ {result.available}</small>
        </span>
      </div>
      <p className="result-prompt">
        <ScientificText text={result.part.prompt} />
      </p>
      <div className="answer-comparison">
        <div className="student-answer">
          <h5>إجابتك</h5>
          <AnswerList text={result.studentText} />
        </div>
        <div className="correct-answer">
          <h5>
            <Check size={14} />
            الإجابة الصحيحة
          </h5>
          <AnswerList text={result.correctText} />
        </div>
      </div>
      {!!result.diagnosis.length && (
        <div className="result-diagnosis">
          <AlertCircle size={17} />
          <div>
            <strong>أين وقعت الملاحظة؟</strong>
            {result.diagnosis.map((note, i) => (
              <p key={i}>
                <ScientificText text={note} />
              </p>
            ))}
          </div>
        </div>
      )}
      <div className="result-explanation">
        <h5>التفسير العلمي</h5>
        <p>
          <ScientificText text={result.part.explanation} />
        </p>
      </div>
      <div className="rubric">
        <h5>معايير التصحيح</h5>
        {result.criteria.map((c, i) => (
          <div className="rubric-row" key={i}>
            <span className={c.correct ? 'criterion-correct' : 'criterion-incorrect'}>
              {c.correct ? <Check size={14} /> : <X size={14} />}
            </span>
            <span>
              <ScientificText text={c.label} />
            </span>
            <b dir="ltr">
              {c.earned} / {c.available}
            </b>
          </div>
        ))}
        <ul className="rubric-notes">
          {result.part.rubric.map((line, i) => (
            <li key={i}>
              <ScientificText text={line} />
            </li>
          ))}
        </ul>
      </div>
      <div className="curriculum-reference">
        <BookOpen size={13} />
        <span>
          الكتاب المدرسي، ص{result.part.reference.pages.join('، ')} · {result.part.reference.item}
        </span>
      </div>
    </article>
  );
}

export function Results({
  attempt,
  result,
  onNew,
  sendStatus,
  onRetrySend,
}: {
  attempt: Attempt;
  result: ExamResult;
  onNew: () => void;
  sendStatus: SendStatus;
  onRetrySend: () => void;
}) {
  const message =
    result.percentage >= 90
      ? 'فهم راسخ، وعمل متقن.'
      : result.percentage >= 75
        ? 'فهم جيد؛ مراجعة صغيرة تصنع فرقًا.'
        : result.percentage >= 50
          ? 'خطوة جيدة؛ راجع مواضع الخطأ وواصل التعلّم.'
          : 'فرصة جديدة للتعلّم؛ راجع الدرس ثم حاول مجددًا.';

  return (
    <main className="results-page page-container">
      <section className="results-hero">
        <div className="results-copy">
          <span className="result-eyebrow">
            <CheckCircle2 size={16} />
            اكتمل الاختبار
          </span>
          <h2>{attempt.studentName}</h2>
          <p>{message}</p>
          <span className="results-lesson">{LESSON_TITLE} · الوحدة الأولى</span>
          <div className="result-meta">
            <span>
              <Clock3 size={16} />
              الوقت المستغرق <b dir="ltr">{formatDuration(attempt.elapsedMs)}</b>
            </span>
            <span>
              <FileText size={16} />
              {new Intl.DateTimeFormat('ar', {
                calendar: 'gregory',
                numberingSystem: 'latn',
                dateStyle: 'medium',
                timeStyle: 'short',
              }).format(new Date(attempt.submittedAt!))}
            </span>
          </div>
          <div className="result-actions">
            <button className="button button-primary" onClick={() => downloadReport(attempt, result)}>
              <Download size={18} />
              تحميل التقرير
            </button>
            <button className="button button-secondary" onClick={onNew}>
              <RotateCcw size={16} />
              محاولة جديدة
            </button>
          </div>
          <div className={`delivery-banner is-${sendStatus}`} role="status" aria-live="polite">
            <span className="delivery-icon">
              {sendStatus === 'sending' ? (
                <Loader2 size={16} className="spin" />
              ) : sendStatus === 'success' ? (
                <CheckCircle2 size={16} />
              ) : (
                <AlertCircle size={16} />
              )}
            </span>
            <span className="delivery-text">
              {sendStatus === 'sending'
                ? 'جارٍ إرسال النتيجة إلى سجلّ المعلّم…'
                : sendStatus === 'success'
                  ? 'تم إرسال النتيجة وحفظها في سجلّ المعلّم بنجاح.'
                  : sendStatus === 'failed'
                    ? 'تعذّر إرسال النتيجة الآن؛ حُفظت محليًا وستُعاد المحاولة لاحقًا، ويمكنك تحميل التقرير مباشرة.'
                    : 'النتيجة محفوظة محليًا ويمكنك إرسالها الآن أو تحميل التقرير.'}
            </span>
            {sendStatus !== 'sending' && sendStatus !== 'success' && (
              <button type="button" className="button button-secondary delivery-retry" onClick={onRetrySend}>
                <RefreshCw size={14} />
                إعادة إرسال النتيجة
              </button>
            )}
          </div>
        </div>
        <div className="score-panel">
          <ProgressRing value={result.percentage} className="score-ring">
            <span>العلامة النهائية</span>
            <strong dir="ltr">
              {result.earned}
              <small> / 100</small>
            </strong>
            <b dir="ltr">{result.percentage}%</b>
          </ProgressRing>
          <span>تقرير مفصّل، خطوةً بخطوة</span>
        </div>
      </section>
      <section className="question-score-summary">
        <div className="section-heading">
          <div>
            <span className="section-kicker">نظرة على أدائك</span>
            <h3>العلامات بحسب السؤال</h3>
          </div>
          <span className="section-note">المجموع 100 علامة</span>
        </div>
        <div className="score-table" role="table" aria-label="علامات الأسئلة">
          {result.questions.map(q => (
            <div className="score-table-row" role="row" key={q.question.id}>
              <span className="score-question-icon">
                <QuestionIcon type={q.question.icon} size={18} />
              </span>
              <span className="score-question-title" role="cell">
                <small>السؤال {q.question.number}</small>
                {q.question.title}
              </span>
              <div className="score-bar" aria-hidden="true">
                <span style={{ width: `${(q.earned / q.available) * 100}%` }} />
              </div>
              <strong role="cell" dir="ltr">
                {q.earned} <small>/ {q.available}</small>
              </strong>
            </div>
          ))}
        </div>
      </section>
      <section className="detailed-report">
        <div className="section-heading">
          <div>
            <span className="section-kicker">افهم كل علامة</span>
            <h3>التقرير التفصيلي</h3>
          </div>
          <span className="report-local-note">إجاباتك، التصحيح، ومعايير احتساب العلامات</span>
        </div>
        {result.questions.map(q => (
          <details className="result-question" key={q.question.id} open>
            <summary>
              <span className="result-question-number">0{q.question.number}</span>
              <QuestionIcon type={q.question.icon} size={20} />
              <h3>{q.question.title}</h3>
              <span className="result-question-mark" dir="ltr">
                {q.earned} / {q.available}
              </span>
              <ArrowLeft size={16} className="details-chevron" />
            </summary>
            <div className="result-question-body">
              {q.parts.map(p => (
                <ResultPart key={p.part.id} result={p} />
              ))}
            </div>
          </details>
        ))}
      </section>
      <div className="results-bottom">
        <p>
          <CheckCircle2 size={16} />
          يحتوي التقرير النصي على جميع الإجابات والتفسيرات وعلامات كل جزء.
        </p>
        <button className="button button-primary" onClick={() => downloadReport(attempt, result)}>
          <Download size={17} />
          تحميل التقرير
        </button>
      </div>
      <span className="sr-only">{EXAM_TITLE}</span>
    </main>
  );
}
