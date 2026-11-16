/* ------------------------------------------------------------------ */
/*  Sound effects — local WAV files only. Mute state persisted.        */
/* ------------------------------------------------------------------ */

let muted = false;
try {
  muted = localStorage.getItem("gok_muted") === "1";
} catch {
  muted = false;
}

export function isMuted(): boolean {
  return muted;
}

export function setMuted(next: boolean): void {
  muted = next;
  try {
    localStorage.setItem("gok_muted", next ? "1" : "0");
  } catch {
    /* noop */
  }
}

function play(src: string): void {
  if (muted) return;
  try {
    const audio = new Audio(src);
    audio.volume = 0.7;
    void audio.play().catch(() => {
      /* browser may block autoplay before user interaction */
    });
  } catch {
    /* noop */
  }
}

export const playStartSound = (): void => play("sounds/exam-start.wav");
export const playSubmitSound = (): void => play("sounds/exam-submit.wav");
