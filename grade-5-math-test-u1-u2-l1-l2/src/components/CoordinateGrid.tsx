import type { GridPoint } from '../exam/types'

interface Props {
  size: number
  points: GridPoint[]
  /** currently plotted point by the student */
  plotted?: { x: number; y: number } | null
  plottedLabel?: string
  onPlot?: (x: number, y: number) => void
  highlight?: { x: number; y: number }[]
}

/**
 * Coordinate grid. Convention enforced everywhere: x = horizontal (left → right),
 * y = vertical (bottom → top). SVG y is flipped accordingly.
 */
export function CoordinateGrid({ size, points, plotted, plottedLabel = 'M', onPlot, highlight = [] }: Props) {
  const unit = 40
  const pad = 36
  const W = pad * 2 + size * unit
  const H = pad * 2 + size * unit
  const sx = (x: number) => pad + x * unit
  const sy = (y: number) => pad + (size - y) * unit

  return (
    <div className="scroll-x mx-auto w-full max-w-[420px]" dir="ltr">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full touch-manipulation" role="img" aria-label="شبكة الإحداثيات">
        <rect x={0} y={0} width={W} height={H} rx={16} fill="#fbfeff" />
        {/* grid lines */}
        {Array.from({ length: size + 1 }, (_, i) => (
          <g key={i}>
            <line x1={sx(i)} y1={sy(0)} x2={sx(i)} y2={sy(size)} stroke="#cfe9f7" strokeWidth={1} />
            <line x1={sx(0)} y1={sy(i)} x2={sx(size)} y2={sy(i)} stroke="#cfe9f7" strokeWidth={1} />
          </g>
        ))}
        {/* axes */}
        <line x1={sx(0)} y1={sy(0)} x2={sx(size) + 14} y2={sy(0)} stroke="#0a6fa3" strokeWidth={2.5} markerEnd="url(#arrow)" />
        <line x1={sx(0)} y1={sy(0)} x2={sx(0)} y2={sy(size) - 14} stroke="#0a6fa3" strokeWidth={2.5} markerEnd="url(#arrow)" />
        <defs>
          <marker id="arrow" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 z" fill="#0a6fa3" />
          </marker>
        </defs>
        {/* numbers */}
        {Array.from({ length: size + 1 }, (_, i) => (
          <g key={i}>
            <text x={sx(i)} y={sy(0) + 18} textAnchor="middle" fontSize={13} fill="#0a6fa3" fontWeight={700}>
              {i}
            </text>
            {i > 0 && (
              <text x={sx(0) - 12} y={sy(i) + 4} textAnchor="middle" fontSize={13} fill="#0a6fa3" fontWeight={700}>
                {i}
              </text>
            )}
          </g>
        ))}
        <text x={sx(size) + 6} y={sy(0) - 10} fontSize={16} fontWeight={700} fill="#0a6fa3" fontStyle="italic">
          x
        </text>
        <text x={sx(0) + 10} y={sy(size) - 6} fontSize={16} fontWeight={700} fill="#0a6fa3" fontStyle="italic">
          y
        </text>
        {/* clickable cells */}
        {onPlot &&
          Array.from({ length: size + 1 }, (_, x) =>
            Array.from({ length: size + 1 }, (_, y) => (
              <circle
                key={`${x}-${y}`}
                cx={sx(x)}
                cy={sy(y)}
                r={unit / 2 - 1}
                fill="transparent"
                className="cursor-pointer"
                onClick={() => onPlot(x, y)}
                aria-label={`(${x}, ${y})`}
              >
                <title>{`(${x}, ${y})`}</title>
              </circle>
            )),
          )}
        {highlight.map((h, i) => (
          <circle key={i} cx={sx(h.x)} cy={sy(h.y)} r={11} fill="#22c55e" opacity={0.35} />
        ))}
        {/* fixed points */}
        {points.map((p) => (
          <g key={p.id} pointerEvents="none">
            <circle cx={sx(p.x)} cy={sy(p.y)} r={7} fill="#f97316" stroke="#fff" strokeWidth={2} />
            <text x={sx(p.x) + 10} y={sy(p.y) - 8} fontSize={16} fontWeight={700} fill="#ea580c">
              {p.id}
            </text>
          </g>
        ))}
        {plotted && (
          <g pointerEvents="none" className="animate-pop">
            <circle cx={sx(plotted.x)} cy={sy(plotted.y)} r={9} fill="#14b8a6" stroke="#fff" strokeWidth={2.5} />
            <text x={sx(plotted.x) + 11} y={sy(plotted.y) - 9} fontSize={16} fontWeight={700} fill="#0d9488">
              {plottedLabel}
            </text>
          </g>
        )}
      </svg>
    </div>
  )
}
