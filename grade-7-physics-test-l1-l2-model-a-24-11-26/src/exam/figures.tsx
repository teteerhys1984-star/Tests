/**
 * رسوم النموذج A — أعيد رسمها SVG أصلياً من ملف المصدر:
 *   grade-7-physics-test-Model-A-24-11-26/src/components/diagrams.tsx
 *   وبياناته في src/data/graph.ts
 *
 * الحفاظ على العلم هو الشرط الأساسي، فكل قيمة هندسية لها ثابت مُصدَّر تتحقّق منه
 * الاختبارات الآلية:
 *   · مخطط المسافة/الزمن: أ(0,0) → ب(3,30) → ج(5,30) → د(9,90)؛
 *     أ ب منتظمة (10 m/s)، ب ج سكون (2 s)، ج د غير منتظمة (منحنٍ).
 *     النقطة د تساوي 90 m بالضبط عند t = 9 (المنحنى 30 + 3.75(t−5)²).
 *   · شعاع القوة: 40 N، ومقياس 1 cm ↔ 10 N، ونقطتا التأثير أ و ب.
 *   · خيارات القوة: 20 N نحو اليسار = سهم بطول 2 cm من نقطة التأثير أ.
 *   · المسارات الثلاثة: (1) منحنٍ، (2) مستقيم، (3) دائري.
 *   · الأرض والقمر: رسم توضيحي زخرفي.
 *
 * لم يُستعمل foreignObject ولا KaTeX داخل SVG (لا يُطبع في بعض المتصفحات)،
 * بل نصوص SVG أصلية.
 */

import { useId, type ReactElement } from "react";
import { MixedText } from "../lib/mathx";
import type { FigureId } from "./types";

/* ------------------------------------------------------------------ */
/* ثوابت علمية يتحقّق منها الاختبار                                    */
/* ------------------------------------------------------------------ */

/** نقاط مخطط المسافة/الزمن كما في المصدر (graph.ts). */
export const DT_POINTS = {
  A: { t: 0, d: 0 },
  B: { t: 3, d: 30 },
  C: { t: 5, d: 30 },
  D: { t: 9, d: 90 },
} as const;

export const DT_T_MAX = 9;
export const DT_D_MAX = 90;

/** المقطع أ ب: مسافة 30 m في 3 s → 10 m/s. */
export const DT_SEGMENT_AB_SPEED = 10;
/** المقطع ب ج: سكون من 3 s إلى 5 s → 2 s. */
export const DT_SEGMENT_BC_REST_SECONDS = 2;

/** شعاع القوة: الشدّة ومقياس الرسم. */
export const FORCE_ARROW_FORCE_N = 40;
export const FORCE_ARROW_SCALE_N_PER_CM = 10;
/** خيارات القوة في السؤال 4: 20 N نحو اليسار = 2 cm. */
export const FORCE_OPTION_FORCE_N = 20;
export const FORCE_OPTION_LENGTH_CM = FORCE_OPTION_FORCE_N / FORCE_ARROW_SCALE_N_PER_CM;
/** القوة التي يطلبها السؤال 4ج: 60 N → 6 cm. */
export const FORCE_DERIVED_FORCE_N = 60;
export const FORCE_DERIVED_LENGTH_CM = FORCE_DERIVED_FORCE_N / FORCE_ARROW_SCALE_N_PER_CM;

/** الحدّ الأدنى لنصف قطر قوس المسار الدائري — يُستخدم في التحقّق من الرسم. */
export const PATH_KINDS = ["curved", "straight", "circular"] as const;

/** دالة المسافة للمقطع ج د: منحنٍ تتزايد فيه المسافات (كما في graph.ts). */
export function distanceAt(t: number): number {
  if (t <= 3) return 10 * t;
  if (t <= 5) return 30;
  return 30 + 3.75 * (t - 5) ** 2;
}

/** عينات المقطع ج د لرسم منحنى سلس. */
export function cdSamples(steps = 32): { t: number; d: number }[] {
  const out: { t: number; d: number }[] = [];
  for (let index = 0; index <= steps; index += 1) {
    const t = 5 + (4 * index) / steps;
    out.push({ t, d: distanceAt(t) });
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* أدوات الرسم                                                         */
/* ------------------------------------------------------------------ */

const INK = "#12262e";
const PLUM = "#6b4a9e";
const BLUSH = "#c8568c";
const TEAL = "#0f766e";
const LILAC = "#a98bdd";
const GRAY = "#b9a9c7";

function useMarkerId(prefix: string): string {
  const raw = useId();
  return `${prefix}${raw.replace(/[^a-zA-Z0-9]/g, "")}`;
}

function ArrowHead({ id, color, size = 12 }: { id: string; color: string; size?: number }) {
  const half = size / 2;
  return (
    <marker
      id={id}
      markerWidth={size}
      markerHeight={size}
      refX={size * 0.75}
      refY={half}
      orient="auto"
      markerUnits="userSpaceOnUse"
    >
      <path d={`M1,1 L${size - 1},${half} L1,${size - 1} z`} fill={color} />
    </marker>
  );
}

const svgProps = {
  className: "block h-auto w-full max-w-full",
  preserveAspectRatio: "xMidYMid meet" as const,
};

/* ------------------------------------------------------------------ */
/* 1) المسارات الثلاثة — السؤال 3                                      */
/* ------------------------------------------------------------------ */

const PATH_VARIANTS = {
  straight: { label: "مسار مستقيم", start: { x: 12, y: 52 } },
  curved: { label: "مسار منحنٍ", start: { x: 10, y: 80 } },
  circular: { label: "مسار دائري", start: { x: 50, y: 12 } },
} as const;

export type PathVariant = keyof typeof PATH_VARIANTS;

function PathFigure({ variant }: { variant: PathVariant }) {
  const markerId = useMarkerId("pa");
  const start = PATH_VARIANTS[variant].start;
  const common = {
    fill: "none",
    stroke: PLUM,
    strokeWidth: 3.5,
    strokeLinecap: "round" as const,
    markerEnd: `url(#${markerId})`,
  };
  return (
    <svg viewBox="0 0 100 100" role="img" aria-label={PATH_VARIANTS[variant].label} {...svgProps}>
      <defs>
        <ArrowHead id={markerId} color={PLUM} size={14} />
      </defs>
      {variant === "straight" && <line x1="12" y1="52" x2="88" y2="52" {...common} />}
      {variant === "curved" && <path d="M 10 80 C 32 8, 68 96, 90 22" {...common} />}
      {variant === "circular" && <path d="M 50 12 A 38 38 0 1 0 82.9 31" {...common} />}
      <circle cx={start.x} cy={start.y} r="6" fill={BLUSH} stroke="#fff" strokeWidth="2" />
    </svg>
  );
}

export function PathsBoard() {
  const items: { n: number; variant: PathVariant }[] = [
    { n: 1, variant: "curved" },
    { n: 2, variant: "straight" },
    { n: 3, variant: "circular" },
  ];
  return (
    <div className="mx-auto grid max-w-xl grid-cols-3 gap-2 sm:gap-3">
      {items.map((item) => (
        <figure
          key={item.n}
          className="rounded-[var(--r-sm)] border p-2"
          style={{ borderColor: "var(--line-soft)", background: "#fff" }}
        >
          <figcaption className="mb-1 text-center text-sm font-bold" style={{ color: "var(--navy)" }}>
            ({item.n})
          </figcaption>
          <PathFigure variant={item.variant} />
        </figure>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 2) شعاع القوة وعناصره — السؤال 4                                    */
/* ------------------------------------------------------------------ */

function ForceFigure() {
  const markerId = useMarkerId("ff");
  const a = { x: 190, y: 122 };
  const b = { x: 310, y: 122 };
  return (
    <svg
      viewBox="0 0 360 200"
      role="img"
      aria-label={`صندوق على سطح أفقي تؤثر فيه قوة أفقية شدّتها ${FORCE_ARROW_FORCE_N} نيوتن في النقطة أ نحو اليمين، ومقياس الرسم سنتيمتر واحد = ${FORCE_ARROW_SCALE_N_PER_CM} نيوتن`}
      {...svgProps}
    >
      <defs>
        <ArrowHead id={markerId} color={PLUM} />
      </defs>
      <line x1="20" y1="150" x2="340" y2="150" stroke={INK} strokeWidth="2" />
      {Array.from({ length: 16 }, (_, index) => (
        <line
          key={index}
          x1={30 + index * 20}
          y1="150"
          x2={22 + index * 20}
          y2="158"
          stroke={GRAY}
          strokeWidth="1.5"
        />
      ))}
      <line x1="40" y1="122" x2="330" y2="122" stroke={LILAC} strokeWidth="1.5" strokeDasharray="6 5" />
      <rect x="100" y="95" width="90" height="55" rx="5" fill="#ffe9d8" stroke={INK} strokeWidth="2" />
      <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={PLUM} strokeWidth="4" markerEnd={`url(#${markerId})`} />
      <circle cx={a.x} cy={a.y} r="5" fill="#fff" stroke={INK} strokeWidth="2.5" />
      <text x={a.x - 8} y={a.y - 10} fontSize="15" fontWeight="700" textAnchor="end" fill={INK}>
        أ
      </text>
      <text x={b.x + 2} y={a.y - 10} fontSize="15" fontWeight="700" textAnchor="middle" fill={INK}>
        ب
      </text>
      <text x={(a.x + b.x) / 2} y={a.y + 22} fontSize="13" textAnchor="middle" fill={INK} direction="ltr">
        F = {FORCE_ARROW_FORCE_N} N
      </text>
      <line x1="40" y1="182" x2="70" y2="182" stroke={INK} strokeWidth="2.5" />
      <line x1="40" y1="176" x2="40" y2="188" stroke={INK} strokeWidth="2" />
      <line x1="70" y1="176" x2="70" y2="188" stroke={INK} strokeWidth="2" />
      <text x="78" y="186" fontSize="12" fill={INK} direction="ltr">
        1 cm = {FORCE_ARROW_SCALE_N_PER_CM} N
      </text>
    </svg>
  );
}

/**
 * خيارات تمثيل قوة 20 N نحو اليسار (أربعة رسوم، واحد صحيح).
 * الرسوم منقولة هندسياً من المصدر: (1) 2 cm من أ نحو اليسار = الصحيح،
 * (2) أطول من اللازم، (3) نحو اليمين (جهة خاطئة)، (4) السهم يبدأ من غير نقطة التأثير.
 */
const FORCE_OPTION_ARROWS = {
  1: { x1: 90, x2: 50 },
  2: { x1: 90, x2: 10 },
  3: { x1: 90, x2: 130 },
  4: { x1: 50, x2: 90 },
} as const;

function ForceOptionFigure({ n }: { n: 1 | 2 | 3 | 4 }) {
  const markerId = useMarkerId(`fo${n}`);
  const arrow = FORCE_OPTION_ARROWS[n];
  return (
    <svg viewBox="0 0 150 80" role="img" aria-label={`الرسم (${n})`} {...svgProps}>
      <defs>
        <ArrowHead id={markerId} color={PLUM} size={13} />
      </defs>
      <line x1="5" y1="45" x2="145" y2="45" stroke={LILAC} strokeWidth="1.2" strokeDasharray="4 4" />
      <rect x="90" y="18" width="50" height="54" rx="4" fill="#ffe9d8" fillOpacity="0.85" stroke={INK} strokeWidth="1.8" />
      <line x1={arrow.x1} y1="45" x2={arrow.x2} y2="45" stroke={PLUM} strokeWidth="3" markerEnd={`url(#${markerId})`} />
      <circle cx="90" cy="45" r="4" fill="#fff" stroke={INK} strokeWidth="2" />
      <text x="96" y="34" fontSize="12" fontWeight="700" fill={INK}>
        أ
      </text>
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* 3) مخطط المسافة بدلالة الزمن — السؤال 8                             */
/* ------------------------------------------------------------------ */

function DtGraph() {
  const x0 = 36;
  const x1 = 252;
  const y0 = 194;
  const y1 = 16;
  const x = (t: number) => x0 + (t / DT_T_MAX) * (x1 - x0);
  const y = (d: number) => y0 - (d / DT_D_MAX) * (y0 - y1);
  const curve = cdSamples(32)
    .map((sample) => `${x(sample.t).toFixed(1)},${y(sample.d).toFixed(1)}`)
    .join(" ");
  const labels: { key: keyof typeof DT_POINTS; letter: string; dx: number; dy: number; anchor: "start" | "end" | "middle" }[] = [
    { key: "A", letter: "أ", dx: 7, dy: -14, anchor: "start" },
    { key: "B", letter: "ب", dx: 7, dy: 17, anchor: "start" },
    { key: "C", letter: "ج", dx: 7, dy: 17, anchor: "start" },
    { key: "D", letter: "د", dx: -9, dy: -4, anchor: "end" },
  ];
  return (
    <div dir="ltr" className="mx-auto flex w-full max-w-md items-stretch gap-1">
      <div className="flex items-center justify-center">
        <span
          className="whitespace-nowrap text-[0.8rem] font-semibold"
          style={{ color: "var(--ink-3)", writingMode: "vertical-rl", transform: "rotate(180deg)" }}
        >
          المسافة d (m)
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <svg
          viewBox="0 0 260 216"
          role="img"
          aria-label="مخطط المسافة بدلالة الزمن: مقطع أ ب مستقيم مائل (حركة منتظمة)، ثم مقطع ب ج أفقي (جسم ساكن)، ثم مقطع ج د منحنٍ (حركة غير منتظمة)"
          {...svgProps}
        >
          {Array.from({ length: 10 }, (_, index) => (
            <line key={`gv${index}`} x1={x(index)} y1={y1} x2={x(index)} y2={y0} stroke="#efe3f4" strokeWidth="1" />
          ))}
          {Array.from({ length: 10 }, (_, index) => (
            <line key={`gh${index}`} x1={x0} y1={y(index * 10)} x2={x1} y2={y(index * 10)} stroke="#efe3f4" strokeWidth="1" />
          ))}
          <line x1={x0} y1={y1 - 6} x2={x0} y2={y0} stroke={INK} strokeWidth="2" />
          <line x1={x0} y1={y0} x2={x1 + 6} y2={y0} stroke={INK} strokeWidth="2" />
          {Array.from({ length: 10 }, (_, index) => (
            <g key={`t${index}`}>
              <line x1={x(index)} y1={y0} x2={x(index)} y2={y0 + 4} stroke={INK} strokeWidth="1.5" />
              <text x={x(index)} y={y0 + 17} fontSize="12" textAnchor="middle" fill={INK}>
                {index}
              </text>
            </g>
          ))}
          {Array.from({ length: 10 }, (_, index) => (
            <g key={`d${index}`}>
              <line x1={x0 - 4} y1={y(index * 10)} x2={x0} y2={y(index * 10)} stroke={INK} strokeWidth="1.5" />
              <text x={x0 - 7} y={y(index * 10) + 4} fontSize="12" textAnchor="end" fill={INK}>
                {index * 10}
              </text>
            </g>
          ))}
          <line
            x1={x(DT_POINTS.A.t)}
            y1={y(DT_POINTS.A.d)}
            x2={x(DT_POINTS.B.t)}
            y2={y(DT_POINTS.B.d)}
            stroke={TEAL}
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          <line
            x1={x(DT_POINTS.B.t)}
            y1={y(DT_POINTS.B.d)}
            x2={x(DT_POINTS.C.t)}
            y2={y(DT_POINTS.C.d)}
            stroke={BLUSH}
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          <polyline points={curve} fill="none" stroke={PLUM} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
          {labels.map((label) => {
            const point = DT_POINTS[label.key];
            return (
              <g key={label.key}>
                <circle cx={x(point.t)} cy={y(point.d)} r="4.5" fill="#fff" stroke={INK} strokeWidth="2" />
                <text
                  x={x(point.t) + label.dx}
                  y={y(point.d) + label.dy}
                  fontSize="14"
                  fontWeight="700"
                  textAnchor={label.anchor}
                  fill={INK}
                >
                  {label.letter}
                </text>
              </g>
            );
          })}
        </svg>
        <p className="mt-1 text-center text-[0.8rem] font-semibold" style={{ color: "var(--ink-3)" }} dir="rtl">
          الزمن t (s)
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 4) الأرض والقمر — السؤال 7 (زخرفي توضيحي)                            */
/* ------------------------------------------------------------------ */

function EarthMoon() {
  return (
    <div dir="ltr" className="mx-auto max-w-sm">
      <svg viewBox="0 0 320 150" role="img" aria-label="كرة الأرض وكرة القمر" {...svgProps}>
        <circle cx="85" cy="70" r="48" fill="#8ec9ee" stroke="#4fb3e8" strokeWidth="2.5" />
        <path d="M 55 52 q 14 -14 30 -6 q 12 8 2 20 q -16 8 -28 -2 z" fill="#9bd9a9" />
        <path d="M 80 92 q 18 -8 30 4 q 4 12 -10 16 q -18 2 -24 -10 z" fill="#9bd9a9" />
        <circle cx="235" cy="70" r="32" fill="#ded8e6" stroke={GRAY} strokeWidth="2.5" />
        <circle cx="226" cy="60" r="7" fill="#c7bfd1" />
        <circle cx="248" cy="80" r="5" fill="#c7bfd1" />
        <circle cx="240" cy="54" r="3.5" fill="#c7bfd1" />
        <circle cx="222" cy="84" r="4" fill="#c7bfd1" />
      </svg>
      <div className="grid grid-cols-2 text-center text-sm font-semibold" dir="rtl" style={{ color: "var(--ink-3)" }}>
        <span>الأرض</span>
        <span>القمر</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 5) جدول بيانات — السؤال 5                                           */
/* ------------------------------------------------------------------ */

export function DataTable({ head, rows }: { head: string[]; rows: string[][] }) {
  return (
    <div className="overflow-hidden rounded-[var(--r-sm)] border" style={{ borderColor: "var(--line-soft)" }}>
      <table className="w-full text-sm sm:text-base">
        <thead style={{ background: "var(--surface-2)" }}>
          <tr>
            {head.map((cell, index) => (
              <th key={index} className="px-2 py-2 text-start font-bold" style={{ color: "var(--navy)" }}>
                <MixedCell text={cell} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} style={{ background: rowIndex % 2 ? "#fff" : "var(--surface-2)" }}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="px-2 py-2 sm:px-3">
                  {cellIndex === 0 ? <MixedCell text={cell} /> : <span dir="ltr" className="tnum">{cell}</span>}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** خلية جدول قد تحوي $...$ — تُعرض بـ KaTeX. */
function MixedCell({ text }: { text: string }) {
  return <MixedText text={text} />;
}

/* ------------------------------------------------------------------ */
/* 6) المخزّن النهائي للرسوم                                            */
/* ------------------------------------------------------------------ */

const FIGURES: Record<FigureId, () => ReactElement> = {
  paths: PathsBoard,
  force: ForceFigure,
  "dt-graph": DtGraph,
  "earth-moon": EarthMoon,
  "force-opt-1": () => <ForceOptionFigure n={1} />,
  "force-opt-2": () => <ForceOptionFigure n={2} />,
  "force-opt-3": () => <ForceOptionFigure n={3} />,
  "force-opt-4": () => <ForceOptionFigure n={4} />,
};

/** رسوم تُدير إطارها بنفسها (شبكة مسارات/مخطط بإطار خاص). */
const FRAMELESS = new Set<FigureId>(["paths", "dt-graph", "earth-moon", "force-opt-1", "force-opt-2", "force-opt-3", "force-opt-4"]);

/**
 * غلاف عرض الرسم: الرسوم المستقلّة تُعرض داخل إطار `.figure-stage` الموحّد،
 * وشبكة المسارات والمخطط وخيارات القوة تُعرض بإطارها الخاص.
 */
export function Figure({ type }: { type: FigureId }) {
  const Component = FIGURES[type];
  const framed = !FRAMELESS.has(type);
  return (
    <div className={framed ? "figure-stage" : "figure-plain"} data-figure={type}>
      <Component />
    </div>
  );
}
