/**
 * Post-build verification of the single-file bundle (dist/index.html):
 *   1) <title> & index classification metadata (Grade 3, English, Semester 1, EXAM_ID)
 *   2) Both generated WAV sound effects are bundled inline as data:audio/wav;base64
 *   3) No broken relative sound paths or localhost references
 *   4) Delivery UI & report strings survive minification
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const built = path.join(root, "dist", "index.html");
let failures = 0;

const check = (ok, message) => {
  console.log((ok ? "  ✓ " : "  ✗ ") + message);
  if (!ok) failures++;
};

if (!existsSync(built)) {
  console.error("✗ dist/index.html missing — run npm run build first");
  process.exit(1);
}
const html = readFileSync(built, "utf8");

console.log("1) identity & classification");
check(/<title>[^<]*Curriculum Test Lessons 1 to 5[^<]*<\/title>/.test(html), "<title> carries official title");
check(/grade[-_ ]?3/i.test(html) && /english/i.test(html), "grade 3 + English detectable");
check(/semester\s*1/i.test(html), "semester 1 explicit");
check(html.includes('"grade3-english-curriculum-l1-l5"'), "EXAM_ID value bundled in HTML");
check(!html.includes("tests-platform-gate-v1") && !html.includes('id="gate-form"'), "no landing gate inside exam page");

console.log("2) sound effects bundled inline");
const wavs = [...html.matchAll(/data:audio\/wav;base64,([A-Za-z0-9+/=]+)/g)].map((m) =>
  Buffer.from(m[1], "base64")
);
check(wavs.length === 2, `exactly 2 inline WAV assets (found ${wavs.length})`);
for (const name of ["exam-start.wav", "exam-submit.wav"]) {
  const src = readFileSync(path.join(root, "src", "assets", "sounds", name));
  const srcHash = createHash("sha256").update(src).digest("hex");
  const found = wavs.find(
    (w) => w.length === src.length && createHash("sha256").update(w).digest("hex") === srcHash
  );
  check(Boolean(found), `${name} is byte-identical and embedded as a data URI`);
  if (found) {
    check(
      found.subarray(0, 4).toString("ascii") === "RIFF" && found.subarray(8, 12).toString("ascii") === "WAVE",
      `${name} has a valid RIFF/WAVE header`
    );
  }
}
check(!/sounds\/exam-(start|submit)\.wav/.test(html), "no unbundled relative sounds/ path in built HTML");
check(!/localhost|127\.0\.0\.1/.test(html), "no localhost references");

console.log("3) delivery UI and report strings survive minification");
for (const needle of [
  "Resend Result",
  "Download Exam Report (TXT)",
  "sent to your teacher",
  "Grade 3 English Examination",
]) {
  check(html.includes(needle), `"${needle}" present in built HTML`);
}

console.log(failures ? `\n❌ ${failures} build check(s) failed` : "\n✅ built page is self-contained and complete");
process.exit(failures ? 1 : 0);
