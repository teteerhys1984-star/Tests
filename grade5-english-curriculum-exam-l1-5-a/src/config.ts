/**
 * Delivery and publishing settings for this exam.
 *
 * `SHEETS_URL` and `SHEETS_TOKEN` are copied verbatim from the platform's
 * reference exam `grade5-math-unit1/src/config.ts`. Google Apps Script, its
 * deployment and its credentials are NOT modified here.
 *
 * `EXAM_ID` matches the published folder name exactly
 * (`grade5-english-curriculum-exam-l1-5-a`) and namespaces the local storage
 * of this exam (`pending:<EXAM_ID>:<attemptId>`, `sent:<EXAM_ID>:<attemptId>`).
 */
export const SHEETS_URL =
  "https://script.google.com/macros/s/AKfycbwqv4hE1AFy73L7MhyhFwXx0nl4QF5-Nme5jvP-ank-BY_LQr91xA8A_IiQqMuTdh8B/exec";

export const SHEETS_TOKEN = "7U25pymFzsSqmt8ejzPOTPTFJmSvj9Rm";

export const EXAM_ID = "grade5-english-curriculum-exam-l1-5-a";

/** Title shown to pupils — identical to the platform index card title. */
export const EXAM_TITLE = "Grade 5 English Curriculum Exam L1-5 A";

/** Grade / subject / semester of this exam, as published in the index. */
export const EXAM_GRADE = 5;
export const EXAM_SUBJECT = "english";
export const EXAM_SEMESTER = 1;

/** Textbook unit and model covered by this paper (not part of the delivery contract). */
export const EXAM_UNIT = "Unit 1";
export const EXAM_MODEL = "Model A";
