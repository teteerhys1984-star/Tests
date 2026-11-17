import type { Subject } from "../data/types";
import { Katex } from "../lib/math";
export { Figure } from "./Diagrams";

/* =========================================================================
   عناصر مشتركة: جزر المعادلات والرموز بخط KaTeX حصراً، والأيقونات.
   ========================================================================= */

/** يحوّل نصّاً عربياً ويعرض ما بين [[ ]] عبر محرّك KaTeX حصراً. */
export function RichText({ text }: { text: string }) {
  const parts = text.split(/\[\[(.+?)\]\]/g);
  return (
    <>
      {parts.map((p, i) =>
        i % 2 === 1 ? (
          <Katex key={i} tex={p} className="text-blue-deep font-semibold" />
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </>
  );
}

export function subjectLabel(s: Subject) {
  return s === "physics" ? "فيزياء" : "كيمياء";
}

/* ------------------------------------------------------------- الأيقونات */

export function WhatsappIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M16.03 3C8.86 3 3.04 8.82 3.04 15.99c0 2.29.6 4.53 1.74 6.5L3 29.5l7.17-1.75a12.9 12.9 0 0 0 5.86 1.4h.01c7.16 0 12.98-5.82 12.98-12.99C29.02 8.82 23.19 3 16.03 3Zm0 23.68h-.01c-1.86 0-3.69-.5-5.28-1.44l-.38-.22-3.91.95.99-3.81-.25-.39a10.7 10.7 0 0 1-1.64-5.72c0-5.94 4.83-10.77 10.78-10.77 2.88 0 5.59 1.12 7.63 3.16a10.7 10.7 0 0 1 3.15 7.62c0 5.95-4.83 10.78-10.78 10.78Zm5.91-8.07c-.32-.16-1.91-.94-2.2-1.05-.3-.11-.51-.16-.73.16-.21.32-.83 1.05-1.02 1.26-.19.21-.37.24-.69.08-.32-.16-1.37-.5-2.61-1.61-.96-.86-1.61-1.92-1.8-2.24-.19-.32-.02-.49.14-.65.14-.14.32-.37.48-.56.16-.19.21-.32.32-.53.11-.21.05-.4-.03-.56-.08-.16-.73-1.76-1-2.41-.26-.63-.53-.54-.73-.55l-.62-.01c-.21 0-.56.08-.85.4-.29.32-1.11 1.09-1.11 2.65s1.14 3.08 1.3 3.29c.16.21 2.24 3.42 5.43 4.8.76.33 1.35.52 1.81.67.76.24 1.45.21 2 .13.61-.09 1.91-.78 2.18-1.54.27-.76.27-1.41.19-1.54-.08-.13-.29-.21-.61-.37Z"
      />
    </svg>
  );
}

export function LockIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="4" y="10" width="16" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

export function CheckIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
      <path d="M4 12.5 9.5 18 20 6.5" />
    </svg>
  );
}

export function CrossIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export function SoundIcon({ muted, className = "" }: { muted: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4z" />
      {muted ? <path d="M16 9.5l4 5m0-5l-4 5" /> : <path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" />}
    </svg>
  );
}
