import {
  createContext,
  useContext,
  useId,
  type ReactNode,
} from "react";

/* ═══════════════════════════════════════════════════════════════════════════
   A small, exact vector engine for geometry figures.

   • Mathematical coordinates (y grows upwards) are mapped to SVG space once,
     so every figure is drawn from real coordinates — never eyeballed.
   • Marks (equal-length ticks, parallel chevrons, right angles, angle arcs)
     are computed from the actual points, so they can never sit on the wrong
     side or the wrong vertex.
   ═══════════════════════════════════════════════════════════════════════════ */

export type Pt = { x: number; y: number };
export const P = (x: number, y: number): Pt => ({ x, y });

export const C = {
  original: "#38bdf8",
  originalSoft: "rgba(56,189,248,0.16)",
  image: "#c084fc",
  imageSoft: "rgba(192,132,252,0.16)",
  helper: "#2dd4bf",
  accent: "#fbbf24",
  danger: "#fb7185",
  label: "#e2ecff",
  muted: "#8fa6cc",
  gridLine: "rgba(125,211,252,0.13)",
  gridLineMajor: "rgba(125,211,252,0.26)",
  axis: "rgba(148,180,232,0.75)",
};

type Ctx = {
  X: (x: number) => number;
  Y: (y: number) => number;
  u: number;
  view: View;
};

type View = { minX: number; minY: number; maxX: number; maxY: number };

const FigCtx = createContext<Ctx | null>(null);

function useFig(): Ctx {
  const c = useContext(FigCtx);
  if (!c) throw new Error("Geometry primitives must be used inside <Figure>");
  return c;
}

export interface FigureProps {
  view: View;
  /** Pixels per mathematical unit inside the viewBox. */
  unit?: number;
  children: ReactNode;
  title: string;
  desc: string;
  className?: string;
  pad?: number;
}

export function Figure({
  view,
  unit = 46,
  children,
  title,
  desc,
  className = "",
  pad = 14,
}: FigureProps) {
  const uid = useId().replace(/:/g, "");
  const w = (view.maxX - view.minX) * unit;
  const h = (view.maxY - view.minY) * unit;
  const ctx: Ctx = {
    u: unit,
    view,
    X: (x) => (x - view.minX) * unit + pad,
    Y: (y) => (view.maxY - y) * unit + pad,
  };
  return (
    <FigCtx.Provider value={ctx}>
      <svg
        role="img"
        aria-label={`${title}. ${desc}`}
        viewBox={`0 0 ${w + pad * 2} ${h + pad * 2}`}
        preserveAspectRatio="xMidYMid meet"
        className={`block h-auto w-full max-w-full ${className}`}
        style={{ touchAction: "manipulation" }}
      >
        <title>{title}</title>
        <desc>{desc}</desc>
        <defs>
          <linearGradient id={`bg-${uid}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#0b1428" />
            <stop offset="55%" stopColor="#0a1122" />
            <stop offset="100%" stopColor="#0d1730" />
          </linearGradient>
          <marker
            id={`arw-${uid}`}
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M0,1 L10,5 L0,9 z" fill={C.helper} />
          </marker>
        </defs>
        <rect
          x="0"
          y="0"
          width={w + pad * 2}
          height={h + pad * 2}
          rx="14"
          fill={`url(#bg-${uid})`}
          stroke="rgba(125,211,252,0.18)"
        />
        {children}
      </svg>
    </FigCtx.Provider>
  );
}

/* ── grid + axes ─────────────────────────────────────────────────────── */

export function Lattice({
  step = 1,
  labelAxes = false,
}: {
  step?: number;
  labelAxes?: boolean;
}) {
  const { X, Y, view } = useFig();
  const xs: number[] = [];
  const ys: number[] = [];
  for (let x = Math.ceil(view.minX); x <= view.maxX; x += step) xs.push(x);
  for (let y = Math.ceil(view.minY); y <= view.maxY; y += step) ys.push(y);
  return (
    <g>
      {xs.map((x) => (
        <line
          key={`vx${x}`}
          x1={X(x)}
          y1={Y(view.minY)}
          x2={X(x)}
          y2={Y(view.maxY)}
          stroke={x === 0 && labelAxes ? C.axis : C.gridLine}
          strokeWidth={x === 0 && labelAxes ? 1.6 : 1}
        />
      ))}
      {ys.map((y) => (
        <line
          key={`hy${y}`}
          x1={X(view.minX)}
          y1={Y(y)}
          x2={X(view.maxX)}
          y2={Y(y)}
          stroke={y === 0 && labelAxes ? C.axis : C.gridLine}
          strokeWidth={y === 0 && labelAxes ? 1.6 : 1}
        />
      ))}
    </g>
  );
}

export function Axes({ xLabel = "x", yLabel = "y" }: { xLabel?: string; yLabel?: string }) {
  const { X, Y, view } = useFig();
  const xs: number[] = [];
  const ys: number[] = [];
  for (let x = Math.ceil(view.minX); x <= view.maxX; x += 1) xs.push(x);
  for (let y = Math.ceil(view.minY); y <= view.maxY; y += 1) ys.push(y);
  return (
    <g>
      {xs
        .filter((x) => x !== 0)
        .map((x) => (
          <text
            key={`tx${x}`}
            x={X(x)}
            y={Y(0) + 15}
            fill={C.muted}
            fontSize="11"
            textAnchor="middle"
            fontFamily="ui-sans-serif, system-ui"
          >
            {x}
          </text>
        ))}
      {ys
        .filter((y) => y !== 0)
        .map((y) => (
          <text
            key={`ty${y}`}
            x={X(0) - 9}
            y={Y(y) + 4}
            fill={C.muted}
            fontSize="11"
            textAnchor="end"
            fontFamily="ui-sans-serif, system-ui"
          >
            {y}
          </text>
        ))}
      <text
        x={X(view.maxX) - 4}
        y={Y(0) - 9}
        fill={C.axis}
        fontSize="13"
        textAnchor="end"
        fontStyle="italic"
        fontFamily="'KaTeX_Math', Georgia, serif"
      >
        {xLabel}
      </text>
      <text
        x={X(0) + 10}
        y={Y(view.maxY) + 12}
        fill={C.axis}
        fontSize="13"
        fontStyle="italic"
        fontFamily="'KaTeX_Math', Georgia, serif"
      >
        {yLabel}
      </text>
    </g>
  );
}

/* ── primitives ──────────────────────────────────────────────────────── */

export function Seg({
  a,
  b,
  color = C.original,
  width = 2.4,
  dash,
  opacity = 1,
}: {
  a: Pt;
  b: Pt;
  color?: string;
  width?: number;
  dash?: string;
  opacity?: number;
}) {
  const { X, Y } = useFig();
  return (
    <line
      x1={X(a.x)}
      y1={Y(a.y)}
      x2={X(b.x)}
      y2={Y(b.y)}
      stroke={color}
      strokeWidth={width}
      strokeDasharray={dash}
      strokeLinecap="round"
      opacity={opacity}
    />
  );
}

/** Full straight line through a and b, clipped to the figure window. */
export function FullLine({
  a,
  b,
  color = C.original,
  width = 2.2,
  dash,
}: {
  a: Pt;
  b: Pt;
  color?: string;
  width?: number;
  dash?: string;
}) {
  const { X, Y, view } = useFig();
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const big = (view.maxX - view.minX + view.maxY - view.minY) * 2;
  const p1 = { x: a.x - (dx / len) * big, y: a.y - (dy / len) * big };
  const p2 = { x: a.x + (dx / len) * big, y: a.y + (dy / len) * big };
  const clipId = useId().replace(/:/g, "");
  return (
    <g>
      <clipPath id={`clip-${clipId}`}>
        <rect
          x={X(view.minX)}
          y={Y(view.maxY)}
          width={(view.maxX - view.minX) * (X(view.minX + 1) - X(view.minX))}
          height={(view.maxY - view.minY) * (Y(view.minY - 1) - Y(view.minY))}
        />
      </clipPath>
      <line
        clipPath={`url(#clip-${clipId})`}
        x1={X(p1.x)}
        y1={Y(p1.y)}
        x2={X(p2.x)}
        y2={Y(p2.y)}
        stroke={color}
        strokeWidth={width}
        strokeDasharray={dash}
        strokeLinecap="round"
      />
    </g>
  );
}

export function Ray({
  from,
  through,
  color = C.original,
  width = 2.4,
}: {
  from: Pt;
  through: Pt;
  color?: string;
  width?: number;
}) {
  const { X, Y, view } = useFig();
  const dx = through.x - from.x;
  const dy = through.y - from.y;
  const len = Math.hypot(dx, dy) || 1;
  const big = (view.maxX - view.minX + view.maxY - view.minY) * 2;
  const end = { x: from.x + (dx / len) * big, y: from.y + (dy / len) * big };
  const clipId = useId().replace(/:/g, "");
  return (
    <g>
      <clipPath id={`clip-${clipId}`}>
        <rect
          x={X(view.minX)}
          y={Y(view.maxY)}
          width={(view.maxX - view.minX) * (X(view.minX + 1) - X(view.minX))}
          height={(view.maxY - view.minY) * (Y(view.minY - 1) - Y(view.minY))}
        />
      </clipPath>
      <line
        clipPath={`url(#clip-${clipId})`}
        x1={X(from.x)}
        y1={Y(from.y)}
        x2={X(end.x)}
        y2={Y(end.y)}
        stroke={color}
        strokeWidth={width}
        strokeLinecap="round"
      />
    </g>
  );
}

export function Poly({
  pts,
  color = C.original,
  fill = "none",
  width = 2.4,
  dash,
}: {
  pts: Pt[];
  color?: string;
  fill?: string;
  width?: number;
  dash?: string;
}) {
  const { X, Y } = useFig();
  return (
    <polygon
      points={pts.map((p) => `${X(p.x)},${Y(p.y)}`).join(" ")}
      stroke={color}
      strokeWidth={width}
      fill={fill}
      strokeDasharray={dash}
      strokeLinejoin="round"
    />
  );
}

export function Circ({
  center,
  r,
  color = C.original,
  fill = "none",
  width = 2.4,
  dash,
}: {
  center: Pt;
  r: number;
  color?: string;
  fill?: string;
  width?: number;
  dash?: string;
}) {
  const { X, Y, u } = useFig();
  return (
    <circle
      cx={X(center.x)}
      cy={Y(center.y)}
      r={r * u}
      stroke={color}
      strokeWidth={width}
      fill={fill}
      strokeDasharray={dash}
    />
  );
}

export function Arc({
  center,
  r,
  from,
  to,
  color = C.helper,
  width = 1.6,
  dash,
}: {
  center: Pt;
  r: number;
  from: number;
  to: number;
  color?: string;
  width?: number;
  dash?: string;
}) {
  const { X, Y, u } = useFig();
  const a1 = (from * Math.PI) / 180;
  const a2 = (to * Math.PI) / 180;
  const x1 = center.x + r * Math.cos(a1);
  const y1 = center.y + r * Math.sin(a1);
  const x2 = center.x + r * Math.cos(a2);
  const y2 = center.y + r * Math.sin(a2);
  let delta = to - from;
  while (delta < 0) delta += 360;
  const large = delta > 180 ? 1 : 0;
  return (
    <path
      d={`M ${X(x1)} ${Y(y1)} A ${r * u} ${r * u} 0 ${large} 0 ${X(x2)} ${Y(y2)}`}
      stroke={color}
      strokeWidth={width}
      fill="none"
      strokeDasharray={dash}
      strokeLinecap="round"
    />
  );
}

/** Point + label in one call — the most common pairing in these figures. */
export function Node({
  p,
  text,
  color = C.original,
  dx = 10,
  dy = -11,
  anchor = "start",
  size = 19,
  hollow = false,
  dot = true,
}: {
  p: Pt;
  text: string;
  color?: string;
  dx?: number;
  dy?: number;
  anchor?: "start" | "middle" | "end";
  size?: number;
  hollow?: boolean;
  dot?: boolean;
}) {
  return (
    <g>
      {dot && <Dot p={p} color={color} hollow={hollow} />}
      <Lbl p={p} text={text} color={color === C.original ? C.label : color} dx={dx} dy={dy} anchor={anchor} size={size} />
    </g>
  );
}

export function Dot({
  p,
  color = C.original,
  r = 4.2,
  hollow = false,
}: {
  p: Pt;
  color?: string;
  r?: number;
  hollow?: boolean;
}) {
  const { X, Y } = useFig();
  return (
    <circle
      cx={X(p.x)}
      cy={Y(p.y)}
      r={r}
      fill={hollow ? "#0b1428" : color}
      stroke={color}
      strokeWidth={hollow ? 2.2 : 1.2}
    />
  );
}

export function Lbl({
  p,
  text,
  dx = 10,
  dy = -10,
  color = C.label,
  size = 16,
  anchor = "start",
  weight = 600,
}: {
  p: Pt;
  text: string;
  dx?: number;
  dy?: number;
  color?: string;
  size?: number;
  anchor?: "start" | "middle" | "end";
  weight?: number;
}) {
  const { X, Y } = useFig();
  return (
    <text
      x={X(p.x) + dx}
      y={Y(p.y) + dy}
      fill={color}
      fontSize={size}
      fontWeight={weight}
      textAnchor={anchor}
      fontFamily="'KaTeX_Math', 'Cambria Math', Georgia, serif"
      fontStyle="italic"
      stroke="#050a16"
      strokeWidth="3.2"
      paintOrder="stroke"
      style={{ letterSpacing: "0.02em" }}
    >
      {text}
    </text>
  );
}

export function Note({
  p,
  text,
  dx = 0,
  dy = 0,
  color = C.muted,
  size = 12,
  anchor = "start",
}: {
  p: Pt;
  text: string;
  dx?: number;
  dy?: number;
  color?: string;
  size?: number;
  anchor?: "start" | "middle" | "end";
}) {
  const { X, Y } = useFig();
  return (
    <text
      x={X(p.x) + dx}
      y={Y(p.y) + dy}
      fill={color}
      fontSize={size}
      textAnchor={anchor}
      fontFamily="'IBM Plex Sans Arabic', ui-sans-serif, system-ui"
      stroke="#050a16"
      strokeWidth="3"
      paintOrder="stroke"
    >
      {text}
    </text>
  );
}

/* ── marks (computed from the real geometry) ─────────────────────────── */

/** Equal-length hash marks, perpendicular to the segment, at its midpoint. */
export function Ticks({
  a,
  b,
  count = 1,
  color = C.accent,
  at = 0.5,
}: {
  a: Pt;
  b: Pt;
  count?: number;
  color?: string;
  at?: number;
}) {
  const { X, Y, u } = useFig();
  const mx = a.x + (b.x - a.x) * at;
  const my = a.y + (b.y - a.y) * at;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const half = 6 / u;
  const gap = 4.5 / u;
  const marks = [];
  for (let i = 0; i < count; i++) {
    const off = (i - (count - 1) / 2) * gap;
    const cx = mx + (dx / len) * off;
    const cy = my + (dy / len) * off;
    marks.push(
      <line
        key={i}
        x1={X(cx - nx * half)}
        y1={Y(cy - ny * half)}
        x2={X(cx + nx * half)}
        y2={Y(cy + ny * half)}
        stroke={color}
        strokeWidth={2.1}
        strokeLinecap="round"
      />,
    );
  }
  return <g>{marks}</g>;
}

/** Parallel chevrons drawn along the segment direction. */
export function ParallelMark({
  a,
  b,
  count = 1,
  color = C.helper,
  at = 0.5,
}: {
  a: Pt;
  b: Pt;
  count?: number;
  color?: string;
  at?: number;
}) {
  const { X, Y, u } = useFig();
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const nx = -uy;
  const ny = ux;
  const size = 6 / u;
  const gap = 5.5 / u;
  const mx = a.x + dx * at;
  const my = a.y + dy * at;
  const chevrons = [];
  for (let i = 0; i < count; i++) {
    const off = (i - (count - 1) / 2) * gap;
    const tipX = mx + ux * off;
    const tipY = my + uy * off;
    const b1 = { x: tipX - ux * size + nx * size, y: tipY - uy * size + ny * size };
    const b2 = { x: tipX - ux * size - nx * size, y: tipY - uy * size - ny * size };
    chevrons.push(
      <polyline
        key={i}
        points={`${X(b1.x)},${Y(b1.y)} ${X(tipX)},${Y(tipY)} ${X(b2.x)},${Y(b2.y)}`}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />,
    );
  }
  return <g>{chevrons}</g>;
}

/** Right-angle square at `v`, opening towards `a` and `b`. */
export function RightAngle({
  v,
  a,
  b,
  color = C.accent,
  size = 13,
}: {
  v: Pt;
  a: Pt;
  b: Pt;
  color?: string;
  size?: number;
}) {
  const { X, Y, u } = useFig();
  const s = size / u;
  const n1 = norm({ x: a.x - v.x, y: a.y - v.y });
  const n2 = norm({ x: b.x - v.x, y: b.y - v.y });
  const p1 = { x: v.x + n1.x * s, y: v.y + n1.y * s };
  const p3 = { x: v.x + n2.x * s, y: v.y + n2.y * s };
  const p2 = { x: p1.x + n2.x * s, y: p1.y + n2.y * s };
  return (
    <polyline
      points={`${X(p1.x)},${Y(p1.y)} ${X(p2.x)},${Y(p2.y)} ${X(p3.x)},${Y(p3.y)}`}
      fill="none"
      stroke={color}
      strokeWidth={1.9}
      strokeLinejoin="round"
    />
  );
}

/** Angle arc at vertex `v` between rays v→a and v→b, with optional label. */
export function AngleMark({
  v,
  a,
  b,
  color = C.accent,
  radius = 0.52,
  label,
  labelRadius = 0.86,
  double = false,
}: {
  v: Pt;
  a: Pt;
  b: Pt;
  color?: string;
  radius?: number;
  label?: string;
  labelRadius?: number;
  double?: boolean;
}) {
  const { X, Y, u } = useFig();
  const a1 = Math.atan2(a.y - v.y, a.x - v.x);
  const a2 = Math.atan2(b.y - v.y, b.x - v.x);
  const mk = (r: number) => {
    const x1 = v.x + r * Math.cos(a1);
    const y1 = v.y + r * Math.sin(a1);
    const x2 = v.x + r * Math.cos(a2);
    const y2 = v.y + r * Math.sin(a2);
    let d = a2 - a1;
    while (d <= -Math.PI) d += 2 * Math.PI;
    while (d > Math.PI) d -= 2 * Math.PI;
    const sweep = d > 0 ? 0 : 1;
    return `M ${X(x1)} ${Y(y1)} A ${r * u} ${r * u} 0 0 ${sweep} ${X(x2)} ${Y(y2)}`;
  };
  const mid = a1 + shortest(a1, a2) / 2;
  return (
    <g>
      <path d={mk(radius)} fill="none" stroke={color} strokeWidth={1.8} />
      {double && <path d={mk(radius + 0.11)} fill="none" stroke={color} strokeWidth={1.8} />}
      {label && (
        <text
          x={X(v.x + labelRadius * Math.cos(mid))}
          y={Y(v.y + labelRadius * Math.sin(mid)) + 4}
          fill={color}
          fontSize="12"
          textAnchor="middle"
          fontFamily="'KaTeX_Math', Georgia, serif"
          stroke="#050a16"
          strokeWidth="3"
          paintOrder="stroke"
        >
          {label}
        </text>
      )}
    </g>
  );
}

/** Directed translation arrow. */
export function VectorArrow({
  a,
  b,
  color = C.helper,
  width = 2.4,
  dash,
}: {
  a: Pt;
  b: Pt;
  color?: string;
  width?: number;
  dash?: string;
}) {
  const { X, Y } = useFig();
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const head = 0.28;
  const nx = -uy;
  const ny = ux;
  const tip = b;
  const b1 = { x: tip.x - ux * head + nx * head * 0.5, y: tip.y - uy * head + ny * head * 0.5 };
  const b2 = { x: tip.x - ux * head - nx * head * 0.5, y: tip.y - uy * head - ny * head * 0.5 };
  return (
    <g>
      <line
        x1={X(a.x)}
        y1={Y(a.y)}
        x2={X(b.x - ux * head * 0.6)}
        y2={Y(b.y - uy * head * 0.6)}
        stroke={color}
        strokeWidth={width}
        strokeDasharray={dash}
        strokeLinecap="round"
      />
      <polygon
        points={`${X(tip.x)},${Y(tip.y)} ${X(b1.x)},${Y(b1.y)} ${X(b2.x)},${Y(b2.y)}`}
        fill={color}
      />
    </g>
  );
}

function norm(v: Pt): Pt {
  const l = Math.hypot(v.x, v.y) || 1;
  return { x: v.x / l, y: v.y / l };
}

function shortest(a1: number, a2: number) {
  let d = a2 - a1;
  while (d <= -Math.PI) d += 2 * Math.PI;
  while (d > Math.PI) d -= 2 * Math.PI;
  return d;
}