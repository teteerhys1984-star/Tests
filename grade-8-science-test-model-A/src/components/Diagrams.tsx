import { useId } from "react";
import type { FigureKind } from "../data/types";
import { SvgKatex, vectorTex } from "../lib/math";

const PALETTE = {
  f1: "#1D4ED8",      // Electric Blue
  f2: "#0891B2",      // Deep Cyan
  f2Alt: "#EA580C",   // Vibrant Orange
  res: "#DC2626",     // Crimson Resultant
  weight: "#7C3AED",  // Purple Weight
  ink: "#0B1B3A",     // Deep Navy
  muted: "#475569",   // Slate
  carrier: "#94A3B8", // Dashed carrier lines
  grid: "#E2E8F0",
};

const rad = (deg: number) => (deg * Math.PI) / 180;
const T = String.raw;

function Defs({ id }: { id: string }) {
  const markers = [
    ["f1", PALETTE.f1], ["f2", PALETTE.f2], ["f2Alt", PALETTE.f2Alt],
    ["res", PALETTE.res], ["weight", PALETTE.weight], ["ink", PALETTE.ink],
  ] as const;

  return (
    <defs>
      {markers.map(([name, color]) => (
        <marker key={name} id={`${id}-${name}`} viewBox="0 0 12 12" refX="9.5" refY="6" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M 1 1.5 L 11 6 L 1 10.5 L 3.2 6 z" fill={color} />
        </marker>
      ))}
      <linearGradient id={`${id}-beam`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#334155" />
        <stop offset="50%" stopColor="#0F172A" />
        <stop offset="100%" stopColor="#475569" />
      </linearGradient>
      <pattern id={`${id}-grid`} width="24" height="24" patternUnits="userSpaceOnUse">
        <path d="M 24 0 L 0 0 0 24" fill="none" stroke="rgba(29,78,216,0.06)" strokeWidth="1" />
      </pattern>
    </defs>
  );
}

function Frame({ id, viewBox = "0 0 640 310", children }: { id: string; viewBox?: string; children: React.ReactNode }) {
  const [, , w, h] = viewBox.split(" ").map(Number);
  return (
    <svg viewBox={viewBox} className="w-full h-auto block select-none rounded-2xl shadow-sm border border-line" role="img">
      <Defs id={id} />
      <rect x="0" y="0" width={w} height={h} rx="18" fill="#F8FAFC" />
      <rect x="0" y="0" width={w} height={h} rx="18" fill={`url(#${id}-grid)`} />
      {children}
    </svg>
  );
}

function DimLine({ x1, x2, y, tex, color = PALETTE.muted, dashed = false }: { x1: number; x2: number; y: number; tex: string; color?: string; dashed?: boolean }) {
  return (
    <g>
      <line x1={x1} y1={y} x2={x2} y2={y} stroke={color} strokeWidth="1.8" strokeDasharray={dashed ? "6 4" : undefined} />
      <line x1={x1} y1={y - 6} x2={x1} y2={y + 6} stroke={color} strokeWidth="2" />
      <line x1={x2} y1={y - 6} x2={x2} y2={y + 6} stroke={color} strokeWidth="2" />
      <SvgKatex x={(x1 + x2) / 2} y={y} tex={tex} color={color} bg="#FFFFFF" borderColor="#CBD5E1" fontSize={14} />
    </g>
  );
}

function NodePin({ x, y, tex, dy = 24 }: { x: number; y: number; tex: string; dy?: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r="8" fill="#FFFFFF" stroke={PALETTE.ink} strokeWidth="2.5" />
      <circle cx={x} cy={y} r="3" fill={PALETTE.ink} />
      <SvgKatex x={x} y={y + dy} tex={tex} color={PALETTE.ink} fontSize={17} />
    </g>
  );
}

/* --------------------------------------------------------- 1. Beam Same */
function BeamSameDiagram({ id, solved, f1 = 15, f2 = 45, lenM = 2 }: { id: string; solved?: boolean; f1?: number; f2?: number; lenM?: number }) {
  const xA = 140, xB = 500, rodY = 190;
  const F = f1 + f2, xC = xA + (f2 / F) * (xB - xA);

  return (
    <Frame id={id} viewBox="0 0 640 290">
      <line x1={xA} y1={24} x2={xA} y2={rodY + 45} stroke={PALETTE.carrier} strokeWidth="1.5" strokeDasharray="5 5" />
      <line x1={xB} y1={24} x2={xB} y2={rodY + 45} stroke={PALETTE.carrier} strokeWidth="1.5" strokeDasharray="5 5" />
      <rect x={xA - 20} y={rodY - 8} width={xB - xA + 40} height="16" rx="8" fill={`url(#${id}-beam)`} />
      
      <line x1={xA} y1={rodY - 9} x2={xA} y2={rodY - 65} stroke={PALETTE.f1} strokeWidth="4.5" markerEnd={`url(#${id}-f1)`} />
      <SvgKatex x={xA} y={rodY - 95} tex={`${vectorTex("F", "1")} = ${f1}~\\mathrm{N}`} color={PALETTE.f1} bg="#EFF6FF" borderColor="#93C5FD" fontSize={14} />

      <line x1={xB} y1={rodY - 9} x2={xB} y2={rodY - 135} stroke={PALETTE.f2} strokeWidth="4.5" markerEnd={`url(#${id}-f2)`} />
      <SvgKatex x={xB} y={rodY - 165} tex={`${vectorTex("F", "2")} = ${f2}~\\mathrm{N}`} color={PALETTE.f2} bg="#ECFEFF" borderColor="#67E8F9" fontSize={14} />

      {solved && (
        <>
          <line x1={xC} y1={18} x2={xC} y2={rodY + 55} stroke={PALETTE.res} strokeWidth="1.5" strokeDasharray="5 5" />
          <line x1={xC} y1={rodY - 9} x2={xC} y2={rodY - 155} stroke={PALETTE.res} strokeWidth="5" markerEnd={`url(#${id}-res)`} />
          <SvgKatex x={xC} y={rodY - 185} tex={`${vectorTex("F")} = ${F}~\\mathrm{N}`} color={PALETTE.res} bg="#FEF2F2" borderColor="#FCA5A5" fontSize={14} />
          <NodePin x={xC} y={rodY} tex="C" />
        </>
      )}
      <NodePin x={xA} y={rodY} tex="A" /><NodePin x={xB} y={rodY} tex="B" />
      <DimLine x1={xA} x2={xB} y={rodY + 60} tex={`\\mathrm{AB} = ${lenM}~\\mathrm{m}`} />
    </Frame>
  );
}

/* ----------------------------------------------------- 2. Beam Opposite */
function BeamOppositeDiagram({ id, solved }: { id: string; solved?: boolean }) {
  const xA = 135, xB = 375, xC = 495, rodY = 130;
  return (
    <Frame id={id} viewBox="0 0 640 310">
      <line x1={xA} y1={24} x2={xA} y2={265} stroke={PALETTE.carrier} strokeWidth="1.5" strokeDasharray="5 5" />
      <line x1={xB} y1={24} x2={xB} y2={275} stroke={PALETTE.carrier} strokeWidth="1.5" strokeDasharray="5 5" />
      <rect x={xA - 20} y={rodY - 8} width={xB - xA + 40} height="16" rx="8" fill={`url(#${id}-beam)`} />
      <line x1={xA} y1={rodY - 9} x2={xA} y2={rodY - 70} stroke={PALETTE.f1} strokeWidth="4.5" markerEnd={`url(#${id}-f1)`} />
      <SvgKatex x={xA} y={rodY - 100} tex={`${vectorTex("F", "1")} = 30~\\mathrm{N}`} color={PALETTE.f1} bg="#EFF6FF" borderColor="#93C5FD" fontSize={14} />
      <line x1={xB} y1={rodY + 9} x2={xB} y2={rodY + 140} stroke={PALETTE.f2Alt} strokeWidth="4.5" markerEnd={`url(#${id}-f2Alt)`} />
      <SvgKatex x={xB - 85} y={rodY + 105} tex={`${vectorTex("F", "2")} = 90~\\mathrm{N}`} color={PALETTE.f2Alt} bg="#FFF7ED" borderColor="#FDBA74" fontSize={14} />
      {solved && (
        <>
          <line x1={xC} y1={35} x2={xC} y2={275} stroke={PALETTE.res} strokeWidth="1.5" strokeDasharray="5 5" />
          <line x1={xC} y1={rodY + 9} x2={xC} y2={rodY + 105} stroke={PALETTE.res} strokeWidth="5" markerEnd={`url(#${id}-res)`} />
          <SvgKatex x={xC + 80} y={rodY + 80} tex={`${vectorTex("F")} = 60~\\mathrm{N}`} color={PALETTE.res} bg="#FEF2F2" borderColor="#FCA5A5" fontSize={14} />
          <NodePin x={xC} y={rodY} tex="C" dy={-24} />
        </>
      )}
      <NodePin x={xA} y={rodY} tex="A" /><NodePin x={xB} y={rodY} tex="B" dy={-24} />
      <DimLine x1={xA} x2={xB} y={275} tex="\\mathrm{AB} = 0.6~\\mathrm{m}" />
    </Frame>
  );
}

/* ------------------------------------------------ 3. Perpendicular 3N/4N */
function PerpendicularDiagram({ id, solved }: { id: string; solved?: boolean }) {
  const ox = 200, oy = 230, x1 = ox + 120, y2 = oy - 160;
  return (
    <Frame id={id} viewBox="0 0 640 300">
      <path d={`M ${ox + 24} ${oy} L ${ox + 24} ${oy - 24} L ${ox} ${oy - 24}`} fill="rgba(29,78,216,0.08)" stroke={PALETTE.ink} strokeWidth="2" />
      <SvgKatex x={ox + 50} y={oy - 35} tex={T`90^{\circ}`} color={PALETTE.ink} fontSize={14} />
      <line x1={ox} y1={oy} x2={x1 + 60} y2={oy} stroke={PALETTE.carrier} strokeWidth="1.5" strokeDasharray="6 4" />
      <line x1={ox} y1={oy} x2={ox} y2={y2 - 40} stroke={PALETTE.carrier} strokeWidth="1.5" strokeDasharray="6 4" />
      <line x1={ox} y1={oy} x2={x1} y2={oy} stroke={PALETTE.f1} strokeWidth="4.5" markerEnd={`url(#${id}-f1)`} />
      <SvgKatex x={x1 + 80} y={oy} tex={T`${vectorTex("F", "1")} = 3~\mathrm{N}`} color={PALETTE.f1} bg="#EFF6FF" borderColor="#93C5FD" fontSize={14} />
      <line x1={ox} y1={oy} x2={ox} y2={y2} stroke={PALETTE.f2} strokeWidth="4.5" markerEnd={`url(#${id}-f2)`} />
      <SvgKatex x={ox - 85} y={y2} tex={`${vectorTex("F", "2")} = 4~\\mathrm{N}`} color={PALETTE.f2} bg="#ECFEFF" borderColor="#67E8F9" fontSize={14} />
      {solved && (
        <><line x1={ox} y1={oy} x2={x1} y2={y2} stroke={PALETTE.res} strokeWidth="5" markerEnd={`url(#${id}-res)`} />
          <SvgKatex x={x1 + 85} y={y2 - 10} tex={`${vectorTex("F")} = 5~\\mathrm{N}`} color={PALETTE.res} bg="#FEF2F2" borderColor="#FCA5A5" fontSize={15} />
        </>
      )}
      <NodePin x={ox} y={oy} tex="O" />
    </Frame>
  );
}

/* ------------------------------------------- 4. Concurrent Angle Diagram */
function ConcurrentAngleDiagram({ id, equal, solved }: { id: string; equal: boolean; solved?: boolean }) {
  const ox = 185, oy = 242, ang = equal ? 60 : 45;
  const len1 = equal ? 135 : 120, len2 = equal ? 135 : 170;
  const x1 = ox + len1, x2 = ox + len2 * Math.cos(rad(ang)), y2 = oy - len2 * Math.sin(rad(ang));
  const xm = x1 + (x2 - ox), ym = oy + (y2 - oy);

  return (
    <Frame id={id} viewBox="0 0 640 300">
      <path d={`M ${ox + 50} ${oy} A 50 50 0 0 0 ${ox + 50 * Math.cos(rad(ang))} ${oy - 50 * Math.sin(rad(ang))}`} fill="none" stroke={PALETTE.ink} strokeWidth="1.8" strokeDasharray="4 3" />
      <SvgKatex x={ox + 75} y={oy - 25} tex={equal ? "60^{\\circ}" : "\\theta = 45^{\\circ}"} bg="#FFFFFF" fontSize={13} />
      {solved && (
        <>
          <line x1={x1} y1={oy} x2={xm} y2={ym} stroke={PALETTE.res} strokeWidth="1.8" strokeDasharray="6 4" />
          <line x1={x2} y1={y2} x2={xm} y2={ym} stroke={PALETTE.res} strokeWidth="1.8" strokeDasharray="6 4" />
          <line x1={ox} y1={oy} x2={xm} y2={ym} stroke={PALETTE.res} strokeWidth="4.5" markerEnd={`url(#${id}-res)`} />
          <SvgKatex x={xm + 90} y={ym + 15} tex={`${vectorTex("F")} \\approx ${equal ? "138.6" : "23.2"}~\\mathrm{N}`} color={PALETTE.res} bg="#FEF2F2" borderColor="#FCA5A5" fontSize={14} />
          <NodePin x={xm} y={ym} tex="M" dy={-24} />
        </>
      )}
      <line x1={ox} y1={oy} x2={x1} y2={oy} stroke={PALETTE.f1} strokeWidth="4.2" markerEnd={`url(#${id}-f1)`} />
      <SvgKatex x={x1 + 75} y={oy + 22} tex={`${vectorTex("F", "1")} = ${equal ? "80" : "10"}~\\mathrm{N}`} color={PALETTE.f1} bg="#EFF6FF" borderColor="#93C5FD" fontSize={14} />
      <line x1={ox} y1={oy} x2={x2} y2={y2} stroke={PALETTE.f2Alt} strokeWidth="4.2" markerEnd={`url(#${id}-f2Alt)`} />
      <SvgKatex x={x2 - 75} y={y2 - 15} tex={`${vectorTex("F", "2")} = ${equal ? "80" : "15"}~\\mathrm{N}`} color={PALETTE.f2Alt} bg="#FFF7ED" borderColor="#FDBA74" fontSize={14} />
      <NodePin x={ox} y={oy} tex="O" />
    </Frame>
  );
}

/* ------------------------------------------- 8. Bohr Energy Shells */
function BohrShellsDiagram({ id }: { id: string }) {
  const ox = 250, oy = 240;
  const shells = [{ r: 58, sym: "K", n: 1, col: "#1D4ED8" }, { r: 102, sym: "L", n: 2, col: "#0891B2" }, { r: 146, sym: "M", n: 3, col: "#EA580C" }, { r: 190, sym: "N", n: 4, col: "#7C3AED" }];
  return (
    <Frame id={id} viewBox="0 0 640 270">
      <circle cx={ox} cy={oy} r="24" fill="#0B1B3A" stroke="#FFC53D" strokeWidth="3" />
      <SvgKatex x={ox} y={oy} tex="+Ze" color="#FFC53D" fontSize={14} />
      {shells.map((s) => (
        <g key={s.sym}>
          <path d={`M ${ox + s.r * Math.cos(rad(12))} ${oy - s.r * Math.sin(rad(12))} A ${s.r} ${s.r} 0 0 0 ${ox + s.r * Math.cos(rad(82))} ${oy - s.r * Math.sin(rad(82))}`} fill="none" stroke={s.col} strokeWidth="3" />
          <SvgKatex x={ox + s.r * Math.cos(rad(28)) + 45} y={oy - s.r * Math.sin(rad(28))} tex={`${s.sym}\;(n=${s.n})`} color={s.col} bg="#FFFFFF" borderColor="#CBD5E1" fontSize={13} />
        </g>
      ))}
      <SvgKatex x={530} y={70} tex="y = 2(n)^2" color={PALETTE.ink} bg="#FEF9C3" borderColor="#FACC15" fontSize={17} />
    </Frame>
  );
}

/* ---------------------------------------- 5. Magnetic Spring Board (p56) */
function SpringBoardDiagram({ id }: { id: string }) {
  const ox = 320, oy = 150;
  return (
    <Frame id={id} viewBox="0 0 640 300">
      <circle cx={ox} cy={oy} r="125" fill="#FFFFFF" stroke="#94A3B8" strokeWidth="3" />
      <line x1={ox - 100} y1={oy - 80} x2={ox + 85} y2={oy + 68} stroke={PALETTE.f1} strokeWidth="1.5" strokeDasharray="6 4" />
      <line x1={ox + 100} y1={oy - 80} x2={ox - 85} y2={oy + 68} stroke={PALETTE.f2} strokeWidth="1.5" strokeDasharray="6 4" />
      <line x1={ox} y1={oy - 110} x2={ox} y2={oy + 115} stroke={PALETTE.weight} strokeWidth="1.5" strokeDasharray="6 4" />
      <line x1={ox} y1={oy} x2={ox - 90} y2={oy - 72} stroke={PALETTE.f1} strokeWidth="4.5" markerEnd={`url(#${id}-f1)`} />
      <line x1={ox} y1={oy} x2={ox + 90} y2={oy - 72} stroke={PALETTE.f2} strokeWidth="4.5" markerEnd={`url(#${id}-f2)`} />
      <line x1={ox} y1={oy} x2={ox} y2={oy + 100} stroke={PALETTE.weight} strokeWidth="4.5" markerEnd={`url(#${id}-weight)`} />
      <SvgKatex x={ox - 135} y={oy - 85} tex={vectorTex("F", "1")} color={PALETTE.f1} bg="#EFF6FF" borderColor="#93C5FD" />
      <SvgKatex x={ox + 135} y={oy - 85} tex={vectorTex("F", "2")} color={PALETTE.f2} bg="#ECFEFF" borderColor="#67E8F9" />
      <SvgKatex x={ox + 55} y={oy + 100} tex={vectorTex("w")} color={PALETTE.weight} bg="#F5F3FF" borderColor="#C4B5FD" />
      <NodePin x={ox} y={oy} tex="O" dy={-26} />
    </Frame>
  );
}

/* ------------------------------------------- 6. Vector Anatomy (p55) */
function VectorAnatomyDiagram({ id }: { id: string }) {
  const ox = 190, oy = 151, tx = 430, ty = 103;
  return (
    <Frame id={id} viewBox="0 0 640 250">
      <line x1="70" y1="175" x2="570" y2="75" stroke={PALETTE.carrier} strokeWidth="2.2" strokeDasharray="8 6" />
      <SvgKatex x={550} y={55} tex={T`(\Delta)`} color={PALETTE.muted} fontSize={20} />
      <line x1={ox} y1={oy} x2={tx} y2={ty} stroke={PALETTE.f1} strokeWidth="5.5" markerEnd={`url(#${id}-f1)`} />
      <SvgKatex x={310} y={100} tex={vectorTex("F")} color={PALETTE.f1} fontSize={20} />
      <NodePin x={ox} y={oy} tex="O" dy={-30} />
      <line x1={ox} y1={oy + 8} x2={155} y2={205} stroke={PALETTE.ink} strokeWidth="1.5" />
      <SvgKatex x={145} y={218} tex="(1)" color="#FFFFFF" bg={PALETTE.ink} fontSize={13} />
      <line x1="115" y1="166" x2="105" y2="112" stroke={PALETTE.ink} strokeWidth="1.5" />
      <SvgKatex x={105} y={98} tex="(2)" color="#FFFFFF" bg={PALETTE.ink} fontSize={13} />
      <line x1={tx} y1={ty} x2={468} y2={148} stroke={PALETTE.ink} strokeWidth="1.5" />
      <SvgKatex x={478} y={164} tex="(3)" color="#FFFFFF" bg={PALETTE.ink} fontSize={13} />
      <line x1={ox + 5} y1={oy + 25} x2={tx + 5} y2={ty + 25} stroke={PALETTE.f2Alt} strokeWidth="1.5" strokeDasharray="4 3" />
      <SvgKatex x={320} y={180} tex="(4)" color="#FFFFFF" bg={PALETTE.f2Alt} fontSize={13} />
    </Frame>
  );
}

/* ------------------------------------------- 7. Chlorine Nuclear Tile */
function ChlorineTileDiagram({ id }: { id: string }) {
  return (
    <Frame id={id} viewBox="0 0 640 240">
      <rect x="235" y="34" width="170" height="170" rx="28" fill="#0B1B3A" stroke="#06B6D4" strokeWidth="4" />
      <SvgKatex x={320} y={120} tex={T`{}^{35}_{17}\mathrm{Cl}`} width={160} height={100} color="#FFFFFF" fontSize={48} />
      <line x1="255" y1="78" x2="150" y2="62" stroke="#FF6B1A" strokeWidth="2" />
      <circle cx="255" cy="78" r="5" fill="#FF6B1A" />
      <SvgKatex x={105} y={62} tex="A = 35" color="#C2410C" bg="#FFF7ED" borderColor="#FDBA74" fontSize={16} />
      <line x1="255" y1="146" x2="150" y2="168" stroke="#06B6D4" strokeWidth="2" />
      <circle cx="255" cy="146" r="5" fill="#06B6D4" />
      <SvgKatex x={105} y={168} tex="Z = 17" color="#0E7490" bg="#ECFEFF" borderColor="#67E8F9" fontSize={16} />
    </Frame>
  );
}

/* ------------------------------------------- 9. NaCl Electron Transfer */
function NaClTransferDiagram({ id, solved }: { id: string; solved?: boolean }) {
  const xNa = 190, xCl = 450, cy = 130;
  const ringDots = (cx: number, r: number, count: number, color: string) => Array.from({ length: count }).map((_, i) => <circle key={i} cx={cx + r * Math.cos(rad((360 / count) * i - 90))} cy={cy + r * Math.sin(rad((360 / count) * i - 90))} r="5.2" fill={color} />);
  return (
    <Frame id={id} viewBox="0 0 640 280">
      {[34, 62, 90].map((r) => <circle key={r} cx={xNa} cy={cy} r={r} fill="none" stroke="#93C5FD" strokeWidth="1.2" />)}
      <circle cx={xNa} cy={cy} r="22" fill="#1D4ED8" /><SvgKatex x={xNa} y={cy} tex={T`\mathrm{Na}`} color="#FFFFFF" fontSize={16} />
      {ringDots(xNa, 34, 2, "#1D4ED8")}{ringDots(xNa, 62, 8, "#1D4ED8")}
      <circle cx={xNa + 90} cy={cy} r="6.5" fill={PALETTE.res} className="pulse-glow" />
      {[34, 62, 90].map((r) => <circle key={r} cx={xCl} cy={cy} r={r} fill="none" stroke="#6EE7B7" strokeWidth="1.2" />)}
      <circle cx={xCl} cy={cy} r="22" fill="#0F766E" /><SvgKatex x={xCl} y={cy} tex={T`\mathrm{Cl}`} color="#FFFFFF" fontSize={16} />
      {ringDots(xCl, 34, 2, "#0F766E")}{ringDots(xCl, 62, 8, "#0F766E")}{ringDots(xCl, 90, 7, "#0F766E")}
      {solved && <path d={`M ${xNa + 94} ${cy - 5} Q 320 35 ${xCl - 88} ${cy - 18}`} fill="none" stroke={PALETTE.res} strokeWidth="3.5" strokeDasharray="7 5" markerEnd={`url(#${id}-res)`} />}
      <SvgKatex x={xNa} y={255} tex={solved ? T`\mathrm{Na}^{+}\,(2\text{-}8)` : T`{}_{11}\mathrm{Na}\,(2\text{-}8\text{-}1)`} color={PALETTE.f1} bg="#EFF6FF" borderColor="#93C5FD" />
      <SvgKatex x={xCl} y={255} tex={solved ? T`\mathrm{Cl}^{-}\,(2\text{-}8\text{-}8)` : T`{}_{17}\mathrm{Cl}\,(2\text{-}8\text{-}7)`} color="#0F766E" bg="#ECFDF5" borderColor="#6EE7B7" />
    </Frame>
  );
}

export function Figure({ kind, solved = false }: { kind: FigureKind | string; solved?: boolean }) {
  const id = useId().replace(/:/g, "");
  switch (kind) {
    case "beam-same": return <BeamSameDiagram id={id} solved={solved} f1={15} f2={45} lenM={2} />;
    case "beam-3m": return <BeamSameDiagram id={id} solved={solved} f1={20} f2={40} lenM={3} />;
    case "beam-opposite": return <BeamOppositeDiagram id={id} solved={solved} />;
    case "perpendicular": return <PerpendicularDiagram id={id} solved={solved} />;
    case "acute45": return <ConcurrentAngleDiagram id={id} equal={false} solved={solved} />;
    case "equal60": return <ConcurrentAngleDiagram id={id} equal={true} solved={solved} />;
    case "spring-board": return <SpringBoardDiagram id={id} />;
    case "vector-anatomy": return <VectorAnatomyDiagram id={id} />;
    case "chlorine-tile": return <ChlorineTileDiagram id={id} />;
    case "bohr-shells": return <BohrShellsDiagram id={id} />;
    case "nacl-transfer": return <NaClTransferDiagram id={id} solved={solved} />;
    default: return null;
  }
}
