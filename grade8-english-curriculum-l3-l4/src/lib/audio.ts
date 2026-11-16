import startUrl from "@/assets/audio/start.wav";
import submitUrl from "@/assets/audio/submit.wav";

/**
 * Original, locally bundled exam sounds.
 * Start chime when the exam begins; completion fanfare on submission.
 * Both respect the visible mute/unmute control.
 */

let startAudio: HTMLAudioElement | null = null;
let submitAudio: HTMLAudioElement | null = null;

function getStart(): HTMLAudioElement {
  if (!startAudio) {
    startAudio = new Audio(startUrl);
    startAudio.preload = "auto";
  }
  return startAudio;
}

function getSubmit(): HTMLAudioElement {
  if (!submitAudio) {
    submitAudio = new Audio(submitUrl);
    submitAudio.preload = "auto";
  }
  return submitAudio;
}

/** Safe play wrapper — never throws, even where media APIs are stubbed. */
function safePlay(a: HTMLAudioElement): Promise<void> | null {
  try {
    const p = a.play();
    return p && typeof p.catch === "function" ? p : Promise.resolve();
  } catch {
    return null;
  }
}

export function playStartSound(muted: boolean): void {
  if (muted) return;
  const a = getStart();
  try {
    a.currentTime = 0;
  } catch {
    /* ignore */
  }
  void safePlay(a);
}

export function playSubmitSound(muted: boolean): void {
  if (muted) return;
  const a = getSubmit();
  try {
    a.currentTime = 0;
  } catch {
    /* ignore */
  }
  void safePlay(a);
}

/** Unlock audio pipelines on the first user gesture (mobile browsers). */
export function warmUpAudio(): void {
  for (const a of [getStart(), getSubmit()]) {
    try {
      a.volume = 0.0001;
      const done = () => {
        try {
          a.pause();
          a.currentTime = 0;
        } catch {
          /* ignore */
        }
        a.volume = 1;
      };
      const p = safePlay(a);
      if (p) void p.then(done).catch(() => (a.volume = 1));
      else a.volume = 1;
    } catch {
      /* ignore */
    }
  }
}
