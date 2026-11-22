import { SvgMath } from "./Math";
import type { FigureId } from "../data/questions";

export const MOTION_POINTS = [[0, 0], [4, 20], [8, 20], [12, 60]] as const;
export const FORCE_SECTION_UNITS = 60;
export const FORCE_SECTIONS = 3;

const figureProps = { preserveAspectRatio: "xMidYMid meet" as const, role: "img" as const };

function ForceFigure() {
  const arrowStart = 168;
  const arrowEnd = arrowStart + FORCE_SECTION_UNITS * FORCE_SECTIONS;
  return (
    <svg {...figureProps} viewBox="0 0 440 220" aria-label="صندوق تؤثر فيه قوة أفقية من النقطة A، سهم إلى اليمين مقسم إلى ثلاثة أقسام متساوية" className="figure-svg">
      <defs>
        <marker id="force-arrowhead-b" viewBox="0 0 12 12" refX="10" refY="6" markerWidth="11" markerHeight="11" orient="auto">
          <path d="M1 1 L11 6 L1 11 Z" fill="#c65a94" />
        </marker>
      </defs>
      <line x1="24" y1="105" x2="414" y2="105" stroke="#aa9aad" strokeDasharray="7 7" strokeWidth="1.7" />
      <rect x="56" y="63" width="112" height="84" rx="9" fill="#e9dff1" stroke="#73598c" strokeWidth="2.4" />
      <path d="M68 77 H155" stroke="#f9f5fb" strokeWidth="2" strokeLinecap="round" />
      <line x1={arrowStart} y1="105" x2={arrowEnd} y2="105" stroke="#c65a94" strokeWidth="4.5" strokeLinecap="round" markerEnd="url(#force-arrowhead-b)" />
      {[1, 2].map((section) => (
        <g key={section}>
          <circle cx={arrowStart + FORCE_SECTION_UNITS * section} cy="105" r="3" fill="white" stroke="#c65a94" strokeWidth="2" />
          <line x1={arrowStart + FORCE_SECTION_UNITS * section} y1="117" x2={arrowStart + FORCE_SECTION_UNITS * section} y2="129" stroke="#c65a94" strokeWidth="1.6" />
        </g>
      ))}
      <circle cx={arrowStart} cy="105" r="5.5" fill="#604478" stroke="white" strokeWidth="1.5" />
      <SvgMath tex="A" x={145} y={122} width={42} height={28} size={19} />
      <SvgMath tex="F" x={245} y={65} width={50} height={28} size={20} color="#a84f81" />
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
    <svg {...figureProps} viewBox="0 0 440 306" aria-label="مخطط المسافة بالمتر بدلالة الزمن بالثانية؛ النقاط 0 و0، 4 و20، 8 و20، 12 و60" className="figure-svg">
      {yTicks.map((value) => (
        <g key={`y${value}`}>
          <line x1={x0} y1={sy(value)} x2="412" y2={sy(value)} stroke="#ece6ef" strokeWidth="1" />
          <text x="46" y={sy(value) + 6} textAnchor="end" fill="#665873" fontSize="18" fontFamily="IBM Plex Sans Arabic, sans-serif">{value}</text>
        </g>
      ))}
      {xTicks.map((value) => (
        <g key={`x${value}`}>
          <line x1={sx(value)} y1="40" x2={sx(value)} y2={y0} stroke="#ece6ef" strokeWidth="1" />
          <text x={sx(value)} y="272" textAnchor="middle" fill="#665873" fontSize="18" fontFamily="IBM Plex Sans Arabic, sans-serif">{value}</text>
        </g>
      ))}
      <line x1={x0} y1="35" x2={x0} y2={y0} stroke="#53435e" strokeWidth="2.4" />
      <line x1={x0} y1={y0} x2="415" y2={y0} stroke="#53435e" strokeWidth="2.4" />
      {MOTION_POINTS.slice(0, -1).map(([time, distance], index) => {
        const [nextTime, nextDistance] = MOTION_POINTS[index + 1];
        return <line key={time} x1={sx(time)} y1={sy(distance)} x2={sx(nextTime)} y2={sy(nextDistance)} stroke={colors[index]} strokeWidth="4" strokeLinecap="round" />;
      })}
      {MOTION_POINTS.map(([time, distance]) => <circle key={time} cx={sx(time)} cy={sy(distance)} r="5" fill="white" stroke="#57456c" strokeWidth="2.5" />)}
      <SvgMath tex="d\,(\mathrm{m})" x={4} y={5} width={100} height={27} size={18} align="start" />
      <SvgMath tex="t\,(\mathrm{s})" x={256} y={277} width={113} height={25} size={18} />
    </svg>
  );
}

function RouteFigure() {
  return (
    <svg {...figureProps} viewBox="0 0 440 264" aria-label="مسار متصل من A إلى B مستقيم طوله 7 أمتار، قوس من B إلى C طوله المعطى 5 أمتار، مستقيم من C إلى D طوله 8 أمتار" className="figure-svg">
      <line x1="34" y1="196" x2="142" y2="196" stroke="#8b6cba" strokeWidth="6" strokeLinecap="round" />
      <path d="M142 196 A79 79 0 0 0 221 117" fill="none" stroke="#c86c9d" strokeWidth="6" strokeLinecap="round" />
      <line x1="221" y1="117" x2="402" y2="117" stroke="#4baeb1" strokeWidth="6" strokeLinecap="round" />
      {[[34, 196], [142, 196], [221, 117], [402, 117]].map(([x, y], index) => (
        <circle key={index} cx={x} cy={y} r="5.5" fill="white" stroke="#604a76" strokeWidth="2.7" />
      ))}
      <SvgMath tex="A" x={17} y={212} width={34} height={27} size={18} />
      <SvgMath tex="B" x={126} y={213} width={34} height={27} size={18} />
      <SvgMath tex="C" x={204} y={82} width={34} height={27} size={18} />
      <SvgMath tex="D" x={386} y={82} width={34} height={27} size={18} />
      <SvgMath tex="7\,\mathrm{m}" x={61} y={155} width={58} height={26} size={19} color="#705498" />
      <SvgMath tex="5\,\mathrm{m}" x={214} y={203} width={62} height={26} size={19} color="#af5688" />
      <SvgMath tex="8\,\mathrm{m}" x={285} y={78} width={66} height={26} size={19} color="#328d91" />
    </svg>
  );
}

function SpeedometerFigure() {
  return (
    <svg {...figureProps} viewBox="0 0 380 174" aria-label="عداد سرعة رقمي يعرض 60 كيلومتراً في الساعة" className="figure-svg figure-svg--small">
      <rect x="42" y="14" width="296" height="146" rx="28" fill="#4e365f" />
      <rect x="59" y="29" width="262" height="114" rx="16" fill="#2f2946" stroke="#816b91" strokeWidth="1.5" />
      <path d="M82 47 H138" stroke="#7e7294" strokeWidth="2" strokeLinecap="round" />
      <SvgMath tex="60" x={95} y={39} width={190} height={75} size={62} color="#bbf1e9" />
      <SvgMath tex="\mathrm{km/h}" x={223} y={111} width={73} height={23} size={17} color="#c5d6d9" />
    </svg>
  );
}

export function Figure({ type }: { type: FigureId }) {
  return (
    <div className="figure-stage">
      {type === "force" && <ForceFigure />}
      {type === "motion" && <MotionGraph />}
      {type === "route" && <RouteFigure />}
      {type === "speedometer" && <SpeedometerFigure />}
    </div>
  );
}