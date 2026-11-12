import type { DiagramId } from "../exam/data";

const RAD = Math.PI / 180;

function pt(cx: number, cy: number, r: number, angle: number) {
  return {
    x: cx + r * Math.cos(angle * RAD),
    y: cy - r * Math.sin(angle * RAD),
  };
}

function arcPath(cx: number, cy: number, r: number, from: number, to: number) {
  const start = pt(cx, cy, r, from);
  const end = pt(cx, cy, r, to);
  const large = Math.abs(to - from) > 180 ? 1 : 0;
  return `M ${start.x.toFixed(2)} ${start.y.toFixed(2)} A ${r} ${r} 0 ${large} 0 ${end.x.toFixed(
    2
  )} ${end.y.toFixed(2)}`;
}

function labelPt(cx: number, cy: number, r: number, from: number, to: number) {
  return pt(cx, cy, r, (from + to) / 2);
}

const ink = "#5a3a4a";
const line = "#7c4e60";
const accent = "#b86780";
const paper = "#fffdfb";

function Label({
  x,
  y,
  children,
  size = 15,
  italic = false,
}: {
  x: number;
  y: number;
  children: string;
  size?: number;
  italic?: boolean;
}) {
  return (
    <text
      x={x}
      y={y}
      fill={ink}
      fontSize={size}
      fontFamily="Georgia, 'Times New Roman', serif"
      fontStyle={italic ? "italic" : "normal"}
      textAnchor="middle"
      dominantBaseline="middle"
      paintOrder="stroke"
      stroke={paper}
      strokeWidth={4}
      strokeLinejoin="round"
    >
      {children}
    </text>
  );
}

function Dot({ x, y, color = ink }: { x: number; y: number; color?: string }) {
  return <circle cx={x} cy={y} r={3.4} fill={color} stroke={paper} strokeWidth={1.2} />;
}

function SvgFrame({
  title,
  children,
  viewBox,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  viewBox: string;
  className?: string;
}) {
  return (
    <svg
      viewBox={viewBox}
      className={className}
      role="img"
      aria-label={title}
      style={{ width: "100%", height: "auto", maxHeight: 360 }}
    >
      <title>{title}</title>
      <rect x="0" y="0" width="100%" height="100%" fill="transparent" />
      {children}
    </svg>
  );
}

function LinePointsDiagram() {
  return (
    <SvgFrame
      title="مستقيم أفقي (d) عليه النقطتان A وB، والنقطة C خارج المستقيم"
      viewBox="0 0 520 220"
    >
      <line x1="36" y1="92" x2="484" y2="92" stroke={line} strokeWidth="2.2" />
      <path d="M36 92l12-5v10z" fill={line} opacity=".55" />
      <path d="M484 92l-12-5v10z" fill={line} opacity=".55" />
      <Dot x={152} y={92} />
      <Dot x={330} y={92} />
      <Dot x={248} y={160} />
      <Label x={152} y={70}>A</Label>
      <Label x={330} y={70}>B</Label>
      <Label x={248} y={185}>C</Label>
      <Label x={497} y={70} italic>(d)</Label>
      <Label x={112} y={192} size={12}>A و B تنتميان إلى المستقيم (d)</Label>
    </SvgFrame>
  );
}

function PerpendicularDiagram() {
  return (
    <SvgFrame
      title="مستقيم (d) أفقي ومستقيم (L) عمودي عليه، مع رمز الزاوية القائمة عند نقطة التقاطع"
      viewBox="0 0 440 320"
    >
      <line x1="36" y1="176" x2="404" y2="176" stroke={line} strokeWidth="2.2" />
      <line x1="220" y1="34" x2="220" y2="288" stroke={accent} strokeWidth="2.2" />
      <path d="M220 176h18v-18" fill="none" stroke={accent} strokeWidth="2" />
      <Dot x={220} y={176} />
      <Label x={408} y={154} italic>(d)</Label>
      <Label x={238} y={40} italic>(L)</Label>
      <Label x={202} y={202}>O</Label>
      <Label x={310} y={142} size={12}>90°</Label>
    </SvgFrame>
  );
}

function VerticalAnglesDiagram() {
  const cx = 220;
  const cy = 170;
  const a = pt(cx, cy, 176, 0);
  const c = pt(cx, cy, 176, 180);
  const b = pt(cx, cy, 158, 68);
  const d = pt(cx, cy, 158, 248);
  const lab = labelPt(cx, cy, 74, 0, 68);

  return (
    <SvgFrame
      title="مستقيمان متقاطعان في النقطة O، الزاوية AOB تساوي 68 درجة"
      viewBox="0 0 440 340"
    >
      <line x1={c.x} y1={c.y} x2={a.x} y2={a.y} stroke={line} strokeWidth="2.2" />
      <line x1={d.x} y1={d.y} x2={b.x} y2={b.y} stroke={accent} strokeWidth="2.2" />
      <path d={arcPath(cx, cy, 54, 0, 68)} fill="none" stroke="#c08a4d" strokeWidth="2" />
      <path
        d={`${arcPath(cx, cy, 52, 0, 68)} L ${cx} ${cy} Z`}
        fill="#d9a6b5"
        opacity=".22"
      />
      <Dot x={cx} y={cy} />
      <Dot x={a.x} y={a.y} color={line} />
      <Dot x={c.x} y={c.y} color={line} />
      <Dot x={b.x} y={b.y} color={accent} />
      <Dot x={d.x} y={d.y} color={accent} />
      <Label x={a.x + 16} y={a.y + 2}>A</Label>
      <Label x={c.x - 16} y={c.y + 2}>C</Label>
      <Label x={b.x + 4} y={b.y - 16}>B</Label>
      <Label x={d.x - 4} y={d.y + 18}>D</Label>
      <Label x={cx + 20} y={cy + 24}>O</Label>
      <Label x={lab.x + 6} y={lab.y}>68°</Label>
    </SvgFrame>
  );
}

function AdjacentAnglesDiagram() {
  const cx = 220;
  const cy = 192;
  const a = pt(cx, cy, 182, 0);
  const c = pt(cx, cy, 182, 180);
  const b = pt(cx, cy, 170, 137);
  const lab = labelPt(cx, cy, 76, 137, 180);

  return (
    <SvgFrame
      title="ثلاثة أنصاف مستقيمات مبدؤها O: A إلى اليمين، C إلى اليسار، B في الأعلى، والزاوية BOC تساوي 43 درجة"
      viewBox="0 0 440 340"
    >
      <line x1={c.x} y1={c.y} x2={a.x} y2={a.y} stroke={line} strokeWidth="2.2" />
      <line x1={cx} y1={cy} x2={b.x} y2={b.y} stroke={accent} strokeWidth="2.2" />
      <path d={arcPath(cx, cy, 54, 137, 180)} fill="none" stroke="#c08a4d" strokeWidth="2" />
      <path
        d={`${arcPath(cx, cy, 52, 137, 180)} L ${cx} ${cy} Z`}
        fill="#a9c2d8"
        opacity=".26"
      />
      <Dot x={cx} y={cy} />
      <Dot x={a.x} y={a.y} color={line} />
      <Dot x={c.x} y={c.y} color={line} />
      <Dot x={b.x} y={b.y} color={accent} />
      <Label x={a.x + 16} y={a.y + 2}>A</Label>
      <Label x={c.x - 16} y={c.y + 2}>C</Label>
      <Label x={b.x - 16} y={b.y - 8}>B</Label>
      <Label x={cx + 18} y={cy + 24}>O</Label>
      <Label x={lab.x} y={lab.y}>43°</Label>
    </SvgFrame>
  );
}

function ParallelJustifiedDiagram() {
  const A = { x: 100, y: 76 };
  const B = { x: 420, y: 76 };
  const D = { x: 420, y: 302 };
  const C = { x: 252, y: 302 };

  return (
    <SvgFrame
      title="الشكل الرباعي ABCD، فيه AB عمودي على BD وCD عمودي على BD، مع علامتي الزاوية القائمة عند B وD"
      viewBox="0 0 480 360"
    >
      <path
        d={`M ${A.x} ${A.y} L ${B.x} ${B.y} L ${D.x} ${D.y} L ${C.x} ${C.y} Z`}
        fill="#f8eef3"
        opacity=".55"
        stroke={line}
        strokeWidth="2.1"
      />
      <path d="M420 76h-18v18" fill="none" stroke={accent} strokeWidth="2" />
      <path d="M420 302h-18v-18" fill="none" stroke={accent} strokeWidth="2" />
      <Dot x={A.x} y={A.y} />
      <Dot x={B.x} y={B.y} />
      <Dot x={C.x} y={C.y} />
      <Dot x={D.x} y={D.y} />
      <Label x={A.x - 14} y={A.y - 16}>A</Label>
      <Label x={B.x + 16} y={B.y - 16}>B</Label>
      <Label x={C.x - 14} y={C.y + 20}>C</Label>
      <Label x={D.x + 18} y={D.y + 20}>D</Label>
    </SvgFrame>
  );
}

function TriangleLinesDiagram() {
  const O = { x: 220, y: 210 };
  const A = pt(O.x, O.y, 133.63, 140);
  const D = pt(O.x, O.y, 133.63, 320);
  const B = pt(O.x, O.y, 145, 90);
  const C = pt(O.x, O.y, 145, 270);
  const mark50 = labelPt(O.x, O.y, 60, 90, 140);
  const mark70 = labelPt(D.x, D.y, 50, 140, 210);

  return (
    <SvgFrame
      title="المستقيمان AD وBC متقاطعان في O، الزاوية AOB تساوي 50 درجة والزاوية ODC تساوي 70 درجة"
      viewBox="0 0 440 420"
    >
      <line x1={A.x} y1={A.y} x2={D.x} y2={D.y} stroke={line} strokeWidth="2.2" />
      <line x1={B.x} y1={B.y} x2={C.x} y2={C.y} stroke={accent} strokeWidth="2.2" />
      <line x1={C.x} y1={C.y} x2={D.x} y2={D.y} stroke="#8e7bb3" strokeWidth="2" />
      <path d={arcPath(O.x, O.y, 42, 90, 140)} fill="none" stroke="#c08a4d" strokeWidth="2" />
      <path
        d={`${arcPath(O.x, O.y, 40, 90, 140)} L ${O.x} ${O.y} Z`}
        fill="#d9a6b5"
        opacity=".25"
      />
      <path d={arcPath(D.x, D.y, 34, 140, 210)} fill="none" stroke="#8a9c7f" strokeWidth="2" />
      <path
        d={`${arcPath(D.x, D.y, 32, 140, 210)} L ${D.x} ${D.y} Z`}
        fill="#b9cbb0"
        opacity=".3"
      />
      <Dot x={O.x} y={O.y} />
      <Dot x={A.x} y={A.y} color={line} />
      <Dot x={B.x} y={B.y} color={accent} />
      <Dot x={C.x} y={C.y} color={accent} />
      <Dot x={D.x} y={D.y} color={line} />
      <Label x={A.x - 12} y={A.y - 6}>A</Label>
      <Label x={B.x} y={B.y - 16}>B</Label>
      <Label x={C.x - 16} y={C.y + 14}>C</Label>
      <Label x={D.x + 20} y={D.y + 14}>D</Label>
      <Label x={O.x + 20} y={O.y + 18}>O</Label>
      <Label x={mark50.x - 4} y={mark50.y}>50°</Label>
      <Label x={mark70.x + 6} y={mark70.y + 2}>70°</Label>
    </SvgFrame>
  );
}

function IsoscelesDiagram() {
  const B = { x: 80, y: 300 };
  const C = { x: 360, y: 300 };
  const A = { x: 220, y: 76 };
  const midAB = { x: 150, y: 188 };
  const midAC = { x: 290, y: 188 };

  return (
    <SvgFrame
      title="مثلث ABC متساوي الساقين، زاويتا القاعدة عند B وC تساويان 58 درجة"
      viewBox="0 0 440 360"
    >
      <path
        d={`M ${A.x} ${A.y} L ${B.x} ${B.y} L ${C.x} ${C.y} Z`}
        fill="#f6eff8"
        opacity=".65"
        stroke={line}
        strokeWidth="2.2"
      />
      <path d="M150 188l11.8 7.4M290 188l-11.8 7.4" stroke={accent} strokeWidth="2" />
      <path d="M150 188l-11.8-7.4M290 188l11.8-7.4" stroke={accent} strokeWidth="2" />
      <path d={arcPath(B.x, B.y, 42, 0, 58)} fill="none" stroke="#c08a4d" strokeWidth="2" />
      <path d={arcPath(C.x, C.y, 42, 122, 180)} fill="none" stroke="#c08a4d" strokeWidth="2" />
      <Dot x={A.x} y={A.y} />
      <Dot x={B.x} y={B.y} />
      <Dot x={C.x} y={C.y} />
      <Dot x={midAB.x} y={midAB.y} color={accent} />
      <Dot x={midAC.x} y={midAC.y} color={accent} />
      <Label x={A.x} y={A.y - 20}>A</Label>
      <Label x={B.x - 16} y={B.y + 18}>B</Label>
      <Label x={C.x + 16} y={C.y + 18}>C</Label>
      <Label x={131} y={276}>58°</Label>
      <Label x={309} y={276}>58°</Label>
    </SvgFrame>
  );
}

function TriangleAnglesDiagram() {
  const B = { x: 80, y: 300 };
  const C = { x: 380, y: 300 };
  const A = { x: 140.74, y: 113.06 };

  return (
    <SvgFrame
      title="مثلث ABC، الزاوية عند B تساوي 72 درجة والزاوية عند C تساوي 38 درجة"
      viewBox="0 0 440 360"
    >
      <path
        d={`M ${A.x} ${A.y} L ${B.x} ${B.y} L ${C.x} ${C.y} Z`}
        fill="#f2f5ee"
        opacity=".65"
        stroke={line}
        strokeWidth="2.2"
      />
      <path d={arcPath(B.x, B.y, 42, 0, 72)} fill="none" stroke="#c08a4d" strokeWidth="2" />
      <path d={arcPath(C.x, C.y, 42, 142, 180)} fill="none" stroke="#8a9c7f" strokeWidth="2" />
      <Dot x={A.x} y={A.y} />
      <Dot x={B.x} y={B.y} />
      <Dot x={C.x} y={C.y} />
      <Label x={A.x - 8} y={A.y - 18}>A</Label>
      <Label x={B.x - 16} y={B.y + 16}>B</Label>
      <Label x={C.x + 16} y={C.y + 16}>C</Label>
      <Label x={128} y={266}>72°</Label>
      <Label x={324} y={282}>38°</Label>
    </SvgFrame>
  );
}

const renderers: Record<DiagramId, () => React.JSX.Element> = {
  "line-points": LinePointsDiagram,
  perpendicular: PerpendicularDiagram,
  "vertical-angles": VerticalAnglesDiagram,
  "adjacent-angles": AdjacentAnglesDiagram,
  "parallel-justified": ParallelJustifiedDiagram,
  "triangle-lines": TriangleLinesDiagram,
  isosceles: IsoscelesDiagram,
  "triangle-angles": TriangleAnglesDiagram,
};

export function GeometryDiagram({ id }: { id: DiagramId }) {
  const Renderer = renderers[id];
  if (!Renderer) return null;
  return (
    <div className="diagram-shell" dir="ltr">
      <Renderer />
    </div>
  );
}
