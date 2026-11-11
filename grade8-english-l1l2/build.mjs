/**
 * Build step for the GitHub Pages workflow (.github/workflows/deploy.yml).
 *
 * The workflow runs `npm ci && npm run build` in every top-level folder that has a
 * package.json and publishes that folder's dist/index.html — and nothing else.
 * This examination is already one self-contained HTML file, so the build checks it
 * and copies it, byte for byte, to dist/index.html. There are no dependencies.
 *
 * The build fails, instead of publishing a broken page, when:
 *   · EXAM_ID in the page is not the name of this folder (results would be filed
 *     under the wrong examination);
 *   · the page refers to a local file (only dist/index.html is published);
 *   · an inline script has a syntax error, or the page has no <title>
 *     (the landing page lists each examination by its title).
 */
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const FOLDER = path.basename(ROOT);
const SOURCE = "grade8-english-L1L2.html";
const OUT_DIR = path.join(ROOT, "dist");
const OUT_FILE = path.join(OUT_DIR, "index.html");

const html = readFileSync(path.join(ROOT, SOURCE), "utf8");
const problems = [];

/* 1. EXAM_ID must match the published folder. */
const examId = (html.match(/const\s+EXAM_ID\s*=\s*"([^"]*)"/) || [])[1];
if (!examId) problems.push("EXAM_ID was not found in " + SOURCE + ".");
else if (examId !== FOLDER) problems.push(`EXAM_ID is "${examId}" but this folder is "${FOLDER}". They must be identical.`);

/* 2. The landing page needs a title. */
const title = ((html.match(/<title>([\s\S]*?)<\/title>/i) || [])[1] || "").trim();
if (!title) problems.push("The page has no <title>.");

/* 3. Nothing may point at a local file: only dist/index.html is published. */
const isPublished = target => /^(https?:|data:|mailto:|tel:|blob:|#)/i.test(target) || target === "" || target.includes("${");
const references = [];
for (const match of html.matchAll(/\b(?:src|href|poster|srcset)\s*=\s*\\?["']([^"'\\]*)/gi)) references.push(match[1].trim());
for (const match of html.matchAll(/(?<![\w.])url\(\s*["']?([^"')]+)["']?\s*\)/g)) references.push(match[1].trim());
for (const match of html.matchAll(/@import\s+["']([^"']+)["']/gi)) references.push(match[1].trim());
const localReferences = [...new Set(references.filter(target => !isPublished(target)))];
if (localReferences.length) problems.push("The page refers to local files that would not be published: " + localReferences.join(", "));

/* 4. Every inline script must at least parse. */
let inlineScripts = 0;
for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
  if (/\bsrc\s*=/.test(match[1])) continue;
  inlineScripts += 1;
  try {
    new vm.Script(match[2], { filename: SOURCE + "#inline-script-" + inlineScripts });
  } catch (error) {
    problems.push("Inline script " + inlineScripts + " does not parse: " + error.message);
  }
}
if (!inlineScripts) problems.push("No inline script was found.");

if (problems.length) {
  console.error("Build failed for " + FOLDER + ":");
  for (const problem of problems) console.error("  - " + problem);
  process.exit(1);
}

rmSync(OUT_DIR, { recursive: true, force: true });
mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(OUT_FILE, html);

const externalScripts = [...html.matchAll(/<script\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/gi)].map(match => match[1]);
console.log(`Built ${path.relative(ROOT, OUT_FILE)} from ${SOURCE}`);
console.log(`  title: ${title}`);
console.log(`  EXAM_ID: ${examId}`);
console.log(`  size: ${Buffer.byteLength(html)} bytes · inline scripts: ${inlineScripts}`);
if (externalScripts.length) console.log(`  loaded from the network at run time: ${externalScripts.join(", ")}`);
