/**
 * Locally embedded original chime sound effects (start & submit).
 * Generates tiny 16-bit mono PCM WAV data URIs directly in memory so zero
 * external audio URLs or copyrighted tracks are ever used.
 */

interface NoteEvent {
  freq: number;
  startSec: number;
  durationSec: number;
  gain: number;
}

function encodeWavBase64(notes: NoteEvent[], totalSec: number): string {
  const sampleRate = 22050;
  const numSamples = Math.floor(sampleRate * totalSec);
  const pcm = new Int16Array(numSamples);

  for (const note of notes) {
    const startIdx = Math.floor(note.startSec * sampleRate);
    const len = Math.floor(note.durationSec * sampleRate);
    for (let i = 0; i < len && startIdx + i < numSamples; i++) {
      const t = i / sampleRate;
      const attack = Math.min(1, t / 0.012);
      const decay = Math.exp(-t * 5.2);
      const env = attack * decay * note.gain;
      // Warm marimba-bell harmonic blend
      const fundamental = Math.sin(2 * Math.PI * note.freq * t);
      const harmonic2 = 0.28 * Math.sin(2 * Math.PI * note.freq * 2 * t);
      const harmonic3 = 0.08 * Math.sin(2 * Math.PI * note.freq * 3 * t);
      const sample = (fundamental + harmonic2 + harmonic3) * env;
      const mixed = pcm[startIdx + i] / 32767 + sample;
      const clamped = Math.max(-0.95, Math.min(0.95, mixed));
      pcm[startIdx + i] = Math.round(clamped * 32767);
    }
  }

  const dataBytes = numSamples * 2;
  const buffer = new ArrayBuffer(44 + dataBytes);
  const view = new DataView(buffer);

  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + dataBytes, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true); // PCM chunk size
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, 'data');
  view.setUint32(40, dataBytes, true);

  for (let i = 0; i < numSamples; i++) {
    view.setInt16(44 + i * 2, pcm[i], true);
  }

  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return `data:audio/wav;base64,${btoa(binary)}`;
}

let cachedStartUri: string | null = null;
let cachedSubmitUri: string | null = null;

function getStartSoundUri(): string {
  if (!cachedStartUri) {
    // Cheerful ascending C5 – E5 – G5 – C6 chime
    cachedStartUri = encodeWavBase64(
      [
        { freq: 523.25, startSec: 0.0, durationSec: 0.26, gain: 0.36 },
        { freq: 659.25, startSec: 0.1, durationSec: 0.26, gain: 0.36 },
        { freq: 783.99, startSec: 0.2, durationSec: 0.28, gain: 0.38 },
        { freq: 1046.5, startSec: 0.31, durationSec: 0.42, gain: 0.42 },
      ],
      0.78
    );
  }
  return cachedStartUri;
}

function getSubmitSoundUri(): string {
  if (!cachedSubmitUri) {
    // Distinct warm completion fanfare: G4 – C5 – E5 – G5 + bright C6 chord
    cachedSubmitUri = encodeWavBase64(
      [
        { freq: 392.0, startSec: 0.0, durationSec: 0.24, gain: 0.34 },
        { freq: 523.25, startSec: 0.11, durationSec: 0.25, gain: 0.35 },
        { freq: 659.25, startSec: 0.22, durationSec: 0.28, gain: 0.36 },
        { freq: 783.99, startSec: 0.34, durationSec: 0.55, gain: 0.3 },
        { freq: 1046.5, startSec: 0.46, durationSec: 0.6, gain: 0.36 },
        { freq: 659.25, startSec: 0.46, durationSec: 0.55, gain: 0.22 },
      ],
      1.1
    );
  }
  return cachedSubmitUri;
}

function playDataUri(uri: string): void {
  if (typeof window === 'undefined' || typeof Audio === 'undefined') return;
  try {
    const audio = new Audio(uri);
    audio.volume = 0.7;
    const promise = audio.play();
    if (promise && typeof promise.catch === 'function') {
      promise.catch(() => {
        // Ignore browser autoplay restrictions silently
      });
    }
  } catch {
    // Ignore audio errors silently
  }
}

export function playExamStartSound(muted: boolean): void {
  if (muted) return;
  playDataUri(getStartSoundUri());
}

export function playExamSubmitSound(muted: boolean): void {
  if (muted) return;
  playDataUri(getSubmitSoundUri());
}
