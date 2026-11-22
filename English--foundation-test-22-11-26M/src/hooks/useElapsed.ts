import { useEffect, useState } from "react";

/**
 * Timestamp-based stopwatch. Elapsed time is always computed from the real clock
 * (`Date.now() - startedAt`), so navigation, backgrounding or a page refresh never
 * drift. The interval only triggers re-rendering.
 */
export function useElapsed(startedAt: number, endedAt: number | null): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (endedAt !== null) return;
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(id);
  }, [endedAt]);

  const end = endedAt ?? now;
  return Math.max(0, end - startedAt);
}
