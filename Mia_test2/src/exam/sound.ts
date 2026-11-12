let audioContext: AudioContext | null = null;

type AudioContextConstructor = new () => AudioContext;

function getContext(): AudioContext | null {
  try {
    const globalWindow = window as typeof window & {
      webkitAudioContext?: AudioContextConstructor;
    };
    const Constructor =
      window.AudioContext ?? globalWindow.webkitAudioContext ?? null;
    if (!Constructor) return null;
    if (!audioContext || audioContext.state === "closed") {
      audioContext = new Constructor();
    }
    if (audioContext.state === "suspended") {
      void audioContext.resume().catch(() => undefined);
    }
    return audioContext;
  } catch {
    return null;
  }
}

function tone(
  ctx: AudioContext,
  frequency: number,
  startOffset: number,
  duration: number,
  volume: number,
  type: OscillatorType = "sine"
) {
  try {
    const start = ctx.currentTime + startOffset;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.05);
  } catch {
    // Audio must never interrupt the exam.
  }
}

/** Soft bell chord played once when the exam actually starts. */
export function playStartSound(): void {
  try {
    const ctx = getContext();
    if (!ctx) return;
    tone(ctx, 523.25, 0.02, 0.32, 0.055, "sine");
    tone(ctx, 659.25, 0.14, 0.35, 0.05, "sine");
    tone(ctx, 783.99, 0.26, 0.4, 0.045, "triangle");
    tone(ctx, 1046.5, 0.38, 0.42, 0.025, "sine");
  } catch {
    // Ignore audio failures.
  }
}

/** Distinct, gentle closing sound played once at final submission. */
export function playSubmitSound(): void {
  try {
    const ctx = getContext();
    if (!ctx) return;
    tone(ctx, 440, 0.02, 0.28, 0.05, "sine");
    tone(ctx, 554.37, 0.14, 0.3, 0.045, "sine");
    tone(ctx, 659.25, 0.26, 0.36, 0.045, "triangle");
    tone(ctx, 880, 0.4, 0.5, 0.03, "sine");
    tone(ctx, 1108.73, 0.52, 0.5, 0.018, "sine");
  } catch {
    // Ignore audio failures.
  }
}
