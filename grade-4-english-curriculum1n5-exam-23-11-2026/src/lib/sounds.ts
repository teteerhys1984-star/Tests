/**
 * Original, locally generated UI sounds via the Web Audio API.
 * Nothing is fetched from any server; every sound is synthesised on-device.
 */

let ctx: AudioContext | null = null;

function audioContext(): AudioContext | null {
  try {
    if (!ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

interface Note {
  freq: number;
  offset: number; // seconds from start
  duration: number;
  type?: OscillatorType;
  peak?: number;
}

function playNotes(notes: Note[]): void {
  const ac = audioContext();
  if (!ac) return;
  const t0 = ac.currentTime + 0.02;
  for (const note of notes) {
    const start = t0 + note.offset;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = note.type ?? 'sine';
    osc.frequency.setValueAtTime(note.freq, start);

    const peak = note.peak ?? 0.16;
    const attack = 0.012;
    const end = start + note.duration;

    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(peak, start + attack);
    gain.gain.exponentialRampToValueAtTime(peak * 0.55, start + note.duration * 0.55);
    gain.gain.exponentialRampToValueAtTime(0.0001, end);

    osc.connect(gain).connect(ac.destination);
    osc.start(start);
    osc.stop(end + 0.05);
  }
}

/** Bright ascending chime played when the exam starts. */
export function playStartSound(): void {
  playNotes([
    { freq: 523.25, offset: 0.0, duration: 0.32, type: 'triangle', peak: 0.16 }, // C5
    { freq: 659.25, offset: 0.12, duration: 0.32, type: 'triangle', peak: 0.16 }, // E5
    { freq: 783.99, offset: 0.24, duration: 0.4, type: 'triangle', peak: 0.17 }, // G5
    { freq: 1046.5, offset: 0.36, duration: 0.62, type: 'sine', peak: 0.2 }, // C6 shimmer
    { freq: 2093.0, offset: 0.36, duration: 0.5, type: 'sine', peak: 0.05 }, // octave sparkle
  ]);
}

/** Warm cadence played the moment the exam is submitted. */
export function playSubmitSound(): void {
  playNotes([
    { freq: 392.0, offset: 0.0, duration: 0.35, type: 'sine', peak: 0.18 }, // G4
    { freq: 523.25, offset: 0.16, duration: 0.35, type: 'sine', peak: 0.18 }, // C5
    { freq: 659.25, offset: 0.32, duration: 0.35, type: 'sine', peak: 0.18 }, // E5
    { freq: 783.99, offset: 0.48, duration: 0.9, type: 'triangle', peak: 0.22 }, // G5 resolve
    { freq: 1567.98, offset: 0.48, duration: 0.7, type: 'sine', peak: 0.06 }, // sparkle
  ]);
}

/** Small soft pop for navigation between questions (used sparingly). */
export function playSoftTick(): void {
  playNotes([{ freq: 880, offset: 0, duration: 0.08, type: 'sine', peak: 0.05 }]);
}
