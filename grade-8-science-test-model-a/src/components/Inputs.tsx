import { useEffect, useRef, useState } from "react";
import type { DrawAnswer, LewisAnswer, MatrixAnswer, SubItem, VectorArrowItem } from "../data/types";
import { formatPointsBadge, Katex } from "../lib/math";
import { RichText } from "./Bits";

/* =========================================================================
   حقول الإجابة: رقمية، نصّية، جداول، لوحة تمثيل لويس، استوديو المتجهات.
   خالية تماماً من أي تلميحات (Hints) أو قيم إرشادية داخل مساحة الإجابة.
   ========================================================================= */

const inputBase =
  "w-full rounded-xl border-2 bg-white px-3.5 py-3 text-[16px] leading-8 text-ink " +
  "border-line focus:border-blue outline-none transition-colors shadow-[inset_0_1px_2px_rgba(11,27,58,0.04)]";

export function NumericField({
  sub,
  value,
  onChange,
}: {
  sub: SubItem;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-stretch gap-2" dir="ltr">
      <input
        type="text"
        inputMode="decimal"
        autoComplete="off"
        className={`${inputBase} min-w-0 flex-1 text-center font-mono text-[18px] font-semibold`}
        value={value}
        aria-label={sub.label}
        onChange={(e) => onChange(e.target.value)}
      />
      {sub.unit ? (
        <span className="grid min-w-[54px] place-items-center rounded-xl border-2 border-ink bg-ink px-3.5 text-[16px] font-bold text-white">
          <Katex tex={sub.unit === "°" ? String.raw`^{\circ}` : String.raw`\mathrm{${sub.unit}}`} />
        </span>
      ) : null}
    </div>
  );
}

export function TextField({ sub, value, onChange }: { sub: SubItem; value: string; onChange: (v: string) => void }) {
  return (
    <textarea
      className={`${inputBase} slip min-h-[116px]`}
      value={value}
      aria-label={sub.label}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

/* --------------------------------------------------------------- الجدول */

export function MatrixField({ sub, value, onChange }: { sub: SubItem; value: string; onChange: (v: string) => void }) {
  let parsed: MatrixAnswer = {};
  try {
    parsed = value ? (JSON.parse(value) as MatrixAnswer) : {};
  } catch {
    parsed = {};
  }
  const set = (id: string, v: string) => onChange(JSON.stringify({ ...parsed, [id]: v }));
  const headers = sub.headers ?? [];
  const rowHeader = sub.rowHeader ?? [];
  const rows = sub.rows ?? [];

  return (
    <div className="overflow-hidden rounded-2xl border-2 border-line bg-white shadow-sm">
      <div
        className="hidden bg-ink px-4 py-3 text-[13px] font-bold text-white sm:grid"
        style={{ gridTemplateColumns: `minmax(140px,1.35fr) repeat(${headers.length - 1}, minmax(0,1fr))` }}
      >
        {headers.map((h, i) => (
          <span key={h} className={i === 0 ? "" : "text-center"}>
            <RichText text={h} />
          </span>
        ))}
      </div>
      <div className="divide-y divide-line">
        {rows.map((r, ri) => {
          const perRow = rows[0]?.cells.length ?? 1;
          return (
            <div key={r.id} className="px-3 py-3.5 sm:px-4">
              <div className="mb-2 text-[15px] font-bold text-ink sm:hidden">
                <RichText text={rowHeader[ri] ?? ""} />
              </div>
              <div
                className="grid gap-2.5"
                style={{
                  gridTemplateColumns:
                    perRow === 1
                      ? "minmax(0,1.35fr) minmax(0,1fr)"
                      : `minmax(0,1.35fr) repeat(${perRow}, minmax(0,1fr))`,
                }}
              >
                <div className="hidden items-center text-[15px] font-bold text-ink sm:flex">
                  <RichText text={rowHeader[ri] ?? ""} />
                </div>
                {r.cells.map((correct, ci) => {
                  const cellIdx = ri * perRow + ci;
                  const cellId = `${r.id}-${["e", "p", "s"][ci] ?? ci}`;
                  const id = sub.answer.kind === "matrix" ? (sub.answer.cells[cellIdx]?.id ?? cellId) : cellId;
                  const isWord = !/^-?\+?\d+$/.test(correct.trim());
                  return (
                    <label key={id} className="block col-span-full sm:col-span-1">
                      <span className="mb-1 block text-[12px] font-semibold text-ink-soft sm:hidden">
                        <RichText text={headers[ci + 1] ?? ""} />
                      </span>
                      <input
                        type="text"
                        autoComplete="off"
                        dir={isWord ? "rtl" : "ltr"}
                        className={`${inputBase} ${isWord ? "text-center" : "text-center font-mono text-[17px] font-semibold"} py-2.5`}
                        value={parsed[id] ?? ""}
                        aria-label={`${rowHeader[ri]} — ${headers[ci + 1] ?? ""}`}
                        onChange={(e) => set(id, e.target.value)}
                      />
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------- تمثيل لويس */

function Dots({ n, color = "#1D4ED8", horizontal = false }: { n: number; color?: string; horizontal?: boolean }) {
  if (n <= 0) return null;
  return (
    <span className={`flex ${horizontal ? "flex-row" : "flex-col"} items-center justify-center gap-[5px]`}>
      {Array.from({ length: n }).map((_, i) => (
        <span
          key={i}
          className="block h-[8px] w-[8px] rounded-full shadow-xs"
          style={{ background: color, boxShadow: `0 0 6px ${color}55` }}
        />
      ))}
    </span>
  );
}

export function LewisPad({ sub, onChange }: { sub: SubItem; value: string; onChange: (v: string) => void }) {
  const single = sub.lewis?.single ?? false;
  const [slots, setSlots] = useState<number[]>(() => {
    try {
      const raw = localStorage.getItem(`lewis-slot-${sub.id}`);
      if (raw) return JSON.parse(raw) as number[];
    } catch {
      /* noop */
    }
    return single ? [0, 0, 0, 0] : [0, 0, 0, 0, 0, 0, 0];
  });

  useEffect(() => {
    try {
      localStorage.setItem(`lewis-slot-${sub.id}`, JSON.stringify(slots));
    } catch {
      /* noop */
    }
    const total = slots.reduce((a, b) => a + b, 0);
    if (single) {
      onChange(JSON.stringify({ shared: total, lone: [0, 0] } satisfies LewisAnswer));
    } else {
      const left = (slots[0] ?? 0) + (slots[1] ?? 0) + (slots[2] ?? 0);
      const right = (slots[3] ?? 0) + (slots[4] ?? 0) + (slots[5] ?? 0);
      onChange(JSON.stringify({ shared: slots[6] ?? 0, lone: [left, right] } satisfies LewisAnswer));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slots, single, sub.id]);

  const cycle = (i: number) => {
    const cap = single ? 2 : 1;
    setSlots((prev) => prev.map((v, idx) => (idx === i ? (v + 1) % (cap + 1) : v)));
  };
  const clear = () => setSlots(single ? [0, 0, 0, 0] : [0, 0, 0, 0, 0, 0, 0]);

  const symbols = (sub.lewis?.symbols ?? ["X"]) as string[];

  const Slot = ({ i, pos }: { i: number; pos: "top" | "left" | "right" | "bottom" }) => {
    const v = slots[i] ?? 0;
    const isHoriz = pos === "top" || pos === "bottom";
    return (
      <button
        type="button"
        onClick={() => cycle(i)}
        aria-label={`موضع إلكترونات ${i + 1}`}
        className={`flex items-center justify-center rounded-xl border-2 transition-all ${
          isHoriz ? "h-9 w-16 sm:h-10 sm:w-20" : "h-16 w-9 sm:h-20 sm:w-10"
        } ${
          v > 0
            ? "border-blue bg-blue/10 shadow-[0_0_12px_rgba(29,78,216,0.16)]"
            : "border-dashed border-line bg-paper/70 hover:border-blue/50"
        }`}
      >
        <Dots n={v * (single ? 1 : 2)} color="#1D4ED8" horizontal={isHoriz} />
      </button>
    );
  };

  return (
    <div className="rounded-2xl border-2 border-line bg-gradient-to-b from-white to-paper/60 p-4 shadow-xs">
      <div className="mb-3 flex items-center justify-end">
        <button
          type="button"
          onClick={clear}
          className="rounded-lg border-2 border-line bg-white px-3 py-1.5 text-[13px] font-bold text-ink-soft hover:border-orange hover:text-orange"
        >
          إعادة ضبط اللوحة
        </button>
      </div>

      {single ? (
        <div className="flex flex-col items-center gap-2.5 py-3">
          <Slot i={0} pos="top" />
          <div className="flex items-center gap-3">
            <Slot i={3} pos="left" />
            <div className="grid h-20 w-20 place-items-center rounded-2xl border-2 border-cyan/50 bg-ink text-white shadow-[0_8px_20px_-6px_rgba(11,27,58,0.45)]">
              <Katex tex={`\\mathrm{${symbols[0]}}`} className="text-[28px] text-white" />
            </div>
            <Slot i={1} pos="right" />
          </div>
          <Slot i={2} pos="bottom" />
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-center gap-2 py-3 sm:gap-4">
          <div className="flex flex-col items-center gap-2">
            <Slot i={0} pos="top" />
            <div className="flex items-center gap-2">
              <Slot i={1} pos="left" />
              <div className="grid h-18 w-18 place-items-center rounded-2xl border-2 border-cyan/50 bg-ink text-white shadow-md sm:h-20 sm:w-20">
                <Katex tex={`\\mathrm{${symbols[0]}}`} className="text-[26px] text-white" />
              </div>
            </div>
            <Slot i={2} pos="bottom" />
          </div>

          <div className="flex flex-col items-center gap-2 px-1">
            <button
              type="button"
              onClick={() => setSlots((p) => [...p.slice(0, 6), ((p[6] ?? 0) + 1) % 4])}
              aria-label="تغيير عدد الأزواج المشتركة"
              className={`flex min-h-[72px] min-w-[78px] flex-col items-center justify-center gap-2 rounded-2xl border-2 px-3 py-2 transition-all ${
                (slots[6] ?? 0) > 0
                  ? "border-orange bg-orange/10 shadow-[0_0_14px_rgba(255,107,26,0.2)]"
                  : "border-dashed border-line bg-white hover:border-orange/60"
              }`}
            >
              {Array.from({ length: slots[6] ?? 0 }).map((_, pairIdx) => (
                <div key={pairIdx} className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-orange" />
                  <span className="h-[2.5px] w-7 rounded-full bg-orange/80" />
                  <span className="h-2.5 w-2.5 rounded-full bg-orange" />
                </div>
              ))}
            </button>
          </div>

          <div className="flex flex-col items-center gap-2">
            <Slot i={3} pos="top" />
            <div className="flex items-center gap-2">
              <div className="grid h-18 w-18 place-items-center rounded-2xl border-2 border-cyan/50 bg-ink text-white shadow-md sm:h-20 sm:w-20">
                <Katex tex={`\\mathrm{${symbols[1]}}`} className="text-[26px] text-white" />
              </div>
              <Slot i={4} pos="right" />
            </div>
            <Slot i={5} pos="bottom" />
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------- استوديو المتجهات الهندسية */

const GENERAL_SYMBOLS: { id: string; tex: string }[] = [
  { id: "F", tex: "\\vec{F}" },
  { id: "F₁", tex: "\\vec{F}_1" },
  { id: "F₂", tex: "\\vec{F}_2" },
  { id: "F₃", tex: "\\vec{F}_3" },
  { id: "F′", tex: "\\vec{F}'" },
  { id: "W", tex: "\\vec{w}" },
  { id: "R", tex: "\\vec{R}" },
  { id: "O", tex: "O" },
  { id: "A", tex: "A" },
  { id: "B", tex: "B" },
  { id: "C", tex: "C" },
  { id: "M", tex: "M" },
  { id: "d", tex: "d" },
  { id: "d₁", tex: "d_1" },
  { id: "d₂", tex: "d_2" },
  { id: "α", tex: "\\alpha" },
  { id: "θ", tex: "\\theta" },
];

type ToolMode = "vector" | "dashed" | "pen";

export function DrawPad({ sub, value, onChange }: { sub: SubItem; value: string; onChange: (v: string) => void }) {
  let ans: DrawAnswer = { strokes: 0, labels: [], paths: [], vectors: [] };
  try {
    if (value) ans = JSON.parse(value) as DrawAnswer;
  } catch {
    ans = { strokes: 0, labels: [], paths: [], vectors: [] };
  }

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pathsRef = useRef<number[][]>(ans.paths ?? []);
  const vectorsRef = useRef<VectorArrowItem[]>(ans.vectors ?? []);
  const draftVecRef = useRef<VectorArrowItem | null>(null);
  const drawing = useRef(false);
  const [tool, setTool] = useState<ToolMode>("vector");
  const [vecColor, setVecColor] = useState<string>("#1D4ED8");
  const [tick, setTick] = useState(0);

  const drawArrowhead = (ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string) => {
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const headLen = 13;
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - headLen * Math.cos(angle - Math.PI / 6.5), y2 - headLen * Math.sin(angle - Math.PI / 6.5));
    ctx.lineTo(x2 - headLen * 0.72 * Math.cos(angle), y2 - headLen * 0.72 * Math.sin(angle));
    ctx.lineTo(x2 - headLen * Math.cos(angle + Math.PI / 6.5), y2 - headLen * Math.sin(angle + Math.PI / 6.5));
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };

  const redraw = () => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const w = cv.clientWidth;
    const h = cv.clientHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) {
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(h * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    // Fine engineering grid
    ctx.strokeStyle = "rgba(29,78,216,0.075)";
    ctx.lineWidth = 1;
    for (let x = 0; x <= w; x += 24) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y <= h; y += 24) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Center crosshairs
    ctx.strokeStyle = "rgba(11,27,58,0.12)";
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(w / 2, 0);
    ctx.lineTo(w / 2, h);
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Freehand paths
    ctx.strokeStyle = "#0B1B3A";
    ctx.lineWidth = 2.6;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    for (const p of pathsRef.current) {
      if (p.length < 4) continue;
      ctx.beginPath();
      ctx.moveTo(p[0] * w, p[1] * h);
      for (let i = 2; i < p.length; i += 2) ctx.lineTo(p[i] * w, p[i + 1] * h);
      ctx.stroke();
    }

    // Vector arrows & construction lines
    const allVecs = draftVecRef.current ? [...vectorsRef.current, draftVecRef.current] : vectorsRef.current;
    for (const v of allVecs) {
      const x1 = v.x1 * w;
      const y1 = v.y1 * h;
      const x2 = v.x2 * w;
      const y2 = v.y2 * h;
      const col = v.color ?? "#1D4ED8";
      ctx.save();
      ctx.strokeStyle = col;
      ctx.lineWidth = v.dashed ? 2 : 3.4;
      if (v.dashed) ctx.setLineDash([7, 5]);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.restore();

      // Origin node dot
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(x1, y1, 3.5, 0, Math.PI * 2);
      ctx.fill();

      if (!v.dashed && Math.hypot(x2 - x1, y2 - y1) > 8) {
        drawArrowhead(ctx, x1, y1, x2, y2, col);
      }
    }
  };

  useEffect(() => {
    redraw();
    const onResize = () => redraw();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick]);

  const totalStrokes = () => pathsRef.current.length + vectorsRef.current.length;

  const persist = (paths: number[][], vectors: VectorArrowItem[], labels = ans.labels ?? []) => {
    onChange(
      JSON.stringify({
        strokes: paths.length + vectors.length,
        labels,
        paths,
        vectors,
      } satisfies DrawAnswer),
    );
  };

  const pos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height];
  };

  const start = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drawing.current = true;
    const [x, y] = pos(e);
    if (tool === "pen") {
      pathsRef.current = [...pathsRef.current, [x, y]];
    } else {
      draftVecRef.current = { x1: x, y1: y, x2: x, y2: y, dashed: tool === "dashed", color: vecColor };
    }
    setTick((t) => t + 1);
  };

  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const [x, y] = pos(e);
    if (tool === "pen") {
      const paths = pathsRef.current.slice();
      const last = paths[paths.length - 1];
      if (last) {
        last.push(x, y);
        paths[paths.length - 1] = last;
        pathsRef.current = paths;
        redraw();
      }
    } else if (draftVecRef.current) {
      draftVecRef.current = { ...draftVecRef.current, x2: x, y2: y };
      redraw();
    }
  };

  const end = () => {
    if (!drawing.current) return;
    drawing.current = false;
    if (tool !== "pen" && draftVecRef.current) {
      const v = draftVecRef.current;
      draftVecRef.current = null;
      if (Math.hypot(v.x2 - v.x1, v.y2 - v.y1) > 0.02) {
        vectorsRef.current = [...vectorsRef.current, v];
      }
    }
    persist(pathsRef.current, vectorsRef.current);
    setTick((t) => t + 1);
  };

  const undo = () => {
    if (vectorsRef.current.length > 0) {
      vectorsRef.current = vectorsRef.current.slice(0, -1);
    } else {
      pathsRef.current = pathsRef.current.slice(0, -1);
    }
    persist(pathsRef.current, vectorsRef.current);
    setTick((t) => t + 1);
  };

  const clearAll = () => {
    pathsRef.current = [];
    vectorsRef.current = [];
    persist([], []);
    setTick((t) => t + 1);
  };

  const labels = ans.labels ?? [];
  const toggleLabel = (symId: string) => {
    const next = labels.includes(symId) ? labels.filter((x) => x !== symId) : [...labels, symId];
    persist(pathsRef.current, vectorsRef.current, next);
  };

  return (
    <div className="rounded-2xl border-2 border-line bg-white p-3.5 shadow-xs">
      {/* Toolbar */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setTool("vector")}
            className={`rounded-lg border-2 px-3 py-1.5 text-[13px] font-bold transition-colors ${
              tool === "vector" ? "border-blue bg-blue text-white" : "border-line bg-white text-ink-soft"
            }`}
          >
            سهم متجه
          </button>
          <button
            type="button"
            onClick={() => setTool("dashed")}
            className={`rounded-lg border-2 px-3 py-1.5 text-[13px] font-bold transition-colors ${
              tool === "dashed" ? "border-blue bg-blue text-white" : "border-line bg-white text-ink-soft"
            }`}
          >
            خط متقطّع
          </button>
          <button
            type="button"
            onClick={() => setTool("pen")}
            className={`rounded-lg border-2 px-3 py-1.5 text-[13px] font-bold transition-colors ${
              tool === "pen" ? "border-blue bg-blue text-white" : "border-line bg-white text-ink-soft"
            }`}
          >
            قلم حرّ
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          {[
            { c: "#1D4ED8", name: "أزرق" },
            { c: "#0891B2", name: "سماوي" },
            { c: "#DC2626", name: "أحمر" },
            { c: "#0B1B3A", name: "كحلي" },
          ].map((sw) => (
            <button
              key={sw.c}
              type="button"
              onClick={() => setVecColor(sw.c)}
              aria-label={`لون ${sw.name}`}
              className={`h-6 w-6 rounded-full border-2 transition-transform ${
                vecColor === sw.c ? "scale-115 border-ink" : "border-white"
              }`}
              style={{ backgroundColor: sw.c }}
            />
          ))}
          <button
            type="button"
            onClick={undo}
            className="ms-1 rounded-lg border-2 border-line px-2.5 py-1 text-[12px] font-bold text-ink-soft hover:border-blue"
          >
            تراجع
          </button>
          <button
            type="button"
            onClick={clearAll}
            className="rounded-lg border-2 border-line px-2.5 py-1 text-[12px] font-bold text-ink-soft hover:border-orange"
          >
            مسح
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div
        className="relative h-60 w-full overflow-hidden rounded-xl border-2 border-blue/35 bg-[#F8FAFC] sm:h-72"
        aria-label={sub.label}
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full touch-none cursor-crosshair"
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerLeave={end}
          onPointerCancel={end}
        />

        {/* Active KaTeX labels pinned on top-right of canvas */}
        {labels.length > 0 ? (
          <div className="pointer-events-none absolute top-2.5 right-2.5 flex flex-wrap gap-1.5">
            {labels.map((l) => {
              const found = GENERAL_SYMBOLS.find((g) => g.id === l);
              return (
                <span
                  key={l}
                  className="rounded-md border border-blue/40 bg-white/95 px-2 py-0.5 text-[13px] shadow-xs"
                >
                  <Katex tex={found ? found.tex : l} />
                </span>
              );
            })}
          </div>
        ) : null}
      </div>

      {/* General KaTeX symbol palette (no question-specific hints) */}
      <div className="mt-3 border-t-2 border-line pt-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[13px] font-bold text-ink">الرموز العلمية على الرسم:</span>
          <span className="text-[12px] font-semibold text-ink-soft">
            العناصر المرسومة: <Katex tex={String(totalStrokes())} />
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {GENERAL_SYMBOLS.map((sym) => {
            const active = labels.includes(sym.id);
            return (
              <button
                key={sym.id}
                type="button"
                onClick={() => toggleLabel(sym.id)}
                className={`rounded-lg border-2 px-2.5 py-1 text-[13px] transition-all ${
                  active
                    ? "border-blue bg-blue text-white shadow-xs"
                    : "border-line bg-white text-ink hover:border-cyan"
                }`}
              >
                <Katex tex={sym.tex} className={active ? "text-white" : "text-ink"} />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------- غلاف مطلب الإجابة */

export function SubBlock({
  index,
  sub,
  value,
  onChange,
}: {
  index: number;
  sub: SubItem;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <section className="rounded-2xl border-2 border-line bg-white p-4 shadow-[0_2px_10px_-4px_rgba(11,27,58,0.06)] sm:p-5">
      <div className="mb-3 flex items-start gap-3">
        <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-ink text-[13px] font-bold text-white">
          <Katex tex={String(index)} className="text-white" />
        </span>
        <p className="min-w-0 flex-1 text-[16px] font-semibold leading-8 text-ink sm:text-[17px]">
          <RichText text={sub.label} />
          <span className="ms-2 inline-block rounded-md border border-yellow/60 bg-yellow/25 px-2.5 py-0.5 align-middle text-[12px] font-bold text-ink">
            {formatPointsBadge(sub.points)}
          </span>
        </p>
      </div>

      <div className={sub.kind === "draw" || sub.kind === "lewis" || sub.kind === "matrix" ? "" : "ps-0 sm:ps-10"}>
        {sub.kind === "numeric" ? <NumericField sub={sub} value={value} onChange={onChange} /> : null}
        {sub.kind === "text" ? <TextField sub={sub} value={value} onChange={onChange} /> : null}
        {sub.kind === "matrix" ? <MatrixField sub={sub} value={value} onChange={onChange} /> : null}
        {sub.kind === "lewis" ? <LewisPad sub={sub} value={value} onChange={onChange} /> : null}
        {sub.kind === "draw" ? <DrawPad sub={sub} value={value} onChange={onChange} /> : null}
      </div>
    </section>
  );
}
