import { BookOpenText, GraduationCap, Star } from "lucide-react";
import type { ReactNode } from "react";

type BrandProps = {
  compact?: boolean;
  variant?: "dark" | "light";
};

export function Brand({ compact = false, variant = "light" }: BrandProps) {
  const isDark = variant === "dark";
  return (
    <div className="flex items-center gap-3">
      <div
        className={`relative grid shrink-0 place-items-center rounded-2xl border shadow-sm ${
          compact ? "h-10 w-10" : "h-12 w-12"
        } ${
          isDark
            ? "border-[#d9c28e]/35 bg-white/10 text-[#efdcb0]"
            : "border-[#c4a15a]/30 bg-[#0d3b35] text-[#efdcb0]"
        }`}
      >
        <BookOpenText className={compact ? "h-5 w-5" : "h-6 w-6"} strokeWidth={1.7} />
        <span
          className={`absolute -left-1 -top-1 grid h-4 w-4 place-items-center rounded-full ${
            isDark ? "bg-[#c4a15a] text-[#082924]" : "bg-[#c4a15a] text-[#082924]"
          }`}
        >
          <Star className="h-2.5 w-2.5" fill="currentColor" strokeWidth={0} />
        </span>
      </div>
      <div className="leading-tight">
        <div
          className={`font-display text-[15px] font-bold tracking-tight sm:text-base ${
            isDark ? "text-[#fff8e8]" : "text-[#0d3b35]"
          }`}
        >
          لغةُ الضَّاد
        </div>
        <div
          className={`mt-0.5 text-[10px] font-medium tracking-wide sm:text-[11px] ${
            isDark ? "text-[#e8dcc3]/70" : "text-[#66736e]"
          }`}
        >
          اختبارات اللغة العربية التفاعلية
        </div>
      </div>
    </div>
  );
}

export function ArabicSeal({ className = "" }: { className?: string }) {
  return (
    <div
      className={`relative grid place-items-center rounded-full border border-[#c4a15a]/50 bg-[#fffdf8]/10 ${className}`}
      aria-hidden="true"
    >
      <div className="absolute inset-[7px] rounded-full border border-dashed border-[#c4a15a]/35" />
      <span className="font-poetic select-none text-7xl leading-none text-[#efdcb0] drop-shadow-sm sm:text-8xl">
        ض
      </span>
      <span className="absolute bottom-5 font-display text-[9px] tracking-[0.28em] text-[#c4a15a]">
        لغة الضاد
      </span>
    </div>
  );
}

export function GradeBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#c4a15a]/35 bg-[#c4a15a]/10 px-3 py-1 text-[11px] font-semibold text-[#e9d6ac]">
      <GraduationCap className="h-3.5 w-3.5" />
      الصف الخامس الأساسي
    </span>
  );
}

export function GoldRule({ children }: { children?: ReactNode }) {
  return (
    <div className="gold-rule my-5 text-xs font-semibold">
      {children ? <span className="shrink-0">{children}</span> : <span className="h-1.5 w-1.5 rotate-45 bg-[#c4a15a]" />}
    </div>
  );
}

export function DecorativeCorner({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="0.9"
      aria-hidden="true"
    >
      <path d="M4 116V44C4 21.9 21.9 4 44 4h72" />
      <path d="M20 116V48c0-15.5 12.5-28 28-28h72" opacity=".55" />
      <path d="M40 70c10-22 30-32 52-30-8 24-28 38-52 30Z" opacity=".6" />
      <path d="M52 58c12 2 23 9 30 20" opacity=".5" />
      <circle cx="29" cy="83" r="5" opacity=".55" />
    </svg>
  );
}
