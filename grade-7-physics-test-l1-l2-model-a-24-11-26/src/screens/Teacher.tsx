/**
 * بوابة المعلّم: كلمة مرور واحدة لهذا الاختبار (TEACHER_PASSWORD في src/config.ts)،
 * ثم مفتاح الإجابات وسلّم التصحيح والمراجع. لا تُغيّر بوابة المنصة العامة.
 *
 * تنبيه أمني صريح: الحماية في جهة العميل فقط، وليست مصادقة حقيقية ولا تشفيراً.
 */

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  CONTACT,
  EXAM_TITLE,
  GRADE_LABEL,
  SEMESTER_LABEL,
  SUBJECT_LABEL,
  TEACHER_PASSWORD,
  TOTAL_MARKS,
} from "../config";
import { EXAM_META } from "../exam/types";
import { questions } from "../data/questions";
import { answerKey, QUESTION_MARKS } from "../data/answerKey";
import type { Input, Question } from "../exam/types";
import type { Rubric } from "../lib/grading";
import { countParts, lessonOverlap, partLetter } from "../lib/grading";
import { MixedText, richToPlain } from "../lib/mathx";
import { modelAnswerText } from "../lib/report";
import { num } from "../lib/time";

const KIND_AR: Record<Rubric["kind"], string> = {
  choice: "اختيار من متعدد",
  text: "إجابة قصيرة (تصحيح جزئي)",
  number: "إجابة عددية",
  tf: "صح أو خطأ",
  matrix: "تصنيف صفوف",
};

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
    <div className="relative z-10 mx-auto max-w-md px-4 py-10">
      <div className="card p-6 text-center" data-testid="teacher-gate">
        <h1 className="text-2xl font-extrabold" style={{ color: "var(--navy)" }}>
          دليل المعلّم ونموذج الإجابات
        </h1>
        <p className="mt-1.5 text-sm" style={{ color: "var(--ink-3)" }}>
          هذه المنطقة مخصّصة للمعلّم فقط، ولا تظهر للطالب أثناء الاختبار.
        </p>
        <div className="mt-5 text-start">
          <label htmlFor="teacher-password" className="mb-1.5 block text-sm font-bold" style={{ color: "var(--ink-2)" }}>
            كلمة المرور
          </label>
          <div className="flex gap-2">
            <input
              id="teacher-password"
              className="field flex-1"
              type={visible ? "text" : "password"}
              value={password}
              dir="ltr"
              autoComplete="off"
              aria-invalid={!!error}
              aria-describedby={error ? "teacher-error" : undefined}
              onChange={(event) => {
                setPassword(event.target.value);
                setError("");
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") submit();
              }}
            />
            <button
              type="button"
              className="btn btn-ghost !px-3"
              onClick={() => setVisible((value) => !value)}
              aria-label={visible ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
            >
              {visible ? "إخفاء" : "إظهار"}
            </button>
          </div>
          {error && (
            <p role="alert" id="teacher-error" className="mt-2 text-sm font-bold" style={{ color: "var(--err)" }}>
              {error}
            </p>
          )}
        </div>
        <button type="button" className="btn btn-primary mt-4 w-full" onClick={submit} disabled={!password} data-action="teacher-unlock">
          فتح الدليل
        </button>
        <button type="button" className="btn btn-ghost mt-2 w-full" onClick={onClose}>
          رجوع إلى الاختبار
        </button>
        <p
          className="mt-4 rounded-[var(--r-sm)] p-2.5 text-[0.74rem] leading-relaxed"
          style={{ background: "var(--warn-soft)", color: "var(--warn)" }}
        >
          ملاحظة أمنية صريحة: حماية كلمة المرور في ملف HTML ثابت هي حاجز وصول بسيط من جهة العميل فقط، وليست مصادقة
          حقيقية ولا تشفيراً؛ فمن يطّلع على مصدر الملف يمكنه تجاوزها. الحماية الفعلية تحتاج طبقة هوية على الخادم.
        </p>
      </div>
    </div>
  );
}

function rubricAnswerText(input: Input, rubric: Rubric): string {
  return modelAnswerText(input, rubric);
}

function RubricDetail({ input, rubric }: { input: Input; rubric: Rubric }) {
  const rows: { label: string; node: ReactNode }[] = [
    { label: "الإجابة الصحيحة", node: <MixedText as="span" text={rubricAnswerText(input, rubric)} /> },
  ];
  if (rubric.kind === "text" || (rubric.kind === "tf" && rubric.correction)) {
    const criteria = rubric.kind === "text" ? rubric.criteria : rubric.correction?.criteria ?? [];
    rows.push({
      label: "معايير التصحيح",
      node: (
        <ul className="grid gap-1">
          {criteria.map((criterion, index) => (
            <li key={index} className="text-[0.82rem]">
              <span className="badge badge-part tnum me-1.5">{num(criterion.marks)}</span>
              {criterion.label}
            </li>
          ))}
        </ul>
      ),
    });
  }
  if (rubric.kind === "number") {
    if (rubric.unit) {
      rows.push({
        label: "الوحدة",
        node: (
          <span>
            الصحيحة: <strong>{rubric.unit.answer}</strong> — الخيارات: {rubric.unit.options.join("، ")} (علامة{" "}
            {num(rubric.unit.marks)})
          </span>
        ),
      });
    }
    if (rubric.steps) {
      rows.push({
        label: "خطوة الحل",
        node: (
          <span>
            <span className="tnum badge badge-part me-1.5">{num(rubric.steps.marks)}</span>
            {rubric.steps.label} — نموذج: <span dir="auto">{rubric.steps.model}</span>
          </span>
        ),
      });
    }
  }
  if (rubric.kind === "matrix") {
    rows.push({
      label: "التصنيف الصحيح",
      node: (
        <ul className="grid gap-1">
          {rubric.rows.map((row) => (
            <li key={row.id} className="text-[0.82rem]">
              <span className="tnum badge badge-part me-1.5">{num(rubric.marksPerRow)}</span>
              {row.id} → <strong>{row.answer}</strong>
            </li>
          ))}
        </ul>
      ),
    });
  }
  return (
    <dl className="mt-2 grid gap-1.5 text-[0.86rem]">
      {rows.map((row) => (
        <div key={row.label} className="grid gap-0.5 sm:grid-cols-[120px_1fr] sm:gap-2">
          <dt className="font-bold" style={{ color: "var(--ink-3)" }}>
            {row.label}
          </dt>
          <dd style={{ color: "var(--ink-2)" }}>{row.node}</dd>
        </div>
      ))}
    </dl>
  );
}

function QuestionCard({ question, index, open, toggle }: { question: Question; index: number; open: boolean; toggle: () => void }) {
  const answer = answerKey[question.id];
  return (
    <article className="card overflow-hidden" data-teacher-question={question.id}>
      <button type="button" className="flex w-full items-start gap-3 p-3.5 text-start" onClick={toggle} aria-expanded={open}>
        <span
          className="tnum grid h-10 w-10 shrink-0 place-items-center rounded-[var(--r-sm)] font-extrabold"
          style={{ background: "var(--navy)", color: "#ffd97a" }}
        >
          {num(index + 1)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[1rem] font-extrabold" style={{ color: "var(--ink-1)" }}>
            {question.title}
          </span>
          <span className="mt-1 flex flex-wrap gap-1.5">
            <span className="badge badge-gold tnum">{num(QUESTION_MARKS[question.id])} علامات</span>
            <span className="badge badge-mute tnum">{num(question.parts.length)} فروع</span>
            <span className="badge badge-teal">{question.lesson}</span>
            <span className="badge badge-mute">{question.pages}</span>
          </span>
        </span>
      </button>

      {open && (
        <div className="border-t p-3.5 sm:p-4" style={{ borderColor: "var(--line-soft)" }}>
          <p className="mb-2 text-[0.86rem]" style={{ color: "var(--ink-2)" }}>
            <strong>المهارة:</strong> {question.skill}
          </p>
          <p className="mb-2 rounded-[var(--r-sm)] p-2.5 text-[0.88rem] leading-relaxed" style={{ background: "var(--surface-2)" }}>
            <MixedText as="span" text={question.intro} />
          </p>
          <p className="mb-3 text-[0.84rem] leading-relaxed" style={{ color: "var(--ink-2)" }}>
            <strong>التفسير:</strong> <MixedText as="span" text={answer.explanation} />
          </p>
          {answer.solution && answer.solution.length > 0 && (
            <ol className="mb-3 grid list-decimal gap-1 ps-5 text-[0.84rem]" style={{ color: "var(--ink-2)" }}>
              {answer.solution.map((step, stepIndex) => (
                <li key={stepIndex}>
                  <MixedText as="span" text={step} />
                </li>
              ))}
            </ol>
          )}

          <div className="grid gap-2.5">
            {question.parts.map((part, partIndex) => (
              <div
                key={part.id}
                className="rounded-[var(--r-sm)] border p-3"
                data-teacher-part={part.id}
                style={{
                  borderColor: "var(--line-soft)",
                  borderInlineStartColor: "var(--gold)",
                  borderInlineStartWidth: 4,
                  background: "#fff",
                }}
              >
                <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[0.92rem] font-bold" style={{ color: "var(--navy)" }}>
                    الفرع ({partLetter(partIndex)}) — <MixedText as="span" text={richToPlain(part.label)} />
                  </span>
                </div>
                <div className="grid gap-2">
                  {part.inputs.map((input) => {
                    const rubric = answer.rubric[input.id];
                    return (
                      <div
                        key={input.id}
                        className="rounded-[var(--r-xs)] border p-2.5"
                        style={{ borderColor: "var(--line-soft)", background: "var(--surface-2)" }}
                        data-teacher-input={input.id}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-[0.85rem] font-bold" style={{ color: "var(--ink-2)" }}>
                            {input.id}
                          </span>
                          <span className="flex gap-1.5">
                            <span className="badge badge-gold tnum">{num(marksOf(rubric))} علامة</span>
                            <span className="badge badge-mute">{KIND_AR[rubric.kind]}</span>
                          </span>
                        </div>
                        <RubricDetail input={input} rubric={rubric} />
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}

function marksOf(rubric: Rubric): number {
  switch (rubric.kind) {
    case "choice":
    case "text":
      return rubric.marks;
    case "number":
      return rubric.marks + (rubric.unit?.marks ?? 0) + (rubric.steps?.marks ?? 0);
    case "tf":
      return rubric.verdictMarks + (rubric.correction?.marks ?? 0);
    case "matrix":
      return rubric.rows.length * rubric.marksPerRow;
  }
}

export function Teacher({ onClose }: { onClose: () => void }) {
  const [unlocked, setUnlocked] = useState(false);
  const [openQuestion, setOpenQuestion] = useState<string | null>(questions[0]?.id ?? null);

  const totals = useMemo(
    () => ({
      questions: questions.length,
      parts: countParts(questions),
      marks: Object.values(QUESTION_MARKS).reduce((sum, value) => sum + value, 0),
    }),
    [],
  );

  const overlap = useMemo(() => {
    const blank = {
      total: 0,
      possible: totals.marks,
      questions: questions.map((question) => ({
        questionId: question.id,
        earned: 0,
        possible: QUESTION_MARKS[question.id],
        parts: [],
        inputs: [],
      })),
      fullParts: 0,
      partialParts: 0,
      wrongParts: 0,
      emptyParts: 0,
    };
    return lessonOverlap(questions, blank);
  }, [totals.marks]);

  if (!unlocked) return <Gate onUnlock={() => setUnlocked(true)} onClose={onClose} />;

  return (
    <div className="relative z-10 mx-auto max-w-6xl px-3 pb-10 pt-5 sm:px-4">
      <header
        className="rounded-[var(--r-lg)] p-4 shadow-[var(--sh-2)] sm:p-6"
        style={{ background: "linear-gradient(135deg,#174c5b 0%,#10313c 55%,#0f766e 100%)" }}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[0.72rem] font-bold uppercase tracking-[0.16em]" style={{ color: "#ffd97a" }}>
              منطقة المعلّم — محجوبة عن الطالب
            </p>
            <h1 className="mt-1 text-[clamp(1.3rem,4vw,1.9rem)] font-extrabold" style={{ color: "#fff8e8" }}>
              نموذج الإجابات ودليل التصحيح
            </h1>
            <p className="mt-1.5 max-w-3xl text-[0.88rem] opacity-85" style={{ color: "#dcebee" }}>
              {EXAM_TITLE} · {GRADE_LABEL} · {SEMESTER_LABEL} · {SUBJECT_LABEL} — {num(totals.questions)} سؤالاً رئيسياً ·{" "}
              {num(totals.parts)} فرعاً · {num(totals.marks)} علامة (المطلوب {num(TOTAL_MARKS)}).
            </p>
          </div>
          <button
            type="button"
            className="btn"
            style={{ background: "rgba(255,248,232,0.14)", color: "#fff8e8", border: "1px solid rgba(255,248,232,0.3)" }}
            onClick={onClose}
            data-action="close-teacher"
          >
            رجوع إلى الاختبار
          </button>
        </div>
      </header>

      <section className="card mt-4 p-4 sm:p-5">
        <h2 className="mb-2 text-lg font-extrabold" style={{ color: "var(--navy)" }}>
          جدول توزيع العلامات
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[0.85rem]">
            <thead>
              <tr>
                {["السؤال", "العنوان", "الدرس", "الصفحات", "الفروع", "العلامة"].map((header) => (
                  <th
                    key={header}
                    className="border p-1.5 text-center font-bold"
                    style={{ borderColor: "var(--line)", background: "var(--navy)", color: "#f6e9c8" }}
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {questions.map((question, index) => (
                <tr key={question.id} style={{ background: index % 2 ? "var(--surface-2)" : "#fff" }}>
                  <td className="tnum border p-1.5 text-center" style={{ borderColor: "var(--line)" }}>
                    {num(index + 1)}
                  </td>
                  <td className="border p-1.5 text-start" style={{ borderColor: "var(--line)" }}>
                    {question.title}
                  </td>
                  <td className="border p-1.5 text-center" style={{ borderColor: "var(--line)" }}>
                    {question.lesson}
                  </td>
                  <td className="border p-1.5 text-center" style={{ borderColor: "var(--line)" }}>
                    {question.pages}
                  </td>
                  <td className="tnum border p-1.5 text-center" style={{ borderColor: "var(--line)" }}>
                    {num(question.parts.length)}
                  </td>
                  <td className="tnum border p-1.5 text-center" style={{ borderColor: "var(--line)" }}>
                    {num(QUESTION_MARKS[question.id])}
                  </td>
                </tr>
              ))}
              <tr>
                <td colSpan={4} className="border p-1.5 text-start font-bold" style={{ borderColor: "var(--line)" }}>
                  المجموع
                </td>
                <td className="tnum border p-1.5 text-center font-bold" style={{ borderColor: "var(--line)" }}>
                  {num(totals.parts)}
                </td>
                <td className="tnum border p-1.5 text-center font-bold" style={{ borderColor: "var(--line)" }}>
                  {num(totals.marks)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div
          className="mt-3 rounded-[var(--r-sm)] border p-3"
          data-teacher-lessons
          style={{ borderColor: "var(--line-soft)", background: "var(--surface-2)" }}
        >
          <p className="text-[0.82rem] font-bold" style={{ color: "var(--navy)" }}>
            توزيع العلامات على الدرسين (درسان فقط — للسؤال التركيبي حصة مشتركة)
          </p>
          <ul className="mt-1.5 grid gap-1 text-[0.82rem]" style={{ color: "var(--ink-2)" }}>
            {[
              { lesson: "الحركة والسكون", key: "l1" },
              { lesson: "القوة والحركة", key: "l2" },
            ].map((row) => {
              const entries = questions.filter((question) =>
                question.lesson.split("+").some((item) => item.trim() === row.lesson),
              );
              const marks = entries.reduce((sum, question) => sum + QUESTION_MARKS[question.id], 0);
              const shared = entries.filter((question) => question.lesson.includes("+")).length;
              return (
                <li key={row.key} className="flex flex-wrap items-center justify-between gap-2" data-teacher-lesson={row.key}>
                  <span>
                    {row.lesson} — {num(entries.length)} سؤالاً{shared ? ` (منها ${num(shared)} تركيبي)` : ""}
                  </span>
                  <span className="badge badge-teal tnum">{num(marks)} علامة</span>
                </li>
              );
            })}
          </ul>
          <p className="mt-1.5 text-[0.74rem] leading-relaxed" style={{ color: "var(--warn)" }}>
            مجموع الدرسين {num(overlap.possible)} علامة، وليس {num(TOTAL_MARKS)}، لأن السؤال التركيبي يُحتسب فيهما معاً
            فتظهر علامته ({num(overlap.sharedPossible)}) مرتين. مجموع الاختبار يبقى {num(TOTAL_MARKS)} علامة، ومقام النسبة
            والتقدير هو {num(TOTAL_MARKS)} فقط، ولا تُجمع الدرجات لتكوين النسبة.
          </p>
        </div>
      </section>

      <section className="mt-4 grid gap-3">
        {questions.map((question, index) => (
          <QuestionCard
            key={question.id}
            question={question}
            index={index}
            open={openQuestion === question.id}
            toggle={() => setOpenQuestion(openQuestion === question.id ? null : question.id)}
          />
        ))}
      </section>

      <section className="card mt-4 p-4 text-[0.85rem]" style={{ background: "var(--surface-2)" }}>
        <h2 className="mb-2 text-lg font-extrabold" style={{ color: "var(--navy)" }}>
          سياسة التصحيح
        </h2>
        <ol className="grid list-decimal gap-1 ps-5" style={{ color: "var(--ink-2)" }}>
          <li>
            لكل حقل إدخال علامة محدّدة، ومجموع حقول الفرع واعٍ للعلامات الجزئية؛ مجموع فروع السؤال ={" "}
            {num(EXAM_META.marks / questions.length)}، ومجموع الأسئلة = {num(TOTAL_MARKS)}.
          </li>
          <li>الاختيار: تُمنح العلامة للخيار الصحيح حصراً.</li>
          <li>العدد: تُقبل الأرقام العربية واللاتينية، وعلامة القيمة مستقلة عن علامة الوحدة وعن علامة خطوة التعويض.</li>
          <li>صح/خطأ: علامة الحكم مستقلة عن علامة التصحيح، ولا يُقوَّم التصحيح إلا إذا حكم الطالب «خاطئة».</li>
          <li>التصنيف: علامة لكل صف على حدة.</li>
          <li>الإجابة القصيرة: مجموع معايير دلالية مستقلة (any/all/none)، بلا اشتراط تطابق الصياغة.</li>
          <li>لا تُعرض أي إجابة أو تلميح للطالب قبل التسليم.</li>
        </ol>
        <p className="mt-3 text-center font-bold" style={{ color: "var(--ink-2)" }}>
          {CONTACT.name}: <span className="tnum" dir="ltr">{CONTACT.phone}</span> ·{" "}
          <a
            href={CONTACT.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-dotted underline-offset-4"
            style={{ color: "var(--teal)" }}
          >
            واتساب
          </a>
        </p>
      </section>
    </div>
  );
}
