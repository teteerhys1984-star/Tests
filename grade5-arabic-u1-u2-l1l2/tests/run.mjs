#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildSync } from "esbuild";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const outDir = path.join(rootDir, ".tmp-test");
fs.mkdirSync(outDir, { recursive: true });

const suites = [
  { name: "grading.test.ts", entry: path.join(__dirname, "grading.test.ts") },
  { name: "submit.test.ts", entry: path.join(__dirname, "submit.test.ts") },
  { name: "workflow.test.tsx", entry: path.join(__dirname, "workflow.test.tsx") },
];

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
