/**
 * Original, generated start / submit sounds (WebAudio — no audio files, no
 * external requests). These are interface chimes only; they are NOT exam
 * content and no question depends on them.
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

function tone(
  ac: AudioContext,
  freq: number,
  start: number,
  duration: number,
  gainValue: number,
  type: OscillatorType = "triangle"
): void {
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ac.currentTime + start);
  gain.gain.setValueAtTime(0.0001, ac.currentTime + start);
  gain.gain.exponentialRampToValueAtTime(gainValue, ac.currentTime + start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + start + duration);
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start(ac.currentTime + start);
  osc.stop(ac.currentTime + start + duration + 0.05);
}

/** Short rising three-note chime when the exam begins. */
export function playStartSound(): void {
  try {
    const ac = getCtx();
    if (!ac) return;
    tone(ac, 523.25, 0.0, 0.16, 0.22);
    tone(ac, 659.25, 0.12, 0.16, 0.22);
    tone(ac, 783.99, 0.24, 0.3, 0.24);
    tone(ac, 1046.5, 0.36, 0.34, 0.16, "sine");
  } catch {
    /* audio is a nicety only */
  }
}

/** Short bright two-beat fanfare when the exam is submitted. */
export function playSubmitSound(): void {
  try {
    const ac = getCtx();
    if (!ac) return;
    tone(ac, 783.99, 0.0, 0.14, 0.22, "square");
    tone(ac, 987.77, 0.1, 0.14, 0.2, "square");
    tone(ac, 1174.66, 0.2, 0.36, 0.2, "triangle");
    tone(ac, 1567.98, 0.3, 0.4, 0.12, "sine");
  } catch {
    /* audio is a nicety only */
  }
}

/** Tiny tick while answering (kept very quiet). */
export function playTickSound(): void {
  try {
    const ac = getCtx();
    if (!ac) return;
    tone(ac, 880, 0, 0.05, 0.06, "sine");
  } catch {
    /* ignore */
  }
}
