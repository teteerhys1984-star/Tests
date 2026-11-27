import { useMemo, useRef, useState } from "react";
import { Rich, M } from "../lib/mathx";
import { playTick } from "../lib/audio";
import { stripMath } from "../exam/grading";
import type {
  ClozeValue,
  MatchValue,
  NumericValue,
  Part,
  PlotValue,
  TfValue,
} from "../exam/types";

const AR = ["أ", "ب", "ج", "د", "هـ", "و", "ز", "ح"];

function Shell({
  children,
  tone = "idle",
}: {
  children: React.ReactNode;
  tone?: "idle" | "good" | "bad";
}) {
  const ring =
    tone === "good"
      ? "border-emerald-400/55 bg-emerald-400/[0.07]"
      : tone === "bad"
        ? "border-rose-400/55 bg-rose-400/[0.07]"
        : "border-sky-400/20 bg-white/[0.025] hover:border-sky-300/45 hover:bg-sky-400/[0.06]";
  return <div className={`rounded-xl border transition-colors duration-200 ${ring}`}>{children}</div>;
}

function SelectBox({
  value,
  onChange,
  options,
  placeholder,
  disabled,
  ariaLabel,
  className = "",
}: {
  value: string | undefined;
  onChange: (v: string) => void;
  options: { id: string; text: string }[];
  placeholder: string;
  disabled?: boolean;
  ariaLabel: string;
  className?: string;
}) {
  return (
    <div className={`relative inline-flex ${className}`}>
      <select
        aria-label={ariaLabel}
        disabled={disabled}
        value={value ?? ""}
        onChange={(e) => {
          playTick();
          onChange(e.target.value);
        }}
        className="w-full min-w-0 cursor-pointer appearance-none rounded-lg border border-sky-400/30 bg-ink-800/90 py-2 pe-8 ps-3 text-[0.9rem] font-medium text-sky-100 shadow-[inset_0_1px_0_rgba(125,211,252,0.09)] transition-colors hover:border-sky-300/60 focus:border-cyan-300 disabled:opacity-60"
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {stripMath(o.text)}
          </option>
        ))}
      </select>
      <svg
        viewBox="0 0 20 20"
        aria-hidden
        className="pointer-events-none absolute end-2 top-1/2 h-4 w-4 -translate-y-1/2 text-sky-300/70"
      >
        <path d="M5 8l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    </div>
  );
}

/* ═════════════════════ interactive plotting grid ═════════════════════ */

function PlotGrid({
  part,
  value,
  onChange,
  locked,
}: {
  part: Extract<Part, { type: "plot" }>;
  value: PlotValue;
  onChange: (v: PlotValue) => void;
  locked: boolean;
}) {
  const [active, setActive] = useState(part.targets[0]?.id ?? "");
  const svgRef = useRef<SVGSVGElement | null>(null);
  const unit = 42;
  const pad = 26;
  const w = part.cols * unit + pad * 2;
  const h = part.rows * unit + pad * 2;
  const X = (x: number) => pad + x * unit;
  const Y = (y: number) => h - pad - y * unit;

  const place = (evt: React.PointerEvent<SVGSVGElement>) => {
    if (locked || !active) return;
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const sx = ((evt.clientX - rect.left) / rect.width) * w;
    const sy = ((evt.clientY - rect.top) / rect.height) * h;
    const gx = Math.round((sx - pad) / unit);
    const gy = Math.round((h - pad - sy) / unit);
    if (gx < 0 || gy < 0 || gx > part.cols || gy > part.rows) return;
    playTick();
    const next = { ...value, [active]: { x: gx, y: gy } };
    onChange(next);
    const idx = part.targets.findIndex((t) => t.id === active);
    const nxt = part.targets[idx + 1];
    if (nxt && !next[nxt.id]) setActive(nxt.id);
  };

  const cols = useMemo(() => Array.from({ length: part.cols + 1 }, (_, i) => i), [part.cols]);
  const rows = useMemo(() => Array.from({ length: part.rows + 1 }, (_, i) => i), [part.rows]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {part.targets.map((t) => {
          const pt = value[t.id];
          const on = active === t.id;
          return (
            <button
              key={t.id}
              type="button"
              disabled={locked}
              onClick={() => setActive(t.id)}
              className={`min-h-11 rounded-lg border px-3 py-2 text-sm font-semibold transition-all ${
                on
                  ? "border-cyan-300 bg-cyan-400/15 text-cyan-100 shadow-[0_0_18px_-6px_rgba(34,211,238,0.8)]"
                  : "border-sky-400/25 bg-white/[0.03] text-slate-300 hover:border-sky-300/50"
              }`}
            >
              <span className="ktx" dir="ltr">
                {t.label}
              </span>
              <span className="ms-2 text-[0.75rem] font-normal text-slate-400" dir="ltr">
                {pt ? `(${pt.x} , ${pt.y})` : "— —"}
              </span>
            </button>
          );
        })}
        {!locked && (
          <button
            type="button"
            onClick={() => onChange({})}
            className="min-h-11 rounded-lg border border-rose-400/35 bg-rose-400/[0.07] px-3 py-2 text-sm font-semibold text-rose-200 transition-colors hover:bg-rose-400/15"
          >
            مسح النقاط
          </button>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-sky-400/20 bg-ink-900/70">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${w} ${h}`}
          className="block h-auto w-full cursor-crosshair select-none"
          onPointerDown={place}
          role="application"
          aria-label="شبكة إحداثيات: اختر النقطة من الأزرار ثم انقر على موضعها في الشبكة"
        >
          <defs>
            <marker
              id="plotArrow"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="5"
              markerHeight="5"
              orient="auto-start-reverse"
            >
              <path d="M0,1 L10,5 L0,9 z" fill="#fbbf24" />
            </marker>
          </defs>
          <rect x="0" y="0" width={w} height={h} fill="#0a1122" />
          {cols.map((x) => (
            <line key={`c${x}`} x1={X(x)} y1={Y(0)} x2={X(x)} y2={Y(part.rows)} stroke={x === 0 ? "rgba(148,180,232,0.75)" : "rgba(125,211,252,0.13)"} strokeWidth={x === 0 ? 1.7 : 1} />
          ))}
          {rows.map((y) => (
            <line key={`r${y}`} x1={X(0)} y1={Y(y)} x2={X(part.cols)} y2={Y(y)} stroke={y === 0 ? "rgba(148,180,232,0.75)" : "rgba(125,211,252,0.13)"} strokeWidth={y === 0 ? 1.7 : 1} />
          ))}
          {cols.filter((x) => x > 0).map((x) => (
            <text key={`tx${x}`} x={X(x)} y={Y(0) + 16} fill="#8fa6cc" fontSize="11" textAnchor="middle">{x}</text>
          ))}
          {rows.filter((y) => y > 0).map((y) => (
            <text key={`ty${y}`} x={X(0) - 8} y={Y(y) + 4} fill="#8fa6cc" fontSize="11" textAnchor="end">{y}</text>
          ))}
          <text x={X(part.cols) - 2} y={Y(0) - 10} fill="#94b4e8" fontSize="13" textAnchor="end" fontStyle="italic">x</text>
          <text x={X(0) + 9} y={Y(part.rows) + 12} fill="#94b4e8" fontSize="13" fontStyle="italic">y</text>

          {part.underlay?.polygon && (
            <g>
              <polygon
                points={part.underlay.polygon.pts.map(([x, y]) => `${X(x)},${Y(y)}`).join(" ")}
                fill="rgba(56,189,248,0.16)"
                stroke="#38bdf8"
                strokeWidth="2.4"
                strokeLinejoin="round"
              />
              {part.underlay.polygon.pts.map(([x, y], i) => (
                <g key={i}>
                  <circle cx={X(x)} cy={Y(y)} r="4.2" fill="#38bdf8" />
                  <text
                    x={X(x) - 11}
                    y={Y(y) + (i === 2 ? -9 : 20)}
                    fill="#e2ecff"
                    fontSize="17"
                    fontStyle="italic"
                    fontWeight="600"
                    textAnchor="end"
                    stroke="#050a16"
                    strokeWidth="3.2"
                    paintOrder="stroke"
                  >
                    {part.underlay!.polygon!.labels[i]}
                  </text>
                </g>
              ))}
            </g>
          )}

          {part.underlay?.vector && (
            <g>
              <line
                x1={X(part.underlay.vector.from[0])}
                y1={Y(part.underlay.vector.from[1])}
                x2={X(part.underlay.vector.to[0])}
                y2={Y(part.underlay.vector.to[1])}
                stroke="#fbbf24"
                strokeWidth="2.8"
                strokeLinecap="round"
                markerEnd="url(#plotArrow)"
              />
              {part.underlay.vector.label && (
                <text
                  x={(X(part.underlay.vector.from[0]) + X(part.underlay.vector.to[0])) / 2}
                  y={(Y(part.underlay.vector.from[1]) + Y(part.underlay.vector.to[1])) / 2 + 22}
                  fill="#fbbf24"
                  fontSize="13"
                  textAnchor="middle"
                  fontFamily="'IBM Plex Sans Arabic', sans-serif"
                  stroke="#050a16"
                  strokeWidth="3"
                  paintOrder="stroke"
                >
                  {part.underlay.vector.label}
                </text>
              )}
            </g>
          )}
          {part.targets.map((t) => {
            const pt = value[t.id];
            if (!pt) return null;
            return (
              <g key={t.id}>
                <circle cx={X(pt.x)} cy={Y(pt.y)} r="6" fill="#c084fc" stroke="#f0e6ff" strokeWidth="1.4" />
                <text
                  x={X(pt.x) + 10}
                  y={Y(pt.y) - 9}
                  fill="#f2e9ff"
                  fontSize="15"
                  fontStyle="italic"
                  fontWeight="600"
                  stroke="#050a16"
                  strokeWidth="3.2"
                  paintOrder="stroke"
                >
                  {t.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <p className="text-[0.8rem] text-slate-400">
        اختر رمز النقطة من الأزرار أعلاه ثم انقر على الشبكة لتثبيتها. الإحداثي الأول أفقي
        <span className="ktx mx-1" dir="ltr">(x)</span>
        والثاني شاقولي
        <span className="ktx mx-1" dir="ltr">(y)</span>.
      </p>
    </div>
  );
}

/* ═════════════════════ main control ═════════════════════ */

export function PartControl({
  part,
  value,
  onChange,
  locked,
}: {
  part: Part;
  value: unknown;
  onChange: (v: unknown) => void;
  locked: boolean;
}) {
  switch (part.type) {
    /* ── single choice ── */
    case "mcq": {
      const v = value as string | undefined;
      return (
        <div className="grid gap-2.5">
          {part.options.map((o, i) => {
            const on = v === o.id;
            return (
              <button
                key={o.id}
                type="button"
                disabled={locked}
                onClick={() => {
                  playTick();
                  onChange(o.id);
                }}
                aria-pressed={on}
                className={`flex min-h-12 w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-start transition-all duration-200 ${
                  on
                    ? "border-cyan-300/80 bg-gradient-to-l from-cyan-400/15 to-sky-500/5 shadow-[0_0_24px_-10px_rgba(34,211,238,0.9)]"
                    : "border-sky-400/18 bg-white/[0.022] hover:border-sky-300/50 hover:bg-sky-400/[0.05]"
                } disabled:cursor-default`}
              >
                <span
                  className={`grid size-7 shrink-0 place-items-center rounded-lg text-[0.8rem] font-bold ${
                    on ? "bg-cyan-300 text-ink-950" : "bg-ink-700 text-sky-200"
                  }`}
                >
                  {AR[i]}
                </span>
                <Rich text={o.text} className="text-[0.95rem] leading-relaxed text-slate-100" />
              </button>
            );
          })}
        </div>
      );
    }

    /* ── multiple choice ── */
    case "multi": {
      const arr = (value as string[]) ?? [];
      const toggle = (id: string) => {
        playTick();
        onChange(arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id]);
      };
      return (
        <div className="space-y-2.5">
          {part.instruction && (
            <p className="text-[0.83rem] font-medium text-amber-200/90">{part.instruction}</p>
          )}
          <div className="grid gap-2.5">
            {part.options.map((o) => {
              const on = arr.includes(o.id);
              return (
                <button
                  key={o.id}
                  type="button"
                  disabled={locked}
                  onClick={() => toggle(o.id)}
                  aria-pressed={on}
                  className={`flex min-h-12 w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-start transition-all duration-200 ${
                    on
                      ? "border-violet-300/75 bg-violet-400/12 shadow-[0_0_24px_-10px_rgba(167,139,250,0.9)]"
                      : "border-sky-400/18 bg-white/[0.022] hover:border-sky-300/50 hover:bg-sky-400/[0.05]"
                  } disabled:cursor-default`}
                >
                  <span
                    className={`grid size-6 shrink-0 place-items-center rounded-md border-2 transition-colors ${
                      on ? "border-violet-300 bg-violet-300" : "border-slate-500 bg-transparent"
                    }`}
                  >
                    {on && (
                      <svg viewBox="0 0 20 20" className="size-4 text-ink-950">
                        <path d="M5 10.5l3.2 3.2L15 7" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </span>
                  <Rich text={o.text} className="text-[0.95rem] leading-relaxed text-slate-100" />
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    /* ── true / false with correction ── */
    case "tf": {
      const v = (value ?? {}) as TfValue;
      return (
        <div className="space-y-3">
          {part.items.map((it, i) => {
            const e = v[it.id] ?? {};
            return (
              <Shell key={it.id}>
                <div className="space-y-3 p-3">
                  <div className="flex gap-2.5">
                    <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-md bg-ink-700 text-[0.75rem] font-bold text-sky-200">
                      {i + 1}
                    </span>
                    <Rich text={it.text} className="text-[0.95rem] leading-relaxed text-slate-100" />
                  </div>
                  <div className="flex flex-wrap items-center gap-2 ps-8">
                    <div className="inline-flex overflow-hidden rounded-lg border border-sky-400/25">
                      {(["true", "false"] as const).map((k) => (
                        <button
                          key={k}
                          type="button"
                          disabled={locked}
                          onClick={() => {
                            playTick();
                            onChange({ ...v, [it.id]: { verdict: k, correction: undefined } });
                          }}
                          className={`min-h-10 min-w-20 px-4 text-sm font-semibold transition-colors ${
                            e.verdict === k
                              ? k === "true"
                                ? "bg-emerald-400/25 text-emerald-100"
                                : "bg-rose-400/25 text-rose-100"
                              : "bg-transparent text-slate-300 hover:bg-white/5"
                          }`}
                        >
                          {k === "true" ? "صواب" : "خطأ"}
                        </button>
                      ))}
                    </div>
                    {e.verdict === "false" && it.corrections && (
                      <SelectBox
                        ariaLabel={`تصحيح العبارة ${i + 1}`}
                        className="min-w-[9.5rem] flex-1"
                        placeholder="اختر التصحيح المناسب…"
                        value={e.correction}
                        disabled={locked}
                        options={it.corrections}
                        onChange={(cid) =>
                          onChange({ ...v, [it.id]: { ...e, correction: cid } })
                        }
                      />
                    )}
                  </div>
                </div>
              </Shell>
            );
          })}
        </div>
      );
    }

    /* ── matching ── */
    case "match": {
      const v = (value ?? {}) as MatchValue;
      return (
        <div className="overflow-hidden rounded-xl border border-sky-400/18">
          <div className="grid grid-cols-[1fr] gap-px bg-sky-400/12 sm:grid-cols-[1fr_auto_16rem]">
            <div className="hidden bg-ink-800 px-3 py-2 text-[0.78rem] font-bold text-sky-200 sm:block">
              <Rich text={part.leftHeading} />
            </div>
            <div className="hidden bg-ink-800 px-2 py-2 sm:block" />
            <div className="hidden bg-ink-800 px-3 py-2 text-[0.78rem] font-bold text-violet-200 sm:block">
              <Rich text={part.rightHeading} />
            </div>
            {part.left.map((l, i) => (
              <div key={l.id} className="contents">
                <div className="flex items-start gap-2.5 bg-ink-900/70 px-3 py-3">
                  <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-md bg-ink-700 text-[0.75rem] font-bold text-sky-200">
                    {i + 1}
                  </span>
                  <Rich text={l.text} className="text-[0.92rem] leading-relaxed text-slate-100" />
                </div>
                <div className="hidden items-center bg-ink-900/70 px-2 text-sky-400/50 sm:flex">
                  <svg viewBox="0 0 24 24" className="size-5">
                    <path d="M15 6l-6 6 6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div className="bg-ink-900/70 px-3 pb-3 sm:py-3">
                  <SelectBox
                    ariaLabel={`نتيجة العنصر ${i + 1}`}
                    className="w-full"
                    placeholder="اختر ما يقابلها…"
                    value={v[l.id]}
                    disabled={locked}
                    options={part.right}
                    onChange={(rid) => onChange({ ...v, [l.id]: rid })}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    /* ── ordering ── */
    case "order": {
      const arr = ((value as string[]) ?? part.initialOrder).slice();
      const move = (i: number, d: number) => {
        const j = i + d;
        if (j < 0 || j >= arr.length) return;
        playTick();
        [arr[i], arr[j]] = [arr[j], arr[i]];
        onChange(arr);
      };
      const text = (id: string) => part.steps.find((s) => s.id === id)?.text ?? "";
      return (
        <ol className="space-y-2.5">
          {arr.map((id, i) => (
            <li
              key={id}
              className="flex items-center gap-2.5 rounded-xl border border-sky-400/20 bg-white/[0.025] p-2.5"
            >
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-sky-500/30 to-indigo-500/25 text-sm font-bold text-sky-100">
                {i + 1}
              </span>
              <Rich text={text(id)} className="flex-1 text-[0.92rem] leading-relaxed text-slate-100" />
              <span className="flex shrink-0 flex-col gap-1">
                <button
                  type="button"
                  aria-label="تحريك للأعلى"
                  disabled={locked || i === 0}
                  onClick={() => move(i, -1)}
                  className="grid size-9 place-items-center rounded-lg border border-sky-400/25 text-sky-200 transition-colors hover:bg-sky-400/12 disabled:opacity-25"
                >
                  <svg viewBox="0 0 20 20" className="size-4">
                    <path d="M5 12l5-5 5 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <button
                  type="button"
                  aria-label="تحريك للأسفل"
                  disabled={locked || i === arr.length - 1}
                  onClick={() => move(i, 1)}
                  className="grid size-9 place-items-center rounded-lg border border-sky-400/25 text-sky-200 transition-colors hover:bg-sky-400/12 disabled:opacity-25"
                >
                  <svg viewBox="0 0 20 20" className="size-4">
                    <path d="M5 8l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </span>
            </li>
          ))}
        </ol>
      );
    }

    /* ── numeric fields ── */
    case "numeric": {
      const v = (value ?? {}) as NumericValue;
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          {part.fields.map((f) => (
            <label key={f.id} className="block rounded-xl border border-sky-400/18 bg-white/[0.025] p-3">
              <span className="mb-2 block text-[0.9rem] font-medium text-slate-200">
                <Rich text={f.label} />
              </span>
              <span className="flex items-center gap-2">
                <input
                  type="text"
                  inputMode="decimal"
                  dir="ltr"
                  disabled={locked}
                  value={v[f.id] ?? ""}
                  onChange={(e) => onChange({ ...v, [f.id]: e.target.value })}
                  className="w-full min-w-0 rounded-lg border border-sky-400/30 bg-ink-900/85 px-3 py-2.5 text-center text-[1rem] font-semibold text-cyan-100 tabular-nums outline-none transition-colors focus:border-cyan-300 disabled:opacity-60"
                  placeholder="؟"
                />
                {f.unit && (
                  <span className="shrink-0 text-[0.85rem] font-medium text-slate-400">{f.unit}</span>
                )}
              </span>
            </label>
          ))}
        </div>
      );
    }

    /* ── proof with dropdown steps ── */
    case "cloze": {
      const v = (value ?? {}) as ClozeValue;
      let n = 0;
      return (
        <div className="space-y-3 rounded-xl border border-violet-400/22 bg-gradient-to-bl from-violet-500/[0.07] to-transparent p-3.5">
          <div className="text-[0.95rem] leading-[2.4] text-slate-100">
            {part.pieces.map((piece, i) => {
              if (typeof piece === "string") return <Rich key={i} text={piece} />;
              n += 1;
              const b = piece.blank;
              return (
                <span key={b.id} className="mx-1 inline-flex items-center gap-1.5 align-middle">
                  <span className="grid size-5 shrink-0 place-items-center rounded bg-violet-400/25 text-[0.7rem] font-bold text-violet-100">
                    {n}
                  </span>
                  <SelectBox
                    ariaLabel={`الفراغ ${n}`}
                    className="min-w-[8.5rem] max-w-full"
                    placeholder="اختر…"
                    value={v[b.id]}
                    disabled={locked}
                    options={b.options}
                    onChange={(oid) => onChange({ ...v, [b.id]: oid })}
                  />
                </span>
              );
            })}
          </div>
          <p className="text-[0.78rem] text-slate-400">
            كل فراغ مُقيَّم على حدة؛ املأ الفراغات بالخاصية أو الاستنتاج الذي يبرّر الخطوة.
          </p>
        </div>
      );
    }

    /* ── interactive plotting ── */
    case "plot":
      return (
        <PlotGrid
          part={part}
          value={(value ?? {}) as PlotValue}
          onChange={(x) => onChange(x)}
          locked={locked}
        />
      );

    default:
      return null;
  }
}

export function MarkChip({ marks }: { marks: number }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-amber-300/35 bg-amber-300/10 px-2.5 py-0.5 text-[0.72rem] font-bold text-amber-200">
      <M>{String(marks)}</M>
      <span>{marks === 1 ? "علامة" : marks === 2 ? "علامتان" : "علامات"}</span>
    </span>
  );
}