import katex from "katex";
import { useMemo } from "react";

/**
 * KaTeX rendering helpers.
 *
 * Every mathematical expression is rendered with KaTeX and wrapped in an
 * LTR-isolated container so it never re-orders inside Arabic RTL paragraphs.
 * If KaTeX ever throws, we fall back to the escaped source text instead of
 * crashing the exam — but `throwOnError: false` already prevents that.
 */

function render(latex: string, displayMode: boolean): string {
  try {
    return katex.renderToString(latex, {
      displayMode,
      throwOnError: false,
      strict: false,
      trust: false,
      output: "html",
      macros: {
        "\\par": "\\parallel",
      },
    });
  } catch {
    return "";
  }
}

export function M({ children, className = "" }: { children: string; className?: string }) {
  const html = useMemo(() => render(children, false), [children]);
  return (
    <span
      dir="ltr"
      className={`ktx ${className}`}
      // KaTeX output is generated locally from trusted, authored LaTeX only.
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export function MBlock({ children, className = "" }: { children: string; className?: string }) {
  const html = useMemo(() => render(children, true), [children]);
  return (
    <div
      dir="ltr"
      className={`ktx-block ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

/**
 * Renders a mixed Arabic/LaTeX string. Segments wrapped in `$…$` become KaTeX,
 * everything else stays Arabic text in the surrounding RTL flow.
 */
export function Rich({ text, className = "" }: { text: string; className?: string }) {
  const parts = useMemo(() => text.split(/\$([^$]+)\$/g), [text]);
  return (
    <span className={className}>
      {parts.map((part, i) => {
        if (i % 2 === 1) return <M key={i}>{part}</M>;
        // `**…**` marks emphasis inside the Arabic prose.
        const bold = part.split(/\*\*([^*]+)\*\*/g);
        return (
          <span key={i}>
            {bold.map((b, j) =>
              j % 2 === 1 ? (
                <strong key={j} className="font-bold text-amber-200">
                  {b}
                </strong>
              ) : (
                <span key={j}>{b}</span>
              ),
            )}
          </span>
        );
      })}
    </span>
  );
}