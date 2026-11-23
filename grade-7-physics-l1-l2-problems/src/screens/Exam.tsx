import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  BookMarked,
  Check,
  CheckSquare,
  ChevronLeft,
  CircleDot,
  Clock3,
  Layers3,
  LockKeyhole,
  NotebookPen,
  Rocket,
  Scale,
  Sparkles,
  Target,
} from "lucide-react";
import { allProblems, lessonOfProblem, lessons } from "@/content/problems";
import { allSubparts, questionSpecs, subpartsByProblem } from "@/exam/spec";
import type { ExamAttempt } from "@/exam/types";
import type { AppTab } from "@/lib/site";
import { ar, levelStyle, padAr } from "@/lib/format";
import { formatMarks } from "@/exam/grading";
import { MathText, Formula } from "@/components/MathText";
import { ProblemFigure } from "@/components/Figures";
import { cn } from "@/utils/cn";

export function Exam({
  attempt,
  onAnswerChange,
  onIndexChange,
  onGoReview,
  onNavigate,
}: {
  attempt: ExamAttempt;
  onAnswerChange: (subpartId: string, value: string) => void;
  onIndexChange: (index: number) => void;
  onGoReview: () => void;
  onNavigate: (tab: AppTab) => void;
}) {
  const index = Math.min(Math.max(0, attempt.currentIndex), allProblems.length - 1);
  const problem = allProblems[index];
  const lessonId = lessonOfProblem(problem.id);
  const lesson = lessons[lessonId];
  const subparts = subpartsByProblem[problem.id] ?? [];
  const spec = questionSpecs[index];
  const isMotion = lessonId === "motion";
  const LessonIcon = isMotion ? Rocket : Scale;

  const isQuestionAnswered = (problemId: string) => {
    const subs = subpartsByProblem[problemId] ?? [];
    return subs.every((sp) => (attempt.responses[sp.id] ?? "").trim().length > 0);
  };

  const hasAnyAnswer = (problemId: string) => {
    const subs = subpartsByProblem[problemId] ?? [];
    return subs.some((sp) => (attempt.responses[sp.id] ?? "").trim().length > 0);
  };

  const answeredSubpartsCount = allSubparts.filter(
    (sp) => (attempt.responses[sp.id] ?? "").trim().length > 0,
  ).length;

  return (
    <div className="mx-auto max-w-7xl px-4 pb-10 pt-6 sm:px-6 sm:pt-8">
      {/* Lesson hero */}
      <div className={cn("lesson-hero", isMotion ? "lesson-hero-green" : "lesson-hero-gold")}>
        <div className="lesson-hero-pattern" aria-hidden="true" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3.5">
            <span className={cn("lesson-medallion lesson-medallion-lg", isMotion ? "lesson-medallion-green" : "lesson-medallion-gold")}>
              <LessonIcon className="size-7" strokeWidth={1.6} aria-hidden="true" />
            </span>
            <div>
              <span className="flex flex-wrap items-center gap-2">
                <span className="eyebrow border-[#f8c8db] bg-white/70">
                  <BookMarked className="size-3" aria-hidden="true" />
                  {lesson.number}
                </span>
                <span className="text-[10px] font-medium text-[#b39aa8]">{lesson.pages}</span>
                <span className="flex items-center gap-1 text-[10px] text-[#b39aa8]">
                  <Clock3 className="size-3" aria-hidden="true" /> الطالب/ة: <strong className="text-[#441b67]">{attempt.studentName}</strong>
                </span>
              </span>
              <h1 className="mt-2 flex flex-wrap items-center gap-2 text-[25px] font-bold tracking-tight text-[#301545] sm:text-[32px]">
                {lesson.title}
              </h1>
              <p className="mt-1.5 max-w-xl text-[11.5px] leading-6 text-[#9c5469] sm:text-xs">{lesson.subtitle}</p>
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                {lesson.skills.map((skill) => (
                  <span key={skill} className="flex items-center gap-1 rounded-lg border border-[#f8c8db] bg-white/60 px-2 py-1 text-[9px] font-medium text-[#743f76]">
                    <Check className="size-2.5 text-[#743f76]" aria-hidden="true" />
                    {skill}
                  </span>
                ))}
                <span className="rounded-lg bg-[#f9e3ec] px-2 py-1 text-[9px] font-semibold text-[#743f76]">
                  تمت إجابة {answeredSubpartsCount} من {allSubparts.length} فرعًا
                </span>
              </div>
            </div>
          </div>

          <div className="w-full shrink-0 lg:w-[280px]">
            <div className="lesson-formula-box">
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1 text-[9.5px] font-semibold text-[#743f76]">
                  <Layers3 className="size-3" aria-hidden="true" />
                  صندوق القانون
                </span>
                <span className="text-[8px] text-[#b39aa8]">{lesson.title}</span>
              </div>
              <Formula tex={lesson.formula.tex} />
              <div className="mt-2 flex flex-wrap gap-1.5">
                {lesson.formula.symbols.map((symbol) => (
                  <span key={symbol.sym} className="rounded-md bg-white/70 px-1.5 py-0.5 text-[8px] text-[#b39aa8] ring-1 ring-[#f9e3ec]" dir="rtl">
                    <span className="mx-0.5 font-bold text-[#441b67]" dir="ltr">{symbol.sym}</span>
                    {symbol.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-[10px] text-[#b39aa8]">
          <CircleDot className="size-3.5 text-[#763f4e]" aria-hidden="true" />
          <span>الاختبار التفاعلي</span>
          <span className="text-[#dcc4d1]">/</span>
          <span className="font-semibold text-[#743f76]">المسألة {index + 1} من {allProblems.length}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onGoReview}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#ef97bd] bg-white px-3 py-1.5 text-[10.5px] font-bold text-[#b81f68] shadow-sm transition hover:bg-[#fff8fc]"
          >
            <CheckSquare className="size-3.5" aria-hidden="true" />
            مراجعة الإجابات والتسليم
          </button>
          <button
            type="button"
            onClick={() => onNavigate("teacher")}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#e3cffb] bg-[#faf4ff] px-3 py-1.5 text-[10px] font-semibold text-[#9160cf] transition hover:bg-[#f1e6ff]"
          >
            <LockKeyhole className="size-3" aria-hidden="true" />
            منطقة المعلم
          </button>
        </div>
      </div>

      <div className="mt-3 grid gap-4 lg:grid-cols-[275px_minmax(0,1fr)] lg:items-start">
        {/* Desktop navigation */}
        <aside className="paper-card hidden p-3 lg:sticky lg:top-[96px] lg:block" aria-label="قائمة مسائل الاختبار">
          <div className="flex items-center justify-between gap-2 px-2 pb-2">
            <span className="flex items-center gap-1.5 text-[10.5px] font-bold text-[#441b67]">
              <span className="grid size-5 place-items-center rounded-md bg-[#f9e3ec] text-[#763f4e]">
                <Target className="size-3" aria-hidden="true" />
              </span>
              مسائل الاختبار (20)
            </span>
            <span className="rounded-md bg-[#f9e3ec] px-1.5 py-0.5 text-[9px] font-semibold text-[#b39aa8]" dir="ltr">
              {answeredSubpartsCount}/{allSubparts.length}
            </span>
          </div>

          <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-[#f9e3ec]" aria-hidden="true">
            <div
              className="h-full rounded-full bg-gradient-to-l from-[#b183e6] to-[#743f76] transition-all duration-500"
              style={{ width: `${(answeredSubpartsCount / allSubparts.length) * 100}%` }}
            />
          </div>

          <div className="max-h-[62vh] space-y-2 overflow-y-auto pe-1">
            {(["motion", "force"] as const).map((groupId) => {
              const groupProblems = allProblems.filter((p) => lessonOfProblem(p.id) === groupId);
              const offset = groupId === "motion" ? 0 : 10;
              return (
                <div key={groupId} className="space-y-1">
                  <p className="px-2 pt-1 text-[9.5px] font-bold text-[#9160cf]">
                    {lessons[groupId].number}: {lessons[groupId].title}
                  </p>
                  {groupProblems.map((item, localIdx) => {
                    const globalIdx = offset + localIdx;
                    const isActive = globalIdx === index;
                    const complete = isQuestionAnswered(item.id);
                    const partial = !complete && hasAnyAnswer(item.id);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => onIndexChange(globalIdx)}
                        className={cn("problem-tab", isActive && "problem-tab-active")}
                      >
                        <span
                          className={cn(
                            "grid size-7 flex-none place-items-center rounded-lg text-[10px] font-bold transition",
                            isActive
                              ? "bg-[#441b67] text-[#faf4ff] shadow-sm"
                              : complete
                                ? "bg-[#e9f6e9] text-[#1f7a4a]"
                                : partial
                                  ? "bg-[#fef3c7] text-[#92400e]"
                                  : "bg-[#f9e3ec] text-[#b39aa8]"
                          )}
                        >
                          {padAr(globalIdx + 1)}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className={cn("block truncate text-[10.5px] font-semibold", isActive ? "text-[#301545]" : "text-[#743f76]")}>
                            {item.title}
                          </span>
                          <span className="mt-0.5 block truncate text-[8.5px] text-[#b39aa8]">
                            {complete ? "مكتملة" : partial ? "مجابة جزئيًا" : item.topic}
                          </span>
                        </span>
                        {isActive ? <ChevronLeft className="size-3 flex-none text-[#9c5469]" aria-hidden="true" /> : null}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={onGoReview}
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#441b67] px-3 py-2 text-[11px] font-bold text-white transition hover:bg-[#301545]"
          >
            <CheckSquare className="size-3.5" aria-hidden="true" />
            مراجعة الإجابات ({answeredSubpartsCount}/{allSubparts.length})
          </button>
        </aside>

        <div className="min-w-0">
          {/* Mobile navigation */}
          <div className="mb-3 lg:hidden">
            <div className="flex items-center justify-between gap-2 px-0.5 pb-2">
              <span className="flex items-center gap-1.5 text-[10px] font-semibold text-[#743f76]">
                <Target className="size-3.5" aria-hidden="true" />
                اختر المسألة
              </span>
              <span className="text-[9px] font-medium text-[#b39aa8]">{ar(index + 1)} من {ar(allProblems.length)}</span>
            </div>
            <div role="tablist" aria-label="مسائل الاختبار" className="scrollbar-none flex gap-1.5 overflow-x-auto pb-1">
              {allProblems.map((item, globalIdx) => {
                const isActive = globalIdx === index;
                const complete = isQuestionAnswered(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => onIndexChange(globalIdx)}
                    className={cn(
                      "flex min-w-[49px] flex-col items-center gap-0.5 rounded-xl border px-2 py-1.5 transition",
                      isActive
                        ? "border-[#441b67] bg-[#441b67] text-white shadow-sm"
                        : complete
                          ? "border-[#86efac] bg-[#e9f6e9] text-[#1f7a4a]"
                          : "border-[#f8c8db] bg-white/70 text-[#b39aa8] hover:border-[#ef97bd]"
                    )}
                    aria-label={`المسألة ${globalIdx + 1}: ${item.title}`}
                  >
                    <span className="text-[11px] font-bold">{padAr(globalIdx + 1)}</span>
                    <span className="max-w-[62px] truncate text-[7.5px] opacity-80">{item.level}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Problem card */}
          <article key={problem.id} className="problem-card animate-fade-up">
            <header className="problem-card-head">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="problem-index">
                    المسألة <span dir="ltr">{padAr(index + 1)} / 20</span>
                  </span>
                  <span className={cn("rounded-lg px-2 py-1 text-[9px] font-semibold ring-1", levelStyle[problem.level])}>
                    {problem.level}
                  </span>
                  <span className="rounded-lg bg-[#fcf5f7] px-2 py-1 text-[9px] font-medium text-[#b39aa8] ring-1 ring-[#f9e3ec]">
                    {problem.topic}
                  </span>
                </div>
                <span className="flex items-center gap-1 rounded-full bg-white/80 px-2.5 py-1 text-[9.5px] font-bold text-[#b81f68] ring-1 ring-[#f8c8db]">
                  <Sparkles className="size-3 text-[#b183e6]" aria-hidden="true" />
                  {formatMarks(spec.maxMarks)} درجات
                </span>
              </div>
              <h2 className="mt-2.5 flex items-center gap-2 text-xl font-bold tracking-tight text-[#301545] sm:text-[23px]">
                {problem.title}
              </h2>
            </header>

            <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[1.06fr_0.94fr] lg:gap-5">
              <div className="min-w-0">
                <div className="space-y-2">
                  {problem.prompt.map((paragraph, paragraphIndex) => (
                    <p key={paragraphIndex} className="text-[12.5px] leading-8 text-[#441b67] sm:text-[13px]">
                      <MathText text={paragraph} />
                    </p>
                  ))}
                </div>

                <div className="mt-4">
                  <div className="mb-2 flex items-center gap-1.5">
                    <span className="grid size-5 place-items-center rounded-md bg-[#f9e3ec] text-[#763f4e]">
                      <BadgeCheck className="size-3" aria-hidden="true" />
                    </span>
                    <h3 className="text-[10.5px] font-bold text-[#441b67]">المعطيات</h3>
                    <span className="h-px flex-1 bg-gradient-to-l from-[#f9e3ec] to-transparent" aria-hidden="true" />
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {problem.givens.map((given) => (
                      <span key={given.label} className="given-chip">
                        <span className="text-[8px] font-medium text-[#b39aa8]">{given.label}</span>
                        <span className="text-[9.5px] font-semibold text-[#441b67]">
                          <MathText text={given.value} />
                        </span>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Interactive Subparts */}
                <div className="mt-4 rounded-2xl border border-[#f8c8db] bg-[#fcf5f7] p-3.5">
                  <div className="mb-2.5 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="grid size-5 place-items-center rounded-md bg-[#f9e3ec] text-[#763f4e]">
                        <NotebookPen className="size-3" aria-hidden="true" />
                      </span>
                      <h3 className="text-[11px] font-bold text-[#441b67]">المطلوب وإدخال الإجابات</h3>
                    </div>
                    <span className="text-[9.5px] text-[#9c5469]">({subparts.length} فروع)</span>
                  </div>

                  <div className="space-y-3">
                    {subparts.map((sp, spIdx) => {
                      const val = attempt.responses[sp.id] ?? "";
                      return (
                        <div key={sp.id} className="rounded-xl border border-[#f8c8db] bg-white p-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <label htmlFor={`input-${sp.id}`} className="flex items-start gap-2 text-xs font-bold leading-6 text-[#301545]">
                              <span className="mt-0.5 grid size-4 flex-none place-items-center rounded-full border border-[#ef97bd] bg-[#fff8fc] text-[9px] font-bold text-[#763f4e]">
                                {spIdx + 1}
                              </span>
                              <span>{sp.prompt}</span>
                            </label>
                            <span className="rounded-md bg-[#f1e6ff] px-1.5 py-0.5 text-[9px] font-bold text-[#612397]">
                              {formatMarks(sp.marks)} درجة
                            </span>
                          </div>

                          {sp.kind === "mcq" && sp.options ? (
                            <div className="mt-2.5 space-y-2" role="radiogroup" aria-label={sp.prompt}>
                              {sp.options.map((opt) => {
                                const selected = val === opt.id;
                                return (
                                  <label
                                    key={opt.id}
                                    className={cn(
                                      "flex cursor-pointer items-start gap-2.5 rounded-xl border p-2.5 text-xs transition",
                                      selected
                                        ? "border-[#b81f68] bg-[#fff0f7] font-semibold text-[#301545]"
                                        : "border-[#f8c8db] bg-[#fff8fc] text-[#441b67] hover:border-[#ef97bd]"
                                    )}
                                  >
                                    <input
                                      type="radio"
                                      name={`mcq-${sp.id}`}
                                      value={opt.id}
                                      checked={selected}
                                      onChange={() => onAnswerChange(sp.id, opt.id)}
                                      className="mt-0.5 accent-[#b81f68]"
                                    />
                                    <span>{opt.label}</span>
                                  </label>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="mt-2 flex items-center gap-2">
                              <input
                                id={`input-${sp.id}`}
                                type="text"
                                inputMode={sp.kind === "number" ? "decimal" : "text"}
                                dir="ltr"
                                value={val}
                                onChange={(e) => onAnswerChange(sp.id, e.target.value)}
                                placeholder={sp.placeholder ?? "أدخل الإجابة"}
                                className="exam-answer-input flex-1"
                                autoComplete="off"
                              />
                              {sp.unit && (
                                <span className="rounded-lg border border-[#f8c8db] bg-[#fff8fc] px-2.5 py-2 text-xs font-bold text-[#743f76]" dir="ltr">
                                  {sp.unit}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="min-w-0">
                <ProblemFigure spec={problem.figure} maskAnswers />
                <div className="mt-2.5 flex items-center justify-between gap-2 px-1 text-[8.5px] text-[#b39aa8]">
                  <span className="flex items-center gap-1">
                    <BadgeCheck className="size-2.5 text-[#9c5469]" aria-hidden="true" /> مشهد خاص بالمسألة
                  </span>
                  <span dir="ltr">fig. {padAr(index + 1)}</span>
                </div>
              </div>
            </div>

            <footer className="problem-card-foot flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onIndexChange((index - 1 + allProblems.length) % allProblems.length)}
                className="pager-button"
                aria-label="المسألة السابقة"
              >
                <ArrowRight className="size-3.5" aria-hidden="true" />
                السابقة
              </button>

              <div className="hidden flex-1 items-center justify-center gap-1 sm:flex">
                {allProblems.map((item, dotIndex) => {
                  const answered = isQuestionAnswered(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      tabIndex={-1}
                      onClick={() => onIndexChange(dotIndex)}
                      className={cn(
                        "h-1.5 rounded-full transition-all",
                        dotIndex === index
                          ? "w-5 bg-[#743f76]"
                          : answered
                            ? "w-1.5 bg-[#22c55e]"
                            : "w-1.5 bg-[#f8c8db]"
                      )}
                      aria-label={`الانتقال إلى المسألة ${dotIndex + 1}`}
                    />
                  );
                })}
              </div>

              <div className="flex items-center gap-2">
                {index === allProblems.length - 1 ? (
                  <button
                    type="button"
                    onClick={onGoReview}
                    className="pager-button pager-button-primary"
                  >
                    مراجعة الإجابات والتسليم
                    <CheckSquare className="size-3.5" aria-hidden="true" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => onIndexChange(index + 1)}
                    className="pager-button pager-button-primary"
                    aria-label="المسألة التالية"
                  >
                    التالية
                    <ArrowLeft className="size-3.5" aria-hidden="true" />
                  </button>
                )}
              </div>
            </footer>
          </article>
        </div>
      </div>
    </div>
  );
}
