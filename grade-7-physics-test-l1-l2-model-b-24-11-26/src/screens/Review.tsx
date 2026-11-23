/**
 * صفحة مراجعة الإجابات قبل التسليم:
 *  · تعرض حالة كل فرع (مُجاب / ناقص) ونصّ إجابة الطالب نفسها، بلا كشف الإجابة الصحيحة.
 *  · تتيح فلترة الناقص والعودة إلى أي سؤال لتعديل إجابته.
 *  · زر التسليم يبقى معطّلاً حتى تُجاب جميع الفروع.
 *
 * تُعرض نفس هوية المصدر (كارت أبيض، شعار بنفسجي/وردي)، وتستعمل الألوان فقط كدلالات.
 */

import { useMemo, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { TOTAL_MARKS } from "../config";
import type { Question } from "../exam/types";
import type { Responses } from "../lib/grading";
import { isPartAnswered, partLetter, progressOf } from "../lib/grading";
import { Rich } from "../lib/mathx";
import { formatDuration, num } from "../lib/time";

export function Review({
  studentName,
  questions,
  answers,
  elapsedMs,
  totalParts,
  submitting,
  onBackToQuestion,
  onSubmit,
  onExit,
}: {
  studentName: string;
  questions: Question[];
  answers: Responses;
  elapsedMs: number;
  totalParts: number;
  submitting: boolean;
  onBackToQuestion: (index: number) => void;
  onSubmit: () => void;
  onExit: () => void;
}) {
  const [filter, setFilter] = useState<"all" | "missing">("all");
  const stats = useMemo(
    () => questions.map((question) => progressOf(question, answers)),
    [questions, answers],
  );
  const answered = questions
    .flatMap((question) => question.parts)
    .filter((part) => isPartAnswered(answers[part.id])).length;
  const remaining = totalParts - answered;
  const canSubmit = remaining === 0 && !submitting;
  const rows = questions
    .map((question, index) => ({ question, index, stat: stats[index] }))
    .filter(({ stat }) => (filter === "missing" ? stat.done < stat.total : true));

  return (
    <main className="review-page page-container" aria-labelledby="review-title">
      <section className="review-hero">
        <p className="review-hero-eyebrow">الخطوة قبل الأخيرة</p>
        <h1 id="review-title">مراجعة الإجابات قبل التسليم</h1>
        <p>
          راجعي حالة كل سؤال وإجاباتك المدخلة أدناه. يمكنك العودة إلى أي سؤال لتعديل إجابتك. عند الضغط على
          «تسليم الاختبار» يُصحَّح الاختبار تلقائياً، ويُنزَّل تقرير TXT، وتُرسَل نتيجتك إلى معلّمك.
        </p>
        <div className="review-chips">
          <span className="review-chip">الطالب: <strong>{studentName}</strong></span>
          <span className="review-chip">الفروع المُجابة: <strong dir="ltr">{num(answered)} / {num(totalParts)}</strong></span>
          <span className="review-chip">الزمن: <strong dir="ltr">{formatDuration(elapsedMs)}</strong></span>
          <span className="review-chip">المجموع: <strong dir="ltr">{num(TOTAL_MARKS)}</strong></span>
        </div>
      </section>

      <div className="review-filters">
        <div className="review-filter-group" role="group" aria-label="تصفية الأسئلة">
          <button
            type="button"
            className={`review-filter-button ${filter === "all" ? "is-active" : ""}`}
            onClick={() => setFilter("all")}
            aria-pressed={filter === "all"}
          >
            كل الأسئلة ({num(questions.length)})
          </button>
          <button
            type="button"
            className={`review-filter-button ${filter === "missing" ? "is-active" : ""}`}
            onClick={() => setFilter("missing")}
            aria-pressed={filter === "missing"}
          >
            غير المكتملة ({num(stats.filter((stat) => stat.done < stat.total).length)})
          </button>
        </div>
        <button type="button" className="secondary-button" onClick={onExit}>
          رجوع إلى الأسئلة <ChevronLeft size={17} aria-hidden="true" />
        </button>
      </div>

      <div className="review-cards-list">
        {rows.map(({ question, index, stat }) => {
          const complete = stat.done === stat.total;
          return (
            <article key={question.id} className="review-card">
              <header className="review-card-head">
                <span className="review-index">{num(index + 1)}</span>
                <div className="review-title-wrap">
                  <strong>{question.title}</strong>
                  <small>{question.lesson} · {question.pages}</small>
                </div>
                <span className={`review-status-chip ${complete ? "is-complete" : "is-missing"}`}>
                  {complete ? "مكتمل" : `ناقص ${num(stat.total - stat.done)}`}
                </span>
                <button
                  type="button"
                  className="outline-button"
                  style={{ minHeight: 38, padding: "6px 13px", fontSize: 12.5 }}
                  onClick={() => onBackToQuestion(index)}
                >
                  تعديل
                </button>
              </header>

              <ul className="review-part-list">
                {question.parts.map((part, partIndex) => {
                  const value = answers[part.id] ?? "";
                  const done = isPartAnswered(value);
                  const option = part.options?.find((item) => item.id === value);
                  return (
                    <li key={part.id} className="review-part-row" data-review-part={part.id}>
                      <span className="review-part-chip">{partLetter(partIndex)}</span>
                      <span className="review-part-label"><Rich content={part.label} /></span>
                      <span
                        className={`review-part-value ${done ? "is-done" : "is-empty"}`}
                        dir={part.type === "number" || part.type === "formula" ? "ltr" : "auto"}
                      >
                        {done ? (option ? option.label : value) : "لم تُجب"}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </article>
          );
        })}
        {rows.length === 0 && (
          <p className="review-empty">كل الأسئلة مكتملة — لا فرع ناقص.</p>
        )}
      </div>

      <div className="review-submit-bar">
        {canSubmit ? (
          <p className="is-ready">
            أجبتِ عن جميع الفروع ({num(totalParts)} فرعاً). اضغطي «تسليم الاختبار» للتصحيح وتنزيل التقرير تلقائياً.
          </p>
        ) : (
          <p className="is-pending" role="status">
            {remaining > 0
              ? `تبقّى ${num(remaining)} فرعاً بلا إجابة — لا يمكن التسليم قبل إكمالها.`
              : "جارٍ تجهيز النتيجة…"}
          </p>
        )}
        <div className="review-actions">
          <button type="button" className="primary-button" onClick={onSubmit} disabled={!canSubmit} data-action="submit-exam">
            {submitting ? "جارٍ التسليم…" : "تسليم الاختبار"}
          </button>
          <button type="button" className="secondary-button" onClick={onExit}>
            متابعة المراجعة
          </button>
        </div>
        <p className="review-submit-note">
          لا يمكن التراجع عن التسليم؛ بعد التسليم تُعرض النتيجة والتصحيح التفصيلي وتُرسَل النتيجة إلى المعلّم.
        </p>
      </div>
    </main>
  );
}
