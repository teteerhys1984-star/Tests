import katex from "katex";
import "katex/dist/katex.min.css";

interface MathTextProps {
  text: string;
  className?: string;
}

function renderMath(tex: string, key: number) {
  let html = "";
  try {
    html = katex.renderToString(tex, {
      throwOnError: false,
      displayMode: false,
      strict: false,
      output: "html",
      errorColor: "#8f3f59",
    });
  } catch {
    html = `<span class="math-fallback">${tex}</span>`;
  }
  return (
    <span
      key={key}
      className="math-inline"
      dir="ltr"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export function MathText({ text, className = "" }: MathTextProps) {
  const segments = text.split(/(\$[^$]*\$)/g).filter((part) => part !== "");
  return (
    <span className={className}>
      {segments.map((segment, index) => {
        if (segment.startsWith("$") && segment.endsWith("$") && segment.length > 1) {
          return renderMath(segment.slice(1, -1), index);
        }
        return <span key={index}>{segment}</span>;
      })}
    </span>
  );
}

export default MathText;
