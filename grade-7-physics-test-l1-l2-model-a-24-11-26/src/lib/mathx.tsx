/**
 * عرض الترميز الرياضي: النص العربي يبقى RTL، وكل مقطع محصور بين $...$ يُعرض
 * بـ KaTeX داخل حاوية LTR معزولة (unicode-bidi: isolate).
 */

import { memo } from "react";
import katex from "katex";

/** تحويل LaTeX إلى نصّ صرف للتقرير النصي (بلا محرّك عرض). */
export function texToPlain(tex: string): string {
  let out = tex;
  out = out.replace(/\\[dt]frac\{([^{}]*)\}\{([^{}]*)\}/g, "($1)/($2)");
  out = out.replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/g, "($1)/($2)");
  out = out.replace(/\\mathrm\{([^{}]*)\}/g, "$1");
  out = out.replace(/\\text\{([^{}]*)\}/g, "$1");
  out = out.replace(/\\times/g, " × ");
  out = out.replace(/\\cdot/g, " · ");
  out = out.replace(/\\leftrightarrow/g, " ↔ ");
  out = out.replace(/\\approx/g, " ≈ ");
  out = out.replace(/\\Longrightarrow|\\Rightarrow/g, " ⇒ ");
  out = out.replace(/\\quad|\\qquad/g, " ");
  out = out.replace(/\\,|\\;|\\:|\\!/g, " ");
  out = out.replace(/\\left|\\right/g, "");
  out = out.replace(/_\{([^{}]*)\}/g, "_$1");
  out = out.replace(/\^\{([^{}]*)\}/g, "^$1");
  out = out.replace(/[{}]/g, "");
  return out.replace(/\s+/g, " ").trim();
}

/** نصّ صرف من نصّ مختلط قد يحوي مقاطع $...$. */
export function richToPlain(source: string): string {
  const replaced = source
    .replace(/\$\$([^$]*)\$\$/g, (_match, tex: string) => ` ${texToPlain(tex)} `)
    .replace(/\$([^$]*)\$/g, (_match, tex: string) => texToPlain(tex));
  return replaced.replace(/\s+/g, " ").trim();
}

function render(tex: string): string {
  try {
    return katex.renderToString(tex, {
      throwOnError: false,
      errorColor: "#a52a2a",
      strict: "ignore",
      trust: false,
      output: "htmlAndMathml",
      displayMode: false,
    });
  } catch {
    return tex.replace(/[<>&]/g, (char) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[char] ?? char));
  }
}

export const MathText = memo(function MathText({ tex, className = "" }: { tex: string; className?: string }) {
  return (
    <span
      className={`mtx ${className}`}
      dir="ltr"
      // KaTeX يُنتج HTML موثوقاً من نصّ LaTeX ثابت في ملفات المحتوى (لا إدخال من المستخدم)
      dangerouslySetInnerHTML={{ __html: render(tex) }}
    />
  );
});

/** نصّ عربي مختلط: يفصل مقاطع $...$ ويعرض كل مقطع بمحرّك KaTeX. */
export const MixedText = memo(function MixedText({
  text,
  as: Tag = "span",
  className,
}: {
  text: string;
  as?: "span" | "p" | "div";
  className?: string;
}) {
  const segments: { math: boolean; value: string }[] = [];
  let buffer = "";
  let index = 0;
  while (index < text.length) {
    if (text[index] === "$") {
      const end = text.indexOf("$", index + 1);
      if (end !== -1) {
        if (buffer) {
          segments.push({ math: false, value: buffer });
          buffer = "";
        }
        segments.push({ math: true, value: text.slice(index + 1, end) });
        index = end + 1;
        continue;
      }
    }
    buffer += text[index];
    index += 1;
  }
  if (buffer) segments.push({ math: false, value: buffer });

  return (
    <Tag className={className}>
      {segments.map((segment, segmentIndex) =>
        segment.math ? (
          <MathText key={segmentIndex} tex={segment.value} />
        ) : (
          <span key={segmentIndex}>{segment.value}</span>
        ),
      )}
    </Tag>
  );
});
