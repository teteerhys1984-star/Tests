const WA = 'https://wa.me/963930215022'

function WhatsAppIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true" fill="currentColor">
      <path d="M16.004 3C8.83 3 3 8.83 3 16.004c0 2.29.6 4.53 1.74 6.5L3 29l6.66-1.72a12.95 12.95 0 0 0 6.34 1.65h.01C23.17 28.93 29 23.1 29 15.93 29 8.83 23.17 3 16.004 3Zm0 23.73h-.01a10.75 10.75 0 0 1-5.48-1.5l-.39-.23-3.95 1.02 1.05-3.85-.26-.4a10.73 10.73 0 0 1-1.65-5.73c0-5.94 4.84-10.78 10.79-10.78 2.88 0 5.59 1.12 7.62 3.16a10.7 10.7 0 0 1 3.16 7.63c0 5.95-4.84 10.78-10.78 10.78Zm5.91-8.07c-.32-.16-1.92-.95-2.21-1.05-.3-.11-.51-.16-.73.16-.21.32-.83 1.05-1.02 1.26-.19.22-.37.24-.7.08-.32-.16-1.37-.5-2.6-1.6-.96-.86-1.61-1.92-1.8-2.24-.19-.33-.02-.5.14-.66.15-.14.33-.38.49-.57.16-.19.21-.32.32-.54.11-.22.05-.4-.03-.57-.08-.16-.73-1.76-1-2.41-.26-.63-.53-.55-.73-.56h-.62c-.22 0-.57.08-.86.4-.3.33-1.13 1.11-1.13 2.7 0 1.6 1.16 3.14 1.32 3.36.16.21 2.28 3.48 5.53 4.88.77.33 1.37.53 1.84.68.78.25 1.48.21 2.04.13.62-.09 1.92-.78 2.19-1.54.27-.76.27-1.4.19-1.54-.08-.14-.3-.22-.62-.38Z" />
    </svg>
  )
}

export function Footer({ onTeacher }: { onTeacher: () => void }) {
  return (
    <footer className="mx-auto mt-6 w-full max-w-3xl px-4 pb-6" style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif" }}>
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-sky-100 bg-white/80 px-4 py-4 text-center sm:flex-row sm:justify-between sm:text-right">
        <div>
          <p className="text-sm font-bold text-ink">المهندس سومر شاهين</p>
          <a href={WA} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-sky-700 underline-offset-2 hover:underline" dir="ltr">
            0930215022
          </a>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={WA}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="تواصل عبر واتساب"
            className="flex h-11 items-center gap-2 rounded-xl bg-[#25D366] px-3 text-sm font-bold text-white shadow-sm"
          >
            <WhatsAppIcon className="h-6 w-6" />
            واتساب
          </a>
          <button type="button" onClick={onTeacher} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-ink-soft">
            منطقة المعلم
          </button>
        </div>
      </div>
    </footer>
  )
}
