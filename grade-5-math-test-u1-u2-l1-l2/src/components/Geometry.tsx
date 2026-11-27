import { PARALLELOGRAM, ANGLE_MEASURE } from '../exam/questions'

type Pt = [number, number]

const mid = (a: Pt, b: Pt): Pt => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]
const dir = (a: Pt, b: Pt): Pt => {
  const dx = b[0] - a[0]
  const dy = b[1] - a[1]
  const l = Math.hypot(dx, dy)
  return [dx / l, dy / l]
}

/** Side ticks (equal-length marks) and parallel arrows (chevrons) on a polygon side. */
function SideMarks({ a, b, ticks = 0, arrows = 0, color = '#0a6fa3' }: { a: Pt; b: Pt; ticks?: number; arrows?: number; color?: string }) {
  const m = mid(a, b)
  const [ux, uy] = dir(a, b)
  const nx = -uy
  const ny = ux
  const els = []
  for (let i = 0; i < ticks; i++) {
    const off = (i - (ticks - 1) / 2) * 6
    const cx = m[0] + ux * off - ux * 10
    const cy = m[1] + uy * off - uy * 10
    els.push(<line key={`t${i}`} x1={cx - nx * 6} y1={cy - ny * 6} x2={cx + nx * 6} y2={cy + ny * 6} stroke={color} strokeWidth={2.2} />)
  }
  for (let i = 0; i < arrows; i++) {
    const off = i * 7 + 10
    const cx = m[0] + ux * off
    const cy = m[1] + uy * off
    const p1: Pt = [cx - ux * 7 + nx * 5, cy - uy * 7 + ny * 5]
    const p2: Pt = [cx - ux * 7 - nx * 5, cy - uy * 7 - ny * 5]
    els.push(
      <polyline key={`a${i}`} points={`${p1[0]},${p1[1]} ${cx},${cy} ${p2[0]},${p2[1]}`} fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />,
    )
  }
  return <>{els}</>
}

function Quad({
  pts,
  ticks,
  arrows,
  fill,
  stroke,
}: {
  pts: Pt[]
  ticks: number[]
  arrows: number[]
  fill: string
  stroke: string
}) {
  return (
    <g>
      <polygon points={pts.map((p) => p.join(',')).join(' ')} fill={fill} stroke={stroke} strokeWidth={2.5} strokeLinejoin="round" />
      {pts.map((p, i) => (
        <SideMarks key={i} a={p} b={pts[(i + 1) % 4]} ticks={ticks[i]} arrows={arrows[i]} color={stroke} />
      ))}
    </g>
  )
}

/* ---------------- Angle with three letters ---------------- */
export function AngleNameFigure() {
  const B: Pt = [110, 170]
  const r = 160
  const rad = (ANGLE_MEASURE * Math.PI) / 180
  const A: Pt = [B[0] + r, B[1]]
  const C: Pt = [B[0] + r * Math.cos(rad), B[1] - r * Math.sin(rad)]
  const ar = 42
  const arcEnd: Pt = [B[0] + ar * Math.cos(rad), B[1] - ar * Math.sin(rad)]
  const labelAng = rad / 2
  const L: Pt = [B[0] + 64 * Math.cos(labelAng), B[1] - 64 * Math.sin(labelAng)]
  return (
    <svg viewBox="0 0 300 200" className="mx-auto h-auto w-full max-w-[320px]" role="img" aria-label="زاوية رأسها B">
      <rect width={300} height={200} rx={16} fill="#fbfeff" />
      <path d={`M ${B[0] + ar},${B[1]} A ${ar} ${ar} 0 0 0 ${arcEnd[0]},${arcEnd[1]} L ${B[0]},${B[1]} Z`} fill="#fde68a" opacity={0.8} />
      <path d={`M ${B[0] + ar},${B[1]} A ${ar} ${ar} 0 0 0 ${arcEnd[0]},${arcEnd[1]}`} fill="none" stroke="#f59e0b" strokeWidth={2.5} />
      <line x1={B[0]} y1={B[1]} x2={A[0]} y2={A[1]} stroke="#0a6fa3" strokeWidth={3} strokeLinecap="round" />
      <line x1={B[0]} y1={B[1]} x2={C[0]} y2={C[1]} stroke="#0a6fa3" strokeWidth={3} strokeLinecap="round" />
      {[B, A, C].map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r={4.5} fill="#ea580c" />
      ))}
      <text x={B[0] - 8} y={B[1] + 20} fontSize={18} fontWeight={700} fill="#1e293b">B</text>
      <text x={A[0] - 4} y={A[1] + 22} fontSize={18} fontWeight={700} fill="#1e293b">A</text>
      <text x={C[0] - 18} y={C[1] - 6} fontSize={18} fontWeight={700} fill="#1e293b">C</text>
      <text x={L[0]} y={L[1] + 4} fontSize={14} fontWeight={700} fill="#b45309" textAnchor="middle">
        {ANGLE_MEASURE}°
      </text>
    </svg>
  )
}

/* ---------------- Parallelogram ABCD ---------------- */
export function ParallelogramFigure() {
  const s = 30
  const rad = (PARALLELOGRAM.angleA * Math.PI) / 180
  const A: Pt = [50, 160]
  const B: Pt = [A[0] + PARALLELOGRAM.ab * s, A[1]]
  const D: Pt = [A[0] + PARALLELOGRAM.bc * s * Math.cos(rad), A[1] - PARALLELOGRAM.bc * s * Math.sin(rad)]
  const C: Pt = [B[0] + (D[0] - A[0]), D[1]]
  const ar = 30
  const arcEnd: Pt = [A[0] + ar * Math.cos(rad), A[1] - ar * Math.sin(rad)]
  return (
    <svg viewBox="0 0 320 200" className="mx-auto h-auto w-full max-w-[340px]" role="img" aria-label="متوازي أضلاع ABCD">
      <rect width={320} height={200} rx={16} fill="#fbfeff" />
      <Quad pts={[A, B, C, D]} ticks={[1, 2, 1, 2]} arrows={[1, 2, 1, 2]} fill="#d2f7f1" stroke="#0d9488" />
      <path d={`M ${A[0] + ar},${A[1]} A ${ar} ${ar} 0 0 0 ${arcEnd[0]},${arcEnd[1]}`} fill="none" stroke="#f59e0b" strokeWidth={2.5} />
      <text x={A[0] + 40} y={A[1] - 14} fontSize={13} fontWeight={700} fill="#b45309">{PARALLELOGRAM.angleA}°</text>
      <text x={A[0] - 18} y={A[1] + 18} fontSize={17} fontWeight={700} fill="#1e293b">A</text>
      <text x={B[0] + 4} y={B[1] + 18} fontSize={17} fontWeight={700} fill="#1e293b">B</text>
      <text x={C[0] + 6} y={C[1] - 2} fontSize={17} fontWeight={700} fill="#1e293b">C</text>
      <text x={D[0] - 20} y={D[1] - 2} fontSize={17} fontWeight={700} fill="#1e293b">D</text>
      <text x={(A[0] + B[0]) / 2} y={A[1] + 26} fontSize={13} fontWeight={700} fill="#0d9488" textAnchor="middle">
        {PARALLELOGRAM.ab} cm
      </text>
      <text x={(B[0] + C[0]) / 2 + 26} y={(B[1] + C[1]) / 2 + 4} fontSize={13} fontWeight={700} fill="#0d9488" textAnchor="middle">
        {PARALLELOGRAM.bc} cm
      </text>
    </svg>
  )
}

/* ---------------- Four quadrilaterals ---------------- */
export function ShapesFigure() {
  const shapes: { n: number; pts: Pt[]; ticks: number[]; arrows: number[]; fill: string; stroke: string }[] = [
    // 1: parallelogram (6 × 3.5 units) — adjacent sides differ
    { n: 1, pts: [[20, 95], [110, 95], [135, 35], [45, 35]], ticks: [1, 2, 1, 2], arrows: [1, 2, 1, 2], fill: '#d8f0ff', stroke: '#0a6fa3' },
    // 2: trapezoid — one pair of parallel sides only
    { n: 2, pts: [[15, 95], [135, 95], [105, 35], [45, 35]], ticks: [0, 0, 0, 0], arrows: [1, 0, 1, 0], fill: '#fef3c7', stroke: '#b45309' },
    // 3: rhombus — all four sides equal (side = 60)
    { n: 3, pts: [[25, 95], [85, 95], [121, 47], [61, 47]], ticks: [1, 1, 1, 1], arrows: [1, 2, 1, 2], fill: '#dcfce7', stroke: '#16a34a' },
    // 4: general quadrilateral — no parallel sides, no equal marks
    { n: 4, pts: [[20, 95], [120, 100], [130, 40], [60, 25]], ticks: [0, 0, 0, 0], arrows: [0, 0, 0, 0], fill: '#ffedd5', stroke: '#ea580c' },
  ]
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" dir="ltr">
      {shapes.map((s) => (
        <svg key={s.n} viewBox="0 0 150 125" className="h-auto w-full rounded-2xl bg-white" role="img" aria-label={`الشكل ${s.n}`}>
          <Quad pts={s.pts} ticks={s.ticks} arrows={s.arrows} fill={s.fill} stroke={s.stroke} />
          <text x={75} y={118} textAnchor="middle" fontSize={14} fontWeight={700} fill="#1e293b">
            {s.n}
          </text>
        </svg>
      ))}
    </div>
  )
}
