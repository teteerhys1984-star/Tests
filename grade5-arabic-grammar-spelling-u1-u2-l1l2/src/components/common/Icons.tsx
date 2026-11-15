type P = { className?: string };
const base = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

export const IconClock = ({ className = 'w-5 h-5' }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base} aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
);
export const IconSound = ({ className = 'w-5 h-5', on }: P & { on: boolean }) => (
  <svg viewBox="0 0 24 24" className={className} {...base} aria-hidden="true">
    <path d="M4 9v6h4l5 4V5L8 9H4z" />
    {on ? <path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11" /> : <path d="M17 9l5 6M22 9l-5 6" />}
  </svg>
);
export const IconNext = ({ className = 'w-5 h-5' }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base} aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg>
);
export const IconPrev = ({ className = 'w-5 h-5' }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base} aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
);
export const IconCheck = ({ className = 'w-5 h-5' }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base} aria-hidden="true"><path d="M5 12l5 5L20 7" /></svg>
);
export const IconX = ({ className = 'w-5 h-5' }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base} aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
);
export const IconDownload = ({ className = 'w-5 h-5' }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base} aria-hidden="true"><path d="M12 4v11M7 10l5 5 5-5M5 20h14" /></svg>
);
export const IconLock = ({ className = 'w-5 h-5' }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base} aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
);
export const IconRefresh = ({ className = 'w-5 h-5' }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base} aria-hidden="true"><path d="M20 11a8 8 0 1 0-2.3 5.7M20 5v6h-6" /></svg>
);
export const IconSend = ({ className = 'w-5 h-5' }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base} aria-hidden="true"><path d="M21 3L10 14M21 3l-7 18-4-7-7-4 18-7z" /></svg>
);
