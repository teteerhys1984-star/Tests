/**
 * Formats a non-negative number of seconds as HH:MM:SS.
 */
export function formatDurationHHMMSS(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(Number.isFinite(totalSeconds) ? totalSeconds : 0));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;

  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

/**
 * Computes current elapsed whole seconds from the original start timestamp,
 * falling back to previously recorded elapsedSeconds if the system clock moved backward.
 */
export function computeElapsedSeconds(
  startTimestamp: number | null,
  fallbackElapsedSeconds: number,
  nowMs: number = Date.now()
): number {
  if (startTimestamp === null || !Number.isFinite(startTimestamp)) {
    return Math.max(0, Math.floor(fallbackElapsedSeconds || 0));
  }
  const fromStart = Math.floor((nowMs - startTimestamp) / 1000);
  return Math.max(0, Math.floor(fallbackElapsedSeconds || 0), fromStart);
}
