/**
 * الرسوم الأربعة الأصلية للاختبار — منقولة من المصدر
 * `interactive-physics-Test-L1&2-model-B-24-11-26/src/components/Figures.tsx`
 * بلا أي تغيير في الهندسة أو القياسات، مع استبدال عرض KaTeX داخل SVG
 * بعناصر SVG نصية أصلية (foreignObject لا يُطبع في بعض المتصفحات ولا في PDF).
 *
 * الثوابت أدناه مُصدَّرة لأن الاختبارات تتحقّق من تطابقها مع مفتاح الإجابة:
 *   · مخطط الحركة: (0,0) → (4,20) → (8,20) → (12,60) بسرعة 5 ثم 0 ثم 10 m/s.
 *   · شعاع القوة: 3 أقسام × 5 N = 15 N.
 *   · المسار: 7 + 5 + 8 = 20 m (الأطوال معطاة وليست مقياساً).
 */

import type { ReactElement } from "react";
import type { FigureId } from "./types";

export const MOTION_POINTS = [
  [0, 0],
  [4, 20],
  [8, 20],
  [12, 60],
] as const;
export const FORCE_SECTION_UNITS = 60;
export const FORCE_SECTIONS = 3;
export const FORCE_NEWTONS_PER_SECTION = 5;
export const ROUTE_LENGTHS = [7, 5, 8] as const;
export const SPEEDOMETER_READING = 60;

const figureProps = { preserveAspectRatio: "xMidYMid meet" as const, role: "img" as const };

/** نص SVG بسيط بديل عن KaTeX داخل الرسم. */
function SvgLabel({
  x,
  y,
  text,
  size = 18,
  color = "#523e65",
  anchor = "middle",
  weight = 600,
}: {
  x: number;
  y: number;
  text: string;
  size?: number;
  color?: string;
  anchor?: "start" | "middle" | "end";
  weight?: number;
}) {
  return (
    <text
      x={x}
      y={y}
      fontSize={size}
      fill={color}
      fontFamily="Cairo, Segoe UI, Tahoma, sans-serif"
      fontWeight={weight}
      textAnchor={anchor}
      direction="ltr"
    >
      {text}
    </text>
  );
}

function ForceFigure() {
  const arrowStart = 168;
  const arrowEnd = arrowStart + FORCE_SECTION_UNITS * FORCE_SECTIONS;
  return (
    <svg
      {...figureProps}
      viewBox="0 0 440 220"
      aria-label="صندوق تؤثر فيه قوة أفقية من النقطة A، سهم إلى اليمين مقسم إلى ثلاثة أقسام متساوية"
    >
      <defs>
        <marker
          id="force-arrowhead-b"
          viewBox="0 0 12 12"
          refX="10"
          refY="6"
          markerWidth="11"
          markerHeight="11"
          orient="auto"
        >
          <path d="M1 1 L11 6 L1 11 Z" fill="#c65a94" />
        </marker>
      </defs>
      <line x1="24" y1="105" x2="414" y2="105" stroke="#aa9aad" strokeDasharray="7 7" strokeWidth="1.7" />
      <rect x="56" y="63" width="112" height="84" rx="9" fill="#e9dff1" stroke="#73598c" strokeWidth="2.4" />
      <path d="M68 77 H155" stroke="#f9f5fb" strokeWidth="2" strokeLinecap="round" />
      <line
        x1={arrowStart}
        y1="105"
        x2={arrowEnd}
        y2="105"
        stroke="#c65a94"
        strokeWidth="4.5"
        strokeLinecap="round"
        markerEnd="url(#force-arrowhead-b)"
      />
      {[1, 2].map((section) => (
        <g key={section}>
          <circle
            cx={arrowStart + FORCE_SECTION_UNITS * section}
            cy="105"
            r="3"
            fill="white"
            stroke="#c65a94"
            strokeWidth="2"
          />
          <line
            x1={arrowStart + FORCE_SECTION_UNITS * section}
            y1="117"
            x2={arrowStart + FORCE_SECTION_UNITS * section}
            y2="129"
            stroke="#c65a94"
            strokeWidth="1.6"
          />
        </g>
      ))}
      <circle cx={arrowStart} cy="105" r="5.5" fill="#604478" stroke="white" strokeWidth="1.5" />
      <SvgLabel x={150} y={132} text="A" size={19} color="#5b4370" />
      <SvgLabel x={270} y={88} text="F" size={20} color="#a84f81" />
    </svg>
  );
}

function MotionGraph() {
  const x0 = 64;
  const y0 = 250;
  const sx = (time: number) => x0 + (time / 12) * 348;
  const sy = (distance: number) => y0 - (distance / 60) * 210;
  const xTicks = [0, 2, 4, 6, 8, 10, 12];
  const yTicks = [0, 10, 20, 30, 40, 50, 60];
  const colors = ["#8b6cba", "#cd79a4", "#4baeb1"];
  return (
    <svg
      {...figureProps}
      viewBox="0 0 440 306"
      aria-label="مخطط المسافة بالمتر بدلالة الزمن بالثانية؛ النقاط 0 و0، 4 و20، 8 و20، 12 و60"
    >
      {yTicks.map((value) => (
        <g key={`y${value}`}>
          <line x1={x0} y1={sy(value)} x2="412" y2={sy(value)} stroke="#ece6ef" strokeWidth="1" />
          <SvgLabel x={46} y={sy(value) + 6} text={String(value)} size={17} color="#665873" anchor="end" />
        </g>
      ))}
      {xTicks.map((value) => (
        <g key={`x${value}`}>
          <line x1={sx(value)} y1="40" x2={sx(value)} y2={y0} stroke="#ece6ef" strokeWidth="1" />
          <SvgLabel x={sx(value)} y={272} text={String(value)} size={17} color="#665873" />
        </g>
      ))}
      <line x1={x0} y1="35" x2={x0} y2={y0} stroke="#53435e" strokeWidth="2.4" />
      <line x1={x0} y1={y0} x2="415" y2={y0} stroke="#53435e" strokeWidth="2.4" />
      {MOTION_POINTS.slice(0, -1).map(([time, distance], index) => {
        const [nextTime, nextDistance] = MOTION_POINTS[index + 1];
        return (
          <line
            key={time}
            x1={sx(time)}
            y1={sy(distance)}
            x2={sx(nextTime)}
            y2={sy(nextDistance)}
            stroke={colors[index]}
            strokeWidth="4"
            strokeLinecap="round"
          />
        );
      })}
      {MOTION_POINTS.map(([time, distance]) => (
        <circle key={time} cx={sx(time)} cy={sy(distance)} r="5" fill="white" stroke="#57456c" strokeWidth="2.5" />
      ))}
      <SvgLabel x={4} y={24} text="d (m)" size={17} color="#523e65" anchor="start" />
      <SvgLabel x={330} y={296} text="t (s)" size={17} color="#523e65" />
    </svg>
  );
}

function RouteFigure() {
  return (
    <svg
      {...figureProps}
      viewBox="0 0 440 264"
      aria-label="مسار متصل من A إلى B مستقيم طوله 7 أمتار، قوس من B إلى C طوله المعطى 5 أمتار، مستقيم من C إلى D طوله 8 أمتار"
    >
      <line x1="34" y1="196" x2="142" y2="196" stroke="#8b6cba" strokeWidth="6" strokeLinecap="round" />
      <path d="M142 196 A79 79 0 0 0 221 117" fill="none" stroke="#c86c9d" strokeWidth="6" strokeLinecap="round" />
      <line x1="221" y1="117" x2="402" y2="117" stroke="#4baeb1" strokeWidth="6" strokeLinecap="round" />
      {[
        [34, 196],
        [142, 196],
        [221, 117],
        [402, 117],
      ].map(([x, y], index) => (
        <circle key={index} cx={x} cy={y} r="5.5" fill="white" stroke="#604a76" strokeWidth="2.7" />
      ))}
      <SvgLabel x={22} y={228} text="A" size={18} color="#523e65" />
      <SvgLabel x={138} y={230} text="B" size={18} color="#523e65" />
      <SvgLabel x={216} y={100} text="C" size={18} color="#523e65" />
      <SvgLabel x={398} y={100} text="D" size={18} color="#523e65" />
      <SvgLabel x={88} y={176} text="7 m" size={19} color="#705498" />
      <SvgLabel x={246} y={228} text="5 m" size={19} color="#af5688" />
      <SvgLabel x={318} y={96} text="8 m" size={19} color="#328d91" />
    </svg>
  );
}

function SpeedometerFigure() {
  return (
    <svg
      {...figureProps}
      viewBox="0 0 380 174"
      aria-label="عداد سرعة رقمي يعرض 60 كيلومتراً في الساعة"
    >
      <rect x="42" y="14" width="296" height="146" rx="28" fill="#4e365f" />
      <rect x="59" y="29" width="262" height="114" rx="16" fill="#2f2946" stroke="#816b91" strokeWidth="1.5" />
      <path d="M82 47 H138" stroke="#7e7294" strokeWidth="2" strokeLinecap="round" />
      <SvgLabel x={190} y={104} text="60" size={62} color="#bbf1e9" weight={700} />
      <SvgLabel x={259} y={128} text="km/h" size={17} color="#c5d6d9" />
    </svg>
  );
}

const FIGURES: Record<FigureId, () => ReactElement> = {
  force: ForceFigure,
  motion: MotionGraph,
  route: RouteFigure,
  speedometer: SpeedometerFigure,
};

export function Figure({ type }: { type: FigureId }) {
  const Component = FIGURES[type];
  return (
    <div className="figure-stage" data-figure={type}>
      <Component />
    </div>
  );
}
