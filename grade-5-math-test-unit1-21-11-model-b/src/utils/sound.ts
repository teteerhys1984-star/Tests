/**
 * Locally embedded original sound effects for starting and submitting the exam.
 * Generates genuine in-memory WAV data URLs (zero external links) + Web Audio API playback.
 */

function createMelodyWavDataUrl(notes: Array<{ freq: number; durationMs: number; gain?: number }>): string {
  const sampleRate = 22050
  const totalSamples = notes.reduce(
    (sum, n) => sum + Math.floor((n.durationMs / 1000) * sampleRate),
    0
  )
  const buffer = new ArrayBuffer(44 + totalSamples * 2)
  const view = new DataView(buffer)

  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i))
    }
  }

  // RIFF WAV header
  writeStr(0, 'RIFF')
  view.setUint32(4, 36 + totalSamples * 2, true)
  writeStr(8, 'WAVE')
  writeStr(12, 'fmt ')
  view.setUint32(16, 16, true) // PCM chunk size
  view.setUint16(20, 1, true) // PCM format
  view.setUint16(22, 1, true) // Mono
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * 2, true)
  view.setUint16(32, 2, true)
  view.setUint16(34, 16, true)
  writeStr(36, 'data')
  view.setUint32(40, totalSamples * 2, true)

  let sampleOffset = 0
  for (const note of notes) {
    const count = Math.floor((note.durationMs / 1000) * sampleRate)
    const maxAmp = (note.gain ?? 0.35) * 32767
    for (let i = 0; i < count; i++) {
      const t = i / sampleRate
      // Smooth attack and exponential decay envelope for a warm chime sound
      const attack = Math.min(1, i / (sampleRate * 0.012))
      const decay = Math.exp((-4.2 * i) / count)
      const harmonic1 = Math.sin(2 * Math.PI * note.freq * t)
      const harmonic2 = 0.25 * Math.sin(2 * Math.PI * note.freq * 2 * t)
      const sample = Math.max(-32768, Math.min(32767, Math.round(maxAmp * attack * decay * (harmonic1 + harmonic2))))
      view.setInt16(44 + (sampleOffset + i) * 2, sample, true)
    }
    sampleOffset += count
  }

  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  if (typeof btoa === 'function') {
    return `data:audio/wav;base64,${btoa(binary)}`
  }
  return ''
}

let startExamWavUrl: string | null = null
let submitExamWavUrl: string | null = null

export function getStartSoundDataUrl(): string {
  if (!startExamWavUrl) {
    // Gentle ascending pastel chime: C5 -> E5 -> G5 -> C6
    startExamWavUrl = createMelodyWavDataUrl([
      { freq: 523.25, durationMs: 110, gain: 0.3 },
      { freq: 659.25, durationMs: 110, gain: 0.32 },
      { freq: 783.99, durationMs: 120, gain: 0.34 },
      { freq: 1046.5, durationMs: 260, gain: 0.36 },
    ])
  }
  return startExamWavUrl
}

export function getSubmitSoundDataUrl(): string {
  if (!submitExamWavUrl) {
    // Celebratory completion chime: F5 -> A5 -> C6 -> F6
    submitExamWavUrl = createMelodyWavDataUrl([
      { freq: 698.46, durationMs: 120, gain: 0.32 },
      { freq: 880.0, durationMs: 120, gain: 0.34 },
      { freq: 1046.5, durationMs: 140, gain: 0.36 },
      { freq: 1396.91, durationMs: 340, gain: 0.38 },
    ])
  }
  return submitExamWavUrl
}

export function playExamSound(kind: 'start' | 'submit', isMuted: boolean): void {
  if (isMuted || typeof window === 'undefined') return
  try {
    const url = kind === 'start' ? getStartSoundDataUrl() : getSubmitSoundDataUrl()
    if (url && typeof Audio !== 'undefined') {
      const audio = new Audio(url)
      audio.volume = 0.65
      void audio.play().catch(() => {
        // Ignore autoplay restrictions in headless environments
      })
    }
  } catch {
    // Safe fallback if audio context is unavailable
  }
}
