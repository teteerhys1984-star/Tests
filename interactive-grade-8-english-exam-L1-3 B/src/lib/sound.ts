/**
 * Original, locally generated start / submit sounds (Web Audio API).
 * Nothing is fetched from the network.
 */

let ctx: AudioContext | null = null;

function audio(): AudioContext | null {
  try {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctor) return null;
    if (!ctx) ctx = new Ctor();
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(
  ac: AudioContext,
  freq: number,
  start: number,
  duration: number,
  gain = 0.16,
  type: OscillatorType = "triangle",
) {
  const osc = ac.createOscillator();
  const amp = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ac.currentTime + start);
  amp.gain.setValueAtTime(0.0001, ac.currentTime + start);
  amp.gain.exponentialRampToValueAtTime(gain, ac.currentTime + start + 0.02);
  amp.gain.exponentialRampToValueAtTime(
    0.0001,
    ac.currentTime + start + duration,
  );
  osc.connect(amp);
  amp.connect(ac.destination);
  osc.start(ac.currentTime + start);
  osc.stop(ac.currentTime + start + duration + 0.05);
}

/** Bright ascending chime when the exam begins. */
export function playStartSound(): void {
  const ac = audio();
  if (!ac) return;
  tone(ac, 523.25, 0.0, 0.18); // C5
  tone(ac, 659.25, 0.12, 0.18); // E5
  tone(ac, 783.99, 0.24, 0.2); // G5
  tone(ac, 1046.5, 0.36, 0.34); // C6
}

/** Two-note flourish with a soft shimmer when the exam is submitted. */
export function playSubmitSound(): void {
  const ac = audio();
  if (!ac) return;
  tone(ac, 880, 0.0, 0.16, 0.14, "sine");
  tone(ac, 1174.66, 0.1, 0.22, 0.14, "sine");
  tone(ac, 1567.98, 0.2, 0.4, 0.1, "triangle");
  tone(ac, 587.33, 0.0, 0.3, 0.08, "sine");
}
