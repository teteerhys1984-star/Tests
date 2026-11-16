/**
 * Numbered navigation palette. Answered questions are filled with their
 * lesson accent colour (cyan = Future Plans, violet = School Challenges);
 * correctness is never indicated during the exam.
 */
import type { Question } from "../types";
import { cn } from "../utils/cn";

export function LessonChip({ lesson, className }: { lesson: "lesson1" | "lesson2"; className?: string }) {
  const isL1 = lesson === "lesson1";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider",
        isL1
          ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-300"
          : "border-violet-400/30 bg-violet-400/10 text-violet-300",
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", isL1 ? "bg-cyan-400" : "bg-violet-400")} />
      {isL1 ? "Lesson 1 · Future Plans" : "Lesson 2 · School Challenges"}
    </span>
  );
}

export function QuestionPalette({
  questions,
  answeredFlags,
  currentIndex,
  onJump,
}: {
  questions: Question[];
  answeredFlags: boolean[];
  currentIndex: number;
  onJump: (index: number) => void;
}) {
  const groups: { label: string; lesson: "lesson1" | "lesson2"; indices: number[] }[] = [
    { label: "Lesson 1 · Future Plans", lesson: "lesson1", indices: questions.map((_, i) => i).slice(0, 10) },
    { label: "Lesson 2 · School Challenges", lesson: "lesson2", indices: questions.map((_, i) => i).slice(10, 20) },
  ];

  return (
    <nav aria-label="Question navigation" className="space-y-5">
      {groups.map((g) => (
        <div key={g.lesson}>
          <div className="mb-2.5 flex items-center gap-2">
            <span
              className={cn(
                "h-2 w-2 rounded-full",
                g.lesson === "lesson1" ? "bg-cyan-400" : "bg-violet-400",
              )}
            />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {g.label}
            </span>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {g.indices.map((i) => {
              const answered = answeredFlags[i];
              const current = currentIndex === i;
              return (
                <button
                  key={questions[i].id}
                  type="button"
                  onClick={() => onJump(i)}
                  aria-current={current ? "true" : undefined}
                  aria-label={`Question ${i + 1}${answered ? " (answered)" : " (not answered)"}`}
                  className={cn(
                    "h-10 rounded-xl border font-display text-sm font-bold transition-all duration-150",
                    current &&
                      (g.lesson === "lesson1"
                        ? "ring-2 ring-cyan-300/80 ring-offset-2 ring-offset-ink-950"
                        : "ring-2 ring-violet-300/80 ring-offset-2 ring-offset-ink-950"),
                    answered
                      ? g.lesson === "lesson1"
                        ? "border-cyan-400/60 bg-cyan-400/15 text-cyan-200"
                        : "border-violet-400/60 bg-violet-400/15 text-violet-200"
                      : "border-slate-700/70 bg-slate-900/50 text-slate-500 hover:border-slate-500 hover:text-slate-300",
                  )}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
        </div>
      ))}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 border-t border-slate-800 pt-3 text-[11px] font-medium text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-[4px] border border-cyan-400/60 bg-cyan-400/15" />
          Answered
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-[4px] border border-slate-700 bg-slate-900/50" />
          Not answered
        </span>
      </div>
    </nav>
  );
}
