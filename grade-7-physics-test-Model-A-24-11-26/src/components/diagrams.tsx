import { useId } from 'react';
import type { DiagramId } from '../types';
import { DT_D_MAX, DT_POINTS, DT_T_MAX, cdSamples } from '../data/graph';
import { RichText } from './Tex';

const INK = '#3d2b4f';
const PLUM = '#7a52b5';
const BLUSH = '#e8709f';
const TEAL = '#2fae94';
const LILAC = '#a98bdd';
const GRAY = '#b9a9c7';

function useMarkerId(): string {
  const raw = useId();
  return 'm' + raw.replace(/[^a-zA-Z0-9]/g, '');
}

function ArrowHead({ id, color, size = 12 }: { id: string; color: string; size?: number }) {
  const half = size / 2;
  return (
    <marker id={id} markerWidth={size} markerHeight={size} refX={size * 0.75} refY={half} orient="auto" markerUnits="userSpaceOnUse">
      <path d={`M1,1 L${size - 1},${half} L1,${size - 1} z`} fill={color} />
    </marker>
  );
}

const svgProps = {
  className: 'block h-auto w-full max-w-full',
  preserveAspectRatio: 'xMidYMid meet' as const,
};

/** ---------- أنواع المسارات (السؤال 3) ---------- */
export function PathFigure({ variant }: { variant: 'straight' | 'curved' | 'circular' }) {
  const id = useMarkerId();
  const start = variant === 'straight' ? { x: 12, y: 52 } : variant === 'curved' ? { x: 10, y: 80 } : { x: 50, y: 12 };
  const label = variant === 'straight' ? 'مسار مستقيم' : variant === 'curved' ? 'مسار منحنٍ' : 'مسار دائري';
  const common = { fill: 'none', stroke: PLUM, strokeWidth: 3.5, strokeLinecap: 'round' as const, markerEnd: `url(#${id})` };
  return (
    <svg viewBox="0 0 100 100" role="img" aria-label={label} {...svgProps}>
      <defs>
        <ArrowHead id={id} color={PLUM} size={14} />
      </defs>
      {variant === 'straight' && <line x1="12" y1="52" x2="88" y2="52" {...common} />}
      {variant === 'curved' && <path d="M 10 80 C 32 8, 68 96, 90 22" {...common} />}
      {variant === 'circular' && <path d="M 50 12 A 38 38 0 1 0 82.9 31" {...common} />}
      <circle cx={start.x} cy={start.y} r="6" fill={BLUSH} stroke="#fff" strokeWidth="2" />
    </svg>
  );
}

export function PathsBoard() {
  const items: { n: number; v: 'straight' | 'curved' | 'circular' }[] = [
    { n: 1, v: 'curved' },
    { n: 2, v: 'straight' },
    { n: 3, v: 'circular' },
  ];
  return (
    <div className="mx-auto grid max-w-md grid-cols-3 gap-2 sm:gap-4">
      {items.map((it) => (
        <figure key={it.n} className="rounded-2xl border border-blush-100 bg-white p-2">
          <figcaption className="mb-1 text-center text-sm font-bold text-plum-700">({it.n})</figcaption>
          <PathFigure variant={it.v} />
        </figure>
      ))}
    </div>
  );
}

/** ---------- تمثيل القوة (السؤال 4) ---------- */
export function ForceFigure() {
  const id = useMarkerId();
  const A = { x: 190, y: 122 };
  const B = { x: 310, y: 122 };
  return (
    <svg viewBox="0 0 360 200" role="img" aria-label="صندوق على سطح أفقي تؤثر فيه قوة أفقية في النقطة أ نحو اليمين" {...svgProps}>
      <defs>
        <ArrowHead id={id} color={PLUM} />
      </defs>
      <line x1="20" y1="150" x2="340" y2="150" stroke={INK} strokeWidth="2" />
      {Array.from({ length: 16 }, (_, i) => (
        <line key={i} x1={30 + i * 20} y1="150" x2={22 + i * 20} y2="158" stroke={GRAY} strokeWidth="1.5" />
      ))}
      <line x1="40" y1="122" x2="330" y2="122" stroke={LILAC} strokeWidth="1.5" strokeDasharray="6 5" />
      <rect x="100" y="95" width="90" height="55" rx="5" fill="#ffe9d8" stroke={INK} strokeWidth="2" />
      <line x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke={PLUM} strokeWidth="4" markerEnd={`url(#${id})`} />
      <circle cx={A.x} cy={A.y} r="5" fill="#fff" stroke={INK} strokeWidth="2.5" />
      <text x={A.x - 8} y={A.y - 10} fontSize="15" fontWeight="700" textAnchor="end" fill={INK}>
        أ
      </text>
      <text x={B.x + 2} y={A.y - 10} fontSize="15" fontWeight="700" textAnchor="middle" fill={INK}>
        ب
      </text>
      <text x={(A.x + B.x) / 2} y={A.y + 22} fontSize="13" textAnchor="middle" fill={INK} direction="ltr">
        F = 40 N
      </text>
      <line x1="40" y1="182" x2="70" y2="182" stroke={INK} strokeWidth="2.5" />
      <line x1="40" y1="176" x2="40" y2="188" stroke={INK} strokeWidth="2" />
      <line x1="70" y1="176" x2="70" y2="188" stroke={INK} strokeWidth="2" />
      <text x="78" y="186" fontSize="12" fill={INK} direction="ltr">
        1 cm = 10 N
      </text>
    </svg>
  );
}

export function ForceOptionFigure({ n }: { n: 1 | 2 | 3 | 4 }) {
  const id = useMarkerId();
  const A = { x: 90, y: 45 };
  const arrows = { 1: { x1: 90, x2: 50 }, 2: { x1: 90, x2: 10 }, 3: { x1: 90, x2: 130 }, 4: { x1: 50, x2: 90 } } as const;
  const a = arrows[n];
  return (
    <svg viewBox="0 0 150 80" role="img" aria-label={`الرسم (${n})`} {...svgProps}>
      <defs>
        <ArrowHead id={id} color={PLUM} size={13} />
      </defs>
      <line x1="5" y1="45" x2="145" y2="45" stroke={LILAC} strokeWidth="1.2" strokeDasharray="4 4" />
      <rect x="90" y="18" width="50" height="54" rx="4" fill="#ffe9d8" fillOpacity="0.85" stroke={INK} strokeWidth="1.8" />
      <line x1={a.x1} y1="45" x2={a.x2} y2="45" stroke={PLUM} strokeWidth="3" markerEnd={`url(#${id})`} />
      <circle cx={A.x} cy={A.y} r="4" fill="#fff" stroke={INK} strokeWidth="2" />
      <text x="96" y="34" fontSize="12" fontWeight="700" fill={INK}>
        أ
      </text>
    </svg>
  );
}

/** ---------- مخطط المسافة بدلالة الزمن (السؤال 8) ---------- */
export function DtGraph() {
  const X0 = 36;
  const X1 = 252;
  const Y0 = 194;
  const Y1 = 16;
  const x = (t: number) => X0 + (t / DT_T_MAX) * (X1 - X0);
  const y = (d: number) => Y0 - (d / DT_D_MAX) * (Y0 - Y1);
  const P = DT_POINTS;
  const curve = cdSamples(32)
    .map((s) => `${x(s.t).toFixed(1)},${y(s.d).toFixed(1)}`)
    .join(' ');
  const labels: { key: keyof typeof DT_POINTS; letter: string; dx: number; dy: number; anchor: 'start' | 'end' | 'middle' }[] = [
    { key: 'A', letter: 'أ', dx: 7, dy: -14, anchor: 'start' },
    { key: 'B', letter: 'ب', dx: 7, dy: 17, anchor: 'start' },
    { key: 'C', letter: 'ج', dx: 7, dy: 17, anchor: 'start' },
    { key: 'D', letter: 'د', dx: -9, dy: -4, anchor: 'end' },
  ];
  return (
    <div dir="ltr" className="mx-auto flex w-full max-w-sm items-stretch gap-1">
      <div className="flex items-center justify-center">
        <span className="text-sm font-semibold text-ink-soft [writing-mode:vertical-rl] rotate-180 whitespace-nowrap">
          المسافة <span className="tex font-normal">d</span> (m)
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <svg viewBox="0 0 260 216" role="img" aria-label="مخطط المسافة بدلالة الزمن: مقطع مائل مستقيم، ثم مقطع أفقي، ثم مقطع منحنٍ" {...svgProps}>
          {Array.from({ length: 10 }, (_, i) => (
            <line key={`gv${i}`} x1={x(i)} y1={Y1} x2={x(i)} y2={Y0} stroke="#efe3f4" strokeWidth="1" />
          ))}
          {Array.from({ length: 10 }, (_, i) => (
            <line key={`gh${i}`} x1={X0} y1={y(i * 10)} x2={X1} y2={y(i * 10)} stroke="#efe3f4" strokeWidth="1" />
          ))}
          <line x1={X0} y1={Y1 - 6} x2={X0} y2={Y0} stroke={INK} strokeWidth="2" />
          <line x1={X0} y1={Y0} x2={X1 + 6} y2={Y0} stroke={INK} strokeWidth="2" />
          {Array.from({ length: 10 }, (_, i) => (
            <g key={`t${i}`}>
              <line x1={x(i)} y1={Y0} x2={x(i)} y2={Y0 + 4} stroke={INK} strokeWidth="1.5" />
              <text x={x(i)} y={Y0 + 17} fontSize="12" textAnchor="middle" fill={INK}>
                {i}
              </text>
            </g>
          ))}
          {Array.from({ length: 10 }, (_, i) => (
            <g key={`d${i}`}>
              <line x1={X0 - 4} y1={y(i * 10)} x2={X0} y2={y(i * 10)} stroke={INK} strokeWidth="1.5" />
              <text x={X0 - 7} y={y(i * 10) + 4} fontSize="12" textAnchor="end" fill={INK}>
                {i * 10}
              </text>
            </g>
          ))}
          <line x1={x(P.A.t)} y1={y(P.A.d)} x2={x(P.B.t)} y2={y(P.B.d)} stroke={TEAL} strokeWidth="3.5" strokeLinecap="round" />
          <line x1={x(P.B.t)} y1={y(P.B.d)} x2={x(P.C.t)} y2={y(P.C.d)} stroke={BLUSH} strokeWidth="3.5" strokeLinecap="round" />
          <polyline points={curve} fill="none" stroke={PLUM} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
          {labels.map((l) => {
            const p = DT_POINTS[l.key];
            return (
              <g key={l.key}>
                <circle cx={x(p.t)} cy={y(p.d)} r="4.5" fill="#fff" stroke={INK} strokeWidth="2" />
                <text x={x(p.t) + l.dx} y={y(p.d) + l.dy} fontSize="14" fontWeight="700" textAnchor={l.anchor} fill={INK}>
                  {l.letter}
                </text>
              </g>
            );
          })}
        </svg>
        <p className="mt-1 text-center text-sm font-semibold text-ink-soft" dir="rtl">
          الزمن <span className="tex font-normal">t</span> (s)
        </p>
      </div>
    </div>
  );
}

/** ---------- الأرض والقمر (السؤال 7) ---------- */
export function EarthMoon() {
  return (
    <div dir="ltr" className="mx-auto max-w-sm">
      <svg viewBox="0 0 320 150" role="img" aria-label="كرة الأرض وكرة القمر" {...svgProps}>
        <circle cx="85" cy="70" r="48" fill="#8ec9ee" stroke="#4fb3e8" strokeWidth="2.5" />
        <path d="M 55 52 q 14 -14 30 -6 q 12 8 2 20 q -16 8 -28 -2 z" fill="#9bd9a9" />
        <path d="M 80 92 q 18 -8 30 4 q 4 12 -10 16 q -18 2 -24 -10 z" fill="#9bd9a9" />
        <circle cx="235" cy="70" r="32" fill="#ded8e6" stroke="#b9a9c7" strokeWidth="2.5" />
        <circle cx="226" cy="60" r="7" fill="#c7bfd1" />
        <circle cx="248" cy="80" r="5" fill="#c7bfd1" />
        <circle cx="240" cy="54" r="3.5" fill="#c7bfd1" />
        <circle cx="222" cy="84" r="4" fill="#c7bfd1" />
      </svg>
      <div className="grid grid-cols-2 text-center text-sm font-semibold text-ink-soft" dir="rtl">
        <span>الأرض</span>
        <span>القمر</span>
      </div>
    </div>
  );
}

/** ---------- جدول بيانات ---------- */
export function DataTable({ table }: { table: { head: string[]; rows: string[][] } }) {
  return (
    <div className="mt-4 rounded-2xl border border-blush-100">
      <table className="w-full text-sm sm:text-base">
        <thead className="bg-lilac-100/70">
          <tr>
            {table.head.map((h, i) => (
              <th key={i} className="px-2 py-2 text-start font-semibold sm:px-3">
                <RichText text={h} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((r, ri) => (
            <tr key={ri} className={ri % 2 ? 'bg-white' : 'bg-blush-50/50'}>
              {r.map((c, ci) => (
                <td key={ci} className="px-2 py-2 sm:px-3">
                  {ci === 0 ? <RichText text={c} /> : <span dir="ltr" className="tabular">{c}</span>}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Diagram({ id }: { id: DiagramId }) {
  switch (id) {
    case 'paths':
      return <PathsBoard />;
    case 'force':
      return <div className="mx-auto max-w-lg"><ForceFigure /></div>;
    case 'dt-graph':
      return <DtGraph />;
    case 'earth-moon':
      return <EarthMoon />;
    case 'force-opt-1':
      return <ForceOptionFigure n={1} />;
    case 'force-opt-2':
      return <ForceOptionFigure n={2} />;
    case 'force-opt-3':
      return <ForceOptionFigure n={3} />;
    case 'force-opt-4':
      return <ForceOptionFigure n={4} />;
  }
}
