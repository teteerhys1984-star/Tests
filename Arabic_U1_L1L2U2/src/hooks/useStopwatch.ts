import { useEffect, useState } from 'react';

/** Count-up stopwatch derived purely from the persisted start timestamp. */
export function useStopwatch(startedAt: number | null, stoppedAt: number | null): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!startedAt || stoppedAt) return;
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [startedAt, stoppedAt]);
  if (!startedAt) return 0;
  return Math.max(0, (stoppedAt ?? now) - startedAt);
}
