// Two separate, fully offline, synthesised sounds (Web Audio). Failures never break the exam.
let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
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

function tone(c: AudioContext, freq: number, start: number, dur: number, type: OscillatorType, vol: number) {
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, start);
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(vol, start + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  o.connect(g);
  g.connect(c.destination);
  o.start(start);
  o.stop(start + dur + 0.02);
}

/** Short, pleasant "block placed" chime — played once when the first question appears. */
export function playStart() {
  try {
    const c = getCtx();
    if (!c) return;
    const t = c.currentTime + 0.02;
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(c, f, t + i * 0.09, 0.16, "square", 0.07));
  } catch {
    /* ignore */
  }
}

/** Distinct "level complete" fanfare — played once on submission. */
export function playSubmit() {
  try {
    const c = getCtx();
    if (!c) return;
    const t = c.currentTime + 0.02;
    tone(c, 196, t, 0.22, "triangle", 0.16);
    tone(c, 261.63, t + 0.2, 0.22, "triangle", 0.16);
    tone(c, 329.63, t + 0.4, 0.22, "triangle", 0.16);
    [392, 493.88, 587.33].forEach((f) => tone(c, f, t + 0.62, 0.7, "sawtooth", 0.06));
    tone(c, 783.99, t + 0.62, 0.7, "triangle", 0.1);
  } catch {
    /* ignore */
  }
}
