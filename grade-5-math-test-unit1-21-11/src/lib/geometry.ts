/**
 * Geometry helpers: protractor readings, tolerance checks, parallelogram/rhombus construction
 * and classification. All angles are in degrees and measured counterclockwise from the
 * positive x-axis (the protractor baseline), in mathematical coordinates (y upward).
 */

export interface Pt {
  x: number
  y: number
}

/**
 * Angle of a tap relative to a protractor vertex, measured from the baseline (positive x-axis)
 * counterclockwise. `vertex` and `tap` are in SVG-like coordinates (y grows downward).
 * Returns null when the tap is below the baseline (outside the protractor's 0°–180° range).
 */
export function angleFromTap(vertex: Pt, tap: Pt): number | null {
  const dx = tap.x - vertex.x
  const dy = vertex.y - tap.y
  const raw = (Math.atan2(dy, dx) * 180) / Math.PI
  if (raw < -0.5 || raw > 180.5) return null
  const clamped = Math.min(180, Math.max(0, raw))
  return Math.round(clamped * 10) / 10
}

/** True when `actual` is within the allowed tolerance of `target` (inclusive). */
export function withinTolerance(actual: number, target: number, tolerance: number): boolean {
  return Math.abs(actual - target) <= tolerance + 1e-9
}

/** Fourth vertex D of parallelogram ABCD given A, B, C (D = A + C − B). */
export function parallelogramFourthVertex(a: Pt, b: Pt, c: Pt): Pt {
  return { x: a.x + c.x - b.x, y: a.y + c.y - b.y }
}

/** True when ABCD is a non-degenerate parallelogram: AB = DC and BC = AD as vectors. */
export function isParallelogram(a: Pt, b: Pt, c: Pt, d: Pt): boolean {
  const eq = (p: Pt, q: Pt) => Math.abs(p.x - q.x) < 1e-9 && Math.abs(p.y - q.y) < 1e-9
  const ab = { x: b.x - a.x, y: b.y - a.y }
  const dc = { x: c.x - d.x, y: c.y - d.y }
  const bc = { x: c.x - b.x, y: c.y - b.y }
  const ad = { x: d.x - a.x, y: d.y - a.y }
  const nonDegenerate = Math.abs(ab.x * bc.y - ab.y * bc.x) > 1e-9
  return nonDegenerate && eq(ab, dc) && eq(bc, ad)
}

/**
 * Vertices A, B, C, D of a parallelogram with side AB = a, side AD = b and angle A = angleDeg.
 * If a === b the result is a rhombus. The figure is built from these exact values, so it is to scale.
 */
export function parallelogramVertices(a: number, b: number, angleDeg: number): [Pt, Pt, Pt, Pt] {
  const rad = (angleDeg * Math.PI) / 180
  const A = { x: 0, y: 0 }
  const B = { x: a, y: 0 }
  const D = { x: b * Math.cos(rad), y: b * Math.sin(rad) }
  const C = { x: B.x + D.x, y: B.y + D.y }
  return [A, B, C, D]
}

export type AngleKind = 'حادة' | 'قائمة' | 'منفرجة' | 'مستقيمة'

/** Classifies a non-reflex angle given in degrees (0 < deg < 180 for proper angles). */
export function classifyAngle(deg: number): AngleKind | null {
  if (deg <= 0 || deg > 180) return null
  if (deg === 180) return 'مستقيمة'
  if (deg === 90) return 'قائمة'
  return deg < 90 ? 'حادة' : 'منفرجة'
}

/** Consecutive angles of a parallelogram are supplementary: the second is 180° − angle. */
export function consecutiveAngle(angleDeg: number): number {
  return 180 - angleDeg
}

/** Perimeter of a quadrilateral given its vertices in order. */
export function perimeter(points: Pt[]): number {
  let total = 0
  for (let i = 0; i < points.length; i++) {
    const p = points[i]
    const q = points[(i + 1) % points.length]
    total += Math.hypot(q.x - p.x, q.y - p.y)
  }
  return total
}
