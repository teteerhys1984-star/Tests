import { Fragment, type ReactNode } from "react";
import { toAr } from "../lib/text";

function underline(s: string, ar = true): ReactNode[] {
  return s.split(/(\[\[.*?\]\])/g).map((p, i) => {
    const m = p.match(/^\[\[(.*?)\]\]$/);
    if (m) return <u key={i}>{ar ? toAr(m[1]) : m[1]}</u>;
    return <Fragment key={i}>{ar ? toAr(p) : p}</Fragment>;
  });
}

/** Renders text with {{ltr math}} chunks and [[underlined]] digits; converts digits to Arabic-Indic. */
export function Rich({ text, className = "" }: { text: string; className?: string }) {
  const parts = text.split(/(\{\{.*?\}\})/g);
  return (
    <span className={className} style={{ whiteSpace: "pre-line" }}>
      {parts.map((p, i) => {
        const m = p.match(/^\{\{(.*?)\}\}$/);
        if (m) {
          return (
            <bdi key={i} className="math">
              {underline(m[1])}
            </bdi>
          );
        }
        return <Fragment key={i}>{underline(p)}</Fragment>;
      })}
    </span>
  );
}
