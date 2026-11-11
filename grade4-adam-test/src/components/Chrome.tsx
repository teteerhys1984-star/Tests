import { CONTACT_NAME, CONTACT_PHONE, WHATSAPP_URL } from "../exam/data";

function WhatsappIcon() {
  return (
    <svg viewBox="0 0 24 24" className="icon-wa" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M12.04 2a9.9 9.9 0 0 0-8.4 15.16L2 22l4.96-1.6A9.9 9.9 0 1 0 12.04 2Zm0 18.05a8.15 8.15 0 0 1-4.15-1.14l-.3-.18-2.94.95.96-2.86-.2-.31a8.15 8.15 0 1 1 6.63 3.54Zm4.47-6.1c-.25-.13-1.46-.72-1.68-.8-.23-.09-.4-.13-.56.12-.17.25-.65.8-.8.96-.14.17-.29.19-.54.06a6.7 6.7 0 0 1-1.96-1.21 7.4 7.4 0 0 1-1.36-1.7c-.14-.25-.02-.38.11-.5.12-.13.25-.3.38-.45.12-.15.16-.25.25-.42.08-.17.04-.31-.02-.44-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.42h-.48a.93.93 0 0 0-.67.3 2.8 2.8 0 0 0-.88 2.1 4.88 4.88 0 0 0 1.02 2.59 11.19 11.19 0 0 0 4.29 3.79c.6.26 1.06.41 1.43.53.6.19 1.14.16 1.57.1.48-.08 1.47-.6 1.68-1.18.21-.58.21-1.08.15-1.18-.06-.11-.23-.17-.48-.3Z"
      />
    </svg>
  );
}

export function ContactLine({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`contact-line ${compact ? "is-compact" : ""}`}>
      <span className="contact-name">{CONTACT_NAME}:</span>{" "}
      <bdi dir="ltr" className="contact-phone">
        {CONTACT_PHONE}
      </bdi>
      <a className="wa-link" href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" aria-label="تواصل عبر واتساب">
        <WhatsappIcon />
        <span>واتساب</span>
      </a>
    </div>
  );
}

export function SiteTop() {
  return (
    <header className="site-top">
      <div className="site-top-inner">
        <ContactLine compact />
        <div className="top-marker">
          <span className="pixel-dot dot-green" aria-hidden="true" />
          <span>امتحان الرياضيات · الصف الرابع الأساسي</span>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter({ onTeacherKey }: { onTeacherKey: () => void }) {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div>
          <div className="footer-brand">آدم والرياضيات</div>
          <ContactLine />
          <p className="footer-note">تُحفظ الإجابات والتقارير محليّاً على جهازك، وتُرسَل نتيجتك إلى معلّمك عند التسليم.</p>
        </div>
        <button type="button" className="teacher-link" onClick={onTeacherKey}>
          <span className="lock-glyph" aria-hidden="true">▣</span>
          دليل المعلم
        </button>
      </div>
    </footer>
  );
}

export function BrandMark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <span className="brand-grass" />
      <span className="brand-dirt" />
      <span className="brand-gem" />
    </span>
  );
}

export function Notice({ tone = "warning", children }: { tone?: "warning" | "info"; children: React.ReactNode }) {
  return (
    <div className={`notice notice-${tone}`} role="status">
      <span className="notice-icon" aria-hidden="true">{tone === "warning" ? "!" : "i"}</span>
      <div>{children}</div>
    </div>
  );
}

export function StatBlock({ value, label, accent }: { value: string; label: string; accent?: string }) {
  return (
    <div className="stat-block" style={accent ? { borderTopColor: accent } : undefined}>
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
    </div>
  );
}
