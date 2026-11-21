import { describe, expect, it } from 'vitest'
import {
  angleFromTap,
  classifyAngle,
  consecutiveAngle,
  isParallelogram,
  parallelogramFourthVertex,
  parallelogramVertices,
  perimeter,
  withinTolerance,
  type Pt,
} from './geometry'

const dist = (p: Pt, q: Pt) => Math.hypot(q.x - p.x, q.y - p.y)
const angleAt = (v: Pt, p: Pt, q: Pt) => {
  const u = { x: p.x - v.x, y: p.y - v.y }
  const w = { x: q.x - v.x, y: q.y - v.y }
  return (Math.acos((u.x * w.x + u.y * w.y) / (Math.hypot(u.x, u.y) * Math.hypot(w.x, w.y))) * 180) / Math.PI
}

describe('protractor readings from a tap', () => {
  const vertex = { x: 100, y: 100 }

  it('measures counterclockwise from the baseline (positive x-axis)', () => {
    // SVG coordinates: y grows downward, so "up" is smaller y.
    expect(angleFromTap(vertex, { x: 200, y: 100 })).toBe(0)
    expect(angleFromTap(vertex, { x: 150, y: 50 })).toBe(45)
    expect(angleFromTap(vertex, { x: 100, y: 0 })).toBe(90)
    expect(angleFromTap(vertex, { x: 0, y: 100 })).toBe(180)
  })

  it('returns null for taps below the baseline', () => {
    expect(angleFromTap(vertex, { x: 150, y: 160 })).toBeNull()
  })

  it('is within tolerance for small touch errors only', () => {
    expect(withinTolerance(93, 90, 4)).toBe(true)
    expect(withinTolerance(95, 90, 4)).toBe(false)
    expect(withinTolerance(86, 90, 4)).toBe(true)
  })
})

describe('angle classification (قياس الزوايا)', () => {
  it('classifies acute, right, obtuse and straight angles', () => {
    expect(classifyAngle(40)).toBe('حادة')
    expect(classifyAngle(90)).toBe('قائمة')
    expect(classifyAngle(125)).toBe('منفرجة')
    expect(classifyAngle(140)).toBe('منفرجة')
    expect(classifyAngle(180)).toBe('مستقيمة')
    expect(classifyAngle(0)).toBeNull()
    expect(classifyAngle(200)).toBeNull()
  })

  it('consecutive angles of a parallelogram are supplementary', () => {
    expect(consecutiveAngle(70)).toBe(110)
    expect(consecutiveAngle(118)).toBe(62)
  })
})

describe('parallelograms and rhombuses (متوازي الأضلاع والمعيّن)', () => {
  it('finds the fourth vertex as D = A + C − B', () => {
    const A = { x: 1, y: 1 }
    const B = { x: 5, y: 1 }
    const C = { x: 6, y: 4 }
    const D = parallelogramFourthVertex(A, B, C)
    expect(D).toEqual({ x: 2, y: 4 })
    expect(isParallelogram(A, B, C, D)).toBe(true)
  })

  it('rejects a quadrilateral whose opposite sides are not equal and parallel', () => {
    expect(isParallelogram({ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 3, y: 3 }, { x: 1, y: 3 })).toBe(false)
  })

  it('builds a to-scale parallelogram with the requested sides and angle', () => {
    const [A, B, C, D] = parallelogramVertices(9, 6, 118)
    expect(dist(A, B)).toBeCloseTo(9, 9)
    expect(dist(B, C)).toBeCloseTo(6, 9)
    expect(dist(C, D)).toBeCloseTo(9, 9)
    expect(dist(D, A)).toBeCloseTo(6, 9)
    expect(angleAt(A, B, D)).toBeCloseTo(118, 6)
    expect(isParallelogram(A, B, C, D)).toBe(true)
    expect(perimeter([A, B, C, D])).toBeCloseTo(30, 9)
  })

  it('a rhombus built from one side and one angle has four equal sides', () => {
    const [A, B, C, D] = parallelogramVertices(3, 3, 70)
    for (const [p, q] of [
      [A, B],
      [B, C],
      [C, D],
      [D, A],
    ] as const) {
      expect(dist(p, q)).toBeCloseTo(3, 9)
    }
    expect(angleAt(A, B, D)).toBeCloseTo(70, 6)
    expect(perimeter([A, B, C, D])).toBeCloseTo(12, 9)
  })
})
