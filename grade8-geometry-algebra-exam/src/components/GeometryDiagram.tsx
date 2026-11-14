import React from 'react';
import { DiagramData } from '../types/exam';

interface GeometryDiagramProps {
  diagram: DiagramData;
  className?: string;
}

export const GeometryDiagram: React.FC<GeometryDiagramProps> = ({ diagram, className = '' }) => {
  const { viewBox, coordinates, segments, angles, notes, title } = diagram;

  return (
    <div className={`rounded-2xl border border-teal-500/20 bg-slate-900/80 p-4 shadow-xl backdrop-blur-md ${className}`}>
      <div className="mb-2 flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 rounded-full bg-teal-400 shadow-sm shadow-teal-400/50" />
          <span className="text-xs font-semibold text-teal-300">{title}</span>
        </div>
        <span className="rounded bg-teal-950/80 px-2 py-0.5 text-[11px] font-mono text-teal-400 border border-teal-800/50" dir="ltr">
          SVG Exact Coordinates
        </span>
      </div>

      <div className="relative flex justify-center overflow-hidden rounded-xl bg-[#070b14] p-2" dir="ltr">
        <svg
          viewBox={viewBox}
          className="h-auto max-h-[300px] w-full max-w-[500px] select-none"
          style={{ direction: 'ltr', transform: 'none' }}
        >
          <defs>
            {/* Grid Pattern */}
            <pattern id={`grid-${diagram.id}`} width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1e293b" strokeWidth="0.7" opacity="0.6" />
            </pattern>

            {/* Vector Arrowhead Marker */}
            <marker
              id={`arrow-${diagram.id}`}
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 9 5 L 0 9 z" fill="#818cf8" />
            </marker>

            {/* Green Vector Arrowhead */}
            <marker
              id={`arrow-green-${diagram.id}`}
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 9 5 L 0 9 z" fill="#10b981" />
            </marker>
          </defs>

          {/* Grid Background */}
          {diagram.grid && (
            <rect width="100%" height="100%" fill={`url(#grid-${diagram.id})`} />
          )}

          {/* Angles */}
          {angles?.map((angle, idx) => {
            const v = coordinates[angle.vertex];
            const p1 = coordinates[angle.p1];
            const p2 = coordinates[angle.p2];
            if (!v || !p1 || !p2) return null;

            if (angle.isRight) {
              // Right angle mark (20px box)
              const size = 14;
              // Compute unit vectors
              const dx1 = (p1.x - v.x) / Math.hypot(p1.x - v.x, p1.y - v.y);
              const dy1 = (p1.y - v.y) / Math.hypot(p1.x - v.x, p1.y - v.y);
              const dx2 = (p2.x - v.x) / Math.hypot(p2.x - v.x, p2.y - v.y);
              const dy2 = (p2.y - v.y) / Math.hypot(p2.x - v.x, p2.y - v.y);

              const pA = { x: v.x + dx1 * size, y: v.y + dy1 * size };
              const pCorner = { x: v.x + (dx1 + dx2) * size, y: v.y + (dy1 + dy2) * size };
              const pB = { x: v.x + dx2 * size, y: v.y + dy2 * size };

              return (
                <g key={`angle-${idx}`}>
                  <path
                    d={`M ${pA.x} ${pA.y} L ${pCorner.x} ${pCorner.y} L ${pB.x} ${pB.y}`}
                    fill="none"
                    stroke="#ec4899"
                    strokeWidth="1.8"
                  />
                  {angle.label && (
                    <text
                      x={pCorner.x + 7}
                      y={pCorner.y - 5}
                      fill="#ec4899"
                      fontSize="10"
                      fontWeight="bold"
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontFamily="JetBrains Mono, monospace"
                    >
                      {angle.label}
                    </text>
                  )}
                </g>
              );
            } else {
              // Arc angle
              const r = angle.arcRadius || 18;
              const angle1 = Math.atan2(p1.y - v.y, p1.x - v.x);
              const angle2 = Math.atan2(p2.y - v.y, p2.x - v.x);
              const arcX1 = v.x + r * Math.cos(angle1);
              const arcY1 = v.y + r * Math.sin(angle1);
              const arcX2 = v.x + r * Math.cos(angle2);
              const arcY2 = v.y + r * Math.sin(angle2);

              // نُطبّع فرق الزاويتين إلى المدى (-180°, 180°] ليكون القوس مرسوماً
              // بمركزه على رأس الزاوية (أعلام SVG 0/1 المصحّحة)، ويقع منتصف تسمية
              // القوس بجوار القوس فعلاً لا في الجهة المقابلة من الرأس.
              const TWO_PI = Math.PI * 2;
              const delta = (((angle2 - angle1 + Math.PI) % TWO_PI) + TWO_PI) % TWO_PI - Math.PI;
              const sweepFlag = delta < 0 ? 0 : 1;
              const midA = angle1 + delta / 2;
              const labelX = v.x + (r + 12) * Math.cos(midA);
              const labelY = v.y + (r + 12) * Math.sin(midA);

              return (
                <g key={`angle-${idx}`}>
                  <path
                    d={`M ${arcX1} ${arcY1} A ${r} ${r} 0 0 ${sweepFlag} ${arcX2} ${arcY2}`}
                    fill="rgba(245, 158, 11, 0.15)"
                    stroke="#f59e0b"
                    strokeWidth="1.8"
                  />
                  {angle.label && (
                    <text
                      x={labelX}
                      y={labelY}
                      fill="#f59e0b"
                      fontSize="10"
                      fontWeight="bold"
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontFamily="JetBrains Mono, monospace"
                    >
                      {angle.label}
                    </text>
                  )}
                </g>
              );
            }
          })}

          {/* Segments */}
          {segments.map((seg, idx) => {
            const pFrom = coordinates[seg.from];
            const pTo = coordinates[seg.to];
            if (!pFrom || !pTo) return null;

            const isVector = seg.style === 'vector';
            const isDashed = seg.style === 'dashed';
            const strokeColor = seg.color || '#38bdf8';

            const midX = (pFrom.x + pTo.x) / 2;
            const midY = (pFrom.y + pTo.y) / 2;

            // Offset normal for label
            const dx = pTo.x - pFrom.x;
            const dy = pTo.y - pFrom.y;
            const len = Math.hypot(dx, dy) || 1;
            const normX = -dy / len;
            const normY = dx / len;
            const labelX = midX + normX * 12;
            const labelY = midY + normY * 12;

            return (
              <g key={`seg-${idx}`}>
                <line
                  x1={pFrom.x}
                  y1={pFrom.y}
                  x2={pTo.x}
                  y2={pTo.y}
                  stroke={strokeColor}
                  strokeWidth={isVector ? '2.2' : '2'}
                  strokeDasharray={isDashed ? '5,4' : undefined}
                  markerEnd={isVector ? `url(#arrow-${diagram.id})` : undefined}
                />

                {/* Equal ticks */}
                {seg.tickCount && (
                  <g>
                    {Array.from({ length: seg.tickCount }).map((_, tIdx) => {
                      const offset = (tIdx - (seg.tickCount! - 1) / 2) * 5;
                      const tickCenterX = midX + (dx / len) * offset;
                      const tickCenterY = midY + (dy / len) * offset;
                      return (
                        <line
                          key={tIdx}
                          x1={tickCenterX - normX * 5}
                          y1={tickCenterY - normY * 5}
                          x2={tickCenterX + normX * 5}
                          y2={tickCenterY + normY * 5}
                          stroke={strokeColor}
                          strokeWidth="1.8"
                        />
                      );
                    })}
                  </g>
                )}

                {/* Segment text label */}
                {seg.label && (
                  <text
                    x={labelX}
                    y={labelY}
                    fill={strokeColor}
                    fontSize="11"
                    fontWeight="bold"
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontFamily="JetBrains Mono, monospace"
                  >
                    {seg.label}
                  </text>
                )}
              </g>
            );
          })}

          {/* Points & Labels */}
          {Object.entries(coordinates).map(([key, pt]) => {
            let labelOffsetX = 0;
            let labelOffsetY = -14;
            let anchor: 'start' | 'middle' | 'end' = 'middle';

            switch (pt.labelPos) {
              case 'top':
                labelOffsetY = -12;
                anchor = 'middle';
                break;
              case 'bottom':
                labelOffsetY = 16;
                anchor = 'middle';
                break;
              case 'left':
                labelOffsetX = -12;
                labelOffsetY = 4;
                anchor = 'end';
                break;
              case 'right':
                labelOffsetX = 12;
                labelOffsetY = 4;
                anchor = 'start';
                break;
              case 'top-left':
                labelOffsetX = -10;
                labelOffsetY = -10;
                anchor = 'end';
                break;
              case 'top-right':
                labelOffsetX = 10;
                labelOffsetY = -10;
                anchor = 'start';
                break;
              case 'bottom-left':
                labelOffsetX = -10;
                labelOffsetY = 14;
                anchor = 'end';
                break;
              case 'bottom-right':
                labelOffsetX = 10;
                labelOffsetY = 14;
                anchor = 'start';
                break;
            }

            return (
              <g key={`pt-${key}`}>
                <circle cx={pt.x} cy={pt.y} r="4.5" fill="#f8fafc" stroke="#0ea5e9" strokeWidth="2" />
                <circle cx={pt.x} cy={pt.y} r="2" fill="#0284c7" />
                <text
                  x={pt.x + labelOffsetX}
                  y={pt.y + labelOffsetY}
                  fill="#f1f5f9"
                  fontSize="12"
                  fontWeight="bold"
                  textAnchor={anchor}
                  dominantBaseline="central"
                  fontFamily="JetBrains Mono, monospace"
                >
                  {pt.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {notes && (
        <div className="mt-2 text-center text-xs text-slate-400">
          <span className="font-semibold text-teal-400">ملاحظة هندسية: </span>
          {notes}
        </div>
      )}
    </div>
  );
};
