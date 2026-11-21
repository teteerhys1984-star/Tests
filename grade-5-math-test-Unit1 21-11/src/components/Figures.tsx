import { useRef, type PointerEvent as ReactPointerEvent } from 'react'
import { angleFromTap } from '../lib/geometry'
import type { FigureSpec, PlotPoint } from '../lib/types'

/*
 * SVG figures. Every figure has a fixed viewBox, so it scales proportionally on any screen:
 * angles, lengths and grid spacing are never distorted. Interactive surfaces use pointer events
 * (touch and mouse), never hover.
 */

const INK = '#3B2A4F'
const PLUM = '#5B3F86'
const PINK = '#E0609A'
const LILAC = '#8F74C9'
const GOLD = '#A9782A'
const GRID = '#EDE4F5'
const AXIS = '#6B5A7E'

function toViewBox(svg: SVGSVGElement, clientX: number, clientY: number): { x: number; y: number } | null {
  const ctm = svg.getScreenCTM()
  if (!ctm) return null
  const pt = svg.createSVGPoint()
  pt.x = clientX
  pt.y = clientY
  const p = pt.matrixTransform(ctm.inverse())
  return { x: p.x, y: p.y }
}

/* ───────────────────────── Coordinate grid (static or interactive) ───────────────────────── */

export function CoordGrid({
  xMax,
  yMax,
  points = [],
  picked,
  onPick,
  label,
}: {
  xMax: number
  yMax: number
  points?: PlotPoint[]
  picked?: { x: number; y: number } | null
  onPick?: (p: { x: number; y: number }) => void
  label: string
}) {
  const cell = 40
  const left = 46
  const top = 24
  const right = 30
  const bottom = 44
  const W = left + xMax * cell + right
  const H = top + yMax * cell + bottom
  const px = (x: number) => left + x * cell
  const py = (y: number) => top + (yMax - y) * cell
  const svgRef = useRef<SVGSVGElement>(null)

  const handlePick = (e: ReactPointerEvent<SVGRectElement>) => {
    if (!onPick || !svgRef.current) return
    const p = toViewBox(svgRef.current, e.clientX, e.clientY)
    if (!p) return
    const x = Math.round((p.x - left) / cell)
    const y = Math.round((py(0) - p.y) / cell)
    if (x < 0 || x > xMax || y < 0 || y > yMax) return
    onPick({ x, y })
  }

  const vLines = Array.from({ length: xMax + 1 }, (_, x) => x)
  const hLines = Array.from({ length: yMax + 1 }, (_, y) => y)

  return (
    <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label} className="fig-svg">
      <rect x="0" y="0" width={W} height={H} fill="#FFFDFB" rx="10" />
      {vLines.map((x) => (
        <line key={`v${x}`} x1={px(x)} y1={py(0)} x2={px(x)} y2={py(yMax)} stroke={GRID} strokeWidth={1} />
      ))}
      {hLines.map((y) => (
        <line key={`h${y}`} x1={px(0)} y1={py(y)} x2={px(xMax)} y2={py(y)} stroke={GRID} strokeWidth={1} />
      ))}
      {/* axes */}
      <line x1={px(0)} y1={py(0)} x2={px(xMax) + 8} y2={py(0)} stroke={AXIS} strokeWidth={2.2} />
      <line x1={px(0)} y1={py(0)} x2={px(0)} y2={py(yMax) - 8} stroke={AXIS} strokeWidth={2.2} />
      <polygon points={`${px(xMax) + 8},${py(0)} ${px(xMax) + 2},${py(0) - 4} ${px(xMax) + 2},${py(0) + 4}`} fill={AXIS} />
      <polygon points={`${px(0)},${py(yMax) - 8} ${px(0) - 4},${py(yMax) - 2} ${px(0) + 4},${py(yMax) - 2}`} fill={AXIS} />
      {vLines.slice(1).map((x) => (
        <text key={`tx${x}`} x={px(x)} y={py(0) + 18} textAnchor="middle" fontSize="13" fill={INK}>
          {x}
        </text>
      ))}
      {hLines.slice(1).map((y) => (
        <text key={`ty${y}`} x={px(0) - 10} y={py(y) + 4.5} textAnchor="end" fontSize="13" fill={INK}>
          {y}
        </text>
      ))}
      <text x={px(0) - 10} y={py(0) + 18} textAnchor="end" fontSize="13" fill={INK}>
        0
      </text>
      <text x={px(xMax) + 10} y={py(0) + 4} fontSize="14" fontWeight="700" fill={AXIS}>
        X
      </text>
      <text x={px(0) + 8} y={top - 6} fontSize="14" fontWeight="700" fill={AXIS}>
        Y
      </text>
      {/* given points */}
      {points.map((p) => (
        <g key={p.label}>
          <circle cx={px(p.x)} cy={py(p.y)} r={5.5} fill={PLUM} />
          <text x={px(p.x) + 9} y={py(p.y) - 8} fontSize="15" fontWeight="700" fill={PLUM}>
            {p.label}
          </text>
        </g>
      ))}
      {/* the student's marked point */}
      {picked && (
        <g>
          <circle cx={px(picked.x)} cy={py(picked.y)} r={11} fill="none" stroke={PINK} strokeWidth={2.5} />
          <circle cx={px(picked.x)} cy={py(picked.y)} r={4.5} fill={PINK} />
        </g>
      )}
      {onPick && (
        <rect
          x={left - cell / 2}
          y={top - cell / 2}
          width={xMax * cell + cell}
          height={yMax * cell + cell}
          fill="transparent"
          style={{ cursor: 'pointer', touchAction: 'manipulation' }}
          onPointerDown={handlePick}
        />
      )}
    </svg>
  )
}

/* ───────────────────────── Line chart ───────────────────────── */

export function LineChart({
  labels,
  values,
  yMin,
  yMax,
  yStep,
  xLabel,
  yLabel,
}: {
  labels: string[]
  values: number[]
  yMin: number
  yMax: number
  yStep: number
  xLabel: string
  yLabel: string
}) {
  const W = 440
  const H = 292
  const left = 60
  const right = 18
  const top = 36
  const bottom = 58
  const pw = W - left - right
  const ph = H - top - bottom
  const n = values.length
  const xs = values.map((_, i) => left + ((i + 0.5) * pw) / n)
  const ys = values.map((v) => top + ((yMax - v) / (yMax - yMin)) * ph)
  const ticks: number[] = []
  for (let v = yMin; v <= yMax; v += yStep) ticks.push(v)

  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`تمثيل بياني بالخطوط: ${yLabel} حسب ${xLabel}`} className="fig-svg">
      <rect x="0" y="0" width={W} height={H} fill="#FFFDFB" rx="10" />
      {ticks.map((v) => {
        const y = top + ((yMax - v) / (yMax - yMin)) * ph
        return (
          <g key={`g${v}`}>
            <line x1={left} y1={y} x2={W - right} y2={y} stroke={GRID} strokeWidth={1} />
            <text x={left - 8} y={y + 4.5} textAnchor="end" fontSize="13" fill={INK}>
              {v}
            </text>
          </g>
        )
      })}
      <line x1={left} y1={top} x2={left} y2={top + ph} stroke={AXIS} strokeWidth={2} />
      <line x1={left} y1={top + ph} x2={W - right} y2={top + ph} stroke={AXIS} strokeWidth={2} />
      <polyline points={xs.map((x, i) => `${x},${ys[i]}`).join(' ')} fill="none" stroke={PLUM} strokeWidth={3} strokeLinejoin="round" />
      {values.map((v, i) => (
        <g key={i}>
          <circle cx={xs[i]} cy={ys[i]} r={5} fill={PINK} stroke="#fff" strokeWidth={1.5} />
          <text x={xs[i]} y={ys[i] - 12} textAnchor="middle" fontSize="13" fontWeight="700" fill={PLUM}>
            {v}
          </text>
          <text x={xs[i]} y={top + ph + 20} textAnchor="middle" fontSize="12.5" fill={INK}>
            {labels[i]}
          </text>
        </g>
      ))}
      <text x={left} y={20} fontSize="13" fontWeight="700" fill={AXIS}>
        {yLabel}
      </text>
      <text x={W - right} y={H - 10} textAnchor="end" fontSize="13" fontWeight="700" fill={AXIS}>
        {xLabel}
      </text>
    </svg>
  )
}

/* ───────────────────────── Number line (static or tap to place) ───────────────────────── */

export function NumberLine({
  min,
  max,
  step,
  labelEvery,
  mid,
  value,
  onPick,
}: {
  min: number
  max: number
  step: number
  labelEvery: number
  mid?: number
  value?: number | null
  onPick?: (v: number) => void
}) {
  const W = 360
  const H = 124
  const x0 = 26
  const x1 = 334
  const y = 66
  const sx = (v: number) => x0 + ((v - min) / (max - min)) * (x1 - x0)
  const svgRef = useRef<SVGSVGElement>(null)
  const ticks: number[] = []
  for (let v = min; v <= max; v += step) ticks.push(v)

  const handlePick = (e: ReactPointerEvent<SVGRectElement>) => {
    if (!onPick || !svgRef.current) return
    const p = toViewBox(svgRef.current, e.clientX, e.clientY)
    if (!p) return
    const raw = min + ((p.x - x0) / (x1 - x0)) * (max - min)
    const v = Math.round(Math.min(max, Math.max(min, raw)))
    onPick(v)
  }

  return (
    <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`مستقيم أعداد من ${min} إلى ${max}`} className="fig-svg">
      <rect x="0" y="0" width={W} height={H} fill="#FFFDFB" rx="10" />
      <line x1={x0} y1={y} x2={x1} y2={y} stroke={AXIS} strokeWidth={2.4} />
      {ticks.map((v) => (
        <g key={v}>
          <line x1={sx(v)} y1={y - (v % labelEvery === 0 ? 9 : 5)} x2={sx(v)} y2={y + (v % labelEvery === 0 ? 9 : 5)} stroke={AXIS} strokeWidth={1.6} />
          {v % labelEvery === 0 && (
            <text x={sx(v)} y={y + 28} textAnchor="middle" fontSize="13" fontWeight="700" fill={INK}>
              {v}
            </text>
          )}
        </g>
      ))}
      {mid !== undefined && (
        <g>
          <line x1={sx(mid)} y1={y - 34} x2={sx(mid)} y2={y + 34} stroke={GOLD} strokeWidth={1.6} strokeDasharray="4 3" />
          <text x={sx(mid)} y={y - 40} textAnchor="middle" fontSize="12" fontWeight="700" fill={GOLD}>
            المنتصف {mid}
          </text>
        </g>
      )}
      {value !== undefined && value !== null && (
        <g>
          <circle cx={sx(value)} cy={y} r={8} fill={PINK} stroke="#fff" strokeWidth={2} />
          <text x={sx(value)} y={y - 14} textAnchor="middle" fontSize="13" fontWeight="700" fill={PINK}>
            {value}
          </text>
        </g>
      )}
      {onPick && (
        <rect
          x={x0 - 12}
          y={y - 36}
          width={x1 - x0 + 24}
          height={72}
          fill="transparent"
          style={{ cursor: 'pointer', touchAction: 'manipulation' }}
          onPointerDown={handlePick}
        />
      )}
    </svg>
  )
}

/* ───────────────────────── Protractor (static reading or tap to draw) ───────────────────────── */

export function Protractor({
  degree,
  value,
  onPick,
}: {
  /** Static figure: the angle drawn on the protractor. */
  degree?: number
  /** Interactive: the current measured angle (rounded). */
  value?: number | null
  onPick?: (deg: number) => void
}) {
  const W = 340
  const H = 206
  const cx = 170
  const cy = 176
  const r = 150
  const svgRef = useRef<SVGSVGElement>(null)
  const rad = (a: number) => (a * Math.PI) / 180
  const pt = (radius: number, a: number) => ({ x: cx + radius * Math.cos(rad(a)), y: cy - radius * Math.sin(rad(a)) })
  const shown = degree ?? value ?? null

  const handlePick = (e: ReactPointerEvent<SVGRectElement>) => {
    if (!onPick || !svgRef.current) return
    const p = toViewBox(svgRef.current, e.clientX, e.clientY)
    if (!p) return
    const deg = angleFromTap({ x: cx, y: cy }, p)
    if (deg === null) return
    onPick(Math.round(deg))
  }

  const ticks = Array.from({ length: 37 }, (_, i) => i * 5)
  return (
    <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} role="img" aria-label="منقلة. مركزها عند رأس الزاوية، وخط الصفر هو الضلع الأفقي الأيمن" className="fig-svg">
      <rect x="0" y="0" width={W} height={H} fill="#FFFDFB" rx="10" />
      <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy} Z`} fill="#FBF6FF" stroke={AXIS} strokeWidth={2} />
      {ticks.map((a) => {
        const long = a % 10 === 0
        const o = pt(r, a)
        const i2 = pt(r - (long ? 14 : 7), a)
        return <line key={a} x1={o.x} y1={o.y} x2={i2.x} y2={i2.y} stroke={AXIS} strokeWidth={long ? 1.6 : 1} />
      })}
      {Array.from({ length: 19 }, (_, k) => k * 10).map((a) => {
        const inner = pt(r - 30, a)
        const outer = pt(r - 50, a)
        return (
          <g key={`lbl${a}`}>
            <text x={inner.x} y={inner.y + 4} textAnchor="middle" fontSize="10.5" fontWeight="700" fill={GOLD}>
              {a}
            </text>
            <text x={outer.x} y={outer.y + 4} textAnchor="middle" fontSize="10" fill={LILAC}>
              {180 - a}
            </text>
          </g>
        )
      })}
      <line x1={cx - r} y1={cy} x2={cx + r} y2={cy} stroke={AXIS} strokeWidth={2.2} />
      {shown !== null && (
        <g>
          <line x1={cx} y1={cy} x2={pt(r - 4, shown).x} y2={pt(r - 4, shown).y} stroke={PINK} strokeWidth={3.2} strokeLinecap="round" />
          <path
            d={`M ${cx + 56} ${cy} A 56 56 0 0 ${shown > 180 ? 1 : 0} ${pt(56, shown).x} ${pt(56, shown).y}`}
            fill="none"
            stroke={PINK}
            strokeWidth={1.6}
          />
        </g>
      )}
      <circle cx={cx} cy={cy} r={4} fill={PLUM} />
      <text x={cx} y={cy + 18} textAnchor="middle" fontSize="12" fontWeight="700" fill={PLUM}>
        مركز المنقلة
      </text>
      <text x={cx + r} y={cy + 18} textAnchor="middle" fontSize="12" fontWeight="700" fill={GOLD}>
        صفر
      </text>
      <text x={20} y={20} fontSize="11" fill={GOLD}>
        التدريج الذي يبدأ من الصفر هنا
      </text>
      {onPick && (
        <rect
          x={cx - r - 6}
          y={cy - r - 6}
          width={2 * r + 12}
          height={r + 12}
          fill="transparent"
          style={{ cursor: 'pointer', touchAction: 'manipulation' }}
          onPointerDown={handlePick}
        />
      )}
    </svg>
  )
}

/* ───────────────────────── Angle figure (labelled rays) ───────────────────────── */

export function AngleFigure({ degree, vertex, rayA, rayC }: { degree: number; vertex: string; rayA: string; rayC: string }) {
  const W = 300
  const H = 214
  const vx = 110
  const vy = 180
  const R = 124
  const rad = (degree * Math.PI) / 180
  const A = { x: vx + R * Math.cos(rad), y: vy - R * Math.sin(rad) }
  const C = { x: vx + R, y: vy }
  const arcR = 42
  const arcEnd = { x: vx + arcR * Math.cos(rad), y: vy - arcR * Math.sin(rad) }
  const labelA = { x: vx + (R + 20) * Math.cos(rad), y: vy - (R + 20) * Math.sin(rad) }
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`زاوية رأسها ${vertex} وضلعاها ${rayA} و${rayC}`} className="fig-svg">
      <rect x="0" y="0" width={W} height={H} fill="#FFFDFB" rx="10" />
      <path d={`M ${vx + arcR} ${vy} A ${arcR} ${arcR} 0 0 0 ${arcEnd.x} ${arcEnd.y}`} fill="none" stroke={GOLD} strokeWidth={2} />
      <line x1={vx} y1={vy} x2={C.x} y2={C.y} stroke={INK} strokeWidth={3.2} strokeLinecap="round" />
      <line x1={vx} y1={vy} x2={A.x} y2={A.y} stroke={INK} strokeWidth={3.2} strokeLinecap="round" />
      <circle cx={vx} cy={vy} r={4.5} fill={PINK} />
      <text x={vx - 16} y={vy + 20} fontSize="16" fontWeight="700" fill={PINK}>
        {vertex}
      </text>
      <text x={C.x + 6} y={C.y + 22} fontSize="16" fontWeight="700" fill={INK}>
        {rayC}
      </text>
      <text x={labelA.x - 8} y={labelA.y + 5} fontSize="16" fontWeight="700" fill={INK} textAnchor="middle">
        {rayA}
      </text>
    </svg>
  )
}

/* ───────────────────────── Polygon with markings (parallel arrows, equal ticks, angle marks) ───────────────────────── */

export function QuadFigure({
  vertices,
  labels,
  parallel = [],
  equal = [],
  angleMarks = [],
}: {
  vertices: [number, number][]
  labels: string[]
  parallel?: number[][]
  equal?: number[][]
  angleMarks?: { at: number; text: string }[]
}) {
  const W = 340
  const H = 252
  const pad = 46
  const xs = vertices.map((v) => v[0])
  const ys = vertices.map((v) => v[1])
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)
  const s = Math.min((W - 2 * pad) / (maxX - minX || 1), (H - 2 * pad) / (maxY - minY || 1))
  const offX = (W - (maxX - minX) * s) / 2
  const offY = (H - (maxY - minY) * s) / 2
  const P = vertices.map(([x, y]) => ({ x: offX + (x - minX) * s, y: offY + (maxY - y) * s }))
  const n = P.length
  const cen = { x: P.reduce((a, p) => a + p.x, 0) / n, y: P.reduce((a, p) => a + p.y, 0) / n }
  const unit = (dx: number, dy: number) => {
    const L = Math.hypot(dx, dy) || 1
    return { x: dx / L, y: dy / L }
  }

  const sideGeom = (i: number) => {
    const a = P[i]
    const b = P[(i + 1) % n]
    const L = Math.hypot(b.x - a.x, b.y - a.y)
    const u = unit(b.x - a.x, b.y - a.y)
    const nrm = { x: -u.y, y: u.x }
    const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
    return { u, nrm, mid, L }
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`شكل رباعي رؤوسه ${labels.join('، ')}`} className="fig-svg">
      <rect x="0" y="0" width={W} height={H} fill="#FFFDFB" rx="10" />
      <polygon points={P.map((p) => `${p.x},${p.y}`).join(' ')} fill="#F7EFFC" stroke={INK} strokeWidth={2.6} strokeLinejoin="round" />
      {parallel.map((group, g) =>
        group.map((i) => {
          const { u, nrm, mid, L } = sideGeom(i)
          const count = g + 1
          return Array.from({ length: count }, (_, k) => {
            const off = (k - (count - 1) / 2) * 7 + L * 0.12
            const cxk = mid.x + u.x * off
            const cyk = mid.y + u.y * off
            const d = `M ${cxk - 6 * u.x + 5 * nrm.x} ${cyk - 6 * u.y + 5 * nrm.y} L ${cxk + 3 * u.x} ${cyk + 3 * u.y} L ${cxk - 6 * u.x - 5 * nrm.x} ${cyk - 6 * u.y - 5 * nrm.y}`
            return <path key={`p${i}-${k}`} d={d} fill="none" stroke={PLUM} strokeWidth={2.2} strokeLinejoin="round" />
          })
        }),
      )}
      {equal.map((group, g) =>
        group.map((i) => {
          const { u, nrm, mid, L } = sideGeom(i)
          const count = g + 1
          return Array.from({ length: count }, (_, k) => {
            const off = (k - (count - 1) / 2) * 7 - L * 0.14
            const cxk = mid.x + u.x * off
            const cyk = mid.y + u.y * off
            return (
              <line
                key={`e${i}-${k}`}
                x1={cxk + 6 * nrm.x}
                y1={cyk + 6 * nrm.y}
                x2={cxk - 6 * nrm.x}
                y2={cyk - 6 * nrm.y}
                stroke={GOLD}
                strokeWidth={2.2}
              />
            )
          })
        }),
      )}
      {P.map((p, i) => {
        const d = unit(p.x - cen.x, p.y - cen.y)
        return (
          <g key={`lab${i}`}>
            <circle cx={p.x} cy={p.y} r={3.5} fill={INK} />
            <text x={p.x + d.x * 18} y={p.y + d.y * 18 + 5} textAnchor="middle" fontSize="16" fontWeight="700" fill={PINK}>
              {labels[i]}
            </text>
          </g>
        )
      })}
      {angleMarks.map((m, k) => {
        const p = P[m.at]
        const d = unit(cen.x - p.x, cen.y - p.y)
        return (
          <text key={`am${k}`} x={p.x + d.x * 40} y={p.y + d.y * 40 + 4} textAnchor="middle" fontSize="12.5" fontWeight="700" fill={GOLD}>
            {m.text}
          </text>
        )
      })}
    </svg>
  )
}

/* ───────────────────────── Dispatcher for question-level figures ───────────────────────── */

export function FigureView({ spec }: { spec: FigureSpec }) {
  switch (spec.kind) {
    case 'coord-grid':
      return (
        <CoordGrid
          xMax={spec.xMax}
          yMax={spec.yMax}
          points={spec.points}
          label={`شبكة إحداثيات من 0 إلى ${spec.xMax} أفقياً و0 إلى ${spec.yMax} شاقولياً${spec.points ? ' عليها نقاط مسمّاة' : ''}`}
        />
      )
    case 'line-chart':
      return (
        <LineChart
          labels={spec.labels}
          values={spec.values}
          yMin={spec.yMin}
          yMax={spec.yMax}
          yStep={spec.yStep}
          xLabel={spec.xLabel}
          yLabel={spec.yLabel}
        />
      )
    case 'protractor':
      return <Protractor degree={spec.degree} />
    case 'angle':
      return <AngleFigure degree={spec.degree} vertex={spec.vertex} rayA={spec.rayA} rayC={spec.rayC} />
    case 'quad':
      return (
        <QuadFigure
          vertices={spec.vertices}
          labels={spec.labels}
          parallel={spec.parallel}
          equal={spec.equal}
          angleMarks={spec.angleMarks}
        />
      )
    default:
      return null
  }
}
