/**
 * The build the deployment runs, the published file, and the landing page's placement.
 *
 * `npm run build` must produce dist/index.html byte for byte; the landing generator must file the
 * examination under Grade 3 → English and link to it. The build must refuse a page whose EXAM_ID
 * is not the published folder.
 */
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { copyFileSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, test } from "node:test";
import { DIST_HTML, EXAM_DIR, EXAM_DIR_NAME, SOURCE_HTML } from "./harness.mjs";

const REPO_ROOT = path.resolve(EXAM_DIR, "..");
const TMP = [];

function tempDir(prefix) {
  const dir = mkdtempSync(path.join(os.tmpdir(), prefix));
  TMP.push(dir);
  return dir;
}

after(() => {
  for (const dir of TMP) rmSync(dir, { recursive: true, force: true });
});

test("npm run build produces dist/index.html exactly as the source page", () => {
  execFileSync("npm", ["run", "build"], { cwd: EXAM_DIR, stdio: "pipe" });
  const source = readFileSync(SOURCE_HTML);
  const built = readFileSync(DIST_HTML);
  assert.ok(built.equals(source), "dist/index.html must be the source bytes");
  assert.equal(built.length, source.length);
  const html = built.toString("utf8");
  assert.equal(html.match(/<title>([\s\S]*?)<\/title>/)[1], "English Grammar Mira");
  assert.match(html, new RegExp('EXAM_ID = "' + EXAM_DIR_NAME + '"'));
  assert.match(html, /EXAM_TITLE = "English Grammar Mira"/);
});

test("the build refuses a page whose EXAM_ID is not its folder", () => {
  const dir = tempDir("mira-build-guard-");
  mkdirSync(path.join(dir, "not-the-exam-id"), { recursive: true });
  copyFileSync(path.join(EXAM_DIR, "build.mjs"), path.join(dir, "not-the-exam-id", "build.mjs"));
  writeFileSync(path.join(dir, "not-the-exam-id", "index.html"), readFileSync(SOURCE_HTML));
  const result = spawnSync(process.execPath, ["build.mjs"], { cwd: path.join(dir, "not-the-exam-id"), encoding: "utf8" });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /EXAM_ID is "grade3-english-grammar-mira" but this folder is "not-the-exam-id"/);
});

test("the landing page files the examination under Grade 3 → English and links to it", () => {
  const site = tempDir("mira-site-");
  mkdirSync(path.join(site, EXAM_DIR_NAME), { recursive: true });
  copyFileSync(DIST_HTML, path.join(site, EXAM_DIR_NAME, "index.html"));
  const output = execFileSync("python3", ["landing/generate.py", site], { cwd: REPO_ROOT, encoding: "utf8" });
  assert.match(output, /1 exam\(s\)/);
  const page = readFileSync(path.join(site, "index.html"), "utf8");
  const section = page.match(/<section class="view" id="view-exams-3-english"[\s\S]*?<\/section>/);
  assert.ok(section, "the Grade 3 English view exists");
  assert.ok(section[0].includes('href="./' + EXAM_DIR_NAME + '/"'), "the examination is linked");
  assert.ok(section[0].includes('data-grade="3" data-subject="english"'), "filed as Grade 3 English");
  assert.ok(section[0].includes("English Grammar Mira"), "shown by its title");
  assert.ok(section[0].includes("الصف الثالث"), "the grade is shown in Arabic");
  assert.equal((page.match(/grade3-english-grammar-mira/g) || []).length, section[0].split("grade3-english-grammar-mira").length - 1, "linked once, from its own card");
  /* Not filed in another grade or subject. */
  for (const other of ["view-exams-3-math", "view-exams-3-arabic", "view-exams-4-english", "view-exams-2-english"]) {
    const otherSection = page.match(new RegExp('<section class="view" id="' + other + '"[\\s\\S]*?</section>'));
    if (otherSection) assert.ok(!otherSection[0].includes(EXAM_DIR_NAME), other);
  }
});
