/**
 * شاشة الأسئلة — نفس تصميم شاشة الامتحان في المصدر: كارت السؤال، مفتاح التبويب الأخير،
 * فهرس جانبي، شريط عودة/التالي، والرسم الأساسي. إضافات تفاعلية (اختياريّة):
 * زر «مراجعة الإجابات» في أسفل البطاقة وزر «مراجعة» في الفهرس، بلا تغيّر في الهوية.
 * لا يُكشف أي تصحيح هنا.
 */

import { useLayoutEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, ChevronDown } from "lucide-react";
import type { Question } from "../exam/types";
import { isPartAnswered, isQuestionComplete, progressOf } from "../lib/grading";
import { Rich } from "../lib/mathx";
import { num } from "../lib/time";
import { Figure } from "../exam/figures";
import { AnswerWidget, PartHeading } from "../components/AnswerWidgets";
import type { Responses } from "../lib/grading";

export function Exam({
  studentName,
  questions,
  answers,
  setAnswer,
  elapsedMs,
  totalParts,
  initialIndex = 0,
  onNavigate,
  onReview,
}: {
  studentName: string;
  questions: Question[];
  answers: Responses;
  setAnswer: (partId: string, value: string) => void;
  elapsedMs: string;
  totalParts: number;
  initialIndex?: number;
  onNavigate?: (index: number) => void;
  onReview: () => void;
}) {
  const [index, setIndex] = useState(() => Math.max(0, Math.min(questions.length - 1, initialIndex)));

  const status = useMemo(
    () =>
      questions.map((question) => ({
        ...progressOf(question, answers),
        marks: question.parts.length,
      })),
    [questions, answers],
  );

  const answeredParts = questions
    .flatMap((question) => question.parts)
    .filter((part) => isPartAnswered(answers[part.id])).length;
  const completed = status.filter((state) => state.done === state.total).length;
  const remainingQuestions = status
    .map((state, i) => ({ state, i }))
    .filter(({ state }) => state.done < state.total)
    .map(({ i }) => i + 1);
  const question = questions[index];

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [index]);

  const goto = (next: number) => {
    const clamped = Math.max(0, Math.min(questions.length - 1, next));
    setIndex(clamped);
    onNavigate?.(clamped);
  };

  return (
    <main className="exam-page page-container">
      <div className="exam-intro-line">
        <span>الوحدة الأولى <span className="small-divider">/</span> النموذج B</span>
        <span>أُجيب عن {num(answeredParts)} من {num(totalParts)} فرعاً</span>
      </div>

      <details key={index} className="mobile-map">
        <summary>الانتقال بين الأسئلة <span>{completed} من {num(questions.length)} مكتملة</span><ChevronDown size={17} aria-hidden="true" /></summary>
        <div className="question-map" aria-label="الانتقال بين الأسئلة">
          {questions.map((item, i) => {
            const isDone = isQuestionComplete(item, answers);
            return (
              <button
                key={item.id}
                type="button"
                className={`map-number ${i === index ? "is-current" : ""} ${isDone ? "is-done" : ""}`}
                onClick={() => goto(i)}
                aria-label={`السؤال ${i + 1}${isDone ? "، مكتمل" : "، غير مكتمل"}`}
                aria-current={i === index ? "step" : undefined}
              >
                {num(i + 1)}
                {isDone && <span className="map-done-dot" aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      </details>

      <div className="exam-grid">
        <article key={question.id} className="question-sheet question-enter" data-question-id={question.id}>
          <div className="question-kicker">
            <span>السؤال {num(index + 1)}</span>
            <span className="kicker-divider" />
            <span>{question.lesson}</span>
          </div>
          <h1>{question.title}</h1>
          <p className="question-intro"><Rich content={question.intro} /></p>
          {question.figure && (
            <figure className="question-figure">
              <Figure type={question.figure} />
              {question.figureCaption && <figcaption><Rich content={question.figureCaption} /></figcaption>}
            </figure>
          )}

          <div className="parts-stack">
            {question.parts.map((part, partIndex) => (
              <section key={part.id} className="question-part" aria-labelledby={`label-${part.id}`}>
                <PartHeading part={part} index={partIndex} />
                <AnswerWidget
                  part={part}
                  value={answers[part.id] ?? ""}
                  onChange={(value) => setAnswer(part.id, value)}
                />
              </section>
            ))}
          </div>

          <div className="exam-actions">
            <button type="button" className="secondary-button" disabled={index === 0} onClick={() => goto(index - 1)}>
              <ArrowRight size={18} aria-hidden="true" /> السابق
            </button>
            <div className="exam-actions-start">
              {index < questions.length - 1 && (
                <button type="button" className="outline-button" onClick={onReview}>
                  مراجعة الإجابات
                </button>
              )}
              {index < questions.length - 1 ? (
                <button type="button" className="primary-button" onClick={() => goto(index + 1)}>
                  السؤال التالي <ArrowLeft size={18} aria-hidden="true" />
                </button>
              ) : (
                <button type="button" className="primary-button" onClick={onReview}>
                  مراجعة الإجابات <ArrowLeft size={18} aria-hidden="true" />
                </button>
              )}
            </div>
          </div>
          {remainingQuestions.length > 0 && (
            <p className="missing-note">
              أسئلة غير مكتملة: <span style={{ fontVariantNumeric: "tabular-nums" }}>{remainingQuestions.map((n) => num(n)).join("، ")}</span> — يمكنك العودة إلى مراجعة الإجابات لاحقاً.
            </p>
          )}
        </article>

        <aside className="exam-sidebar" aria-label="تقدم الاختبار">
          <div className="sidebar-sticky">
            <p className="sidebar-kicker">تقدمك</p>
            <strong dir="ltr">{num(completed)} <span>/ {num(questions.length)}</span></strong>
            <p className="sidebar-description">أسئلة اكتملت جميع فروعها</p>
            <div className="sidebar-rule" />
            <p className="sidebar-label">انتقلي إلى سؤال</p>
            <div className="question-map" aria-label="الانتقال بين الأسئلة">
              {questions.map((item, i) => {
                const isDone = isQuestionComplete(item, answers);
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`map-number ${i === index ? "is-current" : ""} ${isDone ? "is-done" : ""}`}
                    onClick={() => goto(i)}
                    aria-label={`السؤال ${i + 1}${isDone ? "، مكتمل" : "، غير مكتمل"}`}
                    aria-current={i === index ? "step" : undefined}
                  >
                    {num(i + 1)}
                    {isDone && <span className="map-done-dot" aria-hidden="true" />}
                  </button>
                );
              })}
            </div>
            <p className="sidebar-note"><span className="legend-dot" /> علامة النقطة تعني أن السؤال مكتمل.</p>
          </div>
        </aside>
      </div>

      <p className="sr-only" data-testid="student-name-display">
        {studentName} · {elapsedMs}
      </p>
    </main>
  );
}
