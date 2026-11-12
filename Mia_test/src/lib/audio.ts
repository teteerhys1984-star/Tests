/**
 * Two tiny offline sounds generated with the Web Audio API.
 * No audio files, network calls or narration. Every call is guarded so that
 * an audio failure can never interrupt the examination.
 */

let audioContext: AudioContext | null = null;

function getContext(): AudioContext | null {
  try {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    if (!audioContext) audioContext = new Ctor();
    if (audioContext.state === "suspended") void audioContext.resume();
    return audioContext;
  } catch {
    return null;
  }
}

function playNote(
  ctx: AudioContext,
  frequency: number,
  start: number,
  duration: number,
  gainValue: number,
  type: OscillatorType,
): void {
  try {
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime + start);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime + start);
    gain.gain.exponentialRampToValueAtTime(gainValue, ctx.currentTime + start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + duration);
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start(ctx.currentTime + start);
    oscillator.stop(ctx.currentTime + start + duration + 0.03);
  } catch {
    /* silent failure — audio is never essential */
  }
}

/** Soft magical chime played once when the first question is shown. */
export function playStartSound(): void {
  try {
    const ctx = getContext();
    if (!ctx) return;
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, i) => playNote(ctx, freq, i * 0.11, 0.42, i === 3 ? 0.1 : 0.075, "sine"));
  } catch {
    /* no interruption */
  }
}

/** Distinct, warm closing arpeggio played once on final submission. */
export function playSubmitSound(): void {
  try {
    const ctx = getContext();
    if (!ctx) return;
    const notes = [783.99, 659.25, 523.25, 392.0];
    notes.forEach((freq, i) =>
      playNote(ctx, freq, i * 0.13, i === notes.length - 1 ? 0.7 : 0.4, 0.08, "triangle"),
    );
  } catch {
    /* no interruption */
  }
}
