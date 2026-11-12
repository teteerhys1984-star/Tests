import type { ReactNode } from "react";
import type { LewisSpec, QuestionFigure } from "../data/exam";

/** Renders Arabic prose while isolating chemical symbols/formulas marked as [[...]]. */
export function RichText({ text, className = "" }: { text: string; className?: string }) {
  const chunks = String(text ?? "").split(/\[\[(.*?)\]\]/g);
  return (
    <span className={className}>
      {chunks.map((chunk, idx) =>
        idx % 2 === 1 ? (
          <bdi key={idx} dir="ltr" className="chem">
            {chunk}
          </bdi>
        ) : (
          <span key={idx}>{chunk}</span>
        ),
      )}
    </span>
  );
}

export function NuclearSymbol({
  symbol,
  mass,
  atomic,
  charge,
}: {
  symbol: string;
  mass?: string;
  atomic?: string;
  charge?: string;
}) {
  return (
    <span className="nuclear" dir="ltr" aria-label={`${mass ?? ""} ${atomic ?? ""} ${symbol}${charge ?? ""}`}>
      {(mass || atomic) && (
        <span className="nuclear-stack" aria-hidden="true">
          <span className="nuclear-mass">{mass ?? ""}</span>
          <span className="nuclear-atomic">{atomic ?? ""}</span>
        </span>
      )}
      <span>{symbol}</span>
      {charge && <span className="nuclear-charge">{charge === "1+" ? "+" : charge}</span>}
    </span>
  );
}

const dotPositions = (
  count: number,
  side: "top" | "right" | "bottom" | "left",
  cx: number,
  cy: number,
): { x: number; y: number }[] => {
  if (!count || count < 1) return [];
  const pairs = Math.min(2, count);
  const out: { x: number; y: number }[] = [];
  for (let p = 0; p < pairs; p += 1) {
    for (let e = 0; e < 2; e += 1) {
      if (out.length >= count) break;
      const spread = e === 0 ? -6 : 6;
      const offset = p === 0 ? 0 : 14;
      if (side === "top") out.push({ x: cx + spread, y: cy - 35 - offset });
      if (side === "bottom") out.push({ x: cx + spread, y: cy + 35 + offset });
      if (side === "left") out.push({ x: cx - 35 - offset, y: cy + spread });
      if (side === "right") out.push({ x: cx + 35 + offset, y: cy + spread });
    }
  }
  return out;
};

const Dots = ({ points, tone = "ink" }: { points: { x: number; y: number }[]; tone?: "ink" | "shared" }) => (
  <>
    {points.map((p, i) => (
      <circle key={i} cx={p.x} cy={p.y} r={3.7} className={tone === "shared" ? "lewis-dot shared" : "lewis-dot"} />
    ))}
  </>
);

export function LewisDiagram({ spec, compact = false }: { spec: LewisSpec; compact?: boolean }) {
  if (spec.kind === "atom") {
    const cx = 90;
    const cy = 75;
    const points = [
      ...dotPositions(spec.top ?? 0, "top", cx, cy),
      ...dotPositions(spec.right ?? 0, "right", cx, cy),
      ...dotPositions(spec.bottom ?? 0, "bottom", cx, cy),
      ...dotPositions(spec.left ?? 0, "left", cx, cy),
    ];
    return (
      <svg viewBox="0 0 180 150" className={compact ? "lewis-svg compact" : "lewis-svg"} role="img" aria-label="تمثيل لويس">
        <Dots points={points} />
        <text x={cx} y={cy + 7} textAnchor="middle" className="lewis-symbol">
          {spec.symbol}
        </text>
      </svg>
    );
  }

  if (spec.kind === "water") {
    const lone = Math.min(3, Math.max(0, spec.lonePairs));
    const oDots: { x: number; y: number }[] = [];
    if (lone >= 1) oDots.push({ x: 104, y: 35 }, { x: 116, y: 35 });
    if (lone >= 2) oDots.push({ x: 104, y: 101 }, { x: 116, y: 101 });
    if (lone >= 3) oDots.push({ x: 148, y: 80 }, { x: 148, y: 90 });
    const hDots: { x: number; y: number }[] =
      spec.onHydrogen
        ? [
            { x: 31, y: 59 }, { x: 31, y: 73 },
            { x: 27, y: 66 },
            { x: 173, y: 59 }, { x: 173, y: 73 },
            { x: 177, y: 66 },
          ]
        : [];
    const leftBond = [{ x: 76, y: 60 }, { x: 76, y: 70 }];
    const rightBond = [{ x: 144, y: 60 }, { x: 144, y: 70 }];
    return (
      <svg viewBox="0 0 210 145" className={compact ? "lewis-svg compact" : "lewis-svg"} role="img" aria-label="تمثيل لويس لجزيء الماء">
        <Dots points={oDots} />
        <Dots points={hDots} />
        <Dots points={leftBond} tone="shared" />
        <Dots points={rightBond} tone="shared" />
        <text x={48} y={71} textAnchor="middle" className="lewis-symbol">H</text>
        <text x={105} y={71} textAnchor="middle" className="lewis-symbol">O</text>
        <text x={162} y={71} textAnchor="middle" className="lewis-symbol">H</text>
      </svg>
    );
  }

  const lx = 75;
  const rx = 165;
  const cy2 = 77;
  const bonds = spec.sharedPairs;
  const rowYs =
    bonds === 1 ? [cy2] : bonds === 2 ? [cy2 - 9, cy2 + 9] : [cy2 - 15, cy2, cy2 + 15];
  const shared = rowYs.flatMap((y) => [
    { x: 115, y },
    { x: 125, y },
  ]);
  const dots: { x: number; y: number }[] = [
    ...dotPositions(spec.leftTop ?? 0, "top", lx, cy2),
    ...dotPositions(spec.leftRight ?? 0, "right", lx, cy2),
    ...dotPositions(spec.leftBottom ?? 0, "bottom", lx, cy2),
    ...dotPositions(spec.leftLeft ?? 0, "left", lx, cy2),
    ...dotPositions(spec.rightTop ?? 0, "top", rx, cy2),
    ...dotPositions(spec.rightRight ?? 0, "right", rx, cy2),
    ...dotPositions(spec.rightBottom ?? 0, "bottom", rx, cy2),
    ...dotPositions(spec.rightLeft ?? 0, "left", rx, cy2),
  ];
  return (
    <svg viewBox="0 0 240 150" className={compact ? "lewis-svg compact" : "lewis-svg"} role="img" aria-label={`تمثيل لويس لجزيء ${spec.left}${spec.right}`}>
      <Dots points={dots} />
      <Dots points={shared} tone="shared" />
      <text x={lx} y={cy2 + 7} textAnchor="middle" className="lewis-symbol">{spec.left}</text>
      <text x={rx} y={cy2 + 7} textAnchor="middle" className="lewis-symbol">{spec.right}</text>
    </svg>
  );
}

export function FigureView({ figure }: { figure: QuestionFigure }) {
  if (figure.kind === "nuclear-table") {
    return (
      <div className="figure-wrap">
        <p className="figure-caption">{figure.caption}</p>
        <div className="table-scroll">
          <table className="exam-table nuclear-table">
            <thead>
              <tr>
                <th>الرمز</th>
                {figure.columns.map((c) => (
                  <th key={c}>{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {figure.rows.map((r) => (
                <tr key={r.tag}>
                  <td>
                    <span className="row-tag">({r.tag})</span>{" "}
                    <NuclearSymbol symbol={r.symbol} mass={r.mass} atomic={r.atomic} />
                  </td>
                  <td className="num" dir="ltr">{r.mass}</td>
                  <td className="num" dir="ltr">{r.atomic}</td>
                  <td className="num" dir="ltr">{r.charge ?? "0"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
  if (figure.kind === "data-table") {
    return (
      <div className="figure-wrap">
        <p className="figure-caption">{figure.caption}</p>
        <div className="table-scroll">
          <table className="exam-table">
            <thead>
              <tr>
                {figure.columns.map((c) => (
                  <th key={c}>{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {figure.rows.map((r, i) => (
                <tr key={i}>
                  {r.map((cell, j) => (
                    <td key={j} className={j > 0 ? "num" : ""}>
                      <RichText text={cell} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
  return (
    <div className="figure-wrap">
      <p className="figure-caption">{figure.caption}</p>
      <div className="lewis-figure-grid">
        {figure.items.map((item) => (
          <div className="lewis-figure-item" key={item.label}>
            <LewisDiagram spec={item.spec} compact />
            <span className="lewis-figure-label" dir="ltr">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function MarksPill({ marks }: { marks: number }) {
  return <span className="marks-pill">{[marks].map((m) => (Number.isInteger(m) ? m : m.toFixed(1)))} درجة</span>;
}

export function FieldGroup({ children }: { children: ReactNode }) {
  return <div className="field-grid">{children}</div>;
}
