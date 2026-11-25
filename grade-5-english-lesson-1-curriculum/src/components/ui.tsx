import type { ReactNode, SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Svg({ size = 20, children, ...rest }: IconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {children}
    </svg>
  );
}

export const ClockIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </Svg>
);
export const CheckIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </Svg>
);
export const ChevronLeft = (p: IconProps) => (
  <Svg {...p}>
    <path d="M15 5l-7 7 7 7" />
  </Svg>
);
export const ChevronRight = (p: IconProps) => (
  <Svg {...p}>
    <path d="M9 5l7 7-7 7" />
  </Svg>
);
export const DownloadIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 4v11" />
    <path d="M7 10l5 5 5-5" />
    <path d="M5 20h14" />
  </Svg>
);
export const SpeakerOn = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 9v6h4l5 4V5L8 9H4z" />
    <path d="M16.5 8.5a5 5 0 0 1 0 7" />
    <path d="M19 6a8.5 8.5 0 0 1 0 12" />
  </Svg>
);
export const SpeakerOff = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 9v6h4l5 4V5L8 9H4z" />
    <path d="M16 9l5 6M21 9l-5 6" />
  </Svg>
);
export const SparkleIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8L12 3z" />
    <path d="M19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15z" />
  </Svg>
);
export const PhoneIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z" />
  </Svg>
);
export const LockIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="4" y="11" width="16" height="10" rx="3" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </Svg>
);
export const BookIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z" />
    <path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5" />
  </Svg>
);
export const RefreshIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 12a9 9 0 0 1 15.5-6.2L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-15.5 6.2L3 16" />
    <path d="M3 21v-5h5" />
  </Svg>
);

/** Official-style WhatsApp glyph (speech bubble with handset). */
export function WhatsAppIcon({ size = 18, ...rest }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false" {...rest}>
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.5 2 12.04 2zm0 18.15h-.01a8.23 8.23 0 0 1-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.24 8.23zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.12-.17.25-.64.81-.78.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.38-1.72-.15-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.12-.14.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.23.25-.87.85-.87 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.14-1.18-.06-.11-.23-.17-.48-.29z" />
    </svg>
  );
}

const CONTACT = {
  name: "Eng. Somer Shaheen",
  phoneDisplay: "0930215022",
  phoneHref: "tel:0930215022",
  whatsappUrl: "https://wa.me/963930215022",
  whatsappShort: "wa.me/963930215022",
};

/** Official-style WhatsApp badge: white glyph on the WhatsApp green circle. */
export function WhatsAppBadge({ size = 40 }: { size?: number }) {
  return (
    <span
      className="grid shrink-0 place-items-center rounded-full bg-gradient-to-b from-[#5FF07F] to-[#1DB954] text-white shadow-md shadow-emerald-200 ring-2 ring-white"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <WhatsAppIcon size={Math.round(size * 0.62)} />
    </span>
  );
}

/**
 * Contact card shown at the top (compact) and bottom (full) of every student screen.
 * Phone and WhatsApp are both clickable; WhatsApp uses the recognisable green logo badge.
 */
export function ContactCard({ variant = "full" }: { variant?: "full" | "compact" }) {
  const compact = variant === "compact";
  return (
    <div
      className={`relative overflow-hidden rounded-3xl bg-white/90 ring-1 ring-pink-100 backdrop-blur ${
        compact ? "px-3 py-2.5 shadow-sm sm:px-4" : "p-4 shadow-lg shadow-pink-100/60 sm:p-5"
      }`}
    >
      {!compact && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br from-emerald-100 via-sky-100 to-pink-100 opacity-80"
        />
      )}
      <div className={`relative flex gap-3 ${compact ? "items-center justify-between" : "flex-col md:flex-row md:items-center md:justify-between"}`}>
        <div className="flex min-w-0 items-center gap-3">
          <span
            aria-hidden="true"
            className={`shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-pink-400 via-fuchsia-400 to-violet-500 font-extrabold text-white shadow-md shadow-pink-200 ${
              compact ? "hidden h-9 w-9 text-xs sm:grid" : "grid h-12 w-12 text-sm"
            }`}
          >
            SS
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-fuchsia-500">{compact ? "Need help? Contact" : "Contact"}</p>
            <p className={`truncate font-extrabold text-[#3b2a4a] ${compact ? "text-sm" : "text-base sm:text-lg"}`}>{CONTACT.name}</p>
          </div>
        </div>

        <div className={compact ? "flex shrink-0 items-center gap-2" : "flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:gap-3"}>
          <a
            href={CONTACT.phoneHref}
            aria-label={`Phone: ${CONTACT.phoneDisplay}`}
            className={`inline-flex items-center rounded-full bg-gradient-to-r from-pink-50 to-rose-50 font-bold text-[#be185d] ring-1 ring-pink-200 transition active:scale-[0.98] ${
              compact
                ? "h-11 w-11 justify-center sm:h-auto sm:min-h-11 sm:w-auto sm:gap-2.5 sm:py-1 sm:pl-1 sm:pr-3"
                : "min-h-14 w-full gap-2.5 py-1.5 pl-1.5 pr-5 sm:w-auto"
            }`}
          >
            <span
              className={`grid shrink-0 place-items-center rounded-full bg-gradient-to-br from-pink-400 to-rose-500 text-white shadow ring-2 ring-white ${
                compact ? "h-8 w-8" : "h-10 w-10"
              }`}
              aria-hidden="true"
            >
              <PhoneIcon size={compact ? 15 : 18} />
            </span>
            <span className={`min-w-0 leading-tight ${compact ? "hidden sm:block" : ""}`}>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-pink-400">Phone</span>
              <span className={`block whitespace-nowrap ${compact ? "text-sm" : "text-sm sm:text-base"}`}>{CONTACT.phoneDisplay}</span>
            </span>
          </a>

          <a
            href={CONTACT.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`WhatsApp: ${CONTACT.whatsappUrl}`}
            className={`inline-flex items-center rounded-full bg-gradient-to-r from-[#e9fbee] to-[#d9f7e6] font-bold text-[#0b6b3a] ring-1 ring-[#9fe3b8] transition active:scale-[0.98] ${
              compact
                ? "h-11 w-11 justify-center sm:h-auto sm:min-h-11 sm:w-auto sm:gap-2.5 sm:py-1 sm:pl-1 sm:pr-3"
                : "min-h-14 w-full gap-2.5 py-1.5 pl-1.5 pr-5 sm:w-auto"
            }`}
          >
            <WhatsAppBadge size={compact ? 32 : 40} />
            <span className={`min-w-0 leading-tight ${compact ? "hidden sm:block" : ""}`}>
              <span className={`block font-extrabold ${compact ? "text-sm" : "text-sm sm:text-base"}`}>WhatsApp</span>
              <span className={`block whitespace-nowrap font-semibold text-[#128C7E] ${compact ? "text-[11px]" : "text-[11px] sm:text-xs"}`}>
                {compact ? CONTACT.whatsappShort : CONTACT.whatsappUrl}
              </span>
            </span>
          </a>
        </div>
      </div>
    </div>
  );
}

export function ContactFooter() {
  return (
    <footer className="mt-8 px-3 pb-8 pt-2 sm:px-6">
      <div className="mx-auto w-full max-w-6xl">
        <ContactCard variant="full" />
      </div>
    </footer>
  );
}

export function Logo() {
  return (
    <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-pink-400 via-fuchsia-400 to-violet-500 text-white shadow-lg shadow-pink-200/70">
      <BookIcon size={28} />
    </div>
  );
}
