// Regenerates the two ORIGINAL sound effects if they are missing or not valid
// WAV files, so a build can never fail on the unresolved import
// "../assets/sounds/start.wav" again. Existing valid files are never touched.
//
//   node scripts/check-sounds.mjs      (npm run check:sounds)
//
// The tones are synthesised by scripts/generate-sounds.mjs — no samples and no
// external/copyrighted audio are involved.
import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dir = resolve(root, "src/assets/sounds");
const files = ["start.wav", "submit.wav"];

/** RIFF/WAVE header with 16-bit PCM samples big enough to be audible. */
function isValidWav(path) {
  if (!existsSync(path)) return false;
  const buf = readFileSync(path);
  if (buf.length < 44 + 1000) return false;
  if (buf.subarray(0, 4).toString("ascii") !== "RIFF") return false;
  if (buf.subarray(8, 12).toString("ascii") !== "WAVE") return false;
  return buf.readUInt32LE(24) >= 8000 && buf.readUInt16LE(34) === 16;
}

const broken = files.filter((name) => !isValidWav(resolve(dir, name)));
if (broken.length === 0) {
  console.log(`Sound effects present and valid: ${files.join(", ")}`);
  process.exit(0);
}

console.log(`Regenerating missing/invalid sound effect(s): ${broken.join(", ")}`);
const run = spawnSync(process.execPath, [resolve(root, "scripts/generate-sounds.mjs")], {
  cwd: root,
  stdio: "inherit",
});
if (run.status !== 0) {
  console.error("Could not regenerate the sound effects.");
  process.exit(run.status ?? 1);
}
const stillBroken = files.filter((name) => !isValidWav(resolve(dir, name)));
if (stillBroken.length) {
  console.error(`Still invalid after regeneration: ${stillBroken.join(", ")}`);
  process.exit(1);
}
console.log("Sound effects regenerated.");
