import { Compass, ListChecks, Volume2, VolumeX } from "lucide-react";
import { formatHMS } from "@/lib/time";

interface Props {
  elapsedMs: number;
  answered: number;
  total: number;
  muted: boolean;
  onToggleMute: () => void;
  recovered: boolean;
}

export function ExamHeader({ elapsedMs, answered, total, muted, onToggleMute, recovered }: Props) {
  return (
    <header className="sticky top-0 z-40 border-b border-[#2c4166]/70 bg-[#0d1d33]/92 shadow-[0_10px_30px_-15px_rgba(0,0,0,0.7)] backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#c99b3c]/40 bg-[#132641]">
          <Compass className="h-5 w-5 text-[#c99b3c]" />
        </div>
        <div className="min-w-0">
          <p className="truncate font-display text-sm font-semibold text-[#f4eedd] sm:text-base">
            World Explorer English Exam
          </p>
          <p className="truncate text-[11px] tracking-wide text-[#8fa1bc]">
            Grade 8 · Unit 1 · Lessons 3 &amp; 4
          </p>
        </div>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          {recovered && (
            <span className="hidden rounded-lg border border-[#c99b3c]/30 bg-[#c99b3c]/10 px-2.5 py-1 text-[11px] font-medium text-[#e6c877] md:inline">
              Attempt restored — timer kept running
            </span>
          )}
          <span className="hidden items-center gap-1.5 rounded-lg border border-[#2c4166] bg-[#132641] px-3 py-1.5 text-xs font-semibold text-[#b9c6da] sm:flex">
            <ListChecks className="h-3.5 w-3.5 text-[#c99b3c]" />
            {answered}/{total} answered
          </span>
          <span
            className="timer-nums flex items-center gap-2 rounded-lg border border-[#c99b3c]/40 bg-[#132641] px-3 py-1.5 text-sm font-semibold text-[#e6c877]"
            aria-label="Elapsed time"
            title="Elapsed time (HH:MM:SS)"
          >
            {formatHMS(elapsedMs)}
          </span>
          <button
            onClick={onToggleMute}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#2c4166] bg-[#132641] text-[#b9c6da] transition-colors hover:border-[#c99b3c]/50 hover:text-[#e6c877]"
            aria-label={muted ? "Unmute sounds" : "Mute sounds"}
            title={muted ? "Unmute sounds" : "Mute sounds"}
          >
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
        </div>
      </div>
      {/* progress hairline */}
      <div className="h-[3px] w-full bg-[#132641]">
        <div
          className="h-full bg-gradient-to-r from-[#0f766e] via-[#c99b3c] to-[#b45309] transition-all duration-500"
          style={{ width: `${(answered / total) * 100}%` }}
        />
      </div>
    </header>
  );
}
