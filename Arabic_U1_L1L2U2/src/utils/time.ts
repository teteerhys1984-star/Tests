export function formatHMS(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':');
}

export function formatDateTimeAr(ts: number): string {
  return new Date(ts).toLocaleString('ar-SY', { dateStyle: 'full', timeStyle: 'medium' });
}
