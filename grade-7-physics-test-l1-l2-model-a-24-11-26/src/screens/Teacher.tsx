/**
 * بوابة المعلّم — نفس تركيبة «منطقة المعلم» في المصدر الأصلي
 * (grade-7-physics-test-Model-A-24-11-26/src/components/TeacherArea.tsx):
 * نافذة منبثقة بيضاء دائرية فوق خلفية معتمة، ترويسة لاصقة، بوابة كلمة مرور،
 * ثم أقسام: سياسة التصحيح، جدول توزيع العلامات، مفتاح الإجابات وسلّم التصحيح،
 * خطوات الحل، المراجع، ومصادر الرسوم.
 *
 * كلمة المرور خاصّة بهذا الاختبار (TEACHER_PASSWORD في src/config.ts)،
 * ولم تُغيَّر بوابة المنصة العامة.
 *
 * تنبيه أمني صريح: الحماية في جهة العميل فقط، وليست مصادقة حقيقية ولا تشفيراً.
 */

import { useMemo, useState, type ReactNode } from "react";
import { TEACHER_PASSWORD, TOTAL_MARKS } from "../config";
import { questions } from "../data/questions";
import { answerKey, QUESTION_MARKS } from "../data/answerKey";
import type { Input, Question } from "../exam/types";
import type { Rubric } from "../lib/grading";
import { countParts, lessonOverlap, partLetter } from "../lib/grading";
import { MixedText } from "../lib/mathx";
import { modelAnswerText } from "../lib/report";
import { num } from "../lib/time";
import { Button, Card, inputCls, labelCls, MarkBadge } from "../components/ui";
import { cn } from "../utils/cn";

/** سياسة التصحيح — منقولة حرفياً من المصدر الأصلي (src/data/teacher.ts). */
const GRADING_POLICY = [
  "لكل سؤال 10 علامات، ولكل فرع علامات موضحة في سلم التصحيح. المجموع 100.",
  "الاختيار من متعدد والتصنيف: العلامة كاملة عند الاختيار الصحيح، وصفر عند الخطأ.",
  "صح أو خطأ: علامة الحكم منفصلة عن علامة التصحيح؛ إذا كانت العبارة خاطئة تُمنح علامة التصحيح عند ذكر المعنى الصحيح بأي صياغة علمية مكافئة.",
  "الأسئلة المقالية القصيرة: تُمنح علامة كل معيار على حدة عند ورود المعنى بعبارات مرادفة (تُقبل «الاحتكاك» و«مقاومة الأرض» مثلاً).",
  "المسائل الحسابية: علامة التعويض (خطوة الحل) تُمنح حتى لو كانت النتيجة العددية خاطئة لاحقاً (خطأ حسابي)، وعلامة الوحدة مستقلة عن صحّة العدد.",
  "تُقبل الأرقام العربية (٥٤) والإنكليزية (54)، والصيغ الحسابية المكتوبة في خانة النتيجة مثل «27 ÷ 0.5 = 54» أو «3000/600»، مع تجاهل الوحدة إن كُتبت داخل الخانة العددية.",
  "يُقبل خطأ نسبته 0.1% في النتائج العشرية، وتُقبل صيغ التعويض المختلفة (÷ أو / أو «على»).",
  "التصحيح آلي بالكامل ويعتمد على معايير نصية؛ يمكن للمعلمة مراجعة إجابات الطالبات النصية من التقرير وتعديل العلامة يدوياً عند الحاجة.",
];

function Section({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="mb-3 flex items-center gap-2 text-lg font-bold">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-lilac-100 text-plum-700">{icon}</span>
        {title}
      </h3>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Gate({ onUnlock }: { onUnlock: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const submit = () => {
    if (password === TEACHER_PASSWORD) {
      setError("");
      onUnlock();
    } else {
      setError("كلمة المرور غير صحيحة. حاول مرة أخرى.");
    }
  };

  return (
    <form
      className="mx-auto max-w-sm p-8 text-center"
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <span className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-lilac-100 text-plum-700">
        <KeyIcon />
      </span>
      <p className="mb-4 leading-7 text-ink-soft">أدخلي كلمة المرور للوصول إلى مفتاح الإجابات وسلّم التصحيح والمراجع.</p>
      <label className="block text-start">
        <span className={labelCls}>كلمة المرور</span>
        <input
          id="teacher-password"
          className={inputCls}
          type="password"
          value={password}
          dir="ltr"
          autoComplete="off"
          autoFocus
          aria-invalid={!!error}
          aria-describedby={error ? "teacher-error" : undefined}
          onChange={(event) => {
            setPassword(event.target.value);
            setError("");
          }}
        />
      </label>
      {error && (
        <p role="alert" id="teacher-error" className="mt-2 text-start text-sm font-semibold text-coral-500">
          {error}
        </p>
      )}
      <Button type="submit" className="mt-4 w-full" disabled={!password} data-action="teacher-unlock">
        فتح الدليل
      </Button>
    </form>
  );
}

function RubricDetail({ input, rubric }: { input: Input; rubric: Rubric }) {
  const rows: { label: string; node: ReactNode }[] = [
    { label: "الإجابة الصحيحة", node: <MixedText as="span" text={modelAnswerText(input, rubric)} /> },
  ];
  if (rubric.kind === "text" || (rubric.kind === "tf" && rubric.correction)) {
    const criteria = rubric.kind === "text" ? rubric.criteria : rubric.correction?.criteria ?? [];
    rows.push({
      label: "معايير التصحيح",
      node: (
        <ul className="grid gap-1">
          {criteria.map((criterion, index) => (
            <li key={index} className="text-sm">
              <span className="tabular me-1.5 rounded-full bg-sun-100 px-2 py-0.5 text-xs font-semibold text-sun-600">{num(criterion.marks)}</span>
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
            الصحيحة: <strong>{rubric.unit.answer}</strong> — الخيارات: {rubric.unit.options.join("، ")} (علامة {num(rubric.unit.marks)})
          </span>
        ),
      });
    }
    if (rubric.steps) {
      rows.push({
        label: "خطوة الحل",
        node: (
          <span>
            <span className="tabular me-1.5 rounded-full bg-sun-100 px-2 py-0.5 text-xs font-semibold text-sun-600">{num(rubric.steps.marks)}</span>
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
            <li key={row.id} className="text-sm">
              <span className="tabular me-1.5 rounded-full bg-sun-100 px-2 py-0.5 text-xs font-semibold text-sun-600">{num(rubric.marksPerRow)}</span>
              {row.id} → <strong>{row.answer}</strong>
            </li>
          ))}
        </ul>
      ),
    });
  }
  return (
    <dl className="mt-2 grid gap-1.5 text-sm">
      {rows.map((row) => (
        <div key={row.label} className="grid gap-0.5 sm:grid-cols-[120px_1fr] sm:gap-2">
          <dt className="font-semibold text-ink-soft">{row.label}</dt>
          <dd className="text-ink">{row.node}</dd>
        </div>
      ))}
    </dl>
  );
}

function QuestionCard({ question, index }: { question: Question; index: number }) {
  const answer = answerKey[question.id];
  return (
    <Card className="p-4 sm:p-5">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="rounded-xl bg-plum-600 px-3 py-1 text-sm font-bold text-white">السؤال {num(index + 1)}</span>
        <span className="font-semibold">{question.title}</span>
        <MarkBadge marks={QUESTION_MARKS[question.id]} className="ms-auto" />
      </div>
      <p className="mb-3 text-sm leading-7 text-ink-soft">
        <MixedText as="span" text={question.intro} />
      </p>
      {question.parts.map((part, partIndex) => (
        <div key={part.id} className="mt-3 rounded-2xl border border-blush-100 bg-blush-50/50 p-3">
          <div className="mb-2 flex items-start gap-2">
            <span className="font-bold text-plum-700">{partLetter(partIndex)}.</span>
            <p className="flex-1 leading-7">
              <MixedText as="span" text={part.label} />
            </p>
          </div>
          <ul className="space-y-2 text-sm">
            {part.inputs.map((input) => {
              const rubric = answer.rubric[input.id];
              return (
                <li key={input.id} className="rounded-xl bg-white p-3 leading-7" data-teacher-input={input.id}>
                  {input.prompt && (
                    <p className="font-medium">
                      <MixedText as="span" text={input.prompt} />
                    </p>
                  )}
                  {input.kind === "tf" && (
                    <p>
                      <MixedText as="span" text={input.statement} />
                    </p>
                  )}
                  <p>
                    <b>الإجابة:</b> <RubricInline input={input} rubric={rubric} />
                    <span className="tabular ms-2 text-xs font-bold text-peach-500" dir="ltr">
                      ({num(marksOf(rubric))} ع)
                    </span>
                  </p>
                  <RubricDetail input={input} rubric={rubric} />
                </li>
              );
            })}
          </ul>
        </div>
      ))}
      <p className="mt-3 text-sm leading-7">
        <b>التفسير:</b> <MixedText as="span" text={answer.explanation} />
      </p>
    </Card>
  );
}

function RubricInline({ input, rubric }: { input: Input; rubric: Rubric }) {
  return (
    <span dir="auto" className="whitespace-pre-wrap">
      <MixedText as="span" text={modelAnswerText(input, rubric)} />
    </span>
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

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-ink/40 backdrop-blur-sm" onClick={onClose} role="dialog" aria-modal="true" aria-label="منطقة المعلم">
      <div className="mx-auto my-3 w-[calc(100%-1rem)] max-w-5xl rounded-card bg-white shadow-card sm:my-8" onClick={(event) => event.stopPropagation()}>
        <header className="sticky top-0 z-10 flex items-center gap-3 rounded-t-card border-b border-blush-100 bg-white/95 px-4 py-3 backdrop-blur">
          <h2 className="text-lg font-bold">منطقة المعلم</h2>
          <p className="hidden text-xs text-ink-soft sm:block">الحماية هنا client-side فقط — ليست نظام مصادقة ولا تشفيراً حقيقياً.</p>
          {unlocked && (
            <Button variant="secondary" size="sm" className="ms-auto !px-3" onClick={onClose} data-action="back-from-teacher">
              رجوع إلى الاختبار
            </Button>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق"
            className={cn(
              "cursor-pointer rounded-full p-2 text-ink-soft transition-colors hover:bg-blush-50 hover:text-ink",
              !unlocked && "ms-auto",
            )}
            data-action="close-teacher"
          >
            <CloseIcon />
          </button>
        </header>

        {!unlocked ? (
          <Gate onUnlock={() => setUnlocked(true)} />
        ) : (
          <div className="space-y-10 p-4 sm:p-6">
            <Section icon={<ListChecksIcon />} title="سياسة التصحيح والعلامات الجزئية">
              <Card className="p-4 text-sm leading-7">
                <ul className="list-inside list-disc space-y-1.5">
                  {GRADING_POLICY.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </Card>
            </Section>

            <Section icon={<CalculatorIcon />} title="جدول توزيع العلامات">
              <Card className="p-4">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr>
                        {["السؤال", "العنوان", "الدرس", "الصفحات", "الفروع", "العلامة"].map((header) => (
                          <th key={header} className="border border-blush-100 bg-lilac-100/70 p-1.5 text-center font-semibold">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {questions.map((question, index) => (
                        <tr key={question.id} className={index % 2 ? "bg-white" : "bg-blush-50/40"}>
                          <td className="tabular border border-blush-100 p-1.5 text-center">{num(index + 1)}</td>
                          <td className="border border-blush-100 p-1.5 text-start">{question.title}</td>
                          <td className="border border-blush-100 p-1.5 text-center">{question.lesson}</td>
                          <td className="border border-blush-100 p-1.5 text-center">{question.pages}</td>
                          <td className="tabular border border-blush-100 p-1.5 text-center">{num(question.parts.length)}</td>
                          <td className="tabular border border-blush-100 p-1.5 text-center">{num(QUESTION_MARKS[question.id])}</td>
                        </tr>
                      ))}
                      <tr>
                        <td colSpan={4} className="border border-blush-100 p-1.5 text-start font-bold">
                          المجموع
                        </td>
                        <td className="tabular border border-blush-100 p-1.5 text-center font-bold">{num(totals.parts)}</td>
                        <td className="tabular border border-blush-100 p-1.5 text-center font-bold">{num(totals.marks)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="mt-3 rounded-2xl border border-blush-100 bg-blush-50/50 p-3" data-teacher-lessons>
                  <p className="text-sm font-semibold">
                    توزيع العلامات على الدرسين (درسان فقط — للسؤال التركيبي حصة مشتركة)
                  </p>
                  <ul className="mt-1.5 grid gap-1 text-sm">
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
                          <span className="tabular rounded-full bg-mint-100 px-3 py-0.5 text-xs font-semibold text-mint-700">{num(marks)} علامة</span>
                        </li>
                      );
                    })}
                  </ul>
                  <p className="mt-1.5 text-xs leading-6 text-sun-600">
                    مجموع الدرسين {num(overlap.possible)} علامة، وليس {num(TOTAL_MARKS)}، لأن السؤال التركيبي يُحتسب فيهما معاً
                    فتظهر علامته ({num(overlap.sharedPossible)}) مرتين. مجموع الاختبار يبقى {num(TOTAL_MARKS)} علامة، ومقام النسبة
                    والتقدير هو {num(TOTAL_MARKS)} فقط، ولا تُجمع الدرجات لتكوين النسبة.
                  </p>
                </div>
              </Card>
            </Section>

            <Section icon={<KeyRoundIcon />} title="مفتاح الإجابات وسلم التصحيح">
              {questions.map((question, index) => (
                <QuestionCard key={question.id} question={question} index={index} />
              ))}
            </Section>

            <Section icon={<CalculatorIcon />} title="خطوات الحل الحسابية">
              <Card className="space-y-3 p-4 text-sm leading-7">
                {questions
                  .filter((question) => answerKey[question.id]?.solution?.length)
                  .map((question) => (
                    <div key={question.id}>
                      <p className="font-semibold">
                        السؤال {num(questions.indexOf(question) + 1)} — {question.title}
                      </p>
                      <ol className="list-inside list-decimal text-ink-soft">
                        {(answerKey[question.id]?.solution ?? []).map((step, stepIndex) => (
                          <li key={stepIndex}>
                            <MixedText as="span" text={step} />
                          </li>
                        ))}
                      </ol>
                    </div>
                  ))}
              </Card>
            </Section>

            <Section icon={<BookOpenIcon />} title="مراجع الأسئلة (الدرس والصفحة والمهارة)">
              <Card className="divide-y divide-blush-100">
                {questions.map((question, index) => (
                  <p key={question.id} className="px-4 py-2 text-sm leading-7">
                    <b>السؤال {num(index + 1)}:</b> {question.lesson} — ص {question.pages} — المهارة: {question.skill}
                  </p>
                ))}
              </Card>
            </Section>

            <Section icon={<ImageIcon />} title="مصادر الرسوم">
              <Card className="divide-y divide-blush-100">
                {[
                  { title: "أنواع المسارات الثلاثة", source: "الكتاب ص 6 — رسم SVG أصلي" },
                  { title: "شعاع القوة وعناصره (40 N، 1 cm ↔ 10 N)", source: "الكتاب ص 21–22 — رسم SVG أصلي" },
                  { title: "مخطط المسافة بدلالة الزمن", source: "الكتاب ص 7–10 — يُولَّد من بيانات الرسم" },
                  { title: "الأرض والقمر", source: "رسم توضيحي زخرفي — SVG أصلي" },
                ].map((item) => (
                  <p key={item.title} className="px-4 py-2 text-sm leading-7">
                    <b>{item.title}</b> — {item.source}
                  </p>
                ))}
              </Card>
            </Section>
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* أيقونات محلية — بديل لأيقونات lucide في المصدر                        */
/* ------------------------------------------------------------------ */

function KeyIcon({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="8" cy="15" r="4" />
      <path d="m10.8 12.2 8.7-8.7M16 6l2 2M19 3l2 2" />
    </svg>
  );
}

function CloseIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

function ListChecksIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m3 6 1.5 1.5L7 5M3 12l1.5 1.5L7 11M3 18l1.5 1.5L7 17M11 6h10M11 12h10M11 18h10" />
    </svg>
  );
}

function CalculatorIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <path d="M8 6h8M8 11h2M14 11h2M8 15h2M14 15h2M8 19h2M14 19h2" />
    </svg>
  );
}

function KeyRoundIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="8" cy="15" r="4" />
      <path d="m10.8 12.2 8.7-8.7M16 6l2 2M19 3l2 2" />
    </svg>
  );
}

function BookOpenIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 4h6a4 4 0 0 1 4 4v12a3 3 0 0 0-3-3H2z" />
      <path d="M22 4h-6a4 4 0 0 0-4 4v12a3 3 0 0 1 3-3h7z" />
    </svg>
  );
}

function ImageIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-5-5L5 21" />
    </svg>
  );
}
