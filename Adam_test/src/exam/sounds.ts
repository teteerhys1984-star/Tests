/**
 * Two separate, fully offline sounds synthesized as small WAV data URIs.
 * No external audio files, no network, no speech.
 * Any audio failure is swallowed so the exam keeps working.
 */

function base64FromBytes(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...Array.from(bytes.subarray(i, i + chunk)));
  }
  return btoa(binary);
}

function writeAscii(view: DataView, offset: number, text: string): void {
  for (let i = 0; i < text.length; i += 1) view.setUint8(offset + i, text.charCodeAt(i));
}

function encodeWav(samples: Float32Array, sampleRate: number): string {
  const bytesPerSample = 2;
  const dataLength = samples.length * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataLength);
  const view = new DataView(buffer);
  writeAscii(view, 0, "RIFF");
  view.setUint32(4, 36 + dataLength, true);
  writeAscii(view, 8, "WAVE");
  writeAscii(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * bytesPerSample, true);
  view.setUint16(32, bytesPerSample, true);
  view.setUint16(34, 16, true);
  writeAscii(view, 36, "data");
  view.setUint32(40, dataLength, true);
  let offset = 44;
  for (let i = 0; i < samples.length; i += 1) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }
  return `data:audio/wav;base64,${base64FromBytes(new Uint8Array(buffer))}`;
}

type Note = { freq: number; start: number; duration: number; volume?: number; harmonic?: number };

function synthesize(notes: Note[], totalSeconds: number, sampleRate = 22050): string {
  const samples = new Float32Array(Math.ceil(totalSeconds * sampleRate));
  for (const note of notes) {
    const start = Math.floor(note.start * sampleRate);
    const length = Math.floor(note.duration * sampleRate);
    const volume = note.volume ?? 0.2;
    for (let i = 0; i < length && start + i < samples.length; i += 1) {
      const t = i / sampleRate;
      const attack = Math.min(1, i / (0.012 * sampleRate));
      const release = Math.min(1, (length - i) / (0.09 * sampleRate));
      const envelope = attack * Math.max(0, release);
      const fundamental = Math.sin(2 * Math.PI * note.freq * t);
      const harmonic = Math.sin(2 * Math.PI * note.freq * 2 * t) * (note.harmonic ?? 0.18);
      const gentle = Math.sin(2 * Math.PI * note.freq * 0.5 * t) * 0.08;
      samples[start + i] += volume * envelope * (fundamental + harmonic + gentle);
    }
  }
  return encodeWav(samples, sampleRate);
}

let startSound: string | null = null;
let submitSound: string | null = null;

function getStartSound(): string {
  if (!startSound) {
    startSound = synthesize(
      [
        { freq: 523.25, start: 0.0, duration: 0.16, volume: 0.16 },
        { freq: 659.25, start: 0.14, duration: 0.16, volume: 0.16 },
        { freq: 783.99, start: 0.28, duration: 0.18, volume: 0.17 },
        { freq: 1046.5, start: 0.44, duration: 0.28, volume: 0.15, harmonic: 0.1 },
      ],
      0.8
    );
  }
  return startSound;
}

function getSubmitSound(): string {
  if (!submitSound) {
    submitSound = synthesize(
      [
        { freq: 392.0, start: 0.0, duration: 0.14, volume: 0.15 },
        { freq: 523.25, start: 0.12, duration: 0.14, volume: 0.16 },
        { freq: 659.25, start: 0.24, duration: 0.14, volume: 0.17 },
        { freq: 783.99, start: 0.36, duration: 0.14, volume: 0.18 },
        { freq: 1046.5, start: 0.48, duration: 0.38, volume: 0.2, harmonic: 0.22 },
        { freq: 523.25, start: 0.48, duration: 0.38, volume: 0.12 },
        { freq: 1567.98, start: 0.62, duration: 0.24, volume: 0.07, harmonic: 0.05 },
      ],
      1.0
    );
  }
  return submitSound;
}

function playDataUri(uri: string, volume: number): void {
  try {
    const audio = new Audio(uri);
    audio.volume = volume;
    const result = audio.play();
    if (result && typeof result.catch === "function") result.catch(() => undefined);
  } catch {
    // Audio is decorative; never let it interrupt the exam.
  }
}

export function playStartSound(): void {
  try {
    playDataUri(getStartSound(), 0.5);
  } catch {
    // ignore
  }
}

export function playSubmitSound(): void {
  try {
    playDataUri(getSubmitSound(), 0.55);
  } catch {
    // ignore
  }
}
