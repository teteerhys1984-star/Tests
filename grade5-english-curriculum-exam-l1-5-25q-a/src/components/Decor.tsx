/** Hand-drawn decorative SVG set: flowers, stars, ribbon, ticks and the WhatsApp mark. */

export function Flower({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <g fill="currentColor" opacity="0.9">
        <ellipse cx="24" cy="11" rx="6.4" ry="8.6" />
        <ellipse cx="24" cy="11" rx="6.4" ry="8.6" transform="rotate(72 24 24)" />
        <ellipse cx="24" cy="11" rx="6.4" ry="8.6" transform="rotate(144 24 24)" />
        <ellipse cx="24" cy="11" rx="6.4" ry="8.6" transform="rotate(216 24 24)" />
        <ellipse cx="24" cy="11" rx="6.4" ry="8.6" transform="rotate(288 24 24)" />
      </g>
      <circle cx="24" cy="24" r="5.6" fill="#FFD9A8" />
      <circle cx="24" cy="24" r="2.4" fill="#FF9E7A" />
    </svg>
  );
}

export function Star({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 1.6l2.7 6.2 6.7.6-5.1 4.5 1.5 6.6L12 16.1 6.2 19.5l1.5-6.6L2.6 8.4l6.7-.6z"
      />
    </svg>
  );
}

export function Ribbon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 40" className={className} aria-hidden="true">
      <path
        d="M6 26c14-18 30-18 44-4 12 12 26 12 40-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path
        d="M92 6l16 12-18 8 3-9z"
        fill="currentColor"
        opacity="0.85"
      />
    </svg>
  );
}

export function Tick({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d="M4.5 12.8l5 5.2L19.6 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Cross({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d="M6.4 6.4l11.2 11.2M17.6 6.4L6.4 17.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Lock({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <rect
        x="4.5"
        y="10.5"
        width="15"
        height="10"
        rx="2.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M8 10.5V8a4 4 0 018 0v2.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function SoundOn({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d="M4 9.5h3.2L12 5.4v13.2L7.2 14.5H4z"
        fill="currentColor"
      />
      <path
        d="M15.4 9a4.2 4.2 0 010 6M18 6.4a7.8 7.8 0 010 11.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function SoundOff({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M4 9.5h3.2L12 5.4v13.2L7.2 14.5H4z" fill="currentColor" />
      <path
        d="M16 9.6l4.6 4.8M20.6 9.6L16 14.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** WhatsApp glyph (official handset-in-speech-bubble silhouette). */
export function WhatsApp({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347M12.05 21.785h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413" />
    </svg>
  );
}
