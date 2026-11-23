/**
 * صفحة مراجعة الإجابات قبل التسليم — شاشة إضافية لا توجد في المصدر،
 * صُمّمت بهوية المصدر نفسها (بطاقة الترويسة المتدرجة باللون البرقوقي،
 * البطاقات البيضاء الدائرية، شارات الألوان الفاتحة، أزرار plum).
 *
 *  · تعرض حالة كل فرع ونصّ إجابة الطالب نفسها، بلا كشف الإجابة الصحيحة.
 *  · تتيح فلترة الناقص والعودة إلى أي سؤال لتعديل إجابته.
 *  · زر التسليم يبقى معطّلاً حتى تُجاب جميع الفروع.
 */

import { useMemo, useState } from "react";
import { TOTAL_MARKS } from "../config";
import type { Question } from "../exam/types";
import type { Responses } from "../lib/grading";
import { isPartComplete, partLetter, progressOf } from "../lib/grading";
import { MixedText, richToPlain } from "../lib/mathx";
import { formatDuration, num } from "../lib/time";
import { Button, Card } from "../components/ui";
import { cn } from "../utils/cn";

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
  const stats = useMemo(() => questions.map((question) => progressOf(question, answers)), [questions, answers]);
  const answered = stats.reduce((sum, status) => sum + status.done, 0);
  const remaining = totalParts - answered;
  const canSubmit = remaining === 0 && !submitting;
  const rows = questions
    .map((question, index) => ({ question, index, stat: stats[index] }))
    .filter(({ stat }) => (filter === "missing" ? stat.done < stat.total : true));

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 pb-10 pt-6 sm:pt-8">
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-l from-plum-700 via-plum-600 to-blush-500 p-6 text-white">
          <p className="text-sm opacity-90">الخطوة قبل الأخيرة</p>
          <h1 className="mt-1 text-2xl font-bold leading-9">مراجعة الإجابات قبل التسليم</h1>
          <p className="mt-2 max-w-2xl text-sm leading-7 opacity-90">
            راجعي حالة كل سؤال وإجاباتك المدخلة أدناه. يمكنك العودة إلى أي سؤال لتعديل إجابتك. عند الضغط على
            «تسليم الاختبار» يُصحَّح الاختبار تلقائياً، ويُنزَّل تقرير TXT، وتُرسَل نتيجتك إلى معلّمك.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
            <span className="rounded-full bg-white/15 px-3 py-1 font-semibold">
              الطالبة: <b>{studentName}</b>
            </span>
            <span className="tabular rounded-full bg-white/15 px-3 py-1 font-semibold">
              الفروع المُجابة: {num(answered)} / {num(totalParts)}
            </span>
            <span className="tabular rounded-full bg-white/15 px-3 py-1 font-semibold">الزمن: {formatDuration(elapsedMs)}</span>
            <span className="tabular rounded-full bg-white/15 px-3 py-1 font-semibold">المجموع: {num(TOTAL_MARKS)}</span>
          </div>
        </div>
      </Card>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          {(
            [
              { id: "all" as const, label: `كل الأسئلة (${num(questions.length)})` },
              {
                id: "missing" as const,
                label: `غير المكتملة (${num(stats.filter((stat) => stat.done < stat.total).length)})`,
              },
            ]
          ).map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setFilter(option.id)}
              aria-pressed={filter === option.id}
              className={cn(
                "cursor-pointer rounded-full border-2 px-3 py-1.5 text-sm font-semibold transition-colors",
                filter === option.id
                  ? "border-plum-600 bg-plum-600 text-white"
                  : "border-blush-100 bg-white text-ink-soft hover:border-lilac-300",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
        <Button variant="secondary" size="sm" onClick={onExit} data-action="back-to-exam">
          رجوع إلى الأسئلة
        </Button>
      </div>

      <div className="mt-3 space-y-3">
        {rows.map(({ question, index, stat }) => {
          const complete = stat.done === stat.total;
          return (
            <Card key={question.id} className="overflow-hidden" data-review-question={question.id}>
              <header className="flex flex-wrap items-center gap-3 border-b border-blush-100 bg-blush-50/50 p-3.5">
                <span
                  className={cn(
                    "tabular grid h-9 w-9 shrink-0 place-items-center rounded-xl font-bold",
                    complete ? "bg-mint-100 text-mint-700" : "bg-coral-100 text-[#a9374b]",
                  )}
                >
                  {num(index + 1)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold leading-7">{question.title}</p>
                  <p className="text-xs leading-6 text-ink-soft">
                    {question.lesson} · {question.pages}
                  </p>
                </div>
                <span className={cn("tabular rounded-full px-3 py-1 text-xs font-semibold", complete ? "bg-mint-100 text-mint-700" : "bg-coral-100 text-[#a9374b]")}>
                  {complete ? "مكتمل" : `ناقص ${num(stat.total - stat.done)}`}
                </span>
                <Button variant="ghost" size="sm" onClick={() => onBackToQuestion(index)}>
                  تعديل
                </Button>
              </header>

              <ul className="grid gap-2 p-3.5">
                {question.parts.map((part, partIndex) => {
                  const done = isPartComplete(part, answers);
                  const answeredInputs = part.inputs.filter((input) =>
                    input.kind === "matrix"
                      ? input.rows.some((row) => (answers[`${input.id}:${row.id}`] ?? "").trim())
                      : input.kind === "tf"
                        ? (answers[`${input.id}:verdict`] ?? "").trim()
                        : input.kind === "number"
                          ? (answers[`${input.id}:value`] ?? "").trim()
                          : (answers[input.id] ?? "").trim(),
                  ).length;
                  return (
                    <li key={part.id} className="flex flex-wrap items-start gap-2 text-sm" data-review-part={part.id}>
                      <span className={cn("shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold", done ? "bg-mint-100 text-mint-700" : "bg-blush-100 text-blush-500")}>
                        {partLetter(partIndex)}
                      </span>
                      <span className="min-w-0 flex-1 leading-7 text-ink-soft">
                        <MixedText as="span" text={richToPlain(part.label)} />
                      </span>
                      <span className={cn("tabular shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold", done ? "bg-mint-100 text-mint-700" : "bg-coral-100 text-[#a9374b]")}>
                        {done ? `مكتمل (${num(part.inputs.length)}/${num(part.inputs.length)})` : `${num(answeredInputs)}/${num(part.inputs.length)}`}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </Card>
          );
        })}
      </div>

      <Card className="mt-4 p-4 sm:p-5">
        {canSubmit ? (
          <p className="text-sm font-semibold text-mint-700">
            أجبتِ عن جميع الفروع ({num(totalParts)} فرعاً). اضغطي «تسليم الاختبار» للتصحيح وتنزيل التقرير تلقائياً.
          </p>
        ) : (
          <p className="text-sm font-semibold text-sun-600" role="status">
            {remaining > 0
              ? `تبقّى ${num(remaining)} فرعاً بلا إجابة — لا يمكن التسليم قبل إكمالها.`
              : "جارٍ تجهيز النتيجة…"}
          </p>
        )}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button variant="danger" onClick={onSubmit} disabled={!canSubmit} data-action="submit-exam">
            {submitting ? "جارٍ التسليم…" : "تسليم الاختبار"}
          </Button>
          <Button variant="secondary" onClick={onExit}>
            متابعة المراجعة
          </Button>
        </div>
        <p className="mt-2 text-xs leading-6 text-ink-faint">
          لا يمكن التراجع عن التسليم؛ بعد التسليم تُعرض النتيجة والتصحيح التفصيلي وتُرسَل النتيجة إلى المعلّم.
        </p>
      </Card>
    </div>
  );
}
