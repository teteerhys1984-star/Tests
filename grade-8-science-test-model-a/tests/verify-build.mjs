#!/usr/bin/env node
/**
 * Standalone-build verification (run after `npm run build`).
 * Confirms dist/index.html is a self-contained page that can be published at
 * https://teteerhys1984-star.github.io/Tests/grade-8-science-test-model-a/
 */
import { readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const DIST = join(ROOT, "dist", "index.html");
const EXAM_ID = "grade-8-science-test-model-a";
const TITLE = "Grade 8 Science Test Model A";

const problems = [];
const ok = (label) => console.log(`  ✓ ${label}`);
const fail = (label) => {
  problems.push(label);
  console.log(`  ✗ ${label}`);
};

let html = "";
try {
  html = readFileSync(DIST, "utf8");
} catch {
  console.error(`::error::missing ${DIST} — run "npm run build" first`);
  process.exit(1);
}

const size = statSync(DIST).size;
console.log(`dist/index.html = ${(size / 1024).toFixed(1)} KiB`);

size > 200 * 1024 ? ok("single-file bundle is self-contained (>200 KiB)") : fail("bundle looks too small");
html.includes(`<title>${TITLE}</title>`) ? ok(`title is exactly "${TITLE}"`) : fail("title mismatch");
html.includes(EXAM_ID) ? ok(`EXAM_ID "${EXAM_ID}" is embedded`) : fail("EXAM_ID missing");
html.includes("text/plain;charset=utf-8") ? ok("Sheets contract content-type embedded") : fail("content-type missing");
html.includes("pending:") ? ok("pending-payload namespace embedded") : fail("pending namespace missing");
html.includes("SOMER173") ? ok("teacher gate password embedded") : fail("teacher gate password missing");
!html.includes('src="/src/main.tsx"') ? ok("module entry replaced by bundled script") : fail("dev entry still referenced");
!html.includes("grade-8-science-test-model-A/") ? ok("source upload folder is not referenced") : fail("source folder referenced");

const externalScripts = [...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map((m) => m[1]);
externalScripts.length === 0 ? ok("no external <script src> dependencies") : fail(`external scripts: ${externalScripts.join(", ")}`);

const externalCss = [...html.matchAll(/<link[^>]+rel="stylesheet"[^>]*href="([^"]+)"/g)].map((m) => m[1]);
const onlyFonts = externalCss.every((href) => href.startsWith("https://fonts.googleapis.com/"));
onlyFonts ? ok("only Google Fonts stylesheets are external") : fail(`unexpected stylesheets: ${externalCss.join(", ")}`);

if (problems.length > 0) {
  console.error(`::error::standalone build verification failed (${problems.length} issue(s))`);
  process.exit(1);
}
console.log("BUILD_VERIFY_OK");
