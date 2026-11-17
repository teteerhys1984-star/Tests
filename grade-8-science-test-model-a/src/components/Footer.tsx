export function Footer({ onTeacher, showTeacher = true }: { onTeacher: () => void; showTeacher?: boolean }) {
  return (
    <footer className="mt-10 border-t-2 border-line bg-white">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-6 sm:flex-row sm:justify-between sm:px-6">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-ink text-white">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M12 3v18M3 12h18" />
              <circle cx="12" cy="12" r="8.5" />
            </svg>
          </span>
          <div className="text-center sm:text-start">
            <p className="text-[15px] font-bold text-ink">المهندس سومر شاهين</p>
            <p className="text-[12px] font-semibold text-ink-soft">اختبار الصف الثامن · الفيزياء والكيمياء</p>
          </div>
        </div>

        <a
          href="https://wa.me/963930215022"
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-3 rounded-xl border-2 border-green/40 bg-green/10 px-4 py-2.5 transition-colors hover:border-green hover:bg-green/15"
          aria-label="التواصل عبر واتساب على الرقم 0930215022"
        >
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-green text-white">
            <WhatsappMark />
          </span>
          <span className="text-end leading-tight">
            <span className="block text-[11px] font-bold text-green">واتساب</span>
            <span dir="ltr" className="ltr block text-[16px] font-bold text-ink">
              0930215022
            </span>
          </span>
        </a>

        {showTeacher ? (
          <button
            type="button"
            onClick={onTeacher}
            className="flex items-center gap-2 rounded-lg px-2 py-2 text-[12px] font-semibold text-ink-soft/70 transition-colors hover:text-ink"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <rect x="4" y="10" width="16" height="10" rx="2" />
              <path d="M8 10V7a4 4 0 0 1 8 0v3" />
            </svg>
            منطقة المعلّم
          </button>
        ) : (
          <span className="px-2 py-2 text-[12px] font-semibold text-ink-soft/50">منطقة المعلّم مغلقة أثناء الاختبار</span>
        )}
      </div>
    </footer>
  );
}

function WhatsappMark() {
  return (
    <svg viewBox="0 0 32 32" className="h-5 w-5" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M16.03 3C8.86 3 3.04 8.82 3.04 15.99c0 2.29.6 4.53 1.74 6.5L3 29.5l7.17-1.75a12.9 12.9 0 0 0 5.86 1.4h.01c7.16 0 12.98-5.82 12.98-12.99C29.02 8.82 23.19 3 16.03 3Zm0 23.68h-.01c-1.86 0-3.69-.5-5.28-1.44l-.38-.22-3.91.95.99-3.81-.25-.39a10.7 10.7 0 0 1-1.64-5.72c0-5.94 4.83-10.77 10.78-10.77 2.88 0 5.59 1.12 7.63 3.16a10.7 10.7 0 0 1 3.15 7.62c0 5.95-4.83 10.78-10.78 10.78Zm5.91-8.07c-.32-.16-1.91-.94-2.2-1.05-.3-.11-.51-.16-.73.16-.21.32-.83 1.05-1.02 1.26-.19.21-.37.24-.69.08-.32-.16-1.37-.5-2.61-1.61-.96-.86-1.61-1.92-1.8-2.24-.19-.32-.02-.49.14-.65.14-.14.32-.37.48-.56.16-.19.21-.32.32-.53.11-.21.05-.4-.03-.56-.08-.16-.73-1.76-1-2.41-.26-.63-.53-.54-.73-.55l-.62-.01c-.21 0-.56.08-.85.4-.29.32-1.11 1.09-1.11 2.65s1.14 3.08 1.3 3.29c.16.21 2.24 3.42 5.43 4.8.76.33 1.35.52 1.81.67.76.24 1.45.21 2 .13.61-.09 1.91-.78 2.18-1.54.27-.76.27-1.41.19-1.54-.08-.13-.29-.21-.61-.37Z"
      />
    </svg>
  );
}
