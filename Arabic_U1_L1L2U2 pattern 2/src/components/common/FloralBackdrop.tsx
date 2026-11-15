/** Purely decorative, non-interactive floral atmosphere behind the app. */
export function FloralBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <svg
        className="floral-corner -top-10 -left-16 h-[26rem] w-[26rem] opacity-60"
        viewBox="0 0 400 400"
        fill="none"
      >
        <path
          d="M40 360C100 300 150 240 190 150c25-55 60-95 120-120"
          stroke="#d9b7c2"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <path d="M110 300c-28-27-30-64-4-84 25 20 27 55 4 84Z" fill="#ecc6d1" opacity="0.7" />
        <path d="M150 240c30-8 54 5 60 34-31 6-54-6-60-34Z" fill="#c9c1e4" opacity="0.6" />
        <path d="M208 120c-31-15-42-43-24-65 28 12 38 40 24 65Z" fill="#f1d6ca" opacity="0.75" />
        <circle cx="243" cy="73" r="22" fill="#e9b8c6" opacity="0.55" />
        <circle cx="243" cy="73" r="9" fill="#f6e4cf" />
        <circle cx="128" cy="183" r="6" fill="#d8b9c6" opacity="0.8" />
        <circle cx="198" cy="265" r="4" fill="#c8bbe2" opacity="0.9" />
      </svg>

      <svg
        className="floral-corner -bottom-16 -right-14 h-[28rem] w-[28rem] opacity-50"
        viewBox="0 0 400 400"
        fill="none"
      >
        <path
          d="M365 40C310 110 275 170 240 255c-22 52-60 92-125 110"
          stroke="#d7bcc6"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <path d="M280 160c32-4 54 12 56 41-33 2-53-14-56-41Z" fill="#e9c6d1" opacity="0.7" />
        <path d="M238 255c-31 8-56-4-64-32 32-8 56 4 64 32Z" fill="#cdc5e6" opacity="0.6" />
        <path d="M180 330c-30 6-52-5-60-30 30-7 52 4 60 30Z" fill="#f0d5c7" opacity="0.7" />
        <circle cx="318" cy="118" r="18" fill="#dec7e6" opacity="0.6" />
        <circle cx="318" cy="118" r="7" fill="#f5e8d6" />
        <circle cx="250" cy="212" r="5" fill="#d4b6c2" />
        <circle cx="205" cy="295" r="4" fill="#c9b7de" />
      </svg>

      <svg className="absolute top-[18%] right-[6%] h-10 w-10 opacity-40 animate-petal" viewBox="0 0 40 40" fill="none">
        <path d="M20 20C14 18 12 12 15 8c4 1 6 6 5 12Z" fill="#c7b8e2" />
        <path d="M20 20c2-6 8-8 12-5-1 4-6 6-12 5Z" fill="#e3aebf" />
        <path d="M20 20c6 2 8 8 5 12-4-1-6-6-5-12Z" fill="#efc9b8" />
        <path d="M20 20c-2 6-8 8-12 5 1-4 6-6 12-5Z" fill="#d9c4e7" />
        <circle cx="20" cy="20" r="2" fill="#c9a267" />
      </svg>

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.45),transparent_45%)]" />
    </div>
  );
}
