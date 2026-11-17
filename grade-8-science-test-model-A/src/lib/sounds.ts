/* أصوات الاختبار — مولّدة برمجياً (Web Audio)، بلا ملفات خارجية. */

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!ctx) ctx = new Ctor();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

type Note = { f: number; t: number; d: number; type?: OscillatorType; gain?: number };

function play(notes: Note[]): void {
  const ac = getCtx();
  if (!ac) return;
  const now = ac.currentTime;
  for (const n of notes) {
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = n.type ?? "sine";
    osc.frequency.setValueAtTime(n.f, now + n.t);
    const peak = n.gain ?? 0.14;
    g.gain.setValueAtTime(0.0001, now + n.t);
    g.gain.exponentialRampToValueAtTime(peak, now + n.t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, now + n.t + n.d);
    osc.connect(g).connect(ac.destination);
    osc.start(now + n.t);
    osc.stop(now + n.t + n.d + 0.05);
  }
}

/** إشارة بدء الاختبار: صعود قصير من ثلاث نغمات. */
export function playStart(): void {
  play([
    { f: 392, t: 0, d: 0.16, type: "triangle", gain: 0.12 },
    { f: 587.33, t: 0.13, d: 0.16, type: "triangle", gain: 0.12 },
    { f: 880, t: 0.26, d: 0.32, type: "triangle", gain: 0.14 },
  ]);
}

/** إشارة تسليم الاختبار: نغمتان هابطتان خاتمتان. */
export function playSubmit(): void {
  play([
    { f: 659.25, t: 0, d: 0.18, type: "sine", gain: 0.14 },
    { f: 523.25, t: 0.15, d: 0.18, type: "sine", gain: 0.14 },
    { f: 392, t: 0.3, d: 0.42, type: "sine", gain: 0.16 },
    { f: 784, t: 0.3, d: 0.42, type: "sine", gain: 0.05 },
  ]);
}

/** نقرة خفيفة عند الانتقال بين الأسئلة. */
export function playTick(): void {
  play([{ f: 1180, t: 0, d: 0.05, type: "square", gain: 0.04 }]);
}
