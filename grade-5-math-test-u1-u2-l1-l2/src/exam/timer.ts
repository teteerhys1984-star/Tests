/** Timestamp-based stopwatch helpers (accurate across navigation and refresh). */

export function elapsedMs(startedAt: number | null, now: number = Date.now(), endedAt: number | null = null): number {
  if (!startedAt) return 0
  const end = endedAt ?? now
  return Math.max(0, end - startedAt)
}

export function formatHMS(ms: number): string {
  const total = Math.floor(ms / 1000)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const p = (n: number) => String(n).padStart(2, '0')
  return `${p(h)}:${p(m)}:${p(s)}`
}
