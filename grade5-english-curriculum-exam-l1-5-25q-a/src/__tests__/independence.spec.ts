/**
 * Runtime & storage isolation between `grade5-english-curriculum-exam-l1-5-25q-a`
 * and all previous versions (`grade5-english-curriculum-exam-l1-5-a`, `-b`,
 * `grade5-math-unit1`, `grade3-*`, `grade4-*`).
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { EXAM_ID, EXAM_TITLE, SHEETS_TOKEN, SHEETS_URL } from "@/config";
import { MUTE_KEY, STORAGE_KEY, loadAttempt, saveAttempt, type Attempt } from "@/lib/attempt";
import { PENDING_PREFIX, RECEIPT_PREFIX, hasReceipt, isPending, retryPending } from "@/lib/submit";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PROJECT = path.resolve(HERE, "..", "..");
const REPO_ROOT = path.resolve(PROJECT, "..");

const OTHER_EXAMS = [
  "grade5-english-curriculum-exam-l1-5-a",
  "grade5-english-curriculum-exam-l1-5-b",
  "grade5-math-unit1",
  "grade3-english-curriculum-exam-l1-5-a",
  "grade3-english-curriculum-exam-l1-5-b",
  "grade4-english-curriculum-exam-l1-5-a",
  "grade4-english-curriculum-exam-l1-5-b",
];

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

const runtimeFiles = walk(path.join(PROJECT, "src")).filter(
  (f) => /\.(ts|tsx|css)$/.test(f) && !f.includes(`${path.sep}__tests__${path.sep}`),
);

describe("Published identity & isolation", () => {
  it("uses its own EXAM_ID and title distinct from L1-5 A and L1-5 B", () => {
    expect(EXAM_ID).toBe("grade5-english-curriculum-exam-l1-5-25q-a");
    expect(EXAM_TITLE).toBe("Grade 5 English Curriculum Exam L1-5 (25Q) A");
    expect(EXAM_ID).not.toBe("grade5-english-curriculum-exam-l1-5-a");
    expect(EXAM_ID).not.toBe("grade5-english-curriculum-exam-l1-5-b");
  });

  it("keeps the reference Google Apps Script endpoint and token untouched", () => {
    expect(SHEETS_TOKEN).toBe("7U25pymFzsSqmt8ejzPOTPTFJmSvj9Rm");
    expect(SHEETS_URL).toBe(
      "https://script.google.com/macros/s/AKfycbwqv4hE1AFy73L7MhyhFwXx0nl4QF5-Nme5jvP-ank-BY_LQr91xA8A_IiQqMuTdh8B/exec",
    );
  });
});

describe("localStorage isolation", () => {
  function installStorage(initial: Record<string, string> = {}) {
    const map = new Map<string, string>(Object.entries(initial));
    const g = globalThis as unknown as { localStorage?: unknown };
    const previous = g.localStorage;
    g.localStorage = {
      get length() {
        return map.size;
      },
      key: (i: number) => Array.from(map.keys())[i] ?? null,
      getItem: (k: string) => map.get(k) ?? null,
      setItem: (k: string, v: string) => void map.set(k, v),
      removeItem: (k: string) => void map.delete(k),
    };
    return { map, restore: () => (g.localStorage = previous) };
  }

  it("reads and writes only its own storage keys and ignores A and B attempts", () => {
    const aKey = "grade5-english-curriculum-exam-l1-5-a-attempt-v1";
    const bKey = "grade5-english-curriculum-exam-l1-5-b-attempt-v1";
    const aVal = JSON.stringify({ name: "Pupil A", startedAt: 1, answers: {} });
    const bVal = JSON.stringify({ name: "Pupil B", startTs: 2, answers: {} });

    const { map, restore } = installStorage({ [aKey]: aVal, [bKey]: bVal });
    try {
      expect(loadAttempt()).toBeNull();

      const mine: Attempt = {
        v: 1,
        attemptId: "25q-attempt",
        name: "Pupil 25Q",
        startedAt: 1_770_000_000_000,
        answers: { "q01/q01a": "library" },
        currentIndex: 2,
        submittedAt: null,
      };
      saveAttempt(mine);
      expect(map.get(STORAGE_KEY)).toBeTruthy();
      expect(loadAttempt()).toEqual(mine);
      expect(map.get(aKey)).toBe(aVal);
      expect(map.get(bKey)).toBe(bVal);
    } finally {
      restore();
    }
  });

  it("never flushes or marks receipts belonging to L1-5 A or L1-5 B", async () => {
    const aPending = "pending:grade5-english-curriculum-exam-l1-5-a:a1";
    const bPending = "pending:grade5-english-curriculum-exam-l1-5-b:b1";
    const aSent = "sent:grade5-english-curriculum-exam-l1-5-a:a1";
    const entries = new Map<string, string>([
      [aPending, JSON.stringify({ attemptId: "a1", examId: "grade5-english-curriculum-exam-l1-5-a" })],
      [bPending, JSON.stringify({ attemptId: "b1", examId: "grade5-english-curriculum-exam-l1-5-b" })],
      [aSent, "2026-05-12T09:00:00.000Z"],
    ]);

    const calls: string[] = [];
    const storage = {
      get length() {
        return entries.size;
      },
      key: (i: number) => Array.from(entries.keys())[i] ?? null,
      getItem: (k: string) => entries.get(k) ?? null,
      setItem: (k: string, v: string) => void entries.set(k, v),
      removeItem: (k: string) => {
        calls.push(`remove:${k}`);
        entries.delete(k);
      },
    };

    const sent = await retryPending({
      storage: storage as never,
      fetchImpl: async () => {
        calls.push("fetch");
        return { text: async () => '{"ok":true}' };
      },
      sleep: async () => {},
    });

    expect(sent).toBe(0);
    expect(calls).toEqual([]);
    expect(isPending("a1", { storage: storage as never })).toBe(false);
    expect(hasReceipt("a1", { storage: storage as never })).toBe(false);
    expect(PENDING_PREFIX).toBe("pending:grade5-english-curriculum-exam-l1-5-25q-a:");
    expect(RECEIPT_PREFIX).toBe("sent:grade5-english-curriculum-exam-l1-5-25q-a:");
  });

  it("shares zero storage keys with any other exam folder in the repo", () => {
    for (const folder of OTHER_EXAMS) {
      const src = path.join(REPO_ROOT, folder, "src");
      const files = walk(src).filter((f) => /\.(ts|tsx)$/.test(f));
      for (const file of files) {
        const text = readFileSync(file, "utf8");
        expect(text, file).not.toContain(STORAGE_KEY);
        expect(text, file).not.toContain(MUTE_KEY);
        expect(text, file).not.toContain(PENDING_PREFIX);
        expect(text, file).not.toContain(RECEIPT_PREFIX);
      }
    }
  });
});

describe("No runtime coupling with previous versions", () => {
  it("contains zero imports or references to L1-5 A, L1-5 B, or other exams in runtime source", () => {
    for (const file of runtimeFiles) {
      const text = readFileSync(file, "utf8");
      expect(text, file).not.toMatch(/grade5-english-curriculum-exam-l1-5-[ab]/);
      expect(text, file).not.toMatch(/grade-5-english-curriculum-exam-L1-5-[AB]/);
      expect(text, file).not.toMatch(/grade-5-english-curriculum-exam-L1-5 \(25Q\) A/);
      expect(text, file).not.toContain("Grade 5 English Curriculum Exam L1-5 A");
      expect(text, file).not.toContain("Grade 5 English Curriculum Exam L1-5 B");
    }
  });
});
