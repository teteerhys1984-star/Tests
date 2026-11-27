import type { ReactNode } from "react";

export const WHATSAPP_URL = "https://wa.me/963930215022";

type IconName =
  | "book"
  | "clock"
  | "sound"
  | "mute"
  | "download"
  | "lock"
  | "arrow-right"
  | "arrow-left"
  | "check"
  | "x"
  | "sparkle"
  | "print"
  | "refresh"
  | "key"
  | "shield"
  | "info"
  | "user"
  | "list"
  | "chart"
  | "star"
  | "trophy"
  | "pencil";

const ICON_PATHS: Record<IconName, ReactNode> = {
  book: (
    <>
      <path d="M3 5.5A3.5 3.5 0 0 1 6.5 2H11v17H6.5A3.5 3.5 0 0 0 3 22V5.5Z" />
      <path d="M21 5.5A3.5 3.5 0 0 0 17.5 2H13v17h4.5A3.5 3.5 0 0 1 21 22V5.5Z" />
      <path d="M6.5 6H8M16 6h1.5" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.2 2" />
    </>
  ),
  sound: (
    <>
      <path d="M11 5 6.5 9H3v6h3.5L11 19V5Z" />
      <path d="M15 8.5a5 5 0 0 1 0 7M18 6a9 9 0 0 1 0 12" />
    </>
  ),
  mute: (
    <>
      <path d="M11 5 6.5 9H3v6h3.5L11 19V5Z" />
      <path d="m16 9 5 6M21 9l-5 6" />
    </>
  ),
  download: (
    <>
      <path d="M12 3v12M7.5 10.5 12 15l4.5-4.5" />
      <path d="M4 18v2h16v-2" />
    </>
  ),
  lock: (
    <>
      <rect x="4" y="10" width="16" height="11" rx="2.5" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3M12 14.5v2.5" />
    </>
  ),
  "arrow-right": <path d="M4 12h15m-6-6 6 6-6 6" />,
  "arrow-left": <path d="M20 12H5m6-6-6 6 6 6" />,
  check: <path d="m5 12.5 4.5 4.5L19 6" />,
  x: <path d="m6 6 12 12M18 6 6 18" />,
  sparkle: (
    <>
      <path d="M12 2c.6 5.2 3.8 8.4 9 9-5.2.6-8.4 3.8-9 9-.6-5.2-3.8-8.4-9-9 5.2-.6 8.4-3.8 9-9Z" />
      <path d="M19.5 16.5c.2 1.7 1.3 2.8 3 3-1.7.2-2.8 1.3-3 3-.2-1.7-1.3-2.8-3-3 1.7-.2 2.8-1.3 3-3Z" />
    </>
  ),
  print: (
    <>
      <path d="M7 8V3h10v5M7 17H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2" />
      <rect x="7" y="14" width="10" height="7" rx="1" />
    </>
  ),
  refresh: (
    <>
      <path d="M20 11a8 8 0 1 0-2.34 5.66" />
      <path d="M20 4v7h-7" />
    </>
  ),
  key: (
    <>
      <circle cx="8" cy="15" r="4" />
      <path d="m11 12 9-9M17 6l3 3M15 8l2 2" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3 4.5 6v5.5c0 4.5 3 7.8 7.5 9.5 4.5-1.7 7.5-5 7.5-9.5V6L12 3Z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8h.01" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </>
  ),
  list: (
    <>
      <path d="M9 6h11M9 12h11M9 18h11" />
      <path d="M4 6h.01M4 12h.01M4 18h.01" />
    </>
  ),
  chart: (
    <>
      <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
    </>
  ),
  star: <path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6-5.4-2.8-5.4 2.8 1-6-4.4-4.3 6.1-.9L12 3Z" />,
  trophy: (
    <>
      <path d="M8 4h8v5a4 4 0 0 1-8 0V4Z" />
      <path d="M8 6H4v1a4 4 0 0 0 4 4M16 6h4v1a4 4 0 0 1-4 4M12 13v4M8 21h8M9 17h6" />
    </>
  ),
  pencil: (
    <>
      <path d="m4 20 1-5L16 4l4 4L9 19l-5 1Z" />
      <path d="m14 6 4 4M5 15l4 4" />
    </>
  ),
};

export function Icon({
  name,
  className = "h-5 w-5",
  strokeWidth = 1.9,
}: {
  name: IconName;
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {ICON_PATHS[name]}
    </svg>
  );
}

export function WhatsAppIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.474-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.521.149-.174.199-.298.298-.496.099-.198.05-.371-.05-.521-.099-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
    </svg>
  );
}

export function TeacherMark({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <span
      className={`inline-grid place-items-center rounded-xl bg-teal-700 text-white shadow-sm ${className}`}
      aria-hidden="true"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className="h-1/2 w-1/2">
        <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v16H6.5A2.5 2.5 0 0 0 4 21.5v-16Z" />
        <path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H13v16h4.5a2.5 2.5 0 0 1 2.5 2.5v-16Z" />
      </svg>
    </span>
  );
}

export function OwlMascot({ className = "w-full max-w-[260px]" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 280 280"
      className={className}
      role="img"
      aria-label="A friendly owl holding a pencil and an open book"
    >
      <ellipse cx="140" cy="255" rx="86" ry="13" fill="#b8dfe8" opacity=".55" />
      <g transform="rotate(8 228 192)">
        <rect x="214" y="98" width="29" height="118" rx="8" fill="#ffc94f" />
        <path d="M214 195h29l-14.5 31Z" fill="#f3a66f" />
        <path d="m221 218 7.5 8 7.5-8v8l-7.5 10-7.5-10Z" fill="#354f5d" />
        <rect x="214" y="86" width="29" height="17" rx="7" fill="#f29b92" />
        <rect x="214" y="100" width="29" height="5" fill="#e7a733" />
        <circle cx="228" cy="128" r="2.7" fill="#856324" />
        <path d="M224 137c3 3 6 3 9 0" fill="none" stroke="#856324" strokeWidth="2" strokeLinecap="round" />
      </g>
      <path d="M68 112c-13-25-24-37-35-44 20-1 34 6 45 18Z" fill="#118c9d" />
      <path d="M212 112c13-25 24-37 35-44-20-1-34 6-45 18Z" fill="#118c9d" />
      <path d="M78 87c7-31 30-49 62-49s55 18 62 49l14 87c5 35-22 62-76 62s-81-27-76-62Z" fill="#18a9b7" />
      <path d="M84 173c-4 34 17 52 56 52s60-18 56-52l-7-60c-3-29-21-44-49-44s-46 15-49 44Z" fill="#e7fbf4" />
      <path d="M78 140c-22-9-36 10-34 38 2 26 16 43 37 42 12-1 17-11 14-23Z" fill="#1197a7" />
      <path d="M202 140c22-9 36 10 34 38-2 26-16 43-37 42-12-1-17-11-14-23Z" fill="#1197a7" />
      <circle cx="112" cy="116" r="37" fill="#fffdf8" />
      <circle cx="168" cy="116" r="37" fill="#fffdf8" />
      <circle cx="116" cy="118" r="15" fill="#173d50" />
      <circle cx="164" cy="118" r="15" fill="#173d50" />
      <circle cx="121" cy="112" r="5" fill="#fff" />
      <circle cx="169" cy="112" r="5" fill="#fff" />
      <path d="m140 127 13 10-13 10-13-10Z" fill="#f5b93f" />
      <circle cx="88" cy="154" r="11" fill="#f7ab8e" opacity=".58" />
      <circle cx="192" cy="154" r="11" fill="#f7ab8e" opacity=".58" />
      <path d="M104 177c20 11 52 11 72 0l-7 16c-18 9-40 9-58 0Z" fill="#ff8e5c" />
      <path d="M171 194c8 0 16 4 20 13l-18 17c-2-11-2-20-2-30Z" fill="#f07a4b" />
      <path d="M103 241c-2 7-8 9-16 9M103 241c2 7 8 9 16 9M177 241c-2 7-8 9-16 9M177 241c2 7 8 9 16 9" fill="none" stroke="#e6a32c" strokeWidth="6" strokeLinecap="round" />
      <g>
        <path d="M90 208c16-10 35-10 50 0v32c-16-9-33-9-50 0Z" fill="#fff9e9" stroke="#f1c659" strokeWidth="3" />
        <path d="M190 208c-16-10-35-10-50 0v32c16-9 33-9 50 0Z" fill="#fff9e9" stroke="#f1c659" strokeWidth="3" />
        <path d="M140 210v29M103 216c9-3 17-2 24 2M177 216c-9-3-17-2-24 2M101 225c8-2 15-1 22 2M179 225c-8-2-15-1-22 2" fill="none" stroke="#9cc7d1" strokeWidth="2.3" strokeLinecap="round" />
      </g>
    </svg>
  );
}

export function StarBuddy({ className = "w-24" }: { className?: string }) {
  return (
    <svg viewBox="0 0 150 150" className={className} role="img" aria-label="A smiling star">
      <path d="m75 7 19 38 42 6-30.5 29.7 7.3 42L75 102.8 37.2 122.7l7.3-42L14 51l42-6Z" fill="#ffc948" stroke="#f2ad25" strokeWidth="5" strokeLinejoin="round" />
      <circle cx="60" cy="63" r="5.5" fill="#244a58" />
      <circle cx="91" cy="63" r="5.5" fill="#244a58" />
      <circle cx="61.5" cy="61.5" r="1.8" fill="#fff" />
      <circle cx="92.5" cy="61.5" r="1.8" fill="#fff" />
      <path d="M61 79c8 8 20 8 29 0" fill="none" stroke="#b86c30" strokeWidth="4" strokeLinecap="round" />
      <circle cx="49" cy="76" r="6" fill="#ffaa74" opacity=".7" />
      <circle cx="101" cy="76" r="6" fill="#ffaa74" opacity=".7" />
    </svg>
  );
}

export function PencilBuddy({ className = "w-20" }: { className?: string }) {
  return (
    <svg viewBox="0 0 130 180" className={className} role="img" aria-label="A cheerful pencil">
      <g transform="rotate(10 65 90)">
        <rect x="41" y="46" width="48" height="100" rx="12" fill="#ffc948" stroke="#efb232" strokeWidth="3" />
        <path d="m41 146 48 0-24 28Z" fill="#f4c9a1" />
        <path d="m53 160 12 14 12-14Z" fill="#355364" />
        <path d="M41 60h48M41 126h48" stroke="#e7a52e" strokeWidth="3" />
        <rect x="41" y="30" width="48" height="20" rx="9" fill="#f59a94" />
        <circle cx="57" cy="91" r="4.5" fill="#264957" />
        <circle cx="74" cy="91" r="4.5" fill="#264957" />
        <circle cx="58.4" cy="89.7" r="1.4" fill="#fff" />
        <circle cx="75.4" cy="89.7" r="1.4" fill="#fff" />
        <path d="M58 104c4 5 10 5 15 0" fill="none" stroke="#8b6731" strokeWidth="2.8" strokeLinecap="round" />
        <circle cx="48" cy="101" r="4.5" fill="#f7a27a" opacity=".7" />
        <circle cx="83" cy="101" r="4.5" fill="#f7a27a" opacity=".7" />
      </g>
    </svg>
  );
}

export function MiniSparkle({
  className = "",
  color = "#ffc94f",
  size = 18,
}: {
  className?: string;
  color?: string;
  size?: number;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      fill={color}
      aria-hidden="true"
    >
      <path d="M12 1.8c.7 6.1 4 9.4 10.2 10.2-6.2.8-9.5 4.1-10.2 10.2C11.3 16.1 8 12.8 1.8 12 8 11.2 11.3 7.9 12 1.8Z" />
    </svg>
  );
}

export function SoundButton({
  muted,
  onToggle,
  className = "",
}: {
  muted: boolean;
  onToggle: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={!muted}
      aria-label={muted ? "Turn exam sounds on" : "Mute exam sounds"}
      className={`pressable inline-flex min-h-11 items-center gap-2 rounded-full border border-teal-200/80 bg-white px-3.5 py-2 text-sm font-extrabold text-teal-800 shadow-sm hover:border-teal-400 hover:bg-teal-50 ${className}`}
    >
      <Icon name={muted ? "mute" : "sound"} className="h-[18px] w-[18px]" />
      <span className="hidden sm:inline">{muted ? "Sound off" : "Sound on"}</span>
    </button>
  );
}

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <span
        className={`grid shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 text-white shadow-[0_7px_16px_-7px_rgba(8,111,126,.8)] ${
          compact ? "h-9 w-9 rounded-xl" : "h-10 w-10"
        }`}
      >
        <Icon name="book" className={compact ? "h-5 w-5" : "h-[22px] w-[22px]"} strokeWidth={2.1} />
      </span>
      <span className={`display-font min-w-0 leading-[1.05] text-slate-800 ${compact ? "text-[15px]" : "text-lg"}`}>
        English
        <span
          className={`${
            compact ? "hidden min-[360px]:block" : "block"
          } text-[10px] font-bold tracking-[0.11em] text-teal-700 uppercase sm:text-[11px] sm:tracking-[0.13em]`}
        >
          Foundation Exam
        </span>
      </span>
    </div>
  );
}

export function Footer({
  onTeacher,
  showTeacher = true,
}: {
  onTeacher?: () => void;
  showTeacher?: boolean;
}) {
  return (
    <footer className="mt-12 border-t border-teal-100/80 bg-white/75">
      <div className="page-shell py-8 sm:py-10">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div className="max-w-md">
            <Brand />
            <p className="mt-3 text-sm leading-6 text-slate-600">
              A friendly beginner English assessment covering sentence structure,
              pronouns, Verb to Be, nouns, articles, adjectives, descriptive
              sentences, and plural nouns.
            </p>
            <p className="mt-2 text-xs font-bold text-slate-400">
              Lessons 1, 2, 3, 4, 5 and 18
            </p>
          </div>

          <div className="flex flex-col gap-5 sm:flex-row sm:gap-10">
            <div>
              <p className="text-[11px] font-black tracking-[0.16em] text-slate-400 uppercase">
                Contact
              </p>
              <p className="mt-2 text-base font-extrabold text-slate-800">
                Eng. Somer Shaheen
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Message Eng. Somer Shaheen on WhatsApp at 0930215022"
                  className="inline-flex min-h-11 items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-extrabold text-emerald-800 transition hover:border-emerald-400 hover:bg-emerald-100"
                >
                  <WhatsAppIcon className="h-[18px] w-[18px]" />
                  <span>0930215022</span>
                </a>
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Open a direct WhatsApp conversation"
                  className="grid h-11 w-11 place-items-center rounded-full bg-[#20b95a] text-white shadow-sm transition hover:bg-[#169c49]"
                >
                  <WhatsAppIcon className="h-5 w-5" />
                </a>
              </div>
              <p className="mt-1.5 text-xs font-semibold text-slate-500">
                Tap the number or icon for WhatsApp
              </p>
            </div>

            {showTeacher && onTeacher && (
              <div>
                <p className="text-[11px] font-black tracking-[0.16em] text-slate-400 uppercase">
                  For teachers
                </p>
                <button
                  type="button"
                  onClick={onTeacher}
                  className="pressable mt-2 inline-flex min-h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-extrabold text-slate-700 shadow-sm hover:border-teal-300 hover:text-teal-800"
                >
                  <Icon name="lock" className="h-4 w-4" />
                  Teacher Area
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-2 border-t border-slate-100 pt-5 text-xs font-semibold text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <p>English Foundation Exam</p>
          <p>All instructions and content are in English.</p>
        </div>
      </div>
    </footer>
  );
}

export function DecorativeDots({ className = "" }: { className?: string }) {
  return (
    <div className={`pointer-events-none absolute ${className}`} aria-hidden="true">
      <span className="absolute -left-4 top-2 h-2.5 w-2.5 rounded-full bg-teal-300" />
      <span className="absolute left-8 -top-2 h-1.5 w-1.5 rounded-full bg-orange-300" />
      <span className="absolute left-4 top-8 h-1.5 w-1.5 rounded-full bg-yellow-400" />
    </div>
  );
}

export function SectionEyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="text-[11px] font-black tracking-[0.18em] text-teal-700 uppercase">
      {children}
    </p>
  );
}
