/**
 * Synthesizes the two original exam sounds (start chime + submission fanfare)
 * as 16-bit PCM WAV files written into src/assets/audio/.
 * Run: node scripts/generate-sounds.mjs
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "..", "src", "assets", "audio");
mkdirSync(OUT_DIR, { recursive: true });

const SR = 44100;

/** Exponentially decaying marimba-like tone with two soft overtones. */
function pluck(freq, t, dur) {
  if (t < 0 || t > dur) return 0;
  const env = Math.exp(-t * 7.5) * Math.min(1, t / 0.004);
  return (
    env *
    (Math.sin(2 * Math.PI * freq * t) +
      0.32 * Math.sin(2 * Math.PI * freq * 2 * t) +
      0.12 * Math.sin(2 * Math.PI * freq * 3 * t))
  );
}

function render(notes, volume = 0.42) {
  const dur = Math.max(...notes.map((n) => n.at + n.dur)) + 0.25;
  const n = Math.floor(dur * SR);
  const data = new Float32Array(n);
  for (const note of notes) {
    const start = Math.floor(note.at * SR);
    const len = Math.floor(note.dur * SR);
    for (let i = 0; i < len; i++) {
      data[start + i] += pluck(note.freq, i / SR, note.dur) * (note.vel ?? 1);
    }
  }
  // gentle master fade-out to avoid clicks
  const fade = Math.floor(0.08 * SR);
  for (let i = 0; i < fade; i++) data[n - 1 - i] *= i / fade;
  // normalize
  let peak = 0;
  for (const s of data) peak = Math.max(peak, Math.abs(s));
  const gain = volume / Math.max(peak, 1e-6);
  const pcm = Buffer.alloc(44 + n * 2);
  pcm.write("RIFF", 0);
  pcm.writeUInt32LE(36 + n * 2, 4);
  pcm.write("WAVE", 8);
  pcm.write("fmt ", 12);
  pcm.writeUInt32LE(16, 16);
  pcm.writeUInt16LE(1, 20); // PCM
  pcm.writeUInt16LE(1, 22); // mono
  pcm.writeUInt32LE(SR, 24);
  pcm.writeUInt32LE(SR * 2, 28);
  pcm.writeUInt16LE(2, 32);
  pcm.writeUInt16LE(16, 34);
  pcm.write("data", 36);
  pcm.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) {
    pcm.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(data[i] * gain * 32767))), 44 + i * 2);
  }
  return pcm;
}

const C5 = 523.25, E5 = 659.25, G5 = 783.99, C6 = 1046.5, A5 = 880.0;

// Start: soft ascending boarding chime (C5 → E5 → G5)
writeFileSync(
  join(OUT_DIR, "start.wav"),
  render([
    { freq: C5, at: 0.0, dur: 0.55, vel: 0.9 },
    { freq: E5, at: 0.16, dur: 0.55, vel: 0.85 },
    { freq: G5, at: 0.32, dur: 0.7, vel: 1.0 },
  ])
);

// Submit: confident completion fanfare (C5 → E5 → G5 → C6 with a warm fifth)
writeFileSync(
  join(OUT_DIR, "submit.wav"),
  render([
    { freq: C5, at: 0.0, dur: 0.5, vel: 0.85 },
    { freq: E5, at: 0.13, dur: 0.5, vel: 0.85 },
    { freq: G5, at: 0.26, dur: 0.5, vel: 0.9 },
    { freq: C6, at: 0.39, dur: 0.85, vel: 1.0 },
    { freq: A5, at: 0.39, dur: 0.85, vel: 0.4 },
  ])
);

console.log("Wrote", join(OUT_DIR, "start.wav"), "and submit.wav");
