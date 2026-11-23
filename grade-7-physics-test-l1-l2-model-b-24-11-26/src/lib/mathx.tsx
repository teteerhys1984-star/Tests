/**
 * عرض الترميز الرياضي (KaTeX).
 *
 * التطابق مع المصدر (interactive-physics-Test-L1&2-model-B-24-11-26):
 *  · الإخراج HTML حصرياً (`output: "html"`) — لا محتوى MathML ثانٍ في DOM،
 *    فتظهر العلامات والوحدات مرّة واحدة لا مرتين.
 *  · قاعدة الأنماط من katex.min.css الممسوح في src/index.css — تُرسم HTML المرئي فقط.
 *  · `SvgMath` يحوّل MathText داخل `foreignObject` ليُسحب خارج SVG (نفس المصدر).
 */

import katex from "katex";
import type { RichText } from "../exam/types";

/** تحويل نص LaTeX إلى نصّ صرف للتقرير النصي (بلا محرّك عرض). */
export function texToPlain(tex: string): string {
  let out = tex;
  out = out.replace(/\\[dt]frac\{([^{}]*)\}\{([^{}]*)\}/g, "($1)/($2)");
  out = out.replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/g, "($1)/($2)");
  out = out.replace(/\\mathrm\{([^{}]*)\}/g, "$1");
  out = out.replace(/\\text\{([^{}]*)\}/g, "$1");
  out = out.replace(/\\times/g, " × ");
  out = out.replace(/\\Longrightarrow|\\Rightarrow/g, " ⇒ ");
  out = out.replace(/\\quad|\\qquad/g, " ");
  out = out.replace(/\\,|\\;|\\:/g, " ");
  out = out.replace(/\\left|\\right/g, "");
  out = out.replace(/\\cdot/g, " · ");
  out = out.replace(/_\{([^{}]*)\}/g, "_$1");
  out = out.replace(/\^\{([^{}]*)\}/g, "^$1");
  out = out.replace(/[{}]/g, "");
  return out.replace(/\s+/g, " ").trim();
}

/** نصّ قد يكون مختلطاً عربياً ورياضياً بعلامات $...$. */
export function texSpanPlain(source: string): string {
  const replaced = source
    .replace(/\$\$([^$]*)\$\$/g, (_match, tex: string) => ` ${texToPlain(tex)} `)
    .replace(/\$([^$]*)\$/g, (_match, tex: string) => texToPlain(tex));
  return replaced.replace(/\s+/g, " ").trim();
}

/** نصّ صرف من RichText — يُستعمل في التقرير والحمولة. */
export function richToPlain(content: RichText | string): string {
  if (typeof content === "string") return texSpanPlain(content);
  return content
    .map((part) => ("text" in part ? part.text : texToPlain(part.math)))
    .join("")
    .replace(/\s+/g, " ")
    .trim();
}

export function MathText({ tex, className = "" }: { tex: string; className?: string }) {
  return (
    <span
      className={`math-text ${className}`}
      dir="ltr"
      dangerouslySetInnerHTML={{
        __html: katex.renderToString(tex, { throwOnError: false, output: "html", strict: "ignore" }),
      }}
    />
  );
}

/** نصّ مختلط: يفصل مقاطع $...$ ويعرض كل مقطع بمحرّك KaTeX. */
export function Rich({ content }: { content: RichText }) {
  return (
    <>
      {content.map((part, index) =>
        "math" in part ? <MathText key={index} tex={part.math} /> : <span key={index}>{part.text}</span>,
      )}
    </>
  );
}

/** عرض رياضية داخل SVG: نص رياضي بنفس محرّك KaTeX عبر foreignObject (كما في المصدر). */
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
