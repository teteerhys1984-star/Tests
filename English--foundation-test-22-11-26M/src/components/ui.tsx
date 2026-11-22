import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";
import type { PassageLine } from "@/data/exam";
import { cn } from "@/utils/cn";

export type IconName =
  | "clock"
  | "volume"
  | "volumeOff"
  | "check"
  | "x"
  | "chevronLeft"
  | "chevronRight"
  | "down"
  | "download"
  | "lock"
  | "unlock"
  | "user"
  | "book"
  | "flag"
  | "pencil"
  | "lightbulb"
  | "shield"
  | "arrowRight"
  | "refresh"
  | "list"
  | "sparkles"
  | "info"
  | "target"
  | "save"
  | "star"
  | "clipboard";

const ICONS: Record<IconName, ReactNode> = {
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  volume: (
    <>
      <path d="M4 9v6h4l5 4V5L8 9H4z" />
      <path d="M16.5 8.5a5 5 0 0 1 0 7" />
      <path d="M19 6a8.5 8.5 0 0 1 0 12" />
    </>
  ),
  volumeOff: (
    <>
      <path d="M4 9v6h4l5 4V5L8 9H4z" />
      <path d="M17 9.5l4 5" />
      <path d="M21 9.5l-4 5" />
    </>
  ),
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  x: <path d="M6 6l12 12M18 6L6 18" />,
  chevronLeft: <path d="M14.5 6l-6 6 6 6" />,
  chevronRight: <path d="M9.5 6l6 6-6 6" />,
  down: <path d="M6 9.5l6 6 6-6" />,
  download: (
    <>
      <path d="M12 4v11" />
      <path d="M7.5 10.5L12 15l4.5-4.5" />
      <path d="M5 19h14" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </>
  ),
  unlock: (
    <>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 7.5-2" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20a8 8 0 0 1 16 0" />
    </>
  ),
  book: (
    <>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5v-15z" />
      <path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H20" />
    </>
  ),
  flag: (
    <>
      <path d="M5 21V4" />
      <path d="M5 4h12l-2.5 4L17 12H5" />
    </>
  ),
  pencil: (
    <>
      <path d="M4 20l4-1 11-11a2.1 2.1 0 0 0-3-3L5 16l-1 4z" />
      <path d="M13.5 7.5l3 3" />
    </>
  ),
  lightbulb: (
    <>
      <path d="M9 18h6" />
      <path d="M10 21h4" />
      <path d="M8.5 14.5A6 6 0 1 1 15.5 14.5c-.8.8-1.5 1.5-1.5 3.5h-4c0-2-.7-2.7-1.5-3.5z" />
    </>
  ),
  shield: <path d="M12 3l8 3v6c0 4.5-3.2 8-8 9-4.8-1-8-4.5-8-9V6l8-3z" />,
  arrowRight: (
    <>
      <path d="M5 12h14" />
      <path d="M13 6l6 6-6 6" />
    </>
  ),
  refresh: (
    <>
      <path d="M20 12a8 8 0 1 1-2.3-5.7" />
      <path d="M20 4v5h-5" />
    </>
  ),
  list: (
    <>
      <path d="M8 6h12M8 12h12M8 18h12" />
      <path d="M4 6h.01M4 12h.01M4 18h.01" />
    </>
  ),
  sparkles: (
    <>
      <path d="M12 4l1.8 4.7 4.7 1.8-4.7 1.8L12 17l-1.8-4.7-4.7-1.8 4.7-1.8L12 4z" />
      <path d="M19 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8.8-2z" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8h.01" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1" />
    </>
  ),
  save: (
    <>
      <path d="M5 4h11l3 3v13H5V4z" />
      <path d="M8 4v5h7V4" />
      <path d="M8 20v-6h8v6" />
    </>
  ),
  star: (
    <path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1.1 5.9L12 16.9l-5.3 2.8 1.1-5.9-4.3-4.1 5.9-.8L12 3.5z" />
  ),
  clipboard: (
    <>
      <rect x="5" y="4" width="14" height="17" rx="2" />
      <path d="M9 4V3h6v1" />
      <path d="M9 11h6M9 15h6" />
    </>
  ),
};

export function Icon({ name, className }: { name: IconName; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.25}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("h-5 w-5 shrink-0", className)}
      aria-hidden="true"
      focusable="false"
    >
      {ICONS[name]}
    </svg>
  );
}

type Variant = "primary" | "sun" | "coral" | "grass" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";
type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size };

const SIZES: Record<Size, string> = {
  sm: "min-h-10 px-4 text-sm",
  md: "min-h-12 px-5 text-base",
  lg: "min-h-14 px-7 text-lg",
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  type = "button",
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn("btn", `btn-${variant}`, SIZES[size], className)}
      {...rest}
    >
      {children}
    </button>
  );
}

export function Card({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("card", className)} {...rest}>
      {children}
    </div>
  );
}

const TONES = {
  sky: "border-ocean/40 bg-ocean-soft text-ocean-dark",
  sun: "border-sun bg-sun-soft text-ink",
  coral: "border-coral/50 bg-coral-soft text-coral-dark",
  grass: "border-grass/60 bg-grass-soft text-grass-dark",
  berry: "border-berry/50 bg-berry-soft text-berry-dark",
  ink: "border-line bg-paper-deep text-ink",
} as const;

export type Tone = keyof typeof TONES;

export function Pill({
  tone = "sky",
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border-2 px-3 py-0.5 text-sm font-extrabold",
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Renders **highlighted** words and ___ blanks inside prompt text. */
export function RichText({ text }: { text: string }) {
  const parts: ReactNode[] = [];
  const regex = /(\*\*.+?\*\*|___)/g;
  let last = 0;
  let key = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    const token = match[0];
    if (token === "___") {
      parts.push(
        <span key={key++} className="blank" aria-label="blank" />,
      );
    } else {
      parts.push(
        <mark key={key++} className="hl">
          {token.slice(2, -2)}
        </mark>,
      );
    }
    last = match.index + token.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts}</>;
}

function renderLabelledBlanks(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const regex = /\{([a-e])\}/g;
  let last = 0;
  let key = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    parts.push(
      <span
        key={key++}
        className="mx-0.5 inline-flex min-w-12 items-center justify-center rounded-lg border-2 border-dashed border-ocean-dark/60 bg-white px-1.5 align-baseline text-xs font-extrabold text-ocean-dark"
      >
        ({match[1]})
      </span>,
    );
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

/** Reading passage or dialogue shown above a question. */
export function Passage({ lines }: { lines: PassageLine[] }) {
  const isDialogue = lines.some((line) => line.speaker);
  return (
    <div className="mt-4 rounded-2xl border-2 border-ocean/40 bg-ocean-soft/60 p-4 text-ink">
      <p className="mb-2 flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wide text-ocean-dark">
        <Icon name="book" className="h-4 w-4" />
        {isDialogue ? "Read the dialogue" : "Read the passage"}
      </p>
      {lines.map((line, index) => (
        <p
          key={index}
          className={
            isDialogue
              ? "flex flex-col gap-0.5 rounded-xl px-2 py-1.5 even:bg-white/70 sm:flex-row sm:gap-2"
              : "text-base leading-relaxed sm:text-lg"
          }
        >
          {line.speaker && (
            <span className="shrink-0 text-base font-black text-ocean-dark sm:min-w-16">
              {line.speaker}:
            </span>
          )}
          <span className="min-w-0 text-base leading-relaxed sm:text-lg">
            {renderLabelledBlanks(line.text)}
          </span>
        </p>
      ))}
    </div>
  );
}
