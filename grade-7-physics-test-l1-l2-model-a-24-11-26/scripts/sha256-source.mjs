/**
 * بصمة SHA-256 لملفات مجلد المصدر — تُشغَّل يدوياً للتوثيق في VERIFICATION.md:
 *   node scripts/sha256-source.mjs
 * تقرأ المجلد `grade-7-physics-test-Model-A-24-11-26/` (المرفوع كما هو) وتطبع بصمة
 * كل ملف وبصمة مجمّعة، فلا يمكن أن يتغيّر المصدر دون أن يتغيّر التوثيق.
 * لا تُعدَّل أي ملفات مصادر.
 */
import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const sourceDir = path.join(root, "..", "grade-7-physics-test-Model-A-24-11-26");

if (!existsSync(sourceDir)) {
  console.log(`⚠ مجلد المصدر غير موجود: ${sourceDir}`);
  process.exit(0);
}

const SKIP = new Set(["node_modules", "dist", ".git", "package-lock.json"]);
const files = [];
const walk = (dir) => {
  for (const entry of readdirSync(dir).sort()) {
    if (SKIP.has(entry)) continue;
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) walk(full);
    else files.push(full);
  }
};
walk(sourceDir);

const rows = files.map((file) => {
  const relative = path.relative(sourceDir, file);
  return `${createHash("sha256").update(readFileSync(file)).digest("hex")}  ${relative}`;
});
const combined = createHash("sha256").update(rows.map((row) => row.split("  ")[0]).join("")).digest("hex");
console.log(rows.join("\n"));
console.log(`\nعدد الملفات: ${rows.length}`);
console.log(`بصمة مجمّعة (SHA-256 لسلسلة بصمات الملفات المرتّبة): ${combined}`);
