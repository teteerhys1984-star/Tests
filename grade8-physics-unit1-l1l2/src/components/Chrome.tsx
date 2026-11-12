import { useEffect, useRef } from 'react'
import { CONTACT } from '../exam/types'

/** شريط التواصل — يظهر أعلى الصفحة وأسفلها. */
export function ContactBar({ position }: { position: 'top' | 'bottom' }) {
  return (
    <div className={`contact-bar ${position === 'top' ? '' : ''}`} dir="rtl">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-4 gap-y-1 px-3 py-2 text-center">
        <span className="inline-flex items-center gap-1.5">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z" />
          </svg>
          {CONTACT.name}: <span className="tnum" dir="ltr">{CONTACT.phone}</span>
        </span>
        <a href={CONTACT.whatsapp} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5.1-1.3A10 10 0 1 0 12 2Zm5.3 14.1c-.2.6-1.2 1.2-1.7 1.2-.5.1-1 .1-1.6-.1a12 12 0 0 1-4.7-2.9c-.7-.7-1.2-1.6-1.4-2.1-.2-.5 0-1 .2-1.3l.5-.6c.2-.2.3-.3.4-.5v-.5l-.7-1.7c-.2-.5-.4-.5-.6-.5h-.5c-.2 0-.5.1-.7.4-.3.3-.9.9-.9 2.1s.9 2.4 1 2.6c.1.2 1.8 2.9 4.4 3.9 2.2.9 2.6.7 3.1.7s1.5-.6 1.7-1.2.2-1.1.2-1.2-.3-.2-.6-.3Z" />
          </svg>
          مراسلة عبر واتساب
        </a>
        <span className="hidden text-xs opacity-70 sm:inline">للتواصل فقط — تُرسَل نتيجتك إلى معلّمك عند التسليم</span>
      </div>
    </div>
  )
}

/** رموز فيزيائية عائمة في الخلفية. */
export function GlyphField() {
  const glyphs = ['F', 'θ', 'α', '→', '↗', '∥', '⊥', '√', '°', 'N', 'w', 'M', 'O', '⇒']
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {glyphs.map((g, i) => (
        <span
          key={i}
          className="glyph"
          style={{
            left: `${(i * 7.3 + 4) % 94}%`,
            top: `${(i * 13.7 + 6) % 88}%`,
            fontSize: `${20 + ((i * 9) % 34)}px`,
            animationDelay: `${(i * 1.4) % 8}s`,
            animationDuration: `${14 + (i % 6) * 2}s`,
            ['--rot' as string]: `${(i * 23) % 40 - 20}deg`,
          }}
        >
          {g}
        </span>
      ))}
    </div>
  )
}

/**
 * زخرفة متحركة تعليمية: متوازي أضلاع يُرسم قطره (المحصلة)،
 * وقوتان متوازيتان وسهم محصلتهما بينهما.
 */
export function HeroMotif() {
  return (
    <svg viewBox="0 0 320 240" className="h-auto w-full" role="img" aria-label="زخرفة: متوازي الأضلاع ومحصلة قوتين متوازيتين">
      <defs>
        <linearGradient id="hm1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0f766e" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#b5851d" stopOpacity="0.95" />
        </linearGradient>
        <marker id="hm-ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5.5" markerHeight="5.5" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#ffd97a" />
        </marker>
      </defs>

      {/* شبكة */}
      {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <line key={`v${i}`} x1={20 + i * 34} y1={16} x2={20 + i * 34} y2={224} stroke="#ffffff" strokeOpacity="0.12" strokeWidth="1" />
      ))}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <line key={`h${i}`} x1={20} y1={20 + i * 40} x2={292} y2={20 + i * 40} stroke="#ffffff" strokeOpacity="0.12" strokeWidth="1" />
      ))}

      {/* متوازي الأضلاع */}
      <g opacity="0.95">
        <line x1="52" y1="200" x2="168" y2="200" stroke="#ffffff" strokeOpacity="0.55" strokeWidth="2" markerEnd="url(#hm-ah)" />
        <line x1="52" y1="200" x2="118" y2="96" stroke="#ffffff" strokeOpacity="0.55" strokeWidth="2" markerEnd="url(#hm-ah)" />
        <line x1="168" y1="200" x2="234" y2="96" stroke="#ffffff" strokeOpacity="0.22" strokeWidth="1.6" strokeDasharray="5 4" />
        <line x1="118" y1="96" x2="234" y2="96" stroke="#ffffff" strokeOpacity="0.22" strokeWidth="1.6" strokeDasharray="5 4" />
        <line x1="52" y1="200" x2="234" y2="96" stroke="url(#hm1)" strokeWidth="3.6" strokeLinecap="round"
          style={{ strokeDasharray: 260, strokeDashoffset: 260, animation: 'hm-draw 5.5s ease-in-out infinite' }} />
        <circle cx="52" cy="200" r="4.4" fill="#ffd97a" />
        <circle cx="234" cy="96" r="4.4" fill="#ffd97a" />
      </g>

      {/* قوتان متوازيتان */}
      <g transform="translate(196,26)" opacity="0.9">
        <line x1="0" y1="52" x2="64" y2="52" stroke="#ffffff" strokeOpacity="0.45" strokeWidth="2.6" />
        <line x1="14" y1="52" x2="14" y2="6" stroke="#ffd97a" strokeWidth="2.4" markerEnd="url(#hm-ah)" />
        <line x1="50" y1="52" x2="50" y2="0" stroke="#ffd97a" strokeWidth="2.4" markerEnd="url(#hm-ah)" />
        <line x1="30" y1="52" x2="30" y2="-2" stroke="#bff0e6" strokeWidth="2.8" strokeDasharray="4 3" />
      </g>

      <style>{`
        @keyframes hm-draw { 0%{stroke-dashoffset:260} 55%{stroke-dashoffset:0} 90%{stroke-dashoffset:0;opacity:1} 100%{stroke-dashoffset:0;opacity:.3} }
      `}</style>
    </svg>
  )
}

/** كشف العناصر عند التمرير. */
export function useReveal<T extends HTMLElement>() {
  const ref = useRef<T | null>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const targets = el.querySelectorAll<HTMLElement>('.reveal')
    if (!('IntersectionObserver' in window)) {
      targets.forEach((t) => t.classList.add('in'))
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add('in')
            io.unobserve(e.target)
          }
        }
      },
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' },
    )
    targets.forEach((t) => io.observe(t))
    return () => io.disconnect()
  }, [])
  return ref
}

export function Footer() {
  return (
    <footer className="relative z-10 mt-10 border-t" style={{ borderColor: 'var(--line)' }}>
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <p className="text-sm font-bold" style={{ color: 'var(--ink-2)' }}>
            {CONTACT.name}: <span className="tnum" dir="ltr">{CONTACT.phone}</span>
            {'  ·  '}
            <a href={CONTACT.whatsapp} target="_blank" rel="noopener noreferrer"
              className="underline decoration-dotted underline-offset-4" style={{ color: 'var(--teal)' }}>
              واتساب
            </a>
          </p>
          <p className="max-w-2xl text-xs leading-relaxed" style={{ color: 'var(--ink-3)' }}>
            اختبار تفاعلي للوحدة الأولى من منهج الفيزياء للصف الثامن: الدرس الأول «القوى المتلاقية»
            (ص 55 – 62) والدرس الثاني «القوى المتوازية» (ص 63 – 70) فقط. يُعاد حساب النتيجة والتقرير
            داخل المتصفح بعد التسليم. عند التسليم تُرسَل نتيجة الطالب (الاسم والإجابات والعلامات ونصّ التقرير)
            إلكترونياً إلى معلّمه، ويحتاج هذا الإرسال إلى اتصال بالإنترنت. رابط واتساب أعلاه للتواصل فقط.
          </p>
        </div>
      </div>
      <ContactBar position="bottom" />
    </footer>
  )
}
