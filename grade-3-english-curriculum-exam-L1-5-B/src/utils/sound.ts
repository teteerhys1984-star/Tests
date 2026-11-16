/**
 * Original, locally embedded sound effects generated as in-memory PCM WAV data URIs.
 * Zero external audio URLs and zero copyrighted recordings are used.
 */

interface ToneNote {
  freq: number;
  startSec: number;
  durationSec: number;
  gain: number;
}

function buildWavDataUri(notes: ToneNote[], totalSec: number): string {
  const sampleRate = 22050;
  const numSamples = Math.floor(sampleRate * totalSec);
  const pcm = new Int16Array(numSamples);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    let sample = 0;

    for (const note of notes) {
      if (t >= note.startSec && t <= note.startSec + note.durationSec) {
        const localT = t - note.startSec;
        const attack = Math.min(1, localT / 0.015);
        const decay = Math.exp((-4.2 * localT) / note.durationSec);
        const env = attack * decay;
        // Soft bell-like fundamental + gentle octave harmonic
        const wave =
          Math.sin(2 * Math.PI * note.freq * localT) * 0.82 +
          Math.sin(2 * Math.PI * note.freq * 2 * localT) * 0.18;
        sample += wave * env * note.gain;
      }
    }

    const clamped = Math.max(-0.95, Math.min(0.95, sample));
    pcm[i] = Math.round(clamped * 32767);
  }

  const dataByteLen = pcm.length * 2;
  const buffer = new ArrayBuffer(44 + dataByteLen);
  const view = new DataView(buffer);

  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeStr(0, "RIFF");
  view.setUint32(4, 36 + dataByteLen, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true); // PCM chunk size
  view.setUint16(20, 1, true); // Audio format = PCM
  view.setUint16(22, 1, true); // Mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // Byte rate
  view.setUint16(32, 2, true); // Block align
  view.setUint16(34, 16, true); // Bits per sample
  writeStr(36, "data");
  view.setUint32(40, dataByteLen, true);

  for (let i = 0; i < pcm.length; i++) {
    view.setInt16(44 + i * 2, pcm[i], true);
  }

  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 4096;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return `data:audio/wav;base64,${btoa(binary)}`;
}

let startSoundUri: string | null = null;
let submitSoundUri: string | null = null;

function getStartSoundUri(): string {
  if (!startSoundUri) {
    // Cheerful ascending C5 → E5 → G5 start chime
    startSoundUri = buildWavDataUri(
      [
        { freq: 523.25, startSec: 0.0, durationSec: 0.22, gain: 0.36 },
        { freq: 659.25, startSec: 0.11, durationSec: 0.24, gain: 0.36 },
        { freq: 783.99, startSec: 0.22, durationSec: 0.34, gain: 0.4 },
      ],
      0.6
    );
  }
  return startSoundUri;
}

function getSubmitSoundUri(): string {
  if (!submitSoundUri) {
    // Distinct warm completion flourish: G4 → C5 → E5 → G5 + C6
    submitSoundUri = buildWavDataUri(
      [
        { freq: 392.0, startSec: 0.0, durationSec: 0.2, gain: 0.32 },
        { freq: 523.25, startSec: 0.1, durationSec: 0.22, gain: 0.34 },
        { freq: 659.25, startSec: 0.2, durationSec: 0.26, gain: 0.34 },
        { freq: 783.99, startSec: 0.32, durationSec: 0.44, gain: 0.3 },
        { freq: 1046.5, startSec: 0.32, durationSec: 0.48, gain: 0.28 },
      ],
      0.84
    );
  }
  return submitSoundUri;
}

function playDataUri(uri: string): void {
  if (typeof window === "undefined" || typeof Audio === "undefined") return;
  try {
    const audio = new Audio(uri);
    audio.volume = 0.7;
    const playPromise = audio.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {
        // Ignore browser autoplay restrictions safely
      });
    }
  } catch {
    // Ignore unsupported audio environment
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
