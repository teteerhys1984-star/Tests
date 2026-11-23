import {
  ArrowLeft,
  BadgeCheck,
  BookOpen,
  Calculator,
  CheckCircle2,
  ChevronLeft,
  Compass,
  FlaskConical,
  Gauge,
  GraduationCap,
  LockKeyhole,
  NotebookPen,
  Presentation,
  Rocket,
  Scale,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  PenLine,
  MousePointerClick,
} from "lucide-react";
import type { AppTab } from "@/lib/site";
import { lessonList, problemsByLesson } from "@/content/problems";
import { Formula } from "@/components/MathText";
import { ProblemFigure } from "@/components/Figures";
import { SectionHeading, AtomGlyph } from "@/components/Chrome";

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
          <g fill="#ffffff" opacity=".85">
            <circle cx="30" cy="30" r="2.4" />
            <circle cx="92" cy="34" r="2" />
            <circle cx="24" cy="56" r="1.6" />
          </g>
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
          رسوم أصلية للمسائل
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-[#b183e6]" aria-hidden="true" />
          رموز رياضية واضحة
        </span>
      </div>
    </div>
  );
}

const steps = [
  {
    icon: MousePointerClick,
    title: "اختر مسألتك",
    text: "كل درس فيه 10 مسائل مرتّبة. انتقل بينها بتبويبات سريعة، وركّز على مسألة واحدة.",
  },
  {
    icon: NotebookPen,
    title: "حل على ورقة",
    text: "دوّن المعطيات، حوّل الوحدات، وطبّق القانون. لا تلميحات ولا خطوات جاهزة قبل المحاولة.",
  },
  {
    icon: GraduationCap,
    title: "راجع مع المعلم",
    text: "الحل الكامل والملاحظات التربوية محفوظة في منطقة المعلم، لتكون المراجعة واضحة وموجّهة.",
  },
];

export function Home({ onNavigate }: { onNavigate: (tab: AppTab) => void }) {
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
                للصف السابع • الفصل الأول
              </span>
              <span className="eyebrow">
                <BookOpen className="size-3" aria-hidden="true" />
                الدرس الأول + الثاني
              </span>
            </div>

            <h1 className="mt-4 text-[38px] font-bold leading-[1.17] tracking-[-0.03em] text-[#301545] sm:text-5xl lg:text-[58px]">
              حلا <span className="text-[#b183e6]">والفيزياء</span>
              <AtomGlyph className="mx-1 h-8 w-8 align-middle sm:h-11 sm:w-11" />
              <span className="hero-underline" aria-hidden="true" />
            </h1>
            <p className="mt-4 text-[14px] font-medium leading-8 text-[#743f76] sm:text-base">
              مسائل حسابية <span className="font-bold text-[#441b67]">مبتكرة</span> من درس الحركة والسكون ودرس القوة والحركة…
              مرتّبة بتبويبات، ومرسومة بمشاهد تساعدك تفهم قبل ما تحسب. <span className="emoji" aria-hidden="true">🌿</span>
            </p>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[11px] text-[#b39aa8] lg:justify-start">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="size-3.5 text-[#743f76]" aria-hidden="true" /> 20 مسألة حسابية
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="size-3.5 text-[#743f76]" aria-hidden="true" /> بدون تلميحات
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="size-3.5 text-[#743f76]" aria-hidden="true" /> حلول في منطقة المعلم
              </span>
            </div>

            <div className="mt-6 flex flex-col justify-center gap-2.5 sm:flex-row lg:justify-start">
              <button type="button" onClick={() => onNavigate("motion")} className="primary-cta">
                <Rocket className="size-4" aria-hidden="true" />
                ابدأ بمسائل الدرس الأول
                <ArrowLeft className="size-4 transition group-hover:-translate-x-0.5" aria-hidden="true" />
              </button>
              <button type="button" onClick={() => onNavigate("teacher")} className="secondary-cta">
                <LockKeyhole className="size-3.5" aria-hidden="true" />
                منطقة المعلم
                <span className="rounded-md bg-[#f1e6ff] px-1.5 py-0.5 text-[9px] font-semibold text-[#9160cf]">الحلول</span>
              </button>
            </div>

            <div className="mt-7 grid max-w-md grid-cols-3 gap-2 max-lg:mx-auto">
              {[
                { value: "20", label: "مسألة أصلية" },
                { value: "2", label: "درسان" },
                { value: "100٪", label: "حساب وتفكير" },
              ].map((stat, index) => (
                <div key={stat.label} className="hero-stat">
                  <span className="block text-lg font-bold text-[#441b67] sm:text-xl">{stat.value}</span>
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
            { icon: Calculator, title: "مسائل حسابية فقط", text: "أرقام وقوانين وتحويل وحدات، بلا أسئلة نظرية.", tone: "green" },
            { icon: Gauge, title: "رسوم تفهمك أسرع", text: "مشاهد مكتوبة بصريًا: طريق، بيان، ميزان، وأشعة.", tone: "gold" },
            { icon: BadgeCheck, title: "RTL وLTR منضبطان", text: "العربي يمينًا، الرموز والأرقام معزولة يسارًا.", tone: "green" },
            { icon: LockKeyhole, title: "الحل مكانه المعلم", text: "لا يظهر الحل ضمن تبويب المسائل، ولا تلميحات.", tone: "gold" },
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

      {/* Lesson cards */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <SectionHeading
          eyebrow="خريطة المسائل"
          icon={<Compass className="size-3.5" aria-hidden="true" />}
          title={
            <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
              اختر درسك… <span className="text-[#b183e6]">وخلينا نحسب</span>
              <span className="emoji" aria-hidden="true">✨</span>
            </span>
          }
          description="مساحتان مستقلّتان، وفي كل مساحة عشر محطات يمكن التنقل بينها. السؤال والمعطيات والمطلوب في الواجهة، والحل التفصيلي عند المعلم."
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
              <button
                key={lesson.id}
                type="button"
                onClick={() => onNavigate(lesson.id)}
                className="lesson-card group"
                aria-label={`افتح ${lesson.title} — ${problems.length} مسائل`}
              >
                <div className={lesson.id === "motion" ? "lesson-card-bg lesson-card-bg-green" : "lesson-card-bg lesson-card-bg-gold"} aria-hidden="true" />
                <div className="relative">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="lesson-number">
                        <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
                        {lesson.number}
                      </span>
                      <h3 className="mt-2 flex items-center gap-2 text-[22px] font-bold text-[#301545]">
                        {lesson.title}
                        <span className="emoji text-lg" aria-hidden="true">{lesson.emoji}</span>
                      </h3>
                      <p className="mt-1.5 max-w-sm text-[11px] leading-6 text-[#b39aa8]">{lesson.subtitle}</p>
                    </div>
                    <span className={lesson.id === "motion" ? "lesson-medallion lesson-medallion-green" : "lesson-medallion lesson-medallion-gold"}>
                      <Icon className="size-6" strokeWidth={1.7} aria-hidden="true" />
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
                    <div className="lesson-formula">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[9.5px] font-medium text-[#b39aa8]">{lesson.formula.title}</span>
                        <span className="text-[8.5px] text-[#b39aa8]">{lesson.pages}</span>
                      </div>
                      <div className="mt-1">
                        <Formula tex={lesson.formula.tex} />
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      {lesson.skills.map((skill) => (
                        <span key={skill} className="hidden rounded-lg bg-white/70 px-2 py-1 text-[8.5px] text-[#b39aa8] ring-1 ring-[#f8c8db] xl:inline-block">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#f8c8db]/80 pt-3">
                    <div className="flex items-center gap-2">
                      <span className="flex -space-x-1.5 space-x-reverse">
                        {Array.from({ length: 5 }).map((_, dot) => (
                          <span key={dot} className="lesson-dot" aria-hidden="true" />
                        ))}
                      </span>
                      <span className="text-[10px] font-medium text-[#96549c]">
                        {problems.length} مسائل + أسئلة مركّبة
                      </span>
                    </div>
                    <span className="lesson-cta">
                      افتح المسائل
                      <ArrowLeft className="size-3.5 transition group-hover:-translate-x-0.5" aria-hidden="true" />
                    </span>
                  </div>
                </div>
                <span className="absolute -left-3 -top-3 select-none text-[78px] font-bold leading-none text-[#441b67]/[0.035]" aria-hidden="true">
                  0{index + 1}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-8">
        <div className="how-card">
          <div className="how-pattern" aria-hidden="true" />
          <div className="relative grid gap-7 lg:grid-cols-[0.9fr_1.5fr] lg:items-center">
            <div>
              <span className="eyebrow border-white/20 bg-white/10 text-[#f8c8db]">
                <Target className="size-3.5" aria-hidden="true" />
                منهجية المسائل
              </span>
              <h2 className="mt-3 text-[24px] font-bold leading-snug text-[#faf4ff] sm:text-3xl">
                ثلاث خطوات…
                <br />
                ونخرج بفكرة راسخة <span className="emoji" aria-hidden="true">🧠</span>
              </h2>
              <p className="mt-3 max-w-sm text-[11.5px] leading-7 text-[#e0b8c5]">
                صُمّمت المسائل لتُحلّ بالورقة والقلم. ابدأ من المعطيات، جرّب القانون، ثم راجع حلك مع المعلم — دون كشف الحل مسبقًا.
              </p>
              <button
                type="button"
                onClick={() => onNavigate("teacher")}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#f1e6ff] px-3.5 py-2 text-[11px] font-bold text-[#301545] transition hover:bg-white"
              >
                <Presentation className="size-3.5" aria-hidden="true" />
                منطقة المعلم
                <ChevronLeft className="size-3.5" aria-hidden="true" />
              </button>
            </div>
            <div className="grid gap-2.5 sm:grid-cols-3">
              {steps.map((step, index) => (
                <div key={step.title} className="how-step">
                  <span className="how-step-number">0{index + 1}</span>
                  <step.icon className="size-4 text-[#e3cffb]" strokeWidth={1.8} aria-hidden="true" />
                  <h3 className="mt-2 text-[12px] font-bold text-[#f1e6ff]">{step.title}</h3>
                  <p className="mt-1 text-[9.5px] leading-5 text-[#e0b8c5]">{step.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Formula / teacher callout */}
      <section className="mx-auto max-w-7xl px-4 py-7 sm:px-6">
        <div className="grid gap-4 md:grid-cols-[1.3fr_1fr]">
          <div className="paper-card relative overflow-hidden p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <span className="value-icon value-icon-gold shrink-0">
                <FlaskConical className="size-4" aria-hidden="true" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-[#441b67]">فكرة مش غريبة… الحل يبدأ بالوحدة</h3>
                <p className="mt-1.5 text-[11px] leading-6 text-[#b39aa8]">
                  في درس الحركة: <span className="font-semibold text-[#441b67]">حوّل الزمن قبل القسمة</span>. وفي درس القوة:
                  <span className="font-semibold text-[#441b67]"> حوّل الغرام إلى كيلوغرام</span>. هاتان الخطوتان تختصران نصف الأخطاء.
                </p>
              </div>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <div className="rounded-2xl border border-[#f8c8db] bg-white/70 p-3">
                <span className="mb-1.5 block text-[9px] font-medium text-[#b39aa8]">الحركة والسكون</span>
                <Formula tex="v=\frac{d}{t}\quad \text{with } d=\text{m},\ t=\text{s}" />
              </div>
              <div className="rounded-2xl border border-[#f8c8db] bg-white/70 p-3">
                <span className="mb-1.5 block text-[9px] font-medium text-[#b39aa8]">القوة والحركة</span>
                <Formula tex="w=m\,g\quad \text{with } m=\text{kg},\ g=\text{N}\cdot\text{kg}^{-1}" />
              </div>
            </div>
          </div>

          <div className="teacher-teaser">
            <span className="teacher-teaser-ring" aria-hidden="true" />
            <div className="relative">
              <span className="teacher-badge">
                <LockKeyhole className="size-3" aria-hidden="true" /> تبويب خاص
              </span>
              <h3 className="mt-2 text-lg font-bold text-[#f1e6ff]">منطقة المعلم 🧑‍🏫</h3>
              <p className="mt-1 text-[10.5px] leading-6 text-[#e0b8c5]">
                لكل مسألة: فكرة الحل، خطوات مرقّمة، الناتج النهائي، وملاحظة تربوية للمناقشة الصفية.
              </p>
              <button
                type="button"
                onClick={() => onNavigate("teacher")}
                className="mt-3 inline-flex items-center gap-2 rounded-xl bg-[#f1e6ff] px-3.5 py-2 text-[11px] font-bold text-[#301545] transition hover:bg-white"
              >
                استعرض الحلول العشرين
                <ArrowLeft className="size-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Visual showcase */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <SectionHeading
          eyebrow="عيّنة من الرسوم"
          icon={<TrendingUp className="size-3.5" aria-hidden="true" />}
          title={
            <span>
              ليست مجرد أرقام… <span className="text-[#b183e6]">كل مسألة لها مشهد</span> 📈
            </span>
          }
          description="كل رسم مكتوب خصيصًا للمسألة: مسارات، ولوحات قيادة، وموازين، وأشعة قوى. ألوان هادئة وتفاصيل تُقرأ من النظرة الأولى."
        />
        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          <ProblemFigure
            spec={{
              kind: "journey",
              icon: "car",
              distance: "12 km",
              time: "10 min",
              place: "الطريق الساحلي",
              tone: "green",
            }}
          />
          <ProblemFigure
            spec={{
              kind: "graph",
              distanceUnit: "km",
              timeUnit: "h",
              points: [
                { x: 0, y: 0, label: "0" },
                { x: 2, y: 120, label: "120" },
                { x: 3, y: 120, label: "استراحة" },
                { x: 4, y: 210, label: "210" },
              ],
              segments: "stop-then-go",
            }}
          />
          <ProblemFigure
            spec={{
              kind: "earthMoon",
              mass: "90 kg",
              earthWeight: "900 N",
              moonWeight: "145.8 N",
              earthG: "10 N.kg⁻¹",
              moonG: "1.62 N.kg⁻¹",
            }}
          />
        </div>
        <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-[#b39aa8]">
          <Sparkles className="size-3.5 text-[#b183e6]" aria-hidden="true" />
          اختر مسألة من تبويب الدرس لتشاهد مشهدها الخاص
          <Sparkles className="size-3.5 text-[#b183e6]" aria-hidden="true" />
        </div>
      </section>

    </div>
  );
}
