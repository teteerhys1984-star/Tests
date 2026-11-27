export type ExamSound = "start" | "submit";

const SOUND_FILES: Record<ExamSound, string> = {
  start: "sounds/start.wav",
  submit: "sounds/submit.wav",
};

/** Plays a locally bundled, original exam cue. Browsers require this to follow a user gesture. */
export function playExamSound(sound: ExamSound, muted: boolean): void {
  if (muted) return;
  try {
    const audio = new Audio(new URL(SOUND_FILES[sound], document.baseURI).href);
    audio.volume = 0.6;
    audio.preload = "auto";
    const promise = audio.play();
    if (promise) {
      promise.catch(() => {
        // The exam continues silently if the browser blocks audio.
      });
    }
  } catch {
    // Audio is a supportive detail, never a blocker.
  }
}
