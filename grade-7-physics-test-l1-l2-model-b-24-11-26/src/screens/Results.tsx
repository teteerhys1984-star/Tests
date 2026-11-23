/**
 * صفحة النتيجة — نفس تصميم المصدر: حاجز النتيجة مع الذاكرة الدائرية، ملخص، مراجعة
 * تفصيلية ببطاقات التبديل، مع إضافات تفاعلية (ملخص الفروع، توزيع الدرسين، حالة
 * الإرسال والتنزيلات) مصمَّمة بنفس الهوية. لا يُعرض أي إجابة فيها قبل التسليم.
 */

import { useMemo, useState, type CSSProperties } from "react";
import { ChevronDown, Download, RotateCcw } from "lucide-react";
import { CONTACT, GRADE_LABEL, SEMESTER_LABEL, SUBJECT_LABEL, TOTAL_MARKS } from "../config";
import type { Question } from "../exam/types";
import type { ExamResult, Responses } from "../lib/grading";
import { lessonOverlap, lessonTotals, partLetter, partStatus, STATUS_AR } from "../lib/grading";
import { Rich, MathText } from "../lib/mathx";
import { reportFilename, summarize, triggerDownload, gradeLabel, type AttemptMeta } from "../lib/report";
import type { SendStatus } from "../exam/submit";
import { formatDuration, formatLong, num, pct } from "../lib/time";
import { Figure } from "../exam/figures";

const SEND_TEXT: Record<Exclude<SendStatus, "idle">, string> = {
  sending: "جارٍ إرسال نتيجتك إلى معلّمك…",
  success: "تم إرسال نتيجتك إلى معلّمك ✓",
  failed: "تعذّر إرسال النتيجة تلقائياً. حُمِّلت النتيجة محلياً وستُعاد المحاولة عند فتح الاختبار، ويمكنك إعادة إرسالها الآن أو تسليم ملف التقرير لمعلّمك.",
};

export function Results({
  meta,
  questions,
  answers,
  result,
  reportText,
  autoDownloaded,
  sendStatus,
  onResend,
  onRetry,
  onTeacher,
}: {
  meta: AttemptMeta;
  questions: Question[];
  answers: Responses;
  result: ExamResult;
  reportText: string;
  autoDownloaded: boolean | null;
  sendStatus: SendStatus;
  onResend: () => void;
  onRetry: () => void;
  onTeacher: () => void;
}) {
  const summary = useMemo(() => summarize(questions, answers, result), [questions, answers, result]);
  const filename = reportFilename(meta.studentName);
  const download = () => triggerDownload(reportText, filename);

  const lessons = useMemo(() => lessonTotals(questions, result), [questions, result]);
  const overlap = useMemo(() => lessonOverlap(questions, result), [questions, result]);

  const percentage = summary.percentage;
  const circle = 2 * Math.PI * 86;
  const resultGrade = gradeLabel(percentage);

  const [open, setOpen] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(questions.map((question) => [question.id, true])),
  );
  const allOpen = questions.every((question) => open[question.id] !== false);

  return (
    <main className="results-page page-container">
      <section className="results-hero" aria-labelledby="results-title">
        <div className="results-copy">
          <div className="eyebrow"><span className="eyebrow-line" /> النتيجة <span className="eyebrow-separator">/</span> النموذج B</div>
          <h1 id="results-title">انتهت المحاولة، <span>{meta.studentName}</span></h1>
          <p>
            {GRADE_LABEL} · {SEMESTER_LABEL} · {SUBJECT_LABEL} · مجموع {num(TOTAL_MARKS)} علامة. راجعي التصحيح التفصيلي
            لتري خطوات كل إجابة.
          </p>

          <div className="results-actions-row">
            <button type="button" className="primary-button" onClick={download} data-action="download-report">
              <Download size={18} aria-hidden="true" /> تنزيل تقرير TXT
            </button>
            <button type="button" className="outline-button" onClick={onRetry} data-action="retry-exam">
              <RotateCcw size={17} aria-hidden="true" /> محاولة جديدة
            </button>
            <button type="button" className="secondary-button" onClick={onTeacher}>
              دليل المعلّم
            </button>
          </div>

          {sendStatus !== "idle" && (
            <div className="send-status" role="status" aria-live="polite" data-send-status={sendStatus}>
              <p className="send-status-text">{SEND_TEXT[sendStatus]}</p>
              {sendStatus === "failed" && (
                <button type="button" className="outline-button" style={{ minHeight: 38, padding: "7px 15px" }} onClick={onResend} data-action="resend-result">
                  إعادة إرسال النتيجة
                </button>
              )}
            </div>
          )}

          <div className={`download-note ${autoDownloaded ? "is-ok" : "is-blocked"}`} role="status" aria-live="polite">
            {autoDownloaded ? (
              <p>
                <strong>✓ بدأ تنزيل التقرير تلقائياً</strong> باسم <span dir="ltr" className="font-mono">{filename}</span>. إن لم
                يظهر الملف فراجعي مجلد التنزيلات أو استخدمي الزر الاحتياطي.
              </p>
            ) : (
              <p>
                <strong>! منع المتصفح التنزيل التلقائي</strong> — استخدمي زر «تنزيل التقرير TXT» أعلاه لتنزيل الملف نفسه.
              </p>
            )}
          </div>
        </div>

        <div className="score-visual" aria-label={`العلامة ${result.total} من ${result.possible}، النسبة ${percentage} بالمئة`}>
          <svg viewBox="0 0 210 210" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
            <circle cx="105" cy="105" r="86" fill="none" stroke="#eadce9" strokeWidth="8" />
            <circle
              cx="105" cy="105" r="86" fill="none" stroke="#bd6a9f" strokeWidth="8" strokeLinecap="round"
              strokeDasharray={circle}
              strokeDashoffset={circle * (1 - percentage / 100)}
              className="score-arc"
              style={{ "--circle-full": circle, "--circle-target": circle * (1 - percentage / 100) } as CSSProperties}
            />
          </svg>
          <div className="score-visual-text">
            <span className="score-number" dir="ltr">{num(result.total)}<small>/{num(result.possible)}</small></span>
            <span className="score-percent">النسبة: {pct(percentage)}</span>
          </div>
        </div>
      </section>

      <div className="result-facts" aria-label="ملخص النتيجة">
        <div><span>الوقت المستغرق</span><strong dir="ltr">{formatDuration(meta.elapsedMs)}</strong></div>
        <div><span>الإجابات الصحيحة</span><strong>{num(summary.correctSubparts)}</strong></div>
        <div><span>الإجابات الخاطئة أو الجزئية</span><strong>{num(result.questions.flatMap((question) => question.parts).filter((part) => part.earned < part.possible).length)}</strong></div>
        <div><span>التقدير</span><strong>{resultGrade}</strong></div>
      </div>
      <p className="result-clarifier">
        التقدير يُعطى من النسبة المئوية للمقارنة فقط، بحسب سلّم {GRADE_LABEL} المطبوع في دليل المعلّم.
      </p>

      {/* ===== ملخّص النتيجة (إضافة تفاعلية) ===== */}
      <section className="results-summary-block" aria-labelledby="summary-title">
        <div className="results-summary-head">
          <h2 id="summary-title">ملخّص النتيجة</h2>
          <span className="result-opens"><button type="button" onClick={() => setOpen(Object.fromEntries(questions.map((q) => [q.id, !allOpen])))}>{allOpen ? "طيّ كل الأسئلة" : "فتح كل الأسئلة"}</button></span>
        </div>

        <div className="results-summary">
          <div className="results-stat"><strong dir="ltr">{num(summary.fullQuestions)}</strong><span>أسئلة صحيحة بالكامل</span></div>
          <div className="results-stat"><strong dir="ltr">{num(summary.partialQuestions)}</strong><span>أسئلة صحيحة جزئياً</span></div>
          <div className="results-stat"><strong dir="ltr">{num(summary.wrongQuestions)}</strong><span>أسئلة خاطئة</span></div>
          <div className="results-stat"><strong dir="ltr">{num(summary.unansweredSubparts)}</strong><span>فروع لم يُجب عنها</span></div>
          <div className="results-stat"><strong dir="ltr">{num(summary.correctSubparts)}</strong><span>فروع صحيحة</span></div>
          <div className="results-stat"><strong dir="ltr">{num(summary.partialSubparts)}</strong><span>فروع بعلامة جزئية</span></div>
        </div>

        <div className="results-facts-band">
          <div><span>بداية الاختبار</span><strong>{formatLong(meta.startAt)}</strong></div>
          <div><span>تسليم الاختبار</span><strong>{formatLong(meta.submitAt)}</strong></div>
          <div><span>المدة المنقضية</span><strong>{formatDuration(meta.elapsedMs)}</strong></div>
        </div>

        <div className="lesson-breakdown" data-lesson-breakdown>
          <p className="lesson-breakdown-title">توزيع العلامات على الدرسين (درسان فقط)</p>
          <ul className="lesson-breakdown-list">
            {lessons.map((row) => (
              <li className="lesson-row" key={row.lesson} data-lesson={row.lesson}>
                <span className="lesson-row-name">
                  {row.lesson}
                  <small>({num(row.questions)} أسئلة)</small>
                </span>
                <span className="lesson-row-marks">
                  {row.sharedQuestions > 0 && (
                    <span className="lesson-pill is-shared" title="حصّة السؤال التركيبي المضافة إلى هذا الدرس">
                      منها تركيبي: {num(row.sharedEarned)}/{num(row.sharedPossible)}
                    </span>
                  )}
                  <span className="lesson-pill is-total">{num(row.earned)}/{num(row.possible)}</span>
                </span>
              </li>
            ))}
          </ul>
          <p className="lesson-overlap-note">
            مجموع الدرسين أعلاه <strong>{num(overlap.possible)}</strong> علامة وليس <strong>{num(overlap.examPossible)}</strong>:
            السؤال التركيبي (السؤال {num(questions.length)}) يُحتسب في الدرسين معاً، فتظهر علاماته ({num(overlap.sharedPossible)}) مرتين.{" "}
            <strong>لا تُجمع الدرجات أعلاه</strong>؛ علامتك النهائية هي <strong>{num(summary.total)} / {num(summary.max)}</strong> ونسبتك <strong>{pct(summary.percentage)}</strong>.
          </p>
        </div>
      </section>

      {/* ===== المراجعة التفصيلية ===== */}
      <section className="review-section" aria-labelledby="review-title">
        <div className="review-heading">
          <span className="section-eyebrow">التصحيح التفصيلي</span>
          <h2 id="review-title">راجعي إجاباتك خطوة بخطوة</h2>
        </div>
        <div className="review-list">
          {questions.map((question, index) => {
            const graded = result.questions[index];
            const isOpen = open[question.id] !== false;
            return (
              <details className="review-question" key={question.id} data-result-question={question.id} open={isOpen}>
                <summary onClick={(event) => {
                  event.preventDefault();
                  setOpen((state) => ({ ...state, [question.id]: !isOpen }));
                }}>
                  <span className="review-index">{num(index + 1)}</span>
                  <span className="review-summary-name">
                    {question.title}
                    <small>{question.lesson} · {question.pages}</small>
                  </span>
                  <strong dir="ltr">{num(graded.earned)} / {num(graded.possible)}</strong>
                  <ChevronDown size={19} aria-hidden="true" className="review-chevron" />
                </summary>
                <div className="review-body">
                  <p className="review-context"><Rich content={question.intro} /></p>
                  {question.figure && <figure className="review-figure"><Figure type={question.figure} /></figure>}
                  {question.parts.map((part, partIndex) => {
                    const branch = graded.parts[partIndex];
                    const status = partStatus(branch.earned, branch.possible);
                    const style = STATUS_AR[status];
                    const chosen = part.options?.find((option) => option.id === branch.response);
                    return (
                      <div className="review-branch" key={part.id} data-result-part={part.id} data-part-earned={branch.earned} data-part-possible={branch.possible}>
                        <div className="review-branch-heading">
                          <h3>{partLetter(partIndex)}. <Rich content={part.label} /></h3>
                          <span className={branch.earned === branch.possible ? "full-mark" : "partial-mark"}>
                            {num(branch.earned)} / {num(branch.possible)} · {style}
                          </span>
                        </div>
                        <div className="answer-comparison">
                          <div>
                            <span>إجابتك</span>
                            <strong>
                              {chosen?.latex ? <MathText tex={chosen.latex} /> : (branch.response.trim() || "لم تُجب")}
                            </strong>
                          </div>
                          <div>
                            <span>الإجابة الصحيحة</span>
                            <strong><Rich content={branch.correct} /></strong>
                          </div>
                        </div>
                        <p className="branch-explanation"><Rich content={branch.explanation} /></p>
                      </div>
                    );
                  })}
                  <div className="full-solution">
                    <span>خطوات الحل والتفسير</span>
                    <p><Rich content={graded.solution} /></p>
                  </div>
                  {question.figureSource && (
                    <p className="review-reference">المرجع: {question.lesson}، {question.pages} · المهارة: {question.skill} · مرجع الرسم: {question.figureSource}</p>
                  )}
                  {!question.figureSource && (
                    <p className="review-reference">المرجع: {question.lesson}، {question.pages} · المهارة: {question.skill}</p>
                  )}
                </div>
              </details>
            );
          })}
        </div>
      </section>

      <section className="results-contact" aria-label="جهة الاتصال">
        <p className="font-bold" style={{ color: "#4e3f5a" }}>
          {CONTACT.name}: <span dir="ltr" style={{ fontVariantNumeric: "tabular-nums" }}>{CONTACT.phone}</span>
          {" · "}
          <a href={CONTACT.whatsapp} target="_blank" rel="noopener noreferrer" className="underline" style={{ color: "#2f7d78" }}>
            واتساب
          </a>
        </p>
        <p className="results-contact-note">التقرير مُنشأ داخل متصفحك بصيغة TXT، وتُرسَل نسخة من نتيجتك وإجاباتك إلى معلّمك عند التسليم.</p>
      </section>
    </main>
  );
}
