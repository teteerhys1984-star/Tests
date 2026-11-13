/**
 * أدوات صغيرة مشتركة بين ملفات اختبار هذا الاختبار.
 *
 * لا إطار اختبار: كل ملف اختبار برنامج مستقل، ويُحزَّم بـ esbuild ثم يُشغَّل بـ Node (انظر tests/run.mjs).
 */
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** مجلد الاختبار (يمرّره tests/run.mjs؛ والبديل هو المجلد الأب لمجلد الحزمة). */
export const EXAM_DIR =
  process.env.EXAM_DIR ?? path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export const EXAM_SRC_DIR = process.env.EXAM_SRC_DIR ?? path.join(EXAM_DIR, "src");

export const sha256 = (text: string | Uint8Array): string =>
  createHash("sha256").update(text).digest("hex");

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

const clip = (text: string | undefined): string =>
  text === undefined ? "undefined" : text.length > 300 ? text.slice(0, 300) + "…" : text;

/** مثل check()، مع طباعة القيمتين عند اختلافهما. */
export function equal(name: string, actual: unknown, expected: unknown): void {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  check(name, a === e, a === e ? "" : "got " + clip(a) + " — expected " + clip(e));
}

/** يطبع المحصلة النهائية ويضبط رمز الخروج. يُستدعى مرة واحدة في نهاية كل ملف. */
export function finish(label: string): void {
  console.log("\n" + label + ": " + passed + " passed, " + failed + " failed");
  // المقابض المفتوحة (خادم أو مؤقّت) يجب ألّا تُبقي ملف الاختبار حياً بعد انتهائه.
  setTimeout(() => process.exit(failed ? 1 : 0), 20);
}

/** بديل في الذاكرة عن localStorage. */
export class MemStorage {
  private map = new Map<string, string>();
  /** عند تفعيله يرمي setItem خطأً (التخزين ممتلئ أو محجوب). */
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
