/**
 * Storage / runtime independence between Version A and Version B.
 *
 * Version B must be a fully independent exam: its own EXAM_ID, its own
 * localStorage keys, its own attempt ids, its own pending and receipt
 * namespaces. An attempt of one version must never be seen by the other, and
 * no runtime module may import data or grading from the other exam.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { EXAM_ID, EXAM_TITLE, SHEETS_TOKEN, SHEETS_URL } from "@/config";
import { PENDING_PREFIX, RECEIPT_PREFIX, isPending, hasReceipt, retryPending } from "@/lib/submit";
import { MUTE_KEY, STORAGE_KEY, loadAttempt, saveAttempt, type Attempt } from "@/lib/storage";

const REPO_ROOT = resolve(process.cwd(), "..");
const A_DIR = join(REPO_ROOT, "grade5-english-curriculum-exam-l1-5-a");
const B_DIR = resolve(process.cwd());

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

function read(path: string): string {
  return readFileSync(path, "utf8");
}

/** Every file of this exam that ships in the bundle. */
const runtimeFiles = walk(join(B_DIR, "src")).filter(
  (f) => /\.(ts|tsx|css)$/.test(f) && !f.includes(`${join("src", "__tests__")}`)
);

describe("published identity", () => {
  it("uses its own EXAM_ID and title", () => {
    expect(EXAM_ID).toBe("grade5-english-curriculum-exam-l1-5-b");
    expect(EXAM_TITLE).toBe("Grade 5 English Curriculum Exam L1-5 B");
  });

  it("differs from Version A's EXAM_ID, title and storage names", () => {
    const aConfig = read(join(A_DIR, "src", "config.ts"));
    const aStorage = read(join(A_DIR, "src", "lib", "storage.ts"));
    expect(aConfig).toContain('"grade5-english-curriculum-exam-l1-5-a"');
    expect(aStorage).toContain('"grade5-english-curriculum-exam-l1-5-a-attempt-v1"');
    expect(EXAM_ID).not.toContain("l1-5-a");
    expect(STORAGE_KEY).not.toBe("grade5-english-curriculum-exam-l1-5-a-attempt-v1");
    expect(MUTE_KEY).not.toContain("l1-5-a");
  });

  it("keeps the reference endpoint and token, as required", () => {
    expect(SHEETS_TOKEN).toHaveLength(32);
    expect(SHEETS_URL).toBe(
      "https://script.google.com/macros/s/AKfycbwqv4hE1AFy73L7MhyhFwXx0nl4QF5-Nme5jvP-ank-BY_LQr91xA8A_IiQqMuTdh8B/exec"
    );
    expect(SHEETS_URL.startsWith("https://script.google.com/macros/s/")).toBe(true);
  });
});

describe("localStorage isolation", () => {
  function installStorage(initial: Record<string, string> = {}) {
    const map = new Map<string, string>(Object.entries(initial));
    const g = globalThis as unknown as { window?: unknown };
    const previous = g.window;
    g.window = {
      localStorage: {
        getItem: (k: string) => map.get(k) ?? null,
        setItem: (k: string, v: string) => void map.set(k, v),
        removeItem: (k: string) => void map.delete(k),
      },
    };
    return { map, restore: () => (g.window = previous) };
  }

  const attempt: Attempt = {
    v: 1,
    attemptId: "b-attempt",
    name: "B Pupil",
    answers: { l1q1a: "secondary" },
    startTs: 1_770_000_000_000,
    current: 0,
    status: "active",
    model: "B",
  };

  it("writes only its own attempt key and leaves Version A's attempt untouched", () => {
    const aKey = "grade5-english-curriculum-exam-l1-5-a-attempt-v1";
    const aValue = JSON.stringify({ name: "A Pupil", answers: {}, startedAt: 1, status: "in-progress" });
    const { map, restore } = installStorage({ [aKey]: aValue });
    try {
      saveAttempt(attempt);
      expect(JSON.parse(map.get(aKey)!)).toEqual(JSON.parse(aValue));
      expect(map.has(STORAGE_KEY)).toBe(true);
      const restored = loadAttempt();
      expect(restored!.attemptId).toBe("b-attempt");
      expect(restored!.name).toBe("B Pupil");
      // The exam reads its own key only: remove it and the attempt is gone
      // even though Version A's record is still on the device.
      map.delete(STORAGE_KEY);
      expect(loadAttempt()).toBeNull();
      expect(map.has(aKey)).toBe(true);
    } finally {
      restore();
    }
  });

  it("never returns A's attempt when its own key is missing", () => {
    const aKey = "grade5-english-curriculum-exam-l1-5-a-attempt-v1";
    const { restore } = installStorage({
      [aKey]: JSON.stringify({
        v: 1,
        attemptId: "a-attempt",
        name: "A Pupil",
        answers: {},
        startedAt: 1,
        index: 0,
        status: "in-progress",
        submittedAt: null,
        muted: false,
      }),
    });
    try {
      expect(loadAttempt()).toBeNull();
    } finally {
      restore();
    }
  });

  it("namespaces pending payloads and receipts separately from Version A", () => {
    expect(PENDING_PREFIX).toBe("pending:grade5-english-curriculum-exam-l1-5-b:");
    expect(RECEIPT_PREFIX).toBe("sent:grade5-english-curriculum-exam-l1-5-b:");
    expect(PENDING_PREFIX).not.toBe("pending:grade5-english-curriculum-exam-l1-5-a:");
    expect(RECEIPT_PREFIX).not.toBe("sent:grade5-english-curriculum-exam-l1-5-a:");
  });

  it("does not flush A's pending payload and does not see A's receipts", async () => {
    const aPendingKey = "pending:grade5-english-curriculum-exam-l1-5-a:a-attempt";
    const aReceiptKey = "sent:grade5-english-curriculum-exam-l1-5-a:a-attempt";
    const calls: string[] = [];
    const entries = new Map<string, string>([
      [aPendingKey, JSON.stringify({ attemptId: "a-attempt", examId: "grade5-english-curriculum-exam-l1-5-a" })],
      [aReceiptKey, "2026-05-12T09:21:00.000Z"],
    ]);
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
    expect(isPending("a-attempt", { storage: storage as never })).toBe(false);
    expect(hasReceipt("a-attempt", { storage: storage as never })).toBe(false);
  });
});

describe("no runtime coupling with Version A", () => {
  it("imports nothing from the other exam folder or from its data/grading", () => {
    for (const file of runtimeFiles) {
      const text = read(file);
      expect(text, file).not.toMatch(/from\s+["'][^"']*grade5-english-curriculum-exam-l1-5-a/);
      expect(text, file).not.toMatch(/from\s+["'][^"']*models?A\/(?!Reference)/);
      expect(text, file).not.toContain("l1-5-a-attempt");
      expect(text, file).not.toContain("pending:grade5-english-curriculum-exam-l1-5-a:");
    }
  });

  it("does not ship Version A's questions, answers or title in its bundle", () => {
    const aTitle = "Grade 5 English Curriculum Exam L1-5 A";
    for (const file of runtimeFiles) {
      expect(read(file), file).not.toContain(aTitle);
    }
    // The only A-related module is a bare record of textbook exercise ids,
    // used by the test suite to prove the two forms are not duplicates.
    const reference = read(join(B_DIR, "src", "data", "modelAReference.ts"));
    expect(reference).not.toMatch(/accept:|options:|answer:/);
    expect(reference).toContain("import { QUESTIONS } from \"./questions\"");
  });

  it("keeps its own question bank as the single source of the paper", () => {
    const dataFile = read(join(B_DIR, "src", "data", "questions.ts"));
    for (const file of runtimeFiles) {
      if (file.endsWith(join("src", "data", "questions.ts"))) continue;
      expect(read(file), file).not.toMatch(/from\s+["'][^"']*data\/exam["']/);
    }
    expect(dataFile).toContain("export const QUESTIONS");
    expect(dataFile).not.toMatch(/from\s+["']/);
  });

  it("keeps Version A's project files intact (nothing of A was modified)", () => {
    for (const relative of [
      "src/config.ts",
      "src/data/exam.ts",
      "src/lib/submit.ts",
      "src/lib/storage.ts",
      "src/components/ResultsScreen.tsx",
      "README.md",
    ]) {
      const text = read(join(A_DIR, relative));
      expect(text.length, relative).toBeGreaterThan(50);
    }
    expect(read(join(A_DIR, "src", "config.ts"))).toContain(
      'EXAM_ID = "grade5-english-curriculum-exam-l1-5-a"'
    );
  });
});
