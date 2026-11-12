import type { SVGProps } from "react";

export function AppleMark({
  size = 42,
  ...props
}: SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      {...props}
    >
      <defs>
        <linearGradient id="apple-body" x1="10" y1="10" x2="52" y2="58">
          <stop stopColor="#d98ca3" />
          <stop offset="0.5" stopColor="#b65b78" />
          <stop offset="1" stopColor="#8e3f59" />
        </linearGradient>
        <linearGradient id="apple-leaf" x1="34" y1="4" x2="52" y2="20">
          <stop stopColor="#a9c49f" />
          <stop offset="1" stopColor="#6e8f70" />
        </linearGradient>
      </defs>
      <path
        d="M32.5 17.6c-5-3.6-15.8-4-21 2.3C4.6 27.9 8.3 44.8 17.9 53c4.3 3.7 7.8 1.9 10.7 1.9 3 0 6.6 1.8 10.8-1.8 9.9-8.5 13.2-25.2 6.4-33.2-5.1-6.1-15.7-5.8-20.6-2.3" 
        stroke="#f5e8dc"
        strokeWidth="1.4"
        fill="url(#apple-body)"
      />
      <path
        d="M31.9 17.5c-.2-4.5 1.8-8.5 6.2-10.8-.1 4.7-2 8.7-6.2 10.8Z"
        fill="url(#apple-leaf)"
        stroke="#f5e8dc"
        strokeWidth="1"
      />
      <path
        d="M31.7 17c-.8-4.8-3.3-7.3-6.2-8.6"
        stroke="#7d5b45"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <ellipse cx="22" cy="28" rx="5" ry="8" transform="rotate(-28 22 28)" fill="#fff" opacity=".2" />
      <path
        d="M48 8l1.2 3.4L52.6 12.6l-3.4 1.2L48 17.2l-1.2-3.4-3.4-1.2 3.4-1.2L48 8Z"
        fill="#d9b56b"
      />
      <path
        d="M54 22l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2Z"
        fill="#d9b56b"
      />
    </svg>
  );
}

export function FloralDivider({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 320 24"
      className={className}
      fill="none"
      aria-hidden="true"
      width="100%"
      height="24"
      preserveAspectRatio="none"
    >
      <path d="M0 12h118" stroke="#d5b98b" strokeWidth="1" />
      <path d="M202 12h118" stroke="#d5b98b" strokeWidth="1" />
      <path
        d="M160 4c-3 4-9 5-13 2 2-5 8-7 13-2Z"
        fill="#e5c8d2"
        stroke="#b97a8e"
        strokeWidth=".8"
      />
      <path
        d="M160 20c3-4 9-5 13-2-2 5-8 7-13 2Z"
        fill="#d9d1ea"
        stroke="#8f7db0"
        strokeWidth=".8"
      />
      <circle cx="160" cy="12" r="3" fill="#c39a54" />
      <circle cx="146" cy="12" r="1.4" fill="#c39a54" />
      <circle cx="174" cy="12" r="1.4" fill="#c39a54" />
      <path d="M136 12h6M178 12h6" stroke="#c39a54" strokeWidth=".8" />
    </svg>
  );
}

export function CornerBloom({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 220 220"
      className={className}
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M-20 190C35 174 57 135 61 91c2-21 15-36 32-44"
        stroke="#cbb7d9"
        strokeWidth="1.2"
      />
      <path d="M61 91c-16-2-27-12-30-26 16-1 28 9 30 26Z" fill="#e6dcef" stroke="#b7a5ca" strokeWidth="1" />
      <path d="M45 128c-17 5-31 0-40-11 14-8 30-5 40 11Z" fill="#f0dbe3" stroke="#cfa8b7" strokeWidth="1" />
      <path d="M90 55c-3-15 4-26 16-33 5 14 0 27-16 33Z" fill="#dce8dc" stroke="#a8bda8" strokeWidth="1" />
      <path d="M30 160c-13 10-27 11-38 5 9-11 23-15 38-5Z" fill="#e6dcef" stroke="#b7a5ca" strokeWidth="1" />
      <circle cx="64" cy="94" r="5" fill="#f4dfe7" stroke="#c99aab" />
      <circle cx="64" cy="94" r="1.6" fill="#bf9451" />
      <circle cx="58" cy="89" r="4" fill="#efe6f7" stroke="#b4a2c8" />
      <circle cx="70" cy="89" r="4" fill="#efe6f7" stroke="#b4a2c8" />
      <circle cx="58" cy="99" r="4" fill="#efe6f7" stroke="#b4a2c8" />
      <circle cx="70" cy="99" r="4" fill="#efe6f7" stroke="#b4a2c8" />
      <circle cx="34" cy="131" r="3" fill="#f2e6d2" stroke="#d9c09a" />
      <circle cx="96" cy="48" r="2.4" fill="#f2e6d2" stroke="#d9c09a" />
    </svg>
  );
}

export function MirrorCrest({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 320 360" className={className} fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="mirror-gold" x1="50" y1="20" x2="270" y2="330">
          <stop stopColor="#e8cf9c" />
          <stop offset=".5" stopColor="#c6a15d" />
          <stop offset="1" stopColor="#9d7a3d" />
        </linearGradient>
        <linearGradient id="mirror-glass" x1="80" y1="50" x2="240" y2="300">
          <stop stopColor="#fffdfb" />
          <stop offset=".55" stopColor="#f7eef4" />
          <stop offset="1" stopColor="#e8e5f5" />
        </linearGradient>
        <radialGradient id="mirror-glow" cx=".5" cy=".4" r=".65">
          <stop stopColor="#ffffff" stopOpacity=".95" />
          <stop offset="1" stopColor="#f5e9f0" stopOpacity=".1" />
        </radialGradient>
      </defs>
      <path
        d="M160 12c50 0 97 22 113 68 9 26 8 61-3 91-15 42-57 68-110 68S63 213 50 171c-11-30-12-65-3-91 16-46 63-68 113-68Z"
        fill="url(#mirror-glass)"
        stroke="url(#mirror-gold)"
        strokeWidth="7"
      />
      <path
        d="M160 26c43 0 84 19 98 59 8 23 7 53-3 79-13 35-49 57-95 57s-82-22-95-57c-10-26-11-56-3-79 14-40 55-59 98-59Z"
        stroke="#f4e6c8"
        strokeWidth="1"
        strokeDasharray="3 5"
      />
      <circle cx="160" cy="184" r="91" fill="url(#mirror-glow)" />
      <g transform="translate(160 174)">
        <path d="M0 0c-3-16 3-30 19-38" stroke="#7f946f" strokeWidth="4" strokeLinecap="round" />
        <path
          d="M17-30c6-16 22-22 34-20-2 14-14 24-34 20Z"
          fill="#b8cfae"
          stroke="#728b65"
          strokeWidth="1.4"
        />
        <path
          d="M-1-2C-33-2-53 21-53 51c0 34 24 59 53 59s53-25 53-59C53 21 33-2 1-2Z"
          fill="#c9738a"
          stroke="#8e4660"
          strokeWidth="2.4"
        />
        <path
          d="M-30 32c-6 15-4 31 4 43"
          stroke="#f2c7d3"
          strokeWidth="5"
          strokeLinecap="round"
          opacity=".7"
        />
      </g>
      <g fill="#c9a45c">
        <path d="M50 68l2 6 6 2-6 2-2 6-2-6-6-2 6-2 2-6Z" />
        <path d="M263 92l1.6 4.4 4.4 1.6-4.4 1.6-1.6 4.4-1.6-4.4-4.4-1.6 4.4-1.6 1.6-4.4Z" />
        <path d="M248 250l1.4 4 4 1.4-4 1.4-1.4 4-1.4-4-4-1.4 4-1.4 1.4-4Z" />
      </g>
      <path d="M105 78c-15 8-26 23-29 39" stroke="#fff" strokeWidth="4" strokeLinecap="round" opacity=".75" />
      <path
        d="M54 322h212"
        stroke="#d9c19b"
        strokeWidth="1"
      />
      <path d="M160 306l4 8 8 4-8 4-4 8-4-8-8-4 8-4 4-8Z" fill="#d4b276" />
    </svg>
  );
}

export function TinySparkle({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path
        d="M12 2l1.7 7.3L21 12l-7.3 1.7L12 21l-1.7-7.3L3 12l7.3-2.7L12 2Z"
        fill="currentColor"
      />
    </svg>
  );
}
