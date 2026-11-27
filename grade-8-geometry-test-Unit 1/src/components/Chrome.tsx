import { Rich } from "../lib/mathx";

/* ── small geometric mark used as the page's identity glyph ── */
export function Glyph({ size = 34 }: { size?: number }) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden className="shrink-0">
      <defs>
        <linearGradient id="glyphG" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#7dd3fc" />
          <stop offset="55%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#2dd4bf" />
        </linearGradient>
      </defs>
      <polygon points="6,30 20,30 32,10 18,10" fill="none" stroke="url(#glyphG)" strokeWidth="2.2" strokeLinejoin="round" />
      <line x1="6" y1="30" x2="18" y2="10" stroke="rgba(125,211,252,0.4)" strokeWidth="1.2" strokeDasharray="3 3" />
      <line x1="20" y1="30" x2="32" y2="10" stroke="rgba(125,211,252,0.4)" strokeWidth="1.2" strokeDasharray="3 3" />
      <circle cx="6" cy="30" r="2.6" fill="#7dd3fc" />
      <circle cx="20" cy="30" r="2.6" fill="#7dd3fc" />
      <circle cx="32" cy="10" r="2.6" fill="#2dd4bf" />
      <circle cx="18" cy="10" r="2.6" fill="#2dd4bf" />
    </svg>
  );
}

export function MuteButton({ muted, onToggle }: { muted: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={muted}
      title={muted ? "تشغيل الأصوات" : "كتم الأصوات"}
      className={`inline-flex min-h-11 items-center gap-2 rounded-xl border px-3 text-[0.82rem] font-semibold transition-colors ${
        muted
          ? "border-rose-400/45 bg-rose-400/10 text-rose-200"
          : "border-cyan-300/45 bg-cyan-400/10 text-cyan-100"
      }`}
    >
      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 5L6 9H3v6h3l5 4V5z" />
        {muted ? (
          <>
            <path d="M22 9l-6 6" />
            <path d="M16 9l6 6" />
          </>
        ) : (
          <>
            <path d="M15.5 8.5a5 5 0 010 7" />
            <path d="M18.5 5.5a9 9 0 010 13" />
          </>
        )}
      </svg>
      <span className="hidden sm:inline">{muted ? "الأصوات مكتومة" : "الأصوات مفعّلة"}</span>
    </button>
  );
}

export function WhatsAppIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden fill="currentColor">
      <path d="M16.01 3.2c-7.06 0-12.8 5.73-12.8 12.79 0 2.25.59 4.45 1.71 6.39L3.1 28.8l6.6-1.73a12.77 12.77 0 006.3 1.64h.01c7.05 0 12.79-5.74 12.79-12.79 0-3.42-1.33-6.63-3.75-9.05a12.7 12.7 0 00-9.04-3.67zm0 23.03h-.01a10.6 10.6 0 01-5.41-1.48l-.39-.23-4.02 1.05 1.07-3.92-.25-.4a10.6 10.6 0 01-1.62-5.66c0-5.87 4.78-10.64 10.65-10.64 2.84 0 5.51 1.11 7.52 3.12a10.57 10.57 0 013.11 7.53c0 5.87-4.78 10.63-10.65 10.63zm5.84-7.97c-.32-.16-1.89-.93-2.19-1.04-.29-.11-.5-.16-.71.16-.21.32-.82 1.04-1 1.25-.19.21-.37.24-.69.08-.32-.16-1.35-.5-2.57-1.59-.95-.85-1.59-1.9-1.78-2.22-.18-.32-.02-.49.14-.65.15-.15.32-.37.48-.56.16-.19.21-.32.32-.53.11-.21.05-.4-.03-.56-.08-.16-.71-1.72-.98-2.35-.26-.62-.52-.54-.71-.55l-.61-.01c-.21 0-.56.08-.85.4-.29.32-1.11 1.09-1.11 2.65s1.14 3.08 1.3 3.29c.16.21 2.24 3.42 5.43 4.8.76.33 1.35.52 1.81.67.76.24 1.45.21 2 .13.61-.09 1.89-.77 2.15-1.52.27-.74.27-1.38.19-1.51-.08-.13-.29-.21-.61-.37z" />
    </svg>
  );
}

export function Footer() {
  return (
    <footer className="mt-10 border-t border-sky-400/12 bg-ink-950/50">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 px-4 py-5 text-center sm:flex-row sm:justify-between sm:text-start">
        <div className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-lg border border-sky-400/25 bg-gradient-to-br from-sky-500/15 to-indigo-500/10">
            <svg viewBox="0 0 24 24" className="size-4.5 text-sky-300" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2l9 5-9 5-9-5 9-5z" />
              <path d="M3 12l9 5 9-5" />
              <path d="M3 17l9 5 9-5" />
            </svg>
          </span>
          <div className="leading-tight">
            <p className="text-[0.86rem] font-semibold text-slate-200">المهندس سومر شاهين</p>
            <p className="text-[0.72rem] text-slate-500">إعداد ومتابعة مادّة الهندسة</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <a
            href="tel:0930215022"
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-sky-400/25 bg-white/[0.03] px-3 text-[0.82rem] font-semibold text-sky-100 transition-colors hover:border-sky-300/60 hover:bg-sky-400/10"
          >
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3.1 19.5 19.5 0 01-6-6A19.8 19.8 0 012.1 4.2 2 2 0 014.1 2h3a2 2 0 012 1.7c.1 1 .3 1.9.6 2.8a2 2 0 01-.4 2.1L8 9.9a16 16 0 006 6l1.3-1.3a2 2 0 012.1-.4c.9.3 1.8.5 2.8.6a2 2 0 011.8 2.1z" />
            </svg>
            <span dir="ltr" className="tabular-nums">0930215022</span>
          </a>
          <a
            href="https://wa.me/963930215022"
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-emerald-400/35 bg-emerald-400/10 px-3 text-[0.82rem] font-semibold text-emerald-200 transition-colors hover:bg-emerald-400/20"
          >
            <WhatsAppIcon className="size-4.5" />
            واتساب
          </a>
        </div>
      </div>
    </footer>
  );
}

export function FigureFrame({
  children,
  caption,
  schematic,
}: {
  children: React.ReactNode;
  caption?: string;
  schematic?: boolean;
}) {
  return (
    <figure className="mx-auto w-full max-w-[34rem]">
      <div className="rounded-2xl border border-sky-400/18 bg-gradient-to-b from-white/[0.03] to-transparent p-2 shadow-[0_18px_40px_-30px_rgba(56,189,248,0.8)]">
        {children}
      </div>
      {(caption || schematic) && (
        <figcaption className="mt-2 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center text-[0.76rem] text-slate-400">
          {caption && <Rich text={caption} />}
          {schematic && (
            <span className="rounded-full border border-amber-300/35 bg-amber-300/10 px-2 py-0.5 text-[0.7rem] font-semibold text-amber-200">
              غير مرسوم بالمقياس
            </span>
          )}
        </figcaption>
      )}
    </figure>
  );
}