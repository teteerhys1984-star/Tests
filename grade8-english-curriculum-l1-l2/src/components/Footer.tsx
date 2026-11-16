/**
 * Elegant contact strip. The contact name is intentionally kept in Arabic
 * exactly as supplied — this is the only allowed exception to the
 * English-only interface rule.
 */
import { GraduationCap } from "lucide-react";

export function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.87 9.87 0 0 0 4.79 1.22h.01c5.46 0 9.9-4.45 9.9-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2m0 18.15h-.01a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.83c0 4.54-3.7 8.15-8.24 8.15m4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.24-.64.8-.78.97-.14.16-.29.18-.54.06-.25-.13-1.05-.39-2-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.14.16-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.22.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.06-.1-.23-.16-.48-.27" />
    </svg>
  );
}

export function Footer({ onOpenTeacher }: { onOpenTeacher: () => void }) {
  return (
    <footer className="relative z-10 mt-16 border-t border-slate-800/80 bg-slate-950/60 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-5 sm:flex-row">
        <div className="flex items-center gap-2.5 text-sm text-slate-500">
          <GraduationCap className="h-4 w-4 text-cyan-400/80" />
          <span>Grade 8 English · Unit 1 Assessment</span>
        </div>

        <div className="flex items-center gap-3">
          <span
            dir="rtl"
            className="font-arabic text-[15px] font-semibold text-slate-300"
          >
            المهندس سومر شاهين
          </span>
          <a
            href="https://wa.me/963930215022"
            target="_blank"
            rel="noopener noreferrer"
            className="tabular rounded-lg border border-slate-700/70 px-3 py-1.5 text-sm font-semibold text-slate-200 transition hover:border-emerald-400/60 hover:text-emerald-200"
            aria-label="Chat on WhatsApp at 0930215022"
          >
            0930215022
          </a>
          <a
            href="https://wa.me/963930215022"
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#25D366] text-slate-950 shadow-[0_8px_20px_-6px_rgba(37,211,102,0.6)] transition hover:scale-105"
            aria-label="Open WhatsApp conversation"
            title="WhatsApp"
          >
            <WhatsAppIcon className="h-5 w-5" />
          </a>
        </div>

        <button
          type="button"
          onClick={onOpenTeacher}
          className="text-xs font-medium text-slate-600 transition hover:text-slate-400"
        >
          Teacher Area
        </button>
      </div>
    </footer>
  );
}
