/**
 * Decorative World Explorer backdrop: graticule grid, latitude curves,
 * dashed voyage routes and a slow-turning compass rose. Pure CSS/SVG, aria-hidden.
 */
export function Backdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 world-bg" />
      <div className="absolute inset-0 graticule" />

      {/* latitude arcs */}
      <svg className="absolute inset-0 h-full w-full opacity-[0.07]" preserveAspectRatio="none" viewBox="0 0 1440 900">
        <path d="M-100 240 Q 720 60 1540 240" fill="none" stroke="#e9e0c9" strokeWidth="1" />
        <path d="M-100 300 Q 720 130 1540 300" fill="none" stroke="#e9e0c9" strokeWidth="1" />
        <path d="M-100 640 Q 720 470 1540 640" fill="none" stroke="#e9e0c9" strokeWidth="1" />
        <path d="M-100 700 Q 720 540 1540 700" fill="none" stroke="#e9e0c9" strokeWidth="1" />
      </svg>

      {/* dashed voyage route */}
      <svg className="absolute left-[-8%] top-[12%] h-[46%] w-[70%] opacity-25" viewBox="0 0 800 400" fill="none">
        <path className="route-dash" d="M20 340 C 180 120, 340 360, 520 180 S 740 90, 790 60" stroke="#c99b3c" strokeWidth="2.5" />
        <circle cx="20" cy="340" r="6" fill="#c99b3c" />
        <circle cx="790" cy="60" r="6" fill="#c99b3c" />
        <path d="M786 52 l14 8 -14 8 z" fill="#c99b3c" />
      </svg>

      {/* compass rose */}
      <svg className="compass-slow absolute -right-24 -top-24 h-96 w-96 opacity-[0.10]" viewBox="0 0 200 200">
        <circle cx="100" cy="100" r="96" fill="none" stroke="#e9e0c9" strokeWidth="1.5" />
        <circle cx="100" cy="100" r="70" fill="none" stroke="#e9e0c9" strokeWidth="1" />
        <path d="M100 8 L114 100 L100 192 L86 100 Z" fill="#e9e0c9" />
        <path d="M8 100 L100 86 L192 100 L100 114 Z" fill="#e9e0c9" opacity="0.65" />
        <path d="M100 30 L107 100 L100 170 L93 100 Z" fill="#c99b3c" opacity="0.9" />
        <circle cx="100" cy="100" r="8" fill="#c99b3c" />
      </svg>
    </div>
  );
}
