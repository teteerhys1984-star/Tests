/**
 * Post-build verification of the single-file bundle (dist/index.html):
 *   1) <title> & index classification metadata (Grade 8, English, Semester 1, EXAM_ID)
 *   2) Both generated WAV sound effects + world-map-texture.jpg are bundled inline
 *   3) No broken relative asset paths, landing gate, or localhost references
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
check(
  /<title>[^<]*English Curriculum Lessons 3(&amp;|&)4[^<]*<\/title>/.test(html),
  "<title> carries official title English Curriculum Lessons 3&4"
);
check(/grade[-_ ]?8/i.test(html) && /english/i.test(html), "grade 8 + English detectable");
check(/semester\s*1/i.test(html), "semester 1 explicit");
check(html.includes('"grade8-english-curriculum-l3-l4"'), "EXAM_ID value bundled in HTML");
check(
  !html.includes("tests-platform-gate-v1") && !html.includes('id="gate-form"'),
  "no landing gate inside exam page"
);

console.log("2) audio and image assets bundled inline");
const wavs = [...html.matchAll(/data:audio\/wav;base64,([A-Za-z0-9+/=]+)/g)].map((m) =>
  Buffer.from(m[1], "base64")
);
check(wavs.length === 2, `exactly 2 inline WAV assets (found ${wavs.length})`);
for (const name of ["start.wav", "submit.wav"]) {
  const src = readFileSync(path.join(root, "src", "assets", "audio", name));
  const srcHash = createHash("sha256").update(src).digest("hex");
  const found = wavs.find(
    (w) => w.length === src.length && createHash("sha256").update(w).digest("hex") === srcHash
  );
  check(Boolean(found), `${name} is byte-identical and embedded as a data URI`);
  if (found) {
    check(
      found.subarray(0, 4).toString("ascii") === "RIFF" &&
        found.subarray(8, 12).toString("ascii") === "WAVE",
      `${name} has a valid RIFF/WAVE header`
    );
  }
}

const jpegs = [...html.matchAll(/data:image\/jpeg;base64,([A-Za-z0-9+/=]+)/g)].map((m) =>
  Buffer.from(m[1], "base64")
);
check(jpegs.length === 1, `exactly 1 inline JPEG asset (found ${jpegs.length})`);
const mapSrc = readFileSync(path.join(root, "src", "assets", "world-map-texture.jpg"));
const mapHash = createHash("sha256").update(mapSrc).digest("hex");
check(
  jpegs.some((j) => j.length === mapSrc.length && createHash("sha256").update(j).digest("hex") === mapHash),
  "world-map-texture.jpg is byte-identical and embedded as a data URI"
);

check(!/assets\/[^"'`\s]+/.test(html), "no unbundled relative assets/ path in built HTML");
check(!/localhost|127\.0\.0\.1/.test(html), "no localhost references");

console.log("3) delivery UI and report strings survive minification");
for (const needle of [
  "Resend Result",
  "Download Exam Report",
  "sent to your teacher",
  "English Curriculum Lessons 3&4",
  "World Explorer English Exam",
  "المهندس سومر شاهين",
]) {
  check(html.includes(needle), `"${needle}" present in built HTML`);
}

console.log(failures ? `\n❌ ${failures} build check(s) failed` : "\n✅ built page is self-contained and complete");
process.exit(failures ? 1 : 0);
