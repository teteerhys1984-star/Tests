// Generates the two short, ORIGINAL sound effects used by the exam.
// The tones are synthesised mathematically here (no samples, no external
// audio, no copyrighted material) and written as 16-bit mono PCM WAV files.
//
//   node scripts/generate-sounds.mjs
//
// Output: src/assets/sounds/start.wav and src/assets/sounds/submit.wav
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SAMPLE_RATE = 16000;
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = resolve(root, "src/assets/sounds");

/** A bell-like note: sine + soft harmonics with a quick attack and exponential decay. */
function addNote(buffer, { freq, start, duration, gain, decay, harmonics }) {
  const startIndex = Math.floor(start * SAMPLE_RATE);
  const length = Math.floor(duration * SAMPLE_RATE);
  const attack = Math.floor(0.008 * SAMPLE_RATE);
  for (let i = 0; i < length && startIndex + i < buffer.length; i++) {
    const t = i / SAMPLE_RATE;
    const env = (i < attack ? i / attack : 1) * Math.exp(-decay * t);
    let sample = 0;
    harmonics.forEach(([multiple, amount]) => {
      sample += amount * Math.sin(2 * Math.PI * freq * multiple * t);
    });
    buffer[startIndex + i] += sample * env * gain;
  }
}

function render(totalSeconds, notes) {
  const buffer = new Float32Array(Math.ceil(totalSeconds * SAMPLE_RATE));
  notes.forEach((note) => addNote(buffer, note));
  // Normalise to a gentle peak and fade the last 30 ms to avoid clicks.
  let peak = 0;
  for (const s of buffer) peak = Math.max(peak, Math.abs(s));
  const scale = peak > 0 ? 0.62 / peak : 1;
  const fade = Math.floor(0.03 * SAMPLE_RATE);
  for (let i = 0; i < buffer.length; i++) {
    const tail = buffer.length - i;
    buffer[i] *= scale * (tail < fade ? tail / fade : 1);
  }
  return buffer;
}

function toWav(samples) {
  const dataSize = samples.length * 2;
  const view = new DataView(new ArrayBuffer(44 + dataSize));
  const writeText = (offset, text) => [...text].forEach((c, i) => view.setUint8(offset + i, c.charCodeAt(0)));
  writeText(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeText(8, "WAVE");
  writeText(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, SAMPLE_RATE, true);
  view.setUint32(28, SAMPLE_RATE * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeText(36, "data");
  view.setUint32(40, dataSize, true);
  samples.forEach((s, i) => view.setInt16(44 + i * 2, Math.max(-1, Math.min(1, s)) * 0x7fff, true));
  return Buffer.from(view.buffer);
}

const bell = [[1, 1], [2, 0.28], [3, 0.08]];
const soft = [[1, 1], [3, 0.12], [5, 0.04]];

// Exam start: a bright, rising four-note chime (C5 E5 G5 C6).
const start = render(0.75, [
  { freq: 523.25, start: 0.0, duration: 0.45, gain: 0.5, decay: 7, harmonics: bell },
  { freq: 659.25, start: 0.09, duration: 0.45, gain: 0.5, decay: 7, harmonics: bell },
  { freq: 783.99, start: 0.18, duration: 0.45, gain: 0.5, decay: 7, harmonics: bell },
  { freq: 1046.5, start: 0.27, duration: 0.48, gain: 0.55, decay: 6, harmonics: bell },
]);

// Exam submitted: a warm two-chord "well done" cadence (G major -> C major).
const submit = render(1.2, [
  { freq: 392.0, start: 0.0, duration: 0.3, gain: 0.35, decay: 5, harmonics: soft },
  { freq: 493.88, start: 0.0, duration: 0.3, gain: 0.3, decay: 5, harmonics: soft },
  { freq: 587.33, start: 0.0, duration: 0.3, gain: 0.3, decay: 5, harmonics: soft },
  { freq: 523.25, start: 0.26, duration: 0.92, gain: 0.35, decay: 3.2, harmonics: soft },
  { freq: 659.25, start: 0.26, duration: 0.92, gain: 0.3, decay: 3.2, harmonics: soft },
  { freq: 783.99, start: 0.26, duration: 0.92, gain: 0.3, decay: 3.2, harmonics: soft },
  { freq: 1046.5, start: 0.32, duration: 0.86, gain: 0.25, decay: 3.6, harmonics: bell },
]);

mkdirSync(outDir, { recursive: true });
writeFileSync(resolve(outDir, "start.wav"), toWav(start));
writeFileSync(resolve(outDir, "submit.wav"), toWav(submit));
console.log("Generated start.wav and submit.wav in", outDir);
