import type { SVGProps } from "react";

export type IconName =
  | "flower"
  | "timer"
  | "sound"
  | "mute"
  | "lock"
  | "check"
  | "close"
  | "arrow-right"
  | "arrow-left"
  | "download"
  | "teacher"
  | "book"
  | "sparkle"
  | "alert"
  | "chevron"
  | "print"
  | "restart"
  | "award"
  | "clipboard"
  | "leaf"
  | "star"
  | "list"
  | "pen"
  | "shield";

const paths: Record<IconName, React.ReactNode> = {
  flower: (
    <>
      <circle cx="12" cy="12" r="2.2" />
      <path d="M12 9.8c-1.8-1.2-2.1-3.9-.8-5.4 1.5-1.4 4-1 5 .8.9 1.9-.1 4.2-2 4.8" />
      <path d="M14.2 12c1.2-1.8 3.9-2.1 5.4-.8 1.4 1.5 1 4-.8 5-1.9.9-4.2-.1-4.8-2" />
      <path d="M12 14.2c1.8 1.2 2.1 3.9.8 5.4-1.5 1.4-4 1-5-.8-.9-1.9.1-4.2 2-4.8" />
      <path d="M9.8 12c-1.2 1.8-3.9 2.1-5.4.8-1.4-1.5-1-4 .8-5 1.9-.9 4.2.1 4.8 2" />
    </>
  ),
  timer: (
    <>
      <circle cx="12" cy="13" r="8" />
      <path d="M12 9v4l2.5 1.8M9 2h6" />
    </>
  ),
  sound: (
    <>
      <path d="M4 9.5v5h3.4l4.2 3.4V6.1L7.4 9.5H4Z" />
      <path d="M15.5 8.6a5 5 0 0 1 0 6.8M18.2 5.9a8.8 8.8 0 0 1 0 12.2" />
    </>
  ),
  mute: (
    <>
      <path d="M4 9.5v5h3.4l4.2 3.4V6.1L7.4 9.5H4Z" />
      <path d="m16 9.5 5 5M21 9.5l-5 5" />
    </>
  ),
  lock: (
    <>
      <rect x="4.5" y="10.5" width="15" height="10" rx="2.4" />
      <path d="M8 10.5V7.8a4 4 0 0 1 8 0v2.7M12 14.5v2.5" />
    </>
  ),
  check: <path d="m5 12.5 4.2 4.2L19 6.8" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  "arrow-right": <path d="M19 12H5m6-7-7 7 7 7" />,
  "arrow-left": <path d="M5 12h14m-6-7 7 7-7 7" />,
  download: (
    <>
      <path d="M12 3v12m-4.5-4.5L12 15l4.5-4.5" />
      <path d="M4 16.5V19a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2.5" />
    </>
  ),
  teacher: (
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4.5 21c.5-4 3.4-6.3 7.5-6.3s7 2.3 7.5 6.3" />
      <path d="M19 3.5v4M21 5.5h-4" />
    </>
  ),
  book: (
    <>
      <path d="M12 6.5C10 5 7.2 4.6 4.5 5.4v13.1c2.7-.8 5.5-.4 7.5 1.1 2-1.5 4.8-1.9 7.5-1.1V5.4C16.8 4.6 14 5 12 6.5Z" />
      <path d="M12 6.5v13.1" />
    </>
  ),
  sparkle: (
    <>
      <path d="M12 3.5c.6 4.2 2.3 5.9 6.5 6.5-4.2.6-5.9 2.3-6.5 6.5-.6-4.2-2.3-5.9-6.5-6.5 4.2-.6 5.9-2.3 6.5-6.5Z" />
      <path d="M18.5 16c.3 2 1.1 2.8 3 3-1.9.3-2.7 1.1-3 3-.3-1.9-1.1-2.7-3-3 1.9-.2 2.7-1 3-3Z" />
    </>
  ),
  alert: (
    <>
      <path d="M12 4 2.8 20h18.4L12 4Z" />
      <path d="M12 9.5v4.6M12 17.2v.2" />
    </>
  ),
  chevron: <path d="m8 10 4 4 4-4" />,
  print: (
    <>
      <path d="M7 8V4h10v4M7 17H5a2 2 0 0 1-2-2v-4.5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2V15a2 2 0 0 1-2 2h-2" />
      <rect x="7" y="14" width="10" height="7" rx="1.4" />
      <path d="M17 11.5h.01" />
    </>
  ),
  restart: (
    <>
      <path d="M20 7v5h-5" />
      <path d="M19.2 12a7.5 7.5 0 1 0-1.7 6" />
    </>
  ),
  award: (
    <>
      <circle cx="12" cy="9" r="5.5" />
      <path d="m8.5 13.5-2 7 5.5-2.7 5.5 2.7-2-7" />
    </>
  ),
  clipboard: (
    <>
      <rect x="5.5" y="5" width="13" height="16" rx="2.2" />
      <path d="M9 5V3.8A1.8 1.8 0 0 1 10.8 2h2.4A1.8 1.8 0 0 1 15 3.8V5M9 10.5h6M9 14.5h6M9 18.5h3.5" />
    </>
  ),
  leaf: (
    <>
      <path d="M5 19c0-8 5.5-13.5 14-14 .5 8.5-5 14-14 14Z" />
      <path d="M5 19c3.5-4 6.5-6.5 10-8" />
    </>
  ),
  star: <path d="m12 3.5 2.6 5.4 5.9.8-4.3 4.1 1 5.9-5.2-2.8-5.2 2.8 1-5.9L3.5 9.7l5.9-.8L12 3.5Z" />,
  list: <path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01" />,
  pen: (
    <>
      <path d="M15.5 4.5 19.5 8.5 9 19H5v-4L15.5 4.5Z" />
      <path d="m13.5 6.5 4 4" />
    </>
  ),
  shield: (
    <>
      <path d="M12 2.8 20 6v5.4c0 4.8-3.2 8.4-8 9.8-4.8-1.4-8-5-8-9.8V6l8-3.2Z" />
      <path d="m8.5 12 2.4 2.4 4.6-4.8" />
    </>
  ),
};

interface IconProps extends Omit<SVGProps<SVGSVGElement>, "name"> {
  name: IconName;
  size?: number;
}

export function Icon({ name, size = 20, strokeWidth = 1.7, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {paths[name]}
    </svg>
  );
}
