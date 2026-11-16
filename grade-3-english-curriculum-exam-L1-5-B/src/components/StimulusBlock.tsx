import React from "react";
import { BookOpen, Music, Sparkles, Table as TableIcon } from "lucide-react";
import { QuestionStimulus } from "../types/exam";

interface StimulusBlockProps {
  stimuli?: QuestionStimulus[];
  compact?: boolean;
}

export const StimulusBlock: React.FC<StimulusBlockProps> = ({
  stimuli,
  compact = false,
}) => {
  if (!stimuli || stimuli.length === 0) return null;

  return (
    <div className="space-y-3.5">
      {stimuli.map((stim, idx) => {
        switch (stim.kind) {
          case "reading":
            return (
              <div
                key={idx}
                className="rounded-2xl border-2 border-[#b9e8c9] bg-gradient-to-br from-[#f1fcf5] to-[#f8fef9] p-4 sm:p-5"
              >
                <div className="mb-3 flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[#15803d]">
                  {stim.isSong ? (
                    <Music className="h-4 w-4 shrink-0 text-[#22c55e]" aria-hidden="true" />
                  ) : (
                    <BookOpen className="h-4 w-4 shrink-0 text-[#22c55e]" aria-hidden="true" />
                  )}
                  <span>{stim.heading}</span>
                </div>
                <div
                  className={
                    stim.isSong
                      ? "space-y-1.5 border-l-4 border-[#84cc16] pl-4 text-base font-semibold leading-relaxed text-[#123823] sm:text-[17px]"
                      : "space-y-2 text-base leading-relaxed text-[#123823] sm:text-[17px]"
                  }
                >
                  {stim.lines.map((line, lIdx) => (
                    <p key={lIdx} className="m-0">
                      {line.speaker && (
                        <span className="mr-1.5 inline-block font-extrabold text-[#15803d]">
                          {line.speaker}:
                        </span>
                      )}
                      {line.label && (
                        <span className="mr-2 inline-flex items-center rounded-md bg-[#dcfce7] px-2 py-0.5 text-xs font-extrabold text-[#166534]">
                          {line.label}
                        </span>
                      )}
                      <span className="font-semibold">{line.text}</span>
                    </p>
                  ))}
                </div>
              </div>
            );

          case "table":
            return (
              <div
                key={idx}
                className="rounded-2xl border-2 border-[#b9e8c9] bg-[#f4fdf7] p-4 sm:p-5"
              >
                <div className="mb-3 flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[#15803d]">
                  <TableIcon className="h-4 w-4 shrink-0 text-[#22c55e]" aria-hidden="true" />
                  <span>{stim.heading}</span>
                </div>
                <div className="overflow-x-auto rounded-xl border border-[#bfe8cd] bg-white">
                  <table className="w-full min-w-[320px] border-collapse text-center text-sm sm:text-base">
                    <thead>
                      <tr className="bg-[#dcfce7] text-[#0f3d24]">
                        {stim.headers.map((header, hIdx) => (
                          <th
                            key={hIdx}
                            scope="col"
                            className="border-b border-r border-[#bfe8cd] px-3 py-2.5 font-extrabold last:border-r-0"
                          >
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {stim.rows.map((row, rIdx) => (
                        <tr
                          key={rIdx}
                          className={rIdx % 2 === 0 ? "bg-white" : "bg-[#f8fef9]"}
                        >
                          {row.map((cell, cIdx) => (
                            <td
                              key={cIdx}
                              className={`border-b border-r border-[#e1f5e8] px-3 py-2 font-semibold text-[#173c28] last:border-r-0 ${
                                cell.isExample ? "font-extrabold text-[#15803d]" : ""
                              }`}
                            >
                              {cell.text}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {stim.imageSrc && !compact && (
                  <div className="mt-3 flex justify-center">
                    <img
                      src={stim.imageSrc}
                      alt={stim.imageAlt || stim.heading}
                      loading="eager"
                      className="h-36 w-auto max-w-full rounded-xl border border-[#cdeed7] bg-white p-1.5 object-contain sm:h-44"
                    />
                  </div>
                )}
                {stim.caption && (
                  <p className="mt-2 text-xs font-semibold text-[#3f6a52]">
                    {stim.caption}
                  </p>
                )}
              </div>
            );

          case "word-bank":
            return (
              <div
                key={idx}
                className="rounded-2xl border-2 border-[#c8eeb5] bg-[#f6fee9] px-4 py-3"
              >
                <p className="mb-2 text-xs font-extrabold uppercase tracking-wider text-[#3f6212]">
                  {stim.label || "Word Box"}
                </p>
                <div className="flex flex-wrap gap-2">
                  {stim.words.map((word, wIdx) => (
                    <span
                      key={wIdx}
                      className="rounded-xl border border-[#a3e635] bg-white px-3.5 py-1.5 text-base font-extrabold text-[#0f3d24] shadow-xs"
                    >
                      {word}
                    </span>
                  ))}
                </div>
              </div>
            );

          case "example":
            return (
              <div
                key={idx}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#b9e8c9] bg-[#eefbf2] px-4 py-3"
              >
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#22c55e] px-2.5 py-0.5 text-xs font-extrabold text-white">
                    <Sparkles className="h-3 w-3" aria-hidden="true" />
                    {stim.label}
                  </span>
                  <span className="text-base font-bold text-[#0f3d24]">
                    {stim.text}
                  </span>
                </div>
                {stim.iconPair && (
                  <div className="flex items-center gap-2.5 rounded-xl border border-[#cdeed7] bg-white px-3 py-1.5">
                    <img
                      src={stim.iconPair.leftSrc}
                      alt={stim.iconPair.leftAlt}
                      loading="eager"
                      className="h-11 w-auto object-contain"
                    />
                    <span className="font-bold text-[#22c55e]" aria-hidden="true">
                      +
                    </span>
                    <img
                      src={stim.iconPair.rightSrc}
                      alt={stim.iconPair.rightAlt}
                      loading="eager"
                      className="h-11 w-auto object-contain"
                    />
                  </div>
                )}
              </div>
            );

          case "images":
            return (
              <div
                key={idx}
                className="rounded-2xl border-2 border-[#c6ebd3] bg-white p-3.5 sm:p-4"
              >
                {stim.heading && (
                  <p className="mb-3 text-sm font-extrabold text-[#15803d]">
                    {stim.heading}
                  </p>
                )}

                {stim.layout === "cards" ? (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {stim.items.map((item, iIdx) => (
                      <figure
                        key={iIdx}
                        className="flex flex-col items-center rounded-xl border border-[#d4f2df] bg-[#f8fefa] p-3 text-center"
                      >
                        {item.label && (
                          <span className="mb-2 inline-block rounded-full bg-[#dcfce7] px-3 py-0.5 text-xs font-extrabold text-[#166534]">
                            {item.label}
                          </span>
                        )}
                        <img
                          src={item.src}
                          alt={item.alt}
                          loading="eager"
                          className={`${
                            compact ? "h-20" : "h-24 sm:h-28"
                          } w-auto max-w-full rounded-lg bg-white object-contain`}
                        />
                        {item.caption && (
                          <figcaption className="mt-2 text-xs font-semibold text-[#39634b]">
                            {item.caption}
                          </figcaption>
                        )}
                      </figure>
                    ))}
                  </div>
                ) : stim.layout === "row" ? (
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    {stim.items.map((item, iIdx) => (
                      <figure
                        key={iIdx}
                        className="flex flex-col items-center rounded-xl border border-[#d4f2df] bg-[#f8fefa] p-3 text-center"
                      >
                        {item.label && (
                          <span className="mb-2 inline-block rounded-full bg-[#ecfccb] px-3 py-0.5 text-sm font-extrabold text-[#365314]">
                            {item.label}
                          </span>
                        )}
                        <img
                          src={item.src}
                          alt={item.alt}
                          loading="eager"
                          className={`${
                            compact ? "h-24" : "h-28 sm:h-32"
                          } w-auto max-w-full rounded-lg bg-white p-1 object-contain`}
                        />
                      </figure>
                    ))}
                  </div>
                ) : (
                  stim.items.map((item, iIdx) => (
                    <figure key={iIdx} className="flex flex-col items-center">
                      <img
                        src={item.src}
                        alt={item.alt}
                        loading="eager"
                        className={`${
                          compact ? "max-h-60" : "max-h-88 sm:max-h-[420px]"
                        } w-auto max-w-full rounded-xl bg-white object-contain`}
                      />
                      {item.caption && (
                        <figcaption className="mt-2.5 rounded-xl bg-[#f1fcf5] px-3 py-1.5 text-center text-xs font-bold text-[#2b583e] sm:text-sm">
                          {item.caption}
                        </figcaption>
                      )}
                    </figure>
                  ))
                )}
              </div>
            );
        }
      })}
    </div>
  );
};
