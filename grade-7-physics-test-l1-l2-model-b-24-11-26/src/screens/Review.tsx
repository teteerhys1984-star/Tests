/**
 * صفحة مراجعة الإجابات قبل التسليم:
 *  · تعرض حالة كل فرع (مُجاب / ناقص) ونصّ إجابة الطالب نفسها، بلا كشف الإجابة الصحيحة.
 *  · تتيح فلترة الناقص والعودة إلى أي سؤال لتعديل إجابته.
 *  · زر التسليم يبقى معطّلاً حتى تُجاب جميع الفروع (كما في المصدر).
 */

import { useMemo, useState } from "react";
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
    <div className="relative z-10 mx-auto max-w-5xl px-3 pb-10 pt-5 sm:px-4">
      <div
        className="rounded-[var(--r-lg)] p-5 text-[#f4ecd8] shadow-[var(--sh-3)] sm:p-7"
        style={{ background: "linear-gradient(135deg,#10313c 0%,#174c5b 55%,#0f766e 100%)" }}
      >
        <p className="text-[0.72rem] font-bold uppercase tracking-[0.16em]" style={{ color: "#ffd97a" }}>
          الخطوة قبل الأخيرة
        </p>
        <h1 className="mt-1 text-[clamp(1.35rem,4vw,2rem)] font-extrabold" style={{ color: "#fff8e8" }}>
          مراجعة الإجابات قبل التسليم
        </h1>
        <p className="mt-2 max-w-2xl text-[0.93rem] leading-relaxed opacity-90">
          راجعي حالة كل سؤال وإجاباتك المدخلة أدناه. يمكنك العودة إلى أي سؤال لتعديل إجابتك. عند الضغط على
          «تسليم الاختبار» يُصحَّح الاختبار تلقائياً، ويُنزَّل تقرير TXT، وتُرسَل نتيجتك إلى معلّمك.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2 text-[0.88rem]">
          <span className="badge" style={{ background: "rgba(255,217,122,0.2)", color: "#ffd97a", borderColor: "rgba(255,217,122,0.45)" }}>
            الطالب: <strong>{studentName}</strong>
          </span>
          <span className="badge tnum" style={{ background: "rgba(255,248,232,0.14)", color: "#dcebee", borderColor: "rgba(255,248,232,0.24)" }}>
            الفروع المُجابة: {num(answered)} / {num(totalParts)}
          </span>
          <span className="badge tnum" style={{ background: "rgba(15,118,110,0.35)", color: "#bff0e6", borderColor: "rgba(15,118,110,0.6)" }}>
            الزمن: {formatDuration(elapsedMs)}
          </span>
          <span className="badge tnum" style={{ background: "rgba(255,248,232,0.1)", color: "#e7f0f1", borderColor: "rgba(255,248,232,0.2)" }}>
            المجموع: {num(TOTAL_MARKS)}
          </span>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-2">
          <button
            type="button"
            className="btn !min-h-0 !px-3 !py-1.5 text-sm"
            onClick={() => setFilter("all")}
            aria-pressed={filter === "all"}
            style={
              filter === "all"
                ? { background: "var(--navy)", color: "#ffd97a", border: "1px solid var(--navy)" }
                : { background: "var(--surface)", color: "var(--ink-2)", border: "1px solid var(--line)" }
            }
          >
            كل الأسئلة ({num(questions.length)})
          </button>
          <button
            type="button"
            className="btn !min-h-0 !px-3 !py-1.5 text-sm"
            onClick={() => setFilter("missing")}
            aria-pressed={filter === "missing"}
            style={
              filter === "missing"
                ? { background: "var(--navy)", color: "#ffd97a", border: "1px solid var(--navy)" }
                : { background: "var(--surface)", color: "var(--ink-2)", border: "1px solid var(--line)" }
            }
          >
            غير المكتملة ({num(stats.filter((stat) => stat.done < stat.total).length)})
          </button>
        </div>
        <button type="button" className="btn btn-ghost !min-h-0 !px-3 !py-1.5 text-sm" onClick={onExit}>
          رجوع إلى الأسئلة
        </button>
      </div>

      <div className="mt-3 grid gap-3">
        {rows.map(({ question, index, stat }) => {
          const complete = stat.done === stat.total;
          return (
            <article key={question.id} className="card overflow-hidden" data-review-question={question.id}>
              <header className="flex flex-wrap items-center gap-3 p-3.5" style={{ background: "var(--surface-2)" }}>
                <span
                  className="tnum grid h-9 w-9 shrink-0 place-items-center rounded-[var(--r-sm)] font-extrabold"
                  style={{ background: complete ? "var(--teal)" : "var(--clay-soft)", color: complete ? "#fff" : "var(--clay)" }}
                >
                  {num(index + 1)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[0.98rem] font-extrabold" style={{ color: "var(--ink-1)" }}>
                    {question.title}
                  </p>
                  <p className="text-[0.76rem]" style={{ color: "var(--ink-3)" }}>
                    {question.lesson} · {question.pages}
                  </p>
                </div>
                <span className={`badge ${complete ? "badge-ok" : "badge-err"} tnum`}>
                  {complete ? "مكتمل" : `ناقص ${num(stat.total - stat.done)}`}
                </span>
                <button
                  type="button"
                  className="btn btn-ghost !min-h-0 !px-2.5 !py-1 text-[0.8rem]"
                  onClick={() => onBackToQuestion(index)}
                >
                  تعديل
                </button>
              </header>

              <ul className="grid gap-2 p-3.5">
                {question.parts.map((part, partIndex) => {
                  const value = answers[part.id] ?? "";
                  const done = isPartAnswered(value);
                  const option = part.options?.find((item) => item.id === value);
                  return (
                    <li key={part.id} className="flex flex-wrap items-start gap-2 text-[0.9rem]" data-review-part={part.id}>
                      <span className="badge badge-mute shrink-0">{partLetter(partIndex)}</span>
                      <span className="min-w-0 flex-1" style={{ color: "var(--ink-2)" }}>
                        <Rich content={part.label} />
                      </span>
                      <span
                        className={`badge ${done ? "badge-teal" : "badge-err"} shrink-0`}
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
      </div>

      <div className="card mt-4 p-4 sm:p-5">
        {canSubmit ? (
          <p className="text-sm font-bold" style={{ color: "var(--ok)" }}>
            أجبتِ عن جميع الفروع ({num(totalParts)} فرعاً). اضغطي «تسليم الاختبار» للتصحيح وتنزيل التقرير تلقائياً.
          </p>
        ) : (
          <p className="text-sm font-bold" style={{ color: "var(--warn)" }} role="status">
            {remaining > 0
              ? `تبقّى ${num(remaining)} فرعاً بلا إجابة — لا يمكن التسليم قبل إكمالها.`
              : "جارٍ تجهيز النتيجة…"}
          </p>
        )}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button type="button" className="btn btn-danger" onClick={onSubmit} disabled={!canSubmit} data-action="submit-exam">
            {submitting ? "جارٍ التسليم…" : "تسليم الاختبار"}
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" aria-hidden>
              <path d="M12 3v12M7 10l5 5 5-5M4 21h16" />
            </svg>
          </button>
          <button type="button" className="btn btn-ghost" onClick={onExit}>
            متابعة المراجعة
          </button>
        </div>
        <p className="mt-2 text-[0.76rem]" style={{ color: "var(--ink-3)" }}>
          لا يمكن التراجع عن التسليم؛ بعد التسليم تُعرض النتيجة والتصحيح التفصيلي وتُرسَل النتيجة إلى المعلّم.
        </p>
      </div>
    </div>
  );
}
