/**
 * Two short, original sounds synthesised in the browser — no audio files, no
 * network requests. The start sound is a rising three-note chime; the submit
 * sound is a soft two-note "pencil down" drop.
 */

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor: typeof AudioContext | undefined =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!ctx) ctx = new Ctor();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

interface ToneOpts {
  freq: number;
  start: number;
  dur: number;
  gain?: number;
  type?: OscillatorType;
}

function tone(c: AudioContext, { freq, start, dur, gain = 0.16, type = "sine" }: ToneOpts) {
  const osc = c.createOscillator();
  const amp = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  const t0 = c.currentTime + start;
  amp.gain.setValueAtTime(0.0001, t0);
  amp.gain.exponentialRampToValueAtTime(gain, t0 + 0.02);
  amp.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(amp).connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

export function playStartSound(): void {
  try {
    const c = getCtx();
    if (!c) return;
    tone(c, { freq: 523.25, start: 0, dur: 0.28, gain: 0.15, type: "triangle" });
    tone(c, { freq: 659.25, start: 0.11, dur: 0.28, gain: 0.15, type: "triangle" });
    tone(c, { freq: 783.99, start: 0.22, dur: 0.5, gain: 0.17, type: "triangle" });
    tone(c, { freq: 1046.5, start: 0.22, dur: 0.5, gain: 0.07, type: "sine" });
  } catch {
    /* sound is a nicety — never block the exam */
  }
}

export function playSubmitSound(): void {
  try {
    const c = getCtx();
    if (!c) return;
    tone(c, { freq: 783.99, start: 0, dur: 0.22, gain: 0.15, type: "triangle" });
    tone(c, { freq: 587.33, start: 0.1, dur: 0.3, gain: 0.15, type: "triangle" });
    tone(c, { freq: 392.0, start: 0.2, dur: 0.55, gain: 0.13, type: "sine" });
  } catch {
    /* ignore */
  }
}
