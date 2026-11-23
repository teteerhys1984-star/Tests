import { useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  CheckSquare,
  Send,
} from "lucide-react";
import { allProblems, lessonOfProblem, lessons } from "@/content/problems";
import { allSubparts, subpartsByProblem } from "@/exam/spec";
import type { ExamAttempt } from "@/exam/types";
import { padAr } from "@/lib/format";
import { cn } from "@/utils/cn";

type FilterKind = "all" | "complete" | "incomplete";

export function Review({
  attempt,
  onJumpToQuestion,
  onBackToExam,
  onSubmitExam,
}: {
  attempt: ExamAttempt;
  onJumpToQuestion: (index: number) => void;
  onBackToExam: () => void;
  onSubmitExam: () => void;
}) {
  const [filter, setFilter] = useState<FilterKind>("all");
  const [confirming, setConfirming] = useState(false);

  const answeredSubparts = allSubparts.filter(
    (sp) => (attempt.responses[sp.id] ?? "").trim().length > 0,
  ).length;
  const unansweredSubparts = allSubparts.length - answeredSubparts;

  const cards = allProblems.map((p, idx) => {
    const subs = subpartsByProblem[p.id] ?? [];
    const filled = subs.filter((sp) => (attempt.responses[sp.id] ?? "").trim().length > 0).length;
    const isComplete = filled === subs.length;
    return { problem: p, idx, subs, filled, isComplete };
  });

  const completeCount = cards.filter((c) => c.isComplete).length;
  const incompleteCount = cards.length - completeCount;

  const visibleCards = cards.filter((c) => {
    if (filter === "complete") return c.isComplete;
    if (filter === "incomplete") return !c.isComplete;
    return true;
  });

  const handleSubmitClick = () => {
    if (unansweredSubparts > 0 && !confirming) {
      setConfirming(true);
      return;
    }
    onSubmitExam();
  };

  return (
    <div className="mx-auto max-w-6xl px-4 pb-12 pt-7 sm:px-6">
      <div className="paper-card p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#f8c8db] pb-4">
          <div>
            <span className="eyebrow">
              <CheckSquare className="size-3.5" aria-hidden="true" />
              المراجعة النهائية قبل التسليم
            </span>
            <h1 className="mt-2 text-2xl font-bold text-[#301545] sm:text-3xl">
              مراجعة إجاباتك — {attempt.studentName}
            </h1>
            <p className="mt-1 text-xs text-[#743f76]">
              تحقّق من المسائل والفروع قبل التسليم النهائي. اضغط على أي مسألة للعودة إليها وتعديل إجابتك.
            </p>
          </div>
          <button type="button" onClick={onBackToExam} className="secondary-cta">
            <ArrowRight className="size-4" aria-hidden="true" />
            العودة إلى المسائل
          </button>
        </div>

        {/* Summary Counters */}
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-[#f8c8db] bg-[#fff8fc] p-3.5">
            <span className="text-[10px] font-semibold text-[#743f76]">الفروع المجابة</span>
            <span className="mt-1 block text-xl font-bold text-[#1f7a4a]" dir="ltr">
              {answeredSubparts} / {allSubparts.length}
            </span>
          </div>
          <div className="rounded-2xl border border-[#f8c8db] bg-[#fff8fc] p-3.5">
            <span className="text-[10px] font-semibold text-[#743f76]">المسائل المكتملة</span>
            <span className="mt-1 block text-xl font-bold text-[#441b67]" dir="ltr">
              {completeCount} / {allProblems.length}
            </span>
          </div>
          <div className="rounded-2xl border border-[#f8c8db] bg-[#fff8fc] p-3.5">
            <span className="text-[10px] font-semibold text-[#743f76]">فروع غير مجابة</span>
            <span className={cn("mt-1 block text-xl font-bold", unansweredSubparts > 0 ? "text-[#b81f68]" : "text-[#1f7a4a]")}>
              {unansweredSubparts}
            </span>
          </div>
        </div>

        {/* Filter pills */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {[
            { id: "all" as const, label: `الكل (${cards.length})` },
            { id: "complete" as const, label: `مكتملة (${completeCount})` },
            { id: "incomplete" as const, label: `غير مكتملة (${incompleteCount})` },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={cn(
                "rounded-xl border px-3 py-1.5 text-xs font-semibold transition",
                filter === f.id
                  ? "border-[#441b67] bg-[#441b67] text-white"
                  : "border-[#f8c8db] bg-white text-[#743f76] hover:bg-[#fff8fc]"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Grid of 20 problems */}
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {visibleCards.map(({ problem, idx, subs, filled, isComplete }) => {
            const lesson = lessons[lessonOfProblem(problem.id)];
            return (
              <button
                key={problem.id}
                type="button"
                onClick={() => onJumpToQuestion(idx)}
                className={cn(
                  "flex flex-col rounded-2xl border p-3.5 text-right transition hover:-translate-y-0.5 hover:shadow-sm",
                  isComplete
                    ? "border-[#bbf7d0] bg-[#f4fbf6]"
                    : filled > 0
                      ? "border-[#fde68a] bg-[#fffbeb]"
                      : "border-[#f8c8db] bg-white"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded-lg bg-[#441b67] px-2 py-0.5 text-[10px] font-bold text-white" dir="ltr">
                    {padAr(idx + 1)}
                  </span>
                  <span className={cn("inline-flex items-center gap-1 text-[10px] font-bold", isComplete ? "text-[#1f7a4a]" : "text-[#b81f68]")}>
                    {isComplete ? <CheckCircle2 className="size-3" /> : <AlertCircle className="size-3" />}
                    {filled}/{subs.length}
                  </span>
                </div>
                <span className="mt-2 block text-xs font-bold text-[#301545]">{problem.title}</span>
                <span className="mt-0.5 block text-[10px] text-[#9c5469]">{lesson.title}</span>
              </button>
            );
          })}
        </div>

        {/* Submit Section */}
        <div className="mt-6 rounded-2xl border border-[#ef97bd] bg-[#fff8fc] p-4">
          {confirming && unansweredSubparts > 0 ? (
            <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
              <div className="flex items-start gap-2.5 text-xs text-[#9d174d]">
                <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <div>
                  <p className="font-bold">تنبيه: ما زال لديك {unansweredSubparts} فرعًا غير مجاب!</p>
                  <p className="mt-0.5">هل تريد تسليم الاختبار الآن أم العودة لإكمال الحل؟</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => setConfirming(false)} className="secondary-cta py-2 text-xs">
                  مراجعة الإجابات
                </button>
                <button type="button" onClick={onSubmitExam} className="primary-cta py-2 text-xs">
                  <Send className="size-3.5" aria-hidden="true" />
                  تأكيد التسليم النهائي
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
              <p className="text-xs text-[#441b67]">
                عند الضغط على «تسليم الاختبار نهائيًا»، سيتم تصحيح إجاباتك فورًا وعرض النتيجة والتقرير.
              </p>
              <button type="button" onClick={handleSubmitClick} className="primary-cta shrink-0">
                <Send className="size-4" aria-hidden="true" />
                تسليم الاختبار نهائيًا
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
