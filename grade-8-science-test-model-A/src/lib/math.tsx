import katex from "katex";

const KATEX_OPTS: katex.KatexOptions = {
  throwOnError: false,
  strict: "ignore",
  output: "html",
  trust: true,
};

/**
 * دالة ذكية لتحويل الاختصارات إلى LaTeX حقيقي.
 */
export function toTex(raw: string): string {
  let s = raw.trim();

  // Isotope handling first
  const isoMatch = s.match(/^([⁰¹²³⁴⁵⁶⁷⁸⁹]+)?([₀₁₂₃₄₅₆₇₈₉]+)([A-Za-z]+)([⁺⁻²³+-]*)$/);
  if (isoMatch) {
    const supMap: Record<string, string> = { "⁰": "0", "¹": "1", "²": "2", "³": "3", "⁴": "4", "⁵": "5", "⁶": "6", "⁷": "7", "⁸": "8", "⁹": "9" };
    const subMap: Record<string, string> = { "₀": "0", "₁": "1", "₂": "2", "₃": "3", "₄": "4", "₅": "5", "₆": "6", "₇": "7", "₈": "8", "₉": "9" };
    const A = (isoMatch[1] ?? "").split("").map((c) => supMap[c] ?? c).join("");
    const Z = (isoMatch[2] ?? "").split("").map((c) => subMap[c] ?? c).join("");
    const el = isoMatch[3];
    const chRaw = isoMatch[4] ?? "";
    const ch = chRaw.replace(/²/g, "2").replace(/³/g, "3").replace(/⁺/g, "+").replace(/⁻/g, "-");
    return `{}^{${A}}_{${Z}}\\mathrm{${el}}${ch ? `^{${ch}}` : ""}`;
  }

  // First: normalize common JS-escaped accidents before semantic transforms.
  // Example: "\text" with a single slash inside a JS string becomes TAB + "ext".
  s = s
    .replace(/\text\{/g, "\\text{")
    .replace(/(?<!\\)mathrm\{/g, "\\mathrm{")
    .replace(/\^\{circ\}/g, "^{\\circ}")
    .replace(/\(Delta\)/g, "(\\Delta)")
    .replace(/(?<!\\)text\{/g, "\\text{")
    .replace(/(?<!\\)Delta\b/g, "\\Delta")
    .replace(/(?<!\\)theta\b/g, "\\theta")
    .replace(/(?<!\\)alpha\b/g, "\\alpha")
    .replace(/(?<!\\)approx\b/g, "\\approx");

  return s
    .replace(/F₁/g, "F_1")
    .replace(/F₂/g, "F_2")
    .replace(/F₃/g, "F_3")
    .replace(/F′/g, "F'")
    .replace(/d₁/g, "d_1")
    .replace(/d₂/g, "d_2")
    .replace(/AB/g, "\\mathrm{AB}")
    .replace(/Ox/g, "\\mathrm{Ox}")
    .replace(/Oy/g, "\\mathrm{Oy}")
    .replace(/α/g, "\\alpha")
    .replace(/θ/g, "\\theta")
    .replace(/(\d+)~N/g, "$1~\\mathrm{N}")
    .replace(/(\d+)~m/g, "$1~\\mathrm{m}")
    .replace(/°/g, "^{\\circ}");
}

export function vectorTex(symbol: string, subscript?: string): string {
  const base = symbol.length > 1 ? `\\vec{\\mathrm{${symbol}}}` : `\\vec{${symbol}}`;
  return subscript ? `${base}_{${subscript}}` : base;
}

export function renderTexToString(tex: string, displayMode = false): string {
  return katex.renderToString(toTex(tex), { ...KATEX_OPTS, displayMode });
}

export function Katex({ tex, display = false, className = "" }: { tex: string; display?: boolean; className?: string }) {
  const html = renderTexToString(tex, display);
  return (
    <span
      dir="ltr"
      className={`${display ? "katex-block my-2 block text-center" : "katex-inline inline-block"} px-0.5 ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export function SvgKatex({
  x,
  y,
  tex,
  width = 160,
  height = 42,
  color = "#0B1B3A",
  bg,
  borderColor,
  fontSize = 16,
  align = "center"
}: {
  x: number;
  y: number;
  tex: string;
  width?: number;
  height?: number;
  color?: string;
  bg?: string;
  borderColor?: string;
  fontSize?: number;
  align?: "center" | "left" | "right";
}) {
  const html = renderTexToString(tex, false);
  const fx = align === "center" ? x - width / 2 : align === "right" ? x - width : x;
  const fy = y - height / 2;
  const justify = align === "center" ? "justify-center" : align === "right" ? "justify-end" : "justify-start";

  return (
    <foreignObject x={fx} y={fy} width={width} height={height} className="overflow-visible pointer-events-none">
      <div
        dir="ltr"
        className={`flex h-full w-full items-center ${justify} select-none`}
        style={{ color, fontSize: `${fontSize}px` }}
      >
        <span
          className="inline-flex items-center whitespace-nowrap rounded-md shadow-xs"
          style={{ 
            backgroundColor: bg ?? "transparent", 
            padding: bg ? "2px 6px" : "0",
            border: borderColor ? `1.5px solid ${borderColor}` : undefined
          }}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </foreignObject>
  );
}

export function formatPointsBadge(pts: number): string {
  if (pts === 0.5) return "نصف علامة";
  if (pts === 1) return "علامة واحدة";
  if (pts === 1.5) return "علامة ونصف";
  if (pts === 2) return "علامتان";
  if (pts >= 3 && pts <= 10 && Number.isInteger(pts)) return `${pts} علامات`;
  return `${pts} علامة`;
}
