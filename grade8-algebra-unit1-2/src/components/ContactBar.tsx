import { WhatsAppIcon, PhoneIcon } from './Icons';

const PHONE_DISPLAY = '0930 215 022';
const WHATSAPP_URL =
  'https://wa.me/963930215022?text=' +
  encodeURIComponent('السلام عليكم أستاذ سومر، لدي استفسار حول اختبار الجبر للصف الثامن.');

interface ContactBarProps {
  position: 'top' | 'bottom';
}

/**
 * Fixed academic-supervision strip shown above and below every screen.
 * The phone number opens a prefilled WhatsApp conversation in a new tab.
 */
export function ContactBar({ position }: ContactBarProps) {
  const isTop = position === 'top';

  return (
    <aside
      className={`contact-strip ${isTop ? 'is-top' : 'is-bottom'}`}
      aria-label={isTop ? 'شريط التواصل العلوي' : 'شريط التواصل السفلي'}
    >
      <div className="contact-strip-inner">
        <div className="contact-identity">
          <span className={`contact-logo ${isTop ? 'is-top' : 'is-bottom'}`} aria-hidden="true">
            <WhatsAppIcon size={16} />
          </span>
          <span className="contact-meta">
            <span className="contact-role">
              <span className="contact-live-dot" aria-hidden="true" />
              {isTop ? 'الإشراف الأكاديمي · متاح عبر واتساب' : 'إعداد ومتابعة · للاستفسارات والملاحظات'}
            </span>
            <span className="contact-name">
              المهندس سومر شاهين
              <span className="contact-separator" aria-hidden="true">·</span>
              <span className="contact-number" dir="ltr">{PHONE_DISPLAY}</span>
            </span>
          </span>
        </div>

        <a
          className="contact-wa-link"
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`تواصل عبر واتساب مع المهندس سومر شاهين على الرقم 0930215022`}
          title="افتح محادثة واتساب"
        >
          <span className="wa-badge" aria-hidden="true">
            <WhatsAppIcon size={17} />
          </span>
          <span className="wa-link-copy">
            <span className="wa-link-number" dir="ltr">0930 215 022</span>
            <span className="wa-link-label">تواصل عبر واتساب</span>
          </span>
          <PhoneIcon size={13} />
        </a>
      </div>
      <span className="contact-glow-line" aria-hidden="true" />
    </aside>
  );
}
