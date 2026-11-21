import { useEffect, useState } from "react";
import { formatHMS } from "../utils/time";

interface Props {
  startedAt: number;
  className?: string;
}

/** Timestamp-based stopwatch: elapsed = now - startedAt, re-rendered every 500 ms. */
export function Timer({ startedAt, className = "" }: Props) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 500);
    const onVisible = () => setNow(Date.now());
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return (
    <div className={`inline-flex items-center gap-1.5 rounded-full bg-indigo-600 px-3 py-2 text-white shadow-md ring-2 ring-white ${className}`} role="timer" aria-live="off">
      <svg viewBox="0 0 24 24" className="h-4 w-4 text-yellow-300" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="13" r="8" />
        <path d="M12 9v4l2 2M9 2h6" />
      </svg>
      <span className="font-mono text-sm font-bold tabular-nums">{formatHMS(now - startedAt)}</span>
    </div>
  );
}
