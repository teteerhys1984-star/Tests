/**
 * مؤثران صوتيان مولّدان محلياً عبر Web Audio API (لا ملفات خارجية، لا إنترنت).
 * المصدر الأصلي في مجلد grade-5-math-test-Unit1 21-11 كان يستورد ملفات WAV غير موجودة
 * (src/assets/sounds/*.wav)، وهو ما كان يمنع البناء. استُبدل الاستيراد بتوليد النغمة
 * نفسها برمجياً — إصلاح تقني لا يمسّ أي محتوى تعليمي.
 */
import { EXAM_ID } from '../config'

const MUTE_KEY = `${EXAM_ID}-muted-v1`

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
    /* لا شيء */
  }
}

let ctx: AudioContext | null = null
let current: HTMLAudioElement | null = null

function getCtx(): AudioContext | null {
  try {
    const AC: typeof AudioContext | undefined =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AC) return null
    if (!ctx) ctx = new AC()
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx
  } catch {
    return null
  }
}

type Tone = { freq: number; at: number; dur: number }

/** يعزف نغمة قصيرة؛ يعيد false بهدوء إن كان الصوت غير متاح. */
function playTones(tones: Tone[], gainValue: number): boolean {
  const ac = getCtx()
  if (!ac) return false
  try {
    const t0 = ac.currentTime + 0.02
    const master = ac.createGain()
    master.gain.value = gainValue
    master.connect(ac.destination)
    for (const t of tones) {
      const osc = ac.createOscillator()
      const g = ac.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(t.freq, t0 + t.at)
      g.gain.setValueAtTime(0.0001, t0 + t.at)
      g.gain.exponentialRampToValueAtTime(0.9, t0 + t.at + 0.02)
      g.gain.exponentialRampToValueAtTime(0.001, t0 + t.at + t.dur)
      osc.connect(g)
      g.connect(master)
      osc.start(t0 + t.at)
      osc.stop(t0 + t.at + t.dur + 0.05)
    }
    return true
  } catch {
    return false
  }
}

/** نغمة بدء الاختبار: صعود ثلاثي قصير. */
export function playCue(kind: 'start' | 'submit'): void {
  if (isMuted()) return
  try {
    if (kind === 'start') {
      playTones(
        [
          { freq: 523.25, at: 0, dur: 0.22 },
          { freq: 659.25, at: 0.12, dur: 0.22 },
          { freq: 783.99, at: 0.24, dur: 0.34 },
        ],
        0.16,
      )
    } else {
      playTones(
        [
          { freq: 392.0, at: 0, dur: 0.26 },
          { freq: 587.33, at: 0.13, dur: 0.3 },
          { freq: 493.88, at: 0.28, dur: 0.4 },
        ],
        0.16,
      )
    }
  } catch {
    // الصوت اختياري
  }
}

/** إيقاف أي صوت جارٍ (يُستعمل عند إعادة المحاولة). */
export function stopAudio(): void {
  try {
    current?.pause()
  } catch {
    /* لا شيء */
  }
  current = null
}
