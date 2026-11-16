/* ------------------------------------------------------------------ */
/*  Sound effects — locally bundled WAV files (no external URLs)       */
/* ------------------------------------------------------------------ */

import startUrl from "../assets/sounds/mission-start.wav";
import submitUrl from "../assets/sounds/mission-submit.wav";
import { loadMuted } from "./storage";

let startAudio: HTMLAudioElement | null = null;
let submitAudio: HTMLAudioElement | null = null;

function get(which: "start" | "submit"): HTMLAudioElement {
  if (which === "start") {
    if (!startAudio) {
      startAudio = new Audio(startUrl);
      startAudio.preload = "auto";
      startAudio.volume = 0.7;
    }
    return startAudio;
  }
  if (!submitAudio) {
    submitAudio = new Audio(submitUrl);
    submitAudio.preload = "auto";
    submitAudio.volume = 0.7;
  }
  return submitAudio;
}

export function playStartSound(muted?: boolean): void {
  const m = muted ?? loadMuted();
  if (m) return;
  try {
    const a = get("start");
    a.currentTime = 0;
    void a.play().catch(() => undefined);
  } catch {
    /* audio unsupported */
  }
}

export function playSubmitSound(muted?: boolean): void {
  const m = muted ?? loadMuted();
  if (m) return;
  try {
    const a = get("submit");
    a.currentTime = 0;
    void a.play().catch(() => undefined);
  } catch {
    /* audio unsupported */
  }
}
