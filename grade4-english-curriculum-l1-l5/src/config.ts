/**
 * Delivery settings for this exam.
 *
 * SHEETS_URL and SHEETS_TOKEN are copied verbatim from the platform's reference exam
 * `grade5-math-unit1/src/config.ts`. The Google Apps Script deployment, its settings
 * and its credentials are NOT modified here — this exam is only a new client of the
 * very same contract.
 *
 * EXAM_ID must equal the folder this exam is published from. It is the `examId` sent
 * with every result and the namespace of the payloads kept locally for a later re-send
 * (`pending:<EXAM_ID>:<attemptId>`), so no other exam can read or flush them.
 */
export const SHEETS_URL =
  "https://script.google.com/macros/s/AKfycbwqv4hE1AFy73L7MhyhFwXx0nl4QF5-Nme5jvP-ank-BY_LQr91xA8A_IiQqMuTdh8B/exec";
export const SHEETS_TOKEN = "7U25pymFzsSqmt8ejzPOTPTFJmSvj9Rm";
export const EXAM_ID = "grade4-english-curriculum-l1-l5";

/** Official platform/index title (landing/exams.json) and `examTitle` in the payload. */
export const EXAM_TITLE = "Curriculum Test Lessons 1 to 5";
