/**
 * Elegant contact strip — English text only.
 * The phone number and the WhatsApp icon both link to the same chat.
 */
export default function ContactSection() {
  return (
    <section aria-label="Contact" className="mx-auto w-full max-w-5xl px-4 pb-6 sm:px-6">
      <div className="card flex flex-col items-center gap-4 px-5 py-4 sm:flex-row sm:justify-between sm:gap-6 sm:px-7">
        <div className="flex items-center gap-3 text-center sm:text-left">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-leaf-100 text-leaf-700">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6" aria-hidden="true">
              <path d="M20.5 11.8a8.5 8.5 0 0 1-12.6 7.3L3 20.7l1.7-4.6a8.5 8.5 0 1 1 15.8-4.3z" />
              <path d="M9.5 10.2c.15 1.35 1.05 2.6 2.35 3.3.6.32 1.1.1 1.45-.45l.45-.7c.16-.25.45-.35.73-.22l1.5.62c.3.13.43.47.3.78-.62 1.5-2.55 2.3-4.1 1.6-1.9-.85-3.35-2.35-4.2-4.25-.7-1.55.1-3.48 1.6-4.1.3-.13.65 0 .78.3l.62 1.5c.13.28.03.57-.22.73l-.7.45c-.55.35-.77.85-.45 1.45z" strokeWidth="1.4" />
            </svg>
          </div>
          <div>
            <p className="font-display text-base font-bold text-pine-900">Eng. Somer Shaheen</p>
            <a
              href="https://wa.me/963930215022"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Chat with Eng. Somer Shaheen on WhatsApp, 0930215022"
              className="group inline-flex items-center gap-1.5 text-sm font-extrabold text-leaf-700 transition-colors hover:text-leaf-600"
            >
              <span className="underline decoration-gold-400 decoration-2 underline-offset-2 group-hover:decoration-leaf-600">
                WhatsApp: 0930215022
              </span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true">
                <path d="M7 17L17 7" />
                <path d="M9 7h8v8" />
              </svg>
            </a>
          </div>
        </div>
        <p className="text-center text-[11px] font-bold uppercase tracking-[0.18em] text-ink-soft sm:text-right">
          Questions?<br className="sm:hidden" /> Reach out anytime
        </p>
      </div>
    </section>
  );
}
