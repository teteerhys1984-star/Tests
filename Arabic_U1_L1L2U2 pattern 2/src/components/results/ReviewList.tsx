import { useMemo, useState } from "react";
import type { ExamResult, QuestionResult, SubpartResult } from "../../types/exam";
import { DIFFICULTY_LABELS, SECTION_LABELS } from "../../data/sources/lessons";
import { formatAnswer } from "../../utils/grading";
import { toArabicDigits } from "../../utils/arabic";
import { Icon } from "../common/Icon";
import { SourceReference } from "../common/SourceReference";

type Filter = "all" | "correct" | "incorrect" | "unanswered";

function questionStatus(question: QuestionResult): Filter {
  if (question.subparts.some((sub) => !sub.answered)) return "unanswered";
  if (question.subparts.some((sub) => !sub.isCorrect)) return "incorrect";
  return "correct";
}

function SubpartReview({ subpart, total }: { subpart: SubpartResult; total: number }) {
  const displayStudent = formatAnswer(subpart.studentAnswer);
  const displayCorrect = formatAnswer(subpart.correctAnswer);
  const statusLabel = !subpart.answered ? "غير مجابة" : subpart.isCorrect ? "صحيحة" : "خاطئة";
  const tone = !subpart.answered
    ? "border-[#e9ddd7] bg-[#fbf7f3]"
    : subpart.isCorrect
      ? "border-[#d7e9de] bg-[#f6fbf8]"
      : "border-[#f1d6d6] bg-[#fdf6f5]";

  return (
    <div className={`rounded-xl border ${tone} p-3`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-2">
          <span
            className={`mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full text-white ${
              !subpart.answered ? "bg-[#b6a19c]" : subpart.isCorrect ? "bg-[#5f9675]" : "bg-[#c16a6a]"
            }`}
          >
            <Icon name={!subpart.answered ? "alert" : subpart.isCorrect ? "check" : "close"} size={11} strokeWidth={2.6} />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-[#8f737d]">الفرع {subpart.subpartLabel} من {total}</p>
            <p className="text-[12.5px] font-semibold leading-6 text-[#524047]">{subpart.prompt}</p>
          </div>
        </div>
        <span
          className={`chip text-[10px] ${
            !subpart.answered ? "chip-muted" : subpart.isCorrect ? "chip-mint" : "chip-rose"
          }`}
        >
          {statusLabel} · {toArabicDigits(subpart.marksEarned)}/{toArabicDigits(subpart.marksMax)}
        </span>
      </div>

      <div className="mt-2 grid gap-1.5 text-[11.5px] sm:grid-cols-2">
        <div className="rounded-lg bg-white/80 px-2.5 py-1.5">
          <span className="block text-[10px] font-bold text-[#a08c91]">إجابة الطالبة</span>
          <span className={`font-semibold ${subpart.isCorrect ? "text-[#47735b]" : "text-[#8e4c58]"}`}>
            {displayStudent}
          </span>
        </div>
        <div className="rounded-lg bg-white/80 px-2.5 py-1.5">
          <span className="block text-[10px] font-bold text-[#a08c91]">الإجابة الصحيحة</span>
          <span className="font-semibold text-[#3f6b53]">{displayCorrect}</span>
        </div>
      </div>

      <div className="mt-2 rounded-lg bg-[#fffdfa] px-2.5 py-2 text-[11px] leading-6 text-[#6d5960]">
        <span className="ml-1 inline-flex items-center gap-1 font-bold text-[#8a6070]">
          <Icon name="sparkle" size={11} /> التفسير:
        </span>
        {subpart.explanation}
      </div>
      <div className="mt-1.5">
        <SourceReference source={subpart.source} compact />
      </div>
    </div>
  );
}

export function ReviewList({ result }: { result: ExamResult }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(result.questions.map((question) => question.id)));

  const filtered = useMemo(
    () => result.questions.filter((question) => filter === "all" || questionStatus(question) === filter),
    [filter, result.questions],
  );

  const filters: { id: Filter; label: string; count: number }[] = [
    { id: "all", label: "جميع الأسئلة", count: result.questions.length },
    { id: "correct", label: "صحيحة", count: result.questions.filter((q) => questionStatus(q) === "correct").length },
    {
      id: "incorrect",
      label: "فيها خطأ",
      count: result.questions.filter((q) => questionStatus(q) === "incorrect").length,
    },
    {
      id: "unanswered",
      label: "غير مجابة",
      count: result.questions.filter((q) => questionStatus(q) === "unanswered").length,
    },
  ];

  const toggle = (id: string) => {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <section className="card print-full overflow-hidden" aria-labelledby="review-title">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#f0e1dd] bg-gradient-to-l from-[#fdf4f6] to-[#fffaf6] px-5 py-4">
        <div>
          <h2 id="review-title" className="flex items-center gap-2 font-display text-xl font-bold text-[#61384a]">
            <Icon name="clipboard" size={19} className="text-[#b45c7e]" />
            المراجعة التفصيلية لكل الأسئلة
          </h2>
          <p className="mt-0.5 text-[11.5px] text-[#99848a]">
            ٣٠ سؤالًا و{toArabicDigits(result.subpartCount)} فرعًا، مع الإجابة الصحيحة والتفسير والمرجع الداخلي.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-soft px-3 py-1.5 text-[11px] no-print"
          onClick={() =>
            setExpanded((current) =>
              current.size === result.questions.length
                ? new Set()
                : new Set(result.questions.map((question) => question.id)),
            )
          }
        >
          <Icon name="list" size={13} />
          {expanded.size === result.questions.length ? "طي الكل" : "توسيع الكل"}
        </button>
      </div>

      <div className="no-print flex flex-wrap gap-1.5 border-b border-[#f4e9e5] px-4 py-3">
        {filters.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFilter(item.id)}
            className={`rounded-full border px-3 py-1.5 text-[11px] font-bold transition ${
              filter === item.id
                ? "border-[#b45c7e] bg-[#b45c7e] text-white"
                : "border-[#ecdedb] bg-white/70 text-[#89757c] hover:border-[#d8b3be]"
            }`}
            aria-pressed={filter === item.id}
          >
            {item.label} ({toArabicDigits(item.count)})
          </button>
        ))}
      </div>

      <div className="divide-y divide-[#f3e8e4]">
        {filtered.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <span className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-[#f3f8f4] text-[#5f9675]">
              <Icon name="flower" size={20} />
            </span>
            <p className="text-sm font-bold text-[#6c4c58]">لا توجد أسئلة في هذا التصنيف.</p>
            <p className="mt-1 text-[11px] text-[#9d888e]">اختاري تصنيفًا آخر لعرض الأسئلة.</p>
          </div>
        ) : (
          filtered.map((question) => {
            const isOpen = expanded.has(question.id);
            const status = questionStatus(question);
            const fullMark = question.marksEarned === question.marksMax;
            return (
              <article key={question.id} className="bg-white/35">
                <button
                  type="button"
                  onClick={() => toggle(question.id)}
                  aria-expanded={isOpen}
                  className="flex w-full flex-wrap items-center gap-2.5 px-4 py-3 text-right transition hover:bg-[#fdf7f4] sm:px-5"
                >
                  <span
                    className={`flex h-8 w-8 flex-none items-center justify-center rounded-xl border text-[12px] font-bold ${
                      status === "correct"
                        ? "border-[#cfe4d8] bg-[#eff8f2] text-[#4d7f61]"
                        : status === "unanswered"
                          ? "border-[#e7ddd7] bg-[#f8f3ef] text-[#9a8883]"
                          : "border-[#f0d2d2] bg-[#fdf1f0] text-[#ab5257]"
                    }`}
                  >
                    {toArabicDigits(question.number)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[12.5px] font-bold text-[#59434c] sm:text-[13px]">
                      {question.prompt}
                    </span>
                    <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-[#9d888e]">
                      <span>مرجع داخلي: درس {question.lessonTitle}</span>
                      <span aria-hidden="true">•</span>
                      <span>{SECTION_LABELS[question.section]}</span>
                      <span aria-hidden="true">•</span>
                      <span>صفحة {toArabicDigits(question.page)}</span>
                      <span aria-hidden="true">•</span>
                      <span>{DIFFICULTY_LABELS[question.difficulty]}</span>
                    </span>
                  </span>
                  <span className={`chip text-[10px] ${fullMark ? "chip-mint" : "chip-rose"}`}>
                    {toArabicDigits(question.marksEarned)} / {toArabicDigits(question.marksMax)}
                  </span>
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-[#a08a91] transition-transform ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  >
                    <Icon name="chevron" size={15} />
                  </span>
                </button>

                {isOpen ? (
                  <div className="animate-rise space-y-2 border-t border-[#f5eae6] bg-[#fffaf7] px-3 pb-3.5 pt-2.5 sm:px-5">
                    {question.subparts.map((subpart) => (
                      <SubpartReview key={subpart.subpartId} subpart={subpart} total={question.subparts.length} />
                    ))}
                  </div>
                ) : null}
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}
