export function FloralHeader() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 overflow-hidden" aria-hidden="true">
      <svg viewBox="0 0 800 120" className="h-24 w-full opacity-70" preserveAspectRatio="none">
        <g fill="none" stroke="#f9a8d4" strokeWidth="1.5">
          <path d="M20 90 Q60 40 100 80 T180 80" />
          <path d="M620 90 Q660 40 700 80 T780 80" />
        </g>
        <g>
          <circle cx="60" cy="70" r="10" fill="#fbcfe8" />
          <circle cx="60" cy="70" r="4" fill="#f472b6" />
          <circle cx="740" cy="70" r="10" fill="#ddd6fe" />
          <circle cx="740" cy="70" r="4" fill="#a78bfa" />
          <circle cx="400" cy="30" r="8" fill="#fed7aa" />
          <circle cx="400" cy="30" r="3" fill="#fb923c" />
        </g>
        <g fill="#f9a8d4">
          <ellipse cx="120" cy="55" rx="14" ry="6" transform="rotate(-30 120 55)" />
          <ellipse cx="680" cy="55" rx="14" ry="6" transform="rotate(30 680 55)" />
        </g>
      </svg>
    </div>
  );
}

export function Butterfly() {
  return (
    <svg viewBox="0 0 60 40" className="h-8 w-10" aria-hidden="true">
      <ellipse cx="18" cy="14" rx="14" ry="9" fill="#f9a8d4" transform="rotate(-25 18 14)" />
      <ellipse cx="42" cy="14" rx="14" ry="9" fill="#c4b5fd" transform="rotate(25 42 14)" />
      <ellipse cx="18" cy="28" rx="10" ry="6" fill="#fbcfe8" transform="rotate(20 18 28)" />
      <ellipse cx="42" cy="28" rx="10" ry="6" fill="#ddd6fe" transform="rotate(-20 42 28)" />
      <rect x="28" y="8" width="4" height="24" rx="2" fill="#9d174d" />
    </svg>
  );
}
