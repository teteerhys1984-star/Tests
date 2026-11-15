interface P { className?: string }

export function Flower({ className = '', color = '#f8b1c6', center = '#ffdcc4' }: P & { color?: string; center?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      {[0, 72, 144, 216, 288].map((r) => (
        <ellipse key={r} cx="32" cy="16" rx="9" ry="14" fill={color} opacity="0.85" transform={`rotate(${r} 32 32)`} />
      ))}
      <circle cx="32" cy="32" r="7" fill={center} />
    </svg>
  );
}

export function Butterfly({ className = '' }: P) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <path d="M32 30 C20 10 4 14 8 28 C10 36 22 36 32 32Z" fill="#e2d6fb" />
      <path d="M32 30 C44 10 60 14 56 28 C54 36 42 36 32 32Z" fill="#fdd3df" />
      <path d="M32 33 C22 38 14 50 22 54 C28 56 31 44 32 36Z" fill="#b49ae8" opacity=".7" />
      <path d="M32 33 C42 38 50 50 42 54 C36 56 33 44 32 36Z" fill="#f8b1c6" opacity=".8" />
      <rect x="31" y="22" width="2" height="22" rx="1" fill="#7f62c2" />
      <path d="M32 22 C30 16 27 14 25 13 M32 22 C34 16 37 14 39 13" stroke="#7f62c2" strokeWidth="1.2" fill="none" />
    </svg>
  );
}

export function Leaf({ className = '' }: P) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <path d="M8 56 C8 24 28 8 56 8 C56 36 40 56 8 56Z" fill="#cfe8d4" opacity=".7" />
      <path d="M10 54 C26 40 38 26 52 12" stroke="#9fcca9" strokeWidth="1.5" fill="none" />
    </svg>
  );
}

export function GardenBackdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden no-print" aria-hidden="true">
      <Flower className="absolute -top-6 -right-6 w-36 opacity-50" />
      <Leaf className="absolute top-24 right-4 w-16 opacity-60" />
      <Flower className="absolute bottom-10 -left-8 w-40 opacity-40" color="#e2d6fb" center="#fdd3df" />
      <Leaf className="absolute bottom-40 left-10 w-14 opacity-50" />
      <Butterfly className="float-slow absolute top-1/3 left-6 w-12 opacity-70" />
      <Flower className="absolute top-2/3 right-10 w-16 opacity-30" color="#ffdcc4" center="#f8b1c6" />
    </div>
  );
}

export function FloralDivider() {
  return (
    <div className="flex items-center justify-center gap-3 my-3" aria-hidden="true">
      <span className="h-px w-16 bg-gradient-to-l from-blush-300 to-transparent" />
      <Flower className="w-5" />
      <Flower className="w-4" color="#e2d6fb" />
      <Flower className="w-5" />
      <span className="h-px w-16 bg-gradient-to-r from-blush-300 to-transparent" />
    </div>
  );
}
