import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import * as F from "../components/figures";

const FIGURES = Object.entries(F).filter(
  ([n, v]) => n.startsWith("Fig") && n !== "FigureLegend" && typeof v === "function",
) as [string, () => React.ReactElement][];

describe("سلامة الأشكال الهندسية", () => {
  it("يعرض كلّ الأشكال بلا أخطاء", () => {
    expect(FIGURES.length).toBeGreaterThanOrEqual(12);
    for (const [name, Comp] of FIGURES) {
      const html = renderToStaticMarkup(<Comp />);
      expect(html, name).toContain("<svg");
      expect(html, name).toContain("<title>");
      expect(html, name).toContain("<desc>");
      expect(html, name).not.toContain("NaN");
    }
  });

  it("كلّ التسميات والنقاط داخل إطار الرسم (لا اقتصاص على أيّ مقاس شاشة)", () => {
    for (const [name, Comp] of FIGURES) {
      const html = renderToStaticMarkup(<Comp />);
      const vb = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(html);
      expect(vb, name).toBeTruthy();
      const W = Number(vb![1]);
      const H = Number(vb![2]);
      const nums = [...html.matchAll(/<(text|circle|polygon|polyline)\b[^>]*>/g)];
      for (const m of nums) {
        const tag = m[0];
        const xs = [...tag.matchAll(/\b(?:x|cx)="(-?[\d.]+)"/g)].map((g) => Number(g[1]));
        const ys = [...tag.matchAll(/\b(?:y|cy)="(-?[\d.]+)"/g)].map((g) => Number(g[1]));
        for (const x of xs) expect(x, `${name}: ${tag}`).toBeLessThanOrEqual(W + 2);
        for (const x of xs) expect(x, `${name}: ${tag}`).toBeGreaterThanOrEqual(-2);
        for (const y of ys) expect(y, `${name}: ${tag}`).toBeLessThanOrEqual(H + 2);
        for (const y of ys) expect(y, `${name}: ${tag}`).toBeGreaterThanOrEqual(-2);
        const pts = /\bpoints="([^"]+)"/.exec(tag);
        if (pts) {
          for (const pair of pts[1].trim().split(/\s+/)) {
            const [px, py] = pair.split(",").map(Number);
            expect(px, `${name}: ${pair}`).toBeGreaterThanOrEqual(-2);
            expect(px, `${name}: ${pair}`).toBeLessThanOrEqual(W + 2);
            expect(py, `${name}: ${pair}`).toBeGreaterThanOrEqual(-2);
            expect(py, `${name}: ${pair}`).toBeLessThanOrEqual(H + 2);
          }
        }
      }
    }
  });

  it("لا يظهر أيّ دولار أو أمر LaTeX داخل الأشكال", () => {
    for (const [name, Comp] of FIGURES) {
      const html = renderToStaticMarkup(<Comp />);
      expect(html, name).not.toContain("$");
      expect(html, name).not.toMatch(/\\[a-zA-Z]{2,}/);
    }
  });
});
