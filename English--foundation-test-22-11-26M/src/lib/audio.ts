import { loadMuted, saveMuted } from "./storage";

let context: AudioContext | null = null;
let muted = loadMuted();

export function isMuted(): boolean {
  return muted;
}

export function setMuted(value: boolean): void {
  muted = value;
  saveMuted(value);
}

function getContext(): AudioContext | null {
  try {
    if (!context) {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      context = new Ctor();
    }
    if (context.state === "suspended") void context.resume();
    return context;
  } catch {
    return null;
  }
}

function tone(
  ctx: AudioContext,
  frequency: number,
  start: number,
  duration: number,
  type: OscillatorType,
  volume: number,
): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(start);
  osc.stop(start + duration + 0.05);
}

/** Bright rising arpeggio played when the exam starts. */
export function playStartSound(): void {
  if (muted) return;
  const ctx = getContext();
  if (!ctx) return;
  const t = ctx.currentTime;
  const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
  notes.forEach((f, i) => tone(ctx, f, t + i * 0.11, 0.32, "triangle", 0.16));
}

/** Distinct four-note fanfare with a closing chord played on submission. */
export function playSubmitSound(): void {
  if (muted) return;
  const ctx = getContext();
  if (!ctx) return;
  const t = ctx.currentTime;
  const melody: Array<[number, number]> = [
    [392.0, 0],
    [523.25, 0.14],
    [659.25, 0.28],
    [783.99, 0.42],
  ];
  melody.forEach(([f, offset]) => tone(ctx, f, t + offset, 0.36, "triangle", 0.16));
  [523.25, 659.25, 783.99, 1046.5].forEach((f) => tone(ctx, f, t + 0.66, 0.95, "sine", 0.09));
}
