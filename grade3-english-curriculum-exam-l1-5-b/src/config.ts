/**
 * Platform and Google Sheets delivery configuration.
 *
 * `SHEETS_URL` and `SHEETS_TOKEN` match the platform reference exam
 * (`grade5-math-unit1/src/config.ts`). `EXAM_ID` matches the published folder
 * name (`grade3-english-curriculum-exam-l1-5-b`).
 */
export const SHEETS_URL =
  "https://script.google.com/macros/s/AKfycbwqv4hE1AFy73L7MhyhFwXx0nl4QF5-Nme5jvP-ank-BY_LQr91xA8A_IiQqMuTdh8B/exec";

export const SHEETS_TOKEN = "7U25pymFzsSqmt8ejzPOTPTFJmSvj9Rm";

/** Unique exam identifier — matches the folder name in `_site/<EXAM_ID>/index.html`. */
export const EXAM_ID = "grade3-english-curriculum-exam-l1-5-b";

/** Pupil-facing and platform-card title for Version B. */
export const EXAM_TITLE = "Grade 3 English Curriculum Exam L1-5 B";
export const EXAM_GRADE = 3;
export const EXAM_SUBJECT = "english";
export const EXAM_SEMESTER = 1;
