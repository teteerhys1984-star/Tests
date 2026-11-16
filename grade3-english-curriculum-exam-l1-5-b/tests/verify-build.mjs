/**
 * Post-build verifier for `grade3-english-curriculum-exam-l1-5-b/dist/index.html`.
 *
 * Ensures Vite produced a self-contained bundle embedding:
 *  - `EXAM_ID` (`grade3-english-curriculum-exam-l1-5-b`) and `EXAM_TITLE`
 *  - Google Sheets contract endpoint, token, and `pending:` local queue prefix
 *  - Embedded curriculum PNG data URIs and synthesized WAV audio generator
 *  - Zero external `./assets/` script/stylesheet dependencies
 */
import { existsSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

const dist = resolve(import.meta.dirname, "../dist");
const htmlPath = join(dist, "index.html");

const failures = [];
const check = (cond, msg) => {
  if (!cond) failures.push(msg);
};

check(existsSync(htmlPath), "dist/index.html was not produced");
if (existsSync(htmlPath)) {
  const size = statSync(htmlPath).size;
  const html = readFileSync(htmlPath, "utf8");

  check(size > 500_000, `dist/index.html unexpectedly small (${size} bytes)`);
  check(
    html.includes("<title>Grade 3 English Curriculum Exam L1-5 B</title>"),
    "page <title> does not match Grade 3 English Curriculum Exam L1-5 B"
  );
  check(
    html.includes("grade3-english-curriculum-exam-l1-5-b"),
    "EXAM_ID missing from bundle"
  );
  check(
    html.includes("script.google.com/macros/s/AKfycbwqv4hE1AFy73L7MhyhFwXx0nl4QF5-Nme5jvP-ank-BY_LQr91xA8A_IiQqMuTdh8B/exec"),
    "SHEETS_URL missing from bundle"
  );
  check(html.includes("pending:"), "local pending queue prefix missing from bundle");
  check(
    !/src="\.?\/assets\//.test(html) && !/href="\.?\/assets\//.test(html),
    "bundle still references external ./assets/ files instead of inlining"
  );
  const embeddedImages = (html.match(/data:image\/png;base64,/g) ?? []).length;
  check(
    embeddedImages >= 28,
    `expected at least 28 embedded curriculum PNGs, found ${embeddedImages}`
  );
  check(
    html.includes("data:audio/wav;base64,"),
    "embedded WAV sound generator missing from bundle"
  );
}

if (failures.length) {
  console.error("Build verification failed:");
  for (const f of failures) console.error("  - " + f);
  process.exit(1);
}
console.log("dist/index.html verified OK.");
