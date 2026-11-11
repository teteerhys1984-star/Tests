import { Fragment } from "react";
import type { Sub } from "../data/exam";
import type { Ans } from "../lib/grade";
import { Rich } from "./Rich";
import { Figure } from "./Figures";
import { toAr } from "../lib/text";

const cleanDigits = (v: string) => v.replace(/[^0-9٠-٩۰-۹]/g, "").slice(0, 9);

function NumInput({
  value,
  onChange,
  ph,
  wide,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  ph?: string;
  wide?: boolean;
  label?: string;
}) {
  return (
    <input
      className={"mc-input" + (wide ? " wide" : "")}
      inputMode="numeric"
      autoComplete="off"
      value={value}
      placeholder={ph}
      aria-label={label || ph || "إجابة"}
      onChange={(e) => onChange(cleanDigits(e.target.value))}
    />
  );
}

export function SubView({
  sub,
  letter,
  answer,
  order,
  onChange,
}: {
  sub: Sub;
  letter: string;
  answer: Ans;
  order: string[];
  onChange: (a: Ans) => void;
}) {
  const optsOrdered = (order.length ? order : (sub.options ?? []).map((o) => o.k)).map((k) => sub.options!.find((o) => o.k === k)!);
  const arr = Array.isArray(answer) ? answer : [];

  const setField = (i: number, v: string) => {
    const n = sub.fields!.length;
    const next = Array.from({ length: n }, (_, k) => arr[k] ?? "");
    next[i] = v;
    onChange(next);
  };

  let body: React.ReactNode = null;

  if (sub.kind === "mcq") {
    body = (
      <div className={sub.sym ? "flex gap-3 flex-wrap" : "grid gap-2 sm:grid-cols-2"} role="radiogroup">
        {optsOrdered.map((o) => {
          const on = answer === o.k;
          return (
            <button
              key={o.k}
              type="button"
              role="radio"
              aria-checked={on}
              className={"mc-opt" + (on ? " sel" : "") + (sub.sym ? " symbtn" : "")}
              onClick={() => onChange(o.k)}
            >
              {!sub.sym && <span className="box">{on ? "●" : ""}</span>}
              <span>
                <Rich text={o.t} />
              </span>
            </button>
          );
        })}
      </div>
    );
  } else if (sub.kind === "multi") {
    body = (
      <div className="grid gap-2 sm:grid-cols-2">
        {optsOrdered.map((o) => {
          const on = arr.includes(o.k);
          return (
            <button
              key={o.k}
              type="button"
              role="checkbox"
              aria-checked={on}
              className={"mc-opt" + (on ? " sel" : "")}
              onClick={() => onChange(on ? arr.filter((x) => x !== o.k) : [...arr, o.k])}
            >
              <span className="box">{on ? "✔" : ""}</span>
              <span>
                <Rich text={o.t} />
              </span>
            </button>
          );
        })}
      </div>
    );
  } else if (sub.kind === "order") {
    const placed = arr;
    const pool = optsOrdered.filter((o) => !placed.includes(o.k));
    const isText = optsOrdered.some((o) => !/^[0-9]+$/.test(o.t));
    const label = (k: string) => optsOrdered.find((o) => o.k === k)!.t;
    body = (
      <div className="grid gap-3">
        <div>
          <div className="text-sm font-bold text-slate-700 mb-1">العناصر المتاحة:</div>
          <div className="flex flex-wrap gap-2 min-h-[3rem]">
            {pool.map((o) => (
              <button key={o.k} type="button" className={"chip" + (isText ? " text" : "")} onClick={() => onChange([...placed, o.k])}>
                {isText ? <Rich text={o.t} /> : toAr(o.t)}
              </button>
            ))}
            {pool.length === 0 && <span className="text-slate-500 text-sm self-center">تم وضع جميع العناصر.</span>}
          </div>
        </div>
        <div>
          <div className="text-sm font-bold text-slate-700 mb-1">ترتيبك (اضغط على عنصر لإزالته):</div>
          <div className="grid gap-2">
            {optsOrdered.map((_, i) => {
              const k = placed[i];
              return (
                <div className="slot" key={i}>
                  <span className="n">{toAr(i + 1)}</span>
                  {k ? (
                    <button type="button" className={"chip" + (isText ? " text" : "")} onClick={() => onChange(placed.filter((x) => x !== k))}>
                      {isText ? <Rich text={label(k)} /> : toAr(label(k))}
                    </button>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </div>
              );
            })}
          </div>
          {placed.length > 0 && (
            <button type="button" className="mc-btn brown small mt-2" onClick={() => onChange([])}>
              مسح الترتيب
            </button>
          )}
        </div>
      </div>
    );
  } else if (sub.kind === "fields") {
    const fs = sub.fields!;
    if (sub.template) {
      const t = sub.template.replace(/^\{\{|\}\}$/g, "");
      const pieces = t.split("@@");
      body = (
        <div dir="ltr" className="flex flex-wrap items-center gap-2 text-2xl font-extrabold" style={{ direction: "ltr", unicodeBidi: "isolate-override" }}>
          {pieces.map((p, i) => (
            <Fragment key={i}>
              {p.trim() !== "" && (
                <span dir="ltr" className="whitespace-pre" style={{ unicodeBidi: "isolate-override" }}>
                  {"\u200E" + toAr(p.trim()) + "\u200E"}
                </span>
              )}
              {i < fs.length && <NumInput value={arr[i] ?? ""} onChange={(v) => setField(i, v)} ph={fs[i].ph} label={`الفراغ ${i + 1}`} />}
            </Fragment>
          ))}
        </div>
      );
    } else if (sub.layout === "table") {
      body = (
        <div className="overflow-x-auto">
          <table className="pt-table">
            <thead>
              <tr>
                {fs.map((f, i) => (
                  <th key={i}>{f.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                {fs.map((f, i) => (
                  <td key={i}>
                    <input
                      className="mc-input"
                      style={{ width: "4.2rem" }}
                      inputMode="numeric"
                      autoComplete="off"
                      maxLength={1}
                      aria-label={f.label}
                      value={arr[i] ?? ""}
                      onChange={(e) => setField(i, cleanDigits(e.target.value).slice(0, 1))}
                    />
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      );
    } else {
      body = (
        <div className="flex flex-wrap items-end gap-4">
          {fs.map((f, i) => (
            <label key={i} className="grid gap-1">
              {f.label && <span className="text-sm font-bold text-slate-700">{f.label}</span>}
              <span className="flex items-center gap-2">
                <NumInput value={arr[i] ?? ""} onChange={(v) => setField(i, v)} ph={f.ph} wide={!!f.label || !!f.ph} label={f.label || f.ph} />
                {f.unit && <span className="font-bold">{f.unit}</span>}
              </span>
            </label>
          ))}
        </div>
      );
    }
  } else if (sub.kind === "tfc") {
    const v = (answer as { c: "T" | "F" | ""; corr: string } | undefined) ?? { c: "", corr: "" };
    body = (
      <div className="grid gap-3">
        <div className="flex gap-3 flex-wrap">
          {[
            { k: "T", t: "صحيحة" },
            { k: "F", t: "خاطئة" },
          ].map((o) => {
            const on = v.c === o.k;
            return (
              <button
                key={o.k}
                type="button"
                role="radio"
                aria-checked={on}
                className={"mc-opt" + (on ? " sel" : "")}
                style={{ width: "auto", minWidth: "8rem" }}
                onClick={() => onChange({ c: o.k as "T" | "F", corr: o.k === "T" ? "" : v.corr })}
              >
                <span className="box">{on ? "●" : ""}</span>
                <span>{o.t}</span>
              </button>
            );
          })}
        </div>
        {v.c === "F" && sub.tf?.corrLabel && (
          <div className="flex flex-wrap items-center gap-3 p-3 bg-white/70 border-2 border-dashed border-slate-500">
            <span className="font-bold">
              <Rich text={sub.tf.corrLabel} />
            </span>
            <NumInput value={v.corr} onChange={(c) => onChange({ c: "F", corr: c })} ph="التصحيح" label="التصحيح" />
          </div>
        )}
      </div>
    );
  } else if (sub.kind === "plot") {
    const val = typeof answer === "string" ? answer : "";
    const [px, py] = val ? val.split(",") : ["", ""];
    body = (
      <div className="grid gap-2">
        {sub.fig && (
          <div className="overflow-x-auto">
            <Figure fig={sub.fig} plotValue={val} onPlot={(v) => onChange(v)} />
          </div>
        )}
        <div className="text-sm font-bold text-slate-700">
          {val ? (
            <>
              النقطة التي اخترتها: <bdi className="math">{`( ${toAr(px)} , ${toAr(py)} )`}</bdi>
            </>
          ) : (
            "لم تحدد نقطة بعد — انقر على التقاطع المناسب في الشبكة."
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mc-card p-3 sm:p-4 pop">
      <div className="flex items-start gap-3 mb-3">
        <span className="flex-none w-9 h-9 grid place-items-center font-extrabold text-white bg-[#2b6fd6] border-[3px] border-[#14336b]">
          {letter}
        </span>
        <div className="flex-1 text-lg font-bold leading-8">
          <Rich text={sub.prompt} />
        </div>
        <span className="badge">العلامة: {toAr(sub.marks)}</span>
      </div>
      {sub.fig && sub.kind !== "plot" && (
        <div className="mb-3 overflow-x-auto">
          <Figure fig={sub.fig} />
        </div>
      )}
      {body}
    </div>
  );
}
