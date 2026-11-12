import type { Visual } from "../exam/types";

const BAR_COLORS = ["#4f9a3f", "#4f86c6", "#7a9a43", "#48a38f", "#8a6b4a", "#5c8f7b", "#6c8f3f"];

export function BlockArt() {
  return (
    <svg className="block-art" viewBox="0 0 300 270" role="img" aria-label="مكعبات عشبية وزمرّدة بأسلوب عالم المكعبات">
      <defs>
        <linearGradient id="skyGlow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#bde7ff" stopOpacity="0.9" />
          <stop offset="1" stopColor="#e7f7d9" stopOpacity="0.1" />
        </linearGradient>
        <linearGradient id="gem" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8ffff0" />
          <stop offset="0.5" stopColor="#2fd6a0" />
          <stop offset="1" stopColor="#0e9b73" />
        </linearGradient>
      </defs>
      <ellipse cx="148" cy="237" rx="106" ry="18" fill="#2a2d22" opacity="0.18" />
      <circle cx="58" cy="52" r="31" fill="url(#skyGlow)" />
      <g className="cloud cloud-a">
        <rect x="28" y="30" width="28" height="12" fill="#fff" opacity="0.85" />
        <rect x="50" y="22" width="34" height="20" fill="#fff" opacity="0.85" />
        <rect x="78" y="32" width="22" height="10" fill="#fff" opacity="0.7" />
      </g>
      <g className="cloud cloud-b">
        <rect x="214" y="70" width="22" height="10" fill="#fff" opacity="0.7" />
        <rect x="230" y="60" width="36" height="20" fill="#fff" opacity="0.8" />
      </g>
      <g className="gem-float">
        <polygon points="64,96 88,84 112,96 88,120" fill="url(#gem)" stroke="#075e47" strokeWidth="3" />
        <polygon points="64,96 88,120 88,146 64,122" fill="#18b98b" stroke="#075e47" strokeWidth="3" />
        <polygon points="112,96 88,120 88,146 112,122" fill="#0e8c6b" stroke="#075e47" strokeWidth="3" />
        <polygon points="76,100 88,94 100,100 88,108" fill="#c9fff3" opacity="0.9" />
      </g>
      <g className="cube-main">
        <polygon points="84,118 156,82 228,118 156,154" fill="#6dbb45" stroke="#23401c" strokeWidth="4" />
        <polygon points="84,118 156,154 156,226 84,190" fill="#8a5c35" stroke="#3b2617" strokeWidth="4" />
        <polygon points="228,118 156,154 156,226 228,190" fill="#6f4628" stroke="#3b2617" strokeWidth="4" />
        <g fill="#5ba838">
          <rect x="107" y="118" width="14" height="10" transform="skewX(-30)" opacity="0.75" />
          <rect x="146" y="100" width="16" height="10" transform="skewX(-30)" opacity="0.7" />
          <rect x="180" y="124" width="13" height="9" opacity="0.55" />
        </g>
        <g fill="#a4713f">
          <rect x="100" y="154" width="18" height="18" transform="skewY(27)" opacity="0.8" />
          <rect x="112" y="191" width="22" height="14" transform="skewY(27)" opacity="0.7" />
          <rect x="164" y="176" width="26" height="16" transform="skewY(-27)" opacity="0.55" />
          <rect x="186" y="148" width="18" height="18" transform="skewY(-27)" opacity="0.7" />
        </g>
        <g fill="#4d3520" opacity="0.55">
          <rect x="116" y="166" width="10" height="8" transform="skewY(27)" />
          <rect x="178" y="196" width="12" height="10" transform="skewY(-27)" />
        </g>
      </g>
      <g className="cube-small">
        <polygon points="224,178 254,163 284,178 254,194" fill="#9ab7c9" stroke="#33424b" strokeWidth="3" />
        <polygon points="224,178 254,194 254,224 224,208" fill="#7d97a8" stroke="#33424b" strokeWidth="3" />
        <polygon points="284,178 254,194 254,224 284,208" fill="#657f90" stroke="#33424b" strokeWidth="3" />
        <rect x="233" y="188" width="7" height="7" fill="#b9ced9" />
        <rect x="266" y="193" width="8" height="8" fill="#8fa8b7" />
      </g>
      <g fill="#f5c542" className="sparkle-a">
        <rect x="210" y="42" width="8" height="8" />
        <rect x="204" y="50" width="8" height="8" opacity="0.7" />
        <rect x="34" y="152" width="7" height="7" opacity="0.8" />
      </g>
    </svg>
  );
}

function BarV({ visual }: { visual: Extract<Visual, { kind: "barV" }> }) {
  const width = 660;
  const height = 350;
  const plot = { left: 62, right: 22, top: 26, bottom: 72 };
  const plotW = width - plot.left - plot.right;
  const plotH = height - plot.top - plot.bottom;
  const stepCount = Math.round(visual.max / visual.step);
  const band = plotW / visual.data.length;
  const barW = Math.min(48, band * 0.52);
  const yOf = (v: number) => plot.top + plotH - (v / visual.max) * plotH;
  return (
    <figure className="chart-figure">
      <figcaption className="chart-title">{visual.title}</figcaption>
      <div className="chart-axis-caption">العدد ({visual.unit})</div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="chart-svg"
        role="img"
        aria-label={`${visual.title}. محور رأسي من 0 إلى ${visual.max}، و${visual.data.length} أعمدة لفئات مختلفة.`}
      >
        {Array.from({ length: stepCount + 1 }, (_, i) => {
          const value = i * visual.step;
          const y = yOf(value);
          return (
            <g key={value}>
              <line x1={plot.left} y1={y} x2={width - plot.right} y2={y} stroke="#c8cdbb" strokeWidth="1" />
              <text x={plot.left - 10} y={y + 4} textAnchor="end" className="tick-text">
                {value}
              </text>
            </g>
          );
        })}
        <line
          x1={plot.left}
          y1={plot.top}
          x2={plot.left}
          y2={plot.top + plotH}
          stroke="#34432c"
          strokeWidth="2.5"
        />
        <line
          x1={plot.left}
          y1={plot.top + plotH}
          x2={width - plot.right}
          y2={plot.top + plotH}
          stroke="#34432c"
          strokeWidth="2.5"
        />
        {visual.data.map((d, i) => {
          const x = plot.left + band * i + (band - barW) / 2;
          const y = yOf(d.value);
          return (
            <g key={d.label}>
              <rect
                x={x}
                y={y}
                width={barW}
                height={plot.top + plotH - y}
                fill={BAR_COLORS[i % BAR_COLORS.length]}
                stroke="#26331f"
                strokeWidth="2"
                rx="2"
              />
              <rect x={x} y={y} width={barW} height={Math.min(6, plot.top + plotH - y)} fill="#ffffff" opacity="0.18" />
              <text
                x={x + barW / 2}
                y={plot.top + plotH + 25}
                textAnchor="middle"
                className="category-text"
                direction="rtl"
              >
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="chart-axis-caption chart-axis-x">الفئة / السنة</div>
    </figure>
  );
}

function BarH({ visual }: { visual: Extract<Visual, { kind: "barH" }> }) {
  const stepCount = Math.round(visual.max / visual.step);
  return (
    <figure className="chart-figure">
      <figcaption className="chart-title">{visual.title}</figcaption>
      <div className="hbar" role="img" aria-label={`${visual.title}. مقياس من 0 إلى ${visual.max}.`}>
        <div className="hbar-head">
          <span className="hbar-label-spacer">المادة</span>
          <div className="hbar-ruler" aria-hidden="true">
            {Array.from({ length: stepCount + 1 }, (_, i) => (
              <span key={i} style={{ left: `${(i / stepCount) * 100}%` }}>
                {i * visual.step}
              </span>
            ))}
          </div>
        </div>
        {visual.data.map((d, i) => (
          <div className="hbar-row" key={d.label}>
            <div className="hbar-label">{d.label}</div>
            <div className="hbar-track">
              <div
                className="hbar-fill"
                style={{ width: `${(d.value / visual.max) * 100}%`, backgroundColor: BAR_COLORS[i % BAR_COLORS.length] }}
              />
              <div className="hbar-grid" aria-hidden="true">
                {Array.from({ length: stepCount }, (_, j) => (
                  <span key={j} style={{ left: `${((j + 1) / stepCount) * 100}%` }} />
                ))}
              </div>
            </div>
          </div>
        ))}
        <div className="hbar-unit">عدد الحصص ({visual.unit})</div>
      </div>
    </figure>
  );
}

function CoordGrid({ visual }: { visual: Extract<Visual, { kind: "grid" }> }) {
  const cell = 34;
  const left = 76;
  const top = 26;
  const bottom = 62;
  const right = 30;
  const width = left + cell * visual.xMax + right;
  const height = top + cell * visual.yMax + bottom;
  const px = (x: number) => left + x * cell;
  const py = (y: number) => top + (visual.yMax - y) * cell;
  return (
    <figure className="chart-figure">
      <figcaption className="chart-title">{visual.title}</figcaption>
      <div className="grid-wrap">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="grid-svg"
          role="img"
          aria-label={`شبكة إحداثيات من 0 إلى ${visual.xMax} أفقياً ومن 0 إلى ${visual.yMax} شاقولياً، وعليها ${visual.points.length} نقاط.`}
        >
          <rect x={left} y={top} width={cell * visual.xMax} height={cell * visual.yMax} fill="#fbfdf6" stroke="#aebb9f" />
          {Array.from({ length: visual.xMax + 1 }, (_, i) => (
            <g key={`x${i}`}>
              <line x1={px(i)} y1={top} x2={px(i)} y2={top + cell * visual.yMax} stroke="#dbe1d2" strokeWidth="1" />
              <text x={px(i)} y={top + cell * visual.yMax + 20} textAnchor="middle" className="tick-text">
                {i}
              </text>
            </g>
          ))}
          {Array.from({ length: visual.yMax + 1 }, (_, i) => (
            <g key={`y${i}`}>
              <line x1={left} y1={py(i)} x2={left + cell * visual.xMax} y2={py(i)} stroke="#dbe1d2" strokeWidth="1" />
              <text x={left - 12} y={py(i) + 4} textAnchor="end" className="tick-text">
                {i}
              </text>
            </g>
          ))}
          <line x1={left} y1={py(0)} x2={left + cell * visual.xMax + 18} y2={py(0)} stroke="#2b6b4e" strokeWidth="3" />
          <polygon points={`${left + cell * visual.xMax + 18},${py(0)} ${left + cell * visual.xMax + 8},${py(0) - 5} ${left + cell * visual.xMax + 8},${py(0) + 5}`} fill="#2b6b4e" />
          <line x1={left} y1={py(0)} x2={left} y2={py(visual.yMax) - 16} stroke="#2b6b4e" strokeWidth="3" />
          <polygon points={`${left},${py(visual.yMax) - 16} ${left - 5},${py(visual.yMax) - 6} ${left + 5},${py(visual.yMax) - 6}`} fill="#2b6b4e" />
          <text x={left + cell * visual.xMax + 6} y={py(0) + 24} textAnchor="end" className="axis-text">
            المحور الأفقي
          </text>
          <text x={left + 8} y={top - 8} textAnchor="start" className="axis-text">
            المحور الشاقولي
          </text>
          {visual.points.map((p, i) => (
            <g key={p.label}>
              <rect
                x={px(p.x) - 10}
                y={py(p.y) - 10}
                width="20"
                height="20"
                fill={BAR_COLORS[i % BAR_COLORS.length]}
                stroke="#173329"
                strokeWidth="2.5"
                rx="2"
              />
              <text x={px(p.x)} y={py(p.y) + 6} textAnchor="middle" className="point-letter">
                {p.label}
              </text>
            </g>
          ))}
        </svg>
      </div>
      {visual.legend && <div className="grid-legend">{visual.legend}</div>}
    </figure>
  );
}

function Sequence({ visual }: { visual: Extract<Visual, { kind: "sequence" }> }) {
  return (
    <div className="sequence-row" dir="rtl" aria-label="حدود النمط العددي">
      {visual.values.map((value, i) => (
        <span className="sequence-cell" key={`${value}-${i}`}>
          {value}
        </span>
      ))}
      {visual.trailing !== false && <span className="sequence-ellipsis">…</span>}
    </div>
  );
}

function VerticalSum({ a, b, label }: { a: number; b: number; label: string }) {
  const aStr = String(a).padStart(5, "0");
  const bStr = String(b).padStart(5, "0");
  const columns = [
    { key: "ones", title: "الآحاد", a: aStr[4], b: bStr[4] },
    { key: "tens", title: "العشرات", a: aStr[3], b: bStr[3] },
    { key: "hundreds", title: "المئات", a: aStr[2], b: bStr[2] },
    { key: "thousands", title: "آحاد الألوف", a: aStr[1], b: bStr[1] },
    { key: "tenthousands", title: "عشرات الألوف", a: aStr[0], b: bStr[0] },
  ];
  return (
    <div className="sum-card">
      <div className="sum-label">الجمع {label}</div>
      <table className="sum-table" dir="rtl">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key}>{c.title}</th>
            ))}
            <th aria-label="إشارة الجمع" />
          </tr>
        </thead>
        <tbody>
          <tr>
            {columns.map((c) => (
              <td key={`a-${c.key}`}>{c.a}</td>
            ))}
            <td />
          </tr>
          <tr className="sum-second">
            {columns.map((c) => (
              <td key={`b-${c.key}`}>{c.b}</td>
            ))}
            <td className="sum-plus">+</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function Addition({ visual }: { visual: Extract<Visual, { kind: "addition" }> }) {
  return (
    <div className="addition-wrap">
      {visual.problems.map((p, i) => (
        <VerticalSum key={`${p.a}-${p.b}`} a={p.a} b={p.b} label={String(i + 1)} />
      ))}
    </div>
  );
}

export function QuestionVisual({ visual }: { visual?: Visual }) {
  if (!visual) return null;
  switch (visual.kind) {
    case "barV":
      return <BarV visual={visual} />;
    case "barH":
      return <BarH visual={visual} />;
    case "grid":
      return <CoordGrid visual={visual} />;
    case "sequence":
      return <Sequence visual={visual} />;
    case "addition":
      return <Addition visual={visual} />;
  }
}
