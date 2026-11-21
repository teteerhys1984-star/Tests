import React from 'react'
import type {
  CoordinateGridVisualConfig,
  GeometryFigureVisualConfig,
  LineChartVisualConfig,
  NumberLineVisualConfig,
  ProtractorVisualConfig,
  QuestionVisualConfig,
  StudentAnswersMap,
} from '../types/exam'
import { parseNaturalNumber, parseOrderedPair } from '../utils/mathNorm'

interface VisualRendererProps {
  visual: QuestionVisualConfig
  answers: StudentAnswersMap
  onUpdateAnswer: (branchId: string, value: string) => void
}

export const QuestionVisualRenderer: React.FC<VisualRendererProps> = ({
  visual,
  answers,
  onUpdateAnswer,
}) => {
  switch (visual.kind) {
    case 'coordinate-grid':
      return (
        <CoordinateGridVisual
          config={visual}
          answers={answers}
          onUpdateAnswer={onUpdateAnswer}
        />
      )
    case 'line-chart':
      return <LineChartVisual config={visual} />
    case 'number-line':
      return <NumberLineVisual config={visual} />
    case 'protractor':
      return (
        <ProtractorVisual
          config={visual}
          answers={answers}
          onUpdateAnswer={onUpdateAnswer}
        />
      )
    case 'geometry-figure':
      return <GeometryFigureVisual config={visual} />
  }
}

/* ────────────────────── 1. Coordinate Grid Visual ────────────────────── */
const CoordinateGridVisual: React.FC<{
  config: CoordinateGridVisualConfig
  answers: StudentAnswersMap
  onUpdateAnswer: (branchId: string, value: string) => void
}> = ({ config, answers, onUpdateAnswer }) => {
  const { maxX, maxY, fixedPoints, interactiveBranchId, interactivePointLabel, connectPolygonLabels, movementSteps, caption } = config

  const padLeft = 48
  const padBottom = 46
  const padTop = 28
  const padRight = 32
  const cell = 34
  const width = padLeft + maxX * cell + padRight
  const height = padTop + maxY * cell + padBottom

  const toSvgX = (x: number) => padLeft + x * cell
  const toSvgY = (y: number) => height - padBottom - y * cell

  const interactivePair = interactiveBranchId
    ? parseOrderedPair(answers[interactiveBranchId] ?? '')
    : null

  const allNamedPoints = React.useMemo(() => {
    const map = new Map<string, { x: number; y: number }>()
    for (const p of fixedPoints) {
      map.set(p.label, { x: p.x, y: p.y })
    }
    if (interactivePointLabel && interactivePair) {
      map.set(interactivePointLabel, interactivePair)
    }
    return map
  }, [fixedPoints, interactivePointLabel, interactivePair])

  const polygonPointsAttr = React.useMemo(() => {
    if (!connectPolygonLabels || connectPolygonLabels.length < 3) return null
    const coords: string[] = []
    for (const lbl of connectPolygonLabels) {
      const pt = allNamedPoints.get(lbl)
      if (!pt) return null
      coords.push(`${toSvgX(pt.x)},${toSvgY(pt.y)}`)
    }
    return coords.join(' ')
  }, [connectPolygonLabels, allNamedPoints])

  return (
    <div className="my-4 rounded-2xl border-2 border-pink-200/80 bg-white p-3 sm:p-4 shadow-xs">
      <div className="w-full overflow-x-auto flex justify-center" dir="ltr">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full max-w-[420px] h-auto select-none touch-manipulation"
          role="img"
          aria-label={caption}
        >
          <defs>
            <marker
              id="axis-arrow-pink"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#6b21a8" />
            </marker>
            <marker
              id="move-arrow"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="5"
              markerHeight="5"
              orient="auto"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#db2777" />
            </marker>
          </defs>

          {/* Grid background */}
          <rect
            x={padLeft}
            y={padTop}
            width={maxX * cell}
            height={maxY * cell}
            fill="#fdf4ff"
            rx="4"
          />

          {/* Vertical grid lines & X labels */}
          {Array.from({ length: maxX + 1 }, (_, x) => {
            const sx = toSvgX(x)
            return (
              <g key={`vx-${x}`}>
                <line
                  x1={sx}
                  y1={padTop}
                  x2={sx}
                  y2={height - padBottom}
                  stroke={x === 0 ? '#581c87' : '#f0abfc'}
                  strokeWidth={x === 0 ? 2.4 : 1}
                />
                <text
                  x={sx}
                  y={height - padBottom + 20}
                  textAnchor="middle"
                  fontSize="12"
                  fontWeight="700"
                  fill="#4a044e"
                >
                  {x}
                </text>
              </g>
            )
          })}

          {/* Horizontal grid lines & Y labels */}
          {Array.from({ length: maxY + 1 }, (_, y) => {
            const sy = toSvgY(y)
            return (
              <g key={`hy-${y}`}>
                <line
                  x1={padLeft}
                  y1={sy}
                  x2={padLeft + maxX * cell}
                  y2={sy}
                  stroke={y === 0 ? '#581c87' : '#f0abfc'}
                  strokeWidth={y === 0 ? 2.4 : 1}
                />
                <text
                  x={padLeft - 14}
                  y={sy + 4}
                  textAnchor="end"
                  fontSize="12"
                  fontWeight="700"
                  fill="#4a044e"
                >
                  {y}
                </text>
              </g>
            )
          })}

          {/* Axis arrows and labels */}
          <line
            x1={padLeft}
            y1={height - padBottom}
            x2={padLeft + maxX * cell + 14}
            y2={height - padBottom}
            stroke="#581c87"
            strokeWidth="2.4"
            markerEnd="url(#axis-arrow-pink)"
          />
          <line
            x1={padLeft}
            y1={height - padBottom}
            x2={padLeft}
            y2={padTop - 14}
            stroke="#581c87"
            strokeWidth="2.4"
            markerEnd="url(#axis-arrow-pink)"
          />
          <text
            x={padLeft + maxX * cell + 18}
            y={height - padBottom + 4}
            fontSize="13"
            fontWeight="800"
            fill="#581c87"
          >
            X
          </text>
          <text
            x={padLeft - 4}
            y={padTop - 16}
            fontSize="13"
            fontWeight="800"
            fill="#581c87"
          >
            Y
          </text>
          <text
            x={padLeft - 18}
            y={height - padBottom + 20}
            fontSize="12"
            fontWeight="800"
            fill="#be185d"
          >
            O
          </text>

          {/* Optional polygon preview */}
          {polygonPointsAttr && (
            <polygon
              points={polygonPointsAttr}
              fill="rgba(236, 72, 153, 0.16)"
              stroke="#db2777"
              strokeWidth="2.2"
              strokeDasharray="5 3"
            />
          )}

          {/* Optional movement path arrows */}
          {movementSteps?.map((step, idx) => (
            <line
              key={idx}
              x1={toSvgX(step.fromX)}
              y1={toSvgY(step.fromY)}
              x2={toSvgX(step.toX)}
              y2={toSvgY(step.toY)}
              stroke="#db2777"
              strokeWidth="2.5"
              strokeDasharray="5 3"
              markerEnd="url(#move-arrow)"
            />
          ))}

          {/* Interactive intersection targets */}
          {interactiveBranchId &&
            Array.from({ length: maxX + 1 }, (_, x) =>
              Array.from({ length: maxY + 1 }, (_, y) => {
                const sx = toSvgX(x)
                const sy = toSvgY(y)
                const isSelected = interactivePair?.x === x && interactivePair?.y === y
                return (
                  <g
                    key={`hit-${x}-${y}`}
                    className="cursor-pointer"
                    onClick={() => onUpdateAnswer(interactiveBranchId, `(${x}, ${y})`)}
                  >
                    <circle
                      cx={sx}
                      cy={sy}
                      r={14}
                      fill="transparent"
                    />
                    <circle
                      cx={sx}
                      cy={sy}
                      r={isSelected ? 7.5 : 3}
                      fill={isSelected ? '#db2777' : 'rgba(147, 51, 234, 0.25)'}
                      stroke={isSelected ? '#ffffff' : 'none'}
                      strokeWidth={isSelected ? 2 : 0}
                    />
                  </g>
                )
              })
            )}

          {/* Fixed points */}
          {fixedPoints.map(pt => {
            const sx = toSvgX(pt.x)
            const sy = toSvgY(pt.y)
            const labelOffsetY = pt.y >= maxY - 1 ? 18 : -11
            const labelOffsetX = pt.x >= maxX - 1 ? -12 : 10
            return (
              <g key={pt.label}>
                <circle
                  cx={sx}
                  cy={sy}
                  r={6.5}
                  fill={pt.color ?? '#db2777'}
                  stroke="#ffffff"
                  strokeWidth="2"
                />
                <rect
                  x={sx + labelOffsetX - 11}
                  y={sy + labelOffsetY - 12}
                  width={22}
                  height={17}
                  rx="4"
                  fill="rgba(255,255,255,0.92)"
                  stroke="#f5d0fe"
                />
                <text
                  x={sx + labelOffsetX}
                  y={sy + labelOffsetY}
                  textAnchor="middle"
                  fontSize="12.5"
                  fontWeight="800"
                  fill="#701a75"
                >
                  {pt.label}
                </text>
              </g>
            )
          })}

          {/* Selected Interactive Point */}
          {interactiveBranchId && interactivePair && (
            <g>
              <circle
                cx={toSvgX(interactivePair.x)}
                cy={toSvgY(interactivePair.y)}
                r={8}
                fill="#db2777"
                stroke="#ffffff"
                strokeWidth="2.5"
              />
              <text
                x={toSvgX(interactivePair.x) + 12}
                y={toSvgY(interactivePair.y) - 10}
                fontSize="13"
                fontWeight="800"
                fill="#be185d"
              >
                {interactivePointLabel ?? 'P'}({interactivePair.x},{interactivePair.y})
              </text>
            </g>
          )}
        </svg>
      </div>
      <p className="mt-2 text-center text-xs font-medium text-purple-800">{caption}</p>
    </div>
  )
}

/* ────────────────────── 2. Line Chart Visual ────────────────────── */
const LineChartVisual: React.FC<{ config: LineChartVisualConfig }> = ({ config }) => {
  const { title, xAxisLabel, yAxisLabel, categories, values, yMin, yMax, yStep, table } = config

  const padLeft = 52
  const padRight = 32
  const padTop = 34
  const padBottom = 54
  const chartW = 310
  const chartH = 190
  const width = padLeft + chartW + padRight
  const height = padTop + chartH + padBottom

  const xForIndex = (i: number) =>
    padLeft + (categories.length > 1 ? (i * chartW) / (categories.length - 1) : chartW / 2)
  const yForValue = (v: number) =>
    padTop + chartH - ((v - yMin) / (yMax - yMin)) * chartH

  const yTicks: number[] = []
  for (let v = yMin; v <= yMax; v += yStep) {
    yTicks.push(v)
  }

  const polylinePoints = values.map((v, i) => `${xForIndex(i)},${yForValue(v)}`).join(' ')

  return (
    <div className="my-4 rounded-2xl border-2 border-pink-200/80 bg-white p-3 sm:p-4 shadow-xs">
      <h4 className="mb-2 text-center text-sm font-bold text-purple-950">{title}</h4>
      <div className="w-full overflow-x-auto flex justify-center" dir="ltr">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full max-w-[440px] h-auto select-none"
          role="img"
          aria-label={title}
        >
          <rect
            x={padLeft}
            y={padTop}
            width={chartW}
            height={chartH}
            fill="#fdf4ff"
            rx="4"
          />

          {/* Horizontal Y grid lines */}
          {yTicks.map(tick => {
            const sy = yForValue(tick)
            return (
              <g key={`yt-${tick}`}>
                <line
                  x1={padLeft}
                  y1={sy}
                  x2={padLeft + chartW}
                  y2={sy}
                  stroke={tick === yMin ? '#581c87' : '#f0abfc'}
                  strokeWidth={tick === yMin ? 2.2 : 1}
                />
                <text
                  x={padLeft - 10}
                  y={sy + 4}
                  textAnchor="end"
                  fontSize="11.5"
                  fontWeight="700"
                  fill="#4a044e"
                >
                  {tick}
                </text>
              </g>
            )
          })}

          {/* Vertical X grid lines & category labels */}
          {categories.map((cat, idx) => {
            const sx = xForIndex(idx)
            return (
              <g key={`xc-${cat}`}>
                <line
                  x1={sx}
                  y1={padTop}
                  x2={sx}
                  y2={padTop + chartH}
                  stroke={idx === 0 ? '#581c87' : '#f5d0fe'}
                  strokeWidth={idx === 0 ? 2.2 : 1}
                />
                <text
                  x={sx}
                  y={padTop + chartH + 22}
                  textAnchor="middle"
                  fontSize="11.5"
                  fontWeight="700"
                  fill="#4a044e"
                >
                  {cat}
                </text>
              </g>
            )
          })}

          {/* Axis titles */}
          <text
            x={padLeft + chartW / 2}
            y={height - 8}
            textAnchor="middle"
            fontSize="12"
            fontWeight="800"
            fill="#86198f"
          >
            {xAxisLabel}
          </text>
          <text
            x={padLeft + 10}
            y={padTop - 12}
            textAnchor="middle"
            fontSize="11.5"
            fontWeight="800"
            fill="#86198f"
          >
            {yAxisLabel}
          </text>

          {/* Line path */}
          <polyline
            fill="none"
            stroke="#db2777"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={polylinePoints}
          />

          {/* Data points */}
          {values.map((v, idx) => {
            const sx = xForIndex(idx)
            const sy = yForValue(v)
            return (
              <g key={`pt-${idx}`}>
                <circle
                  cx={sx}
                  cy={sy}
                  r={5.5}
                  fill="#a21caf"
                  stroke="#ffffff"
                  strokeWidth="2"
                />
              </g>
            )
          })}
        </svg>
      </div>

      {/* Optional accompanying table */}
      {table && (
        <div className="mt-3 overflow-x-auto">
          <table className="mx-auto w-full max-w-md border-collapse overflow-hidden rounded-xl border border-pink-200 text-xs sm:text-sm">
            <thead>
              <tr className="bg-pink-100/80 text-purple-950">
                <th className="border border-pink-200 px-3 py-2 text-right font-bold">
                  {table.headers[0]}
                </th>
                <th className="border border-pink-200 px-3 py-2 text-center font-bold">
                  {table.headers[1]}
                </th>
              </tr>
            </thead>
            <tbody>
              {table.rows.map(row => (
                <tr
                  key={row.label}
                  className={row.isMissing ? 'bg-amber-50/70 font-bold text-pink-800' : 'bg-white'}
                >
                  <td className="border border-pink-200 px-3 py-1.5 font-medium">{row.label}</td>
                  <td className="border border-pink-200 px-3 py-1.5 text-center" dir="ltr">
                    {row.valueDisplay}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

/* ────────────────────── 3. Number Line Visual ────────────────────── */
const NumberLineVisual: React.FC<{ config: NumberLineVisualConfig }> = ({ config }) => {
  const { min, max, minorStep, midpoint, targetValue, targetLabel, caption } = config

  const width = 460
  const height = 115
  const padX = 42
  const lineY = 62
  const lineLen = width - padX * 2

  const xForVal = (v: number) => padX + ((v - min) / (max - min)) * lineLen

  const ticks: number[] = []
  for (let v = min; v <= max; v += minorStep) {
    ticks.push(v)
  }

  return (
    <div className="my-4 rounded-2xl border-2 border-pink-200/80 bg-white p-3 sm:p-4 shadow-xs">
      <div className="w-full overflow-x-auto flex justify-center" dir="ltr">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full max-w-[460px] h-auto select-none"
          role="img"
          aria-label={caption}
        >
          {/* Main horizontal line */}
          <line
            x1={padX - 14}
            y1={lineY}
            x2={width - padX + 14}
            y2={lineY}
            stroke="#581c87"
            strokeWidth="3"
          />

          {/* Ticks */}
          {ticks.map(t => {
            const sx = xForVal(t)
            const isEndpoint = t === min || t === max
            const isMid = t === midpoint
            return (
              <g key={t}>
                <line
                  x1={sx}
                  y1={lineY - (isEndpoint || isMid ? 12 : 7)}
                  x2={sx}
                  y2={lineY + (isEndpoint || isMid ? 12 : 7)}
                  stroke={isMid ? '#db2777' : '#581c87'}
                  strokeWidth={isEndpoint || isMid ? 2.6 : 1.5}
                />
                {(isEndpoint || isMid) && (
                  <text
                    x={sx}
                    y={lineY + 30}
                    textAnchor="middle"
                    fontSize="12.5"
                    fontWeight="800"
                    fill={isMid ? '#be185d' : '#4a044e'}
                  >
                    {isMid ? 'المنتصف' : t.toLocaleString('en-US')}
                  </text>
                )}
              </g>
            )
          })}

          {/* Target Value Marker */}
          <g>
            <line
              x1={xForVal(targetValue)}
              y1={lineY - 24}
              x2={xForVal(targetValue)}
              y2={lineY}
              stroke="#9333ea"
              strokeWidth="2.5"
            />
            <circle
              cx={xForVal(targetValue)}
              cy={lineY}
              r={6.5}
              fill="#db2777"
              stroke="#ffffff"
              strokeWidth="2"
            />
            <rect
              x={xForVal(targetValue) - 28}
              y={lineY - 46}
              width={56}
              height={20}
              rx="6"
              fill="#9333ea"
            />
            <text
              x={xForVal(targetValue)}
              y={lineY - 32}
              textAnchor="middle"
              fontSize="12"
              fontWeight="800"
              fill="#ffffff"
            >
              {targetLabel ?? targetValue.toLocaleString('en-US')}
            </text>
          </g>
        </svg>
      </div>
      <p className="mt-1 text-center text-xs font-medium text-purple-800">{caption}</p>
    </div>
  )
}

/* ────────────────────── 4. Protractor Visual (Read & Interactive Construct) ────────────────────── */
const ProtractorVisual: React.FC<{
  config: ProtractorVisualConfig
  answers: StudentAnswersMap
  onUpdateAnswer: (branchId: string, value: string) => void
}> = ({ config, answers, onUpdateAnswer }) => {
  const {
    mode,
    vertexLabel,
    baseRayLabel,
    secondRayLabel,
    targetDegree,
    interactiveBranchId,
    caption,
  } = config

  const svgRef = React.useRef<SVGSVGElement | null>(null)
  const [isDragging, setIsDragging] = React.useState(false)

  const currentDegree = React.useMemo(() => {
    if (mode === 'read') return targetDegree
    if (!interactiveBranchId) return 60
    const parsed = parseNaturalNumber(answers[interactiveBranchId] ?? '')
    return parsed !== null && parsed >= 0 && parsed <= 180 ? parsed : 60
  }, [mode, targetDegree, interactiveBranchId, answers])

  const hasUserSetAngle =
    mode === 'construct' && interactiveBranchId
      ? Boolean((answers[interactiveBranchId] ?? '').trim())
      : true

  const cx = 220
  const cy = 205
  const outerR = 165
  const innerR = 118
  const rayLen = 152

  const degToRad = (deg: number) => (deg * Math.PI) / 180
  const pointAtPolar = (r: number, degFromRight: number) => ({
    x: cx + r * Math.cos(degToRad(degFromRight)),
    y: cy - r * Math.sin(degToRad(degFromRight)),
  })

  const updateAngleFromPointer = (clientX: number, clientY: number) => {
    if (mode !== 'construct' || !interactiveBranchId || !svgRef.current) return
    const rect = svgRef.current.getBoundingClientRect()
    const scaleX = 440 / rect.width
    const scaleY = 245 / rect.height
    const sx = (clientX - rect.left) * scaleX
    const sy = (clientY - rect.top) * scaleY

    const dx = sx - cx
    const dy = cy - sy
    let angle = Math.atan2(dy, dx) * (180 / Math.PI)
    if (angle < 0) angle = dy >= 0 ? 180 : angle > -90 ? 0 : 180
    const snapped = Math.max(0, Math.min(180, Math.round(angle / 5) * 5))
    onUpdateAnswer(interactiveBranchId, String(snapped))
  }

  const secondRayEnd = pointAtPolar(rayLen, currentDegree)
  const arcRadius = 42
  const arcEnd = pointAtPolar(arcRadius, currentDegree)
  const largeArcFlag = currentDegree > 180 ? 1 : 0

  return (
    <div className="my-4 rounded-2xl border-2 border-pink-200/80 bg-white p-3 sm:p-4 shadow-xs">
      <div className="w-full overflow-x-auto flex justify-center" dir="ltr">
        <svg
          ref={svgRef}
          viewBox="0 0 440 245"
          className={`w-full max-w-[440px] h-auto select-none ${
            mode === 'construct' ? 'cursor-pointer touch-none' : ''
          }`}
          onPointerDown={e => {
            if (mode === 'construct') {
              setIsDragging(true)
              updateAngleFromPointer(e.clientX, e.clientY)
            }
          }}
          onPointerMove={e => {
            if (mode === 'construct' && isDragging) {
              updateAngleFromPointer(e.clientX, e.clientY)
            }
          }}
          onPointerUp={() => setIsDragging(false)}
          onPointerLeave={() => setIsDragging(false)}
          role="img"
          aria-label={caption}
        >
          {/* Protractor translucent body */}
          <path
            d={`M ${cx - outerR} ${cy} A ${outerR} ${outerR} 0 0 1 ${cx + outerR} ${cy} Z`}
            fill="rgba(250, 232, 255, 0.55)"
            stroke="#9333ea"
            strokeWidth="2.2"
          />
          <path
            d={`M ${cx - 65} ${cy} A 65 65 0 0 1 ${cx + 65} ${cy} Z`}
            fill="rgba(255, 255, 255, 0.85)"
            stroke="#d8b4fe"
            strokeWidth="1.4"
          />

          {/* Degree ticks from 0 to 180 */}
          {Array.from({ length: 37 }, (_, i) => i * 5).map(deg => {
            const isMajor = deg % 10 === 0
            const pOuter = pointAtPolar(outerR, deg)
            const pTick = pointAtPolar(outerR - (isMajor ? 12 : 6), deg)
            const pInnerLabel = pointAtPolar(innerR, deg)
            const pOuterLabel = pointAtPolar(outerR - 23, deg)

            return (
              <g
                key={deg}
                className={mode === 'construct' ? 'cursor-pointer' : ''}
                onClick={e => {
                  e.stopPropagation()
                  if (mode === 'construct' && interactiveBranchId) {
                    onUpdateAnswer(interactiveBranchId, String(deg))
                  }
                }}
              >
                <line
                  x1={pOuter.x}
                  y1={pOuter.y}
                  x2={pTick.x}
                  y2={pTick.y}
                  stroke={isMajor ? '#581c87' : '#a855f7'}
                  strokeWidth={isMajor ? 1.8 : 1}
                />
                {isMajor && (
                  <>
                    {/* Inner Scale (0° on the Right -> 180° on the Left) */}
                    <text
                      x={pInnerLabel.x}
                      y={pInnerLabel.y + 3.5}
                      textAnchor="middle"
                      fontSize="9.5"
                      fontWeight="800"
                      fill="#be185d"
                    >
                      {deg}
                    </text>
                    {/* Outer Scale (0° on the Left -> 180° on the Right) */}
                    <text
                      x={pOuterLabel.x}
                      y={pOuterLabel.y + 3.5}
                      textAnchor="middle"
                      fontSize="8.5"
                      fontWeight="600"
                      fill="#64748b"
                    >
                      {180 - deg}
                    </text>
                  </>
                )}
              </g>
            )
          })}

          {/* Angle Arc */}
          {currentDegree > 0 && (
            <path
              d={`M ${cx + arcRadius} ${cy} A ${arcRadius} ${arcRadius} 0 ${largeArcFlag} 0 ${arcEnd.x} ${arcEnd.y}`}
              fill="none"
              stroke="#db2777"
              strokeWidth="2.5"
            />
          )}

          {/* Base Ray [BC) or [OX) along 0° to the right */}
          <line
            x1={cx}
            y1={cy}
            x2={cx + rayLen}
            y2={cy}
            stroke="#581c87"
            strokeWidth="3.2"
          />
          <circle cx={cx + rayLen - 10} cy={cy} r={4} fill="#581c87" />
          <text
            x={cx + rayLen - 6}
            y={cy + 19}
            fontSize="13"
            fontWeight="800"
            fill="#4a044e"
          >
            {baseRayLabel}
          </text>

          {/* Second Ray [BA) or [OY) */}
          <line
            x1={cx}
            y1={cy}
            x2={secondRayEnd.x}
            y2={secondRayEnd.y}
            stroke="#db2777"
            strokeWidth="3.2"
          />
          <circle
            cx={secondRayEnd.x}
            cy={secondRayEnd.y}
            r={mode === 'construct' ? 7.5 : 4.5}
            fill="#db2777"
            stroke="#ffffff"
            strokeWidth="2"
          />
          <text
            x={secondRayEnd.x + (currentDegree > 90 ? -14 : 12)}
            y={secondRayEnd.y - 8}
            fontSize="13"
            fontWeight="800"
            fill="#be185d"
          >
            {secondRayLabel}
          </text>

          {/* Center Vertex */}
          <circle cx={cx} cy={cy} r={5.5} fill="#be185d" stroke="#ffffff" strokeWidth="2" />
          <text x={cx} y={cy + 21} textAnchor="middle" fontSize="13.5" fontWeight="800" fill="#581c87">
            {vertexLabel}
          </text>
        </svg>
      </div>

      {/* Interactive Protractor Fine Controls for Mobile */}
      {mode === 'construct' && interactiveBranchId && (
        <div className="mt-2 flex flex-wrap items-center justify-center gap-2 rounded-xl bg-pink-50/80 p-2.5 border border-pink-200">
          <span className="text-xs font-bold text-purple-900">
            تحريك الشعاع [{vertexLabel}{secondRayLabel}):
          </span>
          <div className="flex items-center gap-1.5" dir="ltr">
            {[
              { label: '-10°', delta: -10 },
              { label: '-5°', delta: -5 },
              { label: '+5°', delta: 5 },
              { label: '+10°', delta: 10 },
            ].map(btn => (
              <button
                key={btn.label}
                type="button"
                onClick={() => {
                  const next = Math.max(0, Math.min(180, currentDegree + btn.delta))
                  onUpdateAnswer(interactiveBranchId, String(next))
                }}
                className="rounded-lg border border-purple-300 bg-white px-2.5 py-1 text-xs font-bold text-purple-900 hover:bg-purple-100 active:scale-95 transition"
              >
                {btn.label}
              </button>
            ))}
          </div>
          <span className="rounded-full bg-pink-600 px-3 py-0.5 text-xs font-bold text-white" dir="ltr">
            {hasUserSetAngle ? `${currentDegree}°` : 'انقري أو حرّكي الشعاع'}
          </span>
        </div>
      )}

      <p className="mt-1.5 text-center text-xs font-medium text-purple-800">{caption}</p>
    </div>
  )
}

/* ────────────────────── 5. Accurate Geometry Figures (SVG) ────────────────────── */
const GeometryFigureVisual: React.FC<{ config: GeometryFigureVisualConfig }> = ({ config }) => {
  const { figureId, caption } = config

  return (
    <div className="my-4 rounded-2xl border-2 border-pink-200/80 bg-white p-3 sm:p-4 shadow-xs">
      <div className="w-full overflow-x-auto flex justify-center" dir="ltr">
        {figureId === 'angle-parts-bac' && (
          <svg viewBox="0 0 340 180" className="w-full max-w-[340px] h-auto" role="img" aria-label={caption}>
            {/* Angle BAC with X inside and D outside */}
            <path d="M 95 140 A 38 38 0 0 0 82 106" fill="rgba(236,72,153,0.18)" stroke="#db2777" strokeWidth="2" />
            <line x1="60" y1="140" x2="275" y2="140" stroke="#581c87" strokeWidth="3.2" strokeLinecap="round" />
            <line x1="60" y1="140" x2="215" y2="35" stroke="#581c87" strokeWidth="3.2" strokeLinecap="round" />
            <circle cx="60" cy="140" r="5" fill="#db2777" />
            <circle cx="240" cy="140" r="4.5" fill="#581c87" />
            <circle cx="190" cy="52" r="4.5" fill="#581c87" />
            <text x="42" y="152" fontSize="15" fontWeight="800" fill="#be185d">A</text>
            <text x="236" y="162" fontSize="14" fontWeight="800" fill="#4a044e">C</text>
            <text x="172" y="45" fontSize="14" fontWeight="800" fill="#4a044e">B</text>
            {/* Point X inside */}
            <circle cx="165" cy="105" r="5" fill="#9333ea" />
            <text x="176" y="110" fontSize="14" fontWeight="800" fill="#7e22ce">X</text>
            {/* Point D outside */}
            <circle cx="95" cy="48" r="5" fill="#64748b" />
            <text x="76" y="46" fontSize="14" fontWeight="800" fill="#475569">D</text>
          </svg>
        )}

        {figureId === 'four-angles-classify' && (
          <svg viewBox="0 0 460 150" className="w-full max-w-[460px] h-auto" role="img" aria-label={caption}>
            {/* (1) 45° Acute */}
            <g transform="translate(15, 15)">
              <rect x="0" y="0" width="98" height="120" rx="10" fill="#fdf4ff" stroke="#f0abfc" />
              <line x1="20" y1="88" x2="82" y2="88" stroke="#581c87" strokeWidth="2.8" />
              <line x1="20" y1="88" x2="68" y2="40" stroke="#db2777" strokeWidth="2.8" />
              <path d="M 42 88 A 22 22 0 0 0 36 72" fill="none" stroke="#9333ea" strokeWidth="1.8" />
              <text x="49" y="75" fontSize="11" fontWeight="800" fill="#86198f">45°</text>
              <text x="49" y="110" textAnchor="middle" fontSize="12" fontWeight="800" fill="#4a044e">الشكل (1)</text>
            </g>
            {/* (2) 90° Right */}
            <g transform="translate(125, 15)">
              <rect x="0" y="0" width="98" height="120" rx="10" fill="#fdf4ff" stroke="#f0abfc" />
              <line x1="26" y1="88" x2="82" y2="88" stroke="#581c87" strokeWidth="2.8" />
              <line x1="26" y1="88" x2="26" y2="30" stroke="#db2777" strokeWidth="2.8" />
              <rect x="26" y="74" width="14" height="14" fill="none" stroke="#9333ea" strokeWidth="1.8" />
              <text x="52" y="70" fontSize="11" fontWeight="800" fill="#86198f">90°</text>
              <text x="49" y="110" textAnchor="middle" fontSize="12" fontWeight="800" fill="#4a044e">الشكل (2)</text>
            </g>
            {/* (3) 135° Obtuse */}
            <g transform="translate(235, 15)">
              <rect x="0" y="0" width="98" height="120" rx="10" fill="#fdf4ff" stroke="#f0abfc" />
              <line x1="46" y1="88" x2="88" y2="88" stroke="#581c87" strokeWidth="2.8" />
              <line x1="46" y1="88" x2="14" y2="42" stroke="#db2777" strokeWidth="2.8" />
              <path d="M 64 88 A 18 18 0 0 0 35 73" fill="none" stroke="#9333ea" strokeWidth="1.8" />
              <text x="52" y="68" fontSize="11" fontWeight="800" fill="#86198f">135°</text>
              <text x="49" y="110" textAnchor="middle" fontSize="12" fontWeight="800" fill="#4a044e">الشكل (3)</text>
            </g>
            {/* (4) 180° Straight */}
            <g transform="translate(345, 15)">
              <rect x="0" y="0" width="98" height="120" rx="10" fill="#fdf4ff" stroke="#f0abfc" />
              <line x1="12" y1="78" x2="86" y2="78" stroke="#581c87" strokeWidth="2.8" />
              <circle cx="49" cy="78" r="4" fill="#db2777" />
              <path d="M 67 78 A 18 18 0 0 0 31 78" fill="none" stroke="#9333ea" strokeWidth="1.8" />
              <text x="49" y="55" textAnchor="middle" fontSize="11" fontWeight="800" fill="#86198f">180°</text>
              <text x="49" y="110" textAnchor="middle" fontSize="12" fontWeight="800" fill="#4a044e">الشكل (4)</text>
            </g>
          </svg>
        )}

        {figureId === 'three-quadrilaterals-p1' && (
          <svg viewBox="0 0 460 165" className="w-full max-w-[460px] h-auto" role="img" aria-label={caption}>
            {/* Fig 1: Parallelogram ABCD with diagonal BD and parallel arrows */}
            <g transform="translate(10, 12)">
              <rect x="0" y="0" width="142" height="140" rx="10" fill="#fdf4ff" stroke="#f0abfc" />
              <polygon points="36,34 118,34 98,96 16,96" fill="rgba(236,72,153,0.12)" stroke="#581c87" strokeWidth="2.4" />
              {/* Diagonal BD */}
              <line x1="118" y1="34" x2="16" y2="96" stroke="#db2777" strokeWidth="2" strokeDasharray="4 3" />
              {/* Parallel arrows on AB & DC */}
              <path d="M 73 29 L 80 34 L 73 39" fill="none" stroke="#be185d" strokeWidth="2" />
              <path d="M 53 91 L 60 96 L 53 101" fill="none" stroke="#be185d" strokeWidth="2" />
              {/* Double parallel arrows on AD & BC */}
              <path d="M 22 68 L 28 61 L 31 69" fill="none" stroke="#7e22ce" strokeWidth="1.8" />
              <path d="M 104 68 L 110 61 L 113 69" fill="none" stroke="#7e22ce" strokeWidth="1.8" />
              <text x="30" y="28" fontSize="11.5" fontWeight="800" fill="#4a044e">A</text>
              <text x="122" y="28" fontSize="11.5" fontWeight="800" fill="#4a044e">B</text>
              <text x="103" y="109" fontSize="11.5" fontWeight="800" fill="#4a044e">C</text>
              <text x="8" y="109" fontSize="11.5" fontWeight="800" fill="#4a044e">D</text>
              <text x="71" y="130" textAnchor="middle" fontSize="12" fontWeight="800" fill="#581c87">الشكل (1)</text>
            </g>

            {/* Fig 2: Trapezoid EFGH (only 1 pair of parallel sides) */}
            <g transform="translate(160, 12)">
              <rect x="0" y="0" width="142" height="140" rx="10" fill="#fdf4ff" stroke="#f0abfc" />
              <polygon points="44,34 98,34 122,96 20,96" fill="rgba(168,85,247,0.1)" stroke="#581c87" strokeWidth="2.4" />
              <path d="M 68 29 L 75 34 L 68 39" fill="none" stroke="#be185d" strokeWidth="2" />
              <path d="M 68 91 L 75 96 L 68 101" fill="none" stroke="#be185d" strokeWidth="2" />
              <text x="36" y="28" fontSize="11.5" fontWeight="800" fill="#4a044e">E</text>
              <text x="102" y="28" fontSize="11.5" fontWeight="800" fill="#4a044e">F</text>
              <text x="125" y="108" fontSize="11.5" fontWeight="800" fill="#4a044e">G</text>
              <text x="10" y="108" fontSize="11.5" fontWeight="800" fill="#4a044e">H</text>
              <text x="71" y="130" textAnchor="middle" fontSize="12" fontWeight="800" fill="#581c87">الشكل (2)</text>
            </g>

            {/* Fig 3: General Quadrilateral KLMN (no parallel sides) */}
            <g transform="translate(310, 12)">
              <rect x="0" y="0" width="140" height="140" rx="10" fill="#fdf4ff" stroke="#f0abfc" />
              <polygon points="28,42 108,28 118,98 22,90" fill="rgba(100,116,139,0.1)" stroke="#581c87" strokeWidth="2.4" />
              <text x="18" y="38" fontSize="11.5" fontWeight="800" fill="#4a044e">K</text>
              <text x="112" y="26" fontSize="11.5" fontWeight="800" fill="#4a044e">L</text>
              <text x="122" y="108" fontSize="11.5" fontWeight="800" fill="#4a044e">M</text>
              <text x="12" y="104" fontSize="11.5" fontWeight="800" fill="#4a044e">N</text>
              <text x="70" y="130" textAnchor="middle" fontSize="12" fontWeight="800" fill="#581c87">الشكل (3)</text>
            </g>
          </svg>
        )}

        {figureId === 'parallelogram-wxyz' && (
          <svg viewBox="0 0 360 190" className="w-full max-w-[360px] h-auto" role="img" aria-label={caption}>
            {/* Parallelogram WXYZ: W(95,40), X(285,40), Y(240,145), Z(50,145) */}
            <polygon
              points="95,40 285,40 240,145 50,145"
              fill="rgba(236,72,153,0.12)"
              stroke="#581c87"
              strokeWidth="2.8"
            />
            {/* Angle arcs at W (110°) and Z (70°) */}
            <path d="M 122 40 A 27 27 0 0 1 84 65" fill="rgba(168,85,247,0.22)" stroke="#9333ea" strokeWidth="2" />
            <path d="M 78 145 A 28 28 0 0 0 61 119" fill="rgba(219,39,119,0.22)" stroke="#db2777" strokeWidth="2" />
            {/* Vertex labels */}
            <text x="80" y="32" fontSize="14" fontWeight="800" fill="#4a044e">W</text>
            <text x="292" y="32" fontSize="14" fontWeight="800" fill="#4a044e">X</text>
            <text x="248" y="162" fontSize="14" fontWeight="800" fill="#4a044e">Y</text>
            <text x="32" y="162" fontSize="14" fontWeight="800" fill="#4a044e">Z</text>
            {/* Side lengths */}
            <text x="42" y="92" fontSize="13" fontWeight="800" fill="#be185d">6 cm</text>
            <text x="145" y="166" textAnchor="middle" fontSize="13" fontWeight="800" fill="#7e22ce">4 cm</text>
            {/* Angles */}
            <text x="112" y="66" fontSize="12.5" fontWeight="800" fill="#7e22ce">110°</text>
            <text x="82" y="136" fontSize="12.5" fontWeight="800" fill="#be185d">70°</text>
          </svg>
        )}

        {figureId === 'three-shapes-rhombus-check' && (
          <svg viewBox="0 0 460 165" className="w-full max-w-[460px] h-auto" role="img" aria-label={caption}>
            {/* Fig 1: Parallelogram 5cm & 3cm */}
            <g transform="translate(10, 12)">
              <rect x="0" y="0" width="142" height="140" rx="10" fill="#fdf4ff" stroke="#f0abfc" />
              <polygon points="38,40 124,40 104,96 18,96" fill="rgba(168,85,247,0.1)" stroke="#581c87" strokeWidth="2.4" />
              <text x="81" y="32" textAnchor="middle" fontSize="11.5" fontWeight="800" fill="#be185d">5 cm</text>
              <text x="122" y="72" fontSize="11.5" fontWeight="800" fill="#7e22ce">3 cm</text>
              <text x="71" y="130" textAnchor="middle" fontSize="12" fontWeight="800" fill="#581c87">الشكل (1)</text>
            </g>
            {/* Fig 2: Rhombus (Parallelogram with adjacent sides 4cm & 4cm) */}
            <g transform="translate(160, 12)">
              <rect x="0" y="0" width="142" height="140" rx="10" fill="#fdf4ff" stroke="#f0abfc" />
              <polygon points="46,34 114,34 94,96 26,96" fill="rgba(236,72,153,0.16)" stroke="#581c87" strokeWidth="2.4" />
              {/* Parallel arrows */}
              <path d="M 78 29 L 84 34 L 78 39" fill="none" stroke="#be185d" strokeWidth="1.8" />
              <path d="M 58 91 L 64 96 L 58 101" fill="none" stroke="#be185d" strokeWidth="1.8" />
              <text x="80" y="25" textAnchor="middle" fontSize="11.5" fontWeight="800" fill="#be185d">4 cm</text>
              <text x="115" y="70" fontSize="11.5" fontWeight="800" fill="#be185d">4 cm</text>
              <text x="71" y="130" textAnchor="middle" fontSize="12" fontWeight="800" fill="#581c87">الشكل (2)</text>
            </g>
            {/* Fig 3: Kite (not a parallelogram) */}
            <g transform="translate(310, 12)">
              <rect x="0" y="0" width="140" height="140" rx="10" fill="#fdf4ff" stroke="#f0abfc" />
              <polygon points="70,22 112,56 70,108 28,56" fill="rgba(100,116,139,0.1)" stroke="#581c87" strokeWidth="2.4" />
              <text x="98" y="36" fontSize="11" fontWeight="800" fill="#475569">3 cm</text>
              <text x="102" y="90" fontSize="11" fontWeight="800" fill="#475569">5 cm</text>
              <text x="70" y="130" textAnchor="middle" fontSize="12" fontWeight="800" fill="#581c87">الشكل (3)</text>
            </g>
          </svg>
        )}

        {figureId === 'rhombus-abcd-props' && (
          <svg viewBox="0 0 360 190" className="w-full max-w-[360px] h-auto" role="img" aria-label={caption}>
            {/* Rhombus ABCD with AB=5cm, ∠A=55°, ∠B=125° */}
            <polygon
              points="75,145 205,145 265,45 135,45"
              fill="rgba(236,72,153,0.14)"
              stroke="#581c87"
              strokeWidth="2.8"
            />
            {/* Equal side tick marks */}
            <line x1="140" y1="139" x2="140" y2="151" stroke="#db2777" strokeWidth="2.4" />
            <line x1="200" y1="39" x2="200" y2="51" stroke="#db2777" strokeWidth="2.4" />
            <line x1="99" y1="92" x2="111" y2="98" stroke="#db2777" strokeWidth="2.4" />
            <line x1="229" y1="92" x2="241" y2="98" stroke="#db2777" strokeWidth="2.4" />

            {/* Labels */}
            <text x="56" y="156" fontSize="14" fontWeight="800" fill="#4a044e">A</text>
            <text x="214" y="156" fontSize="14" fontWeight="800" fill="#4a044e">B</text>
            <text x="274" y="46" fontSize="14" fontWeight="800" fill="#4a044e">C</text>
            <text x="115" y="46" fontSize="14" fontWeight="800" fill="#4a044e">D</text>

            <text x="140" y="168" textAnchor="middle" fontSize="13" fontWeight="800" fill="#be185d">5 cm</text>
            <text x="98" y="135" fontSize="12.5" fontWeight="800" fill="#be185d">55°</text>
            <text x="172" y="135" fontSize="12.5" fontWeight="800" fill="#7e22ce">125°</text>
          </svg>
        )}

        {figureId === 'composite-rhombus-parallelogram' && (
          <svg viewBox="0 0 420 190" className="w-full max-w-[420px] h-auto" role="img" aria-label={caption}>
            {/* Rhombus AFED: A(75,45), F(185,45), E(150,145), D(40,145) */}
            <polygon
              points="75,45 185,45 150,145 40,145"
              fill="rgba(236,72,153,0.16)"
              stroke="#581c87"
              strokeWidth="2.6"
            />
            {/* Parallelogram FBCE: F(185,45), B(355,45), C(320,145), E(150,145) */}
            <polygon
              points="185,45 355,45 320,145 150,145"
              fill="rgba(168,85,247,0.14)"
              stroke="#581c87"
              strokeWidth="2.6"
            />
            {/* Shared segment FE */}
            <line x1="185" y1="45" x2="150" y2="145" stroke="#db2777" strokeWidth="2.8" strokeDasharray="5 3" />

            {/* Vertex labels */}
            <text x="64" y="34" fontSize="14" fontWeight="800" fill="#4a044e">A</text>
            <text x="182" y="34" fontSize="14" fontWeight="800" fill="#be185d">F</text>
            <text x="360" y="34" fontSize="14" fontWeight="800" fill="#4a044e">B</text>
            <text x="24" y="156" fontSize="14" fontWeight="800" fill="#4a044e">D</text>
            <text x="145" y="165" fontSize="14" fontWeight="800" fill="#be185d">E</text>
            <text x="328" y="156" fontSize="14" fontWeight="800" fill="#4a044e">C</text>

            {/* Given lengths */}
            <text x="32" y="95" fontSize="13" fontWeight="800" fill="#be185d">4 cm</text>
            <text x="270" y="34" textAnchor="middle" fontSize="13" fontWeight="800" fill="#7e22ce">6 cm</text>
            <text x="115" y="102" textAnchor="middle" fontSize="11.5" fontWeight="700" fill="#9d174d">معيّن</text>
            <text x="255" y="102" textAnchor="middle" fontSize="11.5" fontWeight="700" fill="#6b21a8">متوازي أضلاع</text>
          </svg>
        )}
      </div>
      <p className="mt-2 text-center text-xs font-medium text-purple-800">{caption}</p>
    </div>
  )
}
