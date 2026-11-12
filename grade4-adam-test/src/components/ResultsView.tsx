import { EXAM_TITLE, GRADE_LABEL, SUBJECT_LABEL, TOTAL_MARKS } from "../exam/data";
import { formatDuration, formatTimestamp, marksLabel, statusLabel } from "../exam/grade";
import type { SendStatus } from "../exam/submit";
import type { Attempt, GradeResult, GradeStatus } from "../exam/types";
import { Notice } from "./Chrome";

interface ResultsViewProps {
  attempt: Attempt;
  result: GradeResult;
  onBackup: () => void;
  onTryAgain: () => void;
  downloadStatus: "ok" | "failed" | null;
  downloadError: string | null;
  storageWarning: string | null;
  sendStatus: SendStatus;
  onResend: () => void;
}

function statusClass(status: GradeStatus): string {
  return `status-${status}`;
}

const SEND_TEXT: Record<Exclude<SendStatus, "idle">, string> = {
  sending: "جارٍ إرسال نتيجتك إلى معلّمك…",
  success: "تم إرسال نتيجتك إلى معلّمك ✓",
  failed: "تعذّر إرسال النتيجة تلقائيًا. حمّل ملف التقرير وأرسله لمعلّمك.",
};

/** Delivery of the result to the teacher, in the look of the notes already used on this page. */
function SendBanner({ status, onResend }: { status: SendStatus; onResend: () => void }) {
  if (status === "idle") return null;
  const look =
    status === "success" ? "download-note" : `notice ${status === "failed" ? "notice-warning" : "notice-info"}`;
  return (
    <div className={`${look} send-banner`} role="status" aria-live="polite" data-send-status={status}>
      {status === "success" ? (
        <span aria-hidden="true">▣</span>
      ) : (
        <span className="notice-icon" aria-hidden="true">
          {status === "failed" ? "!" : "i"}
        </span>
      )}
      <div className="send-banner-body">
        <p>{SEND_TEXT[status]}</p>
        {status === "failed" && (
          <button type="button" className="button button-mini" onClick={onResend}>
            إعادة إرسال النتيجة
          </button>
        )}
      </div>
    </div>
  );
}

export function ResultsView({
  attempt,
  result,
  onBackup,
  onTryAgain,
  downloadStatus,
  downloadError,
  storageWarning,
  sendStatus,
  onResend,
}: ResultsViewProps) {
  const correctMarks = result.subparts
    .filter((s) => s.status === "correct")
    .reduce((n, s) => n + s.awarded, 0);
  const partialMarks = result.subparts
    .filter((s) => s.status === "partial")
    .reduce((n, s) => n + s.awarded, 0);

  return (
    <div className="results-page">
      <section className="result-hero">
        <div className="result-trophy" aria-hidden="true">
          <span className="trophy-block" />
          <span className="trophy-gem">◆</span>
        </div>
        <div className="result-headline">
          <span className="eyebrow">تم التسليم بنجاح</span>
          <h1>{EXAM_TITLE}</h1>
          <p className="result-subline">
            {GRADE_LABEL} · {SUBJECT_LABEL} · الطالب: <strong>{attempt.studentName}</strong>
          </p>
          <p className="result-date" dir="rtl">
            بدء: <bdi dir="ltr">{formatTimestamp(attempt.startTime)}</bdi> · تسليم:{" "}
            <bdi dir="ltr">{formatTimestamp(attempt.submissionTime)}</bdi>
          </p>
        </div>
        <div className="score-panel">
          <div className="score-label">الدرجة النهائية</div>
          <div className="score-number">
            <span>{result.awarded}</span>
            <small>/ {TOTAL_MARKS}</small>
          </div>
          <div className="score-percent">{result.percentage}%</div>
          <div className="score-time">
            الوقت المستغرق <bdi dir="ltr">{formatDuration(attempt.durationSeconds ?? 0)}</bdi>
          </div>
        </div>
      </section>

      {storageWarning && <Notice tone="warning">{storageWarning}</Notice>}

      <SendBanner status={sendStatus} onResend={onResend} />

      {downloadStatus === "failed" && (
        <Notice tone="warning">
          {downloadError ?? "تعذّر تنزيل التقرير تلقائياً."} استخدم زر «تنزيل التقرير TXT» أدناه لتنزيل نسخة احتياطية.
        </Notice>
      )}
      {downloadStatus === "ok" && (
        <div className="download-note" role="status">
          <span aria-hidden="true">▣</span>
          بدأ تنزيل التقرير تلقائياً. يمكنك تنزيل النسخة الاحتياطية نفسها من الزر أدناه.
        </div>
      )}

      <section className="result-metrics" aria-label="ملخص التصحيح">
        <div className="metric metric-correct">
          <span className="metric-value">{result.counts.correct}</span>
          <span className="metric-label">جزء صحيح</span>
          <span className="metric-marks">{correctMarks} درجة</span>
        </div>
        <div className="metric metric-partial">
          <span className="metric-value">{result.counts.partial}</span>
          <span className="metric-label">جزء جزئي</span>
          <span className="metric-marks">{partialMarks} درجة</span>
        </div>
        <div className="metric metric-wrong">
          <span className="metric-value">{result.counts.incorrect}</span>
          <span className="metric-label">جزء خاطئ</span>
          <span className="metric-marks">0 درجة</span>
        </div>
        <div className="metric metric-unanswered">
          <span className="metric-value">{result.counts.unanswered}</span>
          <span className="metric-label">جزء غير مجاب</span>
          <span className="metric-marks">—</span>
        </div>
      </section>

      <section className="result-actions">
        <div>
          <h2>تقريرك جاهز</h2>
          <p className="muted">
            تقرير UTF-8 كامل يتضمن جميع الأسئلة والأجزاء والإجابات والدرجات والشروح ومراجع صفحات الكتاب للمعلم.
          </p>
        </div>
        <div className="result-action-buttons">
          <button type="button" className="button button-primary" onClick={onBackup}>
            تنزيل التقرير TXT
          </button>
          <button type="button" className="button button-ghost" onClick={onTryAgain}>
            المحاولة مرة أخرى
          </button>
        </div>
      </section>

      <section className="answer-review" aria-labelledby="answers-heading">
        <div className="review-heading-row">
          <div>
            <span className="eyebrow">المراجعة الكاملة</span>
            <h2 id="answers-heading">الإجابات والشروح</h2>
          </div>
          <div className="review-total">
            {result.subparts.length} جزءاً · {result.awarded} / {TOTAL_MARKS}
          </div>
        </div>

        {result.questions.map((qg, index) => (
          <article className="review-result-card" key={qg.question.id}>
            <header className="review-result-head">
              <div className="review-result-title">
                <span className="review-question-number">{index + 1}</span>
                <div>
                  <h3>{qg.question.title}</h3>
                  <p>{qg.question.stem}</p>
                </div>
              </div>
              <span className={`score-chip ${qg.awarded === qg.marks ? "score-full" : qg.awarded === 0 ? "score-zero" : "score-partial"}`}>
                {qg.awarded} / {qg.marks}
              </span>
            </header>
            <div className="review-parts">
              {qg.subparts.map((grade, partIndex) => (
                <div className={`review-part ${statusClass(grade.status)}`} key={grade.subpartId}>
                  <div className="review-part-head">
                    <span className="part-index">الجزء {partIndex + 1}</span>
                    <span className={`status-chip ${statusClass(grade.status)}`}>
                      {statusLabel(grade.status)}
                    </span>
                    <span className="part-score">
                      {grade.awarded} / {grade.marks} درجة
                    </span>
                  </div>
                  <p className="review-part-prompt">{grade.prompt}</p>
                  <div className="answer-compare">
                    <div className="answer-box">
                      <span className="answer-label">إجابتك</span>
                      <span className="answer-value" dir="auto">
                        {grade.studentAnswer}
                      </span>
                    </div>
                    <div className="answer-box answer-correct">
                      <span className="answer-label">الإجابة الصحيحة</span>
                      <span className="answer-value" dir="auto">
                        {grade.correctAnswer}
                      </span>
                    </div>
                  </div>
                  {grade.fields && grade.fields.length > 0 && (
                    <div className="field-grades">
                      {grade.fields.map((field) => (
                        <span key={field.label} className={field.isCorrect ? "field-ok" : "field-no"}>
                          {field.label}: {field.student || "—"} {field.isCorrect ? "✓" : "✕"}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="explanation-box">
                    <span className="answer-label">الشرح</span>
                    <p>{grade.explanation}</p>
                  </div>
                  <div className="review-part-foot">
                    <span>{marksLabel(grade.marks)}</span>
                    <span className="partial-rule-summary">{grade.partialRule}</span>
                  </div>
                </div>
              ))}
            </div>
          </article>
        ))}
      </section>

      <section className="result-final">
        <div>
          <h2>شكراً لإكمال الاختبار</h2>
          <p className="muted">
            تقريرك محفوظ محلياً على هذا الجهاز. يمكنك تنزيله مرة أخرى أو بدء محاولة جديدة باسم جديد.
          </p>
        </div>
        <div className="result-action-buttons">
          <button type="button" className="button button-primary" onClick={onBackup}>
            تنزيل التقرير TXT
          </button>
          <button type="button" className="button button-ghost" onClick={onTryAgain}>
            المحاولة مرة أخرى
          </button>
        </div>
      </section>
    </div>
  );
}
