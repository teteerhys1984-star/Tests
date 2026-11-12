/**
 * Test runner for this exam (no test framework: each test file is a small standalone program).
 *
 *   npm test                         run every tests/*.test.ts(x) file
 *   npm test -- grading submit       run only the named test files
 *   node tests/run.mjs make-golden --src <dir>
 *                                    record tests/fixtures/grading-golden.json from the copy of
 *                                    this exam's src/ folder found in <dir> (see make-golden.ts)
 *
 * Each file is bundled with esbuild into .tmp-test/ (ignored by git) and run with Node.
 * No test talks to the real Google endpoint: results are posted to a mock server on 127.0.0.1.
 */
import { spawnSync } from "node:child_process";
import { mkdirSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const TESTS_DIR = path.dirname(fileURLToPath(import.meta.url));
const EXAM_DIR = path.resolve(TESTS_DIR, "..");
const SRC_DIR = path.join(EXAM_DIR, "src");
const OUT_DIR = path.join(EXAM_DIR, ".tmp-test");

const args = process.argv.slice(2);
const srcFlag = args.indexOf("--src");
const altSrc = srcFlag >= 0 ? path.resolve(args[srcFlag + 1] ?? "") : null;
if (srcFlag >= 0) args.splice(srcFlag, 2);

/** With --src, every import that points into this exam's src/ is read from the other copy instead. */
const redirectSrc = {
  name: "redirect-src",
  setup(b) {
    if (!altSrc) return;
    b.onResolve({ filter: /^\.\.?\// }, (found) => {
      const absolute = path.resolve(found.resolveDir, found.path);
      if (absolute !== SRC_DIR && !absolute.startsWith(SRC_DIR + path.sep)) return undefined;
      return b.resolve("./" + path.relative(SRC_DIR, absolute).split(path.sep).join("/"), {
        resolveDir: altSrc,
        kind: found.kind,
      });
    });
  },
};

async function bundleAndRun(entry, extraArgs = []) {
  const name = path.basename(entry).replace(/\.tsx?$/, "");
  const outfile = path.join(OUT_DIR, name + ".mjs");
  await build({
    entryPoints: [entry],
    outfile,
    bundle: true,
    platform: "node",
    format: "esm",
    target: "node20",
    jsx: "automatic",
    external: ["jsdom"],
    loader: { ".css": "empty" },
    logLevel: "warning",
    plugins: [redirectSrc],
  });
  const run = spawnSync(process.execPath, [outfile, ...extraArgs], {
    stdio: "inherit",
    cwd: EXAM_DIR,
    // A fixed time zone keeps the timestamps printed in the TXT report identical on every machine.
    env: { ...process.env, TZ: "UTC", EXAM_DIR, ...(altSrc ? { EXAM_SRC_DIR: altSrc } : {}) },
  });
  return run.status ?? 1;
}

mkdirSync(OUT_DIR, { recursive: true });

if (args[0] === "make-golden") {
  if (!altSrc) {
    console.error("Usage: node tests/run.mjs make-golden --src <folder holding the src/ to record from>");
    process.exit(1);
  }
  process.exit(await bundleAndRun(path.join(TESTS_DIR, "make-golden.ts")));
}

const all = readdirSync(TESTS_DIR).filter((file) => /\.test\.tsx?$/.test(file)).sort();
const wanted = args.length ? all.filter((file) => args.some((name) => file.startsWith(name + ".test."))) : all;
if (!wanted.length) {
  console.error("No test file matches: " + args.join(", "));
  process.exit(1);
}

let failed = 0;
for (const file of wanted) {
  console.log("\n━━━ " + file + " ━━━");
  const status = await bundleAndRun(path.join(TESTS_DIR, file));
  if (status !== 0) failed += 1;
}
console.log("\n" + (failed ? "✗ " + failed + " of " + wanted.length + " test files failed" : "✓ all " + wanted.length + " test files passed"));
process.exit(failed ? 1 : 0);
