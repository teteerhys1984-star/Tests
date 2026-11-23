import katex from "katex";
import { useMemo } from "react";
import { cn } from "@/utils/cn";

function renderTex(tex: string, displayMode: boolean) {
  try {
    return katex.renderToString(tex, {
      displayMode,
      throwOnError: true,
      strict: false,
      output: "htmlAndMathml",
      trust: false,
    });
  } catch {
    // Never leak raw TeX to the interface if a malformed expression slips in.
    return "";
  }
}

export function TeX({ tex, display = false, className }: { tex: string; display?: boolean; className?: string }) {
  const html = useMemo(() => renderTex(tex, display), [tex, display]);
  return (
    <span
      dir="ltr"
      className={cn(display ? "tex-display" : "math-inline", className)}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

/**
 * Renders Arabic prose mixed with TeX using $...$ delimiters.
 * Every math fragment is isolated LTR so neighbouring Arabic never reorders it.
 */
export function MathText({ text, className }: { text: string; className?: string }) {
  const nodes = useMemo(() => {
    const parts = text.split("$");
    return parts.map((part, index) =>
      index % 2 === 1 ? (
        <TeX key={index} tex={part} />
      ) : (
        <span key={index} className="whitespace-pre-wrap">
          {part}
        </span>
      )
    );
  }, [text]);

  return <span className={cn("math-text", className)}>{nodes}</span>;
}

export function Formula({ tex, label }: { tex: string; label?: string }) {
  return (
    <div className="formula-plate" dir="ltr">
      <TeX tex={tex} display className="block text-center" />
      {label ? <span className="formula-label" dir="rtl">{label}</span> : null}
    </div>
  );
}
