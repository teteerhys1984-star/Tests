import React from 'react';

interface BannerProps {
  position?: 'top' | 'bottom';
}

export const ContactBanner: React.FC<BannerProps> = ({ position = 'top' }) => {
  const whatsappUrl = 'https://wa.me/963930215022?text=' + encodeURIComponent('مرحباً أستاذ سومر شاهين، بخصوص اختبار MATHVERSE للصف الثامن');

  return (
    <aside
      aria-label="معلومات التواصل والإشراف"
      className={`fixed left-0 right-0 z-40 select-none backdrop-blur-md transition-all duration-300 ${
        position === 'top'
          ? 'top-0 border-b border-cyan-500/20 bg-slate-950/85 shadow-lg shadow-cyan-950/30'
          : 'bottom-0 border-t border-teal-500/20 bg-slate-950/90 shadow-lg shadow-teal-950/40'
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-3 py-1.5 sm:px-6 sm:py-2">
        {/* Left Side: Brand badge */}
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-tr from-cyan-500 to-teal-400 p-1 shadow-sm shadow-cyan-400/50">
            <span className="text-[10px] font-black text-slate-950">MV</span>
          </div>
          <span className="hidden text-xs font-bold tracking-wider text-slate-300 sm:inline-block">
            {position === 'top' ? (
              'الإشراف الأكاديمي والامتحاني'
            ) : (
              <span>
                منظومة <bdi dir="ltr" className="font-mono text-cyan-300">MATHVERSE</bdi> الرياضية
              </span>
            )}
          </span>
        </div>

        {/* Center / Right: Eng. Soumar Shaheen & WhatsApp Direct Link */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="text-right">
            <span className="text-xs font-bold text-slate-200 sm:text-sm">
              المهندس سومر شاهين:
            </span>
          </div>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-2 rounded-full border border-emerald-500/40 bg-gradient-to-r from-emerald-950/80 via-emerald-900/60 to-emerald-950/80 px-2.5 py-1 text-xs font-bold text-emerald-300 shadow-md shadow-emerald-950/50 transition-all duration-200 hover:scale-105 hover:border-emerald-400 hover:bg-emerald-900 hover:text-white"
            title="تواصل مباشر عبر الواتساب مع المهندس سومر شاهين"
          >
            {/* WhatsApp Logo */}
            <div className="relative flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm shadow-emerald-400/80 transition-transform group-hover:rotate-12">
              <svg
                viewBox="0 0 24 24"
                width="14"
                height="14"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
              </svg>
              <span className="absolute -top-0.5 -right-0.5 h-2 w-2 animate-ping rounded-full bg-emerald-400 opacity-75" />
            </div>

            <span className="font-mono text-xs tracking-wider sm:text-sm" dir="ltr">
              0930215022
            </span>

            <span className="hidden rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] text-emerald-200 md:inline-block">
              واتساب مباشر
            </span>
          </a>
        </div>
      </div>
    </aside>
  );
};
