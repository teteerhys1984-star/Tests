import { AppleMark, FloralDivider, TinySparkle } from "./Ornaments";
import { CONTACT, EXAM_TITLE } from "../exam/data";

export function ContactBar({ compact = false }: { compact?: boolean }) {
  return (
    <div className="contact-ribbon">
      <div
        className={`mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 ${
          compact ? "py-1.5" : "py-2"
        } text-[0.76rem] sm:text-[0.8rem]`}
      >
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="flex items-center gap-1.5 font-semibold text-[#f6e6d2]">
            <TinySparkle className="h-3.5 w-3.5 text-[#d7b676]" />
            {CONTACT.name}:
            <a href="tel:0930215022" className="contact-link num" dir="ltr">
              0930215022
            </a>
          </span>
          <span className="hidden text-[#c9a9b7] sm:inline">•</span>
          <span className="hidden text-[#e7d3dc] sm:inline">
            الرياضيات · الصف السادس الأساسي
          </span>
        </div>
        <a
          href={CONTACT.whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          className="contact-link inline-flex items-center gap-1.5 rounded-full border border-[#715040] bg-white/5 px-2.5 py-0.5 font-semibold"
        >
          <WhatsAppIcon className="h-3.5 w-3.5" />
          تواصل عبر واتساب
        </a>
      </div>
    </div>
  );
}

export function WhatsAppIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M12.04 2a9.9 9.9 0 0 0-8.52 14.96L2 22l5.18-1.47A9.9 9.9 0 1 0 12.04 2Zm0 1.8a8.1 8.1 0 0 1 6.9 12.35 8.1 8.1 0 0 1-10.9 2.7l-.35-.2-3.05.86.88-2.97-.22-.36A8.1 8.1 0 0 1 12.04 3.8Zm-3.1 4.02c-.2 0-.52.07-.8.37-.27.3-1.03 1-1.03 2.44s1.05 2.83 1.2 3.03c.14.2 2.04 3.12 4.94 4.25 2.4.94 2.9.75 3.42.7.52-.05 1.68-.69 1.92-1.35.24-.66.24-1.23.17-1.35-.07-.12-.27-.2-.57-.34-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.61.14-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.5l-.57-.02Z" />
    </svg>
  );
}

export function BrandBar({ rightSlot }: { rightSlot?: React.ReactNode }) {
  return (
    <header className="brand-header sticky top-0 z-40 no-print">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2.5 sm:py-3">
        <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#ead7df] bg-[#fffaf7] shadow-sm">
            <AppleMark size={34} />
          </div>
          <div className="min-w-0">
            <p className="display-title truncate text-lg font-bold leading-tight text-[#452736] sm:text-xl">
              {EXAM_TITLE}
            </p>
            <p className="mt-0.5 truncate text-[0.68rem] font-semibold text-[#876675] sm:text-[0.75rem]">
              اختبار الرياضيات · الصف السادس الأساسي
            </p>
          </div>
        </div>
        {rightSlot ? <div className="shrink-0">{rightSlot}</div> : null}
      </div>
      <div className="h-px bg-gradient-to-l from-transparent via-[#dcc6b2] to-transparent" />
    </header>
  );
}

export function SiteFooter({ onTeacherOpen }: { onTeacherOpen: () => void }) {
  return (
    <footer className="footer no-print mt-10">
      <div className="mx-auto max-w-7xl px-4 py-7">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex items-center gap-2 text-[#5a3445]">
            <AppleMark size={28} />
            <span className="display-title text-xl font-bold">{EXAM_TITLE}</span>
          </div>
          <FloralDivider className="max-w-[260px] opacity-80" />
          <p className="text-sm font-semibold text-[#634353]">
            {CONTACT.name}:{" "}
            <a href="tel:0930215022" className="num contact-link !text-[#8e465e]" dir="ltr">
              0930215022
            </a>
          </p>
          <a
            href={CONTACT.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#587a62] hover:text-[#3f5f4a]"
          >
            <WhatsAppIcon className="h-4 w-4" />
            واتساب: 0930215022
          </a>
          <p className="text-[0.72rem] text-[#8d7580]">
            الصف السادس الأساسي · مادة الرياضيات · الدرجة الكلية 100
          </p>
          <button
            type="button"
            onClick={onTeacherOpen}
            className="mt-1 inline-flex items-center gap-1.5 rounded-full border border-[#e3d4dc] bg-[#fffaf7] px-3 py-1 text-[0.7rem] font-semibold text-[#7c5c6b] transition hover:border-[#caa8b6] hover:text-[#5d3a4b]"
          >
            <LockIcon className="h-3 w-3" />
            دليل المعلم
          </button>
        </div>
      </div>
    </footer>
  );
}

export function LockIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="4.5" y="10" width="15" height="10" rx="2.5" />
      <path d="M8 10V7.5a4 4 0 0 1 8 0V10" />
      <path d="M12 14v2" />
    </svg>
  );
}

export function ArrowIcon({ direction = "right" }: { direction?: "right" | "left" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`h-4 w-4 ${direction === "left" ? "rotate-180" : ""}`}
      aria-hidden="true"
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export function CheckIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}
