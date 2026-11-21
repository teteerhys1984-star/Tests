export function WhatsAppIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true" fill="currentColor">
      <path d="M16.004 3C9.385 3 4 8.33 4 14.89c0 2.33.69 4.59 2 6.54L4.1 28.9l7.7-1.98a12.3 12.3 0 0 0 4.2.74C22.62 27.66 28 22.33 28 15.77 28 8.33 22.62 3 16.004 3Zm0 22.6c-1.3 0-2.58-.26-3.78-.76l-.27-.11-4.57 1.17 1.22-4.4-.18-.28a10.1 10.1 0 0 1-1.57-5.33c0-5.5 4.56-9.98 10.15-9.98 5.6 0 10.15 4.48 10.15 9.98 0 5.5-4.55 9.71-10.15 9.71Zm5.56-7.3c-.3-.15-1.8-.88-2.08-.98-.28-.1-.48-.15-.68.15-.2.3-.78.98-.96 1.18-.18.2-.35.22-.65.08-.3-.15-1.28-.47-2.44-1.5-.9-.8-1.5-1.78-1.68-2.08-.18-.3-.02-.46.13-.61.14-.14.3-.35.45-.53.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.68-1.63-.93-2.23-.25-.6-.5-.5-.68-.52h-.58c-.2 0-.53.08-.8.37-.28.3-1.06 1.03-1.06 2.5s1.08 2.9 1.23 3.1c.15.2 2.13 3.23 5.16 4.53.72.3 1.28.5 1.72.63.72.23 1.38.2 1.9.12.58-.09 1.8-.73 2.05-1.44.25-.7.25-1.3.18-1.44-.08-.13-.28-.2-.58-.35Z" />
    </svg>
  );
}

export function ContactFooter() {
  return (
    <footer className="relative z-10 mt-10 border-t-4 border-indigo-100 bg-white/80 px-4 py-6 text-sm text-slate-600 backdrop-blur">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-3 text-center sm:flex-row sm:justify-between sm:text-left">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">Contact</p>
          <p className="mt-0.5 font-semibold text-slate-800" dir="rtl" lang="ar">
            المهندس سومر شاهين
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <a
            href="tel:0930215022"
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 font-medium text-slate-700 shadow-sm active:bg-slate-50"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.34 1.78.64 2.62a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.46-1.21a2 2 0 0 1 2.11-.45c.84.3 1.72.52 2.62.64A2 2 0 0 1 22 16.92z" />
            </svg>
            <span>Phone: 0930215022</span>
          </a>
          <a
            href="https://wa.me/963930215022"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Contact on WhatsApp"
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 font-medium text-white shadow-sm active:bg-emerald-600"
          >
            <WhatsAppIcon />
            <span>WhatsApp</span>
          </a>
        </div>
      </div>
    </footer>
  );
}
