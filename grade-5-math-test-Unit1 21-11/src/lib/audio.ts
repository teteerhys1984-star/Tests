/**
 * Bundled sound cues (original WAV files generated for this project, embedded by Vite).
 * The mute preference is stored in localStorage.
 */
import startCue from '../assets/sounds/start.wav'
import submitCue from '../assets/sounds/submit.wav'

const MUTE_KEY = 'arena-math-muted-v1'

export function isMuted(): boolean {
  try {
    return window.localStorage.getItem(MUTE_KEY) === '1'
  } catch {
    return false
  }
}

export function setMuted(muted: boolean): void {
  try {
    window.localStorage.setItem(MUTE_KEY, muted ? '1' : '0')
  } catch {
    /* ignore */
  }
}

export function playCue(kind: 'start' | 'submit'): void {
  if (isMuted()) return
  try {
    const audio = new Audio(kind === 'start' ? startCue : submitCue)
    audio.volume = 0.7
    void audio.play().catch(() => undefined)
  } catch {
    /* audio is optional */
  }
}
