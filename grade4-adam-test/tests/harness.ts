/**
 * Small helpers shared by the test files of this exam.
 */
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** The exam folder (tests/run.mjs passes it; the fallback is the parent of the bundle folder). */
export const EXAM_DIR = process.env.EXAM_DIR ?? path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export const sha256 = (text: string | Uint8Array): string => createHash("sha256").update(text).digest("hex");

let passed = 0;
let failed = 0;

export function section(title: string): void {
  console.log("\n" + title);
}

export function check(name: string, condition: boolean, extra = ""): void {
  if (condition) {
    passed += 1;
    console.log("  ✓ " + name + (extra ? " → " + extra : ""));
  } else {
    failed += 1;
    console.log("  ✗ " + name + (extra ? " → " + extra : ""));
  }
}

/** Like check(), with both values printed when they differ. */
export function equal(name: string, actual: unknown, expected: unknown): void {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  check(name, a === e, a === e ? "" : "got " + clip(a) + " — expected " + clip(e));
}

const clip = (text: string | undefined) => (text === undefined ? "undefined" : text.length > 300 ? text.slice(0, 300) + "…" : text);

/** Prints the totals and sets the exit code. Call it once, at the end of a test file. */
export function finish(label: string): void {
  console.log("\n" + label + ": " + passed + " passed, " + failed + " failed");
  // Open handles (a server, a timer) must not keep a finished test file alive.
  setTimeout(() => process.exit(failed ? 1 : 0), 20);
}

/** In-memory stand-in for localStorage. */
export class MemStorage {
  private map = new Map<string, string>();
  /** When set, setItem throws (storage full or blocked). */
  failWrites = false;
  get length(): number {
    return this.map.size;
  }
  key(index: number): string | null {
    return Array.from(this.map.keys())[index] ?? null;
  }
  getItem(key: string): string | null {
    return this.map.has(key) ? (this.map.get(key) as string) : null;
  }
  setItem(key: string, value: string): void {
    if (this.failWrites) throw new Error("QuotaExceededError");
    this.map.set(key, String(value));
  }
  removeItem(key: string): void {
    this.map.delete(key);
  }
  keys(): string[] {
    return Array.from(this.map.keys());
  }
}

export const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
