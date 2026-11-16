/**
 * Generates the two original examination sound effects as 16-bit mono PCM WAV files.
 *  1. mission-start.wav  — short rising "mission go" arpeggio (school-soft volume)
 *  2. mission-submit.wav — bright "objective complete" confirmation chime
 * Output: src/assets/sounds/  (bundled inline by Vite at build time)
 */
import fs from "node:fs";
import path from "node:path";

const SR = 22050; // sample rate
const OUT = path.resolve("src/assets/sounds");

/** sine + soft 2nd harmonic for a warmer, friendly tone */
function tone(freq, t) {
  return (
    0.82 * Math.sin(2 * Math.PI * freq * t) +
    0.18 * Math.sin(2 * Math.PI * freq * 2 * t)
  );
}

/** attack/decay envelope in seconds */
function env(t, dur, a = 0.012, r = 0.045) {
  const attack = Math.min(1, t / a);
  const rel = Math.min(1, Math.max(0, (dur - t) / r));
  return attack * rel;
}

/**
 * notes: { f, at, dur, amp } — seconds timeline
 */
function render(notes, totalSec) {
  const n = Math.floor(totalSec * SR);
  const buf = new Float32Array(n);
  for (const { f, at, dur, amp } of notes) {
    const start = Math.floor(at * SR);
    const len = Math.floor(dur * SR);
    for (let i = 0; i < len && start + i < n; i++) {
      const t = i / SR;
      buf[start + i] += tone(f, t) * env(t, dur) * amp;
    }
  }
  // gentle limiter
  for (let i = 0; i < n; i++)
    buf[i] = Math.max(-1, Math.min(1, buf[i] * 0.9));
  return buf;
}

function toWav(floatBuf) {
  const data = new Int16Array(floatBuf.length);
  for (let i = 0; i < floatBuf.length; i++)
    data[i] = Math.round(floatBuf[i] * 32767);
  const buf = Buffer.alloc(44 + data.length * 2);
  buf.write("RIFF", 0);
  buf.writeUInt32LE(36 + data.length * 2, 4);
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
  buf.writeUInt32LE(data.length * 2, 40);
  Buffer.from(data.buffer).copy(buf, 44);
  return buf;
}

// 1) Mission start — crisp rising C5→E5→G5 "go" arpeggio (~0.55s), plus a soft low pulse.
const start = render(
  [
    { f: 196.0, at: 0.0, dur: 0.09, amp: 0.2 }, // low recon pulse G3
    { f: 523.25, at: 0.06, dur: 0.11, amp: 0.3 }, // C5
    { f: 659.25, at: 0.17, dur: 0.11, amp: 0.3 }, // E5
    { f: 783.99, at: 0.28, dur: 0.24, amp: 0.32 }, // G5 (held)
  ],
  0.72
);

// 2) Submission — warm "objective complete" chime: E5 → G5 → C6 held with shimmer (~1.2s)
const submit = render(
  [
    { f: 659.25, at: 0.0, dur: 0.16, amp: 0.3 }, // E5
    { f: 783.99, at: 0.14, dur: 0.18, amp: 0.3 }, // G5
    { f: 1046.5, at: 0.3, dur: 0.55, amp: 0.3 }, // C6 held
    { f: 1318.5, at: 0.3, dur: 0.5, amp: 0.12 }, // E6 shimmer
    { f: 329.63, at: 0.3, dur: 0.55, amp: 0.16 }, // E4 warmth
  ],
  1.25
);

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, "mission-start.wav"), toWav(start));
fs.writeFileSync(path.join(OUT, "mission-submit.wav"), toWav(submit));
console.log("Sounds written to", OUT);
