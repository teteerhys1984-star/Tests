// Original sound effects generated locally with the Web Audio API.
// No external audio files or URLs are used.

let ctx: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  if (!ctx) ctx = new AC();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function tone(c: AudioContext, freq: number, start: number, duration: number, type: OscillatorType, volume: number) {
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, c.currentTime + start);
  gain.gain.setValueAtTime(0.0001, c.currentTime + start);
  gain.gain.exponentialRampToValueAtTime(volume, c.currentTime + start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + start + duration);
  osc.connect(gain).connect(c.destination);
  osc.start(c.currentTime + start);
  osc.stop(c.currentTime + start + duration + 0.05);
}

/** Bright rising arpeggio played when the exam starts. */
export function playStartSound(muted: boolean) {
  if (muted) return;
  const c = getContext();
  if (!c) return;
  const notes = [523.25, 659.25, 783.99, 1046.5];
  notes.forEach((f, i) => tone(c, f, i * 0.12, 0.35, "triangle", 0.18));
}

/** Warm chord followed by a sparkle when the exam is submitted. */
export function playSubmitSound(muted: boolean) {
  if (muted) return;
  const c = getContext();
  if (!c) return;
  [392, 493.88, 587.33].forEach((f) => tone(c, f, 0, 0.9, "sine", 0.14));
  [1046.5, 1318.5, 1568].forEach((f, i) => tone(c, f, 0.35 + i * 0.09, 0.3, "triangle", 0.1));
}
