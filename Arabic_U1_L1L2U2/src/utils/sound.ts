/** Original, locally synthesised chimes via the Web Audio API (no external files). */
let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = ctx ?? new AC();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(c: AudioContext, freq: number, start: number, dur: number, vol = 0.12) {
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = 'sine';
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(vol, start + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  osc.connect(gain).connect(c.destination);
  osc.start(start);
  osc.stop(start + dur + 0.05);
}

/** Gentle rising arpeggio (C major) – start of exam. */
export function playStartSound() {
  const c = getCtx();
  if (!c) return;
  const t = c.currentTime + 0.02;
  [523.25, 659.25, 783.99].forEach((f, i) => tone(c, f, t + i * 0.12, 0.5));
}

/** Soft bell-like resolution – exam submitted. */
export function playSubmitSound() {
  const c = getCtx();
  if (!c) return;
  const t = c.currentTime + 0.02;
  [783.99, 659.25, 880, 1046.5].forEach((f, i) => tone(c, f, t + i * 0.14, 0.7, 0.1));
}
