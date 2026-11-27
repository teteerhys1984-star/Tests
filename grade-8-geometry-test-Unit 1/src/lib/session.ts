import { useCallback, useEffect, useRef, useState } from "react";
import type { Answers } from "../exam/types";

export const STORAGE_KEY = "g8-geometry-unit1-exam/v1";

export type ExamStatus = "idle" | "running" | "submitted";

export interface SessionState {
  version: 1;
  name: string;
  answers: Answers;
  startedAt: number | null;
  submittedAt: number | null;
  status: ExamStatus;
  current: number;
  muted: boolean;
}

export const emptySession = (): SessionState => ({
  version: 1,
  name: "",
  answers: {},
  startedAt: null,
  submittedAt: null,
  status: "idle",
  current: 0,
  muted: false,
});

export function loadSession(): SessionState {
  if (typeof window === "undefined") return emptySession();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptySession();
    const parsed = JSON.parse(raw) as Partial<SessionState>;
    if (!parsed || parsed.version !== 1) return emptySession();
    return {
      ...emptySession(),
      ...parsed,
      answers: (parsed.answers ?? {}) as Answers,
    };
  } catch {
    return emptySession();
  }
}

export function saveSession(s: SessionState) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    /* storage full or blocked — the exam keeps running in memory */
  }
}

export function clearSession() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/* ── stopwatch driven by real timestamps, never by tick counting ── */

export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

/**
 * Count-up stopwatch. The elapsed value is always recomputed from
 * `Date.now() - startedAt`, so it survives refreshes, background tabs and
 * throttled intervals without drifting.
 */
export function useStopwatch(startedAt: number | null, frozenAt: number | null) {
  const compute = useCallback(() => {
    if (!startedAt) return 0;
    return (frozenAt ?? Date.now()) - startedAt;
  }, [startedAt, frozenAt]);

  const [elapsed, setElapsed] = useState(compute);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    setElapsed(compute());
    if (!startedAt || frozenAt) return;
    let last = -1;
    const loop = () => {
      const v = Date.now() - startedAt;
      const sec = Math.floor(v / 1000);
      if (sec !== last) {
        last = sec;
        setElapsed(v);
      }
      raf.current = window.requestAnimationFrame(loop);
    };
    raf.current = window.requestAnimationFrame(loop);
    return () => {
      if (raf.current !== null) window.cancelAnimationFrame(raf.current);
    };
  }, [startedAt, frozenAt, compute]);

  return elapsed;
}