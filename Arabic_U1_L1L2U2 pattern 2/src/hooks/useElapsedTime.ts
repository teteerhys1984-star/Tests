import { useEffect, useState } from "react";
import { formatStopwatch } from "../utils/arabic";

/**
 * Count-up stopwatch derived from the persisted start timestamp.
 * Timestamp-based calculation keeps it accurate across refreshes, tab sleeps
 * and navigation between questions.
 */
export function useElapsedTime(startedAt: number | null, submittedAt: number | null): {
  elapsedSeconds: number;
  display: string;
} {
  const calculate = () => {
    if (!startedAt) return 0;
    const end = submittedAt ?? Date.now();
    return Math.max(0, Math.floor((end - startedAt) / 1000));
  };

  const [elapsedSeconds, setElapsedSeconds] = useState<number>(calculate);

  useEffect(() => {
    setElapsedSeconds(calculate());
    if (!startedAt || submittedAt) return;
    const interval = window.setInterval(() => {
      setElapsedSeconds(calculate());
    }, 1000);
    return () => window.clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startedAt, submittedAt]);

  return { elapsedSeconds, display: formatStopwatch(elapsedSeconds) };
}
