import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function base({ size = 18, ...props }: IconProps) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    ...props,
  };
}

export function IconClock(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 1.8" />
    </svg>
  );
}

export function IconBook(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 5.5A2 2 0 0 1 6 3.5h5v17H6a2 2 0 0 1-2-2z" />
      <path d="M20 5.5a2 2 0 0 0-2-2h-5v17h5a2 2 0 0 0 2-2z" />
      <path d="M8 8h1M15 8h1M8 11h1M15 11h1" />
    </svg>
  );
}

export function IconTrophy(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M8 4h8v4a4 4 0 0 1-8 0z" />
      <path d="M8 6H5.5a2.5 2.5 0 0 0 2.6 4M16 6h2.5a2.5 2.5 0 0 1-2.6 4" />
      <path d="M12 12v4M8.5 20h7M10 16h4l.6 4h-5.2z" />
    </svg>
  );
}

export function IconCheck(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4.5 12.5l4.6 4.5L19.5 6.5" />
    </svg>
  );
}

export function IconX(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export function IconArrowLeft(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M19 12H5M11 6l-6 6 6 6" />
    </svg>
  );
}

export function IconArrowRight(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export function IconDownload(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 3v11M7.5 10l4.5 4.5L16.5 10" />
      <path d="M4 17v2.5A1.5 1.5 0 0 0 5.5 21h13a1.5 1.5 0 0 0 1.5-1.5V17" />
    </svg>
  );
}

export function IconRestart(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 4v6h6" />
      <path d="M4.8 10a8 8 0 1 1-.2 4.5" />
    </svg>
  );
}

export function IconKey(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="8" cy="15.5" r="3.6" />
      <path d="M10.6 12.9L20 3.5M16.2 7.3l3 3M13.7 9.8l2.1 2.1" />
    </svg>
  );
}

export function IconLock(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="5" y="10" width="14" height="10" rx="2.2" />
      <path d="M8 10V7.5a4 4 0 0 1 8 0V10" />
      <path d="M12 14v2.5" />
    </svg>
  );
}

export function IconPen(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 20l.9-4.2L16.4 4.3a1.8 1.8 0 0 1 2.5 0l.8.8a1.8 1.8 0 0 1 0 2.5L8.2 19.1z" />
      <path d="M14.6 6l3.4 3.4" />
    </svg>
  );
}

export function IconList(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01" />
    </svg>
  );
}

export function IconSparkle(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z" />
      <path d="M18.5 16.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z" />
    </svg>
  );
}

export function IconCrown(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 8.5l4 3.2L12 5l4 6.7 4-3.2-1.7 9.5H5.7z" />
      <path d="M6.5 20h11" />
    </svg>
  );
}

export function IconApple(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 8.1c2.5-2.3 6.8-1.8 6.8 3.3 0 4.3-3.4 8.6-6.8 8.6s-6.8-4.3-6.8-8.6C5.2 6.3 9.5 5.8 12 8.1z" />
      <path d="M12 8.1c.1-2.2 1-3.8 3-4.6M14.2 4.2c.8-1.3 2-1.9 3.4-1.9" />
      <path d="M9.3 11.7c-.7.4-1.1 1.2-1.2 2.2" />
    </svg>
  );
}

export function IconMirror(props: IconProps) {
  return (
    <svg {...base(props)}>
      <ellipse cx="12" cy="10" rx="6" ry="7.3" />
      <path d="M12 2.7v14.6M8 21h8M10 17.4l-1 3.6M14 17.4l1 3.6" />
      <path d="M9.5 7.2c.6-.7 1.3-1 2-1" />
    </svg>
  );
}

export function IconWhatsApp(props: IconProps) {
  return (
    <svg
      width={props.size ?? 18}
      height={props.size ?? 18}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      {...props}
    >
      <path d="M12.04 2c-5.5 0-9.96 4.46-9.96 9.96 0 1.76.46 3.48 1.33 4.99L2 22l5.2-1.36a9.9 9.9 0 0 0 4.84 1.24c5.5 0 9.96-4.46 9.96-9.96S17.54 2 12.04 2Zm0 18.1c-1.54 0-3.05-.41-4.36-1.2l-.31-.18-3.09.81.82-3.01-.2-.32a8.1 8.1 0 0 1-1.24-4.32c0-4.48 3.65-8.12 8.13-8.12a8.12 8.12 0 0 1 8.12 8.12c0 4.48-3.64 8.12-8.12 8.12Zm4.46-6.08c-.25-.12-1.45-.71-1.67-.79-.22-.08-.39-.12-.55.12-.16.25-.63.79-.77.95-.14.16-.28.18-.53.06-.25-.12-1.04-.38-1.98-1.22-.73-.65-1.23-1.45-1.37-1.7-.14-.25-.02-.38.11-.5.11-.11.25-.28.37-.43.12-.14.16-.25.25-.41.08-.16.04-.31-.02-.43-.06-.12-.55-1.33-.76-1.82-.2-.48-.4-.41-.55-.42h-.47c-.16 0-.43.06-.65.31-.22.25-.85.83-.85 2.02 0 1.19.87 2.34.99 2.5.12.16 1.71 2.61 4.14 3.66.58.25 1.03.4 1.38.51.58.18 1.11.16 1.53.1.47-.07 1.45-.59 1.65-1.17.2-.57.2-1.06.14-1.16-.06-.1-.22-.16-.47-.28Z" />
    </svg>
  );
}

/** Decorative Snow-White-inspired crest: crown, apple, tiny floral accents. */
export function BrandCrest({ size = 40 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden
      role="presentation"
    >
      <defs>
        <linearGradient id="crestRose" x1="10" y1="8" x2="54" y2="58">
          <stop offset="0%" stopColor="#d98aa5" />
          <stop offset="55%" stopColor="#b85c7c" />
          <stop offset="100%" stopColor="#7e5a97" />
        </linearGradient>
        <linearGradient id="crestGold" x1="14" y1="6" x2="50" y2="20">
          <stop offset="0%" stopColor="#e8d3a4" />
          <stop offset="100%" stopColor="#c5a15c" />
        </linearGradient>
      </defs>
      <path
        d="M32 56c-8.6 0-15-6.6-15-14.2 0-5.4 4-9 8-9 3.1 0 5.4 1.7 7 4 1.6-2.3 3.9-4 7-4 4 0 8 3.6 8 9C47 49.4 40.6 56 32 56Z"
        fill="url(#crestRose)"
      />
      <path
        d="M32 36.6c.3-5 2.2-8.8 6-11"
        stroke="#7d8a6a"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M37.8 27.3c2.4-2.8 6-3.1 8.4-2.1.4 2.8-2.1 5.9-5.1 6.1-1.4.1-2.5-.5-3.3-1.4Z"
        fill="#9bb08d"
      />
      <path
        d="M18 21.5 26 25l6-9.5 6 9.5 8-3.5-2.6 12.2H20.6L18 21.5Z"
        fill="url(#crestGold)"
        stroke="#b38e4b"
        strokeWidth="1"
      />
      <circle cx="26" cy="23" r="1.6" fill="#fff8ec" />
      <circle cx="32" cy="17" r="1.6" fill="#fff8ec" />
      <circle cx="38" cy="23" r="1.6" fill="#fff8ec" />
      <path
        d="M14 12.5l.9 2.4 2.4.9-2.4.9-.9 2.4-.9-2.4-2.4-.9 2.4-.9.9-2.4Z"
        fill="#d8b877"
        opacity="0.9"
      />
      <path
        d="M51 40l.6 1.6 1.6.6-1.6.6-.6 1.6-.6-1.6-1.6-.6 1.6-.6.6-1.6Z"
        fill="#b7a5d6"
      />
    </svg>
  );
}

export function IconSave(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M5 3.5h11l3 3V20a.5.5 0 0 1-.5.5h-14A.5.5 0 0 1 4 20V4a.5.5 0 0 1 .5-.5Z" />
      <path d="M8 3.5v5h7v-5M8 20.5v-6h8v6" />
    </svg>
  );
}
