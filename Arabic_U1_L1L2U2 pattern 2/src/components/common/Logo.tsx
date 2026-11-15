interface LogoProps {
  compact?: boolean;
  light?: boolean;
}

export function FloralMark({ size = 42 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="petalRose" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#e6aec0" />
          <stop offset="100%" stopColor="#b45c7e" />
        </linearGradient>
        <linearGradient id="petalLav" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#cfc5e8" />
          <stop offset="100%" stopColor="#8b7db8" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="30" fill="#fdf6f2" stroke="#efd9dc" strokeWidth="1" />
      <path
        d="M32 31c-1-7.5 4-13.5 11.5-13.8C44.8 24.8 40.5 30.7 32 31Z"
        fill="url(#petalLav)"
        opacity="0.9"
      />
      <path
        d="M32 31c7.5-1 13.5 4 13.8 11.5C38.2 43.8 32.3 39.5 32 31Z"
        fill="url(#petalRose)"
      />
      <path
        d="M32 31c1 7.5-4 13.5-11.5 13.8C19.2 37.2 23.5 31.3 32 31Z"
        fill="url(#petalLav)"
        opacity="0.9"
      />
      <path
        d="M32 31c-7.5 1-13.5-4-13.8-11.5C25.8 18.2 31.7 22.5 32 31Z"
        fill="url(#petalRose)"
        opacity="0.85"
      />
      <circle cx="32" cy="31" r="4.2" fill="#f2cf9a" stroke="#d9ae6f" strokeWidth="1" />
      <path d="M32 35c0 6-1.5 10-4.5 13" stroke="#7e9b80" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <path
        d="M29.5 43c-3.4 .2-5.4 2-6 5 3.5.2 5.5-1.7 6-5Z"
        fill="#a9c2a6"
      />
    </svg>
  );
}

export function Logo({ compact = false, light = false }: LogoProps) {
  return (
    <div className="flex items-center gap-2.5">
      <FloralMark size={compact ? 36 : 44} />
      <div className="leading-tight">
        <div
          className={`font-display font-bold tracking-tight ${compact ? "text-lg" : "text-xl"} ${
            light ? "text-white" : "text-[#703a50]"
          }`}
        >
          زهرة المعرفة
        </div>
        <div className={`text-[11px] ${light ? "text-white/80" : "text-[#a08590]"}`}>
          {compact ? "اختبار اللغة العربية" : "حديقة التعلّم — الصف الخامس الأساسي"}
        </div>
      </div>
    </div>
  );
}
