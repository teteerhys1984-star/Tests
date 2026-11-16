import { Landmark, Route } from "lucide-react";
import type { Question } from "@/exam/types";

interface Props {
  questions: Question[];
  current: number; // 0-based index
  isComplete: (q: Question) => boolean;
  onJump: (index: number) => void;
}

export function QuestionPalette({ questions, current, isComplete, onJump }: Props) {
  const groups = [
    { label: "Lesson 3 · Let's Discover", icon: <Route className="h-3.5 w-3.5" />, from: 0, to: 10, accent: "text-[#5ec4b8]" },
    { label: "Lesson 4 · Interesting Destinations", icon: <Landmark className="h-3.5 w-3.5" />, from: 10, to: 20, accent: "text-[#e0a05a]" },
  ];

  return (
    <nav className="flex flex-col gap-4" aria-label="Question map">
      {groups.map((g) => (
        <div key={g.label} className="rounded-2xl border border-[#2c4166] bg-[#101f38]/85 p-3.5">
          <p className={`mb-2.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] ${g.accent}`}>
            {g.icon} {g.label}
          </p>
          <div className="grid grid-cols-5 gap-1.5">
            {questions.slice(g.from, g.to).map((q) => {
              const idx = q.n - 1;
              const done = isComplete(q);
              const active = idx === current;
              return (
                <button
                  key={q.n}
                  onClick={() => onJump(idx)}
                  aria-label={`Question ${q.n}${done ? " (answered)" : ""}`}
                  className={`relative flex h-9 items-center justify-center rounded-lg text-[13px] font-semibold transition-all ${
                    active
                      ? "bg-[#c99b3c] text-[#0e1c33] ring-2 ring-[#e6c877]/60"
                      : done
                        ? "bg-[#0f766e]/25 text-[#7fd6c9] hover:bg-[#0f766e]/40"
                        : "bg-[#1a2c4d] text-[#8fa1bc] hover:bg-[#233a63] hover:text-[#c4d1e6]"
                  }`}
                >
                  {q.n}
                  {done && !active && (
                    <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-[#34d399]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}
      <div className="rounded-2xl border border-[#2c4166] bg-[#101f38]/85 p-3.5 text-[11px] leading-relaxed text-[#8fa1bc]">
        <p className="mb-1 flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-sm bg-[#0f766e]" /> Answered &amp; saved
        </p>
        <p className="mb-1 flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-sm bg-[#1a2c4d]" /> Not answered yet
        </p>
        <p className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-sm bg-[#c99b3c]" /> Current question
        </p>
      </div>
    </nav>
  );
}
