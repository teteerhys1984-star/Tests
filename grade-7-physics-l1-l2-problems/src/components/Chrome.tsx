import type { ReactNode } from "react";
import {
  Atom,
  BadgeCheck,
  BookOpen,
  CheckSquare,
  ClipboardList,
  FlaskConical,
  GraduationCap,
  Home,
  Phone,
  Sparkles,
  Presentation,
  HeartHandshake,
  ArrowUpLeft,
  CheckCircle2,
  Lightbulb,
  MessageCircle,
  Award,
} from "lucide-react";
import { EXAM_TITLE } from "@/config";
import type { AppTab } from "@/lib/site";
import { site, whatsappLink } from "@/lib/site";
import { cn } from "@/utils/cn";

export function BrandMark({ className }: { className?: string }) {
  return (
    <span className={cn("brand-mark", className)} aria-hidden="true">
      <svg viewBox="0 0 64 64" className="h-full w-full" fill="none">
        <defs>
          <linearGradient id="brandBg" x1="8" y1="4" x2="58" y2="61" gradientUnits="userSpaceOnUse">
            <stop stopColor="#f472b6" />
            <stop offset="1" stopColor="#a855f7" />
          </linearGradient>
          <linearGradient id="brandLeaf" x1="20" y1="18" x2="48" y2="50" gradientUnits="userSpaceOnUse">
            <stop stopColor="#f1e6ff" />
            <stop offset="1" stopColor="#ef97bd" />
          </linearGradient>
        </defs>
        <rect x="2" y="2" width="60" height="60" rx="19" fill="url(#brandBg)" />
        <rect x="2" y="2" width="60" height="60" rx="19" stroke="#ffffff" strokeOpacity=".2" strokeWidth="1.2" />
        <ellipse cx="32" cy="32" rx="19" ry="8.4" stroke="#f1e6ff" strokeOpacity=".85" strokeWidth="1.5" transform="rotate(-28 32 32)" />
        <ellipse cx="32" cy="32" rx="19" ry="8.4" stroke="#f1e6ff" strokeOpacity=".5" strokeWidth="1.1" transform="rotate(32 32 32)" />
        <circle cx="32" cy="32" r="4.1" fill="url(#brandLeaf)" />
        <path d="M32 9.5c5.4 2.5 7.4 6.5 7.7 11.3-4.7.4-8.7-2.4-9.8-7.3-.3-1.3-.2-2.6-.1-3.9l2.2-.1Z" fill="#f8c8db" fillOpacity=".95" />
        <path d="M47.5 20.5c1.9 2.6 2 5.2.9 7.7-2.5-.7-4-2.8-3.8-5.5 0-.8.4-1.6.7-2.4l2.2.2Z" fill="#ef97bd" fillOpacity=".85" />
        <path d="M17 49c8.7-1.1 16.5-4.2 23.4-9.7" stroke="#f1e6ff" strokeOpacity=".65" strokeWidth="1.4" strokeLinecap="round" />
        <circle cx="18.5" cy="45.3" r="1.7" fill="#e3cffb" />
        <circle cx="47.7" cy="43.6" r="1.15" fill="#e3cffb" fillOpacity=".9" />
        <circle cx="22.5" cy="21" r="1.1" fill="#e3cffb" fillOpacity=".8" />
      </svg>
    </span>
  );
}

export function AtomGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={cn("inline-block", className)} role="img" aria-label="رمز الذرة">
      <defs>
        <radialGradient id="atomCore" cx=".35" cy=".3" r=".8">
          <stop offset="0" stopColor="#ef97bd" />
          <stop offset="1" stopColor="#441b67" />
        </radialGradient>
      </defs>
      <g fill="none" stroke="#b183e6" strokeWidth="2.1">
        <ellipse cx="32" cy="32" rx="27" ry="11" transform="rotate(28 32 32)" />
        <ellipse cx="32" cy="32" rx="27" ry="11" transform="rotate(-28 32 32)" />
        <ellipse cx="32" cy="32" rx="27" ry="11" transform="rotate(90 32 32)" stroke="#9c5469" strokeOpacity=".7" />
      </g>
      <circle cx="32" cy="32" r="7.4" fill="url(#atomCore)" stroke="#f1e6ff" strokeWidth="2" />
      <circle cx="32" cy="32" r="2.4" fill="#f1e6ff" />
      <circle cx="55" cy="20" r="3" fill="#b183e6" />
      <circle cx="9" cy="45" r="2.4" fill="#9c5469" />
    </svg>
  );
}

export function WhatsAppMark({ className }: { className?: string }) {
  return (
    <span className={cn("whatsapp-mark", className)} aria-hidden="true">
      <span className="whatsapp-mark-orbit" />
      <span className="whatsapp-mark-glow" />
      <svg viewBox="0 0 24 24" className="relative z-[1] h-[58%] w-[58%]" fill="currentColor" aria-hidden="true">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
      </svg>
    </span>
  );
}

function TeacherAvatar({ compact = false }: { compact?: boolean }) {
  return (
    <span className={cn("teacher-avatar", compact && "teacher-avatar-compact")} aria-hidden="true">
      <span>س</span>
      <Sparkles className="teacher-avatar-spark" />
    </span>
  );
}

export function ContactRibbon() {
  return (
    <div className="contact-ribbon print:hidden">
      <div className="contact-ribbon-pattern" aria-hidden="true" />
      <div className="relative mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-2.5 sm:px-6">
        <div className="flex min-w-0 items-center gap-2.5">
          <TeacherAvatar compact />
          <div className="min-w-0 leading-tight">
            <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] font-semibold text-[#f1e6ff] sm:text-xs">
              <span>إعداد ومتابعة: {site.teacher}</span>
              <span className="hidden items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[9px] font-medium text-[#f8c8db] ring-1 ring-white/10 sm:inline-flex">
                <BadgeCheck className="size-2.5" /> فيزياء وكيمياء 7
              </span>
            </p>
            <p className="mt-0.5 truncate text-[9.5px] text-[#e0b8c5] sm:text-[10.5px]">
              رقم واحد… ومساحة هادئة لأسئلتك
            </p>
          </div>
        </div>
        <a
          href={whatsappLink}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-2 rounded-full border border-white/15 bg-white/10 py-1 pe-2.5 ps-1 transition hover:bg-white/15"
          aria-label="راسل المهندس سومر شاهين على واتساب"
        >
          <span className="flex size-7 items-center justify-center rounded-full bg-[#25d366] text-[#0b3a28] transition group-hover:scale-105">
            <WhatsAppMark className="whatsapp-mark-flat size-7" />
          </span>
          <span className="leading-tight">
            <span className="block text-[9px] text-[#e0b8c5]">تواصل واتساب</span>
            <span className="number-link block text-[11px] font-semibold text-white">{site.phoneDisplay}</span>
          </span>
          <ArrowUpLeft className="size-3.5 rotate-180 text-[#f8c8db] transition group-hover:-translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
        </a>
      </div>
    </div>
  );
}

export type HeaderTabMeta = {
  id: AppTab;
  label: string;
  shortLabel: string;
  enabled: boolean;
  badge?: string;
};

const tabIcons: Record<AppTab, typeof Home> = {
  welcome: Home,
  exam: ClipboardList,
  review: CheckSquare,
  results: Award,
  teacher: Presentation,
};

export function SiteHeader({
  active,
  onChange,
  hasStarted,
  isSubmitted,
  answeredQuestionsCount,
}: {
  active: AppTab;
  onChange: (tab: AppTab) => void;
  hasStarted: boolean;
  isSubmitted: boolean;
  answeredQuestionsCount: number;
}) {
  const navTabs: HeaderTabMeta[] = [
    { id: "welcome", label: "البداية", shortLabel: "البداية", enabled: true },
    {
      id: "exam",
      label: "الاختبار",
      shortLabel: "الاختبار",
      enabled: hasStarted && !isSubmitted,
      badge: hasStarted && !isSubmitted ? `${answeredQuestionsCount}/20` : "20",
    },
    {
      id: "review",
      label: "مراجعة الإجابات",
      shortLabel: "المراجعة",
      enabled: hasStarted && !isSubmitted,
    },
    {
      id: "results",
      label: "النتيجة والتقرير",
      shortLabel: "النتيجة",
      enabled: isSubmitted,
    },
    { id: "teacher", label: "منطقة المعلم", shortLabel: "المعلم", enabled: true },
  ];

  return (
    <>
      <ContactRibbon />
      <header className="site-header print:hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex items-center justify-between gap-3 py-3">
            <button
              type="button"
              onClick={() => onChange("welcome")}
              className="group flex shrink-0 items-center gap-2.5 text-right"
              aria-label={`${EXAM_TITLE} — العودة إلى البداية`}
            >
              <BrandMark className="size-11 transition duration-300 group-hover:-rotate-3 group-hover:scale-105 sm:size-12" />
              <span className="leading-tight">
                <span className="flex items-center gap-1.5 text-[16px] font-bold tracking-tight text-[#301545] sm:text-[18px]">
                  {EXAM_TITLE}
                </span>
                <span className="mt-0.5 block text-[9px] font-medium text-[#b39aa8] sm:text-[10px]">
                  {site.name} • الصف السابع — الفصل الأول
                </span>
              </span>
            </button>

            <nav aria-label="التنقل الرئيسي" className="hidden lg:block">
              <div role="tablist" aria-label="أقسام الاختبار" className="flex items-center gap-1 rounded-2xl bg-white/60 p-1 ring-1 ring-[#f8c8db]/80">
                {navTabs.map((tab) => {
                  const Icon = tabIcons[tab.id];
                  const isActive = active === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      disabled={!tab.enabled}
                      onClick={() => onChange(tab.id)}
                      className={cn(
                        "tab-button",
                        isActive && "tab-button-active",
                        !tab.enabled && "cursor-not-allowed opacity-45 hover:bg-transparent"
                      )}
                    >
                      <Icon className="size-3.5" aria-hidden="true" />
                      {tab.label}
                      {tab.badge && (
                        <span
                          className={cn(
                            "rounded-md px-1.5 py-px text-[9px] font-bold",
                            isActive ? "bg-white/20 text-white" : "bg-[#f9e3ec] text-[#763f4e]"
                          )}
                        >
                          {tab.badge}
                        </span>
                      )}
                      {tab.id === "teacher" && (
                        <span className={cn("size-1.5 rounded-full", isActive ? "bg-[#e3cffb]" : "bg-[#b183e6]")} />
                      )}
                    </button>
                  );
                })}
              </div>
            </nav>

            <div className="hidden items-center gap-2 xl:flex">
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-2 rounded-xl border border-[#f8c8db] bg-white/70 px-2.5 py-1.5 text-right transition hover:border-[#ef97bd] hover:bg-white"
              >
                <span className="flex size-7 items-center justify-center rounded-lg bg-[#e9f6e9] text-[#1f7a4a]">
                  <Phone className="size-3.5" aria-hidden="true" />
                </span>
                <span className="leading-tight">
                  <span className="block text-[8.5px] text-[#b39aa8]">واتساب المهندس</span>
                  <span className="number-link block text-[10.5px] font-semibold text-[#441b67]">{site.phoneDisplay}</span>
                </span>
              </a>
            </div>
          </div>

          <nav aria-label="التنقل الرئيسي للجوال" className="mobile-tabs lg:hidden">
            <div role="tablist" aria-label="أقسام الاختبار" className="scrollbar-none flex items-center gap-1.5 overflow-x-auto pb-2.5">
              {navTabs.map((tab) => {
                const Icon = tabIcons[tab.id];
                const isActive = active === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    disabled={!tab.enabled}
                    onClick={() => onChange(tab.id)}
                    className={cn(
                      "tab-button shrink-0 px-3 py-2 text-[11.5px]",
                      isActive && "tab-button-active",
                      !tab.enabled && "cursor-not-allowed opacity-45"
                    )}
                  >
                    <Icon className="size-3.5" aria-hidden="true" />
                    {tab.shortLabel}
                    {tab.badge && (
                      <span
                        className={cn(
                          "rounded-md px-1 py-px text-[8.5px] font-bold",
                          isActive ? "bg-white/20" : "bg-[#f9e3ec] text-[#743f76]"
                        )}
                      >
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </nav>
        </div>
      </header>
    </>
  );
}

export function ContactSection() {
  return (
    <section className="contact-section print:hidden" aria-labelledby="contact-heading">
      <div className="contact-pattern" aria-hidden="true" />
      <div className="contact-orb contact-orb-a" aria-hidden="true" />
      <div className="contact-orb contact-orb-b" aria-hidden="true" />
      <div className="relative mx-auto grid max-w-7xl gap-7 px-4 py-8 sm:px-6 sm:py-10 lg:grid-cols-[1.35fr_0.9fr] lg:items-center lg:gap-12">
        <div className="text-center lg:text-right">
          <span className="contact-eyebrow">
            <HeartHandshake className="size-3.5" aria-hidden="true" />
            متابعة شخصية هادئة
          </span>
          <h2 id="contact-heading" className="mt-3 text-[22px] font-bold leading-snug text-[#faf4ff] sm:text-3xl">
            بدك تتابع مع <span className="text-[#e3cffb]">{site.teacher}</span>؟
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-[12px] leading-7 text-[#e0b8c5] sm:text-[13px] lg:mx-0">
            لأي استفسار عن مسائل الدرسين أو طريقة الحل، الرقم نفسه هو بوابة واتساب مباشرة. اضغط، اكتب سؤالك، وخلّينا نحلّها سوا.
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 lg:justify-start">
            <span className="contact-chip">
              <CheckCircle2 className="size-3" aria-hidden="true" /> فيزياء وكيمياء الصف السابع
            </span>
            <span className="contact-chip">
              <CheckCircle2 className="size-3" aria-hidden="true" /> متابعة مسائل وحلول
            </span>
            <span className="contact-chip">
              <Lightbulb className="size-3" aria-hidden="true" /> أسئلة الحل مرحّب بها
            </span>
          </div>
        </div>

        <a
          href={whatsappLink}
          target="_blank"
          rel="noopener noreferrer"
          className="whatsapp-card group"
          aria-label={`راسل ${site.teacher} على واتساب من الرقم ${site.phoneDisplay}`}
        >
          <div className="whatsapp-card-lines" aria-hidden="true" />
          <div className="relative flex items-center gap-4">
            <WhatsAppMark className="whatsapp-logo-big" />
            <div className="min-w-0 text-right">
              <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-1 text-[9px] font-medium text-[#f8c8db] ring-1 ring-white/10">
                <span className="relative flex size-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#6ee7a0] opacity-60" />
                  <span className="relative inline-flex size-1.5 rounded-full bg-[#6ee7a0]" />
                </span>
                متاح على واتساب
              </span>
              <p className="mt-2 text-[10px] text-[#e0b8c5]">{site.teacher}</p>
              <p className="number-link mt-0.5 text-xl font-bold text-white sm:text-2xl">{site.phoneDisplay}</p>
              <span className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-[#f1e6ff] px-3 py-1.5 text-[11px] font-bold text-[#301545] transition group-hover:bg-white">
                <MessageCircle className="size-3.5" aria-hidden="true" />
                افتح محادثة واتساب
                <ArrowUpLeft className="size-3.5 transition group-hover:-translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
              </span>
            </div>
          </div>
          <div className="relative mt-4 flex items-center justify-between gap-2 border-t border-white/10 pt-3">
            <span className="flex items-center gap-1 text-[9.5px] text-[#e0b8c5]">
              <Phone className="size-3" aria-hidden="true" /> الرقم قابل للنقر مباشرة
            </span>
            <span className="text-[9px] text-[#b98395]" dir="ltr">
              wa.me / {site.phoneDisplay}
            </span>
          </div>
        </a>
      </div>
    </section>
  );
}

export function SiteFooter({ onChange }: { onChange: (tab: AppTab) => void }) {
  return (
    <footer className="site-footer print:hidden">
      <div className="mx-auto max-w-7xl px-4 py-9 sm:px-6">
        <div className="grid gap-7 md:grid-cols-[1.1fr_0.7fr_0.9fr]">
          <div>
            <button
              type="button"
              onClick={() => onChange("welcome")}
              className="flex items-center gap-2.5 text-right"
              aria-label={`${EXAM_TITLE} — البداية`}
            >
              <BrandMark className="size-10" />
              <span className="leading-tight">
                <span className="flex items-center gap-1 text-base font-bold text-[#301545]">
                  {EXAM_TITLE}
                </span>
                <span className="mt-0.5 block text-[10px] text-[#b39aa8]">{site.name} • الصف السابع</span>
              </span>
            </button>
            <p className="mt-3 max-w-xs text-[11px] leading-6 text-[#b39aa8]">
              اختبار إلكتروني تفاعلي مصمّم بعناية للصف السابع: 20 مسألة حسابية من الدرسين الأول والثاني مع تصحيح فوري وتقرير تفصيلي.
            </p>
            <div className="mt-3 flex items-center gap-1.5 text-[10px] text-[#b39aa8]">
              <Atom className="size-3.5" aria-hidden="true" />
              <FlaskConical className="size-3.5" aria-hidden="true" />
              <span>فيزياء • الصف السابع • الفصل الأول</span>
            </div>
          </div>

          <div>
            <p className="footer-title">أقسام الاختبار</p>
            <ul className="mt-2 grid gap-1.5">
              <li>
                <button type="button" onClick={() => onChange("welcome")} className="footer-link">
                  <span className="size-1 rounded-full bg-[#b98395]" aria-hidden="true" />
                  صفحة البداية
                </button>
              </li>
              <li>
                <button type="button" onClick={() => onChange("teacher")} className="footer-link">
                  <span className="size-1 rounded-full bg-[#b98395]" aria-hidden="true" />
                  منطقة المعلم
                </button>
              </li>
            </ul>
          </div>

          <div>
            <p className="footer-title">تواصل مباشر</p>
            <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="mt-2 flex items-center gap-3 rounded-2xl border border-[#f8c8db] bg-[#fcf5f7] p-3 transition hover:border-[#ef97bd] hover:bg-white">
              <WhatsAppMark className="whatsapp-mark-footer" />
              <span className="min-w-0 text-right">
                <span className="block text-[10px] text-[#b39aa8]">{site.teacher}</span>
                <span className="number-link mt-0.5 block text-sm font-bold text-[#441b67]">{site.phoneDisplay}</span>
                <span className="mt-0.5 block text-[9px] text-[#743f76]">اضغط للانتقال إلى واتساب</span>
              </span>
            </a>
            <div className="mt-3 flex items-center gap-1.5 text-[10px] text-[#b39aa8]">
              <BookOpen className="size-3.5" aria-hidden="true" />
              حلول وتقارير المعلم في
              <button type="button" onClick={() => onChange("teacher")} className="font-semibold text-[#743f76] underline decoration-[#e0b8c5] underline-offset-4">
                منطقة المعلم
              </button>
            </div>
          </div>
        </div>

        <div className="mt-7 flex flex-col items-center justify-between gap-2 border-t border-[#f8c8db] pt-4 text-center text-[10px] text-[#b39aa8] sm:flex-row sm:text-right">
          <p>
            © 2026 {site.name} — {EXAM_TITLE} — الصف السابع
          </p>
          <p className="flex items-center gap-1.5">
            <GraduationCap className="size-3.5" aria-hidden="true" />
            بإشراف {site.teacher}
          </p>
        </div>
      </div>
    </footer>
  );
}

export function FloatingWhatsApp() {
  return (
    <a
      href={whatsappLink}
      target="_blank"
      rel="noopener noreferrer"
      className="floating-wa print:hidden"
      aria-label="فتح محادثة واتساب مع المهندس سومر شاهين"
    >
      <span className="floating-wa-pulse" aria-hidden="true" />
      <WhatsAppMark className="whatsapp-mark-floating" />
      <span className="sr-only">واتساب</span>
    </a>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  icon,
  action,
}: {
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <span className="eyebrow">
          {icon ?? <BookOpen className="size-3.5" aria-hidden="true" />}
          {eyebrow}
        </span>
        <h2 className="mt-2.5 text-2xl font-bold leading-tight tracking-tight text-[#301545] sm:text-[30px]">{title}</h2>
        {description ? <p className="mt-2 max-w-2xl text-[12px] leading-7 text-[#b39aa8] sm:text-[13px]">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}
