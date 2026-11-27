import startUrl from '../assets/sounds/start.wav'
import submitUrl from '../assets/sounds/submit.wav'

export function playSound(kind: 'start' | 'submit', muted: boolean) {
  if (muted) return
  try {
    const audio = new Audio(kind === 'start' ? startUrl : submitUrl)
    audio.volume = 0.7
    void audio.play().catch(() => {})
  } catch {
    /* ignore */
  }
}
