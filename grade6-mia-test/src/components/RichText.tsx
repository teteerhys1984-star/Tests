import { useMemo } from "react";
import katex from "katex";

function renderMath(tex: string): string {
  try {
    return katex.renderToString(tex, {
      throwOnError: false,
      strict: false,
      displayMode: false,
      output: "html",
    });
  } catch {
    return tex.replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" })[c] ?? c);
  }
}

/**
 * Renders Arabic copy with inline math delimited by $...$.
 * Math is isolated left-to-right so numbers and symbols stay unambiguous in RTL.
 */
export function RichText({ children }: { children: string }) {
  const nodes = useMemo(() => {
    const chunks = children.split(/\$([^$]+)\$/g);
    return chunks.map((chunk, index) => {
      if (index % 2 === 1) {
        return (
          <span
            key={index}
            className="math"
            dir="ltr"
            dangerouslySetInnerHTML={{ __html: renderMath(chunk) }}
          />
        );
      }
      return <span key={index}>{chunk}</span>;
    });
  }, [children]);

  return <span className="rich">{nodes}</span>;
}

export function DisplayMath({ tex }: { tex: string }) {
  return (
    <div
      className="math math-display"
      dir="ltr"
      dangerouslySetInnerHTML={{ __html: renderMath(tex) }}
    />
  );
}
