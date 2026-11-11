import type { Fig } from "../data/exam";
import { toAr } from "../lib/text";
import { Pixel, type SpriteName } from "./Pixel";

const FONT = '"Segoe UI", Tahoma, "Noto Sans Arabic", Arial, sans-serif';

function VBar({ f }: { f: Extract<Fig, { t: "vbar" }> }) {
  const W = 600,
    H = 380;
  const L = 78,
    R = 18,
    T = 44,
    B = 62;
  const pw = W - L - R,
    ph = H - T - B;
  const n = f.cats.length;
  const slot = pw / n;
  const bw = slot * 0.5;
  const ticks = Array.from({ length: f.max / f.step + 1 }, (_, i) => i * f.step);
  const y = (v: number) => T + ph - (v / f.max) * ph;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[540px] max-w-[640px] bg-white border-4 border-[#2b2b2b]" role="img" aria-label={f.title} style={{ direction: "ltr" }}>
      <text x={W / 2} y={26} textAnchor="middle" fontSize={19} fontWeight={800} fontFamily={FONT} fill="#1f2933">
        {f.title}
      </text>
      {ticks.map((t) => (
        <g key={t}>
          <line x1={L} x2={W - R} y1={y(t)} y2={y(t)} stroke={t === 0 ? "#111" : "#b6c3d4"} strokeWidth={t === 0 ? 3 : 1} />
          <text x={L - 8} y={y(t) + 5} textAnchor="end" fontSize={13} fontWeight={700} fontFamily={FONT} fill="#222">
            {toAr(t)}
          </text>
        </g>
      ))}
      <line x1={L} x2={L} y1={T - 6} y2={T + ph} stroke="#111" strokeWidth={3} />
      <polygon points={`${L - 6},${T} ${L + 6},${T} ${L},${T - 12}`} fill="#111" />
      {f.cats.map((c, i) => {
        const x = L + slot * i + (slot - bw) / 2;
        const v = f.values[i];
        return (
          <g key={c}>
            <rect x={x} y={y(v)} width={bw} height={T + ph - y(v)} fill="#2fae5a" stroke="#14532d" strokeWidth={3} />
            <rect x={x + 4} y={y(v) + 4} width={bw - 8} height={6} fill="#7be39f" opacity={0.7} />
            <text x={x + bw / 2} y={T + ph + 22} textAnchor="middle" fontSize={15} fontWeight={800} fontFamily={FONT} fill="#222">
              {toAr(c)}
            </text>
          </g>
        );
      })}
      <text x={L + pw / 2} y={H - 10} textAnchor="middle" fontSize={15} fontWeight={800} fontFamily={FONT} fill="#b03a2e">
        {f.xLabel}
      </text>
      <text transform={`translate(18 ${T + ph / 2}) rotate(-90)`} textAnchor="middle" fontSize={15} fontWeight={800} fontFamily={FONT} fill="#b03a2e">
        {f.yLabel}
      </text>
    </svg>
  );
}

function HBar({ f }: { f: Extract<Fig, { t: "hbar" }> }) {
  const W = 600,
    H = 400;
  const L = 130,
    R = 24,
    T = 44,
    B = 62;
  const pw = W - L - R,
    ph = H - T - B;
  const n = f.cats.length;
  const slot = ph / n;
  const bh = slot * 0.56;
  const ticks = Array.from({ length: f.max / f.step + 1 }, (_, i) => i * f.step);
  const x = (v: number) => L + (v / f.max) * pw;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[540px] max-w-[640px] bg-white border-4 border-[#2b2b2b]" role="img" aria-label={f.title} style={{ direction: "ltr" }}>
      <text x={W / 2} y={26} textAnchor="middle" fontSize={19} fontWeight={800} fontFamily={FONT} fill="#1f2933">
        {f.title}
      </text>
      {ticks.map((t) => (
        <g key={t}>
          <line y1={T} y2={T + ph} x1={x(t)} x2={x(t)} stroke={t === 0 ? "#111" : "#b6c3d4"} strokeWidth={t === 0 ? 3 : 1} />
          <text x={x(t)} y={T + ph + 20} textAnchor="middle" fontSize={14} fontWeight={700} fontFamily={FONT} fill="#222">
            {toAr(t)}
          </text>
        </g>
      ))}
      <line x1={L} x2={W - R} y1={T + ph} y2={T + ph} stroke="#111" strokeWidth={3} />
      <polygon points={`${W - R},${T + ph - 6} ${W - R},${T + ph + 6} ${W - R + 12},${T + ph}`} fill="#111" />
      {f.cats.map((c, i) => {
        const yy = T + slot * i + (slot - bh) / 2;
        const v = f.values[i];
        return (
          <g key={c}>
            <rect x={L} y={yy} width={x(v) - L} height={bh} fill="#3a7bd5" stroke="#14336b" strokeWidth={3} />
            <rect x={L + 4} y={yy + 4} width={Math.max(0, x(v) - L - 8)} height={5} fill="#9cc3f5" opacity={0.7} />
            <text x={L - 10} y={yy + bh / 2 + 5} textAnchor="end" fontSize={15} fontWeight={800} fontFamily={FONT} fill="#222">
              {c}
            </text>
          </g>
        );
      })}
      <text x={L + pw / 2} y={H - 10} textAnchor="middle" fontSize={15} fontWeight={800} fontFamily={FONT} fill="#b03a2e">
        {f.xLabel}
      </text>
      <text transform={`translate(16 ${T + ph / 2}) rotate(-90)`} textAnchor="middle" fontSize={15} fontWeight={800} fontFamily={FONT} fill="#b03a2e">
        {f.yLabel}
      </text>
    </svg>
  );
}

function Grid({ f, plotValue, onPlot }: { f: Extract<Fig, { t: "grid" }>; plotValue?: string; onPlot?: (v: string) => void }) {
  const cs = f.maxX > 8 ? 44 : 56;
  const L = 52,
    R = 40,
    T = 34,
    B = 58;
  const gw = f.maxX * cs,
    gh = f.maxY * cs;
  const W = L + gw + R,
    H = T + gh + B;
  const X = (v: number) => L + v * cs;
  const Y = (v: number) => T + gh - v * cs;
  const sel = plotValue ? plotValue.split(",").map(Number) : null;
  const legend = f.items.filter((i) => i.icon);
  return (
    <div className="grid gap-2" style={{ maxWidth: Math.min(W, 640), minWidth: 470 }}>
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full bg-white border-4 border-[#2b2b2b]" style={{ direction: "ltr", minWidth: 470 }} role="img" aria-label="شبكة إحداثيات">
      {Array.from({ length: f.maxX + 1 }, (_, i) => (
        <line key={"v" + i} x1={X(i)} x2={X(i)} y1={T - 6} y2={Y(0)} stroke={i === 0 ? "#0e7c6b" : "#9db3d1"} strokeWidth={i === 0 ? 4 : 1.3} />
      ))}
      {Array.from({ length: f.maxY + 1 }, (_, j) => (
        <line key={"h" + j} y1={Y(j)} y2={Y(j)} x1={L} x2={X(f.maxX) + 8} stroke={j === 0 ? "#0e7c6b" : "#9db3d1"} strokeWidth={j === 0 ? 4 : 1.3} />
      ))}
      <polygon points={`${L - 6},${T} ${L + 6},${T} ${L},${T - 14}`} fill="#0e7c6b" />
      <polygon points={`${X(f.maxX) + 8},${Y(0) - 6} ${X(f.maxX) + 8},${Y(0) + 6} ${X(f.maxX) + 22},${Y(0)}`} fill="#0e7c6b" />
      {Array.from({ length: f.maxX + 1 }, (_, i) => (
        <text key={"xt" + i} x={X(i)} y={Y(0) + 22} textAnchor="middle" fontSize={15} fontWeight={800} fontFamily={FONT} fill="#222">
          {toAr(i)}
        </text>
      ))}
      {Array.from({ length: f.maxY + 1 }, (_, j) => (
        <text key={"yt" + j} x={L - 12} y={Y(j) + 5} textAnchor="end" fontSize={15} fontWeight={800} fontFamily={FONT} fill="#222">
          {toAr(j)}
        </text>
      ))}
      <text x={X(f.maxX) + 20} y={Y(0) + 44} textAnchor="end" fontSize={14} fontWeight={800} fontFamily={FONT} fill="#b03a2e">
        المحور الأفقي
      </text>
      <text x={L - 8} y={T - 18} textAnchor="start" fontSize={14} fontWeight={800} fontFamily={FONT} fill="#b03a2e">
        المحور الشاقولي
      </text>
      {f.items.map((it, i) => (
        <g key={i}>
          {it.icon ? (
            <>
              <Pixel name={it.icon as SpriteName} size={cs * 0.78} x={X(it.x) - cs * 0.39} y={Y(it.y) - cs * 0.39} />
              <circle cx={X(it.x)} cy={Y(it.y)} r={3} fill="#e02020" stroke="#fff" strokeWidth={1} />
            </>
          ) : (
            <>
              <circle cx={X(it.x)} cy={Y(it.y)} r={7} fill="#e02020" stroke="#7a0f0f" strokeWidth={2} />
              <text x={X(it.x) + 10} y={Y(it.y) - 9} fontSize={18} fontWeight={800} fontFamily={FONT} fill="#111">
                {it.label}
              </text>
            </>
          )}
        </g>
      ))}
      {f.plot && onPlot && (
        <>
          {Array.from({ length: f.maxX + 1 }, (_, i) =>
            Array.from({ length: f.maxY + 1 }, (_, j) => (
              <circle key={`${i}-${j}`} className="grid-hit" cx={X(i)} cy={Y(j)} r={cs * 0.36} onClick={() => onPlot(`${i},${j}`)} />
            ))
          )}
          {sel && (
            <g pointerEvents="none">
              <circle cx={X(sel[0])} cy={Y(sel[1])} r={11} fill="none" stroke="#1d4ea0" strokeWidth={3} />
              <circle cx={X(sel[0])} cy={Y(sel[1])} r={6} fill="#2b6fd6" stroke="#0c2147" strokeWidth={2} />
            </g>
          )}
        </>
      )}
    </svg>
    {legend.length > 0 && (
      <div className="flex flex-wrap gap-x-4 gap-y-1 bg-white/80 border-2 border-slate-500 px-2 py-1 text-sm font-bold">
        {legend.map((i, k) => (
          <span key={k} className="inline-flex items-center gap-1">
            <Pixel name={i.icon as SpriteName} size={22} /> {i.name}
          </span>
        ))}
      </div>
    )}
    </div>
  );
}

function Shapes({ f }: { f: Extract<Fig, { t: "shapes" }> }) {
  const cell = 100;
  const n = f.sides.length + 1;
  const W = cell * n + 10,
    H = 120;
  const poly = (cx: number, cy: number, s: number, r: number) => {
    const pts: string[] = [];
    for (let k = 0; k < s; k++) {
      const a = -Math.PI / 2 + (2 * Math.PI * k) / s;
      pts.push(`${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`);
    }
    return pts.join(" ");
  };
  const cx = (i: number) => W - 5 - cell / 2 - i * cell; // first shape at the right (RTL reading)
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-[560px] bg-white border-4 border-[#2b2b2b]" role="img" aria-label="نمط أشكال" style={{ direction: "ltr" }}>
      {f.sides.map((s, i) => (
        <polygon key={i} points={poly(cx(i), 60, s, 38)} fill="#2f6fd0" stroke="#14336b" strokeWidth={3} strokeLinejoin="round" />
      ))}
      <rect x={cx(f.sides.length) - 36} y={24} width={72} height={72} fill="#fff8d6" stroke="#555" strokeWidth={3} strokeDasharray="7 5" />
      <text x={cx(f.sides.length)} y={74} textAnchor="middle" fontSize={44} fontWeight={800} fontFamily={FONT} fill="#b03a2e">
        ؟
      </text>
    </svg>
  );
}

function TableFig({ f }: { f: Extract<Fig, { t: "table" }> }) {
  return (
    <table className="pt-table text-lg">
      <thead>
        <tr>
          {f.head.map((h, i) => (
            <th key={i}>{toAr(h)}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {f.rows.map((r, i) => (
          <tr key={i}>
            {r.map((c, j) => (
              <td key={j}>{toAr(c)}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Cards({ f }: { f: Extract<Fig, { t: "cards" }> }) {
  return (
    <div className="flex gap-3 flex-wrap" style={{ direction: "ltr" }}>
      {f.vals.map((v, i) => (
        <div
          key={i}
          className="w-14 h-[4.6rem] grid place-items-center text-4xl font-extrabold bg-[#fffdf0] border-4 border-[#5a4a1a]"
          style={{ boxShadow: "inset -4px -4px 0 #d9ccaa, 3px 3px 0 rgba(0,0,0,.25)" }}
        >
          {toAr(v)}
        </div>
      ))}
    </div>
  );
}

function VAdd({ f }: { f: Extract<Fig, { t: "vadd" }> }) {
  const len = Math.max(f.a.length, f.b.length, f.sum?.length ?? 0);
  const pad = (s: string) => s.padStart(len, " ").split("");
  const cell = (c: string, k: number) =>
    c === "?" ? (
      <span className="miss">؟</span>
    ) : (
      <span key={k}>{c === " " ? "" : toAr(c)}</span>
    );
  return (
    <table className="vadd">
      <tbody>
        <tr>
          <td></td>
          {pad(f.a).map((c, i) => (
            <td key={i}>{cell(c, i)}</td>
          ))}
        </tr>
        <tr>
          <td>+</td>
          {pad(f.b).map((c, i) => (
            <td key={i}>{cell(c, i)}</td>
          ))}
        </tr>
        <tr className="line">
          <td></td>
          {f.sum
            ? pad(f.sum).map((c, i) => <td key={i}>{cell(c, i)}</td>)
            : Array.from({ length: len }, (_, i) => <td key={i}>&nbsp;</td>)}
        </tr>
      </tbody>
    </table>
  );
}

export function Figure({ fig, plotValue, onPlot }: { fig: Fig; plotValue?: string; onPlot?: (v: string) => void }) {
  switch (fig.t) {
    case "vbar":
      return <VBar f={fig} />;
    case "hbar":
      return <HBar f={fig} />;
    case "grid":
      return <Grid f={fig} plotValue={plotValue} onPlot={onPlot} />;
    case "shapes":
      return <Shapes f={fig} />;
    case "table":
      return <TableFig f={fig} />;
    case "cards":
      return <Cards f={fig} />;
    case "vadd":
      return <VAdd f={fig} />;
  }
}
