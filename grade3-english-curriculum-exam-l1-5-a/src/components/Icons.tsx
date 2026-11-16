import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  viewBox: "0 0 24 24",
  "aria-hidden": true,
};

export const ClockIcon = (p: IconProps) => (
  <svg {...stroke} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);
export const SpeakerOnIcon = (p: IconProps) => (
  <svg {...stroke} {...p}>
    <path d="M11 5 6 9H3v6h3l5 4z" />
    <path d="M15.5 8.5a5 5 0 0 1 0 7" />
    <path d="M18.5 5.5a9 9 0 0 1 0 13" />
  </svg>
);
export const SpeakerOffIcon = (p: IconProps) => (
  <svg {...stroke} {...p}>
    <path d="M11 5 6 9H3v6h3l5 4z" />
    <path d="m16 9 5 6" />
    <path d="m21 9-5 6" />
  </svg>
);
export const CheckIcon = (p: IconProps) => (
  <svg {...stroke} {...p}>
    <path d="m5 12 5 5 9-10" />
  </svg>
);
export const XIcon = (p: IconProps) => (
  <svg {...stroke} {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);
export const ChevronLeftIcon = (p: IconProps) => (
  <svg {...stroke} {...p}>
    <path d="m15 18-6-6 6-6" />
  </svg>
);
export const ChevronRightIcon = (p: IconProps) => (
  <svg {...stroke} {...p}>
    <path d="m9 18 6-6-6-6" />
  </svg>
);
export const LockIcon = (p: IconProps) => (
  <svg {...stroke} {...p}>
    <rect x="4" y="11" width="16" height="10" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </svg>
);
export const DownloadIcon = (p: IconProps) => (
  <svg {...stroke} {...p}>
    <path d="M12 4v11" />
    <path d="m7 10 5 5 5-5" />
    <path d="M5 20h14" />
  </svg>
);
export const RefreshIcon = (p: IconProps) => (
  <svg {...stroke} {...p}>
    <path d="M20 11a8 8 0 1 0-2.3 5.7" />
    <path d="M20 4v7h-7" />
  </svg>
);
export const BookIcon = (p: IconProps) => (
  <svg {...stroke} {...p}>
    <path d="M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2z" />
    <path d="M22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z" />
  </svg>
);
export const UserIcon = (p: IconProps) => (
  <svg {...stroke} {...p}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21a8 8 0 0 1 16 0" />
  </svg>
);
export const MusicIcon = (p: IconProps) => (
  <svg {...stroke} {...p}>
    <path d="M9 18V5l12-2v13" />
    <circle cx="6" cy="18" r="3" />
    <circle cx="18" cy="16" r="3" />
  </svg>
);
export const ChatIcon = (p: IconProps) => (
  <svg {...stroke} {...p}>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);
export const TableIcon = (p: IconProps) => (
  <svg {...stroke} {...p}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="M3 10h18M9 4v16" />
  </svg>
);
export const ImageIcon = (p: IconProps) => (
  <svg {...stroke} {...p}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <circle cx="9" cy="10" r="2" />
    <path d="m21 16-5-5-9 9" />
  </svg>
);
export const GridIcon = (p: IconProps) => (
  <svg {...stroke} {...p}>
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" />
  </svg>
);
export const SendIcon = (p: IconProps) => (
  <svg {...stroke} {...p}>
    <path d="M22 2 11 13" />
    <path d="M22 2 15 22l-4-9-9-4z" />
  </svg>
);
export const KeyIcon = (p: IconProps) => (
  <svg {...stroke} {...p}>
    <circle cx="7.5" cy="15.5" r="4.5" />
    <path d="m10.7 12.3 9.8-9.8M17 6l3 3M14.5 8.5l2 2" />
  </svg>
);
export const PrintIcon = (p: IconProps) => (
  <svg {...stroke} {...p}>
    <path d="M6 9V2h12v7" />
    <rect x="3" y="9" width="18" height="8" rx="2" />
    <path d="M6 14h12v8H6z" />
  </svg>
);
export const InfoIcon = (p: IconProps) => (
  <svg {...stroke} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5M12 8h.01" />
  </svg>
);

export const LeafLogo = (p: IconProps) => (
  <svg viewBox="0 0 40 40" aria-hidden="true" {...p}>
    <rect width="40" height="40" rx="12" fill="#bef264" />
    <path d="M11 27c0-9 7-15 18-15 0 10-6 17-14 17-1.5 0-2.8-.3-4-.8" fill="#16a34a" />
    <path d="M12 28c3-4 7-7 12-10" stroke="#ecfccb" strokeWidth="2" strokeLinecap="round" fill="none" />
  </svg>
);

/** WhatsApp glyph (Simple Icons, CC0). */
export const WhatsAppIcon = (p: IconProps) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor" {...p}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
  </svg>
);

/** Small friendly illustration for the welcome page: an open book, a pencil and stars. */
export const BookIllustration = (p: IconProps) => (
  <svg viewBox="0 0 220 160" aria-hidden="true" {...p}>
    <ellipse cx="110" cy="146" rx="84" ry="9" fill="#d9f99d" />
    <path d="M30 42c26-10 52-8 78 6v86c-26-14-52-16-78-6z" fill="#ffffff" stroke="#16a34a" strokeWidth="4" strokeLinejoin="round" />
    <path d="M190 42c-26-10-52-8-78 6v86c26-14 52-16 78-6z" fill="#f7fee7" stroke="#16a34a" strokeWidth="4" strokeLinejoin="round" />
    <path d="M44 62c16-4 32-2 50 5M44 80c16-4 32-2 50 5M44 98c16-4 32-2 50 5" stroke="#86efac" strokeWidth="5" strokeLinecap="round" />
    <path d="M126 67c18-7 34-9 50-5M126 85c18-7 34-9 50-5" stroke="#bef264" strokeWidth="5" strokeLinecap="round" />
    <g transform="rotate(-38 160 92)">
      <rect x="132" y="86" width="64" height="14" rx="3" fill="#facc15" stroke="#a16207" strokeWidth="2.5" />
      <path d="M196 86l14 7-14 7z" fill="#fde68a" stroke="#a16207" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M206 91l4 2-4 2z" fill="#3f3f46" />
      <rect x="126" y="86" width="8" height="14" rx="2" fill="#f472b6" stroke="#9d174d" strokeWidth="2" />
    </g>
    <path d="M38 18l3 7 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z" fill="#a3e635" />
    <path d="M186 14l2.4 5.2 5.6.8-4 4 1 5.6-5-2.7-5 2.7 1-5.6-4-4 5.6-.8z" fill="#4ade80" />
    <circle cx="200" cy="56" r="4" fill="#bbf7d0" />
    <circle cx="20" cy="70" r="3" fill="#d9f99d" />
  </svg>
);
