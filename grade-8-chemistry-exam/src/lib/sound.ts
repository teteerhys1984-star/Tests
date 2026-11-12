/* Two short, pleasant sounds generated locally with the Web Audio API.
   No external files, endpoints, or audio elements are required. Failure is silent. */

let context: AudioContext | null = null;

const getContext = (): AudioContext | null => {
  try {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    if (!context) context = new Ctor();
    if (context.state === "suspended") void context.resume();
    return context;
  } catch {
    return null;
  }
};

const tone = (
  ctx: AudioContext,
  frequency: number,
  start: number,
  duration: number,
  peak: number,
  type: OscillatorType,
) => {
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(peak, start + 0.025);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.03);
};

export const playStartSound = (): void => {
  try {
    const ctx = getContext();
    if (!ctx) return;
    const t = ctx.currentTime + 0.03;
    tone(ctx, 659.25, t, 0.22, 0.09, "sine");
    tone(ctx, 880.0, t + 0.13, 0.26, 0.075, "sine");
  } catch {
    /* Audio failure must never prevent the examination from working. */
  }
};

export const playSubmissionSound = (): void => {
  try {
    const ctx = getContext();
    if (!ctx) return;
    const t = ctx.currentTime + 0.03;
    tone(ctx, 523.25, t, 0.2, 0.07, "triangle");
    tone(ctx, 659.25, t + 0.12, 0.2, 0.07, "triangle");
    tone(ctx, 783.99, t + 0.24, 0.24, 0.07, "triangle");
    tone(ctx, 1046.5, t + 0.37, 0.42, 0.055, "sine");
  } catch {
    /* Silent failure is intentional. */
  }
};
