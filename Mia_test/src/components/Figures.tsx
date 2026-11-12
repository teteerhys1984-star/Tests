import type { ReactNode } from "react";
import type { FigureId } from "../types";

const INK = "#4b3750";
const LINE = "#5f4b70";
const ROSE = "#b25476";
const LAV = "#8b78b5";
const PAPER = "#fffdfa";

function Point({
  x,
  y,
  label,
  dx = 0,
  dy = -10,
  anchor = "middle",
}: {
  x: number;
  y: number;
  label: string;
  dx?: number;
  dy?: number;
  anchor?: "start" | "middle" | "end";
}) {
  return (
    <g>
      <circle cx={x} cy={y} r={4.3} fill={PAPER} stroke={INK} strokeWidth={1.9} />
      <text
        x={x + dx}
        y={y + dy}
        textAnchor={anchor}
        fontFamily="Georgia, serif"
        fontStyle="italic"
        fontSize={15}
        fontWeight={700}
        fill={INK}
      >
        {label}
      </text>
    </g>
  );
}

function Measure({
  x,
  y,
  children,
  color = ROSE,
  anchor = "middle",
  size = 13,
}: {
  x: number;
  y: number;
  children: ReactNode;
  color?: string;
  anchor?: "start" | "middle" | "end";
  size?: number;
}) {
  return (
    <text
      x={x}
      y={y}
      textAnchor={anchor}
      fontFamily="'Segoe UI', Tahoma, sans-serif"
      fontSize={size}
      fontWeight={700}
      fill={color}
    >
      {children}
    </text>
  );
}

function Tick({ x1, y1, x2, y2 }: { x1: number; y1: number; x2: number; y2: number }) {
  return <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={ROSE} strokeWidth={2.1} />;
}

const figures: Record<FigureId, { title: string; node: ReactNode }> = {
  "line-symbols": {
    title: "مستقيم يمر بالنقاط A وB وC، ونقطة M خارجه",
    node: (
      <>
        <line x1={28} y1={82} x2={402} y2={82} stroke={LINE} strokeWidth={2} />
        <text x={30} y={66} fontFamily="Georgia, serif" fontStyle="italic" fontSize={14} fill={LAV}>
          (AB)
        </text>
        <Point x={100} y={82} label="A" dy={-11} />
        <Point x={240} y={82} label="B" dy={-11} />
        <Point x={340} y={82} label="C" dy={-11} />
        <Point x={255} y={134} label="M" dy={22} />
      </>
    ),
  },
  "intersecting-lines": {
    title: "المستقيمان (d) و(AB) متقاطعان في النقطة O",
    node: (
      <>
        <line x1={35} y1={165} x2={395} y2={35} stroke={LINE} strokeWidth={2} />
        <text x={360} y={26} fontFamily="Georgia, serif" fontStyle="italic" fontSize={14} fill={LAV}>
          (d)
        </text>
        <line x1={115} y1={25} x2={320} y2={190} stroke={ROSE} strokeWidth={2} />
        <text
          x={338}
          y={202}
          fontFamily="Georgia, serif"
          fontStyle="italic"
          fontSize={14}
          fill={ROSE}
        >
          (AB)
        </text>
        <Point x={115} y={25} label="A" dx={-13} dy={4} anchor="end" />
        <Point x={320} y={190} label="B" dx={12} dy={6} anchor="start" />
        <Point x={175} y={114} label="O" dx={-12} dy={17} anchor="end" />
        <Point x={345} y={112} label="M" dy={22} />
      </>
    ),
  },
  "parallel-lines": {
    title: "المستقيمان (L) و(M) متوازيان ويقطعهما المستقيم (d)",
    node: (
      <>
        <line x1={28} y1={92} x2={402} y2={92} stroke={LAV} strokeWidth={2.2} />
        <line x1={28} y1={158} x2={402} y2={158} stroke={ROSE} strokeWidth={2.2} />
        <line x1={82} y1={22} x2={332} y2={208} stroke={LINE} strokeWidth={1.9} />
        <text x={380} y={78} fontFamily="Georgia, serif" fontStyle="italic" fontSize={14} fill={LAV}>
          (L)
        </text>
        <text x={380} y={144} fontFamily="Georgia, serif" fontStyle="italic" fontSize={14} fill={ROSE}>
          (M)
        </text>
        <text x={300} y={212} fontFamily="Georgia, serif" fontStyle="italic" fontSize={14} fill={INK}>
          (d)
        </text>
        <path d="M352 92l9-5M352 92l9 5" stroke={LAV} strokeWidth={1.5} fill="none" />
        <path d="M352 158l9-5M352 158l9 5" stroke={ROSE} strokeWidth={1.5} fill="none" />
      </>
    ),
  },
  "vertical-angles": {
    title: "مستقيمان متقاطعان، إحدى الزوايا قياسها 42 درجة",
    node: (
      <>
        <line x1={45} y1={180.3} x2={385} y2={49.7} stroke={LINE} strokeWidth={2} />
        <line x1={45} y1={49.7} x2={385} y2={180.3} stroke={LINE} strokeWidth={2} />
        <path
          d="M215 115L261.7 97.1A50 50 0 0 1 261.7 132.9Z"
          fill={ROSE}
          fillOpacity={0.13}
          stroke={ROSE}
          strokeWidth={1.8}
        />
        <Measure x={285} y={120} size={15}>
          42°
        </Measure>
        <circle cx={215} cy={115} r={3} fill={LINE} />
        <text x={224} y={132} fontFamily="Georgia, serif" fontStyle="italic" fontSize={13} fill={INK}>
          O
        </text>
      </>
    ),
  },
  "triangle-types": {
    title: "ثلاثة مثلثات بأطوال أضلاع 1 و2 و3",
    node: (
      <>
        <path d="M30 175L72 119L114 175Z" fill={PAPER} stroke={LAV} strokeWidth={2} />
        <Measure x={44} y={143} size={12} color={INK}>
          3.5
        </Measure>
        <Measure x={102} y={143} size={12} color={INK}>
          3.5
        </Measure>
        <Measure x={72} y={191} size={12} color={INK}>
          4.2
        </Measure>
        <Tick x1={45} y1={153} x2={52} y2={163} />
        <Tick x1={99} y1={153} x2={92} y2={163} />

        <path d="M160 175L200 106L240 175Z" fill={PAPER} stroke={LAV} strokeWidth={2} />
        <Measure x={171} y={135} size={12} color={INK}>
          4
        </Measure>
        <Measure x={229} y={135} size={12} color={INK}>
          4
        </Measure>
        <Measure x={200} y={191} size={12} color={INK}>
          4
        </Measure>

        <path d="M300 175L364 127L400 175Z" fill={PAPER} stroke={LAV} strokeWidth={2} />
        <Measure x={320} y={165} size={12} color={INK}>
          4
        </Measure>
        <Measure x={390} y={165} size={12} color={INK}>
          3
        </Measure>
        <Measure x={350} y={192} size={12} color={INK}>
          5
        </Measure>

        {[
          { x: 57, label: "1" },
          { x: 200, label: "2" },
          { x: 340, label: "3" },
        ].map((n) => (
          <g key={n.label}>
            <circle cx={n.x} cy={30} r={12} fill="#fbf1f6" stroke="#e7cbd9" />
            <text
              x={n.x}
              y={35}
              textAnchor="middle"
              fontFamily="'Segoe UI', sans-serif"
              fontSize={13}
              fontWeight={800}
              fill={ROSE}
            >
              {n.label}
            </text>
          </g>
        ))}
        <Measure x={215} y={210} size={11} color="#846d82">
          الأطوال بالسنتيمتر
        </Measure>
      </>
    ),
  },
  "triangle-angles": {
    title: "مثلث ABC، الزاوية A تساوي 48 درجة والزاوية B تساوي 67 درجة",
    node: (
      <>
        <path d="M197 43L130 200L270 200Z" fill={PAPER} stroke={LINE} strokeWidth={2.1} />
        <path
          d="M196 73A31 31 0 0 0 176 90"
          fill="none"
          stroke={ROSE}
          strokeWidth={1.7}
        />
        <Measure x={207} y={88} size={14}>
          48°
        </Measure>
        <path d="M160 185A30 30 0 0 1 144 160" fill="none" stroke={ROSE} strokeWidth={1.7} />
        <Measure x={170} y={178} size={14}>
          67°
        </Measure>
        <text x={197} y={27} textAnchor="middle" fontFamily="Georgia, serif" fontStyle="italic" fontSize={15} fontWeight={700} fill={INK}>
          A
        </text>
        <text x={112} y={214} textAnchor="middle" fontFamily="Georgia, serif" fontStyle="italic" fontSize={15} fontWeight={700} fill={INK}>
          B
        </text>
        <text x={288} y={214} textAnchor="middle" fontFamily="Georgia, serif" fontStyle="italic" fontSize={15} fontWeight={700} fill={INK}>
          C
        </text>
        <circle cx={197} cy={43} r={4} fill={PAPER} stroke={INK} strokeWidth={1.8} />
        <circle cx={130} cy={200} r={4} fill={PAPER} stroke={INK} strokeWidth={1.8} />
        <circle cx={270} cy={200} r={4} fill={PAPER} stroke={INK} strokeWidth={1.8} />
      </>
    ),
  },
  "triangle-exterior": {
    title: "المثلث ABC والقطعة BC ممتدة إلى D",
    node: (
      <>
        <line x1={120} y1={190} x2={400} y2={190} stroke={LINE} strokeWidth={1.8} />
        <path d="M120 190L153 66.7L300 190Z" fill={PAPER} stroke={LINE} strokeWidth={2.1} />
        <path d="M300 190L400 190" stroke={LAV} strokeWidth={2.4} />
        <path d="M146 169A28 28 0 0 0 168 174" fill="none" stroke={ROSE} strokeWidth={1.7} />
        <Measure x={171} y={172} size={13}>
          75°
        </Measure>
        <path d="M153 99A25 25 0 0 0 171 105" fill="none" stroke={ROSE} strokeWidth={1.7} />
        <Measure x={178} y={112} size={13}>
          65°
        </Measure>
        <Point x={153} y={66.7} label="A" dy={-12} />
        <Point x={120} y={190} label="B" dx={-12} dy={6} anchor="end" />
        <Point x={300} y={190} label="C" dy={22} />
        <Point x={400} y={190} label="D" dx={12} dy={6} anchor="start" />
      </>
    ),
  },
  "triangle-isosceles": {
    title: "مثلث متساوي الساقين زاوية رأسه 110 درجات",
    node: (
      <>
        <path d="M65 158L215 53L365 158Z" fill={PAPER} stroke={LINE} strokeWidth={2.1} />
        <Tick x1={131} y1={109} x2={140} y2={116} />
        <Tick x1={290} y1={116} x2={299} y2={109} />
        <path d="M191 80A33 33 0 0 0 239 80" fill="none" stroke={ROSE} strokeWidth={1.8} />
        <Measure x={215} y={102} size={14}>
          110°
        </Measure>
        <Point x={215} y={53} label="A" dy={-12} />
        <Point x={65} y={158} label="B" dx={-13} dy={6} anchor="end" />
        <Point x={365} y={158} label="C" dx={13} dy={6} anchor="start" />
      </>
    ),
  },
  rectangle: {
    title: "ملعب مستطيل طوله 110 أمتار وعرضه 75 متراً",
    node: (
      <>
        <defs>
          <linearGradient id="fieldFill" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f3f8ef" />
            <stop offset="100%" stopColor="#e9f1e4" />
          </linearGradient>
        </defs>
        <rect x={65} y={18} width={300} height={204.5} rx={6} fill="url(#fieldFill)" stroke="#658563" strokeWidth={2.2} />
        <line x1={215} y1={18} x2={215} y2={222.5} stroke="#86a584" strokeWidth={1.4} strokeDasharray="5 5" />
        <circle cx={215} cy={120} r={26} fill="none" stroke="#86a584" strokeWidth={1.4} />
        <text x={215} y={12} textAnchor="middle" fontFamily="'Segoe UI', sans-serif" fontSize={13} fontWeight={700} fill={INK}>
          110 م
        </text>
        <text x={380} y={125} textAnchor="middle" fontFamily="'Segoe UI', sans-serif" fontSize={13} fontWeight={700} fill={INK}>
          75 م
        </text>
        <path d="M74 27h9M74 27v9" stroke="#7c987a" strokeWidth={1.4} fill="none" />
        <path d="M356 214h-9M356 214v-9" stroke="#7c987a" strokeWidth={1.4} fill="none" />
      </>
    ),
  },
};

export function GeometryFigure({ id, caption }: { id: FigureId; caption?: string }) {
  const figure = figures[id];
  if (!figure) return null;
  return (
    <figure className="mt-4 mb-1">
      <div
        className="rounded-2xl border p-2 sm:p-3"
        style={{
          background:
            "linear-gradient(155deg, rgba(255,253,250,0.98), rgba(252,246,250,0.9))",
          borderColor: "#eedde5",
        }}
      >
        <svg
          viewBox="0 0 430 230"
          role="img"
          aria-label={figure.title}
          style={{
            width: "100%",
            height: "auto",
            display: "block",
            maxHeight: 270,
            maxWidth: 520,
            marginInline: "auto",
          }}
        >
          <title>{figure.title}</title>
          {figure.node}
        </svg>
      </div>
      {caption ? (
        <figcaption className="mt-1.5 text-center text-[0.76rem] leading-relaxed" style={{ color: "#8a7181" }}>
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}

export function DecorativeWreath({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 220 220" className={className} aria-hidden role="presentation">
      <defs>
        <linearGradient id="wreathGold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#e4cfa3" />
          <stop offset="100%" stopColor="#c5a15c" />
        </linearGradient>
      </defs>
      <path
        d="M110 190c-42 0-74-30-74-70 0-38 30-70 74-70 43 0 74 32 74 70 0 40-32 70-74 70Z"
        fill="none"
        stroke="url(#wreathGold)"
        strokeWidth="1.6"
      />
      <path
        d="M110 178c-34 0-62-25-62-58 0-32 27-58 62-58s62 26 62 58c0 33-28 58-62 58Z"
        fill="none"
        stroke="url(#wreathGold)"
        strokeWidth="1.1"
        strokeDasharray="2 5"
      />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
        const rad = (angle * Math.PI) / 180;
        const x = 110 + Math.cos(rad) * 74;
        const y = 110 + Math.sin(rad) * 74;
        return (
          <g key={angle} transform={`translate(${x} ${y}) rotate(${angle + 45})`}>
            <ellipse cx="0" cy="-5" rx="4.2" ry="7" fill="#f4dce7" stroke="#d9adc0" strokeWidth="0.8" />
            <ellipse cx="5" cy="1" rx="3.5" ry="5.5" fill="#f7e6ee" stroke="#dcb5c6" strokeWidth="0.7" />
            <circle cx="0" cy="2" r="2" fill="#c5a15c" />
          </g>
        );
      })}
      <path
        d="M110 130c2-16 12-28 28-34-1 17-11 29-28 34Zm0 0c-2-16-12-28-28-34 1 17 11 29 28 34Z"
        fill="#cfdcc5"
        stroke="#a9bc9d"
        strokeWidth="1"
      />
      <circle cx="110" cy="140" r="5" fill="#b85c7c" opacity="0.8" />
      <path d="M110 92l3 8 8 3-8 3-3 8-3-8-8-3 8-3z" fill="url(#wreathGold)" />
    </svg>
  );
}
