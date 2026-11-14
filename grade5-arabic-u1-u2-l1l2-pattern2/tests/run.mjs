#!/usr/bin/env node
/**
 * مشغّل اختبارات هذا الاختبار (بلا إطار عمل خارجي):
 * يجمّع كل مجموعة بـ esbuild إلى CJS ثم يشغّلها في Node.
 *
 *   node tests/run.mjs            كل المجموعات
 *   node tests/run.mjs data       مجموعة البيانات والتصحيح فقط
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildSync } from "esbuild";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const outDir = path.join(rootDir, ".tmp-test");
fs.mkdirSync(outDir, { recursive: true });

const allSuites = [
  { name: "data.test.ts", entry: path.join(__dirname, "data.test.ts") },
  { name: "submit.test.ts", entry: path.join(__dirname, "submit.test.ts") },
  { name: "workflow.test.tsx", entry: path.join(__dirname, "workflow.test.tsx") },
];

const only = process.argv[2];
const suites = only
  ? allSuites.filter((suite) => suite.name.startsWith(only))
  : allSuites;
if (suites.length === 0) {
  console.error(`لا توجد مجموعة اختبار مطابقة: ${only}`);
  process.exit(1);
}

for (const suite of suites) {
  console.log(`\n==============================\nRunning ${suite.name}\n==============================`);
  const outfile = path.join(outDir, suite.name.replace(/\.tsx?$/, ".cjs"));
  buildSync({
    entryPoints: [suite.entry],
    bundle: true,
    platform: "node",
    format: "cjs",
    outfile,
    packages: "external",
    // المشروع يستعمل alias "@" → src؛ يجب تمريره صراحةً لأن esbuild لا يقرأ tsconfig هنا.
    alias: { "@": path.join(rootDir, "src") },
    logLevel: "warning",
  });
  const res = spawnSync(process.execPath, [outfile], {
    cwd: rootDir,
    stdio: "inherit",
  });
  if (res.status !== 0) {
    process.exit(res.status ?? 1);
  }
}

console.log("\n🎉 جميع مجموعات الاختبار ناجحة");
