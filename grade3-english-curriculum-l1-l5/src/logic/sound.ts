/* ------------------------------------------------------------------ */
/*  Sound effects — locally bundled WAV files. Mute state persisted.   */
/* ------------------------------------------------------------------ */

import examStartUrl from "../assets/sounds/exam-start.wav";
import examSubmitUrl from "../assets/sounds/exam-submit.wav";

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

export const playStartSound = (): void => play(examStartUrl);
export const playSubmitSound = (): void => play(examSubmitUrl);
