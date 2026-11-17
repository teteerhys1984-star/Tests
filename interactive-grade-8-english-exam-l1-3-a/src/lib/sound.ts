/**
 * Original, locally generated sounds. Everything is synthesised in the browser
 * with the Web Audio API — no external audio files, no remote services.
 */

let ctx: AudioContext | null = null;

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    if (!ctx) ctx = new Ctor();
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(c: AudioContext, freq: number, at: number, dur: number, gain = 0.16, type: OscillatorType = "triangle") {
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, c.currentTime + at);
  g.gain.setValueAtTime(0.0001, c.currentTime + at);
  g.gain.exponentialRampToValueAtTime(gain, c.currentTime + at + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + at + dur);
  osc.connect(g).connect(c.destination);
  osc.start(c.currentTime + at);
  osc.stop(c.currentTime + at + dur + 0.05);
}

/** Rising three-note chime when the student starts the exam. */
export function playStart(): void {
  const c = audio();
  if (!c) return;
  tone(c, 523.25, 0.0, 0.28, 0.14);
  tone(c, 659.25, 0.12, 0.3, 0.14);
  tone(c, 783.99, 0.24, 0.45, 0.16);
  tone(c, 1046.5, 0.36, 0.6, 0.1, "sine");
}

/** Warm confirming chord when the exam is submitted. */
export function playSubmit(): void {
  const c = audio();
  if (!c) return;
  tone(c, 392.0, 0.0, 0.5, 0.13, "sine");
  tone(c, 523.25, 0.0, 0.5, 0.13, "sine");
  tone(c, 659.25, 0.06, 0.55, 0.13, "sine");
  tone(c, 783.99, 0.14, 0.7, 0.11, "triangle");
}
