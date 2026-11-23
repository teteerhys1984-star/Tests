import {
  Apple,
  BusFront,
  Car,
  CarTaxiFront,
  Clock3,
  Footprints,
  Gauge,
  Mountain,
  MoveUpRight,
  Package,
  PersonStanding,
  Ruler,
  Scale,
  ShoppingBag,
  Sparkles,
  TrainFront,
  Volume2,
  Waves,
  Weight,
  Wheat,
  Bike,
  Timer,
  ArrowLeftRight,
  Boxes,
  CircleDot,
  Flag,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import type { FigureSpec, JourneyIcon } from "@/content/problems";
import { cn } from "@/utils/cn";

const journeyIcon: Record<JourneyIcon, LucideIcon> = {
  car: Car,
  bike: Bike,
  bus: BusFront,
  train: TrainFront,
  walker: PersonStanding,
  taxi: CarTaxiFront,
  skater: Footprints,
};

const toneStyles = {
  green: {
    scene: "from-[#f9e3ec] via-[#fcf5f7] to-[#f8c8db]",
    halo: "from-emerald-600 to-teal-800",
    accent: "text-emerald-800",
  },
  gold: {
    scene: "from-[#f1e6ff] via-[#faf4ff] to-[#f1e6ff]",
    halo: "from-amber-600 to-[#9160cf]",
    accent: "text-amber-900",
  },
  teal: {
    scene: "from-[#f3e3f9] via-[#faf5fc] to-[#e8c8f8]",
    halo: "from-teal-600 to-[#441b67]",
    accent: "text-teal-900",
  },
} as const;

function FigureShell({
  children,
  label = "مشهد المسألة",
  className,
}: {
  children: ReactNode;
  label?: string;
  className?: string;
}) {
  return (
    <figure className={cn("problem-figure", className)}>
      <div className="figure-topline">
        <span className="figure-kicker">
          <Sparkles className="size-3.5" aria-hidden="true" />
          {label}
        </span>
        <span className="figure-live" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
      </div>
      {children}
    </figure>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  tone = "light",
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  tone?: "light" | "dark";
}) {
  return (
    <div className={cn("metric-card", tone === "dark" && "metric-card-dark")}>
      <span className="metric-icon">
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="metric-label">{label}</span>
        <span className="metric-value" dir="ltr">
          {value}
        </span>
      </span>
    </div>
  );
}

function JourneyScene({ spec }: { spec: Extract<FigureSpec, { kind: "journey" }> }) {
  const Icon = journeyIcon[spec.icon];
  const tone = toneStyles[spec.tone ?? "green"];
  return (
    <FigureShell>
      <div className={cn("journey-scene bg-gradient-to-bl", tone.scene)}>
        <div className="scene-grid" aria-hidden="true" />
        <div className="scene-orb scene-orb-one" aria-hidden="true" />
        <div className="scene-orb scene-orb-two" aria-hidden="true" />

        <svg className="journey-landscape" viewBox="0 0 360 160" preserveAspectRatio="none" aria-hidden="true">
          <circle cx="298" cy="30" r="17" fill="#e3cffb" opacity=".65" />
          <circle cx="298" cy="30" r="25" fill="none" stroke="#e3cffb" strokeOpacity=".35" strokeDasharray="2 5" />
          <path d="M0 112 C 42 84 72 100 108 92 C 146 84 164 62 204 76 C 244 90 266 104 306 88 C 332 78 348 86 360 94 L360 160 L0 160 Z" fill="#ef97bd" opacity=".5" />
          <path d="M0 130 C 48 112 80 124 118 116 C 162 107 198 92 242 108 C 284 122 324 118 360 108 L360 160 L0 160 Z" fill="#ef97bd" opacity=".6" />
          <g stroke="#9c5469" strokeOpacity=".55">
            <g transform="translate(34 118)">
              <rect x="-1.2" y="0" width="2.4" height="12" fill="#9c5469" stroke="none" />
              <circle cx="0" cy="-3" r="8" fill="#b98395" stroke="none" opacity=".85" />
              <circle cx="7" cy="1" r="5.5" fill="#b98395" stroke="none" opacity=".8" />
            </g>
            <g transform="translate(320 112) scale(.85)">
              <rect x="-1.2" y="0" width="2.4" height="12" fill="#9c5469" stroke="none" />
              <circle cx="0" cy="-3" r="8" fill="#b98395" stroke="none" opacity=".85" />
              <circle cx="-7" cy="2" r="5.5" fill="#b98395" stroke="none" opacity=".8" />
            </g>
          </g>
          <path d="M0 148 C 70 142 120 150 190 146 C 260 142 316 148 360 144" fill="none" stroke="#ffffff" strokeOpacity=".35" strokeDasharray="3 6" />
        </svg>

        <div className="relative z-10 flex flex-wrap items-center justify-between gap-2">
          <span className="figure-place">
            <CircleDot className="size-3.5" aria-hidden="true" />
            {spec.place}
          </span>
          <span className="figure-tag">
            <Waves className="size-3.5" aria-hidden="true" />
            مسار مباشر
          </span>
        </div>

        <div className="relative z-10 my-6 grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-4">
          <div className="flex justify-start">
            <MetricCard icon={Ruler} label="المسافة" value={spec.distance} />
          </div>
          <div className="vehicle-halo">
            <svg viewBox="0 0 120 120" className="vehicle-dial" aria-hidden="true">
              {Array.from({ length: 26 }).map((_, index) => {
                const angle = -215 + index * (250 / 25);
                const major = index % 5 === 0;
                return (
                  <line
                    key={index}
                    x1="60"
                    y1={major ? 8 : 10}
                    x2="60"
                    y2={major ? 17 : 14}
                    stroke={major ? "#743f76" : "#b98395"}
                    strokeOpacity={major ? 0.85 : 0.5}
                    strokeWidth={major ? 2 : 1.2}
                    strokeLinecap="round"
                    transform={`rotate(${angle} 60 60)`}
                  />
                );
              })}
              <path d="M24 84 A 46 46 0 0 1 54 22" fill="none" stroke="#b183e6" strokeWidth="2" strokeOpacity=".55" strokeLinecap="round" />
              <text x="60" y="112" textAnchor="middle" fontSize="6" letterSpacing="1.6" fill="#b39aa8" fontFamily="IBM Plex Sans Arabic, sans-serif">
                SPEED
              </text>
            </svg>
            <span className={cn("vehicle-medallion bg-gradient-to-br", tone.halo)}>
              <Icon className="size-9 text-white sm:size-11" strokeWidth={1.8} aria-hidden="true" />
            </span>
            <span className="vehicle-speed-line vehicle-speed-line-a" aria-hidden="true" />
            <span className="vehicle-speed-line vehicle-speed-line-b" aria-hidden="true" />
            <span className="vehicle-speed-line vehicle-speed-line-c" aria-hidden="true" />
          </div>
          <div className="flex justify-end">
            <MetricCard icon={Clock3} label="الزمن / السرعة" value={spec.time} />
          </div>
        </div>

        <div className="relative z-10 mt-auto">
          <div className="journey-track">
            <span className="journey-pin journey-pin-start" aria-hidden="true">
              <Flag className="size-2.5" />
            </span>
            <span className="journey-pin journey-pin-end" aria-hidden="true">
              <Sparkles className="size-2.5" />
            </span>
            <span className="journey-progress" aria-hidden="true" />
            <div className="road-strip">
              <span className="road-dash" />
              <span className="road-dash" />
              <span className="road-dash" />
              <span className="road-dash" />
              <span className="road-dash" />
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] font-medium text-[#743f76]">
            <span className="flex items-center gap-1">
              <Flag className="size-3" aria-hidden="true" /> نقطة الانطلاق
            </span>
            <span className="flex items-center gap-1">
              نقطة الوصول <MoveUpRight className="size-3" aria-hidden="true" />
            </span>
          </div>
        </div>
      </div>
    </FigureShell>
  );
}

function RoundTripScene({ spec }: { spec: Extract<FigureSpec, { kind: "roundtrip" }> }) {
  const Icon = journeyIcon[spec.icon ?? "walker"];
  return (
    <FigureShell label="مسقط حركي للمسار">
      <div className="roundtrip-scene">
        <div className="scene-grid" aria-hidden="true" />
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-2">
          <span className="figure-place">
            <CircleDot className="size-3.5" aria-hidden="true" />
            {spec.place}
          </span>
          <span className="figure-tag">
            <ArrowLeftRight className="size-3.5" aria-hidden="true" />
            ذهاب وعودة
          </span>
        </div>
        <div className="relative z-10 mt-1 flex items-center justify-center">
          <svg viewBox="0 0 340 170" className="w-full max-w-[350px]" aria-hidden="true">
            <defs>
              <linearGradient id="trackGradient" x1="0" x2="1">
                <stop offset="0" stopColor="#96549c" />
                <stop offset="1" stopColor="#e0b8c5" />
              </linearGradient>
            </defs>
            <ellipse cx="170" cy="88" rx="124" ry="58" fill="none" stroke="#f8c8db" strokeWidth="20" />
            <ellipse cx="170" cy="88" rx="124" ry="58" fill="none" stroke="url(#trackGradient)" strokeWidth="2" strokeDasharray="7 7" />
            <circle cx="294" cy="88" r="9" fill="#301545" />
            <circle cx="294" cy="88" r="3.5" fill="#f1e6ff" />
            <path d="M276 37 C304 48 318 63 322 85" fill="none" stroke="#441b67" strokeWidth="2.5" markerEnd="none" />
            <polygon points="322,85 315,78 326,75" fill="#441b67" />
            <text x="139" y="94" fill="#441b67" fontSize="11" fontWeight="600" textAnchor="middle" direction="ltr">
              {spec.totalDistance}
            </text>
          </svg>
          <span className="track-runner">
            <Icon className="size-7 text-white" strokeWidth={1.8} aria-hidden="true" />
          </span>
        </div>
        <div className="relative z-10 mt-2 grid grid-cols-2 gap-2">
          <MetricCard icon={Clock3} label="الزمن الكلي" value={spec.time} tone="dark" />
          <MetricCard icon={Ruler} label="المسافة الكلية" value={spec.totalDistance} tone="dark" />
        </div>
      </div>
    </FigureShell>
  );
}

function GraphScene({ spec }: { spec: Extract<FigureSpec, { kind: "graph" }> }) {
  const width = 460;
  const height = 250;
  const pad = { top: 22, right: 22, bottom: 38, left: 46 };
  const xMax = Math.max(...spec.points.map((p) => p.x), 1);
  const rawYMax = Math.max(...spec.points.map((p) => p.y), 1);
  const yMax = Math.max(20, Math.ceil(rawYMax / 60) * 60);
  const x = (v: number) => pad.left + (v / xMax) * (width - pad.left - pad.right);
  const y = (v: number) => height - pad.bottom - (v / yMax) * (height - pad.top - pad.bottom);
  const line = spec.points.map((p) => `${x(p.x)},${y(p.y)}`).join(" ");
  const area = `${x(0)},${y(0)} ${line} ${x(xMax)},${y(0)}`;
  const yTicks = [0, yMax / 4, yMax / 2, (3 * yMax) / 4, yMax];

  return (
    <FigureShell label="الخط البياني للمسافة والزمن">
      <div className="graph-scene">
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-2">
          <span className="figure-place">
            <Gauge className="size-3.5" aria-hidden="true" />
            تحليل الرحلة
          </span>
          <div className="flex gap-1.5">
            <span className="figure-tag" dir="ltr">
              d / {spec.distanceUnit}
            </span>
            <span className="figure-tag" dir="ltr">
              t / {spec.timeUnit}
            </span>
          </div>
        </div>
        <svg viewBox={`0 0 ${width} ${height}`} className="relative z-10 mt-1 w-full" role="img" aria-label="رسم بياني يوضح المسافة بدلالة الزمن مع استراحة أفقية">
          <defs>
            <linearGradient id="graphArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#743f76" stopOpacity="0.28" />
              <stop offset="1" stopColor="#743f76" stopOpacity="0.02" />
            </linearGradient>
          </defs>
          {yTicks.map((tick) => (
            <g key={tick}>
              <line x1={pad.left} y1={y(tick)} x2={width - pad.right} y2={y(tick)} stroke="#f8c8db" strokeWidth="1" strokeDasharray="3 5" />
              <text x={pad.left - 10} y={y(tick) + 3.5} textAnchor="end" fontSize="10.5" fill="#96549c" fontFamily="IBM Plex Sans Arabic, sans-serif">
                {Math.round(tick)}
              </text>
            </g>
          ))}
          {Array.from({ length: xMax + 1 }).map((_, index) => (
            <g key={index}>
              <line x1={x(index)} y1={pad.top} x2={x(index)} y2={height - pad.bottom} stroke="#f9e3ec" strokeWidth="1" />
              <text x={x(index)} y={height - pad.bottom + 18} textAnchor="middle" fontSize="10.5" fill="#96549c" fontFamily="IBM Plex Sans Arabic, sans-serif">
                {index}
              </text>
            </g>
          ))}
          {spec.segments === "stop-then-go" ? (
            <g>
              <rect x={x(2)} y={pad.top} width={Math.max(0, x(3) - x(2))} height={height - pad.top - pad.bottom} fill="#b183e6" opacity=".09" />
              <line x1={x(2)} y1={pad.top} x2={x(2)} y2={height - pad.bottom} stroke="#cdaaf2" strokeWidth="1" strokeDasharray="3 4" />
              <line x1={x(3)} y1={pad.top} x2={x(3)} y2={height - pad.bottom} stroke="#cdaaf2" strokeWidth="1" strokeDasharray="3 4" />
              <rect x={x(2.46)} y={pad.top + 7} width="46" height="16" rx="8" fill="#faf4ff" stroke="#e3cffb" />
              <text x={x(2.46) + 23} y={pad.top + 18} textAnchor="middle" fontSize="9" fill="#9160cf" fontFamily="IBM Plex Sans Arabic, sans-serif">
                توقف
              </text>
            </g>
          ) : null}
          <polygon points={area} fill="url(#graphArea)" />
          <polyline points={line} fill="none" stroke="#441b67" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
          {spec.points.map((p, i) => (
            <g key={i}>
              <circle cx={x(p.x)} cy={y(p.y)} r="5.5" fill="#faf4ff" stroke="#441b67" strokeWidth="2.5" />
              {p.label.match(/\d+/) ? (
                <text x={x(p.x)} y={y(p.y) - 12} textAnchor="middle" fontSize="10.5" fontWeight="600" fill="#301545" fontFamily="IBM Plex Sans Arabic, sans-serif">
                  {p.label}
                </text>
              ) : null}
            </g>
          ))}
          <text x={width / 2} y={height - 6} textAnchor="middle" fontSize="11" fill="#743f76" fontFamily="IBM Plex Sans Arabic, sans-serif">
            الزمن ({spec.timeUnit})
          </text>
        </svg>
        <div className="relative z-10 mt-1 flex flex-wrap items-center justify-center gap-2 text-[11px]">
          <span className="flex items-center gap-1 rounded-full bg-white/75 px-2.5 py-1 text-[#441b67] ring-1 ring-[#f8c8db]">
            <span className="h-1.5 w-5 rounded-full bg-[#441b67]" /> حركة
          </span>
          <span className="flex items-center gap-1 rounded-full bg-white/75 px-2.5 py-1 text-[#441b67] ring-1 ring-[#f8c8db]">
            <span className="h-1.5 w-5 rounded-full bg-[#e0b8c5]" /> استراحة أفقية
          </span>
        </div>
      </div>
    </FigureShell>
  );
}

function EchoScene({ spec }: { spec: Extract<FigureSpec, { kind: "echo" }> }) {
  return (
    <FigureShell label="انتشار الصوت وارتداده">
      <div className="echo-scene">
        <div className="scene-grid" aria-hidden="true" />
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-2">
          <span className="figure-place">
            <Mountain className="size-3.5" aria-hidden="true" />
            وادٍ صخري هادئ
          </span>
          <span className="figure-tag">
            <Waves className="size-3.5" aria-hidden="true" />
            موجة ذاهبة وعائدة
          </span>
        </div>
        <div className="relative z-10 h-40">
          <svg viewBox="0 0 420 160" className="absolute inset-x-0 bottom-0 w-full" preserveAspectRatio="none" aria-hidden="true">
            <path d="M0 145 L70 69 L137 118 L203 57 L276 130 L340 90 L420 145 Z" fill="#e0b8c5" opacity="0.85" />
            <path d="M0 160 L80 99 L150 136 L235 88 L305 139 L370 110 L420 148 L420 160 Z" fill="#b98395" />
          </svg>
          <span className="echo-person">
            <Volume2 className="size-6 text-white" aria-hidden="true" />
          </span>
          <span className="echo-cliff" aria-hidden="true" />
          <span className="echo-wave echo-wave-1" aria-hidden="true" />
          <span className="echo-wave echo-wave-2" aria-hidden="true" />
          <span className="echo-wave echo-wave-3" aria-hidden="true" />
          <svg className="echo-route-svg" viewBox="0 0 420 165" preserveAspectRatio="none" aria-hidden="true">
            <defs>
              <marker id="echoArrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                <path d="M0 0 L6 3 L0 6 Z" fill="#441b67" />
              </marker>
              <marker id="echoArrowGold" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                <path d="M0 0 L6 3 L0 6 Z" fill="#b183e6" />
              </marker>
            </defs>
            <path d="M322 64 C 250 18 168 22 92 58" fill="none" stroke="#441b67" strokeWidth="1.8" strokeDasharray="5 4" markerEnd="url(#echoArrow)" />
            <path d="M96 86 C 168 128 250 124 306 98" fill="none" stroke="#b183e6" strokeWidth="1.8" strokeDasharray="5 4" markerEnd="url(#echoArrowGold)" />
            <circle cx="322" cy="64" r="2.4" fill="#441b67" />
            <circle cx="96" cy="88" r="2.4" fill="#b183e6" />
            <text x="205" y="20" textAnchor="middle" fontSize="9.5" fontWeight="600" fill="#441b67" fontFamily="IBM Plex Sans Arabic, sans-serif">ذهاب</text>
            <rect x="122" y="106" width="30" height="13" rx="6.5" fill="#faf4ff" fillOpacity=".82" />
            <text x="137" y="115.5" textAnchor="middle" fontSize="9" fontWeight="600" fill="#9160cf" fontFamily="IBM Plex Sans Arabic, sans-serif">عودة</text>
            <g stroke="#9c5469" strokeOpacity=".5" strokeDasharray="2 3">
              <line x1="120" y1="139" x2="306" y2="139" />
              <line x1="120" y1="135" x2="120" y2="143" />
              <line x1="306" y1="135" x2="306" y2="143" />
            </g>
            <text x="213" y="151" textAnchor="middle" fontSize="8" fill="#b39aa8" fontFamily="IBM Plex Sans Arabic, sans-serif">بعد الجرف</text>
          </svg>
        </div>
        <div className="relative z-10 mt-auto grid grid-cols-2 gap-2">
          <MetricCard icon={Timer} label="زمن الصدى" value={spec.time} tone="dark" />
          <MetricCard icon={Waves} label="سرعة الصوت" value={spec.speed} tone="dark" />
        </div>
      </div>
    </FigureShell>
  );
}

const objectIcon = {
  apple: Apple,
  bag: ShoppingBag,
  rice: Wheat,
  block: Package,
} as const;

function HangingScaleScene({ spec }: { spec: Extract<FigureSpec, { kind: "hangingScale" }> }) {
  const Icon = objectIcon[spec.object];
  const objectName = spec.object === "apple" ? "تفاحة" : spec.object === "bag" ? "حقيبة" : spec.object === "rice" ? "كيس أرز" : "جسم";
  return (
    <FigureShell label="قياس الثقل بالربيعة">
      <div className="hanging-scene">
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-2">
          <span className="figure-place">
            <Scale className="size-3.5" aria-hidden="true" />
            ربيعة قياس
          </span>
          <span className="figure-tag">
            <Weight className="size-3.5" aria-hidden="true" />
            الاتجاه نحو الأسفل
          </span>
        </div>
        <div className="relative z-10 mx-auto grid w-full max-w-[360px] grid-cols-[1fr_auto] items-center gap-4 py-3 sm:gap-7">
          <div className="space-y-2">
            <MetricCard icon={Scale} label="الكتلة" value={spec.mass} />
            <MetricCard icon={Weight} label="القراءة على الميزان" value={spec.weight} tone="dark" />
            <MetricCard icon={Gauge} label="تسارع الجاذبية" value={spec.g} />
          </div>
          <div className="relative flex min-h-[230px] w-[122px] items-start justify-center">
            <span className="absolute top-0 right-1/2 h-3 w-20 translate-x-1/2 rounded-full bg-[#e0b8c5]" />
            <span className="absolute top-2 right-1/2 h-5 w-2 translate-x-1/2 bg-[#9c5469]" />
            <div className="absolute top-7 w-[94px] rounded-[22px] border border-[#763f4e] bg-gradient-to-b from-[#743f76] to-[#441b67] p-2 shadow-[0_18px_30px_-18px_rgba(90, 43, 138, 0.7)]">
              <div className="rounded-xl border border-white/20 bg-white/95 px-2 py-2 text-center shadow-inner">
                <span className="block text-[9px] font-semibold text-[#763f4e]">NEWTON</span>
                <span className="mt-0.5 block text-[13px] font-bold text-[#301545]" dir="ltr">
                  {spec.weight}
                </span>
                <span className="mt-1 flex items-center justify-center gap-1 text-[8px] text-[#96549c]">
                  <span className="h-0.5 w-3 bg-[#e0b8c5]" /> N <span className="h-0.5 w-3 bg-[#e0b8c5]" />
                </span>
              </div>
              <svg viewBox="0 0 80 50" className="w-full py-1" aria-hidden="true">
                <path d="M40 2 L30 10 L50 18 L30 26 L50 34 L40 42" fill="none" stroke="#f8c8db" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="40" y1="42" x2="40" y2="48" stroke="#f8c8db" strokeWidth="2" />
              </svg>
              <span className="mx-auto block h-1.5 w-1.5 rounded-full bg-[#f8c8db]" />
            </div>
            <div className="absolute top-[129px] flex h-[68px] w-[76px] flex-col items-center justify-center rounded-2xl border border-white/70 bg-[#faf4ff] shadow-[0_12px_20px_-12px_rgba(90, 43, 138, 0.45)]">
              <Icon className="size-7 text-[#743f76]" strokeWidth={1.7} aria-hidden="true" />
              <span className="mt-1 text-[9px] font-medium text-[#b39aa8]">{objectName}</span>
            </div>
          </div>
        </div>
        <p className="relative z-10 mt-auto text-center text-[11px] text-[#763f4e]">
          عند الاتزان يكون مقدار شدّ الأرض للجسم هو الثقل <span className="font-semibold text-[#441b67]">w</span>
        </p>
      </div>
    </FigureShell>
  );
}

function EarthMoonScene({ spec }: { spec: Extract<FigureSpec, { kind: "earthMoon" }> }) {
  return (
    <FigureShell label="المقارنة بين مكانين">
      <div className="space-scene">
        <div className="space-stars" aria-hidden="true" />
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-2">
          <span className="space-chip">
            <Sparkles className="size-3.5" aria-hidden="true" />
            الكتلة لا تتغيّر
          </span>
          <span className="space-mass" dir="ltr">
            m = {spec.mass}
          </span>
        </div>
        <div className="relative z-10 my-3 grid grid-cols-[1fr_auto_1fr] items-center gap-1.5">
          <PlanetSide
            tone="earth"
            title="الأرض"
            g={spec.earthG}
            weight={spec.earthWeight}
            planet="earth"
          />
          <div className="flex flex-col items-center gap-1.5">
            <span className="astro-badge">🧑‍🚀</span>
            <span className="h-12 border-l border-dashed border-white/35" aria-hidden="true" />
            <span className="space-vs">VS</span>
          </div>
          <PlanetSide
            tone="moon"
            title="القمر"
            g={spec.moonG}
            weight={spec.moonWeight}
            planet="moon"
          />
        </div>
        <p className="relative z-10 mt-auto text-center text-[11px] text-[#e8c8f8]">
          وزن الجسم على الأرض أكبر من وزنه على القمر رغم ثبات كتلته
        </p>
      </div>
    </FigureShell>
  );
}

function PlanetSide({
  tone,
  title,
  g,
  weight,
  planet,
}: {
  tone: "earth" | "moon";
  title: string;
  g: string;
  weight: string;
  planet: "earth" | "moon";
}) {
  return (
    <div className={cn("planet-side", tone === "moon" && "planet-side-moon")}>
      <div className={cn("planet", planet === "earth" ? "planet-earth" : "planet-moon")} aria-hidden="true">
        {planet === "earth" ? (
          <>
            <span className="continent continent-a" />
            <span className="continent continent-b" />
            <span className="continent continent-c" />
          </>
        ) : (
          <>
            <span className="crater crater-a" />
            <span className="crater crater-b" />
            <span className="crater crater-c" />
          </>
        )}
      </div>
      <div className="text-center">
        <span className="block text-[11px] font-semibold text-white">{title}</span>
        <span className="mt-0.5 block text-[9px] text-[#dab8e0]" dir="ltr">
          g = {g}
        </span>
      </div>
      <div className="w-full rounded-xl border border-white/15 bg-white/10 px-2 py-1.5 text-center backdrop-blur">
        <span className="block text-[8.5px] text-[#f8c8db]">الثقل</span>
        <span className="mt-0.5 block text-[12px] font-bold text-white" dir="ltr">
          {weight}
        </span>
      </div>
    </div>
  );
}

function ForceScaleScene({ spec }: { spec: Extract<FigureSpec, { kind: "forceScale" }> }) {
  return (
    <FigureShell label="مقياس الرسم والأشعة">
      <div className="force-scene">
        <div className="scene-grid" aria-hidden="true" />
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-2">
          <span className="figure-place">
            <Ruler className="size-3.5" aria-hidden="true" />
            تمثيل القوى بأشعة
          </span>
          <span className="figure-tag" dir="ltr">
            {spec.scale}
          </span>
        </div>
        <div className="relative z-10 mx-1 mt-4" dir="ltr">
          <div className="force-ruler" aria-hidden="true">
            {Array.from({ length: 11 }).map((_, index) => (
              <span key={index} className={cn("force-tick", index % 5 === 0 && "force-tick-major")} />
            ))}
            <span className="force-ruler-label force-ruler-label-start">0</span>
            <span className="force-ruler-label">10 cm</span>
          </div>
          <div className="mt-3 space-y-2.5">
            {spec.arrows.map((arrow, index) => {
              const forceNumber = Number(arrow.force.replace(/[^\d.]/g, "")) || 0;
              const lengthNumber = Number(arrow.length.replace(/[^\d.]/g, "")) || 0;
              const relative = forceNumber ? Math.min(78, 26 + forceNumber * 0.55) : 58 - index * 7;
              const lineLength = Math.max(26, Math.min(84, lengthNumber ? lengthNumber * 8.5 : relative));
              return (
                <div key={`${arrow.label}-${index}`} className="force-row">
                  <div className="flex min-w-0 items-center justify-between gap-2">
                    <span className="truncate text-[11px] font-medium text-[#441b67]">{arrow.label}</span>
                    <span className="flex shrink-0 items-center gap-1">
                      <span className="rounded-md bg-[#441b67] px-1.5 py-0.5 text-[10px] font-semibold text-white" dir="ltr">
                        {arrow.force}
                      </span>
                      <span className="rounded-md bg-[#faf4ff] px-1.5 py-0.5 text-[10px] font-semibold text-[#743f76] ring-1 ring-[#f8c8db]" dir="ltr">
                        {arrow.length}
                      </span>
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2" dir="ltr">
                    <span className="force-origin">O</span>
                    <svg viewBox="0 0 100 28" className="h-7 flex-1" preserveAspectRatio="none" aria-hidden="true">
                      <line x1="2" y1="14" x2="98" y2="14" stroke="#f8c8db" strokeWidth="1" strokeDasharray="2 3" />
                      <line x1="2" y1="14" x2={2 + lineLength} y2="14" stroke={index % 2 === 0 ? "#441b67" : "#b183e6"} strokeWidth="3.5" strokeLinecap="round" />
                      <polygon
                        points={`${2 + lineLength},14 ${2 + lineLength - 7},9.5 ${2 + lineLength - 7},18.5`}
                        fill={index % 2 === 0 ? "#441b67" : "#b183e6"}
                      />
                      <circle cx="2" cy="14" r="3" fill="#faf4ff" stroke="#441b67" strokeWidth="2" />
                    </svg>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </FigureShell>
  );
}

function CargoScene({ spec }: { spec: Extract<FigureSpec, { kind: "cargo" }> }) {
  return (
    <FigureShell label="الحمولة والثقل الكلي">
      <div className="cargo-scene">
        <div className="scene-grid" aria-hidden="true" />
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-2">
          <span className="figure-place">
            <Boxes className="size-3.5" aria-hidden="true" />
            حساب الكتلة الكلية
          </span>
          {spec.limit ? (
            <span className="limit-badge">
              <Weight className="size-3.5" aria-hidden="true" />
              {spec.limit}
            </span>
          ) : (
            <span className="figure-tag">
              <Package className="size-3.5" aria-hidden="true" />
              حمولة موزّعة
            </span>
          )}
        </div>
        <div className="relative z-10 my-2 grid grid-cols-[1fr_auto] items-end gap-3">
          <div className="cargo-stage">
            <span className="cargo-floor" aria-hidden="true" />
            <div className="cargo-load">
              {spec.parts.map((part, index) => (
                <div key={part.label} className={cn("cargo-box", index % 2 === 1 && "cargo-box-alt")} style={{ animationDelay: `${index * 120}ms` }}>
                  <span className="cargo-tape" aria-hidden="true" />
                  <Package className="size-4 text-[#441b67]" strokeWidth={1.6} aria-hidden="true" />
                  <span className="mt-0.5 block text-[8.5px] font-semibold leading-tight text-[#743f76]">{part.label}</span>
                  <span className="block text-[8.5px] text-[#b39aa8]" dir="ltr">
                    {part.mass}
                  </span>
                </div>
              ))}
            </div>
            <div className="cargo-cart">
              <span className="cargo-platform" />
              <span className="cargo-wheel cargo-wheel-one" />
              <span className="cargo-wheel cargo-wheel-two" />
              <span className="cargo-handle" />
              <span className="cargo-motion" aria-hidden="true" />
            </div>
          </div>
          <div className="space-y-1.5 pb-1">
            <span className="cargo-total">
              <span className="text-[8.5px] text-[#b39aa8]">الكتلة</span>
              <span className="text-[11px] font-bold text-[#301545]" dir="ltr">
                {spec.totalMass}
              </span>
            </span>
            <span className="cargo-total cargo-total-dark">
              <span className="text-[8.5px] text-[#e8c8f8]">الثقل</span>
              <span className="text-[11px] font-bold text-white" dir="ltr">
                {spec.totalWeight}
              </span>
            </span>
          </div>
        </div>
        <div className="relative z-10 mt-auto flex items-center gap-1.5 text-[10px] text-[#743f76]">
          <Scale className="size-3.5" aria-hidden="true" />
          نجمع الكتل أولًا، ثم نضرب في تسارع الجاذبية.
        </div>
      </div>
    </FigureShell>
  );
}

export function ProblemFigure({ spec, className }: { spec: FigureSpec; className?: string }) {
  return (
    <div className={className}>
      {spec.kind === "journey" && <JourneyScene spec={spec} />}
      {spec.kind === "roundtrip" && <RoundTripScene spec={spec} />}
      {spec.kind === "graph" && <GraphScene spec={spec} />}
      {spec.kind === "echo" && <EchoScene spec={spec} />}
      {spec.kind === "hangingScale" && <HangingScaleScene spec={spec} />}
      {spec.kind === "earthMoon" && <EarthMoonScene spec={spec} />}
      {spec.kind === "forceScale" && <ForceScaleScene spec={spec} />}
      {spec.kind === "cargo" && <CargoScene spec={spec} />}
    </div>
  );
}
