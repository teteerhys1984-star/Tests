/**
 * Original, locally synthesised exam sounds (Web Audio API).
 * No external audio URLs, no samples — every tone is generated on the fly.
 */

let ctx: AudioContext | null = null;
let muted = false;

function context(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor: typeof AudioContext | undefined =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!ctx) {
    try {
      ctx = new Ctor();
    } catch {
      return null;
    }
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

export function setMuted(value: boolean) {
  muted = value;
}

export function isMuted() {
  return muted;
}

type ToneOpts = {
  freq: number;
  start: number;
  dur: number;
  gain?: number;
  type?: OscillatorType;
  sweepTo?: number;
};

function tone(ac: AudioContext, { freq, start, dur, gain = 0.14, type = "sine", sweepTo }: ToneOpts) {
  const osc = ac.createOscillator();
  const amp = ac.createGain();
  const filter = ac.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 5200;

  osc.type = type;
  const t0 = ac.currentTime + start;
  osc.frequency.setValueAtTime(freq, t0);
  if (sweepTo) osc.frequency.exponentialRampToValueAtTime(Math.max(40, sweepTo), t0 + dur);

  amp.gain.setValueAtTime(0.0001, t0);
  amp.gain.exponentialRampToValueAtTime(gain, t0 + Math.min(0.05, dur * 0.3));
  amp.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

  osc.connect(filter);
  filter.connect(amp);
  amp.connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

/** Rising two-note chime — the exam has begun. */
export function playStart() {
  if (muted) return;
  const ac = context();
  if (!ac) return;
  tone(ac, { freq: 392, start: 0, dur: 0.5, type: "triangle", gain: 0.11 });
  tone(ac, { freq: 587.33, start: 0.1, dur: 0.55, type: "triangle", gain: 0.1 });
  tone(ac, { freq: 783.99, start: 0.21, dur: 0.7, type: "sine", gain: 0.08 });
}

/** Resolving cadence — the paper is handed in. */
export function playSubmit() {
  if (muted) return;
  const ac = context();
  if (!ac) return;
  tone(ac, { freq: 659.25, start: 0, dur: 0.34, type: "sine", gain: 0.1 });
  tone(ac, { freq: 493.88, start: 0.12, dur: 0.38, type: "sine", gain: 0.1 });
  tone(ac, { freq: 329.63, start: 0.25, dur: 0.85, type: "triangle", gain: 0.12 });
  tone(ac, { freq: 164.81, start: 0.25, dur: 0.9, type: "sine", gain: 0.07 });
}

/** Tiny tactile blip for navigation / selection. */
export function playTick() {
  if (muted) return;
  const ac = context();
  if (!ac) return;
  tone(ac, { freq: 1180, start: 0, dur: 0.075, type: "sine", gain: 0.045, sweepTo: 880 });
}

/** Short affirmation used by the report download button. */
export function playChime() {
  if (muted) return;
  const ac = context();
  if (!ac) return;
  tone(ac, { freq: 880, start: 0, dur: 0.22, type: "sine", gain: 0.07 });
  tone(ac, { freq: 1318.5, start: 0.08, dur: 0.3, type: "sine", gain: 0.05 });
}