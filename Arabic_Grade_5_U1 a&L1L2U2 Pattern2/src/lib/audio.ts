let audioContext: AudioContext | null = null;

const getAudioContext = (): AudioContext | null => {
  if (typeof window === "undefined") return null;
  const AudioContextConstructor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextConstructor) return null;
  if (!audioContext) audioContext = new AudioContextConstructor();
  if (audioContext.state === "suspended") {
    void audioContext.resume();
  }
  return audioContext;
};

type Tone = { frequency: number; start: number; duration: number; volume?: number };

const playTones = (tones: Tone[], type: OscillatorType = "sine"): void => {
  const context = getAudioContext();
  if (!context) return;

  tones.forEach((tone) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const startAt = context.currentTime + tone.start;
    const endAt = startAt + tone.duration;
    const peak = tone.volume ?? 0.12;

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(tone.frequency, startAt);
    gain.gain.setValueAtTime(0.0001, startAt);
    gain.gain.exponentialRampToValueAtTime(peak, startAt + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, endAt);

    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(startAt);
    oscillator.stop(endAt + 0.03);
  });
};

export const playStartSound = (): void => {
  playTones(
    [
      { frequency: 523.25, start: 0, duration: 0.22, volume: 0.1 },
      { frequency: 659.25, start: 0.12, duration: 0.24, volume: 0.1 },
      { frequency: 783.99, start: 0.24, duration: 0.34, volume: 0.11 },
    ],
    "sine",
  );
};

export const playSubmitSound = (): void => {
  playTones(
    [
      { frequency: 783.99, start: 0, duration: 0.2, volume: 0.09 },
      { frequency: 659.25, start: 0.11, duration: 0.22, volume: 0.09 },
      { frequency: 523.25, start: 0.22, duration: 0.24, volume: 0.09 },
      { frequency: 1046.5, start: 0.38, duration: 0.4, volume: 0.08 },
    ],
    "triangle",
  );
};
