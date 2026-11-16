import React from "react";
import { RotateCcw, Undo2 } from "lucide-react";
import { ExamQuestion, QuestionAnswer } from "../types/exam";
import { buildReorderSentence, formatMarkLabel } from "../utils/grading";

interface QuestionInputProps {
  question: ExamQuestion;
  answer: QuestionAnswer | undefined;
  onChange: (next: QuestionAnswer) => void;
}

export const QuestionInput: React.FC<QuestionInputProps> = ({
  question,
  answer,
  onChange,
}) => {
  if (question.type === "single-choice") {
    const selected = answer?.type === "single-choice" ? answer.value : "";
    const letters = ["A", "B", "C", "D"];

    return (
      <div className="space-y-4">
        <p className="text-lg font-extrabold text-[#0f3d24] sm:text-xl">
          {question.prompt}
        </p>
        <div
          role="radiogroup"
          aria-label={question.prompt}
          className="grid grid-cols-1 gap-3"
        >
          {question.options.map((opt, idx) => {
            const isSelected = selected === opt;
            return (
              <button
                key={opt}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => onChange({ type: "single-choice", value: opt })}
                className={`flex w-full items-center gap-3.5 rounded-2xl border-2 px-4 py-3.5 text-left text-base font-bold transition-all sm:text-lg ${
                  isSelected
                    ? "border-[#22c55e] bg-[#e3faec] text-[#0f3d24] shadow-sm"
                    : "border-[#d4f1de] bg-white text-[#173c28] hover:border-[#7ce09c] hover:bg-[#f6fef8]"
                }`}
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-extrabold transition-colors ${
                    isSelected
                      ? "bg-[#22c55e] text-white"
                      : "bg-[#ecfbf1] text-[#15803d]"
                  }`}
                >
                  {letters[idx] || idx + 1}
                </span>
                <span>{opt}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (question.type === "choice-parts") {
    const values = answer?.type === "parts" ? answer.values : {};
    const setPart = (partId: string, val: string) => {
      onChange({
        type: "parts",
        values: { ...values, [partId]: val },
      });
    };

    return (
      <div className="space-y-4">
        {question.parts.map((part) => {
          const chosen = values[part.id] || "";
          const isHorizontal =
            question.variant === "true-false" ||
            question.variant === "inline-choice";

          return (
            <div
              key={part.id}
              className="rounded-2xl border border-[#d0f0db] bg-[#fafefb] p-4"
            >
              <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                <p className="text-base font-extrabold text-[#0f3d24] sm:text-lg">
                  {part.prompt}
                </p>
                <span className="shrink-0 rounded-full border border-[#c3ebb0] bg-[#f2fde4] px-2.5 py-0.5 text-xs font-extrabold text-[#3f6212]">
                  {formatMarkLabel(part.marks)}
                </span>
              </div>

              <div
                role="radiogroup"
                aria-label={part.prompt}
                className={
                  isHorizontal
                    ? "flex flex-wrap gap-2.5"
                    : "grid grid-cols-1 gap-2.5"
                }
              >
                {part.options.map((opt) => {
                  const isSelected = chosen === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      onClick={() => setPart(part.id, opt)}
                      className={`rounded-xl border-2 px-4 py-2.5 text-left text-base font-bold transition-all ${
                        isHorizontal ? "min-w-[110px] text-center" : "w-full"
                      } ${
                        isSelected
                          ? "border-[#22c55e] bg-[#22c55e] text-white shadow-xs"
                          : "border-[#cdeed7] bg-white text-[#173c28] hover:border-[#6fd492] hover:bg-[#f2fcf5]"
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  if (question.type === "match") {
    const values = answer?.type === "parts" ? answer.values : {};
    const setPart = (partId: string, val: string) => {
      onChange({
        type: "parts",
        values: { ...values, [partId]: val },
      });
    };

    return (
      <div className="space-y-3">
        {question.parts.map((part) => {
          const chosen = values[part.id] || "";
          const selectId = `${question.id}-${part.id}`;
          return (
            <div
              key={part.id}
              className={`flex flex-col gap-2.5 rounded-2xl border p-3.5 transition-colors sm:flex-row sm:items-center sm:justify-between sm:p-4 ${
                chosen
                  ? "border-[#86efac] bg-[#f2fcf5]"
                  : "border-[#d0f0db] bg-[#fafefb]"
              }`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <label
                  htmlFor={selectId}
                  className="text-base font-extrabold text-[#0f3d24] sm:text-[17px]"
                >
                  {part.prompt}
                </label>
                <span className="rounded-full border border-[#c3ebb0] bg-[#f2fde4] px-2.5 py-0.5 text-xs font-extrabold text-[#3f6212]">
                  {formatMarkLabel(part.marks)}
                </span>
              </div>

              <select
                id={selectId}
                value={chosen}
                onChange={(e) => setPart(part.id, e.target.value)}
                className={`w-full rounded-xl border-2 bg-white px-3.5 py-2.5 text-base font-bold text-[#0f3d24] transition-colors sm:w-72 ${
                  chosen
                    ? "border-[#22c55e] bg-white"
                    : "border-[#c6ebd3] hover:border-[#6fd492]"
                }`}
              >
                <option value="">
                  {question.optionPlaceholder || "Choose an option..."}
                </option>
                {question.options.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          );
        })}
      </div>
    );
  }

  if (question.type === "text-parts") {
    const values = answer?.type === "parts" ? answer.values : {};
    const setPart = (partId: string, val: string) => {
      onChange({
        type: "parts",
        values: { ...values, [partId]: val },
      });
    };

    return (
      <div className="space-y-3.5">
        {question.parts.map((part) => {
          const current = values[part.id] || "";
          const inputId = `${question.id}-${part.id}`;
          const isLongSentence =
            part.placeholder?.startsWith("I can") ||
            part.correctDisplay.split(" ").length >= 4;

          return (
            <div
              key={part.id}
              className={`rounded-2xl border p-4 transition-colors ${
                current.trim()
                  ? "border-[#86efac] bg-[#f3fdf6]"
                  : "border-[#d0f0db] bg-[#fafefb]"
              }`}
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <label
                  htmlFor={inputId}
                  className="text-xs font-extrabold uppercase tracking-wider text-[#15803d]"
                >
                  Item {part.label || part.id.toUpperCase()}
                </label>
                <span className="rounded-full border border-[#c3ebb0] bg-[#f2fde4] px-2.5 py-0.5 text-xs font-extrabold text-[#3f6212]">
                  {formatMarkLabel(part.marks)}
                </span>
              </div>

              {part.cueImages && part.cueImages.length > 0 && (
                <div className="mb-3 inline-flex flex-wrap items-center gap-3 rounded-xl border border-[#d4f2df] bg-white px-3 py-2">
                  {part.cueImages.map((img, iIdx) => (
                    <React.Fragment key={iIdx}>
                      {iIdx > 0 && (
                        <span
                          className="text-lg font-extrabold text-[#22c55e]"
                          aria-hidden="true"
                        >
                          +
                        </span>
                      )}
                      <img
                        src={img.src}
                        alt={img.alt}
                        loading="eager"
                        className="h-16 w-auto max-w-full rounded bg-white object-contain sm:h-20"
                      />
                    </React.Fragment>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2 text-base font-bold text-[#0f3d24] sm:text-lg">
                {part.beforeText && <span>{part.beforeText}</span>}

                {part.mistakeText && (
                  <span className="rounded-lg border border-[#fca5a5] bg-[#fef2f2] px-2.5 py-0.5 font-extrabold text-[#b91c1c] line-through decoration-2">
                    ({part.mistakeText})
                  </span>
                )}

                <input
                  id={inputId}
                  type="text"
                  autoComplete="off"
                  spellCheck={false}
                  value={current}
                  onChange={(e) => setPart(part.id, e.target.value)}
                  placeholder={part.placeholder || "Type your answer"}
                  className={`rounded-xl border-2 bg-white px-3.5 py-2 text-base font-extrabold text-[#0f3d24] placeholder:font-medium placeholder:text-[#7da58d] transition-colors ${
                    isLongSentence ? "w-full sm:w-80" : "w-48 sm:w-56"
                  } ${
                    current.trim()
                      ? "border-[#22c55e]"
                      : "border-[#b9e6c9] hover:border-[#6fd492]"
                  }`}
                />

                {part.afterText && <span>{part.afterText}</span>}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Reorder words question
  const chosenIndices = answer?.type === "reorder" ? answer.chosenIndices : [];
  const chosenSet = new Set(chosenIndices);
  const builtSentence = buildReorderSentence(question, chosenIndices);

  const addWord = (idx: number) => {
    if (chosenSet.has(idx)) return;
    onChange({
      type: "reorder",
      chosenIndices: [...chosenIndices, idx],
    });
  };

  const removeAtPosition = (pos: number) => {
    const next = chosenIndices.filter((_, i) => i !== pos);
    onChange({ type: "reorder", chosenIndices: next });
  };

  const undoLast = () => {
    if (chosenIndices.length === 0) return;
    onChange({
      type: "reorder",
      chosenIndices: chosenIndices.slice(0, -1),
    });
  };

  const clearAll = () => {
    onChange({ type: "reorder", chosenIndices: [] });
  };

  return (
    <div className="space-y-4">
      {/* Available word tiles */}
      <div className="rounded-2xl border-2 border-[#c8eeb5] bg-[#f6fee9] p-4">
        <p className="mb-2.5 text-xs font-extrabold uppercase tracking-wider text-[#3f6212]">
          Tap each word in order (use all {question.words.length} words)
        </p>
        <div className="flex flex-wrap gap-2.5">
          {question.words.map((word, idx) => {
            const used = chosenSet.has(idx);
            return (
              <button
                key={`${word}-${idx}`}
                type="button"
                disabled={used}
                onClick={() => addWord(idx)}
                className={`rounded-xl border-2 px-4 py-2 text-base font-extrabold transition-all sm:text-lg ${
                  used
                    ? "border-dashed border-[#c7e6ce] bg-[#edf7ef] text-[#94b8a0] opacity-55"
                    : "border-[#84cc16] bg-white text-[#0f3d24] shadow-xs hover:-translate-y-0.5 hover:border-[#22c55e] hover:bg-[#eefbf2]"
                }`}
              >
                {word}
              </button>
            );
          })}
        </div>
      </div>

      {/* Built sentence area */}
      <div className="rounded-2xl border-2 border-[#b7e8c8] bg-white p-4">
        <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-extrabold uppercase tracking-wider text-[#15803d]">
            Your sentence ({chosenIndices.length} / {question.words.length} words)
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={undoLast}
              disabled={chosenIndices.length === 0}
              className="inline-flex items-center gap-1 rounded-lg border border-[#c6ebd3] bg-[#f4fdf7] px-2.5 py-1 text-xs font-bold text-[#166534] transition-colors hover:bg-[#dcfce7] disabled:opacity-40"
            >
              <Undo2 className="h-3.5 w-3.5" aria-hidden="true" />
              Undo
            </button>
            <button
              type="button"
              onClick={clearAll}
              disabled={chosenIndices.length === 0}
              className="inline-flex items-center gap-1 rounded-lg border border-[#c6ebd3] bg-[#f4fdf7] px-2.5 py-1 text-xs font-bold text-[#166534] transition-colors hover:bg-[#dcfce7] disabled:opacity-40"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              Clear
            </button>
          </div>
        </div>

        <div className="flex min-h-[58px] flex-wrap items-center gap-2 rounded-xl border-2 border-dashed border-[#bfe8cd] bg-[#f8fefa] p-3">
          {chosenIndices.length === 0 ? (
            <span className="text-sm font-semibold text-[#6a967c]">
              Tap the words above to build the sentence here...
            </span>
          ) : (
            <>
              {chosenIndices.map((wordIdx, pos) => (
                <button
                  key={`${wordIdx}-${pos}`}
                  type="button"
                  onClick={() => removeAtPosition(pos)}
                  title="Tap to remove this word"
                  className="rounded-xl border-2 border-[#22c55e] bg-[#dcfce7] px-3.5 py-1.5 text-base font-extrabold text-[#0f3d24] transition-colors hover:border-[#16a34a] hover:bg-[#bbf7d0] sm:text-lg"
                >
                  {question.words[wordIdx]}
                </button>
              ))}
              <span className="px-1.5 text-xl font-extrabold text-[#15803d]">
                {question.endPunctuation}
              </span>
            </>
          )}
        </div>

        {chosenIndices.length === question.words.length && (
          <p className="mt-2.5 text-sm font-bold text-[#15803d]">
            Complete answer: <span className="text-[#0f3d24]">{builtSentence}</span>
          </p>
        )}
      </div>
    </div>
  );
};
