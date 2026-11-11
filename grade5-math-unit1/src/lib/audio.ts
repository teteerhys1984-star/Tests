/**
 * مؤثران صوتيان مولّدان محلياً عبر Web Audio API (لا ملفات خارجية، لا إنترنت).
 *  1) نغمة بدء الاختبار — تُعزف مرة واحدة فقط بعد ظهور أول سؤال.
 *  2) نغمة التسليم النهائي — تُعزف مرة واحدة فقط عند التسليم الفعلي.
 * إن تعذّر الصوت يستمر الاختبار بشكل طبيعي.
 */

let ctx: AudioContext | null = null
let startPlayed = false
let submitPlayed = false

function getCtx(): AudioContext | null {
  try {
    const AC: typeof AudioContext | undefined =
      window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AC) return null
    if (!ctx) ctx = new AC()
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx
  } catch {
    return null
  }
}

type Tone = {
  freq: number
  at: number
  dur: number
  gain: number
  type?: OscillatorType
}

function playTones(tones: Tone[], masterGain = 0.22): boolean {
  const ac = getCtx()
  if (!ac) return false
  try {
    const t0 = ac.currentTime + 0.02
    const master = ac.createGain()
    master.gain.value = masterGain
    const lp = ac.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = 5200
    master.connect(lp)
    lp.connect(ac.destination)

    for (const tone of tones) {
      const osc = ac.createOscillator()
      const g = ac.createGain()
      osc.type = tone.type ?? 'sine'
      osc.frequency.setValueAtTime(tone.freq, t0 + tone.at)

      const peak = tone.gain
      g.gain.setValueAtTime(0.0001, t0 + tone.at)
      g.gain.exponentialRampToValueAtTime(peak, t0 + tone.at + 0.018)
      g.gain.exponentialRampToValueAtTime(0.0008, t0 + tone.at + tone.dur)

      // طبقة توافقية خفيفة لإعطاء طابع أجراسي ناعم
      const harm = ac.createOscillator()
      const hg = ac.createGain()
      harm.type = 'sine'
      harm.frequency.setValueAtTime(tone.freq * 2, t0 + tone.at)
      hg.gain.setValueAtTime(0.0001, t0 + tone.at)
      hg.gain.exponentialRampToValueAtTime(peak * 0.22, t0 + tone.at + 0.015)
      hg.gain.exponentialRampToValueAtTime(0.0006, t0 + tone.at + tone.dur * 0.7)

      osc.connect(g); g.connect(master)
      harm.connect(hg); hg.connect(master)
      osc.start(t0 + tone.at); osc.stop(t0 + tone.at + tone.dur + 0.06)
      harm.start(t0 + tone.at); harm.stop(t0 + tone.at + tone.dur + 0.06)
    }
    return true
  } catch {
    return false
  }
}

/** نغمة البداية: صعود ثلاثي مشرق (C5 – E5 – G5) مع لمسة رنين. */
export function playStartSound(): boolean {
  if (startPlayed) return false
  const ok = playTones(
    [
      { freq: 523.25, at: 0.0, dur: 0.42, gain: 0.5, type: 'triangle' },
      { freq: 659.25, at: 0.13, dur: 0.42, gain: 0.48, type: 'triangle' },
      { freq: 783.99, at: 0.26, dur: 0.75, gain: 0.52, type: 'sine' },
      { freq: 1046.5, at: 0.4, dur: 0.6, gain: 0.18, type: 'sine' },
    ],
    0.2,
  )
  startPlayed = true
  return ok
}

/** نغمة التسليم: جرس دافئ هابط–صاعد (G4 – D5 – B4) يختلف عن نغمة البداية. */
export function playSubmitSound(): boolean {
  if (submitPlayed) return false
  const ok = playTones(
    [
      { freq: 392.0, at: 0.0, dur: 0.5, gain: 0.46, type: 'sine' },
      { freq: 587.33, at: 0.12, dur: 0.55, gain: 0.46, type: 'sine' },
      { freq: 493.88, at: 0.26, dur: 0.95, gain: 0.42, type: 'triangle' },
      { freq: 987.77, at: 0.28, dur: 0.5, gain: 0.12, type: 'sine' },
    ],
    0.24,
  )
  submitPlayed = true
  return ok
}

/** إعادة ضبط المؤثرين لمحاولة جديدة. */
export function resetSounds() {
  startPlayed = false
  submitPlayed = false
}

/** فتح سياق الصوت مبكراً (اختياري) لتجاوز قيود التشغيل التلقائي. */
export function primeAudio() {
  getCtx()
}
