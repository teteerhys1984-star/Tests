import { Lock, WhatsApp } from "@/components/Decor";
import { EXAM_TITLE } from "@/config";

interface Props {
  tone?: "light" | "deep";
  onOpenTeacher?: () => void;
}

/**
 * Permanent contact strip — consistent across the start, results and teacher screens.
 * The icon and the number both open a direct WhatsApp chat.
 */
export default function ContactStrip({ tone = "light", onOpenTeacher }: Props) {
  const deep = tone === "deep";
  return (
    <footer
      className={
        "mx-auto w-full max-w-3xl px-4 pb-6 pt-8 " + (deep ? "text-lilac-pale" : "text-ink-soft")
      }
    >
      <div
        className={
          "flex flex-col items-center gap-3 rounded-3xl border px-4 py-4 text-center sm:flex-row sm:justify-between sm:text-left " +
          (deep
            ? "border-white/25 bg-white/10"
            : "border-lilac-pale bg-white/80 shadow-[0_10px_30px_-24px_rgba(110,63,151,0.7)]")
        }
      >
        <div className="flex items-center gap-3">
          <span
            className={
              "grid h-9 w-9 shrink-0 place-items-center rounded-full " +
              (deep ? "bg-white/15" : "bg-blush")
            }
          >
            <FlowerMark className="h-5 w-5 text-lilac" />
          </span>
          <div className="leading-tight">
            <p
              dir="rtl"
              className={
                "text-[15px] font-extrabold " + (deep ? "text-white" : "text-lilac-deep")
              }
            >
              المهندس سومر شاهين
            </p>
            <p className="eyebrow mt-0.5 opacity-70">English Department · Grade 5</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2.5">
          {onOpenTeacher && (
            <button
              type="button"
              onClick={onOpenTeacher}
              className="flex items-center gap-1.5 rounded-full border-2 border-lilac-pale bg-lavender px-4 py-2 text-[13px] font-extrabold text-lilac-deep transition hover:border-lilac active:scale-[0.98]"
            >
              <Lock className="h-4 w-4 text-lilac" />
              Teacher Answer Key
            </button>
          )}
          <a
            href="https://wa.me/963930215022"
            target="_blank"
            rel="noreferrer"
            className={
              "group flex items-center gap-3 rounded-full px-4 py-2.5 text-[17px] font-extrabold transition active:scale-[0.98] " +
              (deep
                ? "bg-white/15 text-white hover:bg-white/25"
                : "bg-turquoise text-white shadow-[0_8px_20px_-10px_rgba(87,199,192,0.9)] hover:bg-[#45b7b0]")
            }
            aria-label="Chat on WhatsApp with 0930215022"
          >
            <WhatsApp className="h-6 w-6 shrink-0" />
            <span className="num tracking-wide" dir="ltr">
              0930215022
            </span>
          </a>
        </div>
      </div>
      <p className="mt-3 text-center text-[11px] opacity-60">
        {EXAM_TITLE} · Unit 1 · Lessons 1–5
      </p>
    </footer>
  );
}

function FlowerMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <g fill="currentColor" opacity="0.9">
        <ellipse cx="24" cy="12" rx="6" ry="8.4" />
        <ellipse cx="24" cy="12" rx="6" ry="8.4" transform="rotate(72 24 24)" />
        <ellipse cx="24" cy="12" rx="6" ry="8.4" transform="rotate(144 24 24)" />
        <ellipse cx="24" cy="12" rx="6" ry="8.4" transform="rotate(216 24 24)" />
        <ellipse cx="24" cy="12" rx="6" ry="8.4" transform="rotate(288 24 24)" />
      </g>
      <circle cx="24" cy="24" r="5.4" fill="#FFD9A8" />
    </svg>
  );
}
