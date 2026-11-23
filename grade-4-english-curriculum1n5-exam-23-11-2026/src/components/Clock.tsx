interface ClockProps {
  hour: number;
  minute: number;
  label: string;
}

/** Static analog exam clock drawn as SVG (not a real-time clock). */
export default function Clock({ hour, minute, label }: ClockProps) {
  const size = 150;
  const center = size / 2;
  const radius = 66;

  const minuteAngle = (minute / 60) * 360;
  const hourAngle = ((hour % 12) / 12) * 360 + (minute / 60) * 30;

  const hand = (angleDeg: number, length: number) => {
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    return {
      x: center + Math.cos(rad) * length,
      y: center + Math.sin(rad) * length,
    };
  };

  const hourHand = hand(hourAngle, 32);
  const minuteHand = hand(minuteAngle, 50);

  const ticks = Array.from({ length: 60 }, (_, i) => {
    const major = i % 5 === 0;
    const rad = ((i * 6 - 90) * Math.PI) / 180;
    const outer = radius - 3;
    const inner = radius - (major ? 11 : 6);
    return {
      x1: center + Math.cos(rad) * inner,
      y1: center + Math.sin(rad) * inner,
      x2: center + Math.cos(rad) * outer,
      y2: center + Math.sin(rad) * outer,
      major,
    };
  });

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={label}
      className="h-36 w-36 drop-shadow-sm sm:h-40 sm:w-40"
    >
      {/* face */}
      <circle cx={center} cy={center} r={radius} fill="#FFFDF6" stroke="#114B5F" strokeWidth="6" />
      {/* ticks */}
      {ticks.map((t, i) => (
        <line
          key={i}
          x1={t.x1}
          y1={t.y1}
          x2={t.x2}
          y2={t.y2}
          stroke={t.major ? '#114B5F' : '#C2D8D4'}
          strokeWidth={t.major ? 3.4 : 1.6}
          strokeLinecap="round"
        />
      ))}
      {/* cardinal numbers */}
      {[
        { n: '12', x: center, y: center - radius + 22 },
        { n: '3', x: center + radius - 17, y: center + 5 },
        { n: '6', x: center, y: center + radius - 12 },
        { n: '9', x: center - radius + 17, y: center + 5 },
      ].map(({ n, x, y }) => (
        <text
          key={n}
          x={x}
          y={y}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="13"
          fontWeight="800"
          fill="#175E6E"
          fontFamily="'Baloo 2', system-ui, sans-serif"
        >
          {n}
        </text>
      ))}
      {/* hour hand */}
      <line x1={center} y1={center} x2={hourHand.x} y2={hourHand.y} stroke="#E4572E" strokeWidth="6" strokeLinecap="round" />
      {/* minute hand */}
      <line x1={center} y1={center} x2={minuteHand.x} y2={minuteHand.y} stroke="#114B5F" strokeWidth="4" strokeLinecap="round" />
      {/* center pin */}
      <circle cx={center} cy={center} r="5.4" fill="#E4572E" stroke="#FFFDF6" strokeWidth="2" />
    </svg>
  );
}
