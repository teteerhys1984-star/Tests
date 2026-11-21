/**
 * Original sound effects generated locally with the Web Audio API.
 * Nothing is loaded from the network.
 */

type Ctx = AudioContext;

let ctx: Ctx | null = null;

function getCtx(): Ctx | null {
  try {
    if (!ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(
  c: Ctx,
  freq: number,
  start: number,
  duration: number,
  type: OscillatorType = "sine",
  peak = 0.18,
) {
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(peak, start + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain).connect(c.destination);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

/** Short rising two-note chime: played when the exam starts. */
export function playStartSound(muted: boolean) {
  if (muted) return;
  const c = getCtx();
  if (!c) return;
  const t0 = c.currentTime + 0.01;
  tone(c, 523.25, t0, 0.18, "triangle"); // C5
  tone(c, 783.99, t0 + 0.14, 0.26, "triangle"); // G5
}

/** Distinct three-note resolving melody: played when the exam is submitted. */
export function playSubmitSound(muted: boolean) {
  if (muted) return;
  const c = getCtx();
  if (!c) return;
  const t0 = c.currentTime + 0.01;
  tone(c, 659.25, t0, 0.16, "sine", 0.16); // E5
  tone(c, 587.33, t0 + 0.15, 0.16, "sine", 0.16); // D5
  tone(c, 1046.5, t0 + 0.3, 0.45, "sine", 0.2); // C6
  tone(c, 523.25, t0 + 0.3, 0.45, "triangle", 0.08); // C5 undertone
}
