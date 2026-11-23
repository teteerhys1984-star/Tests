import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  BookMarked,
  Check,
  ChevronLeft,
  CircleDot,
  Clock3,
  GraduationCap,
  Layers3,
  LockKeyhole,
  NotebookPen,
  Presentation,
  Rocket,
  Scale,
  Sparkles,
  Target,
} from "lucide-react";
import type { LessonId } from "@/content/problems";
import { lessons, problemsByLesson } from "@/content/problems";
import type { AppTab } from "@/lib/site";
import { ar, levelStyle, padAr } from "@/lib/format";
import { MathText, Formula } from "@/components/MathText";
import { ProblemFigure } from "@/components/Figures";
import { cn } from "@/utils/cn";

export function LessonView({
  lessonId,
  index,
  onIndexChange,
  onNavigate,
}: {
  lessonId: LessonId;
  index: number;
  onIndexChange: (index: number) => void;
  onNavigate: (tab: AppTab) => void;
}) {
  const lesson = lessons[lessonId];
  const problems = problemsByLesson[lessonId];
  const problem = problems[Math.min(index, problems.length - 1)];
  const isMotion = lessonId === "motion";
  const LessonIcon = isMotion ? Rocket : Scale;
  const otherLesson: LessonId = isMotion ? "force" : "motion";

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
                  <Clock3 className="size-3" aria-hidden="true" /> {lesson.duration}
                </span>
              </span>
              <h1 className="mt-2 flex flex-wrap items-center gap-2 text-[27px] font-bold tracking-tight text-[#301545] sm:text-[34px]">
                {lesson.title}
                <span className="emoji text-lg sm:text-xl" aria-hidden="true">{lesson.emoji}</span>
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
                  {ar(problems.length)} مسائل حسابية
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
                <span className="text-[8px] text-[#b39aa8]">ثابت</span>
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
          <span>تبويبات المسائل</span>
          <span className="text-[#dcc4d1]">/</span>
          <span className="font-semibold text-[#743f76]">{ar(problems.length)} محطات في هذا الدرس</span>
        </div>
        <button
          type="button"
          onClick={() => onNavigate("teacher")}
          className="inline-flex items-center gap-1.5 rounded-xl border border-[#e3cffb] bg-[#faf4ff] px-3 py-1.5 text-[10px] font-semibold text-[#9160cf] transition hover:border-[#e3cffb] hover:bg-[#f1e6ff]"
        >
          <LockKeyhole className="size-3" aria-hidden="true" />
          الحلول في منطقة المعلم
          <ChevronLeft className="size-3" aria-hidden="true" />
        </button>
      </div>

      <div className="mt-3 grid gap-4 lg:grid-cols-[275px_minmax(0,1fr)] lg:items-start">
        {/* Desktop navigation */}
        <aside className="paper-card hidden p-3 lg:sticky lg:top-[96px] lg:block" aria-label="قائمة مسائل الدرس">
          <div className="flex items-center justify-between gap-2 px-2 pb-2">
            <span className="flex items-center gap-1.5 text-[10.5px] font-bold text-[#441b67]">
              <span className="grid size-5 place-items-center rounded-md bg-[#f9e3ec] text-[#763f4e]">
                <Target className="size-3" aria-hidden="true" />
              </span>
              محطات المسائل
            </span>
            <span className="rounded-md bg-[#f9e3ec] px-1.5 py-0.5 text-[9px] font-semibold text-[#b39aa8]">{ar(problems.length)}</span>
          </div>

          <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-[#f9e3ec]" aria-hidden="true">
            <div className="h-full rounded-full bg-gradient-to-l from-[#b183e6] to-[#743f76] transition-all duration-500" style={{ width: `${((index + 1) / problems.length) * 100}%` }} />
          </div>

          <div role="tablist" aria-label="مسائل الدرس" aria-orientation="vertical" className="space-y-1">
            {problems.map((item, itemIndex) => {
              const isActive = itemIndex === index;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => onIndexChange(itemIndex)}
                  className={cn("problem-tab", isActive && "problem-tab-active")}
                >
                  <span
                    className={cn(
                      "grid size-7 flex-none place-items-center rounded-lg text-[10px] font-bold transition",
                      isActive ? "bg-[#441b67] text-[#faf4ff] shadow-sm" : "bg-[#f9e3ec] text-[#b39aa8]"
                    )}
                  >
                    {padAr(item.number)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={cn("block truncate text-[10.5px] font-semibold", isActive ? "text-[#301545]" : "text-[#743f76]")}>{item.title}</span>
                    <span className="mt-0.5 block truncate text-[8.5px] text-[#b39aa8]">{item.topic}</span>
                  </span>
                  {isActive ? <ChevronLeft className="size-3 flex-none text-[#9c5469]" aria-hidden="true" /> : null}
                </button>
              );
            })}
          </div>

          <div className="mt-3 rounded-xl border border-dashed border-[#f8c8db] bg-[#fcf5f7] p-2.5">
            <p className="flex items-start gap-1.5 text-[9px] leading-5 text-[#b39aa8]">
              <Presentation className="mt-0.5 size-3 shrink-0 text-[#b183e6]" aria-hidden="true" />
              خطوات الحل والناتج النهائي محفوظة في منطقة المعلم، بعيدًا عن تبويبات المسائل.
            </p>
          </div>
        </aside>

        <div className="min-w-0">
          {/* Mobile navigation */}
          <div className="mb-3 lg:hidden">
            <div className="flex items-center justify-between gap-2 px-0.5 pb-2">
              <span className="flex items-center gap-1.5 text-[10px] font-semibold text-[#743f76]">
                <Target className="size-3.5" aria-hidden="true" />
                اختر المسألة
              </span>
              <span className="text-[9px] font-medium text-[#b39aa8]">{ar(index + 1)} من {ar(problems.length)}</span>
            </div>
            <div role="tablist" aria-label="مسائل الدرس" className="scrollbar-none flex gap-1.5 overflow-x-auto pb-1">
              {problems.map((item, itemIndex) => {
                const isActive = itemIndex === index;
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => onIndexChange(itemIndex)}
                    className={cn(
                      "flex min-w-[49px] flex-col items-center gap-0.5 rounded-xl border px-2 py-1.5 transition",
                      isActive
                        ? "border-[#441b67] bg-[#441b67] text-white shadow-sm"
                        : "border-[#f8c8db] bg-white/70 text-[#b39aa8] hover:border-[#ef97bd]"
                    )}
                    aria-label={`المسألة ${item.number}: ${item.title}`}
                  >
                    <span className="text-[11px] font-bold">{padAr(item.number)}</span>
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
                    المسألة <span dir="ltr">{padAr(problem.number)}</span>
                  </span>
                  <span className={cn("rounded-lg px-2 py-1 text-[9px] font-semibold ring-1", levelStyle[problem.level])}>{problem.level}</span>
                  <span className="rounded-lg bg-[#fcf5f7] px-2 py-1 text-[9px] font-medium text-[#b39aa8] ring-1 ring-[#f9e3ec]">{problem.topic}</span>
                </div>
                <span className="flex items-center gap-1 rounded-full bg-white/70 px-2 py-1 text-[8.5px] text-[#b39aa8] ring-1 ring-[#f9e3ec]">
                  <Sparkles className="size-2.5 text-[#b183e6]" aria-hidden="true" />
                  مسألة حسابية
                </span>
              </div>
              <h2 className="mt-2.5 flex items-center gap-2 text-xl font-bold tracking-tight text-[#301545] sm:text-[23px]">
                <span className="emoji text-lg" aria-hidden="true">{problem.emoji}</span>
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

                <div className="mt-4 rounded-2xl border border-[#f8c8db] bg-[#fcf5f7] p-3">
                  <div className="mb-1.5 flex items-center gap-1.5">
                    <span className="grid size-5 place-items-center rounded-md bg-[#f9e3ec] text-[#763f4e]">
                      <NotebookPen className="size-3" aria-hidden="true" />
                    </span>
                    <h3 className="text-[10.5px] font-bold text-[#441b67]">المطلوب</h3>
                  </div>
                  <ol className="space-y-1.5">
                    {problem.questions.map((question, questionIndex) => (
                      <li key={questionIndex} className="flex items-start gap-2 text-[10.5px] leading-6 text-[#743f76]">
                        <span className="mt-0.5 grid size-4 flex-none place-items-center rounded-full border border-[#ef97bd] bg-white text-[8px] font-bold text-[#763f4e]">
                          {ar(questionIndex + 1)}
                        </span>
                        <MathText text={question} />
                      </li>
                    ))}
                  </ol>
                </div>

                <div className="mt-3 flex items-start gap-2 rounded-xl border border-dashed border-[#f8c8db] bg-white/55 p-2.5 text-[9px] leading-5 text-[#b39aa8]">
                  <GraduationCap className="mt-0.5 size-3.5 shrink-0 text-[#b183e6]" aria-hidden="true" />
                  <p>
                    حلّ المسألة كاملة على دفترك. عند المراجعة، يفتح المعلم تبويب <span className="font-semibold text-[#763f4e]">منطقة المعلم</span> ليعرض الخطوات والناتج.
                  </p>
                </div>
              </div>

              <div className="min-w-0">
                <ProblemFigure spec={problem.figure} />
                <div className="mt-2.5 flex items-center justify-between gap-2 px-1 text-[8.5px] text-[#b39aa8]">
                  <span className="flex items-center gap-1">
                    <BadgeCheck className="size-2.5 text-[#9c5469]" aria-hidden="true" /> مشهد خاص بالمسألة
                  </span>
                  <span dir="ltr">fig. {padAr(problem.number)}</span>
                </div>
              </div>
            </div>

            <footer className="problem-card-foot">
              <button
                type="button"
                onClick={() => onIndexChange((index - 1 + problems.length) % problems.length)}
                className="pager-button"
                aria-label="المسألة السابقة"
              >
                <ArrowRight className="size-3.5" aria-hidden="true" />
                السابقة
              </button>

              <div className="flex flex-1 items-center justify-center gap-1">
                {problems.map((item, dotIndex) => (
                  <button
                    key={item.id}
                    type="button"
                    tabIndex={-1}
                    onClick={() => onIndexChange(dotIndex)}
                    className={cn(
                      "h-1 rounded-full transition-all",
                      dotIndex === index ? "w-5 bg-[#743f76]" : dotIndex < index ? "w-1.5 bg-[#e0b8c5]" : "w-1.5 bg-[#f8c8db]"
                    )}
                    aria-label={`الانتقال إلى المسألة ${item.number}`}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={() => onIndexChange((index + 1) % problems.length)}
                className="pager-button pager-button-primary"
                aria-label="المسألة التالية"
              >
                التالية
                <ArrowLeft className="size-3.5" aria-hidden="true" />
              </button>
            </footer>
          </article>

          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => onNavigate(otherLesson)}
              className="other-lesson-link"
            >
              <span className="grid size-7 place-items-center rounded-lg bg-[#f9e3ec] text-[#763f4e]">
                {otherLesson === "motion" ? <Rocket className="size-3.5" aria-hidden="true" /> : <Scale className="size-3.5" aria-hidden="true" />}
              </span>
              <span className="text-right">
                <span className="block text-[8px] text-[#b39aa8]">بدّل الدرس</span>
                <span className="block text-[10px] font-semibold text-[#743f76]">{otherLesson === "motion" ? "الحركة والسكون" : "القوة والحركة"}</span>
              </span>
              <ChevronLeft className="ms-auto size-3.5 text-[#b39aa8]" aria-hidden="true" />
            </button>
            <button type="button" onClick={() => onNavigate("teacher")} className="other-lesson-link other-lesson-link-teacher">
              <span className="grid size-7 place-items-center rounded-lg bg-[#f1e6ff] text-[#9160cf]">
                <LockKeyhole className="size-3.5" aria-hidden="true" />
              </span>
              <span className="text-right">
                <span className="block text-[8px] text-[#b183e6]">خاص بالمعلم</span>
                <span className="block text-[10px] font-semibold text-[#7842b6]">افتح الحلول الكاملة</span>
              </span>
              <ChevronLeft className="ms-auto size-3.5 text-[#cdaaf2]" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
