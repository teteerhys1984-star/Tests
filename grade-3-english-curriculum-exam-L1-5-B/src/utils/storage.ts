import { EXAM_TOTAL_QUESTIONS } from "../data/lessons";
import { ExamSessionState } from "../types/exam";
import { computeElapsedSeconds } from "./timer";

export const STORAGE_KEY = "grade3_unit1_lessons1to5_exam_session_v1";

export function createInitialSession(muted = false): ExamSessionState {
  return {
    version: 1,
    phase: "welcome",
    studentName: "",
    currentQuestionIndex: 0,
    answers: {},
    startTimestamp: null,
    elapsedSeconds: 0,
    lastTickTimestamp: null,
    submittedAt: null,
    muted,
  };
}

export function loadSession(
  storage: Pick<Storage, "getItem"> | null = typeof window !== "undefined"
    ? window.localStorage
    : null,
  nowMs: number = Date.now()
): ExamSessionState {
  if (!storage) {
    return createInitialSession();
  }

  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) {
      return createInitialSession();
    }
    const parsed = JSON.parse(raw) as Partial<ExamSessionState>;
    if (!parsed || typeof parsed !== "object" || parsed.version !== 1) {
      return createInitialSession();
    }

    const phase =
      parsed.phase === "in_progress" || parsed.phase === "submitted"
        ? parsed.phase
        : "welcome";

    const studentName =
      typeof parsed.studentName === "string" ? parsed.studentName : "";

    // An active or submitted exam must always have a valid student name
    if ((phase === "in_progress" || phase === "submitted") && !studentName.trim()) {
      return createInitialSession(Boolean(parsed.muted));
    }

    const rawIndex =
      typeof parsed.currentQuestionIndex === "number" &&
      Number.isInteger(parsed.currentQuestionIndex)
        ? parsed.currentQuestionIndex
        : 0;
    const currentQuestionIndex = Math.min(
      Math.max(0, rawIndex),
      EXAM_TOTAL_QUESTIONS - 1
    );

    const answers =
      parsed.answers &&
      typeof parsed.answers === "object" &&
      !Array.isArray(parsed.answers)
        ? parsed.answers
        : {};

    const startTimestamp =
      typeof parsed.startTimestamp === "number" &&
      Number.isFinite(parsed.startTimestamp)
        ? parsed.startTimestamp
        : null;

    const savedElapsed =
      typeof parsed.elapsedSeconds === "number" &&
      Number.isFinite(parsed.elapsedSeconds)
        ? Math.max(0, Math.floor(parsed.elapsedSeconds))
        : 0;

    // Preserve timer continuity across refreshes using the saved startTimestamp
    const elapsedSeconds =
      phase === "in_progress"
        ? computeElapsedSeconds(startTimestamp, savedElapsed, nowMs)
        : phase === "submitted"
        ? savedElapsed
        : 0;

    const lastTickTimestamp =
      phase === "in_progress"
        ? nowMs
        : typeof parsed.lastTickTimestamp === "number"
        ? parsed.lastTickTimestamp
        : null;

    const submittedAt =
      phase === "submitted" && typeof parsed.submittedAt === "string"
        ? parsed.submittedAt
        : null;

    return {
      version: 1,
      phase,
      studentName,
      currentQuestionIndex,
      answers,
      startTimestamp:
        phase === "in_progress" && startTimestamp === null
          ? nowMs - elapsedSeconds * 1000
          : startTimestamp,
      elapsedSeconds,
      lastTickTimestamp,
      submittedAt,
      muted: Boolean(parsed.muted),
    };
  } catch {
    return createInitialSession();
  }
}

export function saveSession(
  state: ExamSessionState,
  storage: Pick<Storage, "setItem"> | null = typeof window !== "undefined"
    ? window.localStorage
    : null
): void {
  if (!storage) return;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage quota or privacy-mode errors gracefully
  }
}

export function clearSessionForNewAttempt(
  muted: boolean,
  storage: Pick<Storage, "setItem"> | null = typeof window !== "undefined"
    ? window.localStorage
    : null
): ExamSessionState {
  const fresh = createInitialSession(muted);
  saveSession(fresh, storage);
  return fresh;
}
