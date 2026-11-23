/**
 * عناصر الواجهة الأساسية — نفس مكوّنات المصدر الأصلي
 * (grade-7-physics-test-Model-A-24-11-26/src/components/ui.tsx):
 * الأزرار والبطاقات والشارات وحقول الإدخال بهوية المصدر البصرية.
 */

import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";
import { cn } from "../utils/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

export function Button({
  className,
  variant = "primary",
  size = "md",
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex cursor-pointer select-none items-center justify-center gap-2 rounded-2xl font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-lilac-300 disabled:cursor-not-allowed active:scale-[0.98]",
        size === "lg" && "px-8 py-4 text-lg",
        size === "md" && "px-5 py-3 text-base",
        size === "sm" && "px-3 py-2 text-sm",
        variant === "primary" && "bg-plum-600 text-white shadow-soft hover:bg-plum-700 disabled:bg-ink-faint disabled:shadow-none",
        variant === "secondary" && "border-2 border-lilac-300 bg-white text-plum-700 hover:bg-lilac-100 disabled:text-ink-faint disabled:border-blush-100",
        variant === "ghost" && "bg-transparent text-ink-soft hover:bg-blush-50 hover:text-ink",
        variant === "danger" && "bg-coral-500 text-white hover:brightness-95",
        className,
      )}
      {...props}
    />
  );
}

export function Card({ className, children, ...props }: HTMLAttributes<HTMLDivElement> & { children?: ReactNode }) {
  return (
    <div className={cn("rounded-card border border-blush-100/70 bg-white shadow-card", className)} {...props}>
      {children}
    </div>
  );
}

type Tone = "lilac" | "blush" | "mint" | "sun" | "coral" | "sky" | "peach";

const toneCls: Record<Tone, string> = {
  lilac: "bg-lilac-100 text-plum-700",
  blush: "bg-blush-100 text-blush-500",
  mint: "bg-mint-100 text-mint-700",
  sun: "bg-sun-100 text-sun-600",
  coral: "bg-coral-100 text-[#a9374b]",
  sky: "bg-skyb-100 text-[#1f6f9c]",
  peach: "bg-peach-100 text-[#a8611f]",
};

export function Badge({ children, tone = "lilac", className }: { children: ReactNode; tone?: Tone; className?: string }) {
  return <span className={cn("inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-semibold", toneCls[tone], className)}>{children}</span>;
}

export function MarkBadge({ marks, max, className }: { marks: number; max?: number; className?: string }) {
  return (
    <Badge tone="peach" className={cn("tabular shrink-0", className)}>
      {max !== undefined ? `${marks} / ${max}` : marks} علامة{marks === 1 ? "" : "ات"}
    </Badge>
  );
}

export const inputCls =
  "w-full rounded-2xl border-2 border-blush-100 bg-white px-4 py-3 text-base text-ink placeholder:text-ink-faint focus:border-plum-500 focus:outline-none focus:ring-4 focus:ring-lilac-100 transition-colors";

export const labelCls = "mb-1 block text-sm font-semibold text-ink-soft";
