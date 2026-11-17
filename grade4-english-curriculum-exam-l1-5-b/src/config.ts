/**
 * Platform and Google Sheets delivery configuration — Version B.
 *
 * `SHEETS_URL` and `SHEETS_TOKEN` are copied unchanged from the platform
 * reference exam (`grade5-math-unit1/src/config.ts`); no Apps Script, token or
 * global platform setting was edited.
 *
 * `EXAM_ID`, storage keys, pending keys and attempt ids are unique to
 * Version B and are never shared with any other exam on the platform, so the
 * two Grade 4 versions can sit side by side in the same browser.
 */

/** Apps Script web app endpoint — the same platform endpoint as the reference exam. */
export const SHEETS_URL =
  'https://script.google.com/macros/s/AKfycbwqv4hE1AFy73L7MhyhFwXx0nl4QF5-Nme5jvP-ank-BY_LQr91xA8A_IiQqMuTdh8B/exec';

/** Platform delivery token — same token as the reference exam. */
export const SHEETS_TOKEN = '7U25pymFzsSqmt8ejzPOTPTFJmSvj9Rm';

/** Unique exam identifier — matches the published folder `_site/<EXAM_ID>/`. */
export const EXAM_ID = 'grade4-english-curriculum-exam-l1-5-b';

/** Pupil-facing and platform-card title for Version B. */
export const EXAM_TITLE = 'Grade 4 English Curriculum Exam L1-5 B';

export const EXAM_GRADE = 4;
export const EXAM_SUBJECT = 'english';
export const EXAM_SEMESTER = 1;

/**
 * Version-B-only localStorage keys (independent from Version A).
 * The mute preference is part of the persisted attempt (`muted`), exactly as in
 * the source folder, so it needs no separate key.
 */
export const ATTEMPT_STORAGE_KEY = `${EXAM_ID}-attempt-v1`;
export const PENDING_PREFIX = `pending:${EXAM_ID}:`;
export const SENT_RECEIPT_PREFIX = `sent:${EXAM_ID}:`;
