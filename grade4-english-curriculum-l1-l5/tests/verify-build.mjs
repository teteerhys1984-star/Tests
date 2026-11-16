/**
 * Post-build verification of the published single file (dist/index.html):
 * sounds, fonts, images/equations, local paths and self-containment.
 *
 *   npm run build && npm run verify:build
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

console.log("1) identity & index classification");
check(/<title>[^<]*Curriculum Test Lessons 1 to 5[^<]*<\/title>/.test(html), "<title> carries the official title");
check(/grade[-_ ]?4/i.test(html) && /english/i.test(html), "grade 4 + English are detectable");
check(/semester\s*1/i.test(html), "semester 1 is explicit");
check(html.includes('"grade4-english-curriculum-l1-l5"'), "EXAM_ID value is in the built page");
check(!html.includes("tests-platform-gate-v1") && !html.includes('id="gate-form"'), "no password gate inside the exam page");

console.log("2) the two missing WAV files are now bundled inline (no broken paths)");
const wavs = [...html.matchAll(/data:audio\/wav;base64,([A-Za-z0-9+/=]+)/g)].map((m) => Buffer.from(m[1], "base64"));
check(wavs.length === 2, `exactly 2 inlined WAV assets (found ${wavs.length})`);
for (const name of ["mission-start.wav", "mission-submit.wav"]) {
  const src = readFileSync(path.join(root, "src", "assets", "sounds", name));
  const found = wavs.find((w) => w.length === src.length && createHash("sha256").update(w).digest("hex") === createHash("sha256").update(src).digest("hex"));
  check(Boolean(found), `${name} is byte-identical to the source WAV, embedded as a data URI`);
  if (found) {
    check(found.subarray(0, 4).toString("ascii") === "RIFF" && found.subarray(8, 12).toString("ascii") === "WAVE", `${name} has a valid RIFF/WAVE header`);
  }
}
check(!/[./]assets\/sounds\//.test(html), "no unresolved ../assets/sounds/... path in the page");
check(!/localhost|127\.0\.0\.1/.test(html), "no localhost references");

console.log("3) fonts / drawings / self-containment");
const fontData = (html.match(/data:font\/|data:application\/font|data:application\/x-font/g) ?? []).length;
check(fontData >= 3, `local fonts are inlined (${fontData} data URIs)`);
check(html.includes("<svg") || html.includes("createElementNS"), "inline SVG drawings/brand mark are bundled");
const external = [...html.matchAll(/(?:src|href)="(https?:\/\/[^"]+)"/g)].map((m) => m[1]);
check(external.every((u) => u.startsWith("https://wa.me/")), `no external resources (${external.length} link(s), WhatsApp navigation only)`);
check(!/@import\s+url\(https?:/.test(html), "no external CSS imports");

console.log("4) delivery UI and student report survive minification");
for (const needle of ["Resend Result", "Download Exam Report (TXT)", "sent to your teacher", "OFFICIAL EXAM REPORT"]) {
  check(html.includes(needle), `"${needle}" is present in the built page`);
}

console.log(failures ? `\n❌ ${failures} build check(s) failed` : "\n✅ built page is self-contained and complete");
process.exit(failures ? 1 : 0);
