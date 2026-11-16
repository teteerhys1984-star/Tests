/** Shared test helpers. All fixtures were captured from the ORIGINAL exam before any edit. */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";

// Vitest runs with the exam folder as cwd in both node and jsdom environments;
// import.meta.url is browser-like under jsdom, so fileURLToPath() is not usable there.
export const EXAM_ROOT = process.cwd();

export function fixture<T = any>(name: string): T {
  return JSON.parse(readFileSync(path.join(EXAM_ROOT, "tests", "fixtures", name), "utf8")) as T;
}

export function sourceFile(rel: string): Buffer {
  return readFileSync(path.join(EXAM_ROOT, rel));
}

export function sha256(data: string | Buffer): string {
  return createHash("sha256").update(data).digest("hex");
}

/** Minimal in-memory StorageLike, so no test ever touches a real browser storage. */
export class MemStorage {
  private map = new Map<string, string>();
  get length(): number {
    return this.map.size;
  }
  key(index: number): string | null {
    return [...this.map.keys()][index] ?? null;
  }
  getItem(key: string): string | null {
    return this.map.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.map.set(key, value);
  }
  removeItem(key: string): void {
    this.map.delete(key);
  }
  keys(): string[] {
    return [...this.map.keys()];
  }
}

/** A storage that throws on every call — the app must survive without storage. */
export const brokenStorage = {
  get length(): number {
    throw new Error("storage disabled");
  },
  key(): string | null {
    throw new Error("storage disabled");
  },
  getItem(): string | null {
    throw new Error("storage disabled");
  },
  setItem(): void {
    throw new Error("storage disabled");
  },
  removeItem(): void {
    throw new Error("storage disabled");
  },
};

/** Type-only shape of an object (used to compare payloads with the reference contract). */
export function shapeOf(value: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    out[key] = Array.isArray(val) ? "array" : val === null ? "null" : typeof val;
  }
  return out;
}

export const deepEqual = (a: unknown, b: unknown): boolean => JSON.stringify(a) === JSON.stringify(b);
