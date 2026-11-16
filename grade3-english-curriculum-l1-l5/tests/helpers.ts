import { createHash } from "node:crypto";
import type { StorageLike } from "../src/logic/submit";

export class MemStorage implements StorageLike {
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
    this.map.set(key, String(value));
  }
  removeItem(key: string): void {
    this.map.delete(key);
  }
  keys(): string[] {
    return [...this.map.keys()];
  }
  clear(): void {
    this.map.clear();
  }
}

export const brokenStorage: StorageLike = {
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
    throw new Error("quota exceeded");
  },
  removeItem(): void {
    throw new Error("storage disabled");
  },
};

export function shapeOf(obj: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(obj)) {
    out[k] = Array.isArray(v) ? "array" : typeof v;
  }
  return out;
}

export function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(value as Record<string, unknown>).sort()) {
      out[k] = canonical((value as Record<string, unknown>)[k]);
    }
    return out;
  }
  return value;
}

export function deepEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(canonical(a)) === JSON.stringify(canonical(b));
}

export function sha256(buf: Buffer | string): string {
  return createHash("sha256").update(buf).digest("hex");
}
