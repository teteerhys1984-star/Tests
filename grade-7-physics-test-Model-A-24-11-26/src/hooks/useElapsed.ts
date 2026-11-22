import { useEffect, useState } from 'react';

/** زمن منقضٍ بالثواني اعتماداً على timestamps (يصمد أمام التحديث والتنقل) */
export function useElapsed(startedAt: number | null | undefined, finishedAt: number | null | undefined): number {
  const [now, setNow] = useState(() => Date.now());
  const live = !!startedAt && !finishedAt;

  useEffect(() => {
    if (!live) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, [live, startedAt]);

  if (!startedAt) return 0;
  return Math.max(0, Math.floor(((finishedAt ?? now) - startedAt) / 1000));
}
