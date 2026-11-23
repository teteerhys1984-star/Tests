import { useState } from "react";
import {
  ArrowLeft,
  Award,
  BadgeCheck,
  BookOpen,
  Calculator,
  CheckCircle2,
  Compass,
  FlaskConical,
  Gauge,
  GraduationCap,
  LockKeyhole,
  MousePointerClick,
  NotebookPen,
  PenLine,
  Play,
  RotateCcw,
  Rocket,
  Scale,
  Sparkles,
  Star,
  TrendingUp,
  User,
} from "lucide-react";
import { EXAM_TITLE, TOTAL_MARKS } from "@/config";
import { allProblems, lessonList, problemsByLesson } from "@/content/problems";
import { allSubparts } from "@/exam/spec";
import type { ExamAttempt } from "@/exam/types";
import type { AppTab } from "@/lib/site";
import { Formula } from "@/components/MathText";
import { ProblemFigure } from "@/components/Figures";
import { AtomGlyph, SectionHeading } from "@/components/Chrome";

function HeroVisual() {
  return (
    <div className="hero-visual" aria-label="رسم توضيحي يجمع بين الحركة والقوة والكتابة العلمية">
      <div className="hero-stage">
        <div className="hero-grid" aria-hidden="true" />
        <div className="hero-glow hero-glow-a" aria-hidden="true" />
        <div className="hero-glow hero-glow-b" aria-hidden="true" />
        <span className="hero-side-label hero-side-label-a">مختبر الحركة</span>
        <span className="hero-side-label hero-side-label-b">ميزان القوى</span>

        <div className="hero-orbit-wrap" aria-hidden="true">
          <svg viewBox="0 0 440 440" className="h-full w-full">
            <defs>
              <radialGradient id="heroNucleus" cx=".35" cy=".28" r=".8">
                <stop offset="0" stopColor="#ef97bd" />
                <stop offset="0.55" stopColor="#743f76" />
                <stop offset="1" stopColor="#301545" />
              </radialGradient>
              <linearGradient id="heroRing" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#9c5469" />
                <stop offset="0.55" stopColor="#ef97bd" />
                <stop offset="1" stopColor="#b183e6" />
              </linearGradient>
            </defs>
            <circle cx="220" cy="220" r="181" fill="none" stroke="#9c5469" strokeOpacity=".2" strokeDasharray="2 9" />
            <circle cx="220" cy="220" r="146" fill="none" stroke="#9c5469" strokeOpacity=".15" />
            <ellipse cx="220" cy="220" rx="170" ry="69" fill="none" stroke="url(#heroRing)" strokeOpacity=".7" strokeWidth="1.5" transform="rotate(-36 220 220)" />
            <ellipse cx="220" cy="220" rx="170" ry="69" fill="none" stroke="url(#heroRing)" strokeOpacity=".45" strokeWidth="1.2" transform="rotate(34 220 220)" />
            <ellipse cx="220" cy="220" rx="132" ry="132" fill="none" stroke="#b98395" strokeOpacity=".25" />
            <path d="M70 345c42-35 80-41 123-20s76 19 177-34" fill="none" stroke="#9c5469" strokeOpacity=".26" strokeWidth="1.3" strokeDasharray="3 7" />
            <circle cx="92" cy="144" r="7" fill="#e3cffb" stroke="#faf4ff" strokeWidth="2" />
            <circle cx="349" cy="163" r="5.5" fill="#f8c8db" stroke="#441b67" strokeWidth="1.5" />
            <circle cx="331" cy="338" r="4.5" fill="#f8c8db" />
            <circle cx="220" cy="220" r="73" fill="url(#heroNucleus)" />
            <circle cx="220" cy="220" r="73" fill="none" stroke="#f1e6ff" strokeOpacity=".25" strokeWidth="1" />
            <circle cx="196" cy="195" r="24" fill="#ffffff" fillOpacity=".06" />
            <g transform="translate(220 220)" fill="none" stroke="#f1e6ff" strokeOpacity=".85" strokeWidth="2.2">
              <ellipse rx="44" ry="17" transform="rotate(26)" />
              <ellipse rx="44" ry="17" transform="rotate(-38)" />
            </g>
            <circle cx="220" cy="220" r="7.5" fill="#e3cffb" />
            <circle cx="268" cy="254" r="3.4" fill="#f1e6ff" />
            <circle cx="170" cy="242" r="3" fill="#f1e6ff" />
            <text x="220" y="277" textAnchor="middle" fill="#f1e6ff" fillOpacity=".7" fontSize="9" fontFamily="IBM Plex Sans Arabic, sans-serif" direction="ltr">
              PHYSICS · 7
            </text>
          </svg>
        </div>

        <div className="hero-chip hero-chip-title">
          <span className="hero-chip-icon">
            <Sparkles className="size-3.5" aria-hidden="true" />
          </span>
          <span>
            <span className="block text-[8.5px] font-medium text-[#b39aa8]">مساحة الفهم</span>
            <span className="block text-[10.5px] font-bold text-[#301545]">مسائل تُحلّ… لا تُحفظ</span>
          </span>
        </div>

        <div className="hero-chip hero-chip-motion">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#f9e3ec] text-[#743f76]">
            <Gauge className="size-4" aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <span className="block text-[8px] font-medium text-[#b39aa8]">الدرس الأول</span>
            <span className="mt-0.5 block text-[10px] font-bold text-[#441b67]">الحركة والسكون</span>
            <span className="mt-1 flex gap-1" aria-hidden="true">
              {[0, 1, 2, 3, 4].map((item) => (
                <span key={item} className="h-1 w-3 rounded-full bg-[#b98395]" />
              ))}
            </span>
          </span>
        </div>

        <div className="hero-chip hero-chip-force">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#f1e6ff] text-[#9160cf]">
            <Scale className="size-4" aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <span className="block text-[8px] font-medium text-[#b183e6]">الدرس الثاني</span>
            <span className="mt-0.5 block text-[10px] font-bold text-[#7842b6]">القوة والحركة</span>
            <span className="mt-1 block text-[8.5px] text-[#b183e6]" dir="ltr">
              w = m · g
            </span>
          </span>
        </div>

        <div className="hero-book">
          <div className="hero-book-binding" aria-hidden="true" />
          <span className="text-[8px] font-semibold tracking-wide text-[#b39aa8]">NOTEBOOK</span>
          <span className="mt-0.5 flex items-center gap-1 text-[9px] font-bold text-[#441b67]">
            <PenLine className="size-3" aria-hidden="true" /> دفتر الحلول
          </span>
          <span className="mt-1.5 flex gap-1" aria-hidden="true">
            {[0, 1, 2, 3].map((item) => (
              <span key={item} className="h-0.5 w-5 rounded-full bg-[#ef97bd]" />
            ))}
          </span>
        </div>

        <div className="hero-car" aria-hidden="true">
          <span className="hero-car-road" aria-hidden="true" />
          <span className="hero-car-badge">
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="#fff6fb" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 17h14M4 17v-4l2-5h12l2 5v4M7 17v2M17 17v2" />
              <circle cx="8" cy="13" r="1.1" fill="#fff6fb" stroke="none" />
              <circle cx="16" cy="13" r="1.1" fill="#fff6fb" stroke="none" />
            </svg>
          </span>
        </div>

        <div className="hero-star" aria-hidden="true">
          <Star className="size-4 fill-[#c084fc] text-[#c084fc]" />
        </div>

        <svg className="hero-bow" viewBox="0 0 120 90" aria-hidden="true">
          <defs>
            <linearGradient id="bowPink" x1="12" y1="8" x2="104" y2="82" gradientUnits="userSpaceOnUse">
              <stop stopColor="#ff8fc2" />
              <stop offset="0.55" stopColor="#ec4899" />
              <stop offset="1" stopColor="#a855f7" />
            </linearGradient>
          </defs>
          <path d="M56 42C38 15 16 12 12 32c-4 18 14 32 40 16Z" fill="url(#bowPink)" />
          <path d="M64 42C82 15 104 12 108 32c4 18-14 32-40 16Z" fill="url(#bowPink)" />
          <path d="M52 50C36 64 20 68 20 78c0 8 12 10 26-12Z" fill="#f472b6" opacity=".9" />
          <path d="M68 50c16 14 32 18 32 28 0 8-12 10-26-12Z" fill="#a855f7" opacity=".85" />
          <rect x="53" y="38" width="14" height="18" rx="6" fill="#fff1f8" />
          <circle cx="60" cy="46" r="3.2" fill="#ec4899" />
        </svg>

        <svg className="hero-butterfly" viewBox="0 0 70 60" aria-hidden="true">
          <g fill="none" stroke="#a855f7" strokeWidth="1.6" strokeOpacity=".85">
            <path d="M34 30C18 8 6 16 12 30c4 10 15 9 22 4Z" fill="#f9d4ff" fillOpacity=".85" />
            <path d="M36 30c16-22 28-14 22 0-4 10-15 9-22 4Z" fill="#ffd6ea" fillOpacity=".9" />
            <path d="M33 34c-8 8-16 12-13 19 3 6 12 1 14-11Z" fill="#ffe3f1" fillOpacity=".9" />
            <path d="M37 34c8 8 16 12 13 19-3 6-12 1-14-11Z" fill="#f5dcff" fillOpacity=".9" />
          </g>
          <path d="M35 24v20" stroke="#9d4edd" strokeWidth="2" strokeLinecap="round" />
          <path d="M35 24c-3-5-6-7-9-8M35 24c3-5 6-7 9-8" stroke="#9d4edd" strokeWidth="1.2" strokeLinecap="round" fill="none" />
        </svg>

        <span className="hero-heart hero-heart-a" aria-hidden="true">♡</span>
        <span className="hero-heart hero-heart-b" aria-hidden="true">♥</span>
      </div>
      <div className="mt-3 flex items-center justify-between gap-3 px-1 text-[10px] text-[#b39aa8]">
        <span className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-[#763f4e]" aria-hidden="true" />
          رسوم تفاعلية للمسائل
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-[#b183e6]" aria-hidden="true" />
          تصحيح آلي فوري
        </span>
      </div>
    </div>
  );
}

const steps = [
  {
    icon: MousePointerClick,
    title: "أدخل اسمك وابدأ",
    text: "20 مسألة حسابية مرتّبة: 10 مسائل من درس الحركة والسكون و10 من درس القوة والحركة.",
  },
  {
    icon: NotebookPen,
    title: "احسب وأدخل إجابتك",
    text: "احسب على ورقة ثم أدخل الناتج العددي في كل فرع. تُحفظ إجاباتك تلقائيًا في المتصفح.",
  },
  {
    icon: GraduationCap,
    title: "راجع وسلّم الاختبار",
    text: "راجع جميع المسائل قبل التسليم، ثم احصل على علامتك وتقريرك النصي التفصيلي فورًا.",
  },
];

export function Welcome({
  attempt,
  onStartNew,
  onResume,
  onViewResults,
  onNavigate,
}: {
  attempt: ExamAttempt | null;
  onStartNew: (studentName: string) => void;
  onResume: () => void;
  onViewResults: () => void;
  onNavigate: (tab: AppTab) => void;
}) {
  const [nameInput, setNameInput] = useState(attempt?.studentName ?? "");
  const [nameError, setNameError] = useState<string | null>(null);

  const answeredSubpartsCount = attempt
    ? allSubparts.filter((sp) => (attempt.responses[sp.id] ?? "").trim().length > 0).length
    : 0;

  const handleStartSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = nameInput.trim();
    if (cleaned.length < 2) {
      setNameError("يرجى إدخال اسم الطالب/ة قبل بدء الاختبار.");
      return;
    }
    setNameError(null);
    onStartNew(cleaned);
  };

  return (
    <div className="pb-4">
      {/* Hero */}
      <section className="mx-auto max-w-7xl px-4 pb-3 pt-7 sm:px-6 sm:pt-10">
        <div className="grid items-center gap-9 lg:grid-cols-[1.06fr_0.94fr] lg:gap-10">
          <div className="animate-fade-up text-center lg:text-right">
            <div className="flex flex-wrap items-center justify-center gap-2 lg:justify-start">
              <span className="eyebrow">
                <span className="relative flex size-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#9c5469] opacity-60" />
                  <span className="relative inline-flex size-1.5 rounded-full bg-[#612397]" />
                </span>
                الصف السابع • الفصل الأول • الفيزياء
              </span>
              <span className="eyebrow">
                <BookOpen className="size-3" aria-hidden="true" />
                الدرس الأول + الثاني
              </span>
            </div>

            <h1 className="mt-4 text-[34px] font-bold leading-[1.2] tracking-[-0.03em] text-[#301545] sm:text-5xl lg:text-[50px]">
              {EXAM_TITLE}
              <AtomGlyph className="mx-2 h-8 w-8 align-middle sm:h-11 sm:w-11" />
              <span className="hero-underline" aria-hidden="true" />
            </h1>
            <p className="mt-4 text-[14px] font-medium leading-8 text-[#743f76] sm:text-base">
              اختبار إلكتروني تفاعلي يضم <span className="font-bold text-[#441b67]">20 مسألة حسابية</span> من درس الحركة والسكون ودرس القوة والحركة…
              مرتّبة بمشاهد واضحة وتصحيح فوري من {TOTAL_MARKS} درجة.
            </p>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[11px] text-[#b39aa8] lg:justify-start">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="size-3.5 text-[#743f76]" aria-hidden="true" /> {allProblems.length} مسألة ({allSubparts.length} فرعًا)
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="size-3.5 text-[#743f76]" aria-hidden="true" /> حفظ تلقائي للإجابات
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="size-3.5 text-[#743f76]" aria-hidden="true" /> تقرير TXT تفصيلي
              </span>
            </div>

            {/* Active / Saved Attempt Banner */}
            {attempt && attempt.status === "in_progress" && (
              <div className="mt-5 rounded-2xl border border-[#ef97bd] bg-white/90 p-4 text-right shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#b81f68]">
                      <Play className="size-3.5" aria-hidden="true" />
                      لديك محاولة محفوظة قيد التقدّم
                    </span>
                    <p className="mt-1 text-xs text-[#441b67]">
                      الطالب/ة: <strong>{attempt.studentName}</strong> — تم حل{" "}
                      <strong>{answeredSubpartsCount}</strong> من <strong>{allSubparts.length}</strong> فرعًا
                    </p>
                  </div>
                  <button type="button" onClick={onResume} className="primary-cta py-2.5 text-xs">
                    <Play className="size-3.5" aria-hidden="true" />
                    متابعة الاختبار
                  </button>
                </div>
              </div>
            )}

            {attempt && attempt.status === "submitted" && (
              <div className="mt-5 rounded-2xl border border-[#e3cffb] bg-[#faf4ff] p-4 text-right shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#612397]">
                      <Award className="size-3.5" aria-hidden="true" />
                      تم تسليم المحاولة السابقة
                    </span>
                    <p className="mt-1 text-xs text-[#441b67]">
                      الطالب/ة: <strong>{attempt.studentName}</strong> — يمكنك مراجعة نتيجتك أو بدء محاولة جديدة.
                    </p>
                  </div>
                  <button type="button" onClick={onViewResults} className="primary-cta py-2.5 text-xs">
                    <Award className="size-3.5" aria-hidden="true" />
                    عرض النتيجة والتقرير
                  </button>
                </div>
              </div>
            )}

            {/* Start New Attempt Form */}
            <form onSubmit={handleStartSubmit} className="mt-5 rounded-2xl border border-[#f8c8db] bg-white/85 p-4 text-right shadow-sm" noValidate>
              <label htmlFor="student-name-input" className="flex items-center gap-1.5 text-xs font-bold text-[#301545]">
                <User className="size-3.5 text-[#b81f68]" aria-hidden="true" />
                اسم الطالب / الطالبة
              </label>
              <div className="mt-2 flex flex-col gap-2.5 sm:flex-row">
                <input
                  id="student-name-input"
                  type="text"
                  value={nameInput}
                  onChange={(e) => {
                    setNameInput(e.target.value);
                    if (nameError) setNameError(null);
                  }}
                  placeholder="اكتب اسمك الكامل هنا (مثال: حلا الأحمد)..."
                  className="exam-name-input flex-1"
                  required
                />
                <button type="submit" className="primary-cta shrink-0 justify-center">
                  {attempt ? <RotateCcw className="size-4" aria-hidden="true" /> : <Rocket className="size-4" aria-hidden="true" />}
                  {attempt ? "بدء محاولة جديدة" : "ابدأ الاختبار الآن"}
                  <ArrowLeft className="size-4" aria-hidden="true" />
                </button>
              </div>
              {nameError && (
                <p className="mt-2 text-xs font-semibold text-[#c2185b]" role="alert">
                  {nameError}
                </p>
              )}
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[10.5px] text-[#743f76]">
                <span>ملاحظة: يتم حفظ إجاباتك تلقائيًا بعد كل سؤال.</span>
                <button
                  type="button"
                  onClick={() => onNavigate("teacher")}
                  className="inline-flex items-center gap-1 font-semibold text-[#9160cf] hover:text-[#441b67]"
                >
                  <LockKeyhole className="size-3" aria-hidden="true" />
                  منطقة المعلم
                </button>
              </div>
            </form>

            <div className="mt-6 grid max-w-md grid-cols-3 gap-2 max-lg:mx-auto">
              {[
                { value: "20", label: "مسألة حسابية" },
                { value: "48", label: "فرعًا مطلوبًا" },
                { value: "100", label: "درجة كلية" },
              ].map((stat, index) => (
                <div key={stat.label} className="hero-stat">
                  <span className="block text-lg font-bold text-[#441b67] sm:text-xl" dir="ltr">{stat.value}</span>
                  <span className="mt-0.5 block text-[9.5px] text-[#b39aa8]">{stat.label}</span>
                  {index === 1 && <span className="absolute inset-x-4 bottom-0 h-0.5 rounded-full bg-[#b183e6]/30" aria-hidden="true" />}
                </div>
              ))}
            </div>
          </div>

          <div className="animate-fade-up [animation-delay:120ms]">
            <HeroVisual />
          </div>
        </div>
      </section>

      {/* Values strip */}
      <section className="mx-auto max-w-7xl px-4 py-7 sm:px-6">
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Calculator, title: "مسائل حسابية دقيقة", text: "أرقام وقوانين وتحويل وحدات من الدرسين الأول والثاني.", tone: "green" },
            { icon: Gauge, title: "رسوم ومشاهد توضيحية", text: "طريق، خط بياني، ربيعة قياس، وأشعة قوة لكل مسألة.", tone: "gold" },
            { icon: BadgeCheck, title: "RTL وLTR منضبطان", text: "النص العربي يمينًا، والمعادلات والأرقام يسارًا بوضوح.", tone: "green" },
            { icon: LockKeyhole, title: "تقارير وحلول للمعلم", text: "توزيع العلامات والحلول النموذجية محمية في منطقة المعلم.", tone: "gold" },
          ].map((item) => (
            <div key={item.title} className="value-card">
              <span className={item.tone === "gold" ? "value-icon value-icon-gold" : "value-icon"}>
                <item.icon className="size-4" aria-hidden="true" />
              </span>
              <div>
                <h3 className="text-[12px] font-bold text-[#441b67]">{item.title}</h3>
                <p className="mt-1 text-[10.5px] leading-5 text-[#b39aa8]">{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Lesson overview cards */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <SectionHeading
          eyebrow="محتوى الاختبار"
          icon={<Compass className="size-3.5" aria-hidden="true" />}
          title={
            <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
              درسان أساسيان… <span className="text-[#b183e6]">و50 درجة لكل درس</span>
            </span>
          }
          description="يغطي الاختبار المسائل العشر لدرس الحركة والسكون والمسائل العشر لدرس القوة والحركة بعلامة كاملة من 100 درجة."
          action={
            <div className="hidden items-center gap-2 rounded-xl border border-[#f8c8db] bg-white/65 px-3 py-2 text-[10px] text-[#b39aa8] sm:flex">
              <span className="size-1.5 rounded-full bg-[#9c5469]" aria-hidden="true" />
              10 مسائل لكل درس
            </div>
          }
        />

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {lessonList.map((lesson, index) => {
            const problems = problemsByLesson[lesson.id];
            const Icon = lesson.id === "motion" ? Rocket : Scale;
            return (
              <div
                key={lesson.id}
                className="lesson-card text-right"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className={index === 0 ? "lesson-medallion lesson-medallion-green" : "lesson-medallion lesson-medallion-gold"}>
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    <div>
                      <span className="text-[9.5px] font-semibold text-[#b39aa8]">{lesson.number} · {lesson.pages}</span>
                      <h3 className="mt-0.5 text-lg font-bold text-[#301545]">{lesson.title}</h3>
                    </div>
                  </div>
                  <span className="rounded-xl bg-[#f9e3ec] px-2.5 py-1 text-[10px] font-bold text-[#743f76]">
                    {problems.length} مسائل • 50 درجة
                  </span>
                </div>

                <p className="mt-3 text-xs leading-6 text-[#743f76]">{lesson.subtitle}</p>

                <div className="mt-3">
                  <Formula tex={lesson.formula.tex} />
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {lesson.skills.map((skill) => (
                    <span key={skill} className="rounded-lg border border-[#f8c8db] bg-white/75 px-2.5 py-1 text-[9.5px] font-medium text-[#743f76]">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Steps + sample preview */}
      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="paper-card p-5">
            <span className="eyebrow">
              <TrendingUp className="size-3.5" aria-hidden="true" />
              خطوات الحل في الاختبار
            </span>
            <h2 className="mt-2.5 text-xl font-bold text-[#301545]">كيف تقدّم الاختبار بثقة؟</h2>
            <div className="mt-4 space-y-3">
              {steps.map((step, i) => (
                <div key={step.title} className="flex items-start gap-3 rounded-2xl border border-[#f8c8db] bg-[#fff8fc] p-3">
                  <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-[#441b67] text-xs font-bold text-white">
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="text-xs font-bold text-[#301545]">{step.title}</h3>
                    <p className="mt-1 text-[11px] leading-6 text-[#743f76]">{step.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="min-w-0">
            <ProblemFigure spec={problemsByLesson.motion[0].figure} />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 pt-2 sm:px-6">
        <div className="flex flex-wrap items-center justify-center gap-2 text-[10px] text-[#b39aa8]">
          <FlaskConical className="size-3.5" aria-hidden="true" />
          <span>جاهز؟ أدخل اسمك بالأعلى واضغط على «ابدأ الاختبار الآن»</span>
        </div>
      </div>
    </div>
  );
}
