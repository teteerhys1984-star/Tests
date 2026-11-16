/**
 * Generates the two original, locally-shipped exam sound effects:
 *   src/assets/sounds/exam-start.wav  — a soft ascending "garden bell" welcome chime
 *   src/assets/sounds/exam-submit.wav — a celebratory blossom flourish
 * Raw 16-bit PCM WAV synthesis, no external assets required.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "..", "src", "assets", "sounds");
mkdirSync(OUT, { recursive: true });

const SR = 44100;

/** Render a sequence of bell notes: [{f, t (start s), d (dur s), g (gain)}] */
function render(notes, totalSeconds) {
  const n = Math.floor(totalSeconds * SR);
  const data = new Float32Array(n);
  for (const { f, t, d, g } of notes) {
    const start = Math.floor(t * SR);
    const len = Math.floor(d * SR);
    for (let i = 0; i < len && start + i < n; i++) {
      const tt = i / SR;
      // gentle exponential bell envelope
      const env = Math.exp(-3.2 * tt) * Math.min(1, tt * 90);
      // fundam. + soft 2nd harmonic shimmer + tiny 3rd
      const s =
        Math.sin(2 * Math.PI * f * tt) * 0.72 +
        Math.sin(2 * Math.PI * f * 2 * tt) * 0.2 +
        Math.sin(2 * Math.PI * f * 3 * tt) * 0.08;
      data[start + i] += s * env * g;
    }
  }
  // normalize to 0.88 peak
  let peak = 0;
  for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(data[i]));
  const k = peak > 0 ? 0.88 / peak : 1;
  return data.map((v) => v * k);
}

function writeWav(path, samples) {
  const n = samples.length;
  const buf = Buffer.alloc(44 + n * 2);
  buf.write("RIFF", 0);
  buf.writeUInt32LE(36 + n * 2, 4);
  buf.write("WAVE", 8);
  buf.write("fmt ", 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20); // PCM
  buf.writeUInt16LE(1, 22); // mono
  buf.writeUInt32LE(SR, 24);
  buf.writeUInt32LE(SR * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write("data", 36);
  buf.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) {
    const v = Math.max(-1, Math.min(1, samples[i]));
    buf.writeInt16LE(Math.round(v * 32767), 44 + i * 2);
  }
  writeFileSync(path, buf);
  console.log("wrote", path, (buf.length / 1024).toFixed(1) + "KB");
}

// Notes (Hz)
const C5 = 523.25, E5 = 659.25, G5 = 783.99, C6 = 1046.5;
const D6 = 1174.66, E6 = 1318.51, G6 = 1567.98;

// 1) Exam start — gentle ascending blossom chime (C5 → E5 → G5 → C6)
writeWav(
  join(OUT, "exam-start.wav"),
  render(
    [
      { f: C5, t: 0.0, d: 0.9, g: 0.5 },
      { f: E5, t: 0.14, d: 0.9, g: 0.5 },
      { f: G5, t: 0.28, d: 1.0, g: 0.5 },
      { f: C6, t: 0.42, d: 1.4, g: 0.55 },
      { f: G5, t: 0.42, d: 1.2, g: 0.22 },
    ],
    2.2
  )
);

// 2) Exam submit — bright blossom flourish with sparkle tail
writeWav(
  join(OUT, "exam-submit.wav"),
  render(
    [
      { f: G5, t: 0.0, d: 0.7, g: 0.45 },
      { f: C6, t: 0.1, d: 0.8, g: 0.5 },
      { f: E6, t: 0.2, d: 0.9, g: 0.5 },
      { f: D6, t: 0.32, d: 0.5, g: 0.32 },
      { f: E6, t: 0.42, d: 0.6, g: 0.36 },
      { f: G6, t: 0.54, d: 1.3, g: 0.5 },
      { f: C6, t: 0.54, d: 1.2, g: 0.28 },
    ],
    2.4
  )
);
