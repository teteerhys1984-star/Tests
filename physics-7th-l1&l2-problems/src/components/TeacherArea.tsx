import {
  ArrowLeft,
  LogOut,
  ArrowRight,
  BadgeCheck,
  BookOpen,
  Calculator,
  CheckCircle2,
  ChevronLeft,
  GraduationCap,
  KeyRound,
  LayoutGrid,
  Lightbulb,
  LockKeyhole,
  NotebookPen,
  Presentation,
  Sigma,
  Sparkles,
  Target,
  Printer,
} from "lucide-react";
import type { LessonId } from "@/content/problems";
import { lessonList, lessons, problemsByLesson } from "@/content/problems";
import type { AppTab } from "@/lib/site";
import { site } from "@/lib/site";
import { ar, levelStyle, padAr } from "@/lib/format";
import { MathText, TeX } from "@/components/MathText";
import { ProblemFigure } from "@/components/Figures";
import { cn } from "@/utils/cn";

export function TeacherArea({
  lessonId,
  onLessonChange,
  index,
  onIndexChange,
  onNavigate,
  onLock,
}: {
  lessonId: LessonId;
  onLessonChange: (lesson: LessonId) => void;
  index: number;
  onIndexChange: (index: number) => void;
  onNavigate: (tab: AppTab) => void;
  onLock: () => void;
}) {
  const lesson = lessons[lessonId];
  const problems = problemsByLesson[lessonId];
  const problem = problems[Math.min(index, problems.length - 1)];

  return (
    <div className="mx-auto max-w-7xl px-4 pb-10 pt-6 sm:px-6 sm:pt-8">
      {/* Teacher hero */}
      <div className="teacher-hero">
        <div className="teacher-hero-grid" aria-hidden="true" />
        <div className="teacher-hero-orb teacher-hero-orb-a" aria-hidden="true" />
        <div className="teacher-hero-orb teacher-hero-orb-b" aria-hidden="true" />
        <div className="relative grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <span className="flex flex-wrap items-center gap-2">
              <span className="teacher-badge">
                <LockKeyhole className="size-3" aria-hidden="true" />
                تبويب خاص بالمعلم
              </span>
              <span className="rounded-full border border-white/15 bg-white/8 px-2.5 py-1 text-[9px] text-[#f8c8db]">
                حلول مسائل الدرسين الأول والثاني
              </span>
            </span>
            <h1 className="mt-3 flex flex-wrap items-center gap-2 text-[28px] font-bold tracking-tight text-[#faf4ff] sm:text-[34px]">
              منطقة المعلم <span className="text-xl" aria-hidden="true">🧑‍🏫</span>
            </h1>
            <p className="mt-2 max-w-2xl text-[11.5px] leading-7 text-[#e0b8c5] sm:text-xs">
              هنا تكتمل الصورة: فكرة الحل، الخطوات، الناتج النهائي، وملاحظة تربوية لكل مسألة. هذه الحلول موازية لأمثلة الكتاب
              <span className="mx-1 font-semibold text-[#e3cffb]">ولا تُعرض داخل تبويبات الطالب</span> ولا تتضمّن تلميحات.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button type="button" onClick={onLock} className="teacher-lock-button no-print">
                <LogOut className="size-3" aria-hidden="true" />
                قفل المنطقة
              </button>
              <span className="teacher-hero-chip">
                <Calculator className="size-3" aria-hidden="true" /> {ar(20)} حلًّا كاملًا
              </span>
              <span className="teacher-hero-chip">
                <CheckCircle2 className="size-3" aria-hidden="true" /> {ar(10)} مسائل لكل درس
              </span>
              <span className="teacher-hero-chip">
                <Sparkles className="size-3" aria-hidden="true" /> خطوات مرقّمة وملاحظات
              </span>
            </div>
          </div>
          <div className="hidden items-center justify-center lg:flex">
            <div className="teacher-key">
              <span className="teacher-key-ring" aria-hidden="true" />
              <KeyRound className="size-8 text-[#f1e6ff]" strokeWidth={1.4} aria-hidden="true" />
              <span className="mt-2 text-[8px] font-semibold tracking-wide text-[#f8c8db]">SOLUTION KEY</span>
              <span className="mt-0.5 text-[8px] text-[#b98395]">خصوصية المعلم</span>
            </div>
          </div>
        </div>
      </div>

      {/* Lesson switch */}
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div role="tablist" aria-label="اختيار الدرس في منطقة المعلم" className="inline-flex w-full gap-1 rounded-2xl border border-[#f8c8db] bg-white/70 p-1 sm:w-auto">
          {lessonList.map((item) => {
            const active = item.id === lessonId;
            const Icon = item.id === "motion" ? Target : Sigma;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onLessonChange(item.id)}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2 text-[11px] font-semibold transition sm:flex-none",
                  active ? "bg-[#441b67] text-white shadow-sm" : "text-[#743f76] hover:bg-[#f9e3ec]"
                )}
              >
                <Icon className="size-3.5" aria-hidden="true" />
                {item.number}: {item.title}
                <span className={cn("rounded-md px-1.5 py-0.5 text-[8px] font-bold", active ? "bg-white/15" : "bg-[#f9e3ec] text-[#9c5469]")}>10</span>
              </button>
            );
          })}
        </div>
        <p className="flex items-center gap-1.5 text-[9.5px] text-[#b39aa8]">
          <LayoutGrid className="size-3" aria-hidden="true" />
          اختر رقم المسألة من القائمة — الحل يظهر مباشرة
        </p>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[290px_minmax(0,1fr)] lg:items-start">
        {/* Solutions nav */}
        <aside className="paper-card hidden p-3 lg:sticky lg:top-[96px] lg:block" aria-label="قائمة حلول الدرس">
          <div className="flex items-center justify-between gap-2 px-1 pb-2">
            <span className="flex items-center gap-1.5 text-[10.5px] font-bold text-[#441b67]">
              <span className="grid size-5 place-items-center rounded-md bg-[#f1e6ff] text-[#9160cf]">
                <Presentation className="size-3" aria-hidden="true" />
              </span>
              حلول {lesson.title}
            </span>
            <span className="rounded-md bg-[#f9e3ec] px-1.5 py-0.5 text-[9px] font-semibold text-[#b39aa8]">{ar(problems.length)}</span>
          </div>
          <div role="tablist" aria-label="حلول مسائل الدرس" aria-orientation="vertical" className="space-y-1">
            {problems.map((item, itemIndex) => {
              const active = itemIndex === index;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => onIndexChange(itemIndex)}
                  className={cn("problem-tab", active && "problem-tab-active")}
                >
                  <span
                    className={cn(
                      "grid size-7 flex-none place-items-center rounded-lg text-[10px] font-bold",
                      active ? "bg-[#b183e6] text-white" : "bg-[#faf4ff] text-[#b39aa8]"
                    )}
                  >
                    {padAr(item.number)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={cn("block truncate text-[10.5px] font-semibold", active ? "text-[#441b67]" : "text-[#743f76]")}>{item.title}</span>
                    <span className="mt-0.5 flex items-center gap-1">
                      <span className={cn("rounded px-1 py-px text-[7.5px] font-medium ring-1", levelStyle[item.level])}>{item.level}</span>
                      <span className="truncate text-[8px] text-[#b39aa8]">{item.topic}</span>
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
          <div className="mt-3 rounded-xl bg-[#faf4ff] p-2.5 ring-1 ring-[#f1e6ff]">
            <p className="flex items-start gap-1.5 text-[8.5px] leading-5 text-[#b183e6]">
              <Lightbulb className="mt-0.5 size-3 shrink-0 text-[#b183e6]" aria-hidden="true" />
              للمراجعة الصفية: ابدأ بالسؤال، اسمع مسار الطالب، ثم اكشف الحل خطوة بخطوة.
            </p>
          </div>
        </aside>

        <div className="min-w-0">
          {/* Mobile teacher nav */}
          <div className="mb-3 lg:hidden">
            <div className="flex items-center justify-between pb-2">
              <span className="flex items-center gap-1.5 text-[10px] font-semibold text-[#8a6c7d]">
                <Presentation className="size-3.5" aria-hidden="true" /> رقم حل المسألة
              </span>
              <span className="text-[9px] text-[#b39aa8]">{ar(index + 1)} من {ar(problems.length)}</span>
            </div>
            <div role="tablist" aria-label="حلول المسائل" className="scrollbar-none flex gap-1.5 overflow-x-auto pb-1">
              {problems.map((item, itemIndex) => {
                const active = itemIndex === index;
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => onIndexChange(itemIndex)}
                    className={cn(
                      "grid size-8 flex-none place-items-center rounded-lg border text-[10px] font-bold transition",
                      active ? "border-[#b183e6] bg-[#b183e6] text-white" : "border-[#f1e6ff] bg-white/70 text-[#b39aa8]"
                    )}
                    aria-label={`حل المسألة ${item.number}: ${item.title}`}
                  >
                    {padAr(item.number)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Solution article */}
          <article key={`${lessonId}-${problem.id}`} className="solution-card animate-fade-up">
            <header className="solution-head">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="teacher-answer-badge">
                    <KeyRound className="size-3" aria-hidden="true" /> حل المعلم
                  </span>
                  <span className="rounded-lg bg-[#f9e3ec] px-2 py-1 text-[9px] font-semibold text-[#763f4e] ring-1 ring-[#f8c8db]">
                    المسألة {padAr(problem.number)}
                  </span>
                  <span className={cn("rounded-lg px-2 py-1 text-[9px] font-semibold ring-1", levelStyle[problem.level])}>{problem.level}</span>
                </div>
                <span className="flex items-center gap-2">
                  <span className="hidden items-center gap-1 text-[8.5px] text-[#b39aa8] sm:flex">
                    <BookOpen className="size-2.5" aria-hidden="true" /> {lesson.number} · {lesson.pages}
                  </span>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="print-button no-print"
                    aria-label="طباعة حل هذه المسألة"
                  >
                    <Printer className="size-3" aria-hidden="true" />
                    طباعة
                  </button>
                </span>
              </div>
              <h2 className="mt-2 flex items-center gap-2 text-xl font-bold tracking-tight text-[#301545] sm:text-[23px]">
                <span aria-hidden="true">{problem.emoji}</span>
                {problem.title}
              </h2>
              <div className="mt-2 rounded-xl border border-[#f9e3ec] bg-white/60 p-3">
                {problem.prompt.map((paragraph, paragraphIndex) => (
                  <p key={paragraphIndex} className="text-[11px] leading-7 text-[#743f76]">
                    <MathText text={paragraph} />
                  </p>
                ))}
              </div>
            </header>

            <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[0.95fr_1.05fr]">
              <div className="space-y-3">
                <ProblemFigure spec={problem.figure} />
                <div className="answer-idea-card">
                  <div className="flex items-center gap-1.5">
                    <span className="grid size-5 place-items-center rounded-md bg-[#f9e3ec] text-[#763f4e]">
                      <Lightbulb className="size-3" aria-hidden="true" />
                    </span>
                    <h3 className="text-[10.5px] font-bold text-[#441b67]">فكرة الحل</h3>
                  </div>
                  <p className="mt-1.5 text-[10.5px] leading-6 text-[#763f4e]">
                    <MathText text={problem.solution.idea} />
                  </p>
                </div>
              </div>

              <div className="min-w-0">
                <div className="mb-3 flex items-center gap-2">
                  <span className="grid size-6 place-items-center rounded-lg bg-[#f9e3ec] text-[#763f4e]">
                    <NotebookPen className="size-3.5" aria-hidden="true" />
                  </span>
                  <h3 className="text-[11.5px] font-bold text-[#441b67]">خطوات الحل</h3>
                  <span className="rounded-md bg-[#f9e3ec] px-1.5 py-0.5 text-[8px] font-semibold text-[#b39aa8]">
                    {ar(problem.solution.steps.length)} خطوات
                  </span>
                </div>
                <ol className="space-y-4">
                  {problem.solution.steps.map((step, stepIndex) => (
                    <li key={step.title} className="solution-step">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="grid size-4 place-items-center rounded-full bg-[#f9e3ec] text-[8px] font-bold text-[#763f4e]">
                          {ar(stepIndex + 1)}
                        </span>
                        <h4 className="text-[10.5px] font-semibold text-[#441b67]">{step.title}</h4>
                        {stepIndex === problem.solution.steps.length - 1 ? (
                          <span className="rounded bg-[#f9e3ec] px-1 py-px text-[7px] font-semibold text-[#763f4e]">الخطوة الأخيرة</span>
                        ) : null}
                      </div>
                      <div className="mt-1.5 rounded-xl border border-[#f9e3ec] bg-[#fcf5f7] px-3 py-2 text-[11px] leading-7 text-[#441b67]">
                        <MathText text={step.body} />
                      </div>
                    </li>
                  ))}
                </ol>

                <div className="teacher-answer mt-4 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 text-[9px] font-semibold text-[#f8c8db]">
                      <CheckCircle2 className="size-3 text-[#ef97bd]" aria-hidden="true" />
                      {problem.solution.answer.label}
                    </span>
                    <span className="rounded-full border border-white/15 bg-white/10 px-2 py-0.5 text-[7.5px] text-[#e0b8c5]">الناتج النهائي</span>
                  </div>
                  <div className="answer-plate mt-2 rounded-xl bg-white/95 px-3 py-2.5" dir="ltr">
                    <TeX tex={problem.solution.answer.tex} display />
                  </div>
                  <p className="mt-2 flex items-start gap-1.5 text-[9px] leading-5 text-[#f8c8db]">
                    <BadgeCheck className="mt-0.5 size-3 shrink-0 text-[#e3cffb]" aria-hidden="true" />
                    {problem.solution.answer.note}
                  </p>
                </div>

                <div className="mt-3 rounded-xl border border-[#f1e6ff] bg-[#faf4ff] p-3">
                  <h3 className="flex items-center gap-1.5 text-[10px] font-bold text-[#9160cf]">
                    <GraduationCap className="size-3.5" aria-hidden="true" />
                    ملاحظة للمعلم
                  </h3>
                  <p className="mt-1 text-[9.5px] leading-6 text-[#b183e6]">{problem.solution.teacherNote}</p>
                </div>
              </div>
            </div>

            <footer className="solution-foot">
              <button
                type="button"
                onClick={() => onIndexChange((index - 1 + problems.length) % problems.length)}
                className="pager-button"
                aria-label="حل المسألة السابقة"
              >
                <ArrowRight className="size-3.5" aria-hidden="true" />
                الحل السابق
              </button>
              <span className="flex items-center gap-1 text-[8.5px] text-[#b39aa8]">
                <LockKeyhole className="size-2.5" aria-hidden="true" /> هذه الصفحة للمعلم
              </span>
              <button
                type="button"
                onClick={() => onIndexChange((index + 1) % problems.length)}
                className="pager-button pager-button-primary"
                aria-label="حل المسألة التالية"
              >
                الحل التالي
                <ArrowLeft className="size-3.5" aria-hidden="true" />
              </button>
            </footer>
          </article>

          {/* Quick answer key */}
          <section className="answer-key mt-4" aria-labelledby="answer-key-title">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#f8c8db] px-4 py-3">
              <h2 id="answer-key-title" className="flex items-center gap-1.5 text-[11px] font-bold text-[#441b67]">
                <Sigma className="size-3.5 text-[#b183e6]" aria-hidden="true" />
                مفتاح الإجابات السريع — {lesson.title}
              </h2>
              <span className="text-[8.5px] text-[#b39aa8]">{ar(problems.length)} نتائج نهائية</span>
            </div>
            <div className="grid gap-2 p-3 sm:grid-cols-2 xl:grid-cols-3">
              {problems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onIndexChange(item.number - 1)}
                  className={cn(
                    "flex items-start gap-2 rounded-xl border p-2.5 text-right transition",
                    item.id === problem.id
                      ? "border-[#ef97bd] bg-[#fcf5f7]"
                      : "border-[#f9e3ec] bg-white/55 hover:border-[#f8c8db] hover:bg-white"
                  )}
                >
                  <span className="grid size-5 flex-none place-items-center rounded-md bg-[#f9e3ec] text-[8px] font-bold text-[#763f4e]">
                    {padAr(item.number)}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[8.5px] font-medium text-[#b39aa8]">{item.title}</span>
                    <span className="mt-0.5 block overflow-hidden text-[9px] font-semibold leading-5 text-[#441b67]">
                      <TeX tex={item.solution.answer.tex} />
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </section>

          <div className="mt-3 flex flex-col items-start justify-between gap-2 rounded-xl border border-[#f8c8db] bg-white/55 px-3 py-2.5 sm:flex-row sm:items-center">
            <p className="flex items-center gap-1.5 text-[9px] text-[#b39aa8]">
              <LockKeyhole className="size-3" aria-hidden="true" />
              الحلول مخصّصة للمعلم: لا تلميحات ولا كشف داخل صفحات الطالب.
            </p>
            <p className="flex items-center gap-1.5 text-[9px] text-[#b39aa8]">
              <Sparkles className="size-3 text-[#b183e6]" aria-hidden="true" />
              إعداد: {site.teacher}
            </p>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 px-1">
            <button type="button" onClick={() => onNavigate(lessonId)} className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-[#763f4e] hover:text-[#441b67]">
              <ChevronLeft className="size-3.5 rotate-180" aria-hidden="true" />
              رجوع إلى تبويب مسائل {lesson.title}
            </button>
            <button type="button" onClick={() => onNavigate("home")} className="inline-flex items-center gap-1.5 text-[10px] font-medium text-[#b39aa8] hover:text-[#743f76]">
              الرئيسية
              <ChevronLeft className="size-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
