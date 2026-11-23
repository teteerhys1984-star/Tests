/**
 * بوابة المعلّم — كلمة مرور واحدة لهذا الاختبار (TEACHER_PASSWORD في src/config.ts)،
 * ثم مفتاح الإجابات وسلّم التصحيح والمراجع. لا تُغيّر بوابة المنصة العامة.
 *
 * تنبيه أمني صريح: الحماية في جهة العميل فقط، وليست مصادقة حقيقية ولا تشفيراً.
 *
 * الهوية: نفس تصميم شاشة البوابة + بطاقات الدليل في المصدر (أسود/بنفسجي/برتقالي وردي،
 * بطاقات بيضاء بحدود ناعمة ورؤوس متصلة بشريط ذهبي).
 */

import { useMemo, useState } from "react";
import { LockKeyhole, X } from "lucide-react";
import { CONTACT, EXAM_TITLE, GRADE_LABEL, SEMESTER_LABEL, SUBJECT_LABEL, TEACHER_PASSWORD, TOTAL_MARKS } from "../config";
import { questions, totalParts } from "../data/questions";
import { answerKey, QUESTION_MARKS } from "../data/answerKey";
import type { Rubric } from "../lib/grading";
import { BASE_LESSONS, partLetter } from "../lib/grading";
import { Rich, MathText } from "../lib/mathx";
import { num } from "../lib/time";

const KIND_AR: Record<Rubric["kind"], string> = {
  choice: "اختيار من متعدد",
  number: "إجابة عددية",
  short: "إجابة قصيرة (تصحيح جزئي)",
  formula: "صيغة قانون",
};

const lessonOneUrl = "https://github.com/calesteer-create/Physics_Chemistry_7th/blob/main/src/content/lessons/unit1/motion-and-rest.ts";
const lessonTwoUrl = "https://github.com/calesteer-create/Physics_Chemistry_7th/blob/main/src/content/lessons/unit1/force-and-motion.ts";

function Gate({ onUnlock, onClose }: { onUnlock: () => void; onClose: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [visible, setVisible] = useState(false);

  const submit = () => {
    if (password === TEACHER_PASSWORD) {
      setError("");
      onUnlock();
    } else {
      setError("كلمة المرور غير صحيحة. حاول مرة أخرى.");
    }
  };

  return (
    <main className="teacher-page page-container" aria-labelledby="teacher-gate-title">
      <div className="teacher-dialog teacher-dialog--gate">
        <div className="teacher-dialog-head">
          <div>
            <span className="section-eyebrow">للمعلم فقط</span>
            <h2 id="teacher-gate-title">منطقة المعلم</h2>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="إعادة التوجيه إلى الاختبار">
            <X size={22} aria-hidden="true" />
          </button>
        </div>
        <form className="teacher-login" onSubmit={(event) => { event.preventDefault(); submit(); }}>
          <LockKeyhole size={32} strokeWidth={1.4} aria-hidden="true" />
          <p>أدخل كلمة المرور لعرض مفتاح الإجابات وسلم التصحيح والمراجع.</p>
          <label htmlFor="teacher-password">كلمة المرور</label>
          <div className="teacher-gate-row">
            <input
              id="teacher-password"
              type={visible ? "text" : "password"}
              className="student-input"
              value={password}
              dir="ltr"
              autoComplete="off"
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "teacher-error" : undefined}
              onChange={(event) => { setPassword(event.target.value); setError(""); }}
            />
            <button
              type="button"
              className="teacher-show"
              onClick={() => setVisible((value) => !value)}
              aria-label={visible ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
            >
              {visible ? "إخفاء" : "إظهار"}
            </button>
          </div>
          {error && (
            <p role="alert" id="teacher-error" className="form-error">{error}</p>
          )}
          <button type="submit" className="primary-button" disabled={!password}>
            فتح الدليل
          </button>
          <small className="teacher-gate-note">
            ملاحظة أمنية صريحة: حماية كلمة المرور في ملف HTML ثابت هي حاجز وصول بسيط من جهة العميل فقط، وليست مصادقة حقيقية ولا تشفيراً؛ فمن يطّلع على مصدر الملف يمكنه تجاوزها. الحماية الفعلية تحتاج طبقة هوية على الخادم.
          </small>
          <button type="button" className="secondary-button" onClick={onClose} style={{ width: "100%", border: "1px solid #e2d8e4" }}>
            رجوع إلى الاختبار
          </button>
        </form>
      </div>
    </main>
  );
}

export function Teacher({ onClose }: { onClose: () => void }) {
  const [unlocked, setUnlocked] = useState(false);
  const [openQuestion, setOpenQuestion] = useState<string | null>(questions[0]?.id ?? null);

  const totals = useMemo(
    () => ({
      questions: questions.length,
      parts: totalParts,
      marks: Object.values(QUESTION_MARKS).reduce((sum, value) => sum + value, 0),
    }),
    [],
  );

  const lessonSum = useMemo(
    () =>
      BASE_LESSONS.reduce(
        (sum, lesson) =>
          sum +
          questions
            .filter(
              (question) =>
                question.lesson === lesson ||
                question.lesson.split("+").some((item) => item.trim() === lesson),
            )
            .reduce((inner, question) => inner + QUESTION_MARKS[question.id], 0),
        0,
      ),
    [],
  );

  if (!unlocked) return <Gate onUnlock={() => setUnlocked(true)} onClose={onClose} />;

  const firstLesson = BASE_LESSONS[0];
  const secondLesson = BASE_LESSONS[1];

  return (
    <main className="teacher-page page-container" aria-labelledby="teacher-title">
      <div className="teacher-dialog">
        <div className="teacher-dialog-head">
          <div>
            <span className="section-eyebrow">منطقة المعلّم — محجوبة عن الطالب</span>
            <h2 id="teacher-title">نموذج الإجابات ودليل التصحيح</h2>
          </div>
          <button type="button" className="outline-button" onClick={onClose}>
            رجوع إلى الاختبار
          </button>
        </div>

        <p className="teacher-intro">
          {EXAM_TITLE} · {GRADE_LABEL} · {SEMESTER_LABEL} · {SUBJECT_LABEL} — {num(totals.questions)} سؤالاً رئيسياً ·{" "}
          {num(totals.parts)} فرعاً · {num(totals.marks)} علامة (المطلوب {num(TOTAL_MARKS)}).
        </p>

        <section aria-label="جدول توزيع العلامات">
          <h3 className="teacher-section-title">جدول توزيع العلامات</h3>
          <div className="teacher-table-wrap">
            <table className="teacher-table">
              <thead>
                <tr>
                  {["السؤال", "العنوان", "الدرس", "الصفحات", "الفروع", "العلامة"].map((header) => (
                    <th key={header}>{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {questions.map((question, index) => (
                  <tr key={question.id}>
                    <td dir="ltr">{num(index + 1)}</td>
                    <td>{question.title}</td>
                    <td>{question.lesson}</td>
                    <td>{question.pages}</td>
                    <td dir="ltr">{num(question.parts.length)}</td>
                    <td dir="ltr">{num(QUESTION_MARKS[question.id])}</td>
                  </tr>
                ))}
                <tr className="teacher-total">
                  <td colSpan={4}>المجموع</td>
                  <td dir="ltr">{num(totals.parts)}</td>
                  <td dir="ltr">{num(totals.marks)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="teacher-lesson-block" data-teacher-lessons>
            <p className="lesson-breakdown-title">توزيع العلامات على الدرسين (درسان فقط — للسؤال التركيبي حصة مشتركة)</p>
            <ul className="teacher-lesson-list">
              {BASE_LESSONS.map((lesson) => {
                const parts = questions.filter(
                  (question) =>
                    question.lesson === lesson || question.lesson.split("+").some((item) => item.trim() === lesson),
                );
                const marks = parts.reduce((sum, question) => sum + QUESTION_MARKS[question.id], 0);
                const shared = parts.filter((question) => question.lesson.includes("+")).length;
                return (
                  <li key={lesson} className="teacher-lesson-row">
                    <span className="teacher-lesson-name">
                      {lesson} — {num(parts.length)} سؤالاً{shared ? ` (منها ${num(shared)} تركيبي)` : ""}
                    </span>
                    <span className="lesson-pill is-total">{num(marks)} علامة</span>
                  </li>
                );
              })}
            </ul>
            <p className="teacher-lesson-note">
              مجموع الدرسين <strong>{num(lessonSum)}</strong> علامة، وليس {num(TOTAL_MARKS)}، لأن السؤال التركيبي يُحتسب فيهما معاً
              فتظهر علامته مرتين. مجموع الاختبار يبقى {num(TOTAL_MARKS)} علامة، ولا تُجمع الدرجات لتكوين النسبة.
            </p>
          </div>
        </section>

        <section aria-label="مفتاح الإجابات">
          {questions.map((question, index) => {
            const answer = answerKey[question.id];
            const isOpen = openQuestion === question.id;
            return (
              <article key={question.id} className="teacher-question-card">
                <button
                  type="button"
                  className="teacher-question-head"
                  onClick={() => setOpenQuestion(isOpen ? null : question.id)}
                  aria-expanded={isOpen}
                >
                  <span className="teacher-question-index">{num(index + 1)}</span>
                  <span className="teacher-question-meta">
                    <span className="block">{question.title}</span>
                    <span className="teacher-sub">
                      {num(QUESTION_MARKS[question.id])} علامات · {num(question.parts.length)} فروع · {question.lesson}
                    </span>
                  </span>
                  <span className={`teacher-chevron ${isOpen ? "is-open" : ""}`} aria-hidden="true">▾</span>
                </button>

                {isOpen && (
                  <div className="teacher-question-body">
                    <p>
                      <strong>المهارة:</strong> {question.skill}
                    </p>
                    <p>
                      <strong>خطوات الحل:</strong> <Rich content={answer.solution} />
                    </p>
                    {question.lesson.includes(firstLesson) && (
                      <div className="teacher-links">
                        <a href={lessonOneUrl} target="_blank" rel="noreferrer">مصدر الدرس الأول</a>
                      </div>
                    )}
                    {question.lesson.includes(secondLesson) && (
                      <div className="teacher-links">
                        <a href={lessonTwoUrl} target="_blank" rel="noreferrer">مصدر الدرس الثاني</a>
                      </div>
                    )}
                    {question.figureSource && (
                      <p><strong>مرجع الرسم:</strong> {question.figureSource}</p>
                    )}

                    <div className="teacher-rubrics">
                      {question.parts.map((part, partIndex) => {
                        const rubric = answer.rubric[part.id];
                        return (
                          <div key={part.id}>
                            <h3>
                              {partLetter(partIndex)}. <Rich content={part.label} />{" "}
                              <span>{num(rubric.points)} علامة · {KIND_AR[rubric.kind]}</span>
                            </h3>
                            <p>الإجابة: <Rich content={rubric.correct} /></p>
                            <p>التفسير: <Rich content={rubric.explanation} /></p>
                            {rubric.kind === "choice" && (
                              <p>معرّف الخيار: <span dir="ltr">{rubric.correctOption}</span></p>
                            )}
                            {rubric.kind === "number" && (
                              <p>
                                القيمة والوحدة:{" "}
                                <span dir="ltr" style={{ display: "inline-flex", gap: 6, alignItems: "baseline", flexWrap: "wrap" }}>
                                  <strong>{num(rubric.value)}</strong>
                                  <span><MathText tex={`\\mathrm{${rubric.unit}}`} /></span>
                                </span>
                              </p>
                            )}
                            {rubric.kind === "short" && (
                              <ul>
                                {rubric.criteria.map((criterion, criterionIndex) => (
                                  <li key={criterionIndex}>{criterion.description} ({num(criterion.points)} علامة)</li>
                                ))}
                              </ul>
                            )}
                            {rubric.kind === "formula" && (
                              <p>التحقّق: يُقبل أي شكل مكافئ جبرياً (w=mg · m=w/g · g=w/m).</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </section>

        <section aria-label="سياسة التصحيح" className="teacher-policy">
          <h2>سياسة التصحيح</h2>
          <ol>
            <li>لكل فرع علامة محدّدة، ومجموع فروع السؤال = 10، ومجموع الأسئلة العشرة = 100.</li>
            <li>الاختيار: تُمنح العلامة للخيار الصحيح حصراً.</li>
            <li>العدد: تُقبل الأرقام العربية واللاتينية، وتُحسم علامة واحدة عند وحدة خاطئة (إن كانت علامة الفرع أكثر من واحدة).</li>
            <li>الصيغة: تحقّق جبري من التكافؤ، لا مطابقة نصية.</li>
            <li>الإجابة القصيرة: مجموع معايير دلالية مستقلة، بلا اشتراط تطابق الصياغة.</li>
            <li>لا تُعرض أي إجابة أو تلميح للطالب قبل التسليم.</li>
          </ol>
          <p className="teacher-policy-contact">
            {CONTACT.name}: <span dir="ltr">{CONTACT.phone}</span> ·{" "}
            <a href={CONTACT.whatsapp} target="_blank" rel="noopener noreferrer">واتساب</a>
          </p>
          <p className="teacher-disclaimer">حماية كلمة المرور في الواجهة الأمامية فقط؛ يمكن لمن يفحص ملفات الموقع الوصول إلى شيفرته. لا تُستخدم لحماية بيانات حساسة.</p>
        </section>
      </div>
    </main>
  );
}
