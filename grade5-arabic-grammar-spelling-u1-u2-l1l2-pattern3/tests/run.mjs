#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildSync } from "esbuild";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const outDir = path.join(rootDir, ".cache", "tests");
fs.mkdirSync(outDir, { recursive: true });

const all = [
  { name: "data.test.ts" },
  { name: "submit.test.ts" },
  { name: "independence.test.ts" },
];
const only = process.argv[2];
const suites = only ? all.filter((s) => s.name.startsWith(only)) : all;
if (!suites.length) {
  console.error("Unknown test suite: " + only);
  process.exit(1);
}

try {
  for (const s of suites) {
    console.log("\n== " + s.name + " ==");
    const outfile = path.join(outDir, s.name.replace(/\.tsx?$/, ".cjs"));
    buildSync({
      entryPoints: [path.join(__dirname, s.name)],
      bundle: true,
      platform: "node",
      format: "cjs",
      outfile,
      packages: "external",
      alias: { "@": path.join(rootDir, "src") },
      logLevel: "warning",
    });
    const r = spawnSync(process.execPath, [outfile], { cwd: rootDir, stdio: "inherit" });
    if (r.status !== 0) process.exit(r.status ?? 1);
  }
  console.log("\nALL TEST SUITES PASSED");
} finally {
  fs.rmSync(path.join(rootDir, ".cache"), { recursive: true, force: true });
}
