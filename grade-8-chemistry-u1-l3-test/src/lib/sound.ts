const active = new Set<AudioContext>();
/** Original short synthesized motifs. No audio files or external requests. */
export function playExamSound(kind: 'start' | 'submit', muted: boolean): void {
  if (muted || typeof window === 'undefined' || !window.AudioContext) return;
  try {
    const context = new AudioContext();
    active.add(context);
    const master = context.createGain();
    master.gain.value = 0.28;
    master.connect(context.destination);
    const notes = kind === 'start' ? [523.25, 659.25, 783.99] : [659.25, 783.99, 1046.5, 1318.51];
    void context.resume().catch(() => undefined);
    notes.forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const envelope = context.createGain();
      const start = context.currentTime + index * 0.115;
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(frequency, start);
      envelope.gain.setValueAtTime(0.0001, start);
      envelope.gain.exponentialRampToValueAtTime(0.2, start + 0.018);
      envelope.gain.exponentialRampToValueAtTime(0.0001, start + 0.48);
      oscillator.connect(envelope);
      envelope.connect(master);
      oscillator.start(start);
      oscillator.stop(start + 0.5);
      oscillator.onended = () => { oscillator.disconnect(); envelope.disconnect(); };
    });
    window.setTimeout(() => { master.disconnect(); void context.close().catch(() => undefined); active.delete(context); }, 1200);
  } catch { /* Sound is optional; the exam never depends on audio availability. */ }
}
export function stopAllSounds(): void {
  for (const context of active) { void context.close().catch(() => undefined); }
  active.clear();
}
