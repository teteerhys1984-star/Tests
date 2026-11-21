import { useEffect, useState } from 'react'
import { formatHMS } from '../lib/attempt'

/** Soft decorative stars and ribbons. Purely visual, behind content, never interactive. */
export function Decor() {
  return (
    <div className="decor" aria-hidden="true">
      <svg className="decor-star d1" viewBox="0 0 24 24"><path d="M12 2l2.6 6.6L21.5 9l-5.2 4.4L18 21l-6-3.8L6 21l1.7-7.6L2.5 9l6.9-.4z" /></svg>
      <svg className="decor-star d2" viewBox="0 0 24 24"><path d="M12 2l2.6 6.6L21.5 9l-5.2 4.4L18 21l-6-3.8L6 21l1.7-7.6L2.5 9l6.9-.4z" /></svg>
      <svg className="decor-star d3" viewBox="0 0 24 24"><path d="M12 2l2.6 6.6L21.5 9l-5.2 4.4L18 21l-6-3.8L6 21l1.7-7.6L2.5 9l6.9-.4z" /></svg>
      <svg className="decor-flower" viewBox="0 0 40 40">
        <g fill="#F4B6CF">
          <circle cx="20" cy="9" r="7" />
          <circle cx="31" cy="20" r="7" />
          <circle cx="20" cy="31" r="7" />
          <circle cx="9" cy="20" r="7" />
        </g>
        <circle cx="20" cy="20" r="5" fill="#E9C46A" />
      </svg>
    </div>
  )
}

/** Live HH:MM:SS timer based on the real start timestamp (not on a counter that pauses on navigation). */
export function Timer({ startedAt, submittedAt }: { startedAt: number; submittedAt: number | null }) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (submittedAt !== null) return
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [submittedAt])
  const end = submittedAt ?? now
  return (
    <span className="timer" dir="ltr" aria-label="الوقت المنقضي">
      <span className="timer-icon" aria-hidden="true">⏱</span>
      {formatHMS(Math.max(0, end - startedAt))}
    </span>
  )
}

export function MuteButton({ muted, onToggle }: { muted: boolean; onToggle: () => void }) {
  return (
    <button type="button" className="mute-btn" onClick={onToggle} aria-pressed={muted} aria-label={muted ? 'إلغاء كتم الصوت' : 'كتم الصوت'}>
      <span aria-hidden="true">{muted ? '🔇' : '🔔'}</span>
      <span className="mute-text">{muted ? 'الصوت مكتوم' : 'الصوت مفعّل'}</span>
    </button>
  )
}
