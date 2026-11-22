/** أصوات محلية مولّدة بـ Web Audio (لا ملفات خارجية) */
let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    if (!ctx) ctx = new AC();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(c: AudioContext, freq: number, start: number, dur: number, gain = 0.16, type: OscillatorType = 'sine') {
  const o = c.createOscillator();
  const g = c.createGain();
  const t0 = c.currentTime + start;
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g);
  g.connect(c.destination);
  o.start(t0);
  o.stop(t0 + dur + 0.05);
}

/** صوت بدء الاختبار: نغمات صاعدة قصيرة */
export function playStartSound() {
  const c = getCtx();
  if (!c) return;
  [[523.25, 0], [659.25, 0.12], [783.99, 0.24], [1046.5, 0.36]].forEach(([f, s]) => tone(c, f, s, 0.26, 0.14));
}

/** صوت التسليم: نغمتان هادئتان ثم جرس قصير */
export function playSubmitSound() {
  const c = getCtx();
  if (!c) return;
  tone(c, 659.25, 0, 0.3, 0.14, 'triangle');
  tone(c, 523.25, 0.18, 0.45, 0.14, 'triangle');
  tone(c, 783.99, 0.4, 0.7, 0.1, 'sine');
}

/** نقرة خفيفة عند التنقل */
export function playClickSound() {
  const c = getCtx();
  if (!c) return;
  tone(c, 880, 0, 0.08, 0.05);
}
