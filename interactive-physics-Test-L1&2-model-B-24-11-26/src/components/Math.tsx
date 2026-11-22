import katex from "katex";
import type { RichText } from "../data/questions";

export function MathText({ tex, className = "" }: { tex: string; className?: string }) {
  return (
    <span
      className={`math-text ${className}`}
      dir="ltr"
      dangerouslySetInnerHTML={{ __html: katex.renderToString(tex, { throwOnError: false, output: "html", strict: "ignore" }) }}
    />
  );
}

export function Rich({ content }: { content: RichText }) {
  return <>{content.map((part, index) => "math" in part ? <MathText key={index} tex={part.math} /> : <span key={index}>{part.text}</span>)}</>;
}

export function SvgMath({
  tex, x, y, width, height, size = 18, color = "#523e65", align = "center",
}: {
  tex: string; x: number; y: number; width: number; height: number; size?: number; color?: string;
  align?: "start" | "center" | "end";
}) {
  return (
    <foreignObject x={x} y={y} width={width} height={height}>
      <div
        className="svg-math"
        style={{ color, fontSize: size, justifyContent: align === "start" ? "flex-start" : align === "end" ? "flex-end" : "center" }}
      >
        <MathText tex={tex} />
      </div>
    </foreignObject>
  );
}