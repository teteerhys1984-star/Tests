/**
 * Web Audio API synthesizer for native exam sound effects.
 * Zero external dependencies or network requests.
 * Audio failure is caught safely and will never interrupt exam flow.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  try {
    if (!audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        audioCtx = new AudioCtxClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  } catch {
    return null;
  }
}

/**
 * Exam Start Sound:
 * A crisp, inspiring dual-tone harmonic chime (C5 -> E5 -> G5)
 */
export function playExamStartSound(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5

    notes.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + index * 0.1);

      gain.gain.setValueAtTime(0.001, now + index * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.18, now + index * 0.1 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.1 + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + index * 0.1);
      osc.stop(now + index * 0.1 + 0.5);
    });
  } catch {
    // Graceful fallback
  }
}

/**
 * Final Submission Sound:
 * A triumphant, celebratory multi-chord crescendo (G4 -> C5 -> E5 -> G5 -> C6)
 */
export function playExamSubmitSound(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const chords = [
      { freq: 392.00, start: 0.0, dur: 0.3, vol: 0.15 }, // G4
      { freq: 523.25, start: 0.1, dur: 0.35, vol: 0.2 }, // C5
      { freq: 659.25, start: 0.2, dur: 0.4, vol: 0.2 }, // E5
      { freq: 783.99, start: 0.3, dur: 0.5, vol: 0.25 }, // G5
      { freq: 1046.50, start: 0.4, dur: 0.8, vol: 0.3 }  // C6
    ];

    chords.forEach(({ freq, start, dur, vol }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + start);

      gain.gain.setValueAtTime(0.001, now + start);
      gain.gain.exponentialRampToValueAtTime(vol, now + start + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + start + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + start);
      osc.stop(now + start + dur + 0.05);
    });
  } catch {
    // Graceful fallback
  }
}
