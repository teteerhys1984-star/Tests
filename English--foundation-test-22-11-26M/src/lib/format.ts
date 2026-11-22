/** Formats milliseconds as HH:MM:SS using English numerals. */
export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

/** English-only date formatting, independent of the device language. */
export function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export function formatDateTime(ts: number): string {
  return `${formatDate(ts)} at ${formatTime(ts)}`;
}

export function subLetter(index: number): string {
  return String.fromCharCode(97 + index);
}
