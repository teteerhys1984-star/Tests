import { useEffect, useState, type ReactNode } from "react";
import { EXAM } from "../data/lessons";
import { formatHMS } from "../lib/format";
import { LeafLogo, SpeakerOffIcon, SpeakerOnIcon } from "./Icons";

export function MuteButton({ muted, onToggle }: { muted: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={muted}
      aria-label={muted ? "Sound is off. Turn sound on" : "Sound is on. Turn sound off"}
      className="inline-flex h-10 items-center gap-2 rounded-full border border-green-200 bg-white px-3 text-sm font-bold text-green-800 shadow-sm transition hover:bg-green-50"
    >
      {muted ? <SpeakerOffIcon className="h-5 w-5" /> : <SpeakerOnIcon className="h-5 w-5" />}
      <span className="hidden sm:inline">{muted ? "Sound off" : "Sound on"}</span>
    </button>
  );
}

export function Brand() {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <LeafLogo className="h-10 w-10 shrink-0" />
      <div className="min-w-0 leading-tight">
        <p className="truncate text-base font-extrabold text-green-950 sm:text-lg">{EXAM.title}</p>
        <p className="truncate text-xs font-semibold text-green-700 sm:text-sm">{EXAM.subtitle}</p>
      </div>
    </div>
  );
}

export function TopBar({ children }: { children?: ReactNode }) {
  return (
    <header className="no-print">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-4">
        <Brand />
        <div className="ml-auto flex items-center gap-2">{children}</div>
      </div>
    </header>
  );
}

/** Counts upward from the saved start timestamp, so refreshes never reset it. */
export function Stopwatch({ startedAt }: { startedAt: number }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(timer);
  }, []);
  return <span className="tabular-nums">{formatHMS(now - startedAt)}</span>;
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-3xl border border-green-100 bg-white/95 p-5 shadow-[0_18px_40px_-26px_rgba(21,128,61,0.45)] sm:p-7 ${className}`}>
      {children}
    </section>
  );
}
