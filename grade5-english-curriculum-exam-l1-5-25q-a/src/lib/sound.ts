/**
 * Original embedded start / submission sounds — synthesised with the Web Audio
 * API, so nothing is fetched at runtime.
 */

let ctx: AudioContext | null = null;
let muted = false;

export function setMuted(v: boolean): void {
  muted = v;
}

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!ctx) ctx = new Ctor();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

type Note = { f: number; t: number; d: number; gain?: number; type?: OscillatorType };

function play(notes: Note[]): void {
  if (muted) return;
  try {
    const ac = getCtx();
    if (!ac) return;
    const now = ac.currentTime;
    for (const n of notes) {
      const osc = ac.createOscillator();
      const g = ac.createGain();
      osc.type = n.type ?? "sine";
      osc.frequency.setValueAtTime(n.f, now + n.t);
      const peak = n.gain ?? 0.16;
      g.gain.setValueAtTime(0.0001, now + n.t);
      g.gain.exponentialRampToValueAtTime(peak, now + n.t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, now + n.t + n.d);
      osc.connect(g).connect(ac.destination);
      osc.start(now + n.t);
      osc.stop(now + n.t + n.d + 0.05);
    }
  } catch {
    /* ignore audio errors so the exam flow can never block */
  }
}

/** Bright, gentle rise — the exam opens. */
export function playStart(): void {
  play([
    { f: 523.25, t: 0, d: 0.32, type: "triangle" },
    { f: 659.25, t: 0.11, d: 0.32, type: "triangle" },
    { f: 783.99, t: 0.22, d: 0.5, type: "triangle", gain: 0.18 },
    { f: 1046.5, t: 0.34, d: 0.6, type: "sine", gain: 0.1 },
  ]);
}

/** Warm two-note bell — the paper is handed in. */
export function playSubmit(): void {
  play([
    { f: 659.25, t: 0, d: 0.4, type: "triangle" },
    { f: 987.77, t: 0.13, d: 0.7, type: "sine", gain: 0.16 },
    { f: 1318.5, t: 0.2, d: 0.8, type: "sine", gain: 0.08 },
  ]);
}
