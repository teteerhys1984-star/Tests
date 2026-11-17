// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { EXAM_ID } from "@/config";
import {
  ATTEMPT_KEY,
  MUTE_KEY,
  PREV_REPORT_KEY,
  REPORT_KEY,
  archiveCurrentReport,
  clearAttempt,
  clearReport,
  loadAttempt,
  loadMuted,
  loadPreviousReport,
  loadReport,
  newAttempt,
  saveAttempt,
  saveMuted,
  saveReport,
} from "@/lib/storage";
import { buildExamReport } from "@/lib/report";
import { gradeAttempt } from "@/lib/grade";
import { QUESTIONS } from "@/data/exam";
import { PENDING_PREFIX, pendingKey } from "@/lib/submit";
import { completeAttempt } from "./helpers";

beforeEach(() => {
  window.localStorage.clear();
});

describe("Storage namespacing", () => {
  it("uses keys derived from this exam's EXAM_ID only", () => {
    expect(EXAM_ID).toBe("grade-8-science-test-model-a");
    expect(ATTEMPT_KEY).toBe("grade-8-science-test-model-a-attempt-v1");
    expect(REPORT_KEY).toBe("grade-8-science-test-model-a-report-v1");
    expect(PREV_REPORT_KEY).toBe("grade-8-science-test-model-a-previous-report-v1");
    expect(MUTE_KEY).toBe("grade-8-science-test-model-a-muted-v1");
    expect(PENDING_PREFIX).toBe("pending:grade-8-science-test-model-a:");
    expect(pendingKey("abc")).toBe("pending:grade-8-science-test-model-a:abc");
  });

  it("does not reuse the legacy shared key of the source prototype", () => {
    const a = newAttempt("طالب", "attempt-1");
    saveAttempt(a);
    expect(window.localStorage.getItem("g8-exam-model-a-v1")).toBeNull();
    expect(window.localStorage.getItem(ATTEMPT_KEY)).toBeTruthy();
  });

  it("saves and restores an in-progress attempt with its index and answers", () => {
    const a = newAttempt("سارة أحمد", "attempt-2");
    a.idx = 7;
    a.answers = { "p1-mag": "60" };
    saveAttempt(a);
    const loaded = loadAttempt();
    expect(loaded).toMatchObject({
      attemptId: "attempt-2",
      name: "سارة أحمد",
      idx: 7,
      answers: { "p1-mag": "60" },
    });
    expect(loaded?.startedAt).toBe(a.startedAt);
  });

  it("rejects corrupted attempt records instead of crashing", () => {
    window.localStorage.setItem(ATTEMPT_KEY, "not json");
    expect(loadAttempt()).toBeNull();
    window.localStorage.setItem(ATTEMPT_KEY, JSON.stringify({ name: "x" }));
    expect(loadAttempt()).toBeNull();
  });

  it("clears only this exam's attempt", () => {
    saveAttempt(newAttempt("طالب", "attempt-3"));
    window.localStorage.setItem("interactive-grade-8-english-exam-l1-3-b-attempt-v1", "other");
    clearAttempt();
    expect(window.localStorage.getItem(ATTEMPT_KEY)).toBeNull();
    expect(window.localStorage.getItem("interactive-grade-8-english-exam-l1-3-b-attempt-v1")).toBe(
      "other",
    );
  });

  it("stores, archives and clears the submitted report", () => {
    const attempt = completeAttempt({ submittedAt: 1_700_003_600_000 });
    const report = buildExamReport(attempt, gradeAttempt(QUESTIONS, attempt.answers));
    saveReport(report);
    expect(loadReport()?.name).toBe(attempt.name);
    archiveCurrentReport();
    expect(loadPreviousReport()?.name).toBe(attempt.name);
    clearReport();
    expect(loadReport()).toBeNull();
    expect(loadPreviousReport()).not.toBeNull();
  });

  it("stores the mute preference under its own key", () => {
    expect(loadMuted()).toBe(false);
    saveMuted(true);
    expect(loadMuted()).toBe(true);
    expect(window.localStorage.getItem(MUTE_KEY)).toBe("1");
    saveMuted(false);
    expect(loadMuted()).toBe(false);
  });

  it("keeps every key written by this exam inside its namespace", () => {
    const attempt = completeAttempt({ submittedAt: 1_700_003_600_000 });
    saveAttempt(attempt);
    saveReport(buildExamReport(attempt, gradeAttempt(QUESTIONS, attempt.answers)));
    archiveCurrentReport();
    saveMuted(true);
    window.localStorage.setItem(pendingKey(attempt.attemptId), "{}");
    const keys = Object.keys(window.localStorage);
    expect(keys.length).toBeGreaterThan(4);
    for (const key of keys) {
      const owned = key.startsWith(EXAM_ID) || key.startsWith(PENDING_PREFIX);
      expect(owned, `unexpected shared key: ${key}`).toBe(true);
    }
  });
});
