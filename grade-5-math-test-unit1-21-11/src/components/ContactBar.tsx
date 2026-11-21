import { FaWhatsapp } from 'react-icons/fa6'

export const WHATSAPP_URL = 'https://wa.me/963930215022'
export const PHONE_DISPLAY = '0930215022'

/** Contact strip shown at the bottom of the quiz, results and teacher screens. Tap-only, no hover. */
export function ContactBar() {
  return (
    <footer className="contact" aria-label="بيانات التواصل">
      <div className="contact-name">
        <span className="contact-kicker">للتواصل والاستفسار</span>
        <strong>المهندس سومر شاهين</strong>
      </div>
      <div className="contact-actions">
        <a className="wa-btn" href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" aria-label="مراسلة المهندس سومر شاهين عبر واتساب">
          <FaWhatsapp className="wa-icon" aria-hidden="true" />
          <span>واتساب</span>
        </a>
        <a className="contact-phone" href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" dir="ltr">
          {PHONE_DISPLAY}
        </a>
      </div>
    </footer>
  )
}
