interface Series {
  title: string
  labels: string[]
  values: number[]
  yMin: number
  yMax: number
  yStep: number
  xAxisLabel: string
  yAxisLabel: string
}

export function LineGraph({ data }: { data: Series }) {
  const W = 560
  const H = 340
  const padL = 56
  const padR = 20
  const padT = 20
  const padB = 64
  const plotW = W - padL - padR
  const plotH = H - padT - padB
  const n = data.labels.length
  const sx = (i: number) => padL + (plotW / (n - 1)) * i
  const sy = (v: number) => padT + plotH - ((v - data.yMin) / (data.yMax - data.yMin)) * plotH
  const ticks: number[] = []
  for (let v = data.yMin; v <= data.yMax; v += data.yStep) ticks.push(v)
  const path = data.values.map((v, i) => `${i === 0 ? 'M' : 'L'}${sx(i)},${sy(v)}`).join(' ')

  return (
    <div className="mx-auto w-full max-w-[600px]">
      <p className="mb-1 text-center text-base font-bold text-ink">{data.title}</p>
      <div className="scroll-x" dir="ltr">
        <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full min-w-[320px]" role="img" aria-label={data.title}>
          <rect width={W} height={H} rx={16} fill="#fbfeff" />
          {ticks.map((t) => (
            <g key={t}>
              <line x1={padL} y1={sy(t)} x2={W - padR} y2={sy(t)} stroke={t % 5 === 0 ? '#bfe3f5' : '#e3f3fb'} strokeWidth={1} />
              <text x={padL - 8} y={sy(t) + 4} textAnchor="end" fontSize={12} fill="#475569" fontWeight={600}>
                {t}
              </text>
            </g>
          ))}
          {data.labels.map((_, i) => (
            <line key={i} x1={sx(i)} y1={padT} x2={sx(i)} y2={padT + plotH} stroke="#e3f3fb" strokeWidth={1} />
          ))}
          <line x1={padL} y1={padT} x2={padL} y2={padT + plotH} stroke="#0a6fa3" strokeWidth={2} />
          <line x1={padL} y1={padT + plotH} x2={W - padR} y2={padT + plotH} stroke="#0a6fa3" strokeWidth={2} />
          <path d={path} fill="none" stroke="#f97316" strokeWidth={3.5} strokeLinejoin="round" strokeLinecap="round" />
          {data.values.map((v, i) => (
            <g key={i}>
              <circle cx={sx(i)} cy={sy(v)} r={6} fill="#fff" stroke="#ea580c" strokeWidth={3} />
              <text x={sx(i)} y={padT + plotH + 22} textAnchor="middle" fontSize={13} fill="#1e293b" fontWeight={700}>
                {data.labels[i]}
              </text>
            </g>
          ))}
          <text x={padL + plotW / 2} y={H - 14} textAnchor="middle" fontSize={13} fill="#0a6fa3" fontWeight={700}>
            {data.xAxisLabel}
          </text>
          <text
            x={14}
            y={padT + plotH / 2}
            textAnchor="middle"
            fontSize={13}
            fill="#0a6fa3"
            fontWeight={700}
            transform={`rotate(-90 14 ${padT + plotH / 2})`}
          >
            {data.yAxisLabel}
          </text>
        </svg>
      </div>
    </div>
  )
}
