import { ATTEMPT_STORAGE_KEY, EXAM_ID } from "../config";
import type { ExamAttempt } from "./types";

export function createAttemptId(): string {
  try {
    const c = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
    if (c && typeof c.randomUUID === "function") return c.randomUUID();
  } catch {
    /* fallback below */
  }
  const rand = () => Math.random().toString(36).slice(2, 10);
  return `${Date.now()}-${rand()}${rand()}`;
}

export function createFreshAttempt(studentName: string): ExamAttempt {
  return {
    version: 1,
    examId: EXAM_ID,
    attemptId: createAttemptId(),
    status: "in_progress",
    studentName: studentName.trim(),
    responses: {},
    currentIndex: 0,
    startedAt: new Date().toISOString(),
  };
}

export interface StorageBackend {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function getStorage(storage?: StorageBackend | null): StorageBackend | null {
  if (storage !== undefined) return storage;
  try {
    return typeof window !== "undefined" && window.localStorage ? window.localStorage : null;
  } catch {
    return null;
  }
}

export function loadAttempt(storage?: StorageBackend | null): ExamAttempt | null {
  const s = getStorage(storage);
  if (!s) return null;
  try {
    const raw = s.getItem(ATTEMPT_STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return null;
    const obj = parsed as Partial<ExamAttempt>;
    if (obj.version !== 1 || obj.examId !== EXAM_ID) return null;
    if (typeof obj.attemptId !== "string" || !obj.attemptId) return null;
    if (obj.status !== "in_progress" && obj.status !== "submitted") return null;
    if (typeof obj.studentName !== "string") return null;
    if (typeof obj.startedAt !== "string") return null;

    return {
      version: 1,
      examId: EXAM_ID,
      attemptId: obj.attemptId,
      status: obj.status,
      studentName: obj.studentName,
      responses:
        typeof obj.responses === "object" && obj.responses !== null && !Array.isArray(obj.responses)
          ? { ...(obj.responses as Record<string, string>) }
          : {},
      currentIndex:
        typeof obj.currentIndex === "number" && Number.isInteger(obj.currentIndex) && obj.currentIndex >= 0
          ? obj.currentIndex
          : 0,
      startedAt: obj.startedAt,
      submittedAt: typeof obj.submittedAt === "string" ? obj.submittedAt : undefined,
      elapsedMs: typeof obj.elapsedMs === "number" ? obj.elapsedMs : undefined,
    };
  } catch {
    return null;
  }
}

export function saveAttempt(attempt: ExamAttempt, storage?: StorageBackend | null): void {
  const s = getStorage(storage);
  if (!s) return;
  try {
    const safeAttempt: ExamAttempt = {
      ...attempt,
      version: 1,
      examId: EXAM_ID,
    };
    s.setItem(ATTEMPT_STORAGE_KEY, JSON.stringify(safeAttempt));
  } catch {
    /* ignore quota/security errors */
  }
}

export function clearAttempt(storage?: StorageBackend | null): void {
  const s = getStorage(storage);
  if (!s) return;
  try {
    s.removeItem(ATTEMPT_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
