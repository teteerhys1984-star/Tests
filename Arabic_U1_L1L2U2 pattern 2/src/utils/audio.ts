/**
 * Two subtle, original Web Audio chimes.
 * No external audio files, no copyrighted material, no network requests.
 */

let sharedContext: AudioContext | null = null;

type AudioContextConstructor = typeof AudioContext;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor: AudioContextConstructor | undefined =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: AudioContextConstructor }).webkitAudioContext;
  if (!Ctor) return null;
  if (!sharedContext) sharedContext = new Ctor();
  if (sharedContext.state === "suspended") void sharedContext.resume();
  return sharedContext;
}

function note(
  ctx: AudioContext,
  frequency: number,
  delay: number,
  duration: number,
  volume: number,
  type: OscillatorType = "sine",
): void {
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, ctx.currentTime + delay);

  const startAt = ctx.currentTime + delay;
  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(volume, startAt + 0.035);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);

  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start(startAt);
  oscillator.stop(startAt + duration + 0.05);
}

/** Gentle rising arpeggio when the examination begins. */
export function playStartSound(): void {
  const ctx = getContext();
  if (!ctx) return;
  const notes = [
    { f: 523.25, t: 0.0, d: 1.1 },
    { f: 659.25, t: 0.12, d: 1.2 },
    { f: 783.99, t: 0.24, d: 1.3 },
    { f: 1046.5, t: 0.37, d: 1.5 },
  ];
  for (const { f, t, d } of notes) {
    note(ctx, f, t, d, 0.055, "sine");
    note(ctx, f * 2, t, d * 0.6, 0.012, "triangle");
  }
}

/** Soft, warm resolve when the examination is submitted. */
export function playSubmitSound(): void {
  const ctx = getContext();
  if (!ctx) return;
  const notes = [
    { f: 880.0, t: 0.0, d: 0.9 },
    { f: 659.25, t: 0.14, d: 1.0 },
    { f: 523.25, t: 0.28, d: 1.15 },
    { f: 392.0, t: 0.42, d: 1.6 },
  ];
  for (const { f, t, d } of notes) {
    note(ctx, f, t, d, 0.05, "sine");
    note(ctx, f * 0.5, t, d, 0.018, "triangle");
  }
}
