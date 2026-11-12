/**
 * Result delivery settings (Google Apps Script web app that writes to Google Sheets).
 *
 * SHEETS_URL and SHEETS_TOKEN are the same Apps Script deployment and token used by the
 * reference exam (grade5-math-unit1). EXAM_ID must equal the name of the folder this exam
 * is published from; it is the `examId` sent with every result and the namespace of the
 * results kept locally for a later re-send.
 *
 * (The older EXAM_ID constant in src/exam/data.ts is this paper's internal id: it is printed
 * in the TXT report and used to validate the autosave. It is not used for delivery.)
 */
export const SHEETS_URL = "https://script.google.com/macros/s/AKfycbwqv4hE1AFy73L7MhyhFwXx0nl4QF5-Nme5jvP-ank-BY_LQr91xA8A_IiQqMuTdh8B/exec";
export const SHEETS_TOKEN = "7U25pymFzsSqmt8ejzPOTPTFJmSvj9Rm";
export const EXAM_ID = "grade6-mia-test-2";
