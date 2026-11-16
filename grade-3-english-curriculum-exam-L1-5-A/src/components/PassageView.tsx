import type { Passage } from "../types";
import { BookIcon, ChatIcon, ImageIcon, MusicIcon, TableIcon } from "./Icons";

const ICONS = { dialogue: ChatIcon, song: MusicIcon, text: BookIcon, table: TableIcon, picture: ImageIcon };

function Lines({ text }: { text: string }) {
  const parts = text.split("\n");
  return (
    <>
      {parts.map((p, i) => (
        <span key={i}>
          {p}
          {i < parts.length - 1 && <br />}
        </span>
      ))}
    </>
  );
}

export function PassageView({ passage, compact = false }: { passage: Passage; compact?: boolean }) {
  const Icon = ICONS[passage.kind];
  return (
    <section
      aria-label={passage.title}
      className={`rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/80 to-lime-50/70 ${compact ? "p-3" : "p-4 sm:p-5"}`}
    >
      <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-emerald-800">
        <Icon className="h-4 w-4" />
        {passage.title}
      </h3>

      {passage.kind === "dialogue" && (
        <ol className="grid gap-3 sm:grid-cols-2">
          {passage.panels.map((panel, i) => (
            <li key={i} className="relative rounded-xl border border-green-100 bg-white p-3 pt-4 shadow-sm">
              <span className="absolute -left-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-lime-300 text-xs font-bold text-green-950 shadow-sm">
                {i + 1}
              </span>
              <div className="flex flex-col gap-2">
                {panel.map((bubble, j) => (
                  <p
                    key={j}
                    className={`max-w-[95%] rounded-2xl border px-3 py-2 text-base leading-snug sm:text-[1.05rem] ${
                      j % 2 === 0
                        ? "self-start rounded-tl-sm border-green-200 bg-green-50 text-green-950"
                        : "self-end rounded-tr-sm border-lime-200 bg-lime-50 text-green-950"
                    }`}
                  >
                    <Lines text={bubble} />
                  </p>
                ))}
              </div>
            </li>
          ))}
        </ol>
      )}

      {passage.kind === "song" && (
        <div className="mx-auto max-w-md rounded-xl border border-green-100 bg-white px-4 py-4 text-center shadow-sm">
          {passage.lines.map((line, i) => (
            <p key={i} className={`py-0.5 text-lg leading-relaxed ${i % 3 === 0 ? "text-green-800" : i % 3 === 1 ? "text-emerald-700" : "text-lime-800"}`}>
              {line}
            </p>
          ))}
        </div>
      )}

      {passage.kind === "text" && (
        <blockquote className="rounded-xl border-l-4 border-lime-400 bg-white px-4 py-3 text-lg leading-relaxed text-green-950 shadow-sm">
          {passage.lines.map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </blockquote>
      )}

      {passage.kind === "table" && (
        <div className="overflow-x-auto rounded-xl border border-green-100 bg-white shadow-sm">
          <table className="w-full min-w-[420px] border-collapse text-left text-base">
            <thead>
              <tr>
                {passage.header.map((h, i) => (
                  <th key={i} scope="col" className="border-b border-green-100 bg-lime-100 px-3 py-2 text-sm font-bold uppercase tracking-wide text-green-900">
                    {h || <span className="sr-only">Row</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {passage.rows.map((row, r) => (
                <tr key={r} className="odd:bg-white even:bg-green-50/50">
                  {row.map((cell, c) => (
                    <td key={c} className={`border-b border-green-50 px-3 py-2 ${c === 0 && passage.header[0] === "" ? "font-semibold text-green-900" : "text-green-950"}`}>
                      {cell || <span className="text-green-300" aria-label="empty">—</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {passage.note && <p className="border-t border-green-50 px-3 py-2 text-sm text-green-800">{passage.note}</p>}
        </div>
      )}

      {passage.kind === "picture" && (
        <figure className="mx-auto max-w-2xl">
          <div className="relative overflow-hidden rounded-xl border border-green-100 bg-white shadow-sm">
            <img src={passage.image.src} alt={passage.image.alt} className="block h-auto w-full" />
            {passage.labels.map((label, i) => (
              <span
                key={i}
                aria-hidden="true"
                className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-md border border-green-300 bg-white/95 px-1.5 py-0.5 text-[10px] font-bold text-green-900 shadow-sm sm:text-xs"
                style={{ left: `${label.x}%`, top: `${label.y}%` }}
              >
                {label.text}
              </span>
            ))}
          </div>
          <figcaption className="mt-2 text-center text-sm text-green-800">The labels on the building are printed in your book.</figcaption>
        </figure>
      )}
    </section>
  );
}
