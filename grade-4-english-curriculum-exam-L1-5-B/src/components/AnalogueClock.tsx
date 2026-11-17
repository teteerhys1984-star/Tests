import React from 'react';
import { ClockSpec } from '../types/exam';

interface AnalogueClockProps {
  clock: ClockSpec;
  size?: number;
}

export const AnalogueClock: React.FC<AnalogueClockProps> = ({ clock, size = 128 }) => {
  const normalizedHour = ((clock.hour % 12) + 12) % 12;
  const minuteAngle = clock.minute * 6; // 0, 90, 180, 270
  const hourAngle = normalizedHour * 30 + clock.minute * 0.5;

  const toCoords = (angleDeg: number, radius: number) => {
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    return {
      x: 60 + radius * Math.cos(rad),
      y: 60 + radius * Math.sin(rad),
    };
  };

  const hourTip = toCoords(hourAngle, 25);
  const minuteTip = toCoords(minuteAngle, 38);
  const numbers = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      role="img"
      aria-label="Analogue clock face"
      className="select-none drop-shadow-sm shrink-0"
    >
      {/* Cheerful outer ring */}
      <circle cx="60" cy="60" r="56" fill="#06b6d4" />
      <circle cx="60" cy="60" r="50" fill="#ffffff" stroke="#e0f2fe" strokeWidth="2" />

      {/* 60 minute ticks */}
      {Array.from({ length: 60 }).map((_, idx) => {
        const isHourTick = idx % 5 === 0;
        const outer = toCoords(idx * 6, 47.5);
        const inner = toCoords(idx * 6, isHourTick ? 43.5 : 45.8);
        return (
          <line
            key={idx}
            x1={inner.x}
            y1={inner.y}
            x2={outer.x}
            y2={outer.y}
            stroke={isHourTick ? '#0284c7' : '#cbd5e1'}
            strokeWidth={isHourTick ? 1.8 : 0.9}
            strokeLinecap="round"
          />
        );
      })}

      {/* Clock numbers 1–12 */}
      {numbers.map((num, idx) => {
        const pos = toCoords(idx * 30, 36.5);
        return (
          <text
            key={num}
            x={pos.x}
            y={pos.y + 3.5}
            textAnchor="middle"
            fontSize="10.5"
            fontWeight="800"
            fill="#0f172a"
            fontFamily="Nunito, system-ui, sans-serif"
          >
            {num}
          </text>
        );
      })}

      {/* Short hour hand (coral) */}
      <line
        x1="60"
        y1="60"
        x2={hourTip.x}
        y2={hourTip.y}
        stroke="#f43f5e"
        strokeWidth="4.4"
        strokeLinecap="round"
      />

      {/* Long minute hand (deep navy-blue) */}
      <line
        x1="60"
        y1="60"
        x2={minuteTip.x}
        y2={minuteTip.y}
        stroke="#0f172a"
        strokeWidth="3"
        strokeLinecap="round"
      />

      {/* Centre pin */}
      <circle cx="60" cy="60" r="4.2" fill="#facc15" stroke="#0f172a" strokeWidth="1.8" />
    </svg>
  );
};
