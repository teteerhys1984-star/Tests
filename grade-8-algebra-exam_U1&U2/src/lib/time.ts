const pad = (n: number) => String(Math.max(0, Math.floor(n))).padStart(2, '0');

/** Always returns Western digits: HH:MM:SS. */
export function formatDuration(ms: number): string {
  const safe = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const s = safe % 60;
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

export function formatClock(ms: number): string {
  return formatDuration(ms);
}

/** Always returns Western digits, local time. */
export function formatTimestamp(ms: number | null): string {
  if (!ms) return '—';
  const d = new Date(ms);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export function formatTimestampWithZone(ms: number | null): string {
  if (!ms) return '—';
  const d = new Date(ms);
  const offset = -d.getTimezoneOffset();
  const sign = offset >= 0 ? '+' : '-';
  const hours = pad(Math.floor(Math.abs(offset) / 60));
  const minutes = pad(Math.abs(offset) % 60);
  return `${formatTimestamp(ms)} (UTC${sign}${hours}:${minutes})`;
}

export function timestampIso(ms: number | null): string {
  if (!ms) return '—';
  return new Date(ms).toISOString();
}
