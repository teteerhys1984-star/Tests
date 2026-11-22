/**
 * نغمات قصيرة مولّدة محلياً بـ Web Audio API (بلا أي ملف صوتي خارجي، فلا مورد شبكي).
 * كل الدوال صامتة عند غياب الدعم أو عند منع المتصفح للتشغيل التلقائي.
 */

type State = { ctx: AudioContext | null; allowed: boolean };

const state: State = { ctx: null, allowed: false };
let started = false;

export function resetSounds(): void {
  started = false;
}

function getContext(): AudioContext | null {
  if (state.ctx) return state.ctx;
  try {
    const Ctor =
      (globalThis as { AudioContext?: typeof AudioContext }).AudioContext ??
      (globalThis as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    state.ctx = new Ctor();
    return state.ctx;
  } catch {
    return null;
  }
}

/** يُستدعى داخل حدث نقر المستخدم لفتح الصوت (سياسات التشغيل التلقائي). */
export function primeAudio(): void {
  const ctx = getContext();
  if (!ctx) return;
  try {
    void ctx.resume();
    state.allowed = true;
  } catch {
    state.allowed = false;
  }
}

/** يمنع تشغيل أي نغمة أثناء التشغيل (إعداد «كتم الصوت»). */
export function setSoundEnabled(enabled: boolean): void {
  state.allowed = enabled;
}

function tone(frequency: number, start: number, duration: number, gain = 0.05): void {
  const ctx = getContext();
  if (!ctx || !state.allowed) return;
  try {
    const oscillator = ctx.createOscillator();
    const amp = ctx.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime + start);
    amp.gain.setValueAtTime(0.0001, ctx.currentTime + start);
    amp.gain.exponentialRampToValueAtTime(gain, ctx.currentTime + start + 0.02);
    amp.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + duration);
    oscillator.connect(amp);
    amp.connect(ctx.destination);
    oscillator.start(ctx.currentTime + start);
    oscillator.stop(ctx.currentTime + start + duration + 0.02);
  } catch {
    /* الصوت غير متاح — لا يمنع الاختبار */
  }
}

export function playStartSound(): void {
  if (started) return;
  started = true;
  tone(523.25, 0, 0.16);
  tone(659.25, 0.12, 0.18);
}

export function playSubmitSound(): void {
  tone(659.25, 0, 0.14);
  tone(783.99, 0.11, 0.16);
  tone(1046.5, 0.23, 0.24);
}
