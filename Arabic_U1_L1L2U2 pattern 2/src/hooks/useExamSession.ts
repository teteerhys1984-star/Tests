import { useCallback, useEffect, useState } from "react";
import type { Attempt } from "../types/exam";
import { ALL_SUBPARTS, QUESTIONS } from "../data/questions";

const ATTEMPT_STORAGE_KEY = "zahrat-almarifa:grade5-arabic-attempt:v1";

function newAttemptId(): string {
  try {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  } catch {
    /* fall through to timestamp id */
  }
  return `attempt-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function isValidAttempt(value: unknown): value is Attempt {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<Attempt>;
  if (candidate.version !== 1) return false;
  if (typeof candidate.id !== "string" || !candidate.id) return false;
  if (typeof candidate.studentName !== "string" || !candidate.studentName.trim()) return false;
  if (typeof candidate.startedAt !== "number" || !Number.isFinite(candidate.startedAt)) return false;
  if (candidate.submittedAt !== null && typeof candidate.submittedAt !== "number") return false;
  if (typeof candidate.current !== "number" || !Number.isFinite(candidate.current)) return false;
  if (!candidate.answers || typeof candidate.answers !== "object") return false;
  const record = candidate.answers as Record<string, unknown>;
  for (const key of Object.keys(record)) {
    if (!Array.isArray(record[key])) return false;
    if (!(record[key] as unknown[]).every((item) => typeof item === "string")) return false;
  }
  return true;
}

/** Restore an active attempt exactly as it was, never silently starting a new one. */
export function loadStoredAttempt(): Attempt | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(ATTEMPT_STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isValidAttempt(parsed)) {
      window.localStorage.removeItem(ATTEMPT_STORAGE_KEY);
      return null;
    }
    const validIds = new Set(ALL_SUBPARTS.map((subpart) => subpart.id));
    const answers: Record<string, string[]> = {};
    for (const [key, val] of Object.entries(parsed.answers)) {
      if (validIds.has(key) && Array.isArray(val)) answers[key] = val.filter((v) => typeof v === "string");
    }
    const current = Math.min(Math.max(0, Math.floor(parsed.current)), QUESTIONS.length - 1);
    return { ...parsed, answers, current };
  } catch {
    return null;
  }
}

export function useExamSession() {
  const [attempt, setAttempt] = useState<Attempt | null>(() => loadStoredAttempt());

  useEffect(() => {
    try {
      if (attempt) {
        window.localStorage.setItem(ATTEMPT_STORAGE_KEY, JSON.stringify(attempt));
      } else {
        window.localStorage.removeItem(ATTEMPT_STORAGE_KEY);
      }
    } catch {
      // Storage can be unavailable (private mode / quota). The session still works in memory.
    }
  }, [attempt]);

  const startAttempt = useCallback((studentName: string) => {
    const next: Attempt = {
      version: 1,
      id: newAttemptId(),
      studentName: studentName.trim(),
      startedAt: Date.now(),
      submittedAt: null,
      answers: {},
      current: 0,
    };
    setAttempt(next);
    return next;
  }, []);

  const setAnswer = useCallback((subpartId: string, values: string[]) => {
    setAttempt((current) => {
      if (!current || current.submittedAt) return current;
      return { ...current, answers: { ...current.answers, [subpartId]: values } };
    });
  }, []);

  const goToQuestion = useCallback((index: number) => {
    setAttempt((current) => {
      if (!current || current.submittedAt) return current;
      const safeIndex = Math.min(Math.max(0, index), QUESTIONS.length - 1);
      if (safeIndex === current.current) return current;
      return { ...current, current: safeIndex };
    });
  }, []);

  /** Submit immediately: no confirmation step, ever. Returns the frozen attempt. */
  const submitExam = useCallback((): Attempt | null => {
    if (!attempt || attempt.submittedAt) return attempt;
    const submitted: Attempt = { ...attempt, submittedAt: Date.now() };
    setAttempt(submitted);
    return submitted;
  }, [attempt]);

  /** Only call after submission; a new attempt starts from an empty state. */
  const clearAttempt = useCallback(() => {
    setAttempt(null);
  }, []);

  return { attempt, startAttempt, setAnswer, goToQuestion, submitExam, clearAttempt };
}
