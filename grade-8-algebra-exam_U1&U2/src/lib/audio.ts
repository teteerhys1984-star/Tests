/**
 * Two short, distinct cues generated locally with the Web Audio API.
 * No external audio, no network. All failures are swallowed so the exam
 * continues even when autoplay/audio is unavailable.
 */
let sharedContext: AudioContext | null = null;

type AudioContextConstructor = new () => AudioContext;

function getContext(): AudioContext | null {
  try {
    const Ctor: AudioContextConstructor | undefined =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: AudioContextConstructor }).webkitAudioContext;
    if (!Ctor) return null;
    if (!sharedContext) sharedContext = new Ctor();
    if (sharedContext.state === 'suspended') {
      void sharedContext.resume().catch(() => undefined);
    }
    return sharedContext;
  } catch {
    return null;
  }
}

function tone(
  ctx: AudioContext,
  frequency: number,
  startAt: number,
  duration: number,
  peak: number,
  type: OscillatorType,
) {
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, startAt);
  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(peak, startAt + 0.025);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start(startAt);
  oscillator.stop(startAt + duration + 0.03);
}

/** Ascending, airy three-note cue when the first question appears. */
export function playStartCue(): boolean {
  try {
    const ctx = getContext();
    if (!ctx) return false;
    const now = ctx.currentTime + 0.02;
    tone(ctx, 523.25, now, 0.32, 0.045, 'sine');
    tone(ctx, 659.25, now + 0.11, 0.34, 0.038, 'sine');
    tone(ctx, 783.99, now + 0.22, 0.5, 0.03, 'triangle');
    return true;
  } catch {
    return false;
  }
}

/** Calm, descending two-note cue on final submission. */
export function playSubmitCue(): boolean {
  try {
    const ctx = getContext();
    if (!ctx) return false;
    const now = ctx.currentTime + 0.02;
    tone(ctx, 659.25, now, 0.3, 0.038, 'sine');
    tone(ctx, 440, now + 0.14, 0.45, 0.034, 'sine');
    tone(ctx, 329.63, now + 0.28, 0.55, 0.026, 'triangle');
    return true;
  } catch {
    return false;
  }
}
