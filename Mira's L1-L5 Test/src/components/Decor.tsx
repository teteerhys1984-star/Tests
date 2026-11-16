/* ------------------------------------------------------------------ */
/*  Hand-drawn SVG garden decorations — flowers, butterflies, stars    */
/* ------------------------------------------------------------------ */

interface IconProps {
  className?: string;
  style?: React.CSSProperties;
}

export function Flower({ className, style }: IconProps) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className} style={style} aria-hidden="true">
      <g>
        <ellipse cx="32" cy="14" rx="7.5" ry="11" fill="currentColor" opacity="0.9" />
        <ellipse cx="32" cy="50" rx="7.5" ry="11" fill="currentColor" opacity="0.9" />
        <ellipse cx="14" cy="32" rx="11" ry="7.5" fill="currentColor" opacity="0.9" />
        <ellipse cx="50" cy="32" rx="11" ry="7.5" fill="currentColor" opacity="0.9" />
        <ellipse cx="19.5" cy="19.5" rx="9.5" ry="6.5" transform="rotate(45 19.5 19.5)" fill="currentColor" opacity="0.75" />
        <ellipse cx="44.5" cy="19.5" rx="9.5" ry="6.5" transform="rotate(-45 44.5 19.5)" fill="currentColor" opacity="0.75" />
        <ellipse cx="19.5" cy="44.5" rx="9.5" ry="6.5" transform="rotate(-45 19.5 44.5)" fill="currentColor" opacity="0.75" />
        <ellipse cx="44.5" cy="44.5" rx="9.5" ry="6.5" transform="rotate(45 44.5 44.5)" fill="currentColor" opacity="0.75" />
        <circle cx="32" cy="32" r="8" fill="#F5C56B" />
        <circle cx="32" cy="32" r="4" fill="#E8902F" opacity="0.7" />
      </g>
    </svg>
  );
}

export function FlowerStem({ className, style }: IconProps) {
  return (
    <svg viewBox="0 0 64 96" fill="none" className={className} style={style} aria-hidden="true">
      <path d="M32 40 C 30 60, 34 78, 32 94" stroke="#4F9D6F" strokeWidth="3" strokeLinecap="round" />
      <path d="M32 66 C 24 62, 18 62, 14 66 C 20 70, 28 70, 32 66Z" fill="#8FD0A8" />
      <path d="M32 78 C 40 74, 46 74, 50 78 C 44 82, 36 82, 32 78Z" fill="#8FD0A8" />
      <g transform="translate(0,-6)">
        <ellipse cx="32" cy="16" rx="6.5" ry="9.5" fill="currentColor" opacity="0.9" />
        <ellipse cx="32" cy="48" rx="6.5" ry="9.5" fill="currentColor" opacity="0.0" />
        <ellipse cx="16" cy="32" rx="9.5" ry="6.5" fill="currentColor" opacity="0.9" />
        <ellipse cx="48" cy="32" rx="9.5" ry="6.5" fill="currentColor" opacity="0.9" />
        <ellipse cx="21" cy="21" rx="8" ry="5.5" transform="rotate(45 21 21)" fill="currentColor" opacity="0.7" />
        <ellipse cx="43" cy="21" rx="8" ry="5.5" transform="rotate(-45 43 21)" fill="currentColor" opacity="0.7" />
        <circle cx="32" cy="30" r="7" fill="#F5C56B" />
      </g>
    </svg>
  );
}

export function Butterfly({ className, style }: IconProps) {
  return (
    <svg viewBox="0 0 72 56" fill="none" className={className} style={style} aria-hidden="true">
      <g>
        <path d="M34 28 C 18 4, -2 10, 6 24 C 11 32, 24 32, 34 28Z" fill="currentColor" opacity="0.85" />
        <path d="M38 28 C 54 4, 74 10, 66 24 C 61 32, 48 32, 38 28Z" fill="currentColor" opacity="0.85" />
        <path d="M34 32 C 22 42, 8 46, 12 52 C 16 58, 30 48, 34 36Z" fill="currentColor" opacity="0.6" />
        <path d="M38 32 C 50 42, 64 46, 60 52 C 56 58, 42 48, 38 36Z" fill="currentColor" opacity="0.6" />
        <ellipse cx="36" cy="30" rx="2.6" ry="10" fill="#5D4390" />
        <path d="M34 20 C 32 14, 30 11, 27 9" stroke="#5D4390" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M38 20 C 40 14, 42 11, 45 9" stroke="#5D4390" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="27" cy="9" r="1.6" fill="#5D4390" />
        <circle cx="45" cy="9" r="1.6" fill="#5D4390" />
      </g>
    </svg>
  );
}

export function Sparkle({ className, style }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} style={style} aria-hidden="true">
      <path d="M12 2 C 12.8 7.5, 16.5 11.2, 22 12 C 16.5 12.8, 12.8 16.5, 12 22 C 11.2 16.5, 7.5 12.8, 2 12 C 7.5 11.2, 11.2 7.5, 12 2Z" fill="currentColor" />
    </svg>
  );
}

export function LeafSprig({ className, style }: IconProps) {
  return (
    <svg viewBox="0 0 64 32" fill="none" className={className} style={style} aria-hidden="true">
      <path d="M4 28 C 20 22, 44 22, 60 28" stroke="#4F9D6F" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M16 25 C 12 16, 16 10, 22 8 C 26 16, 22 22, 16 25Z" fill="#8FD0A8" />
      <path d="M32 23 C 28 14, 32 8, 38 6 C 42 14, 38 20, 32 23Z" fill="#A8DCBB" />
      <path d="M48 25 C 44 16, 48 10, 54 8 C 58 16, 54 22, 48 25Z" fill="#8FD0A8" />
    </svg>
  );
}

/** Scattered ambient decoration layer (non-interactive). */
export function GardenAmbient() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
      <Flower className="absolute -left-8 top-24 h-28 w-28 text-petal-deep opacity-40 animate-float" />
      <Flower className="absolute right-6 top-16 h-16 w-16 text-lilac-deep opacity-35 animate-float-slow" />
      <Flower className="absolute bottom-40 -right-10 h-32 w-32 text-peach-deep opacity-30 animate-float" />
      <Flower className="absolute left-10 bottom-24 h-14 w-14 text-rose opacity-25 animate-float-slow" />
      <Butterfly className="absolute left-[12%] top-[38%] h-10 w-14 text-lilac-deep opacity-45 animate-flutter" />
      <Butterfly className="absolute right-[16%] top-[62%] h-8 w-12 text-rose opacity-40 animate-flutter" style={{ animationDelay: "-3.5s" }} />
      <Sparkle className="absolute left-[30%] top-[12%] h-4 w-4 text-gold opacity-60 animate-twinkle" />
      <Sparkle className="absolute right-[28%] top-[26%] h-3 w-3 text-gold opacity-50 animate-twinkle" style={{ animationDelay: "-1.4s" }} />
      <Sparkle className="absolute left-[8%] top-[70%] h-3.5 w-3.5 text-petal-deep opacity-70 animate-twinkle" style={{ animationDelay: "-2.2s" }} />
      <Sparkle className="absolute right-[8%] top-[84%] h-4 w-4 text-lilac-deep opacity-50 animate-twinkle" style={{ animationDelay: "-0.8s" }} />
    </div>
  );
}
