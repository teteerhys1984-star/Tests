import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { EXAM_ID } from "../config";
import {
  ATTEMPT_KEY,
  MUTE_KEY,
  NAME_KEY,
  loadAttempt,
  loadMuted,
  loadSavedName,
  newAttemptId,
  saveAttempt,
  saveMuted,
  saveName,
  type Attempt,
} from "../lib/storage";

function createMemoryStorage() {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    key(i: number) {
      return [...map.keys()][i] ?? null;
    },
    getItem(k: string) {
      return map.has(k) ? map.get(k)! : null;
    },
    setItem(k: string, v: string) {
      map.set(k, String(v));
    },
    removeItem(k: string) {
      map.delete(k);
    },
    clear() {
      map.clear();
    },
  };
}

describe("storage and session restore", () => {
  const g = globalThis as unknown as { window?: { localStorage: ReturnType<typeof createMemoryStorage> } };
  let originalWindow: typeof g.window;

  beforeEach(() => {
    originalWindow = g.window;
    g.window = { localStorage: createMemoryStorage() };
  });

  afterEach(() => {
    g.window = originalWindow;
  });

  it("uses exam-scoped independent localStorage keys", () => {
    expect(EXAM_ID).toBe("grade-5-english-lesson-1-curriculum");
    expect(ATTEMPT_KEY).toBe("grade-5-english-lesson-1-curriculum:attempt:v1");
    expect(NAME_KEY).toBe("grade-5-english-lesson-1-curriculum:studentName:v1");
    expect(MUTE_KEY).toBe("grade-5-english-lesson-1-curriculum:muted:v1");
  });

  it("saves and restores an in-progress attempt across reloads", () => {
    const attempt: Attempt = {
      attemptId: newAttemptId(),
      studentName: "ليلى أحمد",
      status: "in-progress",
      startedAt: 1_760_000_000_000,
      currentQuestion: 5,
      answers: {
        "Q1.1": "classroom",
        "Q5.5": ["nursery", "basic / primary school", "secondary school"],
      },
    };
    saveAttempt(attempt);
    const restored = loadAttempt();
    expect(restored).toEqual(attempt);
  });

  it("saves and restores a submitted attempt with timestamp", () => {
    const attempt: Attempt = {
      attemptId: "attempt-123",
      studentName: "Sami",
      status: "submitted",
      startedAt: 1_760_000_000_000,
      submittedAt: 1_760_000_120_000,
      currentQuestion: 8,
      answers: { "Q1.1": "classroom" },
    };
    saveAttempt(attempt);
    expect(loadAttempt()).toEqual(attempt);
    saveAttempt(null);
    expect(loadAttempt()).toBeNull();
  });

  it("assigns an attemptId if an older stored record lacks one and ignores corrupted JSON", () => {
    g.window!.localStorage.setItem(
      ATTEMPT_KEY,
      JSON.stringify({
        studentName: "Nour",
        status: "in-progress",
        startedAt: 1000,
        currentQuestion: 2,
        answers: { "Q1.1": "classroom" },
      }),
    );
    const restored = loadAttempt();
    expect(restored).not.toBeNull();
    expect(restored!.attemptId.length).toBeGreaterThan(8);
    expect(restored!.answers["Q1.1"]).toBe("classroom");

    g.window!.localStorage.setItem(ATTEMPT_KEY, "{bad json");
    expect(loadAttempt()).toBeNull();
  });

  it("persists draft name and mute preference independently", () => {
    saveName("Hala");
    saveMuted(true);
    expect(loadSavedName()).toBe("Hala");
    expect(loadMuted()).toBe(true);
    saveName(null);
    saveMuted(false);
    expect(loadSavedName()).toBe("");
    expect(loadMuted()).toBe(false);
  });
});
