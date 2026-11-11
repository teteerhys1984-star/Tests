import { useCallback, useMemo, useRef, useState } from 'react'

/**
 * مكتبة الرسوم الهندسية الدقيقة (SVG محلي بالكامل).
 *
 * اتفاقيات القياس الموثّقة:
 *  • شبكة الإحداثيات: وحدة رياضية واحدة = 30 وحدة SVG (مقياس ثابت على المحورين).
 *  • الأشكال الهندسية: 1cm = 26 وحدة SVG (مقياس موحّد لكل الأشكال).
 *  • إحداثيات الرؤوس تُحسب حسابياً من المعطيات (جيب التمام/الجيب) لا تقديرياً،
 *    لذلك كل قياس مطبوع على الرسم يطابق هندسته الفعلية.
 *  • الزوايا تُقاس بعكس عقارب الساعة على الشاشة، والمحور y في SVG مقلوب.
 */

export const CM = 26 // px per centimetre
export const UNIT = 30 // px per coordinate unit

const D2R = (d: number) => (d * Math.PI) / 180
export const polar = (cx: number, cy: number, r: number, deg: number) => ({
  x: cx + r * Math.cos(D2R(deg)),
  y: cy - r * Math.sin(D2R(deg)),
})

function arcPath(cx: number, cy: number, r: number, a0: number, a1: number): string {
  const p0 = polar(cx, cy, r, a0)
  const p1 = polar(cx, cy, r, a1)
  const large = Math.abs(a1 - a0) > 180 ? 1 : 0
  const sweep = a1 > a0 ? 0 : 1
  return `M ${p0.x.toFixed(2)} ${p0.y.toFixed(2)} A ${r} ${r} 0 ${large} ${sweep} ${p1.x.toFixed(2)} ${p1.y.toFixed(2)}`
}

const INK = '#10262f'
const SOFT = '#7d939b'
const ACCENT = '#0f766e'
const GOLD = '#b5851d'
const CLAY = '#b4472f'
const NAVY = '#0e2f3a'

/* ================================================================== */
/* 1) شبكة الإحداثيات                                                  */
/* ================================================================== */

export interface GridPoint {
  label: string
  x: number
  y: number
  color?: string
}

export function CoordGrid({
  max = 8,
  points = [],
  polygon,
  selected,
  onSelect,
  caption,
  height,
}: {
  max?: number
  points?: GridPoint[]
  polygon?: string[]
  selected?: { x: number; y: number } | null
  onSelect?: (p: { x: number; y: number }) => void
  caption?: string
  height?: number
}) {
  const pad = 26
  const size = max * UNIT
  const w = size + pad * 2
  const h = size + pad * 2
  const X = (v: number) => pad + v * UNIT
  const Y = (v: number) => pad + size - v * UNIT
  const byLabel = useMemo(() => new Map(points.map((p) => [p.label, p])), [points])

  const cells = []
  for (let i = 0; i <= max; i++) {
    cells.push(
      <line key={`v${i}`} x1={X(i)} y1={Y(0)} x2={X(i)} y2={Y(max)} stroke={i === 0 ? NAVY : '#dfe6e4'} strokeWidth={i === 0 ? 2 : 1} />,
      <line key={`h${i}`} x1={X(0)} y1={Y(i)} x2={X(max)} y2={Y(i)} stroke={i === 0 ? NAVY : '#dfe6e4'} strokeWidth={i === 0 ? 2 : 1} />,
    )
  }
  const ticks = []
  for (let i = 0; i <= max; i++) {
    ticks.push(
      <text key={`tx${i}`} x={X(i)} y={Y(0) + 17} textAnchor="middle" fontSize="11" fill={SOFT} className="tnum">{i}</text>,
      <text key={`ty${i}`} x={X(0) - 9} y={Y(i) + 4} textAnchor="end" fontSize="11" fill={SOFT} className="tnum">{i}</text>,
    )
  }

  return (
    <figure className="figure-frame" style={{ margin: 0 }}>
      <svg viewBox={`0 0 ${w} ${h}`} width={w} height={height ?? h} role="img" aria-label={caption ?? 'شبكة الإحداثيات'} style={{ maxWidth: '100%' }}>
        <rect x={X(0)} y={Y(max)} width={size} height={size} fill="#fcfdfb" />
        {cells}
        {ticks}
        <text x={X(max) + 12} y={Y(0) + 4} fontSize="13" fontWeight="700" fill={NAVY}>X</text>
        <text x={X(0) - 4} y={Y(max) - 10} fontSize="13" fontWeight="700" fill={NAVY} textAnchor="middle">Y</text>
        <text x={X(0) - 9} y={Y(0) + 17} fontSize="11" fontWeight="700" fill={NAVY} textAnchor="end">O</text>
        {polygon && polygon.length > 2 && (
          <polygon
            points={polygon.map((l) => `${X(byLabel.get(l)!.x)},${Y(byLabel.get(l)!.y)}`).join(' ')}
            fill="rgba(15,118,110,0.13)" stroke={ACCENT} strokeWidth={2.4} strokeLinejoin="round"
          />
        )}
        {points.map((p) => (
          <g key={p.label}>
            <circle cx={X(p.x)} cy={Y(p.y)} r={5.5} fill={p.color ?? CLAY} stroke="#fff" strokeWidth={1.6} />
            <text
              x={X(p.x) + 9} y={Y(p.y) - 8} fontSize="13" fontWeight="700" fill={INK}
            >{p.label}</text>
          </g>
        ))}
        {selected && (
          <g>
            <circle cx={X(selected.x)} cy={Y(selected.y)} r={9} fill="none" stroke={GOLD} strokeWidth={2.5} />
            <circle cx={X(selected.x)} cy={Y(selected.y)} r={4} fill={GOLD} />
          </g>
        )}
        {onSelect &&
          Array.from({ length: max + 1 }, (_, i) =>
            Array.from({ length: max + 1 }, (_, j) => (
              <circle
                key={`hit-${i}-${j}`}
                cx={X(i)} cy={Y(j)} r={11}
                fill="transparent" className="prot-hit"
                onClick={() => onSelect({ x: i, y: j })}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect({ x: i, y: j }) } }}
                tabIndex={-1}
                style={{ cursor: 'pointer' }}
              >
                <title>{`(${i},${j})`}</title>
              </circle>
            )),
          )}
      </svg>
      {caption && <figcaption className="text-center text-xs mt-1" style={{ color: 'var(--ink-3)' }}>{caption}</figcaption>}
    </figure>
  )
}

/* ================================================================== */
/* 2) التمثيل البياني بالخطوط                                          */
/* ================================================================== */

export function LineGraph({
  labels, values, yMin, yMax, yStep, xLabel, yLabel, width = 560, height = 300, unit,
}: {
  labels: string[]; values: number[]; yMin: number; yMax: number; yStep: number
  xLabel: string; yLabel: string; width?: number; height?: number; unit?: string
}) {
  const padL = 56, padR = 20, padT = 18, padB = 56
  const iw = width - padL - padR
  const ih = height - padT - padB
  const n = labels.length
  const X = (i: number) => padL + (n === 1 ? iw / 2 : (iw * i) / (n - 1))
  const Y = (v: number) => padT + ih - ((v - yMin) / (yMax - yMin)) * ih

  const gridVals: number[] = []
  for (let v = yMin; v <= yMax + 1e-9; v += yStep) gridVals.push(Math.round(v * 1000) / 1000)

  return (
    <figure className="figure-frame" style={{ margin: 0 }}>
      <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} role="img"
        aria-label={`تمثيل بياني بالخطوط: ${yLabel} مقابل ${xLabel}`} style={{ maxWidth: '100%' }}>
        <rect x={padL} y={padT} width={iw} height={ih} fill="#fcfdfb" />
        {gridVals.map((v) => (
          <g key={`g${v}`}>
            <line x1={padL} y1={Y(v)} x2={padL + iw} y2={Y(v)} stroke={v === yMin ? NAVY : '#e2e8e6'} strokeWidth={v === yMin ? 1.8 : 1} />
            <text x={padL - 8} y={Y(v) + 4} textAnchor="end" fontSize="11" fill={SOFT} className="tnum">{v}</text>
          </g>
        ))}
        {labels.map((_, i) => (
          <line key={`gx${i}`} x1={X(i)} y1={padT} x2={X(i)} y2={padT + ih} stroke="#eef2f0" strokeWidth={1} />
        ))}
        <line x1={padL} y1={padT} x2={padL} y2={padT + ih} stroke={NAVY} strokeWidth={1.8} />
        {labels.map((lb, i) => (
          <text key={`lx${i}`} x={X(i)} y={padT + ih + 18} textAnchor="middle" fontSize="11" fill={INK} fontWeight="600">{lb}</text>
        ))}
        <text x={padL + iw / 2} y={height - 8} textAnchor="middle" fontSize="12" fill={NAVY} fontWeight="700">{xLabel}</text>
        <text
          transform={`translate(14,${padT + ih / 2}) rotate(-90)`} textAnchor="middle"
          fontSize="12" fill={NAVY} fontWeight="700"
        >{yLabel}{unit ? ` (${unit})` : ''}</text>

        <polyline
          points={values.map((v, i) => `${X(i)},${Y(v)}`).join(' ')}
          fill="none" stroke={ACCENT} strokeWidth={2.8} strokeLinejoin="round" strokeLinecap="round"
        />
        <polygon
          points={`${X(0)},${Y(yMin)} ${values.map((v, i) => `${X(i)},${Y(v)}`).join(' ')} ${X(n - 1)},${Y(yMin)}`}
          fill="rgba(15,118,110,0.09)" stroke="none"
        />
        {values.map((v, i) => (
          <g key={`p${i}`}>
            <circle cx={X(i)} cy={Y(v)} r={4.6} fill="#fff" stroke={CLAY} strokeWidth={2.4} />
            <text x={X(i)} y={Y(v) - 10} textAnchor="middle" fontSize="11" fontWeight="700" fill={CLAY} className="tnum">{v}</text>
          </g>
        ))}
      </svg>
    </figure>
  )
}

/* ================================================================== */
/* 3) الأشكال الرباعية (متوازي أضلاع / معيّن / مستطيل / شبه منحرف)      */
/* ================================================================== */

export type Pt = { x: number; y: number }

/** يبني متوازي أضلاع من ضلعين متجاورين وزاوية بينهما (بوحدة cm). */
export function parallelogram(a: number, b: number, angleDeg: number): Pt[] {
  const A = { x: 0, y: 0 }
  const B = { x: a, y: 0 }
  const D = { x: b * Math.cos(D2R(angleDeg)), y: b * Math.sin(D2R(angleDeg)) }
  const C = { x: B.x + D.x, y: B.y + D.y }
  return [A, B, C, D] // A B C D بالترتيب
}

function chevron(p0: Pt, p1: Pt, count: number): string[] {
  const mx = (p0.x + p1.x) / 2, my = (p0.y + p1.y) / 2
  const ang = Math.atan2(p1.y - p0.y, p1.x - p0.x) * 180 / Math.PI
  const out: string[] = []
  for (let k = 0; k < count; k++) {
    const off = (k - (count - 1) / 2) * 5
    out.push(
      `M ${mx + off * Math.cos(D2R(ang)) - 4.5 * Math.cos(D2R(ang)) - 4 * Math.sin(D2R(ang))} ${
        my + off * Math.sin(D2R(ang)) - 4.5 * Math.sin(D2R(ang)) + 4 * Math.cos(D2R(ang))
      } L ${mx + off * Math.cos(D2R(ang))} ${my + off * Math.sin(D2R(ang))} L ${
        mx + off * Math.cos(D2R(ang)) - 4.5 * Math.cos(D2R(ang)) + 4 * Math.sin(D2R(ang))
      } ${my + off * Math.sin(D2R(ang)) - 4.5 * Math.sin(D2R(ang)) - 4 * Math.cos(D2R(ang))}`,
    )
  }
  return out
}

function tickMarks(p0: Pt, p1: Pt, count: number): string[] {
  const mx = (p0.x + p1.x) / 2, my = (p0.y + p1.y) / 2
  const ang = Math.atan2(p1.y - p0.y, p1.x - p0.x) * 180 / Math.PI
  const out: string[] = []
  for (let k = 0; k < count; k++) {
    const off = (k - (count - 1) / 2) * 5
    const cx = mx + off * Math.cos(D2R(ang)), cy = my + off * Math.sin(D2R(ang))
    out.push(
      `M ${cx - 5 * Math.sin(D2R(ang))} ${cy + 5 * Math.cos(D2R(ang))} L ${cx + 5 * Math.sin(D2R(ang))} ${cy - 5 * Math.cos(D2R(ang))}`,
    )
  }
  return out
}

export interface QuadSpec {
  pts: Pt[]             // بوحدات cm رياضياتية (y للأعلى)
  labels: string[]      // A B C D
  fill?: string
  stroke?: string
  /** علامات التوازي على كل ضلع: 0 = لا شيء، 1 = سهم مفرد، 2 = سهم مزدوج */
  parallel?: number[]
  /** علامات تساوي الأطوال على كل ضلع */
  ticks?: number[]
  sideLabels?: (string | null)[]
  angleArcs?: { at: number; from: number; to: number; text?: string; right?: boolean; color?: string }[]
  diagonals?: [number, number][]
  showAxes?: boolean
}

export function QuadFigure({
  spec, scale = CM, width, height, caption, pad = 40,
}: {
  spec: QuadSpec; scale?: number; width?: number; height?: number; caption?: string; pad?: number
}) {
  const xs = spec.pts.map((p) => p.x), ys = spec.pts.map((p) => p.y)
  const minX = Math.min(0, ...xs), maxX = Math.max(0, ...xs)
  const minY = Math.min(0, ...ys), maxY = Math.max(0, ...ys)
  const w = (maxX - minX) * scale + pad * 2
  const h = (maxY - minY) * scale + pad * 2
  const X = (v: number) => pad + (v - minX) * scale
  const Y = (v: number) => pad + (maxY - v) * scale
  const P = (p: Pt) => ({ x: X(p.x), y: Y(p.y) })
  const screen = spec.pts.map(P)
  const n = screen.length

  return (
    <figure className="figure-frame" style={{ margin: 0 }}>
      <svg viewBox={`0 0 ${w} ${h}`} width={width ?? w} height={height ?? h} role="img"
        aria-label={caption ?? 'شكل هندسي'} style={{ maxWidth: '100%' }}>
        <polygon
          points={screen.map((p) => `${p.x},${p.y}`).join(' ')}
          fill={spec.fill ?? 'rgba(15,118,110,0.10)'}
          stroke={spec.stroke ?? NAVY} strokeWidth={2.6} strokeLinejoin="round"
        />
        {spec.diagonals?.map(([i, j], k) => (
          <line key={`d${k}`} x1={screen[i].x} y1={screen[i].y} x2={screen[j].x} y2={screen[j].y}
            stroke={GOLD} strokeWidth={1.9} strokeDasharray="6 4" />
        ))}
        {spec.parallel?.map((c, i) => {
          if (!c) return null
          const a = screen[i], b = screen[(i + 1) % n]
          return <g key={`pa${i}`}>{chevron(a, b, c).map((d, k) => (
            <path key={k} d={d} fill="none" stroke={ACCENT} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          ))}</g>
        })}
        {spec.ticks?.map((c, i) => {
          if (!c) return null
          const a = screen[i], b = screen[(i + 1) % n]
          return <g key={`t${i}`}>{tickMarks(a, b, c).map((d, k) => (
            <path key={k} d={d} fill="none" stroke={CLAY} strokeWidth={2} strokeLinecap="round" />
          ))}</g>
        })}
        {spec.angleArcs?.map((arc, k) => {
          const v = screen[arc.at]
                  if (arc.right) {
            const r = 0.45 * scale
            const p1 = polar(v.x, v.y, r, arc.from)
            const p2 = polar(v.x, v.y, r, arc.to)
            const corner = { x: p1.x + (p2.x - v.x), y: p1.y + (p2.y - v.y) }
            return <path key={`a${k}`} d={`M ${p1.x} ${p1.y} L ${corner.x} ${corner.y} L ${p2.x} ${p2.y}`}
              fill="none" stroke={arc.color ?? GOLD} strokeWidth={1.8} />
          }
          const r = 0.62 * scale
          return (
            <g key={`a${k}`}>
              <path d={arcPath(v.x, v.y, r, arc.from, arc.to)} fill="none" stroke={arc.color ?? GOLD} strokeWidth={1.9} />
              {arc.text && (() => {
                const mid = polar(v.x, v.y, r + 14, (arc.from + arc.to) / 2)
                return <text x={mid.x} y={mid.y + 4} textAnchor="middle" fontSize="12" fontWeight="700"
                  fill={arc.color ?? '#8d6411'} className="tnum">{arc.text}</text>
              })()}
            </g>
          )
        })}
        {screen.map((p, i) => {
          const cxp = screen.reduce((s, q) => s + q.x, 0) / n
          const cyp = screen.reduce((s, q) => s + q.y, 0) / n
          const dx = p.x - cxp, dy = p.y - cyp
          const len = Math.hypot(dx, dy) || 1
          const lx = p.x + (dx / len) * 17, ly = p.y + (dy / len) * 17
          return (
            <g key={`l${i}`}>
              <circle cx={p.x} cy={p.y} r={3} fill={NAVY} />
              <text x={lx} y={ly + 4.5} textAnchor="middle" fontSize="14" fontWeight="700" fill={NAVY} className="geo-text">
                {spec.labels[i]}
              </text>
            </g>
          )
        })}
        {spec.sideLabels?.map((t, i) => {
          if (!t) return null
          const a = screen[i], b = screen[(i + 1) % n]
          const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2
          const cxp = screen.reduce((s, q) => s + q.x, 0) / n
          const cyp = screen.reduce((s, q) => s + q.y, 0) / n
          const dx = mx - cxp, dy = my - cyp
          const len = Math.hypot(dx, dy) || 1
          return (
            <text key={`s${i}`} x={mx + (dx / len) * 16} y={my + (dy / len) * 16 + 4}
              textAnchor="middle" fontSize="12" fontWeight="700" fill={CLAY} className="tnum">{t}</text>
          )
        })}
      </svg>
      {caption && <figcaption className="text-center text-xs mt-1" style={{ color: 'var(--ink-3)' }}>{caption}</figcaption>}
    </figure>
  )
}

/* ================================================================== */
/* 4) مروحة الزوايا                                                    */
/* ================================================================== */

export interface Ray { label: string; deg: number; len?: number }

export function AngleFan({
  vertexLabel, rays, arcs, width = 340, height = 250, vertex,
}: {
  vertexLabel: string
  rays: Ray[]
  arcs?: { from: number; to: number; text?: string; right?: boolean; color?: string; r?: number }[]
  width?: number; height?: number
  vertex?: Pt
}) {
  const v = vertex ?? { x: 46, y: height - 48 }
  const L = 130
  return (
    <figure className="figure-frame" style={{ margin: 0 }}>
      <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} role="img" aria-label="شكل زوايا"
        style={{ maxWidth: '100%' }}>
        {arcs?.map((a, i) =>
          a.right ? (
            <path key={i} d={(() => {
              const r = a.r ?? 22
              const p1 = polar(v.x, v.y, r, a.from)
              const p2 = polar(v.x, v.y, r, a.to)
              const c = { x: p1.x + (p2.x - v.x), y: p1.y + (p2.y - v.y) }
              return `M ${p1.x} ${p1.y} L ${c.x} ${c.y} L ${p2.x} ${p2.y}`
            })()} fill="none" stroke={a.color ?? GOLD} strokeWidth={1.9} />
          ) : (
            <g key={i}>
              <path d={arcPath(v.x, v.y, a.r ?? 34, a.from, a.to)} fill="none" stroke={a.color ?? GOLD} strokeWidth={2} />
              {a.text && (() => {
                const m = polar(v.x, v.y, (a.r ?? 34) + 15, (a.from + a.to) / 2)
                return <text x={m.x} y={m.y + 4} textAnchor="middle" fontSize="12.5" fontWeight="700"
                  fill={a.color ?? '#8d6411'} className="tnum">{a.text}</text>
              })()}
            </g>
          ),
        )}
        {rays.map((r) => {
          const end = polar(v.x, v.y, r.len ?? L, r.deg)
          const lp = polar(v.x, v.y, (r.len ?? L) + 16, r.deg)
          return (
            <g key={r.label}>
              <line x1={v.x} y1={v.y} x2={end.x} y2={end.y} stroke={NAVY} strokeWidth={2.4} strokeLinecap="round" />
              <text x={lp.x} y={lp.y + 4.5} textAnchor="middle" fontSize="14" fontWeight="700" fill={NAVY}>{r.label}</text>
            </g>
          )
        })}
        <circle cx={v.x} cy={v.y} r={3.6} fill={CLAY} />
        <text x={v.x - 15} y={v.y + 16} textAnchor="middle" fontSize="14" fontWeight="700" fill={CLAY}>{vertexLabel}</text>
      </svg>
    </figure>
  )
}

/* ================================================================== */
/* 5) المنقلة التفاعلية (قياس ورسم الزوايا)                            */
/* ================================================================== */

export function Protractor({
  initial = 0, target, mode = 'measure', armDeg = 0, onCommit, committed, size = 330,
}: {
  initial?: number
  target?: number
  mode?: 'measure' | 'draw'
  armDeg?: number
  onCommit?: (deg: number) => void
  committed?: number | null
  size?: number
}) {
  const R = size / 2 - 14
  const cx = size / 2
  const cy = R + 16
  const [deg, setDeg] = useState(initial)
  const [dragging, setDragging] = useState(false)
  const ref = useRef<SVGSVGElement | null>(null)

  const angleFromEvent = useCallback((clientX: number, clientY: number) => {
    const svg = ref.current
    if (!svg) return deg
    const rect = svg.getBoundingClientRect()
    const scaleX = size / rect.width
    const px = (clientX - rect.left) * scaleX
    const py = (clientY - rect.top) * scaleX
    let a = Math.atan2(cy - py, px - cx) * 180 / Math.PI
    if (a < 0) a += 360
    if (a > 180) a = a > 270 ? 0 : 180
    return Math.max(0, Math.min(180, Math.round(a)))
  }, [cx, cy, deg, size])

  const start = (e: React.PointerEvent<SVGSVGElement>) => {
    e.preventDefault()
    setDragging(true)
    ;(e.target as Element).setPointerCapture?.(e.pointerId)
    setDeg(angleFromEvent(e.clientX, e.clientY))
  }
  const move = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!dragging) return
    setDeg(angleFromEvent(e.clientX, e.clientY))
  }
  const end = () => setDragging(false)

  const ticks = []
  for (let a = 0; a <= 180; a += 1) {
    const major = a % 10 === 0
    const mid = a % 5 === 0
    const r0 = R - (major ? 15 : mid ? 10 : 6)
    const p0 = polar(cx, cy, r0, a)
    const p1 = polar(cx, cy, R, a)
    ticks.push(<line key={`t${a}`} x1={p0.x} y1={p0.y} x2={p1.x} y2={p1.y}
      stroke={major ? '#4d6a72' : '#b9c7ca'} strokeWidth={major ? 1.3 : 0.8} />)
    if (major) {
      const lp = polar(cx, cy, R - 25, a)
      ticks.push(<text key={`n${a}`} x={lp.x} y={lp.y + 3.5} textAnchor="middle" fontSize="9.5"
        fill="#4d6a72" className="tnum">{a}</text>)
    }
  }

  const armEnd = polar(cx, cy, R + 6, armDeg)
  const hairEnd = polar(cx, cy, R + 6, mode === 'measure' ? deg : deg)
  const show = committed ?? deg

  return (
    <div className="flex flex-col items-center gap-2">
      <figure className="figure-frame" style={{ margin: 0 }}>
        <svg
          ref={ref} viewBox={`0 0 ${size} ${cy + 22}`} width={size} height={cy + 22}
          onPointerDown={start} onPointerMove={move} onPointerUp={end} onPointerCancel={end}
          className="prot-hit" role="img" aria-label="منقلة تفاعلية" style={{ maxWidth: '100%', touchAction: 'none' }}
        >
          <path d={`M ${cx - R} ${cy} A ${R} ${R} 0 0 1 ${cx + R} ${cy} Z`} fill="#fdf8ec" stroke={NAVY} strokeWidth={2} />
          <path d={`M ${cx - R + 26} ${cy} A ${R - 26} ${R - 26} 0 0 1 ${cx + R - 26} ${cy}`} fill="none" stroke="#e6dcc4" strokeWidth={1} />
          {ticks}
          <line x1={cx - R} y1={cy} x2={cx + R} y2={cy} stroke={NAVY} strokeWidth={2} />
          <circle cx={cx} cy={cy} r={3.4} fill={CLAY} />
          <circle cx={cx} cy={cy} r={9} fill="none" stroke={CLAY} strokeWidth={1.4} />
          {/* الضلع الثابت للزاوية المقاسة */}
          {mode === 'measure' && target !== undefined && (
            <line x1={cx} y1={cy} x2={armEnd.x} y2={armEnd.y} stroke={NAVY} strokeWidth={3.2} strokeLinecap="round" />
          )}
          {mode === 'measure' && target !== undefined && (() => {
            const e = polar(cx, cy, R + 6, target)
            return <line x1={cx} y1={cy} x2={e.x} y2={e.y} stroke={CLAY} strokeWidth={3.2} strokeLinecap="round" />
          })()}
          {/* شعر المنقلة المتحرك */}
          <line x1={cx} y1={cy} x2={hairEnd.x} y2={hairEnd.y} stroke={GOLD} strokeWidth={2} strokeDasharray="5 4" />
          <circle cx={hairEnd.x} cy={hairEnd.y} r={4.5} fill={GOLD} />
          {mode === 'draw' && committed !== null && committed !== undefined && (() => {
            const e = polar(cx, cy, R + 6, committed)
            return <line x1={cx} y1={cy} x2={e.x} y2={e.y} stroke={ACCENT} strokeWidth={3.4} strokeLinecap="round" />
          })()}
        </svg>
        <figcaption className="text-center text-xs mt-1" style={{ color: 'var(--ink-3)' }}>
          اسحب بإصبعك أو بالفأرة لتدوير شعر المنقلة، واستعمل الأزرار للضبط الدقيق.
        </figcaption>
      </figure>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <button type="button" className="btn btn-ghost !py-1.5 !px-3 !min-h-0" onClick={() => setDeg((d) => Math.max(0, d - 10))}>−10°</button>
        <button type="button" className="btn btn-ghost !py-1.5 !px-3 !min-h-0" onClick={() => setDeg((d) => Math.max(0, d - 1))}>−1°</button>
        <span className="badge badge-gold tnum" style={{ fontSize: '1rem', padding: '0.3rem 0.8rem' }}>
          القراءة: <strong>{show}°</strong>
        </span>
        <button type="button" className="btn btn-ghost !py-1.5 !px-3 !min-h-0" onClick={() => setDeg((d) => Math.min(180, d + 1))}>+1°</button>
        <button type="button" className="btn btn-ghost !py-1.5 !px-3 !min-h-0" onClick={() => setDeg((d) => Math.min(180, d + 10))}>+10°</button>
        {onCommit && (
          <button type="button" className="btn btn-primary !py-1.5 !px-3 !min-h-0" onClick={() => onCommit(deg)}>
            {mode === 'draw' ? 'ثبّت الشعاع' : 'اعتمد القراءة'}
          </button>
        )}
      </div>
    </div>
  )
}

/* ================================================================== */
/* 6) لوحة فرز الأشكال الرباعية                                        */
/* ================================================================== */

export function ShapePanel({
  id, spec, title, scale = 17, width = 150, height = 118,
}: {
  id: string; spec: QuadSpec; title: string; scale?: number; width?: number; height?: number
}) {
  return (
    <div className="flex flex-col items-center gap-1" data-shape={id}>
      <QuadFigure spec={spec} scale={scale} width={width} height={height} pad={22} />
      <span className="badge badge-mute" style={{ fontFamily: 'var(--font-body)' }}>{title}</span>
    </div>
  )
}
